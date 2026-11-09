import * as THREE from "three";
import { jitter } from "./util";
import { fillVert, fillFrag, lineVert, lineFrag } from "./shaders";

// draw order runs 0..TOTAL; an object's `order` decides when it appears during the draw-in
export var TOTAL = 34;

// The kit every world builds with: crayon(geometry, colour, shade, opts) makes a crayon-shaded mesh with
// ink outlines, put() places it, and geo holds the shared geometries.
export function createKit(shared, coarse) {
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
        uTime: shared.uTime, uDpr: shared.uDpr, uRes: shared.uRes, uReveal: shared.uReveal, uCursor: shared.uCursor,
        uAngle: { value: Math.random() * Math.PI }, uSeed: { value: seed }, uDelay: { value: delay },
        uLump: { value: lump }, uOver: { value: opts.over != null ? opts.over : 0.06 }, uWash: { value: opts.wash ? 1 : 0 }, uAlpha: { value: opts.alpha != null ? opts.alpha : 1 }, uCut: { value: new THREE.Vector3(opts.cut ? opts.cut[0] : 1, opts.cut ? opts.cut[1] : 1, opts.cut ? 1 : 0) },
        uShift: { value: new THREE.Vector2(jitter(8), jitter(6)) }
      }
    })));
    if (opts.noLine) return g;
    var ink = opts.ink ? new THREE.Color(opts.ink) : new THREE.Color(shade).multiplyScalar(0.5);
    var passes = (coarse || (opts.thick || 0.07) < 0.06) ? 1 : 2;
    for (var pass = 0; pass < passes; pass++) {
      var line = new THREE.Mesh(geom, new THREE.ShaderMaterial({
        vertexShader: lineVert, fragmentShader: lineFrag, side: THREE.BackSide,
        uniforms: {
          uInk: { value: ink }, uTime: shared.uTime, uDpr: shared.uDpr, uRes: shared.uRes, uReveal: shared.uReveal, uCursor: shared.uCursor,
          uSeed: { value: seed }, uDelay: { value: Math.min(1, delay + pass * 0.06) },
          uLump: { value: lump }, uThick: { value: (opts.thick || 0.07) * (pass ? 0.7 : 1) },
          uShift: { value: new THREE.Vector2(jitter(4), jitter(4)) }
        }
      }));
      if (pass) line.userData.pass2 = true;
      g.add(line);
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

  // tessellation: the lumps and wobbly outlines hide facets, so this stays modest (and lower on phones,
  // where every vertex runs the crayon noise up to three times: the fill and two outline shells)
  var D = coarse ? { u: 20, v: 14 } : { u: 28, v: 20 };
  var sphere = new THREE.SphereGeometry(1, D.u, D.v);
  var sphereLo = new THREE.SphereGeometry(1, 12, 8);
  var halfSphere = new THREE.SphereGeometry(1, D.u, Math.round(D.v * 0.55), 0, Math.PI * 2, 0, Math.PI / 2);
  var cone = new THREE.ConeGeometry(1, 1, D.u, coarse ? 3 : 4);
  var cyl = new THREE.CylinderGeometry(1, 1, 1, coarse ? 12 : 16, coarse ? 2 : 4);
  var torus = new THREE.TorusGeometry(1, 0.22, coarse ? 8 : 10, coarse ? 18 : 24);
  var thinTorus = new THREE.TorusGeometry(1, 0.1, 8, coarse ? 28 : 36);
  var plane = new THREE.PlaneGeometry(1, 1, 24, 16);
  // a sphere pushed toward a cube: boxy but with smooth normals, so the lumps and outlines don't crack
  var box = (function () {
    var g = new THREE.SphereGeometry(1, D.u, D.v);
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
  return { crayon: crayon, put: put, geo: { sphere: sphere, sphereLo: sphereLo, halfSphere: halfSphere, cone: cone, cyl: cyl, torus: torus, thinTorus: thinTorus, plane: plane, box: box } };
}
