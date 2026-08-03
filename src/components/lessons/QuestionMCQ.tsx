import { useState } from "react";
import type { McqStep } from "@/content/lessons";

interface Props {
  step: McqStep;
  onContinue: () => void;
}

export function QuestionMCQ({ step, onContinue }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const isCorrect = selected !== null && selected === step.correctIndex;

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Question
      </div>
      <h2 className="mt-1 text-xl font-semibold leading-snug">{step.prompt}</h2>

      <div className="mt-6 flex flex-col gap-3" role="radiogroup">
        {step.options.map((opt, i) => {
          const isSel = selected === i;
          const showCorrect = checked && i === step.correctIndex;
          const showWrong = checked && isSel && i !== step.correctIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSel}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={[
                "w-full rounded-2xl border-2 px-4 py-4 text-left text-base font-medium transition-all",
                !checked && isSel && "border-primary bg-primary/5",
                !checked && !isSel && "border-border bg-card hover:bg-accent",
                showCorrect &&
                  "border-success bg-success-surface text-success-text",
                showWrong &&
                  "border-destructive bg-destructive-surface text-destructive-text",
                checked && "cursor-default",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {checked && (
        <div
          className={[
            "mt-4 rounded-2xl px-4 py-3 text-sm",
            isCorrect
              ? "bg-success-surface text-success-text"
              : "bg-destructive-surface text-destructive-text",
          ].join(" ")}
          role="status"
        >
          <div className="font-semibold">
            {isCorrect ? "Nice — that's it." : "Not quite."}
          </div>
          {step.explanation && (
            <div className="mt-1 text-muted-foreground">{step.explanation}</div>
          )}
        </div>
      )}

      <div className="mt-auto pt-6">
        {!checked ? (
          <button
            type="button"
            disabled={selected === null}
            onClick={() => setChecked(true)}
            className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
