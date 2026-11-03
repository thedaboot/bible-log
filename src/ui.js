import { TALENT, SPROUT } from './icons.js';
import { SPEAKERS, fill } from './text.js';
import { LOOK_LABELS } from './props.js';
import { BOND_LINES } from './growth.js';

export const $ = (id) => document.getElementById(id);
// ↑·↓로 묶음 안의 버튼 포커스를 옮긴다(막간 선택지, 퀴즈 보기, 지도 지점)
export function moveFocus(box, dir) {
  const list = [...box.querySelectorAll('button:not(:disabled)')];
  if (!list.length) return;
  const i = list.indexOf(document.activeElement);
  const next = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
  list[next].focus({ preventScroll: true });
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => matchMedia('(pointer: coarse)').matches;
const TYPE_MS = 32; // 한 글자가 나오는 간격

// 대사 목록을 한 줄씩 보여 준다. 글자가 한 자씩 나오고, 그 사이에 누르면 문장을 바로 끝까지 보여 준다.
// 대사 창 클릭/탭, Space, Enter로 넘긴다.
// onLine(line, i): 대사가 화면에 나올 때마다 부른다(대사에 맞춰 카메라·연출을 바꿀 때 쓴다).
// choices: 마지막 대사가 다 나오면 대사 창 위에 선택지 패널을 띄우고, 고른 번호(0부터)로 끝난다.
// 선택지는 [{ text, mark }]이고 mark(열매 이름)가 있으면 새싹 표시를 단다. PC는 1~4 키로도 고른다.
let measureCtx = null; // 처음 쓸 때 만든다(npm run check는 document 없이 이 파일을 불러온다)

// 대사 한 줄(데이터)을 화면 폭에 맞춰 줄과 쪽으로 나눈다(ui.md "대사 창").
// - 줄: 실제 글자 폭을 재서, 줄 수가 가장 적고 줄 길이가 고른 자리에서 나눈다. 문장 끝·데이터 줄바꿈 뒤가 가장 좋고,
//   쉼표 뒤가 그다음이다. 한 어절만 남는 줄은 피한다("일곱 / 배로" 같은 끊김을 막는다).
// - 쪽: 한 쪽은 maxLines 줄까지다(일반 대사 2줄, 하나님 말씀 3줄). 넘치면 문장 경계에서 쪽을 나눈다.
//   데이터는 그대로 두고 화면에서만 나누므로 스테이지 코드의 대사 번호(slice, onLine의 i)는 바뀌지 않는다.
export const MAX_LINES = { voice: 3, elohim: 3 };
const maxLinesOf = (who) => MAX_LINES[who] ?? 2;
// 줄을 나누는 자리의 값(작을수록 좋다). 0 문장 끝·데이터 줄바꿈, 1 쉼표, 2 그 밖의 띄어쓰기.
const tierOf = (word) => (word.brk || /[.?!…]["'」)]?$/.test(word.t) ? 0 : /[,]$/.test(word.t) ? 1 : 2);
// 띄어쓰기에서 나눌 때: 조사·연결어미 뒤만 자연스럽다. 그 밖(꾸미는 말 뒤 "바꿀 / 수는", 수 관형사 뒤 "일곱 / 배로",
// 의존 명사 뒤 "수는 / 없지만")은 줄을 하나 더 쓰는 것(1000)보다 나쁘게 쳐서, 문장·쉼표 경계에서 나누거나 쪽을 넘긴다.
export const BOUND = /^(수|것|줄|때|데|만큼|뿐|척|듯)(은|는|이|가|을|를|도|만|에|에는|로|으로|와|과|이에요|예요|입니다|이다)?[.,?!]*$/; // 의존 명사(단위는 NUMERAL이 맡는다)
export const NUMERAL = /^(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|백|천|만|첫|온갖|모든)$/;
const SOFT = /(고|며|서|면|지만|는데|니|니까|도록|게|도|를|을|에|에서|에게|께|께서|과|와|으로|로|은|는|이|가|만|까지|부터|처럼|보다|요)$/;
function breakCost(word, next) {
  const tier = tierOf(word);
  if (tier === 0) return 0;
  if (tier === 1) return 0.06;
  if ((next && BOUND.test(next.t)) || NUMERAL.test(word.t)) return 2000;
  if (BOUND.test(word.t) || !SOFT.test(word.t)) return 1200;
  return 0.3;
}
function breakLines(words, room, wid, sp) {
  const n = words.length;
  const best = new Array(n + 1).fill(Infinity), from = new Array(n + 1).fill(0);
  best[0] = 0;
  for (let j = 1; j <= n; j++) {
    let lw = -sp;
    for (let i = j - 1; i >= 0; i--) {
      lw += wid[i] + sp;
      if (lw > room && i < j - 1) break;
      const slack = Math.max(0, room - lw) / room;
      const last = j === n;
      let c = best[i] + 1000 + (last ? 0.4 : 1) * slack * slack + (last ? 0 : breakCost(words[j - 1], words[j]));
      if (last && j - i === 1 && n > 2) c += 0.6; // 마지막 줄에 한 어절만 남지 않게
      if (lw > room) c += 1e6; // 한 어절이 줄보다 길면 어쩔 수 없이 넘친다
      if (c < best[j]) { best[j] = c; from[j] = i; }
    }
  }
  const lines = [];
  for (let j = n; j > 0; j = from[j]) lines.unshift(words.slice(from[j], j).map((w) => w.t).join(' '));
  return lines;
}
// 글자 폭을 재는 함수(measure)와 한 줄 폭(room)으로 쪽을 나눈다. 화면 없이도 돌아서 npm run check가 점검에 쓴다.
export function pagesOf(text, room, measure, maxLines = 2) {
  const words = text.split('\n').flatMap((seg) => {
    const ws = seg.split(/\s+/).filter(Boolean).map((t) => ({ t }));
    if (ws.length) ws[ws.length - 1].brk = true;
    return ws;
  });
  if (words.length) words[words.length - 1].brk = false;
  const sp = measure(' ');
  const wid = words.map((w) => measure(w.t));
  const pages = [];
  let at = 0;
  while (at < words.length) {
    const rest = words.slice(at), rw = wid.slice(at);
    const all = breakLines(rest, room, rw, sp);
    if (all.length <= maxLines) { pages.push(all.join('\n')); break; }
    // 이 쪽에 들어가는 가장 긴 앞부분을, 좋은 경계(문장 끝 > 쉼표 > 띄어쓰기) 순으로 찾는다
    const linesOf = (k) => breakLines(rest.slice(0, k), room, rw.slice(0, k), sp).length;
    let cut = -1;
    for (const tier of [0, 1, 2]) {
      let k = rest.length - 1;
      while (k >= 1 && !(tierOf(rest[k - 1]) <= tier && linesOf(k) <= maxLines)) k -= 1;
      // 문장 끝이면 짧아도 한 쪽으로, 쉼표면 두 줄을 채울 때만 쓴다(아니면 띄어쓰기에서 더 길게)
      if (k >= 1 && (tier !== 1 || linesOf(k) >= Math.min(2, maxLines))) { cut = k; break; }
    }
    if (cut < 1) cut = 1;
    pages.push(breakLines(rest.slice(0, cut), room, rw.slice(0, cut), sp).join('\n'));
    at += cut;
  }
  return pages;
}
export function paginate(text, el, maxLines = 2) {
  if (!el.clientWidth) return [text];
  measureCtx ??= document.createElement('canvas').getContext('2d');
  const cs = getComputedStyle(el);
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  // 줄 끝 ▼ 자리(1em)를 남긴다
  const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.fontSize) * 1.1;
  return pagesOf(text, room, (t) => measureCtx.measureText(t).width, maxLines);
}

export function say(lines, ctx, { onLine, choices = null } = {}) {
  const box = $('dialog');
  const lineEl = $('line');
  return new Promise((resolve) => {
    let i = 0; // 다음에 보일 데이터 줄
    let pages = []; // 지금 데이터 줄을 화면 폭에 맞춰 나눈 쪽들
    let p = 0; // 지금 보이는 쪽
    let timer = null;
    let full = '';

    let choosing = false;
    const atEnd = () => i >= lines.length && p >= pages.length - 1;
    // 본문과 ▼: ▼는 본문 마지막 글자 바로 뒤에 붙는다(오른쪽 끝에 떨어져 있지 않게)
    const caret = () => { const c = document.createElement('span'); c.className = 'dialog__next'; c.setAttribute('aria-hidden', 'true'); return c; };
    const paint = (...nodes) => { const w = document.createElement('span'); w.append(...nodes, caret()); lineEl.replaceChildren(w); };
    const finishTyping = () => {
      clearInterval(timer);
      timer = null;
      paint(full);
      delete box.dataset.typing;
      if (choices && atEnd()) openChoices();
    };
    const done = (value) => {
      box.hidden = true;
      back.hidden = true;
      $('choices').hidden = true;
      box.removeEventListener('click', onClick);
      back.onclick = null;
      removeEventListener('keydown', onKey);
      resolve(value);
    };
    const openChoices = () => {
      if (choosing) return;
      choosing = true;
      back.hidden = true;
      const panel = $('choices');
      // 보이는 순서: 말 → 열매로 열린 말 → 괄호 속 몸짓("(말없이 곁에 앉는다)")은 맨 아래. 고른 값은 데이터 순서 번호다.
      const order = choices.map((c, n) => n).sort((a, b) => {
        const rank = (c) => (/^\(/.test(c.text) ? 2 : c.mark ? 1 : 0);
        return rank(choices[a]) - rank(choices[b]) || a - b;
      });
      panel.replaceChildren(...order.map((n, shown) => {
        const c = choices[n];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice';
        b.dataset.n = n;
        const key = document.createElement('kbd');
        key.className = 'choice__key';
        key.textContent = shown + 1;
        const text = document.createElement('span');
        text.className = 'choice__text';
        text.textContent = fill(c.text, ctx);
        b.append(key, text);
        if (c.mark) {
          const mark = document.createElement('span');
          mark.className = 'choice__mark';
          mark.innerHTML = SPROUT;
          mark.append(c.mark);
          b.append(mark);
        }
        b.onclick = (e) => { e.stopPropagation(); done(n); };
        return b;
      }));
      // 대사 창 이름표 위에 띄운다(이름표가 대사 창 위로 솟아 있어 그 높이까지 피한다). 대사 창 높이는 대사마다 달라서 그때 잰다.
      const tag = $('speaker');
      const top = tag.offsetHeight ? tag.getBoundingClientRect().top : box.getBoundingClientRect().top;
      panel.style.bottom = `${innerHeight - top + 10}px`;
      panel.hidden = false;
      panel.querySelector('button').focus({ preventScroll: true });
    };

    const back = $('dialogBack');
    const onClick = () => show();
    // 지금 쪽(pages[p])을 보여 준다. instant: 이전 대사로 돌아갈 때는 타자 효과 없이 바로 보여 준다
    const render = (instant) => {
      full = pages[p];
      back.hidden = i < 2 && p === 0;
      $('srLine').textContent = `${SPEAKERS[lines[i - 1].who] ? SPEAKERS[lines[i - 1].who] + ': ' : ''}${full}`;
      if (instant === true || reducedMotion()) { paint(full); if (choices && atEnd()) openChoices(); return; }
      // 아직 안 나온 글자(rest)도 숨긴 채 자리를 차지하게 해서, 줄바꿈 위치가 처음부터 고정된다
      let n = 0;
      const typed = document.createElement('span');
      const rest = document.createElement('span');
      rest.className = 'dialog__rest';
      rest.textContent = full;
      paint(typed, rest);
      box.dataset.typing = '';
      timer = setInterval(() => {
        n += 1;
        typed.textContent = full.slice(0, n);
        rest.textContent = full.slice(n);
        if (n >= full.length) finishTyping();
      }, TYPE_MS);
    };
    // 데이터 줄 하나를 열고(이름표·장절·연출), 쪽으로 나눈다. last면 그 줄의 마지막 쪽을 연다.
    const open = (last = false) => {
      const l = lines[i++];
      onLine?.(l, i - 1);
      box.dataset.who = l.who; // 하나님 말씀은 글자 크기가 달라서, 재기 전에 먼저 정한다
      $('speaker').textContent = SPEAKERS[l.who];
      $('ref').textContent = l.ref ?? '';
      pages = paginate(fill(l.text, ctx), lineEl, maxLinesOf(l.who));
      p = last ? pages.length - 1 : 0;
    };
    const show = (instant = false) => {
      if (timer) { finishTyping(); return; }
      if (p < pages.length - 1) { p += 1; render(instant); return; }
      if (i >= lines.length) {
        if (choices) { openChoices(); return; } // 선택지가 있으면 고를 때까지 마지막 대사에 머문다
        done();
        return;
      }
      open();
      render(instant);
    };

    // 이전 대사: 이 섹션(say 한 번) 안에서만 돌아간다. 한 대사가 여러 쪽이면 쪽부터 되돌린다.
    // 줄을 되돌릴 때는 onLine을 다시 불러 카메라·연출을 그 대사에 맞춘다.
    const goBack = () => {
      if (choosing || (i < 2 && p === 0)) return;
      if (timer) finishTyping();
      if (p > 0) { p -= 1; render(true); return; }
      i -= 2;
      open(true);
      render(true);
    };
    const onKey = (e) => {
      if (choosing) {
        const n = Number(e.key) - 1;
        const btns = [...$('choices').querySelectorAll('button')];
        if (n >= 0 && n < btns.length) { e.preventDefault(); btns[n].click(); }
        if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); moveFocus($('choices'), e.code === 'ArrowDown' ? 1 : -1); }
        return; // 고르는 동안 Space·Enter는 포커스된 선택지 버튼이 받는다
      }
      if (e.repeat) return; // 누르고 있어도 여러 대사가 한꺼번에 넘어가지 않게
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); show(); }
      if (e.code === 'ArrowLeft' || e.code === 'Backspace') { e.preventDefault(); goBack(); }
    };
    back.onclick = (e) => { e.stopPropagation(); goBack(); };
    box.hidden = false;
    box.addEventListener('click', onClick);
    addEventListener('keydown', onKey);
    show();
  });
}

export function askName() {
  const form = $('nameForm');
  const input = $('nameInput');
  form.hidden = false;
  input.value = '';
  input.removeAttribute('aria-invalid');
  // 화면 키보드가 올라오면 보이는 영역(visualViewport)이 줄어든다. 어두운 바탕은 화면 전체(키보드 뒤까지)를 덮은 채로 두고,
  // 위아래 여백만 보이는 영역에 맞춰 입력 창이 키보드 위 가운데에 오게 한다(창 영역을 줄였더니 키보드 위 띠가 덮이지 않았다).
  const vv = globalThis.visualViewport;
  const fit = () => {
    if (!vv) return;
    form.style.paddingTop = `${vv.offsetTop + 16}px`;
    form.style.paddingBottom = `${Math.max(16, innerHeight - vv.offsetTop - vv.height + 16)}px`;
  };
  fit();
  vv?.addEventListener('resize', fit);
  vv?.addEventListener('scroll', fit);
  const unfit = () => { vv?.removeEventListener('resize', fit); vv?.removeEventListener('scroll', fit); form.style.paddingTop = form.style.paddingBottom = ''; };
  input.focus({ preventScroll: true });
  return new Promise((resolve) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = input.value.trim().slice(0, 10);
      if (!name) {
        input.setAttribute('aria-invalid', 'true');
        input.placeholder = '이름을 한 글자 이상 적어 주세요';
        input.focus();
        return;
      }
      form.hidden = true;
      form.onsubmit = null;
      unfit();
      resolve(name);
    };
  });
}

// 캐릭터 꾸미기: 고르는 즉시 onChange로 3D 캐릭터에 반영하고, '이 모습으로'를 누르면 끝난다.
// options는 LOOK.heaven(간단) 또는 LOOK.earth(넓음). wide면 창을 넓혀 두 칸으로 배치한다.
// page면 전용 화면(오른쪽 전체 높이 패널, 휴대폰은 아래 시트)으로 띄운다.
export function askLook(current, onChange, { title, text, options, tabs = null, wide = false, page = false, kicker = '', submit = '이 모습으로' }) {
  const form = $('lookForm');
  $('lookTitle').textContent = title;
  $('lookText').textContent = text;
  $('lookKicker').textContent = kicker;
  $('lookKicker').hidden = !kicker;
  $('lookSubmit').textContent = submit;
  form.classList.toggle('modal--page', page);
  form.classList.toggle('modal--side', !page);
  form.querySelector('.look').classList.toggle('look--wide', wide || page);
  const look = { ...current };
  const body = $('lookGroups');
  const legends = {};
  const radios = {};
  const pickName = (key) => options[key].find((o) => o.id === look[key])?.name ?? '';
  // onChange(look, key): key는 방금 바꾼 항목('all'은 무작위, 처음 한 번은 null). 3D 쪽 강조 연출에 쓴다.
  const choose = (key, id) => {
    look[key] = id;
    legends[key].lastChild.textContent = pickName(key);
    onChange({ ...look }, key);
  };
  const pressed = (el) => { el.classList.remove('is-picked'); void el.offsetWidth; el.classList.add('is-picked'); };
  body.replaceChildren();
  const sets = {};
  for (const [key, list] of Object.entries(options)) {
    if (!list.some((o) => o.id === look[key])) look[key] = list[0].id; // 이 창에 없는 값이면 첫 선택지로
    const set = document.createElement('fieldset');
    set.className = 'look__group';
    const legend = document.createElement('legend');
    const name = document.createElement('span');
    name.className = 'look__picked';
    legend.append(LOOK_LABELS[key], name);
    legends[key] = legend;
    set.append(legend);
    radios[key] = list.map((opt) => {
      const wrap = document.createElement('label');
      wrap.className = opt.hex !== undefined ? 'swatch' : 'chip';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = key;
      input.value = opt.id;
      input.checked = look[key] === opt.id;
      input.onchange = () => { pressed(wrap); choose(key, opt.id); };
      const label = document.createElement('span');
      label.textContent = opt.name;
      if (opt.icon) { // 미리보기 칩: 그림 위, 이름 아래(S11 "텍스트가 아닌 미리보기 버튼")
        wrap.classList.add('chip--icon');
        const pic = document.createElement('span');
        pic.className = 'chip__icon';
        pic.innerHTML = opt.icon;
        wrap.append(pic);
        label.className = 'chip__name';
      }
      if (opt.hex !== undefined) {
        wrap.style.setProperty('--swatch', `#${opt.hex.toString(16).padStart(6, '0')}`);
        wrap.title = opt.name;
        label.className = 'sr-only';
      }
      wrap.append(input, label);
      set.append(wrap);
      return input;
    });
    name.textContent = pickName(key);
    sets[key] = set;
    body.append(set);
  }
  // 탭: 고른 탭의 항목만 보여 준다
  const tabBar = $('lookTabs');
  tabBar.hidden = !tabs;
  tabBar.replaceChildren();
  if (tabs) {
    // 고른 탭 밑줄은 하나의 막대가 옆으로 미끄러져 옮겨 가고, 새 항목은 탭 방향에서 짧게 들어온다.
    const line = document.createElement('span');
    line.className = 'look__tabline';
    tabBar.style.setProperty('--tabs', tabs.length);
    let current = -1;
    const showTab = (i) => {
      const dir = i > current ? 1 : -1;
      tabs.forEach((tab, n) => tab.keys.forEach((key) => {
        const set = sets[key];
        set.hidden = n !== i;
        if (n === i && current >= 0) { set.dataset.dir = dir; set.classList.remove('is-entering'); void set.offsetWidth; set.classList.add('is-entering'); }
      }));
      [...tabBar.querySelectorAll('.tab')].forEach((b, n) => b.setAttribute('aria-selected', String(n === i)));
      line.style.transform = `translateX(${i * 100}%)`;
      current = i;
    };
    tabs.forEach((tab, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.textContent = tab.label;
      b.onclick = () => showTab(i);
      tabBar.append(b);
    });
    tabBar.append(line);
    showTab(0);
  }
  onChange({ ...look }, null);
  // 무작위: 항목마다 아무거나 하나 고른다
  $('lookRandom').onclick = () => {
    for (const [key, list] of Object.entries(options)) {
      const n = Math.floor(Math.random() * list.length);
      radios[key][n].checked = true;
      look[key] = list[n].id;
      legends[key].lastChild.textContent = list[n].name;
    }
    pressed($('lookRandom'));
    body.querySelectorAll('.look__group:not([hidden]) label:has(input:checked)').forEach(pressed);
    onChange({ ...look }, 'all');
  };
  form.hidden = false;
  form.querySelector('input:checked')?.focus();
  return new Promise((resolve) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      form.hidden = true;
      form.onsubmit = null;
      resolve(look);
    };
  });
}

// 퀘스트 창: { title, items: [{ text, done }] } 또는 null(닫기)
// 방금 끝난 목표에는 is-new를 붙여 한 번만 강조한다.
let questDone = new Set();
export function setQuest(quest) {
  const box = $('quest');
  box.onclick ??= () => box.classList.toggle('is-open'); // 휴대폰: 다음 목표 하나만 보이고, 누르면 남은 목표를 모두 펼친다
  box.hidden = !quest;
  if (!quest) { questDone = new Set(); return; }
  $('questTitle').textContent = quest.title;
  // 목표가 여럿이면 제목 옆에 진행 숫자(휴대폰은 끝낸 목표를 접어서 이 숫자로 보여 준다)
  if (quest.items.length > 1) {
    const n = document.createElement('span');
    n.className = 'quest__count';
    n.textContent = `${quest.items.filter((it) => it.done).length} / ${quest.items.length}`;
    $('questTitle').append(' ', n);
  }
  const list = $('questItems');
  let left = 0;
  const before = questDone;
  questDone = new Set(quest.items.filter((it) => it.done).map((it) => it.text));
  list.replaceChildren(...quest.items.map((it) => {
    const li = document.createElement('li');
    li.textContent = it.text;
    if (it.done) li.className = before.has(it.text) || before.size + 1 < questDone.size ? 'is-done' : 'is-done is-new';
    else if (++left > 3) li.className = 'is-later'; // 휴대폰에서는 남은 목표를 셋까지만
    return li;
  }));
}

// 조작 안내: 'walk' | 'look' | null. PC는 키보드 모양, 휴대폰은 탭·밀기 모양을 보여 준다.
const CONTROLS = {
  walk: {
    pc: '<div class="keys"><kbd class="key key--w">W</kbd><kbd class="key key--a">A</kbd><kbd class="key key--s">S</kbd><kbd class="key key--d">D</kbd></div><p>키보드로 걷거나,<br>가고 싶은 곳을 클릭하세요</p>',
    touch: '<div class="coach"><p class="coach__row"><span class="gesture gesture--tap" aria-hidden="true"></span><span><b>톡 누르면</b> 그곳으로 걸어가요</span></p><p class="coach__row"><span class="gesture gesture--drag" aria-hidden="true"></span><span><b>누른 채 끌면</b> 그 방향으로 걸어요</span></p></div>',
  },
  look: {
    pc: '<div class="keys keys--row"><kbd class="key key--q">Q</kbd><kbd class="key key--e">E</kbd></div><p>화면을 드래그하거나, Q·E 키를 눌러<br>세상을 둘러보세요</p>',
    touch: '<div class="coach"><p class="coach__row"><span class="gesture gesture--swipe" aria-hidden="true"></span><span><b>좌우로 밀면</b> 세상을 둘러봐요</span></p></div>',
  },
};
export function setControls(kind) {
  const box = $('controls');
  box.hidden = !kind;
  if (kind) box.innerHTML = CONTROLS[kind][isTouch() ? 'touch' : 'pc'];
}

// 머무르기 게이지: p(0~1)만큼 채운다. label이 null이면 숨긴다.
export function setGauge(label, p = 0) {
  const el = $('gauge');
  el.hidden = label === null;
  if (label === null) return;
  $('gaugeLabel').textContent = label;
  $('gaugeFill').style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;
}

// 도감 카드: 누르거나 2.8초가 지나면 닫힌다.
export function showCard({ title, text, ref, count, pic = '' }) {
  const el = $('dexCard');
  $('dexPic').innerHTML = pic;
  $('dexPic').hidden = !pic;
  $('dexTitle').textContent = title;
  $('dexText').textContent = text;
  $('dexRef').textContent = ref ?? '';
  $('dexCount').textContent = count;
  el.hidden = false;
  return new Promise((resolve) => {
    const onKey = (e) => { if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') && !e.repeat) { e.preventDefault(); close(); } };
    const close = () => { clearTimeout(timer); el.hidden = true; el.onclick = null; removeEventListener('keydown', onKey); resolve(); };
    const timer = setTimeout(close, reducedMotion() ? 2000 : 2800);
    el.onclick = close;
    addEventListener('keydown', onKey);
  });
}

// 짧은 알림. gain이면 획득 강조(체크 표시, 번쩍임, 커졌다 돌아오기)를 함께 준다.
// 알림은 차례로 띄운다. 뒤에 기다리는 알림이 있으면 1.4초, 마지막 알림은 2.2초 동안 보인다.
const toasts = [];
function nextToast() {
  const el = $('toast');
  const [text, { gain = false, kind } = {}] = toasts[0];
  el.textContent = text;
  el.classList.toggle('toast--gain', gain);
  // 배너 아이콘: 열매가 자람(새싹), 레벨·칭호(별, 금빛 배너), 관계(하트 세 칸), 그 밖의 획득(체크)
  const bondStep = Object.values(BOND_LINES).findIndex((end) => text.endsWith(end));
  el.dataset.kind = kind ?? (bondStep >= 0 ? 'bond' : /자랐어요$/.test(text) ? 'fruit' : /^(레벨|칭호)/.test(text) ? 'level' : 'check');
  if (bondStep >= 0) {
    // 관계 단계: 만남·대화·동행 세 칸 가운데 이번에 찬 칸이 커지며 채워진다
    const pips = document.createElement('span');
    pips.className = 'toast__pips';
    pips.setAttribute('aria-label', `관계 ${bondStep + 1} / 3`);
    for (let k = 0; k < 3; k++) {
      const pip = document.createElement('span');
      pip.className = `toast__pip${k <= bondStep ? ' is-on' : ''}${k === bondStep ? ' is-new' : ''}`;
      pips.append(pip);
    }
    el.append(pips);
  }
  el.hidden = true;
  void el.offsetWidth; // 연속으로 띄워도 등장 효과가 다시 돌게 한다
  el.hidden = false;
  setTimeout(() => {
    toasts.shift();
    if (toasts.length) nextToast();
    else el.hidden = true;
  }, toasts.length > 1 ? 1300 : 2000);
}
export function toast(text, opts) {
  toasts.push([text, opts]);
  if (toasts.length === 1) nextToast();
}

export function showDayTitle(text) {
  const el = $('dayTitle');
  el.textContent = text;
  // 다음 프레임에 클래스를 붙여야 등장 전환이 일어난다
  requestAnimationFrame(() => el.classList.add('is-shown'));
  setTimeout(() => { if (el.textContent === text) el.classList.remove('is-shown'); }, 2600);
}

// 버튼을 누르거나 Space·Enter를 눌러야 다음으로 넘어간다. PC에서는 버튼에 Space 키 표시를 붙인다.
export function waitButton(label) {
  const btn = $('nextBtn');
  btn.textContent = label;
  if (!isTouch()) {
    const k = document.createElement('kbd');
    k.className = 'key key--inline';
    k.textContent = 'Space';
    btn.append(k);
  }
  btn.hidden = false;
  return new Promise((resolve) => {
    const done = () => {
      btn.hidden = true;
      btn.onclick = null;
      removeEventListener('keydown', onKey);
      resolve();
    };
    // 키를 누르고 있을 때 생기는 자동 반복 입력은 무시한다. 그러지 않으면 여러 날이 한꺼번에 넘어간다.
    const onKey = (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); done(); }
    };
    btn.onclick = done;
    addEventListener('keydown', onKey);
  });
}

// 구절 퀴즈: 틀리면 다시 고르고, 맞히면 장절을 보여 준 뒤 다음 문제로 간다.
// 키보드: 1~3 키로 고르고, ↑·↓로 포커스를 옮긴다(막간 선택지와 같은 번호 키캡).
export function askQuiz(questions) {
  const box = $('quiz');
  box.hidden = false;
  return new Promise((resolve) => {
    let i = 0;
    const onKey = (e) => {
      const n = Number(e.key) - 1;
      const opts = [...$('quizOptions').querySelectorAll('button')];
      if (n >= 0 && n < opts.length && !opts[n].disabled) { e.preventDefault(); opts[n].click(); }
      if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { e.preventDefault(); moveFocus(box, e.code === 'ArrowDown' ? 1 : -1); }
    };
    addEventListener('keydown', onKey);
    const render = () => {
      const q = questions[i];
      $('quizCount').textContent = `${i + 1} / ${questions.length}`;
      $('quizQ').textContent = q.q;
      $('quizFeedback').textContent = '';
      $('quizFeedback').className = 'modal__text quiz__feedback';
      const next = $('quizNext');
      next.hidden = true;
      const opts = $('quizOptions');
      // 보기 순서는 열 때마다 섞는다(2026-11-03 사용자 F25). 번호 키캡은 화면 순서, 정답 판정은 데이터 번호(n)로 한다
      const order = q.options.map((_, k) => k).sort(() => Math.random() - 0.5);
      opts.replaceChildren(...order.map((n, at) => {
        const text = q.options[n];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--option';
        const key = document.createElement('kbd');
        key.className = 'choice__key';
        key.textContent = at + 1;
        b.append(key, text);
        b.onclick = () => {
          if (n !== q.answer) {
            b.removeAttribute('aria-invalid');
            void b.offsetWidth; // 같은 오답을 다시 눌러도 흔들림이 다시 돈다
            b.setAttribute('aria-invalid', 'true');
            $('quizFeedback').className = 'modal__text quiz__feedback';
            $('quizFeedback').textContent = '다시 골라 보세요.';
            return;
          }
          b.dataset.state = 'success';
          opts.querySelectorAll('button').forEach((x) => (x.disabled = x !== b));
          $('quizFeedback').className = 'modal__text quiz__feedback is-ok';
          $('quizFeedback').textContent = `정답이에요! (${q.ref})`;
          next.textContent = i < questions.length - 1 ? '다음 문제' : '마치기';
          next.hidden = false;
          next.focus();
        };
        return b;
      }));
      opts.querySelector('button').focus();
    };
    $('quizNext').onclick = () => {
      i += 1;
      if (i < questions.length) { render(); return; }
      box.hidden = true;
      removeEventListener('keydown', onKey);
      resolve();
    };
    render();
  });
}

// 화면을 빛으로 덮거나(1) 걷어 낸다(0). 시간은 tokens.css의 --dur-fade와 맞춘다.
// 창(.modal)을 닫을 때 짧게 흐려지며 작아진 뒤 숨긴다(열 때의 fade-in·pop과 짝)
export function hideModal(box) {
  if (box.hidden) return;
  box.classList.add('is-closing');
  // 닫히는 사이 다시 열렸으면(is-closing이 지워졌으면) 숨기지 않는다
  setTimeout(() => { if (box.classList.contains('is-closing')) { box.hidden = true; box.classList.remove('is-closing'); } }, reducedMotion() ? 0 : 200);
}

// 대사 창이 화면 아래에서 차지하는 높이(휴대폰 배너를 그 바로 위에 띄울 때 쓴다)
if (typeof document !== 'undefined' && typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(([e]) => {
    if (e.target.offsetHeight) document.documentElement.style.setProperty('--dialog-h', `${innerHeight - e.target.getBoundingClientRect().top}px`);
  }).observe(document.getElementById('dialog'));
}

export function fade(to) {
  $('fade').style.opacity = String(to);
  return new Promise((r) => setTimeout(r, reducedMotion() ? 160 : 1250));
}

// HUD: 레벨·경험치 바·달란트를 화면 왼쪽 위에 늘 보여 준다. 레벨이 오르면 레벨 칸이 커졌다 돌아오고 금빛으로 번쩍인다.
// 메뉴 버튼은 HUD와 떨어진 오른쪽 아래에 따로 두고, 걷는 중에만 보인다(main.js tick).
const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
export function setHud({ level, into, need, talents }, { levelUp = false } = {}) {
  if (!$('hudTalentIcon').firstChild) $('hudTalentIcon').innerHTML = TALENT;
  $('hudLv').textContent = level;
  $('hudXp').style.transform = `scaleX(${into / need})`;
  $('hudXpTrack').setAttribute('aria-label', `경험치 ${into} / ${need}`);
  $('hudXpText').textContent = `${Math.floor((into / need) * 100)}%`;
  rollNumber($('hudTalent'), talents);
  if (levelUp) replay($('hud'), 'is-levelup');
}
export function showHud(on) { $('hud').hidden = !on; }

// 숫자를 세며 바꾼다(달란트가 늘거나 줄 때). 처음 그릴 때와 움직임 줄이기에서는 바로 바꾼다.
function rollNumber(node, to) {
  const from = Number(node.textContent) || 0;
  cancelAnimationFrame(node._roll);
  if (from === to || reducedMotion() || !node.isConnected || $('hud').hidden) { node.textContent = to; return; }
  const start = performance.now();
  const step = () => {
    const p = Math.min(1, (performance.now() - start) / 500);
    node.textContent = Math.round(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) node._roll = requestAnimationFrame(step);
  };
  step();
}

// 획득 표시: 경험치·달란트가 오르면 HUD의 막대 끝과 달란트 숫자 옆에서 "+5"가 떠올랐다 사라진다.
// (오른쪽 아래에 줄로 쌓던 획득 기록을 대신한다. 열매·도구·레벨은 배너 toast로 보여 준다.)
export function popHud({ xp = 0, talent = 0 } = {}) {
  const hud = $('hud');
  if (hud.hidden) return;
  const base = hud.getBoundingClientRect();
  const at = (node, text, cls) => {
    const r = node.getBoundingClientRect();
    const pop = document.createElement('span');
    pop.className = `hud__pop ${cls}`;
    pop.textContent = text;
    pop.style.left = `${r.right - base.left}px`;
    pop.style.top = `${r.top - base.top + r.height / 2}px`;
    pop.addEventListener('animationend', () => pop.remove(), { once: true });
    hud.append(pop);
  };
  if (xp) at($('hudXpTrack'), `+${xp}`, 'hud__pop--xp');
  if (talent) at($('hudTalent'), `${talent > 0 ? '+' : ''}${talent}`, talent > 0 ? 'hud__pop--talent' : 'hud__pop--spend');
}

// 마침 창(2026-11-02 S29): 스테이지를 마치면 다음 이야기 입장(먼저), 지도, 쉼터 가운데 고른다. 'next' | 'map' | 'home'
// next가 없으면(마지막 이야기) 다음 칸과 입장 버튼을 숨긴다. Enter는 입장, Esc는 쉼터.
// 쉼터로 나가기 확인: 나가면 true. 기본 포커스는 '계속하기'(실수로 나가지 않게), Esc는 계속하기.
export function askQuit() {
  const box = $('quitBox');
  box.classList.remove('is-closing');
  box.hidden = false;
  $('quitNo').focus({ preventScroll: true });
  return new Promise((resolve) => {
    const done = (v) => { hideModal(box); removeEventListener('keydown', onKey, true); resolve(v); };
    const onKey = (e) => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); } };
    addEventListener('keydown', onKey, true);
    $('quitNo').onclick = () => done(false);
    $('quitYes').onclick = () => done(true);
    box.onclick = (e) => { if (e.target === box) done(false); };
  });
}
export function askClear({ kicker, title, next }) {
  const box = $('clearBox');
  $('clearKicker').textContent = kicker;
  $('clearTitle').textContent = title;
  $('clearNext').hidden = $('clearGo').hidden = !next;
  if (next) $('clearNextTitle').textContent = next;
  box.classList.remove('is-closing');
  box.hidden = false;
  (next ? $('clearGo') : $('clearMap')).focus({ preventScroll: true });
  return new Promise((resolve) => {
    const done = (v) => { hideModal(box); removeEventListener('keydown', onKey, true); resolve(v); };
    const onKey = (e) => {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); done('home'); }
    };
    addEventListener('keydown', onKey, true);
    $('clearGo').onclick = () => done('next');
    $('clearMap').onclick = () => done('map');
    $('clearHome').onclick = () => done('home');
  });
}
