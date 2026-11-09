import * as THREE from "three";
import { faceVert, faceFrag } from "./shaders";
import { TOTAL } from "./materials";

/* me: a chibi toy with Ticus's face framed in a helmet (race helmet + goggles, or an astronaut bubble) */
export function createAvatar(kit, shared, faceTex) {
  var crayon = kit.crayon, put = kit.put, g0 = kit.geo;
  var sphere = g0.sphere, thinTorus = g0.thinTorus, torus = g0.torus, cyl = g0.cyl, box = g0.box;
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
        uRes: shared.uRes, uCursor: shared.uCursor, uHit: shared.uHit, uSim: shared.uSim, uKeep: { value: 0 }
      }
    });
    put(h, head, [0, 0, 0], [0.66, 0.72, 0.64]);
    // the helmet: a shell over the whole head with an oval opening, so the photo face sits in a frame
    var shellC = astro ? ["#f4f4f0", "#9a9cab"] : ["#e8412c", "#8f1d10"];
    put(crayon(sphere, shellC[0], shellC[1], { thick: 0.06, lump: 0.015, cut: [0.8, 0.92], order: order + 0.3 }), head, [0, 0, 0], [0.71, 0.78, 0.69]);
    put(crayon(thinTorus, astro ? "#c4c8d4" : "#ffc93c", astro ? "#7a7d92" : "#c27a00", { thick: 0.03, lump: 0.02, order: order + 0.4 }), head, [0, -0.04, 0.4], [0.57, 0.72, 0.5], [-0.08, 0, 0]);
    if (astro) {
      put(crayon(sphere, "#cfefff", "#5b8fd6", { noLine: true, lump: 0, over: 0, alpha: 0.2, order: order + 0.5 }), head, [0, 0.02, 0.04], [0.86, 0.92, 0.86]);
      put(crayon(torus, "#e4e6ee", "#8d91a3", { thick: 0.04, lump: 0.02, order: order + 0.5 }), head, [0, -0.66, 0], [0.62, 0.62, 0.5], [Math.PI / 2, 0, 0]);
      put(crayon(cyl, "#c4c8d4", "#7a7d92", { thick: 0.03, lump: 0.02, order: order + 0.5 }), head, [0.42, 0.62, -0.1], [0.025, 0.3, 0.025], [0, 0, -0.35]);
      put(crayon(sphere, "#e8412c", "#8f1d10", { noLine: true, lump: 0.05, order: order + 0.5 }), head, [0.48, 0.78, -0.1], 0.06);
    } else {
      // goggles pushed up on top, and a racing stripe
      [-1, 1].forEach(function (sd) {
        put(crayon(sphere, "#7fd3ff", "#2f7de1", { thick: 0.04, lump: 0.03, order: order + 0.5 }), head, [sd * 0.2, 0.66, 0.26], [0.17, 0.12, 0.08], [-0.75, sd * 0.25, 0]);
      });
      put(crayon(box, "#2b2340", "#120f22", { noLine: true, lump: 0.01, order: order + 0.5 }), head, [0, 0.66, 0.24], [0.06, 0.03, 0.05], [-0.75, 0, 0]);
      put(crayon(box, "#ffffff", "#c9ccd6", { noLine: true, lump: 0.01, order: order + 0.5 }), head, [0, 0.62, -0.32], [0.07, 0.04, 0.42], [0.62, 0, 0]);
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
  return avatar;
}
