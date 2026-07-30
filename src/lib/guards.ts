// Unlock / gating rules. Components MUST read through these — never hardcode
// unit numbers or lesson IDs at call sites.

import { assets } from "@/content/assets";
import type { AssetDef } from "@/content/assets";
import type { LessonId, UnitNumber, UserState } from "@/store/schema";
import { unitForCompleted } from "@/lib/xp";
import { INVEST_DISCLOSURE_LEVELS, isUnlocked } from "@/lib/disclosure";

export const currentUnit = (
  user: Pick<UserState, "completedLessons">,
): UnitNumber => unitForCompleted(user.completedLessons);

export const unlockedAssets = (unit: UnitNumber): AssetDef[] =>
  assets.filter((a) => a.unlockAfterUnit <= unit);

/** Fractional units unlock once the learner has actually started buying
 * (unit 3 is "Becoming a shareholder"). */
export const canUseFractional = (unit: UnitNumber): boolean => unit >= 3;

/** Target (stop-loss / take-profit) orders unlock with the invest sheet's
 * "protections" tier, so the rule lives in one place rather than being stated
 * both here as a unit number and there as a lesson threshold. */
export const canUseTargetOrders = (completedLessons: LessonId[]): boolean =>
  isUnlocked(completedLessons.length, INVEST_DISCLOSURE_LEVELS, 5);

/** Simulate tab is hidden until the very first lesson is done. */
export const simulateTabUnlocked = (
  user: Pick<UserState, "completedLessons">,
): boolean => user.completedLessons.includes("U1.1");
