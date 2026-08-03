import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { applyDemoState, wantsDemo } from "@/lib/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iInvest — Learn to invest, one bite at a time" },
      {
        name: "description",
        content:
          "Bite-sized investing lessons paired with a practice-money trading simulator. No jargon, no real trades — just confidence you can actually build.",
      },
      {
        property: "og:title",
        content: "iInvest — Learn to invest, one bite at a time",
      },
      {
        property: "og:description",
        content:
          "Duolingo-style lessons plus a safe trading simulator. Learn investing without the intimidation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "iInvest — Learn to invest, one bite at a time",
      },
      {
        name: "twitter:description",
        content:
          "Duolingo-style lessons plus a safe trading simulator. Learn investing without the intimidation.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();
  const onboarded = useAppStore((s) => s.user.onboarded);

  useEffect(() => setHydrated(true), []);

  // `?demo` re-seeds a pitch-ready account and reloads. Checked before the
  // onboarded redirect below so the link works whatever state the phone is
  // already in — relaunching is how you reset between demos.
  useEffect(() => {
    if (hydrated && wantsDemo()) applyDemoState();
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && onboarded && !wantsDemo()) {
      navigate({ to: "/lessons", replace: true });
    }
  }, [hydrated, onboarded, navigate]);

  if (!hydrated || onboarded) {
    return (
      <main className="flex min-h-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-between bg-background px-5 pb-10 pt-8 text-foreground">
      <div>
        <TrendingUp className="h-10 w-10 text-primary" strokeWidth={1.75} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Learn to invest, one bite at a time.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Short lessons, then practice with pretend money. No jargon. No real
          trades.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/signup" })}
          className="w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="w-full rounded-2xl border border-input bg-background py-4 text-base font-semibold text-foreground transition-colors hover:bg-accent"
        >
          I already have an account
        </button>
      </div>
    </main>
  );
}
