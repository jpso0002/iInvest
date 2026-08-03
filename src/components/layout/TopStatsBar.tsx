import { Flame, Star, Wallet, type LucideIcon } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { pcMoney } from "@/lib/format";
import { StatIcon, type StatTone } from "@/components/layout/StatIcon";

export function TopStatsBar() {
  const user = useAppStore((s) => s.user);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-5 py-3 backdrop-blur-sm">
      <Stat
        icon={Flame}
        tone="streak"
        label="Streak"
        value={user.streak.count}
      />
      <Stat icon={Star} tone="reward" label="XP" value={user.xp} />
      <Stat
        icon={Wallet}
        tone="practice"
        label="Cash"
        value={pcMoney(user.cash, { whole: true })}
      />
    </header>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: StatTone;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 leading-tight">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <StatIcon icon={icon} tone={tone} />
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
