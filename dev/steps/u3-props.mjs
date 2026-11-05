import { boot, SAVE } from './_save.mjs';
// U3: 손에 소품(어린양)을 든 채 장면이 관찰자 팔 자세를 바꾸는 곳(1-11 씨름 도전, 1-9 붓기)에서 소품이 허공에 뜨지 않는지
const STAGE = process.env.STAGE ?? 'jabbok';
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000, items: { tools: ['jar'], looks: ['lamb'] }, earthLook: { ...SAVE.earthLook, item: 'lamb' } });
  await t.ev(`__dev.run('${STAGE}'); __dev.speed = 4; __dev.auto = true; 1`);
  for (let k = 0; k < 900; k++) {
    await t.wait(300);
    if (await t.ev(`!document.getElementById('challenge').hidden && document.getElementById('challenge').dataset.kind === '${process.env.KIND ?? 'mash'}'`)) break;
  }
  await t.ev(`__dev.auto = false; 1`);
  await t.wait(800);
  if (process.env.KIND === 'hold') { await t.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32, text: ' ' }); await t.wait(900); }
  await t.shot(`u3-${STAGE}`);
  console.log(await t.ev(`JSON.stringify({ pose: __dev.player.userData.armPose ?? null, item: __dev.state.earthLook.item, label: document.getElementById('chLabel').textContent })`));
};
