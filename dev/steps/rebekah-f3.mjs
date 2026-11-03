import { boot } from './_save.mjs';
// 1-9 리브가 낙타 물 주기(2026-11-03 사용자 "물동이는 뭐고 물 채우는 건 뭔데"): 긷기·붓기·다 찬 구유를 찍는다.
// PHASE=before: 고치기 전(물구유 곁, F 뒤). 그 밖: 구유마다 우물에서 긷고(머무르기) Space를 눌렀다 떼서 붓는다(키보드만).
const q = (s) => `document.getElementById(${JSON.stringify(s)})`;
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('rebekah'); 1`);
  // 도전(또는 첫 긷기)이 시작될 때까지 자동으로 넘긴다
  for (let k = 0; k < 600; k++) {
    if (await t.ev(`!${q('quest')}.hidden && /구유|낙타 물/.test(${q('questTitle')}.textContent) && __dev.mode === 'walk'`)) break;
    await t.wait(150);
  }
  await t.ev(`__dev.auto = false; __dev.speed = 1; 1`);
  if (process.env.PHASE === 'before') {
    await t.ev(`__dev.goNext(); 1`);
    await t.wait(1200);
    await t.shot('before-trough');
    await t.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' })); 1`);
    await t.wait(2500);
    await t.ev(`__dev.field.camels[0].water.scale.x = 0.5; 1`);
    await t.shot('before-tool');
    return;
  }
  const names = ['a', 'b', 'c'];
  for (let i = 0; i < 3; i++) {
    // 긷기: 우물 곁으로 옮기고 머무른다
    await t.ev(`__dev.goNext(); 1`);
    await t.wait(500);
    await t.shot(`${names[i]}1-draw`);
    for (let k = 0; k < 60 && !(await t.ev(`!${q('challenge')}.hidden || /붓기/.test(${q('questItems')}.textContent)`)); k++) await t.wait(100);
    await t.wait(400);
    // 붓기: 구유 곁으로 옮기고 Space를 꾹 눌렀다가 금빛에서 뗀다
    await t.ev(`__dev.goNext(); 1`);
    for (let k = 0; k < 40 && (await t.ev(`${q('challenge')}.hidden`)); k++) await t.wait(100);
    await t.wait(300);
    if (i === 0) await t.shot(`${names[i]}2-ready`);
    // 페이지 안에서 표시가 금빛 구간 가운데쯤 오면 뗀다(밖에서 재면 늦다). 떼기 전 한 번 찍으려고 구간 앞에서 잠깐 멈춘 듯 찍는다
    await t.ev(`(() => { const tr = document.getElementById('chTrack'), mk = document.getElementById('chMark'), s = document.getElementById('chZone').style.transform;
      const z0 = +s.match(/translateX\\(([\\d.]+)%/)[1] / 100, w = +s.match(/scaleX\\(([\\d.]+)/)[1];
      window.__pour = 'hold'; dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      const id = setInterval(() => { const m = (parseFloat(mk.style.transform.slice(11)) || 0) / tr.clientWidth;
        if (m >= z0 + w * 0.3) { clearInterval(id); window.__pour = 'up'; dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); } }, 4); })(); 1`);
    if (i === 0) { await t.ev(`__dev.speed = 0.25; 1`); await t.wait(1400); await t.shot(`${names[i]}3-pour`); }
    for (let k = 0; k < 100 && (await t.ev(`window.__pour`)) !== 'up'; k++) await t.wait(20);
    await t.ev(`__dev.speed = 1; 1`);
    await t.wait(1800);
    await t.shot(`${names[i]}4-filled`);
    // 대사(창 24:20)가 나오면 넘긴다
    for (let k = 0; k < 30; k++) { if (await t.ev(`!${q('dialog')}.hidden`)) { await t.ev(`${q('dialog')}.click(); 1`); await t.wait(200); } else if (await t.ev(`__dev.mode === 'walk'`)) break; else await t.wait(150); }
  }
  await t.wait(800);
  await t.shot('d-all');
  console.log('by-keyboard', await t.ev(`JSON.stringify(__dev.state.claimed.filter((c) => c.startsWith('rebekah/water')))`));
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); 1`);
  for (let k = 0; k < 400; k++) { await t.wait(500); if (await t.ev(`!${q('clearBox')}.hidden`)) break; }
  console.log('clear', await t.ev(`!${q('clearBox')}.hidden`), 'claimed', await t.ev(`JSON.stringify(__dev.state.claimed.filter((c) => c.startsWith('rebekah')))`),
    'tools', await t.ev(`JSON.stringify(__dev.state.items.tools)`), 'stuck', await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`), 'errors', await t.ev(`JSON.stringify(__e)`));
};
