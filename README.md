# ticus — ticusb.com

my corner of the internet: a crayon drawing you can walk around in. live at [ticusb.com](https://ticusb.com).

## What it is

Click the crayon and the page draws itself, then turns 3D. Light mode is a ski run (I carve down my blue mountain and 360 through a ring of fire over a lava crevasse); dark mode is space (a UFO beams me up). Then you land somewhere the nav lives in the world:

- **about**: the camera climbs to the summit where I'm chilling
- **projects**: a snow sculpture garden (or constellations), one per project; click one
- **monologue**: zoom into my face and float around inside my head

Also: draw on the page (mouse or finger), rec me a song, and push your cursor (or tilt your phone) to an edge to find the end of the simulation.

## Stack

- React 18 (Create React App), plain JS, React Router 6 (hash routes deep-link into the world: `#/about`, `#/work/<slug>`)
- three.js pinned to **0.128.0** (the custom crayon shaders are tuned for it)
- Vercel for hosting and the `/api` functions, behind Cloudflare
- Upstash Redis (via Vercel Storage) for shared rate limits

## Where things are

- `src/crayon/`: the world. `engine.js` runs the gate, intro clock, sections and render loop; `worlds/` has ski and space (as beats + camera shots); `shaders.js` is the crayon look
- `src/data/projects.js`: projects; `src/data/monologue.js`: the monologue
- `tools/dailies/`: films the world frame by frame on the GPU to judge motion (`node tools/dailies/film.mjs --help` is the header comment)

## API (`/api`)

| endpoint | what it does |
|---|---|
| `GET /api/now-playing` | what's playing (Spotify, then ListenBrainz) + the last 5 plays (ListenBrainz), with cover art |
| `GET /api/search-songs?q=` | Spotify track search for the recommend box |
| `POST /api/add-song` | adds a recommendation to the Spotify playlist |

Listening history comes from ListenBrainz, so it covers Spotify, my self-hosted Navidrome and my iPod. Song recommendations go into a Spotify playlist, and my server mirrors them into Navidrome.

Every endpoint goes through `api/_lib/guard.js`: allowed hosts/origins, per-IP and global
rate limits, and in production it only answers requests that came through Cloudflare
(Cloudflare adds an `x-edge-secret` header, Vercel checks it against `EDGE_SHARED_SECRET`).
Scanners probing for `.env`, `.git`, WordPress or admin panels get rewritten (in
`vercel.json`) to the honeypot in `api/honeypot.js` instead of `index.html`.

Env vars (Vercel): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`,
`SPOTIFY_PLAYLIST_ID`, `EDGE_SHARED_SECRET` (production only), and the `KV_REST_API_*` vars
Upstash adds. Optional: `LISTENBRAINZ_USER`. Re-auth Spotify with `npm run spotify:auth`.

## Development

```bash
npm install
npx vercel dev   # the real dev server: runs the site AND the /api functions
npm test         # world seams, projects, API guard + ListenBrainz tests (node --test)
npm run lint     # eslint, incl. the a11y rules
npm run build    # production build
```

`npm start` works for the world on its own, but it doesn't run `/api`, so the music line says the radio's off.

Deploys happen on push to `main` (Vercel).
