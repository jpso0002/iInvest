import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PracticeMoneyBadge } from "@/components/simulate/PracticeMoneyBadge";
import { PortfolioSummary } from "@/components/simulate/PortfolioSummary";
import { AssetRow, LockedAssetTeaser } from "@/components/simulate/AssetRow";
import { assets } from "@/content/assets";
import { useAppStore } from "@/store/useAppStore";
import { unitForCompleted } from "@/lib/xp";
import { unlockedAssets } from "@/lib/guards";
import { track } from "@/lib/analytics";

const SESSION_MODAL_KEY = "iinvest.simulate.introSeen";

export const Route = createFileRoute("/_app/simulate/")({
  head: () => ({
    meta: [
      { title: "Simulate · iInvest" },
      {
        name: "description",
        content:
          "Practice-money trading simulator. Assets and order types unlock as you complete lessons.",
      },
      { property: "og:title", content: "Simulate · iInvest" },
      {
        property: "og:description",
        content:
          "Practice-money trading simulator. Everything is pretend — no real trades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Simulate · iInvest" },
      {
        name: "twitter:description",
        content:
          "Practice-money trading simulator. Everything is pretend — no real trades.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SimulateScreen,
});

function SimulateScreen() {
  const initMarket = useAppStore((s) => s.initMarket);
  const tick = useAppStore((s) => s.tick);
  const unit = useAppStore((s) => unitForCompleted(s.user.completedLessons));
  const holdings = useAppStore((s) => s.portfolio.holdings);
  const tradeCount = useAppStore((s) => s.portfolio.history.length);

  const unlocked = useMemo(() => unlockedAssets(unit), [unit]);
  // Assets unlock at units 1, 3 and 5 — surface whichever tier is still ahead.
  const nextLockedTier: 3 | 5 | null = unit < 3 ? 3 : unit < 5 ? 5 : null;

  const [showIntro, setShowIntro] = useState(false);

  // First-open-per-session modal.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const seen = window.sessionStorage.getItem(SESSION_MODAL_KEY);
      if (!seen) setShowIntro(true);
    } catch {
      setShowIntro(true);
    }
  }, []);

  const dismissIntro = () => {
    setShowIntro(false);
    try {
      window.sessionStorage.setItem(SESSION_MODAL_KEY, "1");
    } catch {
      /* noop */
    }
  };

  // Initialise market prices once + tick every 3s while mounted.
  useEffect(() => {
    initMarket();
    // Prime the session series so the sparkline has a starting point.
    tick();
    track({ type: "simulate_opened" });
    const id = window.setInterval(() => {
      useAppStore.getState().tick();
    }, 3000);
    return () => window.clearInterval(id);
  }, [initMarket, tick]);

  const held = unlocked.filter((a) => (holdings[a.id]?.units ?? 0) > 0);
  const available = unlocked.filter((a) => (holdings[a.id]?.units ?? 0) <= 0);

  return (
    <main className="space-y-6 px-5 pt-6">
      <header className="space-y-2">
        <PracticeMoneyBadge />
        <h1 className="text-3xl font-bold tracking-tight">Simulate</h1>
        <p className="text-sm text-muted-foreground">
          Practice buying and selling. Prices are made-up and update every few
          seconds.
        </p>
      </header>

      <PortfolioSummary />

      <Link
        to="/simulate/history"
        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-secondary/60"
      >
        <span className="flex items-center gap-2 font-medium">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Transaction history
        </span>
        <span className="text-xs text-muted-foreground tabular">
          {tradeCount} trade{tradeCount === 1 ? "" : "s"}
        </span>
      </Link>

      {held.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your holdings
          </h2>
          <div className="space-y-2">
            {held.map((a) => (
              <AssetRow key={a.id} asset={a} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Available to trade
        </h2>
        <div className="space-y-2">
          {available.map((a) => (
            <AssetRow key={a.id} asset={a} />
          ))}
          {nextLockedTier && <LockedAssetTeaser nextUnit={nextLockedTier} />}
        </div>
      </section>

      <Dialog open={showIntro} onOpenChange={(o) => !o && dismissIntro()}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>This is practice money</DialogTitle>
            <DialogDescription>
              Nothing here connects to real markets or a real broker. Every
              price is made up so you can safely try things out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={dismissIntro} className="w-full rounded-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
