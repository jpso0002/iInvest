// The shell — renders whatever screen the current beat asks for, plus the
// guidance layer on top. There is no router here on purpose: with one route and
// a state machine, navigation is locked *by construction* rather than by guards
// that a back button could defeat.

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Wallet, Newspaper, Trophy, User } from "lucide-react";
import { useSliceStore } from "./useSliceStore";
import {
  CoachCard,
  Spotlight,
  Pointer,
  UnlockBurst,
} from "./components/Guidance";
import { LessonScreen } from "./screens/Lesson";
import { SimulatorScreen } from "./screens/Simulator";
import { AssetDetailScreen } from "./screens/AssetDetail";
import {
  WelcomeScreen,
  NewsScreen,
  MontageScreen,
  CompletionScreen,
} from "./screens/Misc";

export function SliceShell() {
  const beat = useSliceStore((s) => s.beat());
  const coachLine = useSliceStore((s) => s.coachLine());
  const nextCoach = useSliceStore((s) => s.nextCoach);
  const advance = useSliceStore((s) => s.advance);
  const restart = useSliceStore((s) => s.restart);
  const tickPrices = useSliceStore((s) => s.tickPrices);
  const celebrating = useSliceStore((s) => s.celebrating);
  const dismissCelebration = useSliceStore((s) => s.dismissCelebration);
  const buy = useSliceStore((s) => s.buy);
  const placeLimit = useSliceStore((s) => s.placeLimit);
  const prices = useSliceStore((s) => s.prices);

  // Local override so tapping an asset from the portfolio works even on beats
  // that don't themselves specify one.
  const [openAsset, setOpenAsset] = useState<string | null>(null);

  // The market never stops. "Users should never wait for content."
  useEffect(() => {
    const id = window.setInterval(tickPrices, 420);
    return () => window.clearInterval(id);
  }, [tickPrices]);

  // Timed beats (watch-the-two-assets, watch-the-order-fill).
  useEffect(() => {
    if (beat.advance !== "auto" || coachLine) return;
    const id = window.setTimeout(() => advance(), beat.autoMs ?? 5000);
    return () => window.clearTimeout(id);
  }, [beat, coachLine, advance]);

  // A new beat may target a different asset than the one being viewed.
  useEffect(() => {
    setOpenAsset(beat.assetId ?? null);
  }, [beat.id, beat.assetId]);

  const onBuy = useCallback(
    (id: string) => {
      buy(id, 200);
      if (beat.advance === "buy") advance();
    },
    [buy, beat, advance],
  );

  const onLimit = useCallback(
    (id: string) => {
      // Trigger just under the market so the scripted drift reaches it.
      placeLimit(id, Math.round((prices[id] ?? 41) - 1), 200);
      if (beat.advance === "limitOrder") advance();
    },
    [placeLimit, prices, beat, advance],
  );

  const coachIndex = useSliceStore((s) => s.coachIndex);
  const coachIsBlocking = Boolean(coachLine);
  // Last card in this beat's run — its button becomes the beat's CTA.
  const lastCoachLine = coachIndex >= (beat.coach?.length ?? 0) - 1;

  /** Advance one coach card, or the whole beat if that was the last one and
   *  the beat is waiting on a tap. Beats that wait on an action (buy, limit,
   *  timer) just fall through to their own screen once the coach is done. */
  const handleCoachNext = useCallback(() => {
    if (lastCoachLine && beat.advance === "tap") advance();
    else nextCoach();
  }, [lastCoachLine, beat.advance, advance, nextCoach]);

  const screen = (() => {
    switch (beat.screen) {
      case "welcome":
        return <WelcomeScreen onStart={advance} />;
      case "lesson":
        return <LessonScreen lessonId={beat.lessonId!} onDone={advance} />;
      case "simulator":
        return <SimulatorScreen onOpenAsset={(id) => setOpenAsset(id)} />;
      case "asset":
        return (
          <AssetDetailScreen
            assetId={openAsset ?? beat.assetId ?? "BRIGHT"}
            onBack={() => setOpenAsset(null)}
            onBuy={onBuy}
            onLimit={onLimit}
          />
        );
      case "news":
        return <NewsScreen newsId={beat.newsId!} />;
      case "montage":
        return <MontageScreen />;
      case "completion":
        return <CompletionScreen onRestart={restart} />;
    }
  })();

  // If the learner tapped into an asset from the portfolio, show that instead.
  const body =
    beat.screen === "simulator" && openAsset ? (
      <AssetDetailScreen
        assetId={openAsset}
        onBack={() => setOpenAsset(null)}
        onBuy={onBuy}
        onLimit={onLimit}
      />
    ) : (
      screen
    );

  const showChrome = beat.screen !== "welcome" && beat.screen !== "completion";

  return (
    <div className="relative flex min-h-full flex-col">
      {showChrome && <ProgressChrome />}

      <div className="flex-1">{body}</div>

      {showChrome && <LockedTabBar screen={beat.screen} />}

      {/* Guidance sits above everything, inside the phone frame. */}
      <Spotlight
        target={beat.spotlight}
        active={Boolean(beat.spotlight) && !celebrating}
      />
      {beat.spotlight && !coachIsBlocking && !celebrating && (
        <Pointer target={beat.spotlight} />
      )}

      {/* While the coach is talking, the coach is the only way forward. On
          spotlit beats the scrim already blocks; this covers the rest. */}
      {coachLine && !beat.spotlight && (
        <div className="absolute inset-0 z-40 bg-[rgba(16,16,24,0.35)]" />
      )}

      {coachLine && (
        <CoachCard
          line={coachLine}
          last={lastCoachLine}
          cta={beat.advance === "tap" ? beat.cta : undefined}
          onNext={handleCoachNext}
        />
      )}

      {/* Advance button for tap beats that have no coach copy left. Welcome and
          completion own their own CTA, so the shell must not add a second. */}
      {!coachLine &&
        beat.advance === "tap" &&
        beat.screen !== "welcome" &&
        beat.screen !== "completion" && (
          <div className="sticky bottom-0 z-20 px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={advance}
              className="w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
            >
              {beat.cta ?? "Continue"}
            </button>
          </div>
        )}

      {celebrating && beat.celebrate && (
        <UnlockBurst
          title={beat.celebrate.title}
          blurb={beat.celebrate.blurb}
          lessonN={beat.celebrate.lessonN}
          onDone={dismissCelebration}
        />
      )}
    </div>
  );
}

/** Lesson counter — keeps "you are progressing" visible at all times. */
function ProgressChrome() {
  const done = useSliceStore((s) => s.lessonsDone);
  const unlocks = useSliceStore((s) => s.unlocks.size);
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-5 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={
              "h-1.5 rounded-full transition-all duration-500 " +
              (i < done ? "w-5 bg-success" : "w-2.5 bg-progress-track")
            }
          />
        ))}
      </div>
      <span className="text-[11px] font-semibold tabular text-muted-foreground">
        {unlocks} {unlocks === 1 ? "ability" : "abilities"}
      </span>
    </header>
  );
}

/**
 * A tab bar that is deliberately inert.
 *
 * Showing it — rather than hiding it — tells a first-time viewer that a whole
 * app exists around this flow, while the padlocks make it obvious the demo is
 * driving. Tapping does nothing by design.
 */
function LockedTabBar({ screen }: { screen: string }) {
  const tabs = [
    { icon: GraduationCap, key: "lesson", label: "Learn" },
    { icon: Wallet, key: "simulator", label: "Invest" },
    { icon: Newspaper, key: "news", label: "News" },
    { icon: Trophy, key: "league", label: "League" },
    { icon: User, key: "profile", label: "You" },
  ];
  const activeKey =
    screen === "asset" ? "simulator" : screen === "montage" ? "lesson" : screen;

  return (
    <nav
      aria-hidden="true"
      className="sticky bottom-0 z-10 flex border-t border-border bg-card"
    >
      {tabs.map((t) => {
        const active = t.key === activeKey;
        const locked = t.key === "league" || t.key === "profile";
        return (
          <div
            key={t.key}
            className="flex flex-1 flex-col items-center gap-0.5 py-2"
          >
            <t.icon
              className={
                "h-5 w-5 " +
                (active
                  ? "text-primary"
                  : locked
                    ? "text-[var(--neutral-disabled)]"
                    : "text-muted-foreground")
              }
              strokeWidth={active ? 2.6 : 2}
            />
            <span
              className={
                "text-[9px] font-medium " +
                (active ? "text-primary" : "text-muted-foreground")
              }
            >
              {locked ? "🔒" : t.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
