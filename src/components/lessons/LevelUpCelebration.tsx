import { PartyPopper } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface Props {
  newUnit: number;
}

const CONFETTI_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Fixed scatter (not random) so the single burst looks the same every time.
const PARTICLE_COUNT = 14;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
  const distance = 60 + ((i * 37) % 40);
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    rotate: (i * 53) % 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delayMs: (i % 4) * 20,
  };
});

export function LevelUpCelebration({ newUnit }: Props) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative mt-4 flex items-center justify-center py-2">
      {!reducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="animate-confetti-burst absolute h-2 w-2 rounded-sm"
              style={
                {
                  backgroundColor: p.color,
                  "--confetti-x": `${p.x}px`,
                  "--confetti-y": `${p.y}px`,
                  "--confetti-rotate": `${p.rotate}deg`,
                  animationDelay: `${p.delayMs}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-primary-foreground shadow-sm",
          !reducedMotion && "animate-level-up-scale",
        )}
      >
        <PartyPopper className="h-5 w-5" aria-hidden="true" />
        <span className="text-base font-semibold">
          Unit {newUnit} unlocked!
        </span>
      </div>
    </div>
  );
}
