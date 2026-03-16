import { describe, expect, it } from 'vitest';
import { bridgesInYear, labelStreak, streaksInYear, yearStats } from './streak';

describe('streaksInYear', () => {
  it('2026年のゴールデンウィークを検出する(5/2土〜5/6振替休日)', () => {
    const gw = streaksInYear(2026).find((s) => s.from === '2026-05-02');
    expect(gw).toBeDefined();
    expect(gw?.to).toBe('2026-05-06');
    expect(gw?.days).toBe(5);
    expect(gw?.holidays.map((h) => h.name)).toContain('憲法記念日');
  });

  it('年またぎの年末年始を検出する(2027-01-01は金曜)', () => {
    const newYear = streaksInYear(2027).find((s) => s.from === '2027-01-01');
    expect(newYear).toBeDefined();
    expect(newYear?.days).toBe(3);
  });

  it('すべて指定日数以上で、年に掛かっている', () => {
    for (const s of streaksInYear(2026, 3)) {
      expect(s.days).toBeGreaterThanOrEqual(3);
      expect(s.from.startsWith('2026-') || s.to.startsWith('2026-')).toBe(true);
      expect(s.from <= s.to).toBe(true);
    }
  });
});

describe('bridgesInYear', () => {
  const bridges = bridgesInYear(2026);

  it('1/2を取ると元日から4連休になる', () => {
    const newYear = bridges.find((b) => b.take.length === 1 && b.take[0] === '2026-01-02');
    expect(newYear).toBeDefined();
    expect(newYear?.result.from).toBe('2026-01-01');
    expect(newYear?.result.to).toBe('2026-01-04');
    expect(newYear?.result.days).toBe(4);
  });

  it('4/30と5/1を取るとGWが8連休になる', () => {
    const gw = bridges.find((b) => b.take.join(',') === '2026-04-30,2026-05-01');
    expect(gw).toBeDefined();
    expect(gw?.result.from).toBe('2026-04-29');
    expect(gw?.result.days).toBe(8);
  });

  it('取る日はすべて平日で、結果は4日以上', () => {
    for (const b of bridges) {
      expect(b.take.length).toBeLessThanOrEqual(2);
      expect(b.result.days).toBeGreaterThanOrEqual(4);
      expect(b.result.days).toBeGreaterThan(b.take.length);
    }
  });
});

describe('labelStreak', () => {
  it('含まれる祝日から通称を推定する', () => {
    const gw = streaksInYear(2026).find((s) => s.from === '2026-05-02');
    expect(labelStreak(gw!)).toBe('ゴールデンウィーク');
    const newYear = streaksInYear(2027).find((s) => s.from === '2027-01-01');
    expect(labelStreak(newYear!)).toBe('年末年始');
  });

  it('通称が無ければ月で呼ぶ', () => {
    expect(labelStreak({ from: '2026-07-18', to: '2026-07-20', days: 3, holidays: [] })).toBe(
      '7月の連休',
    );
  });
});

describe('yearStats', () => {
  it('2026年の祝日数と休日数が妥当な範囲', () => {
    const stats = yearStats(2026);
    expect(stats.holidays).toBeGreaterThanOrEqual(16);
    expect(stats.holidays).toBeLessThanOrEqual(20);
    expect(stats.offDays).toBeGreaterThanOrEqual(110);
    expect(stats.offDays).toBeLessThanOrEqual(130);
    expect(stats.longest?.days).toBeGreaterThanOrEqual(5);
  });
});
