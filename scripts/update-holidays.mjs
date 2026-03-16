// 内閣府の「国民の祝日」CSVを取得し、src/lib/data/holidays.ts を生成する。
// 出典: https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
// CSVはShift_JISなのでTextDecoderで読み替える。

import { mkdirSync, writeFileSync } from 'node:fs';

const SOURCE_URL = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv';

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`CSVの取得に失敗した: ${response.status}`);
}
const csv = new TextDecoder('shift_jis').decode(await response.arrayBuffer());

const entries = [];
for (const line of csv.split(/\r?\n/).slice(1)) {
  if (line.trim() === '') continue;
  const [rawDate, rawName] = line.split(',');
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(rawDate ?? '');
  if (!match || !rawName) {
    throw new Error(`想定外の行がある: ${line}`);
  }
  const iso = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  entries.push([iso, rawName.trim()]);
}

entries.sort((a, b) => (a[0] < b[0] ? -1 : 1));

const body = entries.map(([date, name]) => `  ['${date}', '${name}'],`).join('\n');
const source = `// 内閣府「国民の祝日」CSVから生成したデータ。手で編集しない。
// 再生成: npm run update-holidays
// 出典: ${SOURCE_URL}

export const HOLIDAYS: ReadonlyArray<readonly [string, string]> = [
${body}
];
`;

mkdirSync('src/lib/data', { recursive: true });
writeFileSync('src/lib/data/holidays.ts', source);
console.log(`${entries.length}件 (${entries[0][0]} 〜 ${entries[entries.length - 1][0]})`);
