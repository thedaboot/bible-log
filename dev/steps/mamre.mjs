import { boot } from './_save.mjs';
// 1-7 마므레: 엎드림, 사라 숨음·웃음·부인 장면에서 멈춰 캡처하고, 끝까지 자동 플레이해 마침 창을 확인한다.
// PAUSES(쉼표 구분 대사 일부)로 멈출 자리를 바꾼다. SLOW=1이면 멈춘 뒤 tween 중간 모습을 보려고 시계를 늦춘다.
const PAUSES = (process.env.PAUSES ?? '종을 그냥,장막 안에 있습니다,문 뒤에서,어찌하여 웃느냐,웃지 않았습니다,네가 웃었다').split(',');
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true, pauseAt: ${JSON.stringify(PAUSES[0])} }); __dev.run('mamre'); 1`);
  for (let i = 0; i < PAUSES.length; i++) {
    for (let k = 0; k < 600; k++) { await t.wait(500); if (!(await t.ev(`__dev.auto`))) break; }
    await t.wait(Number(process.env.HOLD ?? 2500));
    const pos = await t.ev(`(() => { const f = __dev.field; const p = (o) => o ? [o.position.x.toFixed(2), o.position.z.toFixed(2), o.visible] : null; return JSON.stringify({ line: document.getElementById('line').textContent, ab: p(f.people.abraham), sarah: p(f.people.sarah), errs: __e }); })()`);
    console.log(i, pos);
    await t.shot(`m${i}`);
    await t.ev(`Object.assign(__dev, { auto: true, pauseAt: ${JSON.stringify(PAUSES[i + 1] ?? null)} }); 1`);
  }
  for (let k = 0; k < 600; k++) { await t.wait(500); if (await t.ev(`!document.getElementById('clearBox')?.hidden`)) break; }
  console.log('clear', await t.ev(`!document.getElementById('clearBox')?.hidden`), await t.ev(`JSON.stringify(__e)`));
  await t.shot('m-clear');
};
