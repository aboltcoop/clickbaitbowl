// Live score sync: asks Claude (with web search) for updated cumulative
// tournament points for each team. The API key stays server-side.
// v2: larger token budget, JSON-only system prompt, pause_turn handling.

export const maxDuration = 60; // allow up to 60s for searches (Vercel)

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it in Vercel → Settings → Environment Variables." },
      { status: 503 }
    );
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

  const prompt = `Today is ${new Date().toDateString()}. You are updating a fantasy scoreboard for the 2026 FIFA World Cup. Scoring rule: every match a team plays (group stage AND knockout rounds) earns win=3, draw=1, loss=0. ANY win counts as 3 pts, including wins in extra time or by penalty shootout (the shootout loser gets 0, NOT 1 for the draw). Points accumulate across the whole tournament.

Use web search to find results of recent 2026 World Cup matches, then compute each team's current cumulative points and whether they are eliminated. Teams already marked eliminated cannot change — skip them. Focus only on teams marked alive.

Our current data (may be stale): ${String(current).slice(0, 4000)}

Output format: a raw JSON array containing ONLY the teams whose points or status differ from our current data, e.g. [{"t":"Egypt","p":8,"o":false}]. Keys: t = team name (use exactly these names: ${teamNames.join(", ")}), p = new total points, o = true if eliminated. If nothing changed, output []. Output the JSON array and NOTHING else — no explanations, no markdown.`;

  try {
    let messages = [{ role: "user", content: prompt }];
    let data = null;

    // Long search turns can pause; resume up to 3 times.
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          system:
            "You are a sports data API endpoint. You respond only with the exact raw JSON requested — never prose, never markdown, never explanations.",
          messages,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return Response.json(
          { error: `Anthropic API error ${response.status}: ${errText.slice(0, 300)}` },
          { status: 502 }
        );
      }

      data = await response.json();
      if (data.stop_reason !== "pause_turn") break;
      // Resume the paused turn: send the assistant message back unchanged.
      messages = [...messages, { role: "assistant", content: data.content }];
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start === -1 || end === -1) {
      return Response.json(
        { error: `Model returned no JSON (stop_reason: ${data.stop_reason}). Try again in a moment.` },
        { status: 502 }
      );
    }
    const updates = JSON.parse(cleaned.slice(start, end + 1));
    return Response.json({ updates });
  } catch (e) {
    return Response.json({ error: `Sync failed: ${e.message}` }, { status: 500 });
  }
}