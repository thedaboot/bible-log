// 성장 계산: 경험치·레벨, 열매 단계, 관계, 도감 기록. 수치는 data/growth.js에 있다.
import { SPIRIT, SPIRIT_STAGES, STAGE_AT, SPIRIT_GAIN, xpToNext, TITLES, BONDS, BOND_NAMES, slotsAt, CHALLENGE, DEEP_LEVEL } from './data/growth.js';
import { ITEMS } from './data/items.js';
import { josa, SPEAKERS } from './text.js';
import { LIKENESS, CODEX } from './data/codex.js';

export function levelOf(xp) {
  let level = 1, left = xp;
  while (left >= xpToNext(level)) { left -= xpToNext(level); level++; }
  const title = TITLES.findLast((t) => t.level <= level);
  return { level, into: left, need: xpToNext(level), title: title.title };
}

export const stageOf = (points = 0) => STAGE_AT.findLastIndex((at) => points >= at);
const spiritName = (id) => SPIRIT.find((s) => s.id === id).name;

// 열매를 키운다. 단계가 오르면 알림 문구를 돌려준다.
export function grow(state, id, amount) {
  const before = stageOf(state.spirit[id]);
  state.spirit[id] = (state.spirit[id] ?? 0) + amount;
  const after = stageOf(state.spirit[id]);
  const name = josa(spiritName(id), '이', '가');
  return [after > before ? `${name} ${josa(SPIRIT_STAGES[after], '으로', '로')} 자랐어요` : `${name} 자랐어요`];
}

// 보상을 한 번만 준다. 이미 받았으면 null, 받았으면 열매 성장 알림 문구 목록을 돌려준다.
// 경험치·달란트·레벨은 알림 대신 HUD로 보여 준다(main.js reward).
export function grant(state, key, reward) {
  if (state.claimed.includes(key)) return null;
  state.claimed.push(key);
  state.xp += reward.xp ?? 0;
  state.talents += reward.talent ?? 0;
  return reward.spirit ? grow(state, reward.spirit, SPIRIT_GAIN.quest) : [];
}

// 관계 배너 문장(2026-11-02 사용자 캡처 S16: '관계: 대화'처럼 꼬리표만 뜨면 엉성하다). ui.js toast가 끝말로 단계를 알아본다.
export const BOND_LINES = { met: '처음 만났어요', talked: '마음을 나눴어요', walked: '함께 걷는 사이가 됐어요' };
export const bondLine = (who, step) => `${josa(SPEAKERS[who] ?? who, '과', '와')} ${BOND_LINES[step]}`;
// 관계는 오르기만 한다. 동행에 처음 이르면 그 인물과 관련된 열매가 자란다(spirit).
export function bond(state, who, step, spirit) {
  if (BONDS.indexOf(step) <= BONDS.indexOf(state.bonds[who])) return [];
  state.bonds[who] = step;
  const msgs = [bondLine(who, step)];
  if (step === 'walked' && spirit) msgs.push(...grow(state, spirit, SPIRIT_GAIN.walk));
  return msgs;
}

// 도감: 처음 만난 스테이지를 남긴다. 처음이면 true.
export function record(state, entry, stage) {
  if (state.codex[entry]) return false;
  state.codex[entry] = stage;
  return true;
}

// 도감 완성: 월드(data/chapters.js WORLDS)의 도감 항목을 모두 만났고 아직 칭호를 받지 않았으면 true
export const codexDone = (state, world) => !state.claimed.includes(`${world.id}/codex`)
  && CODEX.filter((c) => world.stages.includes(c.stage)).every((c) => state.codex[c.id]);

// 닮은 인물: 도감에서 만난 인물 가운데, 그 인물의 두 열매 점수 합이 가장 큰 사람. 열매가 모두 0이면 없다.
export function likeness(state) {
  let best = null, bestScore = 0;
  for (const [who, info] of Object.entries(LIKENESS)) {
    if (!state.codex[`person/${who}`]) continue;
    const score = info.fruits.reduce((sum, id) => sum + (state.spirit[id] ?? 0), 0);
    if (score > bestScore) { best = { who, ...info }; bestScore = score; }
  }
  return best;
}

// 도감 칸의 상태: 만남(기록 있음), 놓침(그 스테이지를 마쳤는데 기록 없음), 미발견(아직 못 간 스테이지).
export function codexState(state, entry) {
  if (state.codex[entry.id]) return 'met';
  return state.claimed.includes(`${entry.stage}/clear`) ? 'missed' : 'unknown';
}

// ---------- 손에 드는 물건(data/items.js) ----------
// 꾸미기는 레벨로 열린 것과 따로 얻은 것(state.items.looks, 상점·예전 저장값)을 합친다.
export function ownsLook(state, id) {
  const it = ITEMS.find((i) => i.id === id && i.kind === 'look');
  return !!it && (it.level <= levelOf(state.xp).level || state.items.looks.includes(id));
}
// 레벨이 before에서 after로 오를 때 새로 열린 꾸미기
export const looksOpened = (before, after) => ITEMS.filter((i) => i.kind === 'look' && i.level > before && i.level <= after);

// 도구는 인벤토리 칸을 차지한다. 칸이 차면 넣지 못한다(false).
export function addTool(state, id) {
  if (state.items.tools.length >= slotsAt(levelOf(state.xp).level)) return false;
  state.items.tools.push(id);
  return true;
}
// 도구를 쓰면 하나 사라진다. 손에 들고 있던 도구가 다 떨어지면 맨손이 된다.
export function useTool(state, id) {
  const i = state.items.tools.indexOf(id);
  if (i < 0) return false;
  state.items.tools.splice(i, 1);
  if (state.earthLook?.item === id && !state.items.tools.includes(id)) state.earthLook.item = 'none';
  return true;
}
// 손에 들 수 있는지: 맨손, 가진 꾸미기, 가진 도구
export const canHold = (state, id) => id === 'none' || ownsLook(state, id) || state.items.tools.includes(id);

// ---------- 막간 선택 ----------
// 열매 단계로 열리는 선택지: need { 열매 id: 단계 }를 모두 채워야 보인다.
export const choiceOpen = (state, c) => !c.need || Object.entries(c.need).every(([id, st]) => stageOf(state.spirit[id]) >= st);
// 고른 선택지의 열매를 키운다. 같은 자리(key)에서는 한 번만 자란다(다시 플레이해도 대화는 하지만 열매는 그대로).
export function chooseFruit(state, key, fruit) {
  if (state.claimed.includes(key)) return [];
  state.claimed.push(key);
  return grow(state, fruit, SPIRIT_GAIN.choice);
}

// 상점: 달란트로 꾸미기를 산다. 이미 가졌거나 달란트가 모자라면 false.
export function buyLook(state, id) {
  const it = ITEMS.find((i) => i.id === id && i.price);
  if (!it || ownsLook(state, id) || state.talents < it.price) return false;
  state.talents -= it.price;
  state.items.looks.push(id);
  return true;
}

// 도전 보조: 도전을 돕는 열매들 가운데 가장 높은 단계 × 8%, 최대 32%
export const assistOf = (state, fruits = []) => Math.min(CHALLENGE.assistMax, CHALLENGE.assistPerStage * Math.max(0, ...fruits.map((id) => stageOf(state.spirit[id]))));

// 깊은 대화: 관계가 "대화" 이상이고 레벨이 DEEP_LEVEL 이상이면 열린다.
export const deepOpen = (state, who) => BONDS.indexOf(state.bonds[who]) >= 1 && levelOf(state.xp).level >= (DEEP_LEVEL[who] ?? Infinity);
