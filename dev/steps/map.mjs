import { boot, SAVE } from './_save.mjs';
export default async (t) => {
  await boot(t, { ...SAVE, scene: 'noah', unlocked: [...SAVE.unlocked, 'noah', 'enoch', 'babel'], claimed: [...SAVE.claimed, 'noah/clear'], codex: { 'person/noah': 'noah', 'animal/dove': 'noah' } });
  await t.ev(`import('/src/map.js').then(m => { m.openMap(__dev.state).then(v => window.__mapv = v); return 1; })`);
  await t.wait(1200);
  await t.shot('s10-map');
  await t.ev(`document.getElementById('mapClose').click(); 1`);
  await t.wait(600);
  console.log('map closed', await t.ev(`String(window.__mapv) + ' ' + document.getElementById('mapBox').hidden`));
  // 스테이지 끝 마침 창: 에녹을 자동으로 끝까지
  await t.ev(`Object.assign(__dev, { speed: 8, auto: true }); __dev.run('enoch'); 1`);
  for (let k = 0; k < 120; k++) { await t.wait(500); if (await t.ev(`!document.getElementById('clearBox').hidden`)) break; }
  await t.ev(`__dev.auto = false; 1`);
  await t.wait(800);
  await t.shot('s29-clear');
  console.log(await t.ev(`JSON.stringify({e: __e, next: document.getElementById('clearNextTitle').textContent})`));
  await t.ev(`document.getElementById('clearGo').click(); 1`);
  await t.wait(6000);
  console.log(await t.ev(`JSON.stringify({scene: __dev.state.scene, e: __e})`));
};
