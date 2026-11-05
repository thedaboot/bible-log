// 월드 지도: 쉼터의 빛의 문으로 들어가 스테이지를 고른다(양피지 픽셀 지도). 규칙은 docs/standards/ui.md "월드 지도".
// 고른 지점 id로 끝나고, 닫으면 null로 끝난다.
import { $, hideModal } from './ui.js';
import { CHAPTERS, WORLDS } from './data/chapters.js';
import { CODEX } from './data/codex.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// 스테이지 상태: 준비 중(지점 없음) / 잠김 / 열림 / 마침. 마쳤는데 도감에 못 만난 항목이 남으면 별(볼거리 남음).
export function stageInfo(state, id) {
  const ch = CHAPTERS.find((c) => c.id === id);
  const open = ch.points.filter((p) => state.unlocked.includes(p.id));
  const entries = CODEX.filter((c) => c.stage === id);
  const cleared = state.claimed.includes(`${id}/clear`);
  return {
    ch,
    open,
    status: !ch.points.length ? 'soon' : !open.length ? 'locked' : cleared ? 'cleared' : 'open',
    star: cleared && entries.some((c) => !state.codex[c.id]),
    words: entries.filter((c) => c.id.startsWith('word/')),
    met: entries.filter((c) => state.codex[c.id]).length,
    total: entries.length,
  };
}
const SVG = 'http://www.w3.org/2000/svg';
const DEFAULT_COLS = 5;
// 휴대폰 폭(40rem 미만)은 두 칸씩 세로로 내려가는 길로 그린다(가로 스크롤 없이, 이름이 잘리지 않게)
const colsFor = () => (innerWidth < 640 ? 2 : DEFAULT_COLS);

// 지도 칸 자리. 본 스테이지 줄은 홀수 줄(1, 3, 5…), 곁길은 그 아래 짝수 줄이다.
export function layout(stages, COLS = DEFAULT_COLS) {
  const at = {};
  let m = 0;
  return stages.map((id) => {
    const ch = CHAPTERS.find((c) => c.id === id);
    if (ch.side) {
      const p = at[ch.side];
      return { row: p.row + 1, col: p.col };
    }
    const line = Math.floor(m / COLS);
    const k = m++ % COLS;
    return (at[id] = { row: line * 2 + 1, col: line % 2 ? COLS - k : k + 1 });
  });
}

// 표지 가운데를 이어 길을 긋는다. 줄이 바뀌는 자리는 바깥으로 돌아 오르고, 곁길은 짧은 가지로 잇는다.
// 길은 흙길 띠 위에 점선을 긋고, 마친 스테이지 사이 구간은 금빛으로 칠한다(어디까지 왔는지 한눈에).
function drawPath(svg, box, stages, cells, marks, COLS, done) {
  const base = box.getBoundingClientRect();
  const c = marks.map((b) => {
    const r = b.firstChild.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, w: b.getBoundingClientRect().width };
  });
  const main = stages.map((id, k) => k).filter((k) => !CHAPTERS.find((ch) => ch.id === stages[k]).side);
  let d = '', gold = '';
  main.forEach((k, i) => {
    if (!i) { d += `M${c[k].x} ${c[k].y}`; return; }
    const a = c[main[i - 1]];
    let seg;
    if (cells[k].row !== cells[main[i - 1]].row) {
      const out = cells[k].col === COLS ? 1 : -1; // 오른쪽 끝에서는 오른쪽으로, 왼쪽 끝에서는 왼쪽으로 돌아 오른다
      const x = a.x + out * (COLS === 2 ? a.w / 2 - 8 : a.w / 2 + 16); // 이름 칸 바깥으로 돈다(두 칸 지도는 지도 안쪽 가장자리로)
      seg = ` H${x} V${c[k].y} H${c[k].x}`;
    } else seg = ` H${c[k].x}`;
    d += seg;
    if (done(stages[main[i - 1]])) gold += `M${a.x} ${a.y}${seg}`; // 앞 스테이지를 마쳤으면 다음 표지까지 금빛
  });
  const spurs = stages.map((id, k) => k).filter((k) => CHAPTERS.find((ch) => ch.id === stages[k]).side).map((k) => {
    const p = c[stages.indexOf(CHAPTERS.find((ch) => ch.id === stages[k]).side)];
    return `M${p.x} ${p.y} V${c[k].y}`;
  }).join(' ');
  svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
  svg.innerHTML = `<path class="map__band" d="${d}"/><path class="map__band map__band--spur" d="${spurs}"/><path class="map__gold" d="${gold}"/><path class="map__road" d="${d}"/><path class="map__spur" d="${spurs}"/>`;
}

const STATUS = { soon: '준비 중', locked: '잠김', open: '', cleared: '완료' }; // 열림은 글자로 적지 않는다(밝은 표지가 열림이다)

export function openMap(state) {
  const box = $('mapBox');
  const world = WORLDS[0]; // shortcut: 월드가 하나뿐이다. 출애굽기를 만들 때 월드 넘기기를 더한다.
  let n = 0;
  const infos = world.stages.map((id) => {
    const it = stageInfo(state, id);
    return { ...it, side: it.ch.side, label: it.ch.side ? '샛길' : `1-${++n}` };
  });
  const words = infos.flatMap((i) => i.words);
  $('mapTitle').textContent = world.title;
  $('mapProgress').textContent = `말씀 ${words.filter((w) => state.codex[w.id]).length} / ${words.length}`;
  let sel = Math.max(0, infos.findLastIndex((i) => i.status === 'open' || i.status === 'cleared'));
  // 중간에 나온 스테이지가 있으면 그 표지를 먼저 고른다(이어하기가 바로 보이게, F56)
  const midIdx = state.resume ? infos.findIndex((i) => i.ch.points.some((p) => p.id === state.resume.id)) : -1;
  if (midIdx >= 0) sel = midIdx;

  return new Promise((resolve) => {
    const nodes = $('mapNodes');
    const detail = $('mapDetail');
    const close = (value) => {
      hideModal(box);
      ro.disconnect();
      removeEventListener('keydown', onKey, true);
      resolve(value);
    };
    const paint = () => {
      nodes.querySelectorAll('.map__node').forEach((n, k) => n.setAttribute('aria-pressed', String(k === sel)));
      const it = infos[sel];
      const view = el('div', 'map__info');
      const head = el('div', 'map__infohead');
      const kicker = el('p', 'quest__label map__kicker', it.label);
      if (it.status === 'cleared') kicker.append(el('span', 'map__badge map__badge--done', '완료'));
      if (it.status === 'locked') kicker.append(el('span', 'map__badge map__badge--lock', '잠김'));
      head.append(kicker, el('p', 'map__stage', it.ch.title), el('p', 'map__range', it.ch.range));
      view.append(head);
      // 도감: 글자 대신 책 아이콘과 채워지는 막대(다 채우면 금빛 별)
      if (it.total && it.status !== 'locked' && it.status !== 'soon') {
        const stats = el('div', 'map__dex');
        stats.setAttribute('role', 'img');
        stats.setAttribute('aria-label', `도감 ${it.met} / ${it.total}`);
        const bar = el('span', 'map__dexbar');
        bar.style.setProperty('--p', it.met / it.total);
        stats.append(el('span', 'map__dexicon'), bar, el('span', 'map__dexnum', `${it.met}/${it.total}`));
        if (it.met === it.total) stats.append(el('span', 'map__dexstar'));
        view.append(stats);
      }
      const go = el('div', 'map__go');
      if (it.status === 'soon') go.append(el('p', 'map__note', '아직 만드는 중이에요.'));
      else if (it.status === 'locked') go.append(el('p', 'map__note', '앞 이야기를 마치면 열려요.'));
      else {
        // 버튼(2026-11-05 F55·F56): 중간에 나왔으면 '이어하기'와 '처음부터', 완료한 스테이지는 '처음부터', 처음이면 '입장'.
        // 창조의 날, 에덴의 '타락과 추방' 같은 중간 지점 버튼은 두지 않는다(언제나 첫 지점부터, 이어하기가 나간 자리를 맡는다)
        const first = it.ch.points[0].id;
        const btn = (text, id, label) => { const b = el('button', 'btn map__point', text); b.type = 'button'; b.setAttribute('aria-label', label); b.onclick = () => close(id); go.append(b); };
        const midway = state.resume && it.ch.points.some((p) => p.id === state.resume.id);
        if (midway) btn('이어하기', 'resume', `${it.ch.title} 나간 자리부터 이어하기`);
        if (midway || it.status === 'cleared') btn('처음부터', `restart:${first}`, `${it.ch.title} 처음부터`);
        else btn('입장', first, `${it.ch.title} 입장`);
      }
      view.append(go);
      detail.replaceChildren(view);
    };
    // 굽이치는 길: 본 스테이지는 한 줄에 COLS개씩 놓고 줄마다 방향을 바꾼다. 곁길은 갈라지는 본 스테이지 바로 아래 줄에 둔다.
    const cols = colsFor();
    // 길은 아래에서 위로 오른다(1-1이 맨 아래). 줄 번호만 뒤집는다.
    const flat = layout(world.stages, cols);
    const rows = Math.max(...flat.map((c) => c.row));
    const cells = flat.map((c) => ({ ...c, row: rows - c.row + 1 }));
    nodes.style.setProperty('--map-cols', cols);
    nodes.style.setProperty('--map-rows', Math.max(...cells.map((c) => c.row)));
    const marks = infos.map((it, k) => {
      const b = el('button', 'map__node');
      b.type = 'button';
      b.dataset.status = it.status;
      if (it.side) b.dataset.side = '';
      b.style.gridRow = cells[k].row;
      b.style.gridColumn = cells[k].col;
      b.setAttribute('aria-label', `${it.label} ${it.ch.title}${STATUS[it.status] ? `, ${STATUS[it.status]}` : ''}`);
      const mark = el('span', 'map__mark', it.side ? '샛길' : it.label);
      if (it.status === 'locked') mark.append(el('span', 'map__lock')); // 잠긴 표지: 자물쇠
      if (it.star) mark.append(el('span', 'map__star'));
      // 도감을 얼마나 채웠는지: 표지 아래 얇은 막대(열린 스테이지만)
      if (it.total && (it.status === 'open' || it.status === 'cleared')) {
        const bar = el('span', 'map__markbar');
        bar.style.setProperty('--p', it.met / it.total);
        mark.append(bar);
      }
      b.append(mark, el('span', 'map__name', it.ch.title));
      b.onclick = () => { sel = k; paint(); };
      return b;
    });
    const path = document.createElementNS(SVG, 'svg');
    path.setAttribute('class', 'map__path');
    path.setAttribute('aria-hidden', 'true');
    nodes.replaceChildren(path, ...marks);
    requestAnimationFrame(() => marks[sel]?.scrollIntoView({ block: 'center', inline: 'nearest' })); // 고른 스테이지가 보이게
    const draw = () => drawPath(path, nodes, world.stages, cells, marks, cols, (sid) => state.claimed.includes(`${sid}/clear`));
    const ro = new ResizeObserver(draw);
    ro.observe(nodes);
    // Enter: 고른 표지의 첫 지점에 들어간다. ↓: 지점 버튼으로, ↑: 표지로 포커스를 옮긴다.
    const onKey = (e) => {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
      const onMark = document.activeElement?.classList.contains('map__node');
      const points = [...detail.querySelectorAll('.map__point')];
      if (e.code === 'Enter' && onMark) {
        e.preventDefault();
        sel = marks.indexOf(document.activeElement);
        paint();
        if (infos[sel].open.length && infos[sel].status !== 'locked') detail.querySelector('.map__point')?.click(); // 첫 버튼(이어하기 또는 입장·처음부터)
      }
      if (e.code === 'ArrowDown' && points.length) { e.preventDefault(); (points[points.indexOf(document.activeElement) + 1] ?? points[0]).focus({ preventScroll: true }); }
      if (e.code === 'ArrowUp' && !onMark) {
        e.preventDefault();
        const k = points.indexOf(document.activeElement);
        (k > 0 ? points[k - 1] : marks[sel]).focus({ preventScroll: true });
      }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        sel = (sel + (e.code === 'ArrowRight' ? 1 : infos.length - 1)) % infos.length;
        paint();
        marks[sel].focus({ preventScroll: true });
      }
    };
    addEventListener('keydown', onKey, true);
    $('mapClose').onclick = () => close(null);
    box.onclick = (e) => { if (e.target === box) close(null); }; // 다른 창처럼 바깥을 누르면 닫는다
    box.classList.remove('is-closing');
    box.hidden = false;
    paint();
    marks[sel].focus({ preventScroll: true });
  });
}
