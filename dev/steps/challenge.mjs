import { boot } from './_save.mjs';
// 노아 방주 짓기 도전: 표시가 구간을 막 벗어난 뒤(0.06초 늦게) 눌러도 성공하는지 본다(S20)
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('noah'); 1`);
  for (let k = 0; k < 80; k++) { await t.wait(500); if (await t.ev(`!document.getElementById('challenge').hidden`)) break; }
  await t.ev(`__dev.auto = false; 1`);
  for (let k = 0; k < 60; k++) { if (await t.ev(`!document.getElementById('challenge').hidden && __dev.mode === 'walk'`)) break; if (await t.ev(`!document.getElementById('dialog').hidden`)) await t.ev(`document.getElementById('dialog').click(); 1`); await t.wait(400); }
  await t.wait(800);
  console.log('state', await t.ev(`JSON.stringify({ hidden: document.getElementById('challenge').hidden, zone: document.getElementById('chZone').style.transform, mark: getComputedStyle(document.getElementById('chMark')).transform, mode: __dev.mode })`));
  const r = await t.ev(String.raw`new Promise((res) => {
    const pos = () => new DOMMatrix(getComputedStyle(document.getElementById('chMark')).transform).m41 / document.getElementById('chTrack').clientWidth;
    const zone = () => { const s = document.getElementById('chZone').style.transform; return [parseFloat(s.split('translateX(')[1]) / 100, parseFloat(s.split('scaleX(')[1])]; };
    let was = false, n = 0;
    const t0 = performance.now();
    const tick = () => {
      const [a, w] = zone(), m = pos(), inz = m >= a && m <= a + w;
      if (was && !inz) {
        setTimeout(() => { document.getElementById('chAct').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); setTimeout(() => res(document.getElementById('chLabel').textContent), 150); }, 60);
        return;
      }
      was = inz;
      if (performance.now() - t0 < 30000) setTimeout(tick, 16); else res('timeout ' + m + ' ' + a + ' ' + w);
    };
    tick();
  })`);
  console.log('label after late press:', r);
  await t.shot('s20-challenge');
};
