import { boot, SAVE } from './_save.mjs';
// F58·F59 1-8 모리아: 층진 산과 굽이진 돌계단, 오를수록 산 아래가 내려다보이는지, 셋째 계단의 나뭇단 받쳐 주기(균형) 도전.
// 대사는 넘기고, 걷는 거리는 __dev.goNext로 건너뛴다. 정해 둔 대사·순간에 캡처한다. 도전은 한 번 직접 눌러 보고 자동으로 마친다.
const SHOTS = [['멀리 그곳이', 'arrive'], ['어린양은 어디', 'ask'], ['기우뚱', 'steady'], ['한 개비도', 'steady-done'], ['제단을 쌓고', 'altar'], ['돌아볼까요', 'down']];
export default async (t) => {
  const vis = (id) => t.ev(`(() => { const e = document.getElementById('${id}'); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; })()`);
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message))); __dev.speed = 4; __dev.run('moriah'); 1`);
  await t.wait(4000);
  const todo = [...SHOTS];
  const where = () => t.ev(`JSON.stringify({ me: __dev.player.position.toArray().map(v=>+v.toFixed(1)), isaac: __dev.field.isaac.position.toArray().map(v=>+v.toFixed(1)) })`);
  let climbShots = 0, challenged = false;
  for (let k = 0; k < 3000 && todo.length; k++) {
    if (await vis('dialog')) {
      const line = await t.ev(`document.getElementById('line').textContent`);
      const hit = todo.findIndex(([s]) => line.includes(s));
      if (hit >= 0) {
        await t.wait(2500);
        await t.shot(`f59-${todo[hit][1]}`);
        console.log(todo[hit][1], await where());
        todo.splice(hit, 1);
      }
      if (await t.ev(`!!document.querySelector('#choices:not([hidden]) button')`)) { await t.ev(`document.querySelector('#choices button').click(); 1`); await t.wait(500); continue; }
      await t.ev(`document.getElementById('dialog').click(); 1`); await t.wait(120);
      continue;
    }
    if (await vis('dexCard')) { await t.ev(`document.getElementById('dexCard').click(); 1`); await t.wait(300); continue; }
    if (await vis('quiz')) break;
    if (await vis('challenge')) {
      if (!challenged) {
        challenged = true;
        await t.wait(1200);
        await t.shot('f59-challenge');
        await t.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32, text: ' ' });
        await t.wait(900);
        await t.shot('f59-challenge-hold');
        await t.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
        console.log('challenge', await where(), await t.ev(`document.getElementById('chLabel').textContent`));
      }
      await t.ev(`__dev.auto = true; 1`); await t.wait(600); await t.ev(`__dev.auto = false; 1`);
      continue;
    }
    // 산 오르기: 길목 퀘스트마다 걷기 전에 한 장
    const quest = await t.ev(`document.getElementById('quest')?.textContent ?? ''`);
    if (/길목/.test(quest) && climbShots < 2) {
      await t.ev(`__dev.goNext(); 1`); await t.wait(2500);
      await t.shot(`f59-climb${climbShots++}`);
      console.log('climb', await where());
      continue;
    }
    await t.ev(`__dev.goNext(); 1`); await t.wait(300);
  }
  console.log('left', todo.map((x) => x[1]), 'errs', await t.ev(`JSON.stringify(__errs)`), 'stuck', await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`));
};
