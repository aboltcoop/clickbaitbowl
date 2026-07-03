// Seed data — group-stage points from the official pool spreadsheet,
// knockout points through July 3, 2026 (commissioner ruling: any win, incl. shootouts, = 3 pts).

export const SEED_VERSION = "2026-07-03";

export const SEED_TEAMS = [
  // $5 tier
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", cost: 5, groupPts: 7, koPts: 3, out: false },
  { name: "Spain", flag: "🇪🇸", cost: 5, groupPts: 7, koPts: 3, out: false },
  { name: "France", flag: "🇫🇷", cost: 5, groupPts: 9, koPts: 3, out: false },
  { name: "Brazil", flag: "🇧🇷", cost: 5, groupPts: 7, koPts: 3, out: false },
  { name: "Argentina", flag: "🇦🇷", cost: 5, groupPts: 9, koPts: 0, out: false },
  // $4 tier
  { name: "Germany", flag: "🇩🇪", cost: 4, groupPts: 6, koPts: 0, out: true },
  { name: "Netherlands", flag: "🇳🇱", cost: 4, groupPts: 7, koPts: 0, out: true },
  { name: "Belgium", flag: "🇧🇪", cost: 4, groupPts: 5, koPts: 3, out: false },
  { name: "Uruguay", flag: "🇺🇾", cost: 4, groupPts: 2, koPts: 0, out: true },
  { name: "Mexico", flag: "🇲🇽", cost: 4, groupPts: 9, koPts: 3, out: false },
  { name: "Colombia", flag: "🇨🇴", cost: 4, groupPts: 7, koPts: 0, out: false },
  { name: "Norway", flag: "🇳🇴", cost: 4, groupPts: 6, koPts: 3, out: false },
  // $3 tier
  { name: "USA", flag: "🇺🇸", cost: 3, groupPts: 6, koPts: 3, out: false },
  { name: "Canada", flag: "🇨🇦", cost: 3, groupPts: 4, koPts: 3, out: false },
  { name: "Japan", flag: "🇯🇵", cost: 3, groupPts: 5, koPts: 0, out: true },
  { name: "Switzerland", flag: "🇨🇭", cost: 3, groupPts: 7, koPts: 3, out: false },
  { name: "Ecuador", flag: "🇪🇨", cost: 3, groupPts: 4, koPts: 0, out: true },
  { name: "Sweden", flag: "🇸🇪", cost: 3, groupPts: 4, koPts: 0, out: true },
  { name: "Senegal", flag: "🇸🇳", cost: 3, groupPts: 3, koPts: 0, out: true },
  { name: "South Korea", flag: "🇰🇷", cost: 3, groupPts: 3, koPts: 0, out: true },
  // $2 tier
  { name: "Iran", flag: "🇮🇷", cost: 2, groupPts: 3, koPts: 0, out: true },
  { name: "Egypt", flag: "🇪🇬", cost: 2, groupPts: 5, koPts: 0, out: false },
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", cost: 2, groupPts: 3, koPts: 0, out: true },
  { name: "Czechia", flag: "🇨🇿", cost: 2, groupPts: 1, koPts: 0, out: true },
  { name: "Algeria", flag: "🇩🇿", cost: 2, groupPts: 4, koPts: 0, out: true },
  { name: "Ghana", flag: "🇬🇭", cost: 2, groupPts: 4, koPts: 0, out: false },
  { name: "Paraguay", flag: "🇵🇾", cost: 2, groupPts: 4, koPts: 3, out: false },
  { name: "Tunisia", flag: "🇹🇳", cost: 2, groupPts: 0, koPts: 0, out: true },
  { name: "Bosnia-Herzegovina", flag: "🇧🇦", cost: 2, groupPts: 4, koPts: 0, out: true },
  // $1 tier
  { name: "DR Congo", flag: "🇨🇩", cost: 1, groupPts: 4, koPts: 0, out: true },
  { name: "Cabo Verde", flag: "🇨🇻", cost: 1, groupPts: 3, koPts: 0, out: false },
  { name: "Haiti", flag: "🇭🇹", cost: 1, groupPts: 0, koPts: 0, out: true },
  { name: "New Zealand", flag: "🇳🇿", cost: 1, groupPts: 1, koPts: 0, out: true },
  { name: "South Africa", flag: "🇿🇦", cost: 1, groupPts: 4, koPts: 0, out: true },
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
  { when: "Fri Jul 3", match: "Argentina vs Cabo Verde", note: "R32 · Miami" },
  { when: "Fri Jul 3", match: "Australia vs Egypt", note: "R32 · Dallas" },
  { when: "Fri Jul 3", match: "Colombia vs Ghana", note: "R32 · Kansas City" },
  { when: "Sat Jul 4", match: "Paraguay vs France", note: "R16 · Philadelphia" },
  { when: "Sat Jul 4", match: "Canada vs Morocco", note: "R16 · Houston" },
  { when: "Sun Jul 5", match: "Brazil vs Norway", note: "R16 · New Jersey" },
  { when: "Sun Jul 5", match: "Mexico vs England", note: "R16 · Mexico City" },
  { when: "Mon Jul 6", match: "Portugal vs Spain", note: "R16 · Dallas" },
  { when: "Mon Jul 6", match: "USA vs Belgium", note: "R16 · Seattle" },
];
