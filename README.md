# ticus — Personal Portfolio

Personal developer portfolio site for Ticus, live at [ticusb.com](https://ticusb.com).

## Tech Stack

- **React 18** (Create React App) with React Router 6 (HashRouter for GitHub Pages compatibility)
- **Bootstrap 5** with custom SCSS — variable overrides and utility extensions via the Bootstrap API
- **GitHub Pages** with a custom domain via CNAME

## Pages

- **Home** — Landing page with personal intro and definition card
- **Projects** — Showcase of selected work
- **Grouse** — Additional content section

## Development

```bash
npm install
npm start        # Dev server at localhost:3000
npm run build    # Production build
npm run deploy   # Build and deploy to GitHub Pages (ticusb.com)
```

## Styling

Bootstrap is imported via SCSS and extended through:
- `src/styles/scss/abstracts/` — variable overrides and Bootstrap map amendments
- `src/styles/scss/utilities/` — custom utility classes via the Bootstrap API
