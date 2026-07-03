import { Redis } from "@upstash/redis";

// Works with either the Upstash integration env names or the legacy Vercel KV names.
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const TEAMS_KEY = "cbb:teams";
const META_KEY = "cbb:meta";

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ teams: null, meta: null, warning: "No Redis configured — showing seed data only." });
  }
  try {
    const [teams, meta] = await Promise.all([redis.get(TEAMS_KEY), redis.get(META_KEY)]);
    return Response.json({ teams: teams || null, meta: meta || null });
  } catch (e) {
    return Response.json({ teams: null, meta: null, warning: "Redis read failed." }, { status: 500 });
  }
}

export async function POST(req) {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "No Redis configured. Add the Upstash integration in Vercel." }, { status: 503 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Optional write protection: set ADMIN_CODE in Vercel env vars to require it.
  if (process.env.ADMIN_CODE && body.code !== process.env.ADMIN_CODE) {
    return Response.json({ error: "Admin code required." }, { status: 401 });
  }

  const { teams, meta } = body;
  if (!Array.isArray(teams) || teams.length === 0 || teams.length > 60) {
    return Response.json({ error: "Invalid teams payload." }, { status: 400 });
  }
  const clean = teams.map((t) => ({
    name: String(t.name).slice(0, 40),
    groupPts: Math.max(0, Math.min(99, parseInt(t.groupPts, 10) || 0)),
    koPts: Math.max(-9, Math.min(99, parseInt(t.koPts, 10) || 0)),
    out: !!t.out,
  }));
  const cleanMeta = {
    lastUpdated: new Date().toISOString(),
    source: String(meta?.source || "manual edit").slice(0, 40),
  };
  try {
    await Promise.all([redis.set(TEAMS_KEY, clean), redis.set(META_KEY, cleanMeta)]);
    return Response.json({ ok: true, meta: cleanMeta });
  } catch (e) {
    return Response.json({ error: "Redis write failed." }, { status: 500 });
  }
}
