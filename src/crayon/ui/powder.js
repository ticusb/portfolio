// Powder: snow bursting onto the screen (the doodle canvas) when I stop. A big burst is the white-out that
// hides the cut from the intro to home.
export function createPowder(dx, dc, world, camera) {
  var powder = [], powderAt = -1e9;
  function burst(worldPos, big) {
    var v = worldPos.clone().applyMatrix4(world.matrixWorld).project(camera);
    var cx = (v.x + 1) / 2 * window.innerWidth, cy = (1 - v.y) / 2 * window.innerHeight;
    if (big) {
      // white-out: snow slams the lens, a solid wall of it, so the cut behind it can't be seen
      cx = window.innerWidth / 2; cy = window.innerHeight * 0.75;
      dx.save(); dx.fillStyle = "#f6f9ff";
      for (var wy = 0; wy < 2600; wy++) { dx.globalAlpha = 0.5 + Math.random() * 0.5; var rx = Math.random() * window.innerWidth, ry = Math.random() * window.innerHeight; dx.fillRect(rx, ry, 18 + Math.random() * 40, 10 + Math.random() * 26); }
      dx.restore();
      for (var w2 = 0; w2 < 1100; w2++) {
        var a2 = -Math.PI + Math.random() * Math.PI, sp2 = 6 + Math.random() * 26;
        powder.push({ x: cx + (Math.random() - 0.5) * 200, y: cy, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2 * 1.2, r: 6 + Math.random() * 16, life: 0, max: 26 + Math.random() * 30, c: ["#ffffff", "#f4f8ff", "#e6effb", "#d3e3f6"][w2 % 4] });
      }
      powderAt = performance.now() + 500;
      return;
    }
    for (var i = 0; i < 260; i++) {
      var a = -Math.PI * 0.95 + Math.random() * Math.PI * 1.3, sp = 4 + Math.random() * 16;
      powder.push({ x: cx, y: cy, vx: Math.cos(a) * sp + 4, vy: Math.sin(a) * sp - 3, r: 2 + Math.random() * 5, life: 0, max: 30 + Math.random() * 30, c: ["#ffffff", "#eef4ff", "#d9e8fb", "#c4d8f2"][i % 4] });
    }
    powderAt = performance.now();
  }
  function drawPowder() {
    for (var i = powder.length - 1; i >= 0; i--) {
      var q = powder[i];
      q.x += q.vx; q.y += q.vy; q.vy += 0.25; q.vx *= 0.97; q.r *= 1.035; q.life++;
      dx.fillStyle = q.c;
      var nd = Math.min(18, 4 + q.r * 0.6);
      for (var j = 0; j < nd; j++) { dx.globalAlpha = 0.55 + Math.random() * 0.4; var aa = Math.random() * 6.28, rr = Math.random() * q.r; dx.fillRect(q.x + Math.cos(aa) * rr, q.y + Math.sin(aa) * rr, 2.6, 2.6); }
      if (q.life > q.max) powder.splice(i, 1);
    }
    dx.globalAlpha = 1;
    if (performance.now() - powderAt > 900 && performance.now() - powderAt < 5500) {
      dx.save(); dx.setTransform(1, 0, 0, 1, 0, 0); dx.globalCompositeOperation = "destination-out"; dx.fillStyle = "rgba(0,0,0,0.05)"; dx.fillRect(0, 0, dc.width, dc.height); dx.restore();
    }
  }
  return { burst: burst, drawPowder: drawPowder };
}
