import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT ?? 8888);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const ENV_FILE =
    process.env.SPOTIFY_ENV_FILE ??
    new URL("../.env.local", import.meta.url).pathname;

const SCOPES = [
    "user-read-currently-playing",
    "user-read-recently-played",
    "playlist-modify-public",
    "playlist-modify-private",
].join(" ");

const readEnv = () => {
    if (!existsSync(ENV_FILE)) return {};
    return Object.fromEntries(
        readFileSync(ENV_FILE, "utf8")
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"))
            .map((line) => {
                const i = line.indexOf("=");
                return [
                    line.slice(0, i).trim(),
                    line.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
                ];
            }),
    );
};

const writeRefreshToken = (token) => {
    const line = `SPOTIFY_REFRESH_TOKEN=${token}`;
    if (!existsSync(ENV_FILE)) {
        writeFileSync(ENV_FILE, `${line}\n`, { mode: 0o600 });
        return "created";
    }
    const body = readFileSync(ENV_FILE, "utf8");
    const next = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(body)
        ? body.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, line)
        : `${body.replace(/\n*$/, "\n")}${line}\n`;
    writeFileSync(ENV_FILE, next, { mode: 0o600 });
    return "updated";
};

const page = (title, detail) => `<!doctype html><meta charset="utf-8">
<title>${title}</title>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#0a0a0c;color:#e6e6e6;font:15px/1.7 ui-monospace,Menlo,monospace">
<div style="text-align:center;padding:32px"><div style="font-size:38px">${title}</div>
<p style="color:#8a8a96">${detail}</p></div></body>`;

const env = readEnv();
const clientId = process.env.SPOTIFY_CLIENT_ID ?? env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    console.error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env.local");
    process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    show_dialog: "true",
})}`;

console.log(`
Spotify re-authorization
------------------------
Redirect URI this script uses:

    ${REDIRECT_URI}

It must be listed in your app's Redirect URIs at
https://developer.spotify.com/dashboard -> your app -> Settings.
Spotify no longer accepts "localhost" - it must be 127.0.0.1.

Opening your browser. Approve the request to continue.
`);

const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
    }

    const send = (code, html) => {
        res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
    };

    const error = url.searchParams.get("error");
    if (error) {
        send(400, page("denied", error));
        console.error(`\nSpotify returned: ${error}`);
        server.close();
        process.exitCode = 1;
        return;
    }

    if (url.searchParams.get("state") !== state) {
        send(400, page("state mismatch", "Discarded - possible CSRF. Re-run the script."));
        console.error("\nState mismatch, aborting.");
        server.close();
        process.exitCode = 1;
        return;
    }

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: url.searchParams.get("code") ?? "",
            redirect_uri: REDIRECT_URI,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    const data = await tokenRes.json();

    if (!data.refresh_token) {
        send(400, page("exchange failed", data.error_description ?? data.error ?? "unknown"));
        console.error("\nToken exchange failed:", data);
        server.close();
        process.exitCode = 1;
        return;
    }

    const action = writeRefreshToken(data.refresh_token);
    send(200, page("done", "Refresh token saved. You can close this tab."));

    console.log(`.env.local ${action}.

New refresh token:

    ${data.refresh_token}

Now update production:

    npx vercel env rm SPOTIFY_REFRESH_TOKEN production
    npx vercel env add SPOTIFY_REFRESH_TOKEN production
    npx vercel --prod

Verify afterwards:

    curl -s -o /dev/null -w '%{http_code}\\n' https://www.ticusb.com/api/now-playing
`);
    server.close();
});

server.listen(PORT, "127.0.0.1", () => {
    const opener =
        process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    spawn(opener, [authUrl], { stdio: "ignore", detached: true, shell: process.platform === "win32" }).unref();
    console.log(`If the browser did not open, visit:\n\n${authUrl}\n`);
});
