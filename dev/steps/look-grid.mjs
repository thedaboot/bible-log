// 꾸미기 조합 격자(dev/look-grid.html)를 정면·카메라 각도·걷기 자세로 캡처한다.
//   node dev/cdp.mjs 1800 1500 dev/steps/look-grid.mjs dev/shots/look3   (TAG=before면 이름 앞에 붙는다)
const base = process.env.BASE ?? 'http://127.0.0.1:5183/';
const tag = process.env.TAG ? `${process.env.TAG}-` : '';
export default async ({ open, shot, wait, ev }) => {
  for (const [set, view, walk] of [['head', 'front', 0], ['head', 'cam', 0], ['head', 'back', 0], ['hand', 'front', 0], ['hand', 'cam', 0], ['hand', 'cam', 1], ['waist', 'front', 0], ['waist', 'cam', 1]]) {
    await open(`${base}dev/look-grid.html?set=${set}&view=${view}&walk=${walk}`);
    await wait(500);
    await ev('window.__ready === true');
    await shot(`${tag}${set}-${view}${walk ? '-walk' : ''}`);
  }
};
