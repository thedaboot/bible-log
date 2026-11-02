// 장 목록: 이어하기 화면의 카드와 저장 지점이 모두 이 목록에서 나온다.
// 새 장을 만들면 여기에 한 줄 더하고 points를 채운다. points가 비어 있으면 '준비 중' 카드로 보인다.
import { DAY_NAMES } from './creation.js';

export const CHAPTERS = [
  { id: 'heaven', title: '천국', range: '프롤로그', points: [{ id: 'prologue', title: '부르심' }] },
  {
    id: 'creation', title: '창조', range: '창세기 1:1~2:3',
    points: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ id: `creation-${d}`, title: DAY_NAMES[d] })),
  },
  {
    id: 'eden', title: '에덴', range: '창세기 2:4~3:24',
    points: [{ id: 'eden', title: '동산의 사람' }, { id: 'fall', title: '타락과 추방' }],
  },
  { id: 'cain', title: '가인과 아벨', range: '창세기 4장', points: [{ id: 'cain', title: '들판의 두 형제' }] },
  // 곁길(side): 본 스테이지(값)에서 갈라지는 짧은 스테이지. 지도에서 본 길 아래에 작게 놓인다.
  { id: 'enoch', title: '에녹의 동행', range: '창세기 5:21~24', points: [{ id: 'enoch', title: '언덕길의 동행' }], side: 'cain' },
  { id: 'noah', title: '노아의 방주', range: '창세기 6~9장', points: [{ id: 'noah', title: '방주와 무지개' }] },
  { id: 'babel', title: '바벨탑', range: '창세기 11:1~9', points: [{ id: 'babel', title: '탑을 쌓는 들판' }] },
  { id: 'abram', title: '아브람의 부르심', range: '창세기 12, 15장', points: [{ id: 'abram', title: '하란에서 벧엘까지' }] },
  { id: 'hagar', title: '감찰하시는 하나님', range: '창세기 16, 21장', points: [{ id: 'hagar', title: '광야의 샘' }], side: 'abram' },
  { id: 'mamre', title: '세 손님과 약속', range: '창세기 18장', points: [{ id: 'mamre', title: '마므레 상수리나무' }] },
  { id: 'moriah', title: '모리아 산', range: '창세기 22장', points: [{ id: 'moriah', title: '여호와 이레' }] },
  { id: 'rebekah', title: '우물가의 리브가', range: '창세기 24장', points: [{ id: 'rebekah', title: '나홀의 우물' }] },
  { id: 'bethel', title: '야곱의 사닥다리', range: '창세기 25~28장', points: [{ id: 'bethel', title: '돌베개와 사닥다리' }] },
  { id: 'jabbok', title: '얍복 강과 화해', range: '창세기 32~33장', points: [{ id: 'jabbok', title: '브니엘의 새벽' }] },
  { id: 'joseph', title: '요셉의 꿈', range: '창세기 37, 39~41장', points: [] },
  { id: 'brothers', title: '요셉과 형제들', range: '창세기 42~45, 50장', points: [] },
];

export const CHECKPOINTS = CHAPTERS.flatMap((c) => c.points.map((p) => p.id));

// 월드(성경의 책 하나)와 스테이지(사건 하나). 스테이지 id는 위 장(CHAPTERS) id와 같다. 천국(프롤로그)은 쉼터라 스테이지가 아니다.
// 지도에서는 1-1, 1-2처럼 월드 번호와 스테이지 번호로 부른다. 앞 스테이지의 지점이 하나라도 열리면 그 스테이지가 열린다.
export const WORLDS = [
  // 정경 순서. 곁길도 본문 순서 자리에 둔다(←·→로 옮길 때 이 순서를 따른다).
  {
    id: 'genesis', title: '창세기',
    stages: ['creation', 'eden', 'cain', 'enoch', 'noah', 'babel', 'abram', 'hagar', 'mamre', 'moriah', 'rebekah', 'bethel', 'jabbok', 'joseph', 'brothers'],
  },
];
