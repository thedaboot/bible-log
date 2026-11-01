import { SPEAKERS, fill } from './text.js';
import { LOOK_LABELS } from './props.js';

export const $ = (id) => document.getElementById(id);

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => matchMedia('(pointer: coarse)').matches;
const TYPE_MS = 32; // 한 글자가 나오는 간격

// 대사 목록을 한 줄씩 보여 준다. 글자가 한 자씩 나오고, 그 사이에 누르면 문장을 바로 끝까지 보여 준다.
// 대사 창 클릭/탭, Space, Enter로 넘긴다.
// onLine(line, i): 대사가 화면에 나올 때마다 부른다(대사에 맞춰 카메라·연출을 바꿀 때 쓴다).
export function say(lines, ctx, { onLine } = {}) {
  const box = $('dialog');
  const lineEl = $('line');
  return new Promise((resolve) => {
    let i = 0;
    let timer = null;
    let full = '';

    const finishTyping = () => {
      clearInterval(timer);
      timer = null;
      lineEl.textContent = full;
      delete box.dataset.typing;
    };

    const back = $('dialogBack');
    const onClick = () => show();
    // instant: 이전 대사로 돌아갈 때는 타자 효과 없이 바로 보여 준다
    const show = (instant = false) => {
      if (timer) { finishTyping(); return; }
      if (i >= lines.length) {
        box.hidden = true;
        back.hidden = true;
        box.removeEventListener('click', onClick);
        back.onclick = null;
        removeEventListener('keydown', onKey);
        resolve();
        return;
      }
      const l = lines[i++];
      back.hidden = i < 2;
      onLine?.(l, i - 1);
      full = fill(l.text, ctx);
      box.dataset.who = l.who;
      $('speaker').textContent = SPEAKERS[l.who];
      $('ref').textContent = l.ref ?? '';
      $('srLine').textContent = `${SPEAKERS[l.who] ? SPEAKERS[l.who] + ': ' : ''}${full}`;
      if (instant === true || reducedMotion()) { lineEl.textContent = full; return; }
      // 아직 안 나온 글자(rest)도 숨긴 채 자리를 차지하게 해서, 줄바꿈 위치가 처음부터 고정된다
      let n = 0;
      const typed = document.createElement('span');
      const rest = document.createElement('span');
      rest.className = 'dialog__rest';
      rest.textContent = full;
      const wrap = document.createElement('span');
      wrap.append(typed, rest);
      lineEl.replaceChildren(wrap);
      box.dataset.typing = '';
      timer = setInterval(() => {
        n += 1;
        typed.textContent = full.slice(0, n);
        rest.textContent = full.slice(n);
        if (n >= full.length) finishTyping();
      }, TYPE_MS);
    };

    // 이전 대사: 이 섹션(say 한 번) 안에서만 돌아간다. onLine을 다시 불러 카메라·연출을 그 대사에 맞춘다.
    const goBack = () => {
      if (i < 2) return;
      if (timer) finishTyping();
      i -= 2;
      show(true);
    };
    const onKey = (e) => {
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
  input.focus();
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
  box.hidden = !quest;
  if (!quest) { questDone = new Set(); return; }
  $('questTitle').textContent = quest.title;
  const list = $('questItems');
  const before = questDone;
  questDone = new Set(quest.items.filter((it) => it.done).map((it) => it.text));
  list.replaceChildren(...quest.items.map((it) => {
    const li = document.createElement('li');
    li.textContent = it.text;
    if (it.done) li.className = before.has(it.text) || before.size + 1 < questDone.size ? 'is-done' : 'is-done is-new';
    return li;
  }));
}

// 조작 안내: 'walk' | 'look' | null. PC는 키보드 모양, 휴대폰은 탭·밀기 모양을 보여 준다.
const CONTROLS = {
  walk: {
    pc: '<div class="keys"><kbd class="key key--w">W</kbd><kbd class="key key--a">A</kbd><kbd class="key key--s">S</kbd><kbd class="key key--d">D</kbd></div><p>키보드로 걷거나,<br>가고 싶은 곳을 클릭하세요</p>',
    touch: '<span class="gesture gesture--tap" aria-hidden="true"></span><p>가고 싶은 곳을 탭하세요</p>',
  },
  look: {
    pc: '<div class="keys keys--row"><kbd class="key key--q">Q</kbd><kbd class="key key--e">E</kbd></div><p>화면을 드래그하거나, Q/E 키를 눌러<br>세상을 둘러보세요</p>',
    touch: '<span class="gesture gesture--swipe" aria-hidden="true"></span><p>화면을 좌우로 밀어 세상을 둘러보세요</p>',
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
export function showCard({ title, text, count }) {
  const el = $('dexCard');
  $('dexTitle').textContent = title;
  $('dexText').textContent = text;
  $('dexCount').textContent = count;
  el.hidden = false;
  return new Promise((resolve) => {
    const onKey = (e) => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); close(); } };
    const close = () => { clearTimeout(timer); el.hidden = true; el.onclick = null; removeEventListener('keydown', onKey); resolve(); };
    const timer = setTimeout(close, reducedMotion() ? 2000 : 2800);
    el.onclick = close;
    addEventListener('keydown', onKey);
  });
}

// 짧은 알림. gain이면 획득 강조(체크 표시, 번쩍임, 커졌다 돌아오기)를 함께 준다.
let toastTimer = null;
export function toast(text, { gain = false } = {}) {
  const el = $('toast');
  el.textContent = text;
  el.classList.toggle('toast--gain', gain);
  el.hidden = true;
  void el.offsetWidth; // 연속으로 띄워도 등장 효과가 다시 돌게 한다
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2200);
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
export function askQuiz(questions) {
  const box = $('quiz');
  box.hidden = false;
  return new Promise((resolve) => {
    let i = 0;
    const render = () => {
      const q = questions[i];
      $('quizCount').textContent = `${i + 1} / ${questions.length}`;
      $('quizQ').textContent = q.q;
      $('quizFeedback').textContent = '';
      $('quizFeedback').className = 'modal__text quiz__feedback';
      const next = $('quizNext');
      next.hidden = true;
      const opts = $('quizOptions');
      opts.replaceChildren(...q.options.map((text, n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--option';
        b.textContent = text;
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
      resolve();
    };
    render();
  });
}

// 화면을 빛으로 덮거나(1) 걷어 낸다(0). 시간은 tokens.css의 --dur-fade와 맞춘다.
export function fade(to) {
  $('fade').style.opacity = String(to);
  return new Promise((r) => setTimeout(r, reducedMotion() ? 160 : 1250));
}
