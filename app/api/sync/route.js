// Live score sync — v4 (idempotent)
// The model reports each alive team's FULL-TOURNAMENT match record (W-D-L),
// which is an absolute fact. The server computes points = 3W + 1D.
// Repeated syncs therefore converge on the same correct totals.

export const maxDuration = 60;

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

function headers() {
  return {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
}

function textOf(data) {
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function extractJsonArray(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const v = JSON.parse(cleaned);
    if (Array.isArray(v)) return v;
  } catch {}
  if (/\[\s*\]/.test(cleaned) && !cleaned.includes("{")) return [];
  for (let i = cleaned.indexOf("["); i !== -1; i = cleaned.indexOf("[", i + 1)) {
    if (cleaned.slice(i).match(/^\[\s*\{/) === null) continue;
    for (let j = cleaned.lastIndexOf("]"); j > i; j = cleaned.lastIndexOf("]", j - 1)) {
      try {
        const v = JSON.parse(cleaned.slice(i, j + 1));
        if (Array.isArray(v)) return v;
      } catch {}
    }
  }
  return null;
}

async function callClaude(body) {
  const response = await fetch(API_URL, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errText.slice(0, 200)}`);
  }
  return response.json();
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set in Vercel env vars." }, { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const { current, teamNames } = body;
  if (!current || !Array.isArray(teamNames)) {
    return Response.json({ error: "Missing current data or team names." }, { status: 400 });
  }

  const formatSpec = `a raw JSON array with one entry per team you researched, e.g. [{"t":"Spain","w":4,"d":0,"l":0,"o":false}]. Keys: t = team name (exactly one of: ${teamNames.join(
    ", "
  )}), w/d/l = that team's TOTAL wins, draws, losses across the ENTIRE 2026 World Cup so far (group stage + knockouts combined), o = true if eliminated. A match decided by penalty shootout counts as a WIN for the shootout winner and a LOSS for the loser (never a draw).`;

  const searchPrompt = `Today is ${new Date().toDateString()}. You maintain match records for the 2026 FIFA World Cup.

Use web search to find each team's results. Teams marked eliminated below are frozen — skip them entirely. Research ONLY the teams marked alive.

Current data for reference (totals may be wrong — do not trust them; report actual records from your research): ${String(
    current
  ).slice(0, 4000)}

After researching, output ${formatSpec} Output the JSON array and NOTHING else.`;

  try {
    // Stage 1: research (resume paused turns)
    let messages = [{ role: "user", content: searchPrompt }];
    let data = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      data = await callClaude({
        model: MODEL,
        max_tokens: 4000,
        system: "You are a sports data API endpoint. End your turn with exactly the raw JSON requested.",
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      });
      if (data.stop_reason !== "pause_turn") break;
      messages = [...messages, { role: "assistant", content: data.content }];
    }

    const stage1Text = textOf(data);
    let records = extractJsonArray(stage1Text);

    // Stage 2 fallback: strict conversion, no tools
    if (records === null && stage1Text.trim().length > 0) {
      const data2 = await callClaude({
        model: MODEL,
        max_tokens: 1500,
        system: "You convert text into JSON. Respond with ONLY the raw JSON array — no prose, no markdown.",
        messages: [
          {
            role: "user",
            content: `Research findings about 2026 World Cup team records:\n${stage1Text.slice(
              0,
              6000
            )}\n\nConvert the findings into ${formatSpec}`,
          },
        ],
      });
      records = extractJsonArray(textOf(data2));
    }

    if (records === null) {
      return Response.json(
        { error: `Couldn't extract JSON from the model's response (stop_reason: ${data.stop_reason}). Try again.` },
        { status: 502 }
      );
    }

    // Server computes points deterministically from the record: 3W + 1D.
    const updates = records
      .filter(
        (r) =>
          r &&
          typeof r.t === "string" &&
          teamNames.includes(r.t) &&
          Number.isInteger(r.w) &&
          Number.isInteger(r.d) &&
          Number.isInteger(r.l) &&
          r.w >= 0 && r.w <= 8 && r.d >= 0 && r.d <= 8 && r.l >= 0 && r.l <= 8
      )
      .map((r) => ({ t: r.t, p: 3 * r.w + r.d, o: !!r.o, rec: `${r.w}-${r.d}-${r.l}` }));

    return Response.json({ updates });
  } catch (e) {
    return Response.json({ error: `Sync failed: ${e.message}` }, { status: 500 });
  }
}