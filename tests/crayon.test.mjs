// The crayon world is an engine (src/crayon/engine.js) driving static markup (src/crayon/markup.js).
// These guard the seams between them, and between the in-world nav and the app's routes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const engine = read("src/crayon/engine.js");
// the engine is split into modules; every one of them may look elements up by id
const crayonFiles = readdirSync(new URL("../src/crayon/", import.meta.url), { recursive: true })
    .filter((f) => f.endsWith(".js") && f !== "markup.js");
const allCode = crayonFiles.map((f) => read(`src/crayon/${f}`)).join("\n");
const markup = read("src/crayon/markup.js");
const app = read("src/App.js");

test("every element the engine looks up exists in the markup", () => {
    const ids = [...allCode.matchAll(/byId\("([\w-]+)"\)/g)].map((m) => m[1]);
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

test("reloading a scene frees the old build's geometries, not just its materials", () => {
    // every build makes fresh baked meshes; replay and world switching leaked ~57 geometries each before this
    const loadScene = engine.slice(engine.indexOf("function loadScene("), engine.indexOf("current = SCENES[name]"));
    assert.match(loadScene, /disposeWorld\(\)/);
    assert.match(engine, /function disposeWorld\(\)[\s\S]{0,400}geometry\.dispose\(\)/);
});

test("nothing can be listened to after unmount", () => {
    assert.match(engine, /function listen\([^)]*\) \{[^}]*if \(!alive\) return;/);
});

test("every deep-link route mounts the world with the section the engine opens", () => {
    // engine.openSection knows these keys; each route has to hand one of them over
    for (const [path, section] of [["/about", "about"], ["/projects", "projects"], ["/work/:slug", "projects"], ["/monologue", "monologue"]]) {
        assert.ok(app.includes(`path="${path}" element={<World section="${section}" />}`), `route ${path} should open ${section}`);
    }
    assert.match(app, /path="\*" element=\{<NotFound \/>\}/);
});

test("every published project has a place in both worlds", async () => {
    const { default: projects } = await import("../src/data/projects.js");
    const live = projects.filter((p) => !p.draft);
    // ski: each project gets its own snow sculpture (an unknown slug quietly becomes another igloo)
    const ski = read("src/crayon/worlds/ski.js");
    const kinds = ski.match(/var KIND_FOR = \{([^}]*)\}/)[1];
    for (const p of live) assert.ok(kinds.includes(`"${p.slug}"`), `no snow sculpture for ${p.slug} in ski.js KIND_FOR`);
    // space: constellations sit in two rows of four
    assert.ok(live.length <= 8, "more than 8 projects won't fit the constellation grid in space.js");
});
