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
  // at home a drag draws, mouse or finger, same as on the web (with no tilt, a finger drag only looks around in
  // the sections, where there's nothing to draw on)
  var drawId = null;
  listen(dc, "pointerdown", function (e) {
    if (!canDraw()) return;
    drawing = true; drawId = e.pointerId; inkIdx = (inkIdx + 1) % inks.length; lastPt = { x: e.clientX, y: e.clientY }; waxDab(e.clientX, e.clientY, inks[inkIdx]);
  });
  function stopDrawing() { drawing = false; drawId = null; }
  listen(window, "pointerup", stopDrawing); listen(window, "pointercancel", stopDrawing);
  listen(dc, "pointermove", function (e) {
    if (!drawing || e.pointerId !== drawId) return;
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
  // the camera looks where the mouse is (or where the phone is tilted); look too far and the simulation breaks
  var look = { yaw: 0, pitch: 0, tx: 0, ty: 0 };
  listen(window, "pointermove", function (e) {
    if (e.pointerType === "mouse") {
      look.ui = !!(e.target && e.target.closest && e.target.closest(".tunes, .panel, .picker, .worldnav a, .replay, .pick, .gate"));
      look.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      look.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (Math.abs(look.tx) > 0.2) hint.style.opacity = "0";
    } else if (touch && !tilt && !drawing) {
      // touch, no tilt, not drawing: dragging pans your view; drag far enough toward an edge and the sim shows there
      look.tx = Math.max(-1, Math.min(1, (e.clientX - touch.x) / (window.innerWidth * 0.45)));
      look.ty = Math.max(-1, Math.min(1, (e.clientY - touch.y) / (window.innerHeight * 0.45)));
    }
  });
  var touch = null;
  listen(window, "pointerdown", function (e) { if (e.pointerType !== "mouse") touch = { x: e.clientX, y: e.clientY }; });
  function lift(e) { if (e.pointerType === "mouse") return; touch = null; if (!tilt) { look.tx = 0; look.ty = 0; } } // let go: it eases back
  listen(window, "pointerup", lift); listen(window, "pointercancel", lift);

  // tilt: on a phone, tipping it toward an edge is "looking" there. The neutral position slowly follows however
  // you're holding it, so only a deliberate tilt reaches the edge of the sim. iOS asks permission, so this is
  // switched on from the tap that starts the drawing.
  var tilt = null;
  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;
    var ang = (window.screen && window.screen.orientation && window.screen.orientation.angle) || window.orientation || 0;
    var x = e.gamma, y = e.beta;
    if (ang === 90) { x = e.beta; y = -e.gamma; } else if (ang === -90 || ang === 270) { x = -e.beta; y = e.gamma; }
    if (!tilt) tilt = { x0: x, y0: y };
    tilt.x0 += (x - tilt.x0) * 0.004; tilt.y0 += (y - tilt.y0) * 0.004;
    look.tx = Math.max(-1, Math.min(1, (x - tilt.x0) / 22));
    look.ty = Math.max(-1, Math.min(1, (y - tilt.y0) / 22));
  }
  var tiltAsked = false;
  function enableTilt() {
    var D = window.DeviceOrientationEvent;
    if (tiltAsked || !D || !(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) return;
    tiltAsked = true;
    var on = function () { listen(window, "deviceorientation", onOrient); };
    if (typeof D.requestPermission === "function") D.requestPermission().then(function (st) { if (st === "granted") on(); }).catch(function () { /* declined: drag still works */ });
    else on();
  }

  // doodles fade slowly; once nothing has been drawn for a while, stop paying for a full-screen fade every frame
  // the fade runs in fixed 60Hz steps (skipped on a 120Hz frame, doubled at 30fps): halving a 0.006 alpha
  // would round to nothing in the canvas's 8-bit alpha and the ink would never clear
  var lastInk = 0, fadeAcc = 0;
  function fadeDoodles(f60) {
    if (!lastInk) return;
    if (performance.now() - lastInk > 22000) { dx.save(); dx.setTransform(1, 0, 0, 1, 0, 0); dx.clearRect(0, 0, dc.width, dc.height); dx.restore(); lastInk = 0; return; }
    fadeAcc = Math.min(6, fadeAcc + (f60 == null ? 1 : f60));
    if (fadeAcc < 1) return;
    dx.save();
    dx.setTransform(1, 0, 0, 1, 0, 0);
    dx.globalCompositeOperation = "destination-out";
    dx.fillStyle = "rgba(0,0,0,0.006)";
    for (; fadeAcc >= 1; fadeAcc--) dx.fillRect(0, 0, dc.width, dc.height);
    dx.restore();
  }
  return { dc: dc, dx: dx, look: look, fadeDoodles: fadeDoodles, enableTilt: enableTilt, setCanDraw: function (fn) { canDraw = fn; } };
}
