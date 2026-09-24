import { getAccessToken } from "./_lib/spotify.js";
import { guard } from "./_lib/guard.js";
import { getPlayingNow, getRecentListens } from "./_lib/listenbrainz.js";

const formatTrack = (item) => ({
    id: item.id,
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(", ") ?? "",
    album: item.album.name,
    albumArt: item.album.images[0]?.url ?? null,
    url: item.external_urls.spotify,
    source: "spotify",
});

const spotifyListening = async () => {
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
        recent = (data.items ?? []).map((i) => ({
            ...formatTrack(i.track),
            id: `${i.played_at}-${i.track.id}`,
        }));
    }

    return { current, recent };
};

const settled = (result, label) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`${label} unavailable:`, result.reason?.message);
    return null;
};

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

    // Spotify knows what's playing there right now; ListenBrainz has every play from
    // Spotify, Navidrome and the iPod, so it owns the history. Either can fail alone.
    const [spotify, lbNow, lbRecent] = (
        await Promise.allSettled([spotifyListening(), getPlayingNow(), getRecentListens(5)])
    ).map((result, i) => settled(result, ["spotify", "listenbrainz now", "listenbrainz recent"][i]));

    const current = spotify?.current ?? lbNow ?? null;
    const recent = lbRecent?.length ? lbRecent : spotify?.recent ?? [];

    if (!spotify && !lbNow && !lbRecent) {
        return res.status(503).json({ current: null, recent: [], available: false });
    }

    return res.status(200).json({ current, recent });
}
