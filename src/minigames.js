// 도전의 놀이 다섯 가지(2026-11-05 사용자 F58 "타이밍 맞추는 미니게임만 있어서 재미가 없다").
// main.js runChallenge가 성공·실패·보상·난도를 맡고, 여기는 놀이 하나가 입력을 받고 그리는 것만 맡는다.
//   mash     빠르게 연타해 새어 나가는 게이지를 끝선까지(힘쓰는 일: 들어 올리기, 씨름 버티기, 장작 쪼개기)
//   balance  꾹 누르면 오르고 떼면 내려가는 표시를 가운데 구간에 머물게(균형: 이고 나르기, 기둥 세우기)
//   trace    놀이판의 선을 손가락이나 방향키로 따라 긋기(바르기·긋기: 역청, 밭고랑, 벽돌 틀)
//   sequence 빛나는 순서를 기억했다 그대로 누르기(꿈 풀이, 순서 있는 일)
//   catch    떨어지는 것을 바구니로 받기(곡식 받기, 짐 나르기)
// makeGame(kind, { pad, d, assist, hooks, symbols, hint }) → { pad, arrows, hint(touch), act(down), key(code, down), tick(dt), destroy() }
//   d: 난도(1~1.8, 성공할수록 오른다), assist: 열매 보조(0~0.32), hooks: { hit(text), miss(text) }
//   tick은 막대에 그릴 값 { m, zone, label }을 돌려준다. 놀이판(pad)이 있으면 그 SVG에 직접 그린다.
const NS = 'http://www.w3.org/2000/svg';
const W = 240, H = 120;
const node = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent?.append(e); return e; };
// 놀이판 좌표(viewBox)로 바꾼 손가락 자리
function padPoint(pad, e) {
  const r = pad.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}
const ARROW = { ArrowRight: 'R', KeyD: 'R', ArrowLeft: 'L', KeyA: 'L', ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D' };

function mash({ d, assist, hooks }) {
  let m = 0, t = 0;
  return {
    hint: () => '빠르게 연타해서 끝선까지',
    act(down) {
      if (!down) return;
      m = Math.min(1, m + (0.1 * (1 + assist)) / Math.sqrt(d));
      if (m >= 1) { m = 0; t = 0; hooks.hit('끙! 해냈어요'); }
    },
    tick(dt) {
      if (m > 0) t += dt;
      m = Math.max(0, m - dt * 0.3 * d); // 손을 늦추면 게이지가 새어 나간다
      if (t > 8) { m = 0; t = 0; hooks.miss('힘이 빠졌어요. 다시 해 봐요'); }
      return { m, zone: [0.94, 1], fill: true };
    },
  };
}

function balance({ d, assist, hooks }) {
  let m = 0.5, v = 0, held = false, inT = 0, started = false; // 처음 누르기 전에는 움직이지 않는다(누르기도 전에 실패하지 않게)
  const need = 2.4, w = Math.min(0.4, (0.28 / d) * (1 + assist));
  const zone = [0.5 - w / 2, 0.5 + w / 2];
  return {
    hint: (touch) => `${touch ? '꾹 누르면' : 'Space를 누르면'} 오르고 떼면 내려가요. 금빛에 머물기`,
    act(down) { held = down; if (down) started = true; },
    tick(dt) {
      if (!started) return { m, zone, label: '누르면 시작해요' };
      v += ((held ? 1.5 : -1.1) * d + (Math.random() - 0.5) * 1.6 * d) * dt;
      v *= Math.pow(0.35, dt);
      m += v * dt;
      if (m <= 0 || m >= 1) { const low = m <= 0; m = 0.5; v = 0; inT = 0; hooks.miss(low ? '기울어졌어요. 다시 잡아요' : '너무 밀었어요. 다시 잡아요'); }
      if (m >= zone[0] && m <= zone[1]) inT += dt;
      if (inT >= need) { inT = 0; m = 0.5; v = 0; hooks.hit('흔들림 없이 해냈어요'); }
      return { m, zone, label: `균형 ${Math.round((inT / need) * 100)}%` };
    },
  };
}

function trace({ pad, d, assist, hooks }) {
  // 오른쪽으로 나아가며 위아래로 꺾이는 길. 마디 수는 난도에 따라 4~7
  const segs = Math.min(7, 4 + Math.round((d - 1) * 4));
  const pts = [{ x: 22, y: 60 }];
  const dirs = [];
  for (let k = 0; k < segs; k++) {
    const p = pts.at(-1);
    let dir = k % 2 === 0 ? 'R' : Math.random() < 0.5 ? 'U' : 'D';
    if (dir === 'U' && p.y - 34 < 16) dir = 'D';
    if (dir === 'D' && p.y + 34 > H - 16) dir = 'U';
    const len = dir === 'R' ? Math.min(46, (W - 44) / Math.ceil(segs / 2)) : 34;
    pts.push({ x: p.x + (dir === 'R' ? len : 0), y: p.y + (dir === 'U' ? -len : dir === 'D' ? len : 0) });
    dirs.push(dir);
  }
  const tol = 15 * (1 + assist) / Math.pow(d, 0.4);
  const limit = (segs * 1.1 + 2.5) / Math.pow(d, 0.5); // 마르기 전에 끝내야 한다(시간)
  let idx = 0, t = 0, drawing = false, brush = { ...pts[0] };
  pad.replaceChildren();
  node('polyline', { points: pts.map((p) => `${p.x},${p.y}`).join(' '), class: 'pad__guide' }, pad);
  const done = node('polyline', { points: '', class: 'pad__done' }, pad);
  const target = node('circle', { r: 7, class: 'pad__target' }, pad);
  const dot = node('circle', { r: 6, class: 'pad__brush' }, pad);
  const paint = () => {
    done.setAttribute('points', [...pts.slice(0, idx + 1), ...(drawing ? [brush] : [])].map((p) => `${p.x},${p.y}`).join(' '));
    const n = pts[Math.min(idx + 1, pts.length - 1)];
    target.setAttribute('cx', n.x); target.setAttribute('cy', n.y);
    dot.setAttribute('cx', brush.x); dot.setAttribute('cy', brush.y);
  };
  const reset = (text) => { idx = 0; t = 0; drawing = false; brush = { ...pts[0] }; paint(); if (text) hooks.miss(text); };
  const advance = () => {
    idx++;
    brush = { ...pts[idx] };
    if (idx >= segs) { hooks.hit('끝까지 고르게 그었어요'); reset(); return; }
    paint();
  };
  // 선분 a-b까지의 거리
  const distSeg = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
    return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy);
  };
  const down = (e) => {
    e.preventDefault();
    const p = padPoint(pad, e);
    if (Math.hypot(p.x - pts[idx].x, p.y - pts[idx].y) > tol * 1.6) return;
    drawing = true;
    pad.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!drawing) return;
    const p = padPoint(pad, e);
    if (distSeg(p, pts[idx], pts[idx + 1]) > tol) { reset('선을 벗어났어요'); return; }
    brush = p;
    if (Math.hypot(p.x - pts[idx + 1].x, p.y - pts[idx + 1].y) < tol * 0.8) advance();
    else paint();
  };
  const up = () => { drawing = false; brush = { ...pts[idx] }; paint(); };
  pad.addEventListener('pointerdown', down);
  pad.addEventListener('pointermove', move);
  pad.addEventListener('pointerup', up);
  pad.addEventListener('pointercancel', up);
  paint();
  return {
    pad: true, arrows: true,
    hint: (touch) => (touch ? '선을 따라 손가락으로 긋기' : '방향키로 선을 따라 긋기'),
    act() {},
    key(code, isDown) {
      const dir = ARROW[code];
      if (!dir) return false;
      if (!isDown) return true;
      if (dir === dirs[idx]) advance();
      else hooks.miss('방향이 달라요');
      return true;
    },
    tick(dt) {
      if (idx > 0 || drawing) t += dt;
      if (t > limit) reset('역청이 굳기 전에 끝내야 해요');
      return { m: 1 - t / limit, zone: [0, 0.25], fill: true, label: `${idx} / ${segs}` };
    },
    destroy() { pad.removeEventListener('pointerdown', down); pad.removeEventListener('pointermove', move); pad.removeEventListener('pointerup', up); pad.removeEventListener('pointercancel', up); },
  };
}

function sequence({ pad, d, hooks, symbols = ['1', '2', '3', '4'] }) {
  const n = Math.min(5, symbols.length);
  const len = Math.min(6, 3 + Math.round((d - 1) * 4));
  const step = 0.6 / d;
  let order = [], shown = 0, showT = 0, got = 0, phase = 'show', lit = -1, litT = 0;
  pad.replaceChildren();
  const xs = Array.from({ length: n }, (_, i) => (W / (n + 1)) * (i + 1));
  const btns = xs.map((x, i) => {
    const g = node('g', { class: `pad__key pad__key--${i}`, 'data-i': i }, pad);
    node('circle', { cx: x, cy: 54, r: Math.min(26, W / (n + 1) / 2 - 3) }, g);
    const tx = node('text', { x, y: 60, 'text-anchor': 'middle', class: 'pad__sym' }, g);
    tx.textContent = symbols[i];
    const k = node('text', { x, y: 104, 'text-anchor': 'middle', class: 'pad__num' }, g);
    k.textContent = String(i + 1);
    return g;
  });
  const light = (i) => { btns.forEach((b, k) => b.classList.toggle('is-lit', k === i)); };
  const deal = () => { order = Array.from({ length: len }, () => Math.floor(Math.random() * n)); shown = 0; showT = -0.5; got = 0; phase = 'show'; light(-1); };
  const press = (i) => {
    if (phase !== 'input') return;
    lit = i; litT = 0.2; light(i);
    if (i !== order[got]) { phase = 'wait'; showT = -0.9; hooks.miss('순서가 달라요. 다시 볼게요'); return; }
    got++;
    if (got >= len) { phase = 'wait'; showT = -0.6; hooks.hit('순서대로 다 맞혔어요'); }
  };
  const down = (e) => {
    const g = e.target.closest?.('.pad__key');
    if (!g) return;
    e.preventDefault();
    press(Number(g.dataset.i));
  };
  pad.addEventListener('pointerdown', down);
  deal();
  return {
    pad: true,
    hint: (touch) => (touch ? '빛난 순서대로 누르기' : '빛난 순서대로 숫자 키로 누르기'),
    act() {},
    key(code, isDown) {
      const m = /^(Digit|Numpad)([1-9])$/.exec(code);
      if (!m || Number(m[2]) > n) return false;
      if (isDown) press(Number(m[2]) - 1);
      return true;
    },
    tick(dt) {
      if (litT > 0) { litT -= dt; if (litT <= 0) light(-1); }
      if (phase === 'show') {
        showT += dt;
        if (showT >= 0) {
          const k = Math.floor(showT / step);
          const on = showT - k * step < step * 0.7;
          light(k < len && on ? order[k] : -1);
          if (k >= len) { phase = 'input'; light(-1); }
        }
      } else if (phase === 'wait') { showT += dt; if (showT >= 0) deal(); }
      return { m: phase === 'input' ? got / len : 0, zone: [1, 1], fill: true, label: phase === 'show' ? '잘 보세요' : `순서 ${got} / ${len}` };
    },
    destroy() { pad.removeEventListener('pointerdown', down); },
  };
}

function catchGame({ pad, d, assist, hooks }) {
  const need = 5, allow = 2;
  const bw = Math.min(70, (54 * (1 + assist)) / Math.sqrt(d));
  let bx = W / 2, got = 0, lost = 0, spawn = 0.4, held = { L: false, R: false };
  const items = [];
  pad.replaceChildren();
  const layer = node('g', {}, pad);
  const basket = node('rect', { y: H - 16, width: bw, height: 12, class: 'pad__basket' }, pad);
  const place = () => basket.setAttribute('x', bx - bw / 2);
  const follow = (e) => { if (e.type === 'pointermove' && !e.buttons && e.pointerType !== 'mouse') return; bx = Math.max(bw / 2, Math.min(W - bw / 2, padPoint(pad, e).x)); place(); };
  const down = (e) => { e.preventDefault(); follow(e); };
  pad.addEventListener('pointerdown', down);
  pad.addEventListener('pointermove', follow);
  place();
  return {
    pad: true, arrows: true,
    hint: (touch) => (touch ? '끌어서 옮겨 받기' : '←·→ 키로 옮겨 받기'),
    act() {},
    key(code, isDown) {
      const dir = ARROW[code];
      if (dir !== 'L' && dir !== 'R') return false;
      held[dir] = isDown;
      return true;
    },
    tick(dt) {
      bx = Math.max(bw / 2, Math.min(W - bw / 2, bx + ((held.R ? 1 : 0) - (held.L ? 1 : 0)) * 190 * dt));
      place();
      spawn -= dt;
      if (spawn <= 0) {
        spawn = (0.95 + Math.random() * 0.5) / d;
        items.push({ x: 14 + Math.random() * (W - 28), y: -6, e: node('circle', { r: 6, class: 'pad__item' }, layer) });
      }
      for (const it of [...items]) {
        it.y += 62 * d * dt;
        it.e.setAttribute('cx', it.x); it.e.setAttribute('cy', it.y);
        const caught = it.y >= H - 18 && it.y <= H - 6 && Math.abs(it.x - bx) <= bw / 2 + 4;
        if (caught || it.y > H + 6) {
          it.e.remove();
          items.splice(items.indexOf(it), 1);
          if (caught) got++; else lost++;
        }
      }
      if (lost > allow) { got = 0; lost = 0; items.splice(0).forEach((it) => it.e.remove()); hooks.miss('많이 놓쳤어요. 다시 받아요'); }
      if (got >= need) { got = 0; lost = 0; items.splice(0).forEach((it) => it.e.remove()); hooks.hit('다 받았어요'); }
      return { m: got / need, zone: [1, 1], fill: true, label: `${got} / ${need} · 놓침 ${lost} / ${allow + 1}` };
    },
    destroy() { pad.removeEventListener('pointerdown', down); pad.removeEventListener('pointermove', follow); },
  };
}

const GAMES = { mash, balance, trace, sequence, catch: catchGame };
export const isPadKind = (kind) => kind in GAMES;
export function makeGame(kind, opts) {
  const g = GAMES[kind](opts);
  if (opts.hint) g.hint = () => opts.hint; // 장면 말로 안내를 바꾼다(예: '자루를 끌어서 곡식 받기')
  return { pad: false, arrows: false, key: () => false, destroy() {}, ...g };
}
