/*
 * The crayon world: ticusb.com's home page.
 *
 * A self-contained three.js scene drawn to look like crayon: a click-to-start gate, a short intro
 * (a ski run, or a UFO abduction in space), then a home scene whose nav lives in the world.
 * React mounts it into a container that already holds the static markup (markup.js) and calls the
 * returned function on unmount. Everything it adds (listeners, timers, the GPU context) is torn down there.
 *
 * It's written as one closure on purpose: the scene, its shaders and the intro timeline share a lot of
 * state, and splitting them would mean threading that state through a dozen modules.
 */
/* eslint-disable no-redeclare, no-loop-func */
import * as THREE from "three";

const FACE_URL = (process.env.PUBLIC_URL || "") + "/crayon/face.png";

export function mountCrayonWorld(root) {
  var cleanups = [];
  var alive = true, rafId = 0, wobbleTimer = 0;
  function byId(id) { return root.querySelector("#" + id); }
  function listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    cleanups.push(function () { target.removeEventListener(type, fn, opts); });
  }
  function later(fn, ms) {
    var id = setTimeout(function () { if (alive) fn(); }, ms);
    cleanups.push(function () { clearTimeout(id); });
  }
  document.documentElement.classList.add("crayon-lock");
  // start from a clean slate every mount (React StrictMode mounts twice in dev)
  byId("gate").hidden = false;
  byId("replay").hidden = true;
  byId("tunes").hidden = true;
  byId("worldnav").classList.remove("show", "static");
  byId("worldnav").setAttribute("inert", "");
  root.classList.remove("home", "night");
  root.querySelectorAll(".scrawl.on").forEach(function (el) { el.classList.remove("on"); });
  root.querySelectorAll(".fallback").forEach(function (el) { el.remove(); });

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function jitter(r) { return (Math.random() - 0.5) * 2 * r; }

  /* boiling SVG lines */
  var wobble = byId("wobble");
  if (!reduce && wobble) {
    var seeds = [2, 6, 11], si = 0;
    wobbleTimer = setInterval(function () { si = (si + 1) % seeds.length; wobble.setAttribute("seed", String(seeds[si])); }, 240);
  }

  /* scroll progress + scrawls */
  var progress = 0;
  var hint = byId("hint");
  var scrawls = [
    { el: byId("s-hello"), from: -1, to: 0.22 },
    { el: byId("s-day"), from: 0.3, to: 0.62 },
    { el: byId("s-night"), from: 0.46, to: 0.8 },
    { el: byId("s-end"), from: 2, to: 3 }
  ];
  var ready = false;
  function onScroll() {
    if (!ready) return;
    scrawls.forEach(function (s) { s.el.classList.toggle("on", progress >= s.from && progress < s.to); });
  }
  listen(window, "scroll", onScroll, { passive: true });
  function replayScrawls() {
    ready = false;
    scrawls.forEach(function (s) { s.el.classList.remove("on"); });
    later(function () { ready = true; onScroll(); }, reduce ? 0 : 600);
  }
  replayScrawls();

  /* visitor doodles: wax crayon that slowly fades */
  var dc = byId("doodle");
  var dx = dc.getContext("2d");
  var lastPt = null, drawing = false, inkIdx = 0;
  var inks = ["#e8412c", "#2f7de1", "#3aa655", "#ffbf1f", "#f27bb0", "#7a4fc9"];
  function waxDab(x, y, color) {
    dx.fillStyle = color;
    for (var i = 0; i < 16; i++) {
      var a = Math.random() * Math.PI * 2, rr = Math.random() * 5.5;
      dx.globalAlpha = 0.25 + Math.random() * 0.45;
      dx.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.6, 1.6);
    }
    dx.globalAlpha = 1;
  }
  var canDraw = function () { return false; };
  listen(dc, "pointerdown", function (e) {
    if (e.pointerType !== "mouse" || !canDraw()) return;
    drawing = true; inkIdx = (inkIdx + 1) % inks.length; lastPt = { x: e.clientX, y: e.clientY }; waxDab(e.clientX, e.clientY, inks[inkIdx]);
  });
  listen(window, "pointerup", function () { drawing = false; });
  listen(dc, "pointermove", function (e) {
    if (!drawing || e.pointerType !== "mouse") return;
    var ddx = e.clientX - lastPt.x, ddy = e.clientY - lastPt.y, steps = Math.max(1, Math.ceil(Math.hypot(ddx, ddy) / 1.5));
    for (var i = 1; i <= steps; i++) waxDab(lastPt.x + ddx * i / steps, lastPt.y + ddy * i / steps, inks[inkIdx]);
    lastPt = { x: e.clientX, y: e.clientY };
  });
  var pointerTarget = { x: 0, y: 0 }, pointer = { x: 0, y: 0 };
  function sizeDoodle() {
    var r = Math.min(window.devicePixelRatio || 1, 2);
    dc.width = Math.round(window.innerWidth * r); dc.height = Math.round(window.innerHeight * r);
    dx.setTransform(r, 0, 0, r, 0, 0);
  }
  sizeDoodle();
  listen(window, "resize", sizeDoodle);
  // drag to look around; turn too far from the scene and the simulation breaks
  // the camera looks where the mouse is; on touch, a sideways swipe turns your head
  var look = { yaw: 0, pitch: 0, tx: 0, ty: 0 };
  listen(window, "pointermove", function (e) {
    if (e.pointerType === "mouse") {
      look.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      look.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (Math.abs(look.tx) > 0.2) hint.style.opacity = "0";
    } else if (lastPt) {
      look.tx = Math.max(-1, Math.min(1, look.tx + (e.clientX - lastPt.x) / window.innerWidth * 2));
      lastPt = { x: e.clientX, y: e.clientY };
    }
  });
  listen(window, "pointerdown", function (e) { if (e.pointerType !== "mouse") lastPt = { x: e.clientX, y: e.clientY }; });
  listen(window, "pointerup", function (e) { if (e.pointerType !== "mouse") lastPt = null; });

  function fadeDoodles() {
    dx.save();
    dx.setTransform(1, 0, 0, 1, 0, 0);
    dx.globalCompositeOperation = "destination-out";
    dx.fillStyle = "rgba(0,0,0,0.006)";
    dx.fillRect(0, 0, dc.width, dc.height);
    dx.restore();
  }


  /* the music card: what I'm playing, and a box to recommend me a song */
  var tunesEl = byId("tunes"), tunesTrack = byId("tunes-track"), tunesLabel = byId("tunes-label");
  var recForm = byId("rec-form"), recQ = byId("rec-q"), recList = byId("rec-results"), recStatus = byId("rec-status");
  var tunesTimer = 0, searchTimer = 0, searchSeq = 0, recBusy = false;
  cleanups.push(function () { clearInterval(tunesTimer); clearTimeout(searchTimer); });
  function loadPlaying() {
    fetch("/api/now-playing")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!alive) return;
        var tr = d && (d.current || (d.recent && d.recent[0]));
        if (!tr) { tunesLabel.textContent = "now playing"; tunesTrack.textContent = "nothing right now"; return; }
        tunesLabel.textContent = d.current ? "now playing" : "last played";
        tunesTrack.textContent = tr.title + (tr.artist ? " — " + tr.artist : "");
      })
      .catch(function () { if (alive) tunesTrack.textContent = "the radio's off right now"; });
  }
  function showTunes(on) {
    tunesEl.hidden = !on;
    clearInterval(tunesTimer);
    if (on) { loadPlaying(); tunesTimer = setInterval(function () { if (!document.hidden) loadPlaying(); }, 30000); }
  }
  function closeResults() { recList.hidden = true; recList.textContent = ""; }
  function addSong(track) {
    if (recBusy) return;
    recBusy = true; closeResults(); recQ.value = ""; recStatus.textContent = "sending…";
    fetch("/api/add-song", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uri: track.uri, name: track.name, artist: track.artist }) })
      .then(function (r) {
        if (!alive) return;
        recStatus.textContent = r.ok ? "added “" + track.name + "” to my recs. thank you!" : r.status === 429 ? "that's a lot of recs. try again later." : "couldn't add that one. try again?";
      })
      .catch(function () { if (alive) recStatus.textContent = "couldn't reach the server. try again?"; })
      .then(function () { recBusy = false; });
  }
  function renderResults(tracks) {
    recList.textContent = "";
    tracks.slice(0, 5).forEach(function (t) {
      if (!t || typeof t.uri !== "string" || typeof t.name !== "string") return;
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = t.name + (t.artist ? " — " + t.artist : "");
      b.addEventListener("click", function () { addSong(t); });
      li.appendChild(b); recList.appendChild(li);
    });
    recList.hidden = !recList.children.length;
    if (!recList.children.length) recStatus.textContent = "no matches";
  }
  listen(recQ, "input", function () {
    var q = recQ.value.trim().slice(0, 100);
    clearTimeout(searchTimer); recStatus.textContent = "";
    if (!q) { closeResults(); return; }
    searchTimer = setTimeout(function () {
      var seq = ++searchSeq;
      fetch("/api/search-songs?q=" + encodeURIComponent(q))
        .then(function (r) { return r.json(); })
        .then(function (d) { if (alive && seq === searchSeq) renderResults((d && Array.isArray(d.tracks)) ? d.tracks : []); })
        .catch(function () { if (alive) recStatus.textContent = "search is down right now"; });
    }, 350);
  });
  listen(recQ, "keydown", function (e) { if (e.key === "Escape") closeResults(); });
  listen(recForm, "submit", function (e) { e.preventDefault(); var first = recList.querySelector("button"); if (first) first.click(); });

  function fail() {
    var p = document.createElement("p");
    p.className = "fallback";
    p.textContent = "Your browser couldn't draw the 3D scene, but the links still work.";
    root.appendChild(p);
    var g = byId("gate"); if (g) g.hidden = true;
    var n = byId("worldnav");
    if (n) { n.classList.add("static", "show"); n.removeAttribute("inert"); n.querySelectorAll("a").forEach(function (a) { a.textContent = a.getAttribute("data-key"); }); }
  }
    try { initGL(); } catch (err) { console.error(err); fail(); }

  function initGL() {
    var canvas = byId("gl");
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
    // start sharp, then drop resolution if this machine can't keep up
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(8, 1, 0.1, 500);
    var world = new THREE.Group();
    scene.add(world);

    var shared = {
      uTime: { value: 0 }, uDpr: { value: dpr }, uRes: { value: new THREE.Vector2(1, 1) },
      uReveal: { value: reduce ? 1 : 0 }, uGlitch: { value: 0 }, uWorldInv: { value: new THREE.Matrix4() }, uHomeDir: { value: new THREE.Vector3(0, 0, -1) }, uHalfFov: { value: new THREE.Vector2(0.1, 0.07) }, uVig: { value: 0 }, uCursor: { value: new THREE.Vector2(0, 0) }, uBite: { value: 0 }
    };

    var COMMON = [
      "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
      "return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
      "float n3(vec3 p){return noise(p.xy + vec2(p.z*1.31, p.z*0.77));}",
      "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}"
    ].join("\n");

    var EDGE = [
      "uniform mat4 uWorldInv; uniform float uDome; uniform vec3 uHomeDir; uniform vec2 uHalfFov; uniform vec2 uRes;",
      "float edgeAmt(vec3 wp){",
      "  vec3 d = (uWorldInv * vec4(wp, 1.0)).xyz;",
      "  {",
      "    vec3 ray = normalize(wp - cameraPosition);",
      "    float yaw = acos(clamp(dot(normalize(ray.xz), normalize(uHomeDir.xz)), -1.0, 1.0));",
      "    float pitch = abs(asin(clamp(ray.y, -1.0, 1.0)) - asin(clamp(uHomeDir.y, -1.0, 1.0)));",
      "    return max(smoothstep(uHalfFov.x * 1.0, uHalfFov.x * 1.18, yaw), smoothstep(uHalfFov.y * 1.0, uHalfFov.y * 1.18, pitch));",
      "  }",
      "  return max(max(smoothstep(24.0, 34.0, abs(d.x)), smoothstep(18.0, 28.0, d.z)), smoothstep(110.0, 150.0, -d.z));",
      "}",
      "vec3 codeWall(vec2 p, float time){",
      "  float cell = 13.0;",
      "  float colId = floor(p.x / cell);",
      "  float spd = 30.0 + hash(vec2(colId, 3.1)) * 90.0;",
      "  float y = p.y + time * spd;",
      "  vec2 ci = vec2(colId, floor(y / cell));",
      "  vec2 f = vec2(fract(p.x / cell), fract(y / cell));",
      "  float bit = step(0.5, hash(ci + floor(time * 1.3 + hash(ci) * 9.0) * 0.37));",
      "  float one = step(abs(f.x - 0.5), 0.07) * step(0.18, f.y) * step(f.y, 0.82);",
      "  float r = length((f - 0.5) * vec2(2.8, 1.75));",
      "  float zero = step(0.5, r) * step(r, 0.74) * step(0.14, f.y) * step(f.y, 0.86);",
      "  float glyph = mix(zero, one, bit);",
      "  float trail = fract(y / (cell * 18.0) + hash(vec2(colId, 7.7)));",
      "  vec3 g = vec3(0.22, 1.0, 0.53) * (0.22 + 0.78 * trail * trail);",
      "  return mix(vec3(0.015, 0.04, 0.025), g, glyph);",
      "}",
      "uniform float uVig; uniform vec2 uCursor; uniform float uBite;",
      "float dissolve(vec3 wp, vec2 p){",
      "  float b = hash(floor(p / 7.0) + floor(uTime * 2.0) * 0.0);",
      "  vec2 q = p / uRes;",
      "  float ax = abs(uCursor.x), ay = abs(uCursor.y);",
      "  float dxe = uCursor.x > 0.0 ? 1.0 - q.x : q.x;",
      "  float dye = uCursor.y > 0.0 ? 1.0 - q.y : q.y;",
      "  float ex = ax * clamp(1.0 - dxe / (0.11 * ax + 1e-4), 0.0, 1.0);",
      "  float ey = ay * clamp(1.0 - dye / (0.09 * ay + 1e-4), 0.0, 1.0);",
      "  vec2 o = p / uRes - 0.5; o.x *= (uRes.x / uRes.y) * 0.72;",
      "  float oval = step(mix(1.9, -0.35, uVig) + b * 0.2, length(o) * 2.0);",
      "  return max(step(b * 0.92 + 0.06, max(ex, ey)), oval);",
      "}"
    ].join("\n");

    var LUMP = [
      "uniform float uTime; uniform float uSeed; uniform float uLump; uniform vec2 uShift; uniform vec2 uRes;",
      "vec3 lumpy(vec3 pos, vec3 nrm){",
      "  float boil = floor(uTime*6.0);",
      "  float l = n3(pos*1.3 + uSeed) - 0.5;",
      "  float b = n3(pos*2.6 + uSeed + boil*0.71) - 0.5;",
      "  return pos + nrm*(l*uLump + b*uLump*0.05);",
      "}",
      "uniform float uGlitch;",
      "vec4 misregister(vec4 clip){ clip.xy += uShift / uRes * 2.0 * clip.w; float band = floor((clip.y/clip.w)*14.0); float tr = hash(vec2(band, floor(uTime*10.0))); clip.x += step(1.0-uGlitch*0.6, tr)*(tr-0.5)*uGlitch*0.5*clip.w; return clip; }"
    ].join("\n");

    var fillVert = [
      COMMON, LUMP,
      "uniform float uOver;",
      "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
      "void main(){",
      "  vN = normalize(normalMatrix * normal); vObj = position;",
      "  vec3 p = lumpy(position, normal);",
      "  p += normal * uOver * (n3(position*2.1 + uSeed*1.7) - 0.25);",
      "  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;",
      "  gl_Position = misregister(projectionMatrix * modelViewMatrix * vec4(p,1.0));",
      "}"
    ].join("\n");

    // quieter than v3: denser coverage, finer tooth, softer shading, fewer missed patches
    var fillFrag = [
      COMMON,
      "uniform vec3 uColor; uniform vec3 uShade; uniform float uAngle; uniform float uSeed; uniform float uDpr; uniform float uReveal; uniform float uDelay; uniform float uGlitch; uniform float uTime; uniform float uWash; uniform float uAlpha;",
      "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
      EDGE,
      "void main(){",
      "  vec3 n = normalize(vN);",
      "  float d = dot(n, normalize(vec3(-0.45,0.7,0.55)))*0.5+0.5;",
      "  vec2 p = gl_FragCoord.xy / uDpr;",
      "  vec3 dir = normalize(vec3(cos(uAngle), sin(uAngle), 0.25));",
      "  float sweep = dot(normalize(vObj + 1e-4), dir)*0.5 + 0.5;",
      "  if (uDelay*0.6 + sweep*0.28 + noise(p*0.05)*0.08 + 0.3 > uReveal*1.6) discard;",
      "  if (uGlitch > 0.0) {",
      "    float band = step(1.0 - uGlitch, hash(vec2(floor(gl_FragCoord.y/(5.0*uDpr)), floor(uTime*12.0))));",
      "    if (band > 0.5) {",
      "      vec3 gq = abs(fract(vObj*5.0) - 0.5);",
      "      if (max(max(gq.x, gq.y), gq.z) < 0.46) discard;",
      "      gl_FragColor = vec4(0.22, 1.0, 0.53, 1.0); return;",
      "    }",
      "  }",
      "  if (dissolve(vWorld, p) > 0.5) { gl_FragColor = vec4(codeWall(p, uTime), 1.0); return; }",
      "  if (uWash > 0.5) { float tw = noise(p*0.9)*0.5 + noise(p*0.31)*0.5; gl_FragColor = vec4(uColor * (0.965 + 0.05*tw) * (1.0 - 0.025*step(0.72, noise(p*0.01 + uSeed))), 1.0); return; }",
      "  float rn = noise(p*0.004 + uSeed);",
      "  vec2 q = rot(uAngle + (rn-0.5)*0.25) * p;",
      "  float wob = noise(q*vec2(0.004,0.012) + uSeed)*0.35;",
      "  float s = abs(fract(q.y/5.0 + wob) - 0.5)*2.0;",
      "  float press = noise(p*0.012 + uSeed*1.3);",
      "  float stroke = step(s, 0.72 + 0.26*press);",
      "  float tooth = noise(p*1.6)*0.6 + noise(p*0.5 + uSeed)*0.4;",
      "  float base = stroke * step(0.22 + (1.0-press)*0.08, tooth);",
      "  base *= step(0.08, noise(p*0.02 + uSeed*2.1));",
      "  vec2 h = rot(uAngle + 1.2 + (rn-0.5)*0.25) * p;",
      "  float s2 = abs(fract(h.y/5.0 + noise(h*vec2(0.004,0.012))*0.35) - 0.5)*2.0;",
      "  float shadowAmt = smoothstep(0.6, 0.1, d);",
      "  float shade = step(s2, shadowAmt*0.75) * step(0.3, tooth);",
      "  if (base < 0.5 && shade < 0.5) discard;",
      "  vec3 col = uColor*(0.92 + 0.14*press);",
      "  if (shade > 0.5) col = mix(col, uShade, 0.55);",
      "  gl_FragColor = vec4(col, uAlpha);",
      "}"
    ].join("\n");

    var lineVert = [
      COMMON, LUMP,
      "uniform float uThick;",
      "varying float vAng; varying vec3 vWorld;",
      "void main(){",
      "  float boil = floor(uTime*6.0);",
      "  vAng = atan(position.y, position.x) / 6.2832 + 0.5;",
      "  vec3 p = lumpy(position, normal);",
      "  float t = 0.45 + 1.1*n3(position*1.9 + uSeed + boil*0.06);",
      "  vec3 sc = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));",
      "  float scAvg = (sc.x + sc.y + sc.z) / 3.0;",
      "  p += normal * uThick * t * min(1.0, scAvg) / sc;",
      "  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;",
      "  gl_Position = misregister(projectionMatrix * modelViewMatrix * vec4(p,1.0));",
      "}"
    ].join("\n");

    var lineFrag = [
      COMMON,
      "uniform vec3 uInk; uniform float uDpr; uniform float uReveal; uniform float uDelay; uniform float uSeed; uniform float uGlitch; uniform float uTime;",
      "varying float vAng; varying vec3 vWorld;",
      EDGE,
      "void main(){",
      "  if (uDelay*0.55 + vAng*0.25 > uReveal*1.6) discard;",
      "  if (dissolve(vWorld, gl_FragCoord.xy / uDpr) > 0.5) discard;",
      "  if (uGlitch > 0.0 && step(1.0 - uGlitch, hash(vec2(floor(gl_FragCoord.y/(5.0*uDpr)), floor(uTime*12.0)))) > 0.5) discard;",
      "  vec2 p = gl_FragCoord.xy / uDpr;",
      "  if (noise(vec2(vAng*16.0, uSeed)) < 0.18) discard;",
      "  if (noise(p*1.4) < 0.2) discard;",
      "  gl_FragColor = vec4(uInk, 1.0);",
      "}"
    ].join("\n");

    var TOTAL = 34;

    function crayon(geom, color, shade, opts) {
      opts = opts || {};
      var delay = Math.min(1, (opts.order || 1) / TOTAL);
      var seed = Math.random() * 100;
      var lump = opts.lump != null ? opts.lump : 0.16;
      var g = new THREE.Group();
      g.add(new THREE.Mesh(geom, new THREE.ShaderMaterial({
        vertexShader: fillVert, fragmentShader: fillFrag, side: opts.side || THREE.FrontSide, transparent: opts.alpha != null, depthWrite: opts.alpha == null,
        uniforms: {
          uColor: { value: new THREE.Color(color) }, uShade: { value: new THREE.Color(shade) },
          uTime: shared.uTime, uDpr: shared.uDpr, uRes: shared.uRes, uReveal: shared.uReveal, uGlitch: shared.uGlitch, uWorldInv: shared.uWorldInv, uHomeDir: shared.uHomeDir, uHalfFov: shared.uHalfFov, uVig: shared.uVig, uCursor: shared.uCursor, uBite: shared.uBite,
          uAngle: { value: Math.random() * Math.PI }, uSeed: { value: seed }, uDelay: { value: delay },
          uLump: { value: lump }, uOver: { value: opts.over != null ? opts.over : 0.06 }, uWash: { value: opts.wash ? 1 : 0 }, uAlpha: { value: opts.alpha != null ? opts.alpha : 1 }, uDome: { value: (opts.side === THREE.BackSide || opts.viewEdge) ? 1 : 0 },
          uShift: { value: new THREE.Vector2(jitter(8), jitter(6)) }
        }
      })));
      if (opts.noLine) return g;
      var ink = opts.ink ? new THREE.Color(opts.ink) : new THREE.Color(shade).multiplyScalar(0.5);
      var passes = (coarse || (opts.thick || 0.07) < 0.06) ? 1 : 2;
      for (var pass = 0; pass < passes; pass++) {
        g.add(new THREE.Mesh(geom, new THREE.ShaderMaterial({
          vertexShader: lineVert, fragmentShader: lineFrag, side: THREE.BackSide,
          uniforms: {
            uInk: { value: ink }, uTime: shared.uTime, uDpr: shared.uDpr, uRes: shared.uRes, uReveal: shared.uReveal, uGlitch: shared.uGlitch, uWorldInv: shared.uWorldInv, uHomeDir: shared.uHomeDir, uHalfFov: shared.uHalfFov, uVig: shared.uVig, uCursor: shared.uCursor, uBite: shared.uBite,
            uSeed: { value: seed }, uDelay: { value: Math.min(1, delay + pass * 0.06) },
            uLump: { value: lump }, uThick: { value: (opts.thick || 0.07) * (pass ? 0.7 : 1) }, uDome: { value: 0 },
            uShift: { value: new THREE.Vector2(jitter(4), jitter(4)) }
          }
        })));
      }
      return g;
    }
    // obj, parent, [x,y,z], [sx,sy,sz] or number, [rx,ry,rz]
    function put(obj, parent, pos, scl, rot) {
      obj.position.set(pos[0], pos[1], pos[2]);
      if (scl != null) { if (typeof scl === "number") obj.scale.setScalar(scl); else obj.scale.set(scl[0], scl[1], scl[2]); }
      if (rot) obj.rotation.set(rot[0], rot[1], rot[2]);
      parent.add(obj); return obj;
    }

    var sphere = new THREE.SphereGeometry(1, 40, 28);
    var sphereLo = new THREE.SphereGeometry(1, 14, 10);
    var halfSphere = new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var cone = new THREE.ConeGeometry(1, 1, 40, 6);
    var cyl = new THREE.CylinderGeometry(1, 1, 1, 24, 6);
    var torus = new THREE.TorusGeometry(1, 0.22, 12, 32);
    var plane = new THREE.PlaneGeometry(1, 1, 30, 20);
    // a sphere pushed toward a cube: boxy but with smooth normals, so the lumps and outlines don't crack
    var box = (function () {
      var g = new THREE.SphereGeometry(1, 40, 28);
      var pos = g.attributes.position, v = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        var m = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
        v.divideScalar(Math.pow(m, 0.88));
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return g;
    })();

    function cloud(parent, x, y, z, s, order) {
      var c = new THREE.Group();
      [[0, 0, 1], [1.1, 0.2, 0.85], [-1.05, 0.05, 0.75], [0.35, 0.7, 0.75]].forEach(function (b) {
        var puff = crayon(sphere, "#d9ecff", "#4f86d4", { thick: 0.07, lump: 0.22, order: order });
        puff.position.set(b[0], b[1], 0); puff.scale.set(b[2], b[2] * 0.85, b[2] * 0.8);
        c.add(puff);
      });
      return put(c, parent, [x, y, z], s);
    }
    function sun(parent, x, y, z, s, order) {
      var g = put(crayon(sphere, "#ffc93c", "#ff8c1a", { thick: 0.08, lump: 0.2, order: order }), parent, [x, y, z], s);
      for (var i = 0; i < 9; i++) {
        var a = (i / 9) * Math.PI * 2 + jitter(0.15), rl = 2.2 + jitter(0.3);
        var ray = crayon(cyl, "#ff9f1c", "#e8412c", { thick: 0.05, lump: 0.06, order: order + 1 });
        put(ray, g, [Math.cos(a) * rl / 1.0, Math.sin(a) * rl / 1.0, 0], [0.08, 0.75 + Math.random() * 0.3, 0.08], [0, 0, a - Math.PI / 2 + jitter(0.2)]);
      }
      return g;
    }
    function macPro(parent, x, y, z, s, order) {
      var g = new THREE.Group();
      put(crayon(box, "#c9ccd6", "#6b7090", { thick: 0.06, lump: 0.05, order: order }), g, [0, 0, 0], [1, 1.9, 1.8]);
      put(crayon(torus, "#aeb3c2", "#5a5f78", { thick: 0.04, lump: 0.03, order: order + 1 }), g, [0, 2.0, 0.9], [0.55, 0.45, 0.55], [0, Math.PI / 2, 0]);
      put(crayon(torus, "#aeb3c2", "#5a5f78", { thick: 0.04, lump: 0.03, order: order + 1 }), g, [0, 2.0, -0.9], [0.55, 0.45, 0.55], [0, Math.PI / 2, 0]);
      for (var r = 0; r < 5; r++) for (var c = 0; c < 3; c++) {
        put(crayon(sphere, "#5a5f78", "#2b2f45", { noLine: true, lump: 0.02, order: order + 2 }), g, [-0.45 + c * 0.45, 1.1 - r * 0.45, 1.75], 0.1);
      }
      return put(g, parent, [x, y, z], s);
    }

    /* ---------- me: a chibi toy with Ticus's face on a big round head ---------- */
    var faceTex = new THREE.TextureLoader().load(FACE_URL);
    var faceVert = [
      "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
      "void main(){ vN = normalize(normalMatrix * normal); vObj = position; vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
    ].join("\n");
    var faceFrag = [
      COMMON,
      "uniform sampler2D uFace; uniform vec3 uSkin; uniform vec3 uHair; uniform float uReveal; uniform float uDelay; uniform float uTime; uniform float uDpr;",
      "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
      EDGE,
      "void main(){",
      "  vec2 p = gl_FragCoord.xy / uDpr;",
      "  if (uDelay*0.6 + 0.3 + noise(p*0.05)*0.1 > uReveal*1.6) discard;",
      "  if (dissolve(vWorld, p) > 0.5) { gl_FragColor = vec4(codeWall(p, uTime), 1.0); return; }",
      "  vec3 o = normalize(vObj);",
      "  float lon = atan(o.x, o.z);",
      "  float lat = asin(clamp(o.y, -1.0, 1.0));",
      "  vec2 uv = vec2(0.51 + lon * 0.2, 0.5 + lat * 0.345);",
      "  float m = smoothstep(1.0, 0.84, length(vec2(lon / 1.32, (lat + 0.04) / 1.3)));",
      "  vec3 tex = texture2D(uFace, uv).rgb;",
      "  vec3 outside = mix(uSkin, uHair, smoothstep(0.05, 0.3, o.y + (o.z < 0.0 ? 0.45 : 0.0)));",
      "  vec3 col = mix(outside, tex, m);",
      "  col = mix(col, floor(col * 7.0 + 0.5) / 7.0, 0.3);",
      "  float tooth = noise(p * 1.4) * 0.5 + noise(p * 0.45) * 0.5;",
      "  col *= 0.9 + 0.12 * tooth;",
      "  float d = dot(normalize(vN), normalize(vec3(-0.45, 0.7, 0.55))) * 0.5 + 0.5;",
      "  col *= 0.84 + 0.22 * d;",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");
    function avatar(order, jacket, jacketShade, opt) {
      opt = opt || {};
      var astro = !!opt.astro;
      var g = new THREE.Group();
      var head = new THREE.Group();
      var h = crayon(sphere, "#d99a86", "#9a5e4c", { thick: 0.05, lump: 0.01, order: order });
      h.children[0].material = new THREE.ShaderMaterial({
        vertexShader: faceVert, fragmentShader: faceFrag,
        uniforms: {
          uFace: { value: faceTex }, uSkin: { value: new THREE.Color("#d99a86") }, uHair: { value: new THREE.Color("#2b211c") },
          uReveal: shared.uReveal, uDelay: { value: Math.min(1, order / TOTAL) }, uTime: shared.uTime, uDpr: shared.uDpr,
          uRes: shared.uRes, uVig: shared.uVig, uCursor: shared.uCursor, uBite: shared.uBite, uWorldInv: shared.uWorldInv, uHomeDir: shared.uHomeDir, uHalfFov: shared.uHalfFov, uDome: { value: 0 }
        }
      });
      put(h, head, [0, 0, 0], [0.66, 0.72, 0.64]);
      // modeled hair: covers the back and crown so the head reads from every side
      put(crayon(halfSphere, "#2b211c", "#120c09", { thick: 0.04, lump: 0.08, order: order }), head, [0, 0.02, -0.03], [0.69, 0.75, 0.68], [-Math.PI / 2 - 0.25, 0, 0]);
      put(crayon(halfSphere, "#2b211c", "#120c09", { thick: 0.03, lump: 0.1, order: order }), head, [0, 0.3, -0.06], [0.67, 0.44, 0.64], [-0.2, 0, 0]);
      if (astro) {
        put(crayon(sphere, "#cfefff", "#5b8fd6", { noLine: true, lump: 0, over: 0, alpha: 0.22, order: order + 0.5 }), head, [0, 0.02, 0], [0.92, 0.94, 0.9]);
        put(crayon(torus, "#e4e6ee", "#8d91a3", { thick: 0.04, lump: 0.02, order: order + 0.5 }), head, [0, -0.62, 0], [0.62, 0.62, 0.5], [Math.PI / 2, 0, 0]);
      } else {
        put(crayon(halfSphere, "#ffc93c", "#c27a00", { thick: 0.04, lump: 0.05, order: order + 0.5 }), head, [0, 0.36, -0.14], [0.7, 0.46, 0.66], [-0.45, 0, 0]);
        put(crayon(sphere, "#f27bb0", "#a8306b", { thick: 0.03, lump: 0.12, order: order + 0.5 }), head, [0, 0.82, -0.42], 0.14);
      }
      head.position.y = 1.62;
      g.add(head);
      var suit = astro ? ["#f2f2ee", "#9a9cab"] : [jacket, jacketShade];
      var body = put(crayon(sphere, suit[0], suit[1], { thick: 0.05, lump: 0.05, order: order }), g, [0, 0.72, 0], [0.44, 0.5, 0.36]);
      if (astro) {
        put(crayon(box, "#d9dbe3", "#8d91a3", { thick: 0.04, lump: 0.03, order: order }), g, [0, 0.82, -0.38], [0.3, 0.36, 0.14]);
        put(crayon(box, "#e8412c", "#8f1d10", { noLine: true, lump: 0.01, order: order }), g, [-0.1, 0.84, 0.33], [0.06, 0.05, 0.03]);
        put(crayon(box, "#2f7de1", "#163f8a", { noLine: true, lump: 0.01, order: order }), g, [0.08, 0.84, 0.33], [0.06, 0.05, 0.03]);
        put(crayon(box, "#ffc93c", "#c27a00", { noLine: true, lump: 0.01, order: order }), g, [0, 0.7, 0.35], [0.14, 0.04, 0.03]);
      }
      var mitt = astro ? ["#d9dbe3", "#8d91a3"] : ["#2f7de1", "#163f8a"];
      var hands = [-1, 1].map(function (sd) { return put(crayon(sphere, mitt[0], mitt[1], { thick: 0.04, lump: 0.06, order: order }), g, [sd * 0.62, 0.78, 0.06], 0.15); });
      var legs = [-1, 1].map(function (sd) {
        var lg = new THREE.Group();
        put(crayon(cyl, astro ? "#f2f2ee" : "#2f3a8f", astro ? "#9a9cab" : "#151b4a", { thick: 0.04, lump: 0.03, order: order }), lg, [0, -0.2, 0], [0.13, 0.4, 0.13]);
        put(crayon(sphere, astro ? "#c4c8d4" : "#2b2340", astro ? "#7a7d92" : "#120f22", { thick: 0.03, lump: 0.04, order: order }), lg, [0, -0.42, 0.06], [0.16, 0.11, 0.23]);
        return put(lg, g, [sd * 0.16, 0.46, 0]);
      });
      return { group: g, head: head, body: body, hands: hands, legs: legs };
    }

    /* ---------- the worlds ---------- */
    var SCENES = {};

    SCENES.space = {
      build: function (w) {
        var s = {};
        put(crayon(sphere, "#1d2156", "#0c0f33", { lump: 0, over: 0, noLine: true, side: THREE.BackSide, order: 1 }), w, [0, 0, 0], 320);
        s.stars = [];
        for (var i = 0; i < 110; i++) {
          var c = Math.random() < 0.7 ? ["#fff3b0", "#e0a800"] : ["#cfe6ff", "#5b8fd6"];
          var sd = new THREE.Vector3(jitter(1), jitter(0.8), -0.15 - Math.random()).normalize(), sr = 16 + Math.random() * 34;
          s.stars.push(put(crayon(sphereLo, c[0], c[1], { noLine: true, lump: 0.35, order: 2 + Math.random() * 4 }), w, [sd.x * sr, sd.y * sr, sd.z * sr], 0.1 + sr * 0.007 + Math.random() * 0.12));
        }
        var pl = new THREE.Group();
        put(crayon(sphere, "#ff8a3d", "#b23a48", { thick: 0.06, lump: 0.12, order: 8 }), pl, [0, 0, 0], 2.2);
        put(crayon(torus, "#f27bb0", "#a8306b", { thick: 0.04, lump: 0.05, order: 10 }), pl, [0, 0, 0], [3.4, 3.4, 0.5], [1.25, 0.3, 0]);
        s.planet = put(pl, w, [-9, 4.5, -13]);
        var mo = new THREE.Group();
        put(crayon(sphere, "#d6d8e2", "#7a7d92", { thick: 0.06, lump: 0.15, order: 12 }), mo, [0, 0, 0], 1.3);
        [[0.4, 0.3], [-0.5, -0.2], [0.1, -0.6]].forEach(function (k) { put(crayon(sphere, "#aeb3c2", "#5a5f78", { noLine: true, lump: 0.1, order: 13 }), mo, [k[0], k[1], 1.05], [0.32, 0.32, 0.15]); });
        s.moon = put(mo, w, [10, 5, -11]);
        var ea = new THREE.Group();
        put(crayon(sphere, "#2f7de1", "#163f8a", { thick: 0.06, lump: 0.1, order: 15 }), ea, [0, 0, 0], 1.6);
        [[0.5, 0.6], [-0.7, -0.1], [0.3, -0.8]].forEach(function (k) { put(crayon(sphere, "#3aa655", "#1d6b3a", { noLine: true, lump: 0.3, order: 16 }), ea, [k[0], k[1], 1.1], [0.55, 0.4, 0.4]); });
        s.earth = put(ea, w, [-6, -5.5, -7]);
        // the UFO (starts far off to the left)
        var u = new THREE.Group();
        put(crayon(sphere, "#c9ccd6", "#6b7090", { thick: 0.08, lump: 0.06, order: 18 }), u, [0, 0, 0], [2.6, 0.55, 2.6]);
        put(crayon(halfSphere, "#9fe7ff", "#2f7de1", { thick: 0.06, lump: 0.06, order: 20 }), u, [0, 0.35, 0], [1.2, 1.0, 1.2]);
        s.lights = [];
        var lc = ["#e8412c", "#ffc93c", "#3aa655", "#f27bb0", "#2f7de1", "#ffc93c"];
        for (var k = 0; k < 6; k++) {
          var a = (k / 6) * Math.PI * 2;
          s.lights.push(put(crayon(sphere, lc[k], "#2b2340", { thick: 0.03, lump: 0.1, order: 22 }), u, [Math.cos(a) * 2.1, -0.1, Math.sin(a) * 2.1], 0.2));
        }
        s.beam = put(crayon(cone, "#fff2a8", "#f2c94c", { noLine: true, lump: 0.1, alpha: 0.32, order: 24 }), u, [0, -3.4, 0], [2.0, 6.0, 2.0]);
        s.beamMat = s.beam.children[0].material;
        s.ufo = put(u, w, [-40, 4.8, -3]);
        // me, floating
        s.me = avatar(26, "#e8412c", "#8f1d10", { astro: true });
        put(s.me.group, w, [2, -0.2, -3], 0.9);
        // nav: little things orbiting me once I'm caught
        s.nav = new THREE.Group(); w.add(s.nav);
        s.anchors = [];
        function navItem(key, g) { g.scale.setScalar(0.001); s.nav.add(g); s.anchors.push({ key: key, obj: g }); return g; }
        var monoI = new THREE.Group();
        put(crayon(sphere, "#ffffff", "#9aa3b8", { thick: 0.05, lump: 0.12, order: 30 }), monoI, [0, 0, 0], [0.7, 0.5, 0.35]);
        put(crayon(cone, "#ffffff", "#9aa3b8", { thick: 0.04, lump: 0.05, order: 30 }), monoI, [-0.35, -0.45, 0], [0.16, 0.38, 0.12], [0, 0, 0.6]);
        [-0.25, 0, 0.25].forEach(function (dx2) { put(crayon(sphere, "#2b2340", "#2b2340", { noLine: true, lump: 0.02, order: 30 }), monoI, [dx2, 0, 0.32], 0.07); });
        navItem("monologue", monoI);
        var projI = new THREE.Group(); macPro(projI, 0, -0.5, 0, 0.32, 30); navItem("projects", projI);
        var aboutI = new THREE.Group();
        put(crayon(sphere, "#ffe27a", "#e0a800", { thick: 0.04, lump: 0.1, order: 30 }), aboutI, [0, 0, 0], 0.32);
        for (var pt = 0; pt < 5; pt++) { var pa = pt / 5 * Math.PI * 2 + Math.PI / 2; put(crayon(cone, "#ffd23f", "#e0a800", { thick: 0.03, lump: 0.06, order: 30 }), aboutI, [Math.cos(pa) * 0.42, Math.sin(pa) * 0.42, 0], [0.16, 0.42, 0.1], [0, 0, pa - Math.PI / 2]); }
        navItem("about", aboutI);
        // comet: a bright head with a tail of shrinking puffs trailing behind it
        var sh = new THREE.Group();
        put(crayon(sphere, "#fff6c2", "#ffc93c", { thick: 0.04, lump: 0.15, order: 30 }), sh, [0, 0, 0], 0.32);
        var tailDir = new THREE.Vector3(0.98, 0.19, 0).normalize();
        var tc = [["#ffe27a", "#e0a800"], ["#ffc93c", "#ff8c1a"], ["#ffb070", "#e8412c"], ["#f7a1c4", "#c2185b"], ["#c8a8ff", "#7a4fc9"], ["#9db8ff", "#2f7de1"]];
        for (var ti = 1; ti <= 6; ti++) put(crayon(sphere, tc[ti - 1][0], tc[ti - 1][1], { noLine: true, lump: 0.25, order: 30 }), sh, [tailDir.x * ti * 0.42, tailDir.y * ti * 0.42, 0], 0.3 - ti * 0.04);
        s.shoot = put(sh, w, [14, 8, -14]);
        s.focus = new THREE.Vector3(2, 0.8, -3);
        s.homeCam = { pos: [2, 1.8, 11.5], look: [2, 1.9, -3], fov: 42 };
        return s;
      },
      update: function (s, t, info) {
        var T = info.T, home = info.home, me = s.me;
        // the fly-by: in from the left, brakes over me, beam on
        var fly = smooth(4.4, 7.6, T);
        s.ufo.position.set(-40 + 42 * fly, 4.8 + Math.sin(t * 1.1) * 0.25, -3);
        s.ufo.rotation.set(0, t * 0.5, -0.3 * (1 - fly) * (fly > 0 && fly < 1 ? 1 : 0) + Math.sin(t * 0.8) * 0.05);
        s.lights.forEach(function (l, i) { l.scale.setScalar(0.2 * (Math.sin(t * 6 + i * 1.3) > 0 ? 1.15 : 0.8)); });
        var beamOn = Math.max(smooth(7.3, 8.0, T), info.mode === "home" ? 1 : 0);
        s.beamMat.uniforms.uAlpha.value = 0.32 * beamOn;
        s.beam.visible = beamOn > 0.01;
        // me: drifting, then sucked up, then stuck hovering in the beam
        var lift = Math.max(smooth(8.0, 9.8, T), info.mode === "home" ? 1 : 0);
        var flail = Math.max(lift, 0.15);
        me.group.position.set(2 + Math.sin(t * 0.4) * 0.3 * (1 - lift), -0.6 + Math.sin(t * 0.7) * 0.2 * (1 - lift) + lift * 1.0 + Math.sin(t * 1.2) * 0.12 * lift, -3);
        me.group.rotation.set(Math.sin(t * 0.6) * 0.25, Math.sin(t * 0.3) * 0.5 + lift * t * 0.9, Math.sin(t * 0.5) * 0.25 + lift * Math.sin(t * 1.4) * 0.2);
        me.head.rotation.y = Math.sin(t * 1.3) * 0.25;
        var sp = 2 + flail * 7;
        me.hands[0].position.set(-0.62 - Math.abs(Math.sin(t * sp * 0.8)) * 0.15 * flail, 0.85 + Math.sin(t * sp) * 0.35 * flail, 0.06);
        me.hands[1].position.set(0.62 + Math.abs(Math.cos(t * sp * 0.8)) * 0.15 * flail, 0.85 + Math.cos(t * sp) * 0.35 * flail, 0.06);
        me.legs[0].rotation.x = Math.sin(t * sp) * 0.7 * flail; me.legs[1].rotation.x = -Math.sin(t * sp) * 0.7 * flail;
        // nav orbits once home
        s.anchors.forEach(function (n, i) {
          var a = t * 0.22 + i * Math.PI * 2 / 3, sx = Math.min(1, (info.aspect || 1.6) * 0.8);
          n.obj.position.set(2 + Math.cos(a) * 5.4 * sx, 0.9 + Math.sin(a) * 2.0 + Math.sin(t * 0.9 + i) * 0.2, -3 + Math.sin(a) * 2.6);
          n.obj.rotation.y = t * 0.6 + i;
          n.obj.scale.setScalar(Math.max(0.001, home));
          n.obj.userData.vis = home;
        });
        s.planet.rotation.y = t * 0.15;
        s.moon.position.y = 5 + Math.sin(t * 0.4) * 0.3;
        var st = (t * 0.2) % 1;
        s.shoot.position.set(14 - st * 32, 8 - st * 6, -14);
        s.stars.forEach(function (sr, i) { if (i % 5 === 0) sr.visible = Math.sin(t * 2 + i) > -0.6; });
        s.focus.set(me.group.position.x, me.group.position.y + 1.0, -3);
      },
      navText: { about: "about ★", projects: "projects ▣", monologue: "monologue ✎" },
      cam: { walk: [1, 0.6, -6], look: [0, 0, -5], lookWalk: [2, 1.4, 0], yaw: -0.25, orbit: 0.35, follow: 0.4 }
    };

    /* ski: 3D models built from Ticus's drawings: gray Tetons at the back, his blue three-peak
       mountain with snowy tips and thick black outlines, his stacked-triangle trees */
    SCENES.ski = {
      build: function (w) {
        var s = {};
        var GROUND = -6, INK = "#141414";
        put(crayon(sphere, "#d6ebff", "#a9c8f0", { lump: 0, over: 0, noLine: true, wash: true, side: THREE.BackSide, order: 0.5 }), w, [0, 0, 0], 320);
        put(crayon(plane, "#f7f9fd", "#a9c4ec", { lump: 0.1, over: 0, noLine: true, wash: true, viewEdge: true, order: 0.8 }), w, [0, GROUND, -110], [400, 300, 1], [-Math.PI / 2, 0, 0]);
        s.sun = sun(w, 15, 10, -50, 1.6, 1);
        s.clouds = [cloud(w, -14, 8.5, -40, 1.3, 2), cloud(w, 9, 9.5, -46, 1.1, 2)];
        function peak(x, z, H, R, rock, rockShade, order, snowShare) {
          var g = new THREE.Group();
          put(crayon(cone, rock, rockShade, { thick: 0.24, lump: 0.05, ink: INK, order: order }), g, [0, H / 2, 0], [R, H, R]);
          var hc = H * (snowShare || 0.28);
          put(crayon(cone, "#ffffff", "#aab8cf", { thick: 0.16, lump: 0.06, ink: INK, order: order + 0.5 }), g, [0, H - hc / 2 + 0.05, 0], [R * hc / H * 1.08, hc, R * hc / H * 1.08]);
          return put(g, w, [x, GROUND, z]);
        }
        [[-17, 6.5, 3.6], [-12, 8.5, 4], [-6.5, 7.2, 3.6], [-1.5, 10.5, 4.4], [3.5, 8.8, 3.8], [8.5, 9.6, 4.2], [13, 7.6, 3.8], [17.5, 6, 3.4]].forEach(function (m, i) {
          peak(m[0], -44 - (i % 2) * 3, m[1], m[2], "#b9c2d3", "#6f7a92", 1.5 + i * 0.2, 0.4);
        });
        // his mountain, now on the left
        s.main = { x: -6, H: 11, R: 5.5, z: -12 };
        peak(-12.2, -14, 8, 4.4, "#2f72d0", "#1b4795", 3);
        peak(-0.8, -17, 8.5, 4.2, "#2f72d0", "#1b4795", 3.4);
        peak(-6, -12, 11, 5.5, "#2f72d0", "#1b4795", 3.8, 0.26);
        function tree(x, z, sz, order) {
          var g = new THREE.Group();
          put(crayon(cyl, "#7a4a33", "#3e2414", { thick: 0.08, lump: 0.05, ink: INK, order: order }), g, [0, 0.45, 0], [0.32, 0.9, 0.32]);
          [[1.6, 1.9, 1.75], [2.6, 1.55, 1.45], [3.5, 1.2, 1.2]].forEach(function (t, k) {
            put(crayon(cone, "#0b8a24", "#05561a", { thick: 0.13, lump: 0.06, ink: INK, order: order + 0.3 }), g, [0, t[0], 0], [t[1], t[2], t[1]]);
          });
          return put(g, w, [x, GROUND, z], sz, [0, Math.random() * 6, 0]);
        }
        [[-13, -7, 1.2], [-10.5, -4.5, 1.05], [-14, -1.5, 1.0], [14, -12, 1.3], [12.8, -2.2, 1.1], [-6.5, 1.8, 0.8], [-16, 3, 0.95], [16, 0.5, 1.0], [11.5, -10.5, 1.1], [3, -15, 1.2]].forEach(function (t, i) {
          tree(t[0], t[1], t[2], 6 + i * 0.6);
        });
        // the shoulder off the mountain's right side, broken by a real gap: the crevasse
        var BX = 2.75, BY = GROUND + 1.05, BZ = -8, TILT = 0.25, GX = 2.0;
        function topY(x) { return BY + 0.45 / Math.cos(TILT) - Math.tan(TILT) * (x - BX); }
        s.topY = topY; s.BZ = BZ; s.GX = GX; s.GROUND = GROUND;
        function slab(a, b) {
          var cx = (a + b) / 2, cy = BY - Math.tan(TILT) * (cx - BX);
          put(crayon(box, "#f4f8ff", "#9db8e8", { thick: 0.1, lump: 0.05, ink: INK, order: 17 }), w, [cx, cy, BZ], [(b - a) / 2, 0.45, 2.7], [0, 0, -TILT]);
          put(crayon(box, "#eef3fb", "#9db8e8", { thick: 0.08, lump: 0.06, ink: INK, order: 17 }), w, [cx, cy - 0.95, BZ - 0.5], [(b - a) / 2 + 0.1, 0.9, 2.9], [0, 0, -TILT]);
        }
        slab(-2.1, GX - 0.95);
        slab(GX + 0.95, 7.6);
        // inside the gap: rock walls, spikes, a lava floor, smoke
        [-1, 1].forEach(function (sd) {
          var wx = GX + sd * 0.92, h = (topY(wx) - GROUND) / 2;
          put(crayon(box, "#2a1830", "#120a18", { thick: 0.05, lump: 0.15, ink: "#07030a", order: 18 }), w, [wx, GROUND + h, BZ], [0.12, h, 2.7]);
        });
        put(crayon(box, "#ff6a1a", "#ffd23f", { noLine: true, lump: 0.15, order: 18.2 }), w, [GX, GROUND + 0.12, BZ], [0.86, 0.12, 2.65]);
        s.lava = [];
        [-0.45, 0, 0.45].forEach(function (lx, i) {
          s.lava.push(put(crayon(box, i % 2 ? "#ffe066" : "#ff9f1c", "#ff5a1f", { noLine: true, lump: 0.25, order: 18.5 }), w, [GX + lx, GROUND + 0.27, BZ + jitter(0.4)], [0.07, 0.04, 2.3]));
        });
        for (var rk = 0; rk < 7; rk++) {
          put(crayon(cone, "#3b2147", "#150a1c", { thick: 0.04, lump: 0.2, ink: "#07030a", order: 18.6 }), w, [GX + jitter(0.6), GROUND + 0.5, BZ + jitter(2.3)], [0.16, 0.7 + Math.random() * 0.6, 0.16], [jitter(0.2), 0, jitter(0.25)]);
        }
        s.smoke = [];
        for (var si2 = 0; si2 < 12; si2++) s.smoke.push(put(crayon(sphereLo, "#4b3a5a", "#1d0f22", { noLine: true, lump: 0.3, order: 20 }), w, [GX + jitter(0.6), GROUND + Math.random() * 5, BZ + jitter(2.2)], 0.3));
        s.smokeBase = GROUND + 0.3;
        // the snappers live down in the fire
        s.plants = [];
        [[-0.3, -1.6], [0.3, -0.5], [-0.25, 0.6], [0.3, 1.7], [0.0, -2.3]].forEach(function (pp) {
          var pg = new THREE.Group();
          var stem = new THREE.Group();
          for (var k = 0; k < 7; k++) put(crayon(sphere, k % 2 ? "#2ec4b6" : "#25a99c", "#126b63", { thick: 0.04, lump: 0.2, order: 21 }), stem, [Math.sin(k * 0.9) * 0.12, k * 0.38, 0], [0.2, 0.26, 0.2]);
          [[-0.35, 0.7, 0.6], [0.38, 1.25, -0.6]].forEach(function (lf) {
            put(crayon(sphere, "#3ad6a0", "#147a5a", { thick: 0.04, lump: 0.15, order: 21 }), stem, [lf[0], lf[1], 0], [0.42, 0.12, 0.22], [0, 0, lf[2]]);
          });
          pg.add(stem);
          var head = new THREE.Group(), upper = new THREE.Group(), lower = new THREE.Group();
          put(crayon(halfSphere, "#9b5de5", "#4b2386", { thick: 0.06, lump: 0.1, order: 22 }), upper, [0, 0, 0.55], [0.85, 0.75, 0.85]);
          put(crayon(halfSphere, "#7b3fc4", "#3d1a73", { thick: 0.06, lump: 0.1, order: 22 }), lower, [0, 0, 0.55], [0.8, 0.6, 0.8], [Math.PI, 0, 0]);
          [[0.35, 0.55, 0.85], [-0.3, 0.45, 0.95], [0.05, 0.68, 0.5]].forEach(function (sp) {
            put(crayon(sphere, "#c8a8ff", "#7b3fc4", { noLine: true, lump: 0.1, order: 22.5 }), upper, [sp[0], sp[1], sp[2]], 0.11);
          });
          for (var tt = 0; tt < 8; tt++) {
            var ta = (tt / 7) * Math.PI;
            put(crayon(cone, "#fffdf0", "#b9b39a", { noLine: true, lump: 0.02, order: 23 }), upper, [Math.cos(ta) * 0.68, -0.08, 0.55 + Math.sin(ta) * 0.68], [0.08, 0.28, 0.08], [Math.PI, 0, 0]);
            put(crayon(cone, "#fffdf0", "#b9b39a", { noLine: true, lump: 0.02, order: 23 }), lower, [Math.cos(ta) * 0.64, 0.08, 0.55 + Math.sin(ta) * 0.64], [0.08, 0.24, 0.08]);
          }
          put(crayon(sphere, "#ff3b6b", "#8f1d3a", { noLine: true, lump: 0.1, order: 23 }), lower, [0, 0.1, 0.65], [0.45, 0.12, 0.4]);
          head.add(upper); head.add(lower); head.position.y = 2.6; pg.add(head);
          pg.userData = { upper: upper, lower: lower, head: head, phase: Math.random() * 6, baseY: GROUND + 0.05 };
          s.plants.push(put(pg, w, [GX + pp[0], GROUND + 0.05, BZ + pp[1]], 0.6 + Math.random() * 0.1));
        });
        // kicker, ring of fire
        put(crayon(box, "#eef4ff", "#8fa3e6", { thick: 0.06, lump: 0.05, ink: INK, order: 24 }), w, [GX - 1.55, topY(GX - 1.55) + 0.18, BZ], [0.7, 0.2, 1.0], [0, 0, 0.25]);
        var ring = new THREE.Group();
        put(crayon(torus, "#4a2c1e", "#1c0f08", { thick: 0.05, lump: 0.03, ink: "#120804", order: 25 }), ring, [0, 0, 0], [1.6, 1.6, 1.1]);
        put(crayon(torus, "#ff7a1a", "#ffd23f", { noLine: true, lump: 0.05, order: 25.5 }), ring, [0, 0, 0], [1.6, 1.6, 0.5]);
        s.flames = [];
        for (var fi = 0; fi < 20; fi++) {
          var fa = (fi / 20) * Math.PI * 2, topf = 0.5 + 0.7 * Math.max(0, Math.sin(fa));
          var fg = new THREE.Group();
          put(crayon(cone, "#e8412c", "#8f1d10", { thick: 0.03, lump: 0.3, order: 26 }), fg, [0, 0.45, 0], [0.3, 0.9, 0.3]);
          put(crayon(cone, "#ff9f1c", "#e8412c", { noLine: true, lump: 0.3, order: 26.3 }), fg, [0, 0.38, 0.02], [0.2, 0.7, 0.2]);
          put(crayon(cone, "#ffe066", "#ffb31a", { noLine: true, lump: 0.3, order: 26.6 }), fg, [0, 0.3, 0.04], [0.11, 0.45, 0.11]);
          fg.userData = { base: topf, phase: Math.random() * 6 };
          put(fg, ring, [Math.cos(fa) * 1.6, Math.sin(fa) * 1.6 + 0.05, 0], topf);
          s.flames.push(fg);
        }
        s.embers = [];
        for (var ei = 0; ei < 16; ei++) {
          var em = put(crayon(sphereLo, ei % 2 ? "#ffb31a" : "#ff5a1f", "#c2410c", { noLine: true, lump: 0.2, order: 27 }), ring, [0, 0, 0], 0.07);
          em.userData = { a: Math.random() * Math.PI * 2, life: Math.random() };
          s.embers.push(em);
        }
        s.ring = put(ring, w, [GX, topY(GX) + 3.1, BZ], null, [0, Math.PI / 2 - 0.85, 0]);
        // where I stop: right in front of the camera, with the mountain and the jump behind me
        s.S = new THREE.Vector3(4.6, GROUND, 3.5);
        s.curveD = new THREE.CatmullRomCurve3([
          new THREE.Vector3(GX + 2.6, topY(GX + 2.6) + 0.12, BZ),
          new THREE.Vector3(6.0, topY(6.0) + 0.12, -6.6),
          new THREE.Vector3(6.7, GROUND + 0.8, -4.4),
          new THREE.Vector3(5.6, GROUND + 0.12, -1.8),
          new THREE.Vector3(3.3, GROUND + 0.12, 0.6),
          new THREE.Vector3(4.6, GROUND + 0.12, 3.5)
        ]);
        // the line I ski, as a function of how far through the run I am
        s.pathAt = function (k, out) {
          var G = GROUND, M = s.main, info = { air: 0, spin: 0, stopTurn: 0, phase: 0, c3: 0 };
          if (k < 0.36) {
            var a = k / 0.36, ae = a * a * (3 - 2 * a);
            var yEnd = topY(-1.8) + 0.05;
            var yy = G + M.H - 1.4 - ae * (G + M.H - 1.4 - yEnd);
            var r = M.R * (G + M.H - yy) / M.H + 0.22;
            var th = -0.5 + ae * 1.7 + Math.sin(a * Math.PI * 4) * 0.38 * (1 - a * 0.6);
            out.set(M.x + Math.sin(th) * r, yy, M.z + Math.cos(th) * r);
          } else if (k < 0.46) {
            var c = (k - 0.36) / 0.10, e = c * c * (3 - 2 * c);
            var rEnd = M.R * (G + M.H - (topY(-1.8) + 0.05)) / M.H + 0.22;
            var x0 = M.x + Math.sin(1.2) * rEnd, z0 = M.z + Math.cos(1.2) * rEnd;
            var xb = x0 + (GX - 2.4 - x0) * e;
            out.set(xb, topY(xb) + 0.12, z0 + (BZ - z0) * e);
            info.phase = 1;
          } else if (k < 0.66) {
            var c2 = (k - 0.46) / 0.20;
            var xx = (GX - 2.4) + c2 * 5.0;
            if (xx < GX - 1.5) info.air = smooth(GX - 2.4, GX - 1.5, xx) * 0.45;
            else if (xx < GX + 2.3) { var u = (xx - (GX - 1.5)) / 3.8; info.air = Math.sin(u * Math.PI) * 2.8 + (1 - u) * 0.45; info.spin = Math.PI * 2 * smooth(0.12, 0.88, u); }
            out.set(xx, topY(Math.min(xx, 7.5)) + 0.12 + info.air, BZ);
            info.phase = 2;
          } else {
            var c3 = (k - 0.66) / 0.34, e3 = 1 - Math.pow(1 - c3, 2.2);
            s.curveD.getPoint(e3, out);
            if (out.z < -5.3 && out.x < 7.6) out.y = Math.max(out.y, topY(out.x) + 0.12);
            info.stopTurn = smooth(0.86, 1.0, c3); info.phase = 3; info.c3 = c3;
          }
          return info;
        };
        // the skier: me
        var me = avatar(28, "#e8412c", "#8f1d10");
        s.gear = [];
        [-1, 1].forEach(function (sd) {
          s.gear.push(put(crayon(box, "#7a4fc9", "#3d2577", { thick: 0.03, lump: 0.02, order: 29 }), me.legs[sd < 0 ? 0 : 1], [0, -0.5, 0.25], [0.08, 0.035, 0.85]));
          s.gear.push(put(crayon(cyl, "#6b7090", "#2b2340", { thick: 0.02, lump: 0.02, order: 29 }), me.hands[sd < 0 ? 0 : 1], [0, -0.6, -0.1], [0.12, 4.2, 0.12], [-0.35, 0, sd * 0.15]));
        });
        s.me = me; s.body = me.body;
        s.skier = put(me.group, w, [0, 6, -6], 0.85);
        s.spray = [];
        for (var i = 0; i < 12; i++) s.spray.push(put(crayon(sphereLo, "#ffffff", "#9db8e8", { thick: 0.03, lump: 0.3, order: 30 }), w, [0, -50, 0], 0.15));
        s.trail = [];
        // home: skis planted upright beside me, and a trail sign for the nav
        // the groomed run: one ribbon of snow that follows my line down the peak, across the shoulder, and out to the camera
        function ribbon(pts, nrms, width, order) {
          var pos = [], nor = [], idx = [];
          for (var i = 0; i < pts.length; i++) {
            var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
            var tg = b.clone().sub(a).normalize(), side = new THREE.Vector3().crossVectors(tg, nrms[i]).normalize();
            var wv = width * (0.85 + 0.15 * Math.sin(i * 0.7));
            var l = pts[i].clone().addScaledVector(side, wv / 2), r = pts[i].clone().addScaledVector(side, -wv / 2);
            pos.push(l.x, l.y, l.z, r.x, r.y, r.z); nor.push(nrms[i].x, nrms[i].y, nrms[i].z, nrms[i].x, nrms[i].y, nrms[i].z);
            if (i > 0) { var q = (i - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
          }
          var geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
          geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
          geo.setIndex(idx);
          var m = crayon(geo, "#ffffff", "#b3c8ea", { noLine: true, lump: 0, over: 0, side: THREE.DoubleSide, order: order });
          w.add(m); return m;
        }

        var planted = new THREE.Group();
        [-1, 1].forEach(function (sd) {
          put(crayon(box, "#7a4fc9", "#3d2577", { thick: 0.03, lump: 0.02, order: 31 }), planted, [sd * 0.13, 0.9, 0], [0.08, 0.95, 0.035], [0, 0, sd * 0.09]);
          put(crayon(cyl, "#6b7090", "#2b2340", { thick: 0.02, lump: 0.02, order: 31 }), planted, [0.35 + sd * 0.08, 0.85, 0.1], [0.035, 0.9, 0.035], [0, 0, -0.22 + sd * 0.1]);
        });
        // the run itself, sampled from the same line I ski
        (function () {
          var up = new THREE.Vector3(0, 1, 0), pts = [], nrms = [];
          for (var kk = 0; kk <= 0.46; kk += 0.004) {
            var q = new THREE.Vector3(); s.pathAt(kk, q);
            var n;
            if (kk < 0.36) { var rad = new THREE.Vector3(q.x - s.main.x, 0, q.z - s.main.z).normalize(); n = rad.multiplyScalar(s.main.H).add(new THREE.Vector3(0, s.main.R, 0)).normalize(); }
            else n = new THREE.Vector3(Math.sin(0.25), Math.cos(0.25), 0);
            pts.push(q.addScaledVector(n, 0.09)); nrms.push(n);
          }
          for (var xk = GX - 2.4; xk <= GX - 1.2; xk += 0.15) { pts.push(new THREE.Vector3(xk, topY(xk) + 0.03, BZ)); nrms.push(new THREE.Vector3(Math.sin(0.25), Math.cos(0.25), 0)); }
          ribbon(pts, nrms, 1.15, 16);
          var p2 = [], n2 = [];
          for (var xl = GX + 1.3; xl <= GX + 2.6; xl += 0.15) { p2.push(new THREE.Vector3(xl, topY(xl) + 0.03, BZ)); n2.push(new THREE.Vector3(Math.sin(0.25), Math.cos(0.25), 0)); }
          for (var e = 0; e <= 1.0001; e += 0.02) { var cp = s.curveD.getPoint(e); var onBench = cp.z < -5.3 && cp.x < 7.6; cp.y = onBench ? topY(cp.x) + 0.03 : Math.max(GROUND + 0.03, cp.y - 0.09); p2.push(cp); n2.push(onBench ? new THREE.Vector3(Math.sin(0.25), Math.cos(0.25), 0) : up.clone()); }
          ribbon(p2, n2, 1.3, 26);
        })();
        // fill the seams: snow drifts where the peak meets the shoulder, and where the shoulder meets the valley
        put(crayon(sphere, "#f4f8ff", "#9db8e8", { thick: 0.08, lump: 0.2, ink: INK, order: 16.5 }), w, [-2.2, GROUND + 0.9, -9.6], [2.6, 1.9, 2.9]);
        put(crayon(sphere, "#f4f8ff", "#9db8e8", { thick: 0.08, lump: 0.2, ink: INK, order: 16.5 }), w, [7.9, GROUND + 0.1, -8.2], [1.9, 0.8, 2.8]);
        put(crayon(sphere, "#f4f8ff", "#9db8e8", { thick: 0.08, lump: 0.2, ink: INK, order: 16.5 }), w, [6.4, GROUND + 0.1, -4.9], [1.7, 0.75, 1.2]);
        s.planted = put(planted, w, [s.S.x + 0.85, GROUND - 0.05, s.S.z - 0.1], 0.001);
        // penguins: the nav, waddling around with little signs
        function penguin(order) {
          var g = new THREE.Group();
          put(crayon(sphere, "#23232e", "#0c0c12", { thick: 0.04, lump: 0.05, order: order }), g, [0, 0.55, 0], [0.42, 0.56, 0.4]);
          put(crayon(sphere, "#f6f4ec", "#b9b6a8", { thick: 0.03, lump: 0.04, order: order }), g, [0, 0.5, 0.2], [0.32, 0.45, 0.24]);
          put(crayon(sphere, "#23232e", "#0c0c12", { thick: 0.04, lump: 0.05, order: order }), g, [0, 1.18, 0], 0.3);
          [-1, 1].forEach(function (sd) {
            put(crayon(sphere, "#ffffff", "#c9ccd6", { noLine: true, lump: 0.02, order: order }), g, [sd * 0.11, 1.24, 0.24], 0.07);
            put(crayon(sphere, "#141414", "#141414", { noLine: true, lump: 0.01, order: order }), g, [sd * 0.11, 1.24, 0.3], 0.035);
            put(crayon(sphere, "#ff9f1c", "#c2410c", { thick: 0.03, lump: 0.05, order: order }), g, [sd * 0.15, 0.03, 0.15], [0.13, 0.05, 0.18]);
          });
          put(crayon(cone, "#ff9f1c", "#c2410c", { thick: 0.03, lump: 0.03, order: order }), g, [0, 1.13, 0.33], [0.08, 0.22, 0.08], [Math.PI / 2, 0, 0]);
          var fl = put(crayon(sphere, "#23232e", "#0c0c12", { thick: 0.03, lump: 0.04, order: order }), g, [-0.42, 0.66, 0], [0.08, 0.32, 0.17], [0, 0, 0.35]);
          var fr = new THREE.Group(); g.add(fr); fr.position.set(0.42, 0.66, 0);
          put(crayon(sphere, "#23232e", "#0c0c12", { thick: 0.03, lump: 0.04, order: order }), fr, [0, 0, 0], [0.08, 0.32, 0.17], [0, 0, -0.35]);
          put(crayon(cyl, "#8a5a3b", "#4a2c1e", { thick: 0.02, lump: 0.02, order: order }), fr, [0.08, 0.45, 0.05], [0.03, 0.8, 0.03]);
          put(crayon(box, "#d9a066", "#8a5a3b", { thick: 0.03, lump: 0.02, ink: INK, order: order }), fr, [0.08, 0.9, 0.06], [0.34, 0.18, 0.03]);
          var tip = new THREE.Object3D(); tip.position.set(0.08, 1.1, 0.1); fr.add(tip);
          return { group: g, fl: fl, fr: fr, tip: tip };
        }
        s.penguins = [];
        s.anchors = [];
        [["about", -3.0, -1.4, 0.9, 1], ["projects", 3.1, -1.6, 0.8, -1], ["monologue", -2.2, 2.2, 0.7, -1]].forEach(function (pp, i) {
          var pg = penguin(33);
          put(pg.group, w, [s.S.x + pp[1], GROUND, s.S.z + pp[2]], 0.001);
          pg.ox = pp[1]; pg.oz = pp[2]; pg.cx = s.S.x + pp[1]; pg.cz = s.S.z + pp[2]; pg.r = pp[3]; pg.dir = pp[4]; pg.phase = i * 1.6;
          s.penguins.push(pg);
          s.anchors.push({ key: pp[0], obj: pg.tip });
        });

        s.focus = new THREE.Vector3();
        s.homeCam = { pos: [s.S.x + 0.3, GROUND + 2.6, s.S.z + 8.2], look: [s.S.x - 0.2, GROUND + 1.6, s.S.z - 3], fov: 48 };
        return s;
      },
      update: function (s, t, info) {
        var G = s.GROUND, GX = s.GX, home = info.home;
        var k = clamp01((progress - 0.02) / 0.96);
        var p = new THREE.Vector3();
        if (k < 0.01) { s.sprayed = false; s.instant = false; }
        var pi = s.pathAt(k, p), air = pi.air, spin = pi.spin, stopTurn = pi.stopTurn;
        if (pi.phase === 3 && pi.c3 > 0.9 && !s.sprayed && info.mode === "intro") { s.sprayed = true; if (info.burst) info.burst(p.clone().add(new THREE.Vector3(0, 0.6, 0.8)), true); if (info.cover) info.cover(); }
        if (info.mode === "home") p.copy(s.S).add(new THREE.Vector3(0, 0.12, 0));
        var prev = s.trail[0] || p.clone().add(new THREE.Vector3(-0.01, 0.01, 0));
        var dir = p.clone().sub(prev);
        s.skier.rotation.order = "YXZ";
        if (dir.lengthSq() > 1e-6) {
          var yaw = Math.atan2(dir.x, dir.z);
          var turn = s.lastYaw == null ? 0 : Math.atan2(Math.sin(yaw - s.lastYaw), Math.cos(yaw - s.lastYaw));
          s.lastYaw = yaw;
          var pitch = Math.atan2(-dir.y, Math.hypot(dir.x, dir.z));
          s.runRot = [Math.max(-0.6, Math.min(0.6, pitch)) * 0.7, yaw * (1 - stopTurn) + (Math.PI / 2) * stopTurn + spin, Math.max(-0.55, Math.min(0.55, -turn * 14)) * (1 - stopTurn) + stopTurn * 0.35];
        }
        var rr = s.runRot || [0, 0, 0];
        var hy = -0.15;
        s.skier.rotation.set(rr[0] * (1 - home), rr[1] * (1 - home) + hy * home, rr[2] * (1 - home) + 0.06 * home);
        s.skier.position.copy(p);
        s.me.head.rotation.y = -s.skier.rotation.y * 0.75 * (1 - home) + 0.15 * home;
        s.body.rotation.x = ((air > 0.5 ? 0.5 : 0.25) + Math.sin(t * 2) * 0.03) * (1 - home) + 0.05 * home;
        var lh = s.me.hands[0], rh = s.me.hands[1];
        if (home > 0) {
          lh.position.set(-0.7, 0.78 + (0.5 + Math.sin(t * 7) * 0.12) * home, 0.1);
          rh.position.set(0.7, 0.95, 0.06);
        } else {
          lh.position.set(-0.62, 0.78 + (air > 0.5 ? 0.45 : 0), 0.06);
          rh.position.set(0.62, 0.78 + (air > 0.5 ? 0.45 : 0), 0.06);
        }
        s.gear.forEach(function (gm) { gm.visible = home < 0.5; });
        s.planted.scale.setScalar(Math.max(0.001, home));
        // penguins waddle in from the sides once I'm posted
        s.penguins.forEach(function (pg, i) {
          var a = t * 0.5 * pg.dir + pg.phase;
          var spread = Math.min(1, (info.aspect || 1.6) * 1.55);
          pg.cx = s.S.x + pg.ox * spread; pg.cz = s.S.z + pg.oz * (spread < 1 ? 1.25 : 1);
          var show = s.instant ? Math.max(0.001, home) : smooth(0, 1, ((info.homeT || 0) - 1.6 - i * 0.55) / 0.9);
          var hop = show < 1 ? Math.sin(show * Math.PI) * 0.6 : 0;
          var x = pg.cx + Math.cos(a) * pg.r * show, z = pg.cz + Math.sin(a) * pg.r * 0.6 * show;
          pg.group.position.set(x, G - (1 - show) * 1.2 + hop + Math.abs(Math.sin(t * 7 + i)) * 0.05 * show, z);
          pg.tip.userData.vis = show;
          pg.group.rotation.set(0, Math.atan2(-Math.sin(a) * pg.dir, Math.cos(a) * pg.dir * 0.6) * 0.5 + 0.2 * Math.sin(a), Math.sin(t * 7 + i) * 0.14);
          pg.fl.rotation.z = 0.35 + Math.sin(t * 9 + i) * 0.4;
          pg.fr.rotation.z = Math.sin(t * 3 + i) * 0.12;
          pg.group.scale.setScalar(Math.max(0.001, show) * 0.9);
        });
        if (dir.lengthSq() > 1e-6) { s.trail.unshift(p.clone()); if (s.trail.length > 24) s.trail.pop(); }
        s.spray.forEach(function (sb, i) {
          var q = s.trail[Math.min(s.trail.length - 1, i * 2)];
          if (!q || air > 0.2 || s.trail.length < 3 || home > 0) { sb.position.y = -50; return; }
          sb.position.set(q.x + Math.sin(i * 7.1 + t * 9) * 0.35, q.y + 0.1 + (i % 3) * 0.14, q.z + Math.cos(i * 3.3 + t * 7) * 0.35);
          sb.scale.setScalar(0.09 + (12 - i) * 0.014);
        });
        s.flames.forEach(function (f, i) {
          var d = f.userData, fk = 0.8 + 0.35 * Math.abs(Math.sin(t * 8 + d.phase)) + 0.15 * Math.sin(t * 13 + i);
          f.scale.set(d.base * (0.9 + 0.1 * Math.sin(t * 11 + i)), d.base * fk, d.base);
          f.rotation.z = Math.sin(t * 5 + d.phase) * 0.12;
        });
        s.embers.forEach(function (em) {
          var d = em.userData; d.life += 0.012; if (d.life > 1) { d.life = 0; d.a = Math.random() * Math.PI * 2; }
          em.position.set(Math.cos(d.a) * 1.6 + Math.sin(d.life * 9 + d.a) * 0.15, Math.sin(d.a) * 1.6 + d.life * 2.4, 0);
          em.scale.setScalar(0.08 * (1 - d.life));
        });
        s.lava.forEach(function (l, i) { l.scale.y = 0.04 * (0.8 + 0.4 * Math.abs(Math.sin(t * 2 + i))); });
        s.smoke.forEach(function (sm) { sm.position.y += 0.014; if (sm.position.y > s.smokeBase + 5) sm.position.y = s.smokeBase; var h = (sm.position.y - s.smokeBase) / 5; sm.scale.setScalar(0.15 + h * 0.55); });
        var near = (k >= 0.46 && k < 0.7) ? 1 - smooth(0.8, 5.0, Math.abs(p.x - GX)) : 0;
        var rising = smooth(0.36, 0.5, k);
        s.plants.forEach(function (pg) {
          var d = pg.userData, sp = 3 + near * 10;
          var open = 0.2 + 0.65 * Math.abs(Math.sin(t * sp * 0.5 + d.phase));
          d.upper.rotation.x = -open; d.lower.rotation.x = open * 0.55;
          pg.position.y = d.baseY - (1 - rising) * 2.0 + near * 0.7 * Math.abs(Math.sin(t * 5 + d.phase));
          pg.rotation.z = Math.sin(t * 1.1 + d.phase) * 0.1;
          d.head.rotation.y = Math.atan2(p.x - pg.position.x, p.z - pg.position.z);
          d.head.rotation.x = -0.25 - near * 0.6;
        });
        s.sun.rotation.z = t * 0.05;
        s.clouds[0].position.x = -14 + Math.sin(t * 0.15) * 1.2;
        s.clouds[1].position.x = 9 + Math.sin(t * 0.12 + 2) * 1.0;
        s.focus.copy(p);
      },
      introEnd: 13,
      navText: { about: "● about", projects: "■ projects", monologue: "◆ monologue" },
      cam: { walk: [2, -2.2, -4], look: [-3, 0, -12], lookWalk: [6, -2.0, 10], yaw: -0.04, orbit: 0.04, follow: 0.55 }
    };

    var current = null, state = null, t0 = performance.now();
    function loadScene(name) {
      if (!SCENES[name]) name = "space";
      world.traverse(function (o) { if (o.material && o.material.dispose) o.material.dispose(); });
      while (world.children.length) world.remove(world.children[0]);
      current = SCENES[name];
      state = current.build(world);
      t0 = started ? performance.now() : Infinity;
      shared.uReveal.value = reduce ? 1 : 0;
      root.classList.toggle("night", name === "space");
      flip.textContent = name === "space" ? "go skiing ☀" : "go to space ☾";
      progress = 0;
      var navEls = document.querySelectorAll("#worldnav a");
      navEls.forEach(function (a) {
        var key = a.getAttribute("data-key"), label = (current.navText && current.navText[key]) || key;
        var sym = label.replace(key, "").trim(), first = label.indexOf(key) > 0;
        a.innerHTML = "";
        var sp = document.createElement("span"); sp.setAttribute("aria-hidden", "true"); sp.textContent = sym;
        var tx = document.createTextNode(key);
        if (first) { a.appendChild(sp); a.appendChild(document.createTextNode(" ")); a.appendChild(tx); }
        else { a.appendChild(tx); a.appendChild(document.createTextNode(" ")); a.appendChild(sp); }
      });
      canvas.setAttribute("aria-label", name === "space"
        ? "A crayon drawing in space: Ticus floats in an astronaut suit until a UFO flies by and beams him up. Links orbit around him."
        : "A crayon drawing of a ski run: Ticus carves down a blue mountain, spins through a ring of fire over a lava crevasse, and stops by the camera. Penguins hold the links.");
      if (started) startIntro(); else { mode = "gate"; replayScrawls(); }
    }
    var navShown = false;
    canDraw = function () { return mode === "home"; };
    var live = byId("live");
    function announce() { if (live) live.textContent = currentName === "space" ? "Beamed up. Links are orbiting you." : "Landed. Penguins have the links."; }
    var mode = "gate", started = false, introAt = 0, homeAt = 0, INTRO_END = 10.5, loadAt = performance.now();
    var gateEl = byId("gate"), navEl = byId("worldnav"), replayEl = byId("replay");
    function startIntro() {
      started = true; mode = "intro"; introAt = performance.now(); t0 = introAt;
      if (reduce) { mode = "home"; homeAt = introAt - 5000; replayEl.hidden = false; }
      if (state) state.k = null;
      gateEl.hidden = true; replayEl.hidden = true; navEl.classList.remove("show"); hint.classList.remove("show");
      replayScrawls();
    }
    listen(byId("start"), "click", startIntro);
    listen(replayEl, "click", function () { loadScene(currentName); });
    // the theme picks the world: light = ski run, dark = space. The button overrides and is remembered.
    var flip = byId("flip");
    var currentName = null;
    function themeWorld() {
      var dt = document.documentElement.getAttribute("data-theme");
      if (dt) return dt === "dark" ? "space" : "ski";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "space" : "ski";
    }
    function go(name, remember) {
      if (remember) { try { localStorage.setItem("world", name); } catch (e) {} }
      currentName = name;
      loadScene(name);
    }
    listen(flip, "click", function () { go(currentName === "space" ? "ski" : "space", true); });
    function followTheme() {
      var forced = null;
      try { forced = localStorage.getItem("world"); } catch (e) {}
      if (forced) return;
      var want = themeWorld();
      if (want !== currentName) go(want, false);
    }
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) listen(mq, "change", followTheme);
    }
    var VIEW_H = 15;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      shared.uRes.value.set(w, h);
      camera.aspect = w / h;
      VIEW_H = camera.aspect < 1 ? 15 / camera.aspect * 0.75 : 15;
    }
    listen(window, "resize", resize);
    resize();
    (function () {
      var forced = null;
      try { forced = localStorage.getItem("world"); } catch (e) {}
      go(forced === "space" || forced === "ski" ? forced : themeWorld(), false);
    })();

    var DRAW_DELAY = 400, DRAW_MS = 4200, lookV = new THREE.Vector3();
    var bite = 0, lastNow = performance.now(), edgePush = { x: 0, y: 0 };
    // powder: snow bursting onto the screen when I stop
    var powder = [], powderAt = -1e9;
    function burst(worldPos, big) {
      var v = worldPos.clone().applyMatrix4(world.matrixWorld).project(camera);
      var cx = (v.x + 1) / 2 * window.innerWidth, cy = (1 - v.y) / 2 * window.innerHeight;
      if (big) {
        // white-out: snow slams the lens, a solid wall of it, so the cut behind it can't be seen
        cx = window.innerWidth / 2; cy = window.innerHeight * 0.75;
        dx.save(); dx.fillStyle = "#f6f9ff";
        for (var wy = 0; wy < 2600; wy++) { dx.globalAlpha = 0.5 + Math.random() * 0.5; var rx = Math.random() * window.innerWidth, ry = Math.random() * window.innerHeight; dx.fillRect(rx, ry, 18 + Math.random() * 40, 10 + Math.random() * 26); }
        dx.restore();
        for (var w2 = 0; w2 < 1100; w2++) {
          var a2 = -Math.PI + Math.random() * Math.PI, sp2 = 6 + Math.random() * 26;
          powder.push({ x: cx + (Math.random() - 0.5) * 200, y: cy, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2 * 1.2, r: 6 + Math.random() * 16, life: 0, max: 26 + Math.random() * 30, c: ["#ffffff", "#f4f8ff", "#e6effb", "#d3e3f6"][w2 % 4] });
        }
        powderAt = performance.now() + 500;
        return;
      }
      for (var i = 0; i < 260; i++) {
        var a = -Math.PI * 0.95 + Math.random() * Math.PI * 1.3, sp = 4 + Math.random() * 16;
        powder.push({ x: cx, y: cy, vx: Math.cos(a) * sp + 4, vy: Math.sin(a) * sp - 3, r: 2 + Math.random() * 5, life: 0, max: 30 + Math.random() * 30, c: ["#ffffff", "#eef4ff", "#d9e8fb", "#c4d8f2"][i % 4] });
      }
      powderAt = performance.now();
    }
    function drawPowder() {
      for (var i = powder.length - 1; i >= 0; i--) {
        var q = powder[i];
        q.x += q.vx; q.y += q.vy; q.vy += 0.25; q.vx *= 0.97; q.r *= 1.035; q.life++;
        dx.fillStyle = q.c;
        var nd = Math.min(18, 4 + q.r * 0.6);
        for (var j = 0; j < nd; j++) { dx.globalAlpha = 0.55 + Math.random() * 0.4; var aa = Math.random() * 6.28, rr = Math.random() * q.r; dx.fillRect(q.x + Math.cos(aa) * rr, q.y + Math.sin(aa) * rr, 2.6, 2.6); }
        if (q.life > q.max) powder.splice(i, 1);
      }
      dx.globalAlpha = 1;
      if (performance.now() - powderAt > 900 && performance.now() - powderAt < 5500) {
        dx.save(); dx.setTransform(1, 0, 0, 1, 0, 0); dx.globalCompositeOperation = "destination-out"; dx.fillStyle = "rgba(0,0,0,0.05)"; dx.fillRect(0, 0, dc.width, dc.height); dx.restore();
      }
    }
    var projV = new THREE.Vector3();
    // jump-cut to home while the screen is full of snow
    function coverCut() {
      later(function () {
        if (mode !== "intro") return;
        if (state) state.instant = true;
        mode = "home"; homeAt = performance.now() - 2000; replayEl.hidden = false; announce();
      }, 380);
    }
    var slowFrames = 0, frameCount = 0;
    function adapt(dtMs) {
      frameCount++;
      if (frameCount < 90) return;
      slowFrames = dtMs > 26 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 45 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); shared.uDpr.value = dpr; resize(); slowFrames = 0;
      }
    }
    function frame() {
      var now = performance.now();
      var t = (now - loadAt) / 1000;
      var dtMs = Math.min(100, now - lastNow); lastNow = now;
      if (!document.hidden) adapt(dtMs);
      var T = mode === "gate" ? 0 : (now - introAt) / 1000;
      if (mode === "intro") {
        var END = current.introEnd || INTRO_END;
        progress = clamp01((T - 4.4) / (END - 4.4));
        if (T >= END + 0.8) { mode = "home"; homeAt = now; replayEl.hidden = false; announce(); }
      } else progress = mode === "home" ? 1 : 0;
      var homeBlend = mode === "home" ? (state && state.instant ? 1 : smooth(0, 1, (now - homeAt) / 1600)) : 0;
      root.classList.toggle("home", mode === "home");
      var navOn = homeBlend > 0.6;
      if (navOn !== navShown) { navShown = navOn; navEl.classList.toggle("show", navOn); navEl.toggleAttribute("inert", !navOn); showTunes(navOn); }
      hint.classList.toggle("show", mode === "home" && now - homeAt > 3500 && bite < 0.2);
      if (ready) scrawls.forEach(function (sc) { sc.el.classList.toggle("on", mode !== "home" && progress >= sc.from && progress < sc.to); });
      shared.uTime.value = reduce ? 0 : now / 1000;
      if (!reduce) shared.uReveal.value = clamp01((now - t0 - DRAW_DELAY) / DRAW_MS);

      var c = current.cam;
      var wake = smooth(0.06, 0.42, progress);
      var walk = smooth(0.42, 1.0, progress);
      var fov = 8 + wake * 44;
      var dist = (VIEW_H / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
      camera.fov = fov;
      camera.position.set(c.walk[0] * walk, 0.4 + c.walk[1] * walk, dist + c.walk[2] * walk);
      camera.near = 0.1; camera.far = dist + 700;
      var sway = reduce ? 0 : Math.sin(now / 1000 * 0.3) * 0.08;
      pointer.x += (pointerTarget.x - pointer.x) * 0.05;
      pointer.y += (pointerTarget.y - pointer.y) * 0.05;
      world.rotation.y = c.yaw * wake + walk * c.orbit + sway * 0.5 * wake;
      world.rotation.x = 0;
      // look too far toward the edge of the world and the simulation breaks; let go and it snaps back
      look.yaw += (look.tx * 1.25 - look.yaw) * (reduce ? 1 : 0.06);
      look.pitch += (look.ty * 0.55 - look.pitch) * (reduce ? 1 : 0.06);
      // push the cursor to an edge and a round bite of code opens there: the end of the simulation.
      // hold it at the very edge and the bite keeps growing until the whole thing breaks and redraws.
      var on = mode === "gate" ? 0 : 1;
      var pxT = Math.sign(look.tx) * smooth(0.55, 1.0, Math.abs(look.tx)) * on;
      var pyT = -Math.sign(look.ty) * smooth(0.6, 1.0, Math.abs(look.ty)) * on;
      edgePush.x += (pxT - edgePush.x) * (reduce ? 1 : 0.08);
      edgePush.y += (pyT - edgePush.y) * (reduce ? 1 : 0.08);
      bite = Math.max(Math.abs(edgePush.x), Math.abs(edgePush.y));
      var g = 0;
      shared.uVig.value = 0;
      shared.uCursor.value.set(edgePush.x, edgePush.y);
      shared.uBite.value = 0;
      shared.uGlitch.value = g;
      root.style.setProperty("--g", g.toFixed(3));
      var shake = g;
      if (shake > 0 && !reduce && Math.random() < 0.35) world.position.set(jitter(shake * 0.5), jitter(shake * 0.25), 0); else world.position.set(0, 0, 0);
      canvas.style.filter = shake > 0.05 ? "drop-shadow(" + (3 * shake).toFixed(1) + "px 0 0 rgba(255,0,90,0.7)) drop-shadow(" + (-3 * shake).toFixed(1) + "px 0 0 rgba(0,255,200,0.7))" : "";
      world.updateMatrixWorld();
      shared.uWorldInv.value.copy(world.matrixWorld).invert();

      lookV.set(c.look[0] + c.lookWalk[0] * walk, c.look[1] + c.lookWalk[1] * walk, c.look[2] + c.lookWalk[2] * walk);
      if (c.follow && state.focus) {
        var f = state.focus.clone().applyMatrix4(world.matrixWorld);
        lookV.lerp(f, c.follow * walk);
        camera.position.x += (f.x - camera.position.x) * 0.5 * c.follow * walk;
        camera.position.y += (f.y + 2.5 - camera.position.y) * 0.5 * c.follow * walk;
      }
      if (homeBlend > 0 && state.homeCam) {
        var hc = state.homeCam;
        var hp = new THREE.Vector3(hc.pos[0], hc.pos[1], hc.pos[2]).applyMatrix4(world.matrixWorld);
        var hl = new THREE.Vector3(hc.look[0], hc.look[1], hc.look[2]).applyMatrix4(world.matrixWorld);
        camera.position.lerp(hp, homeBlend);
        lookV.lerp(hl, homeBlend);
        var hfov = camera.aspect < 1 ? Math.min(82, hc.fov * (1.25 / camera.aspect)) : hc.fov;
        camera.fov = camera.fov + (hfov - camera.fov) * homeBlend;
      }
      camera.lookAt(lookV);
      shared.uHomeDir.value.copy(lookV).sub(camera.position).normalize();
      var hv = THREE.MathUtils.degToRad(camera.fov / 2);
      shared.uHalfFov.value.set(Math.atan(Math.tan(hv) * camera.aspect), hv);
      // the mouse can only turn your head a little past the frame, so the code shows as a margin
      camera.rotateY(-(look.yaw / 1.25) * shared.uHalfFov.value.x * 0.18);
      camera.rotateX(-(look.pitch / 0.55) * hv * 0.18);
      camera.updateProjectionMatrix();

      current.update(state, reduce ? 0 : t, { cover: coverCut, T: T, mode: mode, home: homeBlend, homeT: mode === "home" ? (reduce ? 99 : (now - homeAt) / 1000) : 0, burst: reduce ? null : burst, aspect: camera.aspect });
      if (!reduce) { fadeDoodles(); drawPowder(); }
      renderer.render(scene, camera);
      if (state.anchors) {
        state.anchors.forEach(function (n, i) {
          var el = navEl.querySelector('[data-key="' + n.key + '"]');
          if (!el) return;
          n.obj.getWorldPosition(projV); projV.project(camera);
          el.style.left = ((projV.x + 1) / 2 * window.innerWidth).toFixed(1) + "px";
          el.style.top = ((1 - projV.y) / 2 * window.innerHeight).toFixed(1) + "px";
          var vis = n.obj.userData.vis == null ? 1 : n.obj.userData.vis;
          el.style.opacity = vis.toFixed(2);
          el.style.visibility = projV.z < 1 && vis > 0.05 ? "visible" : "hidden";
        });
      }
      if (alive) rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    cleanups.push(function () { cancelAnimationFrame(rafId); world.traverse(function (o) { if (o.material && o.material.dispose) o.material.dispose(); if (o.geometry && o.geometry.dispose) o.geometry.dispose(); }); faceTex.dispose(); renderer.dispose(); });
  }

  cleanups.push(function () { clearInterval(wobbleTimer); });
  return function unmount() {
    alive = false;
    cleanups.forEach(function (fn) { try { fn(); } catch (e) { /* already gone */ } });
    document.documentElement.classList.remove("crayon-lock");
    root.classList.remove("home", "night");
  };
}
