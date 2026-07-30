// Minimal line chart for price series. Deliberately hand-rolled rather than
// recharts: these render at 24–60 points inside cards and sheets, where the
// responsive container and axis machinery cost more than they give.

export function Sparkline({
  data,
  width = 100,
  height = 32,
  positive = true,
  strokeWidth = 2,
  fill = false,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => [
    i * stepX,
    height - ((v - min) / range) * height,
  ]);

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const color = positive ? "var(--primary)" : "var(--destructive)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label={positive ? "Price trending up" : "Price trending down"}
    >
      {fill && (
        <path
          d={`${pathD} L${width},${height} L0,${height} Z`}
          fill={color}
          opacity="0.12"
          stroke="none"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
