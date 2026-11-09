import * as THREE from "three";
import { jitter } from "./util";

/*
 * The void: the inside of my head, where the monologue lives. You get here by zooming into my face.
 * It hangs far above the world (out of sight of everything else) inside its own dark crayon sphere:
 * me floating and slowly tumbling, a thought bubble over my head, and a dust of half-thoughts drifting by.
 * You can grab me and drag me around; I dangle from where you hold me, flail, and drift back when let go.
 */
export var VOID_AT = new THREE.Vector3(0, 1000, 0);

export function buildVoid(kit, w, astro) {
  var crayon = kit.crayon, put = kit.put, g = kit.geo;
  var grp = new THREE.Group();
  grp.position.copy(VOID_AT);
  w.add(grp);
  put(crayon(g.sphere, "#1b1530", "#0b0816", { lump: 0, over: 0, noLine: true, wash: true, side: THREE.BackSide, order: 0.2 }), grp, [0, 0, 0], 40);
  // half-thoughts: little bits of colour drifting in the dark
  var dust = new THREE.Group(); grp.add(dust);
  var cols = [["#c8a8ff", "#7a4fc9"], ["#7fd3ff", "#2f7de1"], ["#ffe27a", "#e0a800"], ["#f7a1c4", "#c2185b"], ["#9db8ff", "#2f5fb0"]];
  for (var i = 0; i < 46; i++) {
    var d = new THREE.Vector3(jitter(1), jitter(0.7), -0.2 - Math.random()).normalize(), r = 5 + Math.random() * 14;
    var c = cols[i % cols.length];
    put(crayon(g.sphereLo, c[0], c[1], { noLine: true, lump: 0.3, order: 1 }), dust, [d.x * r + 1, d.y * r, d.z * r], 0.05 + Math.random() * 0.12);
  }
  // me, hung from a pivot at my head so I dangle from where I'm held
  var S = 0.9, HEAD = 1.62 * S;
  var me = kit.avatar(2, "#e8412c", "#8f1d10", { astro: !!astro });
  var holder = new THREE.Group(); grp.add(holder);
  put(me.group, holder, [0, -HEAD, 0], S);
  var REST = new THREE.Vector3(1.7, -1.0 + HEAD, 0);
  holder.position.copy(REST);
  var bubble = new THREE.Group(); grp.add(bubble);
  // up and to the right of my head, clear of the panel on the left
  [[2.3, 1.05, 0.07], [2.65, 1.45, 0.1], [3.05, 1.9, 0.14]].forEach(function (b) {
    put(crayon(g.sphere, "#e8eefc", "#7f93c8", { thick: 0.03, lump: 0.1, order: 3 }), bubble, [b[0], b[1], 0.2], b[2]);
  });
  kit.props.cloud(bubble, 3.85, 2.65, 0.2, 0.5, 3);
  kit.bake(dust); kit.bake(bubble);

  // a little spring physics, in the void's own space
  var pos = REST.clone(), vel = new THREE.Vector3(), target = new THREE.Vector3(), grabbed = false, grabOff = new THREE.Vector3();
  var swing = 0, swingV = 0, lastT = null, flail = 0, tmp = new THREE.Vector3();
  return {
    me: me,
    head: me.head,
    group: grp,
    hitTarget: me.group,
    cam: { pos: [VOID_AT.x + 0.9, VOID_AT.y + 0.5, VOID_AT.z + 7.4], look: [VOID_AT.x + 0.9, VOID_AT.y + 0.3, VOID_AT.z], fov: 42 },
    // p: a point on the z = 0 plane in the void's space. I hang a little below wherever I'm held
    grab: function (p) { grabbed = true; grabOff.copy(p).sub(pos).multiplyScalar(0.35); target.copy(p).sub(grabOff); },
    drag: function (p) { if (grabbed) target.copy(p).sub(grabOff); },
    release: function () { grabbed = false; },
    isGrabbed: function () { return grabbed; },
    update: function (t, on) {
      grp.visible = !!on;
      if (!on) { lastT = null; return; }
      var dt = lastT == null ? 0 : Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
      // held: a stiff spring to the pointer. let go: a soft one home, with a slow bob
      if (!grabbed) target.set(REST.x, REST.y + Math.sin(t * 0.6) * 0.22, 0);
      var k = grabbed ? 70 : 5, damp = grabbed ? 13 : 2.6;
      tmp.copy(target).sub(pos).multiplyScalar(k).addScaledVector(vel, -damp);
      vel.addScaledVector(tmp, dt); pos.addScaledVector(vel, dt);
      // the body swings under the pivot, pushed by sideways motion
      swingV += (-swing * 30 - swingV * 3.2 - vel.x * 9) * dt; swing += swingV * dt;
      swing = Math.max(-1.2, Math.min(1.2, swing));
      flail += ((grabbed ? 1 : 0) + Math.min(1, vel.length() * 0.25) - flail) * Math.min(1, dt * 4);
      var f = Math.min(1, flail), calm = 1 - f, kick = Math.sin(t * 15);
      holder.position.copy(pos);
      holder.rotation.set(Math.sin(t * 0.3) * 0.25 * calm + vel.y * 0.04, Math.sin(t * 0.2) * 0.55 * calm, swing + Math.sin(t * 0.25) * 0.22 * calm);
      me.head.rotation.y = Math.sin(t * 0.5) * 0.3 * calm + Math.sin(t * 6) * 0.25 * f;
      // arms up and legs kicking while I'm held or flung
      me.hands[0].position.set(-0.64 - 0.1 * f, 0.85 + Math.sin(t * 0.8) * 0.12 * calm + (0.55 + Math.sin(t * 13) * 0.15) * f, 0.06);
      me.hands[1].position.set(0.64 + 0.1 * f, 0.85 + Math.cos(t * 0.7) * 0.12 * calm + (0.55 + Math.cos(t * 12) * 0.15) * f, 0.06);
      me.legs[0].rotation.x = Math.sin(t * 0.5) * 0.3 * calm + kick * 0.8 * f;
      me.legs[1].rotation.x = -Math.sin(t * 0.5) * 0.3 * calm - kick * 0.8 * f;
      bubble.position.set((pos.x - REST.x) * 0.85, (pos.y - REST.y) * 0.85 + Math.sin(t * 0.7 + 1) * 0.1, 0);
      dust.rotation.y = t * 0.02; dust.rotation.z = Math.sin(t * 0.1) * 0.05;
    }
  };
}
