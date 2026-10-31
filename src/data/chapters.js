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
  { id: 'cain', title: '가인과 아벨', range: '창세기 4장', points: [] },
  { id: 'noah', title: '노아', range: '창세기 6~9장', points: [] },
];

export const CHECKPOINTS = CHAPTERS.flatMap((c) => c.points.map((p) => p.id));
