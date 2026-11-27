# 📘 Cigar Log — Project Notes

Plain-English notebook for the Cigar Log app. You don't need to be technical to use
this — it's just so you always know what things are and where to find them.

_Last updated: 2026-11-27_

---

## 🔗 Important links (bookmark these)

| What | Link | What it's for |
|---|---|---|
| **Your live app** | https://kphuff88.github.io/cigar-journal/ | The actual app people open and use |
| **Code storage (GitHub)** | https://github.com/kphuff88/cigar-journal | Where the app's files live online |
| **Backend (Supabase)** | https://supabase.com/dashboard | Accounts, database, and photo storage |

---

## 🔑 Values & logins to keep

- **Supabase Project URL:** `https://roemelqxveexgnylmfcm.supabase.co`
- **Supabase Publishable key:** `sb_publishable_GilyxsrHXHekyrrzkjlNYw_-3Nq6Idf`
  - This one is *safe to share* — it's meant to live inside the app code.
- **Supabase database password:** _(the one you created and saved during setup — keep it in your password manager; it is NOT written here on purpose)_
- **Supabase "secret" key:** never needed by us, never share it. Leave it alone.
- **GitHub login:** your normal GitHub account (you signed into Supabase with it too).

> 🔒 **Rule of thumb:** anything labeled *publishable* or *public* is safe. Anything
> labeled *secret*, *service_role*, or *password* should never be shared or posted.

---

## 🧱 What each piece is (plain English)

- **The app** — a single web page that runs in any phone or computer browser.
- **GitHub** — like a filing cabinet in the cloud that stores the app's code and
  publishes it as a website (that's the `github.io` link). *It does not touch your
  OneDrive or anything else on your computer.*
- **GitHub Pages** — the free service that turns the code in GitHub into the live
  website. Costs **$0**.
- **Supabase** — the "back office" that handles **user accounts**, the **database**
  (everyone's cigar info), and **photo storage**. On the **Free** plan = **$0** until
  the app gets real usage.
- **OneDrive** — just where a copy of the files sits on *your* PC. **Private. Not
  public. Not connected to the website.**

---

## 🗺️ What we've built so far (timeline)

1. **First version** — a phone app to photograph a cigar band and log details. Saved
   only on your own device.
2. **Rebuilt from scratch** to your spec: **two photos** (band + cigar), brand, name,
   a **5-star rating**, and **personal notes**.
3. **Put it online** (free) at the GitHub Pages link above.
4. **Added usernames** so each person has their own log on their device.
5. **Phase 2:** real **accounts (email + password)** with cigars, ratings, notes, and
   **photos saved in the cloud** so they sync across devices — powered by the free
   Supabase backend.
6. **Added since:** a **photo cropper** (pinch-to-zoom + drag to frame each band/cigar),
   plus automatic photo cleanup (square-crop, brighten/sharpen, compress) and cloud
   storage tidy-up.

> A camera "Shop Check" (read a band and auto-match it to your collection) was tried
> and removed — the text recognition wasn't reliable enough on real cigar bands.
7. **Cigar Shops directory (shared):** any signed-in user can add a shop (name, address,
   notes, location), and a **"Near me"** search lists shops by distance with map
   directions. Opened with the **map-marker** button in the top bar. Ratings are now **1–10
   stars**, color-coded (red 1–3, orange 4–5, yellow 6–8, green 9–10).
   _Setup: run **supabase-shops.sql** in Supabase once (see to-do)._
8. **Scan band (AI auto-fill):** photograph a band and tap **✨ Scan band to fill Brand
   & Name** — the app reads the band with Google's AI and fills Brand, Name, and (when
   printed) Size/Origin/Wrapper. The Google key is kept secret on the server via a
   Supabase "middleman" so it's never exposed in the public app. Everyone who uses the
   app shares this one free setup. _(Live since 2026-11-27.)_
9. **Editor polish (phone-first):** one field per row, white field backgrounds with
   dark-brown text, Band/Length fields, type-or-pick dropdowns for Origin & Wrapper,
   and a multi-select checkbox list for Binders.
10. **Subscriptions (15-day free trial → $4.99/year via Stripe):** everyone gets 15
    days free from signup (no card). After that a paywall appears; they pay on Stripe's
    secure page. Secret Stripe key kept server-side. _(Setup: `BILLING_SETUP.md`;
    functions `create-checkout`, `check-subscription`.)_
11. **Owner Admin screen** (⋮ menu, only for the admin email): edit the Origin/Wrapper/
    Binder dropdown lists for everyone, see all users, give **free access** (comp) to
    friends/testers, delete accounts, and moderate the cigar shops. _(Setup:
    `ADMIN_SETUP.md`; function `admin`; tables `app_options`, `comps`.)_

> Note: a service worker was tried for auto-updates but **removed** — it caused blank
> screens and refresh loops. The app now loads straight from the web every time.

---

## ✅ Where things stand right now

**Phase 2 is being wired up.** To finish it, two quick one-time clicks in Supabase are
needed (see next section). After those, you'll be able to create an account and log in
from any device.

---

## 📋 To-do / open items

- [ ] **Run the database setup** in Supabase (file: `supabase-setup.sql`). _See how-to below._
- [ ] **Turn OFF email confirmation** in Supabase so username logins work. _See how-to below._
- [x] Test: create an account on the live app and add a cigar.
- [ ] **Run `supabase-shops.sql`** in Supabase → SQL Editor (creates the shared Cigar Shops directory). Until then, the 📍 Shops screen will say "Almost ready".
- [ ] **Re-run `supabase-setup.sql`** (or the short ALTER snippet) to add the new cigar
      columns: `profile`, `origin`, `wrapper`, `binder`, `filler`. Until then the app
      still saves, but those new fields won't be stored.
- [x] **Scan band (AI auto-fill) is LIVE** — free Google AI key + `scan-band` Edge
      Function + `GEMINI_API_KEY` secret are all set up and working (tested 2026-11-27).
      Photograph a band → tap ✨ Scan → Brand & Name fill in automatically. Friends
      share this one setup; they need nothing extra.

---

## 🛠️ How-to: the two Supabase steps

**Step A — Create the database tables**
1. Go to https://supabase.com/dashboard → open your **cigar-log** project.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open the file `supabase-setup.sql` (in this project), copy **everything**, paste it in.
4. Click **Run**. You should see "Success."

**Step B — Let new users start right away (turn off email confirmation)**
1. Left sidebar → **Authentication**.
2. Find **Sign In / Providers** (or **Providers**) → **Email**.
3. Turn **OFF** the **"Confirm email"** toggle → **Save**.
_(Why: people sign in with their email + password. With confirmation OFF they can start
immediately instead of waiting for a confirmation email — the free tier only sends a few
emails per hour. We can turn this back ON later and add "forgot password" at the same time.)_

---

## 💡 How to change the app later

You don't edit anything yourself. Just tell Claude Code what you want (e.g. "add a
price field," "change the colors," "let users see each other's cigars"). Claude edits
the code and pushes it live — the website updates automatically in a minute or two.

---

## 💰 Cost summary

- Website hosting (GitHub Pages): **$0**
- Backend free tier (Supabase): **$0** until meaningful usage, then a few $/month.
- Optional custom web address later (like `cigarlog.com`): ~$10–15 **per year**.

---

_This file is updated as the project grows. If something here looks out of date, ask
Claude to refresh the notes._
