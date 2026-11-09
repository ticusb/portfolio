import * as THREE from "three";
import { jitter } from "./util";

/*
 * The void: the inside of my head, where the monologue lives. You get here by zooming into my face.
 * It hangs far above the world (out of sight of everything else) inside its own dark crayon sphere:
 * me floating and slowly tumbling, a thought bubble over my head, and a dust of half-thoughts drifting by.
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
  // me, floating, with a thought bubble: three dots rising to a cloud
  var me = kit.avatar(2, "#e8412c", "#8f1d10", { astro: !!astro });
  var body = put(me.group, grp, [1.7, -1.0, 0], 0.9);
  var bubble = new THREE.Group(); grp.add(bubble);
  [[1.15, 0.95, 0.07], [0.85, 1.35, 0.1], [0.45, 1.8, 0.14]].forEach(function (b) {
    put(crayon(g.sphere, "#e8eefc", "#7f93c8", { thick: 0.03, lump: 0.1, order: 3 }), bubble, [b[0], b[1], 0.2], b[2]);
  });
  kit.props.cloud(bubble, -0.35, 2.55, 0.2, 0.5, 3);
  return {
    me: me,
    head: me.head,
    cam: { pos: [VOID_AT.x + 0.9, VOID_AT.y + 0.5, VOID_AT.z + 7.4], look: [VOID_AT.x + 0.9, VOID_AT.y + 0.3, VOID_AT.z], fov: 42 },
    update: function (t, on) {
      grp.visible = !!on;
      if (!on) return;
      body.position.y = -1.0 + Math.sin(t * 0.6) * 0.22;
      body.rotation.set(Math.sin(t * 0.3) * 0.25, Math.sin(t * 0.2) * 0.55, Math.sin(t * 0.25) * 0.22);
      me.head.rotation.y = Math.sin(t * 0.5) * 0.3;
      me.hands[0].position.set(-0.64, 0.85 + Math.sin(t * 0.8) * 0.12, 0.06);
      me.hands[1].position.set(0.64, 0.85 + Math.cos(t * 0.7) * 0.12, 0.06);
      me.legs[0].rotation.x = Math.sin(t * 0.5) * 0.3; me.legs[1].rotation.x = -Math.sin(t * 0.5) * 0.3;
      bubble.position.y = Math.sin(t * 0.7 + 1) * 0.1;
      dust.rotation.y = t * 0.02; dust.rotation.z = Math.sin(t * 0.1) * 0.05;
    }
  };
}
