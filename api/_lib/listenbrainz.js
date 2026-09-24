// ListenBrainz collects every play: Navidrome and the iPod scrobble to it directly,
// and its Spotify connector imports Spotify plays. Public API, no token needed.
const LB_USER = process.env.LISTENBRAINZ_USER || "AuidoLubber8";
const LB_API = "https://api.listenbrainz.org/1/user";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SPOTIFY_TRACK = /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/;

const text = (value) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : null;

const coverArt = (mapping) => {
    const release = mapping?.caa_release_mbid;
    const id = mapping?.caa_id;
    if (!UUID.test(String(release)) || !/^\d+$/.test(String(id))) return null;
    return `https://coverartarchive.org/release/${release}/${id}-250.jpg`;
};

const trackUrl = (info, mapping) => {
    const spotify = [info?.origin_url, info?.spotify_id].find((url) =>
        SPOTIFY_TRACK.test(String(url)),
    );
    if (spotify) return spotify;
    const recording = mapping?.recording_mbid;
    return UUID.test(String(recording))
        ? `https://musicbrainz.org/recording/${recording}`
        : null;
};

export const formatListen = (listen) => {
    const meta = listen?.track_metadata;
    const title = text(meta?.track_name);
    const artist = text(meta?.artist_name);
    if (!title || !artist) return null;

    const info = meta.additional_info ?? {};
    const mapping = meta.mbid_mapping ?? {};
    const service = String(info.music_service ?? info.music_service_name ?? "");

    return {
        id: `${listen.listened_at ?? "now"}-${title}`,
        title,
        artist,
        album: text(meta.release_name) ?? "",
        albumArt: coverArt(mapping),
        url: trackUrl(info, mapping),
        source: service.includes("spotify") ? "spotify" : "self-hosted",
    };
};

const fetchListens = async (path) => {
    const res = await fetch(`${LB_API}/${encodeURIComponent(LB_USER)}/${path}`);
    if (!res.ok) throw new Error(`ListenBrainz ${path} responded ${res.status}`);
    const body = await res.json();
    const listens = body?.payload?.listens;
    return Array.isArray(listens) ? listens : [];
};

export const getRecentListens = async (count = 5) => {
    const listens = await fetchListens(`listens?count=${count}`);
    return listens.map(formatListen).filter(Boolean);
};

export const getPlayingNow = async () => {
    const [listen] = await fetchListens("playing-now");
    return listen ? formatListen(listen) : null;
};
