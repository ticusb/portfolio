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

const SPOTIFY_TRACK_ID = /^https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})$/;

// ListenBrainz only has cover art when it matched the play to MusicBrainz. For the
// rest, ask Spotify: by track id when the play came from Spotify, otherwise (Navidrome,
// iPod) by searching artist + title.
const spotifyArt = async (token, { track, id }) => {
    const headers = { Authorization: `Bearer ${token}` };
    let album;
    if (id) {
        const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, { headers });
        if (res.ok) album = (await res.json())?.album;
    } else {
        const artist = track.artist.split(/,|&| feat\.? /i)[0].trim();
        const q = `track:"${track.title.replace(/"/g, "")}" artist:"${artist.replace(/"/g, "")}"`;
        const res = await fetch(
            `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(q)}`,
            { headers },
        );
        if (res.ok) album = (await res.json())?.tracks?.items?.[0]?.album;
    }
    const images = album?.images ?? [];
    return images[1]?.url ?? images[0]?.url ?? null;
};

export const fillMissingArt = async (tracks) => {
    const missing = tracks
        .filter((track) => !track.albumArt)
        .map((track) => ({ track, id: SPOTIFY_TRACK_ID.exec(track.url ?? "")?.[1] }));
    if (missing.length === 0) return tracks;

    try {
        const token = await getAccessToken();
        // One lookup per track: Spotify answers 403 to the batch /v1/tracks?ids= endpoint
        // for this app, and there are at most five recent plays.
        await Promise.all(
            missing.map(async (entry) => {
                entry.track.albumArt = await spotifyArt(token, entry);
            }),
        );
    } catch (err) {
        console.error("spotify art lookup unavailable:", err.message);
    }
    return tracks;
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

    const current =
        spotify?.current ?? (lbNow ? (await fillMissingArt([lbNow]))[0] : null);
    const recent = lbRecent?.length
        ? await fillMissingArt(lbRecent)
        : spotify?.recent ?? [];

    if (!spotify && !lbNow && !lbRecent) {
        return res.status(503).json({ current: null, recent: [], available: false });
    }

    return res.status(200).json({ current, recent });
}
