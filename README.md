# Cigar Log 🚬

A simple, free web app for logging cigars from your phone. Anyone can open it and
start logging — no account required.

For each cigar you can record:

- **Brand** and **Name**
- A photo of the **band** and a photo of the **cigar**
- A personal **5-star rating**
- Personal **tasting notes**

**Live app:** https://kphuff88.github.io/cigar-journal/

On your phone, open that link and use **Add to Home Screen** to install it like a
native app.

## How your data is stored

Each person's cigars are saved **privately on their own device** (in the browser's
IndexedDB). Nothing is uploaded and there is no shared database or login. Use the
**⋮ menu → Export / backup** to save a JSON file you can re-import on another phone.

> Want a shared version where users sign in and can see each other's cigars? That
> requires a backend server + database — a larger project than this single-page app.

## Technical

- Single self-contained file: [`index.html`](index.html) — no build step, no
  dependencies, works offline once loaded.
- Photos are downscaled and compressed before storage.
- Served via GitHub Pages from `main` (root); `.nojekyll` makes Pages serve files as-is.

## Editing

Edit `index.html` and push — GitHub Pages redeploys automatically.
