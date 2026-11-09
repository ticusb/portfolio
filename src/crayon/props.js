import * as THREE from "three";
import { jitter } from "./util";

// Little scenery pieces shared by both worlds.
export function createProps(kit) {
  var crayon = kit.crayon, put = kit.put, sphere = kit.geo.sphere, cyl = kit.geo.cyl, torus = kit.geo.torus, box = kit.geo.box;
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
  return { cloud: cloud, sun: sun, macPro: macPro };
}
