import { boot, SAVE } from './_save.mjs';
import { keys } from './_games.mjs';
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.run('babel'); __dev.auto = true; 1`);
  for (let k = 0; k < 200 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(300);
  await t.ev(`__dev.auto = false; (() => { const p = __dev.player.position.clone(); __dev.challenge({ title: '시험', verb: '시험', hits: 2, kind: '${process.env.K ?? 'time'}', radius: 3, spots: [{ pos: p, text: '시험' }] }); })(); 1`);
  await t.wait(1000);
  const { press } = keys(t);
  await t.ev(`__dev.speed = 0.25; 1`);
  const { playOnce } = await import('./_games.mjs');
  for (let i = 0; i < 3; i++) { const r = await playOnce(t, process.env.K ?? 'time'); console.log('play', r, await t.ev(`document.getElementById('challenge').dataset.done + ' ' + document.getElementById('chLabel').textContent + ' hidden=' + document.getElementById('challenge').hidden`)); }
  for (let i = 0; i < 0; i++) {
    const s = await t.ev(`(() => { const tr = document.getElementById('chTrack').clientWidth; const m = parseFloat(document.getElementById('chMark').style.transform.slice(11)) / tr; const zs = document.getElementById('chZone').style.transform; return JSON.stringify({ m: m.toFixed(3), zs, label: document.getElementById('chLabel').textContent, done: document.getElementById('challenge').dataset.done, hidden: document.getElementById('challenge').hidden }); })()`);
    if (i % 8 === 0) console.log(s);
    await press('Space', 300);
  }
};
