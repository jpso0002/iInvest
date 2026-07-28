import { cn } from "@/lib/utils";

export function PracticeMoneyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-practice/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-practice",
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
