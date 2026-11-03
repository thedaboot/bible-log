import { boot, SAVE } from './_save.mjs';
// F23·F32: 대화 중 말하는 인물이 화면 안에 있는지. 에덴 막간(아담)과 1-4 막간(노아)의 대사에서 멈춰 찍는다.
const RUNS = [['eden', '오늘 내내 내 곁에'], ['noah', process.env.NOAH_LINE ?? '여덟이오']];
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  for (const [id, stop] of RUNS) {
    await t.ev(`__dev.state.claimed = __dev.state.claimed.filter((c) => c !== '${id}/clear'); Object.assign(__dev, { speed: 4, pauseAt: ${JSON.stringify(stop)}, auto: true }); __dev.run('${id}'); 1`);
    for (let k = 0; k < 900 && (await t.ev(`__dev.auto`)); k++) await t.wait(1000);
    await t.wait(2500);
    await t.shot(`focus-${id}`);
    await t.ev(`__dev.auto = false; 1`);
    await t.ev(`location.reload(); 1`).catch(() => {});
    await boot(t, { ...SAVE, xp: 3000 });
  }
};
