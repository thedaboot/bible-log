// 대사 데이터, 저장·이어하기, 이름 처리, 하늘 계산을 점검한다. 실행: npm run check
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PROLOGUE } from '../src/data/prologue.js';
import { CREATION, DAY_NAMES } from '../src/data/creation.js';
import { EDEN, FALL, RIVERS, ANIMALS, FRUITS, QUIZ, INTERLUDE, EVE_GREETING } from '../src/data/eden.js';
import { CODEX, CODEX_TABS, LIKENESS } from '../src/data/codex.js';
import { CAIN, CAIN_QUIZ, CAIN_INTERLUDE, CAIN_GREETING, FLOCK } from '../src/data/cain.js';
import { SPEAKERS, vocative, fill, withRa } from '../src/text.js';
import { readFileSync, readdirSync } from 'node:fs';
import { makeEden, collide, EDEN_RADIUS, EDEN_START, RIVER_SEGMENTS, BRIDGES, STAGES, inFrontOfScene, stepAsideSpots, crossesRiver } from '../src/eden.js';
import { load, save, reach, newState, openNext, cleanResume } from '../src/save.js';
import { makeCain, collide as cainCollide, stepAsideSpots as cainAside, STAGES as CAIN_STAGES } from '../src/cain.js';
import { makeCreation, skyState } from '../src/creation.js';
import { DEFAULT_LOOK, DEFAULT_EARTH, LOOK, LOOK_TABS } from '../src/props.js';
import { CHAPTERS, CHECKPOINTS, WORLDS } from '../src/data/chapters.js';
import { layout } from '../src/map.js';
import { SPIRIT, SPIRIT_STAGES, STAGE_AT, SPIRIT_GAIN, TITLES, REWARDS, slotsAt, PLAN, MAX_LEVEL, CHALLENGE } from '../src/data/growth.js';
import { grant, grow, bond, levelOf, stageOf, likeness, codexState, choiceOpen, chooseFruit, ownsLook, looksOpened, addTool, useTool, canHold, buyLook, codexDone } from '../src/growth.js';
import { ITEMS, STYLES, SHOP, SLOT_KEY, slotOf } from '../src/data/items.js';
import { ITEM_ICONS, HAIR_ICONS } from '../src/icons.js';
import { STAGE_MODS } from '../src/stages/index.js';
import { pagesOf, MAX_LINES, BOUND, NUMERAL } from '../src/ui.js';

const MODS = Object.values(STAGE_MODS);
// 스테이지 데이터의 대사 묶음과 막간(steps를 [위치, 대사] 목록으로 펼친다)
const stepsLines = (name, it) => it.steps.flatMap((st, i) => (st.say ? [[`${name}.steps[${i}]`, st.say]] : st.choose.map((c, j) => [`${name}.steps[${i}].choose[${j}]`, c.reply])));

// 대사 묶음을 [위치, 대사 배열] 목록으로 모은다.
const groups = [
  ...Object.entries(PROLOGUE).map(([k, v]) => [`PROLOGUE.${k}`, v]),
  ['CREATION.start', CREATION.start],
  ...Object.entries(EDEN).map(([k, v]) => [`EDEN.${k}`, v]),
  ...Object.entries(FALL).map(([k, v]) => [`FALL.${k}`, v]),
  ...RIVERS.map((r) => [`RIVERS.${r.id}`, r.lines]),
  ...INTERLUDE.steps.flatMap((st, i) => (st.say ? [[`INTERLUDE.steps[${i}]`, st.say]] : st.choose.map((c, j) => [`INTERLUDE.steps[${i}].choose[${j}]`, c.reply]))),
  ['EVE_GREETING', EVE_GREETING],
  ...Object.entries(CAIN).map(([k, v]) => [`CAIN.${k}`, v]),
  ...CAIN_INTERLUDE.steps.flatMap((st, i) => (st.say ? [[`CAIN_INTERLUDE.steps[${i}]`, st.say]] : st.choose.map((c, j) => [`CAIN_INTERLUDE.steps[${i}].choose[${j}]`, c.reply]))),
  ['CAIN_GREETING', CAIN_GREETING],
  ...MODS.flatMap(({ id, data }) => [
    ...Object.entries(data.lines).map(([k, v]) => [`${id}.${k}`, v]),
    ...stepsLines(`${id}.interlude`, data.interlude),
    ...(data.deep ? [...stepsLines(`${id}.deep`, data.deep), [`${id}.deep.locked`, data.deep.locked]] : []),
    ...Object.entries(data.greetings ?? {}).map(([k, v]) => [`${id}.${k}`, v]),
  ]),
];
const { acts } = makeCreation({ background: new THREE.Color() });
for (let day = 1; day <= 7; day++) {
  assert.ok(DAY_NAMES[day], `DAY_NAMES[${day}] 없음`);
  for (const [i, step] of CREATION.days[day].entries()) {
    const at = `CREATION.days[${day}][${i}]`;
    assert.ok(step.say || step.act, `${at}: say나 act가 필요함`);
    if (step.say) groups.push([at, step.say]);
    if (step.act) assert.equal(typeof acts[step.act], 'function', `${at}: 없는 연출 ${step.act}`);
  }
}

const REF = /^[가-힣]+ \d+:\d+(~\d+)?$/; // 예: '창 1:1', '창 2:10~14'

// 줄바꿈 2판(docs/standards/dialogue.md). 한 줄 기준 36자, 이름은 3글자로 센다.
const LINE = 36, TAIL = 12;
// 문장부호(. , ? ! …)는 세지 않는다. 표준 문서의 36자 예시가 이 기준이다.
const len = (s) => s.replaceAll('{nameVoc}', '이름이야').replaceAll('{name}', '이름이').replace(/[.,?!…]/g, '').length;
function wrapErrors(text) {
  const errs = [];
  if (text.split('\n').length > 2) errs.push('대사는 두 줄까지(대사 창 높이)');
  if (len(text.replaceAll('\n', ' ')) <= LINE) return text.includes('\n') ? ['36자 이하는 한 줄로 둔다'] : [];
  // 문장 단위로 나누고, 문장 사이 구분자(공백/줄바꿈)를 기억한다.
  const parts = text.split(/(?<=[.?!…])([ \n])/);
  const sentences = parts.filter((_, i) => i % 2 === 0);
  const seps = parts.filter((_, i) => i % 2 === 1);
  if (sentences.length > 1 && !seps.includes('\n')) errs.push('두 문장 이상이 36자를 넘으면 문장 사이에서 줄을 바꾼다');
  for (const s of sentences) {
    const pieces = s.split('\n');
    if (pieces.length === 1) {
      if (len(s) > LINE) errs.push(`36자를 넘는 문장은 의미 단위에서 한 번 가른다: ${s}`);
      continue;
    }
    if (len(s.replace('\n', ' ')) <= LINE) errs.push(`36자 이하 문장은 가르지 않는다: ${s}`);
    if (pieces.length > 2) errs.push(`한 문장은 한 번만 가른다: ${s}`);
    if (pieces.some((p) => len(p) < TAIL)) errs.push(`12자 미만 조각이 생긴다: ${s}`);
  }
  for (const line of text.split('\n')) {
    if (len(line) > LINE && /[.?!…] /.test(line)) errs.push(`36자를 넘는 줄에 문장이 둘 이상이다: ${line}`);
  }
  return errs;
}
// 자체 점검: 표준 문서의 예시가 통과하고 대표 위반이 걸린다.
assert.deepEqual(wrapErrors('여자의 후손이 뱀의 머리를 상하게 한다는 말씀, 꼭 기억해 두세요.\n나중에 다시 만나게 될 약속이에요.'), []);
assert.deepEqual(wrapErrors('여호와 하나님께서 땅과 하늘을 만드시던 날,\n들에는 아직 풀 한 포기 없었고 땅을 일굴 사람도 없었다.'), []);
assert.deepEqual(wrapErrors('하늘에 빛들이 있어 낮과 밤을 나누고, 계절과 날과 해를 이루어라.'), []);
assert.equal(wrapErrors('짧은 문장.\n또 짧은 문장.').length, 1);
assert.equal(wrapErrors('여호와 하나님께서 땅과 하늘을 만드시던 날, 들에는 아직 풀 한 포기 없었고 땅을 일굴 사람도 없었다.').length, 1);
assert.equal(wrapErrors('이제 사람이 손을 뻗어 생명나무 열매까지 따 먹고 영원히 살게 해서는\n안 된다.').length, 1);
let count = 0;
const problems = [];
for (const [where, lines] of groups) {
  for (const [i, l] of lines.entries()) {
    const at = `${where}[${i}]`;
    assert.ok(l.who in SPEAKERS, `${at}: 알 수 없는 화자 ${l.who}`);
    assert.ok(typeof l.text === 'string' && l.text.trim(), `${at}: 빈 대사`);
    assert.ok(l.ref === null || REF.test(l.ref), `${at}: 장절 형식 오류 ${l.ref}`);
    for (const e of wrapErrors(l.text)) problems.push(`${at}: ${e}`);
    // 창 1:1~2:3은 엘로힘, 창 2:4부터는 YHWH(이름표 규칙)
    if (l.ref?.startsWith('창 ') && !l.ref.startsWith('창 1:')) assert.notEqual(l.who, 'elohim', `${at}: 창 2:4 이후는 YHWH`);
    count++;
  }
}
assert.deepEqual(problems, [], '줄바꿈 2판 위반');
// 휴대폰 대사 쪽 나누기(ui.md "대사 창"): 375px 폭 18px 글자(하나님 말씀은 1.1배, 좌우 여백 1.5rem 더)로 셈한 폭에서
// 한 쪽은 두 줄(하나님 말씀 세 줄)까지, 한 대사는 세 쪽까지다. 꾸미는 말·수 관형사와 그 뒤 말 사이에서 줄이 끊기면 안 된다.
// 글자 폭은 근사값이다: 한글 1em, 띄어쓰기 0.28em, 그 밖 0.55em(프리텐다드 실측 비율에 가깝게).
{
  const em = (t) => [...t].reduce((a, c) => a + (/[가-힣]/.test(c) ? 1 : c === ' ' ? 0.28 : 0.55), 0);
  const roomEm = (who) => (who in MAX_LINES ? (375 - 24 - 32 - 48) / (18 * 1.1) - 1.1 : (375 - 24 - 32) / 18 - 1.1);
  const bad = [];
  for (const [where, lines] of groups) for (const [i, l] of lines.entries()) {
    const pages = pagesOf(fill(l.text, { name: '요한' }), roomEm(l.who), em, MAX_LINES[l.who] ?? 2);
    if (pages.length > 3) bad.push(`${where}[${i}]: 휴대폰에서 ${pages.length}쪽(세 쪽까지)`);
    for (const pg of pages) {
      const ls = pg.split('\n');
      for (let k = 1; k < ls.length; k++) {
        const prev = ls[k - 1].split(' ').at(-1), next = ls[k].split(' ')[0];
        if (!/[.?!,…]$/.test(prev) && (NUMERAL.test(prev) || BOUND.test(next))) bad.push(`${where}[${i}]: "${prev} / ${next}"에서 줄이 끊긴다`);
      }
    }
  }
  assert.deepEqual(bad, [], '휴대폰 대사 쪽 나누기');
  assert.deepEqual(pagesOf('그렇지 않다. 가인을 죽이는 자는 일곱 배로 벌을 받을 것이다.', 13, em, 3), ['그렇지 않다.\n가인을 죽이는 자는\n일곱 배로 벌을 받을 것이다.']);
}

assert.equal(RIVERS.length, 4, '강은 네 줄기');
assert.ok(ANIMALS.every((a) => a.name && a.size > 0), '동물 데이터 오류');
for (const [i, q] of [...QUIZ, ...CAIN_QUIZ, ...MODS.flatMap((m) => m.data.quiz)].entries()) {
  assert.ok(q.options[q.answer], `QUIZ[${i}]: 정답 번호 오류`);
  assert.ok(REF.test(q.ref), `QUIZ[${i}]: 장절 형식 오류`);
}
assert.ok(FLOCK.length >= 4 && FLOCK.every((f) => f.id && f.name && f.size > 0), '양 떼 데이터 오류');

assert.equal(vocative('요한'), '요한아');
assert.equal(vocative('지수'), '지수야');
assert.equal(vocative('Joy'), 'Joy');
assert.equal(fill('{nameVoc}, {name}님', { name: '하은' }), '하은아, 하은님');

// 저장: 새 형식, 예전 형식 옮기기, 깨진 값, 이어하기 지점
const mem = new Map();
const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
assert.equal(load(storage), null);
save({ name: '요한', scene: 'creation', seen: ['prologue', 'creation'] }, storage); // 예전 형식
const migrated = load(storage);
assert.equal(migrated.scene, 'creation-1');
assert.deepEqual(migrated.look, DEFAULT_LOOK);
assert.ok(migrated.unlocked.includes('creation-7') && migrated.unlocked.includes('eden'), '예전 저장값 옮기기 오류');
// 첫 방문(저장값 없음): 첫 화면의 '처음부터'는 newState(load())를 부르고, load()는 null을 돌려준다
assert.equal(newState(null).xp, 0, '저장값이 없을 때 newState(null)이 새 상태를 만든다');
const st = newState({ unlocked: ['prologue', 'creation-1'] });
assert.deepEqual(st.unlocked, ['prologue', 'creation-1'], '처음부터를 눌러도 열린 지점은 남는다');
reach(st, 'creation-3');
assert.deepEqual(st.unlocked, ['prologue', 'creation-1', 'creation-3']);
assert.equal(st.scene, 'creation-3');
mem.set('bible-rpg/save/v1', '{깨진 JSON');
assert.equal(load(storage), null);
assert.equal(load(null), null);

// 소품: 제 자리(손·허리·머리, LOOK.earth의 item·waist·head)에 그릴 수 있고, 아이콘이 있고, 장절이 맞다. 꾸미기는 열리는 레벨이 겹치지 않는다.
{
  for (const it of ITEMS) {
    assert.ok(LOOK.earth[SLOT_KEY[slotOf(it)]].some((o) => o.id === it.id && o.name === it.name), `${it.id}: ${slotOf(it)} 자리에 그릴 수 없음`);
    assert.ok(ITEM_ICONS[it.id], `${it.id}: 아이콘 없음`);
    assert.ok(REF.test(it.ref) && it.note, `${it.id}: 장절·설명 오류`);
    assert.ok(['tool', 'look'].includes(it.kind), `${it.id}: 종류 오류`);
  }
  assert.deepEqual(['item', 'waist', 'head'].flatMap((k) => LOOK.earth[k]).filter((o) => o.id !== 'none').map((o) => o.id).sort(), ITEMS.map((i) => i.id).sort(), '소품 세 자리와 물건 목록이 다름');
  const looks = ITEMS.filter((i) => i.kind === 'look');
  const leveled = looks.filter((i) => i.level), sold = looks.filter((i) => i.price);
  assert.ok(looks.every((i) => [i.level, i.price, i.stage].filter(Boolean).length === 1), '꾸미기는 레벨·상점·스테이지 가운데 하나로 얻는다');
  assert.ok(looks.filter((i) => i.stage).every((i) => CHAPTERS.some((c) => c.id === i.stage)), '대표 소품의 스테이지가 없음');
  { const t = newState(); t.claimed.push('noah/clear'); assert.ok(ownsLook(t, 'olive') && !ownsLook(t, 'sheaf'), '스테이지를 마쳐도 대표 소품을 못 받음'); }
  assert.equal(new Set(leveled.map((i) => i.level)).size, leveled.length, '꾸미기 여는 레벨이 겹침');
  assert.ok(leveled.every((i) => i.level >= 2 && i.level <= MAX_LEVEL), '꾸미기 여는 레벨 범위');
  assert.ok(sold.every((i) => Number.isInteger(i.price) && i.price > 0), '상점 가격 오류');

  const s = newState();
  assert.equal(ownsLook(s, 'staff'), false, '레벨 1에서 지팡이가 열림');
  s.xp = 100; // 레벨 3
  assert.ok(ownsLook(s, 'staff') && ownsLook(s, 'bag') && !ownsLook(s, 'hood'));
  assert.deepEqual(looksOpened(1, 3).map((i) => i.id), ['staff', 'bag']);
  assert.ok(!ownsLook(s, 'sling'), '도구를 꾸미기로 셈');
  // 도구: 칸만큼 넣고, 쓰면 사라지고, 손에 든 도구가 떨어지면 맨손
  for (let i = 0; i < slotsAt(levelOf(s.xp).level); i++) assert.ok(addTool(s, 'sling'));
  assert.equal(addTool(s, 'horn'), false, '칸이 찼는데 도구가 들어감');
  s.earthLook = { ...DEFAULT_EARTH, item: 'sling' };
  while (s.items.tools.length > 1) useTool(s, 'sling');
  assert.equal(s.earthLook.item, 'sling', '도구가 남았는데 맨손이 됨');
  useTool(s, 'sling');
  assert.equal(s.earthLook.item, 'none', '도구를 다 썼는데 손에 남음');
  assert.equal(useTool(s, 'sling'), false);
  assert.ok(canHold(s, 'none') && canHold(s, 'staff') && !canHold(s, 'horn'));
  // 상점: 달란트가 모자라면 못 사고, 사면 달란트가 줄고 갖게 되며, 두 번 사지 않는다
  s.talents = 10;
  assert.equal(buyLook(s, 'timbrel'), false, '달란트가 모자란데 삼');
  s.talents = 75;
  assert.ok(buyLook(s, 'timbrel') && s.talents === 15 && ownsLook(s, 'timbrel'));
  assert.equal(buyLook(s, 'timbrel'), false, '같은 꾸미기를 두 번 삼');
  assert.equal(buyLook(s, 'staff'), false, '레벨로 여는 꾸미기를 삼');
  // 도감 완성: 항목 하나가 빠지면 칭호 없음, 다 채우면 한 번만 받고 다시 받지 않는다
  {
    const w = WORLDS[0], c = newState();
    const entries = CODEX.filter((e) => w.stages.includes(e.stage));
    for (const e of entries.slice(1)) c.codex[e.id] = e.stage;
    assert.equal(codexDone(c, w), false, '도감 항목이 빠졌는데 칭호를 받음');
    c.codex[entries[0].id] = entries[0].stage;
    assert.ok(codexDone(c, w), '도감을 다 채웠는데 칭호를 못 받음');
    assert.ok(grant(c, `${w.id}/codex`, REWARDS.codexDone));
    assert.equal(codexDone(c, w), false, '칭호를 두 번 받음');
    assert.equal(grant(c, `${w.id}/codex`, REWARDS.codexDone), null);
  }
  // 도전 난이도: 금빛 구간을 지나는 시간이 씨앗일 때 80~130ms(성공률 절반 안팎, growth.js 주석의 가정)
  {
    const ms = (k) => (CHALLENGE.zone * k / CHALLENGE.speed) * 1000;
    assert.ok(ms(1) >= 80 && ms(1) <= 130, `도전 구간 ${ms(1).toFixed(0)}ms: 씨앗일 때 성공률 절반 안팎이 아님`);
    assert.ok(ms(1 + CHALLENGE.assistMax) < 200, '열매 보조가 커서 도전이 너무 쉬움');
  }
  // 예전 저장값: 고른 꾸미기는 갖게 하고, 고른 도구는 맨손으로
  mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], earthLook: { item: 'scroll' } }));
  const a = load(storage);
  assert.ok(a.earthLook.item === 'scroll' && ownsLook(a, 'scroll'), '예전에 고른 꾸미기를 잃음');
  mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], earthLook: { item: 'horn' } }));
  assert.equal(load(storage).earthLook.item, 'none', '얻지 않은 도구를 손에 듦');
  // 상점 머리·옷(F06): 지상 모습에 같은 id가 있고, 그림·장절·값이 있고, 사기 전에는 갖지 않으며 사면 갖는다
  for (const st of STYLES) {
    assert.ok(LOOK.earth[st.kind].some((o) => o.id === st.id && o.name === st.name), `${st.id}: 지상 ${st.kind}에 없음`);
    assert.ok((st.kind === 'hair' ? HAIR_ICONS : ITEM_ICONS)[st.id] && REF.test(st.ref) && st.price > 0, `${st.id}: 그림·장절·값 오류`);
  }
  for (const o of LOOK.earth.hair) assert.ok(HAIR_ICONS[o.id], `${o.id}: 머리 그림 없음`);
  { const t = newState(); t.talents = 999; assert.ok(!ownsLook(t, 'locks') && buyLook(t, 'locks') && ownsLook(t, 'locks') && t.talents === 879, '상점 머리 사기 오류'); }
  assert.ok(SHOP.every((x, i) => !i || SHOP[i - 1].price <= x.price), '상점 진열이 값 순서가 아님');
  console.log(`OK: 손에 드는 물건 점검 통과(도구 ${ITEMS.length - looks.length}개, 꾸미기 ${looks.length}개)`);
}

// 막간: say와 choose가 번갈아 오고 choose 앞에는 반드시 say가 있다(그 마지막 대사에서 고른다).
// choose마다 기본 선택지 셋(need 없음)과 열매 단계로 열리는 선택지 0~1개. 열매가 모두 다르고, 각색 대사에는 근거(basis)가 있다.
for (const [name, it, greet] of [['INTERLUDE', INTERLUDE, EVE_GREETING], ['CAIN_INTERLUDE', CAIN_INTERLUDE, CAIN_GREETING],
  ...MODS.flatMap(({ id, data }) => [[`${id}.interlude`, data.interlude, Object.values(data.greetings ?? {}).flat()], ...(data.deep ? [[`${id}.deep`, data.deep, data.deep.locked]] : [])])]) {
  const { steps } = it;
  assert.ok(it.who in SPEAKERS, `${name}: 막간 인물`);
  let exchanges = 0;
  for (const [i, st] of steps.entries()) {
    assert.ok(!!st.say !== !!st.choose, `${name}.steps[${i}]: say나 choose 하나만`);
    if (!st.choose) continue;
    assert.ok(steps[i - 1]?.say, `${name}.steps[${i}]: choose 앞에 say가 필요함`);
    const basic = st.choose.filter((c) => !c.need), extra = st.choose.filter((c) => c.need);
    assert.equal(basic.length, 3, `${name}.steps[${i}]: 기본 선택지는 셋`);
    assert.ok(extra.length <= 1, `${name}.steps[${i}]: 열매로 열리는 선택지는 하나까지`);
    assert.equal(new Set(st.choose.map((c) => c.fruit)).size, st.choose.length, `${name}.steps[${i}]: 열매가 겹침`);
    for (const c of st.choose) {
      assert.ok(SPIRIT.some((f) => f.id === c.fruit), `${c.text}: 없는 열매`);
      for (const [id, stage] of Object.entries(c.need ?? {})) assert.ok(SPIRIT.some((f) => f.id === id) && stage >= 1 && stage < SPIRIT_STAGES.length, `${c.text}: need 오류`);
      assert.ok(len(c.text) <= 18, `선택지는 18자 이하(한 줄): ${c.text}`);
      assert.ok(c.reply?.length, `${c.text}: 답이 없음`);
    }
    exchanges++;
  }
  const lines = steps.flatMap((st) => st.say ?? st.choose.flatMap((c) => c.reply));
  for (const l of [...lines, ...greet]) assert.ok(l.ref !== null || l.basis, `근거(basis)가 없는 각색 대사: ${l.text}`);
  // 막간 분량: 주고받기 5~8번(대사 묶음과 선택을 합쳐 센다)
  const turns = steps.length;
  assert.ok(turns >= 5 && turns <= 8, `${name}: 막간 주고받기 ${turns}번`);
}
{
  const { steps } = INTERLUDE;
  // 열매 단계로 열리는 선택지: 처음 에덴(퀘스트 열매만 4점)에서는 닫혀 있고, 새싹이면 열린다
  const s = newState();
  s.spirit.joy = 4;
  const extra = steps[1].choose.find((c) => c.need);
  assert.equal(choiceOpen(s, extra), false);
  s.spirit.joy = 6;
  assert.equal(choiceOpen(s, extra), true);
  // 고른 열매는 한 번만 자라고, 퀘스트 열매와 같으면 새싹이 된다(A안)
  s.spirit.joy = 4;
  assert.deepEqual(chooseFruit(s, 'eden/interlude/1', 'joy'), ['기쁨이 새싹으로 자랐어요']);
  assert.deepEqual(chooseFruit(s, 'eden/interlude/1', 'joy'), [], '같은 막간 선택에서 두 번 자람');
  console.log(`OK: 막간 점검 통과(에덴·가인과 아벨, 에덴 주고받기 ${steps.length}번)`);
}

// 하늘: 한낮엔 별이 없고, 한밤엔 햇빛이 없고, 해돋이엔 노을빛(붉은 기)이 돈다
const noon = skyState(Math.PI / 2);
assert.ok(noon.sun > 1.3 && noon.stars === 0, '한낮 하늘 오류');
// 넷째 날은 한낮에서 시작하므로, 셋째 날까지의 낮하늘(색 0x9fd4f5, 밝기 1.1)과 같아야 끊기지 않는다
assert.ok(noon.bg.equals(new THREE.Color(0x9fd4f5)) && Math.abs(noon.hemi - 1.1) < 1e-9, '넷째 날 시작 하늘이 이전 하늘과 다름');
const midnight = skyState(-Math.PI / 2);
assert.ok(midnight.sun === 0 && midnight.stars === 1, '한밤 하늘 오류');
const sunrise = skyState(0).bg;
assert.ok(sunrise.r > sunrise.b, '해돋이 노을 오류');

// 장 목록: 지점 id가 겹치지 않는다
assert.equal(new Set(CHECKPOINTS).size, CHECKPOINTS.length, '지점 id 중복');
assert.ok(CHAPTERS.every((c) => c.id && c.title && c.range), '장 데이터 오류');
assert.equal(newState().earthLook, null, '지상 모습은 처음 땅에 내려갈 때 고른다');
// 월드: 스테이지는 장 목록에 있고 한 월드에만 한 번 나온다. 천국(프롤로그)은 쉼터라 스테이지가 아니다.
const stageIds = WORLDS.flatMap((w) => w.stages);
assert.equal(new Set(stageIds).size, stageIds.length, '스테이지가 두 번 나옴');
assert.ok(stageIds.every((id) => CHAPTERS.some((c) => c.id === id)) && !stageIds.includes('heaven'), '월드 스테이지 오류');
assert.ok(CHAPTERS.every((c) => c.id === 'heaven' || stageIds.includes(c.id)), '어느 월드에도 없는 장');
// 곁길: 같은 월드에서 앞에 나온 본 스테이지에서 갈라지고, 지도 칸이 다른 표지와 겹치지 않는다
for (const w of WORLDS) {
  w.stages.forEach((id, k) => {
    const side = CHAPTERS.find((c) => c.id === id).side;
    if (!side) return;
    const p = w.stages.indexOf(side);
    assert.ok(p >= 0 && p < k && !CHAPTERS.find((c) => c.id === side).side, `${id}: 곁길이 갈라질 본 스테이지 오류`);
  });
  const cells = layout(w.stages).map((c) => `${c.row}/${c.col}`);
  assert.equal(new Set(cells).size, cells.length, `${w.id}: 지도 표지 자리가 겹침`);
}

// 꾸미기: 기본값이 선택지 안에 있고, 탭이 지상 항목을 빠짐없이 한 번씩 나눈다
for (const [k, v] of Object.entries(DEFAULT_EARTH)) assert.ok(LOOK.earth[k].some((o) => o.id === v), `지상 기본값 ${k}`);
for (const [k, v] of Object.entries(DEFAULT_LOOK)) assert.ok(LOOK.heaven[k].some((o) => o.id === v), `천국 기본값 ${k}`);
// 탭이 지상 항목(소품 세 자리 포함)을 빠짐없이 한 번씩 나눈다
assert.deepEqual(LOOK_TABS.earth.flatMap((t) => t.keys).sort(), Object.keys(LOOK.earth).sort(), '탭 구성 오류');
// 예전 저장값의 손에 든 두건은 머리 자리로 옮긴다
mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], xp: 400, earthLook: { item: 'hood' } }));
{ const h = load(storage).earthLook; assert.ok(h.head === 'hood' && h.item === 'none', '두건을 머리 자리로 옮기지 못함'); }
// 예전 지상 모습(빛깔 하나)은 빛깔을 '나를 감싸는 빛'으로 옮긴다
mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], earthLook: { color: 'rose', hair: 'long' } }));
const old = load(storage);
assert.equal(old.earthLook.aura, 'rose');
assert.equal(old.earthLook.hair, 'long');
assert.equal(old.earthLook.skin, DEFAULT_EARTH.skin);

// 성장 기록: 예전 저장값은 기본값으로 채우고, 깨진 값은 걸러 낸다. 보상은 한 번만 받는다.
{
  mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'] })); // 성장 기록 없는 예전 형식
  const g = load(storage);
  assert.equal(g.xp, 0);
  assert.equal(g.talents, 0);
  assert.deepEqual(Object.keys(g.spirit), SPIRIT.map((s) => s.id), '열매 아홉 가지 기본값');
  assert.ok(Object.values(g.spirit).every((v) => v === 0));
  assert.deepEqual([g.bonds, g.codex, g.items, g.claimed], [{}, {}, { tools: [], looks: [] }, []]);
  mem.set('bible-rpg/save/v1', JSON.stringify({
    name: 'a', scene: 'eden', unlocked: ['prologue'], xp: -5, talents: '많이', spirit: { joy: 7.8, fake: 3 },
    bonds: { adam: 'talked', eve: 'friend' }, codex: { 'creature/lion': 'eden', 'x/y': 'nowhere' }, items: { tools: [1, 'sling'] }, claimed: 'eden/x',
  }));
  const b = load(storage);
  assert.deepEqual([b.xp, b.talents, b.spirit.joy, 'fake' in b.spirit], [0, 0, 7, false], '숫자 정리 오류');
  assert.deepEqual(b.bonds, { adam: 'talked' }, '관계 단계 정리 오류');
  assert.deepEqual(b.codex, { 'creature/lion': 'eden' }, '도감 정리 오류');
  assert.deepEqual([b.items.tools, b.items.looks, b.claimed], [['sling'], [], []], '인벤토리·보상 정리 오류');
  // 처음부터를 눌러도 성장 기록은 남는다
  assert.equal(newState(b).spirit.joy, 7);

  const s = newState();
  assert.deepEqual(grant(s, 'eden/river/pishon', REWARDS.river), []);
  assert.equal(grant(s, 'eden/river/pishon', REWARDS.river), null, '같은 보상을 두 번 받음');
  assert.equal(s.xp, REWARDS.river.xp);
  assert.deepEqual(grant(s, 'eden/rivers-done', REWARDS.riversDone).at(-1), '기쁨이 자랐어요');
  assert.equal(s.spirit.joy, SPIRIT_GAIN.quest);
  // 레벨: 누적 40에서 2, 100에서 3
  assert.deepEqual([levelOf(39).level, levelOf(40).level, levelOf(92).level, levelOf(93).level], [1, 2, 2, 3]);
  assert.equal(levelOf(0).title, TITLES[0].title);
  assert.equal(TITLES[0].level, 1, '첫 칭호는 레벨 1');
  assert.ok(TITLES.every((t, i) => REF.test(t.ref) && (i === 0 || t.level > TITLES[i - 1].level)), '칭호 데이터 오류');
  // 성장 속도(PLAN 가정): 에덴을 마치면 레벨 3~4, 요한계시록에서도 최고 레벨 아래, 마지막 칭호는 끝 무렵에 열린다
  const lvAt = (k) => levelOf(PLAN.xpPerStage * k).level;
  assert.ok(lvAt(1) >= 3 && lvAt(1) <= 4, `에덴 뒤 레벨 ${lvAt(1)}`);
  assert.ok(lvAt(PLAN.stages) < MAX_LEVEL, `끝 레벨 ${lvAt(PLAN.stages)}`);
  // 창세기(15개)를 마치면 레벨 10 이상이고, 레벨 15 꾸미기(두루마리)는 창세기 뒤에 열린다
  assert.ok(lvAt(WORLDS[0].stages.length) >= 10 && lvAt(WORLDS[0].stages.length) < 15, `창세기 끝 레벨 ${lvAt(WORLDS[0].stages.length)}`);
  assert.ok(lvAt(PLAN.stages * 0.8) < TITLES.at(-1).level && lvAt(PLAN.stages) >= TITLES.at(-1).level, '마지막 칭호가 너무 일찍 또는 늦게 열림');
  // 열매: 고르게 키우면 끝까지 결실에 못 이르고, 한 열매를 평균의 두 배로 키워도 결실은 전체의 60% 뒤에 온다
  const avg = (k) => (PLAN.spiritPerStage * k) / SPIRIT.length;
  assert.ok(stageOf(avg(PLAN.stages)) < SPIRIT_STAGES.length - 1, '고른 열매가 결실에 이름');
  assert.ok(stageOf(avg(PLAN.stages * 0.6) * 2) < SPIRIT_STAGES.length - 1, '가장 큰 열매가 너무 일찍 결실에 이름');
  assert.ok(stageOf(avg(PLAN.stages) * 2) === SPIRIT_STAGES.length - 1, '가장 큰 열매가 끝까지 결실에 못 이름');
  // 열매 단계와 알림
  assert.deepEqual([0, 4, 5, 30, 89, 90, 200, 999].map(stageOf), [0, 0, 1, 2, 2, 3, 4, 4]);
  s.spirit.patience = 3;
  assert.deepEqual(grow(s, 'patience', 2), ['인내가 새싹으로 자랐어요']);
  // 관계는 오르기만 하고, 동행에 이르면 열매가 자란다
  assert.deepEqual(bond(s, 'adam', 'talked'), ['아담과 마음을 나눴어요']);
  assert.deepEqual(bond(s, 'adam', 'met'), [], '관계가 내려감');
  assert.equal(bond(s, 'adam', 'walked', 'love').length, 2);
  assert.equal(s.spirit.love, SPIRIT_GAIN.walk);
  // 보상의 열매 id와 수치
  for (const [k, r] of Object.entries(REWARDS)) {
    assert.ok(!r.spirit || SPIRIT.some((x) => x.id === r.spirit), `REWARDS.${k}: 없는 열매 ${r.spirit}`);
    assert.ok((r.xp ?? 0) >= 0 && (r.talent ?? 0) >= 0, `REWARDS.${k}: 음수`);
  }
  assert.equal(STAGE_AT.length, SPIRIT_STAGES.length);
  assert.equal(slotsAt(1), 4);
  console.log('OK: 성장 기록 점검 통과(예전 저장값 옮기기, 보상 한 번, 레벨·열매 단계·관계)');
}

// 도감: 항목 id가 겹치지 않고, 분류는 다섯 가지 안이며, 게임이 기록하는 항목(동물·열매나무·강·인물)이 모두 도감에 있다.
{
  const ids = CODEX.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, '도감 id 중복');
  for (const c of CODEX) {
    assert.ok(CODEX_TABS.some((t) => c.id.startsWith(`${t.id}/`)), `${c.id}: 없는 분류`);
    assert.ok(CHAPTERS.some((ch) => ch.id === c.stage), `${c.id}: 없는 스테이지 ${c.stage}`);
    assert.ok(c.name && c.fact && c.memo, `${c.id}: 이름·사실·메모가 필요함`);
    assert.ok(REF.test(c.ref), `${c.id}: 장절 형식 오류 ${c.ref}`);
    assert.ok(!c.fact.includes('·'), `${c.id}: 장절은 ref에 따로 둔다`);
  }
  const need = [
    ...ANIMALS.map((a) => `creature/${a.kind}`), ...FRUITS.map((f) => `creature/${f.kind}`),
    ...RIVERS.map((r) => `place/${r.id}`), 'place/eden', 'creature/serpent', 'person/adam', 'item/fig-leaf', 'word/gen-2-7', 'word/gen-3-15',
    'person/cain', 'person/abel', 'person/seth', 'creature/lamb', 'place/nod', 'item/wool', 'word/gen-4-7',
    ...Object.keys(LIKENESS).map((w) => `person/${w}`),
    ...MODS.flatMap((m) => m.records), ...MODS.flatMap((m) => [m.data.interlude.bond ?? m.data.interlude.who, ...(m.data.deep ? [m.data.deep.who] : [])].map((w) => `person/${w}`)),
  ];
  for (const id of need) assert.ok(ids.includes(id), `도감에 없는 항목: ${id}`);
  for (const [who, l] of Object.entries(LIKENESS)) {
    assert.equal(l.fruits.length, 2, `LIKENESS.${who}: 열매 두 가지`);
    assert.ok(l.fruits.every((f) => SPIRIT.some((s) => s.id === f)), `LIKENESS.${who}: 없는 열매`);
    assert.ok(!l.text.includes('\n'), `LIKENESS.${who}: 줄바꿈 기호 없이 쓴다(상태 창 폭에 맞춰 나뉜다)`);
    assert.ok(l.deed && l.ref && !l.deed.includes('\n'), `LIKENESS.${who}: 한 일(deed)과 장절(ref)이 필요함`);
  }
  // 닮은 인물: 만난 인물만, 열매가 없으면 없음, 점수 합이 큰 인물
  const s = newState();
  assert.equal(likeness(s), null);
  s.spirit.joy = 4;
  assert.equal(likeness(s), null, '만나지 않은 인물이 나옴');
  s.codex['person/adam'] = 'eden';
  s.codex['person/eve'] = 'eden';
  assert.equal(likeness(s).who, 'adam');
  s.spirit.love = 6;
  assert.equal(likeness(s).who, 'eve');
  // 칸 상태: 만남 / 놓침(스테이지를 마침) / 미발견
  const lion = CODEX.find((c) => c.id === 'creature/lion');
  assert.equal(codexState(s, lion), 'unknown');
  s.claimed.push('eden/clear');
  assert.equal(codexState(s, lion), 'missed');
  s.codex['creature/lion'] = 'eden';
  assert.equal(codexState(s, lion), 'met');
  console.log(`OK: 도감 점검 통과(항목 ${CODEX.length}개, 닮은 인물 ${Object.keys(LIKENESS).length}명)`);
}

console.log(`OK: 대사 ${count}줄, 퀴즈 ${QUIZ.length}문제, 저장·하늘 점검 통과`);

// 소품 옮기기: 뺀 소품(머리띠·목도리)은 '없음'으로 바뀐다
mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], earthLook: { item: 'band' } }));
assert.equal(load(storage).earthLook.item, 'none', '머리띠 저장값 옮기기 오류');
mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], earthLook: { item: 'scarf' } }));
assert.equal(load(storage).earthLook.item, 'none', '목도리 저장값 옮기기 오류');
assert.ok(!LOOK.earth.item.some((o) => ['band', 'scarf'].includes(o.id)), '성경 근거가 약한 소품이 남아 있음');
assert.equal(withRa('사자'), '사자라');
assert.equal(withRa('곰'), '곰이라');
assert.ok(ANIMALS.every((a) => ['lion', 'sheep', 'elephant', 'deer', 'horse', 'bear'].includes(a.kind)), '동물 모양(kind) 오류');

// 에덴 충돌: 출발점에서 걸어서(나무·바위·물을 피해, 다리로 강을 건너) 모든 목표에 닿는지 격자로 확인한다.
const eden = makeEden({ background: new THREE.Color() });
const STEP = 0.25, N = Math.ceil((EDEN_RADIUS * 2) / STEP);
const cell = (i, j) => new THREE.Vector3(-EDEN_RADIUS + i * STEP, 0, -EDEN_RADIUS + j * STEP);
const free = (p) => p.length() <= EDEN_RADIUS && !collide(p.clone(), 0.35);
const seen = new Set();
const start = [Math.round((EDEN_START.x + EDEN_RADIUS) / STEP), Math.round((EDEN_START.z + EDEN_RADIUS) / STEP)];
assert.ok(free(cell(...start)), '출발점이 장애물 안에 있음');
const queue = [start];
seen.add(start.join());
while (queue.length) {
  const [i, j] = queue.pop();
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = [i + di, j + dj];
    if (k[0] < 0 || k[1] < 0 || k[0] > N || k[1] > N || seen.has(k.join()) || !free(cell(...k))) continue;
    seen.add(k.join());
    queue.push(k);
  }
}
const reachable = [...seen].map((k) => cell(...k.split(',').map(Number)));
const reach2 = (pos, r) => reachable.some((c) => c.distanceTo(pos.clone().setY(0)) < r - 0.1);
for (const r of eden.riverEnds) assert.ok(reach2(r.pos, 2), `${r.name} 강 끝에 닿을 수 없음`);
for (const t of eden.fruitTrees) assert.ok(reach2(t.position, 2), `${t.userData.fruitName} 나무에 닿을 수 없음`);
for (const an of eden.animals) assert.ok(reach2(an.position, 2.4), `${an.userData.name}에게 닿을 수 없음`);
assert.ok(reach2(eden.knowledge.position, 2.4), '선악을 알게 하는 나무에 닿을 수 없음');
// 다리가 없으면 강을 건널 수 없어야 한다(물 충돌 확인): 강 한가운데 점은 막혀 있다
const [ra, rb] = RIVER_SEGMENTS[0];
assert.ok(!free(ra.clone().lerp(rb, 0.5)), '강 위를 걸을 수 있음');
assert.ok(BRIDGES.every((b) => free(b.pos.clone())), '다리 위가 막혀 있음');
// 동물은 한곳에 몰리지 않는다: 터끼리 4 이상 떨어져 있고, 강으로 나뉜 구역 세 곳 이상에 흩어져 있다
const homes = eden.animals.map((an) => an.userData.home);
for (const [i, h] of homes.entries()) for (const g of homes.slice(i + 1)) assert.ok(h.distanceTo(g) >= 4, '동물 터가 너무 가까움');
// 구역: 다리를 빼고 물(강, 샘)만 막았을 때 격자 탐색으로 이어지는 땅. 강이 꺾여도 정확하다.
const wet = (p) => p.length() > EDEN_RADIUS || p.distanceTo(RIVER_SEGMENTS[0][0]) < 1.25
  || RIVER_SEGMENTS.some(([a, b]) => { const ab = b.clone().sub(a); const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); return p.distanceTo(a.clone().addScaledVector(ab, t)) < 0.45; });
const regionId = new Map();
let regions = 0;
const key = (p) => [Math.round((p.x + EDEN_RADIUS) / STEP), Math.round((p.z + EDEN_RADIUS) / STEP)];
for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
  if (regionId.has(`${i},${j}`) || wet(cell(i, j))) continue;
  regions++;
  const q = [[i, j]];
  regionId.set(`${i},${j}`, regions);
  while (q.length) {
    const [a, b] = q.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = [a + di, b + dj];
      if (k[0] < 0 || k[1] < 0 || k[0] > N || k[1] > N || regionId.has(k.join()) || wet(cell(...k))) continue;
      regionId.set(k.join(), regions);
      q.push(k);
    }
  }
}
const sector = (p) => regionId.get(key(p).join()) ?? -1;
assert.ok(new Set(homes.map(sector)).size >= 3, '동물이 한 구역에 몰려 있음');
// 동물의 터는 연출 무대 밖에 있어야 한다(연출 중 장면을 가리지 않게)
for (const an of eden.animals) for (const [k, st] of Object.entries(STAGES)) {
  assert.ok(an.userData.home.distanceTo(st.c) > st.r + 0.3, `${an.userData.name}의 터가 무대(${k}) 안에 있음`);
}
// 연출에서 인물이 서는 자리와 카메라 사이에는 나무가 없다(나무가 장면을 가리지 않게)
for (const o of eden.group.children) {
  if (o.userData.fruits && o !== eden.knowledge && inFrontOfScene(o.position)) assert.fail(`장면 앞에 나무가 있음: (${o.position.x.toFixed(1)}, ${o.position.z.toFixed(1)})`);
}
// 그룹과 불 칼은 문기둥과 겹치지 않는다
const posts = eden.group.children.filter((o) => o.geometry?.parameters?.height === 2.6);
assert.equal(posts.length, 2, '문기둥 두 개');
for (const c of eden.cherubim) for (const p of posts) assert.ok(Math.hypot(c.position.x - p.position.x, c.position.z - p.position.z) > 1.2, '그룹이 문기둥과 겹침');
console.log(`OK: 에덴 충돌 점검 통과(걸어서 닿는 칸 ${reachable.length}개)`);

// 동물은 자기 터가 있는 강 이쪽에서만 돌아다닌다(다리를 건너 연출 자리 쪽으로 넘어오지 않게)
for (const an of eden.animals) {
  for (let i = 0; i < 300; i++) assert.equal(sector(eden.pickDest(an)), sector(an.userData.home), `${an.userData.name}가 강 건너를 고름`);
}
console.log('OK: 동물이 고르는 자리 점검 통과(자기 구역 유지)');

// 동물을 아담 곁으로 모았다가 터로 돌려보내면, 다리를 건너 걸어서(순간 이동 없이) 자기 터에 닿는다
{
  const e3 = makeEden({ background: new THREE.Color() });
  let tt = 0, jumps = 0;
  const last = e3.animals.map((an) => an.position.clone());
  const run = (sec) => {
    for (let i = 0; i < sec / 0.05; i++) {
      tt += 0.05;
      e3.update(0.05, tt, null);
      e3.animals.forEach((an, k) => { if (an.position.distanceTo(last[k]) > 0.5) { jumps++; console.log(`  순간 이동: ${an.userData.name} t=${tt.toFixed(1)}`); } last[k].copy(an.position); });
    }
  };
  e3.acts.gatherAnimals();
  run(40);
  e3.acts.sendHome();
  run(60);
  e3.animals.forEach((an) => assert.ok(an.position.distanceTo(an.userData.home) < 4.5, `${an.userData.name}가 터로 돌아가지 못함`));
  assert.equal(jumps, 0, `동물이 ${jumps}번 순간 이동함`);
  console.log('OK: 동물 모이기·돌아가기 점검 통과(다리로 건넘, 순간 이동 없음)');
}

// 아담이 관찰자를 따라 강 건너까지 다리로 걸어서 따라온다(순간 이동 없이)
{
  const e4 = makeEden({ background: new THREE.Color() });
  const target = new THREE.Vector3(-2, 0, -10); // 비손 강 끝 근처: 출발 구역에서 다리를 건너야 한다
  e4.adam.visible = true;
  e4.adam.position.set(4, 0, 3);
  e4.acts.follow(e4.adam, target);
  let tt = 0, jumps = 0;
  const last = e4.adam.position.clone();
  for (let i = 0; i < 1200; i++) {
    tt += 0.05;
    e4.update(0.05, tt, target);
    if (e4.adam.position.distanceTo(last) > 0.5) jumps++;
    last.copy(e4.adam.position);
  }
  assert.ok(e4.adam.position.distanceTo(target) < 3, `아담이 따라오지 못함(거리 ${e4.adam.position.distanceTo(target).toFixed(1)})`);
  assert.equal(jumps, 0, `아담이 ${jumps}번 순간 이동함`);
  console.log('OK: 아담 따라오기 점검 통과(다리로 건넘)');
}

// 아담이 장애물(나무·바위)에 걸려 제자리에서 계속 뛰지 않는다(2026-11-05 F46): 돌아가거나, 가까우면 서서 기다린다
{
  const e5 = makeEden({ background: new THREE.Color() });
  e5.adam.visible = true;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let worst = 0, pairs = 0;
  for (let k = 0; pairs < 60 && k < 2000; k++) {
    const a = new THREE.Vector3((rnd() - 0.5) * 2 * EDEN_RADIUS * 0.8, 0, (rnd() - 0.5) * 2 * EDEN_RADIUS * 0.8);
    const b = a.clone().add(new THREE.Vector3((rnd() - 0.5) * 8, 0, (rnd() - 0.5) * 8));
    if (a.length() > EDEN_RADIUS - 2 || b.length() > EDEN_RADIUS - 2 || crossesRiver(a, b)) continue;
    const a2 = a.clone(); if (collide(a2, 0.3) || collide(b.clone(), 0.35)) continue;
    pairs++;
    e5.adam.position.copy(a);
    e5.acts.follow(e5.adam, b);
    let tt = 0, inPlace = 0;
    for (let i = 0; i < 300; i++) {
      tt += 0.05;
      const p0 = e5.adam.position.clone(), ph = e5.adam.userData.phase ?? 0;
      e5.update(0.05, tt, b);
      if ((e5.adam.userData.phase ?? 0) - ph > 0.05 && e5.adam.position.distanceTo(p0) < 0.01) inPlace += 0.05;
    }
    worst = Math.max(worst, inPlace);
  }
  e5.acts.follow(null);
  assert.ok(worst < 1.6, `아담이 막힌 채 ${worst.toFixed(1)}초 제자리에서 뜀`);
  console.log(`OK: 아담 막힘 점검 통과(${pairs}쌍, 제자리 뜀 최대 ${worst.toFixed(1)}초)`);
}

// 관찰자 비키기: 무대마다 무대 안의 여러 시작점에서 고른 첫 자리가 설 수 있고(장애물·물 아님), 무대 밖이며,
// 곧게 걸어 막힘없이(장애물·강 없이) 닿는지 본다
{
  makeEden({ background: new THREE.Color() });
  let tried = 0;
  for (const [name, st] of Object.entries(STAGES)) {
    for (let i = 0; i < 12; i++) for (const k of [0.3, 0.7]) {
      const a = (i / 12) * Math.PI * 2;
      const from = st.c.clone().add(new THREE.Vector3(Math.cos(a) * st.r * k, 0, Math.sin(a) * st.r * k));
      if (from.length() > EDEN_RADIUS || collide(from.clone(), 0.35)) continue; // 설 수 없는 시작점은 건너뛴다
      tried++;
      const [spot] = stepAsideSpots(name, from);
      const at = `${name} (${from.x.toFixed(1)}, ${from.z.toFixed(1)})`;
      assert.ok(spot, `비킬 자리가 없음: ${at}`);
      assert.ok(!collide(spot.clone(), 0.35), `비킬 자리가 장애물·물 위: ${at}`);
      assert.ok(spot.distanceTo(st.c) >= st.r, `비킬 자리가 무대 안: ${at}`);
      assert.ok(!crossesRiver(from, spot), `비키는 길이 강을 건넘: ${at}`);
      const n = Math.ceil(from.distanceTo(spot) / 0.25);
      for (let j = 1; j <= n; j++) assert.ok(!collide(from.clone().lerp(spot, j / n), 0.28), `비키는 길이 장애물에 막힘: ${at}`);
    }
  }
  console.log(`OK: 관찰자 비키기 점검 통과(시작점 ${tried}곳)`);
}

// 가인과 아벨: 마친 스테이지 다음이 열리고(예전 저장값 포함), 들판의 양 터·연출 자리가 장애물 밖이며, 무대마다 비킬 자리가 있다.
{
  const s = newState();
  s.claimed.push('eden/clear');
  openNext(s);
  assert.ok(s.unlocked.includes('cain'), '에덴을 마치면 가인과 아벨이 열린다');
  const f = makeCain({ background: new THREE.Color() });
  for (const an of [...f.sheep, f.lamb]) assert.ok(!cainCollide(an.position.clone(), an.userData.radius), `${an.userData.name}: 장애물 위에 섬`);
  for (const [k, p] of Object.entries(f.spots)) if (!['fold', 'altars', 'abelAltar'].includes(k)) assert.ok(!cainCollide(p.clone(), 0.3), `들판 자리 ${k}: 장애물 위`);
  for (const name of Object.keys(CAIN_STAGES)) {
    for (const from of [CAIN_STAGES[name].c, CAIN_STAGES[name].c.clone().add(new THREE.Vector3(1, 0, -1))]) {
      assert.ok(cainAside(name, from).length, `${name}: 비킬 자리가 없음`);
    }
  }
  console.log('OK: 가인과 아벨 점검 통과(다음 지점 열기, 양 터, 비킬 자리)');
}

// 1-4부터의 스테이지(field.js): 지점이 장 목록에 있고, 인물·동물·연출 자리(spots)가 장애물 밖이며, 무대마다 비킬 자리가 있다.
for (const mod of MODS) {
  const ch = CHAPTERS.find((c) => c.id === mod.id);
  assert.ok(ch?.points.some((p) => p.id === mod.id), `${mod.id}: 장 목록에 지점이 없음`);
  const f = mod.build({ background: new THREE.Color() });
  for (const [k, fig] of Object.entries(f.people)) assert.ok(!f.collide(fig.position.clone(), 0.3), `${mod.id}: 인물 ${k}가 장애물 위에 섬`);
  for (const an of f.animals) assert.ok(!f.collide(an.position.clone(), an.userData.radius), `${mod.id}: 동물 ${an.userData.kind}(${an.position.x.toFixed(1)}, ${an.position.z.toFixed(1)})가 장애물 위에 섬`);
  for (const [k, p] of Object.entries(f.spots)) if (!(f.solid ?? []).includes(k)) assert.ok(!f.collide(p.clone(), 0.3), `${mod.id}: 자리 ${k}가 장애물 위`);
  for (const [name, st] of Object.entries(f.stages)) {
    for (const from of [st.c, st.c.clone().add(new THREE.Vector3(1, 0, -1))]) assert.ok(f.stepAside(name, from).length, `${mod.id}/${name}: 비킬 자리가 없음`);
  }
  // 돌아가는 길(2026-11-03, field.js routeTo): 연출 자리 사이를 걸으면 길의 모든 구간이 장애물에 걸리지 않는다(이어진 벽·강은 문·여울로 돌아간다)
  const pts = Object.entries(f.spots).filter(([k]) => !(f.solid ?? []).includes(k)).map(([, p]) => p.clone().setY(0)).filter((p) => !f.collide(p.clone(), 0.3));
  const clear = (a, b) => { const n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.25)); for (let j = 1; j <= n; j++) if (f.collide(a.clone().lerp(b, j / n), 0.24)) return false; return true; };
  for (let i = 0; i + 1 < pts.length; i++) {
    let at = pts[i];
    for (const q of f.acts.routeTo(pts[i], pts[i + 1])) { assert.ok(clear(at, q), `${mod.id}: 자리 ${i}→${i + 1} 길이 장애물에 걸림 (${at.x.toFixed(1)}, ${at.z.toFixed(1)})→(${q.x.toFixed(1)}, ${q.z.toFixed(1)})`); at = q; }
  }
}
console.log(`OK: 스테이지 점검 통과(${MODS.map((m) => m.id).join(', ') || '없음'})`);

// 장면 인물 이름표(2026-11-03 F16): F.person·g.greet에 쓴 id는 모두 SPEAKERS에 이름이 있어야 한다. 없으면 관계 알림에 "shem과 만남"처럼 영어 id가 뜬다.
{
  const ids = new Set();
  for (const f of readdirSync(new URL('../src/stages/', import.meta.url))) {
    const src = readFileSync(new URL(`../src/stages/${f}`, import.meta.url), 'utf8');
    for (const m of src.matchAll(/F\.person\(\s*'([a-z]+)'/g)) ids.add(m[1]);
    for (const m of src.matchAll(/g\.greet\([^)]*?'([a-z]+)'\)/g)) ids.add(m[1]);
  }
  const missing = [...ids].filter((i) => !(i in SPEAKERS));
  assert.deepEqual(missing, [], `이름표 없는 인물: ${missing}`);
  console.log(`OK: 장면 인물 이름표 점검 통과(${ids.size}명)`);
}

// 이어하기 저장값(2026-11-05 F56): 모르는 지점·프롤로그·깨진 자리는 버린다
{
  assert.deepEqual(cleanResume({ id: 'noah', n: 8, quest: true, pos: [1, 2] }), { id: 'noah', n: 8, quest: true, pos: [1, 2] });
  assert.equal(cleanResume({ id: 'nowhere', n: 3 }), null);
  assert.equal(cleanResume({ id: 'prologue', n: 3 }), null);
  assert.deepEqual(cleanResume({ id: 'eden', n: -2, pos: [1, 'x'] }), { id: 'eden', n: 0, quest: false, pos: null });
  console.log('OK: 이어하기 저장값 점검 통과');
}
