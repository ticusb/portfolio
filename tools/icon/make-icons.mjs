#!/usr/bin/env node
// Renders the favicon set from helmet.html (headless Chrome, transparent background) into public/icon/.
//   node tools/icon/make-icons.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, "../../public/icon");
const shot = (size, file, bg) => {
  const prof = path.join(os.tmpdir(), "icon-" + size + "-" + process.pid);
  execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--user-data-dir=" + prof, "--allow-file-access-from-files", "--hide-scrollbars",
    "--default-background-color=00000000", "--force-device-scale-factor=1", `--window-size=${size},${size}`, "--virtual-time-budget=3000", "--screenshot=" + file,
    "file://" + path.join(here, "helmet.html") + `?s=${size}${bg ? "&bg=1" : ""}`], { stdio: "ignore" });
  rmSync(prof, { recursive: true, force: true });
};
shot(512, path.join(out, "android-chrome-512x512.png"));
shot(192, path.join(out, "android-chrome-192x192.png"));
shot(180, path.join(out, "apple-touch-icon.png"), true); // iOS fills transparency with black, so this one gets paper
shot(32, path.join(out, "favicon-32x32.png"));
shot(16, path.join(out, "favicon-16x16.png"));
// favicon.ico: an icon directory pointing at the two PNGs (PNG-in-ICO works everywhere that matters)
const pngs = [16, 32].map((s) => readFileSync(path.join(out, `favicon-${s}x${s}.png`)));
const head = Buffer.alloc(6 + 16 * pngs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let off = head.length;
pngs.forEach((p, i) => { const s = [16, 32][i], e = 6 + i * 16; head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(p.length, e + 8); head.writeUInt32LE(off, e + 12); off += p.length; });
writeFileSync(path.join(out, "favicon.ico"), Buffer.concat([head, ...pngs]));
console.log("icons written to", out);
