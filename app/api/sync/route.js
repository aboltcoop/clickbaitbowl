// Live score sync — v3
// Stage 1: Claude + web search finds results.
// Stage 2 (fallback): a second, search-free call converts findings to strict JSON.
// Robust JSON extraction that ignores prose brackets.

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

// Find a parseable JSON array of objects anywhere in the text.
function extractJsonArray(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  // 1) whole thing is the array
  try {
    const v = JSON.parse(cleaned);
    if (Array.isArray(v)) return v;
  } catch {}
  // 2) explicit empty array
  if (/\[\s*\]/.test(cleaned) && !cleaned.includes("{")) return [];
  // 3) try every '[' that is followed by '{' as a start candidate
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

  const formatSpec = `a raw JSON array containing ONLY teams whose points or status differ from the current data, e.g. [{"t":"Egypt","p":8,"o":false}]. Keys: t = team name (exactly one of: ${teamNames.join(
    ", "
  )}), p = new cumulative total points, o = true if eliminated from the tournament. If nothing changed: [].`;

  const searchPrompt = `Today is ${new Date().toDateString()}. You maintain a fantasy scoreboard for the 2026 FIFA World Cup. Scoring: every match played (group stage AND knockouts) earns win=3, draw=1, loss=0. ANY win = 3 pts, including extra-time and penalty-shootout wins (shootout loser gets 0, NOT 1). Points accumulate all tournament.

Use web search to find recent 2026 World Cup results. Teams already marked eliminated cannot change — skip them entirely; check only teams marked alive.

Current data (may be stale): ${String(current).slice(0, 4000)}

After researching, output ${formatSpec} Output the JSON array and NOTHING else.`;

  try {
    // ── Stage 1: research with web search (resume if the turn pauses)
    let messages = [{ role: "user", content: searchPrompt }];
    let data = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      data = await callClaude({
        model: MODEL,
        max_tokens: 4000,
        system: "You are a sports data API endpoint. End your turn with exactly the raw JSON requested.",
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      });
      if (data.stop_reason !== "pause_turn") break;
      messages = [...messages, { role: "assistant", content: data.content }];
    }

    const stage1Text = textOf(data);
    let updates = extractJsonArray(stage1Text);

    // ── Stage 2 fallback: convert prose findings into strict JSON (no tools)
    if (updates === null && stage1Text.trim().length > 0) {
      const data2 = await callClaude({
        model: MODEL,
        max_tokens: 1500,
        system: "You convert text into JSON. Respond with ONLY the raw JSON array — no prose, no markdown.",
        messages: [
          {
            role: "user",
            content: `Current scoreboard data: ${String(current).slice(0, 4000)}

Research findings about updated 2026 World Cup results:
${stage1Text.slice(0, 6000)}

Convert the findings into ${formatSpec}`,
          },
        ],
      });
      updates = extractJsonArray(textOf(data2));
    }

    if (updates === null) {
      return Response.json(
        { error: `Couldn't extract JSON from the model's response (stop_reason: ${data.stop_reason}). Try again.` },
        { status: 502 }
      );
    }

    // Validate entries
    const valid = updates.filter(
      (u) => u && typeof u.t === "string" && teamNames.includes(u.t) && Number.isFinite(u.p)
    );
    return Response.json({ updates: valid });
  } catch (e) {
    return Response.json({ error: `Sync failed: ${e.message}` }, { status: 500 });
  }
}