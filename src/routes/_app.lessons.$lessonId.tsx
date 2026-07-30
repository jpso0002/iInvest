import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, SearchX, TriangleAlert, X } from "lucide-react";
import { lessonById, isLessonUnlocked } from "@/content/lessons";
import { ConceptCard } from "@/components/lessons/ConceptCard";
import { QuestionMCQ } from "@/components/lessons/QuestionMCQ";
import { CompletionScreen } from "@/components/lessons/CompletionScreen";
import { useAppStore } from "@/store/useAppStore";
import { simulateTabUnlocked } from "@/lib/guards";
import { track } from "@/lib/analytics";
import type { CompleteLessonResult } from "@/store/useAppStore";

export const Route = createFileRoute("/_app/lessons/$lessonId")({
  head: ({ params }) => {
    const l = lessonById(params.lessonId);
    const title = l ? `${l.title} · iInvest` : "Lesson · iInvest";
    const desc = l ? l.summary : "An iInvest lesson.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => {
    const lesson = lessonById(params.lessonId);
    if (!lesson) throw notFound();
    return { lesson };
  },
  notFoundComponent: LessonNotFound,
  errorComponent: LessonError,
  component: LessonPlayer,
});

function LessonNotFound() {
  const params = Route.useParams();
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" strokeWidth={1.75} />
      <h1 className="mt-3 text-xl font-semibold">Lesson not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't find lesson{" "}
        <span className="font-mono">{params.lessonId}</span>.
      </p>
    </main>
  );
}

function LessonError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 text-center">
      <TriangleAlert
        className="h-10 w-10 text-destructive"
        strokeWidth={1.75}
      />
      <h1 className="mt-3 text-xl font-semibold">Something broke</h1>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}

function LessonPlayer() {
  const { lesson } = Route.useLoaderData();
  const navigate = useNavigate();
  const completedLessons = useAppStore((s) => s.user.completedLessons);
  const lessonProgress = useAppStore((s) => s.user.lessonProgress);
  const setLessonProgress = useAppStore((s) => s.setLessonProgress);
  const completeLesson = useAppStore((s) => s.completeLesson);

  const unlocked = useMemo(
    () => isLessonUnlocked(lesson, completedLessons),
    [lesson, completedLessons],
  );

  const [phase, setPhase] = useState<"intro" | "step" | "complete">("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<CompleteLessonResult | null>(null);
  const [wasCompletedBefore] = useState(() =>
    completedLessons.includes(lesson.id),
  );

  // Resume from persisted progress on mount.
  useEffect(() => {
    if (
      lessonProgress &&
      lessonProgress.lessonId === lesson.id &&
      lessonProgress.stepIndex > 0 &&
      lessonProgress.stepIndex < lesson.steps.length
    ) {
      setPhase("step");
      setStepIndex(lessonProgress.stepIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!unlocked) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center px-5 text-center">
        <Lock className="h-10 w-10 text-muted-foreground" strokeWidth={1.75} />
        <h1 className="mt-3 text-xl font-semibold">Locked</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Finish the earlier lessons to unlock this one.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/lessons" })}
          className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to lessons
        </button>
      </main>
    );
  }

  const advance = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= lesson.steps.length) {
      const r = completeLesson(lesson.id);
      setResult(r);
      setPhase("complete");
      if (r) {
        track({
          type: "lesson_completed",
          lessonId: lesson.id,
          unit: lesson.unit,
          isUnitUp: r.unitUp,
        });
      }
      return;
    }
    setStepIndex(nextIndex);
    setLessonProgress({ lessonId: lesson.id, stepIndex: nextIndex });
  };

  const startFromIntro = () => {
    setPhase("step");
    setLessonProgress({ lessonId: lesson.id, stepIndex: 0 });
    track({ type: "lesson_started", lessonId: lesson.id });
  };

  const progressPct =
    phase === "complete"
      ? 100
      : phase === "intro"
        ? 0
        : ((stepIndex + 1) / lesson.steps.length) * 100;

  return (
    // `min-h-full`, not a viewport calc: `.phone-frame` is a fixed 844px on
    // desktop, so sizing against `100dvh` forced this box ~92px taller than
    // the frame and pushed the CTA out of view behind dead space.
    <main className="flex min-h-full flex-col px-5 pb-6 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/lessons" })}
          aria-label="Exit lesson"
          className="text-muted-foreground"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {phase === "intro" && (
        <div className="flex flex-1 flex-col">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {lesson.id} · Unit {lesson.unit}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {lesson.summary}
          </p>
          <div className="mt-6 rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">
            Reward on completion:{" "}
            <span className="font-semibold">+{lesson.reward.xp} XP</span> and{" "}
            <span className="font-semibold">
              pc${lesson.reward.cash} practice cash
            </span>
            .
          </div>
          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={startFromIntro}
              className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
            >
              Start lesson
            </button>
          </div>
        </div>
      )}

      {phase === "step" &&
        (() => {
          const step = lesson.steps[stepIndex];
          if (step.kind === "concept")
            return (
              <ConceptCard key={stepIndex} step={step} onContinue={advance} />
            );
          return (
            <QuestionMCQ key={stepIndex} step={step} onContinue={advance} />
          );
        })()}

      {phase === "complete" && result && (
        <CompletionScreen
          lessonTitle={lesson.title}
          result={result}
          simulateUnlocked={simulateTabUnlocked({
            completedLessons: [...completedLessons, lesson.id],
          })}
          showTryItCard={!wasCompletedBefore && lesson.id === "L1.1"}
        />
      )}
    </main>
  );
}
