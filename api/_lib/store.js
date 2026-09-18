const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasSharedStore = Boolean(url && token);

const memory = new Map();

const pruneMemory = () => {
    const now = Date.now();
    if (memory.size > 10_000) {
        memory.clear();
        return;
    }
    for (const [key, entry] of memory) {
        if (now >= entry.resetAt) memory.delete(key);
    }
};

const memoryIncrement = (key, window) => {
    const now = Date.now();
    const entry = memory.get(key);
    if (!entry || now >= entry.resetAt) {
        const fresh = { count: 1, resetAt: now + window * 1000 };
        memory.set(key, fresh);
        return fresh;
    }
    entry.count += 1;
    return entry;
};

export const incrementWindow = async (key, window) => {
    if (!hasSharedStore) {
        pruneMemory();
        const entry = memoryIncrement(key, window);
        return { count: entry.count, resetAt: entry.resetAt, shared: false };
    }

    const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify([
            ["SET", key, "0", "EX", String(window), "NX"],
            ["INCR", key],
        ]),
    });

    if (!res.ok) throw new Error(`rate limit store responded ${res.status}`);

    const body = await res.json();
    const count = Number(body?.[1]?.result);
    if (!Number.isFinite(count)) throw new Error("rate limit store returned no count");

    return { count, resetAt: Date.now() + window * 1000, shared: true };
};
