import { boot, SAVE } from './_save.mjs';
// F14: 에녹이 떠오르는 중간 모습. 창 5:24 대사에서 멈추고 시계를 0.15배로 늦춰 여러 번 찍는다.
export default async (t) => {
  await boot(t, SAVE);
  await t.ev(`Object.assign(__dev, { speed: 4, pauseAt: '데려가셔서', auto: true }); __dev.run('enoch'); 1`);
  for (let k = 0; k < 400 && (await t.ev(`__dev.auto`)); k++) await t.wait(1000);
  await t.ev(`(() => { const real = performance.now.bind(performance); const t0 = real(); const f0 = window.__now0 = t0; performance.now = () => f0 + (real() - f0) * 0.15; return 1; })()`);
  for (let i = 0; i < 5; i++) { await t.wait(4000); await t.shot(`rise-${i}`); console.log(await t.ev(`JSON.stringify(__dev.field.enoch.userData.rig.position)`)); }
};
