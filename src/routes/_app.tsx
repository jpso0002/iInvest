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
    <div className="flex min-h-full w-full flex-col bg-background text-foreground">
      {!storageOk && (
        <div
          role="status"
          className="border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground"
        >
          Progress won't save on this device — storage is disabled.
        </div>
      )}
      <TopStatsBar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
