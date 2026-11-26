// ============================================================
// Cigar Log — "Scan band" secure middleman (Supabase Edge Function)
//
// What it does: the app sends a band photo here; this function calls
// Google Gemini with your SECRET key and returns the cigar's brand/name.
// The key lives only here (as a Supabase secret), never in the public app.
//
// One-time setup (see SCAN_SETUP.md):
//   1. Create a free Google AI key.
//   2. Deploy this function in Supabase (named exactly: scan-band).
//   3. Add the key as a secret named GEMINI_API_KEY.
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Google's current free-tier model that can read images.
const MODEL = "gemini-3.5-flash-lite";

const PROMPT = `You are reading the band (paper label) on a cigar from a photo. Identify the cigar.
Return ONLY a JSON object with these string fields (use "" when something is not clearly shown — do not guess):
{"brand":"","name":"","size":"","origin":"","wrapper":""}
- brand: the cigar maker or brand (e.g. "Padrón", "Arturo Fuente", "Mark Twain").
- name: the specific line or blend name (e.g. "1964 Anniversary", "Hemingway", "Riverboat").
- size: vitola or dimensions if printed (e.g. "Toro 6x50"), else "".
- origin: country of origin if shown, else "".
- wrapper: wrapper type or shade if shown (e.g. "Maduro", "Connecticut"), else "".
Output the JSON object only, with no extra words.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const KEY = Deno.env.get("GEMINI_API_KEY");
    if (!KEY) return json({ error: "Server not set up yet: missing GEMINI_API_KEY secret." }, 500);

    const { image, mimeType } = await req.json().catch(() => ({}));
    if (!image || typeof image !== "string") return json({ error: "No image was sent." }, 400);

    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType || "image/jpeg", data: image } },
          { text: PROMPT },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 256, responseMimeType: "application/json" },
    };

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
        body: JSON.stringify(body),
      },
    );

    if (!r.ok) {
      const detail = (await r.text().catch(() => "")).slice(0, 300);
      return json({ error: "The AI service returned an error.", detail }, 502);
    }

    const data = await r.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p?.text || "").join("").trim();

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* leave empty */ } }
    }

    return json({
      brand: str(parsed.brand),
      name: str(parsed.name),
      size: str(parsed.size),
      origin: str(parsed.origin),
      wrapper: str(parsed.wrapper),
    });
  } catch (e) {
    return json({ error: "Something went wrong reading the band.", detail: String(e).slice(0, 300) }, 500);
  }
});

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
