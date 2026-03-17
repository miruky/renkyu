import './style.css';
import { dayOfWeek, monthMatrix, parseIso, toIso } from './lib/date';
import { coverage, holidayName } from './lib/holiday';
import { bridgesInYear, labelStreak, streaksInYear, yearStats, type Streak } from './lib/streak';
import { nextPref, prefLabel, readPref, savePref, type ThemePref } from './lib/theme';

const THEME_ICONS: Record<ThemePref, string> = {
  system: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor"/></svg>`,
  light: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.7"/><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7"/></g></svg>`,
  dark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.8A8.4 8.4 0 0 1 9.2 3.5 7.6 7.6 0 1 0 20.5 14.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const range = coverage();
const today = (() => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
})();

const yearLabel = document.getElementById('year-label') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;
const calendarEl = document.getElementById('calendar') as HTMLElement;
const streaksEl = document.getElementById('streaks') as HTMLElement;
const bridgesEl = document.getElementById('bridges') as HTMLElement;

function clampYear(y: number): number {
  return Math.max(range.from, Math.min(range.to, y));
}

let year = clampYear(
  Number.parseInt(new URLSearchParams(location.search).get('year') ?? '', 10) ||
    parseIso(today).year,
);

function fmt(iso: string): string {
  const { month, day } = parseIso(iso);
  return `${month}/${day}(${WEEKDAYS[dayOfWeek(iso)]})`;
}

function fmtRange(s: Streak): string {
  return `${fmt(s.from)}〜${fmt(s.to)}`;
}

function renderStats(): void {
  const stats = yearStats(year);
  const longest =
    stats.longest === null ? '-' : `${stats.longest.days}連休(${fmtRange(stats.longest)})`;
  statsEl.innerHTML = [
    `<div class="stat"><span class="num">${stats.holidays}</span><span class="cap">祝日</span></div>`,
    `<div class="stat"><span class="num">${stats.offDays}</span><span class="cap">土日祝の休み</span></div>`,
    `<div class="stat"><span class="wide">${longest}</span><span class="cap">最長の連休</span></div>`,
  ].join('');
}

function renderCalendar(): void {
  const inStreak = new Set<string>();
  for (const s of streaksInYear(year, 3)) {
    for (const w of monthsOf(s)) inStreak.add(w);
  }
  const months: string[] = [];
  for (let m = 1; m <= 12; m += 1) {
    const weeks = monthMatrix(year, m);
    const head = WEEKDAYS.map((w, i) => {
      const cls = i === 0 ? ' class="sun"' : i === 6 ? ' class="sat"' : '';
      return `<th scope="col"${cls}>${w}</th>`;
    }).join('');
    const body = weeks
      .map(
        (week) =>
          `<tr>${week
            .map((iso) => {
              if (iso === null) return '<td></td>';
              const name = holidayName(iso);
              const dow = dayOfWeek(iso);
              const cls = [
                name !== null ? 'holiday' : dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
                inStreak.has(iso) ? 'streak' : '',
                iso === today ? 'today' : '',
              ]
                .filter((c) => c !== '')
                .join(' ');
              const title = name !== null ? ` title="${name}"` : '';
              return `<td${cls === '' ? '' : ` class="${cls}"`}${title}>${parseIso(iso).day}</td>`;
            })
            .join('')}</tr>`,
      )
      .join('');
    months.push(
      `<section class="month" style="--m:${m}" aria-label="${year}年${m}月">` +
        `<h3>${m}月</h3>` +
        `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>` +
        `</section>`,
    );
  }
  calendarEl.innerHTML = months.join('');
}

function monthsOf(s: Streak): string[] {
  const days: string[] = [];
  for (let d = s.from; d <= s.to; d = nextDay(d)) days.push(d);
  return days;
}

function nextDay(iso: string): string {
  const { year: y, month, day } = parseIso(iso);
  const date = new Date(Date.UTC(y, month - 1, day + 1));
  return toIso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function renderStreaks(): void {
  const streaks = streaksInYear(year, 3);
  if (streaks.length === 0) {
    streaksEl.innerHTML = '<li class="empty">3連休以上はない</li>';
    return;
  }
  streaksEl.innerHTML = streaks
    .map((s, i) => {
      const names = s.holidays.map((h) => h.name).join('・');
      return (
        `<li style="--i:${i}">` +
        `<span class="days">${s.days}<small>連休</small></span>` +
        `<span class="range">${fmtRange(s)}<small>${labelStreak(s)}${names === '' ? '' : ` / ${names}`}</small></span>` +
        `</li>`
      );
    })
    .join('');
}

function renderBridges(): void {
  const bridges = bridgesInYear(year).filter((b) => b.result.days >= b.take.length + 3);
  if (bridges.length === 0) {
    bridgesEl.innerHTML = '<li class="empty">提案できる組み合わせがない</li>';
    return;
  }
  bridgesEl.innerHTML = bridges
    .map((b, i) => {
      const takes = b.take.map(fmt).join('と');
      return (
        `<li style="--i:${i}">` +
        `<span class="days">${b.result.days}<small>連休</small></span>` +
        `<span class="range">${takes}を取る<small>${fmtRange(b.result)}</small></span>` +
        `</li>`
      );
    })
    .join('');
}

function render(): void {
  yearLabel.textContent = `${year}年`;
  (document.getElementById('prev-year') as HTMLButtonElement).disabled = year <= range.from;
  (document.getElementById('next-year') as HTMLButtonElement).disabled = year >= range.to;
  renderStats();
  renderCalendar();
  renderStreaks();
  renderBridges();
  const query = year === parseIso(today).year ? location.pathname : `?year=${year}`;
  history.replaceState(null, '', query);
}

function setYear(y: number): void {
  const clamped = clampYear(y);
  if (clamped === year) return;
  year = clamped;
  render();
}

document.getElementById('prev-year')?.addEventListener('click', () => setYear(year - 1));
document.getElementById('next-year')?.addEventListener('click', () => setYear(year + 1));
document
  .getElementById('this-year')
  ?.addEventListener('click', () => setYear(parseIso(today).year));
document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLElement && /^(input|select|textarea)$/i.test(e.target.tagName))
    return;
  if (e.key === 'ArrowLeft') setYear(year - 1);
  if (e.key === 'ArrowRight') setYear(year + 1);
});

// テーマ切替(system → light → dark を巡回)。data-theme属性で見た目が決まる。
const themeBtn = document.getElementById('theme-toggle') as HTMLButtonElement;
let themePref = readPref(localStorage);
function applyThemePref(pref: ThemePref): void {
  document.documentElement.dataset.theme = pref;
  themeBtn.innerHTML = THEME_ICONS[pref];
  themeBtn.setAttribute('aria-label', `テーマ: ${prefLabel(pref)}(切り替え)`);
  themeBtn.title = `テーマ: ${prefLabel(pref)}`;
}
applyThemePref(themePref);
themeBtn.addEventListener('click', () => {
  themePref = nextPref(themePref);
  savePref(localStorage, themePref);
  applyThemePref(themePref);
});

render();
