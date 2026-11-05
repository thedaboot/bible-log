// 도전 놀이를 실제 키 입력으로 한 판 해내는 도우미(F58). r3-stages.mjs·f58-games.mjs가 쓴다.
// playOnce(t, kind): 지금 떠 있는 도전 패널에서 한 번 성공할 때까지(또는 시간 초과) 키를 누른다. 성공하면 true.
const VK = { Space: 32, ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40 };
export function keys(t) {
  const send = (code, type) => {
    const vk = VK[code] ?? (code.startsWith('Digit') ? 48 + Number(code[5]) : code.startsWith('Key') ? code.charCodeAt(3) : 0);
    const key = code === 'Space' ? ' ' : code.startsWith('Digit') ? code[5] : code;
    const text = type === 'keyDown' && (code === 'Space' || code.startsWith('Digit')) ? key : undefined;
    return t.send('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode: vk, text });
  };
  const press = async (code, ms = 60) => { await send(code, 'keyDown'); await send(code, 'keyUp'); await t.wait(ms); };
  return { send, press };
}
// 막대의 표시 자리(0~1)와 금빛 구간
const BAR = `(() => { const tr = document.getElementById('chTrack').clientWidth || 1; const m = (parseFloat(document.getElementById('chMark').style.transform.slice(11)) || 0) / tr;
  const zs = document.getElementById('chZone').style.transform; const a = parseFloat(zs.split('translateX(')[1]) / 100, w = parseFloat(zs.split('scaleX(')[1]);
  return JSON.stringify({ m, a, b: a + w, label: document.getElementById('chLabel').textContent, hidden: document.getElementById('challenge').hidden }); })()`;
const bar = async (t) => JSON.parse(await t.ev(BAR));
// 도전 패널의 성공 수("verb n / hits")가 오르면 성공
const count = async (t) => Number(await t.ev(`document.getElementById('challenge').dataset.done ?? 0`)) || 0;

// 헤드리스 크롬은 초당 2프레임 안팎이라 표시가 한 프레임에 크게 건너뛴다. 순간을 맞히는 놀이는 게임 시간을 늦춰서 한다(사람 손의 실제 기기 속도에 가깝게)
const SLOW = { time: 0.25, rhythm: 0.25, hold: 0.4, sequence: 0.25 };
export async function playOnce(t, kind) {
  const prev = await t.ev(`__dev.speed ?? 1`);
  await t.ev(`__dev.speed = ${SLOW[kind] ?? 1}; 1`);
  try { return await playInner(t, kind); } finally { await t.ev(`__dev.speed = ${prev}; 1`); }
}
async function playInner(t, kind) {
  const { send, press } = keys(t);
  // 도전 자리에 막 닿은 순간에는 패널이 아직 숨어 있다. 뜰 때까지 기다린다(숨은 것을 '끝남'으로 읽지 않게)
  for (let i = 0; i < 60 && (await bar(t)).hidden; i++) await t.wait(50);
  const before = await count(t);
  const won = async () => (await bar(t)).hidden || (await count(t)) > before;
  if (kind === 'mash') {
    for (let i = 0; i < 80; i++) { await press('Space', 30); if (await won()) return true; }
    return false;
  }
  if (kind === 'trace') {
    const pts = (await t.ev(`document.querySelector('#chPad .pad__guide')?.getAttribute('points') ?? ''`)).split(' ').map((s) => s.split(',').map(Number));
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      await press(dx > 0 ? 'ArrowRight' : dy < 0 ? 'ArrowUp' : 'ArrowDown', 120);
    }
    await t.wait(400);
    return won();
  }
  if (kind === 'sequence') {
    for (let round = 0; round < 3; round++) {
      // '잘 보세요' 동안 빛나는 차례를 적어 두었다가 숫자 키로 누른다
      const order = [];
      let last = -1;
      for (let i = 0; i < 600; i++) {
        const lit = await t.ev(`(() => { const g = document.querySelector('#chPad .pad__key.is-lit'); return g ? Number(g.dataset.i) : -1; })()`);
        if (lit >= 0 && lit !== last) order.push(lit);
        last = lit;
        if (order.length && (await bar(t)).label.includes('순서 0')) break;
        await t.wait(20);
      }
      for (const i of order) await press(`Digit${i + 1}`, 150);
      await t.wait(500);
      if (await won()) return true;
    }
    return false;
  }
  if (kind === 'balance') {
    // 표시가 금빛 가운데보다 아래면 누르고 위면 뗀다(사람이 하는 것처럼 보고 조절)
    let held = false;
    for (let i = 0; i < 1500; i++) {
      const s = await bar(t);
      if (s.hidden || (await count(t)) > before) { if (held) await send('Space', 'keyUp'); return true; }
      const want = s.m < (s.a + s.b) / 2 - 0.02 || i === 0;
      if (want !== held) { await send('Space', want ? 'keyDown' : 'keyUp'); held = want; }
      await t.wait(15);
    }
    if (held) await send('Space', 'keyUp');
    return false;
  }
  if (kind === 'catch') {
    // 가장 아래로 떨어진 것 쪽으로 바구니를 옮긴다(←·→를 누른 채로)
    let dir = null;
    const hold = async (d) => { if (d === dir) return; if (dir) await send(dir, 'keyUp'); if (d) await send(d, 'keyDown'); dir = d; };
    for (let i = 0; i < 2500; i++) {
      if (await won()) { await hold(null); return true; }
      const s = JSON.parse(await t.ev(`(() => { const b = document.querySelector('#chPad .pad__basket'); if (!b) return 'null'; const bx = +b.getAttribute('x') + +b.getAttribute('width') / 2;
        const it = [...document.querySelectorAll('#chPad .pad__item')].map(c => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') })).sort((p, q) => q.y - p.y)[0]; return JSON.stringify({ bx, it }); })()`));
      if (!s?.it) { await hold(null); await t.wait(20); continue; }
      await hold(Math.abs(s.it.x - s.bx) < 6 ? null : s.it.x > s.bx ? 'ArrowRight' : 'ArrowLeft');
      await t.wait(10);
    }
    await hold(null);
    return false;
  }
  // 예전 놀이(time·rhythm·hold): 금빛 구간에 들어올 때 누른다. hold는 누른 채 금빛에서 뗀다
  if (kind === 'hold') {
    await send('Space', 'keyDown');
    for (let i = 0; i < 400; i++) { const s = await bar(t); if (s.m >= s.a + (s.b - s.a) * 0.2 && s.m <= s.a + (s.b - s.a) * 0.8) break; await t.wait(10); }
    await send('Space', 'keyUp');
    await t.wait(400);
    return won();
  }
  for (let i = 0; i < 600; i++) {
    const s = await bar(t);
    if (s.hidden || (await count(t)) > before) return true;
    if (s.m >= s.a && s.m <= s.b) await press('Space', 120); else await t.wait(10);
  }
  return false;
}
