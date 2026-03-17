// 配色テーマの選好を解決して保存する。表示はdata-theme属性で決まり、
// systemのときだけ端末のprefers-color-schemeに従う。DOMには触れない純粋関数。

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'renkyu-theme';
const ORDER: readonly ThemePref[] = ['system', 'light', 'dark'];

export function isThemePref(value: unknown): value is ThemePref {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readPref(storage: Pick<Storage, 'getItem'>): ThemePref {
  try {
    const raw = storage.getItem(KEY);
    return isThemePref(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function savePref(storage: Pick<Storage, 'setItem'>, pref: ThemePref): void {
  try {
    storage.setItem(KEY, pref);
  } catch {
    // 保存できない環境でも表示は続けられるので握り潰す。
  }
}

export function nextPref(pref: ThemePref): ThemePref {
  return ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length] ?? 'system';
}

const LABELS: Record<ThemePref, string> = {
  system: '端末の設定に合わせる',
  light: 'ライトに固定',
  dark: 'ダークに固定',
};

export function prefLabel(pref: ThemePref): string {
  return LABELS[pref];
}
