import { boot, SAVE } from './_save.mjs';
// 인벤토리 꾸미기, 상점, 지상 꾸미기(소품 탭·머리 탭)
export default async (t) => {
  await boot(t, { ...SAVE, xp: 900, talents: 200, claimed: [...SAVE.claimed, 'noah/clear', 'eden/clear', 'hagar/clear'], earthLook: { ...SAVE.earthLook, item: 'hood' } });
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { tab: 'inventory', onHold: () => {} }); return 1; })`);
  await t.wait(800);
  await t.ev(`[...document.querySelectorAll('#menuBody .chip')].find(b => b.textContent === '꾸미기').click(); 1`);
  await t.wait(500);
  await t.shot('s08-inv');
  await t.ev(`document.getElementById('menuClose').click(); 1`);
  await t.wait(500);
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { only: 'shop', onBuy: () => false }); return 1; })`);
  await t.wait(800);
  await t.shot('s08-shop');
  await t.ev(`document.getElementById('menuClose').click(); 1`);
  await t.wait(500);
  // 지상 꾸미기: 스테이지 시작 전 꾸미기 방(지상 모습을 지운 저장값으로)
  await t.ev(`__dev.state.earthLook = null; __dev.run('babel'); 1`);
  await t.wait(4000);
  await t.shot('s11-body');
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[1].click(); 1`); await t.wait(500);
  await t.shot('s11-hair');
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[3].click(); 1`); await t.wait(500);
  await t.shot('s11-props');
  console.log(await t.ev(`JSON.stringify(__e)`));
};
