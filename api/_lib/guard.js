import { timingSafeEqual } from "node:crypto";
import { incrementWindow } from "./store.js";

const ALLOWED_ORIGINS = ["https://ticusb.com", "https://www.ticusb.com"];

const ALLOWED_HOSTS = [
    "ticusb.com",
    "www.ticusb.com",
    ...(process.env.ALLOWED_HOSTS ?? "")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),
];

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const edgeSecret = process.env.EDGE_SHARED_SECRET;

const isProduction = process.env.VERCEL_ENV === "production";

const isAllowedOrigin = (origin) => {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    return !isProduction && LOCAL_ORIGIN.test(origin);
};

const isAllowedHost = (req) => {
    const host = String(req.headers.host ?? "")
        .split(":")[0]
        .toLowerCase();
    if (ALLOWED_HOSTS.includes(host)) return true;
    return !isProduction && LOCAL_HOSTS.includes(host);
};

const secretsMatch = (a, b) => {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
};

const viaTrustedEdge = (req) => {
    if (!edgeSecret) return false;
    return secretsMatch(String(req.headers["x-edge-secret"] ?? ""), edgeSecret);
};

const clientIp = (req, trusted) => {
    if (trusted || !edgeSecret) {
        const cf = req.headers["cf-connecting-ip"];
        if (cf) return String(cf).trim();
    }
    const vercel = req.headers["x-vercel-forwarded-for"];
    if (vercel) return String(vercel).split(",")[0].trim();
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return String(forwarded).split(",")[0].trim();
    return "unknown";
};

const tooMany = (res, resetAt) => {
    const seconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    res.setHeader("Retry-After", String(seconds));
    res.status(429).json({ error: "too many requests", retryAfter: seconds });
};

export const guard = async (req, res, options) => {
    const {
        name,
        method = "GET",
        window,
        max,
        globalWindow,
        globalMax,
        requireOrigin = false,
    } = options;

    const origin = req.headers.origin;

    res.setHeader("Vary", "Origin");
    if (isAllowedOrigin(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", `${method}, OPTIONS`);
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Max-Age", "86400");
        res.status(204).end();
        return false;
    }

    if (req.method !== method) {
        res.setHeader("Allow", `${method}, OPTIONS`);
        res.status(405).json({ error: "method not allowed" });
        return false;
    }

    const trusted = viaTrustedEdge(req);

    if (isProduction && !isAllowedHost(req)) {
        res.status(403).json({ error: "forbidden" });
        return false;
    }

    if (isProduction && edgeSecret && !trusted) {
        res.status(403).json({ error: "forbidden" });
        return false;
    }

    if (requireOrigin && !isAllowedOrigin(origin)) {
        res.status(403).json({ error: "forbidden" });
        return false;
    }

    try {
        const perIp = await incrementWindow(
            `rl:${name}:ip:${clientIp(req, trusted)}`,
            window,
        );
        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader(
            "X-RateLimit-Remaining",
            String(Math.max(0, max - perIp.count)),
        );
        if (perIp.count > max) {
            tooMany(res, perIp.resetAt);
            return false;
        }

        if (globalMax) {
            const global = await incrementWindow(
                `rl:${name}:global`,
                globalWindow,
            );
            if (global.count > globalMax) {
                tooMany(res, global.resetAt);
                return false;
            }
        }
    } catch (err) {
        console.error(`rate limit failed for ${name}:`, err.message);
        if (requireOrigin) {
            res.status(503).json({ error: "temporarily unavailable" });
            return false;
        }
    }

    return true;
};
