import { boot, SAVE } from './_save.mjs';
// 막간 상대가 나무 뒤(관찰자 곁 2 이내)에 가려 있으면 막간을 열 때 관찰자 곁으로 걸어 나오는지 장면으로 본다
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.run('eden'); __dev.speed = 4; __dev.auto = true; 1`);
  for (let k = 0; k < 200 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(300);
  await t.ev(`__dev.auto = false; __dev.stop(); 1`);
  const before = await t.ev(`(() => { const a = __dev.eden.adam, k = __dev.eden.knowledge.position; a.visible = true; a.position.set(k.x - 0.85, 0, k.z - 0.85); __dev.player.position.set(k.x + 0.75, 0, k.z + 0.75); return JSON.stringify({ hidden: __dev.hidden(a), d: a.position.distanceTo(__dev.player.position).toFixed(2) }); })()`);
  await t.wait(1500);
  await t.shot('before');
  await t.ev(`__dev.interlude(); 1`);
  await t.wait(5000);
  const after = await t.ev(`JSON.stringify({ hidden: __dev.hidden(__dev.eden.adam), pos: __dev.eden.adam.position.toArray().map(v => +v.toFixed(2)) })`);
  await t.shot('after');
  console.log('before', before, 'after', after, 'errs', await t.ev(`JSON.stringify(window.__e)`));
};
