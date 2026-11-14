// 기록장: 성장(레벨, 성령의 열매 나무, 닮은 인물), 소지품, 도감(장별 쪽, 다섯 갈래, 항목마다 세 상태), 그리고 상점.
// 게임 중에는 걷는 중에만 열고, 첫 화면에서는 도감만 연다. 규칙은 docs/standards/ui.md "메뉴".
import { $, isTouch, hideModal } from './ui.js';
import { SPIRIT, SPIRIT_STAGES, slotsAt, CODEX_TITLES } from './data/growth.js';
import { CODEX, CODEX_TABS } from './data/codex.js';
import { CHAPTERS } from './data/chapters.js';
import { josa } from './text.js';
import { levelOf, stageOf, likeness, codexState, ownsLook } from './growth.js';
import { glyph, sprout, codexGlyph } from './glyphs.js'; // 선 아이콘(화면의 그림은 모두 glyphs.js에서 나온다)
import { ITEMS, SHOP, SLOTS, SLOT_KEY, slotOf } from './data/items.js';

const COIN = glyph('coin');
// 도감 항목의 그림: 그 항목의 뜻을 읽을 수 있는 공용 그림(glyphs.js CODEX_GLYPH). 아직 만나지 않은 항목은 갈래 그림만 보인다
const artOf = (c) => codexGlyph(c.id);
const kindArt = (c) => glyph('', c.id.split('/')[0]);

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
  // 같은 화면을 다시 그릴 때(칸을 고를 때)는 칸 목록의 스크롤 자리를 지킨다(2026-11-05 F54: 아래 칸을 누르면 맨 위로 돌아갔다)
  const keep = dir ? 0 : node.querySelector('.slots')?.scrollTop ?? 0;
  node.replaceChildren(view);
  if (keep) { const g = view.querySelector('.slots'); if (g) g.scrollTop = keep; }
  // 고른 칸이 설명 패널이 커지며 목록 아래로 가려지면 보이는 데까지만 올린다
  if (!dir) view.querySelector('.slots .slot[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
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

// 가지 끝 자리(가로 100 × 세로 78): 줄기 하나에 가지가 세 단으로 뻗는다. 한 단에 셋(왼쪽·줄기 위·오른쪽)이라
// 싹 그림·이름·누르는 자리가 어느 폭에서도 서로 가리지 않는다(시안에서 일곱 크기로 확인한 배치).
const TWIG = [[16, 14], [50, 9], [84, 14], [16, 38], [50, 33], [84, 38], [16, 62], [50, 57], [84, 62]];
// 성장(2026-11-14, 예전 상태 창): 나는 누구인가(레벨 고리·칭호·이름·경험치·달란트) → 무엇이 자랐나(열매 나무) → 누구를 닮았나.
// 레이더 차트를 세 단 가지의 나무로 바꿨다. 열매의 뜻풀이는 지어 넣지 않는다(이름, 개역개정 낱말, 단계만).
function statusView(state) {
  const lv = levelOf(state.xp);
  const wrap = el('div', 'me menu-status');

  const id = el('section', 'me__id');
  const ring = el('div', 'me__ring');
  ring.setAttribute('role', 'img');
  ring.setAttribute('aria-label', `레벨 ${lv.level}, 경험치 ${lv.into} / ${lv.need}`);
  const c = 2 * Math.PI * 21;
  ring.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="me__track" cx="24" cy="24" r="21"/><circle class="me__fill" cx="24" cy="24" r="21" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - lv.into / lv.need)}"/></svg>`;
  ring.append(el('small', null, '레벨'), el('b', null, lv.level));
  const who = el('div', 'me__who');
  who.append(el('p', 'label', lv.title));
  // 도감 완성 칭호(CODEX_TITLES): 월드 도감을 다 채우면 칭호 곁에 붙는다
  for (const [w, t] of Object.entries(CODEX_TITLES)) if (state.claimed.includes(`${w}/codex`)) who.append(el('p', 'label me__badge', `${t.title} (${t.ref})`));
  who.append(el('h3', 'me__name', state.name || '관찰자'));
  const facts = el('p', 'me__facts');
  const fact = (name, value) => { const s = el('span', null, `${name} `); s.append(el('b', null, value)); return s; };
  facts.append(fact('경험치', `${lv.into} / ${lv.need}`), fact('다음 레벨까지 경험치', lv.need - lv.into), fact('달란트', state.talents));
  who.append(facts);
  id.append(ring, who);
  wrap.append(id);

  const stages = SPIRIT.map((s) => stageOf(state.spirit[s.id]));
  const top = Math.max(...stages);
  let pick = Math.max(0, stages.indexOf(top)); // 처음에는 가장 자란 열매를 고른다
  const grove = el('section', 'grove');
  const head = el('div', 'grove__head');
  head.append(el('h3', 'label', '성령의 열매'), el('span', 'verse', '갈 5:22~23'));
  const tree = el('div', 'tree');
  const twigs = SPIRIT.map((_, i) => { const [x, y] = TWIG[i]; return x === 50 ? '' : `<path class="tree__twig" vector-effect="non-scaling-stroke" data-stage="${stages[i]}" d="M50 ${y + 13}C${50 + (x - 50) * 0.45} ${y + 13} ${x + (50 - x) * 0.3} ${y + 8} ${x} ${y}"/>`; }).join('');
  tree.innerHTML = `<svg viewBox="0 0 100 78" preserveAspectRatio="none" aria-hidden="true"><path class="tree__ground" vector-effect="non-scaling-stroke" d="M34 77c6-1.5 26-1.5 32 0"/><path class="tree__trunk" vector-effect="non-scaling-stroke" d="M50 77V9"/>${twigs}</svg>`;
  const about = el('div', 'grove__about');
  about.setAttribute('aria-live', 'polite');
  const paint = () => {
    const s = SPIRIT[pick], st = stages[pick];
    const name = el('p', 'grove__name', s.name);
    if (s.old !== s.name) name.append(el('small', null, `개역개정 ${s.old}`));
    const steps = el('p', 'grove__steps');
    steps.setAttribute('role', 'img');
    steps.setAttribute('aria-label', `${SPIRIT_STAGES[st]} 단계`);
    SPIRIT_STAGES.forEach((w, k) => steps.append(el('span', k === st ? 'is-now' : k < st ? 'is-past' : '', w)));
    about.replaceChildren(name, steps, el('p', 'grove__text', st < SPIRIT_STAGES.length - 1 ? `다음 단계: ${SPIRIT_STAGES[st + 1]}` : ''));
    tree.querySelectorAll('.bud').forEach((b, i) => b.setAttribute('aria-pressed', String(i === pick)));
  };
  SPIRIT.forEach((s, i) => {
    const [x, y] = TWIG[i];
    const b = button('bud', '', () => { pick = i; paint(); }, `${s.name}, ${SPIRIT_STAGES[stages[i]]}`, `fruit:${s.id}`);
    b.dataset.stage = stages[i];
    b.style.left = `${x}%`;
    b.style.top = `${(y / 78) * 100}%`;
    b.innerHTML = sprout(stages[i]);
    b.append(el('span', null, s.name));
    tree.append(b);
  });
  paint();
  // 한 줄 요약: 가장 많이 자란 열매
  const grown = SPIRIT.filter((_, i) => stages[i] === top && top > 0).map((s) => s.name);
  grove.append(head, tree, about, el('p', 'grove__top fruits__summary', grown.length ? `가장 자란 열매: ${grown.join(', ')} · ${SPIRIT_STAGES[top]}` : '아홉 열매 모두 씨앗이에요. 걸으며 키워 가요.'));
  wrap.append(grove);

  const like = likeness(state);
  const box = el('section', 'like likeness');
  box.append(el('p', 'label', '닮은 인물'));
  // F44: 이름·두 열매 꼬리표·장절 아래에 그 인물이 한 일과 닮은 점을 한 줄씩
  if (like) {
    const tags = el('p', 'like__tags');
    for (const f of like.fruits) { const t = el('span', 'state'); t.dataset.s = 'on'; t.innerHTML = glyph('leaf'); t.append(SPIRIT.find((s) => s.id === f).name); tags.append(t); }
    tags.append(el('span', 'verse', like.ref));
    box.append(el('h3', 'like__name', CODEX.find((x) => x.id === `person/${like.who}`).name), tags, el('p', 'inv__fact', like.deed), el('p', 'likeness__text', like.text));
  } else box.append(el('p', 'likeness__text', '열매가 자라면 닮은 성경 인물을 알려 드릴게요.'));
  wrap.append(box);
  return wrap;
}
// 이름이 한 줄에 들어가지 않으면 두 줄로 고르게 나눈다: 가운데에 가까운 띄어쓰기가 있으면 거기서, 없으면 글자 수의 가운데에서.
// 글자를 자르거나 줄이지 않는다(끝에 한 글자만 남지 않게). 화면에 붙은 뒤에 잰다. 낭독기에는 이름 전체를 한 번에 읽힌다
function twoLines(node) {
  const text = node.textContent;
  const lh = parseFloat(getComputedStyle(node).lineHeight);
  if (!lh || node.getBoundingClientRect().height < lh * 1.5) return;
  const ch = [...text], mid = ch.length / 2;
  const gaps = ch.map((x, i) => (x === ' ' ? i : -1)).filter((i) => i > 0 && Math.abs(i - mid) <= ch.length * 0.25).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  const at = gaps.length ? gaps[0] : Math.ceil(mid);
  node.replaceChildren(ch.slice(0, at).join('').trim(), document.createElement('br'), ch.slice(at).join('').trim());
  node.setAttribute('aria-label', text);
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
  // 내 모습 무대: 걷는 인물과 같은 인물을 세운다(main.js가 만들어 준다). 지상 모습을 아직 고르지 않았으면 두지 않는다
  const stage = el('div', 'model');
  const model = ctx.mount && state.earthLook ? ctx.mount(stage, state.earthLook) : null;
  stage.hidden = !model;
  const cats = el('div', 'inv__cats');
  const box = el('div', 'codex__box');
  let picked = null;

  const detail = (it) => {
    const d = el('div', 'inv__detail');
    if (!it) {
      d.append(ctx.kind === 'tool'
        ? howList([['도전', '도전 과제가 있는 스테이지에서 받을 수 있어요'], ['사용', '쓸 곳에서 다 쓰면 사라져요']], '도구 자리는 레벨이 오르면 늘어나요.')
        : howList([['레벨', '레벨을 달성하면 받아요'], ['완료', '스테이지를 완료하면 받아요'], ['상점', '쉼터의 상점에서 달란트로 살 수 있어요']]));
      return d;
    }
    const owned = it.kind === 'tool' ? state.items.tools.includes(it.id) : ownsLook(state, it.id);
    const how = it.level ? `레벨 ${it.level}에 열려요` : it.stage ? `${josa(CHAPTERS.find((c) => c.id === it.stage)?.title ?? '', '을', '를')} 완료하면 받아요` : `상점에서 ${it.price} 달란트`;
    const tags = [[it.kind === 'tool' ? '도구' : SLOTS[slotOf(it)], 'slot']];
    if (worn(it)) tags.push(['착용 중', 'ok']);
    else if (!owned) tags.push(['잠김', 'lock']);
    const act = el('div', 'inv__actions');
    if (!owned) act.append(el('p', 'inv__lock', how));
    else if (ctx.onHold) {
      const on = worn(it);
      const [verb] = VERB[slotOf(it)];
      // 착용 중이면 꼬리표('착용 중')가 상태를 보이고, 버튼은 할 수 있는 일 하나만 둔다
      if (on) act.append(button('btn inv__hold', '내려놓기', () => { ctx.onHold('none', keyOf(it)); render(); }, null, 'inv:drop'));
      else act.append(button('btn inv__hold', verb, () => { ctx.onHold(it.id, keyOf(it)); render(); }, null, 'inv:hold'));
    }
    // 아직 못 얻은 꾸미기는 형체만 보인다(2026-11-03 사용자 F27 "미리보기도 안 되게, 형체만"). 이름·장절·설명도 얻은 뒤에 보인다
    if (!owned) { d.classList.add('is-locked'); d.append(detailHead(glyph('lock'), '? ? ?', tags), act); return d; }
    d.append(detailHead(glyph(it.id), it.name, tags, it.ref), el('p', 'inv__note', it.note), act);
    return d;
  };

  const slot = (it, owned) => {
    const b = button('slot', '', () => { picked = it.id; render(); }, null, `slot:${it.id}`);
    b.dataset.state = owned ? 'owned' : 'locked';
    b.setAttribute('aria-pressed', String(picked === it.id));
    if (worn(it)) b.dataset.held = '';
    const icon = el('span', 'slot__icon');
    icon.innerHTML = owned ? glyph(it.id) : glyph('lock'); // 아직 못 얻은 것은 자물쇠만(F27: 형체도 이름도 얻은 뒤에)
    // 잠긴 칸: 여는 길(레벨·스테이지·상점)을 짧게
    b.append(icon, el('span', 'slot__name', owned ? it.name : it.level ? `레벨 ${it.level}` : it.stage ? `${stageLabel(it.stage)} 완료` : '상점'));
    if (worn(it)) b.append(el('span', 'slot__badge', SLOTS[slotOf(it)]));
    return b;
  };

  const render = (dir = 0) => {
    model?.set(state.earthLook); // 들거나 내려놓은 것이 무대의 인물에도 바로 보인다
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
  wrap.append(stage, cats, box);
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
  pic.innerHTML = st === 'met' ? artOf(c) : kindArt(c);
  b.append(el('span', 'codex__no', String(no).padStart(3, '0')), pic, el('span', 'codex__name', st === 'met' ? c.name : st === 'missed' ? '? ? ?' : '?'));
  if (st !== 'met') b.setAttribute('aria-label', st === 'missed' ? '놓친 항목' : '아직 못 만난 항목');
  li.append(b);
  return li;
}
// 고른 항목의 설명: 만난 항목은 이름·사실·장절·메모, 놓친 칸은 다시 찾을 곳
function codexDetail(state, c) {
  const d = el('div', 'inv__detail codex__detail');
  const st = codexState(state, c);
  const pic = st === 'met' ? artOf(c) : kindArt(c);
  if (st === 'met') d.append(detailHead(pic, c.name, [], c.ref), el('p', 'inv__fact', c.fact), el('p', 'codex__memo', c.memo));
  else if (st === 'missed') d.append(detailHead(pic, '? ? ?', [['놓침', 'lock']]), el('p', 'inv__note', `${CHAPTERS.find((ch) => ch.id === c.stage)?.title ?? ''}에서 다시 찾아보세요.`));
  else d.append(detailHead(pic, '?'), el('p', 'inv__note', '이야기를 걸으며 만나 보세요.'));
  return d;
}

let open = null;
export const menuIsOpen = () => !!open;

// 상점(쉼터의 상점 천사): 달란트로 꾸미기를 산다. 칸과 설명 칸은 인벤토리와 같은 모양이다.
function shopView(state, ctx) {
  const wrap = el('div', 'inv shop');
  // 내 모습 무대: 고른 물품을 걷는 인물과 같은 인물에 대 본다(사기 전에는 '입어 보기', 산 뒤에는 입은 모습)
  const stage = el('div', 'model');
  const model = ctx.mount && state.earthLook ? ctx.mount(stage, state.earthLook) : null;
  stage.hidden = !model;
  const keyOfShop = (it) => (it.kind === 'hair' || it.kind === 'outfit' ? it.kind : SLOT_KEY[slotOf(it)]);
  // 입고 있는지: 산 소품은 손·허리·머리 자리에, 머리 모양·옷은 그 항목에 들어간다(main.js 사기)
  const wornNow = (it) => { const k = it.kind === 'hair' || it.kind === 'outfit' ? it.kind : SLOT_KEY[slotOf(it)]; return state.earthLook?.[k] === it.id; };
  const purse = el('p', 'shop__purse');
  const icon = el('span', 'shop__coin');
  icon.innerHTML = COIN;
  purse.append(el('span', 'shop__greet', '달란트로 꾸미기 용품을 살 수 있어요'), icon, el('span', 'stat__num', state.talents), el('span', 'stat__unit', '달란트'));
  const box = el('div', 'codex__box');
  let picked = null;
  const render = () => {
    purse.querySelector('.stat__num').textContent = state.talents;
    const trying = SHOP.find((i) => i.id === picked);
    model?.set(trying ? { ...state.earthLook, [keyOfShop(trying)]: trying.id } : state.earthLook);
    stage.dataset.try = trying && !ownsLook(state, trying.id) ? `입어 보기 · ${trying.name}` : '';
    const view = el('div', 'codex__page');
    const grid = el('div', 'slots');
    for (const it of SHOP) {
      const owned = ownsLook(state, it.id);
      const b = button('slot', '', () => { picked = it.id; render(); }, null, `slot:${it.id}`);
      b.dataset.state = owned ? 'owned' : 'sale';
      if (!owned && state.talents < it.price) b.dataset.short = ''; // 달란트가 모자란 물품: 값이 흐리게 보인다
      b.setAttribute('aria-pressed', String(picked === it.id));
      b.setAttribute('aria-label', owned ? `${it.name}, ${wornNow(it) ? '착용 중' : '가짐'}` : `${it.name}, ${it.price} 달란트`);
      const ic = el('span', 'slot__icon');
      ic.innerHTML = glyph(it.id);
      b.append(ic, el('span', 'slot__name', it.name), el('span', 'slot__price', owned ? (wornNow(it) ? '착용 중' : '가짐') : `${it.price}`));
      grid.append(b);
    }
    const it = SHOP.find((i) => i.id === picked);
    const d = el('div', 'inv__detail');
    if (!it) d.append(howList([['착용', '구매한 소품을 바로 입을 수 있어요']]));
    else {
      const act = el('div', 'inv__actions');
      const owned = ownsLook(state, it.id);
      const kind = it.kind === 'hair' ? '머리 모양' : it.kind === 'outfit' ? '옷' : SLOTS[slotOf(it)];
      // 버튼은 값만 보인다(2026-11-03 사용자 F37 "~달란트로 사기보다는 ~달란트만"). 화면 읽기는 "60 달란트로 사기"
      const buy = button('btn inv__hold shop__buy', owned ? '가짐' : '', () => { if (ctx.onBuy(it.id)) render(); }, owned ? null : `${it.price} 달란트로 사기`, 'shop:buy');
      if (!owned) { const coin = el('span', 'shop__buycoin'); coin.innerHTML = COIN; buy.append(coin, el('span', 'shop__buynum', it.price), el('span', 'stat__unit', '달란트')); }
      buy.disabled = owned || state.talents < it.price;
      act.append(buy);
      d.append(detailHead(glyph(it.id), it.name, [[kind, 'slot'], ...(owned ? [[wornNow(it) ? '착용 중' : '가짐', 'ok']] : [])], it.ref), el('p', 'inv__note', it.note), act);
    }
    view.append(grid, d);
    swap(box, view, 0);
  };
  wrap.append(purse, stage, box);
  render();
  return wrap;
}

// opts.only: 'codex'면 첫 화면처럼 도감만, 'shop'이면 상점만 연다. opts.stage: 처음 펼칠 장 id.
// 기록장(2026-11-14, 예전 메뉴): 성장 · 소지품 · 도감 · 여정. 탭의 id(status·inventory·codex)는 그대로다.
// preview(host, look): 내 모습 무대를 만들어 { set(look), dispose() }를 돌려준다(main.js가 걷는 인물과 같은 팩토리로 만든다).
// onRoute: '여정'을 누르면 기록장을 닫고 부른다(여정 지도를 연다). 없으면 여정 단추를 두지 않는다.
export function openMenu(state, { tab = 'status', only = null, stage = null, onHold = null, onBuy = null, onQuit = null, preview = null, onRoute = null } = {}) {
  if (open) return open.promise;
  const box = $('menuBox');
  const tabsEl = $('menuTabs');
  const body = $('menuBody');
  const TABS = only ? [] : [{ id: 'status', name: '성장' }, { id: 'inventory', name: '소지품' }, { id: 'codex', name: '도감' }];
  // 무대는 화면을 다시 그릴 때와 닫을 때 치운다(작은 3D 화면을 남겨 두지 않는다)
  const stages = [];
  const mount = preview ? (host, look) => { const p = preview(host, look); stages.push(p); return p; } : null;
  const unmount = () => stages.splice(0).forEach((p) => p.dispose());
  const inv = { kind: 'tool', onHold, mount };
  if (only) tab = only;
  let chapter = Math.max(0, BOOK_CHAPTERS.findIndex((ch) => ch.id === stage));
  let cat = 'person', page = 0;


  // 탭 막대는 한 번만 만들고, 고른 탭과 밑줄 막대만 옮긴다(막대가 미끄러져 옮겨 간다).
  tabsEl.hidden = !TABS.length;
  $('menuTitle').hidden = false; // 벽의 머리줄: 갈래가 있으면 지금 갈래의 이름(paintTabs), 없으면 상점·도감의 이름
  $('menuTitle').textContent = only === 'shop' ? '천국 상점' : '바이블로그 도감';
  box.dataset.only = only ?? '';
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
    // 여정: 갈래가 아니라 여정 지도로 가는 길이다(Q·E로 도는 갈래에는 넣지 않는다)
    if (onRoute) {
      const r = button('tab tab--route', '여정', () => { close(); onRoute(); });
      r.dataset.id = 'route';
      tabsEl.append(r);
    }
  }
  const paintTabs = () => {
    if (TABS.length) $('menuTitle').textContent = TABS.find((t) => t.id === tab).name;
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
    unmount();
    const view = tab === 'status' ? statusView(state) : tab === 'inventory' ? inventoryView(state, inv) : tab === 'shop' ? shopView(state, { onBuy, mount }) : codexView();
    body.dataset.tab = tab; // 갈래마다 배치가 다르다(record.css)
    swap(body, view, dir);
    body.querySelectorAll('.me__name').forEach(twoLines);
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
    unmount();
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
