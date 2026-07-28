import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { pcMoney } from "@/lib/format";
import { LevelUpCelebration } from "@/components/lessons/LevelUpCelebration";
// @ts-ignore js module
import Mascot from "@/components/Mascot";
import type { CompleteLessonResult } from "@/store/useAppStore";

const TIPS = [
  "Consistency beats intensity — a little each day adds up.",
  "You don't need to understand everything at once. One concept at a time.",
  "The goal isn't to predict the market. It's to keep showing up.",
  "Small, steady steps compound — in learning and in investing.",
];

interface Props {
  lessonTitle: string;
  result: CompleteLessonResult;
  simulateUnlocked: boolean;
  showTryItCard: boolean;
}

export function CompletionScreen({
  lessonTitle,
  result,
  simulateUnlocked,
  showTryItCard,
}: Props) {
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="pt-8 text-center">
        <div className="flex justify-center">
          <CheckCircle2
            className="h-14 w-14 animate-check-pulse text-success"
            strokeWidth={1.75}
          />
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight">Lesson complete!</h2>
        <p className="mt-2 text-sm text-muted-foreground">{lessonTitle}</p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <RewardCard label="XP earned" value={`+${result.xpGained}`} />
          <RewardCard label="Practice cash" value={`+${pcMoney(result.cashGained)}`} />
        </div>

        {!result.unitUp && (
          <div className="mt-5 text-left">
            <Mascot
              tip={TIPS[lessonTitle.length % TIPS.length]}
              name="Coach"
              variant="inline"
            />
          </div>
        )}

        {result.unitUp && (
          <>
            <LevelUpCelebration newUnit={result.newUnit} />
            <div className="mt-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
              Bonus for leveling up:{" "}
              <span className="font-semibold tabular-nums">+{pcMoney(result.bonus)}</span>
            </div>
          </>
        )}

        {showTryItCard && simulateUnlocked && (
          <Link
            to="/simulate"
            className="mt-4 block rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-left"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              New
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              Try what you learned →
            </div>
            <div className="text-xs text-muted-foreground">
              Practice trading is now unlocked.
            </div>
          </Link>
        )}
      </div>

      <div className="pt-6">
        <Link
          to="/lessons"
          className="block w-full rounded-2xl bg-primary py-4 text-center text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          Back to lessons
        </Link>
      </div>
    </div>
  );
}

function RewardCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 text-left">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
