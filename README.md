# ticus — Personal Portfolio

my personal portfolio. live at [ticusb.com](https://ticusb.com).

## Tech Stack

- **React 18** (Create React App) with React Router 6 (`HashRouter`)
- **Fully custom CSS** — no framework, just css variables and vibes
- **Vercel** for hosting and the `/api` functions, behind Cloudflare
- **Upstash Redis** (via Vercel Storage) for shared rate limits

## Pages

- **Home** — hero, about, stack, "currently building", what I'm listening to, and a box to recommend me a song
- **Projects** — full-viewport scroll-reveal showcase
- **Project pages** (`#/work/<slug>`) — each project as a README you `cat` in a terminal
- **Art** — my gallery, embedded from [art.ticusb.com](https://art.ticusb.com)

All project content lives in `src/data/projects.js`. Flip `active: true` on a project to
put it under "currently building" on the homepage.

## Features

- light/dark mode toggle + live accent color picker (persisted to localStorage)
- terminal-style landing animation
- cursor glow that follows your mouse and reacts to your accent color
- listening history from ListenBrainz, so it covers Spotify, my self-hosted Navidrome and my iPod
- song recommendations go into a Spotify playlist, and my server mirrors them into Navidrome
- everything animated respects `prefers-reduced-motion`

## API (`/api`)

| endpoint | what it does |
|---|---|
| `GET /api/now-playing` | what's playing (Spotify, then ListenBrainz) + the last 5 plays (ListenBrainz), with cover art |
| `GET /api/search-songs?q=` | Spotify track search for the recommend box |
| `POST /api/add-song` | adds a recommendation to the Spotify playlist |

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
npx vercel dev   # the real dev server — runs the site AND the /api functions
npm test         # model + API guard + ListenBrainz tests (node --test)
npm run lint     # eslint, incl. the a11y rules
npm run build    # production build
```

`npm start` works for pure frontend stuff, but it doesn't run `/api`, so the listening
section stays empty.

Deploys happen on push to `main` (Vercel). The old `npm run deploy` (GitHub Pages) is
left over from before Vercel.

## Easter Eggs

there are two. good luck.
