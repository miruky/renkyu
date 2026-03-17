// 祝日をiCalendar(RFC5545)の終日イベントへ書き出す。カレンダーアプリに取り込める。
// 祝日名は短いため75オクテットの折返しは不要。純粋関数のみ。

import { addDays } from './date';
import type { Holiday } from './holiday';

function compact(iso: string): string {
  return iso.replace(/-/g, '');
}

// RFC5545のTEXT値はバックスラッシュ・セミコロン・カンマ・改行をエスケープする。
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function stamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export interface IcsOptions {
  year: number;
  now?: Date;
}

export function holidaysToIcs(holidays: Holiday[], opts: IcsOptions): string {
  const dtstamp = stamp(opts.now ?? new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//renkyu//holidays//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:日本の祝日 ${opts.year}`,
  ];
  for (const h of holidays) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${compact(h.date)}-renkyu@miruky.github.io`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(h.date)}`,
      // 終日イベントのDTENDは翌日(排他的)を指す
      `DTEND;VALUE=DATE:${compact(addDays(h.date, 1))}`,
      `SUMMARY:${escapeText(h.name)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
