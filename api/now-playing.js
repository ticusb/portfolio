import { getAccessToken } from "./_lib/spotify.js";
import { guard } from "./_lib/guard.js";

const formatTrack = (item) => ({
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(", ") ?? "",
    album: item.album.name,
    albumArt: item.album.images[0]?.url,
    url: item.external_urls.spotify,
});

export default async function handler(req, res) {
    const ok = await guard(req, res, {
        name: "now-playing",
        method: "GET",
        window: 60,
        max: 30,
        globalWindow: 3600,
        globalMax: 2000,
    });
    if (!ok) return;

    try {
        const token = await getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [currentRes, recentRes] = await Promise.all([
            fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers }),
            fetch("https://api.spotify.com/v1/me/player/recently-played?limit=5", { headers }),
        ]);

        let current = null;
        if (currentRes.status === 200) {
            const data = await currentRes.json();
            if (data?.item) current = formatTrack(data.item);
        }

        let recent = [];
        if (recentRes.ok) {
            const data = await recentRes.json();
            recent = (data.items ?? []).map((i) => formatTrack(i.track));
        }

        return res.status(200).json({ current, recent });
    } catch (err) {
        console.error("now-playing unavailable:", err.message);
        return res
            .status(503)
            .json({ current: null, recent: [], available: false });
    }
}
