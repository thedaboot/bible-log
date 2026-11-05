import { boot, SAVE } from './_save.mjs';
// F58 놀이 다섯 가지: 1-5 들판에서 관찰자 발밑에 도전을 하나씩 깔고 실제 키 입력으로 끝까지 해 본다(받기·균형은 화면과 실패 반응까지).
const VK = { Space: 32, ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40 };
export default async (t) => {
  const key = async (code, type) => {
    const vk = VK[code] ?? (code.startsWith('Digit') ? 48 + Number(code[5]) : 0);
    await t.send('Input.dispatchKeyEvent', { type, code, key: code === 'Space' ? ' ' : code, windowsVirtualKeyCode: vk, text: type === 'keyDown' && code === 'Space' ? ' ' : undefined });
  };
  const press = async (code, ms = 60) => { await key(code, 'keyDown'); await key(code, 'keyUp'); await t.wait(ms); };
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.run('babel'); __dev.auto = true; 1`);
  for (let k = 0; k < 200 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(300);
  await t.ev(`__dev.auto = false; window.__done = {}; 1`);
  const run = (kind, extra = '') => t.ev(`(() => { const p = __dev.player.position.clone(); __dev.challenge({ title: '시험 ${kind}', verb: '시험', hits: 1, kind: '${kind}', radius: 3, spots: [{ pos: p, text: '시험' }] ${extra} }).then(() => { __done['${kind}'] = 1; }); return 1; })()`);
  const done = (kind) => t.ev(`!!__done['${kind}']`);
  const results = {};
  for (const kind of ['mash', 'trace', 'sequence', 'balance', 'catch']) {
    await t.ev(`__dev.speed = ${kind === 'sequence' ? 0.4 : 1}; 1`);
    await run(kind, kind === 'sequence' ? ", symbols: ['암소', '이삭', '바로', '해']" : '');
    if (kind !== 'sequence') { await t.wait(900); await t.shot(`game-${kind}`); }
    if (kind === 'mash') for (let i = 0; i < 40 && !(await done(kind)); i++) await press('Space', 40);
    if (kind === 'trace') {
      const pts = await t.ev(`document.querySelector('#chPad .pad__guide').getAttribute('points')`);
      const P = pts.split(' ').map((s) => s.split(',').map(Number));
      for (let i = 1; i < P.length; i++) {
        const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1];
        await press(dx > 0 ? 'ArrowRight' : dy < 0 ? 'ArrowUp' : 'ArrowDown', 120);
        if (i === 2) await t.shot('game-trace-mid');
      }
    }
    if (kind === 'sequence') {
      const order = [];
      let last = -1;
      for (let i = 0; i < 400; i++) {
        const lit = await t.ev(`(() => { const g = document.querySelector('#chPad .pad__key.is-lit'); return g ? Number(g.dataset.i) : -1; })()`);
        if (lit >= 0 && lit !== last) order.push(lit);
        last = lit;
        if (await t.ev(`document.getElementById('chLabel').textContent.includes('순서 0')`)) break;
        await t.wait(25);
      }
      results.seqOrder = order.join('');
      await t.shot('game-sequence');
      await t.ev(`__dev.speed = 1; 1`);
      for (const i of order) await press(`Digit${i + 1}`, 150);
    }
    if (kind === 'balance') {
      // 1초 누르고 떼 놓기만: 실패 반응(기울어졌어요 등)이 오는지
      await key('Space', 'keyDown'); await t.wait(700); await t.shot('game-balance-hold'); await key('Space', 'keyUp');
      for (let i = 0; i < 30; i++) { await t.wait(200); const l = await t.ev(`document.getElementById('chLabel').textContent`); if (/기울|밀었/.test(l)) { results.balanceMiss = l; break; } }
    }
    if (kind === 'catch') { await t.wait(2500); await t.shot('game-catch-play'); results.catchLabel = await t.ev(`document.getElementById('chLabel').textContent`); }
    await t.wait(500);
    results[kind] = await done(kind);
    // 끝나지 않은 놀이는 걷기를 멈춰 정리한다
    if (!results[kind]) await t.ev(`__dev.stop(); 1`);
  }
  console.log(JSON.stringify(results), await t.ev(`JSON.stringify(window.__e)`));
};
