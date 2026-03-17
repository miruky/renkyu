# renkyu

[![CI](https://github.com/miruky/renkyu/actions/workflows/ci.yml/badge.svg)](https://github.com/miruky/renkyu/actions/workflows/ci.yml)
[![Deploy](https://github.com/miruky/renkyu/actions/workflows/deploy.yml/badge.svg)](https://github.com/miruky/renkyu/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**祝日と連休が一目でわかる年間カレンダー。有給を何日どこに置くと連休が伸びるかまで教える**

公開ページ: https://miruky.github.io/renkyu/

## 概要

renkyuは、1年分のカレンダーを12か月まとめて表示し、祝日・土日・3連休以上の並びを色で示すWebアプリである。祝日データは内閣府が公開する「国民の祝日」CSV(1955年〜)をそのまま使い、振替休日や国民の休日も含めて推測なしで答える。年はURLに保存されるので、来年のカレンダーをそのまま共有できる。

カレンダーの脇には、その年の3連休以上の一覧と「有給の橋渡し提案」が並ぶ。提案は、休みの並びの間に挟まった平日が2日以内のとき、そこを取ると何連休になるかを計算したもので、たとえば2026年は1/2(金)を1日取ると元日から4連休、4/30と5/1を取るとゴールデンウィークが8連休になる、と出る。

### なぜ作ったのか

旅行や帰省の計画はたいてい「次の連休はいつで、何日休めるのか」から始まるが、普通のカレンダーは祝日に色が付くだけで、並びまでは読み取りにくい。祝日一覧のサイトはあっても、年をまたぐ年末年始の連休や、有給1日で化ける飛び石連休までまとめて見せてくれるものが見当たらなかったので、その計算を主役にしたカレンダーを作った。

## アーキテクチャ

![renkyuのアーキテクチャ図](docs/architecture.svg)

## 技術スタック

| カテゴリ             | 技術                                         |
| :------------------- | :------------------------------------------- |
| 言語                 | TypeScript 5(strict、ライブラリ部は依存ゼロ) |
| 祝日データ           | 内閣府「国民の祝日」CSV(Shift_JIS)を前処理   |
| ビルド               | Vite 6                                       |
| テスト               | Vitest                                       |
| リンタ・フォーマッタ | ESLint(typescript-eslint)+ Prettier          |
| CI / 配信            | GitHub Actions / GitHub Pages                |

## 使い方

ページを開くと今年のカレンダーが出る。年の切り替えはヘッダーの矢印ボタンか、キーボードの左右キー。表示中の年はURL(`?year=2027`)に残る。

- 祝日のマスはアクセント色で塗られ、ホバーすると名称が出る
- 3連休以上に含まれる日はうっすら帯が掛かる
- 右の「3連休以上」には期間・日数・通称(ゴールデンウィーク、シルバーウィーク、年末年始)が並ぶ
- 「有給でつなぐと」には、平日を1〜2日取ったときに生まれる4連休以上が並ぶ

ライブラリ部(`src/lib/`)はUIから独立しており、そのまま関数として使える。

```ts
import { streaksInYear, bridgesInYear, yearStats } from './lib/streak';

streaksInYear(2026);
// [{ from: '2026-01-10', to: '2026-01-12', days: 3, holidays: [{ date: '2026-01-12', name: '成人の日' }] }, ...]

bridgesInYear(2026)[0];
// { take: ['2026-01-02'], result: { from: '2026-01-01', to: '2026-01-04', days: 4, ... } }

yearStats(2026);
// { holidays: 18, offDays: 121, longest: { from: '2026-05-02', to: '2026-05-06', days: 5, ... } }
```

### 祝日データの更新

内閣府CSVは毎年2月ごろに翌年分が追加される。次で再生成して差分をコミットする。

```bash
npm run update-holidays
```

## プロジェクト構成

- `src/lib/` — 依存ゼロのロジック
  - `data/holidays.ts` — 生成された祝日データ(1955〜)
  - `date.ts` — ISO文字列ベースの暦計算(曜日・月の行列・日付の加算)
  - `holiday.ts` — 祝日と休日の照会
  - `streak.ts` — 連休の検出・橋渡し提案・年間統計
- `src/main.ts` / `src/style.css` / `index.html` — カレンダーUI
- `scripts/update-holidays.mjs` — 内閣府CSVからのデータ生成
- `docs/` — アーキテクチャ図・ロゴ

## はじめ方

### 前提条件

Node.js 22以降。

### セットアップ

```bash
git clone https://github.com/miruky/renkyu.git
cd renkyu
npm ci
npm run dev
```

### テストの実行

```bash
npm test
```

### Lintの実行

```bash
npm run lint
```

### デプロイ

mainへのpushで `deploy.yml` がGitHub Pagesへ公開する。サブパス配信のため `RENKYU_BASE=/renkyu/` をビルド時に渡している。

## 設計方針

- **祝日は計算せずデータで持つ** — 春分・秋分は天文計算、ハッピーマンデーは法改正で動く。自前の計算は将来の改正で静かに壊れるので、内閣府の一次データだけを信じ、収録範囲(1955〜収録末年)の外は答えない。
- **日付はISO文字列のまま扱う** — タイムゾーンに影響されるDateの比較を避け、`YYYY-MM-DD` の辞書順比較で全ロジックを組む。Dateは曜日計算のUTC固定でのみ使う。
- **連休は窓を広げて数える** — 年末年始は年をまたぐので、検出は前年12月15日〜翌年1月15日まで走査してから対象年に掛かるものだけを残す。
- **提案は控えめに** — 橋渡し提案は平日2日以内・結果4連休以上に絞り、「3日取れば9連休」のような実現しにくい案で一覧を埋めない。

## ライセンス

コードは [MIT](LICENSE)。祝日データの出典は内閣府「国民の祝日について」。
