import { boot, SAVE } from './_save.mjs';
// 낮은 가로 화면 메뉴: 도감(고른 항목), 인벤토리 꾸미기, 상점, 상태
export default async (t) => {
  const codex = { 'person/builder': 'babel', 'place/shinar': 'babel', 'place/babel': 'babel', 'person/adam': 'eden', 'person/eve': 'eden', 'creature/lion': 'eden', 'creature/bird': 'eden', 'place/eden': 'eden' };
  await boot(t, { ...SAVE, xp: 900, talents: 200, codex, claimed: [...SAVE.claimed, 'noah/clear', 'babel/clear'] });
  const open = async (opts, name, pick) => {
    await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, ${opts}); return 1; })`);
    await t.wait(900);
    if (pick) { await t.ev(pick); await t.wait(500); }
    await t.shot(name);
    await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(600);
  };
  await open(`{ tab: 'status' }`, 'm-status');
  await open(`{ tab: 'codex', stage: 'eden' }`, 'm-codex', `document.querySelector('.codex__cell[data-state="met"]')?.click(); 1`);
  await open(`{ tab: 'inventory', onHold: () => {} }`, 'm-inv', `[...document.querySelectorAll('#menuBody .chip')].find(b => b.textContent === '꾸미기').click(); setTimeout(() => document.querySelectorAll('#menuBody .slot')[2]?.click(), 300); 1`);
  await open(`{ only: 'shop', onBuy: () => false }`, 'm-shop', `document.querySelectorAll('#menuBody .slot')[4]?.click(); 1`);
  await open(`{ only: 'codex', stage: 'eden' }`, 'm-codexonly');
};
