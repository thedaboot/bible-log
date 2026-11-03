// 도감 그림 점검: node dev/art-check.mjs
import { CODEX } from '../src/data/codex.js';
import { CODEX_ROWS, CODEX_ART } from '../src/codex-art.js';

const bad = [];
for (const e of CODEX) {
  const rows = CODEX_ROWS[e.id];
  if (!rows) { bad.push(`${e.id}: 그림 없음`); continue; }
  if (rows.length !== 16) bad.push(`${e.id}: ${rows.length}줄`);
  rows.forEach((r, i) => {
    if (r.length !== 16) bad.push(`${e.id} ${i}행: ${r.length}칸`);
    if (/[^.oglbdvwsrk]/.test(r)) bad.push(`${e.id} ${i}행: 정해지지 않은 글자 ${r}`);
  });
}
const extra = Object.keys(CODEX_ROWS).filter((id) => !CODEX.some((e) => e.id === id));
if (extra.length) bad.push(`CODEX에 없는 그림: ${extra.join(', ')}`);
console.log(`CODEX ${CODEX.length}개, 그림 ${Object.keys(CODEX_ART).length}개`);
console.log(bad.length ? bad.join('\n') : '문제 없음');
process.exit(bad.length ? 1 : 0);
