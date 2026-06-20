import { getAccessToken } from "./_lib/spotify.js";

const counts = new Map();

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://ticusb.com");

    if (req.method !== "POST") return res.status(405).end();

    const ip = req.headers["x-forwarded-for"] ?? "unknown";
    const count = counts.get(ip) ?? 0;
    if (count >= 5) return res.status(429).json({ error: "too many requests" });
    counts.set(ip, count + 1);
    setTimeout(() => counts.set(ip, (counts.get(ip) ?? 1) - 1), 60_000);

    const { uri, name, artist } = req.body;
    if (!uri?.trim()) return res.status(400).json({ error: "uri required" });
    if (!/^spotify:track:[A-Za-z0-9]+$/.test(uri)) {
        return res.status(400).json({ error: "invalid uri" });
    }

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

    if (!addRes.ok) return res.status(500).json({ error: "Failed to add track" });

    return res.status(200).json({ success: true, track: { name, artist } });
}
