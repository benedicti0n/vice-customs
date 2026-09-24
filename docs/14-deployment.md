# 14 — Deployment

## Production Build

```bash
npm run build
npm run start
```

The app is a fully static Next.js page (prerendered at build time); there are no server-only routes.

## Recommended Target

**Vercel** — the standard Next.js host, and the environment the challenge is judged in.

### Setup

1. Push the repository to GitHub
2. Import into Vercel (framework auto-detected: Next.js)
3. Deploy

No configuration files or build overrides are needed.

## Environment Variables

```text
None
```

There are no required environment variables.

## Runtime Network Dependency

The app itself is self-contained except for the paint booth:

- `@unlayer/react-image-editor` loads its embedded script and assets from `https://cdn.unlayer.com/image-editor/embed.js`
- Therefore the **paint booth requires internet access**; everything else runs locally

`projectId` is **not** configured and is **not** required (AI features are unused). If AI features were ever enabled, an Unlayer `projectId` would be required.

## Static / Client-Side Characteristics

- All vehicle art, street environments, analysis, and build-card PNGs are generated client-side on Canvas
- No images in `public/` (only the favicon)
- No backend, database, accounts, or payments
- Livery + build number persist in the browser's `localStorage`
- The page is safe to serve from any static host (Vercel, Netlify, or `next start`)