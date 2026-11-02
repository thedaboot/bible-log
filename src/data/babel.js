// 1-5 바벨탑(창 11:1~9). 창 10장(민족의 족보)은 처음 서술로, 창 11:10~32(셈부터 아브람까지)는 끝 서술로 잇는다.
// 언어가 흩어진 뒤의 말은 알아들을 수 없는 소리라서 대사 대신 서술로 전한다(본문에 그 말이 없다).

const lines = {
  arrive: [
    { who: 'narr', text: '노아의 아들 셈과 함과 야벳에게서 민족들이 나와 땅 위에 나뉘었다.', ref: '창 10:32' },
    { who: 'narr', text: '온 땅의 언어가 하나요, 말이 하나였다.', ref: '창 11:1' },
    { who: 'narr', text: '사람들이 동쪽으로 옮기다가 시날 땅에서 들판을 만나 거기 머물렀다.', ref: '창 11:2' },
    { who: 'people', text: '자, 벽돌을 만들어 단단히 굽자.', ref: '창 11:3' },
    { who: 'narr', text: '그들은 돌 대신 벽돌을 쓰고, 진흙 대신 역청을 썼다.', ref: '창 11:3' },
    { who: 'people', text: '성읍과 탑을 쌓아 탑 꼭대기를 하늘에 닿게 하자.', ref: '창 11:4' },
    { who: 'people', text: '우리 이름을 내고, 온 땅에 흩어지지 않게 하자.', ref: '창 11:4' },
    { who: 'angel', text: '일꾼들이 같은 말로 서로를 부르고 있어요.\n가까이 가서 무슨 말을 하는지 들어 보아요.', ref: null },
  ],
  // 퀘스트 1: 일꾼마다 곁에 머무르면 듣는 말(같은 언어). 일꾼 한 사람에 한 줄이다.
  workers: [
    { who: 'worker', text: '벽돌 더! 위층에서 기다린다!', ref: null, basis: '창 11:3 벽돌' },
    { who: 'worker', text: '역청은 따뜻할 때 발라야 붙는다.', ref: null, basis: '창 11:3 역청' },
    { who: 'worker', text: '꼭대기가 구름에 닿으면 다들 우리 이름을 알겠지.', ref: null, basis: '창 11:4 이름을 내자' },
    { who: 'worker', text: '여기 다 모여 살면 아무도 흩어지지 않을 거야.', ref: null, basis: '창 11:4 흩어짐을 면하자' },
  ],
  down: [
    { who: 'narr', text: '여호와께서 사람들이 쌓는 성읍과 탑을 보려고 내려오셨다.', ref: '창 11:5' },
    { who: 'voice', text: '이들이 한 백성이요 언어도 하나라서 이 일을 시작하였으니,\n이제 하고자 하는 일을 막을 수 없을 것이다.', ref: '창 11:6' },
    { who: 'voice', text: '자, 내려가서 그들의 언어를 뒤섞어, 서로 알아듣지 못하게 하자.', ref: '창 11:7' },
    { who: 'angel', text: '이제 일꾼들의 말이 달라졌어요.\n한 사람씩 곁에 가서 다시 들어 보아요.', ref: null },
  ],
  // 퀘스트 2: 흩어지는 말. 알아들을 수 없어 서술로만 전한다.
  scattered: [
    { who: 'narr', text: '일꾼이 손짓하며 소리쳤지만, 낯선 소리만 들렸다.\n옆 사람이 고개를 저었다.', ref: null, basis: '창 11:7 언어를 혼잡하게 하심' },
    { who: 'narr', text: '역청 통을 든 사람이 몇 번이나 같은 말을 했다.\n아무도 통을 받아 주지 않았다.', ref: null, basis: '창 11:7' },
    { who: 'narr', text: '꼭대기를 가리키던 사람이 말을 멈추고,\n자기 말을 알아듣는 몇 사람과 짐을 쌌다.', ref: null, basis: '창 11:8 흩으심' },
    { who: 'narr', text: '아이를 안은 사람이 서쪽 길을 보았다.\n함께 갈 사람을 찾는 눈빛이었다.', ref: null, basis: '창 11:8~9 온 땅에 흩으심' },
  ],
  name: [
    { who: 'narr', text: '여호와께서 그들을 온 땅에 흩으시니, 그들이 성읍 쌓기를 그쳤다.', ref: '창 11:8' },
    { who: 'narr', text: '그러므로 그 이름을 바벨이라 하였다.\n여호와께서 거기서 온 땅의 언어를 뒤섞으셨기 때문이다.', ref: '창 11:9' },
    { who: 'narr', text: '셈의 자손 가운데 데라가 아브람과 나홀과 하란을 낳았다.', ref: '창 11:10~27' },
    { who: 'narr', text: '아브람의 아내 사래는 아이를 낳지 못하였다.', ref: '창 11:30' },
    { who: 'angel', text: '자기 이름을 높이려던 탑이 멈추었어요.\n다음에는 하나님께서 이름을 크게 해 주시겠다는 사람을 만나요.', ref: null },
  ],
};

// 막간: 언어가 하나일 때, 벽돌 가마 앞에서 벽돌 굽는 이와 끝까지 대화한다. 여호와께서 내려오시기(창 11:5) 전이다.
const interlude = {
  who: 'builder',
  steps: [
    { say: [
      { who: 'narr', text: '가마 앞에서 벽돌 굽는 이가 이마의 땀을 닦았다.', ref: null, basis: '창 11:3 벽돌을 굽자' },
      { who: 'builder', text: '처음 보는 얼굴이네. 일하러 왔소?\n하루에 벽돌 삼백 장은 구워야 탑이 자라오.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 11:3' },
    ] },
    { choose: [
      { text: '삼백 장이나요?', fruit: 'patience', reply: [
        { who: 'builder', text: '어제는 삼백열 장이었소. 가마 불을 밤새 지키느라 눈이 따갑소.', ref: null, basis: '창 11:3 굽자' },
      ] },
      { text: '(벽돌을 함께 나른다)', fruit: 'kindness', reply: [
        { who: 'narr', text: '구운 벽돌은 아직 따뜻했다.\n벽돌 굽는 이가 장갑 대신 천 조각을 건네주었다.', ref: null, basis: '창 11:3 벽돌' },
      ] },
      { text: '탑은 왜 쌓아요?', fruit: 'faith', reply: [
        { who: 'builder', text: '꼭대기가 하늘에 닿으면 우리 이름이 높아진다더군.\n위에서 그렇게 정했소.', ref: null, basis: '창 11:4 이름을 내자' },
      ] },
      { text: '불 지키는 거 대신할게요.', fruit: 'goodness', need: { kindness: 1 }, reply: [
        { who: 'builder', text: '정말이오? 그럼 잠깐 눈 좀 붙이겠소. 불이 하얘지면 나를 깨우시오.', ref: null, basis: '창 11:3' },
      ] },
    ] },
    { say: [
      { who: 'builder', text: '우리 고향은 저 동쪽이오. 거기선 흩어져 양을 쳤지.', ref: null, basis: '창 11:2 동쪽에서 옮김' },
      { who: 'builder', text: '여기 모이니 좋긴 한데, 요즘은 탑만 보고 사오.', ref: null, basis: '창 11:4 흩어짐을 면하자' },
    ] },
    { choose: [
      { text: '고향 이야기 더 들려주세요.', fruit: 'love', reply: [
        { who: 'builder', text: '봄이면 언덕마다 새끼 양이 뛰어다녔소.\n그 소리를 들은 지 오래됐구려.', ref: null, basis: '창 4:2 양 치는 일, 창 11:2' },
      ] },
      { text: '쉬는 날도 있어요?', fruit: 'peace', reply: [
        { who: 'builder', text: '탑이 다 서면 쉰다고들 하오. 그게 언제일지는 아무도 모르지.', ref: null, basis: '창 11:4~6' },
      ] },
      { text: '벽돌이 참 반듯해요.', fruit: 'joy', reply: [
        { who: 'builder', text: '틀을 내가 짰소. 모서리가 안 깨지게 진흙에 짚을 섞지.', ref: null, basis: '창 11:3, 출 5:7 벽돌과 짚' },
      ] },
    ] },
    { say: [
      { who: 'builder', text: '어이쿠, 불이 꺼지겠소. 이야기 고맙소.', ref: null, basis: '창 11:3' },
    ] },
  ],
};

const quiz = [
  { q: '사람들은 돌 대신 무엇으로 탑을 쌓았나요?', options: ['벽돌', '나무', '흙덩이'], answer: 0, ref: '창 11:3' },
  { q: '사람들이 탑을 쌓아 하려던 것은 무엇인가요?', options: ['자기 이름을 내려고', '홍수를 피하려고', '양을 지키려고'], answer: 0, ref: '창 11:4' },
  { q: '그 성읍의 이름을 무엇이라 하였나요?', options: ['바벨', '하란', '시날'], answer: 0, ref: '창 11:9' },
];

export default { id: 'babel', lines, interlude, quiz };
