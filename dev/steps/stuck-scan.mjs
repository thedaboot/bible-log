import { boot, SAVE } from './_save.mjs';
// 스테이지 전반 충돌 점검: 자동 플레이로 끝까지 돌며, 걷다 막혀 순간 이동한 기록(globalThis.__stuck, field.js)을 스테이지마다 모은다.
export default async (t) => {
  const stages = (process.env.STAGES ?? 'babel').split(',');
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason?.stack||e.reason))); 1`);
  for (const id of stages) {
    await t.ev(`globalThis.__stuck = []; __dev.state.claimed = __dev.state.claimed.filter((c) => c !== '${id}/clear'); Object.assign(__dev, { speed: 4, pauseAt: null, auto: true }); __dev.run('${id}'); 1`);
    let k = 0;
    for (; k < 900 && !(await t.ev(`__dev.state.claimed.includes('${id}/clear')`)); k++) await t.wait(1000);
    await t.wait(3000);
    console.log(id, k < 900 ? 'clear' : 'TIMEOUT', 'stuck=' + (await t.ev(`JSON.stringify(globalThis.__stuck)`)), 'errs=' + (await t.ev(`JSON.stringify(__errs.splice(0))`)));
    await t.ev(`__dev.auto = false; 1`);
  }
};
