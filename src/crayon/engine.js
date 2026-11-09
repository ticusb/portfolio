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

// a JPEG (85KB, the photo has no transparency); face.png stays as the source for tools/icon
const FACE_URL = (process.env.PUBLIC_URL || "") + "/crayon/face.jpg";

// crayon-drawn icons for the world toggle (static, trusted markup)
const MOON_ICON = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" focusable="false"><g filter="url(#crayon)"><path d="M29 5a19 19 0 1 0 14 31A16 16 0 0 1 29 5z" fill="#ffe27a" stroke="#2b2340" stroke-width="3.5" stroke-linejoin="round"/><circle cx="20" cy="27" r="2.6" fill="#e0a800"/><circle cx="26" cy="36" r="1.8" fill="#e0a800"/></g></svg>';
const SUN_ICON = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" focusable="false"><g filter="url(#crayon)" stroke-linecap="round"><g stroke="#ff9f1c" stroke-width="4"><path d="M24 3v7M24 38v7M3 24h7M38 24h7M9 9l5 5M34 34l5 5M39 9l-5 5M14 34l-5 5"/></g><circle cx="24" cy="24" r="10" fill="#ffc93c" stroke="#2b2340" stroke-width="3.5"/></g></svg>';

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
    // late callers (iOS answering the tilt permission prompt after you've left) would add a listener nobody removes
    if (!alive) return;
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
    // phones get 2x: the crayon tooth and strokes are a pixel or two wide, and below ~1.25x they turn to grit
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(8, 1, 0.1, 500);
    var world = new THREE.Group();
    scene.add(world);

    var shared = {
      uTime: { value: 0 }, uDpr: { value: dpr }, uRes: { value: new THREE.Vector2(1, 1) },
      uReveal: { value: reduce ? 1 : 0 }, uHalfFov: { value: new THREE.Vector2(0.1, 0.07) }, uCursor: { value: new THREE.Vector2(0, 0) }, uSim: { value: 0 }
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
    // free what a build made on the GPU. Every build makes fresh baked meshes and ribbons, so a replay or a world
    // switch would otherwise leave the old ones behind. The kit's shared shapes stay until unmount.
    var sharedGeo = Object.keys(kit.geo).map(function (k) { return kit.geo[k]; });
    function disposeWorld() {
      world.traverse(function (o) {
        if (o.material && o.material.dispose) o.material.dispose();
        if (o.geometry && o.geometry.dispose && sharedGeo.indexOf(o.geometry) < 0) o.geometry.dispose();
      });
    }
    function loadScene(name, straightHome) {
      if (!SCENES[name]) name = "space";
      disposeWorld();
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
      // the toggle is an icon of where it takes you: a moon from the snow, a sun from space
      flip.innerHTML = name === "space" ? SUN_ICON : MOON_ICON;
      flip.setAttribute("aria-label", name === "space" ? "Switch to skiing" : "Switch to space");
      flip.title = name === "space" ? "go skiing" : "go to space";
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
      if (inVoid) { inVoid = false; outOfVoid(); }
      buildPicks();
      if (straightHome) { startIntro(true); homeAt = performance.now() - 5000; announce(); }
      else if (started) startIntro(false); else { mode = "gate"; replayScrawls(); }
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
    // in the void you can grab me and drag me around: I dangle from where you hold me and drift back when let go
    var pointerRay = new THREE.Raycaster(), pointerNdc = new THREE.Vector2(), voidO = new THREE.Vector3(), voidD = new THREE.Vector3(), voidP = new THREE.Vector3();
    function aimPointer(e) { pointerNdc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); pointerRay.setFromCamera(pointerNdc, camera); }
    // where the pointer meets the void's z = 0 plane, in the void's own space
    function voidPoint(e) {
      aimPointer(e);
      var G = state.void.group;
      voidO.copy(pointerRay.ray.origin); G.worldToLocal(voidO);
      voidD.copy(pointerRay.ray.origin).add(pointerRay.ray.direction); G.worldToLocal(voidD); voidD.sub(voidO);
      if (Math.abs(voidD.z) < 1e-6) return null;
      return voidP.copy(voidO).addScaledVector(voidD, -voidO.z / voidD.z);
    }
    function overMe(e) { aimPointer(e); return pointerRay.intersectObject(state.void.hitTarget, true).length > 0; }
    listen(dc, "pointerdown", function (e) {
      if (!inVoid || !state.void || !overMe(e)) return;
      var p = voidPoint(e); if (!p) return;
      state.void.grab(p); dc.style.cursor = "grabbing"; e.preventDefault();
      try { dc.setPointerCapture(e.pointerId); } catch (err) { /* not supported */ }
    });
    listen(dc, "pointermove", function (e) {
      if (!inVoid || !state.void) return;
      if (state.void.isGrabbed()) { var p = voidPoint(e); if (p) state.void.drag(p); }
      else if (e.pointerType === "mouse") dc.style.cursor = overMe(e) ? "grab" : "";
    });
    function letGo() { if (state.void && state.void.isGrabbed()) { state.void.release(); dc.style.cursor = inVoid ? "grab" : ""; } }
    listen(dc, "pointerup", letGo); listen(dc, "pointercancel", letGo);
    function outOfVoid() { if (state.void) state.void.release(); dc.style.cursor = ""; root.classList.remove("in-void"); }
    function enterVoid() {
      if (section !== "monologue") return;
      inVoid = true; lastSectionCam = state.void.cam; blendFrom = 1; sectionAt = performance.now() - 1e6;
      root.classList.add("in-void"); dc.style.cursor = "";
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
        later(function () { inVoid = false; outOfVoid(); lastSectionCam = faceCamSaved; blendFrom = 1; leaveSection(); wipe(false); }, 380);
        return;
      }
      if (section === "monologue") { inVoid = false; outOfVoid(); lastSectionCam = faceCamSaved || lastSectionCam; }
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
    var simFrom = null, heroAnchor = null, heroAt = new THREE.Vector3(), anchorV = new THREE.Vector3(), rayV = new THREE.Vector3(), fwdV = new THREE.Vector3();
    function gateAnchor() {
      var portrait = camera.aspect < 1, H = 2.3 * state.hero.scale.y;
      // landscape: big on the right half, next to the title card. portrait: in the actual gap between the last
      // line of the card and the crayon, measured from the page
      var frac = 0.5, nx = 0.46, ny = -0.06;
      if (portrait) {
        var vh = window.innerHeight, top = byId("s-night").getBoundingClientRect().bottom, bot = byId("start").getBoundingClientRect().top;
        frac = Math.min(0.24, Math.max(0.1, (bot - top) * 0.85 / vh));
        nx = 0; ny = 1 - (top + bot) / vh;
      }
      var d = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * frac);
      camera.getWorldDirection(fwdV);
      rayV.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
      anchorV.copy(camera.position).addScaledVector(rayV, d / Math.max(0.2, rayV.dot(fwdV)));
      world.worldToLocal(anchorV);
      anchorV.y -= H / 2;
      return anchorV;
    }
    // on the gate you can grab me too: I dangle from where you hold me and drift back to my spot when let go
    var gd = { grabbed: false, off: new THREE.Vector3(), vel: new THREE.Vector3(), target: new THREE.Vector3(), grabAt: new THREE.Vector3(), plane: new THREE.Plane(), hit: new THREE.Vector3(), swing: 0, swingV: 0, flail: 0, tmp: new THREE.Vector3() };
    function heroHit(e) {
      aimPointer(e);
      var h = pointerRay.intersectObject(state.hero, true)[0];
      return h ? h.point : null;
    }
    listen(gateEl, "pointerdown", function (e) {
      if (mode !== "gate" || !state.hero || reduce || e.target !== gateEl) return;
      var p = heroHit(e); if (!p) return;
      camera.getWorldDirection(fwdV);
      gd.plane.setFromNormalAndCoplanarPoint(fwdV, p);
      gd.grabAt.copy(world.worldToLocal(p.clone())).sub(gd.off);
      gd.grabbed = true; gd.target.copy(gd.off); gateEl.style.cursor = "grabbing"; e.preventDefault();
      try { gateEl.setPointerCapture(e.pointerId); } catch (err) { /* not supported */ }
    });
    listen(gateEl, "pointermove", function (e) {
      if (mode !== "gate" || !state.hero) return;
      if (gd.grabbed) {
        aimPointer(e);
        if (pointerRay.ray.intersectPlane(gd.plane, gd.hit)) gd.target.copy(world.worldToLocal(gd.hit)).sub(gd.grabAt);
      } else if (e.pointerType === "mouse") gateEl.style.cursor = e.target === gateEl && heroHit(e) ? "grab" : "";
    });
    function dropHero() { if (gd.grabbed) { gd.grabbed = false; gateEl.style.cursor = ""; } }
    listen(gateEl, "pointerup", dropHero); listen(gateEl, "pointercancel", dropHero);
    function stepGateDrag(dt) {
      dt = Math.min(0.05, Math.max(0, dt));
      if (!gd.grabbed) gd.target.set(0, 0, 0);
      var k = gd.grabbed ? 70 : 9, damp = gd.grabbed ? 13 : 3.6;
      gd.tmp.copy(gd.target).sub(gd.off).multiplyScalar(k).addScaledVector(gd.vel, -damp);
      gd.vel.addScaledVector(gd.tmp, dt); gd.off.addScaledVector(gd.vel, dt);
      gd.swingV += (-gd.swing * 30 - gd.swingV * 3.2 - gd.vel.x * 9) * dt; gd.swing = Math.max(-1.1, Math.min(1.1, gd.swing + gd.swingV * dt));
      gd.flail += ((gd.grabbed ? 1 : 0) + Math.min(1, gd.vel.length() * 0.25) - gd.flail) * Math.min(1, dt * 4);
      gd.flail = Math.min(1, gd.flail);
    }
    function startIntro(skip) {
      var fromGate = mode === "gate";
      dropHero();
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
    listen(byId("start"), "click", function () { if (!reduce) doodle.enableTilt(); startIntro(false); });
    var skipEl = byId("skip");
    try { skipEl.hidden = !localStorage.getItem("crayonSeen"); } catch (e) { skipEl.hidden = true; }
    listen(skipEl, "click", function () { if (!reduce) doodle.enableTilt(); startIntro(true); });
    // not mid-travel: the trip would land on the other world a second later, on top of the replay
    listen(replayEl, "click", function () { if (!traveling) loadScene(currentName); });
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
      // only once the intro has run: mid-intro, the other world plays its own intro from the start
      if (mode === "home" && currentName && name !== currentName) { travelTo(name); return; }
      currentName = name;
      loadScene(name);
    }
    // once the intro has run, switching worlds doesn't replay it: the camera travels out of this world (up into
    // the sky, or down into the Earth), a crayon blot in the next world's colour closes over the cut, and the
    // camera arrives at the other world's home from where the story says it should (out of the Earth, or down
    // from the sky). Reduced motion: straight there.
    var traveling = false;
    // the trip, in ms: the camera leaves over LEAVE, the blot closes at BLOT, the cut lands at CUT, the camera arrives over ARRIVE
    var TRAVEL = { LEAVE: 1100, BLOT: 820, CUT: 1240, ARRIVE: 1900 };
    function easeInOut(x) { return x * x * (3 - 2 * x); }
    function travelTo(name) {
      if (traveling) return;
      if (section) { section = null; selected = null; panelEl.hidden = true; picksEl.hidden = true; sectionBlend = 0; blendFrom = 0; }
      if (inVoid) { inVoid = false; outOfVoid(); }
      if (reduce || !state.travel) { currentName = name; loadScene(name, true); return; }
      traveling = true; // the toggle stays focusable; travelTo ignores clicks until we land
      var leave = { pose: state.travel.leave(), w: 0 }, from = performance.now();
      rig.setTravel(leave);
      var tick = setInterval(function () { leave.w = easeInOut(clamp01((performance.now() - from) / TRAVEL.LEAVE)) * 0.97; }, 16);
      cleanups.push(function () { clearInterval(tick); });
      later(function () {
        wipeEl.style.setProperty("--x", "50%"); wipeEl.style.setProperty("--y", "50%");
        wipeEl.style.setProperty("--wipe", name === "space" ? "#1d2156" : "#d6ebff");
        wipeEl.classList.remove("out"); wipeEl.classList.add("in");
      }, TRAVEL.BLOT);
      later(function () {
        clearInterval(tick);
        currentName = name;
        loadScene(name, true);
        var arrive = { pose: state.travel ? state.travel.arrive() : null, w: 1 }, at = performance.now();
        rig.setTravel(arrive.pose ? arrive : null);
        var tick2 = setInterval(function () { arrive.w = 1 - easeInOut(clamp01((performance.now() - at) / TRAVEL.ARRIVE)); if (arrive.w <= 0) { clearInterval(tick2); rig.setTravel(null); traveling = false; } }, 16);
        cleanups.push(function () { clearInterval(tick2); });
        later(function () { wipeEl.classList.add("out"); later(function () { wipeEl.classList.remove("in", "out"); wipeEl.style.removeProperty("--wipe"); }, 500); }, 120);
      }, TRAVEL.CUT);
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
    // the space intro (the older dolly camera) frames tighter on a phone: at the full portrait height I was a
    // speck in an empty sky until the UFO turned up
    var PORTRAIT_INTRO = 0.6;
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      shared.uRes.value.set(w, h);
      camera.aspect = w / h;
      VIEW_H = camera.aspect < 1 ? 15 / camera.aspect * 0.75 : 15;
      // the label font size changes at the phone breakpoint, so measure them again
      if (state && state.picks) state.picks.forEach(function (pk) { pk.lw = 0; });
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
    // the quality ladder: watch the average frame time; if this device can't hold ~25fps, step down. First
    // resolution (to 1x, or 1.25x on phones), then the second outline pass. It never steps back up,
    // so it can't flicker between settings.
    var frameCount = 0, ema = 16, lastStep = 0, thinLines = false;
    var DPR_FLOOR = coarse ? 1.25 : 1;
    function thinOutlines() { world.traverse(function (o) { if (o.userData.pass2) o.visible = false; }); }
    function adapt(dtMs, now) {
      frameCount++;
      if (dtMs > 90) return; // a hiccup (tab switch, GC), not the steady cost
      ema += (dtMs - ema) * 0.05;
      // phones often cap animation at 30fps (low power mode): a steady 33ms isn't "slow". Only step down below ~25fps
      if (frameCount < 60 || ema < 38 || now - lastStep < 1500) return;
      lastStep = now; ema = 16;
      if (dpr > DPR_FLOOR) { dpr = Math.max(DPR_FLOOR, dpr - 0.25); renderer.setPixelRatio(dpr); shared.uDpr.value = dpr; resize(); }
      else if (!thinLines) { thinLines = true; thinOutlines(); }
    }
    function frame() {
      var now = performance.now();
      var t = (now - loadAt) / 1000;
      var dtMs = Math.min(100, now - lastNow); lastNow = now;
      // frames' worth of time at 60fps: per-frame steps scale by it so motion runs the same at 30, 60 or 120Hz
      var f60 = dtMs / (1000 / 60);
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
      var navOn = homeBlend > 0.6 && !section && !traveling;
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
      if (beatTable) rig.still(look, reduce, f60); else walk = rig.base(c, progress, camera.aspect < 1 ? VIEW_H * PORTRAIT_INTRO : VIEW_H, now, reduce, look, f60).walk;
      // push the cursor to an edge and a round bite of code opens there: the end of the simulation.
      var on = (mode === "gate" || look.ui || section) ? 0 : 1;
      var pxT = Math.sign(look.tx) * smooth(0.55, 1.0, Math.abs(look.tx)) * on;
      var pyT = -Math.sign(look.ty) * smooth(0.6, 1.0, Math.abs(look.ty)) * on;
      var edgeK = reduce ? 1 : 1 - Math.pow(1 - 0.08, f60);
      edgePush.x += (pxT - edgePush.x) * edgeK;
      edgePush.y += (pyT - edgePush.y) * edgeK;
      bite = Math.max(Math.abs(edgePush.x), Math.abs(edgePush.y));
      shared.uCursor.value.set(edgePush.x, edgePush.y);
      world.updateMatrixWorld();

      if (reduce) sectionBlend = section ? 1 : 0;
      else if (section) sectionBlend = blendFrom + (1 - blendFrom) * clamp01((now - sectionAt) / sectionMs);
      else sectionBlend = blendFrom * (1 - clamp01((now - sectionLeftAt) / 1300));
      var info = { viewH: VIEW_H, aspect: camera.aspect, p: function (name) { return beatP(name, T); } };
      if (beatTable) rig.pose(shotPose(mode === "home" ? introLen : mode === "gate" ? 0 : T, info), state, homeBlend, sectionBlend, lastSectionCam, look);
      else rig.aim(c, state, walk, homeBlend, sectionBlend, lastSectionCam, look);

      current.update(state, reduce ? 0 : t, { f60: f60, p: info.p, cover: coverCut, section: section, selected: selected, sb: sectionBlend, sbKey: lastSectionKey, T: T, mode: mode, home: homeBlend, homeT: mode === "home" ? (reduce ? 99 : (now - homeAt) / 1000) : 0, burst: reduce ? null : burst, aspect: camera.aspect, progress: progress });
      if (state.hero) {
        // the hero's flight from the gate: hold at the gate anchor (bobbing), then ease to where the world put me
        var fly = mode === "gate" ? 0 : simFrom ? smooth(0, 1, (now - simFrom - 200) / 1500) : 1;
        if (mode === "gate" || !heroAnchor) heroAnchor = (heroAnchor || new THREE.Vector3()).copy(gateAnchor());
        if (fly < 1) {
          var bob = reduce ? 0 : Math.sin(t * 1.3) * 0.18 * state.hero.scale.y;
          stepGateDrag(dtMs / 1000);
          heroAt.copy(state.hero.position);
          state.hero.position.copy(heroAnchor).add(rayV.set(0, bob, 0)).add(gd.off).lerp(heroAt, fly);
          if (!reduce) {
            var calm = 1 - gd.flail;
            state.hero.rotation.y += Math.sin(t * 0.5) * 0.45 * (1 - fly) * calm;
            state.hero.rotation.z += (Math.sin(t * 0.9) * 0.1 * calm + gd.swing) * (1 - fly);
            // swing from the head, not the feet: shift so the head stays where it's held
            var hh = 1.62 * state.hero.scale.y, sw = gd.swing * (1 - fly);
            state.hero.position.x += Math.sin(sw) * hh; state.hero.position.y += hh - Math.cos(sw) * hh;
            if (state.me && gd.flail > 0.01) {
              var kick = Math.sin(t * 15) * 0.8 * gd.flail * (1 - fly);
              state.me.legs[0].rotation.x = kick; state.me.legs[1].rotation.x = -kick;
              state.me.hands.forEach(function (h, k) { h.position.y += (0.5 + Math.sin(t * 13 + k) * 0.15) * gd.flail * (1 - fly); });
            }
          }
          state.hero.updateMatrixWorld(true);
        }
      }
      if (!reduce) { fadeDoodles(f60); drawPowder(f60); }
      renderer.render(scene, camera);
      if (section === "projects" && state.picks) {
        // labels shuffle up so they don't sit on each other,
        // and hide any that would land behind the panel: its top edge on a phone (bottom sheet), its right edge on desktop
        var placed = [], pr = panelEl.hidden ? null : panelEl.getBoundingClientRect();
        var panelTop = pr && camera.aspect < 1 ? pr.top - 4 : Infinity, panelRight = pr && camera.aspect >= 1 ? pr.right + 4 : -Infinity;
        state.picks.forEach(function (pk) {
          if (!pk.label) return;
          pk.tip.getWorldPosition(projV); projV.project(camera);
          var lx = (projV.x + 1) / 2 * window.innerWidth, ly = (1 - projV.y) / 2 * window.innerHeight;
          if (!pk.lw) { pk.lw = pk.label.offsetWidth; pk.lh = pk.label.offsetHeight; }
          var lw = pk.lw || 100, lh = pk.lh || 24;
          lx = Math.max(lw / 2 + 6, Math.min(window.innerWidth - lw / 2 - 6, lx));
          for (var tries = 0; tries < 5; tries++) {
            var clash = placed.some(function (r) { return lx - lw / 2 < r[2] && lx + lw / 2 > r[0] && ly - lh < r[3] && ly > r[1]; });
            if (!clash) break;
            ly -= lh + 4;
          }
          placed.push([lx - lw / 2, ly - lh, lx + lw / 2, ly]);
          pk.label.style.left = lx.toFixed(1) + "px";
          pk.label.style.top = ly.toFixed(1) + "px";
          pk.label.classList.toggle("on", selected === pk.slug);
          pk.label.style.visibility = projV.z < 1 && sectionBlend > 0.7 && ly < panelTop && lx - lw / 2 > panelRight ? "visible" : "hidden";
        });
      }
      if (state.anchors) {
        state.anchors.forEach(function (n, i) {
          var el = n.el || (n.el = navEl.querySelector('[data-key="' + n.key + '"]'));
          if (!el) return;
          n.obj.getWorldPosition(projV); projV.project(camera);
          el.style.left = ((projV.x + 1) / 2 * window.innerWidth).toFixed(1) + "px";
          el.style.top = ((1 - projV.y) / 2 * window.innerHeight).toFixed(1) + "px";
          var vis = n.obj.userData.vis == null ? 1 : n.obj.userData.vis;
          el.style.opacity = vis.toFixed(2);
          // a label can glide from above its object to below it (space: the far side of the orbit)
          if (n.obj.userData.drop != null) el.style.transform = "translate(-50%, " + (-130 + 175 * n.obj.userData.drop).toFixed(1) + "%)";
          el.style.visibility = projV.z < 1 && vis > 0.05 ? "visible" : "hidden";
        });
      }
      if (alive) rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    cleanups.push(function () { cancelAnimationFrame(rafId); disposeWorld(); sharedGeo.forEach(function (g) { g.dispose(); }); faceTex.dispose(); renderer.dispose(); });
  }

  cleanups.push(function () { clearInterval(wobbleTimer); });
  return function unmount() {
    alive = false;
    cleanups.forEach(function (fn) { try { fn(); } catch (e) { /* already gone */ } });
    document.documentElement.classList.remove("crayon-lock");
    root.classList.remove("home", "night");
  };
}
