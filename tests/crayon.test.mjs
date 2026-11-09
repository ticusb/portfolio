// The crayon world is an engine (src/crayon/engine.js) driving static markup (src/crayon/markup.js).
// These guard the seams between them, and between the in-world nav and the app's routes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const engine = read("src/crayon/engine.js");
const markup = read("src/crayon/markup.js");
const app = read("src/App.js");

test("every element the engine looks up exists in the markup", () => {
    const ids = [...engine.matchAll(/byId\("([\w-]+)"\)/g)].map((m) => m[1]);
    assert.ok(ids.length > 10, "expected the engine to look up its elements by id");
    for (const id of new Set(ids)) {
        assert.ok(markup.includes(`id=\\"${id}\\"`), `markup is missing #${id}`);
    }
});

test("every in-world nav link points at a real route", () => {
    const hrefs = [...markup.matchAll(/data-key=\\"[\w-]+\\" href=\\"#(\/[\w-]*)\\"/g)].map((m) => m[1]);
    assert.ok(hrefs.length >= 3, "expected the nav to have links");
    for (const href of hrefs) {
        assert.ok(app.includes(`path="${href}"`), `no route for ${href}`);
    }
});

test("three.js stays pinned to the version the shaders are tuned for", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.dependencies.three, "0.128.0");
});

test("the engine cleans up after itself", () => {
    assert.match(engine, /return function unmount\(\)/);
    assert.match(engine, /cancelAnimationFrame\(rafId\)/);
    assert.match(engine, /renderer\.dispose\(\)/);
    assert.match(engine, /classList\.remove\("crayon-lock"\)/);
});
