import { getAccessToken } from "./_lib/spotify.js";
import { guard } from "./_lib/guard.js";

export default async function handler(req, res) {
    const ok = await guard(req, res, {
        name: "add-song",
        method: "POST",
        window: 3600,
        max: 5,
        globalWindow: 86400,
        globalMax: 40,
        requireOrigin: true,
    });
    if (!ok) return;

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const uri = typeof body.uri === "string" ? body.uri.trim() : "";
    if (!uri) return res.status(400).json({ error: "uri required" });
    if (!/^spotify:track:[A-Za-z0-9]{22}$/.test(uri)) {
        return res.status(400).json({ error: "invalid uri" });
    }
    // name and artist only go back to the browser; keep them short strings
    const text = (v) => (typeof v === "string" ? v.slice(0, 200) : "");
    const name = text(body.name);
    const artist = text(body.artist);
    // a missing id would otherwise go out as the string "undefined"
    if (!process.env.SPOTIFY_PLAYLIST_ID) {
        console.error("add-song unavailable: SPOTIFY_PLAYLIST_ID not set");
        return res.status(503).json({ error: "temporarily unavailable" });
    }

    try {
        const token = await getAccessToken();

        const addRes = await fetch(
            `https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/items`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uris: [uri] }),
            },
        );

        if (!addRes.ok) {
            return res.status(502).json({ error: "Failed to add track" });
        }

        return res.status(200).json({ success: true, track: { name, artist } });
    } catch (err) {
        console.error("add-song unavailable:", err.message);
        return res.status(503).json({ error: "temporarily unavailable" });
    }
}
