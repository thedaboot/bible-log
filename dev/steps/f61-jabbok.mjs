import { boot, SAVE } from './_save.mjs';
// F61 1-11 얍복: 자동 플레이로 끝까지 가며 정해 둔 대사에서 멈춰 캡처하고, 'jabbok/clear'와 걷다 막힌 기록(__stuck)을 본다.
// SHOTS='[["대사 일부","이름"],...]' PREFIX=before|after
const SHOTS = process.env.SHOTS ? JSON.parse(process.env.SHOTS) : [['맞으러 오고', 'arrive'], ['그 밤에 일어나', 'cross'], ['홀로 남았다', 'alone'], ['허벅지 관절을', 'thigh'], ['해가 떠오를 때', 'dawn'], ['눈을 들어', 'esau'], ['일곱 번', 'bows'], ['목을 끌어안고', 'hug']];
const PREFIX = process.env.PREFIX ?? 'shot';
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason?.stack||e.reason))); globalThis.__stuck = []; __dev.state.claimed = __dev.state.claimed.filter((c) => !c.startsWith('jabbok/')); 1`);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('jabbok'); 1`);
  for (const [text, name] of SHOTS) {
    await t.ev(`__dev.pauseAt = ${JSON.stringify(text)}; __dev.auto = true; 1`);
    let k = 0;
    for (; k < 600 && (await t.ev(`__dev.auto`)); k++) await t.wait(500);
    if (k >= 600) { console.log('miss', name); continue; }
    await t.wait(1800);
    await t.shot(`${PREFIX}-${name}`);
  }
  await t.ev(`__dev.pauseAt = null; __dev.auto = true; 1`);
  let k = 0;
  for (; k < 900 && !(await t.ev(`__dev.state.claimed.includes('jabbok/clear')`)); k++) await t.wait(1000);
  console.log(k < 900 ? 'clear' : 'TIMEOUT', 'stuck=' + (await t.ev(`JSON.stringify(globalThis.__stuck)`)), 'errs=' + (await t.ev(`JSON.stringify(__errs)`)));
};
