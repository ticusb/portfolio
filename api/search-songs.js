import { getAccessToken } from "./_lib/spotify.js";
import { guard } from "./_lib/guard.js";

export default async function handler(req, res) {
    const ok = await guard(req, res, {
        name: "search-songs",
        method: "GET",
        window: 60,
        max: 20,
        globalWindow: 3600,
        globalMax: 1000,
    });
    if (!ok) return;

    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: "query required" });
    if (q.length > 100) return res.status(400).json({ error: "query too long" });

    const token = await getAccessToken();

    const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!searchRes.ok) {
        return res.status(502).json({ error: "search unavailable" });
    }

    const data = await searchRes.json();

    const tracks = (data.tracks?.items ?? []).map((t) => ({
        uri: t.uri,
        name: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        albumArt: t.album.images[2]?.url ?? t.album.images[0]?.url,
    }));

    return res.status(200).json({ tracks });
}
