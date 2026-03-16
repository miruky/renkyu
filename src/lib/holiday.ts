// 祝日の照会。内閣府CSV由来のデータで答え、収録範囲の外では祝日を推測しない。

import { HOLIDAYS } from './data/holidays';
import { isWeekend } from './date';

export interface Holiday {
  date: string;
  name: string;
}

const byDate = new Map<string, string>(HOLIDAYS);

const firstDate = HOLIDAYS[0]?.[0] ?? '';
const lastDate = HOLIDAYS[HOLIDAYS.length - 1]?.[0] ?? '';

/** データが完全な年の範囲(両端を含む) */
export function coverage(): { from: number; to: number } {
  return {
    from: Number.parseInt(firstDate.slice(0, 4), 10),
    to: Number.parseInt(lastDate.slice(0, 4), 10),
  };
}

/** 祝日ならその名称、そうでなければnull。収録範囲外もnull */
export function holidayName(iso: string): string | null {
  return byDate.get(iso) ?? null;
}

export function holidaysIn(year: number): Holiday[] {
  const prefix = `${year}-`;
  return HOLIDAYS.filter(([date]) => date.startsWith(prefix)).map(([date, name]) => ({
    date,
    name,
  }));
}

/** 土日または祝日 */
export function isDayOff(iso: string): boolean {
  return isWeekend(iso) || byDate.has(iso);
}
