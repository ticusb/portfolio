// Visitor doodles (click-drag to draw in wax crayon that slowly fades), plus where the pointer is looking:
// the mouse position steers the camera, and on touch a sideways swipe turns your head.
export function createDoodle(byId, listen, hint) {
  var dc = byId("doodle");
  var dx = dc.getContext("2d");
  var lastPt = null, drawing = false, inkIdx = 0;
  var inks = ["#e8412c", "#2f7de1", "#3aa655", "#ffbf1f", "#f27bb0", "#7a4fc9"];
  function waxDab(x, y, color) {
    lastInk = performance.now();
    dx.fillStyle = color;
    for (var i = 0; i < 16; i++) {
      var a = Math.random() * Math.PI * 2, rr = Math.random() * 5.5;
      dx.globalAlpha = 0.25 + Math.random() * 0.45;
      dx.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.6, 1.6);
    }
    dx.globalAlpha = 1;
  }
  var canDraw = function () { return false; };
  listen(dc, "pointerdown", function (e) {
    if (e.pointerType !== "mouse" || !canDraw()) return;
    drawing = true; inkIdx = (inkIdx + 1) % inks.length; lastPt = { x: e.clientX, y: e.clientY }; waxDab(e.clientX, e.clientY, inks[inkIdx]);
  });
  listen(window, "pointerup", function () { drawing = false; });
  listen(dc, "pointermove", function (e) {
    if (!drawing || e.pointerType !== "mouse") return;
    var ddx = e.clientX - lastPt.x, ddy = e.clientY - lastPt.y, steps = Math.max(1, Math.ceil(Math.hypot(ddx, ddy) / 1.5));
    for (var i = 1; i <= steps; i++) waxDab(lastPt.x + ddx * i / steps, lastPt.y + ddy * i / steps, inks[inkIdx]);
    lastPt = { x: e.clientX, y: e.clientY };
  });
  function sizeDoodle() {
    var r = Math.min(window.devicePixelRatio || 1, 2);
    dc.width = Math.round(window.innerWidth * r); dc.height = Math.round(window.innerHeight * r);
    dx.setTransform(r, 0, 0, r, 0, 0);
  }
  sizeDoodle();
  listen(window, "resize", sizeDoodle);
  // drag to look around; turn too far from the scene and the simulation breaks
  // the camera looks where the mouse is; on touch, a sideways swipe turns your head
  var look = { yaw: 0, pitch: 0, tx: 0, ty: 0 };
  listen(window, "pointermove", function (e) {
    if (e.pointerType === "mouse") {
      look.ui = !!(e.target && e.target.closest && e.target.closest(".tunes, .panel, .picker, .worldnav a, .replay, .pick, .gate"));
      look.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      look.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (Math.abs(look.tx) > 0.2) hint.style.opacity = "0";
    } else if (lastPt) {
      look.tx = Math.max(-1, Math.min(1, look.tx + (e.clientX - lastPt.x) / window.innerWidth * 2));
      lastPt = { x: e.clientX, y: e.clientY };
    }
  });
  listen(window, "pointerdown", function (e) { if (e.pointerType !== "mouse") lastPt = { x: e.clientX, y: e.clientY }; });
  listen(window, "pointerup", function (e) { if (e.pointerType !== "mouse") lastPt = null; });

  // doodles fade slowly; once nothing has been drawn for a while, stop paying for a full-screen fade every frame
  var lastInk = 0;
  function fadeDoodles() {
    if (!lastInk) return;
    if (performance.now() - lastInk > 22000) { dx.save(); dx.setTransform(1, 0, 0, 1, 0, 0); dx.clearRect(0, 0, dc.width, dc.height); dx.restore(); lastInk = 0; return; }
    dx.save();
    dx.setTransform(1, 0, 0, 1, 0, 0);
    dx.globalCompositeOperation = "destination-out";
    dx.fillStyle = "rgba(0,0,0,0.006)";
    dx.fillRect(0, 0, dc.width, dc.height);
    dx.restore();
  }
  return { dc: dc, dx: dx, look: look, fadeDoodles: fadeDoodles, setCanDraw: function (fn) { canDraw = fn; } };
}
