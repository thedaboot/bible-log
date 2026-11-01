// 성장 계산: 경험치·레벨, 열매 단계, 관계, 도감 기록. 수치는 data/growth.js에 있다.
import { SPIRIT, SPIRIT_STAGES, STAGE_AT, SPIRIT_GAIN, xpToNext, TITLES, BONDS, BOND_NAMES } from './data/growth.js';
import { josa } from './text.js';

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

// 보상을 한 번만 준다. 받은 뒤에 보여 줄 알림 문구 목록을 돌려준다(이미 받았으면 빈 목록).
export function grant(state, key, reward) {
  if (state.claimed.includes(key)) return [];
  state.claimed.push(key);
  const msgs = [];
  const before = levelOf(state.xp).level;
  state.xp += reward.xp ?? 0;
  state.talents += reward.talent ?? 0;
  const parts = [reward.xp && `경험치 +${reward.xp}`, reward.talent && `달란트 +${reward.talent}`].filter(Boolean);
  if (parts.length) msgs.push(parts.join(' · '));
  if (reward.spirit) msgs.push(...grow(state, reward.spirit, SPIRIT_GAIN.quest));
  const now = levelOf(state.xp);
  if (now.level > before) msgs.push(`레벨 ${now.level} · ${now.title}`);
  return msgs;
}

// 관계는 오르기만 한다. 동행에 처음 이르면 그 인물과 관련된 열매가 자란다(spirit).
export function bond(state, who, step, spirit) {
  if (BONDS.indexOf(step) <= BONDS.indexOf(state.bonds[who])) return [];
  state.bonds[who] = step;
  const msgs = [`관계: ${BOND_NAMES[step]}`];
  if (step === 'walked' && spirit) msgs.push(...grow(state, spirit, SPIRIT_GAIN.walk));
  return msgs;
}

// 도감: 처음 만난 스테이지를 남긴다. 처음이면 true.
export function record(state, entry, stage) {
  if (state.codex[entry]) return false;
  state.codex[entry] = stage;
  return true;
}
