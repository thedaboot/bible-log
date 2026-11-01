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
export const STAGE_AT = [0, 10, 25, 45, 70]; // ★
export const SPIRIT_GAIN = { quest: 4, choice: 2, walk: 3 }; // ★ 퀘스트 완료, 막간 선택, 동행 도달

// 레벨: 다음 레벨까지 필요한 경험치는 40에서 시작해 20씩 는다(누적 40, 100, 180, 280…). ★
export const xpToNext = (level) => 40 + 20 * (level - 1);

// 레벨마다 열리는 칭호. 성경 표현에서 가져왔다. ★
export const TITLES = [
  { level: 1, title: '부르심을 받은 이', ref: '롬 1:6' },
  { level: 2, title: '옛길을 묻는 이', ref: '렘 6:16' },
  { level: 3, title: '말씀을 듣는 이', ref: '눅 11:28' },
  { level: 4, title: '등불을 든 이', ref: '시 119:105' },
  { level: 5, title: '씨를 뿌리는 이', ref: '마 13:3' },
  { level: 6, title: '작은 일에 충성된 이', ref: '눅 16:10' },
  { level: 7, title: '빛의 자녀', ref: '엡 5:8' },
  { level: 8, title: '세상의 소금', ref: '마 5:13' },
  { level: 9, title: '선한 청지기', ref: '벧전 4:10' },
  { level: 10, title: '경주를 하는 이', ref: '히 12:1' },
];

// 인벤토리 칸: 처음 4칸, 레벨이 오를 때마다 1칸. ★
export const slotsAt = (level) => 3 + level;

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
  quiz: { xp: 15, talent: 5 }, // ★ 장 끝 구절 퀴즈
  clear: { xp: 20, talent: 10 }, // ★ 스테이지 마침
};
