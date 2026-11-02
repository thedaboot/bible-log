// 곁길 에녹의 동행(창 5:21~24). 창 5장 족보(아담부터 노아까지)는 처음 서술로 잇는다(design.md "족보는 연결 장면").
// 본문은 짧다: 에녹이 하나님과 동행하다가 하나님이 데려가시니 세상에 있지 않았다(창 5:24, 히 11:5).
// 걷는 동안 함께 하는 일 넷 가운데 기도(창 4:26)와 어린양 찾기는 각색이고, 예언은 유 1:14~15 본문이다.

const lines = {
  arrive: [
    { who: 'narr', text: '아담은 셋을 낳았고, 셋은 에노스를, 에노스는 게난을 낳았다.', ref: '창 5:3~12' },
    { who: 'narr', text: '마할랄렐과 야렛을 지나, 야렛이 에녹을 낳았다.', ref: '창 5:15~18' },
    { who: 'narr', text: '에녹은 므두셀라를 낳은 뒤 삼백 년 동안 하나님과 동행하였다.', ref: '창 5:21~22' },
    { who: 'angel', text: '에녹이 언덕길로 나서요.\n오늘은 그가 길에서 하는 일을 곁에서 함께 해 보아요.', ref: null, basis: '안내: 함께 하는 일 넷' },
  ],
  prayed: [
    { who: 'enoch', text: '길을 나서기 전에 먼저 그분께 여쭈오.\n오늘은 어느 쪽으로 갈지, 누구를 만날지.', ref: null, basis: '창 4:26 여호와의 이름을 부름, 창 5:22 동행' },
  ],
  lamb: [
    { who: 'narr', text: '그때 길 아래 가시덤불에서 가느다란 울음소리가 났다.', ref: null, basis: '각색: 길에서 만난 일(눅 15:4 잃은 양을 찾음)' },
    { who: 'enoch', text: '어린양이 가시에 걸렸구려.\n내 손은 굳어서 안 되겠소. 그대가 좀 빼내 주겠소?', ref: null, basis: '각색: 함께 하는 일. 에녹은 삼백예순 살이 넘은 노인이다(창 5:23)' },
  ],
  found: [
    { who: 'enoch', text: '오, 우리 집 양이오. 므두셀라가 또 양 우리 문을 덜 닫았구려.', ref: null, basis: '각색: 창 5:21 므두셀라' },
    { who: 'enoch', text: '내 걸음으로는 해 지기 전에 못 찾았을 거요.\n오늘 일은 둘이서, 아니 셋이서 한 일이오.', ref: null, basis: '창 5:22 하나님과 동행' },
    { who: 'enoch', text: '집까지 내려가기엔 해가 짧으니, 이 녀석도 데리고 올라갑시다.', ref: null, basis: '각색' },
  ],
  prophecy: [
    { who: 'narr', text: '언덕 끝에서 에녹이 아래 마을들을 오래 내려다보았다.', ref: null, basis: '각색: 유 1:14~15 예언의 자리' },
    { who: 'narr', text: '아담의 칠대 손 에녹이 이 사람들을 두고 예언하였다.', ref: '유 1:14' },
    { who: 'enoch', text: '보라, 주께서 수만의 거룩한 이들과 함께 오신다.', ref: '유 1:14' },
    { who: 'enoch', text: '모든 사람을 심판하시고, 경건하지 않은 일과\n그분을 거슬러 한 거친 말의 죄를 다 물으실 것이다.', ref: '유 1:15' },
    { who: 'enoch', text: '그래서 나는 날마다 이 길을 걷소.\n그날이 오면 그분 곁에 서 있고 싶어서.', ref: null, basis: '유 1:14~15, 창 5:22 동행' },
  ],
  walked: [
    { who: 'narr', text: '에녹은 모두 삼백육십오 년을 살았다.', ref: '창 5:23' },
    { who: 'enoch', text: '그분이 저기 계시오. 함께 갑시다.', ref: null, basis: '창 5:24 동행' },
  ],
  taken: [
    { who: 'narr', text: '에녹이 하나님과 동행하더니,\n하나님께서 그를 데려가시므로 세상에 있지 않았다.', ref: '창 5:24' },
    { who: 'narr', text: '언덕 끝에는 어린양만 남아, 빛이 걷힌 하늘을 올려다보았다.', ref: null, basis: '각색: 창 5:24 세상에 있지 않았다' },
    { who: 'narr', text: '그는 죽음을 보지 않고 옮겨졌으니,\n하나님을 기쁘시게 한다는 증거를 받았다.', ref: '히 11:5' },
    { who: 'narr', text: '므두셀라는 라멕을 낳고, 라멕은 노아를 낳았다.', ref: '창 5:25~29' },
    { who: 'angel', text: '함께 걷는다는 건 같이 기도하고, 잃은 것을 같이 찾고,\n같은 쪽을 바라보는 일이었네요.', ref: null, basis: '정리: 함께 한 일 넷' },
    { who: 'angel', text: '오늘 들은 말씀을 함께 돌아볼까요?', ref: null, basis: '안내: 퀴즈' },
  ],
};

// 막간: 언덕 중턱에서 쉬며 에녹과 끝까지 대화한다. 어린양을 찾은 뒤, 예언하기(유 1:14~15) 전이다.
const interlude = {
  who: 'enoch',
  steps: [
    { say: [
      { who: 'narr', text: '에녹이 바위에 앉아 숨을 고르고, 지나온 길을 내려다보았다.', ref: null, basis: '창 5:22 동행' },
      { who: 'enoch', text: '가시도 잘 떼고 발도 빠르구려.\n나는 이 길을 날마다 걷는데도 늘 여기서 쉬오.', ref: null, basis: '막간: 인물이 관찰자를 알아본다' },
    ] },
    { choose: [
      { text: '날마다 이 길을 걸으세요?', fruit: 'faith', reply: [
        { who: 'enoch', text: '므두셀라가 태어난 해부터니, 올해로 삼백 해가 되오.\n비 오는 날엔 미끄러워서 두 번 쉬었소.', ref: null, basis: '창 5:21~22 므두셀라를 낳은 후 삼백 년 동행' },
      ] },
      { text: '(곁에 말없이 앉는다)', fruit: 'peace', reply: [
        { who: 'narr', text: '어린양이 에녹의 무릎에 턱을 올렸다.\n에녹은 그 머리를 쓰다듬으며 한참 말이 없었다.', ref: null, basis: '창 5:24 동행의 고요함' },
      ] },
      { text: '쉬어 가도 괜찮아요.', fruit: 'gentle', reply: [
        { who: 'enoch', text: '괜찮고말고. 내가 앉으면 그분도 기다려 주시오.\n삼백 년 동안 나를 두고 먼저 가신 적이 없소.', ref: null, basis: '창 5:22, 히 13:5' },
      ] },
      { text: '저도 매일 걸어 볼게요.', fruit: 'control', need: { faith: 1 }, reply: [
        { who: 'enoch', text: '첫날부터 정상까지 갈 것 없소.\n나도 처음엔 아까 그 갈림길까지만 걸었소.', ref: null, basis: '창 5:22 삼백 년 동안 동행' },
      ] },
    ] },
    { say: [
      { who: 'enoch', text: '사람들은 날로 거칠어지오. 하나님을 업신여기는 말도 많고.', ref: null, basis: '유 1:14~15 에녹의 예언, 창 6:5' },
      { who: 'enoch', text: '그래도 나는 이 길을 걸으며 그분께 다 말씀드리오.', ref: null, basis: '창 5:24' },
    ] },
    { choose: [
      { text: '무슨 이야기를 하세요?', fruit: 'joy', reply: [
        { who: 'enoch', text: '아까 그 어린양 이야기는 벌써 했소.\n가시를 떼 준 손이 누구 손이었는지도.', ref: null, basis: '창 5:22 동행' },
      ] },
      { text: '거친 사람들이 밉지 않으세요?', fruit: 'love', reply: [
        { who: 'enoch', text: '미운 날도 있소. 그런 날은 이 바위에 다 내려놓고 가오.\n집까지 들고 가면 므두셀라가 먼저 알아채거든.', ref: null, basis: '유 1:14~15, 창 5:22' },
      ] },
      { text: '그 이야기 저도 듣고 싶어요.', fruit: 'kindness', reply: [
        { who: 'enoch', text: '그럼 언덕 끝까지 같이 갑시다.\n그분과 그대와 나, 저 어린양까지 넷이서 걷는 셈이오.', ref: null, basis: '창 5:24 동행' },
      ] },
    ] },
    { say: [
      { who: 'enoch', text: '자, 일어납시다. 언덕 끝에서 보여 줄 것이 있소.', ref: null, basis: '유 1:14 예언의 자리로' },
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
  { q: '에녹은 주께서 누구와 함께 오신다고 예언했나요?', options: ['열두 지파', '수만의 거룩한 이들', '노아의 가족'], answer: 1, ref: '유 1:14' },
  { q: '에녹은 몇 년을 살았나요?', options: ['구백육십구 년', '백이십 년', '삼백육십오 년'], answer: 2, ref: '창 5:23' },
];

export default { id: 'enoch', lines, interlude, greetings, quiz };
