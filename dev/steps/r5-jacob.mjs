import { boot, SAVE } from './_save.mjs';
// R5: 1-11 창 33:3 일곱 번 엎드림. 대사에서 멈추고 시계를 0.1배로 늦춰 엎드리는 중간을 찍는다.
export default async (t) => {
  await boot(t, { ...SAVE, xp: 2000 });
  await t.ev(`Object.assign(__dev, { speed: 4, pauseAt: '사백 명', auto: true }); __dev.run('jabbok'); 1`);
  for (let k = 0; k < 900 && (await t.ev(`__dev.auto`)); k++) await t.wait(1000);
  await t.ev(`(() => { const real = performance.now.bind(performance); const f0 = real(); performance.now = () => f0 + (real() - f0) * 0.1; return 1; })()`);
  await t.ev(`__dev.auto = true; __dev.pauseAt = '앞서 나아가'; 1`);
  for (let k = 0; k < 300 && (await t.ev(`__dev.auto`)); k++) await t.wait(500);
  for (let i = 0; i < 4; i++) { await t.wait(2500); await t.shot(`jacob-${i}`); }
};
