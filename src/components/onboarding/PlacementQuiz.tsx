import { useMemo, useState } from "react";
import {
  Flower2,
  Sprout,
  TreeDeciduous,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  placementQuestions,
  maxPlacementScore,
  scoreToUnit,
} from "@/content/placementQuiz";
import { unitById } from "@/content/lessons";
import type { UnitNumber } from "@/store/schema";

const RESULT_ICON: Record<UnitNumber, LucideIcon> = {
  1: Sprout,
  2: Sprout,
  3: Flower2,
  4: Flower2,
  5: TreeDeciduous,
  6: TreeDeciduous,
};

type Phase =
  | { kind: "splash" }
  | { kind: "quiz"; index: number; score: number }
  | { kind: "result"; unit: UnitNumber };

interface Props {
  onFinish: (unit: UnitNumber) => void;
}

export function PlacementQuiz({ onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "splash" });
  const total = placementQuestions.length;

  const progress = useMemo(() => {
    if (phase.kind === "quiz") return phase.index / total;
    if (phase.kind === "result") return 1;
    return 0;
  }, [phase, total]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col bg-background px-5 pb-10 pt-8 text-foreground">
      {phase.kind !== "splash" && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {phase.kind === "splash" && (
        <div className="flex flex-1 flex-col justify-between pt-6">
          <div>
            <TrendingUp className="h-10 w-10 text-primary" strokeWidth={1.75} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Learn to invest, one bite at a time.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Short lessons, then practice with pretend money. No jargon. No
              real trades.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setPhase({ kind: "quiz", index: 0, score: 0 })}
              className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
            >
              Take a quick placement quiz
            </button>
            <button
              type="button"
              onClick={() => setPhase({ kind: "result", unit: 1 })}
              className="w-full rounded-2xl border border-input bg-background py-4 text-base font-semibold text-foreground transition-colors hover:bg-accent"
            >
              I'm brand new — start at Lesson 1
            </button>
          </div>
        </div>
      )}

      {phase.kind === "quiz" && (
        <div className="flex flex-1 flex-col pt-8">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Question {phase.index + 1} of {total}
          </div>
          <h2 className="mt-2 text-2xl font-semibold leading-snug">
            {placementQuestions[phase.index].prompt}
          </h2>
          <div className="mt-6 flex flex-col gap-3" role="radiogroup">
            {placementQuestions[phase.index].options.map((opt, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={false}
                onClick={() => {
                  const nextScore = phase.score + opt.score;
                  const nextIndex = phase.index + 1;
                  if (nextIndex >= total) {
                    setPhase({
                      kind: "result",
                      unit: scoreToUnit(nextScore, maxPlacementScore),
                    });
                  } else {
                    setPhase({
                      kind: "quiz",
                      index: nextIndex,
                      score: nextScore,
                    });
                  }
                }}
                className="w-full rounded-2xl border-2 border-border bg-card px-4 py-4 text-left text-base font-medium text-card-foreground transition-all hover:border-primary hover:bg-accent active:scale-[0.99]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase.kind === "result" && (
        <div className="flex flex-1 flex-col justify-between pt-10">
          <div className="text-center">
            {(() => {
              const ResultIcon = RESULT_ICON[phase.unit];
              return (
                <div className="flex justify-center">
                  <ResultIcon
                    className="h-14 w-14 text-primary"
                    strokeWidth={1.5}
                  />
                </div>
              );
            })()}
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              You'll start at Unit {phase.unit}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {unitById(phase.unit)?.title} — {unitById(phase.unit)?.subtitle}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Earlier units stay open if you want to work through them too.
            </p>
            <p className="mt-6 rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">
              You'll get <span className="font-semibold">pc$1,000</span> in
              practice money to start. It's pretend — no real trades, ever.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFinish(phase.unit)}
            className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            Let's go
          </button>
        </div>
      )}
    </main>
  );
}
