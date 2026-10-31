// 대사 데이터, 저장·이어하기, 이름 처리, 하늘 계산을 점검한다. 실행: npm run check
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PROLOGUE } from '../src/data/prologue.js';
import { CREATION, DAY_NAMES } from '../src/data/creation.js';
import { EDEN, FALL, RIVERS, ANIMALS, QUIZ } from '../src/data/eden.js';
import { SPEAKERS, vocative, fill } from '../src/text.js';
import { load, save, reach, newState } from '../src/save.js';
import { makeCreation, skyState } from '../src/creation.js';
import { DEFAULT_LOOK, DEFAULT_EARTH, LOOK, LOOK_TABS } from '../src/props.js';
import { CHAPTERS, CHECKPOINTS } from '../src/data/chapters.js';

// 대사 묶음을 [위치, 대사 배열] 목록으로 모은다.
const groups = [
  ...Object.entries(PROLOGUE).map(([k, v]) => [`PROLOGUE.${k}`, v]),
  ['CREATION.start', CREATION.start],
  ...Object.entries(EDEN).map(([k, v]) => [`EDEN.${k}`, v]),
  ...Object.entries(FALL).map(([k, v]) => [`FALL.${k}`, v]),
  ...RIVERS.map((r) => [`RIVERS.${r.id}`, r.lines]),
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
let count = 0;
for (const [where, lines] of groups) {
  for (const [i, l] of lines.entries()) {
    const at = `${where}[${i}]`;
    assert.ok(l.who in SPEAKERS, `${at}: 알 수 없는 화자 ${l.who}`);
    assert.ok(typeof l.text === 'string' && l.text.trim(), `${at}: 빈 대사`);
    assert.ok(l.ref === null || REF.test(l.ref), `${at}: 장절 형식 오류 ${l.ref}`);
    // 줄바꿈 기준: 문장이 끝난 자리에서만, 합쳐서 30자(이름은 3글자로 셈)를 넘을 때만
    if (l.text.includes('\n')) {
      const plain = l.text.replaceAll('{nameVoc}', '이름이야').replaceAll('{name}', '이름이').replaceAll('\n', ' ');
      assert.ok(plain.length > 30, `${at}: 30자 이하는 한 줄로 둔다`);
      for (const part of l.text.split('\n').slice(0, -1)) assert.ok(/[.?!…]$/.test(part.trim()), `${at}: 문장 중간 줄바꿈`);
    }
    // 창 1:1~2:3은 엘로힘, 창 2:4부터는 YHWH(이름표 규칙)
    if (l.ref?.startsWith('창 2:') || l.ref?.startsWith('창 3:')) assert.notEqual(l.who, 'elohim', `${at}: 창 2:4 이후는 YHWH`);
    count++;
  }
}
assert.equal(RIVERS.length, 4, '강은 네 줄기');
assert.ok(ANIMALS.every((a) => a.name && a.size > 0), '동물 데이터 오류');
for (const [i, q] of QUIZ.entries()) {
  assert.ok(q.options[q.answer], `QUIZ[${i}]: 정답 번호 오류`);
  assert.ok(REF.test(q.ref), `QUIZ[${i}]: 장절 형식 오류`);
}

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
const st = newState({ unlocked: ['prologue', 'creation-1'] });
assert.deepEqual(st.unlocked, ['prologue', 'creation-1'], '처음부터를 눌러도 열린 지점은 남는다');
reach(st, 'creation-3');
assert.deepEqual(st.unlocked, ['prologue', 'creation-1', 'creation-3']);
assert.equal(st.scene, 'creation-3');
mem.set('bible-rpg/save/v1', '{깨진 JSON');
assert.equal(load(storage), null);
assert.equal(load(null), null);

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

// 꾸미기: 기본값이 선택지 안에 있고, 탭이 지상 항목을 빠짐없이 한 번씩 나눈다
for (const [k, v] of Object.entries(DEFAULT_EARTH)) assert.ok(LOOK.earth[k].some((o) => o.id === v), `지상 기본값 ${k}`);
for (const [k, v] of Object.entries(DEFAULT_LOOK)) assert.ok(LOOK.heaven[k].some((o) => o.id === v), `천국 기본값 ${k}`);
assert.deepEqual(LOOK_TABS.earth.flatMap((t) => t.keys).sort(), Object.keys(LOOK.earth).sort(), '탭 구성 오류');
// 예전 지상 모습(빛깔 하나)은 빛깔을 '나를 감싸는 빛'으로 옮긴다
mem.set('bible-rpg/save/v1', JSON.stringify({ name: 'a', scene: 'eden', unlocked: ['prologue'], earthLook: { color: 'rose', hair: 'long' } }));
const old = load(storage);
assert.equal(old.earthLook.aura, 'rose');
assert.equal(old.earthLook.hair, 'long');
assert.equal(old.earthLook.skin, DEFAULT_EARTH.skin);

console.log(`OK: 대사 ${count}줄, 퀴즈 ${QUIZ.length}문제, 저장·하늘 점검 통과`);
