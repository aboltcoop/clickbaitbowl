// Live score sync — v5
// Group-stage points are FROZEN (known from the pool spreadsheet).
// The model researches ONLY the knockout record (June 28 onward) of teams
// still alive. Server computes: total = groupPts + 3*koWins + koDraws.
// Eliminated teams are hard-filtered server-side and can never change.

export const maxDuration = 300;

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

  // Client sends the authoritative state: [{ name, groupPts, out }]
  const { teams } = body;
  if (!Array.isArray(teams) || teams.length === 0) {
    return Response.json({ error: "Missing teams payload — update the site code (client/server version mismatch)." }, { status: 400 });
  }

  const alive = teams.filter((t) => !t.out && typeof t.name === "string");
  if (alive.length === 0) {
    return Response.json({ updates: [] });
  }
  const aliveNames = alive.map((t) => t.name);

  const formatSpec = `a raw JSON array with one entry per team, e.g. [{"t":"Spain","w":2,"d":0,"l":0,"o":false}]. Keys: t = team name (exactly one of: ${aliveNames.join(
    ", "
  )}), w/d/l = that team's wins, draws, losses in the KNOCKOUT STAGE ONLY (Round of 32 onward, June 28 or later — do NOT count group-stage matches), o = true if the team has been eliminated from the tournament. A match decided by penalty shootout counts as a WIN for the shootout winner and a LOSS for the loser (never a draw). A team that has not yet played a knockout match has w=0,d=0,l=0.`;

  const searchPrompt = `Today is ${new Date().toDateString()}. The 2026 FIFA World Cup knockout stage began June 28 with the Round of 32.

Use web search to find the KNOCKOUT-STAGE results (June 28 onward only) for these teams: ${aliveNames.join(", ")}.

Group-stage results are already recorded elsewhere and must NOT be counted. Only knockout matches.

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
            content: `Research findings about 2026 World Cup knockout-stage records:\n${stage1Text.slice(
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

    // Deterministic totals: frozen group points + knockout record.
    // Only alive teams can be updated — eliminated teams are untouchable.
    const byName = Object.fromEntries(alive.map((t) => [t.name, t]));
    const updates = records
      .filter(
        (r) =>
          r &&
          typeof r.t === "string" &&
          byName[r.t] &&
          Number.isInteger(r.w) && r.w >= 0 && r.w <= 6 &&
          Number.isInteger(r.d) && r.d >= 0 && r.d <= 6 &&
          Number.isInteger(r.l) && r.l >= 0 && r.l <= 2
      )
      .map((r) => ({
        t: r.t,
        p: (byName[r.t].groupPts || 0) + 3 * r.w + r.d,
        o: !!r.o,
        koRec: `${r.w}-${r.d}-${r.l}`,
      }));

    return Response.json({ updates });
  } catch (e) {
    return Response.json({ error: `Sync failed: ${e.message}` }, { status: 500 });
  }
}