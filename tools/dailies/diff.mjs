#!/usr/bin/env node
// Compares two films frame by frame (PNG films, made with --png): how many pixels differ by more than a
// threshold, and where. Used to prove a refactor changed nothing on screen.
//   node tools/dailies/diff.mjs films/a films/b [--tol 24]
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import path from "node:path";

function decode(file) {
  const b = readFileSync(file); let o = 8, w, h, ct, idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString("ascii", o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8) throw new Error("8-bit only"); }
    else if (type === "IDAT") idat.push(d); else if (type === "IEND") break;
    o += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : (() => { throw new Error("rgb/rgba only"); })();
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; cur = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, up = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = cur[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) { px[(y * w + x) * 4] = cur[x * bpp]; px[(y * w + x) * 4 + 1] = cur[x * bpp + 1]; px[(y * w + x) * 4 + 2] = cur[x * bpp + 2]; }
    prev = cur;
  }
  return { w, h, px };
}
const [A, B] = process.argv.slice(2, 4);
const ti = process.argv.indexOf("--tol"), tol = ti > 0 ? Number(process.argv[ti + 1]) : 24;
let worst = 0, bad = 0;
const files = readdirSync(A).filter((f) => f.endsWith(".png")).sort();
for (const f of files) {
  const a = decode(path.join(A, f)), b = decode(path.join(B, f));
  let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0; i < a.px.length; i += 4) {
    const d = Math.max(Math.abs(a.px[i] - b.px[i]), Math.abs(a.px[i + 1] - b.px[i + 1]), Math.abs(a.px[i + 2] - b.px[i + 2]));
    if (d > tol) { n++; const p = i / 4, x = p % a.w, y = (p / a.w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  const pct = n / (a.w * a.h) * 100; worst = Math.max(worst, pct);
  if (n) { bad++; console.log(`${f}: ${n} px (${pct.toFixed(3)}%) in [${x0},${y0}]-[${x1},${y1}]`); }
}
console.log(`${bad} of ${files.length} frames differ (tolerance ${tol}); worst ${worst.toFixed(3)}% of pixels`);
