// ISO形式(YYYY-MM-DD)の文字列を軸にした日付計算。
// タイムゾーンの影響を避けるため、Dateオブジェクトは曜日計算でのみUTC固定で使う。

export interface Ymd {
  year: number;
  month: number;
  day: number;
}

export function toIso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseIso(iso: string): Ymd {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m === null) throw new RangeError(`日付の形式が不正: ${iso}`);
  return {
    year: Number.parseInt(m[1] ?? '', 10),
    month: Number.parseInt(m[2] ?? '', 10),
    day: Number.parseInt(m[3] ?? '', 10),
  };
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) throw new RangeError(`月が不正: ${month}`);
  if (month === 2 && isLeapYear(year)) return 29;
  return MONTH_DAYS[month - 1] ?? 0;
}

/** 曜日。0=日曜〜6=土曜 */
export function dayOfWeek(iso: string): number {
  const { year, month, day } = parseIso(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDays(iso: string, n: number): string {
  const { year, month, day } = parseIso(iso);
  const date = new Date(Date.UTC(year, month - 1, day + n));
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function isWeekend(iso: string): boolean {
  const dow = dayOfWeek(iso);
  return dow === 0 || dow === 6;
}

/**
 * 月のカレンダー行列。日曜始まりの週ごとに、月外はnullで埋める。
 */
export function monthMatrix(year: number, month: number): (string | null)[][] {
  const first = toIso(year, month, 1);
  const lead = dayOfWeek(first);
  const total = daysInMonth(year, month);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d += 1) cells.push(toIso(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
