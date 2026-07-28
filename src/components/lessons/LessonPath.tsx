import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, LineChart, Lock } from "lucide-react";
import { lessons, lessonsByUnit, units, unitById, type LessonDef } from "@/content/lessons";
import { useAppStore } from "@/store/useAppStore";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { UnitNumber } from "@/store/schema";

type NodeState = "locked" | "current" | "completed";

interface Props {
  completedLessons: string[];
}

const UNIT_IDS = units.map((u) => u.id);

// Zig-zag: each node offset left/right of center by a quarter-turn sine wave,
// as a % of the container width — same rhythm every 4 nodes (center, +22%,
// center, -22%...).
const AMP = 22;
const STEP = Math.PI / 2;

function isUnitComplete(unitLessons: LessonDef[], completed: string[]): boolean {
  return unitLessons.length > 0 && unitLessons.every((l) => completed.includes(l.id));
}

function stateFor(
  lesson: LessonDef,
  completed: string[],
  activeId: string | null,
): NodeState {
  if (completed.includes(lesson.id)) return "completed";
  if (lesson.id === activeId) return "current";
  return "locked";
}

export function LessonPath({ completedLessons }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const pendingLessonComplete = useAppStore((s) => s.pendingLessonComplete);
  const consumeLessonCompleteAnimation = useAppStore((s) => s.consumeLessonCompleteAnimation);

  const grouped = useMemo(() => {
    const byUnit = {} as Record<UnitNumber, LessonDef[]>;
    for (const u of units) byUnit[u.id] = lessonsByUnit(u.id);
    return byUnit;
  }, []);

  const defaultUnit = useMemo<UnitNumber>(() => {
    for (const id of UNIT_IDS) {
      if (!isUnitComplete(grouped[id], completedLessons)) return id;
    }
    return UNIT_IDS[UNIT_IDS.length - 1];
  }, [grouped, completedLessons]);

  const [selectedUnit, setSelectedUnit] = useState<UnitNumber>(defaultUnit);
  // Once the user manually picks a unit this session, stop auto-following
  // `defaultUnit` — only a lesson completion (below) moves the view after that.
  const userPicked = useRef(false);
  useEffect(() => {
    if (!userPicked.current) setSelectedUnit(defaultUnit);
  }, [defaultUnit]);

  const levelLessons = grouped[selectedUnit];
  const unitMeta = unitById(selectedUnit);
  const levelUnlocked =
    selectedUnit === 1 ||
    isUnitComplete(grouped[(selectedUnit - 1) as UnitNumber], completedLessons);
  const completedInLevel = levelLessons.filter((l) => completedLessons.includes(l.id)).length;
  const activeLessonId = levelUnlocked
    ? (levelLessons.find((l) => !completedLessons.includes(l.id))?.id ?? null)
    : null;
  const levelStatus = !levelUnlocked
    ? "Locked"
    : completedInLevel === levelLessons.length
      ? "Complete"
      : "In progress";

  const offsets = useMemo(
    () => levelLessons.map((_, i) => AMP * Math.sin(i * STEP)),
    [levelLessons],
  );
  const pathD = useMemo(() => {
    const pts = offsets.map((ox, i) => ({ x: 50 + ox, y: i + 0.5 }));
    if (!pts.length) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const midY = (p1.y + p2.y) / 2;
      d += ` C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [offsets]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});
  const nodeWrapRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});
  const [pulsingLessonId, setPulsingLessonId] = useState<string | null>(null);
  // Runway above/below the path so the first and last nodes can also be
  // scrolled all the way to the container's vertical center — without this,
  // scrollTop clamps at 0/max and edge nodes can never reach full size.
  const [edgePad, setEdgePad] = useState(0);
  // `scroll-snap-type: mandatory` fights native `scrollIntoView({behavior:"smooth"})` —
  // it can re-snap mid-animation and overshoot. Briefly drop snapping for the
  // duration of any JS-driven scroll and restore it once it settles.
  const [suspendSnap, setSuspendSnap] = useState<string | false>(false);

  useEffect(() => {
    if (suspendSnap === false) return;
    const root = scrollRef.current;
    const target = nodeWrapRefs.current[suspendSnap];
    if (!root || !target) {
      setSuspendSnap(false);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      const wanted = target.offsetTop + target.offsetHeight / 2 - root.clientHeight / 2;
      if (Math.abs(root.scrollTop - wanted) > 4) {
        target.scrollIntoView({ behavior: "auto", block: "center" });
      }
      setSuspendSnap(false);
    };
    root.addEventListener("scrollend", finish, { once: true });
    const fallback = setTimeout(finish, 900);
    return () => {
      root.removeEventListener("scrollend", finish);
      clearTimeout(fallback);
    };
  }, [suspendSnap]);

  const scrollToLesson = (id: string, instant = false) => {
    const target = nodeWrapRefs.current[id];
    if (!target) return;
    setSuspendSnap(id);
    target.scrollIntoView({
      behavior: reducedMotion || instant ? "auto" : "smooth",
      block: "center",
    });
  };

  // Keep `edgePad` in sync with the scroll container's own height so the
  // spacers below always give the first/last node exactly enough runway to
  // reach vertical center, on mount and on any resize.
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const measure = () => setEdgePad(root.clientHeight / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Land centered on the active lesson whenever the visible level changes —
  // also re-run once `edgePad` is actually measured, since centering before
  // that lands slightly off for the first/last node.
  useLayoutEffect(() => {
    const startId = activeLessonId ?? levelLessons[0]?.id;
    if (startId) scrollToLesson(startId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, edgePad]);

  // Scroll-driven enlarge: scale + fade each node by its distance from the
  // scroll container's vertical center, recalculated every scroll frame.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rootRect = root.getBoundingClientRect();
      const centerY = rootRect.top + rootRect.height / 2;
      for (const lesson of levelLessons) {
        const el = nodeRefs.current[lesson.id];
        if (!el) continue;
        if (reducedMotion) {
          el.style.transform = "";
          el.style.opacity = "";
          continue;
        }
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - centerY);
        const scale = Math.max(0.85, Math.min(1.12, 1.12 - dist / 260));
        const opacity = Math.max(0.55, Math.min(1, 1 - dist / 420));
        el.style.transform = `scale(${scale})`;
        el.style.opacity = String(opacity);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [levelLessons, reducedMotion]);

  // On lesson completion: pop the node, then advance — possibly into the
  // next level, in which case the layout effect above re-centers us there.
  useEffect(() => {
    if (!pendingLessonComplete) return;
    const { lessonId } = pendingLessonComplete;
    const idx = lessons.findIndex((l) => l.id === lessonId);
    const next = idx === -1 ? undefined : lessons[idx + 1];

    if (reducedMotion) {
      if (next) {
        if (next.unit !== selectedUnit) {
          userPicked.current = false;
          setSelectedUnit(next.unit);
        } else {
          scrollToLesson(next.id, true);
        }
      }
      consumeLessonCompleteAnimation();
      return;
    }

    setPulsingLessonId(lessonId);
    const t = setTimeout(() => {
      setPulsingLessonId(null);
      if (next) {
        if (next.unit !== selectedUnit) {
          userPicked.current = false;
          setSelectedUnit(next.unit);
        } else {
          scrollToLesson(next.id);
        }
      }
      consumeLessonCompleteAnimation();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLessonComplete]);

  const handleLockedTap = () => {
    setToast("Finish the previous lesson to unlock this one.");
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Sticky level pill nav — persistent chrome, never scrolls with the path. */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-background px-4 py-3">
        {UNIT_IDS.map((id) => {
          const unitLessonsForPill = grouped[id];
          const doneCount = unitLessonsForPill.filter((l) =>
            completedLessons.includes(l.id),
          ).length;
          const isActive = id === selectedUnit;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                userPicked.current = true;
                setSelectedUnit(id);
              }}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex-none whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              Unit {id}
              <span className="ml-1 tabular-nums opacity-70">
                {doneCount}/{unitLessonsForPill.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Unit-style info card. */}
      <div className="shrink-0 px-5 pt-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                Unit {selectedUnit}
              </span>
              <h2 className="mt-1.5 truncate text-lg font-bold text-foreground">
                {unitMeta?.title}
              </h2>
            </div>
            <span className="flex-none rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
              {levelStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{unitMeta?.subtitle}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                Progress
              </span>
              <span className="font-bold tabular-nums text-primary">
                {completedInLevel} / {levelLessons.length} lessons
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${levelLessons.length > 0 ? (completedInLevel / levelLessons.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {!levelUnlocked ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <Lock className="h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
          <p className="text-sm text-muted-foreground">
            Complete the previous unit to unlock this one.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden px-5",
            !suspendSnap && "snap-y snap-mandatory",
          )}
        >
          <div style={{ height: edgePad }} aria-hidden />
          <div className="relative">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 100 ${Math.max(levelLessons.length, 1)}`}
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                className="text-border"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="relative flex flex-col items-center gap-11 py-2">
              {levelLessons.map((lesson, i) => {
                const state = stateFor(lesson, completedLessons, activeLessonId);
                return (
                  <div
                    key={lesson.id}
                    ref={(el) => {
                      nodeWrapRefs.current[lesson.id] = el;
                    }}
                    className="relative flex w-full snap-center flex-col items-center"
                    style={{ transform: `translateX(${offsets[i]}%)` }}
                  >
                    <div
                      ref={(el) => {
                        nodeRefs.current[lesson.id] = el;
                      }}
                      style={{ willChange: "transform, opacity" }}
                    >
                      <LessonNodeButton
                        lesson={lesson}
                        state={state}
                        onLockedTap={handleLockedTap}
                        isPulsing={pulsingLessonId === lesson.id}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ height: edgePad }} aria-hidden />
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

interface LessonNodeButtonProps {
  lesson: LessonDef;
  state: NodeState;
  onLockedTap: () => void;
  isPulsing?: boolean;
}

// Tactile "pressable coin" nodes — deliberately hardcoded colors (not theme
// tokens) to mirror starter-react-app's lesson chart exactly; only the
// "current" node switches to the app's own primary in dark mode, since a
// near-black square would otherwise vanish against the dark background.
function LessonNodeButton({ lesson, state, onLockedTap, isPulsing }: LessonNodeButtonProps) {
  const isLocked = state === "locked";

  const sizeClass =
    state === "completed"
      ? "h-[68px] w-[68px] rounded-full"
      : state === "current"
        ? "h-20 w-20 rounded-[22px]"
        : "h-[58px] w-[58px] rounded-full";

  const colorClass =
    state === "completed"
      ? "bg-[#10B981] shadow-[0_6px_0_0_#047857] active:translate-y-[3px] active:shadow-[0_3px_0_0_#047857]"
      : state === "current"
        ? "bg-[#1E293B] shadow-[0_8px_0_0_#0F172A] active:translate-y-[3px] active:shadow-[0_4px_0_0_#0F172A] dark:bg-primary dark:shadow-[0_8px_0_0_var(--primary-foreground)] dark:active:shadow-[0_4px_0_0_var(--primary-foreground)]"
        : "bg-[#E2E8F0] shadow-[0_6px_0_0_#CBD5E1] opacity-85 dark:bg-[#2E2F3A] dark:shadow-[0_6px_0_0_#1E1F28] dark:opacity-100";

  const inner = (
    <span
      className={cn(
        "relative flex items-center justify-center transition-transform",
        sizeClass,
        colorClass,
        isPulsing && "animate-node-pop",
      )}
    >
      {state === "current" && (
        <span className="absolute -top-7 left-1/2 whitespace-nowrap rounded-lg bg-[#FFD700] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#7A4B00] shadow-[0_3px_0_0_#B8860B] animate-[badge-bounce_1.6s_ease-in-out_infinite] motion-reduce:animate-none">
          Start
        </span>
      )}
      {state === "completed" ? (
        <Check className="h-6 w-6 text-white" strokeWidth={2.6} />
      ) : state === "locked" ? (
        <Lock className="h-5 w-5 text-[#94A3B8]" strokeWidth={2.4} />
      ) : (
        <LineChart className="h-7 w-7 text-[#10B981]" strokeWidth={2.4} />
      )}
    </span>
  );

  const label = `Lesson ${lesson.id}: ${lesson.title}`;

  return (
    <div className="flex flex-col items-center">
      {isLocked ? (
        <button
          type="button"
          onClick={onLockedTap}
          aria-label={`${label} (locked)`}
          className="transition-transform active:scale-95"
        >
          {inner}
        </button>
      ) : (
        <Link
          to="/lessons/$lessonId"
          params={{ lessonId: lesson.id }}
          aria-label={label}
          className="transition-transform active:scale-95"
        >
          {inner}
        </Link>
      )}
      <span
        className={cn(
          "mt-4 block max-w-[180px] rounded-2xl border-2 px-3.5 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wide shadow-sm",
          state === "current"
            ? "border-primary px-4 py-2 text-xs text-foreground shadow-[0_4px_0_0_var(--primary)]"
            : "border-border bg-card text-muted-foreground",
        )}
      >
        {lesson.title}
      </span>
    </div>
  );
}
