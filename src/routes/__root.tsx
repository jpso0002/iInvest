import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import PhoneFrame from "../components/PhoneFrame";
// @ts-ignore js module
import Splash from "../components/Splash";
import { TabBar } from "../components/layout/TabBar";
import { useThemeStore } from "../store/useThemeStore";
import { Toaster } from "../components/ui/sonner";

const TAB_ROUTES = ["/lessons", "/simulate", "/news", "/league", "/profile"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "iInvest — Learn to invest, one bite at a time" },
        {
          name: "description",
          content:
            "Bite-sized investing lessons paired with a practice-money trading simulator.",
        },
        { property: "og:site_name", content: "iInvest" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Reads the current route and shows the tab bar only on tab-shell routes.
// Kept as its own component so route changes re-render only this subtree,
// never the splash-owning RootComponent (a re-render there would restart the
// splash entrance animation).
function RouteTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return TAB_ROUTES.includes(pathname) ? <TabBar /> : null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // This template's Lovable dev tooling stubs component modules under
  // src/components differently on the server than on the client — a
  // hydration mismatch. Rendering the phone shell only after the client
  // mounts makes the server and first client render emit identical (empty)
  // markup, so there is nothing to mismatch.
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const dark = useThemeStore((s) => s.dark);

  useEffect(() => {
    setMounted(true);
    if (!sessionStorage.getItem("iinvest-splash-seen")) {
      setShowSplash(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function handleSplashDone() {
    try {
      sessionStorage.setItem("iinvest-splash-seen", "1");
    } catch {}
    setShowSplash(false);
  }

  return (
    <QueryClientProvider client={queryClient}>
      {mounted && (
        <PhoneFrame
          noPadding
          bottomBar={showSplash ? undefined : <RouteTabBar />}
        >
          {showSplash && <Splash onDone={handleSplashDone} />}
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          {/* Without this every toast.*() call in the app is a no-op — trade
              confirmations, order rejections and fill alerts all vanish. */}
          <Toaster position="top-center" richColors closeButton />
        </PhoneFrame>
      )}
    </QueryClientProvider>
  );
}
