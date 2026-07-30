import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { NEWS_ARTICLES, type NewsArticle } from "@/content/news";
import { MarketTicker } from "@/components/MarketTicker";
import { useAppStore } from "@/store/useAppStore";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/_app/news/")({
  head: () => ({
    meta: [
      { title: "News · iInvest" },
      { name: "description", content: "Simulated quotes and headlines." },
    ],
  }),
  component: NewsIndex,
});

function formatMove(move: number): string {
  if (move === 0) return "0.00%";
  const sign = move > 0 ? "+" : "";
  return `${sign}${move.toFixed(2)}%`;
}

function MoveTag({ move }: { move: number }) {
  const isUp = move > 0;
  const isDown = move < 0;
  return (
    <span
      className={
        "flex items-center gap-0.5 text-xs font-medium tabular " +
        (isUp
          ? "text-primary"
          : isDown
            ? "text-destructive"
            : "text-muted-foreground")
      }
    >
      {isUp && <ArrowUpRight className="h-3.5 w-3.5" />}
      {isDown && <ArrowDownRight className="h-3.5 w-3.5" />}
      {formatMove(move)}
    </span>
  );
}

function NewsCard({ item }: { item: NewsArticle }) {
  return (
    <Link
      to="/news/$articleId"
      params={{ articleId: String(item.id) }}
      className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/60"
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{item.source}</span>
        <span aria-hidden="true">·</span>
        <span>{item.time}</span>
      </div>
      <h3 className="mt-1 text-base font-semibold text-card-foreground">
        {item.title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {item.tag}
        </span>
        <MoveTag move={item.move} />
      </div>
    </Link>
  );
}

function NewsIndex() {
  const initMarket = useAppStore((s) => s.initMarket);
  const tick = useAppStore((s) => s.tick);
  useEffect(() => {
    initMarket();
    tick();
    track({ type: "news_opened" });
    const id = window.setInterval(() => {
      useAppStore.getState().tick();
    }, 3000);
    return () => window.clearInterval(id);
  }, [initMarket, tick]);

  const sorted = useMemo(
    () => [...NEWS_ARTICLES].sort((a, b) => a.id - b.id),
    [],
  );
  const [hero, ...rest] = sorted;

  return (
    <main className="space-y-4 pb-10 pt-6">
      <header className="px-5">
        <h1 className="text-3xl font-bold tracking-tight">News</h1>
        <p className="text-sm text-muted-foreground">
          Simulated quotes and headlines
        </p>
      </header>

      <MarketTicker />

      <div className="space-y-3 px-5">
        <Link
          to="/news/$articleId"
          params={{ articleId: String(hero.id) }}
          className="block rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground"
        >
          <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Top story
          </span>
          <h2 className="mt-3 text-xl font-bold leading-snug">{hero.title}</h2>
          <p className="mt-2 text-sm text-primary-foreground/85">
            {hero.summary}
          </p>
        </Link>

        {rest.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
