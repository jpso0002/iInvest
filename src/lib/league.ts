// Weekly league math. No backend — a deterministic per-week bot leaderboard
// gives the league a "living" feel without needing real other users.

const MS_PER_DAY = 86400000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** Fixed 7-day buckets since the Unix epoch. Call at runtime only (client). */
export const currentWeekId = (): number => Math.floor(Date.now() / MS_PER_WEEK);

export const daysUntilWeekReset = (): number => {
  const intoWeek = Date.now() % MS_PER_WEEK;
  return Math.max(1, Math.ceil((MS_PER_WEEK - intoWeek) / MS_PER_DAY));
};

export const LEAGUES = [
  { name: "Bronze League", minXp: 0 },
  { name: "Silver League", minXp: 100 },
  { name: "Gold League", minXp: 250 },
  { name: "Platinum League", minXp: 500 },
] as const;

export const computeLeague = (weeklyXp: number): string => {
  let current: string = LEAGUES[0].name;
  for (const l of LEAGUES) if (weeklyXp >= l.minXp) current = l.name;
  return current;
};

export interface LeagueBot {
  name: string;
  base: number;
}

export const LEAGUE_BOTS: LeagueBot[] = [
  { name: "Camille", base: 60 },
  { name: "Yanis", base: 48 },
  { name: "Léa", base: 38 },
  { name: "Mehdi", base: 28 },
  { name: "Sofia", base: 18 },
  { name: "Tom", base: 9 },
];

/** Deterministic per-week jitter so the leaderboard differs week to week
 * (same week → same numbers) without any backend. */
export const weeklyBotXp = (
  bot: LeagueBot,
  weekId: number,
  daysElapsed: number,
): number => {
  const seed = (weekId * 2654435761 + bot.name.length * 40503) >>> 0;
  const wobble = 0.6 + ((seed % 100) / 100) * 0.9; // 0.6-1.5x
  const perDay = bot.base * wobble;
  return Math.round(perDay * Math.min(7, daysElapsed + 1));
};
