import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, PiggyBank, Rocket, Target, type LucideIcon } from "lucide-react";
import { PlacementQuiz } from "@/components/onboarding/PlacementQuiz";
import { useAppStore } from "@/store/useAppStore";
import { track } from "@/lib/analytics";
import type { Goal } from "@/store/schema";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Create your account · iInvest" }],
  }),
  component: SignupPage,
});

const GOALS: { key: Goal; icon: LucideIcon; title: string; body: string }[] = [
  {
    key: "learn",
    icon: PiggyBank,
    title: "Learn the basics",
    body: "I want to first understand how investing works.",
  },
  {
    key: "save",
    icon: Target,
    title: "Save regularly",
    body: "I want to build good habits and set money aside each month.",
  },
  {
    key: "invest",
    icon: Rocket,
    title: "Invest for the future",
    body: "I want to learn how to grow my money for the long term.",
  },
];

type Step = "identity" | "goal" | "quiz";

function SignupPage() {
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();
  const onboarded = useAppStore((s) => s.user.onboarded);
  const setUser = useAppStore((s) => s.setUser);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>("identity");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && onboarded) navigate({ to: "/lessons", replace: true });
  }, [hydrated, onboarded, navigate]);

  if (!hydrated || onboarded) {
    return (
      <main className="flex min-h-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }

  if (step === "quiz") {
    return (
      <PlacementQuiz
        onFinish={(unit) => {
          setUser({ profile: { name: name.trim(), email: email.trim(), goal } });
          completeOnboarding(unit);
          track({ type: "onboarding_completed", placementUnit: unit });
          navigate({ to: "/lessons", replace: true });
        }}
      />
    );
  }

  const identityValid = name.trim().length > 0 && email.trim().length > 3;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col bg-background px-5 pb-10 pt-8 text-foreground">
      <button
        type="button"
        onClick={() => (step === "goal" ? setStep("identity") : navigate({ to: "/" }))}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {step === "identity" && (
        <div className="flex flex-1 flex-col pt-6">
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Your info stays on this device — no real data is sent anywhere.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">First name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                className="rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-ring"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-ring"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!identityValid}
            onClick={() => setStep("goal")}
            className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === "goal" && (
        <div className="flex flex-1 flex-col pt-6">
          <h1 className="text-3xl font-bold tracking-tight">What's your main goal?</h1>
          <p className="mt-3 text-base text-muted-foreground">
            We'll tailor your journey based on your answer.
          </p>
          <div className="mt-8 flex flex-col gap-3" role="radiogroup">
            {GOALS.map((g) => {
              const Icon = g.icon;
              const selected = goal === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGoal(g.key)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all active:scale-[0.99] ${
                    selected ? "border-primary bg-accent" : "border-border bg-card hover:border-primary"
                  }`}
                >
                  <Icon className="mt-0.5 h-5 w-5 flex-none text-primary" strokeWidth={1.9} />
                  <span>
                    <span className="block text-base font-medium text-card-foreground">
                      {g.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{g.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={!goal}
            onClick={() => setStep("quiz")}
            className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}
    </main>
  );
}
