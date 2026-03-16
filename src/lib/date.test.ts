import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOfWeek,
  daysInMonth,
  isLeapYear,
  isWeekend,
  monthMatrix,
  parseIso,
  toIso,
} from './date';

describe('toIso / parseIso', () => {
  it('ゼロ埋めして往復できる', () => {
    expect(toIso(2026, 1, 5)).toBe('2026-01-05');
    expect(parseIso('2026-01-05')).toEqual({ year: 2026, month: 1, day: 5 });
  });

  it('不正な形式を拒否する', () => {
    expect(() => parseIso('2026/01/05')).toThrow(RangeError);
    expect(() => parseIso('2026-1-5')).toThrow(RangeError);
  });
});

describe('isLeapYear / daysInMonth', () => {
  it('閏年の規則(4年ごと、100年は除き、400年は含む)', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  it('月の日数', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(() => daysInMonth(2026, 13)).toThrow(RangeError);
  });
});

describe('dayOfWeek / isWeekend', () => {
  it('既知の曜日に一致する', () => {
    expect(dayOfWeek('2026-01-01')).toBe(4); // 木曜
    expect(dayOfWeek('2026-06-13')).toBe(6); // 土曜
    expect(dayOfWeek('2000-01-01')).toBe(6); // 土曜
  });

  it('土日だけを週末と判定する', () => {
    expect(isWeekend('2026-06-13')).toBe(true);
    expect(isWeekend('2026-06-14')).toBe(true);
    expect(isWeekend('2026-06-15')).toBe(false);
  });
});

describe('addDays', () => {
  it('月末・年末・閏日をまたぐ', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('monthMatrix', () => {
  it('日曜始まりで月外をnullに埋める', () => {
    const weeks = monthMatrix(2026, 6); // 2026-06-01は月曜
    expect(weeks[0]?.[0]).toBeNull();
    expect(weeks[0]?.[1]).toBe('2026-06-01');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    const days = weeks.flat().filter((d) => d !== null);
    expect(days).toHaveLength(30);
    expect(days[days.length - 1]).toBe('2026-06-30');
  });
});
