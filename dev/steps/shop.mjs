import { boot, SAVE } from './_save.mjs';
// 상점: 고르기 전과 고른 뒤(F36 정렬, F37 값 표기)
export default async (t) => {
  await boot(t, { ...SAVE, xp: 900, talents: 200 });
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { only: 'shop', onBuy: () => false }); return 1; })`);
  await t.wait(900);
  await t.shot('shop');
  await t.ev(`document.querySelectorAll('#menuBody .slot')[1]?.click(); 1`); await t.wait(500);
  await t.shot('shop-pick');
};
