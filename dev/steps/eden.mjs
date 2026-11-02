import { boot } from './_save.mjs';
// 에덴 걷기: 퀘스트 창·HUD·조작 안내, 끌어서 걷기, 화면 밖 화살표, 관계 배너
export default async (t) => {
  await boot(t, { ...(await import('./_save.mjs')).SAVE, learned: [] });
  await t.ev(`__dev.run('noah'); 1`);
  await t.wait(4000);
  if (await t.ev(`!document.getElementById('lookForm').hidden`)) { await t.ev(`document.getElementById('lookSubmit').click()`); await t.wait(2500); }
  for (let k = 0; k < 60 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) { await t.ev(`document.getElementById('dialog').click()`); await t.wait(150); }
  await t.wait(800);
  await t.shot('s12-walk');
  // 끌기: 화면 가운데에서 위로 60px 끌고 있는 중
  const x = t.W / 2, y = t.H * 0.6;
  await t.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let k = 1; k <= 6; k++) { await t.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + k * 6, y: y - k * 10 }] }); await t.wait(60); }
  const p0 = await t.ev(`JSON.stringify(__dev.player.position)`);
  await t.wait(1500);
  await t.shot('s04-stick');
  const p1 = await t.ev(`JSON.stringify(__dev.player.position)`);
  await t.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log('moved', p0, p1, await t.ev(`document.getElementById('stick').hidden`));
  X('노아와 마음을 나눴어요', { gain: true }); 1`);
  await t.wait(700);
  await t.shot('s16-bond');
  console.log(await t.ev(`JSON.stringify(__e)`));
};
