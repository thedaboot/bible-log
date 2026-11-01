// 픽셀 아이콘: 글자 그림을 SVG 칸으로 바꾼다. 색은 tokens.css 토큰을 CSS 클래스로 칠한다(.px-o 테두리, .px-g 금, .px-l 빛, .px-d 그늘, .px-b 갈색).
const CLS = { o: 'px-o', g: 'px-g', l: 'px-l', d: 'px-d', b: 'px-b' };
function pixel(rows, label) {
  const w = rows[0].length, h = rows.length;
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (CLS[c]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" class="${CLS[c]}"/>`;
  }));
  return `<svg class="px-icon" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${label}">${rects}</svg>`;
}

// 달란트: 고대의 달란트는 둥글넓적한 금속 덩어리(무게 단위)였다. 손잡이 홈이 있는 둥근 덩어리로 그린다(마 25:15).
export const TALENT = pixel([
  '...oooo...',
  '..oggggo..',
  '.oglgggdo.',
  'oglggggddo',
  'oggg..gddo',
  'oggg..gddo',
  'oggggggddo',
  '.oggggddo.',
  '..oddddo..',
  '...oooo...',
], '달란트');

// 인벤토리: 끈으로 묶은 가죽 주머니(삼상 17:40 목자의 주머니)
export const BAG = pixel([
  '...o..o...',
  '....oo....',
  '...oggo...',
  '..obbbbo..',
  '.obbbbbbo.',
  'obbbbbbbdo',
  'obbbbbbbdo',
  'obbbbbbddo',
  '.obbbbddo.',
  '..oooooo..',
], '인벤토리');
