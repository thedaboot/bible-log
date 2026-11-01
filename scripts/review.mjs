// 각색 목록(감수 2층, docs/design.md "감수"): 스테이지마다 본문에 없는 것을 docs/review/<스테이지>.md로 뽑는다.
// 장절 없는 대사, 막간(선택지와 자라는 열매 포함), 짧은 인사, 도감 메모, 닮은 인물 문장. 실행: npm run review
import { mkdirSync, writeFileSync } from 'node:fs';
import { EDEN, FALL, RIVERS, NAMING, INTERLUDE, EVE_GREETING } from '../src/data/eden.js';
import { CAIN, CAIN_INTERLUDE, CAIN_GREETING } from '../src/data/cain.js';
import { CODEX, LIKENESS } from '../src/data/codex.js';
import { SPIRIT, SPIRIT_STAGES } from '../src/data/growth.js';
import { CHAPTERS } from '../src/data/chapters.js';
import { SPEAKERS } from '../src/text.js';

// shortcut: 스테이지 데이터를 손으로 이어 둔다. 스테이지가 늘면 장 목록(chapters.js)에서 데이터를 찾게 바꾼다.
const STAGES = {
  eden: {
    lines: { ...Object.fromEntries(Object.entries(EDEN).map(([k, v]) => [`EDEN.${k}`, v])), ...Object.fromEntries(Object.entries(FALL).map(([k, v]) => [`FALL.${k}`, v])), ...Object.fromEntries(RIVERS.map((r) => [`RIVERS.${r.id}`, r.lines])), NAMING },
    interludes: [INTERLUDE],
    greetings: { EVE_GREETING },
  },
  cain: {
    lines: Object.fromEntries(Object.entries(CAIN).map(([k, v]) => [`CAIN.${k}`, v])),
    interludes: [CAIN_INTERLUDE],
    greetings: { CAIN_GREETING },
  },
};

const who = (w) => SPEAKERS[w] || '서술';
const one = (s) => s.replaceAll('\n', ' / ');
const fruit = (id) => SPIRIT.find((f) => f.id === id).name;
const line = (l) => `- [ ] **${who(l.who)}**: ${one(l.text)}${l.basis ? ` _(근거: ${l.basis})_` : ''}`;

for (const [id, st] of Object.entries(STAGES)) {
  const ch = CHAPTERS.find((c) => c.id === id);
  const out = [`# 각색 목록: ${ch.title} (${ch.range})`, '', `\`npm run review\`가 만든 파일이다. 직접 고치지 말고 데이터(src/data/)를 고친 뒤 다시 뽑는다. 확인한 줄은 [x]로 바꿔 둔다.`, ''];

  out.push('## 장절 없는 대사', '', '연출 대사(ref: null)다. 본문의 뜻을 넘어서지 않는지 본다.', '');
  for (const [where, lines] of Object.entries(st.lines)) {
    for (const l of lines.filter((x) => x.ref === null)) out.push(`${line(l)} \`${where}\``);
  }

  for (const it of st.interludes) {
    out.push('', `## 막간: ${who(it.who)}`, '', '사건의 흐름을 바꾸지 않는지, 선택지가 모두 좋은 행동인지, 자라는 열매가 맞는지 본다.', '');
    let pick = 0;
    it.steps.forEach((step) => {
      if (step.say) { for (const l of step.say) out.push(line(l)); return; }
      out.push('', `**선택 ${++pick}**`, '');
      for (const c of step.choose) {
        const need = c.need ? ` · ${Object.entries(c.need).map(([f, s]) => `${fruit(f)} ${SPIRIT_STAGES[s]} 이상에서 열림`).join(', ')}` : '';
        out.push(`- [ ] 「${c.text}」 → ${fruit(c.fruit)}${need}`);
        for (const l of c.reply) out.push(`  ${line(l)}`);
      }
      out.push('');
    });
  }

  out.push('', '## 짧은 인사', '');
  for (const [where, lines] of Object.entries(st.greetings)) for (const l of lines) out.push(`${line(l)} \`${where}\``);

  out.push('', '## 도감 메모', '', '본문 사실(fact·ref)은 장절과 맞는지, 관찰자 메모(memo)는 본문을 넘어서지 않는지 본다.', '');
  for (const c of CODEX.filter((x) => x.stage === id)) out.push(`- [ ] **${c.name}** (${c.ref}) ${c.fact} — 메모: ${c.memo}`);

  const people = Object.entries(LIKENESS).filter(([w]) => CODEX.some((c) => c.id === `person/${w}` && c.stage === id));
  if (people.length) {
    out.push('', '## 닮은 인물', '', '긍정형인지, 두 열매와 근거가 맞는지 본다.', '');
    for (const [w, l] of people) out.push(`- [ ] **${CODEX.find((c) => c.id === `person/${w}`).name}** (${l.fruits.map(fruit).join(', ')}): ${l.text} _(근거: ${l.why})_`);
  }

  mkdirSync('docs/review', { recursive: true });
  writeFileSync(`docs/review/${id}.md`, `${out.join('\n')}\n`);
  console.log(`docs/review/${id}.md: ${out.filter((x) => x.includes('- [ ]')).length}개 항목`);
}
