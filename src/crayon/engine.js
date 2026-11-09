/*
 * The crayon world: ticusb.com's home page.
 *
 * A self-contained three.js scene drawn to look like crayon: a click-to-start gate, a short intro
 * (a ski run, or a UFO abduction in space), then a home scene whose nav lives in the world.
 * React mounts it into a container that already holds the static markup (markup.js) and calls the
 * returned function on unmount. Everything it adds (listeners, timers, the GPU context) is torn down there.
 *
 * This file is the conductor: the gate, the intro clock, home and the in-world sections, and the render
 * loop. The look lives in shaders.js + materials.js, the worlds in worlds/, me in avatar.js, the camera
 * in camera.js, and the HTML bits (doodles, powder, music line, panel) in ui/.
 */
/* eslint-disable no-redeclare, no-loop-func */
import * as THREE from "three";
import projectData from "../data/projects";
import THOUGHTS from "../data/monologue";
import { clamp01, smooth } from "./util";
import { createKit } from "./materials";
import { createProps } from "./props";
import { createAvatar } from "./avatar";
import { createSpace } from "./worlds/space";
import { createSki } from "./worlds/ski";
import { createRig, fitFov } from "./camera";
import { createDoodle } from "./ui/doodle";
import { createTunes } from "./ui/tunes";
import { createPowder } from "./ui/powder";
import { createPanel, el } from "./ui/panel";

const PROJECTS = projectData.filter(function (p) { return !p.draft; });

const FACE_URL = (process.env.PUBLIC_URL || "") + "/crayon/face.png";

// dailies: in dev, or with ?dailies in the URL, the intro can start at a beat (?beat=jump) and the beat
// timings are published on window.__beats for tools/dailies/film.mjs to mark on its timeline
function dailiesParams() {
  var q = new URLSearchParams(window.location.search);
  return { on: process.env.NODE_ENV !== "production" || q.has("dailies"), beat: q.get("beat") };
}

// opts.section ("about" | "projects" | "monologue") and opts.project (a slug) deep-link straight into a section
export function mountCrayonWorld(root, opts) {
  opts = opts || {};
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
  byId("panel").hidden = true;
  byId("picks").hidden = true;
  byId("rec-form").hidden = true;
  byId("worldnav").classList.remove("show", "static");
  byId("worldnav").setAttribute("inert", "");
  root.classList.remove("home", "night");
  root.querySelectorAll(".scrawl.on").forEach(function (el) { el.classList.remove("on"); });
  root.querySelectorAll(".fallback").forEach(function (el) { el.remove(); });

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* boiling SVG lines */
  var wobble = byId("wobble");
  if (!reduce && wobble) {
    var seeds = [2, 6, 11], si = 0;
    // only while the gate is up: every change re-filters everything drawn with it
    wobbleTimer = setInterval(function () { if (byId("gate").hidden) return; si = (si + 1) % seeds.length; wobble.setAttribute("seed", String(seeds[si])); }, 240);
  }

  /* intro progress + the scrawled taglines */
  var progress = 0;
  var hint = byId("hint");
  // the taglines are the gate's title card: written while you decide to click, cleared as the drawing starts
  // [from, to] in intro seconds; a negative start means up on the gate. A world can override with `tags`.
  var TAGS = { "s-hello": [-1, 0.35], "s-day": [-1, 0.35], "s-night": [-1, 0.35] };
  var scrawls = [byId("s-hello"), byId("s-day"), byId("s-night")].map(function (el) { return { el: el }; });
  var ready = false;
  function replayScrawls() {
    ready = false;
    scrawls.forEach(function (s) { s.el.classList.remove("on"); });
    later(function () { ready = true; }, reduce ? 0 : 600);
  }
  replayScrawls();

  var doodle = createDoodle(byId, listen, hint);
  var dc = doodle.dc, dx = doodle.dx, look = doodle.look, fadeDoodles = doodle.fadeDoodles;
  var showTunes = createTunes(byId, listen, function () { return alive; }, function (fn) { cleanups.push(fn); });


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
      uReveal: { value: reduce ? 1 : 0 }, uHalfFov: { value: new THREE.Vector2(0.1, 0.07) }, uCursor: { value: new THREE.Vector2(0, 0) }, uHit: { value: new THREE.Vector3(0, 0, 0) }, uSim: { value: 0 }
    };

    var kit = createKit(shared, coarse);
    var faceTex = new THREE.TextureLoader().load(FACE_URL);
    kit.avatar = createAvatar(kit, shared, faceTex);
    kit.props = createProps(kit);
    kit.PROJECTS = PROJECTS;
    var SCENES = { space: createSpace(kit), ski: createSki(kit) };
    var rig = createRig(camera, world, shared);


    var current = null, state = null, t0 = performance.now();
    // the intro as beats: [{ name, start, dur, blend }]; worlds without beats still run on `progress`
    var beatTable = null, beatByName = {}, introLen = 0;
    var DAILIES = dailiesParams(), scrubbed = false;
    function buildBeats() {
      beatTable = null; beatByName = {}; introLen = 0;
      if (!current.beats) return;
      var acc = 0;
      beatTable = current.beats.map(function (b) { var o = { name: b.name, start: acc, dur: b.dur, blend: b.blend || 0 }; acc += b.dur; beatByName[b.name] = o; return o; });
      introLen = acc;
    }
    if (DAILIES.on) {
      // perf probe for tools/dailies/perf.mjs: what the last frame cost the GPU
      window.__gl = function () { var r = renderer.info.render; return { calls: r.calls, triangles: r.triangles, dpr: dpr, programs: renderer.info.programs ? renderer.info.programs.length : 0, geometries: renderer.info.memory.geometries }; };
      window.__scene = scene;
      cleanups.push(function () { delete window.__gl; delete window.__scene; });
      window.__beats = function () { return beatTable ? beatTable.map(function (b) { return { name: b.name, at: introAt / 1000 + b.start }; }) : []; };
      cleanups.push(function () { delete window.__beats; });
    }
    // 0 before the beat, 0..1 during it, 1 after; everything is 1 once home
    function beatP(name, T) {
      if (mode === "home") return 1;
      if (mode === "gate") return 0;
      var b = beatByName[name];
      return b ? clamp01((T - b.start) / b.dur) : 0;
    }
    function fitted(p) { return { pos: p.pos, look: p.look, fov: p.framed ? p.fov : fitFov(p.fov, camera.aspect), framed: true }; }
    // the camera for intro time T: the current beat's shot, eased in from where the last shot ended
    function shotPose(T, info) {
      var i = 0;
      while (i < beatTable.length - 1 && T >= beatTable[i + 1].start) i++;
      var b = beatTable[i];
      var pose = fitted(current.shots[b.name](state, clamp01((T - b.start) / b.dur), info));
      if (i > 0 && b.blend > 0 && T - b.start < b.blend) {
        var prev = fitted(current.shots[beatTable[i - 1].name](state, 1, info)), w = smooth(0, 1, (T - b.start) / b.blend);
        pose = { pos: prev.pos.clone().lerp(pose.pos, w), look: prev.look.clone().lerp(pose.look, w), fov: prev.fov + (pose.fov - prev.fov) * w, framed: true };
      }
      return pose;
    }
    function loadScene(name) {
      if (!SCENES[name]) name = "space";
      world.traverse(function (o) { if (o.material && o.material.dispose) o.material.dispose(); });
      while (world.children.length) world.remove(world.children[0]);
      current = SCENES[name];
      state = current.build(world);
      kit.flushBakes();
      // the hero is drawn even before the world is (uKeep), first as the unrendered sim
      if (state.hero) state.hero.traverse(function (o) { if (o.material && o.material.uniforms && o.material.uniforms.uKeep) o.material.uniforms.uKeep.value = 1; });
      simFrom = null; heroAnchor = null;
      if (thinLines) thinOutlines();
      buildBeats();
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
      section = null; selected = null; sectionBlend = 0; panelEl.hidden = true; picksEl.hidden = true;
      buildPicks();
      if (started) startIntro(false); else { mode = "gate"; replayScrawls(); }
    }
    var navShown = false;
    // sections: about and projects open inside the world instead of leaving the page
    var lastSectionKey = null;
    var section = null, selected = null, sectionBlend = 0, lastSectionCam = null, sectionAt = 0, sectionLeftAt = 0, blendFrom = 0, sectionMs = 1500;
    var picksEl = byId("picks");
    var panel = createPanel(byId, PROJECTS, function (slug) { openProject(slug); }, THOUGHTS);
    var panelEl = panel.el, panelBack = panel.back;
    function aboutPanel() { panel.about(); }
    function projectsPanel() { panel.projects(currentName); }
    function openProject(slug) { if (panel.project(slug)) selected = slug; }
    // monologue: the camera pushes into my face, an ink blot opens out of it, and behind it is the void
    // inside my head (void.js). Coming back out runs the other way.
    var wipeEl = byId("void-wipe"), inVoid = false, faceCamSaved = null, faceV = new THREE.Vector3();
    function faceCam() {
      state.face.getWorldPosition(faceV);
      var pos = faceV.clone().addScaledVector(camera.position.clone().sub(faceV).normalize(), 0.75);
      var lp = world.worldToLocal(pos), lf = world.worldToLocal(faceV.clone());
      return { pos: [lp.x, lp.y, lp.z], look: [lf.x, lf.y, lf.z], fov: 34 };
    }
    function wipe(on) {
      if (reduce) return;
      if (on) {
        state.face.getWorldPosition(faceV); faceV.project(camera);
        wipeEl.style.setProperty("--x", ((faceV.x + 1) / 2 * 100).toFixed(1) + "%");
        wipeEl.style.setProperty("--y", ((1 - faceV.y) / 2 * 100).toFixed(1) + "%");
        wipeEl.classList.remove("out"); wipeEl.classList.add("in");
      } else {
        wipeEl.classList.add("out");
        later(function () { if (wipeEl.classList.contains("out")) wipeEl.classList.remove("in", "out"); }, 500);
      }
    }
    function enterVoid() {
      if (section !== "monologue") return;
      inVoid = true; lastSectionCam = state.void.cam; blendFrom = 1; sectionAt = performance.now() - 1e6;
      panelBack.textContent = "\u2190 back out";
      panel.monologue();
      later(function () { wipe(false); }, 80);
    }
    function openSection(key) {
      if (!state.sections || !state.sections[key]) return false;
      blendFrom = sectionBlend; sectionAt = performance.now(); sectionMs = 1500;
      section = key; selected = null; lastSectionCam = state.sections[key].cam; lastSectionKey = key;
      navEl.classList.remove("show"); navEl.setAttribute("inert", ""); navShown = false;
      showTunes(false); hint.classList.remove("show"); replayEl.hidden = true;
      panelBack.textContent = "\u2190 back home";
      picksEl.hidden = key !== "projects";
      if (key === "monologue") {
        panelEl.hidden = true;
        faceCamSaved = lastSectionCam = faceCam(); sectionMs = 900;
        if (reduce) enterVoid();
        else { later(function () { if (section === "monologue") wipe(true); }, 720); later(enterVoid, 1100); }
        if (live) live.textContent = "Monologue. You're inside my head.";
        return true;
      }
      if (key === "about") aboutPanel(); else projectsPanel();
      if (live) live.textContent = key === "about" ? "About." : "Projects. Pick one from the list.";
      return true;
    }
    function closeSection() {
      // out of the void: blot over, cut back to my face, then pull out to home
      if (section === "monologue" && inVoid && !reduce && !wipeEl.classList.contains("in")) {
        panelEl.hidden = true; wipe(true);
        later(function () { inVoid = false; lastSectionCam = faceCamSaved; blendFrom = 1; leaveSection(); wipe(false); }, 380);
        return;
      }
      if (section === "monologue") { inVoid = false; lastSectionCam = faceCamSaved || lastSectionCam; }
      blendFrom = sectionBlend; leaveSection();
    }
    function leaveSection() {
      // a deep link (#/about) shouldn't reopen the section on refresh once you've left it
      if (window.location.hash && window.location.hash !== "#/") window.history.replaceState(null, "", "#/");
      sectionLeftAt = performance.now();
      section = null; selected = null; panelEl.hidden = true; picksEl.hidden = true; replayEl.hidden = false;
      navShown = false;
      var first = navEl.querySelector("a"); if (first) setTimeout(function () { if (alive && first) first.focus({ preventScroll: true }); }, 50);
    }
    listen(panelBack, "click", function () { if (selected) { selected = null; projectsPanel(); panelBack.textContent = "\u2190 back home"; } else closeSection(); });
    listen(byId("worldnav"), "click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-key]");
      if (!a) return;
      var key = a.getAttribute("data-key");
      if ((key === "about" || key === "projects" || key === "monologue") && openSection(key)) e.preventDefault();
    });
    listen(window, "keydown", function (e) {
      if (e.key !== "Escape" || !section) return;
      if (selected) { selected = null; projectsPanel(); panelBack.textContent = "\u2190 back home"; } else closeSection();
    });
    // click a sculpture or constellation in the world itself
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    listen(dc, "click", function (e) {
      if (section !== "projects" || !state.picks) return;
      ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var hit = ray.intersectObjects(state.picks.map(function (pk) { return pk.group; }), true)[0];
      if (!hit) return;
      for (var o = hit.object; o; o = o.parent) { var pk = state.picks.find(function (x) { return x.group === o; }); if (pk) { openProject(pk.slug); return; } }
    });
    function buildPicks() {
      picksEl.textContent = "";
      (state.picks || []).forEach(function (pk) {
        var p = PROJECTS.find(function (x) { return x.slug === pk.slug; });
        var b = el("button", "pick", p ? p.name : pk.slug); b.type = "button"; b.tabIndex = -1; b.setAttribute("aria-hidden", "true");
        b.addEventListener("click", function () { openProject(pk.slug); });
        pk.label = b; picksEl.appendChild(b);
      });
    }
    doodle.setCanDraw(function () { return mode === "home" && !section; });
    var live = byId("live");
    function announce() { if (live) live.textContent = currentName === "space" ? "Beamed up. Links are orbiting you." : "Landed. Penguins have the links."; }
    var mode = "gate", started = false, introAt = 0, homeAt = 0, INTRO_END = 10.5, loadAt = performance.now();
    var gateEl = byId("gate"), navEl = byId("worldnav"), replayEl = byId("replay");
    function markSeen() { try { localStorage.setItem("crayonSeen", "1"); } catch (e) { /* private mode */ } }
    // "preparing the sim": on the gate I float on the old dot grid, unrendered. Clicking the crayon renders me
    // (uSim 1 -> 0) and flies me from the gate to my spot while the world draws itself around me.
    var cometWasIn = false, lastComet = new THREE.Vector3(), hitAt = -1e9;
    var simFrom = null, heroAnchor = null, heroAt = new THREE.Vector3(), anchorV = new THREE.Vector3(), rayV = new THREE.Vector3(), fwdV = new THREE.Vector3();
    function gateAnchor() {
      var portrait = camera.aspect < 1, H = 2.3 * state.hero.scale.y;
      // landscape: the clear lower-left, under the title card; portrait: between the card and the crayon
      var frac = portrait ? 0.16 : 0.34, nx = portrait ? 0 : -0.56, ny = portrait ? -0.3 : -0.34;
      var d = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * frac);
      camera.getWorldDirection(fwdV);
      rayV.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      anchorV.copy(camera.position).addScaledVector(rayV, d / Math.max(0.2, rayV.dot(fwdV)));
      world.worldToLocal(anchorV);
      anchorV.y -= H / 2;
      return anchorV;
    }
    function startIntro(skip) {
      var fromGate = mode === "gate";
      started = true; mode = "intro"; introAt = performance.now(); t0 = introAt;
      var instant = reduce || skip === true;
      if (!instant && fromGate) simFrom = performance.now(); else simFrom = null;
      root.classList.remove("sim");
      if (instant) { mode = "home"; homeAt = introAt - 5000; t0 = introAt - 20000; replayEl.hidden = false; markSeen(); }
      // dailies: jump straight to a beat, with the drawing already done
      if (!instant && !scrubbed && DAILIES.on && DAILIES.beat && beatByName[DAILIES.beat]) { scrubbed = true; introAt -= beatByName[DAILIES.beat].start * 1000; t0 = introAt - 20000; }
      if (state) state.k = null;
      // the crayon you clicked lifts off the page and the drawing starts where it went
      if (!instant && !gateEl.hidden) {
        gateEl.classList.add("leaving");
        later(function () { gateEl.hidden = true; gateEl.classList.remove("leaving"); }, 450);
      } else gateEl.hidden = true;
      replayEl.hidden = true; navEl.classList.remove("show"); hint.classList.remove("show");
      replayScrawls();
    }
    listen(byId("start"), "click", function () { startIntro(false); });
    var skipEl = byId("skip");
    try { skipEl.hidden = !localStorage.getItem("crayonSeen"); } catch (e) { skipEl.hidden = true; }
    listen(skipEl, "click", function () { startIntro(true); });
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
      // deep link: straight to home, then into the section once the first frame has placed the camera
      if (opts.section) {
        startIntro(true);
        later(function () { if (openSection(opts.section) && opts.project) openProject(opts.project); }, 60);
      }
    })();

    var DRAW_DELAY = 400, DRAW_MS = 4200;
    var bite = 0, lastNow = performance.now(), edgePush = { x: 0, y: 0 };
    var powder = createPowder(dx, dc, world, camera), burst = powder.burst, drawPowder = powder.drawPowder;
    var projV = new THREE.Vector3();
    // jump-cut to home while the screen is full of snow
    function coverCut() {
      later(function () {
        if (mode !== "intro") return;
        if (state) state.instant = true;
        mode = "home"; homeAt = performance.now() - 2000; replayEl.hidden = false; announce(); markSeen();
      }, 380);
    }
    // the quality ladder: watch the average frame time; if this device can't hold ~45fps, step down. First
    // resolution (to 1x, then 0.75x on phones), then the second outline pass. It never steps back up,
    // so it can't flicker between settings.
    var frameCount = 0, ema = 16, lastStep = 0, thinLines = false;
    var DPR_FLOOR = coarse ? 0.75 : 1;
    function thinOutlines() { world.traverse(function (o) { if (o.userData.pass2) o.visible = false; }); }
    function adapt(dtMs, now) {
      frameCount++;
      if (dtMs > 90) return; // a hiccup (tab switch, GC), not the steady cost
      ema += (dtMs - ema) * 0.05;
      if (frameCount < 60 || ema < 22 || now - lastStep < 1500) return;
      lastStep = now; ema = 16;
      if (dpr > DPR_FLOOR) { dpr = Math.max(DPR_FLOOR, dpr - 0.25); renderer.setPixelRatio(dpr); shared.uDpr.value = dpr; resize(); }
      else if (!thinLines) { thinLines = true; thinOutlines(); }
    }
    function frame() {
      var now = performance.now();
      var t = (now - loadAt) / 1000;
      var dtMs = Math.min(100, now - lastNow); lastNow = now;
      if (!document.hidden && !window.__fakeClock) adapt(dtMs, now); // a filmed frame always "takes" 33ms; don't let that look slow
      var T = mode === "gate" ? 0 : (now - introAt) / 1000;
      if (mode === "intro") {
        var END = beatTable ? introLen : current.introEnd || INTRO_END;
        progress = beatTable ? clamp01(T / introLen) : clamp01((T - 4.4) / (END - 4.4));
        if (T >= END + 0.8) { mode = "home"; homeAt = now; replayEl.hidden = false; announce(); markSeen(); }
      } else progress = mode === "home" ? 1 : 0;
      var homeBlend = mode === "home" ? (state && state.instant ? 1 : smooth(0, 1, (now - homeAt) / 1600)) : 0;
      root.classList.toggle("home", mode === "home");
      root.classList.toggle("sim", mode === "gate");
      shared.uSim.value = mode === "gate" ? 1 : simFrom ? 1 - smooth(0, 1, (now - simFrom - 250) / 1100) : 0;
      var navOn = homeBlend > 0.6 && !section;
      if (navOn !== navShown) { navShown = navOn; navEl.classList.toggle("show", navOn); navEl.toggleAttribute("inert", !navOn); showTunes(navOn); }
      hint.classList.toggle("show", mode === "home" && !section && now - homeAt > 3500 && bite < 0.2);
      if (ready) scrawls.forEach(function (sc) {
        var tg = (current.tags || TAGS)[sc.el.id];
        var on = mode === "gate" ? tg[0] < 0 : mode === "intro" && T >= tg[0] && T < tg[1];
        sc.el.classList.toggle("on", on);
      });
      shared.uTime.value = reduce ? 0 : now / 1000;
      // a world can start its reveal part-way (revealFrom), so the first marks land as the crayon lifts off
      if (!reduce) { var rf = current.revealFrom || 0; shared.uReveal.value = rf + (1 - rf) * clamp01((now - t0 - (current.drawDelay != null ? current.drawDelay : DRAW_DELAY)) / (current.drawMs || DRAW_MS)); }


      var c = current.cam, walk = 0;
      if (beatTable) rig.still(look, reduce); else walk = rig.base(c, progress, VIEW_H, now, reduce, look).walk;
      // push the cursor to an edge and a round bite of code opens there: the end of the simulation.
      var on = (mode === "gate" || look.ui || section) ? 0 : 1;
      var pxT = Math.sign(look.tx) * smooth(0.55, 1.0, Math.abs(look.tx)) * on;
      var pyT = -Math.sign(look.ty) * smooth(0.6, 1.0, Math.abs(look.ty)) * on;
      edgePush.x += (pxT - edgePush.x) * (reduce ? 1 : 0.08);
      edgePush.y += (pyT - edgePush.y) * (reduce ? 1 : 0.08);
      bite = Math.max(Math.abs(edgePush.x), Math.abs(edgePush.y));
      shared.uCursor.value.set(edgePush.x, edgePush.y);
      world.updateMatrixWorld();

      if (reduce) sectionBlend = section ? 1 : 0;
      else if (section) sectionBlend = blendFrom + (1 - blendFrom) * clamp01((now - sectionAt) / sectionMs);
      else sectionBlend = blendFrom * (1 - clamp01((now - sectionLeftAt) / 1300));
      var info = { viewH: VIEW_H, aspect: camera.aspect, p: function (name) { return beatP(name, T); } };
      if (beatTable) rig.pose(shotPose(mode === "home" ? introLen : mode === "gate" ? 0 : T, info), state, homeBlend, sectionBlend, lastSectionCam, look);
      else rig.aim(c, state, walk, homeBlend, sectionBlend, lastSectionCam, look);

      current.update(state, reduce ? 0 : t, { p: info.p, cover: coverCut, section: section, selected: selected, sb: sectionBlend, sbKey: lastSectionKey, T: T, mode: mode, home: homeBlend, homeT: mode === "home" ? (reduce ? 99 : (now - homeAt) / 1000) : 0, burst: reduce ? null : burst, aspect: camera.aspect, progress: progress });
      // the edge of the sim: when something flagged (state.comet) leaves the frame, a hole of code tears open where it went out
      if (state.comet && !reduce) {
        state.comet.getWorldPosition(projV); projV.project(camera);
        var W = window.innerWidth, Hh = window.innerHeight, inside = state.comet.visible && Math.abs(projV.x) <= 1 && Math.abs(projV.y) <= 1 && projV.z < 1;
        if (cometWasIn && !inside && state.comet.visible && mode === "home" && !section) {
          hitAt = now;
          shared.uHit.value.x = Math.max(0, Math.min(W, (lastComet.x + 1) / 2 * W));
          shared.uHit.value.y = Math.max(0, Math.min(Hh, (lastComet.y + 1) / 2 * Hh));
        }
        cometWasIn = inside; lastComet.copy(projV);
      }
      var hk = (now - hitAt) / 1000;
      shared.uHit.value.z = hk < 0 ? 0 : hk < 0.25 ? smooth(0, 0.25, hk) : hk < 0.9 ? 1 : 1 - smooth(0.9, 1.6, hk);
      if (state.hero) {
        // the hero's flight from the gate: hold at the gate anchor (bobbing), then ease to where the world put me
        var fly = mode === "gate" ? 0 : simFrom ? smooth(0, 1, (now - simFrom - 200) / 1500) : 1;
        if (mode === "gate" || !heroAnchor) heroAnchor = (heroAnchor || new THREE.Vector3()).copy(gateAnchor());
        if (fly < 1) {
          var bob = reduce ? 0 : Math.sin(t * 1.3) * 0.18 * state.hero.scale.y;
          heroAt.copy(state.hero.position);
          state.hero.position.copy(heroAnchor).add(rayV.set(0, bob, 0)).lerp(heroAt, fly);
          if (!reduce) { state.hero.rotation.y += Math.sin(t * 0.5) * 0.45 * (1 - fly); state.hero.rotation.z += Math.sin(t * 0.9) * 0.1 * (1 - fly); }
          state.hero.updateMatrixWorld(true);
        }
      }
      if (!reduce) { fadeDoodles(); drawPowder(); }
      renderer.render(scene, camera);
      if (section === "projects" && state.picks) {
        state.picks.forEach(function (pk) {
          if (!pk.label) return;
          pk.tip.getWorldPosition(projV); projV.project(camera);
          pk.label.style.left = ((projV.x + 1) / 2 * window.innerWidth).toFixed(1) + "px";
          pk.label.style.top = ((1 - projV.y) / 2 * window.innerHeight).toFixed(1) + "px";
          pk.label.classList.toggle("on", selected === pk.slug);
          pk.label.style.visibility = projV.z < 1 && sectionBlend > 0.7 ? "visible" : "hidden";
        });
      }
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
