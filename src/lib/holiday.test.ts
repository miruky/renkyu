import { describe, expect, it } from 'vitest';
import { coverage, holidayName, holidaysIn, isDayOff } from './holiday';
import { HOLIDAYS } from './data/holidays';

describe('データの整合性', () => {
  it('日付昇順で、形式が揃っている', () => {
    let prev = '';
    for (const [date, name] of HOLIDAYS) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(date >= prev).toBe(true);
      expect(name.length).toBeGreaterThan(0);
      prev = date;
    }
  });

  it('収録範囲が1955年から2027年以降まで', () => {
    const { from, to } = coverage();
    expect(from).toBe(1955);
    expect(to).toBeGreaterThanOrEqual(2027);
  });
});

describe('holidayName', () => {
  it('既知の祝日を答える', () => {
    expect(holidayName('2026-01-01')).toBe('元日');
    expect(holidayName('2026-05-05')).toBe('こどもの日');
    expect(holidayName('2026-08-11')).toBe('山の日');
  });

  it('振替休日が収録されている(2025-11-23は日曜)', () => {
    expect(holidayName('2025-11-23')).toBe('勤労感謝の日');
    expect(holidayName('2025-11-24')).toContain('休日');
  });

  it('平日と範囲外はnull', () => {
    expect(holidayName('2026-06-15')).toBeNull();
    expect(holidayName('1950-01-01')).toBeNull();
  });
});

describe('holidaysIn', () => {
  it('2026年の祝日が並ぶ', () => {
    const list = holidaysIn(2026);
    expect(list.length).toBeGreaterThanOrEqual(16);
    expect(list[0]).toEqual({ date: '2026-01-01', name: '元日' });
    expect(list.every((h) => h.date.startsWith('2026-'))).toBe(true);
  });
});

describe('isDayOff', () => {
  it('土日と祝日が休み', () => {
    expect(isDayOff('2026-06-13')).toBe(true); // 土
    expect(isDayOff('2026-06-14')).toBe(true); // 日
    expect(isDayOff('2026-05-04')).toBe(true); // みどりの日(月)
    expect(isDayOff('2026-06-15')).toBe(false);
  });
});
