#!/usr/bin/env node
// Measures the crayon world's real frame rate on this Mac's GPU (headless Chrome renders through Metal),
// plus draw calls and triangles per frame. --throttle N slows the CPU N times, like a cheaper phone.
//   node tools/dailies/perf.mjs [--url http://localhost:8772/] [--world ski] [--phone] [--size 1920x1080]
//     [--throttle 4] [--intro] [--secs 5]
// Default: skips to home and measures there. --intro clicks the crayon and measures the run instead.
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2), opt = { url: "http://localhost:8772/", world: "ski", size: "1920x1080", throttle: 1, secs: 5 };
for (let i = 0; i < args.length; i++) { const k = args[i].replace(/^--/, ""); if (k === "phone" || k === "intro") opt[k] = true; else opt[k] = args[++i]; }
const [W, H] = opt.size.split("x").map(Number);
const port = 9800 + Math.floor(Math.random() * 150), prof = path.join(os.tmpdir(), "perf-" + port);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=" + port, "--user-data-dir=" + prof, "--disable-gpu-vsync", "--disable-frame-rate-limit", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break; } catch { /* starting */ } await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(), waiters = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else waiters.filter((w) => w.method === m.method).forEach((w) => { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }); });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", opt.phone ? { width: 390, height: 844, deviceScaleFactor: 3, mobile: true } : { width: W, height: H, deviceScaleFactor: 2, mobile: false });
if (opt.phone) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.clear();localStorage.setItem('world',${JSON.stringify(opt.world)});localStorage.setItem('crayonSeen','1');}catch(e){}` });
const loaded = new Promise((res) => waiters.push({ method: "Page.loadEventFired", res }));
await send("Page.navigate", { url: opt.url + (opt.url.includes("?") ? "&" : "?") + "dailies" });
await loaded; await sleep(2000);
if (Number(opt.throttle) > 1) await send("Emulation.setCPUThrottlingRate", { rate: Number(opt.throttle) });
await ev(opt.intro ? "document.getElementById('start').click()" : "document.getElementById('skip').click()");
await sleep(opt.intro ? 300 : 2500);
const r = await ev(`new Promise((res) => { const ts = []; const end = performance.now() + ${Number(opt.secs) * 1000};
  (function f(t) { ts.push(t); if (t < end) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b);
    res({ fps: +(1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1), p50: +d[Math.floor(d.length * 0.5)].toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1), worst: +d[d.length - 1].toFixed(1), gl: window.__gl && window.__gl() }); } })(performance.now()); })`);
console.log(`${opt.world} ${opt.phone ? "phone 390x844@3x" : opt.size + "@2x"} cpu/${opt.throttle} ${opt.intro ? "intro" : "home"}: ${r.fps} fps, p50 ${r.p50}ms, p95 ${r.p95}ms, worst ${r.worst}ms | ${JSON.stringify(r.gl)}`);
ws.close(); chrome.kill(); await sleep(300); rmSync(prof, { recursive: true, force: true });
