import { DEFAULT_LOOK, DEFAULT_EARTH, LOOK } from './props.js';
import { CHECKPOINTS, CHAPTERS } from './data/chapters.js';
import { SPIRIT, BONDS } from './data/growth.js';
import { ITEMS } from './data/items.js';
import { ownsLook } from './growth.js';

export { CHECKPOINTS };
const KEY = 'bible-rpg/save/v1';

// 사생활 보호 모드 등에서는 localStorage 접근 자체가 예외를 던질 수 있다.
function store() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

const pick = (list, id, fallback) => (list.some((x) => x.id === id) ? id : fallback);
// 천국 모습과 지상 모습은 항목이 달라서 각자의 선택지로 검사한다.
const cleanLook = (look, options, defaults) => Object.fromEntries(
  Object.entries(defaults).map(([key, fallback]) => [key, pick(options[key], look?.[key], fallback)]),
);
// 예전 지상 모습(빛깔 하나로 칠한 형체)은 그 빛깔을 '나를 감싸는 빛'으로 옮긴다.
const cleanEarth = (look) => cleanLook({ aura: look.color, ...look }, LOOK.earth, DEFAULT_EARTH);

// 성장 기록: 경험치, 달란트, 열매 점수, 관계 단계, 도감(항목 → 처음 만난 스테이지), 인벤토리, 받은 보상.
// 예전 저장값이나 깨진 값은 여기서 기본값으로 채운다.
const nat = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
const strs = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
function cleanGrowth(s = {}) {
  const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
  return {
    xp: nat(s.xp),
    talents: nat(s.talents),
    spirit: Object.fromEntries(SPIRIT.map(({ id }) => [id, nat(obj(s.spirit)[id])])),
    bonds: Object.fromEntries(Object.entries(obj(s.bonds)).filter(([, v]) => BONDS.includes(v))),
    codex: Object.fromEntries(Object.entries(obj(s.codex)).filter(([, v]) => CHAPTERS.some((c) => c.id === v))),
    items: { tools: strs(obj(s.items).tools), looks: strs(obj(s.items).looks) },
    claimed: strs(s.claimed),
    learned: strs(s.learned).filter((k) => ['walk', 'look'].includes(k)), // 익힌 조작(안내를 다시 띄우지 않는다)
  };
}

// look: 천국에서의 모습, earthLook: 지상에서의 모습(처음 땅에 내려갈 때 고른다)
// 처음부터를 눌러도 열린 지점과 성장 기록은 남는다(받은 보상도 남아서 같은 보상을 두 번 받지 않는다).
export function newState(prev) {
  return { name: '', look: { ...DEFAULT_LOOK }, earthLook: null, scene: 'prologue', unlocked: prev?.unlocked ?? ['prologue'], ...cleanGrowth(prev) };
}

export function load(storage = store()) {
  try {
    const s = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (!s || typeof s.scene !== 'string') return null;
    let unlocked = Array.isArray(s.unlocked) ? s.unlocked.filter((id) => CHECKPOINTS.includes(id)) : null;
    if (!unlocked) {
      // 예전 저장값({scene, seen}) 옮기기
      const seen = Array.isArray(s.seen) ? s.seen : [];
      unlocked = ['prologue'];
      if (s.scene.startsWith('creation') || seen.includes('creation')) unlocked.push('creation-1');
      if (seen.includes('creation')) unlocked.push('creation-2', 'creation-3', 'creation-4', 'creation-5', 'creation-6', 'creation-7', 'eden');
    }
    const scene = s.scene === 'creation' || s.scene === 'creation-1' ? 'creation-1' : s.scene;
    const out = {
      name: String(s.name ?? '').slice(0, 10),
      look: cleanLook(s.look, LOOK.heaven, DEFAULT_LOOK),
      earthLook: s.earthLook ? cleanEarth(s.earthLook) : null,
      scene: CHECKPOINTS.includes(scene) ? scene : unlocked.at(-1),
      unlocked: CHECKPOINTS.filter((id) => unlocked.includes(id)),
      ...cleanGrowth(s),
    };
    holdMigrate(out);
    return out;
  } catch {
    return null;
  }
}

// 손에 든 물건 옮기기(소품 → 인벤토리): 예전에 고른 꾸미기는 레벨과 상관없이 갖게 하고,
// 도구는 도전 스테이지에서 얻어야 하므로 갖고 있지 않으면 맨손으로 바꾼다.
function holdMigrate(st) {
  const id = st.earthLook?.item;
  if (!id || id === 'none') return;
  const it = ITEMS.find((i) => i.id === id);
  if (it?.kind === 'look' && !ownsLook(st, id)) st.items.looks.push(id);
  else if (!it || (it.kind === 'tool' && !st.items.tools.includes(id))) st.earthLook.item = 'none';
}

export function save(data, storage = store()) {
  try { storage?.setItem(KEY, JSON.stringify(data)); } catch { /* 저장 실패해도 플레이는 계속한다 */ }
}

// 지점을 열고 지금 위치로 기록한다.
export function reach(state, id) {
  if (!state.unlocked.includes(id)) state.unlocked = CHECKPOINTS.filter((c) => c === id || state.unlocked.includes(c));
  state.scene = id;
  save(state);
}
