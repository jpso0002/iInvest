import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopStatsBar } from "@/components/layout/TopStatsBar";
import { useAppStore } from "@/store/useAppStore";
import { isStorageAvailable } from "@/lib/storage-status";
import { markSessionStartedIfNewDay } from "@/lib/analytics";
import { useOrderFillToasts } from "@/hooks/use-order-fill-toasts";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [hydrated, setHydrated] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const onboarded = useAppStore((s) => s.user.onboarded);
  useOrderFillToasts();

  useEffect(() => {
    setHydrated(true);
    setStorageOk(isStorageAvailable());
    markSessionStartedIfNewDay();
  }, []);

  if (!hydrated) {
    return (
      <main className="flex min-h-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }

  if (!onboarded) {
    return <Navigate to="/" replace />;
  }

  return (
    // `h-full` as well as `min-h-full`: without a definite height here the
    // chain down to each screen's <main> is height-indeterminate, so any
    // `min-h-full` on a screen silently resolves to nothing and short screens
    // can't push a footer CTA to the bottom of the frame.
    <div className="flex h-full min-h-full w-full flex-col bg-background text-foreground">
      {!storageOk && (
        <div
          role="status"
          className="border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground"
        >
          Progress won't save on this device — storage is disabled.
        </div>
      )}
      <TopStatsBar />
      {/* `min-h-0` lets this shrink below its content so the screen inside
          owns its own scrolling instead of stretching the whole shell. */}
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
