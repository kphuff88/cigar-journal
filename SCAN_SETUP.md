# 📷 "Scan band" setup — plain-English steps

This turns on the **Scan band to fill Brand & Name** button in the editor.
You do this **once**. It's free. Takes about 10 minutes.

There are three parts:
- **A.** Get a free Google AI key (the "password" that lets the app read bands).
- **B.** Put that key somewhere secret in Supabase.
- **C.** Turn on the little "middleman" program (so the key is never shown to the public).

> 🔒 Why the middleman? If the key sat inside the app, anyone opening the
> website could copy it and run up charges. The middleman keeps it hidden.

---

## Part A — Get your free Google AI key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with any Google account.
3. Click **Create API key** (choose "create in a new project" if it asks).
4. A long code appears starting with **`AIza...`**. Click **Copy**.
5. Paste it somewhere safe for a minute (a note, or your password manager).
   - This is like a password — don't post it publicly. (If it ever leaks,
     you can delete it on this same page and make a new one.)

> 💲 Cost: Google's free tier covers this at **$0** for normal personal use.
> 🔎 Privacy note: on the **free** tier, Google may use submitted images to
> improve their products. For cigar band photos that's low-risk, but if you'd
> rather it never be used, we can switch to a paid key later (still pennies).

---

## Part B & C — In Supabase (dashboard, no coding)

1. Go to **https://supabase.com/dashboard** and open your **cigar-log** project.
2. Left sidebar → **Edge Functions**.
3. Click **Deploy a new function** (or **Create function**).
   - Name it **exactly**: `scan-band`  ← must match exactly, all lowercase.
4. It opens a code editor. **Delete whatever sample code is there**, then
   open the file **`supabase/functions/scan-band/index.ts`** (in this project),
   copy **everything**, and paste it in.
5. Click **Deploy**.
6. Now add your secret key. Still under **Edge Functions**, find
   **Secrets** (sometimes under **Manage secrets** or Project Settings →
   Edge Functions). Click **Add new secret**:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** paste the `AIza...` key from Part A
   - **Save.**

That's it. (If you added the secret after deploying, that's fine — it takes
effect right away.)

---

## Try it

1. Open your app: **https://kphuff88.github.io/cigar-journal/**
2. Tap **+** to add a cigar → **Photograph the band**.
3. Tap **✨ Scan band to fill Brand & Name**.
4. Brand and Name (and size/origin/wrapper when visible) fill in automatically.
   Always glance over them and fix anything before saving.

If it says *"Scan unavailable"*: usually the function name isn't exactly
`scan-band`, or the `GEMINI_API_KEY` secret is missing or misspelled. Re-check
those two things.

---

## Good to know

- **Each person who uses your app shares this one setup** — your friends don't
  need their own key. The scans run through your free Google key.
- **Cost stays ~$0** for personal/small use. If the app ever gets very popular
  and bumps Google's free limits, scans would just pause until the next day (or
  you add a paid key — still only pennies). Tell Claude and we'll adjust.
- **To change or remove the feature later**, just ask Claude.
