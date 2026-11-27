// ============================================================
// Cigar Log — "create-checkout" (Supabase Edge Function)
//
// Makes a Stripe Checkout session for the $4.99/year subscription and
// returns its URL. The app sends the signed-in user here; this function
// uses your SECRET Stripe key (stored as a Supabase secret) to create
// the session. The user then pays on Stripe's own hosted page — their
// card never touches the app or this code.
//
// One-time setup (see BILLING_SETUP.md):
//   1. Create a $4.99/year recurring Price in Stripe; copy its price_... id.
//   2. Deploy this function (named exactly: create-checkout).
//   3. Add secrets: STRIPE_SECRET_KEY and STRIPE_PRICE_ID.
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_FALLBACK = "https://kphuff88.github.io/cigar-journal/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const PRICE = Deno.env.get("STRIPE_PRICE_ID");
    if (!STRIPE_KEY || !PRICE) {
      return json({ error: "Billing isn't set up yet (missing Stripe secret or price)." }, 500);
    }

    const user = await getUser(req);
    if (!user) return json({ error: "You need to be signed in." }, 401);

    const body = await req.json().catch(() => ({}));
    const base = sanitizeBase(body && body.returnTo);

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", PRICE);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", base + "?paid=1");
    form.set("cancel_url", base + "?canceled=1");
    form.set("client_reference_id", user.id);
    form.set("customer_email", user.email);
    form.set("subscription_data[metadata][user_id]", user.id);
    form.set("allow_promotion_codes", "true");

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + STRIPE_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = await r.json();
    if (!r.ok) {
      return json({ error: "Stripe couldn't start checkout.", detail: (data.error && data.error.message) || "" }, 502);
    }
    return json({ url: data.url });
  } catch (e) {
    return json({ error: "Couldn't start checkout.", detail: String(e).slice(0, 200) }, 500);
  }
});

async function getUser(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get("Authorization") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  if (!auth || !SUPABASE_URL || !ANON) return null;
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { Authorization: auth, apikey: ANON },
  });
  if (!r.ok) return null;
  const u = await r.json();
  if (!u || !u.id || !u.email) return null;
  return { id: u.id, email: u.email };
}

function sanitizeBase(v: unknown): string {
  try {
    if (typeof v !== "string") return SITE_FALLBACK;
    const u = new URL(v);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return SITE_FALLBACK;
    return u.origin + u.pathname;
  } catch {
    return SITE_FALLBACK;
  }
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
