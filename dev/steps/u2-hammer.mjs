import { boot, SAVE } from './_save.mjs';
// U2: 1-4 짓기 성공 때 노아·관찰자가 팔을 내리치는 몸짓(armPose raise↔grip). 짧은 대기(wait)를 늦춰서 팔을 든 순간을 찍는다.
// U3: 손에 소품(어린양)을 든 채로 같은 장면에서 팔 자세를 바꿀 때 소품이 허공에 뜨는지도 함께 본다.
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000, items: { tools: [], looks: ['lamb'] }, earthLook: { ...SAVE.earthLook, item: 'lamb' } });
  await t.ev(`__dev.run('noah'); __dev.speed = 4; __dev.auto = true; 1`);
  for (let k = 0; k < 600; k++) {
    await t.wait(300);
    if (await t.ev(`document.getElementById('questTitle').textContent.includes('2/4') && __dev.mode === 'walk'`)) break;
  }
  // 짧은 setTimeout(300ms 이하)을 8배로 늘린다(망치질 몸짓 사이의 wait)
  await t.ev(`(() => { const st = window.setTimeout; window.setTimeout = (f, ms, ...a) => st(f, ms && ms <= 300 ? ms * 8 : ms, ...a); return 1; })()`);
  let got = 0;
  for (let k = 0; k < 400 && got < 2; k++) {
    const pose = await t.ev(`(() => { const n = __dev.field.people?.noah; return n ? String(n.userData.armPose) : 'none'; })()`);
    if (pose === 'raise') { await t.shot(`u2-raise-${got}`); got++; await t.wait(1500); }
    await t.wait(40);
  }
  console.log('raise shots', got, 'errs', await t.ev(`JSON.stringify(window.__e)`));
};
