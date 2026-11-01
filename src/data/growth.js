// 성장 시스템 수치(docs/design.md "성장 시스템", "레퍼런스에서 가져온 규칙"). 숫자는 모두 여기에만 둔다.
// ★ 표시는 1단계 구현 뒤 체험하고 조정할 초안이다.

// 성령의 열매(갈 5:22~23). name은 화면 이름, old는 설명 칸에서 한 번 함께 보여 줄 개역개정 단어다.
export const SPIRIT = [
  { id: 'love', name: '사랑', old: '사랑' },
  { id: 'joy', name: '기쁨', old: '희락' },
  { id: 'peace', name: '화평', old: '화평' },
  { id: 'patience', name: '인내', old: '오래 참음' },
  { id: 'kindness', name: '친절', old: '자비' },
  { id: 'goodness', name: '선함', old: '양선' },
  { id: 'faith', name: '신실', old: '충성' },
  { id: 'gentle', name: '온유', old: '온유' },
  { id: 'control', name: '절제', old: '절제' },
];

// 열매 단계: 점수는 숨기고 단계만 보여 준다(페르소나 5R). STAGE_AT[i]점 이상이면 i단계.
export const SPIRIT_STAGES = ['씨앗', '새싹', '줄기', '꽃', '결실'];
// 성경 전체를 기준으로 잡는다(PLAN). 가장 많이 키운 열매가 스테이지의 70% 즈음에 결실에 이르고,
// 고르게 키운 열매는 신약에 들어서야 꽃이 된다. 요한계시록까지 올라갈 곳이 남는다.
// 새싹 경계 5는 에덴에서 막간으로 고른 열매가 첫 새싹이 되게 한 값이다(2026-11-01 A안).
export const STAGE_AT = [0, 5, 30, 90, 200]; // ★
export const SPIRIT_GAIN = { quest: 4, choice: 2, walk: 3 }; // ★ 퀘스트 완료, 막간 선택, 동행 도달

// 레벨: 다음 레벨까지 필요한 경험치는 40에서 시작해 20씩 는다(누적 40, 100, 180, 280…). ★
// 스테이지 하나가 경험치 150쯤이면 에덴을 마칠 때 레벨 3, 창세기를 마칠 때 13쯤, 요한계시록에서 41쯤이 된다(PLAN).
export const xpToNext = (level) => 40 + 20 * (level - 1);
export const MAX_LEVEL = 50;

// 성장 속도를 정할 때 쓴 성경 전체 분량 가정(미확인 추정, 스테이지 목록을 정하면 고친다). npm run check가 이 가정으로 속도를 점검한다.
export const PLAN = { stages: 120, xpPerStage: 150, spiritPerStage: 12 };

// 칭호: 정해진 레벨에 이르면 바뀐다. 성경 표현에서 가져왔다. 마지막 칭호는 요한계시록 즈음에 연다. ★
export const TITLES = [
  { level: 1, title: '부르심을 받은 이', ref: '롬 1:6' },
  { level: 3, title: '옛길을 묻는 이', ref: '렘 6:16' },
  { level: 6, title: '말씀을 듣는 이', ref: '눅 11:28' },
  { level: 10, title: '등불을 든 이', ref: '시 119:105' },
  { level: 15, title: '씨를 뿌리는 이', ref: '마 13:3' },
  { level: 20, title: '작은 일에 충성된 이', ref: '눅 16:10' },
  { level: 25, title: '빛의 자녀', ref: '엡 5:8' },
  { level: 30, title: '세상의 소금', ref: '마 5:13' },
  { level: 35, title: '선한 청지기', ref: '벧전 4:10' },
  { level: 40, title: '경주를 하는 이', ref: '히 12:1' },
];

// 인벤토리 칸: 처음 4칸, 5레벨마다 1칸(레벨 41에서 12칸). ★
export const slotsAt = (level) => 4 + Math.floor((level - 1) / 5);

// 관계 단계(만남 → 대화 → 동행). 숫자는 쓰지 않는다.
export const BONDS = ['met', 'talked', 'walked'];
export const BOND_NAMES = { met: '만남', talked: '대화', walked: '동행' };

// 보상 지점. 같은 보상은 한 번만 받는다(state.claimed에 key를 남긴다). spirit은 SPIRIT_GAIN.quest만큼 자란다.
// 퀘스트별 열매 근거: 강 찾기는 강이 하나님의 성을 기쁘게 한다(시 46:4), 동물 곁에 머무르는 일은 인내,
// 열매 담기는 금하신 나무 하나를 두고 나머지를 먹는 절제(창 2:16~17).
export const REWARDS = {
  river: { xp: 5, talent: 1 }, // ★ 강 하나 찾기
  animal: { xp: 5, talent: 1 }, // ★ 동물 하나 이름 듣기
  fruit: { xp: 5, talent: 1 }, // ★ 열매 하나 담기
  riversDone: { xp: 10, spirit: 'joy' }, // ★
  animalsDone: { xp: 10, spirit: 'patience' }, // ★
  fruitDone: { xp: 10, spirit: 'control' }, // ★
  interlude: { xp: 10 }, // ★ 막간 대화를 끝까지 마침(열매는 선택마다 SPIRIT_GAIN.choice)
  quiz: { xp: 15, talent: 5 }, // ★ 장 끝 구절 퀴즈
  clear: { xp: 20, talent: 10 }, // ★ 스테이지 마침
};
