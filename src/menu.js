// 걷는 중에 여는 메뉴: 상태 창(레벨, 성령의 열매 레이더 차트, 닮은 인물)과 도감(다섯 분류, 칸마다 세 상태).
// 규칙은 docs/standards/ui.md "메뉴: 상태 창과 도감".
import { $ } from './ui.js';
import { SPIRIT, SPIRIT_STAGES, slotsAt } from './data/growth.js';
import { CODEX, CODEX_TABS } from './data/codex.js';
import { CHAPTERS } from './data/chapters.js';
import { levelOf, stageOf, likeness, codexState } from './growth.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

// 레이더 차트: 아홉 축, 값은 단계(씨앗 0 ~ 결실 4). 씨앗도 안쪽 첫 고리에 찍히게 (단계+1)/5로 그린다.
export function radarPoints(stages, R = 1) {
  return stages.map((s, i) => {
    const a = -Math.PI / 2 + (i / stages.length) * Math.PI * 2;
    const r = ((s + 1) / SPIRIT_STAGES.length) * R;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}
function radar(stages) {
  const R = 100, n = stages.length;
  const box = svg('svg', { viewBox: '-150 -128 300 252', class: 'radar__svg', role: 'img', 'aria-labelledby': 'radarTitle' });
  box.append(Object.assign(svg('title', { id: 'radarTitle' }), { textContent: '성령의 열매 아홉 가지의 단계' }));
  const ring = (k) => radarPoints(Array(n).fill(k), R).map((p) => p.join(',')).join(' ');
  for (let k = 0; k < SPIRIT_STAGES.length; k++) box.append(svg('polygon', { points: ring(k), class: 'radar__grid' }));
  radarPoints(Array(n).fill(SPIRIT_STAGES.length - 1), R).forEach(([x, y]) => box.append(svg('line', { x1: 0, y1: 0, x2: x, y2: y, class: 'radar__axis' })));
  const pts = radarPoints(stages, R);
  box.append(svg('polygon', { points: pts.map((p) => p.join(',')).join(' '), class: 'radar__shape' }));
  pts.forEach(([x, y]) => box.append(svg('circle', { cx: x, cy: y, r: 4, class: 'radar__dot' })));
  radarPoints(Array(n).fill(SPIRIT_STAGES.length - 1), R * 1.18).forEach(([x, y], i) => {
    const anchor = Math.abs(x) < 8 ? 'middle' : x > 0 ? 'start' : 'end';
    const t = svg('text', { x, y: y + 5, 'text-anchor': anchor, class: 'radar__label' });
    t.textContent = SPIRIT[i].name;
    box.append(t);
  });
  return box;
}

function statusView(state) {
  const lv = levelOf(state.xp);
  const wrap = el('div', 'menu-status');
  const head = el('div', 'menu-status__head');
  const who = el('div', 'menu-status__who');
  who.append(el('p', 'quest__label', lv.title), el('p', 'menu-status__name', `${state.name || '관찰자'} · 레벨 ${lv.level}`));
  const bar = el('span', 'gauge__track');
  const fill = el('span', 'gauge__fill');
  fill.style.transform = `scaleX(${lv.into / lv.need})`;
  bar.append(fill);
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `다음 레벨까지 경험치 ${lv.need - lv.into}`);
  who.append(bar, el('p', 'menu-status__meta', `경험치 ${lv.into} / ${lv.need} · 달란트 ${state.talents} · 인벤토리 ${slotsAt(lv.level)}칸`));
  head.append(who);
  wrap.append(head);

  const stages = SPIRIT.map((s) => stageOf(state.spirit[s.id]));
  const fig = el('figure', 'radar');
  fig.append(radar(stages));
  wrap.append(fig);
  // 표 보기: 차트를 글로도 읽을 수 있게 열매마다 단계를 적는다. 개역개정 단어는 여기서 한 번 함께 보여 준다.
  const list = el('ul', 'fruit-list');
  SPIRIT.forEach((s, i) => {
    const li = el('li', 'fruit-list__item');
    li.dataset.stage = stages[i];
    li.append(el('span', 'fruit-list__name', s.name), el('span', 'fruit-list__stage', SPIRIT_STAGES[stages[i]]));
    if (s.old !== s.name) li.title = `개역개정: ${s.old}`;
    li.append(el('span', 'fruit-list__old', s.old !== s.name ? s.old : ''));
    list.append(li);
  });
  wrap.append(list);

  const like = likeness(state);
  const box = el('div', 'likeness');
  if (like) {
    const name = CODEX.find((c) => c.id === `person/${like.who}`).name;
    box.append(el('p', 'quest__label', '닮은 인물'), el('p', 'likeness__name', name), el('p', 'likeness__text', like.text));
  } else {
    box.append(el('p', 'quest__label', '닮은 인물'), el('p', 'likeness__text', '열매가 자라면 닮은 성경 인물을 알려 드릴게요.'));
  }
  wrap.append(box);
  return wrap;
}

function codexView(state, cat) {
  const wrap = el('div', 'codex');
  const entries = CODEX.filter((c) => c.id.startsWith(`${cat}/`));
  const met = entries.filter((c) => state.codex[c.id]).length;
  wrap.append(el('p', 'codex__count', `${met} / ${entries.length}`));
  const grid = el('ul', 'codex__grid');
  entries.forEach((c, i) => {
    const st = codexState(state, c);
    const li = el('li', 'codex__cell');
    li.dataset.state = st;
    li.append(el('span', 'codex__no', `No.${String(i + 1).padStart(3, '0')}`));
    const stageName = CHAPTERS.find((ch) => ch.id === c.stage)?.title ?? '';
    if (st === 'met') {
      li.append(el('span', 'codex__name', c.name), el('span', 'codex__fact', c.fact), el('span', 'codex__memo', c.memo));
    } else if (st === 'missed') {
      li.append(el('span', 'codex__name', '????'), el('span', 'codex__fact', `${stageName}에서 다시 찾아보세요`));
    } else {
      li.append(el('span', 'codex__name', '?'));
    }
    grid.append(li);
  });
  wrap.append(grid);
  return wrap;
}

let open = null;
export const menuIsOpen = () => !!open;

export function openMenu(state, tab = 'status') {
  if (open) return open.promise;
  const box = $('menuBox');
  const tabs = $('menuTabs');
  const body = $('menuBody');
  let cat = 'person';
  const TABS = [{ id: 'status', name: '상태' }, { id: 'codex', name: '도감' }];
  const render = () => {
    tabs.replaceChildren(...TABS.map((t) => {
      const b = el('button', 'tab', t.name);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(t.id === tab));
      b.onclick = () => { tab = t.id; render(); };
      return b;
    }));
    const line = el('span', 'look__tabline');
    line.style.setProperty('--tabs', TABS.length);
    line.style.transform = `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)`;
    tabs.append(line);
    if (tab === 'status') { body.replaceChildren(statusView(state)); return; }
    const cats = el('div', 'codex__cats');
    cats.setAttribute('role', 'tablist');
    for (const c of CODEX_TABS) {
      const b = el('button', 'chip', c.name);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c.id === cat));
      b.onclick = () => { cat = c.id; render(); };
      cats.append(b);
    }
    body.replaceChildren(cats, codexView(state, cat));
  };
  box.hidden = false;
  render();
  tabs.querySelector('[aria-selected="true"]').focus({ preventScroll: true });
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  const close = () => {
    box.hidden = true;
    removeEventListener('keydown', onKey, true);
    open = null;
    resolve();
  };
  const onKey = (e) => {
    if (e.code === 'Escape' || e.code === 'KeyM') { e.preventDefault(); e.stopPropagation(); close(); }
  };
  addEventListener('keydown', onKey, true);
  $('menuClose').onclick = close;
  box.onclick = (e) => { if (e.target === box) close(); };
  open = { promise };
  return promise;
}
