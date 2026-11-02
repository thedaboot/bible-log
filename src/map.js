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
const COLS = 5;

// 지도 칸 자리. 본 스테이지 줄은 홀수 줄(1, 3, 5…), 곁길은 그 아래 짝수 줄이다.
export function layout(stages) {
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

// 표지 가운데를 이어 점선 길을 긋는다. 줄이 바뀌는 자리는 바깥으로 돌아 내려가고, 곁길은 짧은 가지로 잇는다.
function drawPath(svg, box, stages, cells, marks) {
  const base = box.getBoundingClientRect();
  const c = marks.map((b) => {
    const r = b.firstChild.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, w: b.getBoundingClientRect().width };
  });
  const main = stages.map((id, k) => k).filter((k) => !CHAPTERS.find((ch) => ch.id === stages[k]).side);
  let d = '';
  main.forEach((k, i) => {
    if (!i) { d += `M${c[k].x} ${c[k].y}`; return; }
    const a = c[main[i - 1]];
    if (cells[k].row !== cells[main[i - 1]].row) {
      const out = cells[k].col === COLS ? 1 : -1; // 오른쪽 끝에서는 오른쪽으로, 왼쪽 끝에서는 왼쪽으로 돌아 내려간다
      const x = a.x + out * (a.w / 2 + 16); // 이름 칸 바깥으로 돈다
      d += ` H${x} V${c[k].y} H${c[k].x}`;
    } else d += ` H${c[k].x}`;
  });
  const spurs = stages.map((id, k) => k).filter((k) => CHAPTERS.find((ch) => ch.id === stages[k]).side).map((k) => {
    const p = c[stages.indexOf(CHAPTERS.find((ch) => ch.id === stages[k]).side)];
    return `M${p.x} ${p.y} V${c[k].y}`;
  }).join(' ');
  svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
  svg.innerHTML = `<path class="map__road" d="${d}"/><path class="map__spur" d="${spurs}"/>`;
}

const STATUS = { soon: '준비 중', locked: '잠김', open: '열림', cleared: '마침' };

export function openMap(state) {
  const box = $('mapBox');
  const world = WORLDS[0]; // shortcut: 월드가 하나뿐이다. 출애굽기를 만들 때 월드 넘기기를 더한다.
  let n = 0;
  const infos = world.stages.map((id) => {
    const it = stageInfo(state, id);
    return { ...it, side: it.ch.side, label: it.ch.side ? '곁길' : `1-${++n}` };
  });
  const words = infos.flatMap((i) => i.words);
  $('mapTitle').textContent = world.title;
  $('mapProgress').textContent = `말씀 ${words.filter((w) => state.codex[w.id]).length} / ${words.length}`;
  let sel = Math.max(0, infos.findLastIndex((i) => i.status === 'open' || i.status === 'cleared'));

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
      head.append(el('p', 'quest__label', `${it.label} · ${STATUS[it.status]}`), el('p', 'map__stage', it.ch.title), el('p', 'map__range', it.ch.range));
      view.append(head);
      if (it.total) {
        const stats = el('p', 'map__stats');
        stats.append(el('span', null, `도감 ${it.met} / ${it.total}`));
        if (it.star) stats.append(el('span', 'map__left', '볼거리가 남아 있어요'));
        view.append(stats);
      }
      const go = el('div', 'map__go');
      if (it.status === 'soon') go.append(el('p', 'map__note', '아직 만드는 중이에요.'));
      else if (it.status === 'locked') go.append(el('p', 'map__note', '앞 스테이지를 마치면 열려요.'));
      else {
        // 스테이지 안의 중간 지점(예: 타락과 추방)도 여기서 함께 고른다
        for (const p of it.open) {
          // 지점이 하나면 '들어가기' 한 버튼, 여럿이면 '○○부터'로 어디서 시작하는지 적는다
          const b = el('button', 'btn map__point', it.open.length === 1 ? '들어가기' : `${p.title}부터`);
          b.setAttribute('aria-label', `${p.title}에서 시작`);
          b.type = 'button';
          b.onclick = () => close(p.id);
          go.append(b);
        }
      }
      view.append(go);
      detail.replaceChildren(view);
    };
    // 굽이치는 길: 본 스테이지는 한 줄에 COLS개씩 놓고 줄마다 방향을 바꾼다. 곁길은 갈라지는 본 스테이지 바로 아래 줄에 둔다.
    const cells = layout(world.stages);
    nodes.style.setProperty('--map-rows', Math.max(...cells.map((c) => c.row)));
    const marks = infos.map((it, k) => {
      const b = el('button', 'map__node');
      b.type = 'button';
      b.dataset.status = it.status;
      if (it.side) b.dataset.side = '';
      b.style.gridRow = cells[k].row;
      b.style.gridColumn = cells[k].col;
      b.setAttribute('aria-label', `${it.label} ${it.ch.title}, ${STATUS[it.status]}`);
      const mark = el('span', 'map__mark', it.side ? '곁길' : it.label);
      if (it.star) mark.append(el('span', 'map__star'));
      b.append(mark, el('span', 'map__name', it.ch.title));
      b.onclick = () => { sel = k; paint(); };
      return b;
    });
    const path = document.createElementNS(SVG, 'svg');
    path.setAttribute('class', 'map__path');
    path.setAttribute('aria-hidden', 'true');
    nodes.replaceChildren(path, ...marks);
    const draw = () => drawPath(path, nodes, world.stages, cells, marks);
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
        if (infos[sel].open.length && infos[sel].status !== 'locked') close(infos[sel].open[0].id);
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
