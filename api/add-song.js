import { getAccessToken } from "./_lib/spotify.js";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method !== "POST") return res.status(405).end();

    const { uri, name, artist } = req.body;
    if (!uri?.trim()) return res.status(400).json({ error: "uri required" });

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
