/* eslint-disable no-redeclare, no-loop-func */
import * as THREE from "three";
import { clamp01, smooth, jitter } from "../util";

/* SKI (light theme): 3D models built from Ticus's drawings: gray Tetons at the back, his blue three-peak
   mountain with snowy tips and thick black outlines, his stacked-triangle trees. I carve down, 360 through a
   ring of fire over a lava crevasse full of snappers, and stop at the camera. Home: penguins hold the nav. */
export function createSki(kit) {
  var crayon = kit.crayon, put = kit.put, avatar = kit.avatar, sun = kit.props.sun, cloud = kit.props.cloud, PROJECTS = kit.PROJECTS;
  var sphere = kit.geo.sphere, sphereLo = kit.geo.sphereLo, halfSphere = kit.geo.halfSphere, cone = kit.geo.cone, torus = kit.geo.torus, cyl = kit.geo.cyl, box = kit.geo.box, plane = kit.geo.plane;
  return {
    build: function (w) {
      var s = {};
      var GROUND = -6, INK = "#141414";
      put(crayon(sphere, "#d6ebff", "#a9c8f0", { lump: 0, over: 0, noLine: true, wash: true, side: THREE.BackSide, order: 0.5 }), w, [0, 0, 0], 320);
      put(crayon(plane, "#f7f9fd", "#a9c4ec", { lump: 0.1, over: 0, noLine: true, wash: true, order: 0.8 }), w, [0, GROUND, -110], [400, 300, 1], [-Math.PI / 2, 0, 0]);
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
      [[-13, -7, 1.2], [-10.5, -4.5, 1.05], [-14, -1.5, 1.0], [24, -12, 1.3], [11.2, -1.4, 1.1], [-6.5, 1.8, 0.8], [-16, 3, 0.95], [24.5, -2, 1.0], [10.5, -13, 1.1], [3, -15, 1.2]].forEach(function (t, i) {
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
      // about: me, chilling on a snow ledge at the summit
      var M = s.main, top = GROUND + M.H;
      put(crayon(sphere, "#f4f8ff", "#9db8e8", { thick: 0.06, lump: 0.12, ink: INK, order: 4 }), w, [M.x + 0.15, top - 0.78, M.z + 0.45], [0.8, 0.24, 0.7]);
      var chill = avatar(40, "#e8412c", "#8f1d10");
      chill.legs.forEach(function (lg) { lg.rotation.x = -1.35; });
      chill.body.rotation.x = -0.3;
      chill.hands[0].position.set(-0.6, 0.45, -0.25); chill.hands[1].position.set(0.6, 0.45, -0.25);
      s.chill = put(chill.group, w, [M.x + 0.2, top - 0.9, M.z + 0.75], 0.001, [0, 0.4, 0]);
      s.chillHead = chill.head;
      // projects: a snow sculpture garden in the valley, one per project
      function mound(g, sx, sz) { put(crayon(sphere, "#f4f8ff", "#9db8e8", { thick: 0.05, lump: 0.15, ink: INK, order: 20 }), g, [0, 0, 0], [sx, 0.32, sz]); }
      var snow = ["#f6f9ff", "#9db8e8"], ice = ["#cfefff", "#5b8fd6"];
      var KINDS = {
        plane: function (g) { mound(g, 1.9, 1.3);
          put(crayon(sphere, snow[0], snow[1], { thick: 0.06, lump: 0.08, ink: INK, order: 21 }), g, [0, 0.95, 0], [1.6, 0.42, 0.42]);
          put(crayon(box, snow[0], snow[1], { thick: 0.05, lump: 0.05, ink: INK, order: 21 }), g, [0.1, 0.95, 0], [0.35, 0.06, 1.7]);
          put(crayon(box, snow[0], snow[1], { thick: 0.05, lump: 0.05, ink: INK, order: 21 }), g, [-1.35, 1.35, 0], [0.25, 0.42, 0.05]);
          put(crayon(box, snow[0], snow[1], { thick: 0.05, lump: 0.05, ink: INK, order: 21 }), g, [-1.35, 1.0, 0], [0.22, 0.05, 0.6]);
          return 2.0; },
        fort: function (g) { mound(g, 2.0, 1.4);
          for (var i = -2; i <= 2; i++) { put(crayon(box, snow[0], snow[1], { thick: 0.04, lump: 0.06, ink: INK, order: 21 }), g, [i * 0.62, 0.45, -0.6], [0.29, 0.3, 0.3]); if (i % 2 === 0) put(crayon(box, snow[0], snow[1], { thick: 0.04, lump: 0.06, ink: INK, order: 21 }), g, [i * 0.62, 1.05, -0.6], [0.24, 0.24, 0.24]); }
          [-1, 1].forEach(function (sd) { for (var j = 0; j < 2; j++) put(crayon(box, snow[0], snow[1], { thick: 0.04, lump: 0.06, ink: INK, order: 21 }), g, [sd * 1.3, 0.45, -0.05 + j * 0.62], [0.29, 0.3, 0.3]); });
          return 1.6; },
        snowman: function (g) { mound(g, 1.2, 1.2);
          [[0.75, 0.7], [0.55, 1.75], [0.4, 2.5]].forEach(function (b) { put(crayon(sphere, snow[0], snow[1], { thick: 0.06, lump: 0.1, ink: INK, order: 21 }), g, [0, b[1], 0], b[0]); });
          [-1, 1].forEach(function (sd) {
            put(crayon(sphere, "#141414", "#141414", { noLine: true, lump: 0.02, order: 22 }), g, [sd * 0.13, 2.62, 0.35], 0.055);
            put(crayon(cyl, "#7a4a33", "#3e2414", { thick: 0.02, lump: 0.02, order: 22 }), g, [sd * 0.85, 1.95, 0], [0.04, 0.9, 0.04], [0, 0, -sd * 1.0]);
          });
          put(crayon(cone, "#ff9f1c", "#c2410c", { thick: 0.03, lump: 0.03, order: 22 }), g, [0, 2.5, 0.52], [0.07, 0.35, 0.07], [Math.PI / 2, 0, 0]);
          put(crayon(cyl, "#2b2340", "#120f22", { thick: 0.03, lump: 0.02, order: 22 }), g, [0, 2.95, 0], [0.32, 0.4, 0.32]);
          put(crayon(cyl, "#2b2340", "#120f22", { thick: 0.03, lump: 0.02, order: 22 }), g, [0, 2.77, 0], [0.5, 0.04, 0.5]);
          return 3.3; },
        castle: function (g) { mound(g, 1.9, 1.4);
          put(crayon(box, ice[0], ice[1], { thick: 0.05, lump: 0.04, ink: INK, order: 21 }), g, [0, 0.7, 0], [0.75, 0.7, 0.55]);
          [-1, 1].forEach(function (sd) {
            put(crayon(cyl, ice[0], ice[1], { thick: 0.05, lump: 0.04, ink: INK, order: 21 }), g, [sd * 1.0, 1.0, 0], [0.38, 2.0, 0.38]);
            put(crayon(cone, "#7fb3ff", "#2f5fb0", { thick: 0.05, lump: 0.05, ink: INK, order: 22 }), g, [sd * 1.0, 2.4, 0], [0.48, 0.8, 0.48]);
          });
          put(crayon(cone, "#7fb3ff", "#2f5fb0", { thick: 0.05, lump: 0.05, ink: INK, order: 22 }), g, [0, 1.75, 0], [0.62, 0.7, 0.5]);
          return 2.9; },
        igloo: function (g) { mound(g, 1.7, 1.6);
          put(crayon(halfSphere, snow[0], snow[1], { thick: 0.06, lump: 0.06, ink: INK, order: 21 }), g, [0, 0.05, 0], [1.25, 1.1, 1.25]);
          put(crayon(cyl, snow[0], snow[1], { thick: 0.05, lump: 0.05, ink: INK, order: 21 }), g, [0, 0.35, 1.1], [0.5, 0.75, 0.5], [Math.PI / 2, 0, 0]);
          put(crayon(sphere, "#2b2340", "#120f22", { noLine: true, lump: 0.02, order: 22 }), g, [0, 0.38, 1.47], [0.33, 0.33, 0.04]);
          return 1.4; },
        icemac: function (g) { mound(g, 1.3, 1.3);
          put(crayon(box, ice[0], ice[1], { thick: 0.05, lump: 0.03, ink: INK, order: 21 }), g, [0, 1.25, 0], [0.62, 1.15, 1.0]);
          [-1, 1].forEach(function (sd) { put(crayon(torus, ice[0], ice[1], { thick: 0.04, lump: 0.02, order: 22 }), g, [0, 2.45, sd * 0.55], [0.38, 0.3, 0.38], [0, Math.PI / 2, 0]); });
          for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) put(crayon(sphere, "#5b8fd6", "#2f5fb0", { noLine: true, lump: 0.02, order: 22 }), g, [0.63, 1.85 - r * 0.32, -0.32 + c * 0.32], 0.06);
          return 2.8; },
        pyramid: function (g) { mound(g, 1.6, 1.2);
          [[-0.9, 0.45], [0, 0.45], [0.9, 0.45], [-0.45, 1.2], [0.45, 1.2], [0, 1.95]].forEach(function (b) { put(crayon(sphere, snow[0], snow[1], { thick: 0.05, lump: 0.12, ink: INK, order: 21 }), g, [b[0], b[1], 0], 0.46); });
          return 2.4; }
      };
      var KIND_FOR = { "v1-ready": "plane", "qb-import": "fort", "habitgotchi": "snowman", "this-is-art": "castle", "rust-http-client": "igloo", "homelab-server": "icemac", "ozzy-portfolio": "pyramid" };
      var GC = new THREE.Vector3(17, GROUND, -7);
      s.picks = [];
      PROJECTS.forEach(function (proj, i) {
        var g = new THREE.Group();
        var a = Math.PI * 1.08 - (i / Math.max(1, PROJECTS.length - 1)) * Math.PI * 1.16;
        g.position.set(GC.x + Math.cos(a) * 5.2, GROUND, GC.z - Math.sin(a) * 3.0);
        g.rotation.y = -Math.cos(a) * 0.35;
        var h = (KINDS[KIND_FOR[proj.slug]] || KINDS.igloo)(g);
        var tip = new THREE.Object3D(); tip.position.set(0, h + 0.5, 0); g.add(tip);
        g.userData.slug = proj.slug;
        w.add(g);
        s.picks.push({ slug: proj.slug, group: g, tip: tip, pop: 1 });
      });
      s.sections = {
        about: { cam: { pos: [M.x + 3.6, top + 1.2, M.z + 7.6], look: [M.x - 1.6, top - 0.3, M.z + 0.6], fov: 42 } },
        projects: { cam: { pos: [GC.x + 1.4, GROUND + 4.6, GC.z + 10.5], look: [GC.x - 2.6, GROUND + 1.1, GC.z - 0.5], fov: 50 } }
      };
      return s;
    },
    update: function (s, t, info) {
      var G = s.GROUND, GX = s.GX, home = info.home;
      var k = clamp01((info.progress - 0.02) / 0.96);
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
      // the summit me shows up for about; the picked sculpture does a little hop
      s.chillShow = info.sbKey === "about" ? (info.sb || 0) : 0;
      s.chill.scale.setScalar(Math.max(0.001, s.chillShow) * 1.1);
      s.chillHead.rotation.y = Math.sin(t * 0.6) * 0.25;
      s.picks.forEach(function (pk) {
        var on = info.selected === pk.slug;
        pk.pop += ((on ? 1.12 : 1) - pk.pop) * 0.1;
        pk.group.scale.setScalar(pk.pop);
        pk.group.position.y = s.GROUND + (on ? Math.abs(Math.sin(t * 4)) * 0.18 : 0);
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
}
