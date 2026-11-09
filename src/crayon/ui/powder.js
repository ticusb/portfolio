// Powder: snow bursting onto the screen (the doodle canvas) when I stop. A big burst is the white-out that
// hides the cut from the intro to home. Each flake is a pre-drawn waxy snow blob stamped with drawImage,
// so a burst of a thousand costs a thousand stamps, not tens of thousands of tiny rects.
var COLORS = ["#ffffff", "#f4f8ff", "#e6effb", "#d3e3f6"];
function blobSprite(color) {
  var c = document.createElement("canvas"), s = 64, x = c.getContext("2d");
  c.width = c.height = s; x.fillStyle = color;
  for (var i = 0; i < 90; i++) {
    var a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * s * 0.42;
    x.globalAlpha = 0.5 + Math.random() * 0.45;
    x.fillRect(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 3 + Math.random() * 3, 3 + Math.random() * 3);
  }
  return c;
}
export function createPowder(dx, dc, world, camera) {
  var powder = [], powderAt = -1e9, sprites = null;
  function sprite(i) { if (!sprites) sprites = COLORS.map(blobSprite); return sprites[i % sprites.length]; }
  function burst(worldPos, big) {
    var v = worldPos.clone().applyMatrix4(world.matrixWorld).project(camera);
    var cx = (v.x + 1) / 2 * window.innerWidth, cy = (1 - v.y) / 2 * window.innerHeight;
    var W = window.innerWidth, H = window.innerHeight;
    if (big) {
      // white-out: snow slams the lens, a solid wall of it, so the cut behind it can't be seen
      cx = W / 2; cy = H * 0.75;
      dx.save();
      dx.globalAlpha = 0.9; dx.fillStyle = "#f6f9ff"; dx.fillRect(0, 0, W, H);
      for (var wy = 0; wy < 420; wy++) { dx.globalAlpha = 0.6 + Math.random() * 0.4; var sz = 50 + Math.random() * 110; dx.drawImage(sprite(wy), Math.random() * W - sz / 2, Math.random() * H - sz / 2, sz, sz); }
      dx.restore();
      for (var w2 = 0; w2 < 700; w2++) {
        var a2 = -Math.PI + Math.random() * Math.PI, sp2 = 6 + Math.random() * 26;
        powder.push({ x: cx + (Math.random() - 0.5) * 200, y: cy, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2 * 1.2, r: 6 + Math.random() * 16, life: 0, max: 26 + Math.random() * 30, c: w2 });
      }
      powderAt = performance.now() + 500;
      return;
    }
    for (var i = 0; i < 200; i++) {
      var a = -Math.PI * 0.95 + Math.random() * Math.PI * 1.3, sp = 4 + Math.random() * 16;
      powder.push({ x: cx, y: cy, vx: Math.cos(a) * sp + 4, vy: Math.sin(a) * sp - 3, r: 2 + Math.random() * 5, life: 0, max: 30 + Math.random() * 30, c: i });
    }
    powderAt = performance.now();
  }
  function drawPowder() {
    if (powder.length) {
      for (var i = powder.length - 1; i >= 0; i--) {
        var q = powder[i];
        q.x += q.vx; q.y += q.vy; q.vy += 0.25; q.vx *= 0.97; q.r *= 1.035; q.life++;
        dx.globalAlpha = 0.85;
        dx.drawImage(sprite(q.c), q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        if (q.life > q.max) powder.splice(i, 1);
      }
      dx.globalAlpha = 1;
    }
    var since = performance.now() - powderAt;
    if (since > 900 && since < 5500) {
      dx.save(); dx.setTransform(1, 0, 0, 1, 0, 0); dx.globalCompositeOperation = "destination-out"; dx.fillStyle = "rgba(0,0,0,0.05)"; dx.fillRect(0, 0, dc.width, dc.height); dx.restore();
    } else if (since >= 5500 && since < 5600) {
      dx.save(); dx.setTransform(1, 0, 0, 1, 0, 0); dx.clearRect(0, 0, dc.width, dc.height); dx.restore();
    }
  }
  return { burst: burst, drawPowder: drawPowder };
}
