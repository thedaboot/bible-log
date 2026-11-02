// 대사 한 줄마다 ref(장절)를 단다. 본문에 근거가 없는 연출 대사는 ref: null.
// who: narr(서술) | voice(하나님, 이름표 YHWH) | elohim(하나님, 이름표 엘로힘: 창 1:1~2:3) | angel(대천사)
//      | adam(아담) | eve(하와) | serpent(뱀)
// {name}은 플레이어 이름, {nameVoc}은 '이름+아/야'로 바뀐다.
// 줄바꿈(\n): docs/standards/dialogue.md의 줄바꿈 2판(36자)을 따른다.
//            npm run check가 이 기준을 점검한다.

export const PROLOGUE = {
  intro: [
    { who: 'narr', text: '자기 전 기도를 마치고 불을 끈 밤, 방 안이 대낮처럼 환해졌다.', ref: null },
    { who: 'narr', text: '눈을 떠 보니 발밑이 온통 구름이었다.', ref: null },
    { who: 'voice', text: '이리로 올라오너라.', ref: '계 4:1' },
    { who: 'voice', text: '네 이름이 무엇이냐?', ref: null },
  ],
  named: [
    { who: 'voice', text: '{nameVoc}, 내가 네 이름을 불렀다. 너는 내 것이다.', ref: '사 43:1' },
    { who: 'voice', text: '태초에 내가 하늘과 땅을 창조하였다.', ref: '창 1:1' },
    { who: 'voice', text: '그 처음의 날들을 네게 보여 주겠다.\n내 천사가 너와 함께 갈 것이다.', ref: null },
  ],
  angel: [
    { who: 'angel', text: '반가워요, {name}님! 저는 {name}님 곁에서 함께 걸을 대천사예요.', ref: null },
    { who: 'angel', text: '우리는 보는 쪽이에요.\n일어난 일을 바꿀 수는 없지만, 그 자리에 함께 설 수는 있어요.', ref: null },
    { who: 'angel', text: '새벽 별들이 노래하고 하나님의 아들들이 기뻐 외치던 그날,\n우리도 그 자리를 보러 가요!', ref: '욥 38:7' },
    { who: 'angel', text: '저 앞에 빛나는 문이 보이죠? 거기까지 걸어와 주세요.', ref: null },
  ],
  gate: [
    { who: 'angel', text: '준비됐나요? 아무것도 없던 맨 처음으로 내려가요.', ref: null },
  ],
};
