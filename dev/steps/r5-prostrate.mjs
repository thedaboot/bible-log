import { boot, SAVE } from './_save.mjs';
// R5: 1-11 일곱 번 엎드림, 1-13 형들의 엎드림, 1-7 아브라함. 그 대사에서 멈춰 캡처하고 스테이지를 끝까지 돌린다.
const RUNS = [['jabbok', '일곱 번 땅에 엎드리며'], ['brothers', '땅에 엎드려 절하였다'], ['mamre', '내 주여']];
export default async (t) => {
  await boot(t, { ...SAVE, xp: 2000 });
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason?.stack||e.reason))); 1`);
  for (const [id, stop] of RUNS) {
    await t.ev(`Object.assign(__dev, { speed: 4, pauseAt: ${JSON.stringify(stop)}, auto: true }); __dev.run(${JSON.stringify(id)}); 1`);
    for (let k = 0; k < 400 && (await t.ev(`__dev.auto`)); k++) await t.wait(1000);
    await t.wait(1500);
    await t.shot(`prostrate-${id}`);
    await t.ev(`__dev.auto = true; 1`);
    for (let k = 0; k < 600 && !(await t.ev(`__dev.state.claimed.includes('${id}/clear')`)); k++) await t.wait(1000);
    console.log(id, await t.ev(`__dev.state.claimed.includes('${id}/clear')`), await t.ev(`JSON.stringify(__errs)`));
    await t.ev(`__dev.auto = false; 1`);
    await t.wait(3000);
  }
};
