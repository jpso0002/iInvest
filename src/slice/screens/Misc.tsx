// Welcome, News, Montage and Completion — the connective screens that turn
// three separate features into one continuous loop.

import { Sparkles, TrendingUp, TrendingDown, Check, Lock } from "lucide-react";
import mascot from "@/assets/mascot-coach.png";
import { pcMoney } from "@/lib/format";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import { SLICE_NEWS, MONTAGE_LESSONS, SLICE_ASSETS } from "../content";
import { useSliceStore, usePortfolioValue } from "../useSliceStore";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// ---------------------------------------------------------------- welcome ---

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-7 text-center">
      <img src={mascot} alt="" width={120} height={120} className="h-28 w-28" />
      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
        I'll teach you to invest.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Eight short lessons. Each one hands you a new ability in a live market —
        with practice money, so nothing can go wrong.
      </p>
      <PracticeMoneyBadge className="mt-5" />
      <button
        type="button"
        onClick={onStart}
        className="mt-8 w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Start
      </button>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Takes about 8 minutes
      </p>
    </div>
  );
}

// ------------------------------------------------------------------- news ---

/** News is never a separate tab here — it arrives *because* of a lesson, and
 *  the price reacts while you're reading it. */
export function NewsScreen({ newsId }: { newsId: string }) {
  const n = SLICE_NEWS[newsId];
  const price = useSliceStore((s) => s.prices[n.assetId] ?? 0);
  const a = SLICE_ASSETS[n.assetId];
  const up = n.move >= 0;

  return (
    <div className="space-y-4 px-5 pb-8 pt-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-accent-foreground">
          Market news
        </span>
        <span>{n.source}</span>
        <span>· {n.time}</span>
      </div>

      <h1 className="text-xl font-bold leading-snug tracking-tight">
        {n.headline}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{n.body}</p>

      {/* The live reaction, right under the story. This adjacency is the whole
          reason news exists in the demo. */}
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {a.short} right now
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-3xl font-bold tabular tracking-tight">
            {pcMoney(price, { cents: true })}
          </span>
          {n.move !== 0 && (
            <span
              className={
                "flex items-center gap-1 text-sm font-bold tabular " +
                (up ? "text-market-up-text" : "text-market-down-text")
              }
            >
              {up ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {up ? "+" : ""}
              {n.move}%
            </span>
          )}
        </div>
        <p className="mt-3 border-t border-border pt-3 text-sm font-medium">
          {n.prompt}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- montage ---

/** Lessons 4–7 without playing them. Communicates "you kept going" so the
 *  demo can reach the fully-unlocked state inside 8 minutes. */
export function MontageScreen() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="space-y-4 px-5 pb-8 pt-6">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-purple)]">
          Four lessons later
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          You kept going.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Here's what those lessons handed you.
        </p>
      </div>

      <div className="space-y-2">
        {MONTAGE_LESSONS.map((l, i) => (
          <div
            key={l.n}
            className={
              "rounded-2xl border border-border bg-card p-4 " +
              (reduced ? "" : "animate-[coach-in_400ms_ease-out_both]")
            }
            style={reduced ? undefined : { animationDelay: `${i * 260}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-success text-success-foreground">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Lesson {l.n}
                </p>
                <p className="truncate text-sm font-semibold">{l.title}</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-reward-surface p-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-reward-foreground" />
              <div>
                <p className="text-xs font-semibold">{l.unlock}</p>
                <p className="text-[11px] text-muted-foreground">
                  {l.takeaway}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- completion ---

export function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  const total = usePortfolioValue();
  const positions = useSliceStore((s) => s.positions);
  const owned = Object.keys(positions).length;

  const abilities = [
    "Buy a position",
    "Live price chart",
    "Risk comparison",
    "Index fund + pie",
    "1M / 1Y / 5Y",
    "52-week range",
    "Candlesticks",
    "Limit orders",
  ];

  return (
    <div className="space-y-5 px-5 pb-10 pt-8 text-center">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success animate-check-pulse">
        <Check
          className="h-10 w-10 text-success-foreground"
          strokeWidth={2.6}
        />
      </span>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Unit 1 complete</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You started able to see a price. That's all.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Lessons" value="8" />
        <Metric label="Companies owned" value={String(owned)} />
        <Metric label="Portfolio" value={pcMoney(total, { whole: true })} />
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 text-left">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Abilities you earned
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {abilities.map((a) => (
            <div key={a} className="flex items-center gap-1.5">
              <Check
                className="h-3.5 w-3.5 flex-none text-market-up-text"
                strokeWidth={3}
              />
              <span className="truncate text-xs">{a}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-accent p-4 text-left">
        <p className="text-sm font-semibold text-accent-foreground">
          Every one of those was locked an hour ago.
        </p>
        <p className="mt-1 text-xs text-accent-foreground/80">
          That's the whole idea: the app grows as you do. Unit 2 has six more.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        Practice money throughout. Nothing here was real.
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Run it again
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-lg font-bold tabular">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
