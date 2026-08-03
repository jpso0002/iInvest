// The guidance layer: coach card, spotlight, pointer, unlock celebration.
//
// All of it renders inside `.phone-frame`, which is a containing block for
// fixed descendants (see PhoneFrame.css) — so `inset-0` means "the phone", not
// "the browser window". Getting that wrong is why an earlier attempt at a
// fixed-position bar escaped the device.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import mascot from "@/assets/mascot-coach.png";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// ------------------------------------------------------------ spotlight ---

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Dims everything except the target element and blocks taps outside it.
 *
 * The target is found by `data-slice-target`, not a CSS selector, so markup can
 * change without silently breaking the tutorial.
 */
export function Spotlight({
  target,
  active,
}: {
  target?: string;
  active: boolean;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  // Coordinates must be relative to this overlay's own box. Measuring against
  // `.phone-frame` looked right but was off by the status bar + chrome height,
  // because the overlay is `inset-0` of the shell, not of the frame.
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Bring the target into view before lighting it. A spotlight on something
  // below the fold is worse than no spotlight — it dims the screen and points
  // at nothing.
  useEffect(() => {
    if (!active || !target) return;
    const t = window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(`[data-slice-target="${target}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [target, active]);

  useLayoutEffect(() => {
    if (!active || !target) {
      setRect(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-slice-target="${target}"]`,
      );
      const root = rootRef.current;
      if (!el || !root) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const f = root.getBoundingClientRect();
      const pad = 8;
      setRect({
        top: r.top - f.top - pad,
        left: r.left - f.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    };
    const loop = () => {
      measure();
      raf = requestAnimationFrame(loop);
    };
    // rAF rather than a one-shot: the target may be inside a scroll container
    // that is still settling, and prices re-render constantly.
    loop();
    return () => cancelAnimationFrame(raf);
  }, [target, active]);

  // Note the root renders as soon as the beat is active, *before* a rect
  // exists. It has to: the rect is measured relative to this element, so
  // bailing out early would mean nothing to measure against and the spotlight
  // could never appear.
  if (!active) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden="true"
    >
      {rect && (
        <>
          {/* Four panels around the cut-out rather than an SVG mask — crisper
          edges and no repaint cost on a phone-sized frame. */}
          <Panel
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }}
          />
          <Panel
            style={{
              top: rect.top + rect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Panel
            style={{
              top: rect.top,
              left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
            }}
          />
          <Panel
            style={{
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
          />
          <div
            className="absolute rounded-2xl ring-4 ring-[var(--brand-purple)] transition-all duration-300"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow:
                "0 0 0 9999px transparent, 0 0 28px 4px rgba(90,79,230,.45)",
            }}
          />
        </>
      )}
    </div>
  );
}

/**
 * One quadrant of the scrim.
 *
 * `pointer-events-auto` is load-bearing: the panels must *swallow* taps so the
 * only interactive things left are the spotlit element and the coach card.
 * Without it the scrim only dims, and a learner can tap straight through it
 * and walk off the script.
 */
function Panel({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="pointer-events-auto absolute bg-[rgba(16,16,24,0.62)] transition-all duration-300"
      style={style}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ------------------------------------------------------------ pointer ---

/** Pulsing ring + arrow drawing the eye to the tap target. */
export function Pointer({ target }: { target?: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!target) return;
    let raf = 0;
    const loop = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-slice-target="${target}"]`,
      );
      // Same origin rule as the spotlight: measure against this overlay's own
      // box, not the phone frame, or the dot lands a chrome-height too low.
      const root = rootRef.current;
      if (el && root) {
        const r = el.getBoundingClientRect();
        const f = root.getBoundingClientRect();
        setPos({
          top: r.bottom - f.top + 14,
          left: r.left - f.left + r.width / 2,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-40">
      {pos && (
        <span
          className={
            "absolute block h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--brand-purple)] " +
            (reduced ? "" : "animate-ping")
          }
          style={{ top: pos.top, left: pos.left }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------- coach card ---

/**
 * The narrator. One line at a time, always with an explicit continue — the
 * learner sets the pace, nothing auto-dismisses under them.
 */
export function CoachCard({
  line,
  onNext,
  last,
  cta,
}: {
  line: string;
  onNext: () => void;
  last: boolean;
  cta?: string;
}) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-50 p-4">
      <div className="animate-[coach-in_260ms_ease-out] rounded-3xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex gap-3">
          <img
            src={mascot}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 flex-none self-start"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-purple)]">
              Coach
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {line}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {last ? (cta ?? "Continue") : "Next"}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------ unlock burst ---

/**
 * The "you earned this" moment — deliberately full-screen and unskippable for
 * a beat, because it's the emotional core of the whole product mechanic.
 */
export function UnlockBurst({
  title,
  blurb,
  lessonN,
  onDone,
}: {
  title: string;
  blurb: string;
  lessonN: number;
  onDone: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // Long enough to read, short enough not to stall the demo.
    timer.current = window.setTimeout(onDone, reduced ? 1400 : 2600);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [onDone, reduced]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[rgba(16,16,24,0.88)] px-8 text-center backdrop-blur-sm"
    >
      {!reduced && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            return (
              <span
                key={i}
                className="animate-confetti-burst absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
                style={
                  {
                    background: [
                      "var(--reward-gold)",
                      "var(--brand-purple-light)",
                      "var(--status-success)",
                    ][i % 3],
                    "--confetti-x": `${Math.cos(angle) * 130}px`,
                    "--confetti-y": `${Math.sin(angle) * 130}px`,
                    "--confetti-rotate": `${i * 47}deg`,
                    animationDelay: `${(i % 4) * 40}ms`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}

      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-reward animate-check-pulse">
        <Sparkles
          className="h-9 w-9 text-reward-foreground"
          strokeWidth={2.2}
        />
      </span>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-reward">
        Lesson {lessonN} complete · new ability
      </p>
      <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-[16rem] text-sm text-white/70">{blurb}</p>
      <p className="mt-6 text-[11px] uppercase tracking-wider text-white/40">
        Tap to continue
      </p>
    </button>
  );
}

// ------------------------------------------------------ locked slot ---

/** A capability the learner hasn't earned yet. Visible on purpose — seeing
 *  what's still locked is what makes the next lesson feel worth doing. */
export function LockedSlot({
  label,
  lesson,
}: {
  label: string;
  lesson: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/60 p-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Check className="h-4 w-4 opacity-0" />
        <span className="absolute text-xs">🔒</span>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Unlocks after lesson {lesson}
        </p>
      </div>
    </div>
  );
}
