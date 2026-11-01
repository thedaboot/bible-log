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

// 손에 드는 물건(data/items.js의 id)
export const ITEM_ICONS = {
  staff: pixel([
    '.......oo.',
    '......obbo',
    '.......obo',
    '......obo.',
    '.....obo..',
    '....obo...',
    '...obo....',
    '..obo.....',
    '.obo......',
    '.oo.......',
  ], '지팡이'),
  sling: pixel([
    'o........o',
    'ob......bo',
    '.ob....bo.',
    '..ob..bo..',
    '...obbo...',
    '...oddo...',
    '..oddddo..',
    '..odlddo..',
    '...oddo...',
    '....oo....',
  ], '물매'),
  horn: pixel([
    '........oo',
    '.......ogo',
    '......ogo.',
    '.....oggo.',
    '....oggo..',
    '..ooggo...',
    '.ogggo....',
    'oglgo.....',
    'oggo......',
    '.oo.......',
  ], '양각 나팔'),
  oil: pixel([
    '....oo....',
    '...obbo...',
    '....oo....',
    '...oggo...',
    '..oglggo..',
    '.oglgggdo.',
    '.ogggggdo.',
    '.oggggddo.',
    '..oddddo..',
    '...oooo...',
  ], '기름 뿔병'),
  jar: pixel([
    '..oooooo..',
    '...obbo...',
    '..obbbbo..',
    '.obbbbbbo.',
    'obblbbbbdo',
    'obbbbbbbdo',
    'obbbbbbddo',
    '.obbbbddo.',
    '..obbddo..',
    '...oooo...',
  ], '물동이'),
  hood: pixel([
    '...oooo...',
    '..ollllo..',
    '.ollllllo.',
    'olllllllo.',
    'ollooooldo',
    'olo....olo',
    'olo....olo',
    'oldo...odo',
    '.olo...oo.',
    '..o.......',
  ], '두건'),
  lamp: pixel([
    '....g.....',
    '...glg....',
    '...glg....',
    '....o.....',
    '.oooooooo.',
    'obbbbbbbbo',
    'oblbbbbbdo',
    '.obbbbbdo.',
    '..oooooo..',
    '..........',
  ], '등잔'),
  scroll: pixel([
    'oo......oo',
    'obooooooob',
    'ollllllllo',
    'oloooooolo',
    'ollllllllo',
    'olooooollo',
    'ollllllllo',
    'obooooooob',
    'oo......oo',
    '..........',
  ], '두루마리'),
  bag: BAG,
};
