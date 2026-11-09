# ticus — Personal Portfolio

my personal portfolio. live at [ticusb.com](https://ticusb.com).

## Tech Stack

- **React 18** (Create React App) with React Router 6
- **Fully custom CSS** — no framework, just css variables and vibes
- **GitHub Pages** with a custom domain via CNAME

## Pages

- **Home** — the crayon world: click the crayon, watch the intro (a ski run, or a UFO abduction in space), then land on a scene where the nav lives in the world. Light mode skis, dark mode goes to space.
- **About** — the short version, plus what I work with
- **Monologue** — me thinking out loud (empty for now)
- **Projects** — full-viewport scroll-reveal showcase

## Features

- light/dark mode toggle + live accent color picker (persisted to localStorage)
- the home page is three.js (pinned to 0.128.0, the shaders are tuned for it) drawn to look like crayon, with a now-playing card and a song-rec box
- draw on the home page; push your cursor to an edge and the simulation starts to show
- cursor glow that follows your mouse and reacts to your accent color

## Development

```bash
npm install
npm start        # dev server at localhost:3000
npm run build    # production build
npm run deploy   # ships to ticusb.com
```

## Easter Eggs

there are two. good luck.
