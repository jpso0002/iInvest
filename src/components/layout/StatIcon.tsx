import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "accent" | "primary" | "practice";

const TONE_CLASS: Record<StatTone, string> = {
  accent: "bg-accent text-accent-foreground",
  primary: "bg-primary text-primary-foreground",
  practice: "bg-practice text-practice-foreground",
};

interface Props {
  icon: LucideIcon;
  tone: StatTone;
  className?: string;
  iconClassName?: string;
}

export function StatIcon({ icon: Icon, tone, className, iconClassName }: Props) {
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
