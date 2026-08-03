import type { Candle } from "@/lib/market";

/** Daily OHLC candles. Green body = closed above open. */
export function Candlestick({
  candles,
  width = 320,
  height = 140,
}: {
  candles: Candle[];
  width?: number;
  height?: number;
}) {
  if (!candles || candles.length === 0) return null;

  const all = candles.flatMap((c) => [c.high, c.low]);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const slotWidth = width / candles.length;
  const bodyWidth = Math.max(2, slotWidth * 0.55);
  const y = (v: number) => height - ((v - min) / range) * height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`Candlestick chart, ${candles.length} days`}
    >
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? "var(--market-up)" : "var(--market-down)";
        const cx = i * slotWidth + slotWidth / 2;
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBottom = y(Math.min(c.open, c.close));
        return (
          <g key={c.date}>
            <line
              x1={cx}
              x2={cx}
              y1={y(c.high)}
              y2={y(c.low)}
              stroke={color}
              strokeWidth="1"
            />
            <rect
              x={cx - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={Math.max(1.5, bodyBottom - bodyTop)}
              fill={color}
              rx="1"
            />
          </g>
        );
      })}
    </svg>
  );
}
