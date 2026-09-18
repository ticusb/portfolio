import { incrementWindow } from "./_lib/store.js";

const clientIp = (req) =>
    String(
        req.headers["cf-connecting-ip"] ??
            req.headers["x-vercel-forwarded-for"] ??
            req.headers["x-forwarded-for"] ??
            "an unlisted number",
    )
        .split(",")[0]
        .trim();

const TRAPS = {
    env: {
        title: "environment variables",
        file: ".env",
        lines: [
            "# congrats, you found the secrets file",
            "DB_PASSWORD=hunter2",
            "AWS_SECRET_ACCESS_KEY=you_wish_buddy",
            "STRIPE_SECRET_KEY=sk_live_this_is_a_static_react_site",
            "ADMIN_TOKEN=there_is_no_admin_there_is_no_database",
            "ONE_PIECE_LOCATION=raftel_obviously",
            "REAL_SECRETS_LOCATION=server_side_env_vars_like_a_normal_person",
        ],
    },
    git: {
        title: "git configuration",
        file: ".git/config",
        lines: [
            "[core]",
            "\trepositoryformatversion = 0",
            "[remote \"origin\"]",
            "\turl = https://github.com/ticusb/nice-try",
            "[branch \"main\"]",
            "\tremote = origin",
            "# the source is public. you could have just clicked the github link.",
        ],
    },
    wordpress: {
        title: "wordpress",
        file: "wp-login.php",
        lines: [
            "there is no WordPress here.",
            "there has never been WordPress here.",
            "there will never be WordPress here.",
            "",
            "you are 12,000 requests into a react app.",
        ],
    },
    admin: {
        title: "admin panel",
        file: "/admin",
        lines: [
            "ACCESS DENIED",
            "",
            "reason: there is no admin panel",
            "reason: there is no login",
            "reason: there is no server-side session",
            "reason: this is 40kb of static javascript",
            "",
            "you have been redirected to the shame dimension.",
        ],
    },
    generic: {
        title: "404",
        file: "not_found",
        lines: [
            "this path does not exist and never did.",
            "your scanner is working. your judgment is not.",
        ],
    },
};

const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const textBody = (trap, ip, path) =>
    [
        ...trap.lines,
        "",
        `# requested: ${path}`,
        `# by: ${ip}`,
        `# at: ${new Date().toISOString()}`,
        "# logged, framed, and hung above the fireplace.",
        "",
        "have a nice day though, genuinely. - ticus",
    ].join("\n");

const htmlBody = (trap, ip, path) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escape(trap.file)}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:#0a0a0c;color:#e6e6e6;font:14px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace}
.win{width:100%;max-width:680px;border:1px solid #23232a;border-radius:10px;overflow:hidden;
background:#101014;box-shadow:0 24px 60px rgba(0,0,0,.55)}
.bar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#16161c;border-bottom:1px solid #23232a}
.dot{width:11px;height:11px;border-radius:50%}
.r{background:#ff5f57}.y{background:#febc2e}.g{background:#28c840}
.name{margin-left:8px;color:#8a8a96;font-size:12px}
pre{margin:0;padding:20px 22px;white-space:pre-wrap;word-break:break-word}
.c{color:#6ee7a8}.m{color:#8a8a96}
a{color:#6ee7a8}
.f{padding:0 22px 20px;color:#8a8a96;font-size:12px}
</style></head><body>
<div class="win">
<div class="bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
<span class="name">cat ${escape(trap.file)}</span></div>
<pre><span class="c">$</span> cat ${escape(trap.file)}

${escape(trap.lines.join("\n"))}

<span class="m"># requested: ${escape(path)}
# by: ${escape(ip)}
# logged, framed, and hung above the fireplace.</span>
</pre>
<div class="f">no hard feelings &mdash; <a href="/">see the actual site</a></div>
</div></body></html>`;

export default async function handler(req, res) {
    const ip = clientIp(req);
    const path = String(req.headers["x-original-path"] ?? req.url ?? "/");
    const key = String(req.query?.trap ?? "generic");
    const trap = Object.hasOwn(TRAPS, key) ? TRAPS[key] : TRAPS.generic;

    let count = 1;
    try {
        ({ count } = await incrementWindow(`trap:${ip}`, 3600));
    } catch {}

    console.warn(`honeypot hit ${count} from ${ip} -> ${path}`);

    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Honeypot", "you are being perceived");

    if (count > 60) {
        res.status(429);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end("ok you've made your point. go outside.\n");
    }

    const wantsHtml = String(req.headers.accept ?? "").includes("text/html");
    res.status(418);
    res.setHeader(
        "Content-Type",
        wantsHtml ? "text/html; charset=utf-8" : "text/plain; charset=utf-8",
    );
    return res.end(
        wantsHtml ? htmlBody(trap, ip, path) : textBody(trap, ip, path),
    );
}
