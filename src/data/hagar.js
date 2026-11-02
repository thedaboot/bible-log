// 곁길 하갈과 감찰하시는 하나님(창 16, 21장). 창 16:1~6(사래와 하갈 사이의 다툼)은 처음 서술로 짧게 전한다.
// '여호와의 사자'(창 16:7)는 messenger 이름표로 쓰고, 그 말을 하나님 자신의 말처럼 높이지 않는다(본문 그대로).

const lines = {
  arrive: [
    { who: 'narr', text: '사래는 아이를 낳지 못하여, 자기 여종 애굽 사람 하갈을\n아브람에게 아내로 주었다.', ref: '창 16:1~3' },
    { who: 'narr', text: '하갈이 임신하자 사래와 하갈 사이가 틀어졌고,\n사래가 하갈을 학대하니 하갈이 도망하였다.', ref: '창 16:4~6' },
    { who: 'angel', text: '하갈이 술 길 광야에 혼자 있어요.\n마른 땅을 둘러보며 물이 있는 곳을 찾아보아요.', ref: null },
  ],
  // 퀘스트 1: 마른 자리에서 듣는 서술(한 자리에 한 줄)
  dry: [
    { who: 'narr', text: '갈라진 흙만 있었다. 손을 대니 뜨거웠다.', ref: null, basis: '창 16:7 광야' },
    { who: 'narr', text: '마른 덤불 아래를 파 보았지만 모래만 나왔다.', ref: null, basis: '창 16:7 광야' },
  ],
  spring: [
    { who: 'narr', text: '여호와의 사자가 광야의 샘 곁에서 하갈을 만났다.', ref: '창 16:7' },
    { who: 'messenger', text: '사래의 여종 하갈아, 네가 어디서 왔으며 어디로 가느냐?', ref: '창 16:8' },
    { who: 'hagar', text: '저는 제 여주인 사래를 피하여 도망하는 중입니다.', ref: '창 16:8' },
    { who: 'messenger', text: '네 여주인에게로 돌아가 그 손 아래에서 지내라.', ref: '창 16:9' },
    { who: 'messenger', text: '네가 아들을 낳으리니 이름을 이스마엘이라 하여라.\n여호와께서 네 고통을 들으셨다.', ref: '창 16:11' },
    { who: 'hagar', text: '당신은 나를 살피시는 하나님이십니다.', ref: '창 16:13' },
    { who: 'narr', text: '그래서 그 샘을 브엘라해로이라 불렀다.', ref: '창 16:14' },
  ],
  years: [
    { who: 'narr', text: '하갈이 아브람에게 아들을 낳으니 아브람이 이스마엘이라 하였다.', ref: '창 16:15' },
    { who: 'narr', text: '여러 해 뒤 사라가 이삭을 낳았고,\n아브라함은 떡과 물 한 부대를 하갈에게 주어 내보냈다.', ref: '창 21:2~14' },
    { who: 'narr', text: '하갈이 브엘세바 광야에서 헤매다가 부대의 물이 다 떨어졌다.', ref: '창 21:14~15' },
    { who: 'hagar', text: '아이가 죽는 것을 차마 보지 못하겠다.', ref: '창 21:16' },
    { who: 'narr', text: '하나님께서 그 아이의 소리를 들으셨다.', ref: '창 21:17' },
    { who: 'messenger', text: '하갈아, 두려워하지 마라. 일어나 아이를 일으켜 네 손으로 붙들어라.\n내가 그로 큰 민족을 이루게 하겠다.', ref: '창 21:17~18' },
    { who: 'narr', text: '하나님께서 하갈의 눈을 밝히시니, 샘물이 보였다.', ref: '창 21:19' },
    { who: 'angel', text: '저기 우물이 보여요. 가죽 부대에 물을 채워 하갈에게 가져다주어요.', ref: null },
  ],
  drink: [
    { who: 'narr', text: '하갈이 가서 가죽 부대에 물을 채워 아이에게 마시게 하였다.', ref: '창 21:19' },
    { who: 'narr', text: '하나님께서 그 아이와 함께 계시니,\n아이가 자라 광야에서 활 쏘는 사람이 되었다.', ref: '창 21:20' },
    { who: 'angel', text: '아무도 보지 않는다고 여긴 그때도 하나님은 보고 계셨어요.\n오늘 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 브엘라해로이 샘 곁에서, 돌아가기 전(창 16:13~15 사이) 하갈과 끝까지 대화한다.
const interlude = {
  who: 'hagar',
  steps: [
    { say: [
      { who: 'narr', text: '하갈이 샘물에 손을 담그고 오래 앉아 있었다.', ref: null, basis: '창 16:7 샘 곁' },
      { who: 'hagar', text: '당신도 여기서 길을 잃었나요?\n이 광야에 나 말고 누가 있을 줄은 몰랐어요.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 16:7' },
    ] },
    { choose: [
      { text: '물 좀 드세요.', fruit: 'kindness', reply: [
        { who: 'narr', text: '하갈이 두 손으로 물을 떠 마셨다.\n그제야 입술의 갈라진 자리가 보였다.', ref: null, basis: '창 16:7 샘' },
      ] },
      { text: '다치신 데는 없어요?', fruit: 'love', reply: [
        { who: 'hagar', text: '발바닥이 다 갈라졌어요. 그래도 마음보다는 덜 아파요.', ref: null, basis: '창 16:6 학대를 피해 도망' },
      ] },
      { text: '(말없이 곁에 앉는다)', fruit: 'peace', reply: [
        { who: 'narr', text: '샘물 흐르는 소리만 들렸다. 하갈이 조금씩 숨을 고르게 쉬었다.', ref: null, basis: '창 16:7' },
      ] },
      { text: '보고 계신 분이 있었네요.', fruit: 'faith', need: { kindness: 1 }, reply: [
        { who: 'hagar', text: '그래요. 나 같은 종의 이름까지 불러 주셨어요.', ref: null, basis: '창 16:8 하갈아, 창 16:13' },
      ] },
    ] },
    { say: [
      { who: 'hagar', text: '돌아가라고 하셨어요. 솔직히 무서워요.', ref: null, basis: '창 16:9' },
      { who: 'hagar', text: '그래도 아이 이름을 먼저 지어 주셨으니,\n이 아이는 잊지 않으실 거예요.', ref: null, basis: '창 16:11 이스마엘(하나님이 들으심)' },
    ] },
    { choose: [
      { text: '이스마엘, 좋은 이름이에요.', fruit: 'joy', reply: [
        { who: 'hagar', text: '하나님이 들으신다는 뜻이래요. 울 때마다 이 이름을 부르려고요.', ref: null, basis: '창 16:11 이스마엘의 뜻' },
      ] },
      { text: '돌아가는 길 같이 가요.', fruit: 'goodness', reply: [
        { who: 'hagar', text: '샘에서 장막까지 사흘 길이에요. 반만 같이 가도 훨씬 덜 무섭겠어요.', ref: null, basis: '창 16:9 돌아가라, 창 16:7 술 길' },
      ] },
      { text: '천천히 가셔도 돼요.', fruit: 'patience', reply: [
        { who: 'hagar', text: '그럴게요. 해가 지면 이 샘가에서 하룻밤 더 자고 가요.', ref: null, basis: '창 16:14 브엘라해로이' },
      ] },
    ] },
    { say: [
      { who: 'hagar', text: '이 샘 이름을 잊지 말아요. 나를 보시는 분의 샘이에요.', ref: null, basis: '창 16:13~14' },
    ] },
  ],
};

const quiz = [
  { q: '하갈은 자기에게 말씀하신 여호와를 어떤 하나님이라 불렀나요?', options: ['살피시는 하나님', '싸우시는 하나님', '멀리 계신 하나님'], answer: 0, ref: '창 16:13' },
  { q: '하갈이 낳을 아들의 이름은 무엇인가요?', options: ['이스마엘', '이삭', '에서'], answer: 0, ref: '창 16:11' },
  { q: '브엘세바 광야에서 하나님께서 눈을 밝히시자 하갈은 무엇을 보았나요?', options: ['샘물', '오아시스 마을', '양 떼'], answer: 0, ref: '창 21:19' },
];

export default { id: 'hagar', lines, interlude, quiz };
