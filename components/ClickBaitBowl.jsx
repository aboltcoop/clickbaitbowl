"use client";

import { useState, useEffect, useMemo } from "react";
import { SEED_TEAMS, PLAYERS, FIXTURES, SEED_VERSION } from "../lib/seed";

/* ────────────────────────────────────────────────────────────
   THE 2026 WORLD CUP CLICK BAIT BOWL — live leaderboard
   Scoring: Win 3 · Draw 1 · Loss 0 — any win (incl. shootouts) = 3
   ──────────────────────────────────────────────────────────── */

const TIER_COLORS = { 5: "#0B6E4F", 4: "#1D7A8C", 3: "#5B4E9E", 2: "#A85B2A", 1: "#7A7265" };

export default function ClickBaitBowl() {
  const [teams, setTeams] = useState(SEED_TEAMS);
  const [meta, setMeta] = useState({ lastUpdated: null, source: "seed" });
  const [tab, setTab] = useState("board");
  const [expanded, setExpanded] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [adminCode, setAdminCode] = useState("");

  // Load shared state from the API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/scores");
        const data = await res.json();
        if (data.teams) {
          setTeams((prev) =>
            prev.map((seed) => {
              const s = data.teams.find((x) => x.name === seed.name);
              return s ? { ...seed, groupPts: s.groupPts, koPts: s.koPts, out: s.out } : seed;
            })
          );
        }
        if (data.meta) setMeta(data.meta);
      } catch (e) {
        /* offline or no backend — seed data stands */
      }
      setLoaded(true);
    })();
  }, []);

  async function persist(nextTeams, source, codeOverride) {
    const slim = nextTeams.map(({ name, groupPts, koPts, out }) => ({ name, groupPts, koPts, out }));
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams: slim, meta: { source }, code: codeOverride ?? adminCode }),
      });
      if (res.status === 401) {
        const code = window.prompt("This board is protected. Enter the admin code to save:");
        if (code) {
          setAdminCode(code);
          return persist(nextTeams, source, code);
        }
        setSaveMsg("Not saved — admin code required.");
        setTimeout(() => setSaveMsg(null), 5000);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMeta(data.meta);
      setSaveMsg("Saved — everyone sees the updated board");
      setTimeout(() => setSaveMsg(null), 3500);
    } catch (e) {
      setSaveMsg(`Couldn't save: ${e.message}`);
      setTimeout(() => setSaveMsg(null), 6000);
    }
  }

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.name, t])), [teams]);

  const standings = useMemo(() => {
    const rows = PLAYERS.map((p) => {
      const squad = p.picks.map((name) => teamMap[name]).filter(Boolean);
      const total = squad.reduce((s, t) => s + t.groupPts + t.koPts, 0);
      const groupTotal = squad.reduce((s, t) => s + t.groupPts, 0);
      const alive = squad.filter((t) => !t.out).length;
      const spend = squad.reduce((s, t) => s + t.cost, 0);
      return { ...p, squad, total, groupTotal, alive, spend };
    });
    const groupRank = [...rows].sort((a, b) => b.groupTotal - a.groupTotal || a.handle.localeCompare(b.handle));
    const grIdx = Object.fromEntries(groupRank.map((r, i) => [r.handle, i]));
    rows.sort((a, b) => b.total - a.total || b.alive - a.alive || a.handle.localeCompare(b.handle));
    return rows.map((r, i) => ({ ...r, rank: i + 1, delta: grIdx[r.handle] - i }));
  }, [teamMap]);

  const ownersOf = useMemo(() => {
    const m = {};
    PLAYERS.forEach((p) => p.picks.forEach((t) => (m[t] = (m[t] || 0) + 1)));
    return m;
  }, []);

  /* ── AI live sync ─────────────────────────────────────── */
  async function syncScores() {
    setSyncing(true);
    setSyncError(null);
    setProposal(null);
    try {
      const current = teams
        .map((t) => `${t.name}: ${t.groupPts + t.koPts} pts, ${t.out ? "eliminated" : "alive"}`)
        .join("; ");
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, teamNames: teams.map((t) => t.name) }),
      });
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Server error ${res.status} — likely a timeout. Wait a few seconds and try again.`);
      }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const diffs = (data.updates || [])
        .map((u) => {
          const team = teams.find((t) => t.name === u.t);
          if (!team) return null;
          const curPts = team.groupPts + team.koPts;
          if (curPts === u.p && team.out === !!u.o) return null;
          return { name: team.name, flag: team.flag, from: curPts, to: u.p, wasOut: team.out, nowOut: !!u.o };
        })
        .filter(Boolean);
      if (diffs.length === 0) setSyncError("Everything is already up to date.");
      else setProposal(diffs);
    } catch (e) {
      setSyncError(`Sync failed: ${e.message}. You can update scores manually in Edit mode.`);
    } finally {
      setSyncing(false);
    }
  }

  function applyProposal() {
    const next = teams.map((t) => {
      const d = proposal.find((x) => x.name === t.name);
      if (!d) return t;
      return { ...t, koPts: d.to - t.groupPts, out: d.nowOut };
    });
    setTeams(next);
    setProposal(null);
    persist(next, "live sync");
  }

  /* ── Edit mode ────────────────────────────────────────── */
  function startEdit() {
    setDraft(teams.map((t) => ({ ...t })));
    setEditMode(true);
  }
  function saveEdit() {
    setTeams(draft);
    setEditMode(false);
    persist(draft, "manual edit");
    setDraft(null);
  }
  function resetToSeed() {
    const fresh = SEED_TEAMS.map((t) => ({ ...t }));
    setTeams(fresh);
    setEditMode(false);
    setDraft(null);
    persist(fresh, `reset to ${SEED_VERSION} seed`);
  }

  const lastUpdatedLabel = meta.lastUpdated
    ? new Date(meta.lastUpdated).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : `${SEED_VERSION} seed data`;

  const leader = standings[0];

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.kicker}>WORLD CUP 2026 · FANTASY POOL · 16 ENTRANTS · $15 EACH</div>
          <h1 style={styles.title}>
            The Click Bait <span style={styles.titleGold}>Bowl!!!</span>
          </h1>
          <div style={styles.subRow}>
            <span style={styles.livePill}>
              <span className="cbb-pulse" style={styles.liveDot} />
              {meta.source === "seed" ? "SEEDED" : "UPDATED"} · {lastUpdatedLabel}
            </span>
            <span style={styles.rulePill}>W 3 · D 1 · L 0</span>
          </div>
        </div>
      </header>

      {/* Fixtures ticker */}
      <div style={styles.ticker}>
        <div className="cbb-ticker-track">
          {[...FIXTURES, ...FIXTURES].map((f, i) => (
            <span key={i} style={styles.tickerItem}>
              <b style={{ color: "#FFC629" }}>{f.when}</b>&nbsp; {f.match} <span style={{ opacity: 0.55 }}>· {f.note}</span>
              <span style={styles.tickerDivider}>◆</span>
            </span>
          ))}
        </div>
      </div>

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <div style={styles.tabs}>
            <button className="cbb-tab" data-active={tab === "board"} onClick={() => setTab("board")}>Leaderboard</button>
            <button className="cbb-tab" data-active={tab === "teams"} onClick={() => setTab("teams")}>Team Values</button>
          </div>
          <div style={styles.actions}>
            <button className="cbb-btn cbb-btn-gold" onClick={syncScores} disabled={syncing || editMode}>
              {syncing ? "Searching for results…" : "⟳ Sync live scores"}
            </button>
            {!editMode ? (
              <button className="cbb-btn" onClick={startEdit}>Edit scores</button>
            ) : (
              <>
                <button className="cbb-btn cbb-btn-gold" onClick={saveEdit}>Save changes</button>
                <button className="cbb-btn" onClick={() => { setEditMode(false); setDraft(null); }}>Cancel</button>
                <button className="cbb-btn cbb-btn-danger" onClick={resetToSeed}>Reset to seed</button>
              </>
            )}
          </div>
        </div>

        {saveMsg && <div style={styles.toast}>{saveMsg}</div>}
        {syncError && <div style={{ ...styles.toast, background: "#3B2A1A", borderColor: "#A85B2A" }}>{syncError}</div>}

        {proposal && (
          <div style={styles.proposal}>
            <div style={styles.proposalTitle}>Live sync found {proposal.length} update{proposal.length > 1 ? "s" : ""} — review before applying</div>
            <div style={styles.proposalGrid}>
              {proposal.map((d) => (
                <div key={d.name} style={styles.proposalRow}>
                  <span>{d.flag} <b>{d.name}</b></span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18 }}>
                    {d.from} → <b style={{ color: "#FFC629" }}>{d.to}</b> pts
                    {d.wasOut !== d.nowOut && (
                      <span style={{ marginLeft: 8, color: d.nowOut ? "#FF6B6B" : "#7BE39A" }}>
                        {d.nowOut ? "· eliminated" : "· back alive?"}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="cbb-btn cbb-btn-gold" onClick={applyProposal}>Apply updates</button>
              <button className="cbb-btn" onClick={() => setProposal(null)}>Discard</button>
            </div>
            <div style={styles.proposalNote}>AI-generated from web search — double-check anything surprising.</div>
          </div>
        )}

        {!loaded ? (
          <div style={styles.loading}>Loading the board…</div>
        ) : tab === "board" ? (
          <section>
            {leader && (
              <div style={styles.leaderBanner}>
                <span style={styles.trophy}>🏆</span>
                <span>
                  <b style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: 0.5 }}>{leader.handle}</b>
                  <span style={{ opacity: 0.75 }}> leads the Bowl with </span>
                  <b style={{ color: "#FFC629", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20 }}>{leader.total} pts</b>
                  <span style={{ opacity: 0.75 }}> · {leader.alive} of {leader.squad.length} teams still alive</span>
                </span>
              </div>
            )}

            <div style={styles.card}>
              {standings.map((p) => {
                const isOpen = expanded === p.handle;
                return (
                  <div key={p.handle} style={{ borderBottom: "1px solid #E7E3D8" }}>
                    <button className="cbb-row" onClick={() => setExpanded(isOpen ? null : p.handle)} aria-expanded={isOpen}>
                      <span style={{ ...styles.rank, ...(p.rank === 1 ? styles.rankGold : {}) }}>{p.rank}</span>
                      <span style={styles.delta}>
                        {p.delta > 0 ? <span style={{ color: "#0B6E4F" }}>▲{p.delta}</span> : p.delta < 0 ? <span style={{ color: "#C0392B" }}>▼{Math.abs(p.delta)}</span> : <span style={{ color: "#B9B2A3" }}>—</span>}
                      </span>
                      <span style={styles.handle}>{p.handle}</span>
                      <span style={styles.aliveCount}>{p.alive}/{p.squad.length} alive</span>
                      <span style={styles.total}>{p.total}</span>
                      <span style={styles.chev}>{isOpen ? "▾" : "▸"}</span>
                    </button>
                    {isOpen && (
                      <div style={styles.squad}>
                        {[...p.squad].sort((a, b) => b.cost - a.cost).map((t) => (
                          <div key={t.name} style={{ ...styles.chip, opacity: t.out ? 0.62 : 1 }}>
                            <span style={{ ...styles.chipCost, background: TIER_COLORS[t.cost] }}>${t.cost}</span>
                            <span style={{ fontSize: 15 }}>{t.flag}</span>
                            <span style={{ textDecoration: t.out ? "line-through" : "none" }}>{t.name}</span>
                            {t.out && <span style={styles.redCard} title="Eliminated" />}
                            <span style={styles.chipPts}>{t.groupPts + t.koPts}</span>
                          </div>
                        ))}
                        <div style={styles.squadMeta}>spent ${p.spend} of $15 · group stage: {p.groupTotal} pts · knockouts: +{p.total - p.groupTotal}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section style={styles.card}>
            <div style={styles.teamHeaderRow}>
              <span style={{ width: 42 }}>Tier</span>
              <span style={{ flex: 1 }}>Team</span>
              <span style={{ width: 70, textAlign: "center" }}>Owners</span>
              <span style={{ width: 70, textAlign: "center" }}>Group</span>
              <span style={{ width: 70, textAlign: "center" }}>KO</span>
              <span style={{ width: 70, textAlign: "right" }}>Total</span>
            </div>
            {(editMode ? draft : teams)
              .slice()
              .sort((a, b) => b.cost - a.cost || (b.groupPts + b.koPts) - (a.groupPts + a.koPts))
              .map((t) => (
                <div key={t.name} style={{ ...styles.teamRow, opacity: t.out && !editMode ? 0.55 : 1 }}>
                  <span style={{ ...styles.tierBadge, background: TIER_COLORS[t.cost] }}>${t.cost}</span>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 17 }}>{t.flag}</span>
                    <span style={{ textDecoration: t.out ? "line-through" : "none", fontWeight: 600 }}>{t.name}</span>
                    {t.out && <span style={styles.redCard} title="Eliminated" />}
                  </span>
                  <span style={{ width: 70, textAlign: "center", color: "#8A8272" }}>{ownersOf[t.name] || 0}</span>
                  {editMode ? (
                    <>
                      <span style={{ width: 70, textAlign: "center" }}>
                        <input
                          className="cbb-input"
                          type="number"
                          value={t.groupPts}
                          onChange={(e) => {
                            const v = parseInt(e.target.value || "0", 10);
                            setDraft((d) => d.map((x) => (x.name === t.name ? { ...x, groupPts: isNaN(v) ? 0 : v } : x)));
                          }}
                        />
                      </span>
                      <span style={{ width: 70, textAlign: "center" }}>
                        <input
                          className="cbb-input"
                          type="number"
                          value={t.koPts}
                          onChange={(e) => {
                            const v = parseInt(e.target.value || "0", 10);
                            setDraft((d) => d.map((x) => (x.name === t.name ? { ...x, koPts: isNaN(v) ? 0 : v } : x)));
                          }}
                        />
                      </span>
                      <span style={{ width: 70, textAlign: "right" }}>
                        <button
                          className="cbb-mini"
                          data-out={t.out}
                          onClick={() => setDraft((d) => d.map((x) => (x.name === t.name ? { ...x, out: !x.out } : x)))}
                        >
                          {t.out ? "OUT" : "ALIVE"}
                        </button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ width: 70, textAlign: "center", color: "#8A8272" }}>{t.groupPts}</span>
                      <span style={{ width: 70, textAlign: "center", color: "#8A8272" }}>{t.koPts > 0 ? `+${t.koPts}` : "—"}</span>
                      <span style={styles.teamTotal}>{t.groupPts + t.koPts}</span>
                    </>
                  )}
                </div>
              ))}
            <div style={styles.footnote}>
              Commissioner ruling: any win — regulation, extra time, or penalty shootout — is worth 3 pts; the loser gets 0.
              Applied to Germany–Paraguay and Netherlands–Morocco.
            </div>
          </section>
        )}

        <footer style={styles.footer}>
          Scores are shared — anyone viewing this page sees the same board. · Group-stage points sourced from the official
          pool spreadsheet · Knockout results through July 3, 2026.
        </footer>
      </main>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────── */

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily: "'Barlow', -apple-system, 'Segoe UI', sans-serif",
    color: "#1B2A1F",
    background: "repeating-linear-gradient(90deg, #14603A 0px, #14603A 90px, #0F5231 90px, #0F5231 180px)",
  },
  header: { padding: "34px 16px 18px", textAlign: "center" },
  headerInner: { maxWidth: 860, margin: "0 auto" },
  kicker: { fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.22em", fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 8 },
  title: {
    fontFamily: "'Archivo Black', sans-serif",
    fontSize: "clamp(30px, 6vw, 56px)",
    color: "#FDFDF6",
    margin: 0,
    lineHeight: 1.02,
    textTransform: "uppercase",
    textShadow: "0 3px 0 rgba(0,0,0,0.28)",
  },
  titleGold: { color: "#FFC629" },
  subRow: { display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" },
  livePill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(0,0,0,0.32)", color: "#FDFDF6",
    border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "5px 14px",
    fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", fontSize: 13,
  },
  liveDot: { width: 8, height: 8, borderRadius: 99, background: "#FFC629", display: "inline-block" },
  rulePill: {
    background: "#FFC629", color: "#1B2A1F", borderRadius: 999, padding: "5px 14px",
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.08em", fontSize: 13,
  },
  ticker: {
    background: "#0B1F14", borderTop: "2px solid #FFC629", borderBottom: "2px solid #FFC629",
    overflow: "hidden", whiteSpace: "nowrap", color: "#EDEAE0",
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, padding: "7px 0",
  },
  tickerItem: { display: "inline-flex", alignItems: "center" },
  tickerDivider: { margin: "0 18px", color: "#FFC629", fontSize: 8 },
  main: { maxWidth: 860, margin: "0 auto", padding: "22px 14px 40px" },
  toolbar: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  tabs: { display: "flex", gap: 6 },
  actions: { display: "flex", gap: 6, flexWrap: "wrap" },
  toast: { background: "#0B1F14", color: "#EDEAE0", border: "1px solid #FFC629", borderRadius: 8, padding: "9px 14px", marginBottom: 12, fontSize: 14 },
  proposal: { background: "#0B1F14", color: "#EDEAE0", border: "2px solid #FFC629", borderRadius: 12, padding: 16, marginBottom: 16 },
  proposalTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 19, marginBottom: 10, color: "#FFC629" },
  proposalGrid: { display: "flex", flexDirection: "column", gap: 6 },
  proposalRow: { display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderBottom: "1px dashed rgba(255,255,255,0.15)" },
  proposalNote: { fontSize: 12, opacity: 0.6, marginTop: 10 },
  loading: { color: "#FDFDF6", textAlign: "center", padding: 40, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18 },
  leaderBanner: {
    background: "#0B1F14", color: "#EDEAE0", borderRadius: 12, padding: "12px 16px", marginBottom: 14,
    display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,198,41,0.45)",
  },
  trophy: { fontSize: 24 },
  card: { background: "#FDFDF6", borderRadius: 14, boxShadow: "0 6px 24px rgba(0,0,0,0.25)", overflow: "hidden" },
  rank: { fontFamily: "'Archivo Black', sans-serif", fontSize: 19, width: 34, textAlign: "center", color: "#1B2A1F" },
  rankGold: { background: "#FFC629", borderRadius: 8, padding: "2px 0" },
  delta: { width: 40, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", textAlign: "center" },
  handle: { flex: 1, fontWeight: 600, fontSize: 15, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis" },
  aliveCount: { fontFamily: "'Barlow Condensed', sans-serif", color: "#8A8272", fontSize: 14, width: 74, textAlign: "right" },
  total: { fontFamily: "'Archivo Black', sans-serif", fontSize: 22, width: 56, textAlign: "right", color: "#0B6E4F" },
  chev: { width: 22, textAlign: "center", color: "#B9B2A3" },
  squad: { padding: "4px 14px 14px 88px", display: "flex", flexWrap: "wrap", gap: 8, background: "#F6F4EA" },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "#FDFDF6", border: "1px solid #DED9C8", borderRadius: 999,
    padding: "4px 10px 4px 4px", fontSize: 13.5, fontWeight: 500,
  },
  chipCost: { color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, borderRadius: 999, padding: "2px 8px", fontSize: 12.5 },
  chipPts: { fontFamily: "'Archivo Black', sans-serif", fontSize: 13, color: "#0B6E4F", marginLeft: 2 },
  redCard: { width: 9, height: 12, background: "#DC2626", borderRadius: 2, display: "inline-block", transform: "rotate(8deg)", boxShadow: "0 1px 1px rgba(0,0,0,0.3)" },
  squadMeta: { width: "100%", fontSize: 12, color: "#8A8272", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" },
  teamHeaderRow: {
    display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
    fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase",
    fontSize: 12, color: "#8A8272", borderBottom: "2px solid #1B2A1F",
  },
  teamRow: { display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderBottom: "1px solid #EDEAE0", fontSize: 14.5 },
  tierBadge: { color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, borderRadius: 6, width: 34, textAlign: "center", padding: "3px 0", fontSize: 13 },
  teamTotal: { width: 70, textAlign: "right", fontFamily: "'Archivo Black', sans-serif", color: "#0B6E4F", fontSize: 16 },
  footnote: { padding: "12px 16px 16px", fontSize: 12.5, color: "#8A8272", lineHeight: 1.5 },
  footer: { marginTop: 18, textAlign: "center", color: "rgba(255,255,255,0.78)", fontSize: 12.5, lineHeight: 1.6, textShadow: "0 1px 0 rgba(0,0,0,0.3)" },
};
