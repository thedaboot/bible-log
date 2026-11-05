// 메뉴: 상태 창(레벨, 성령의 열매 레이더 차트, 닮은 인물)과 도감(장별 페이지, 다섯 분류, 칸마다 세 상태).
// 게임 중에는 걷는 중에만 열고, 첫 화면에서는 도감만 연다. 규칙은 docs/standards/ui.md "메뉴".
import { $, isTouch, hideModal } from './ui.js';
import { SPIRIT, SPIRIT_STAGES, slotsAt, CODEX_TITLES } from './data/growth.js';
import { CODEX, CODEX_TABS } from './data/codex.js';
import { CHAPTERS } from './data/chapters.js';
import { josa } from './text.js';
import { levelOf, stageOf, likeness, codexState, ownsLook } from './growth.js';
import { TALENT, ITEM_ICONS, CODEX_ICONS, HAIR_ICONS } from './icons.js';
import { CODEX_ART } from './codex-art.js';
import { ITEMS, SHOP, SLOTS, SLOT_KEY, slotOf } from './data/items.js';

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
// 설명 패널(인벤토리·상점·도감 공용, 2026-11-03 F03·F04): 머리줄(큰 그림, 이름, 꼬리표) 아래에 설명을 패널 폭 가득 쓴다.
// 좁은 글 칸에 몰아 쓰던 것을 풀어 줄바꿈을 줄인다. tags: [글자, 종류('slot'|'ok'|'lock')]
function detailHead(iconSvg, name, tags = [], ref = null) {
  const head = el('div', 'inv__head');
  const icon = el('span', 'inv__bigicon');
  icon.innerHTML = iconSvg ?? '';
  const t = el('div', 'inv__title');
  t.append(el('p', 'inv__name', name));
  const row = el('p', 'inv__tags');
  for (const [text, kind] of tags) row.append(el('span', `tag tag--${kind}`, text));
  if (ref) row.append(el('span', 'codex__ref', ref));
  if (row.childNodes.length) t.append(row);
  head.append(icon, t);
  return head;
}
// 아무것도 고르지 않았을 때: 얻는 길을 한 줄씩(꼬리표 + 설명)
function howList(rows, foot) {
  const box = el('div', 'inv__how');
  for (const [tag, text] of rows) {
    const r = el('p', 'inv__howrow');
    r.append(el('span', 'tag tag--slot', tag), el('span', null, text));
    box.append(r);
  }
  if (foot) box.append(el('p', 'inv__howfoot', foot));
  return box;
}
// 스테이지 번호(1-4, 샛길): 잠긴 대표 소품이 어디서 열리는지 짧게
const MAIN = CHAPTERS.filter((c) => !c.side && c.id !== 'heaven');
const stageLabel = (id) => { const c = CHAPTERS.find((x) => x.id === id); return !c ? '' : c.side ? '샛길' : `1-${MAIN.indexOf(c) + 1}`; };

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
// key를 주면 누른 뒤 창을 다시 그려도 포커스를 같은 key의 버튼으로 돌려준다(키보드만으로 조작, ui.md "키보드").
const button = (cls, text, onClick, label, key) => {
  const b = el('button', cls, text);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  if (key) b.dataset.key = key;
  b.onclick = (e) => { onClick(e); if (key) refocus(key); };
  return b;
};
function refocus(key) {
  if (document.activeElement && document.activeElement !== document.body && document.activeElement.isConnected) return;
  const ok = (n) => n && !n.disabled;
  const group = key.split(':')[0];
  const t = [document.querySelector(`[data-key="${key}"]`), ...document.querySelectorAll(`[data-key^="${group}:"]`), document.querySelector('.slot[aria-pressed="true"]')].find(ok);
  t?.focus({ preventScroll: true });
}

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
  t.append(i, ...(name ? [el('p', 'stat__name', name)] : []), v);
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
  // 도감 완성 칭호(CODEX_TITLES): 월드 도감을 다 채우면 이름 아래에 붙는다
  for (const [w, t] of Object.entries(CODEX_TITLES)) if (state.claimed.includes(`${w}/codex`)) who.append(el('p', 'profile__badge', `${t.title} (${t.ref})`));
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
  stats.append(statTile(TALENT, null, state.talents, '달란트')); // 인벤토리 칸 수는 인벤토리 탭에서 보인다
  wrap.append(card, stats);

  const stages = SPIRIT.map((s) => stageOf(state.spirit[s.id]));
  const fruits = el('section', 'fruits');
  fruits.append(el('p', 'quest__label', '성령의 열매 · 갈 5:22~23'));
  const fig = el('figure', 'radar');
  fig.append(radar(stages));
  fruits.append(fig);
  // 한 줄 요약: 가장 많이 자란 열매. 아홉 칸 표는 화면에서 빼고(레이더와 같은 내용) 화면 읽기용으로만 남긴다.
  const top = Math.max(...stages);
  const grown = SPIRIT.filter((_, i) => stages[i] === top && top > 0).map((s) => s.name);
  fruits.append(el('p', 'fruits__summary', grown.length ? `가장 자란 열매: ${grown.join(', ')} · ${SPIRIT_STAGES[top]}` : '아홉 열매 모두 씨앗이에요. 걸으며 키워 가요.'));
  const list = el('ul', 'fruit-list sr-only');
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
  // F44: 그림·이름·두 열매 꼬리표 머리줄 아래에 그 인물이 한 일(장절)과 닮은 점을 한 줄씩
  if (like) {
    const id = `person/${like.who}`;
    const tags = like.fruits.map((f) => [SPIRIT.find((s) => s.id === f).name, 'slot']);
    box.append(detailHead(CODEX_ART[id], CODEX.find((c) => c.id === id).name, tags, like.ref), el('p', 'inv__fact', like.deed), el('p', 'likeness__text', like.text));
  } else box.append(el('p', 'likeness__text', '열매가 자라면 닮은 성경 인물을 알려 드릴게요.'));
  wrap.append(box);
  return wrap;
}

// 인벤토리: 도구(칸을 차지하고 쓰면 사라짐)와 꾸미기(레벨로 열림). 칸을 고르면 아래 설명 칸에 이름·장절·설명과 손에 들기 버튼이 나온다.
const INV_TABS = [{ id: 'tool', name: '도구' }, { id: 'look', name: '꾸미기' }];
function inventoryView(state, ctx) {
  const lv = levelOf(state.xp).level;
  // 소품은 손·허리·머리 세 자리에 하나씩 단다(data/items.js slot). 달면 바뀌므로 그릴 때마다 읽는다
  const keyOf = (it) => SLOT_KEY[slotOf(it)];
  const worn = (it) => (state.earthLook?.[keyOf(it)] ?? 'none') === it.id;
  const VERB = { hand: ['손에 들기'], waist: ['허리에 차기'], head: ['머리에 쓰기'] };
  const wrap = el('div', 'inv');
  const cats = el('div', 'inv__cats');
  const box = el('div', 'codex__box');
  let picked = null;

  const detail = (it) => {
    const d = el('div', 'inv__detail');
    if (!it) {
      d.append(ctx.kind === 'tool'
        ? howList([['도전', '도전 과제가 있는 스테이지에서 받을 수 있어요'], ['사용', '사용할 곳에서 다 사용되면 사라져요']], '인벤토리는 레벨이 오르면 늘어나요.')
        : howList([['레벨', '레벨을 달성하면 받아요'], ['완료', '스테이지를 완료하면 받아요'], ['상점', '쉼터의 상점에서 달란트로 살 수 있어요']]));
      return d;
    }
    const owned = it.kind === 'tool' ? state.items.tools.includes(it.id) : ownsLook(state, it.id);
    const how = it.level ? `Lv.${it.level}에 열려요` : it.stage ? `${josa(CHAPTERS.find((c) => c.id === it.stage)?.title ?? '', '을', '를')} 완료하면 받아요` : `상점에서 ${it.price} 달란트`;
    const tags = [[it.kind === 'tool' ? '도구' : SLOTS[slotOf(it)], 'slot']];
    if (worn(it)) tags.push(['다는 중', 'ok']);
    else if (!owned) tags.push(['잠김', 'lock']);
    const act = el('div', 'inv__actions');
    if (!owned) act.append(el('p', 'inv__lock', how));
    else if (ctx.onHold) {
      const on = worn(it);
      const [verb] = VERB[slotOf(it)];
      // 다는 중이면 꼬리표('다는 중')가 상태를 보이고, 버튼은 할 수 있는 일 하나만 둔다
      if (on) act.append(button('btn inv__hold', '내려놓기', () => { ctx.onHold('none', keyOf(it)); render(); }, null, 'inv:drop'));
      else act.append(button('btn inv__hold', verb, () => { ctx.onHold(it.id, keyOf(it)); render(); }, null, 'inv:hold'));
    }
    // 아직 못 얻은 꾸미기는 형체만 보인다(2026-11-03 사용자 F27 "미리보기도 안 되게, 형체만"). 이름·장절·설명도 얻은 뒤에 보인다
    if (!owned) { d.classList.add('is-locked'); d.append(detailHead(ITEM_ICONS[it.id], '? ? ?', tags), act); return d; }
    d.append(detailHead(ITEM_ICONS[it.id], it.name, tags, it.ref), el('p', 'inv__note', it.note), act);
    return d;
  };

  const slot = (it, owned) => {
    const b = button('slot', '', () => { picked = it.id; render(); }, null, `slot:${it.id}`);
    b.dataset.state = owned ? 'owned' : 'locked';
    b.setAttribute('aria-pressed', String(picked === it.id));
    if (worn(it)) b.dataset.held = '';
    const icon = el('span', 'slot__icon');
    icon.innerHTML = ITEM_ICONS[it.id];
    // 잠긴 칸: 여는 길(레벨·스테이지·상점)을 짧게
    b.append(icon, el('span', 'slot__name', owned ? it.name : it.level ? `Lv.${it.level}` : it.stage ? `${stageLabel(it.stage)} 완료` : '상점'));
    if (worn(it)) b.append(el('span', 'slot__badge', SLOTS[slotOf(it)]));
    return b;
  };

  const render = (dir = 0) => {
    const view = el('div', 'codex__page');
    const head = el('p', 'codex__count');
    let grid;
    if (ctx.kind === 'tool') {
      const slots = slotsAt(lv);
      head.append(el('span', 'codex__countname', '도구'), el('span', 'codex__countnum', `${state.items.tools.length} / ${slots}`));
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
// 도감 칸(2026-11-02 S25·S26): 글 대신 분류 그림을 크게, 이름만 아래에. 만난 칸을 누르면 아래 설명 칸에 사실·장절·메모가 나온다.
function codexCell(state, c, no, picked, onPick) {
  const st = codexState(state, c);
  const li = el('li', 'codex__item');
  const b = button('codex__cell', '', () => onPick(c.id), null, `dex:${c.id}`);
  b.dataset.state = st;
  b.setAttribute('aria-pressed', String(picked === c.id));
  const pic = el('span', 'codex__pic');
  pic.innerHTML = st === 'met' ? artOf(c) : CODEX_ICONS[c.id.split('/')[0]] ?? '';
  b.append(el('span', 'codex__no', String(no).padStart(3, '0')), pic, el('span', 'codex__name', st === 'met' ? c.name : st === 'missed' ? '? ? ?' : '?'));
  if (st !== 'met') b.setAttribute('aria-label', st === 'missed' ? '놓친 항목' : '아직 못 만난 항목');
  li.append(b);
  return li;
}
// 항목 그림(codex-art.js, F02). 없으면 분류 그림
const artOf = (c) => CODEX_ART[c.id] ?? CODEX_ICONS[c.id.split('/')[0]] ?? '';
// 고른 항목의 설명: 만난 항목은 이름·사실·장절·메모, 놓친 칸은 다시 찾을 곳
function codexDetail(state, c) {
  const d = el('div', 'inv__detail codex__detail');
  const st = codexState(state, c);
  const pic = st === 'met' ? artOf(c) : CODEX_ICONS[c.id.split('/')[0]];
  if (st === 'met') d.append(detailHead(pic, c.name, [], c.ref), el('p', 'inv__fact', c.fact), el('p', 'codex__memo', c.memo));
  else if (st === 'missed') d.append(detailHead(pic, '? ? ?', [['놓침', 'lock']]), el('p', 'inv__note', `${CHAPTERS.find((ch) => ch.id === c.stage)?.title ?? ''}에서 다시 찾아보세요.`));
  else d.append(detailHead(pic, '?'), el('p', 'inv__note', '이야기를 걸으며 만나 보세요.'));
  return d;
}

let open = null;
export const menuIsOpen = () => !!open;

// 상점(쉼터의 상점 천사): 달란트로 꾸미기를 산다. 칸과 설명 칸은 인벤토리와 같은 모양이다.
function shopView(state, ctx) {
  const wrap = el('div', 'inv');
  const purse = el('p', 'shop__purse');
  const icon = el('span', 'shop__coin');
  icon.innerHTML = TALENT;
  purse.append(el('span', 'shop__greet', '하늘의 달란트로 꾸미기를 살 수 있어요.'), icon, el('span', 'stat__num', state.talents), el('span', 'stat__unit', '달란트'));
  const box = el('div', 'codex__box');
  let picked = null;
  const render = () => {
    purse.querySelector('.stat__num').textContent = state.talents;
    const view = el('div', 'codex__page');
    const grid = el('div', 'slots');
    for (const it of SHOP) {
      const owned = ownsLook(state, it.id);
      const b = button('slot', '', () => { picked = it.id; render(); }, null, `slot:${it.id}`);
      b.dataset.state = owned ? 'owned' : 'sale';
      b.setAttribute('aria-pressed', String(picked === it.id));
      const ic = el('span', 'slot__icon');
      ic.innerHTML = ITEM_ICONS[it.id] ?? HAIR_ICONS[it.id];
      b.append(ic, el('span', 'slot__name', it.name), el('span', 'slot__price', owned ? '가짐' : `${it.price}`));
      grid.append(b);
    }
    const it = SHOP.find((i) => i.id === picked);
    const d = el('div', 'inv__detail');
    if (!it) d.append(howList([['고르기', '물건을 누르면 설명과 값이 나와요'], ['달기', '산 소품은 인벤토리에서, 머리·옷은 바로 입어요']]));
    else {
      const act = el('div', 'inv__actions');
      const owned = ownsLook(state, it.id);
      const kind = it.kind === 'hair' ? '머리 모양' : it.kind === 'outfit' ? '옷' : SLOTS[slotOf(it)];
      // 버튼은 값만 보인다(2026-11-03 사용자 F37 "~달란트로 사기보다는 ~달란트만"). 화면 읽기는 "60 달란트로 사기"
      const buy = button('btn inv__hold shop__buy', owned ? '가짐' : '', () => { if (ctx.onBuy(it.id)) render(); }, owned ? null : `${it.price} 달란트로 사기`, 'shop:buy');
      if (!owned) { const coin = el('span', 'shop__buycoin'); coin.innerHTML = TALENT; buy.append(coin, el('span', 'shop__buynum', it.price), el('span', 'stat__unit', '달란트')); }
      buy.disabled = owned || state.talents < it.price;
      act.append(buy);
      if (!owned && state.talents < it.price) act.append(el('p', 'inv__lock', `${it.price - state.talents} 달란트 모자라요`));
      d.append(detailHead(ITEM_ICONS[it.id] ?? HAIR_ICONS[it.id], it.name, [[kind, 'slot'], ...(owned ? [['가짐', 'ok']] : [])], it.ref), el('p', 'inv__note', it.note), act);
    }
    view.append(grid, d);
    swap(box, view, 0);
  };
  wrap.append(purse, box);
  render();
  return wrap;
}

// opts.only: 'codex'면 첫 화면처럼 도감만, 'shop'이면 상점만 연다. opts.stage: 처음 펼칠 장 id.
export function openMenu(state, { tab = 'status', only = null, stage = null, onHold = null, onBuy = null, onQuit = null } = {}) {
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
  $('menuTitle').textContent = only === 'shop' ? '하늘 상점' : '바이블로그 도감';
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
  let dexPick = null; // 도감에서 고른 칸(설명 칸에 보인다)
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
      const onPick = (id) => { dexPick = id; codexBody(0); };
      entries.slice(first, first + PAGE).forEach((c, i) => grid.append(codexCell(state, c, first + i + 1, dexPick, onPick)));
      view.append(grid);
    }
    if (pages > 1) {
      const pager = el('div', 'pager pager--page');
      const prev = button('pager__btn pager__btn--prev', '', () => { page--; codexBody(-1); }, '이전 페이지', 'page:prev');
      const next = button('pager__btn pager__btn--next', '', () => { page++; codexBody(1); }, '다음 페이지', 'page:next');
      prev.disabled = page === 0;
      next.disabled = page === pages - 1;
      const dots = el('span', 'pager__dots');
      dots.setAttribute('role', 'img');
      dots.setAttribute('aria-label', `${page + 1} / ${pages} 페이지`);
      for (let k = 0; k < pages; k++) dots.append(el('span', k === page ? 'pager__dot is-on' : 'pager__dot'));
      pager.append(prev, dots, next);
      view.append(pager);
    }
    // F45: 고른 칸이 있을 때만 설명 패널을 페이지 넘기기 아래에 둔다(안내 문구 칸은 없앴다). 고르면 페이지 넘기기가 밀려 내려가지 않는다
    const c = entries.slice(page * PAGE, page * PAGE + PAGE).find((x) => x.id === dexPick);
    if (c) view.append(codexDetail(state, c));
    swap(codexBox, view, dir);
  };

  const codexView = () => {
    const wrap = el('div', 'codex');
    // 장 넘기기: 성경 순서대로 장마다 도감이 나뉜다.
    const ch = BOOK_CHAPTERS[chapter];
    const bookPager = el('div', 'pager pager--book');
    const prev = button('pager__btn pager__btn--prev', '', () => { chapter--; page = 0; render(-1); }, '이전 장', 'book:prev');
    const next = button('pager__btn pager__btn--next', '', () => { chapter++; page = 0; render(1); }, '다음 장', 'book:next');
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
    if (!isTouch()) wrap.append(el('p', 'codex__keys', `${TABS.length ? 'Q·E 탭 · ' : ''}←·→ 페이지 · ↑·↓ 분류 · [·] 장`));
    codexBody(0);
    return wrap;
  };

  const render = (dir = 0) => {
    paintTabs();
    const view = tab === 'status' ? statusView(state) : tab === 'inventory' ? inventoryView(state, inv) : tab === 'shop' ? shopView(state, { onBuy }) : codexView();
    swap(body, view, dir);
  };
  const setTab = (id) => {
    if (id === tab) return;
    const dir = Math.sign(TABS.findIndex((t) => t.id === id) - TABS.findIndex((t) => t.id === tab));
    tab = id;
    render(dir);
  };

  box.classList.remove('is-closing');
  box.hidden = false;
  render();
  (tabsEl.querySelector('[aria-selected="true"]') ?? body.querySelector('.slot, .chip') ?? $('menuClose')).focus({ preventScroll: true });
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  const close = () => {
    hideModal(box);
    removeEventListener('keydown', onKey, true);
    open = null;
    resolve();
  };
  // 키보드: Q·E(탭에 포커스가 있으면 ←·→도)로 탭을 옮긴다. 도감에서는 ←·→ 페이지, ↑·↓ 분류, [·] 장.
  // 도감에서는 탭에 포커스가 있어도 ←·→가 페이지다(Q·E로 도감에 오면 포커스가 탭에 남는다).
  const onKey = (e) => {
    if (e.code === 'Escape' || e.code === 'KeyM') { e.preventDefault(); e.stopPropagation(); close(); return; }
    const onTab = document.activeElement?.classList.contains('tab');
    const side = e.code === 'ArrowRight' || e.code === 'KeyE' ? 1 : e.code === 'ArrowLeft' || e.code === 'KeyQ' ? -1 : 0;
    if (TABS.length && side && ((onTab && tab !== 'codex') || e.code.startsWith('Key'))) {
      e.preventDefault();
      const k = (TABS.findIndex((t) => t.id === tab) + side + TABS.length) % TABS.length;
      setTab(TABS[k].id);
      tabsEl.querySelector(`[data-id="${TABS[k].id}"]`).focus({ preventScroll: true });
      return;
    }
    if (tab !== 'codex') return;
    const click = (sel) => { const b = body.querySelector(sel); if (b && !b.disabled) { e.preventDefault(); b.click(); } };
    if (e.code === 'ArrowRight') click('.pager--page .pager__btn--next');
    if (e.code === 'ArrowLeft') click('.pager--page .pager__btn--prev');
    if (e.code === 'BracketRight') click('.pager--book .pager__btn--next');
    if (e.code === 'BracketLeft') click('.pager--book .pager__btn--prev');
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault();
      const k = CODEX_TABS.findIndex((t) => t.id === cat) + (e.code === 'ArrowDown' ? 1 : -1);
      body.querySelectorAll('.codex__cats .chip')[(k + CODEX_TABS.length) % CODEX_TABS.length]?.click();
    }
  };
  addEventListener('keydown', onKey, true);
  $('menuClose').onclick = close;
  // 스테이지 중에만: 메뉴 아래 '쉼터로 나가기'(F26). 메뉴를 닫은 뒤 확인 창을 띄운다
  box.querySelector('.menu-panel__quit')?.remove();
  if (onQuit) {
    const q = button('btn btn--quiet menu-panel__quit', '쉼터로 나가기', () => { close(); onQuit(); }, null, 'menu:quit');
    box.querySelector('.menu-panel').append(q);
  }
  box.onclick = (e) => { if (e.target === box) close(); };
  open = { promise };
  return promise;
}
