import * as THREE from "three";
import { smooth } from "./util";

// The camera rig. base() places the camera along the intro (the flat-to-3D dolly zoom, then the walk);
// aim() points it: follow me, blend to the home shot, blend to a section's shot, then add the mouse look.
export function createRig(camera, world, shared) {
  var lookV = new THREE.Vector3();
  function base(c, progress, VIEW_H, now, reduce, look) {
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
    look.yaw += (look.tx * 1.25 - look.yaw) * (reduce ? 1 : 0.06);
    look.pitch += (look.ty * 0.55 - look.pitch) * (reduce ? 1 : 0.06);
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
      var aspectFix = camera.aspect < 1 ? 1.5 : 1;
      camera.position.lerp(new THREE.Vector3(sc.pos[0], sc.pos[1], sc.pos[2]).applyMatrix4(world.matrixWorld), se);
      lookV.lerp(new THREE.Vector3(sc.look[0], sc.look[1], sc.look[2]).applyMatrix4(world.matrixWorld), se);
      camera.fov = camera.fov + (Math.min(80, sc.fov * aspectFix) - camera.fov) * se;
    }
    camera.lookAt(lookV);
    var hv = THREE.MathUtils.degToRad(camera.fov / 2);
    shared.uHalfFov.value.set(Math.atan(Math.tan(hv) * camera.aspect), hv);
    // the mouse can only turn your head a little past the frame, so the code shows as a margin
    camera.rotateY(-(look.yaw / 1.25) * shared.uHalfFov.value.x * 0.18);
    camera.rotateX(-(look.pitch / 0.55) * hv * 0.18);
    camera.updateProjectionMatrix();
  }
  return { base: base, aim: aim };
}
