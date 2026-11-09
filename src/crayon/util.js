// Small math helpers shared by the engine and the worlds.
export function clamp01(x) { return Math.max(0, Math.min(1, x)); }
export function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
export function jitter(r) { return (Math.random() - 0.5) * 2 * r; }
