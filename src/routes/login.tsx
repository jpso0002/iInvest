import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LogIn } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Log in · iInvest" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <main className="flex min-h-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col bg-background px-5 pb-10 pt-8 text-foreground">
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex flex-1 flex-col justify-between pt-6">
        <div className="flex flex-col items-center pt-10 text-center">
          <LogIn className="h-10 w-10 text-primary" strokeWidth={1.75} />
          {user.onboarded ? (
            <>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                {user.profile.name
                  ? `Welcome back, ${user.profile.name}`
                  : "Welcome back"}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                Your progress is saved on this device. Pick up right where you
                left off.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                No account on this device
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                iInvest doesn't have real accounts yet — progress lives on the
                device you signed up on. Create one to get started here.
              </p>
            </>
          )}
        </div>

        {user.onboarded ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/lessons" })}
            className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate({ to: "/signup" })}
            className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            Create account
          </button>
        )}
      </div>
    </main>
  );
}
