// 에덴(창 2:4~3:24). 대사 규칙은 prologue.js와 같다. 창 2:4부터 하나님의 이름표는 YHWH(voice)다.

// 네 강: 순서대로 찾지 않아도 된다. 강 끝에 닿으면 그 강의 대사가 나온다.
export const RIVERS = [
  { id: 'pishon', name: '비손', lines: [
    { who: 'narr', text: '첫째 강의 이름은 비손이다. 금이 나는 하윌라 온 땅을 둘러 흘렀다.', ref: '창 2:11' },
    { who: 'narr', text: '그 땅의 금은 질이 좋았고, 베델리엄과 호마노 보석도 났다.', ref: '창 2:12' },
  ] },
  { id: 'gihon', name: '기혼', lines: [
    { who: 'narr', text: '둘째 강의 이름은 기혼이다. 구스 온 땅을 둘러 흘렀다.', ref: '창 2:13' },
  ] },
  { id: 'tigris', name: '힛데겔', lines: [
    { who: 'narr', text: '셋째 강의 이름은 힛데겔이다. 앗수르 동쪽으로 흘렀다.', ref: '창 2:14' },
  ] },
  { id: 'euphrates', name: '유브라데', lines: [
    { who: 'narr', text: '넷째 강은 유브라데다.', ref: '창 2:14' },
  ] },
];

// 아담이 이름을 지어 준 동물(창 2:19~20). kind는 props.js의 makeAnimal 모양, 색과 크기는 임시 도형용이다.
export const ANIMALS = [
  { name: '사자', kind: 'lion', color: 0xc8a165, size: 1.2 },
  { name: '양', kind: 'sheep', color: 0xf5f5f0, size: 0.95 },
  { name: '코끼리', kind: 'elephant', color: 0x8d8d95, size: 1.6 },
  { name: '사슴', kind: 'deer', color: 0x9a6b3f, size: 1.1 },
  { name: '말', kind: 'horse', color: 0x7a5a3a, size: 1.2 },
  { name: '곰', kind: 'bear', color: 0x5a3d2b, size: 1.25 },
];

// 먹어도 되는 열매. 에덴 열매의 종류는 본문에 없어서, 성경의 다른 곳에 나오는 열매로 채운 각색이다.
// 무화과(창 3:7), 석류(출 28:33), 포도(민 13:23), 올리브(신 8:8), 대추야자(신 34:3 종려)
export const FRUITS = [
  { name: '무화과', kind: 'fig' }, { name: '석류', kind: 'pomegranate' }, { name: '포도', kind: 'grape' },
  { name: '올리브', kind: 'olive' }, { name: '대추야자', kind: 'date' },
];

// 동물 곁에 머물렀을 때 아담이 이름을 지어 주는 대사. {animalRa}는 '사자라', '곰이라'로 바뀐다.
export const NAMING = [
  { who: 'adam', text: '너를 {animalRa} 부르겠다.', ref: '창 2:19' },
];

export const EDEN = {
  arrive: [
    { who: 'narr', text: '여호와 하나님께서 땅과 하늘을 만드시던 날,\n들에는 아직 풀 한 포기 없었고 땅을 일굴 사람도 없었다.', ref: '창 2:4~5' },
    { who: 'angel', text: '여기가 에덴이에요. 하나님께서 사람을 어떻게 지으시는지 함께 보아요.', ref: null },
    { who: 'narr', text: '여호와 하나님께서 땅의 흙으로 사람을 지으셨다.', ref: '창 2:7' },
  ],
  adamAfter: [
    { who: 'narr', text: '생명의 숨을 그 코에 불어넣으시니, 사람이 살아 있는 존재가 되었다.', ref: '창 2:7' },
    { who: 'narr', text: '여호와 하나님께서 동쪽의 에덴에 동산을 일구시고,\n지으신 사람을 그곳에 두셨다.', ref: '창 2:8' },
    { who: 'narr', text: '보기에 아름답고 먹기에 좋은 나무들이 자라났다.', ref: '창 2:9' },
    // 이 대사가 나오면 카메라가 동산 가운데로 가고 선악을 알게 하는 나무에 빛이 내린다(main.js, focus: 'center').
    { who: 'narr', text: '동산 가운데에는 생명나무와 선악을 알게 하는 나무가 있었다.', ref: '창 2:9', focus: 'center' },
    { who: 'narr', text: '강 하나가 에덴에서 흘러나와 동산을 적시고,\n거기서 갈라져 네 줄기가 되었다.', ref: '창 2:10' },
    { who: 'angel', text: '{name}님, 네 갈래로 흘러가는 강을 하나씩 찾아가 볼까요?', ref: null },
  ],
  riversDone: [
    { who: 'angel', text: '네 강을 모두 찾았어요!\n이제 하나님께서 사람에게 하시는 말씀을 들어 보아요.', ref: null },
  ],
  command: [
    { who: 'narr', text: '여호와 하나님께서 사람을 에덴 동산에 두시고,\n그곳을 일구고 지키게 하셨다.', ref: '창 2:15' },
    { who: 'voice', text: '동산의 모든 나무 열매는 마음껏 먹어도 된다.', ref: '창 2:16' },
    { who: 'voice', text: '그러나 선악을 알게 하는 나무의 열매는 먹지 마라.\n그것을 먹는 날에는 반드시 죽을 것이다.', ref: '창 2:17' },
  ],
  animalsIntro: [
    { who: 'voice', text: '사람이 혼자 있는 것이 좋지 않으니,\n그에게 꼭 맞는 돕는 이를 지어 주겠다.', ref: '창 2:18' },
    { who: 'narr', text: '여호와 하나님께서 흙으로 들짐승과 새를 지으시고,\n아담이 무엇이라 부르는지 보시려고 그에게 데려가셨다.', ref: '창 2:19' },
    { who: 'angel', text: '동물 곁에 머무르면 아담이 이름을 지어 줄 거예요.\n함께 다녀 보아요!', ref: null },
  ],
  animalsDone: [
    { who: 'narr', text: '아담이 모든 가축과 새와 들짐승에게 이름을 지어 주었다.\n그러나 아담에게 꼭 맞는 돕는 이는 없었다.', ref: '창 2:20' },
    { who: 'narr', text: '여호와 하나님께서 아담을 깊이 잠들게 하시고,\n갈빗대 하나를 취해 여자를 만드셨다.', ref: '창 2:21~22' },
  ],
  eveAfter: [
    { who: 'adam', text: '이제야 내 뼈 중의 뼈요, 살 중의 살이구나!\n남자에게서 나왔으니 여자라 부르리라.', ref: '창 2:23' },
    { who: 'narr', text: '그러므로 남자는 부모를 떠나\n아내와 하나가 되어 둘이 한 몸을 이룬다.', ref: '창 2:24' },
    { who: 'narr', text: '두 사람은 벌거벗었으나 부끄러워하지 않았다.', ref: '창 2:25' },
    { who: 'angel', text: '동산의 열매는 마음껏 먹어도 된다고 하셨죠.\n먹어도 되는 열매를 모아 볼까요?', ref: null },
  ],
  forbidden: [
    { who: 'angel', text: '이 나무는 선악을 알게 하는 나무예요.\n하나님께서 먹지 말라고 하셨어요.', ref: '창 2:17' },
  ],
  fruitDone: [
    { who: 'angel', text: '열매를 다 모았어요! 그런데… 동산 가운데에서 무슨 소리가 들려요.', ref: null },
  ],
};

export const FALL = {
  serpent: [
    { who: 'narr', text: '뱀은 여호와 하나님께서 지으신 들짐승 가운데 가장 간교하였다.', ref: '창 3:1' },
    { who: 'serpent', text: '하나님이 정말 동산의 모든 나무 열매를 먹지 말라고 하셨느냐?', ref: '창 3:1' },
    { who: 'eve', text: '동산 나무의 열매는 먹을 수 있어.', ref: '창 3:2' },
    { who: 'eve', text: '하지만 동산 가운데 나무의 열매는 먹지도 만지지도 말라고 하셨어.\n죽을지도 모른다고.', ref: '창 3:3' },
    { who: 'serpent', text: '결코 죽지 않는다.\n그것을 먹는 날 눈이 밝아져 하나님처럼 선악을 알게 될 것이다.', ref: '창 3:4~5' },
    { who: 'narr', text: '여자가 그 나무를 보니 먹음직하고 보암직하고\n지혜롭게 할 만큼 탐스러웠다.', ref: '창 3:6' },
  ],
  ate: [
    { who: 'narr', text: '여자가 열매를 따 먹고, 함께 있던 남편에게도 주니 그도 먹었다.', ref: '창 3:6' },
  ],
  eyes: [
    { who: 'narr', text: '그러자 두 사람의 눈이 밝아져 자기들이 벗은 것을 알았다.\n그래서 무화과나무 잎을 엮어 몸을 가렸다.', ref: '창 3:7' },
    { who: 'narr', text: '날이 서늘할 무렵, 동산을 거니시는 여호와 하나님의 소리가 들렸다.\n아담과 아내는 나무 사이에 숨었다.', ref: '창 3:8' },
  ],
  trial: [
    { who: 'voice', text: '네가 어디 있느냐?', ref: '창 3:9' },
    { who: 'adam', text: '동산에서 하나님의 소리를 듣고,\n제가 벗었기 때문에 두려워서 숨었습니다.', ref: '창 3:10' },
    { who: 'voice', text: '누가 너에게 벗었다고 알려 주었느냐?\n내가 먹지 말라고 한 나무 열매를 먹었느냐?', ref: '창 3:11' },
    { who: 'adam', text: '하나님께서 주셔서 저와 함께 있게 하신 여자가\n그 나무 열매를 주어서 제가 먹었습니다.', ref: '창 3:12' },
    { who: 'voice', text: '네가 어찌하여 이렇게 하였느냐?', ref: '창 3:13' },
    { who: 'eve', text: '뱀이 저를 속여서 제가 먹었습니다.', ref: '창 3:13' },
  ],
  curse: [
    { who: 'voice', text: '네가 이렇게 하였으니, 너는 모든 짐승보다 더 저주를 받아\n평생 배로 다니며 흙을 먹을 것이다.', ref: '창 3:14' },
    { who: 'voice', text: '내가 너와 여자 사이에,\n네 후손과 여자의 후손 사이에 원수가 되게 하리라.', ref: '창 3:15' },
    { who: 'voice', text: '여자의 후손은 네 머리를 상하게 하고,\n너는 그의 발꿈치를 상하게 할 것이다.', ref: '창 3:15' },
    { who: 'voice', text: '너는 아이를 낳을 때 큰 고통을 겪을 것이다.', ref: '창 3:16' },
    { who: 'voice', text: '땅이 너 때문에 저주를 받아,\n너는 평생 수고해야 그 소산을 먹을 것이다.', ref: '창 3:17' },
    { who: 'voice', text: '너는 흙이니 흙으로 돌아갈 것이다.', ref: '창 3:19' },
    { who: 'angel', text: '여자의 후손이 뱀의 머리를 상하게 한다는 말씀, 꼭 기억해 두세요.\n나중에 다시 만나게 될 약속이에요.', ref: null },
    { who: 'narr', text: '아담은 아내의 이름을 하와라 불렀다.\n그가 모든 산 사람의 어머니가 되었기 때문이다.', ref: '창 3:20' },
  ],
  clothed: [
    { who: 'narr', text: '여호와 하나님께서 아담과 그 아내를 위해 가죽옷을 지어 입히셨다.', ref: '창 3:21' },
    { who: 'voice', text: '이제 사람이 손을 뻗어 생명나무 열매까지 따 먹고\n영원히 살게 해서는 안 된다.', ref: '창 3:22' },
    { who: 'narr', text: '여호와 하나님께서 그를 에덴 동산에서 내보내시고,\n그가 나온 땅을 일구게 하셨다.', ref: '창 3:23' },
  ],
  guarded: [
    { who: 'narr', text: '하나님께서 동산 동쪽에 그룹들과 두루 도는 불 칼을 두어\n생명나무로 가는 길을 지키게 하셨다.', ref: '창 3:24' },
    { who: 'angel', text: '{name}님, 오늘 본 장면들을 바이블로그에 잘 기록해 두었어요.\n마지막으로 함께 돌아볼까요?', ref: null },
  ],
};

// 장 끝 구절 퀴즈. answer는 options의 정답 번호(0부터).
export const QUIZ = [
  { q: '여호와 하나님께서는 사람을 무엇으로 지으셨나요?', options: ['땅의 흙', '바다의 물', '하늘의 구름'], answer: 0, ref: '창 2:7' },
  { q: '에덴에서 흘러나온 강은 몇 줄기로 갈라졌나요?', options: ['두 줄기', '세 줄기', '네 줄기'], answer: 2, ref: '창 2:10' },
  { q: '하나님께서 먹지 말라고 하신 나무는 무엇인가요?', options: ['생명나무', '선악을 알게 하는 나무', '무화과나무'], answer: 1, ref: '창 2:17' },
];
