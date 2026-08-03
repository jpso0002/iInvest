import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "streak" | "reward" | "primary" | "practice";

const TONE_CLASS: Record<StatTone, string> = {
  // Streak is a daily-habit nudge, which the palette assigns to warning/orange.
  streak: "bg-warning text-warning-foreground",
  // XP is a reward, so it takes the coin gold rather than brand purple.
  reward: "bg-reward text-reward-foreground",
  primary: "bg-primary text-primary-foreground",
  practice: "bg-practice text-primary-foreground",
};

interface Props {
  icon: LucideIcon;
  tone: StatTone;
  className?: string;
  iconClassName?: string;
}

export function StatIcon({
  icon: Icon,
  tone,
  className,
  iconClassName,
}: Props) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 flex-none items-center justify-center rounded-full",
        TONE_CLASS[tone],
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={cn("h-3.5 w-3.5", iconClassName)} strokeWidth={2.5} />
    </span>
  );
}
