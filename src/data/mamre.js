// 1-7 세 손님과 약속(창 18장). 창 17장(이름이 아브라함, 사라로 바뀜)은 처음 서술로 잇는다.
// 세 사람 가운데 말씀하시는 분은 본문이 여호와라 부르므로(창 18:10, 18:13) 그 말은 YHWH(voice) 이름표로 둔다.
// 형상 없는 하나님 규칙(design.md)에 따라 세 손님은 얼굴을 그리지 않은 빛나는 나그네로 그린다.

const lines = {
  arrive: [
    { who: 'narr', text: '하나님께서 아브람의 이름을 아브라함으로,\n사래의 이름을 사라로 바꾸어 부르게 하셨다.', ref: '창 17:5~15' },
    { who: 'narr', text: '여호와께서 마므레 상수리나무 곁에서 아브라함에게 나타나셨다.\n아브라함은 한낮 더위에 장막 문에 앉아 있었다.', ref: '창 18:1' },
    { who: 'narr', text: '눈을 들어 보니 세 사람이 맞은편에 서 있었다.\n아브라함이 달려 나가 땅에 엎드렸다.', ref: '창 18:2' },
    { who: 'abraham', text: '내 주여, 종을 그냥 지나치지 마십시오.\n물을 조금 가져다 발을 씻으시고, 나무 아래에서 쉬십시오.', ref: '창 18:3~4' },
    { who: 'narr', text: '아브라함이 장막으로 급히 가서 사라에게 고운 가루로 떡을 만들라 하고,\n소 떼로 달려가 송아지를 골라 종에게 주었다.', ref: '창 18:6~7' },
    { who: 'angel', text: '손님상을 차려야 해요.\n물, 떡, 엉긴 젖을 받아 나무 아래로 날라 보아요.', ref: null },
  ],
  served: [
    { who: 'narr', text: '아브라함이 엉긴 젖과 우유와 송아지 요리를 차려 놓고,\n나무 아래 그들 곁에 서 있었다.', ref: '창 18:8' },
    { who: 'voice', text: '네 아내 사라가 어디 있느냐?', ref: '창 18:9' },
    { who: 'abraham', text: '장막 안에 있습니다.', ref: '창 18:9' },
    { who: 'voice', text: '내년 이맘때 내가 반드시 너에게 돌아오리니,\n그때 네 아내 사라에게 아들이 있을 것이다.', ref: '창 18:10' },
    { who: 'narr', text: '사라는 장막 문 뒤에서 듣고 속으로 웃었다.\n두 사람 다 나이가 많이 들었기 때문이다.', ref: '창 18:11~12' },
    { who: 'voice', text: '사라가 어찌하여 웃느냐?', ref: '창 18:13' },
    { who: 'voice', text: '여호와에게 너무 어려운 일이 있겠느냐?\n정한 때에 내가 너에게 돌아오리니, 사라에게 아들이 있을 것이다.', ref: '창 18:14' },
    { who: 'sarah', text: '저는 웃지 않았습니다.', ref: '창 18:15' },
    { who: 'voice', text: '아니다. 네가 웃었다.', ref: '창 18:15' },
  ],
  sodom: [
    { who: 'narr', text: '그 사람들이 일어나 소돔 쪽을 바라보았고,\n아브라함이 배웅하러 함께 걸었다.', ref: '창 18:16' },
    { who: 'abraham', text: '주께서 의인을 악인과 함께 멸하려 하십니까?\n그 성에 의인 열 명이 있으면 어찌하시겠습니까?', ref: '창 18:23~32' },
    { who: 'voice', text: '열 명 때문에라도 멸하지 않겠다.', ref: '창 18:32' },
    { who: 'angel', text: '하나님께는 너무 어려운 일이 없대요.\n오늘 들은 말씀을 함께 돌아볼까요?', ref: null },
  ],
};

// 막간: 손님들이 상을 받는 동안 장막 곁에서 아브라함과 끝까지 대화한다(창 18:8과 18:9 사이).
const interlude = {
  who: 'abraham',
  steps: [
    { say: [
      { who: 'narr', text: '아브라함이 숨을 몰아쉬며 장막 기둥에 기대섰다.', ref: null, basis: '창 18:2~7 달려가 맞음' },
      { who: 'abraham', text: '당신도 거들어 주었구려. 이 늙은이가 오늘은 많이 뛰었소.', ref: null, basis: '막간: 인물이 관찰자를 알아본다, 창 18:6~7 급히' },
    ] },
    { choose: [
      { text: '정말 빨리 뛰셨어요!', fruit: 'joy', reply: [
        { who: 'abraham', text: '아흔아홉 살 다리로는 꽤 빨랐지.\n소 떼까지 가서 송아지를 고르느라 신발도 벗겨졌소.', ref: null, basis: '창 17:24 아흔아홉 살, 창 18:7' },
      ] },
      { text: '(물 한 잔을 건넨다)', fruit: 'kindness', reply: [
        { who: 'narr', text: '아브라함이 단숨에 물을 마시고, 남은 물로 이마를 적셨다.', ref: null, basis: '창 18:4 물' },
      ] },
      { text: '처음 보는 손님들이죠?', fruit: 'faith', reply: [
        { who: 'abraham', text: '처음 보는 얼굴이오. 그래도 나그네는 그냥 보내는 법이 아니오.', ref: null, basis: '히 13:2 손님 대접하기를 잊지 말라' },
      ] },
      { text: '제가 상을 지킬게요.', fruit: 'goodness', need: { kindness: 1 }, reply: [
        { who: 'abraham', text: '고맙소. 그럼 나는 손님들 곁에 서 있겠소.\n필요한 것이 있으면 내가 바로 가져오겠소.', ref: null, basis: '창 18:8 곁에 섬' },
      ] },
    ] },
    { say: [
      { who: 'abraham', text: '하나님께서 내 이름을 바꾸어 주셨소. 많은 민족의 아버지라는 뜻이오.', ref: null, basis: '창 17:5' },
      { who: 'abraham', text: '그런데 사라와 나 사이에는 아직 아들이 없소.', ref: null, basis: '창 17:17, 18:11' },
    ] },
    { choose: [
      { text: '그 약속 꼭 이뤄질 거예요.', fruit: 'faith', reply: [
        { who: 'abraham', text: '나도 그렇게 믿소. 별을 세던 밤부터 지금까지.', ref: null, basis: '창 15:5~6' },
      ] },
      { text: '기다리기 힘드셨겠어요.', fruit: 'patience', reply: [
        { who: 'abraham', text: '스물네 해요. 하란을 떠난 날부터 손가락으로 세어 왔소.', ref: null, basis: '창 12:4 일흔다섯 살, 창 17:24 아흔아홉 살' },
      ] },
      { text: '사라님도 같은 마음일까요?', fruit: 'love', reply: [
        { who: 'abraham', text: '그 사람은 웃음으로 버티오. 오늘도 떡 반죽을 하며 웃더군.', ref: null, basis: '창 18:6, 18:12 웃음' },
      ] },
    ] },
    { say: [
      { who: 'abraham', text: '손님들이 나를 부르시오. 가 봐야겠소.', ref: null, basis: '창 18:9로 이어짐' },
    ] },
  ],
};

const greetings = {
  sarah: [
    { who: 'sarah', text: '고운 가루 세 스아로 구웠어요. 떡이 식기 전에 얼른 가져가요.', ref: null, basis: '창 18:6 고운 가루 세 스아' },
  ],
};

const quiz = [
  { q: '아브라함은 손님들을 어디에서 쉬게 했나요?', options: ['나무 아래', '우물가', '성문 앞'], answer: 0, ref: '창 18:4' },
  { q: '사라는 아들이 있으리라는 말씀을 듣고 어떻게 했나요?', options: ['울었다', '속으로 웃었다', '노래했다'], answer: 1, ref: '창 18:12' },
  { q: '사라가 웃자 여호와께서 무엇이라 하셨나요?', options: ['네가 어디 있느냐', '하늘의 별을 세어 보아라', '여호와에게 너무 어려운 일이 있겠느냐'], answer: 2, ref: '창 18:14' },
];

export default { id: 'mamre', lines, interlude, greetings, quiz };
