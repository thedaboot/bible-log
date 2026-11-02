// 1-13 요셉과 형제들(창 42~45, 50장). 두 번의 애굽 걸음(42, 43~44장)을 한 장면의 곡식 창고 앞에서 잇고,
// 요셉이 자기를 밝히는 45장과 야곱이 죽은 뒤의 50:15~21로 끝난다. 핵심 말씀은 창 50:20.

const lines = {
  arrive: [
    { who: 'narr', text: '일곱 해 풍년이 끝나자 흉년이 들어 온 땅이 굶주렸다.\n애굽에만 곡식이 있었다.', ref: '창 41:53~57' },
    { who: 'narr', text: '야곱이 열 아들을 애굽으로 보내어 곡식을 사 오게 하였다.\n막내 베냐민만은 곁에 두었다.', ref: '창 42:1~4' },
    { who: 'narr', text: '요셉의 형들이 와서 땅에 엎드려 절하였다.\n요셉은 한눈에 형들을 알아보았지만, 형들은 그를 몰라보았다.', ref: '창 42:6~8' },
    { who: 'narr', text: '요셉은 어릴 적 꾼 곡식 단 꿈을 떠올렸다.', ref: '창 42:9' },
    { who: 'joseph', text: '그들의 자루에 곡식을 채우고,\n각 사람의 돈은 그 자루에 도로 넣어라.', ref: '창 42:25' },
    { who: 'angel', text: '곡식 창고 앞에 빈 자루가 줄지어 있어요.\n자루 곁에 머물러 곡식을 채워 나귀에 실어 보아요.', ref: null },
  ],
  loaded: [
    { who: 'narr', text: '요셉은 시므온을 묶어 두고 막내를 데려오라 하였다.\n형들은 나귀에 곡식을 싣고 떠났다.', ref: '창 42:24~26' },
    { who: 'narr', text: '양식이 떨어지자, 형들이 베냐민을 데리고 다시 애굽으로 내려왔다.', ref: '창 43:1~15' },
    { who: 'narr', text: '요셉이 동생 베냐민을 보고 가슴이 미어져,\n안방으로 들어가 한참 울고는 얼굴을 씻고 나왔다.', ref: '창 43:29~31' },
    { who: 'joseph', text: '내 은잔을 막내의 자루 맨 위에 넣어라.', ref: '창 44:2' },
  ],
  cup: [
    { who: 'narr', text: '청지기가 성을 막 벗어난 형들을 따라잡아 자루를 풀게 하였다.', ref: '창 44:4~11' },
    { who: 'angel', text: '맏형의 자루부터 막내의 자루까지 차례로 살펴보아요.', ref: null },
  ],
  found: [
    { who: 'narr', text: '은잔이 베냐민의 자루에서 나왔다. 형들이 옷을 찢었다.', ref: '창 44:12~13' },
    { who: 'judah', text: '아버지의 목숨이 이 아이에게 묶여 있습니다.\n아이 대신 제가 남아 종이 되겠습니다.', ref: '창 44:30~33' },
  ],
  reveal: [
    { who: 'narr', text: '요셉이 더는 참지 못하고 소리 내어 울었다.', ref: '창 45:1~2' },
    { who: 'joseph', text: '나는 요셉입니다. 아버지께서 아직 살아 계십니까?', ref: '창 45:3' },
    { who: 'joseph', text: '나를 이곳에 팔았다고 괴로워하지 마십시오.\n하나님께서 생명을 구하시려고 나를 먼저 보내셨습니다.', ref: '창 45:5' },
    { who: 'narr', text: '요셉이 베냐민의 목을 끌어안고 울었다.\n형들과도 하나하나 입 맞추며 울었다.', ref: '창 45:14~15' },
  ],
  end: [
    { who: 'narr', text: '야곱의 온 집안이 애굽 고센 땅으로 내려와 살았다.', ref: '창 47:27' },
    { who: 'narr', text: '여러 해 뒤 야곱이 아들들을 축복하고 숨을 거두었다.', ref: '창 49:33' },
    { who: 'narr', text: '아버지가 세상을 떠나자 형들은 겁이 나 요셉 앞에 엎드렸다.\n"우리는 당신의 종입니다."', ref: '창 50:15~18' },
    { who: 'joseph', text: '두려워하지 마십시오. 내가 하나님을 대신하겠습니까?', ref: '창 50:19' },
    { who: 'joseph', text: '형님들은 나를 해치려 했지만, 하나님께서는 그 일을 선으로 바꾸셔서\n오늘처럼 많은 사람의 목숨을 살리게 하셨습니다.', ref: '창 50:20' },
    { who: 'angel', text: '창세기의 마지막 장이에요.\n악을 선으로 바꾸신 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 두 번째 길을 떠나기 전 가나안에서, 유다가 베냐민의 담보가 되겠다고 한 날 저녁(창 43:8~10 뒤) 유다와 끝까지 대화한다.
const interlude = {
  who: 'judah',
  steps: [
    { say: [
      { who: 'narr', text: '유다가 나귀 안장 끈을 묶다가 손을 멈추고 한숨을 쉬었다.', ref: null, basis: '창 43:11~15 떠날 준비' },
      { who: 'judah', text: '당신도 애굽 길을 다녀왔소?\n아버지께 베냐민을 내가 책임지겠다고 했소.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 43:9' },
    ] },
    { choose: [
      { text: '못 지키면 어떡하세요?', fruit: 'faith', reply: [
        { who: 'judah', text: '평생 아버지 앞에 죄인으로 살겠다고 했소. 빈말로 한 것이 아니오.', ref: null, basis: '창 43:9' },
      ] },
      { text: '베냐민은 신나 보이던데요.', fruit: 'kindness', reply: [
        { who: 'judah', text: '처음 가는 먼 길이니 그렇지.\n제 자루를 벌써 세 번째 다시 묶고 있소.', ref: null, basis: '창 43:15' },
      ] },
      { text: '(안장 끈을 함께 묶는다)', fruit: 'goodness', reply: [
        { who: 'narr', text: '끈이 단단히 조여졌다. 유다가 고개를 끄덕이고 나귀의 목을 두드렸다.', ref: null, basis: '창 43:11~15' },
      ] },
      { text: '아버지 걱정 덜어 드려요.', fruit: 'love', need: { kindness: 1 }, reply: [
        { who: 'judah', text: '그러려고 하오. 요셉을 잃은 뒤로 아버지는 베냐민만 보고 사시오.', ref: null, basis: '창 42:36~38, 44:30' },
      ] },
    ] },
    { say: [
      { who: 'judah', text: '오래전에 동생 하나를 판 적이 있소. 팔자고 한 게 나였소.', ref: null, basis: '창 37:26~27 유다가 팔자고 함' },
      { who: 'judah', text: '이번에는 동생을 잃지 않겠소.', ref: null, basis: '창 44:33 대신 종이 되겠다' },
    ] },
    { choose: [
      { text: '뭐가 마음을 바꿨어요?', fruit: 'gentle', reply: [
        { who: 'judah', text: '아버지 우시는 소리를 스무 해 넘게 들었소. 사람이 바뀔 만하지.', ref: null, basis: '창 37:34~35, 42:36' },
      ] },
      { text: '이번엔 꼭 지키실 거예요.', fruit: 'patience', reply: [
        { who: 'judah', text: '내 목숨을 걸고서라도 그러겠소.', ref: null, basis: '창 44:32~33' },
      ] },
      { text: '그 동생도 용서했을 거예요.', fruit: 'peace', reply: [
        { who: 'judah', text: '그랬으면 좋겠소. 살아 있기나 한지 모르지만.', ref: null, basis: '창 42:13 하나는 없어졌다, 45:4' },
      ] },
    ] },
    { say: [
      { who: 'judah', text: '내일 새벽에 떠나오. 이야기 들어 줘서 고맙소.', ref: null, basis: '창 43:15로 이어짐' },
    ] },
  ],
};

// 깊은 대화: 요셉(관계 "대화" 이상 + 레벨 DEEP_LEVEL.joseph). 형들이 처음 곡식을 받아 간 뒤, 창고 곁의 요셉에게 가면 열린다.
const deep = {
  who: 'joseph',
  locked: [
    { who: 'joseph', text: '지금은 아무 말도 할 수가 없습니다.', ref: null, basis: '창 42:24 돌이켜 울었다, 깊은 대화가 닫혀 있을 때' },
  ],
  steps: [
    { say: [
      { who: 'narr', text: '요셉이 형들이 떠난 길을 오래 바라보았다.', ref: null, basis: '창 42:24~26' },
      { who: 'joseph', text: '옥에서 내 곁에 있어 준 분이군요. 형님들을 보셨지요?', ref: null, basis: '1-12 막간, 깊은 대화' },
    ] },
    { choose: [
      { text: '많이 우셨죠?', fruit: 'kindness', reply: [
        { who: 'joseph', text: '아우에게 죄를 지었다고 형님들이 서로 말하더군요.\n그 말에 그만 돌아서서 울었습니다.', ref: null, basis: '창 42:21~24' },
      ] },
      { text: '왜 바로 말하지 않으셨어요?', fruit: 'patience', reply: [
        { who: 'joseph', text: '형님들 마음이 변했는지 알고 싶었습니다.\n베냐민을 어떻게 대하는지 보려고요.', ref: null, basis: '창 42:15~20, 44:1~2' },
      ] },
      { text: '(말없이 곁에 선다)', fruit: 'peace', reply: [
        { who: 'narr', text: '창고 그늘에 바람이 들었다. 요셉이 눈가를 훔치고 숨을 길게 쉬었다.', ref: null, basis: '창 42:24' },
      ] },
    ] },
    { say: [
      { who: 'joseph', text: '구덩이에서 올려다본 하늘을 아직 기억합니다.', ref: null, basis: '창 37:24, 42:21 괴로움을 보고도' },
    ] },
    { choose: [
      { text: '하나님께서 함께 계셨잖아요.', fruit: 'faith', reply: [
        { who: 'joseph', text: '그렇습니다. 그래서 이제는 그 하늘이 무섭지 않습니다.', ref: null, basis: '창 39:21~23' },
      ] },
      { text: '형님들을 용서하실 수 있어요?', fruit: 'love', reply: [
        { who: 'joseph', text: '이미 그러고 싶은데, 아직 입이 떨어지지 않습니다.', ref: null, basis: '창 45:1~5' },
      ] },
      { text: '때가 올 거예요.', fruit: 'gentle', reply: [
        { who: 'joseph', text: '네. 베냐민을 데려오면, 그때 말하겠습니다.', ref: null, basis: '창 42:20, 45:3' },
      ] },
    ] },
    { say: [
      { who: 'joseph', text: '창고를 돌아봐야겠습니다. 굶주린 사람들이 아직 많습니다.', ref: null, basis: '창 41:56~57' },
    ] },
  ],
};

const quiz = [
  { q: '요셉의 형들은 무엇을 사러 애굽에 왔나요?', options: ['곡식', '양 떼', '옷감'], answer: 0, ref: '창 42:3' },
  { q: '요셉의 은잔은 누구의 자루에서 나왔나요?', options: ['유다', '르우벤', '베냐민'], answer: 2, ref: '창 44:12' },
  { q: '요셉은 형들이 해하려 한 일을 하나님께서 어떻게 하셨다고 했나요?', options: ['선으로 바꾸셨다', '잊어버리셨다', '벌하셨다'], answer: 0, ref: '창 50:20' },
];

export default { id: 'brothers', lines, interlude, deep, quiz };
