import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  LEAGUE_BOTS,
  computeLeague,
  daysUntilWeekReset,
  weeklyBotXp,
} from "@/lib/league";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/_app/league")({
  head: () => ({
    meta: [
      { title: "League · iInvest" },
      {
        name: "description",
        content: "Earn XP this week to climb iInvest's practice leaderboard.",
      },
    ],
  }),
  component: LeaguePage,
});

function LeaguePage() {
  const weeklyXp = useAppStore((s) => s.user.weeklyXp);
  const name = useAppStore((s) => s.user.profile.name);
  const rolloverWeekIfNeeded = useAppStore((s) => s.rolloverWeekIfNeeded);

  useEffect(() => {
    rolloverWeekIfNeeded();
    track({ type: "league_opened" });
  }, [rolloverWeekIfNeeded]);

  const resetInDays = daysUntilWeekReset();
  const daysElapsed = 7 - resetInDays;
  const weekId = useAppStore((s) => s.user.weekId);
  const league = computeLeague(weeklyXp);

  const ranking = useMemo(() => {
    const bots = LEAGUE_BOTS.map((b) => ({
      name: b.name,
      xp: weeklyBotXp(b, weekId, daysElapsed),
      isUser: false,
    }));
    const players = [...bots, { name: name || "You", xp: weeklyXp, isUser: true }];
    return players.sort((a, b) => b.xp - a.xp);
  }, [weeklyXp, weekId, daysElapsed, name]);

  const myRank = ranking.findIndex((p) => p.isUser) + 1;

  return (
    <main className="space-y-6 px-5 pt-6 pb-10">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
          <Trophy className="h-7 w-7 text-primary" strokeWidth={1.6} />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{league}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn XP this week to climb the leaderboard.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            You're #{myRank}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-accent-foreground" />
            Resets in {resetInDays}d
          </span>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card">
        {ranking.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
              p.isUser ? "bg-accent/60" : ""
            }`}
          >
            <span className="w-5 text-sm font-semibold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-card-foreground">{p.name}</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{p.xp} XP</span>
          </div>
        ))}
      </div>
    </main>
  );
}
