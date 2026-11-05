import { boot, SAVE } from './_save.mjs';
import { playOnce } from './_games.mjs';
// F58: 놀이 다섯 가지를 실제 키 입력으로 끝까지(사람이 보고 조절하는 것처럼). 1-5 들판에서 관찰자 발밑에 도전을 하나씩 깐다.
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.run('babel'); __dev.auto = true; 1`);
  for (let k = 0; k < 200 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(300);
  await t.ev(`__dev.auto = false; window.__done = {}; 1`);
  const out = {};
  for (const kind of (process.env.KINDS ?? 'mash,trace,sequence,balance,catch').split(',')) {
    await t.ev(`(() => { const p = __dev.player.position.clone(); __dev.challenge({ title: '시험', verb: '시험', hits: 2, kind: '${kind}', radius: 3, spots: [{ pos: p, text: '시험' }], symbols: ['암소', '이삭', '나일', '동풍'] }).then(() => { __done['${kind}'] = 1; }); return 1; })()`);
    await t.wait(800);
    const t0 = Date.now();
    let wins = 0;
    for (let r = 0; r < 4 && !(await t.ev(`!!__done['${kind}']`)); r++) { if (await playOnce(t, kind)) wins++; await t.wait(1500); }
    if (kind === 'catch' || kind === 'balance') await t.shot(`play-${kind}`);
    out[kind] = { done: await t.ev(`!!__done['${kind}']`), wins, sec: Math.round((Date.now() - t0) / 1000) };
    if (!out[kind].done) await t.ev(`__dev.stop(); 1`);
    console.log(kind, JSON.stringify(out[kind]));
  }
  console.log('errs', await t.ev(`JSON.stringify(window.__e)`));
};
