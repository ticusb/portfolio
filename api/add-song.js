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

    const { uri, name, artist } = req.body ?? {};
    if (!uri?.trim()) return res.status(400).json({ error: "uri required" });
    if (!/^spotify:track:[A-Za-z0-9]{22}$/.test(uri)) {
        return res.status(400).json({ error: "invalid uri" });
    }

    try {
        const token = await getAccessToken();

        const addRes = await fetch(
            `https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/tracks`,
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
