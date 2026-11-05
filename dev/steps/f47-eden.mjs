import { boot, SAVE } from './_save.mjs';
// F46·F47 에덴: 이름 짓기를 마친 뒤 카메라가 아담과 관찰자를 비추는지, 잠들러 가는 아담이 막히지 않는지.
// 대사는 Space, 걷는 거리는 __dev.goNext로 건너뛴다. 정해 둔 대사가 나오면 캡처한다.
const SHOTS = process.env.SHOTS ? JSON.parse(process.env.SHOTS) : [['모든 가축과 새와', 'done'], ['해가 기울 무렵', 'interlude'], ['깊이 잠들게', 'sleep'], ['내 뼈에서 온 뼈', 'eve']];
export default async (t) => {
  const vis = (id) => t.ev(`(() => { const e = document.getElementById('${id}'); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; })()`);
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message))); __dev.speed = 4; __dev.state.claimed = __dev.state.claimed.filter((c) => !c.startsWith('eden/')); __dev.run('eden'); 1`);
  await t.wait(4000);
  const todo = [...SHOTS];
  for (let k = 0; k < 3000 && todo.length; k++) {
    if (await vis('dialog')) {
      const line = await t.ev(`document.getElementById('line').textContent`);
      const hit = todo.findIndex(([s]) => line.includes(s));
      if (hit >= 0) {
        await t.wait(2500);
        await t.shot(`f47-${todo[hit][1]}`);
        console.log(todo[hit][1], await t.ev(`JSON.stringify({ adam: __dev.eden.adam.position.toArray().map(v=>+v.toFixed(1)), me: __dev.player.position.toArray().map(v=>+v.toFixed(1)) })`));
        todo.splice(hit, 1);
      }
      if (await t.ev(`!!document.querySelector('#choices:not([hidden]) button')`)) { await t.ev(`document.querySelector('#choices button').click(); 1`); await t.wait(500); continue; }
      await t.ev(`document.getElementById('dialog').click(); 1`); await t.wait(120);
      continue;
    }
    if (await vis('dexCard')) { await t.ev(`document.getElementById('dexCard').click(); 1`); await t.wait(300); continue; }
    if (await vis('quiz')) break;
    await t.ev(`__dev.goNext(); 1`); await t.wait(300);
  }
  console.log('left', todo.map((x) => x[1]), 'errs', await t.ev(`JSON.stringify(__errs)`), 'stuck', await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`));
};
