import { boot, SAVE } from './_save.mjs';
// U1: F24 길게 누르기(글자 선택·메뉴 막힘), F26 메뉴 '쉼터로 나가기' → 확인 창 → 쉼터, 그 뒤 지도에 이어하기(F56)
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
  await t.ev(`__dev.run('abram'); __dev.auto = true; 1`);
  for (let k = 0; k < 300; k++) { await t.wait(300); const r = await t.ev(`JSON.stringify([__dev.mode, __dev.state.resume && __dev.state.resume.n])`); const [m, n] = JSON.parse(r); if (m === 'walk' && n >= 3) break; }
  await t.ev(`__dev.auto = false; 1`); await t.wait(500);
  const before = await t.ev(`JSON.stringify({ xp: __dev.state.xp, res: __dev.state.resume, claimed: __dev.state.claimed.filter(c => c.startsWith('abram/')) })`);
  await t.ev(`document.getElementById('menuBtn').click(); 1`); await t.wait(800);
  await t.ev(`document.querySelector('.menu-panel__quit').click(); 1`); await t.wait(900);
  await t.shot('f26-confirm');
  const text = await t.ev(`document.getElementById('quitText').textContent`);
  await t.ev(`document.getElementById('quitYes').click(); 1`); await t.wait(3500);
  const after = await t.ev(`JSON.stringify({ xp: __dev.state.xp, res: __dev.state.resume, claimed: __dev.state.claimed.filter(c => c.startsWith('abram/')), heaven: __dev.heaven.group.visible })`);
  await t.ev(`import('/src/map.js').then(m => { m.openMap(__dev.state); return 1; })`); await t.wait(1200);
  const buttons = await t.ev(`[...document.querySelectorAll('.map__point')].map(b=>b.textContent).join(',')`);
  await t.shot('f26-map');
  console.log('F26 text', JSON.stringify(text));
  console.log('F26 before', before);
  console.log('F26 after ', after, 'map', buttons, 'errs', await t.ev(`JSON.stringify(window.__e)`));
};
