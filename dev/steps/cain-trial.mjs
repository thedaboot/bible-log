import { boot } from './_save.mjs';
// 1-3 창 4:8~16(들, 숨김, 심문, 떠남)을 자동 플레이로 진행하며 대사마다 멈춰 캡처한다.
// PAUSES 환경 변수(쉼표로 구분한 대사 일부)로 멈출 자리를 바꾼다.
const PAUSES = (process.env.PAUSES ?? '들에 있을 때,어디 있느냐,모릅니다,울부짖,일곱,놋 땅').split(',');
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: ${Number(process.env.SPEED ?? 4)}, auto: true, pauseAt: ${JSON.stringify(PAUSES[0])} }); __dev.run('cain'); 1`);
  for (let i = 0; i < PAUSES.length; i++) {
    for (let k = 0; k < 600; k++) { await t.wait(500); if (!(await t.ev(`__dev.auto`))) break; }
    await t.wait(Number(process.env.HOLD ?? 1500));
    const pos = await t.ev(`(() => { const c = __dev.cain; const f = (o) => o ? [o.position.x.toFixed(1), o.position.z.toFixed(1), o.visible] : null; return JSON.stringify({ line: document.getElementById('line').textContent, cain: f(c.people.cain), abel: f(c.people.abel), player: f(__dev.player), errs: __e }); })()`);
    console.log(i, pos);
    await t.shot(`${i}-${PAUSES[i].replace(/\s/g, '')}`);
    await t.ev(`Object.assign(__dev, { auto: true, pauseAt: ${JSON.stringify(PAUSES[i + 1] ?? null)} }); 1`);
  }
};
