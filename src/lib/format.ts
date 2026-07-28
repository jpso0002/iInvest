// Formatting helpers for money and numbers.
// Practice cash is prefixed with `pc$` everywhere (see docs/design.md §9).

const numberFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const wholeFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** Format a value as practice currency, e.g. `pc$1,234.50`. */
export const pcMoney = (n: number, opts?: { whole?: boolean }): string => {
  if (!Number.isFinite(n)) return "pc$0";
  const fmt = opts?.whole ? wholeFmt : numberFmt;
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
