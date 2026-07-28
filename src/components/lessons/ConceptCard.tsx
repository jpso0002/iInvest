import type { ConceptStep } from "@/content/lessons";
import { LessonVisual } from "@/components/lessons/LessonVisual";

interface Props {
  step: ConceptStep;
  onContinue: () => void;
}

export function ConceptCard({ step, onContinue }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Concept
      </div>
      <h2 className="mt-1 text-2xl font-bold leading-tight">{step.title}</h2>
      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">
        {step.body}
      </p>
      <LessonVisual visual={step.visual} />
      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
