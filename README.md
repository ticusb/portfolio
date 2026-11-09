# ticus — ticusb.com

my corner of the internet: a crayon drawing you can walk around in. live at [ticusb.com](https://ticusb.com).

## What it is

Click the crayon and the page draws itself, then turns 3D. Light mode is a ski run (I carve down my blue mountain and 360 through a ring of fire over a lava crevasse); dark mode is space (a UFO beams me up). Then you land somewhere the nav lives in the world:

- **about**: the camera climbs to the summit where I'm chilling
- **projects**: a snow sculpture garden (or constellations), one per project; click one
- **monologue**: zoom into my face and float around inside my head

Also: draw on the page, rec me a song, and push your cursor to an edge to find the end of the simulation.

## Stack

- React 18 (Create React App), plain JS, React Router 6 (hash routes deep-link into the world: `#/about`, `#/work/<slug>`)
- three.js pinned to **0.128.0** (the custom crayon shaders are tuned for it)
- Vercel: the site plus `/api` functions for now-playing (ListenBrainz + Spotify) and song recs

## Where things are

- `src/crayon/`: the world. `engine.js` runs the gate, intro clock, sections and render loop; `worlds/` has ski and space (as beats + camera shots); `shaders.js` is the crayon look
- `src/data/projects.js`: projects; `src/data/monologue.js`: the monologue
- `tools/dailies/`: films the world frame by frame on the GPU to judge motion (`node tools/dailies/film.mjs --help` is the header comment)

## Development

```bash
npm install
npx vercel dev   # localhost:3000 with /api (plain npm start has no /api)
npm test         # node tests
npm run lint
npm run build
```

Deploys: push to `main`.
