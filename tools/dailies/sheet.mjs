#!/usr/bin/env node
// A contact sheet of a film: a grid of frames with their times, as one PNG (films/<name>/sheet-<from>-<to>.png).
//   node tools/dailies/sheet.mjs <name> [--from 0] [--to 99] [--step 0.333] [--cols 6] [--w 320] [--ratio h/w]
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const here = path.dirname(fileURLToPath(import.meta.url));
const [name, ...rest] = process.argv.slice(2);
const o = { from: 0, to: 1e9, step: 1 / 3, cols: 6, w: 320, ratio: 0 };
for (let i = 0; i < rest.length; i += 2) o[rest[i].replace(/^--/, "")] = Number(rest[i + 1]);
const dir = path.join(here, "films", name);
const meta = JSON.parse(readFileSync(path.join(dir, "index.html"), "utf8").match(/var META = (\{.*?\});\n/s)[1]);
const picks = []; let next = o.from;
for (const f of meta.frames) if (f.t >= next - 1e-6 && f.t <= o.to) { picks.push(f); next = f.t + o.step; }
const beatAt = (t) => { let b = ""; (meta.beats || []).forEach((x) => { if (t >= x.at) b = x.name; }); return b; };
const ratio = o.ratio || (meta.opts.phone ? 844 / 390 : (([w, h]) => h / w)(String(meta.opts.size).split("x").map(Number))), h = Math.round(o.w * ratio);
const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;background:#222;font:12px Menlo,monospace;color:#fff;display:grid;grid-template-columns:repeat(${o.cols},${o.w}px);gap:2px}
figure{margin:0;position:relative}img{width:${o.w}px;height:${h}px;object-fit:cover;display:block}figcaption{position:absolute;left:3px;top:3px;background:#000a;padding:1px 4px}</style>
${picks.map((f) => `<figure><img src="${f.file}"><figcaption>${f.t.toFixed(2)} ${beatAt(f.t)}</figcaption></figure>`).join("")}`;
const tmp = path.join(dir, "_sheet.html"); writeFileSync(tmp, html);
const rows = Math.ceil(picks.length / o.cols), out = path.join(dir, `sheet-${o.from}-${Math.min(o.to, picks.at(-1)?.t ?? 0).toFixed(1)}.png`);
const prof = path.join(os.tmpdir(), "sheet-" + process.pid);
execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--user-data-dir=" + prof, "--hide-scrollbars", `--window-size=${o.cols * (o.w + 2)},${rows * (h + 2)}`, "--screenshot=" + out, "file://" + tmp], { stdio: "ignore" });
rmSync(tmp); rmSync(prof, { recursive: true, force: true });
console.log(out, picks.length + " frames");
