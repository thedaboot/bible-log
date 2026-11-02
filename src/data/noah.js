// 1-4 노아의 방주(창 6~9장). 대사 규칙은 docs/standards/dialogue.md. 하나님의 이름표는 YHWH(voice)다.
// 본문이 '하나님'(엘로힘)이라고 부르는 자리도 창 2:4 이후라 이름표는 YHWH로 둔다(dialogue.md "화자와 이름표").

const lines = {
  arrive: [
    { who: 'narr', text: '땅 위에 사람의 악이 가득하고,\n마음으로 꾀하는 것이 늘 악할 뿐이었다.', ref: '창 6:5' },
    { who: 'narr', text: '그러나 노아는 여호와께 은혜를 입었다.', ref: '창 6:8' },
    { who: 'narr', text: '노아는 의롭고 흠이 없는 사람으로, 하나님과 동행하였다.', ref: '창 6:9' },
    { who: 'voice', text: '너는 고페르 나무로 방주를 만들고, 안팎에 역청을 칠하여라.', ref: '창 6:14' },
    { who: 'voice', text: '길이는 삼백 규빗, 너비는 오십 규빗, 높이는 삼십 규빗이다.', ref: '창 6:15' },
    { who: 'narr', text: '노아는 하나님께서 명하신 대로 다 하였다.', ref: '창 6:22' },
    { who: 'angel', text: '노아가 방주를 짓고 있어요.\n막대의 금빛 구간에 맞춰 함께 일해 보아요.', ref: null },
  ],
  built: [
    { who: 'noah', text: '이제 지붕까지 덮었구려. 문은 옆으로 내었소.', ref: null, basis: '창 6:16 지붕과 옆문' },
    { who: 'voice', text: '모든 정결한 짐승은 일곱 쌍씩, 정결하지 않은 짐승은 한 쌍씩\n데려가 그 씨를 온 땅 위에 살려 두어라.', ref: '창 7:2~3' },
    { who: 'angel', text: '들판의 짐승들 곁에 머물러 방주로 들여보내 보아요.', ref: null },
  ],
  animalsIn: [
    { who: 'narr', text: '짐승들이 둘씩 노아에게 나아와 방주로 들어갔다.', ref: '창 7:9' },
    { who: 'voice', text: '이레 뒤에 내가 사십 일 밤낮으로 땅에 비를 내리겠다.', ref: '창 7:4' },
  ],
  flood: [
    { who: 'narr', text: '노아와 그 아내, 세 아들과 며느리들이 방주에 들어가자\n여호와께서 문을 닫으셨다.', ref: '창 7:13~16' },
    { who: 'narr', text: '그날 큰 깊음의 샘들이 터지고 하늘의 창들이 열렸다.', ref: '창 7:11' },
    { who: 'narr', text: '물이 불어나 방주가 땅에서 떠올랐다.', ref: '창 7:17' },
    { who: 'narr', text: '물이 백오십 일 동안 땅에 넘쳤다.', ref: '창 7:24' },
  ],
  remembered: [
    { who: 'narr', text: '하나님께서 노아와 방주 안의 모든 짐승을 기억하시고,\n바람을 불게 하시니 물이 줄어들었다.', ref: '창 8:1' },
    { who: 'narr', text: '일곱째 달 열이렛날, 방주가 아라랏 산에 머물렀다.', ref: '창 8:4' },
  ],
  birds: [
    { who: 'narr', text: '사십 일 뒤 노아가 창문을 열고 까마귀를 내보냈다.', ref: '창 8:6~7' },
    { who: 'narr', text: '다시 비둘기를 내보내니, 앉을 곳을 찾지 못하고 돌아왔다.', ref: '창 8:8~9' },
    { who: 'narr', text: '이레를 더 기다려 다시 내보내니,\n저녁때 비둘기가 새 올리브 잎을 물고 왔다.', ref: '창 8:10~11' },
    { who: 'noah', text: '땅에서 물이 걷혔구나.', ref: '창 8:11' },
  ],
  out: [
    { who: 'voice', text: '너는 아내와 아들들과 며느리들과 함께 방주에서 나오너라.', ref: '창 8:16' },
    { who: 'narr', text: '노아가 여호와를 위하여 제단을 쌓고 번제를 드렸다.', ref: '창 8:20' },
    { who: 'voice', text: '다시는 사람 때문에 땅을 저주하지 않겠다.', ref: '창 8:21' },
    { who: 'voice', text: '땅이 있는 동안 심고 거두는 일, 추위와 더위,\n여름과 겨울, 낮과 밤이 그치지 않을 것이다.', ref: '창 8:22' },
  ],
  rainbow: [
    { who: 'voice', text: '내가 내 무지개를 구름 속에 두었으니,\n이것이 나와 땅 사이의 언약의 표가 될 것이다.', ref: '창 9:13' },
    { who: 'voice', text: '다시는 물이 모든 생명을 멸하는 홍수가 되지 않을 것이다.', ref: '창 9:15' },
    { who: 'angel', text: '구름 사이에 걸린 무지개가 약속의 표래요.\n오늘 본 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 짐승들이 다 들어간 저녁, 비가 오기 전 이레(창 7:4~10) 동안 방주 문 앞에서 노아와 끝까지 대화한다.
const interlude = {
  who: 'noah',
  steps: [
    { say: [
      { who: 'narr', text: '노아가 방주 문턱에 걸터앉아 손바닥의 역청을 긁어냈다.', ref: null, basis: '창 6:14 안팎에 역청을 칠함' },
      { who: 'noah', text: '당신이 나를 도와 판자를 받쳐 주었구려.\n이 일을 하는 동안 이웃들은 늘 웃기만 했소.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 벧후 2:5 의를 전하는 노아' },
    ] },
    { choose: [
      { text: '끝까지 지으셨잖아요.', fruit: 'patience', reply: [
        { who: 'noah', text: '망치를 내려놓고 싶은 날이 왜 없었겠소.\n그래도 하나님께서 명하신 길이를 다 채웠소.', ref: null, basis: '창 6:15, 6:22 명하신 대로 다 함' },
      ] },
      { text: '(역청 묻은 손을 닦아 준다)', fruit: 'kindness', reply: [
        { who: 'narr', text: '노아가 손을 내밀었다. 손바닥마다 굳은살이 판자 결처럼 박여 있었다.', ref: null, basis: '창 6:14~16 방주를 지음' },
      ] },
      { text: '비가 정말 올까요?', fruit: 'faith', reply: [
        { who: 'noah', text: '나도 아직 본 적이 없는 일이오. 그래도 말씀하신 분을 믿고 지었소.', ref: null, basis: '히 11:7 아직 보이지 않는 일에 경고하심을 받아' },
      ] },
      { text: '저도 같이 끝까지 할게요.', fruit: 'goodness', need: { patience: 1 }, reply: [
        { who: 'noah', text: '그 말이 고맙소. 내일은 짐승들 먹이를 싣는 일이 남았소.', ref: null, basis: '창 6:21 먹을 양식을 저축함' },
      ] },
    ] },
    { say: [
      { who: 'noah', text: '이레가 지나면 비가 온다고 하셨소.', ref: null, basis: '창 7:4' },
      { who: 'noah', text: '셈과 함과 야벳은 먹이를 나르고, 며느리들은 물을 길어 두었소.', ref: null, basis: '창 6:10, 6:21' },
    ] },
    { choose: [
      { text: '가족이 다 함께라 다행이에요.', fruit: 'peace', reply: [
        { who: 'noah', text: '여덟 식구요. 그 넷이 함께 문을 닫고 들어갈 것이오.', ref: null, basis: '벧전 3:20 여덟 명, 창 7:13' },
      ] },
      { text: '무섭지 않으세요?', fruit: 'gentle', reply: [
        { who: 'noah', text: '무섭소. 그래서 저녁마다 문 앞에 앉아 기도하오.', ref: null, basis: '창 6:9 하나님과 동행함' },
      ] },
      { text: '짐승들도 다 편해 보여요.', fruit: 'joy', reply: [
        { who: 'noah', text: '비둘기 한 쌍은 벌써 창가 들보에 자리를 잡았소.', ref: null, basis: '창 6:16 창, 창 7:14 새' },
      ] },
      { text: '이웃들 생각도 나요.', fruit: 'love', need: { kindness: 1 }, reply: [
        { who: 'noah', text: '나도 그렇소. 마지막 날까지 문은 열어 두려 하오.', ref: null, basis: '벧후 2:5 의를 전파하는 노아, 벧전 3:20 노아의 날에 기다리심' },
      ] },
    ] },
    { say: [
      { who: 'noah', text: '해가 지는구려. 내일 마지막 먹이를 싣겠소.', ref: null, basis: '창 7:4~10 이레 동안' },
    ] },
  ],
};

const greetings = {
  shem: [
    { who: 'narr', text: '노아의 아들이 먹이 자루를 어깨에 메고 지나가며 고개를 끄덕였다.', ref: null, basis: '창 6:21 먹을 양식, 창 6:10 세 아들' },
  ],
};

const quiz = [
  { q: '노아는 무슨 나무로 방주를 지었나요?', options: ['고페르 나무', '올리브나무', '무화과나무'], answer: 0, ref: '창 6:14' },
  { q: '비둘기는 저녁에 무엇을 물고 돌아왔나요?', options: ['포도송이', '새 올리브 잎', '작은 돌'], answer: 1, ref: '창 8:11' },
  { q: '하나님께서 구름 속에 두신 언약의 표는 무엇인가요?', options: ['별', '빛기둥', '무지개'], answer: 2, ref: '창 9:13' },
];

export default { id: 'noah', lines, interlude, greetings, quiz };
