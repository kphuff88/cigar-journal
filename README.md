# Cigar Log 🚬

A simple, free web app for logging cigars from your phone. Anyone can open it,
pick a username, and start logging.

For each cigar you can record:

- **Brand** and **Name**
- A photo of the **band** and a photo of the **cigar**
- A personal **5-star rating**
- Personal **tasting notes**

**Live app:** https://kphuff88.github.io/cigar-journal/

On your phone, open that link and use **Add to Home Screen** to install it like a
native app.

## Usernames & how your data is stored

On first open, each person picks a **username**. For now this is a **device-local
profile**, not an online account: the username and all cigars (photos included) are
saved **privately on that device** in the browser's IndexedDB. There is no password,
nothing is uploaded, and the username does not yet sync between devices. Multiple
people can keep separate logs on the same device via **⋮ menu → Switch user**. Use
**⋮ menu → Export / backup** to move a user's log to another device.

> **Planned next:** real online accounts (username + password) backed by a server +
> database, so a user's photos and ratings follow them across devices. This app is
> structured (each record carries an `owner`) to make that migration straightforward.

## Technical

- Single self-contained file: [`index.html`](index.html) — no build step, no
  dependencies, works offline once loaded.
- Photos are downscaled and compressed before storage.
- Served via GitHub Pages from `main` (root); `.nojekyll` makes Pages serve files as-is.

## Editing

Edit `index.html` and push — GitHub Pages redeploys automatically.
