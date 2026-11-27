// ============================================================
// Cigar Log — "check-subscription" (Supabase Edge Function)
//
// The app calls this after the free trial ends to ask Stripe:
// "does this signed-in person have an active paid subscription?"
// Returns { active: true/false }. Uses your SECRET Stripe key, which
// stays here as a Supabase secret and is never exposed in the app.
//
// One-time setup (see BILLING_SETUP.md):
//   1. Deploy this function (named exactly: check-subscription).
//   2. It reuses the STRIPE_SECRET_KEY secret from create-checkout.
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_KEY) return json({ error: "Billing isn't set up yet." }, 500);

    const user = await getUser(req);
    if (!user) return json({ error: "You need to be signed in." }, 401);

    const h = { "Authorization": "Bearer " + STRIPE_KEY };

    // Find Stripe customers with this email (there may be more than one over time).
    const cr = await fetch(
      "https://api.stripe.com/v1/customers?limit=10&email=" + encodeURIComponent(user.email),
      { headers: h },
    );
    const cust = await cr.json();
    if (!cr.ok) return json({ error: "Stripe lookup failed." }, 502);

    let active = false;
    let periodEnd: number | null = null;

    for (const c of (cust.data || [])) {
      const sr = await fetch(
        "https://api.stripe.com/v1/subscriptions?limit=3&status=active&customer=" + c.id,
        { headers: h },
      );
      const subs = await sr.json();
      if (sr.ok && subs.data && subs.data.length) {
        active = true;
        periodEnd = subs.data[0].current_period_end || null;
        break;
      }
    }

    return json({ active, periodEnd });
  } catch (e) {
    return json({ error: "Couldn't check subscription.", detail: String(e).slice(0, 200) }, 500);
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

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
