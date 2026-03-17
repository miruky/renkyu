import { describe, expect, it } from 'vitest';
import { holidaysToIcs } from './ics';
import type { Holiday } from './holiday';

const holidays: Holiday[] = [
  { date: '2026-01-01', name: '元日' },
  { date: '2026-05-04', name: 'みどりの日' },
];

const now = new Date('2026-06-20T00:00:00Z');

describe('holidaysToIcs', () => {
  it('VCALENDARの骨格を持つ', () => {
    const ics = holidaysToIcs(holidays, { year: 2026, now });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('X-WR-CALNAME:日本の祝日 2026');
  });

  it('祝日ごとに終日VEVENTを書く', () => {
    const ics = holidaysToIcs(holidays, { year: 2026, now });
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260101');
    // 終日イベントのDTENDは翌日
    expect(ics).toContain('DTEND;VALUE=DATE:20260102');
    expect(ics).toContain('SUMMARY:元日');
    expect(ics).toContain('UID:20260101-renkyu@miruky.github.io');
  });

  it('DTSTAMPはUTCのZ形式', () => {
    expect(holidaysToIcs(holidays, { year: 2026, now })).toContain('DTSTAMP:20260620T000000Z');
  });

  it('CRLF区切りで終端にも改行を付ける', () => {
    const ics = holidaysToIcs(holidays, { year: 2026, now });
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.includes('\r\n')).toBe(true);
  });

  it('SUMMARYの特殊文字をエスケープする', () => {
    const ics = holidaysToIcs([{ date: '2026-07-20', name: '海の日; 振替, 注' }], {
      year: 2026,
      now,
    });
    expect(ics).toContain('SUMMARY:海の日\\; 振替\\, 注');
  });

  it('祝日0件でもVCALENDARは成り立つ', () => {
    const ics = holidaysToIcs([], { year: 2026, now });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
