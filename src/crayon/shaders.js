/*
 * The crayon look, in GLSL. Every mesh is drawn twice: a scribbled fill (fillVert/fillFrag) and one or two
 * inflated back-face shells for the wobbly ink outline (lineVert/lineFrag). The avatar's head uses the face
 * shader, which projects the selfie flat into the helmet's opening. EDGE holds the "edge of the simulation":
 * near the screen edge the cursor pushes toward (uCursor), fills turn into falling 1s and 0s.
 */
export const COMMON = [
  "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
  "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
  "return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}",
  "float n3(vec3 p){return noise(p.xy + vec2(p.z*1.31, p.z*0.77));}",
  "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}"
].join("\n");

// The unrendered sim: before you pick up the crayon, I float on the old site's dot grid as a matte grey figure
// with green outlines (the old site's accent). Only the hero (uKeep = 1) shows then; as uSim falls to 0 after
// the click, crayon colour scribbles across me in a noisy front.
export const SIM = [
  "uniform float uSim; uniform float uKeep;",
  "float simFront(vec2 p, float seed){ return noise(p*0.035 + seed)*0.7 + 0.15; }",
  "vec3 simBody(vec3 n, vec2 p){",
  "  float d = dot(normalize(n), normalize(vec3(-0.45,0.7,0.55)))*0.5 + 0.5;",
  "  vec3 c = mix(vec3(0.60, 0.61, 0.60), vec3(0.94, 0.94, 0.93), d);",
  "  vec2 g = fract(p / 28.0) - 0.5;",
  "  return mix(c, c * 0.82, step(length(g), 0.08));",
  "}"
].join("\n");

export const EDGE = [
  "uniform vec2 uRes;",
  "vec3 codeWall(vec2 p, float time){",
  "  float cell = 13.0;",
  "  float colId = floor(p.x / cell);",
  "  float spd = 30.0 + hash(vec2(colId, 3.1)) * 90.0;",
  "  float y = p.y + time * spd;",
  "  vec2 ci = vec2(colId, floor(y / cell));",
  "  vec2 f = vec2(fract(p.x / cell), fract(y / cell));",
  "  float bit = step(0.5, hash(ci + floor(time * 1.3 + hash(ci) * 9.0) * 0.37));",
  "  float one = step(abs(f.x - 0.5), 0.07) * step(0.18, f.y) * step(f.y, 0.82);",
  "  float r = length((f - 0.5) * vec2(2.8, 1.75));",
  "  float zero = step(0.5, r) * step(r, 0.74) * step(0.14, f.y) * step(f.y, 0.86);",
  "  float glyph = mix(zero, one, bit);",
  "  float trail = fract(y / (cell * 18.0) + hash(vec2(colId, 7.7)));",
  "  vec3 g = vec3(0.22, 1.0, 0.53) * (0.22 + 0.78 * trail * trail);",
  "  return mix(vec3(0.015, 0.04, 0.025), g, glyph);",
  "}",
  "uniform vec2 uCursor;",
  "float dissolve(vec2 p){",
  "  float b = hash(floor(p / 7.0));",
  "  vec2 q = p / uRes;",
  "  float ax = abs(uCursor.x), ay = abs(uCursor.y);",
  "  float dxe = uCursor.x > 0.0 ? 1.0 - q.x : q.x;",
  "  float dye = uCursor.y > 0.0 ? 1.0 - q.y : q.y;",
  "  float ex = ax * clamp(1.0 - dxe / (0.11 * ax + 1e-4), 0.0, 1.0);",
  "  float ey = ay * clamp(1.0 - dye / (0.09 * ay + 1e-4), 0.0, 1.0);",
  "  return step(b * 0.92 + 0.06, max(ex, ey));",
  "}"
].join("\n");

export const LUMP = [
  "uniform float uTime; uniform float uSeed; uniform float uLump; uniform vec2 uShift; uniform vec2 uRes;",
  "vec3 lumpy(vec3 pos, vec3 nrm){",
  "  float boil = floor(uTime*6.0);",
  "  float l = n3(pos*1.3 + uSeed) - 0.5;",
  "  float b = n3(pos*2.6 + uSeed + boil*0.71) - 0.5;",
  "  return pos + nrm*(l*uLump + b*uLump*0.05);",
  "}",
  // each mesh is nudged a few pixels off its outline, like a print that is slightly out of register
  "vec4 misregister(vec4 clip){ clip.xy += uShift / uRes * 2.0 * clip.w; return clip; }"
].join("\n");

export const fillVert = [
  COMMON, LUMP,
  "uniform float uOver;",
  "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
  "void main(){",
  "  vN = normalize(normalMatrix * normal); vObj = position;",
  "  vec3 p = lumpy(position, normal);",
  "  p += normal * uOver * (n3(position*2.1 + uSeed*1.7) - 0.25);",
  "  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;",
  "  gl_Position = misregister(projectionMatrix * modelViewMatrix * vec4(p,1.0));",
  "}"
].join("\n");

// quieter than v3: denser coverage, finer tooth, softer shading, fewer missed patches
export const fillFrag = [
  COMMON, SIM,
  "uniform vec3 uColor; uniform vec3 uShade; uniform float uAngle; uniform float uSeed; uniform float uDpr; uniform float uReveal; uniform float uDelay; uniform float uTime; uniform float uWash; uniform float uAlpha; uniform vec3 uCut;",
  "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
  EDGE,
  "void main(){",
  "  vec3 n = normalize(vN);",
  "  float d = dot(n, normalize(vec3(-0.45,0.7,0.55)))*0.5+0.5;",
  "  vec2 p = gl_FragCoord.xy / uDpr;",
  "  vec3 dir = normalize(vec3(cos(uAngle), sin(uAngle), 0.25));",
  "  float sweep = dot(normalize(vObj + 1e-4), dir)*0.5 + 0.5;",
  "  if (uKeep < 0.5 && uDelay*0.6 + sweep*0.28 + noise(p*0.05)*0.08 + 0.3 > uReveal*1.6) discard;",
  "  if (uCut.z > 0.5) { vec3 oc = normalize(vObj); if (oc.z > 0.0 && length(vec2(oc.x / uCut.x, (oc.y + 0.05) / uCut.y)) < 1.0) discard; }",
  "  if (uKeep > 0.5 && simFront(p, uSeed) < uSim) { gl_FragColor = vec4(simBody(vN, p), uAlpha); return; }",
  "  if (dissolve(p) > 0.5) { gl_FragColor = vec4(codeWall(p, uTime), 1.0); return; }",
  "  if (uWash > 0.5) { float tw = noise(p*0.9)*0.5 + noise(p*0.31)*0.5; gl_FragColor = vec4(uColor * (0.965 + 0.05*tw) * (1.0 - 0.025*step(0.72, noise(p*0.01 + uSeed))), 1.0); return; }",
  "  float rn = noise(p*0.004 + uSeed);",
  "  vec2 q = rot(uAngle + (rn-0.5)*0.25) * p;",
  "  float wob = noise(q*vec2(0.004,0.012) + uSeed)*0.35;",
  "  float s = abs(fract(q.y/5.0 + wob) - 0.5)*2.0;",
  "  float press = noise(p*0.012 + uSeed*1.3);",
  "  float stroke = step(s, 0.72 + 0.26*press);",
  "  float tooth = noise(p*1.6)*0.6 + noise(p*0.5 + uSeed)*0.4;",
  "  float base = stroke * step(0.22 + (1.0-press)*0.08, tooth);",
  "  base *= step(0.08, noise(p*0.02 + uSeed*2.1));",
  "  vec2 h = rot(uAngle + 1.2 + (rn-0.5)*0.25) * p;",
  "  float s2 = abs(fract(h.y/5.0 + noise(h*vec2(0.004,0.012))*0.35) - 0.5)*2.0;",
  "  float shadowAmt = smoothstep(0.6, 0.1, d);",
  "  float shade = step(s2, shadowAmt*0.75) * step(0.3, tooth);",
  "  if (base < 0.5 && shade < 0.5) discard;",
  "  vec3 col = uColor*(0.92 + 0.14*press);",
  "  if (shade > 0.5) col = mix(col, uShade, 0.55);",
  "  gl_FragColor = vec4(col, uAlpha);",
  "}"
].join("\n");

export const lineVert = [
  COMMON, LUMP,
  "uniform float uThick;",
  "varying float vAng; varying vec3 vWorld;",
  "void main(){",
  "  float boil = floor(uTime*6.0);",
  "  vAng = atan(position.y, position.x) / 6.2832 + 0.5;",
  "  vec3 p = lumpy(position, normal);",
  "  float t = 0.45 + 1.1*n3(position*1.9 + uSeed + boil*0.06);",
  "  vec3 sc = vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));",
  "  float scAvg = (sc.x + sc.y + sc.z) / 3.0;",
  "  p += normal * uThick * t * min(1.0, scAvg) / sc;",
  "  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;",
  "  gl_Position = misregister(projectionMatrix * modelViewMatrix * vec4(p,1.0));",
  "}"
].join("\n");

export const lineFrag = [
  COMMON, SIM,
  "uniform vec3 uInk; uniform float uDpr; uniform float uReveal; uniform float uDelay; uniform float uSeed; uniform float uTime;",
  "varying float vAng; varying vec3 vWorld;",
  EDGE,
  "void main(){",
  // the outline goes on after the fill has covered the shape (a shell with nothing in front of it is a black blob)
  "  vec2 p0 = gl_FragCoord.xy / uDpr;",
  "  if (uKeep < 0.5 && uDelay*0.6 + 0.68 + vAng*0.15 > uReveal*1.6) discard;",
  "  if (uKeep > 0.5 && simFront(p0, uSeed) < uSim) { gl_FragColor = vec4(0.086, 0.639, 0.290, 1.0); return; }",
  "  if (dissolve(gl_FragCoord.xy / uDpr) > 0.5) discard;",
  "  vec2 p = gl_FragCoord.xy / uDpr;",
  "  if (noise(vec2(vAng*16.0, uSeed)) < 0.18) discard;",
  "  if (noise(p*1.4) < 0.2) discard;",
  "  gl_FragColor = vec4(uInk, 1.0);",
  "}"
].join("\n");

export const faceVert = [
  "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
  "void main(){ vN = normalize(normalMatrix * normal); vObj = position; vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
].join("\n");
export const faceFrag = [
  COMMON, SIM,
  "uniform sampler2D uFace; uniform vec3 uSkin; uniform vec3 uHair; uniform float uReveal; uniform float uDelay; uniform float uTime; uniform float uDpr;",
  "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;",
  EDGE,
  "void main(){",
  "  vec2 p = gl_FragCoord.xy / uDpr;",
  "  if (uKeep < 0.5 && uDelay*0.6 + 0.3 + noise(p*0.05)*0.1 > uReveal*1.6) discard;",
  "  if (dissolve(p) > 0.5) { gl_FragColor = vec4(codeWall(p, uTime), 1.0); return; }",
  "  vec3 o = normalize(vObj);",
  "  vec2 uv = vec2(0.51 + o.x * 0.3, 0.42 + o.y * 0.38);",
  "  float m = smoothstep(0.95, 0.82, length(vec2(o.x / 0.8, (o.y + 0.05) / 0.92))) * smoothstep(0.0, 0.2, o.z);",
  "  vec3 tex = texture2D(uFace, clamp(uv, 0.0, 1.0)).rgb;",
  "  vec3 outside = uSkin + uHair * 0.0;",
  "  vec3 col = mix(outside, tex, m);",
  "  col = mix(col, floor(col * 7.0 + 0.5) / 7.0, 0.3);",
  "  float tooth = noise(p * 1.4) * 0.5 + noise(p * 0.45) * 0.5;",
  "  col *= 0.9 + 0.12 * tooth;",
  "  float d = dot(normalize(vN), normalize(vec3(-0.45, 0.7, 0.55))) * 0.5 + 0.5;",
  "  col *= 0.84 + 0.22 * d;",
  "  gl_FragColor = vec4(col, 1.0);",
  "}"
].join("\n");

/*
 * Baked variants: many static crayon meshes merged into one draw call. Everything that was a per-object
 * uniform arrives as a per-vertex attribute instead, and the geometry is pre-transformed into the baked
 * group's space, so the result draws exactly like the separate meshes did:
 *   aObj      the vertex in its original object space (the noise and the reveal sweep are seeded from it)
 *   aNrmM     the object-space normal pushed through the object's matrix (lumps and overdraw follow it)
 *   aNrmW     the true normal in group space, for the shading
 *   aNrmLine  (outlines) the outline offset direction, thickness and scale correction folded in
 *   aP        seed, lump, over, angle;  aDelay: draw order;  aShift: misregistration in px
 */
var BAKED_HEAD = [
  COMMON,
  "uniform float uTime; uniform vec2 uRes;",
  "attribute vec3 aObj; attribute vec3 aNrmM; attribute vec4 aP; attribute float aDelay; attribute vec2 aShift;",
  "float bakedLump(){ float boil = floor(uTime*6.0); float l = n3(aObj*1.3 + aP.x) - 0.5; float b = n3(aObj*2.6 + aP.x + boil*0.71) - 0.5; return l*aP.y + b*aP.y*0.05; }",
  "vec4 bakedClip(vec3 p){ vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0); clip.xy += aShift / uRes * 2.0 * clip.w; return clip; }"
].join("\n");

export const bakedFillVert = [
  BAKED_HEAD,
  "attribute vec3 aNrmW; attribute vec3 aColor; attribute vec3 aShade;",
  "varying vec3 vN; varying vec3 vObj; varying vec3 vWorld; varying vec3 vColor; varying vec3 vShade; varying float vSeed; varying float vAngle; varying float vDelay;",
  "void main(){",
  "  vN = normalize(normalMatrix * aNrmW); vObj = aObj;",
  "  vColor = aColor; vShade = aShade; vSeed = aP.x; vAngle = aP.w; vDelay = aDelay;",
  "  vec3 p = position + aNrmM * bakedLump();",
  "  p += aNrmM * aP.z * (n3(aObj*2.1 + aP.x*1.7) - 0.25);",
  "  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;",
  "  gl_Position = bakedClip(p);",
  "}"
].join("\n");

// the fill/line fragment shaders with their per-object uniforms swapped for varyings
function bakeFrag(src, swaps, consts) {
  var names = Object.keys(swaps).concat(Object.keys(consts));
  var out = src.replace(new RegExp("uniform (?:float|vec2|vec3|vec4) (" + names.join("|") + ");\\s?", "g"), "");
  var head = Object.keys(swaps).map(function (n) { return "varying " + swaps[n][0] + " " + swaps[n][1] + ";\n#define " + n + " " + swaps[n][1]; })
    .concat(Object.keys(consts).map(function (n) { return "#define " + n + " " + consts[n]; })).join("\n");
  return head + "\n" + out;
}
export const bakedFillFrag = bakeFrag(fillFrag,
  { uColor: ["vec3", "vColor"], uShade: ["vec3", "vShade"], uSeed: ["float", "vSeed"], uAngle: ["float", "vAngle"], uDelay: ["float", "vDelay"] },
  { uWash: "0.0", uAlpha: "1.0", uCut: "vec3(1.0, 1.0, 0.0)", uKeep: "0.0" });

export const bakedLineVert = [
  BAKED_HEAD,
  "attribute vec3 aNrmLine; attribute vec3 aInk;",
  "varying float vAng; varying vec3 vWorld; varying vec3 vInk; varying float vSeed; varying float vDelay;",
  "void main(){",
  "  float boil = floor(uTime*6.0);",
  "  vInk = aInk; vSeed = aP.x; vDelay = aDelay;",
  "  vAng = atan(aObj.y, aObj.x) / 6.2832 + 0.5;",
  "  float t = 0.45 + 1.1*n3(aObj*1.9 + aP.x + boil*0.06);",
  "  vec3 p = position + aNrmM * bakedLump() + aNrmLine * t;",
  "  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;",
  "  gl_Position = bakedClip(p);",
  "}"
].join("\n");
export const bakedLineFrag = bakeFrag(lineFrag,
  { uInk: ["vec3", "vInk"], uSeed: ["float", "vSeed"], uDelay: ["float", "vDelay"] }, { uKeep: "0.0" });
