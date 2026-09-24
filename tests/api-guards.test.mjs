import assert from "node:assert/strict";
import test from "node:test";

process.env.KV_REST_API_URL = "https://rate-limit.test";
process.env.KV_REST_API_TOKEN = "test-token";

let importId = 0;

const loadGuard = async (options = {}) => {
    const edgeSecret = Object.hasOwn(options, "edgeSecret")
        ? options.edgeSecret
        : "edge-secret";
    process.env.VERCEL_ENV = "production";
    if (edgeSecret === undefined) delete process.env.EDGE_SHARED_SECRET;
    else process.env.EDGE_SHARED_SECRET = edgeSecret;

    const module = await import(`../api/_lib/guard.js?test=${++importId}`);
    return module.guard;
};

const request = ({ method = "GET", headers = {}, body, query = {} } = {}) => ({
    method,
    headers: {
        host: "ticusb.com",
        "x-edge-secret": "edge-secret",
        "x-vercel-forwarded-for": "203.0.113.10",
        ...headers,
    },
    body,
    query,
});

const response = () => ({
    headers: {},
    statusCode: undefined,
    body: undefined,
    ended: false,
    setHeader(name, value) {
        this.headers[name] = value;
    },
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
    end() {
        this.ended = true;
        return this;
    },
});

const mockFetch = (t, implementation) => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (...args) => {
        calls.push(args);
        return implementation(...args);
    };
    t.after(() => {
        globalThis.fetch = original;
    });
    return calls;
};

const storeResponse = (count) => ({
    ok: true,
    status: 200,
    async json() {
        return [{ result: "OK" }, { result: String(count) }];
    },
});

const guardOptions = {
    name: "test-route",
    method: "GET",
    window: 60,
    max: 5,
};

test("OPTIONS returns the preflight response without touching the store", async (t) => {
    const calls = mockFetch(t, async () => storeResponse(1));
    const guard = await loadGuard();
    const res = response();

    const allowed = await guard(request({ method: "OPTIONS" }), res, guardOptions);

    assert.equal(allowed, false);
    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
    assert.equal(res.headers["Access-Control-Allow-Methods"], "GET, OPTIONS");
    assert.equal(calls.length, 0);
});

test("unsupported methods return 405 without touching the store", async (t) => {
    const calls = mockFetch(t, async () => storeResponse(1));
    const guard = await loadGuard();
    const res = response();

    const allowed = await guard(request({ method: "POST" }), res, guardOptions);

    assert.equal(allowed, false);
    assert.equal(res.statusCode, 405);
    assert.deepEqual(res.body, { error: "method not allowed" });
    assert.equal(res.headers.Allow, "GET, OPTIONS");
    assert.equal(calls.length, 0);
});

test("production rejects an unapproved host before touching the store", async (t) => {
    const calls = mockFetch(t, async () => storeResponse(1));
    const guard = await loadGuard();
    const res = response();

    const allowed = await guard(
        request({ headers: { host: "attacker.example" } }),
        res,
        guardOptions,
    );

    assert.equal(allowed, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "forbidden" });
    assert.equal(calls.length, 0);
});

test("production rejects a request with no edge secret", async (t) => {
    const calls = mockFetch(t, async () => storeResponse(1));
    const guard = await loadGuard();
    const res = response();

    const allowed = await guard(
        request({ headers: { "x-edge-secret": undefined } }),
        res,
        guardOptions,
    );

    assert.equal(allowed, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "forbidden" });
    assert.equal(calls.length, 0);
});

let addSongHandler;
const loadAddSong = async () => {
    if (!addSongHandler) {
        process.env.VERCEL_ENV = "production";
        process.env.EDGE_SHARED_SECRET = "edge-secret";
        ({ default: addSongHandler } = await import("../api/add-song.js"));
    }
    return addSongHandler;
};

test("add-song rejects a disallowed origin before touching the store", async (t) => {
    const calls = mockFetch(t, async () => storeResponse(1));
    const handler = await loadAddSong();
    const res = response();

    await handler(
        request({
            method: "POST",
            headers: { origin: "https://attacker.example" },
        }),
        res,
    );

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "forbidden" });
    assert.equal(calls.length, 0);
});

test("add-song returns 429 when the per-IP limit is exceeded", async (t) => {
    const calls = mockFetch(t, async () => storeResponse(6));
    const handler = await loadAddSong();
    const res = response();

    await handler(
        request({ method: "POST", headers: { origin: "https://ticusb.com" } }),
        res,
    );

    assert.equal(res.statusCode, 429);
    assert.equal(res.body.error, "too many requests");
    assert.equal(res.headers["X-RateLimit-Remaining"], "0");
    assert.equal(calls.length, 1);
});

test("add-song returns 429 when the global limit is exceeded", async (t) => {
    const counts = [1, 41];
    const calls = mockFetch(t, async () => storeResponse(counts.shift()));
    const handler = await loadAddSong();
    const res = response();

    await handler(
        request({ method: "POST", headers: { origin: "https://ticusb.com" } }),
        res,
    );

    assert.equal(res.statusCode, 429);
    assert.equal(res.body.error, "too many requests");
    assert.equal(calls.length, 2);
});

test("add-song fails closed when the rate-limit store errors", async (t) => {
    const calls = mockFetch(t, async () => {
        throw new Error("store unavailable");
    });
    t.mock.method(console, "error", () => {});
    const handler = await loadAddSong();
    const res = response();

    await handler(
        request({ method: "POST", headers: { origin: "https://ticusb.com" } }),
        res,
    );

    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: "temporarily unavailable" });
    assert.equal(calls.length, 1);
});
