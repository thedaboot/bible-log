import { boot, SAVE } from './_save.mjs';
// F27: 휴대폰 인벤토리 꾸미기 스크롤(맨 아래까지)과 잠긴 칸 설명, F36·F37 상점
export default async (t) => {
  await boot(t, { ...SAVE, xp: 900, talents: 200 });
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { tab: 'inventory', onHold: () => {} }); return 1; })`);
  await t.wait(800);
  await t.ev(`[...document.querySelectorAll('#menuBody .chip')].find(b => b.textContent === '꾸미기').click(); 1`);
  await t.wait(500);
  await t.ev(`document.querySelector('#menuBody .slot[data-state=locked]')?.click(); 1`); await t.wait(400);
  await t.shot('inv-locked');
  await t.ev(`(() => { const g = document.querySelector('#menuBody .slots'); g.scrollTop = g.scrollHeight; return g.scrollHeight + '/' + g.clientHeight; })()`).then((v) => console.log('scroll', v));
  await t.wait(400);
  await t.shot('inv-bottom');
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(600);
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { only: 'shop', onBuy: () => false }); return 1; })`);
  await t.wait(900);
  await t.ev(`document.querySelectorAll('#menuBody .slot')[1]?.click(); 1`); await t.wait(500);
  await t.shot('shop-pick');
};
