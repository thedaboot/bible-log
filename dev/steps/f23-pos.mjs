import { boot, SAVE } from './_save.mjs';
// F23: 막간에서 상대와 관찰자가 화면 어디에 있는지(NDC) 재고 찍는다. STAGE 환경 변수(기본 noah)
export default async (t) => {
  const id = process.env.STAGE ?? 'noah', stop = process.env.STOP ?? '여덟이오';
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.state.claimed = __dev.state.claimed.filter((c) => c !== '${id}/clear'); Object.assign(__dev, { speed: 4, pauseAt: ${JSON.stringify(stop)}, auto: true }); __dev.run('${id}'); 1`);
  for (let k = 0; k < 900 && (await t.ev(`__dev.auto`)); k++) await t.wait(1000);
  await t.wait(2500);
  await t.shot(`pos-${id}`);
  console.log(await t.ev(`JSON.stringify({ player: __dev.player.position, vis: __dev.player.visible })`));
};
