import { boot, SAVE } from './_save.mjs';
// R6: 1-5 흩어지는 말을 하는 일꾼이 화면 안에 있는지(휴대폰 세로). 일꾼 넷의 첫 말에서 멈춰 캡처한다.
export default async (t) => {
  await boot(t, SAVE);
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message))); __dev.run('babel'); 1`);
  await t.wait(4000);
  if (await t.ev(`!document.getElementById('lookForm').hidden`)) { await t.ev(`document.getElementById('lookSubmit').click()`); await t.wait(2500); }
  const stops = ['뷁둙', '다는붙'];
  for (const [i, s] of stops.entries()) {
    await t.ev(`Object.assign(__dev, { speed: 4, pauseAt: ${JSON.stringify(s)}, auto: true }); 1`);
    for (let k = 0; k < 120 && (await t.ev(`__dev.auto`)); k++) await t.wait(1000);
    await t.wait(1200);
    await t.shot(`scatter-${i}`);
  }
  console.log(await t.ev(`JSON.stringify(__errs)`));
};
