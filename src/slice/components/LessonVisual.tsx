// Hand-built illustrations for the four slice lessons. Each one is the exact
// diagram the curriculum asks for, drawn with design tokens so it themes.

export function LessonVisual({ kind }: { kind: string }) {
  if (kind === "ownership") return <Ownership />;
  if (kind === "seesaw") return <Seesaw />;
  if (kind === "riskScale") return <RiskScale />;
  if (kind === "orderTypes") return <OrderTypes />;
  return null;
}

/** "A taco truck split into 100 slices, one highlighted as your share." */
function Ownership() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 100 }, (_, i) => (
          <span
            key={i}
            className={
              "aspect-square rounded-[3px] " +
              (i === 0 ? "bg-primary" : "bg-secondary")
            }
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="h-3 w-3 rounded-[3px] bg-primary" />
        <span className="font-semibold">Your share — 1%</span>
        <span className="ml-auto text-muted-foreground">
          The other 99 belong to everyone else
        </span>
      </div>
    </div>
  );
}

/** "A seesaw with buyers one side, sellers the other." */
function Seesaw() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="mx-auto h-16 w-full rounded-t-xl bg-market-up" />
          <p className="mt-2 text-xs font-bold text-market-up-text">BUYERS</p>
          <p className="text-[11px] text-muted-foreground">More demand</p>
        </div>
        <div className="flex-1 text-center">
          <div className="mx-auto h-7 w-full rounded-t-xl bg-market-down" />
          <p className="mt-2 text-xs font-bold text-market-down-text">
            SELLERS
          </p>
          <p className="text-[11px] text-muted-foreground">Less supply</p>
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-border" />
      <p className="mt-3 text-center text-sm font-semibold">
        More buyers than sellers → price rises ↑
      </p>
    </div>
  );
}

/** "Risk/reward spectrum from cash to small growing companies." */
function RiskScale() {
  const steps = [
    { label: "Cash", tone: "var(--market-neutral)" },
    { label: "Bonds", tone: "var(--status-info)" },
    { label: "Big stable", tone: "var(--status-success)" },
    { label: "Small & new", tone: "var(--status-error)" },
  ];
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1 text-center">
            <div className="h-2 rounded-full" style={{ background: s.tone }} />
            <p className="mt-2 text-[10px] font-semibold leading-tight">
              {s.label}
            </p>
            <div
              className="mx-auto mt-1 rounded-full bg-secondary"
              style={{ height: 8 + i * 12, width: 8 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-[11px] text-muted-foreground">
        <span>← Safer, slower</span>
        <span>Riskier, faster →</span>
      </div>
    </div>
  );
}

/** "Two labelled buttons: market vs limit." */
function OrderTypes() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border-2 border-border bg-card p-3">
        <p className="text-sm font-bold">Market</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Buys instantly. You get in — but not at a price you chose.
        </p>
        <p className="mt-2 text-[11px] font-semibold text-market-up-text">
          ✓ Speed
        </p>
        <p className="text-[11px] font-semibold text-market-down-text">
          ✕ No price control
        </p>
      </div>
      <div className="rounded-2xl border-2 border-primary bg-accent p-3">
        <p className="text-sm font-bold">Limit</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Waits for your price. May never fill.
        </p>
        <p className="mt-2 text-[11px] font-semibold text-market-up-text">
          ✓ Price control
        </p>
        <p className="text-[11px] font-semibold text-market-down-text">
          ✕ No guarantee
        </p>
      </div>
    </div>
  );
}
