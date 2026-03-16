// 連休の検出と、有給の「橋渡し」提案。
// 土日と祝日を休みとして、連続する休みの並び(連休)を数える。

import { addDays, toIso } from './date';
import { holidayName, isDayOff, type Holiday } from './holiday';

export interface Streak {
  from: string;
  to: string;
  /** 連続する休みの日数 */
  days: number;
  /** 期間に含まれる祝日 */
  holidays: Holiday[];
}

export interface Bridge {
  /** 休みを取る平日 */
  take: string[];
  /** 取った場合に生まれる連休 */
  result: Streak;
}

// 年末年始の連休が前後の年へまたがるぶんだけ広めに走査する
function windowOf(year: number): { start: string; end: string } {
  return { start: toIso(year - 1, 12, 15), end: toIso(year + 1, 1, 15) };
}

function makeStreak(from: string, to: string): Streak {
  const holidays: Holiday[] = [];
  let days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days += 1;
    const name = holidayName(d);
    if (name !== null) holidays.push({ date: d, name });
  }
  return { from, to, days, holidays };
}

/** 走査窓の中の、連続する休みの並びすべて(長さ1を含む) */
function runsInWindow(year: number): Streak[] {
  const { start, end } = windowOf(year);
  const runs: Streak[] = [];
  let runStart: string | null = null;
  let prev: string | null = null;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (isDayOff(d)) {
      runStart = runStart ?? d;
      prev = d;
    } else if (runStart !== null && prev !== null) {
      runs.push(makeStreak(runStart, prev));
      runStart = null;
    }
  }
  if (runStart !== null && prev !== null) runs.push(makeStreak(runStart, prev));
  return runs;
}

function touchesYear(streak: Streak, year: number): boolean {
  const prefix = `${year}-`;
  return streak.from.startsWith(prefix) || streak.to.startsWith(prefix);
}

/** 指定年に掛かるminDays日以上の連休を日付順で返す */
export function streaksInYear(year: number, minDays = 3): Streak[] {
  return runsInWindow(year).filter((s) => s.days >= minDays && touchesYear(s, year));
}

/**
 * 有給の橋渡し提案。隣り合う休みの並びの間の平日がmaxTake日以内で、
 * つなぐと4日以上の連休になる組み合わせを返す。
 */
export function bridgesInYear(year: number, maxTake = 2): Bridge[] {
  const runs = runsInWindow(year);
  const bridges: Bridge[] = [];
  for (let i = 0; i < runs.length - 1; i += 1) {
    const left = runs[i];
    const right = runs[i + 1];
    if (left === undefined || right === undefined) continue;
    const take: string[] = [];
    for (let d = addDays(left.to, 1); d < right.from; d = addDays(d, 1)) take.push(d);
    if (take.length === 0 || take.length > maxTake) continue;
    const merged = makeStreak(left.from, right.to);
    if (merged.days < 4 || !touchesYear(merged, year)) continue;
    bridges.push({ take, result: merged });
  }
  return bridges;
}

/** 連休の通称。含まれる祝日から推定する */
export function labelStreak(streak: Streak): string {
  const names = new Set(streak.holidays.map((h) => h.name));
  if (names.has('元日')) return '年末年始';
  if (names.has('憲法記念日') || names.has('みどりの日') || names.has('こどもの日')) {
    return 'ゴールデンウィーク';
  }
  if (names.has('敬老の日') && names.has('秋分の日')) return 'シルバーウィーク';
  const month = Number.parseInt(streak.from.slice(5, 7), 10);
  return `${month}月の連休`;
}

export interface YearStats {
  /** 祝日の数 */
  holidays: number;
  /** 土日祝を合わせた休みの日数 */
  offDays: number;
  /** 最長の連休。同じ長さなら早いほう */
  longest: Streak | null;
}

export function yearStats(year: number): YearStats {
  let holidays = 0;
  let offDays = 0;
  const end = toIso(year, 12, 31);
  for (let d = toIso(year, 1, 1); d <= end; d = addDays(d, 1)) {
    if (holidayName(d) !== null) holidays += 1;
    if (isDayOff(d)) offDays += 1;
  }
  const streaks = streaksInYear(year, 2);
  let longest: Streak | null = null;
  for (const s of streaks) {
    if (longest === null || s.days > longest.days) longest = s;
  }
  return { holidays, offDays, longest };
}
