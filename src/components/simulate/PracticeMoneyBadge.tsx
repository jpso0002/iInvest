import { cn } from "@/lib/utils";

export function PracticeMoneyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        // Tinted info surface with the readable info text colour — the vivid
        // blue on a 15% tint of itself would only reach ~2.9:1.
        "inline-flex items-center gap-1.5 rounded-full bg-practice/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-practice-foreground",
        className,
      )}
    >
      <span aria-hidden className="text-[8px]">
        ●
      </span>
      Practice money
    </span>
  );
}
