import * as THREE from "three";
import { jitter } from "./util";
import { fillVert, fillFrag, lineVert, lineFrag, bakedFillVert, bakedFillFrag, bakedLineVert, bakedLineFrag } from "./shaders";

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
  /*
   * bake(group, exclude): merge every static crayon mesh under `group` into at most three draw calls (fills,
   * outlines, second outlines), drawn with the baked shaders so they look exactly as before. The group's own
   * transform stays live, so a baked sculpture can still hop. Leave out anything that animates on its own
   * (pass those subtrees in `exclude`); washes, cut-outs and see-through things are skipped automatically.
   */
  var bakedUniforms = { uTime: shared.uTime, uDpr: shared.uDpr, uRes: shared.uRes, uReveal: shared.uReveal, uCursor: shared.uCursor };
  var NOBAKE = /[?&]nobake\b/.test(window.location.search); // dailies: compare against the unbaked scene
  // Bakes are queued and run after the world is built (flushBakes): three gives every new object an id from
  // Math.random, so baking mid-build would reshuffle every later object's random crayon angle and seed.
  // liveScale: bake as if the group were at this scale (things built at 0.001 that grow in later), since
  // outline thickness depends on the object's real size.
  var pending = [];
  function bake(group, exclude, liveScale) { pending.push(function () { bakeNow(group, exclude, liveScale); }); }
  function flushBakes() { var p = pending; pending = []; if (!NOBAKE) p.forEach(function (f) { f(); }); }
  function bakeNow(group, exclude, liveScale) {
    exclude = exclude || [];
    var savedScale = null;
    if (liveScale != null) { savedScale = group.scale.clone(); group.scale.setScalar(liveScale); }
    group.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    var buckets = { fill: [], line: [], line2: [] };
    group.traverse(function (o) {
      if (!o.isMesh || !o.material || !o.material.uniforms) return;
      for (var q = o; q && q !== group; q = q.parent) if (!q.visible || exclude.indexOf(q) >= 0) return;
      var m = o.material, u = m.uniforms;
      if (m.vertexShader === fillVert) {
        if (u.uWash.value || u.uAlpha.value !== 1 || u.uCut.value.z > 0.5 || m.side !== THREE.FrontSide || m.transparent) return;
        buckets.fill.push(o);
      } else if (m.vertexShader === lineVert) (o.userData.pass2 ? buckets.line2 : buckets.line).push(o);
    });
    ["fill", "line", "line2"].forEach(function (kind) {
      var list = buckets[kind];
      if (list.length < 2) return;
      var mesh = mergeMeshes(list, kind !== "fill", inv);
      if (kind === "line2") mesh.userData.pass2 = true;
      group.add(mesh);
      list.forEach(function (o) { o.parent.remove(o); o.material.dispose(); });
    });
    if (savedScale) { group.scale.copy(savedScale); group.updateMatrixWorld(true); }
  }
  function mergeMeshes(list, isLine, inv) {
    var nv = 0, ni = 0;
    list.forEach(function (o) { nv += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; });
    var A = function (n) { return new Float32Array(nv * n); };
    var pos = A(3), obj = A(3), nrmM = A(3), extra = A(3), colA = A(3), colB = isLine ? null : A(3), prm = A(4), dly = A(1), sh = A(2);
    var idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    var v = new THREE.Vector3(), n = new THREE.Vector3(), sc = new THREE.Vector3(), rel = new THREE.Matrix4(), m3 = new THREE.Matrix3(), nm = new THREE.Matrix3();
    var vo = 0, io = 0;
    list.forEach(function (o) {
      var g = o.geometry, P = g.attributes.position, N = g.attributes.normal, u = o.material.uniforms;
      rel.multiplyMatrices(inv, o.matrixWorld); m3.setFromMatrix4(rel); nm.getNormalMatrix(rel);
      sc.setFromMatrixScale(o.matrixWorld);
      var k = isLine ? u.uThick.value * Math.min(1, (sc.x + sc.y + sc.z) / 3) : 0;
      var c1 = isLine ? u.uInk.value : u.uColor.value, c2 = isLine ? null : u.uShade.value;
      var p4 = [u.uSeed.value, u.uLump.value, isLine ? 0 : u.uOver.value, isLine ? 0 : u.uAngle.value];
      for (var i = 0; i < P.count; i++) {
        var j = vo + i;
        v.fromBufferAttribute(P, i); obj.set([v.x, v.y, v.z], j * 3);
        v.applyMatrix4(rel); pos.set([v.x, v.y, v.z], j * 3);
        n.fromBufferAttribute(N, i);
        v.copy(n).applyMatrix3(m3); nrmM.set([v.x, v.y, v.z], j * 3);
        if (isLine) v.set(n.x * k / sc.x, n.y * k / sc.y, n.z * k / sc.z).applyMatrix3(m3);
        else v.copy(n).applyMatrix3(nm).normalize();
        extra.set([v.x, v.y, v.z], j * 3);
        colA.set([c1.r, c1.g, c1.b], j * 3); if (colB) colB.set([c2.r, c2.g, c2.b], j * 3);
        prm.set(p4, j * 4); dly[j] = u.uDelay.value; sh.set([u.uShift.value.x, u.uShift.value.y], j * 2);
      }
      if (g.index) for (var t = 0; t < g.index.count; t++) idx[io++] = g.index.getX(t) + vo;
      else for (var t2 = 0; t2 < P.count; t2++) idx[io++] = t2 + vo;
      vo += P.count;
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aObj", new THREE.BufferAttribute(obj, 3));
    geo.setAttribute("aNrmM", new THREE.BufferAttribute(nrmM, 3));
    geo.setAttribute(isLine ? "aNrmLine" : "aNrmW", new THREE.BufferAttribute(extra, 3));
    geo.setAttribute(isLine ? "aInk" : "aColor", new THREE.BufferAttribute(colA, 3));
    if (colB) geo.setAttribute("aShade", new THREE.BufferAttribute(colB, 3));
    geo.setAttribute("aP", new THREE.BufferAttribute(prm, 4));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(dly, 1));
    geo.setAttribute("aShift", new THREE.BufferAttribute(sh, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    var mat = new THREE.ShaderMaterial({ vertexShader: isLine ? bakedLineVert : bakedFillVert, fragmentShader: isLine ? bakedLineFrag : bakedFillFrag, side: isLine ? THREE.BackSide : THREE.FrontSide, uniforms: bakedUniforms });
    return new THREE.Mesh(geo, mat);
  }
  // bake loose static things that sit directly in the world: gather them in one container first
  function bakeAll(parent, objs) {
    pending.push(function () {
      var box = new THREE.Group(); parent.add(box);
      objs.forEach(function (o) { box.add(o); });
      bakeNow(box);
    });
  }
  return { crayon: crayon, put: put, bake: bake, bakeAll: bakeAll, flushBakes: flushBakes, geo: { sphere: sphere, sphereLo: sphereLo, halfSphere: halfSphere, cone: cone, cyl: cyl, torus: torus, thinTorus: thinTorus, plane: plane, box: box } };
}
