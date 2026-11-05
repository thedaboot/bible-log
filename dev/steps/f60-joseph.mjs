import { boot, SAVE } from './_save.mjs';
// F60 1-12 요셉: 구덩이·옥·궁전 장면을 대사 순간마다 캡처하고, 자동 플레이로 끝까지 가서 'joseph/clear'와 __stuck을 본다.
// TAG=before면 고치기 전 대사로, 아니면 고친 뒤 대사로 멈춘다. 대사는 순서대로 적는다(지나간 대사는 다시 잡지 못한다).
const BEFORE = [['형들이 요셉의 채색옷', 'pit'], ['이스마엘 사람들', 'sold'], ['왕의 죄수들이', 'prison-in'], ['간수장의 마음', 'prison'], ['오늘에야 제 잘못', 'hall'], ['평안한 대답', 'hall-joseph'], ['총리로 세운다', 'ruler']];
const AFTER = [['채색옷을 벗기고', 'pit'], ['구덩이 바닥', 'pit-down'], ['은 이십', 'sold'], ['왕의 죄수를 가두는', 'prison-in'], ['간수장이', 'prison'], ['떡 굽는', 'dreams'], ['오늘에야 제 잘못', 'hall'], ['수염을 깎고', 'shave'], ['평안한 대답', 'hall-joseph'], ['대전 안에', 'visions'], ['인장 반지', 'ring'], ['버금 수레', 'chariot']];
const tag = process.env.TAG ?? 'after';
const SHOTS = tag === 'before' ? BEFORE : AFTER;
export default async (t) => {
  // 서버가 바쁠 때 첫 화면 메뉴가 늦게 뜨면 boot가 실패한다: 몇 번 다시 시도한다
  for (let k = 0; k < 4; k++) { try { await boot(t, { ...SAVE, xp: 3000 }); break; } catch (e) { console.log('boot retry', e.message); await t.wait(2000); } }
  await t.ev(`globalThis.__stuck = []; __dev.run('joseph'); 1`);
  await t.wait(4000);
  for (const [frag, name] of SHOTS) {
    await t.ev(`__dev.pauseAt = ${JSON.stringify(frag)}; __dev.auto = true; 1`);
    let ok = false;
    for (let k = 0; k < 600; k++) { await t.wait(200); if (!(await t.ev(`__dev.auto`))) { ok = true; break; } }
    if (!ok) { console.log('miss', name); continue; }
    await t.wait(2600);
    await t.shot(`${tag}-${name}`);
  }
  await t.ev(`__dev.pauseAt = null; __dev.auto = true; 1`);
  let clear = false;
  for (let k = 0; k < 900 && !clear; k++) { await t.wait(200); clear = await t.ev(`__dev.state.claimed.includes('joseph/clear')`); }
  console.log('clear', clear, 'errs', await t.ev(`JSON.stringify(window.__e)`), 'stuck', await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`));
};
