import { getAccessToken } from "./_lib/spotify.js";

const formatTrack = (item) => ({
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(", ") ?? "",
    album: item.album.name,
    albumArt: item.album.images[0]?.url,
    url: item.external_urls.spotify,
});

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://ticusb.com");

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
}
