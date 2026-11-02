import { boot, SAVE } from './_save.mjs';
export default async (t) => {
  await boot(t, { ...SAVE, claimed: [...SAVE.claimed, 'babel/clear'], codex: { 'person/builder': 'babel', 'place/shinar': 'babel', 'place/babel': 'babel', 'person/adam': 'eden', 'creature/lion': 'eden' } });
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { tab: 'codex', stage: 'babel' }); return 1; })`);
  await t.wait(900);
  await t.shot('s25-codex');
  await t.ev(`document.querySelector('.codex__cell[data-state="met"]')?.click(); 1`);
  await t.wait(500);
  await t.shot('s25-detail');
  console.log(await t.ev(`JSON.stringify(__e)`));
};
