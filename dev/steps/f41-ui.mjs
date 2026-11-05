import { boot, SAVE } from './_save.mjs';
// 피드백 4차 F41~F45: 인벤토리 도구·꾸미기 안내와 칸 정렬, 상태 창 닮은 인물, 도감 설명 패널
const save = { ...SAVE, xp: 900, talents: 200, items: { tools: ['jar', 'lamp'], looks: [] },
  codex: { 'person/adam': 'eden', 'person/eve': 'eden', 'creature/lion': 'eden', 'creature/bird': 'eden', 'creature/sheep': 'eden', 'item/fig-leaf': 'eden', 'person/cain': 'cain', 'person/abel': 'cain' },
  spirit: { joy: 30, faith: 40, patience: 10 } };
export default async (t) => {
  await boot(t, save);
  const open = (opts) => t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, ${opts}); return 1; })`);
  const chip = (name) => t.ev(`[...document.querySelectorAll('#menuBody .chip')].find(b => b.textContent === '${name}').click(); 1`);
  await open(`{ tab: 'status', onHold: () => {} }`); await t.wait(800);
  await t.ev(`document.querySelector('.likeness')?.scrollIntoView(); 1`); await t.wait(300);
  await t.shot('status');
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(600);
  await open(`{ tab: 'inventory', onHold: () => {} }`); await t.wait(800);
  await t.shot('inv-tool');
  await t.ev(`document.querySelector('#menuBody .slot[data-state=owned]')?.click(); 1`); await t.wait(400);
  await t.shot('inv-tool-pick');
  await chip('꾸미기'); await t.wait(500);
  await t.shot('inv-look');
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(600);
  await open(`{ tab: 'codex', onHold: () => {} }`); await t.wait(800);
  await t.shot('codex');
  await t.ev(`document.querySelector('#menuBody .codex__cell[data-state=met]')?.click(); 1`); await t.wait(400);
  await t.shot('codex-pick');
  await chip('피조물'); await t.wait(400);
  await t.ev(`document.querySelectorAll('#menuBody .codex__cell')[7]?.click(); 1`); await t.wait(400);
  await t.shot('codex-pick2');
  // 칸 안 그림의 가운데와 칸 가운데의 차이(px): 인벤토리·상점
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(600);
  await open(`{ tab: 'inventory', onHold: () => {} }`); await t.wait(700);
  await chip('꾸미기'); await t.wait(500);
  const off = await t.ev(`JSON.stringify([...document.querySelectorAll('#menuBody .slot')].slice(0, 4).map(s => { const a = s.getBoundingClientRect(), i = s.querySelector('.slot__icon').getBoundingClientRect(), n = s.querySelector('.slot__name').getBoundingClientRect(); return [Math.round((i.top + n.bottom) / 2 - (a.top + a.bottom - 4) / 2), Math.round((i.left + i.right) / 2 - (a.left + a.right) / 2)]; }))`);
  console.log('slot offset [dy, dx]', off);
  console.log('errs', await t.ev(`JSON.stringify(window.__e)`));
};
