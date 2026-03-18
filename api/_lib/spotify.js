let cached = { token: null, expiresAt: 0 };

export const getAccessToken = async () => {
    if (cached.token && Date.now() < cached.expiresAt) {
        return cached.token;
    }
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
    if (!data.access_token) throw new Error("Spotify token exchange failed");
    cached = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cached.token;
};
