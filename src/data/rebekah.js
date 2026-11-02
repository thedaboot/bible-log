// 1-9 우물가의 리브가(창 24장). 아브라함의 늙은 종은 본문에 이름이 없어 '늙은 종'으로 쓴다(창 24:2).
// 물동이(도구)는 이 스테이지 앞부분에서 얻는다(design.md "도구 획득"): 종이 짐 속의 빈 물동이를 건넨다(각색, 창 24:10).

const lines = {
  arrive: [
    { who: 'narr', text: '아브라함은 늙었고, 여호와께서 그의 모든 일에 복을 주셨다.', ref: '창 24:1' },
    { who: 'abraham', text: '내 고향, 내 친족에게 가서 이삭의 아내 될 사람을 데려오너라.', ref: '창 24:4' },
    { who: 'narr', text: '종이 낙타 열 마리를 끌고 나홀의 성에 이르렀다.\n마침 여인들이 물 길으러 나오는 저녁이었다.', ref: '창 24:10~11' },
    { who: 'servant', text: '내 주인 아브라함의 하나님 여호와여,\n오늘 일이 잘 풀리게 해 주십시오.', ref: '창 24:12' },
    { who: 'servant', text: '제가 물을 청할 때, 낙타에게까지 물을 주겠다는 소녀가 있으면\n그가 이삭의 아내로 정하신 사람인 줄 알겠습니다.', ref: '창 24:14' },
  ],
  jar: [
    { who: 'servant', text: '짐 속에 빈 물동이가 하나 있소. 들고 가시오, 쓸 데가 있을 게요.', ref: null, basis: '창 24:10 주인의 모든 좋은 것을 가지고 감, 도구 획득(각색)' },
  ],
  came: [
    { who: 'narr', text: '종의 기도가 끝나기도 전에 리브가가 물동이를 어깨에 메고 나왔다.', ref: '창 24:15' },
    { who: 'servant', text: '그 물동이의 물을 한 모금만 주시오.', ref: '창 24:17' },
    { who: 'rebekah', text: '어르신, 드십시오.', ref: '창 24:18' },
    { who: 'rebekah', text: '낙타들도 실컷 마실 때까지 물을 길어 오겠습니다.', ref: '창 24:19' },
    { who: 'angel', text: '낙타 열 마리가 마실 물이면 물동이로 수십 번이에요.\n금빛 구간에 맞춰 물동이를 기울여 보아요.', ref: null },
  ],
  watered: [
    { who: 'narr', text: '종은 여호와께서 이 길을 열어 주셨는지 알려고 말없이 지켜보았다.', ref: '창 24:21' },
    { who: 'narr', text: '낙타들이 다 마시자, 종이 금 코걸이 하나와 금팔찌 한 쌍을 꺼냈다.', ref: '창 24:22' },
    { who: 'rebekah', text: '저는 나홀의 아들 브두엘의 딸입니다.\n우리 집엔 짚도 먹이도 넉넉하고, 묵어 가실 방도 있습니다.', ref: '창 24:24~25' },
    { who: 'narr', text: '종이 그 자리에서 머리를 숙여 여호와께 경배하였다.', ref: '창 24:26' },
    { who: 'servant', text: '아브라함의 하나님 여호와를 찬송합니다.\n여호와께서 저를 곧장 주인의 동생 집으로 이끄셨습니다.', ref: '창 24:27' },
  ],
  go: [
    { who: 'narr', text: '종은 밥상을 받고도 먹기 전에 그간의 일을 다 이야기하였다.', ref: '창 24:33~49' },
    { who: 'laban', text: '이 일은 여호와께로 말미암은 것이니,\n우리가 좋다 나쁘다 말할 수 없소.', ref: '창 24:50' },
    { who: 'narr', text: '사람들이 리브가를 불러 물었다. "이 사람과 함께 가겠느냐?"', ref: '창 24:57~58' },
    { who: 'rebekah', text: '가겠습니다.', ref: '창 24:58' },
    { who: 'narr', text: '저녁 무렵 들에서 묵상하던 이삭이 눈을 드니, 낙타들이 오고 있었다.', ref: '창 24:63' },
    { who: 'narr', text: '이삭이 리브가를 맞아 아내로 삼고 그를 사랑하였다.', ref: '창 24:67' },
    { who: 'angel', text: '낙타에게 물을 주던 그 손길로 하나님께서 길을 열어 보이셨어요.\n우물가에서 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 낙타에게 물을 다 준 뒤, 종이 금붙이를 꺼내기 전(창 24:21~22 사이) 우물가에서 리브가와 끝까지 대화한다.
const interlude = {
  who: 'rebekah',
  steps: [
    { say: [
      { who: 'narr', text: '리브가가 젖은 소매를 짜며 우물가 돌에 걸터앉았다.', ref: null, basis: '창 24:20 급히 물을 길음' },
      { who: 'rebekah', text: '같이 길어 줘서 고마워요. 열 마리는 처음이에요.\n물동이를 서른 번은 들었다 놨을 거예요.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 24:10, 24:20' },
    ] },
    { choose: [
      { text: '팔 아프지 않아요?', fruit: 'kindness', reply: [
        { who: 'rebekah', text: '조금 저려요. 그래도 낙타들이 목을 축이는 소리가 좋더라고요.', ref: null, basis: '창 24:19~20' },
      ] },
      { text: '처음 본 나그네인데요.', fruit: 'goodness', reply: [
        { who: 'rebekah', text: '목마른 사람에게 물 한 모금 주는 건 이 성의 법이에요.\n낙타는 덤이고요.', ref: null, basis: '창 24:18~19' },
      ] },
      { text: '낙타는 끝도 없이 마시네요.', fruit: 'joy', reply: [
        { who: 'rebekah', text: '맨 끝 녀석이 제일 많이 마셨어요. 수염까지 다 젖은 거 보세요.', ref: null, basis: '창 24:19~20 낙타들이 다 마시기까지' },
      ] },
      { text: '내일은 제가 먼저 길을게요.', fruit: 'faith', need: { kindness: 1 }, reply: [
        { who: 'rebekah', text: '좋아요. 그럼 저는 낙타 이름부터 지어 줘야겠네요.', ref: null, basis: '창 24:20' },
      ] },
    ] },
    { say: [
      { who: 'rebekah', text: '저 어른은 먼 데서 오셨나 봐요.\n아까부터 아무 말 없이 우리만 보세요.', ref: null, basis: '창 24:21 잠잠히 주목함' },
      { who: 'rebekah', text: '기도하는 사람 얼굴 같았어요.', ref: null, basis: '창 24:12~14, 24:26' },
    ] },
    { choose: [
      { text: '좋은 소식을 기다리시나 봐요.', fruit: 'patience', reply: [
        { who: 'rebekah', text: '그럼 오늘 길어 준 물이 좋은 소식이 되면 좋겠어요.', ref: null, basis: '창 24:21 길을 평탄하게 하셨는지' },
      ] },
      { text: '함께 가 볼까요?', fruit: 'love', reply: [
        { who: 'rebekah', text: '그래요. 오라버니 라반이 손님을 좋아하거든요.', ref: null, basis: '창 24:29 라반이 우물로 달려나감' },
      ] },
      { text: '(물 한 바가지를 건넨다)', fruit: 'peace', reply: [
        { who: 'narr', text: '리브가가 웃으며 받아 마셨다.\n물 긷는 사람이 마지막으로 마시는 물이었다.', ref: null, basis: '창 24:20' },
      ] },
    ] },
    { say: [
      { who: 'rebekah', text: '어머, 저 어른이 무언가 꺼내시네요.', ref: null, basis: '창 24:22로 이어짐' },
    ] },
  ],
};

const greetings = {
  laban: [
    { who: 'laban', text: '누이가 늦는다 했더니 낙타 떼를 만났구먼. 손님이시오?', ref: null, basis: '창 24:29~30 라반' },
  ],
};

const quiz = [
  { q: '아브라함의 종은 낙타 몇 마리를 끌고 갔나요?', options: ['다섯 마리', '열 마리', '스무 마리'], answer: 1, ref: '창 24:10' },
  { q: '리브가는 종에게 물을 준 뒤 무엇을 하겠다고 했나요?', options: ['집으로 데려가겠다', '오라버니를 부르겠다', '낙타들도 마시게 하겠다'], answer: 2, ref: '창 24:19' },
  { q: '종은 누가 자기를 주인의 동생 집으로 인도하셨다고 찬송했나요?', options: ['여호와', '리브가', '라반'], answer: 0, ref: '창 24:27' },
];

export default { id: 'rebekah', lines, interlude, greetings, quiz };
