import { getAccessToken } from "./_lib/spotify.js";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://ticusb.com");

    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: "query required" });

    const token = await getAccessToken();

    const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } },
    );

    const data = await searchRes.json();

    const tracks = (data.tracks?.items ?? []).map((t) => ({
        uri: t.uri,
        name: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        albumArt: t.album.images[2]?.url ?? t.album.images[0]?.url,
    }));

    return res.status(200).json({ tracks });
}
