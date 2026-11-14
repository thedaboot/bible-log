import { boot, SAVE } from './_save.mjs';
// 전면 개편(2026-11-13) 기준 화면: 쉼터·메뉴·상점·지도·우물가 대사와 도전을 한 번에 찍는다.
// TAG=before|after 로 파일 이름을 가른다. BASE는 워커 서버(5181).
const TAG = process.env.TAG ?? 'after';
export const RICH = { ...SAVE, scene: 'moriah', xp: 1400, talents: 640,
  unlocked: [...SAVE.unlocked, 'noah', 'enoch', 'babel', 'abram', 'hagar', 'mamre', 'moriah', 'rebekah'],
  claimed: [...SAVE.claimed, 'noah/clear', 'enoch/clear', 'babel/clear', 'abram/clear', 'hagar/clear', 'mamre/clear', 'moriah/clear'],
  codex: { 'person/noah': 'noah', 'animal/dove': 'noah', 'person/abel': 'cain', 'person/adam': 'eden' },
  spirit: { joy: 12, faith: 26, patience: 30, love: 8, peace: 14, kindness: 6 },
  items: { tools: ['jar'], looks: ['staff', 'bag'] } };
export default async (t) => {
  await boot(t, RICH);
  await t.shot(`${TAG}-01-shelter`);
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, {}); return 1; })`);
  await t.wait(900); await t.shot(`${TAG}-02-menu-status`);
  for (const [i, n] of [[1, 'inv'], [2, 'codex']]) {
    await t.ev(`document.querySelectorAll('#menuTabs [role=tab]')[${i}]?.click(); 1`); await t.wait(700); await t.shot(`${TAG}-03-menu-${n}`);
  }
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(400);
  await t.ev(`import('/src/menu.js').then(m => { m.openMenu(__dev.state, { only: 'shop', onBuy: () => false }); return 1; })`);
  await t.wait(900); await t.shot(`${TAG}-04-shop`);
  await t.ev(`document.querySelectorAll('#menuBody .slot, #menuBody .ware')[1]?.click(); 1`); await t.wait(500); await t.shot(`${TAG}-05-shop-pick`);
  await t.ev(`document.getElementById('menuClose').click(); 1`); await t.wait(400);
  await t.ev(`import('/src/map.js').then(m => { m.openMap(__dev.state).then(v => window.__mapv = v); return 1; })`);
  await t.wait(1200); await t.shot(`${TAG}-06-map`);
  await t.ev(`document.getElementById('mapClose').click(); 1`); await t.wait(600);
  // 우물가: 첫 대사, 걷기, 도전
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true, pauseAt: '${process.env.PAUSE ?? '낙타'}' }); __dev.run('rebekah'); 1`);
  for (let k = 0; k < 120; k++) { await t.wait(500); if (!(await t.ev(`__dev.auto`))) break; }
  await t.wait(600); await t.shot(`${TAG}-07-rebekah-dialog`);
  await t.ev(`Object.assign(__dev, { auto: true }); 1`);
  for (let k = 0; k < 160; k++) { await t.wait(500); if (await t.ev(`!document.getElementById('challenge').hidden`)) break; }
  await t.ev(`__dev.auto = false; 1`); await t.wait(700); await t.shot(`${TAG}-08-rebekah-challenge`);
  console.log(await t.ev(`JSON.stringify({ e: __e, mode: __dev.mode, quest: document.getElementById('questTitle').textContent })`));
};
