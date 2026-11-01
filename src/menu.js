// 메뉴: 상태 창(레벨, 성령의 열매 레이더 차트, 닮은 인물)과 도감(장별 페이지, 다섯 분류, 칸마다 세 상태).
// 게임 중에는 걷는 중에만 열고, 첫 화면에서는 도감만 연다. 규칙은 docs/standards/ui.md "메뉴".
import { $ } from './ui.js';
import { SPIRIT, SPIRIT_STAGES, slotsAt } from './data/growth.js';
import { CODEX, CODEX_TABS } from './data/codex.js';
import { CHAPTERS } from './data/chapters.js';
import { levelOf, stageOf, likeness, codexState, ownsLook } from './growth.js';
import { TALENT, BAG, ITEM_ICONS } from './icons.js';
import { ITEMS } from './data/items.js';

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
// 내용을 바꿀 때 넘기는 방향(-1 왼쪽, 1 오른쪽)에서 짧게 들어온다.
function swap(node, view, dir = 0) {
  node.replaceChildren(view);
  if (!dir) return;
  view.dataset.dir = dir;
  view.classList.add('is-entering');
  view.addEventListener('animationend', () => view.classList.remove('is-entering'), { once: true });
}
// 고른 칩·칸이 눌렸다 튀어 오른다
function pop(b) { b.classList.remove('is-picked'); void b.offsetWidth; b.classList.add('is-picked'); }
const button = (cls, text, onClick, label) => {
  const b = el('button', cls, text);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  b.onclick = onClick;
  return b;
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
  const R = 100, n = stages.length, top = SPIRIT_STAGES.length - 1;
  const box = svg('svg', { viewBox: '-150 -128 300 252', class: 'radar__svg', role: 'img', 'aria-labelledby': 'radarTitle' });
  box.append(Object.assign(svg('title', { id: 'radarTitle' }), { textContent: '성령의 열매 아홉 가지의 단계' }));
  const ring = (k) => radarPoints(Array(n).fill(k), R).map((p) => p.join(',')).join(' ');
  for (let k = 0; k <= top; k++) box.append(svg('polygon', { points: ring(k), class: 'radar__grid' }));
  radarPoints(Array(n).fill(top), R).forEach(([x, y]) => box.append(svg('line', { x1: 0, y1: 0, x2: x, y2: y, class: 'radar__axis' })));
  const pts = radarPoints(stages, R);
  box.append(svg('polygon', { points: pts.map((p) => p.join(',')).join(' '), class: 'radar__shape' }));
  pts.forEach(([x, y]) => box.append(svg('circle', { cx: x, cy: y, r: 4, class: 'radar__dot' })));
  radarPoints(Array(n).fill(top), R * 1.18).forEach(([x, y], i) => {
    const anchor = Math.abs(x) < 8 ? 'middle' : x > 0 ? 'start' : 'end';
    const t = svg('text', { x, y: y + 5, 'text-anchor': anchor, class: 'radar__label' });
    t.textContent = SPIRIT[i].name;
    box.append(t);
  });
  return box;
}

// 스탯 칸: 아이콘, 이름, 큰 숫자와 단위(게임의 능력치 칸처럼)
function statTile(icon, name, value, unit) {
  const t = el('div', 'stat');
  const i = el('span', 'stat__icon');
  i.innerHTML = icon;
  const v = el('p', 'stat__value');
  v.append(el('span', 'stat__num', value), el('span', 'stat__unit', unit));
  t.append(i, el('p', 'stat__name', name), v);
  return t;
}

function statusView(state) {
  const lv = levelOf(state.xp);
  const wrap = el('div', 'menu-status');

  const card = el('section', 'profile');
  const badge = el('p', 'profile__lv');
  badge.append(el('span', 'profile__lvword', 'Lv.'), el('span', 'profile__lvnum', lv.level));
  const who = el('div', 'profile__who');
  who.append(el('p', 'quest__label', lv.title), el('p', 'profile__name', state.name || '관찰자'));
  const xp = el('div', 'profile__xp');
  const bar = el('span', 'gauge__track profile__track');
  const fill = el('span', 'gauge__fill');
  fill.style.transform = `scaleX(${lv.into / lv.need})`;
  bar.append(fill);
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `경험치 ${lv.into} / ${lv.need}`);
  const xpText = el('p', 'profile__xptext');
  xpText.append(el('span', 'profile__xpname', '경험치'), el('span', 'profile__xpnum', `${lv.into} / ${lv.need}`));
  xp.append(xpText, bar);
  card.append(badge, who, xp);
  const stats = el('div', 'stats');
  stats.append(statTile(TALENT, '달란트', state.talents, '달란트'), statTile(BAG, '인벤토리', slotsAt(lv.level), '칸'));
  wrap.append(card, stats);

  const stages = SPIRIT.map((s) => stageOf(state.spirit[s.id]));
  const fruits = el('section', 'fruits');
  fruits.append(el('p', 'quest__label', '성령의 열매 · 갈 5:22~23'));
  const fig = el('figure', 'radar');
  fig.append(radar(stages));
  fruits.append(fig);
  // 표 보기: 차트를 글로도 읽을 수 있게 열매마다 단계를 적는다. 개역개정 단어는 여기서 한 번 함께 보여 준다.
  const list = el('ul', 'fruit-list');
  SPIRIT.forEach((s, i) => {
    const li = el('li', 'fruit-list__item');
    li.dataset.stage = stages[i];
    li.append(el('span', 'fruit-list__name', s.name), el('span', 'fruit-list__stage', SPIRIT_STAGES[stages[i]]));
    if (s.old !== s.name) li.append(el('span', 'fruit-list__old', s.old));
    list.append(li);
  });
  fruits.append(list);
  wrap.append(fruits);

  const like = likeness(state);
  const box = el('section', 'likeness');
  box.append(el('p', 'quest__label', '닮은 인물'));
  if (like) box.append(el('p', 'likeness__name', CODEX.find((c) => c.id === `person/${like.who}`).name), el('p', 'likeness__text', like.text));
  else box.append(el('p', 'likeness__text', '열매가 자라면 닮은 성경 인물을 알려 드릴게요.'));
  wrap.append(box);
  return wrap;
}

// 인벤토리: 도구(칸을 차지하고 쓰면 사라짐)와 꾸미기(레벨로 열림). 칸을 고르면 아래 설명 칸에 이름·장절·설명과 손에 들기 버튼이 나온다.
const INV_TABS = [{ id: 'tool', name: '도구' }, { id: 'look', name: '꾸미기' }];
function inventoryView(state, ctx) {
  const lv = levelOf(state.xp).level;
  const heldId = () => state.earthLook?.item ?? 'none'; // 손에 들면 바뀌므로 그릴 때마다 읽는다
  const wrap = el('div', 'inv');
  const cats = el('div', 'inv__cats');
  const box = el('div', 'codex__box');
  let picked = null;

  const detail = (it) => {
    const d = el('div', 'inv__detail');
    if (!it) {
      d.append(el('p', 'inv__hint', ctx.kind === 'tool'
        ? '도구는 도전이 있는 스테이지 앞부분에서 얻어요. 쓸 곳에서 다 쓰면 사라져요.'
        : '꾸미기는 레벨이 오르면 하나씩 열려요. 칸을 고르면 손에 들 수 있어요.'));
      return d;
    }
    const icon = el('span', 'inv__bigicon');
    icon.innerHTML = ITEM_ICONS[it.id];
    const text = el('div', 'inv__text');
    text.append(el('p', 'inv__name', it.name), el('p', 'codex__ref', it.ref), el('p', 'inv__note', it.note));
    const act = el('div', 'inv__actions');
    const owned = it.kind === 'tool' ? state.items.tools.includes(it.id) : ownsLook(state, it.id);
    if (!owned) act.append(el('p', 'inv__lock', `Lv.${it.level}에 열려요`));
    else if (ctx.onHold) {
      const isHeld = heldId() === it.id;
      const hold = button('btn inv__hold', isHeld ? '손에 든 중' : '손에 들기', () => { ctx.onHold(it.id); render(); });
      hold.disabled = isHeld;
      act.append(hold);
      if (isHeld) act.append(button('btn btn--quiet inv__hold', '내려놓기', () => { ctx.onHold('none'); render(); }));
    }
    d.append(icon, text, act);
    return d;
  };

  const slot = (it, owned) => {
    const b = button('slot', '', () => { picked = it.id; render(); });
    b.dataset.state = owned ? 'owned' : 'locked';
    b.setAttribute('aria-pressed', String(picked === it.id));
    if (heldId() === it.id) b.dataset.held = '';
    const icon = el('span', 'slot__icon');
    icon.innerHTML = ITEM_ICONS[it.id];
    b.append(icon, el('span', 'slot__name', owned ? it.name : `Lv.${it.level}`));
    if (heldId() === it.id) b.append(el('span', 'slot__badge', '손에 든 중'));
    return b;
  };

  const render = (dir = 0) => {
    const view = el('div', 'codex__page');
    const head = el('p', 'codex__count');
    let grid;
    if (ctx.kind === 'tool') {
      const slots = slotsAt(lv);
      head.append(el('span', 'codex__countname', '도구'), el('span', 'codex__countnum', `${state.items.tools.length} / ${slots}칸`));
      grid = el('div', 'slots');
      for (let k = 0; k < slots; k++) {
        const it = ITEMS.find((i) => i.id === state.items.tools[k]);
        grid.append(it ? slot(it, true) : el('span', 'slot slot--empty'));
      }
    } else {
      const looks = ITEMS.filter((i) => i.kind === 'look');
      head.append(el('span', 'codex__countname', '꾸미기'), el('span', 'codex__countnum', `${looks.filter((i) => ownsLook(state, i.id)).length} / ${looks.length}`));
      grid = el('div', 'slots');
      for (const it of looks) grid.append(slot(it, ownsLook(state, it.id)));
    }
    view.append(head, grid, detail(ITEMS.find((i) => i.id === picked && i.kind === ctx.kind)));
    swap(box, view, dir);
  };

  for (const c of INV_TABS) {
    const b = button('chip', c.name, () => {
      if (c.id === ctx.kind) return;
      const dir = c.id === 'look' ? 1 : -1;
      ctx.kind = c.id;
      picked = null;
      cats.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      pop(b);
      render(dir);
    });
    b.setAttribute('aria-pressed', String(c.id === ctx.kind));
    cats.append(b);
  }
  wrap.append(cats, box);
  render();
  return wrap;
}

// 도감 한 장(스테이지)의 한 분류, 한 페이지. 페이지마다 PAGE칸.
export const PAGE = 6;
const BOOK_CHAPTERS = CHAPTERS.filter((ch) => CODEX.some((c) => c.stage === ch.id));
function codexCell(state, c, no) {
  const st = codexState(state, c);
  const li = el('li', 'codex__cell');
  li.dataset.state = st;
  li.append(el('p', 'codex__no', `No.${String(no).padStart(3, '0')}`));
  if (st === 'met') {
    li.append(el('p', 'codex__name', c.name), el('p', 'codex__fact', c.fact), el('p', 'codex__ref', c.ref), el('p', 'codex__memo', c.memo));
  } else if (st === 'missed') {
    const where = CHAPTERS.find((ch) => ch.id === c.stage)?.title ?? '';
    li.append(el('p', 'codex__name', '? ? ?'), el('p', 'codex__fact', `${where}에서 다시 찾아보세요`));
  } else {
    li.append(el('p', 'codex__name', '?'));
  }
  return li;
}

let open = null;
export const menuIsOpen = () => !!open;

// opts.only: 'codex'면 첫 화면처럼 도감만 연다. opts.stage: 처음 펼칠 장 id.
export function openMenu(state, { tab = 'status', only = null, stage = null, onHold = null } = {}) {
  if (open) return open.promise;
  const box = $('menuBox');
  const tabsEl = $('menuTabs');
  const body = $('menuBody');
  const TABS = only ? [] : [{ id: 'status', name: '상태' }, { id: 'inventory', name: '인벤토리' }, { id: 'codex', name: '도감' }];
  const inv = { kind: 'tool', onHold };
  if (only) tab = only;
  let chapter = Math.max(0, BOOK_CHAPTERS.findIndex((ch) => ch.id === stage));
  let cat = 'person', page = 0;


  // 탭 막대는 한 번만 만들고, 고른 탭과 밑줄 막대만 옮긴다(막대가 미끄러져 옮겨 간다).
  tabsEl.hidden = !TABS.length;
  $('menuTitle').hidden = !only;
  if (TABS.length) {
    tabsEl.replaceChildren(...TABS.map((t) => {
      const b = button('tab', t.name, () => setTab(t.id));
      b.setAttribute('role', 'tab');
      b.dataset.id = t.id;
      return b;
    }));
    const line = el('span', 'look__tabline');
    line.style.setProperty('--tabs', TABS.length);
    tabsEl.append(line);
  }
  const paintTabs = () => {
    tabsEl.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === tab)));
    const line = tabsEl.querySelector('.look__tabline');
    if (line) line.style.transform = `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)`;
  };

  let codexBox = null;
  const codexBody = (dir) => {
    const ch = BOOK_CHAPTERS[chapter];
    const entries = CODEX.filter((c) => c.stage === ch.id && c.id.startsWith(`${cat}/`));
    const pages = Math.max(1, Math.ceil(entries.length / PAGE));
    page = Math.min(page, pages - 1);
    const view = el('div', 'codex__page');
    const count = el('p', 'codex__count');
    const met = entries.filter((c) => state.codex[c.id]).length;
    count.append(el('span', 'codex__countname', CODEX_TABS.find((t) => t.id === cat).name), el('span', 'codex__countnum', `${met} / ${entries.length}`));
    view.append(count);
    if (!entries.length) view.append(el('p', 'codex__empty', '이 장에는 아직 이 분류의 항목이 없어요.'));
    else {
      const grid = el('ul', 'codex__grid');
      const first = page * PAGE;
      entries.slice(first, first + PAGE).forEach((c, i) => grid.append(codexCell(state, c, first + i + 1)));
      view.append(grid);
    }
    if (pages > 1) {
      const pager = el('div', 'pager pager--page');
      const prev = button('pager__btn pager__btn--prev', '', () => { page--; codexBody(-1); }, '이전 페이지');
      const next = button('pager__btn pager__btn--next', '', () => { page++; codexBody(1); }, '다음 페이지');
      prev.disabled = page === 0;
      next.disabled = page === pages - 1;
      const dots = el('span', 'pager__dots');
      dots.setAttribute('role', 'img');
      dots.setAttribute('aria-label', `${page + 1} / ${pages} 페이지`);
      for (let k = 0; k < pages; k++) dots.append(el('span', k === page ? 'pager__dot is-on' : 'pager__dot'));
      pager.append(prev, dots, next);
      view.append(pager);
    }
    swap(codexBox, view, dir);
  };

  const codexView = () => {
    const wrap = el('div', 'codex');
    // 장 넘기기: 성경 순서대로 장마다 도감이 나뉜다.
    const ch = BOOK_CHAPTERS[chapter];
    const bookPager = el('div', 'pager pager--book');
    const prev = button('pager__btn pager__btn--prev', '', () => { chapter--; page = 0; render(-1); }, '이전 장');
    const next = button('pager__btn pager__btn--next', '', () => { chapter++; page = 0; render(1); }, '다음 장');
    prev.disabled = chapter === 0;
    next.disabled = chapter === BOOK_CHAPTERS.length - 1;
    const label = el('p', 'pager__label');
    label.append(el('span', 'pager__title', ch.title), el('span', 'pager__range', ch.range));
    bookPager.append(prev, label, next);
    const cats = el('div', 'codex__cats');
    for (const c of CODEX_TABS) {
      const b = button('chip', c.name, () => {
        if (c.id === cat) return;
        const dir = Math.sign(CODEX_TABS.findIndex((t) => t.id === c.id) - CODEX_TABS.findIndex((t) => t.id === cat));
        cat = c.id;
        page = 0;
        cats.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        pop(b);
        codexBody(dir);
      });
      b.setAttribute('aria-pressed', String(c.id === cat));
      cats.append(b);
    }
    codexBox = el('div', 'codex__box');
    wrap.append(bookPager, cats, codexBox);
    codexBody(0);
    return wrap;
  };

  const render = (dir = 0) => {
    paintTabs();
    const view = tab === 'status' ? statusView(state) : tab === 'inventory' ? inventoryView(state, inv) : codexView();
    swap(body, view, dir);
  };
  const setTab = (id) => {
    if (id === tab) return;
    const dir = Math.sign(TABS.findIndex((t) => t.id === id) - TABS.findIndex((t) => t.id === tab));
    tab = id;
    render(dir);
  };

  box.hidden = false;
  render();
  (tabsEl.querySelector('[aria-selected="true"]') ?? $('menuClose')).focus({ preventScroll: true });
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  const close = () => {
    box.hidden = true;
    removeEventListener('keydown', onKey, true);
    open = null;
    resolve();
  };
  const onKey = (e) => {
    if (e.code === 'Escape' || (e.code === 'KeyM' && !only)) { e.preventDefault(); e.stopPropagation(); close(); }
  };
  addEventListener('keydown', onKey, true);
  $('menuClose').onclick = close;
  box.onclick = (e) => { if (e.target === box) close(); };
  open = { promise };
  return promise;
}
