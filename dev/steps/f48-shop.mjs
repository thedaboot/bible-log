import { boot, SAVE } from './_save.mjs';
// 피드백 4차 F48~F54: 착용 중 꼬리표, 상점 문구·정렬·모자람 문구, 아래 칸을 눌렀을 때 스크롤이 위로 돌아가는지
const save = { ...SAVE, xp: 900, talents: 100, items: { tools: [], looks: [] },
  earthLook: { ...SAVE.earthLook, item: 'staff', waist: 'bag', head: 'hood' } };
export default async (t) => {
  await boot(t, save);
  const open = (opts) => t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, ${opts}); return 1; })`);
  await open(`{ tab: 'inventory', onHold: () => {} }`); await t.wait(800);
  await t.ev(`[...document.querySelectorAll('#menuBody .chip')].find(b => b.textContent === '꾸미기').click(); 1`); await t.wait(500);
  await t.ev(`document.querySelector('#menuBody .slot[data-held]')?.click(); 1`); await t.wait(400);
  await t.shot('inv-worn');
  // 아래쪽 칸 누르기: 스크롤 값이 그대로인지
  const sc = (sel) => t.ev(`(() => { const g = [...document.querySelectorAll('#menuBody .slots, .menu-panel')].find(e => e.scrollHeight > e.clientHeight + 4); if (!g) return 'no-scroll'; g.scrollTop = g.scrollHeight; const before = g.scrollTop; const s = [...document.querySelectorAll('#menuBody .slot')]; s[s.length - 2].click(); return new Promise(r => setTimeout(() => { const g2 = [...document.querySelectorAll('#menuBody .slots, .menu-panel')].find(e => e.scrollHeight > e.clientHeight + 4); r(before + ' -> ' + (g2 ? g2.scrollTop : 'none')); }, 400)); })()`);
  console.log('inv scroll', await sc());
  await t.shot('inv-bottom-pick');
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(600);
  await open(`{ only: 'shop', onBuy: () => false }`); await t.wait(800);
  await t.shot('shop');
  console.log('shop scroll', await sc());
  await t.shot('shop-bottom-pick');
  const off = await t.ev(`JSON.stringify([...document.querySelectorAll('#menuBody .slot')].slice(0, 3).map(s => { const a = s.getBoundingClientRect(), i = s.querySelector('.slot__icon').getBoundingClientRect(), n = s.lastElementChild.getBoundingClientRect(); return [Math.round((i.top + n.bottom) / 2 - (a.top + a.bottom - 4) / 2), Math.round((i.left + i.right) / 2 - (a.left + a.right) / 2)]; }))`);
  console.log('shop slot offset [dy, dx]', off, 'errs', await t.ev(`JSON.stringify(window.__e)`));
};
