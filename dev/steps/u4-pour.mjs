import { boot, SAVE } from './_save.mjs';
// U4: 1-9 구유 붓기. 꾹 누르는 중간(물이 반쯤 찬 때)을 휴대폰 폭에서 찍는다
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.run('rebekah'); __dev.speed = 4; __dev.auto = true; 1`);
  for (let k = 0; k < 600; k++) {
    await t.wait(300);
    if (await t.ev(`document.getElementById('questTitle').textContent.includes('낙타 물 주기') && __dev.mode === 'walk'`)) break;
  }
  await t.ev(`__dev.auto = false; 1`);
  // 우물 긷기(머무르기)는 건너뛰고, 붓기 도전 자리로 간다
  for (let k = 0; k < 60; k++) {
    if (await t.ev(`!document.getElementById('challenge').hidden && document.getElementById('challenge').dataset.kind === 'hold'`)) break;
    await t.ev(`__dev.goNext(); 1`); await t.wait(400);
  }
  await t.ev(`__dev.auto = false; __dev.speed = 1; 1`);
  await t.wait(2500);
  await t.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32, text: ' ' });
  for (let k = 0; k < 200; k++) { const m = await t.ev(`parseFloat(document.getElementById('chMark').style.transform.slice(11)) / document.getElementById('chTrack').clientWidth`); if (m > 0.4) break; await t.wait(30); }
  await t.shot('u4-pour');
  await t.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
  console.log('errs', await t.ev(`JSON.stringify(window.__e)`));
};
