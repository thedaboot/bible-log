import { boot, SAVE } from './_save.mjs';
// 도감 카드(F02 그림)와 도감 칸 그림
export default async (t) => {
  await boot(t, { ...SAVE, codex: { 'person/adam': 'eden', 'person/eve': 'eden', 'creature/lion': 'eden', 'creature/bird': 'eden', 'creature/serpent': 'eden', 'place/eden': 'eden' } });
  await t.ev(`Promise.all([import('/src/ui.js'), import('/src/codex-art.js')]).then(([u, a]) => { u.showCard({ title: '공중의 새', text: '아담이 이름을 지어 준 하늘의 새', ref: '창 2:20', count: '7 / 7', pic: a.CODEX_ART['creature/bird'] }); return 1; })`);
  await t.wait(600);
  await t.shot('card');
  await t.wait(3000);
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { tab: 'codex', stage: 'eden' }); return 1; })`);
  await t.wait(900);
  await t.ev(`document.querySelector('.codex__cell[data-state="met"]')?.click(); 1`);
  await t.wait(500);
  await t.shot('codex-eden');
  await t.ev(`document.querySelectorAll('.codex__cats .chip, .codex__tabs .chip')[1]?.click(); 1`);
  await t.wait(500);
  await t.shot('codex-eden-creature');
};
