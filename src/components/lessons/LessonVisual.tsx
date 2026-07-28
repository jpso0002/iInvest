import Icon from "@/components/Icon";
import type { LessonVisual as VisualDef } from "@/content/lessons";

// Inline teaching diagrams for concept steps (ported from starter-react-app's
// LessonVisual). Segment/step colors are authored per-visual in the lesson
// content, since each one is a bespoke illustration rather than themed chrome.

export function LessonVisual({ visual }: { visual?: VisualDef }) {
  if (!visual) return null;
  switch (visual.type) {
    case "pie":
      return <Pie visual={visual} />;
    case "bars":
      return <Bars visual={visual} />;
    case "stack":
      return <Stack visual={visual} />;
    case "flow":
      return <Flow visual={visual} />;
    case "formula":
      return <Formula visual={visual} />;
    default:
      return null;
  }
}

function Pie({ visual }: { visual: Extract<VisualDef, { type: "pie" }> }) {
  const R = 62;
  const C = 70;
  const total = visual.segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;

  return (
    <div className="mt-4 flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 flex-none" aria-hidden>
        {visual.segments.map((s, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += s.value;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const x1 = C + R * Math.cos(start);
          const y1 = C + R * Math.sin(start);
          const x2 = C + R * Math.cos(end);
          const y2 = C + R * Math.sin(end);
          const large = s.value / total > 0.5 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M${C} ${C} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={s.color}
              stroke="var(--card)"
              strokeWidth="2.5"
            />
          );
        })}
      </svg>
      <ul className="flex flex-col gap-2">
        {visual.segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 flex-none rounded-sm"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="font-semibold tabular-nums text-foreground">{s.value}%</span>
            <span className="text-muted-foreground">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ visual }: { visual: Extract<VisualDef, { type: "bars" }> }) {
  const unit = visual.unit ?? "";
  return (
    <div className="mt-4 flex items-end justify-around gap-3">
      {visual.series.map((s, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="flex w-full max-w-16 items-start justify-center rounded-t-lg pt-1.5"
              style={{
                height: `${(s.value / visual.max) * 100}%`,
                background: s.color,
              }}
            >
              <span className="text-[11px] font-bold text-white">
                {unit}
                {s.value.toLocaleString()}
              </span>
            </div>
          </div>
          <span className="text-center text-xs text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function Stack({ visual }: { visual: Extract<VisualDef, { type: "stack" }> }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-1.5">
      {visual.layers.map((l, i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-lg py-2.5"
          style={{ background: l.color, width: `${l.width}%` }}
        >
          <span className="px-2 text-center text-[11px] font-bold text-white">{l.label}</span>
        </div>
      ))}
    </div>
  );
}

function Flow({ visual }: { visual: Extract<VisualDef, { type: "flow" }> }) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {visual.steps.map((s, i) => (
        <div key={i} className="flex flex-col">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white"
              style={{ background: s.color }}
              aria-hidden
            >
              <Icon name={s.icon} size={20} stroke={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{s.title}</span>
              {s.sub && (
                <span className="block text-xs text-muted-foreground">{s.sub}</span>
              )}
            </span>
          </div>
          {i < visual.steps.length - 1 && (
            <span className="ml-5 h-3 w-px bg-border" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

function Formula({ visual }: { visual: Extract<VisualDef, { type: "formula" }> }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-muted/40 px-4 py-4">
      {visual.parts.map((p, i) =>
        "op" in p ? (
          <span key={i} className="text-lg font-bold text-muted-foreground">
            {p.op}
          </span>
        ) : (
          <span key={i} className="flex flex-col items-center">
            <span className="text-base font-bold tabular-nums" style={{ color: p.color }}>
              {p.value}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {p.label}
            </span>
          </span>
        ),
      )}
    </div>
  );
}
