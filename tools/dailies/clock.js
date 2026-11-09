// Injected before any page script by film.mjs. Replaces time with a fake clock that only moves when the
// driver calls window.__tick(), so every frame is exactly 1/30s apart no matter how slow the capture is.
// CSS animations and transitions are paused and seeked along with it. Math.random is seeded.
(function () {
  var s = 1234567;
  Math.random = function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  var now = 0, seq = 0, timers = [], rafs = [], started = false;
  // time stands still until the driver starts the clock, so nothing depends on how long the page took to load
  performance.now = function () { return now; };
  var rST = window.setTimeout.bind(window), rCT = window.clearTimeout.bind(window), rSI = window.setInterval.bind(window), rCI = window.clearInterval.bind(window), rRAF = window.requestAnimationFrame.bind(window), rCAF = window.cancelAnimationFrame.bind(window);
  // before the clock starts, everything runs in real time so the app can load
  window.setTimeout = function (fn, ms) { var a = [].slice.call(arguments, 2); if (!started) return rST.apply(null, arguments); var id = ++seq + 1e7; timers.push({ id: id, at: now + (ms || 0), fn: fn, args: a }); return id; };
  window.setInterval = function (fn, ms) { if (!started) return rSI.apply(null, arguments); var id = ++seq + 1e7; timers.push({ id: id, at: now + ms, fn: fn, every: Math.max(1, ms), args: [] }); return id; };
  window.clearTimeout = window.clearInterval = function (id) { if (id > 1e7) timers = timers.filter(function (t) { return t.id !== id; }); else { rCT(id); rCI(id); } };
  window.requestAnimationFrame = function (cb) { var id = ++seq + 1e7; rafs.push({ id: id, cb: cb }); return id; };
  window.cancelAnimationFrame = function (id) { rafs = rafs.filter(function (r) { return r.id !== id; }); rCAF(id); };
  function syncAnims(dt) {
    document.getAnimations().forEach(function (a) {
      if (!a.__f) { a.__f = 1; a.pause(); a.__t = a.currentTime || 0; }
      a.__t += dt; a.currentTime = a.__t;
    });
  }
  // CSS animations are held at their first frame while the page loads, same as JS time
  var hold = rSI(function () { if (!started && document.getAnimations) syncAnims(0); }, 10);
  window.__fakeClock = true;
  window.__start = function () { started = true; clearInterval(hold); rCI(hold); };
  window.__now = function () { return now; };
  window.__tick = function (dt) {
    dt = dt || 1000 / 30; now += dt;
    for (;;) {
      timers.sort(function (a, b) { return a.at - b.at || a.id - b.id; });
      var t = timers[0]; if (!t || t.at > now) break;
      if (t.every) t.at += t.every; else timers.shift();
      try { t.fn.apply(null, t.args); } catch (e) { console.error(e); }
    }
    var r = rafs; rafs = []; r.forEach(function (x) { try { x.cb(now); } catch (e) { console.error(e); } });
    syncAnims(dt);
    return now;
  };
})();
