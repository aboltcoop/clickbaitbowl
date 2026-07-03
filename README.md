# The 2026 World Cup Click Bait Bowl!!!

Live leaderboard for a $15-budget World Cup fantasy pool. Next.js + Upstash Redis on Vercel.

## Scoring
Win 3 · Draw 1 · Loss 0, accumulated across group stage and knockouts.
Commissioner ruling: any win (regulation, extra time, or shootout) = 3 pts; loser gets 0.

## Features
- Leaderboard with expandable $15 squads, rank movement vs group stage, red-card elimination markers
- Team Values tab with per-tier pricing and ownership counts
- "Sync live scores": server route asks Claude (with web search) for updated results, shows a review diff before applying
- Manual Edit mode as commissioner override
- Shared state via Upstash Redis — everyone with the link sees the same board

## Local development
```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```
The board renders with seed data even with no env vars set; saving and sync require them.

## Deploy
1. Push this repo to GitHub
2. vercel.com -> Add New Project -> import the repo (defaults are fine)
3. Storage tab -> add Upstash Redis (free) -> connect to the project
4. Settings -> Environment Variables -> add ANTHROPIC_API_KEY (and ADMIN_CODE if you want edit protection)
5. Redeploy

## Data
- Group-stage points parsed from the pool's Google Form spreadsheet (all 16 entries validated at exactly $15)
- Knockout results seeded through July 3, 2026
