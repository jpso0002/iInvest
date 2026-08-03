// Lesson runner for the slice.
//
// Deliberately its own component rather than the production lesson route: the
// demo needs answer explanations shown inline, a fixed 2-concept/2-quiz shape,
// and no exit affordance. Same visual language, tighter control.

import { useState } from "react";
import { Check, X } from "lucide-react";
import { SLICE_LESSONS, type SliceLesson } from "../content";
import { LessonVisual } from "../components/LessonVisual";

export function LessonScreen({
  lessonId,
  onDone,
}: {
  lessonId: string;
  onDone: () => void;
}) {
  const lesson: SliceLesson = SLICE_LESSONS[lessonId];
  const [stepIndex, setStepIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const step = lesson.steps[stepIndex];
  const isLast = stepIndex === lesson.steps.length - 1;
  const progress =
    ((stepIndex + (picked !== null ? 1 : 0)) / lesson.steps.length) * 100;

  const next = () => {
    setPicked(null);
    if (isLast) onDone();
    else setStepIndex((i) => i + 1);
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-4">
      {/* Progress — no exit button anywhere. The demo doesn't let you bail. */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-purple)]">
          Lesson {lesson.n}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-progress-track">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{lesson.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{lesson.objective}</p>

      <div className="mt-5 flex-1">
        {step.kind === "concept" ? (
          <div className="animate-[coach-in_240ms_ease-out]">
            <h2 className="text-lg font-bold">{step.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {step.body}
            </p>
            {step.visual && (
              <div className="mt-5">
                <LessonVisual kind={step.visual} />
              </div>
            )}
          </div>
        ) : (
          <div className="animate-[coach-in_240ms_ease-out]">
            <p className="text-[15px] font-semibold leading-snug">
              {step.prompt}
            </p>
            <div className="mt-4 space-y-2">
              {step.options.map((opt, i) => {
                const isCorrect = i === step.correctIndex;
                const chosen = picked === i;
                const reveal = picked !== null;
                return (
                  <button
                    key={opt.text}
                    type="button"
                    disabled={reveal}
                    onClick={() => setPicked(i)}
                    className={
                      "w-full rounded-2xl border-2 p-3 text-left text-sm transition-colors " +
                      (!reveal
                        ? "border-border bg-card hover:bg-secondary"
                        : isCorrect
                          ? "border-success bg-success-surface text-success-text"
                          : chosen
                            ? "border-destructive bg-destructive-surface text-destructive-text"
                            : "border-border bg-card opacity-50")
                    }
                  >
                    <span className="flex items-start gap-2">
                      {reveal && (isCorrect || chosen) && (
                        <span className="mt-0.5 flex-none">
                          {isCorrect ? (
                            <Check className="h-4 w-4" strokeWidth={3} />
                          ) : (
                            <X className="h-4 w-4" strokeWidth={3} />
                          )}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block font-medium">{opt.text}</span>
                        {/* Explanations on every option, not just the chosen
                            one — the curriculum writes a reason for each. */}
                        {reveal && (isCorrect || chosen) && (
                          <span className="mt-1 block text-xs opacity-90">
                            {opt.why}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={next}
        disabled={step.kind === "quiz" && picked === null}
        className="mt-6 w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-40"
      >
        {step.kind === "quiz" && picked === null
          ? "Pick an answer"
          : isLast
            ? "Finish lesson"
            : "Continue"}
      </button>
    </div>
  );
}
