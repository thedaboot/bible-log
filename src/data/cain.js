// 가인과 아벨(창 4장). 대사 규칙은 eden.js와 같다. 하나님의 이름표는 YHWH(voice)다.
// 창 4:8(가인이 아벨을 침)은 멀리서 비추고 쓰러지는 모습까지만 보인다. 가인이 아우를 덮어 감춘 뒤(각색, hidden), 그 뜻은 창 4:9~10 대사로 전한다
// (docs/standards/quests-and-staging.md "연출").

// 들판에 흩어진 양. 곁에 머무르면 아벨의 우리로 따라간다. lamb은 제물 준비 때 아벨에게 데려갈 첫 새끼(창 4:4).
export const FLOCK = [
  { id: 'spot', name: '얼룩귀', size: 0.95 },
  { id: 'gray', name: '잿빛 양', size: 1.0 },
  { id: 'big', name: '큰뿔', size: 1.1 },
  { id: 'small', name: '꼬마', size: 0.8 },
  { id: 'mother', name: '어린양의 어미', size: 1.0 }, // 어린양(첫 새끼)이 이 어미 곁을 따라다닌다
];

export const CAIN = {
  arrive: [
    { who: 'narr', text: '하와가 가인을 낳고 말하였다.', ref: '창 4:1' },
    { who: 'eve', text: '여호와께서 도우셔서 내가 아들을 얻었다.', ref: '창 4:1' },
    { who: 'narr', text: '하와가 또 가인의 아우 아벨을 낳았다.', ref: '창 4:2' },
    { who: 'narr', text: '아벨은 양을 치는 사람이 되었고, 가인은 땅을 일구는 사람이 되었다.', ref: '창 4:2' },
    { who: 'angel', text: '여기는 에덴 동쪽 들판이에요.\n해가 지기 전에 아벨이 양을 모으고 있어요.', ref: null },
    { who: 'angel', text: '흩어진 양 곁에 머물러서 양 우리로 데려가 보아요.', ref: null },
  ],
  sheepDone: [
    { who: 'angel', text: '양이 모두 우리에 들어갔어요.\n아벨이 우리 문 앞에서 양을 세고 있어요.', ref: null },
  ],
  // 막간 뒤, 다음 날 아침
  offering: [
    { who: 'narr', text: '때가 되어, 가인은 땅의 소산으로 여호와께 제물을 가져왔다.', ref: '창 4:3' },
    { who: 'angel', text: '아벨이 드릴 첫 새끼를 찾고 있어요.\n어미 곁의 어린양을 아벨에게 데려가 보아요.', ref: null },
  ],
  offered: [
    { who: 'narr', text: '아벨도 양 떼의 첫 새끼와 그 기름을 가져왔다.', ref: '창 4:4' },
    // 이 대사가 나오면 아벨의 제물에 빛이 내린다(focus: 'abel')
    { who: 'narr', text: '여호와께서 아벨과 그 제물은 받으셨으나,\n가인과 그 제물은 받지 않으셨다.', ref: '창 4:4~5', focus: 'abel' },
    { who: 'narr', text: '가인이 몹시 화가 나서 얼굴빛이 변하였다.', ref: '창 4:5' },
    { who: 'voice', text: '네가 어찌하여 화를 내느냐? 어찌하여 얼굴빛이 변하였느냐?', ref: '창 4:6' },
    { who: 'voice', text: '네가 옳게 행하면 어찌 받아들여지지 않겠느냐?', ref: '창 4:7' },
    { who: 'voice', text: '옳게 행하지 않으면 죄가 문 앞에 엎드려 있다.\n죄가 너를 원하나, 너는 죄를 다스려야 한다.', ref: '창 4:7' },
  ],
  // 들: 카메라가 멀리서 비춘다. 가인이 다가가고 아벨이 쓰러지는 데까지만 보인다.
  field: [
    { who: 'narr', text: '가인이 아우 아벨에게 말하고, 둘이 들로 나갔다.', ref: '창 4:8' },
  ],
  fallen: [
    { who: 'narr', text: '들에 있을 때, 가인이 아우 아벨을 쳐 죽였다.', ref: '창 4:8' },
  ],
  // 본문에 없는 각색: 가인이 아벨을 끌어다 덮는다. "모릅니다"(창 4:9)가 감춘 뒤의 거짓말로 읽히게 한다.
  hidden: [
    { who: 'narr', text: '가인은 주위를 둘러보고 아우를 덤불 밑으로 끌고 갔다.', ref: null, basis: '각색: 창 4:9 모른다는 대답, 창 4:10 땅에서 들리는 피 소리' },
    { who: 'narr', text: '흙과 마른 가지로 덮어, 아무 일도 없었던 것처럼 감추었다.', ref: null, basis: '각색: 창 4:11 땅이 입을 벌려 아우의 피를 받음' },
  ],
  trial: [
    { who: 'voice', text: '네 아우 아벨이 어디 있느냐?', ref: '창 4:9' },
    { who: 'cain', text: '모릅니다. 제가 아우를 지키는 사람입니까?', ref: '창 4:9' },
    // 이 대사가 나오면 덮은 자리가 은은히 빛난다(focus: 'cry')
    { who: 'voice', text: '네가 무슨 일을 하였느냐?\n네 아우의 피가 땅에서 나에게 울부짖고 있다.', ref: '창 4:10', focus: 'cry' },
    { who: 'voice', text: '이제 너는 땅에서 저주를 받아,\n땅을 일구어도 땅이 다시는 힘을 내주지 않을 것이다.', ref: '창 4:11~12' },
    { who: 'voice', text: '너는 땅에서 떠돌며 헤매는 사람이 될 것이다.', ref: '창 4:12' },
    { who: 'cain', text: '제가 받을 벌이 너무 무거워 견딜 수 없습니다.', ref: '창 4:13' },
    { who: 'cain', text: '떠돌다가 저를 만나는 사람마다 저를 죽이려 할 것입니다.', ref: '창 4:14' },
    { who: 'voice', text: '그렇지 않다. 가인을 죽이는 자는 일곱 배로 벌을 받을 것이다.', ref: '창 4:15' },
    { who: 'narr', text: '여호와께서 가인에게 표를 주셔서,\n누구든지 그를 만나도 죽이지 못하게 하셨다.', ref: '창 4:15' },
    { who: 'narr', text: '가인은 여호와 앞을 떠나 에덴 동쪽 놋 땅에 머물렀다.', ref: '창 4:16' },
  ],
  seth: [
    { who: 'narr', text: '아담과 하와가 다시 아들을 낳고 이름을 셋이라 하였다.', ref: '창 4:25' },
    { who: 'eve', text: '하나님께서 가인이 죽인 아벨 대신 나에게 다른 아들을 주셨다.', ref: '창 4:25' },
    { who: 'narr', text: '셋도 아들을 낳아 에노스라 하였다.\n그때부터 사람들이 여호와의 이름을 부르기 시작하였다.', ref: '창 4:26' },
    { who: 'angel', text: '죄가 문 앞에 엎드려 있어도 다스리라고 하셨어요.\n오늘 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 장 끝 구절 퀴즈. 핵심 말씀은 창 4:7.
export const CAIN_QUIZ = [
  { q: '아벨은 어떤 일을 하는 사람이었나요?', options: ['양을 치는 사람', '땅을 일구는 사람', '장막에 사는 사람'], answer: 0, ref: '창 4:2' },
  { q: '아벨은 무엇을 제물로 가져왔나요?', options: ['땅의 소산', '양 떼의 첫 새끼와 그 기름', '무화과 열매'], answer: 1, ref: '창 4:4' },
  { q: '하나님께서는 죄가 어디에 엎드려 있다고 하셨나요?', options: ['문 앞', '들판 끝', '우물가'], answer: 0, ref: '창 4:7' },
];

// 막간: 아벨과 끝까지 하는 대화. 양을 우리에 다 모은 저녁, 제물을 가져오기(창 4:3~4) 전이다.
// 본문에 없는 각색이라 ref: null이고 근거는 basis에 둔다. 아벨의 말투는 아담처럼 예스럽게 쓴다.
export const CAIN_INTERLUDE = {
  who: 'abel',
  steps: [
    { say: [
      { who: 'narr', text: '해가 지자 아벨이 우리 문을 닫고 손가락을 접어 가며 양을 세었다.', ref: null, basis: '창 4:2 양 치는 자' },
      { who: 'abel', text: '당신이 몰아 준 거요? 오늘은 한 마리도 안 헤매고 들어왔소.', ref: null, basis: '막간: 인물이 관찰자를 알아본다' },
      { who: 'abel', text: '얼룩귀는 늘 마지막이오. 풀 한 입만 더 먹겠다고 버티는 녀석이지.', ref: null, basis: '창 4:2 양 치는 자' },
    ] },
    { choose: [
      { text: '한 마리도 안 빠졌어요!', fruit: 'joy', reply: [
        { who: 'abel', text: '그렇소. 다섯 마리에 어린양 하나, 다 있소.\n이런 날은 나도 잠이 잘 오지.', ref: null, basis: '창 4:2 양 치는 자' },
      ] },
      { text: '(어린양을 쓰다듬는다)', fruit: 'gentle', reply: [
        { who: 'narr', text: '어린양이 손바닥에 머리를 비볐다.\n아벨이 웃으며 털에 붙은 풀씨를 떼어 주었다.', ref: null, basis: '창 4:2, 사 40:11 어린 양을 품에 안는 목자' },
      ] },
      { text: '저녁마다 세시는 거예요?', fruit: 'patience', reply: [
        { who: 'abel', text: '날마다 세오.\n하나가 모자라면 그 하나를 찾을 때까지 들판에 있어야 하니.', ref: null, basis: '창 4:2 양 치는 자' },
      ] },
      { text: '내일은 같이 셀게요.', fruit: 'kindness', need: { joy: 1 }, reply: [
        { who: 'abel', text: '좋소. 그럼 당신은 저쪽 줄부터 세시오.\n얼룩귀가 또 줄을 바꿀 테니 잘 보시오.', ref: null, basis: '창 4:2' },
      ] },
    ] },
    { say: [
      { who: 'abel', text: '내일은 형님과 함께 여호와께 드릴 것을 가져가오.', ref: null, basis: '창 4:3~4' },
      { who: 'abel', text: '나는 이 어린양을 드리려 하오.\n올봄에 가장 먼저 났고, 가장 튼튼하오.', ref: null, basis: '창 4:4 양의 첫 새끼, 히 11:4' },
      { who: 'abel', text: '형님은 밭에서 거둔 것을 드린다더군.', ref: null, basis: '창 4:3 땅의 소산' },
    ] },
    { choose: [
      { text: '첫 새끼부터 드리는군요.', fruit: 'faith', reply: [
        { who: 'abel', text: '좋은 것을 주신 분께 남은 것을 드릴 수는 없지 않소.', ref: null, basis: '창 4:4 첫 새끼와 그 기름, 히 11:4 더 나은 제사' },
      ] },
      { text: '어린양한테는 말했어요?', fruit: 'kindness', reply: [
        { who: 'abel', text: '아직이오. 오늘 밤엔 풀을 한 줌 더 주었소.\n아깝지 않다면 거짓말이지.', ref: null, basis: '창 4:4, 출 13:2 처음 난 것' },
      ] },
      { text: '형님 밭엔 뭐가 났어요?', fruit: 'peace', reply: [
        { who: 'abel', text: '보리가 제법 여물었소.\n내일은 형님이 곡식 단을, 나는 어린양을 안고 가오.', ref: null, basis: '창 4:3~4 땅의 소산과 양의 첫 새끼(곡식 종류는 각색)' },
      ] },
      { text: '형님 몫도 같이 기도할게요.', fruit: 'love', need: { gentle: 1 }, reply: [
        { who: 'abel', text: '고맙소. 형님은 요즘 엉겅퀴를 뽑느라 손이 성한 날이 없소.', ref: null, basis: '창 3:17~18 가시덤불과 엉겅퀴, 창 4:2 땅을 일구는 자' },
      ] },
    ] },
    { say: [
      { who: 'abel', text: '해가 다 졌구려. 내일은 일찍 나서야 하오.', ref: null, basis: '창 4:3~4 제물을 가져가기 전날' },
    ] },
  ],
};

// 양을 모으는 동안 가인 곁을 지나가면 듣는 짧은 인사(관계 "만남")
export const CAIN_GREETING = [
  { who: 'cain', text: '밭고랑은 밟지 마시오. 겨우 싹이 올라왔소.', ref: null, basis: '창 4:2 땅을 일구는 자, 창 3:17~19 수고하여 먹음' },
];
