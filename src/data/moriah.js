// 1-8 모리아 산(창 22장). 폭력 연출 규칙(docs/standards/quests-and-staging.md): 제단에 눕히고 칼을 드는 장면은
// 멀리서 비추고 서술로만 전하며, 여호와의 사자가 부르는 창 22:11~12에서 멈춘다. 칼을 내리치는 동작은 그리지 않는다.

const lines = {
  arrive: [
    { who: 'narr', text: '그 일들이 있은 뒤, 하나님께서 아브라함을 시험하셨다.', ref: '창 22:1' },
    { who: 'voice', text: '네 아들, 네가 사랑하는 외아들 이삭을 데리고 모리아 땅으로 가서,\n내가 일러 줄 산에서 번제로 드려라.', ref: '창 22:2' },
    { who: 'narr', text: '아브라함이 아침 일찍 나귀에 안장을 얹고, 종 둘과 이삭을 데리고\n번제에 쓸 나무를 쪼개어 길을 떠났다.', ref: '창 22:3' },
    { who: 'narr', text: '사흘째 되던 날, 아브라함의 눈에 멀리 그곳이 들어왔다.', ref: '창 22:4' },
    { who: 'abraham', text: '너희는 나귀와 함께 여기 있어라.\n아이와 나는 저기 가서 경배하고 너희에게 돌아오겠다.', ref: '창 22:5' },
  ],
  climb: [
    { who: 'narr', text: '이삭은 번제 나무를 지고, 아브라함은 불과 칼을 손에 들었다.', ref: '창 22:6' },
    { who: 'angel', text: '두 사람이 산길을 올라요. 한 걸음 앞서 길목마다 기다려 주어요.', ref: null },
  ],
  ask: [
    { who: 'isaac', text: '아버지, 불과 나무는 여기 있는데 번제할 어린양은 어디 있습니까?', ref: '창 22:7' },
    { who: 'abraham', text: '아들아, 번제할 어린양은 하나님께서 친히 준비하실 것이다.', ref: '창 22:8' },
    { who: 'narr', text: '두 사람은 다시 함께 걸어갔다.', ref: '창 22:8' },
  ],
  // 도전(각색, F58): 가파른 비탈에서 이삭의 나뭇단을 곁에서 받쳐 준다(창 22:6 이삭이 번제 나무를 지고 오름)
  steady: [
    { who: 'narr', text: '길이 가팔라지자 이삭이 진 나뭇단이 이리저리 기우뚱거렸다.', ref: null },
    { who: 'angel', text: '꾹 누르고 있으면 나뭇단이 들리고, 떼면 내려가요.\n표시를 가운데 금빛에 머물게 받쳐 주어요.', ref: null },
    { who: 'isaac', text: '덕분에 한 개비도 안 떨어뜨렸어요. 이제 꼭대기가 보여요.', ref: null },
  ],
  altar: [
    { who: 'narr', text: '하나님께서 일러 주신 곳에 이르러,\n아브라함이 제단을 쌓고 나무를 가지런히 놓았다.', ref: '창 22:9' },
    { who: 'narr', text: '아브라함이 아들 이삭을 묶어 제단 나무 위에 눕히고,\n손을 뻗어 칼을 잡았다.', ref: '창 22:9~10' },
  ],
  call: [
    { who: 'messenger', text: '아브라함아, 아브라함아!', ref: '창 22:11' },
    { who: 'abraham', text: '제가 여기 있습니다.', ref: '창 22:11' },
    { who: 'messenger', text: '아이에게 손대지 마라. 그 아이에게 아무것도 하지 마라.', ref: '창 22:12' },
    { who: 'messenger', text: '네가 네 외아들까지 아끼지 않았으니,\n이제 네가 하나님을 경외하는 줄 안다.', ref: '창 22:12' },
  ],
  ram: [
    { who: 'narr', text: '아브라함이 눈을 들어 보니,\n숫양 한 마리가 뒤쪽 덤불에 뿔이 걸려 있었다.', ref: '창 22:13' },
    { who: 'narr', text: '아브라함이 가서 그 숫양을 아들 대신 번제로 드렸다.', ref: '창 22:13' },
    { who: 'narr', text: '아브라함이 그곳 이름을 여호와 이레라 하였다.\n여호와의 산에서 준비되리라는 뜻이다.', ref: '창 22:14' },
    { who: 'messenger', text: '네가 내 말에 순종하였으니,\n네 씨로 말미암아 땅의 모든 민족이 복을 받을 것이다.', ref: '창 22:18' },
    { who: 'angel', text: '번제할 양은 하나님께서 친히 준비하셨어요.\n산에서 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 종들이 나귀와 함께 남는 산 아래(창 22:5 뒤)에서, 오르기 전에 이삭과 끝까지 대화한다.
const interlude = {
  who: 'isaac',
  steps: [
    { say: [
      { who: 'narr', text: '이삭이 등에 진 나뭇단을 고쳐 메고 끈을 단단히 묶었다.', ref: null, basis: '창 22:6 나무를 이삭에게 지움' },
      { who: 'isaac', text: '사흘 내내 우리 뒤를 따라온 분이시지요?\n아버지는 오늘 말씀이 별로 없으세요.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 22:4' },
    ] },
    { choose: [
      { text: '나뭇단이 이삭보다 크네요.', fruit: 'kindness', reply: [
        { who: 'isaac', text: '보기만 그래요. 아버지가 불과 칼을 드셨으니 나무는 제가 져야지요.', ref: null, basis: '창 22:6' },
      ] },
      { text: '(끈 매듭을 같이 묶어 준다)', fruit: 'goodness', reply: [
        { who: 'narr', text: '이삭이 고맙다며 웃었다.\n매듭을 당겨 보고는 나뭇단을 한 번 들썩여 보였다.', ref: null, basis: '창 22:6' },
      ] },
      { text: '아버지 걱정되세요?', fruit: 'love', reply: [
        { who: 'isaac', text: '네. 길에서 몇 번이나 저를 한참 바라보셨어요.\n무슨 생각을 하시는지 모르겠어요.', ref: null, basis: '창 22:2 사랑하는 외아들' },
      ] },
      { text: '함께 올라가 줄게요.', fruit: 'faith', need: { kindness: 1 }, reply: [
        { who: 'isaac', text: '그래 주세요.\n오늘은 아버지 기도를 같이 들어 줄 사람이 한 명 더 있네요.', ref: null, basis: '창 22:5 경배하고 돌아오리라' },
      ] },
    ] },
    { say: [
      { who: 'isaac', text: '어머니 말로는 제 이름이 웃음이라는 뜻이에요.\n제가 태어나자 다들 웃었대요.', ref: null, basis: '창 21:3~6 이삭, 하나님이 나를 웃게 하심' },
      { who: 'isaac', text: '아버지는 그때 백 살이셨어요.', ref: null, basis: '창 21:5' },
    ] },
    { choose: [
      { text: '이름 부를 때마다 웃겠네요.', fruit: 'joy', reply: [
        { who: 'isaac', text: '맞아요. 어머니는 지금도 저를 부르실 때마다 웃으세요.', ref: null, basis: '창 21:6' },
      ] },
      { text: '약속대로 태어났네요.', fruit: 'faith', reply: [
        { who: 'isaac', text: '맞아요. 아버지는 별을 볼 때마다 그 이야기를 하세요.', ref: null, basis: '창 18:10, 21:1~2' },
      ] },
      { text: '천천히 올라가요.', fruit: 'patience', reply: [
        { who: 'isaac', text: '그래요. 길이 가팔라서 아버지 걸음에 맞춰야 해요.', ref: null, basis: '창 22:8 두 사람이 함께 나아감' },
      ] },
    ] },
    { say: [
      { who: 'isaac', text: '아버지가 부르세요. 이제 올라가요.', ref: null, basis: '창 22:6으로 이어짐' },
    ] },
  ],
};

// 깊은 대화: 아브라함(관계 "대화" 이상 + 레벨 DEEP_LEVEL.abraham). 종들이 남는 자리에서, 오르기 전이다.
const deep = {
  who: 'abraham',
  locked: [
    { who: 'abraham', text: '오늘은 말을 아끼고 싶소. 아이를 부탁하오.', ref: null, basis: '창 22:5 깊은 대화가 닫혀 있을 때' },
  ],
  steps: [
    { say: [
      { who: 'narr', text: '아브라함이 칼집을 허리에 차다가 손을 멈추었다.', ref: null, basis: '창 22:6 불과 칼' },
      { who: 'abraham', text: '당신은 마므레에서도 내 곁에 있었지.\n그날 손님들이 하신 말씀을 기억하오?', ref: null, basis: '창 18:14, 깊은 대화' },
    ] },
    { choose: [
      { text: '너무 어려운 일이 없다고요.', fruit: 'faith', reply: [
        { who: 'abraham', text: '그렇소. 그 말씀대로 이 아이가 왔소.\n그러니 오늘도 그분이 하실 일을 기다리겠소.', ref: null, basis: '창 18:14, 히 11:17~19 다시 살리실 줄로 생각함' },
      ] },
      { text: '(손을 꼭 잡아 드린다)', fruit: 'love', reply: [
        { who: 'narr', text: '아브라함의 손이 떨리고 있었다. 한참 뒤에야 떨림이 잦아들었다.', ref: null, basis: '창 22:2 사랑하는 외아들' },
      ] },
      { text: '말씀 안 하셔도 돼요.', fruit: 'gentle', reply: [
        { who: 'abraham', text: '고맙소. 오늘은 그 말이 가장 큰 위로요.', ref: null, basis: '창 22:5' },
      ] },
    ] },
    { say: [
      { who: 'abraham', text: '아이에게는 하나님께서 준비하신다고만 말하겠소.\n나도 그 말을 붙들고 있소.', ref: null, basis: '창 22:8' },
    ] },
    { choose: [
      { text: '제가 끝까지 지켜볼게요.', fruit: 'patience', reply: [
        { who: 'abraham', text: '그래 주시오. 산을 내려올 때 둘이 함께이길 바라오.', ref: null, basis: '창 22:5 너희에게 돌아오리라' },
      ] },
      { text: '함께 기도해요.', fruit: 'peace', reply: [
        { who: 'abraham', text: '그럽시다. 별을 세던 밤처럼 말은 적게, 마음은 오래 두겠소.', ref: null, basis: '창 15:5~6' },
      ] },
      { text: '이삭이 아버지를 믿어요.', fruit: 'kindness', reply: [
        { who: 'abraham', text: '알고 있소. 그 믿음이 오늘 나를 더 아프게도, 더 굳세게도 하오.', ref: null, basis: '창 22:7~8' },
      ] },
    ] },
    { say: [
      { who: 'abraham', text: '가야 할 시간이오.', ref: null, basis: '창 22:6으로 이어짐' },
    ] },
  ],
};

const greetings = {
  youth: [
    { who: 'youth', text: '나귀는 저희가 지키겠습니다. 해 지기 전에 오십시오.', ref: null, basis: '창 22:5 종들은 나귀와 함께 머묾' },
  ],
};

const quiz = [
  { q: '이삭이 번제할 어린양은 어디 있냐고 묻자 아브라함은 어떻게 답했나요?', options: ['하나님께서 친히 준비하실 것이다', '산 위에 있다', '종들이 가져올 것이다'], answer: 0, ref: '창 22:8' },
  { q: '덤불에 뿔이 걸려 있던 짐승은 무엇인가요?', options: ['어린 송아지', '숫양', '산양'], answer: 1, ref: '창 22:13' },
  { q: '아브라함이 그곳에 붙인 이름은 무엇인가요?', options: ['브엘라해로이', '벧엘', '여호와 이레'], answer: 2, ref: '창 22:14' },
];

export default { id: 'moriah', lines, interlude, deep, greetings, quiz };
