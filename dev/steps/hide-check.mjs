import { boot, SAVE } from './_save.mjs';
// 막간 상대가 나무에 가려졌는지 판정(hidden)이 맞는지: 에덴에서 아담을 큰 나무 뒤(카메라 반대쪽)와 빈 땅에 세워 본다
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.run('eden'); __dev.speed = 4; __dev.auto = true; 1`);
  for (let k = 0; k < 200 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(300);
  await t.ev(`__dev.auto = false; 1`);
  const r = await t.ev(`(() => { const a = __dev.eden.adam, k = __dev.eden.knowledge.position; const out = {};
    a.visible = true; a.position.set(k.x - 1.2, 0, k.z - 1.2); out.behindTree = __dev.hidden(a);
    a.position.set(-12, 0, 6); out.open = __dev.hidden(a); return JSON.stringify(out); })()`);
  console.log(r);
};
