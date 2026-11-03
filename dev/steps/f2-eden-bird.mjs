import { boot, SAVE } from './_save.mjs';
// F10: 에덴 이름 짓기에서 나무에 앉은 새. 자동 플레이로 새 차례까지 가서 멈추고 캡처한다.
export default async (t) => {
  await boot(t, SAVE);
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message))); Object.assign(__dev, { speed: 4, pauseAt: '새라 부르겠다', auto: true }); __dev.run('eden'); 1`);
  for (let k = 0; k < 160; k++) {
    await t.wait(1500);
    const st = await t.ev(`JSON.stringify({ auto: __dev.auto, line: document.getElementById('line').textContent, q: document.getElementById('questTitle').textContent })`);
    if (k % 10 === 0) console.log(st);
    if (!JSON.parse(st).auto) break;
  }
  await t.shot('bird-naming');
  await t.ev(`__dev.auto = true; 1`);
  await t.wait(2500);
  await t.shot('bird-card');
  // 앉은 새를 가까이
  console.log(await t.ev(`JSON.stringify({ bird: __dev.eden.perch.bird.position, errs: __errs })`));
};
