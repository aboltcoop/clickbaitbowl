// Seed data — VERIFIED through July 5, 2026 (late evening ET).
// Group-stage points from the official pool spreadsheet (frozen).
// Knockout records verified against ESPN / Yahoo / FIFA / CBS reports.
// Commissioner ruling applied: any win (incl. shootout) = 3 pts, loser 0.
// NOTE: Mexico vs England (R16) was IN PROGRESS at seed time — both teams
// carry R32-only knockout points until the next sync after full time.

export const SEED_VERSION = "2026-07-05b";

export const SEED_TEAMS = [
  // $5 tier
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", cost: 5, groupPts: 7, koPts: 3, out: false },   // R32: W 2-1 DR Congo · R16 vs Mexico in progress
  { name: "Spain", flag: "🇪🇸", cost: 5, groupPts: 7, koPts: 3, out: false },        // R32: W 3-0 Austria · R16 vs Portugal Jul 6
  { name: "France", flag: "🇫🇷", cost: 5, groupPts: 9, koPts: 6, out: false },       // R32: W 3-0 Sweden · R16: W 1-0 Paraguay
  { name: "Brazil", flag: "🇧🇷", cost: 5, groupPts: 7, koPts: 3, out: true },        // R32: W 2-1 Japan · R16: L 1-2 Norway
  { name: "Argentina", flag: "🇦🇷", cost: 5, groupPts: 9, koPts: 3, out: false },    // R32: W 3-2 aet Cabo Verde · R16 vs Egypt Jul 7
  // $4 tier
  { name: "Germany", flag: "🇩🇪", cost: 4, groupPts: 6, koPts: 0, out: true },       // R32: L on pens vs Paraguay
  { name: "Netherlands", flag: "🇳🇱", cost: 4, groupPts: 7, koPts: 0, out: true },   // R32: L on pens vs Morocco
  { name: "Belgium", flag: "🇧🇪", cost: 4, groupPts: 5, koPts: 3, out: false },      // R32: W 3-2 aet Senegal · R16 vs USA Jul 6
  { name: "Uruguay", flag: "🇺🇾", cost: 4, groupPts: 2, koPts: 0, out: true },       // out in groups
  { name: "Mexico", flag: "🇲🇽", cost: 4, groupPts: 9, koPts: 3, out: false },       // R32: W 2-0 Ecuador · R16 vs England in progress
  { name: "Colombia", flag: "🇨🇴", cost: 4, groupPts: 7, koPts: 3, out: false },     // R32: W vs Ghana · R16 vs Switzerland Jul 7
  { name: "Norway", flag: "🇳🇴", cost: 4, groupPts: 6, koPts: 6, out: false },       // R32: W 2-1 Ivory Coast · R16: W 2-1 Brazil
  // $3 tier
  { name: "USA", flag: "🇺🇸", cost: 3, groupPts: 6, koPts: 3, out: false },          // R32: W 2-0 Bosnia · R16 vs Belgium Jul 6
  { name: "Canada", flag: "🇨🇦", cost: 3, groupPts: 4, koPts: 3, out: true },        // R32: W 1-0 South Africa · R16: L 0-3 Morocco
  { name: "Japan", flag: "🇯🇵", cost: 3, groupPts: 5, koPts: 0, out: true },         // R32: L 1-2 Brazil
  { name: "Switzerland", flag: "🇨🇭", cost: 3, groupPts: 7, koPts: 3, out: false },  // R32: W 2-0 Algeria · R16 vs Colombia Jul 7
  { name: "Ecuador", flag: "🇪🇨", cost: 3, groupPts: 4, koPts: 0, out: true },       // R32: L 0-2 Mexico
  { name: "Sweden", flag: "🇸🇪", cost: 3, groupPts: 4, koPts: 0, out: true },        // R32: L 0-3 France
  { name: "Senegal", flag: "🇸🇳", cost: 3, groupPts: 3, koPts: 0, out: true },       // R32: L 2-3 aet Belgium
  { name: "South Korea", flag: "🇰🇷", cost: 3, groupPts: 3, koPts: 0, out: true },   // out in groups
  // $2 tier
  { name: "Iran", flag: "🇮🇷", cost: 2, groupPts: 3, koPts: 0, out: true },          // out in groups
  { name: "Egypt", flag: "🇪🇬", cost: 2, groupPts: 5, koPts: 3, out: false },        // R32: W on pens vs Australia · R16 vs Argentina Jul 7
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", cost: 2, groupPts: 3, koPts: 0, out: true }, // out in groups
  { name: "Czechia", flag: "🇨🇿", cost: 2, groupPts: 1, koPts: 0, out: true },       // out in groups
  { name: "Algeria", flag: "🇩🇿", cost: 2, groupPts: 4, koPts: 0, out: true },       // R32: L 0-2 Switzerland
  { name: "Ghana", flag: "🇬🇭", cost: 2, groupPts: 4, koPts: 0, out: true },         // R32: L vs Colombia
  { name: "Paraguay", flag: "🇵🇾", cost: 2, groupPts: 4, koPts: 3, out: true },      // R32: W on pens vs Germany · R16: L 0-1 France
  { name: "Tunisia", flag: "🇹🇳", cost: 2, groupPts: 0, koPts: 0, out: true },       // out in groups
  { name: "Bosnia-Herzegovina", flag: "🇧🇦", cost: 2, groupPts: 4, koPts: 0, out: true }, // R32: L 0-2 USA
  // $1 tier
  { name: "DR Congo", flag: "🇨🇩", cost: 1, groupPts: 4, koPts: 0, out: true },      // R32: L 1-2 England
  { name: "Cabo Verde", flag: "🇨🇻", cost: 1, groupPts: 3, koPts: 0, out: true },    // R32: L 2-3 aet Argentina
  { name: "Haiti", flag: "🇭🇹", cost: 1, groupPts: 0, koPts: 0, out: true },         // out in groups
  { name: "New Zealand", flag: "🇳🇿", cost: 1, groupPts: 1, koPts: 0, out: true },   // out in groups
  { name: "South Africa", flag: "🇿🇦", cost: 1, groupPts: 4, koPts: 0, out: true },  // R32: L 0-1 Canada
];

export const PLAYERS = [
  { handle: "lenny3330", picks: ["England", "Ecuador", "Iran", "Egypt", "Scotland", "DR Congo"] },
  { handle: "lems68impala", picks: ["Spain", "Germany", "USA", "Canada"] },
  { handle: "mongolgeek", picks: ["Spain", "USA", "Japan", "Switzerland", "Cabo Verde"] },
  { handle: "ben.frattini13", picks: ["Netherlands", "Belgium", "Switzerland", "Czechia", "Algeria"] },
  { handle: "schjake", picks: ["Spain", "Uruguay", "USA", "Senegal"] },
  { handle: "laurielennon219", picks: ["Spain", "Germany", "Sweden", "Ghana", "South Africa"] },
  { handle: "kemarciano", picks: ["France", "Brazil", "Germany", "New Zealand"] },
  { handle: "annieallnutt", picks: ["Brazil", "Germany", "Ecuador", "DR Congo", "Cabo Verde", "Haiti"] },
  { handle: "leonardpaustin", picks: ["France", "Belgium", "South Korea", "Paraguay", "Haiti"] },
  { handle: "scoochcoop", picks: ["Argentina", "Brazil", "Mexico", "New Zealand"] },
  { handle: "resellersuite", picks: ["Spain", "Mexico", "Colombia", "Iran"] },
  { handle: "joantaylor8688", picks: ["Spain", "Germany", "Japan", "Scotland", "Haiti"] },
  { handle: "alex.feinson", picks: ["Norway", "Colombia", "Japan", "Ecuador", "DR Congo"] },
  { handle: "slennon401", picks: ["Spain", "USA", "Tunisia", "Bosnia-Herzegovina", "New Zealand", "Cabo Verde", "Haiti"] },
  { handle: "m.mcsorley9", picks: ["Spain", "Germany", "Senegal", "Ecuador"] },
  { handle: "hans.k.len93", picks: ["France", "Argentina", "USA", "Scotland"] },
];

export const FIXTURES = [
  { when: "Mon Jul 6", match: "Spain vs Portugal", note: "R16 · Dallas" },
  { when: "Mon Jul 6", match: "USA vs Belgium", note: "R16 · Seattle" },
  { when: "Tue Jul 7", match: "Argentina vs Egypt", note: "R16 · Atlanta" },
  { when: "Tue Jul 7", match: "Switzerland vs Colombia", note: "R16 · Vancouver" },
  { when: "Thu Jul 9", match: "Morocco vs France", note: "QF · Boston" },
  { when: "Fri Jul 10", match: "USA/Belgium vs Spain/Portugal", note: "QF · Los Angeles" },
  { when: "Sat Jul 11", match: "Norway vs Mexico/England", note: "QF · Miami" },
  { when: "Sat Jul 11", match: "Argentina/Egypt vs Switzerland/Colombia", note: "QF" },
];