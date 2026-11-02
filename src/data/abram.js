// 1-6 아브람의 부르심(창 12, 15장). 이 스테이지에서는 아직 아브람·사래다(이름이 바뀌는 것은 창 17:5, 17:15).
// 관계와 도감 칸은 같은 사람이라 abraham, sarah 하나로 둔다(docs/review/decisions.md).

const lines = {
  arrive: [
    { who: 'voice', text: '너는 고향과 친척과 아버지의 집을 떠나\n내가 보여 줄 땅으로 가거라.', ref: '창 12:1' },
    { who: 'voice', text: '내가 너로 큰 민족을 이루고, 너에게 복을 주어\n네 이름을 크게 하리니, 너는 복이 될 것이다.', ref: '창 12:2' },
    { who: 'voice', text: '땅의 모든 족속이 너로 말미암아 복을 받을 것이다.', ref: '창 12:3' },
    { who: 'narr', text: '아브람은 여호와의 말씀을 따라 길을 떠났고, 롯도 함께 갔다.\n그때 아브람은 일흔다섯 살이었다.', ref: '창 12:4' },
    { who: 'angel', text: '하란을 떠나는 길이에요.\n아브람의 무리를 앞서 다음 머물 곳으로 가 보아요.', ref: null },
  ],
  shechem: [
    { who: 'narr', text: '아브람이 세겜 땅 모레 상수리나무에 이르렀다.\n그때 그 땅에는 가나안 사람이 살고 있었다.', ref: '창 12:6' },
    { who: 'voice', text: '내가 이 땅을 네 자손에게 주겠다.', ref: '창 12:7' },
    { who: 'narr', text: '아브람이 자기에게 나타나신 여호와께 그곳에 제단을 쌓았다.', ref: '창 12:7' },
  ],
  bethel: [
    { who: 'narr', text: '아브람은 벧엘 동쪽 산으로 옮겨 장막을 쳤다.\n서쪽은 벧엘, 동쪽은 아이였다.', ref: '창 12:8' },
    { who: 'narr', text: '그곳에서도 제단을 쌓고 여호와의 이름을 불렀다.', ref: '창 12:8' },
  ],
  vision: [
    { who: 'voice', text: '아브람아, 두려워하지 마라. 나는 너의 방패요, 너의 큰 상급이다.', ref: '창 15:1' },
    { who: 'abram', text: '주 여호와여, 저에게 무엇을 주시렵니까? 저는 아직 자식이 없습니다.', ref: '창 15:2' },
    { who: 'voice', text: '하늘을 우러러 별을 세어 보아라. 셀 수 있겠느냐?', ref: '창 15:5' },
    { who: 'angel', text: '언덕마다 올라 하늘을 보아요. 별 곁에 머물러 하나씩 세어 보아요.', ref: null },
  ],
  stars: [
    { who: 'angel', text: '세면 셀수록 더 많은 별이 보여요. 도저히 다 셀 수가 없어요.', ref: null },
    { who: 'voice', text: '네 자손이 이와 같을 것이다.', ref: '창 15:5' },
    { who: 'narr', text: '아브람이 여호와를 믿으니, 여호와께서 이를 그의 의로 여기셨다.', ref: '창 15:6' },
    { who: 'angel', text: '아브람은 아직 아들이 없지만 약속을 믿었어요.\n오늘 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 벧엘 동쪽 장막에서 저녁에 사래와 끝까지 대화한다. 창 12:8과 창 15:1 사이의 빈 시간이다.
const interlude = {
  who: 'sarai',
  bond: 'sarah',
  steps: [
    { say: [
      { who: 'narr', text: '사래가 장막 앞에서 맷돌에 보리를 갈다가 손을 멈추었다.', ref: null, basis: '창 12:8 장막, 창 18:6 가루 반죽' },
      { who: 'sarai', text: '길에서 늘 앞서 걷던 분이군요.\n하란에서 여기까지 발이 많이 아프셨지요?', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 12:5' },
    ] },
    { choose: [
      { text: '사래님도 먼 길 오셨잖아요.', fruit: 'kindness', reply: [
        { who: 'sarai', text: '하란에서 세겜까지, 또 여기까지 왔지요.\n장막을 접었다 펴는 데는 이제 선수가 되었어요.', ref: null, basis: '창 12:5~8 옮겨 다님' },
      ] },
      { text: '(맷돌을 대신 돌린다)', fruit: 'goodness', reply: [
        { who: 'narr', text: '맷돌이 생각보다 무거웠다. 사래가 웃으며 손잡이를 같이 잡아 주었다.', ref: null, basis: '창 12:8 장막 살림' },
      ] },
      { text: '두렵지 않으셨어요?', fruit: 'faith', reply: [
        { who: 'sarai', text: '무서웠지요. 그래도 남편이 들은 목소리를 나도 믿어 보기로 했어요.', ref: null, basis: '히 11:8~9 갈 바를 알지 못하고 나감, 히 11:11' },
      ] },
      { text: '함께 기다릴게요.', fruit: 'patience', need: { faith: 1 }, reply: [
        { who: 'sarai', text: '고마워요. 기다리는 일은 혼자 하면 더 길거든요.', ref: null, basis: '창 11:30, 히 11:11 약속하신 이를 미쁘신 줄 앎' },
      ] },
    ] },
    { say: [
      { who: 'sarai', text: '큰 민족을 이루게 하신다는데, 우리에게는 아직 아이가 없어요.', ref: null, basis: '창 11:30 잉태하지 못함, 창 12:2' },
      { who: 'sarai', text: '롯이 우리 아들처럼 곁에 있어 주니 그나마 다행이에요.', ref: null, basis: '창 12:4~5 롯이 함께 감' },
    ] },
    { choose: [
      { text: '약속하신 분이 계시잖아요.', fruit: 'joy', reply: [
        { who: 'sarai', text: '그렇지요. 그 말을 들으니 오늘 밤은 별이 조금 덜 차가워 보이네요.', ref: null, basis: '창 12:2, 창 15:5' },
      ] },
      { text: '그 마음 많이 아프셨겠어요.', fruit: 'love', reply: [
        { who: 'sarai', text: '여러 해 동안 아무에게도 말 못 했어요. 들어 줘서 고마워요.', ref: null, basis: '창 11:30' },
      ] },
      { text: '롯이 정말 든든해 보여요.', fruit: 'peace', reply: [
        { who: 'sarai', text: '양 떼를 몰 때 롯 목소리가 제일 커요. 남편이 그 소리를 좋아해요.', ref: null, basis: '창 13:5 롯도 양과 소와 장막이 있었음' },
      ] },
    ] },
    { say: [
      { who: 'sarai', text: '밤이 깊었네요. 남편이 또 하늘을 보러 나가겠어요.', ref: null, basis: '창 15:5로 이어짐' },
    ] },
  ],
};

const greetings = {
  lot: [
    { who: 'lot', text: '큰아버지 양 떼가 또 늘었소. 이 길을 따라가면 물이 있다더군.', ref: null, basis: '창 11:27 롯은 아브람의 형제 하란의 아들, 창 12:5, 창 13:5' },
  ],
};

const quiz = [
  { q: '아브람이 하란을 떠날 때 몇 살이었나요?', options: ['일흔다섯 살', '백 살', '서른 살'], answer: 0, ref: '창 12:4' },
  { q: '하나님께서 아브람에게 무엇을 세어 보라고 하셨나요?', options: ['하늘의 별', '바닷가의 조개', '들의 양'], answer: 0, ref: '창 15:5' },
  { q: '아브람이 여호와를 믿으니 여호와께서 이를 무엇으로 여기셨나요?', options: ['그의 의', '그의 재산', '그의 지혜'], answer: 0, ref: '창 15:6' },
];

export default { id: 'abram', lines, interlude, greetings, quiz };
