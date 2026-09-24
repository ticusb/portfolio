import assert from "node:assert/strict";
import test from "node:test";

import { formatListen } from "../api/_lib/listenbrainz.js";

const listen = (meta) => ({ listened_at: 1790210515, track_metadata: meta });

test("a Spotify-sourced listen links to Spotify and gets cover art", () => {
    const track = formatListen(
        listen({
            track_name: "Lamb's Wool",
            artist_name: "Foster The People",
            release_name: "Lamb's Wool",
            additional_info: {
                music_service: "spotify.com",
                origin_url: "https://open.spotify.com/track/7egu63DOhNpivWOpGtzqGS",
            },
            mbid_mapping: {
                caa_id: 26264115177,
                caa_release_mbid: "4b4ed3f4-556c-4702-8442-bee1a806df19",
            },
        }),
    );
    assert.equal(track.source, "spotify");
    assert.equal(track.url, "https://open.spotify.com/track/7egu63DOhNpivWOpGtzqGS");
    assert.equal(
        track.albumArt,
        "https://coverartarchive.org/release/4b4ed3f4-556c-4702-8442-bee1a806df19/26264115177-250.jpg",
    );
});

test("a Navidrome listen falls back to MusicBrainz and may have no art", () => {
    const track = formatListen(
        listen({
            track_name: "Slowing Down",
            artist_name: "Scarlet Pleasure",
            additional_info: { submission_client: "Navidrome" },
            mbid_mapping: { recording_mbid: "266dc6be-2564-4840-9d95-d2e6225f7813" },
        }),
    );
    assert.equal(track.source, "self-hosted");
    assert.equal(track.url, "https://musicbrainz.org/recording/266dc6be-2564-4840-9d95-d2e6225f7813");
    assert.equal(track.albumArt, null);
});

test("hostile or broken metadata never becomes a link or image URL", () => {
    const track = formatListen(
        listen({
            track_name: "x",
            artist_name: "y",
            additional_info: { origin_url: "javascript:alert(1)", spotify_id: "https://evil.example/track" },
            mbid_mapping: { caa_id: "1/../../x", caa_release_mbid: "not-a-uuid", recording_mbid: "nope" },
        }),
    );
    assert.equal(track.url, null);
    assert.equal(track.albumArt, null);
    assert.equal(formatListen(listen({ track_name: "", artist_name: "y" })), null);
    assert.equal(formatListen(null), null);
});
