// 하나님의 이름표는 본문에 쓰인 이름을 따른다: 창 1:1~2:3은 엘로힘, 그 밖(프롤로그, 창 2:4부터)은 YHWH.
export const SPEAKERS = { narr: '', voice: 'YHWH', elohim: '엘로힘', angel: '대천사', adam: '아담', eve: '하와', serpent: '뱀' };

// 한글 이름 끝 글자에 받침이 있으면 '아', 없으면 '야'. 한글이 아니면 호격 조사를 붙이지 않는다.
export function vocative(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return name;
  return name + (code % 28 ? '아' : '야');
}

// '사자라', '곰이라'처럼 받침에 맞춰 '(이)라'를 붙인다.
export function withRa(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (code >= 0 && code <= 11171 && code % 28 ? '이라' : '라');
}

// {animalRa}는 ctx.animal에 '(이)라'를 붙인 말로 바뀐다(동물 이름 짓기 장면).
export function fill(text, ctx) {
  return text.replaceAll('{nameVoc}', vocative(ctx.name)).replaceAll('{name}', ctx.name)
    .replaceAll('{animalRa}', ctx.animal ? withRa(ctx.animal) : '');
}
