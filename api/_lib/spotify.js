let cached = { token: null, expiresAt: 0 };

export const getAccessToken = async () => {
    if (cached.token && Date.now() < cached.expiresAt) {
        return cached.token;
    }
    // a missing var would otherwise go out as the string "undefined" and come back as "invalid refresh token"
    const missing = ["SPOTIFY_REFRESH_TOKEN", "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"].filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`Spotify not configured: ${missing.join(", ")} not set`);
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
    });
    const data = await res.json();
    if (!data.access_token) {
        throw new Error(
            `Spotify token exchange failed: ${res.status} ${data.error ?? ""} ${data.error_description ?? ""}`.trim(),
        );
    }
    cached = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cached.token;
};
