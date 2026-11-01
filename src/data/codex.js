// 바이블로그 도감(docs/design.md "도감"). 항목 id는 '분류/이름'이고 저장값 state.codex의 key와 같다.
// fact는 본문 사실 한 줄, ref는 그 장절, memo는 관찰자 메모 한 줄이다. memo는 본문에 없는 각색이라 감수 목록에 오른다.
// stage는 이 항목을 처음 만날 수 있는 스테이지(장 id)다.

export const CODEX_TABS = [
  { id: 'person', name: '인물' },
  { id: 'creature', name: '피조물' },
  { id: 'place', name: '장소' },
  { id: 'item', name: '물건' },
  { id: 'word', name: '말씀' },
];

export const CODEX = [
  { id: 'person/adam', name: '아담', stage: 'eden', fact: '흙으로 지음 받은 첫 사람', ref: '창 2:7', memo: '동물마다 이름을 지어 주는 목소리가 즐거워 보였다.' },
  { id: 'person/eve', name: '하와', stage: 'eden', fact: '모든 산 사람의 어머니', ref: '창 3:20', memo: '아담 곁에서 동산의 열매를 함께 돌보았다.' },

  { id: 'creature/lion', name: '사자', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '갈기가 바람에 흔들려도 아담 곁에서는 순했다.' },
  { id: 'creature/sheep', name: '양', stage: 'eden', fact: '아담이 이름을 지어 준 가축', ref: '창 2:20', memo: '부르면 고개를 들고 천천히 다가왔다.' },
  { id: 'creature/elephant', name: '코끼리', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '걸음은 느렸지만 땅이 울릴 만큼 컸다.' },
  { id: 'creature/deer', name: '사슴', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '가지 친 뿔을 숙이고 강가의 풀을 뜯었다.' },
  { id: 'creature/horse', name: '말', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '긴 갈기를 날리며 동산을 한 바퀴 돌았다.' },
  { id: 'creature/bear', name: '곰', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '둥근 귀를 쫑긋 세우고 아담을 바라보았다.' },
  { id: 'creature/fig', name: '무화과나무', stage: 'eden', fact: '두 사람이 잎을 엮어 몸을 가린 나무', ref: '창 3:7', memo: '넓은 잎 아래에 열매가 숨어 있었다.' },
  { id: 'creature/pomegranate', name: '석류나무', stage: 'eden', fact: '대제사장 옷단에 수놓은 열매', ref: '출 28:33', memo: '붉은 열매 안에 알갱이가 가득했다.' },
  { id: 'creature/grape', name: '포도나무', stage: 'eden', fact: '정탐꾼이 메고 온 큰 포도송이', ref: '민 13:23', memo: '송이가 무거워 가지가 휘어 있었다.' },
  { id: 'creature/olive', name: '올리브나무', stage: 'eden', fact: '약속의 땅에 나는 열매', ref: '신 8:8', memo: '잎 뒷면이 은빛으로 반짝였다.' },
  { id: 'creature/date', name: '대추야자나무', stage: 'eden', fact: '종려나무 성읍 여리고', ref: '신 34:3', memo: '높은 꼭대기에 열매가 주렁주렁 달렸다.' },
  { id: 'creature/serpent', name: '뱀', stage: 'eden', fact: '들짐승 가운데 가장 간교했다', ref: '창 3:1', memo: '말은 부드러웠지만 하나님의 말씀을 비틀었다.' },

  { id: 'place/eden', name: '에덴 동산', stage: 'eden', fact: '하나님께서 동쪽에 일구신 동산', ref: '창 2:8', memo: '보기에 아름답고 먹기에 좋은 나무가 가득했다.' },
  { id: 'place/pishon', name: '비손 강', stage: 'eden', fact: '금이 나는 하윌라 땅을 두른 강', ref: '창 2:11', memo: '물빛 아래로 모래가 반짝였다.' },
  { id: 'place/gihon', name: '기혼 강', stage: 'eden', fact: '구스 온 땅을 두른 강', ref: '창 2:13', memo: '굽이굽이 동산 가장자리를 돌아 흘렀다.' },
  { id: 'place/tigris', name: '힛데겔 강', stage: 'eden', fact: '앗수르 동쪽으로 흐른 강', ref: '창 2:14', memo: '물살이 빨라 다리 위에서도 소리가 들렸다.' },
  { id: 'place/euphrates', name: '유브라데 강', stage: 'eden', fact: '에덴에서 갈라진 넷째 강', ref: '창 2:14', memo: '넓고 잔잔하게 흘러 나갔다.' },

  { id: 'item/fig-leaf', name: '무화과 잎', stage: 'eden', fact: '두 사람이 엮어 몸을 가린 잎', ref: '창 3:7', memo: '에덴을 떠나며 받은 기념물. 가죽옷을 지어 입히신 일도 함께 기억한다.' },

  { id: 'word/gen-2-7', name: '흙과 생명의 숨', stage: 'eden', fact: '흙으로 사람을 지으시고 생명의 숨을 불어넣으셨다', ref: '창 2:7', memo: '사람이 살아 있는 존재가 된 처음 순간이다.' },
  { id: 'word/gen-3-15', name: '여자의 후손', stage: 'eden', fact: '여자의 후손이 뱀의 머리를 상하게 한다', ref: '창 3:15', memo: '대천사가 꼭 기억해 두라고 한 약속이다.' },
];

// 닮은 인물: 인물마다 그 사람의 삶에서 두드러진 열매 두 가지와 긍정형 문장(감수 목록에 오른다).
// 문장에는 줄바꿈 기호를 넣지 않는다. 상태 창의 폭에 맞춰 text-wrap: balance가 나눈다.
// 상태 창은 도감에서 만난 인물 가운데 이 두 열매의 점수 합이 가장 큰 인물을 보여 준다.
export const LIKENESS = {
  adam: { fruits: ['faith', 'joy'], text: '맡겨진 동산을 일구고 지킨 아담처럼, 맡은 일을 끝까지 성실하게 해내요.', why: '창 2:15 일구고 지킴(신실), 창 2:23 기쁨의 고백(기쁨)' },
  eve: { fruits: ['love', 'kindness'], text: '모든 산 사람의 어머니가 된 하와처럼, 곁에 있는 사람을 따뜻하게 품어요.', why: '창 3:20 모든 산 사람의 어머니(사랑), 창 4:1 생명을 품고 돌봄(친절)' },
};
