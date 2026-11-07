import type { Cents } from "../finance";

export type Range = "1M" | "3M" | "YTD" | "1Y" | "ALL";
export const RANGES: Range[] = ["1M", "3M", "YTD", "1Y", "ALL"];
type Point = { month: number; value: Cents; earned: Cents; deposited?: Cents };

/** Demo month 0 = Nov 2026, so January is every month where (month + 10) % 12 === 0. */
const isJanuary = (month: number) => (month + 10) % 12 === 0;

/** The slice of portfolio history to chart for a range. Always returns at least the last point. */
export function historyInRange<T extends Point>(history: T[], month: number, range: Range): T[] {
  if (history.length <= 1 || range === "ALL") return history;
  let start: number;
  if (range === "YTD") {
    start = month;
    while (start > 0 && !isJanuary(start)) start--;
  } else start = month - { "1M": 1, "3M": 3, "1Y": 12 }[range];
  const out = history.filter((p) => p.month >= start);
  return out.length ? out : history.slice(-1);
}

/** Investment gain between the first and last point, excluding deposits. % is against starting value + new deposits (0 when that is 0). */
export function changeOverRange(points: Point[]): { cents: Cents; pct: number } {
  if (points.length < 2) return { cents: 0, pct: 0 };
  // Gain = change in value minus new deposits; % is measured against what was in the account plus new deposits.
  const first = points[0], last = points[points.length - 1];
  const d0 = first.deposited ?? 0, d1 = last.deposited ?? d0;
  const gain = last.value - first.value - (d1 - d0);
  const base = first.value + (d1 - d0);
  return { cents: gain, pct: base > 0 ? gain / base : 0 };
}
