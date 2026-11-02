import { boot } from './_save.mjs';
// 1-7 장막 입구 가까이 보기: 사라를 잠시 숨기고/보이며 입구 천과 어두운 안쪽을 캡처한다. SLOW면 웃음 중간 모습.
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true, pauseAt: '장막 안에 있습니다' }); __dev.run('mamre'); 1`);
  for (let k = 0; k < 600; k++) { await t.wait(500); if (!(await t.ev(`__dev.auto`))) break; }
  await t.wait(2000);
  await t.ev(`document.getElementById('dialog').style.visibility='hidden'; 1`);
  await t.ev(`__dev.field.people.sarah.visible=false; 1`);
  await t.wait(600);
  await t.shot('door-empty');
  await t.ev(`__dev.field.people.sarah.visible=true; 1`);
  await t.wait(600);
  await t.shot('door-sarah');
  await t.ev(`document.getElementById('dialog').style.visibility=''; Object.assign(__dev, { auto: true, pauseAt: '문 뒤에서' }); 1`);
  for (let k = 0; k < 600; k++) { await t.wait(300); if (!(await t.ev(`__dev.auto`))) break; }
  // 웃음 tween(1.8초) 중간: 시계를 늦춘다
  await t.ev(`window.__pn = performance.now.bind(performance); { const b = __pn(); performance.now = () => b + (__pn() - b) * 0.08; } 1`);
  await t.wait(Number(process.env.MID ?? 6000));
  await t.shot('laugh-mid');
  await t.ev(`performance.now = __pn; 1`);
  console.log(await t.ev(`JSON.stringify(__e)`));
};
