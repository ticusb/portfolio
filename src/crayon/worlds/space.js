/* eslint-disable no-loop-func */
import * as THREE from "three";
import { smooth, jitter } from "../util";
import { buildVoid } from "../void";

// SPACE (dark theme): I float in an astronaut suit until a UFO flies by and beams me up.
// Home is me spinning in the beam with the nav orbiting; projects are constellations.
export function createSpace(kit) {
  var crayon = kit.crayon, put = kit.put, avatar = kit.avatar, macPro = kit.props.macPro, PROJECTS = kit.PROJECTS;
  var sphere = kit.geo.sphere, sphereLo = kit.geo.sphereLo, halfSphere = kit.geo.halfSphere, cone = kit.geo.cone, torus = kit.geo.torus, cyl = kit.geo.cyl;
  return {
    build: function (w) {
      var s = {};
      put(crayon(sphere, "#1d2156", "#0c0f33", { lump: 0, over: 0, noLine: true, side: THREE.BackSide, order: 1 }), w, [0, 0, 0], 320);
      s.stars = [];
      for (var i = 0; i < 110; i++) {
        var c = Math.random() < 0.7 ? ["#fff3b0", "#e0a800"] : ["#cfe6ff", "#5b8fd6"];
        var sd = new THREE.Vector3(jitter(1), jitter(0.8), -0.15 - Math.random()).normalize(), sr = 16 + Math.random() * 34;
        s.stars.push(put(crayon(sphereLo, c[0], c[1], { noLine: true, lump: 0.35, order: 2 + Math.random() * 4 }), w, [sd.x * sr, sd.y * sr, sd.z * sr], 0.1 + sr * 0.007 + Math.random() * 0.12));
      }
      // every fifth star twinkles; the rest never move, so they're one draw call
      kit.bakeAll(w, s.stars.filter(function (st, k) { return k % 5 !== 0; }));
      var pl = new THREE.Group();
      put(crayon(sphere, "#ff8a3d", "#b23a48", { thick: 0.06, lump: 0.12, order: 8 }), pl, [0, 0, 0], 2.2);
      put(crayon(torus, "#f27bb0", "#a8306b", { thick: 0.04, lump: 0.05, order: 10 }), pl, [0, 0, 0], [3.4, 3.4, 0.5], [1.25, 0.3, 0]);
      kit.bake(pl); s.planet = put(pl, w, [11, -1.5, -15]);
      var mo = new THREE.Group();
      put(crayon(sphere, "#d6d8e2", "#7a7d92", { thick: 0.06, lump: 0.15, order: 12 }), mo, [0, 0, 0], 1.3);
      [[0.4, 0.3], [-0.5, -0.2], [0.1, -0.6]].forEach(function (k) { put(crayon(sphere, "#aeb3c2", "#5a5f78", { noLine: true, lump: 0.1, order: 13 }), mo, [k[0], k[1], 1.05], [0.32, 0.32, 0.15]); });
      kit.bake(mo); s.moon = put(mo, w, [10, 5, -11]);
      var ea = new THREE.Group();
      put(crayon(sphere, "#2f7de1", "#163f8a", { thick: 0.06, lump: 0.1, order: 15 }), ea, [0, 0, 0], 1.6);
      [[0.5, 0.6], [-0.7, -0.1], [0.3, -0.8]].forEach(function (k) { put(crayon(sphere, "#3aa655", "#1d6b3a", { noLine: true, lump: 0.3, order: 16 }), ea, [k[0], k[1], 1.1], [0.55, 0.4, 0.4]); });
      kit.bake(ea); s.earth = put(ea, w, [-6, -5.5, -7]);
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
      kit.bake(u, s.lights); s.ufo = put(u, w, [-40, 4.8, -3]);
      // me, floating
      s.me = avatar(26, "#e8412c", "#8f1d10", { astro: true });
      put(s.me.group, w, [2, -0.2, -3], 0.9);
      s.hero = s.me.group;
      // nav: little things orbiting me once I'm caught
      s.nav = new THREE.Group(); w.add(s.nav);
      s.anchors = [];
      function navItem(key, g) { kit.bake(g, null, 1); g.scale.setScalar(0.001); s.nav.add(g); s.anchors.push({ key: key, obj: g }); return g; }
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
      kit.bake(sh); s.shoot = put(sh, w, [14, 8, -14]);
      s.comet = s.shoot;
      s.focus = new THREE.Vector3(2, 0.8, -3);
      s.homeCam = { pos: [2, 1.8, 11.5], look: [2, 1.9, -3], fov: 42 };
      // projects: a patch of sky with one constellation per project
      var SHAPES = [
        { pts: [[0, 1.2], [0.8, 0.3], [0, -1], [-0.8, 0.3]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]] },
        { pts: [[-1.2, 0.8], [-0.6, -0.4], [0, 0.4], [0.6, -0.4], [1.2, 0.8]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]] },
        { pts: [[-1.2, 0.4], [-0.6, 0.5], [0, 0.3], [0.5, 0.2], [0.6, -0.5], [1.3, -0.5], [1.3, 0.1]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
        { pts: [[0, 1], [0.9, -0.5], [-0.9, -0.5], [0, -1.3]], edges: [[0, 1], [1, 2], [2, 0], [2, 3]] },
        { pts: [[-1.2, -0.6], [-0.4, 0.4], [0.3, -0.3], [1.2, 0.7], [0.7, 0.7], [1.2, 0.2]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]] },
        { pts: [[-0.6, 1], [0.6, 1], [0.6, -1], [-0.6, -1], [0, 1.4]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4]] },
        { pts: [[-1.2, 0], [1.2, 0], [0, 0.9], [0, -0.9], [1.2, 0.5]], edges: [[0, 1], [2, 3], [1, 4]] }
      ];
      s.picks = [];
      var up = new THREE.Vector3(0, 1, 0);
      PROJECTS.forEach(function (proj, i) {
        var shape = SHAPES[i % SHAPES.length];
        var g = new THREE.Group();
        var col = i < 4 ? i : i - 4, row = i < 4 ? 0 : 1;
        g.position.set(-15 + col * 3.6 + row * 1.8, 8.6 - row * 3.6, -15 + (i % 2) * 1.2);
        g.scale.setScalar(1.05);
        var stars = [], lines = [];
        shape.pts.forEach(function (pt) {
          var st = put(crayon(sphereLo, "#fff3b0", "#e0a800", { noLine: true, lump: 0.25, order: 9 }), g, [pt[0], pt[1], 0], 0.13);
          stars.push(st);
        });
        shape.edges.forEach(function (e) {
          var a = new THREE.Vector3(shape.pts[e[0]][0], shape.pts[e[0]][1], 0), b = new THREE.Vector3(shape.pts[e[1]][0], shape.pts[e[1]][1], 0);
          var mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), len = dir.length();
          var ln = crayon(cyl, "#8fa6e6", "#4f6bc0", { noLine: true, lump: 0.02, order: 9.5 });
          ln.position.copy(mid); ln.scale.set(0.028, len, 0.028);
          ln.quaternion.setFromUnitVectors(up, dir.normalize());
          g.add(ln); lines.push(ln);
        });
        var tip = new THREE.Object3D(); tip.position.set(0, 1.7, 0); g.add(tip);
        w.add(g);
        s.picks.push({ slug: proj.slug, group: g, tip: tip, stars: stars, lines: lines });
      });
      s.void = buildVoid(kit, w, true);
      s.face = s.me.head;
      s.sections = {
        about: { cam: { pos: [3.4, 2.0, 3.6], look: [0.4, 1.7, -3], fov: 40 } },
        projects: { cam: { pos: [-7.5, 5.4, 2.5], look: [-11.6, 6.6, -15], fov: 50 } },
        monologue: {}
      };
      return s;
    },
    update: function (s, t, info) {
      var T = info.T, home = info.home, me = s.me;
      // the fly-by: in from the left, brakes over me, beam on
      var fly = info.mode === "home" ? 1 : smooth(4.4, 7.6, T); // skipped straight home: the UFO is already there
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
      // going into my head: stop spinning and face the camera first
      if (info.sbKey === "monologue" && info.sb > 0) {
        var f = smooth(0, 0.6, info.sb), ry = me.group.rotation.y;
        me.group.rotation.y = Math.atan2(Math.sin(ry), Math.cos(ry)) * (1 - f);
        me.head.rotation.y *= 1 - f;
      }
      var sp = 2 + flail * 7;
      me.hands[0].position.set(-0.62 - Math.abs(Math.sin(t * sp * 0.8)) * 0.15 * flail, 0.85 + Math.sin(t * sp) * 0.35 * flail, 0.06);
      me.hands[1].position.set(0.62 + Math.abs(Math.cos(t * sp * 0.8)) * 0.15 * flail, 0.85 + Math.cos(t * sp) * 0.35 * flail, 0.06);
      me.legs[0].rotation.x = Math.sin(t * sp) * 0.7 * flail; me.legs[1].rotation.x = -Math.sin(t * sp) * 0.7 * flail;
      // nav orbits once home
      s.anchors.forEach(function (n, i) {
        var a = t * 0.22 + i * Math.PI * 2 / 3, sx = Math.min(1, (info.aspect || 1.6) * 0.8);
        if ((info.aspect || 1.6) < 1) {
          // a phone is too narrow to orbit without passing in front of me: they hang in spots around me instead
          var spot = [[-2.4, -1.7], [2.7, 1.1], [-2.6, 3.7]][i];
          n.obj.position.set(2 + spot[0] + Math.sin(t * 0.5 + i) * 0.15, 0.9 + spot[1] + Math.sin(t * 0.9 + i) * 0.2, -3);
        } else n.obj.position.set(2 + Math.cos(a) * 5.4 * sx, 0.9 + Math.sin(a) * 2.0 + Math.sin(t * 0.9 + i) * 0.2, -3 + Math.sin(a) * 2.6);
        n.obj.rotation.y = t * 0.6 + i;
        n.obj.scale.setScalar(Math.max(0.001, home));
        n.obj.visible = home > 0.001;
        n.obj.userData.vis = home;
      });
      s.planet.rotation.y = t * 0.15;
      s.moon.position.y = 5 + Math.sin(t * 0.4) * 0.3;
      // the comet streaks across every 7s and flies straight off the edge of the sim (the engine tears the hole)
      var st = (t % 7) / 3.2;
      s.shoot.visible = st <= 1;
      s.shoot.position.set(16 - st * 40, 8.5 - st * 7.5, -14);
      s.stars.forEach(function (sr, i) { if (i % 5 === 0) sr.visible = Math.sin(t * 2 + i) > -0.6; });
      s.focus.set(me.group.position.x, me.group.position.y + 1.0, -3);
      s.void.update(t, info.sbKey === "monologue" && info.sb > 0);
      // constellations: a soft twinkle; the one you picked lights up
      s.picks.forEach(function (pk, i) {
        var on = info.selected === pk.slug, inProjects = info.section === "projects";
        pk.stars.forEach(function (st, j) { st.scale.setScalar((0.13 + 0.03 * Math.sin(t * 2.2 + i + j * 1.7)) * (on ? 1.6 : 1)); });
        pk.lines.forEach(function (ln) { ln.children[0].material.uniforms.uColor.value.set(on ? "#fff2a8" : inProjects ? "#b4c4ff" : "#8fa6e6"); });
      });
    },
    navText: { about: "about ★", projects: "projects ▣", monologue: "monologue ✎" },
    cam: { walk: [1, 0.6, -6], look: [0, 0, -5], lookWalk: [2, 1.4, 0], yaw: -0.25, orbit: 0.35, follow: 0.4 }
  };
}
