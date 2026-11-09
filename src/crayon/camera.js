import * as THREE from "three";
import { smooth } from "./util";

// The camera rig. Worlds with authored shots (ski) hand it a pose per frame: still() + pose().
// Older worlds (space, until it gets its beats) use base() + aim(): the intro's blended dolly zoom and walk.
// Either way finish() blends to the home shot, then to a section's shot, then adds the mouse look.
// a vertical fov that keeps about the same width of world in view on a portrait screen
export function fitFov(fov, aspect) {
  if (aspect >= 1) return fov;
  return Math.min(80, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) / aspect * 0.8)));
}

export function createRig(camera, world, shared) {
  var lookV = new THREE.Vector3();
  // the head turns toward the mouse with the same ease at any frame rate (f60 = frames' worth of time at 60fps)
  function easeLook(look, reduce, f60) {
    var k = reduce ? 1 : 1 - Math.pow(1 - 0.06, f60 == null ? 1 : f60);
    look.yaw += (look.tx * 1.25 - look.yaw) * k;
    look.pitch += (look.ty * 0.55 - look.pitch) * k;
  }
  function base(c, progress, VIEW_H, now, reduce, look, f60) {
    var wake = smooth(0.06, 0.42, progress);
    var walk = smooth(0.42, 1.0, progress);
    var fov = 8 + wake * 44;
    var dist = (VIEW_H / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.fov = fov;
    camera.position.set(c.walk[0] * walk, 0.4 + c.walk[1] * walk, dist + c.walk[2] * walk);
    camera.near = 0.1; camera.far = dist + 700;
    var sway = reduce ? 0 : Math.sin(now / 1000 * 0.3) * 0.08;
    world.rotation.y = c.yaw * wake + walk * c.orbit + sway * 0.5 * wake;
    world.rotation.x = 0;
    // look too far toward the edge of the world and the simulation breaks; let go and it snaps back
    easeLook(look, reduce, f60);
    return { wake: wake, walk: walk };
  }
  function aim(c, state, walk, homeBlend, sectionBlend, sectionCam, look) {
    lookV.set(c.look[0] + c.lookWalk[0] * walk, c.look[1] + c.lookWalk[1] * walk, c.look[2] + c.lookWalk[2] * walk);
    if (c.follow && state.focus) {
      var f = state.focus.clone().applyMatrix4(world.matrixWorld);
      lookV.lerp(f, c.follow * walk);
      camera.position.x += (f.x - camera.position.x) * 0.5 * c.follow * walk;
      camera.position.y += (f.y + 2.5 - camera.position.y) * 0.5 * c.follow * walk;
    }
    finish(state, homeBlend, sectionBlend, sectionCam, look);
  }
  // authored shots: the world sits still and the camera goes exactly where the shot says
  function still(look, reduce, f60) {
    world.rotation.set(0, 0, 0);
    easeLook(look, reduce, f60);
  }
  function pose(p, state, homeBlend, sectionBlend, sectionCam, look) {
    camera.position.copy(p.pos);
    lookV.copy(p.look);
    // portrait screens: keep roughly the same width of world in view, unless the shot frames itself
    camera.fov = p.framed ? p.fov : fitFov(p.fov, camera.aspect);
    camera.near = 0.1; camera.far = p.far || 800;
    finish(state, homeBlend, sectionBlend, sectionCam, look);
  }
  function finish(state, homeBlend, sectionBlend, sectionCam, look) {
    if (homeBlend > 0 && state.homeCam) {
      var hc = state.homeCam;
      var hp = new THREE.Vector3(hc.pos[0], hc.pos[1], hc.pos[2]).applyMatrix4(world.matrixWorld);
      var hl = new THREE.Vector3(hc.look[0], hc.look[1], hc.look[2]).applyMatrix4(world.matrixWorld);
      camera.position.lerp(hp, homeBlend);
      lookV.lerp(hl, homeBlend);
      var hfov = camera.aspect < 1 ? Math.min(82, hc.fov * (1.25 / camera.aspect)) : hc.fov;
      camera.fov = camera.fov + (hfov - camera.fov) * homeBlend;
    }
    if (sectionBlend > 0.001 && sectionCam) {
      var sc = sectionCam, se = sectionBlend * sectionBlend * (3 - 2 * sectionBlend);
      // a phone is narrow: shots that need the width (pull) back further away along their own line
      if (camera.aspect < 1 && sc.pull) sc = { pos: sc.look.map(function (l, i) { return l + (sc.pos[i] - l) * sc.pull; }), look: sc.look, fov: sc.fov };
      var aspectFix = camera.aspect < 1 ? 1.5 : 1;
      camera.position.lerp(new THREE.Vector3(sc.pos[0], sc.pos[1], sc.pos[2]).applyMatrix4(world.matrixWorld), se);
      lookV.lerp(new THREE.Vector3(sc.look[0], sc.look[1], sc.look[2]).applyMatrix4(world.matrixWorld), se);
      camera.fov = camera.fov + (Math.min(80, sc.fov * aspectFix) - camera.fov) * se;
    }
    // a travel shot on top of everything else (switching worlds): pull toward travel.pose by travel.w
    if (travel && travel.w > 0.0001) {
      var tp = travel.pose, tw = travel.w;
      camera.position.lerp(new THREE.Vector3(tp.pos[0], tp.pos[1], tp.pos[2]).applyMatrix4(world.matrixWorld), tw);
      lookV.lerp(new THREE.Vector3(tp.look[0], tp.look[1], tp.look[2]).applyMatrix4(world.matrixWorld), tw);
      camera.fov += (tp.fov - camera.fov) * tw;
    }
    camera.lookAt(lookV);
    var hv = THREE.MathUtils.degToRad(camera.fov / 2);
    shared.uHalfFov.value.set(Math.atan(Math.tan(hv) * camera.aspect), hv);
    // the mouse can only turn your head a little past the frame, so the code shows as a margin
    camera.rotateY(-(look.yaw / 1.25) * shared.uHalfFov.value.x * 0.18);
    camera.rotateX(-(look.pitch / 0.55) * hv * 0.18);
    // on a phone a section's panel is a bottom sheet, so tilt down to lift the world into the top half
    if (camera.aspect < 1 && sectionBlend > 0.001) camera.rotateX(-hv * 0.3 * sectionBlend * sectionBlend * (3 - 2 * sectionBlend));
    camera.updateProjectionMatrix();
  }
  var travel = null;
  // travel: { pose: { pos, look, fov } in world space-of-the-scene, w: 0..1 } or null
  function setTravel(t) { travel = t; }
  return { base: base, aim: aim, still: still, pose: pose, setTravel: setTravel };
}
