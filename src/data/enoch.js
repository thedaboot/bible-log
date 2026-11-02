// 곁길 에녹의 동행(창 5:21~24). 창 5장 족보(아담부터 노아까지)는 처음 서술로 잇는다(design.md "족보는 연결 장면").
// 본문은 짧다: 에녹이 하나님과 동행하다가 하나님이 데려가시니 세상에 있지 않았다(창 5:24, 히 11:5).

const lines = {
  arrive: [
    { who: 'narr', text: '아담은 셋을 낳았고, 셋은 에노스를, 에노스는 게난을 낳았다.', ref: '창 5:3~12' },
    { who: 'narr', text: '마할랄렐과 야렛을 지나, 야렛이 에녹을 낳았다.', ref: '창 5:15~18' },
    { who: 'narr', text: '에녹은 므두셀라를 낳은 뒤 삼백 년 동안 하나님과 동행하였다.', ref: '창 5:21~22' },
    { who: 'angel', text: '에녹이 언덕길로 나서요. 곁에서 떨어지지 않게 함께 걸어 보아요.', ref: null },
  ],
  walked: [
    { who: 'narr', text: '에녹은 모두 삼백육십오 년을 살았다.', ref: '창 5:23' },
  ],
  taken: [
    { who: 'narr', text: '에녹이 하나님과 동행하더니,\n하나님께서 그를 데려가시므로 세상에 있지 않았다.', ref: '창 5:24' },
    { who: 'narr', text: '그는 죽음을 보지 않고 옮겨졌으니,\n하나님을 기쁘시게 한다는 증거를 받았다.', ref: '히 11:5' },
    { who: 'narr', text: '므두셀라는 라멕을 낳고, 라멕은 노아를 낳았다.', ref: '창 5:25~29' },
    { who: 'angel', text: '함께 걷는다는 건 이렇게 길고 조용한 일이었네요.\n오늘 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 언덕 중턱에서 쉬며 에녹과 끝까지 대화한다. 걷기(퀘스트) 사이, 정상에 오르기 전이다.
const interlude = {
  who: 'enoch',
  steps: [
    { say: [
      { who: 'narr', text: '에녹이 바위에 앉아 숨을 고르고, 지나온 길을 내려다보았다.', ref: null, basis: '창 5:22 동행' },
      { who: 'enoch', text: '발이 빠르구려. 나는 이 길을 날마다 걷는데도 늘 여기서 쉬오.', ref: null, basis: '막간: 인물이 관찰자를 알아본다' },
    ] },
    { choose: [
      { text: '날마다 이 길을 걸으세요?', fruit: 'faith', reply: [
        { who: 'enoch', text: '므두셀라가 태어난 해부터 걸었소. 그 뒤로 하루도 빠뜨린 날이 없소.', ref: null, basis: '창 5:21~22 므두셀라를 낳은 후 동행' },
      ] },
      { text: '(곁에 말없이 앉는다)', fruit: 'peace', reply: [
        { who: 'narr', text: '바람이 풀을 쓸고 지나갔다.\n에녹이 눈을 감고 그 소리를 오래 들었다.', ref: null, basis: '창 5:24 동행' },
      ] },
      { text: '쉬어 가도 괜찮아요.', fruit: 'gentle', reply: [
        { who: 'enoch', text: '그렇소. 함께 걷는 분은 내가 쉴 때도 떠나지 않으시오.', ref: null, basis: '창 5:22, 히 13:5' },
      ] },
      { text: '저도 매일 걸어 볼게요.', fruit: 'control', need: { faith: 1 }, reply: [
        { who: 'enoch', text: '멀리 갈 것 없소. 오늘 걷던 길을 내일도 걸으면 되오.', ref: null, basis: '창 5:22 삼백 년 동안 동행' },
      ] },
    ] },
    { say: [
      { who: 'enoch', text: '사람들은 날로 거칠어지오. 하나님을 업신여기는 말도 많고.', ref: null, basis: '유 1:14~15 에녹의 예언, 창 6:5' },
      { who: 'enoch', text: '그래도 나는 이 길을 걸으며 그분께 다 말씀드리오.', ref: null, basis: '창 5:24' },
    ] },
    { choose: [
      { text: '무슨 이야기를 하세요?', fruit: 'joy', reply: [
        { who: 'enoch', text: '오늘 본 것, 므두셀라가 한 말, 밭에 난 잡초 이야기까지 다 하오.', ref: null, basis: '창 5:22 동행' },
      ] },
      { text: '거친 사람들이 밉지 않으세요?', fruit: 'love', reply: [
        { who: 'enoch', text: '미운 날도 있소. 그래서 그분 앞에 먼저 털어놓고 나서 집에 가오.', ref: null, basis: '유 1:14~15, 창 5:22' },
      ] },
      { text: '그 이야기 저도 듣고 싶어요.', fruit: 'kindness', reply: [
        { who: 'enoch', text: '그럼 정상까지 같이 갑시다. 오늘은 셋이서 걷는 셈이오.', ref: null, basis: '창 5:24 동행' },
      ] },
    ] },
    { say: [
      { who: 'enoch', text: '자, 일어납시다. 해 지기 전에 올라가야 하오.', ref: null, basis: '창 5:24' },
    ] },
  ],
};

const greetings = {
  methuselah: [
    { who: 'methuselah', text: '아버지는 또 언덕에 가셨소? 저녁 먹을 때면 오실 거요.', ref: null, basis: '창 5:21 므두셀라, 창 5:22 동행' },
  ],
};

const quiz = [
  { q: '에녹은 누구와 동행하였나요?', options: ['하나님', '아담', '노아'], answer: 0, ref: '창 5:24' },
  { q: '에녹이 낳은 아들의 이름은 무엇인가요?', options: ['셈', '므두셀라', '에노스'], answer: 1, ref: '창 5:21' },
  { q: '에녹은 몇 년을 살았나요?', options: ['구백육십구 년', '백이십 년', '삼백육십오 년'], answer: 2, ref: '창 5:23' },
];

export default { id: 'enoch', lines, interlude, greetings, quiz };
