import { describe, expect, it } from 'vitest';
import { isThemePref, nextPref, prefLabel, readPref, savePref, type ThemePref } from './theme';

function store(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe('isThemePref', () => {
  it('既知の値だけ受け入れる', () => {
    expect(isThemePref('system')).toBe(true);
    expect(isThemePref('dark')).toBe(true);
    expect(isThemePref('sepia')).toBe(false);
    expect(isThemePref(null)).toBe(false);
  });
});

describe('readPref / savePref', () => {
  it('未設定・不正はsystem', () => {
    expect(readPref(store())).toBe('system');
    expect(readPref(store({ 'renkyu-theme': 'x' }))).toBe('system');
  });

  it('保存して読み戻せる', () => {
    const s = store();
    savePref(s, 'dark');
    expect(readPref(s)).toBe('dark');
  });

  it('例外でも既定へ倒し投げない', () => {
    expect(
      readPref({
        getItem() {
          throw new Error('x');
        },
      }),
    ).toBe('system');
    expect(() =>
      savePref(
        {
          setItem() {
            throw new Error('x');
          },
        },
        'light',
      ),
    ).not.toThrow();
  });
});

describe('nextPref', () => {
  it('system→light→dark→systemで巡回', () => {
    const seen: ThemePref[] = [];
    let p: ThemePref = 'system';
    for (let i = 0; i < 4; i++) {
      seen.push(p);
      p = nextPref(p);
    }
    expect(seen).toEqual(['system', 'light', 'dark', 'system']);
  });
});

describe('prefLabel', () => {
  it('選好ごとの日本語', () => {
    expect(prefLabel('system')).toContain('端末');
    expect(prefLabel('dark')).toContain('ダーク');
  });
});
