// Formatting helpers for money and numbers.
// Practice cash is prefixed with `pc$` everywhere (see docs/design.md §9).

const numberFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const wholeFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const centsFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a value as practice currency, e.g. `pc$1,234.50`.
 *
 * By default trailing zeros are dropped, so round balances read `pc$1,000`.
 * Pass `cents` where the exact charge matters — a fee of `pc$0.50` shouldn't
 * render as `pc$0.5` on a receipt.
 */
export const pcMoney = (
  n: number,
  opts?: { whole?: boolean; cents?: boolean },
): string => {
  if (!Number.isFinite(n)) return "pc$0";
  const fmt = opts?.whole ? wholeFmt : opts?.cents ? centsFmt : numberFmt;
  return `pc$${fmt.format(n)}`;
};

/** Format a plain number with locale grouping. */
export const num = (n: number, opts?: { whole?: boolean }): string => {
  if (!Number.isFinite(n)) return "0";
  return (opts?.whole ? wholeFmt : numberFmt).format(n);
};

/** Signed practice-money delta, e.g. `+pc$12.30` / `-pc$4.10`. */
export const pcDelta = (n: number): string => {
  if (!Number.isFinite(n) || n === 0) return `pc$0`;
  const sign = n > 0 ? "+" : "-";
  return `${sign}${pcMoney(Math.abs(n))}`;
};

const fixed = (n: number, decimals: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Share counts: 4 decimals below one unit, 2 above — fractional buys get precision
 * where it matters without turning `120.00` into noise. */
export const shares = (n: number): string => {
  if (!Number.isFinite(n)) return "0";
  return fixed(n, Math.abs(n) < 1 ? 4 : 2);
};

/** Signed percentage, e.g. `+1.24%`. */
export const pct = (n: number, opts?: { withSign?: boolean }): string => {
  if (!Number.isFinite(n)) return "0.00%";
  const sign = (opts?.withSign ?? true) && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
};

/** Compact plain count, e.g. `19.4M`, `3.1k`. */
export const compactNumber = (n: number): string => {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000_000) return `${fixed(n / 1_000_000_000, 2)}B`;
  if (n >= 1_000_000) return `${fixed(n / 1_000_000, 1)}M`;
  if (n >= 1_000) return `${fixed(n / 1_000, 1)}k`;
  return fixed(n, 0);
};

/** Compact practice money, e.g. `pc$4.2B`. Market caps are far too large to
 * render in full without swamping the row. */
export const pcCompact = (n: number): string => {
  if (!Number.isFinite(n)) return "pc$0";
  if (n >= 1_000) return `pc$${compactNumber(n)}`;
  return pcMoney(n);
};

/** `23 Jul 2026` — used for candle dates and purchase history. */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
