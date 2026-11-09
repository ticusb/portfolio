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
import { clamp01, smooth, jitter } from "./util";
import { createKit } from "./materials";
import { createProps } from "./props";
import { createAvatar } from "./avatar";
import { createSpace } from "./worlds/space";
import { createSki } from "./worlds/ski";
import { createRig } from "./camera";
import { createDoodle } from "./ui/doodle";
import { createTunes } from "./ui/tunes";
import { createPowder } from "./ui/powder";
import { createPanel, el } from "./ui/panel";

const PROJECTS = projectData.filter(function (p) { return !p.draft; });

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
      uReveal: { value: reduce ? 1 : 0 }, uGlitch: { value: 0 }, uWorldInv: { value: new THREE.Matrix4() }, uHomeDir: { value: new THREE.Vector3(0, 0, -1) }, uHalfFov: { value: new THREE.Vector2(0.1, 0.07) }, uVig: { value: 0 }, uCursor: { value: new THREE.Vector2(0, 0) }, uBite: { value: 0 }
    };

    var kit = createKit(shared, coarse);
    var faceTex = new THREE.TextureLoader().load(FACE_URL);
    kit.avatar = createAvatar(kit, shared, faceTex);
    kit.props = createProps(kit);
    kit.PROJECTS = PROJECTS;
    var SCENES = { space: createSpace(kit), ski: createSki(kit) };
    var rig = createRig(camera, world, shared);


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
      section = null; selected = null; sectionBlend = 0; panelEl.hidden = true; picksEl.hidden = true;
      buildPicks();
      if (started) startIntro(false); else { mode = "gate"; replayScrawls(); }
    }
    var navShown = false;
    // sections: about and projects open inside the world instead of leaving the page
    var lastSectionKey = null;
    var section = null, selected = null, sectionBlend = 0, lastSectionCam = null, sectionAt = 0, sectionLeftAt = 0, blendFrom = 0;
    var picksEl = byId("picks");
    var panel = createPanel(byId, PROJECTS, function (slug) { openProject(slug); });
    var panelEl = panel.el, panelBack = panel.back;
    function aboutPanel() { panel.about(); }
    function projectsPanel() { panel.projects(currentName); }
    function openProject(slug) { if (panel.project(slug)) selected = slug; }
    function openSection(key) {
      if (!state.sections || !state.sections[key]) return false;
      blendFrom = sectionBlend; sectionAt = performance.now();
      section = key; selected = null; lastSectionCam = state.sections[key].cam; lastSectionKey = key;
      navEl.classList.remove("show"); navEl.setAttribute("inert", ""); navShown = false;
      showTunes(false); hint.classList.remove("show"); replayEl.hidden = true;
      panelBack.textContent = "\u2190 back home";
      if (key === "about") aboutPanel(); else projectsPanel();
      picksEl.hidden = key !== "projects";
      if (live) live.textContent = key === "about" ? "About." : "Projects. Pick one from the list.";
      return true;
    }
    function closeSection() {
      blendFrom = sectionBlend; sectionLeftAt = performance.now();
      section = null; selected = null; panelEl.hidden = true; picksEl.hidden = true; replayEl.hidden = false;
      navShown = false;
      var first = navEl.querySelector("a"); if (first) setTimeout(function () { if (alive && first) first.focus({ preventScroll: true }); }, 50);
    }
    listen(panelBack, "click", function () { if (selected) { selected = null; projectsPanel(); panelBack.textContent = "\u2190 back home"; } else closeSection(); });
    listen(byId("worldnav"), "click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-key]");
      if (!a) return;
      var key = a.getAttribute("data-key");
      if ((key === "about" || key === "projects") && openSection(key)) e.preventDefault();
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
    function startIntro(skip) {
      started = true; mode = "intro"; introAt = performance.now(); t0 = introAt;
      if (reduce || skip === true) { mode = "home"; homeAt = introAt - 5000; t0 = introAt - 20000; replayEl.hidden = false; markSeen(); }
      if (state) state.k = null;
      gateEl.hidden = true; replayEl.hidden = true; navEl.classList.remove("show"); hint.classList.remove("show");
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
        if (T >= END + 0.8) { mode = "home"; homeAt = now; replayEl.hidden = false; announce(); markSeen(); }
      } else progress = mode === "home" ? 1 : 0;
      var homeBlend = mode === "home" ? (state && state.instant ? 1 : smooth(0, 1, (now - homeAt) / 1600)) : 0;
      root.classList.toggle("home", mode === "home");
      var navOn = homeBlend > 0.6 && !section;
      if (navOn !== navShown) { navShown = navOn; navEl.classList.toggle("show", navOn); navEl.toggleAttribute("inert", !navOn); showTunes(navOn); }
      hint.classList.toggle("show", mode === "home" && !section && now - homeAt > 3500 && bite < 0.2);
      if (ready) scrawls.forEach(function (sc) { sc.el.classList.toggle("on", mode !== "home" && progress >= sc.from && progress < sc.to); });
      shared.uTime.value = reduce ? 0 : now / 1000;
      if (!reduce) shared.uReveal.value = clamp01((now - t0 - DRAW_DELAY) / DRAW_MS);


      var c = current.cam;
      var walk = rig.base(c, progress, VIEW_H, now, reduce, look).walk;
      // push the cursor to an edge and a round bite of code opens there: the end of the simulation.
      // hold it at the very edge and the bite keeps growing until the whole thing breaks and redraws.
      var on = (mode === "gate" || look.ui || section) ? 0 : 1;
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

      if (reduce) sectionBlend = section ? 1 : 0;
      else if (section) sectionBlend = blendFrom + (1 - blendFrom) * clamp01((now - sectionAt) / 1500);
      else sectionBlend = blendFrom * (1 - clamp01((now - sectionLeftAt) / 1300));
      rig.aim(c, state, walk, homeBlend, sectionBlend, lastSectionCam, look);

      current.update(state, reduce ? 0 : t, { cover: coverCut, section: section, selected: selected, sb: sectionBlend, sbKey: lastSectionKey, T: T, mode: mode, home: homeBlend, homeT: mode === "home" ? (reduce ? 99 : (now - homeAt) / 1000) : 0, burst: reduce ? null : burst, aspect: camera.aspect, progress: progress });
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
