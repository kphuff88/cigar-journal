// ============================================================
// Cigar Log — "admin" Edge Function (owner-only control panel backend)
//
// Every request is checked: only the signed-in person whose email matches
// the ADMIN_EMAIL secret can do anything here. Everyone else is refused.
// Admin actions use the SERVICE ROLE key (auto-provided by Supabase) to
// read/modify data across all users.
//
// One-time setup (see ADMIN_SETUP.md):
//   1. Run supabase-admin.sql in the SQL editor.
//   2. Deploy this function (named exactly: admin).
//   3. Add the secret ADMIN_EMAIL = your email (e.g. you@gmail.com).
//      (It reuses STRIPE_SECRET_KEY to show who's subscribed.)
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const ADMIN_EMAIL = (Deno.env.get("ADMIN_EMAIL") || "").trim().toLowerCase();
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const TRIAL_DAYS = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const caller = await getUser(req);
    if (!caller) return json({ error: "You need to be signed in." }, 401);
    const isAdmin = !!ADMIN_EMAIL && caller.email.toLowerCase() === ADMIN_EMAIL;

    const body = await req.json().catch(() => ({}));
    const action = (body && body.action) || "";

    if (action === "whoami") return json({ admin: isAdmin });
    if (!isAdmin) return json({ error: "Not authorized." }, 403);
    if (!SERVICE || !SB_URL) return json({ error: "Server misconfigured: the service role key isn't available to this function." }, 500);

    switch (action) {
      case "users":          return json(await listUsers());
      case "comp":           return json(await setComp(body.user_id, body.comped !== false, body.note || ""));
      case "delete-user":    return json(await deleteUser(body.user_id, caller.id));
      case "options-get":    return json(await getOptions());
      case "options-add":    return json(await addOption(body.category, body.value));
      case "options-remove": return json(await removeOption(body.id));
      case "shops-list":     return json(await listShops());
      case "shop-delete":    return json(await deleteShop(body.id));
      default:               return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    return json({ error: String((e && (e as Error).message) || e).slice(0, 300) }, 500);
  }
});

/* ---------- auth ---------- */
async function getUser(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth || !SB_URL || !ANON) return null;
  const r = await fetch(SB_URL + "/auth/v1/user", { headers: { Authorization: auth, apikey: ANON } });
  if (!r.ok) return null;
  const u = await r.json();
  if (!u || !u.id || !u.email) return null;
  return { id: u.id, email: u.email };
}

/* ---------- service-role helpers ---------- */
const svc = { "Authorization": "Bearer " + SERVICE, "apikey": SERVICE };
async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(SB_URL + "/rest/v1/" + path, {
    ...init,
    headers: { ...svc, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await r.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

/* ---------- users ---------- */
async function listUsers() {
  // All auth users
  const ur = await fetch(SB_URL + "/auth/v1/admin/users?per_page=1000", { headers: svc });
  const uj = await ur.json().catch(() => ({}));
  const users: Array<{ id: string; email: string; created_at: string }> =
    (uj && (uj.users || uj)) || [];

  // Cigar counts
  const cig = await rest("cigars?select=user_id");
  const counts: Record<string, number> = {};
  if (Array.isArray(cig.data)) for (const row of cig.data as Array<{ user_id: string }>) {
    counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  }

  // Comps
  const cmp = await rest("comps?select=user_id,comped");
  const comped: Record<string, boolean> = {};
  if (Array.isArray(cmp.data)) for (const row of cmp.data as Array<{ user_id: string; comped: boolean }>) {
    comped[row.user_id] = !!row.comped;
  }

  const now = Date.now();
  const out = [];
  let subs = 0;
  for (const u of users) {
    const daysUsed = (now - new Date(u.created_at).getTime()) / 86400000;
    const inTrial = daysUsed < TRIAL_DAYS;
    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysUsed));
    const isComp = !!comped[u.id];
    let subscribed = false;
    if (!isComp && STRIPE_KEY) { try { subscribed = await stripeActive(u.email); } catch { /* ignore */ } }
    if (subscribed) subs++;
    let status = "Trial ended";
    if (isComp) status = "Free (comped)";
    else if (subscribed) status = "Subscribed";
    else if (inTrial) status = `Trial · ${daysLeft}d left`;
    out.push({
      user_id: u.id,
      email: u.email,
      joined: (u.created_at || "").slice(0, 10),
      cigars: counts[u.id] || 0,
      comped: isComp,
      subscribed,
      status,
    });
  }
  out.sort((a, b) => (a.joined < b.joined ? 1 : -1));
  const totals = {
    users: out.length,
    subscribers: subs,
    comped: Object.values(comped).filter(Boolean).length,
    cigars: Object.values(counts).reduce((a, b) => a + b, 0),
  };
  return { users: out, totals };
}

async function setComp(userId: string, comped: boolean, note: string) {
  if (!userId) return { error: "Missing user." };
  const r = await rest("comps?on_conflict=user_id", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, comped, note, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) return { error: `Free access failed (HTTP ${r.status}): ${detail(r.data)}` };
  return { ok: true, comped };
}

function detail(d: unknown): string {
  if (d == null) return "no detail";
  if (typeof d === "string") return d.slice(0, 200);
  try { return JSON.stringify(d).slice(0, 200); } catch { return String(d).slice(0, 200); }
}

async function deleteUser(userId: string, callerId: string) {
  if (!userId) return { error: "Missing user." };
  if (userId === callerId) return { error: "You can't delete your own admin account here." };
  const r = await fetch(SB_URL + "/auth/v1/admin/users/" + userId, { method: "DELETE", headers: svc });
  if (!r.ok) return { error: "Couldn't delete that user." };
  return { ok: true };
}

/* ---------- dropdown options ---------- */
async function getOptions() {
  const r = await rest("app_options?select=id,category,value,sort_order&order=category,sort_order");
  const groups: Record<string, Array<{ id: string; value: string }>> = { origin: [], wrapper: [], binder: [], filler: [] };
  if (Array.isArray(r.data)) for (const row of r.data as Array<{ id: string; category: string; value: string }>) {
    if (groups[row.category]) groups[row.category].push({ id: row.id, value: row.value });
  }
  return { options: groups };
}
async function addOption(category: string, value: string) {
  category = (category || "").trim(); value = (value || "").trim();
  if (!["origin", "wrapper", "binder", "filler"].includes(category)) return { error: "Bad category." };
  if (!value) return { error: "Enter a value." };
  const r = await rest("app_options", {
    method: "POST",
    headers: { "Prefer": "return=minimal" },
    body: JSON.stringify({ category, value, sort_order: Math.floor(Date.now() / 1000) % 32000 }),
  });
  if (!r.ok) return { error: "Couldn't add that item." };
  return { ok: true };
}
async function removeOption(id: string) {
  if (!id) return { error: "Missing id." };
  const r = await rest("app_options?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: { "Prefer": "return=minimal" } });
  if (!r.ok) return { error: "Couldn't remove that item." };
  return { ok: true };
}

/* ---------- shops ---------- */
async function listShops() {
  const r = await rest("shops?select=id,name,address,city,notes&order=created_at.desc");
  if (!r.ok) return { shops: [], error: `Shops read failed (HTTP ${r.status}): ${detail(r.data)}` };
  return { shops: Array.isArray(r.data) ? r.data : [] };
}
async function deleteShop(id: string) {
  if (!id) return { error: "Missing id." };
  const r = await rest("shops?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: { "Prefer": "return=minimal" } });
  if (!r.ok) return { error: "Couldn't delete that shop." };
  return { ok: true };
}

/* ---------- stripe ---------- */
async function stripeActive(email: string): Promise<boolean> {
  const h = { "Authorization": "Bearer " + STRIPE_KEY };
  const cr = await fetch("https://api.stripe.com/v1/customers?limit=5&email=" + encodeURIComponent(email), { headers: h });
  if (!cr.ok) return false;
  const cust = await cr.json();
  for (const c of (cust.data || [])) {
    const sr = await fetch("https://api.stripe.com/v1/subscriptions?limit=1&status=active&customer=" + c.id, { headers: h });
    const subs = await sr.json();
    if (sr.ok && subs.data && subs.data.length) return true;
  }
  return false;
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
