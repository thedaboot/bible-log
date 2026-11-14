import { boot, SAVE } from './_save.mjs';
import assert from 'node:assert/strict';
// U1: F24 길게 누르기(글자 선택·메뉴 막힘), F26 멈춤 '쉼터로 나가기' → 펼친 확인 → 쉼터, 그 뒤 지도에 이어하기(F56)
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  // F24: 본문 글자 선택과 contextmenu가 막히는지
  const f24 = await t.ev(`(() => { const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.getElementById('hud').dispatchEvent(ev);
    const sel = getComputedStyle(document.body).userSelect || getComputedStyle(document.body).webkitUserSelect;
    const callout = getComputedStyle(document.body).webkitTouchCallout;
    window.getSelection().selectAllChildren(document.body); const txt = window.getSelection().toString().length;
    return JSON.stringify({ contextBlocked: ev.defaultPrevented, userSelect: sel, callout, selectedChars: txt }); })()`);
  console.log('F24', f24);
  // 길게 누르기 흉내(터치 700ms) 뒤 화면
  const x = t.W / 2, y = t.H * 0.5;
  await t.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await t.wait(900);
  await t.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await t.shot('f24-longpress');
  // F26: 스테이지에 들어가 걷기가 되면 메뉴 → 쉼터로 나가기 → 확인
  await t.ev(`__dev.run('abram'); __dev.auto = true; __dev.speed = 4; 1`);
  let paused = false;
  for (let k = 0; k < 300 && !paused; k++) {
    await t.wait(300);
    paused = await t.ev(`(() => { const r = __dev.state.resume; if (__dev.mode !== 'walk' || r?.id !== 'abram' || !(r.n >= 3)) return false; __dev.auto = false; document.getElementById('pauseBtn').click(); return !document.getElementById('pauseBox').hidden; })()`);
  }
  assert.ok(paused, '스테이지 중 멈춤 화면이 열리지 않음');
  const before = await t.ev(`JSON.stringify({ xp: __dev.state.xp, res: __dev.state.resume, claimed: __dev.state.claimed.filter(c => c.startsWith('abram/')) })`);
  // 2026-11-14 새 UI: '쉼터로 나가기'는 기록장이 아니라 멈춤 화면에 있고, 확인은 같은 줄에서 펼쳐진다(창을 더 띄우지 않는다)
  await t.ev(`document.getElementById('pauseQuit').click(); 1`); await t.wait(600);
  assert.equal(await t.ev(`document.getElementById('pauseSure').hidden`), false, '나가기 확인이 펼쳐지지 않음');
  await t.shot('f26-confirm');
  const text = await t.ev(`document.getElementById('quitText').textContent`);
  await t.ev(`document.getElementById('quitYes').click(); 1`); await t.wait(3500);
  const after = await t.ev(`JSON.stringify({ xp: __dev.state.xp, res: __dev.state.resume, claimed: __dev.state.claimed.filter(c => c.startsWith('abram/')), heaven: __dev.heaven.group.visible })`);
  const previous = JSON.parse(before), current = JSON.parse(after);
  assert.equal(current.heaven, true, '나가기 뒤 쉼터로 돌아오지 않음');
  assert.equal(await t.ev(`__dev.mode`), 'walk');
  assert.equal(current.xp, previous.xp);
  assert.deepEqual(current.claimed, previous.claimed);
  assert.equal(current.res.id, previous.res.id);
  assert.equal(current.res.n, previous.res.n);
  await t.ev(`import('/src/map.js').then(m => { m.openMap(__dev.state); return 1; })`); await t.wait(1200);
  const buttons = await t.ev(`[...document.querySelectorAll('.map__point')].map(b=>b.textContent).join(',')`);
  assert.ok(buttons.includes('이어하기') && buttons.includes('처음부터'), '중간에 나온 스테이지 지도에 이어하기와 처음부터가 없음');
  await t.shot('f26-map');
  console.log('F26 text', JSON.stringify(text));
  console.log('F26 before', before);
  console.log('F26 after ', after, 'map', buttons, 'errs', await t.ev(`JSON.stringify(window.__e)`));
};
