#!/usr/bin/env node
// Films the crayon world frame by frame on the real GPU (headless Chrome uses Metal on this Mac), on a fake
// clock, so motion and timing can be judged at true speed in films/<name>/index.html.
//
//   node tools/dailies/film.mjs --name ski-intro --world ski --dur 17 \
//     --act "0.3:click #start" [--url http://localhost:3000/] [--size 1280x800] [--phone] [--from 4] [--every 1] [--png]
//
// Actions are "<seconds>:<kind> <arg>": click <selector> | key <Key> | mouse <x> <y> | tap <x> <y> | js <code>
// | down <x> <y> | move <x> <y> | up <x> <y> (a held-button drag) | touchdown / touchmove / touchup <x> <y>.
// Seconds count from when the clock starts (about 2.5s after the page loads).
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = { url: "http://localhost:3000/", world: "ski", dur: 10, size: "1280x800", from: 0, every: 1, act: [], name: "film", seen: false };
for (let i = 0; i < args.length; i++) {
  const k = args[i].replace(/^--/, "");
  if (k === "phone" || k === "seen" || k === "png") { opt[k] = true; continue; }
  const v = args[++i];
  if (k === "act") opt.act.push(v); else opt[k] = v;
}
const [W, H] = opt.size.split("x").map(Number);
const FPS = 30, dur = Number(opt.dur), from = Number(opt.from), every = Number(opt.every);
const acts = opt.act.map((a) => { const m = a.match(/^([\d.]+):(\w+)\s*(.*)$/); if (!m) throw new Error("bad --act " + a); return { at: Number(m[1]), kind: m[2], arg: m[3] }; }).sort((a, b) => a.at - b.at);
const out = path.join(here, "films", opt.name);
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });

const port = 9300 + Math.floor(Math.random() * 500);
const prof = path.join(os.tmpdir(), "dailies-" + port);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=" + port, "--user-data-dir=" + prof, "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break; } catch { /* starting */ } await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(), waiters = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return; }
  if (m.method === "Runtime.exceptionThrown") console.log("[page exception]", m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) console.log("[console." + m.params.type + "]", m.params.args.map((a) => a.value ?? a.description).join(" "));
  waiters.filter((w) => w.method === m.method).forEach((w) => { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); });
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const once = (method) => new Promise((res) => waiters.push({ method, res }));
const evaluate = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };

await send("Page.enable"); await send("Runtime.enable");
const renderer = await evaluate("(()=>{const g=document.createElement('canvas').getContext('webgl');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return g?g.getParameter(e?e.UNMASKED_RENDERER_WEBGL:g.RENDERER):'none'})()");
console.log("GPU:", renderer);
await send("Emulation.setDeviceMetricsOverride", opt.phone ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } : { width: W, height: H, deviceScaleFactor: 1, mobile: false });
if (opt.phone) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
const pre = `try{localStorage.clear();localStorage.setItem('world',${JSON.stringify(opt.world)});${opt.seen ? "localStorage.setItem('crayonSeen','1');" : ""}}catch(e){}\n`;
await send("Page.addScriptToEvaluateOnNewDocument", { source: pre + readFileSync(path.join(here, "clock.js"), "utf8") });
const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url: opt.url });
await loaded; await sleep(2500);
await evaluate("__start()");

async function act(a) {
  if (a.kind === "click") await evaluate(`document.querySelector(${JSON.stringify(a.arg)}).click()`);
  else if (a.kind === "key") await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(a.arg)}}))`);
  else if (a.kind === "js") await evaluate(a.arg);
  else if (a.kind === "down" || a.kind === "move" || a.kind === "up") {
    const [x, y] = a.arg.split(/\s+/).map(Number);
    const type = { down: "mousePressed", move: "mouseMoved", up: "mouseReleased" }[a.kind];
    await send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: a.kind === "up" ? 0 : 1, clickCount: 1 });
  } else if (a.kind === "touchdown" || a.kind === "touchmove" || a.kind === "touchup") {
    const [x, y] = a.arg.split(/\s+/).map(Number);
    const type = { touchdown: "touchStart", touchmove: "touchMove", touchup: "touchEnd" }[a.kind];
    await send("Input.dispatchTouchEvent", { type, touchPoints: a.kind === "touchup" ? [] : [{ x, y }] });
  } else if (a.kind === "mouse" || a.kind === "tap") {
    const [x, y] = a.arg.split(/\s+/).map(Number);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    if (a.kind === "tap") { await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); }
  } else throw new Error("unknown action " + a.kind);
}
const total = Math.round(dur * FPS), frames = [];
const t0 = Date.now();
for (let f = 0; f <= total; f++) {
  const T = f / FPS;
  while (acts.length && acts[0].at <= T) await act(acts.shift());
  await evaluate("__tick()");
  if (T >= from && f % every === 0) {
    const shot = await send("Page.captureScreenshot", opt.png ? { format: "png" } : { format: "jpeg", quality: 82 });
    const file = `f${String(frames.length).padStart(4, "0")}.${opt.png ? "png" : "jpg"}`;
    writeFileSync(path.join(out, file), Buffer.from(shot.data, "base64"));
    frames.push({ file, t: Number(T.toFixed(3)) });
  }
}
const beats = await evaluate("window.__beats ? window.__beats() : []").catch(() => []);
const meta = { name: opt.name, fps: FPS / every, frames, beats, gpu: renderer, opts: opt, made: new Date().toISOString() };
writeFileSync(path.join(out, "index.html"), readFileSync(path.join(here, "player.html"), "utf8").replace("/*META*/null", JSON.stringify(meta)));
console.log(`${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${path.join(out, "index.html")}`);
ws.close(); chrome.kill(); await sleep(300); rmSync(prof, { recursive: true, force: true });
