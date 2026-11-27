# 💳 Subscription setup — plain-English steps

This turns on the **15-day free trial → $4.99/year** subscription.
You do this **once**. We'll do it in **TEST mode first** (fake money) to
make sure it works, then flip to live.

**How it works for users:** everyone gets 15 days free from the day they
sign up (no card needed). After that, the app shows a "Subscribe" screen.
They pay on Stripe's own secure page — their card never touches the app.

There are four parts:
- **A.** In Stripe: create the $4.99/year price and get your secret key.
- **B.** In Supabase: deploy the two "middleman" functions.
- **C.** In Supabase: add your Stripe secrets.
- **D.** Test it with a fake card. Then go live.

> 🔒 Your Stripe **Secret key** is like a master password. It only ever
> goes into Supabase's secret box (never the app). Never post it anywhere.

---

## Part A — Stripe (do this in TEST mode)

1. Go to **https://dashboard.stripe.com**.
2. Top-right: make sure **Test mode** is **ON** (toggle shows "Test mode").
3. **Create the yearly price:**
   - Left menu → **Product catalog** (or **Products**) → **＋ Add product**.
   - Name: **Cigar Log Subscription**
   - Under **Price**: amount **4.99**, **Recurring**, billing period **Yearly**.
   - **Save product.**
   - Click the price you just made and **copy its API ID** — it starts with
     **`price_...`**. Keep it handy.
4. **Get your secret key:**
   - Left menu → **Developers** → **API keys**.
   - Find **Secret key** (test). Click **Reveal**, then copy it. It starts
     with **`sk_test_...`**.

---

## Part B — Supabase: deploy the two functions

Same as the scanner setup — **Edge Functions → Deploy a new function**.

1. Name it **exactly** `create-checkout`. Delete the sample code, then paste
   everything from `supabase/functions/create-checkout/index.ts`. **Deploy.**
2. Do it again, named **exactly** `check-subscription`, pasting from
   `supabase/functions/check-subscription/index.ts`. **Deploy.**

(If copy/paste is fiddly, the raw files are at:
`https://raw.githubusercontent.com/kphuff88/cigar-journal/main/supabase/functions/create-checkout/index.ts`
and `.../check-subscription/index.ts`.)

Leave **"Verify JWT"** turned **ON** for both (the default) — that makes sure
only signed-in users can start a checkout.

---

## Part C — Add your Stripe secrets

In **Edge Functions → Secrets** (a.k.a. Manage secrets), add two:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | your `sk_test_...` key from Part A |
| `STRIPE_PRICE_ID` | your `price_...` id from Part A |

Save. (They take effect right away.)

---

## Part D — Test it (fake money), then go live

**To see the paywall without waiting 15 days:** tell Claude and it will
temporarily set the trial to 0 days, so the subscribe screen shows
immediately. (It sets it back to 15 afterward.)

**Test payment:**
1. Open the app, sign in, and you should see the **Subscribe — $4.99/year**
   screen. Tap it.
2. On Stripe's checkout page, use the **test card**:
   - Number: **4242 4242 4242 4242**
   - Expiry: any future date (e.g. 12/34) · CVC: any 3 digits · ZIP: any
3. After paying, you're sent back to the app and it **unlocks**.

**Go live (real money):**
1. In Stripe, switch **Test mode OFF** (top-right).
2. Re-create the same **$4.99/year** product/price in live mode and copy the
   new **live** `price_...` id.
3. **Developers → API keys** → copy the **live** Secret key (`sk_live_...`).
4. In Supabase, update the two secrets with the **live** values
   (`STRIPE_SECRET_KEY` → `sk_live_...`, `STRIPE_PRICE_ID` → live `price_...`).

That's it — you're taking real subscriptions.

---

## Good to know

- **Want yourself (or a friend) to use it free forever?** In Stripe, create a
  **100%-off coupon / promotion code**, then enter that code on the checkout
  page (the box is already enabled). No charge, full access.
- **Refunds / cancellations** are done from your Stripe dashboard.
- **Changing the price later:** make a new price in Stripe and update the
  `STRIPE_PRICE_ID` secret. Existing subscribers keep their old price.
- **Stripe's fee** is about 2.9% + 30¢ per payment, taken automatically.
- To change or remove any of this, just ask Claude.
