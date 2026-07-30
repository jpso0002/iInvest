// XP / unit / streak math. Pure functions — safe to unit test.

import type { LessonId, StreakState, UnitNumber } from "@/store/schema";
import { lessonsByUnit, units } from "@/content/lessons";

/**
 * The unit the learner is currently working through: the first one that isn't
 * fully complete (or the last unit once everything is done). Units vary in
 * length (5/4/4/4/6/6 lessons), so this walks them rather than dividing.
 */
export const unitForCompleted = (completed: LessonId[]): UnitNumber => {
  for (const u of units) {
    const inUnit = lessonsByUnit(u.id);
    if (!inUnit.every((l) => completed.includes(l.id))) return u.id;
  }
  return units[units.length - 1].id;
};

/** True when finishing a lesson carried the learner into a new unit. */
export const isUnitUp = (before: LessonId[], after: LessonId[]): boolean =>
  unitForCompleted(after) > unitForCompleted(before);

/** Today in UTC as `YYYY-MM-DD`. */
export const todayUTC = (d: Date = new Date()): string => {
  return d.toISOString().slice(0, 10);
};

const yesterdayOf = (isoDay: string): string => {
  const [y, m, d] = isoDay.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
};

/**
 * Advance streak for a qualifying activity (lesson complete OR trade).
 * - Same-day: no change.
 * - Consecutive day: +1.
 * - Otherwise: reset to 1.
 */
export const bumpStreak = (
  streak: StreakState,
  today: string = todayUTC(),
): StreakState => {
  if (streak.lastActiveDay === today) return streak;
  const yest = yesterdayOf(today);
  const next = streak.lastActiveDay === yest ? streak.count + 1 : 1;
  return { count: next, lastActiveDay: today };
};
