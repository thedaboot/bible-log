// 1-9 우물가의 리브가(창 24장). 아브라함의 늙은 종은 본문에 이름이 없어 '늙은 종'으로 쓴다(창 24:2).
// 물동이(도구)는 이 스테이지 앞부분에서 얻는다(design.md "도구 획득"): 종이 짐 속의 빈 물동이를 건넨다(각색, 창 24:10).

const lines = {
  arrive: [
    { who: 'narr', text: '아브라함이 나이가 많아 늙었고,\n여호와께서 범사에 그에게 복을 주셨다.', ref: '창 24:1' },
    { who: 'abraham', text: '내 고향 내 족속에게 가서 내 아들 이삭의 아내를 데려오너라.', ref: '창 24:4' },
    { who: 'narr', text: '종이 낙타 열 마리를 끌고 나홀의 성에 이르렀다.\n저녁때, 여인들이 물 길으러 나오는 때였다.', ref: '창 24:10~11' },
    { who: 'servant', text: '여호와여, 오늘 일이 잘되게 해 주십시오.', ref: '창 24:12' },
    { who: 'servant', text: '제가 물을 청할 때 낙타에게도 마시게 하겠다는 소녀가\n이삭의 아내로 정하신 사람이 되게 하십시오.', ref: '창 24:14' },
  ],
  jar: [
    { who: 'servant', text: '짐 속에 빈 물동이가 하나 남았소. 쓸 일이 있을 것 같구려.', ref: null, basis: '창 24:10 주인의 모든 좋은 것을 가지고 감, 도구 획득(각색)' },
  ],
  came: [
    { who: 'narr', text: '말을 마치기도 전에 리브가가 물동이를 어깨에 메고 나왔다.', ref: '창 24:15' },
    { who: 'servant', text: '물동이의 물을 조금 마시게 해 주시오.', ref: '창 24:17' },
    { who: 'rebekah', text: '내 주여, 마시십시오.', ref: '창 24:18' },
    { who: 'rebekah', text: '당신의 낙타들도 배불리 마시도록 물을 길어 오겠습니다.', ref: '창 24:19' },
    { who: 'angel', text: '낙타 열 마리가 마실 물은 아주 많아요.\n물동이를 기울이고, 금빛 구간에 맞춰 함께 부어 보아요.', ref: null },
  ],
  watered: [
    { who: 'narr', text: '종은 여호와께서 길을 평탄하게 하셨는지 알려고 잠잠히 지켜보았다.', ref: '창 24:21' },
    { who: 'narr', text: '낙타들이 마시기를 마치자, 종이 금 코걸이와 금 손목고리를 꺼냈다.', ref: '창 24:22' },
    { who: 'rebekah', text: '저는 나홀의 아들 브두엘의 딸입니다.\n우리 집에는 짚과 먹이가 넉넉하고 묵을 곳도 있습니다.', ref: '창 24:24~25' },
    { who: 'narr', text: '종이 머리를 숙여 여호와께 경배하였다.', ref: '창 24:26' },
    { who: 'servant', text: '아브라함의 하나님 여호와를 찬송합니다.\n주께서 나를 내 주인의 동생 집으로 인도하셨습니다.', ref: '창 24:27' },
  ],
  go: [
    { who: 'narr', text: '리브가의 집에서 종이 지난 일을 다 이야기하였다.', ref: '창 24:33~49' },
    { who: 'laban', text: '이 일은 여호와께로 말미암은 것이니,\n우리가 좋다 나쁘다 말할 수 없소.', ref: '창 24:50' },
    { who: 'narr', text: '사람들이 리브가를 불러 물었다. "이 사람과 함께 가겠느냐?"', ref: '창 24:57~58' },
    { who: 'rebekah', text: '가겠습니다.', ref: '창 24:58' },
    { who: 'narr', text: '저녁때 이삭이 들에 나가 묵상하다가, 낙타들이 오는 것을 보았다.', ref: '창 24:63' },
    { who: 'narr', text: '이삭이 리브가를 맞아 아내로 삼고 그를 사랑하였다.', ref: '창 24:67' },
    { who: 'angel', text: '작은 친절 하나로 하나님의 인도하심이 드러났어요.\n오늘 들은 말씀을 함께 돌아볼까요?', ref: null },
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
      { text: '정말 빠르셨어요!', fruit: 'joy', reply: [
        { who: 'rebekah', text: '우물 계단은 눈 감고도 뛰어 내려가요. 날마다 저녁에 오거든요.', ref: null, basis: '창 24:11, 24:16 우물로 내려가 물을 길음' },
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
