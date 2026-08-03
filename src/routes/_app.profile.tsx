import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Flame,
  Moon,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useThemeStore } from "@/store/useThemeStore";
import { STORAGE_KEY } from "@/store/schema";
import { pcMoney } from "@/lib/format";
import { lessons } from "@/content/lessons";
import { track } from "@/lib/analytics";
import { StatIcon, type StatTone } from "@/components/layout/StatIcon";
import { Switch } from "@/components/ui/switch";
import type { RealActions } from "@/store/schema";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile · iInvest" },
      {
        name: "description",
        content:
          "Track your streak, level, XP, practice cash, and real-world investing milestones on iInvest.",
      },
      { property: "og:title", content: "Profile · iInvest" },
      {
        property: "og:description",
        content: "Your streak, level, XP, and progress on iInvest.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Profile · iInvest" },
      {
        name: "twitter:description",
        content: "Your streak, level, XP, and progress on iInvest.",
      },
    ],
  }),
  component: ProfilePage,
});

type ActionKey = keyof RealActions;

const ACTIONS: { key: ActionKey; label: string; confirm: string }[] = [
  {
    key: "openedBrokerage",
    label: "I opened a brokerage app",
    confirm: "Nice — that's a real first step.",
  },
  {
    key: "firstRealTrade",
    label: "I made my first real trade",
    confirm: "Big milestone. Keep the position size sensible.",
  },
  {
    key: "startedAutoInvest",
    label: "I set up automatic investing",
    confirm: "Auto-investing is how habits compound.",
  },
];

function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const resetAll = useAppStore((s) => s.resetAll);
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const dark = useThemeStore((s) => s.dark);
  const toggleDark = useThemeStore((s) => s.toggleDark);

  const check = (key: ActionKey) => {
    if (user.realActions[key]) return;
    setUser({
      realActions: { ...user.realActions, [key]: new Date().toISOString() },
    });
    track({ type: "real_action_reported", kind: key });
  };

  const doReset = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* noop */
    }
    resetAll();
    navigate({ to: "/" });
  };

  return (
    <main className="px-5 pt-6 pb-10">
      {user.profile.name && (
        <p className="text-sm text-muted-foreground">Hi, {user.profile.name}</p>
      )}
      <header className="mt-1 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-4xl font-bold tabular-nums text-foreground">
            <StatIcon
              icon={Flame}
              tone="streak"
              className="h-9 w-9"
              iconClassName="h-5 w-5"
            />
            {user.streak.count}
          </div>
          <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            day streak
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Unit
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {user.placementUnit}
          </div>
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">
            {user.completedLessons.length} / {lessons.length} lessons
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Card icon={Star} tone="primary" label="XP" value={String(user.xp)} />
        <Card
          icon={Wallet}
          tone="practice"
          label="Practice cash"
          value={pcMoney(user.cash)}
        />
        <Card
          label="Joined"
          value={new Date(user.joinedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        />
        <Card
          label="Placement"
          value={user.onboarded ? `Unit ${user.placementUnit}` : "—"}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          Real-world actions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Self-report when you take one of these steps. This is a personal log —
          it isn't shared and can't be undone.
        </p>
        <ul className="mt-4 space-y-2">
          {ACTIONS.map((a) => {
            const done = user.realActions[a.key];
            return (
              <li
                key={a.key}
                className="rounded-2xl border border-border bg-card px-4 py-3"
              >
                <button
                  type="button"
                  disabled={Boolean(done)}
                  onClick={() => check(a.key)}
                  className="flex w-full items-start gap-3 text-left disabled:cursor-default"
                  aria-pressed={Boolean(done)}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border ${
                      done
                        ? "border-success bg-success text-success-foreground"
                        : "border-border bg-background"
                    }`}
                    aria-hidden
                  >
                    {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {a.label}
                    </span>
                    {done ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {a.confirm} ·{" "}
                        {new Date(done).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Tap to mark done
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Moon
              className="h-4 w-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            <span className="text-sm font-medium text-foreground">
              Dark mode
            </span>
          </div>
          <Switch
            checked={dark}
            onCheckedChange={(checked) => {
              toggleDark();
              track({ type: "dark_mode_toggled", dark: checked });
            }}
            aria-label="Toggle dark mode"
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          Reset progress
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wipes lessons, XP, streak, practice cash, and holdings on this device.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={doReset}
              className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground"
            >
              Yes, wipe everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="mt-3 w-full rounded-xl border border-destructive/40 bg-card px-4 py-3 text-sm font-semibold text-destructive"
          >
            Reset progress
          </button>
        )}
      </section>

      <footer className="mt-10 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        iInvest is for education and practice only. It does not provide
        financial advice and is not connected to any brokerage or real market.
        All currency shown as pc$ is simulated practice money.
      </footer>
    </main>
  );
}

function Card({
  icon,
  tone,
  label,
  value,
}: {
  icon?: LucideIcon;
  tone?: StatTone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon && tone && <StatIcon icon={icon} tone={tone} />}
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
