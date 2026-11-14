// 그림 모음 캡처: 선 아이콘(src/glyphs.js)과 도감 항목 → 그림. 예전 픽셀 그림 모음(dev/art-sheet.html)은 2026-11-14에 걷었다.
// dev/icon-sheet.html은 다 그리면 window.__ready를 켠다. 그때까지 기다린 뒤 세 구역을 차례로 찍는다:
// sheet(모든 그림, 벽 위) · sheet-codex(도감 항목 → 그림) · sheet-dark(모든 그림, 장면 위).
// 주소는 BASE(없으면 브라우저 점검 주소 5174)를 쓴다.
export default async ({ open, shot, wait, ev }) => {
  const base = (process.env.BASE ?? 'http://127.0.0.1:5174/').replace(/\/?$/, '/');
  await open(`${base}dev/icon-sheet.html`);
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) { await wait(250); ready = await ev('window.__ready === true'); }
  if (!ready) throw new Error('dev/icon-sheet.html: window.__ready가 켜지지 않았다(그림 모음을 그리지 못했다)');
  await shot('sheet');
  await ev(`document.getElementById('codex').previousElementSibling.scrollIntoView(); 1`);
  await wait(200);
  await shot('sheet-codex');
  await ev(`document.querySelector('.dark').scrollIntoView(); 1`);
  await wait(200);
  await shot('sheet-dark');
};
