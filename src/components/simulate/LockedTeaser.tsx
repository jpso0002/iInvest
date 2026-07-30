import { Lock } from "lucide-react";

/** Shown at the end of a progressively-revealed list: names the next section
 * and how many lessons still stand between the learner and it. */
export function LockedTeaser({
  title,
  lessonsRemaining,
}: {
  title: string;
  lessonsRemaining: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-muted">
        <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">
          {lessonsRemaining > 0
            ? `Unlocks in ${lessonsRemaining} lesson${lessonsRemaining > 1 ? "s" : ""}`
            : "Unlocks soon"}
        </p>
      </div>
    </div>
  );
}
