// 하나님의 이름표는 본문에 쓰인 이름을 따른다: 창 1:1~2:3은 엘로힘, 그 밖(프롤로그, 창 2:4부터)은 YHWH.
export const SPEAKERS = { narr: '', voice: 'YHWH', elohim: '엘로힘', angel: '대천사', adam: '아담', eve: '하와', serpent: '뱀', cain: '가인', abel: '아벨',
  // 1-4부터
  noah: '노아', enoch: '에녹', methuselah: '므두셀라', builder: '벽돌 굽는 이', people: '사람들', worker: '일꾼', abram: '아브람', sarai: '사래', lot: '롯',
  abraham: '아브라함', sarah: '사라', hagar: '하갈', messenger: '여호와의 사자', ishmael: '이스마엘', guest: '손님', isaac: '이삭',
  servant: '늙은 종', youth: '젊은 종', rebekah: '리브가', laban: '라반', jacob: '야곱', esau: '에서', man: '그 사람', joseph: '요셉', judah: '유다',
  reuben: '르우벤', pharaoh: '바로', cupbearer: '술 맡은 관원장', benjamin: '베냐민' };

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

// 받침에 맞춰 조사를 붙인다. josa('인내', '이', '가') → '인내가'. '(으)로'는 ㄹ 받침 뒤에서 '로'다.
export function josa(word, withFinal, without) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const fin = code >= 0 && code <= 11171 ? code % 28 : 0;
  return word + (fin && !(withFinal === '으로' && fin === 8) ? withFinal : without);
}
