import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { getArticleById } from "@/content/news";

export const Route = createFileRoute("/_app/news/$articleId")({
  head: ({ params }) => {
    const article = getArticleById(params.articleId);
    return {
      meta: [{ title: article ? `${article.title} · iInvest` : "News · iInvest" }],
    };
  },
  component: NewsArticlePage,
});

function formatMove(move: number): string {
  if (move === 0) return "0.00%";
  const sign = move > 0 ? "+" : "";
  return `${sign}${move.toFixed(2)}%`;
}

function NewsArticlePage() {
  const { articleId } = Route.useParams();
  const article = getArticleById(articleId);

  if (!article) {
    return (
      <main className="space-y-4 px-5 pt-6">
        <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-sm text-muted-foreground">Article not found.</p>
      </main>
    );
  }

  const isUp = article.move > 0;
  const isDown = article.move < 0;

  return (
    <main className="space-y-4 px-5 pt-6 pb-10">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> News
      </Link>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{article.source}</span>
        <span aria-hidden="true">·</span>
        <span>{article.time}</span>
      </div>

      <h1 className="text-2xl font-bold leading-snug tracking-tight text-foreground">
        {article.title}
      </h1>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {article.tag}
        </span>
        <span
          className={
            "flex items-center gap-0.5 text-xs font-medium tabular " +
            (isUp ? "text-primary" : isDown ? "text-destructive" : "text-muted-foreground")
          }
        >
          {isUp && <ArrowUpRight className="h-3.5 w-3.5" />}
          {isDown && <ArrowDownRight className="h-3.5 w-3.5" />}
          {formatMove(article.move)}
        </span>
      </div>

      <p className="text-base font-medium text-foreground">{article.summary}</p>

      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Simulated content for educational purposes — not financial advice.
      </div>
    </main>
  );
}
