import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { makeHeaven, makeFigure, dressFigure, lookSpec, animateFigure, turnFigure, makeAngel, makeWaypoint, LOOK, LOOK_TABS, DEFAULT_EARTH, earthSpec, makeDressingRoom } from './props.js';
import { makeCreation } from './creation.js';
import { makeEden, EDEN_RADIUS } from './eden.js';
import { PROLOGUE } from './data/prologue.js';
import { CREATION, DAY_NAMES } from './data/creation.js';
import { EDEN, FALL, QUIZ, FRUITS } from './data/eden.js';
import { load, save, reach, newState } from './save.js';
import { CHAPTERS } from './data/chapters.js';
import { tween, setInstant } from './anim.js';
import {
  $, say, askName, askLook, setQuest, setControls, toast, fade, showDayTitle, waitButton, askQuiz,
} from './ui.js';

// ---------- 렌더링: 쿼터뷰 정사영 카메라 + 픽셀화 후처리 ----------
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1);
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
scene.add(camera); // 카메라에 붙인 물체(창조의 별)도 그려지게 한다
const CAM_OFFSET = new THREE.Vector3(10, 12, 10);
const ROOM_OFFSET = new THREE.Vector3(10, 4, 10); // 꾸미기 방: 카메라를 낮춰 캐릭터를 정면에 가깝게 본다
let camOffset = CAM_OFFSET;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const ORIGIN = new THREE.Vector3();
const camTarget = new THREE.Vector3();
let camFollow = ORIGIN; // 카메라가 따라가는 점(보통은 내 캐릭터)
let camFocus = null; // 연출 중에 잠시 바라보는 점
let camAngle = 0;
let viewSize = 14;
let titleView = true; // 첫 화면: 장면을 천천히 돌린다
// 화면 한쪽에 메뉴·패널이 있을 때 장면을 반대쪽으로 민다(가로 화면은 x, 세로 화면은 y 비율)
let viewShift = { x: -0.2, y: 0.22 };
let turntable = false; // 꾸미는 동안 캐릭터를 천천히 돌려 뒷모습까지 보여 준다

const composer = new EffectComposer(renderer);
const pixelPass = new RenderPixelatedPass(4, scene, camera);
composer.addPass(pixelPass);
composer.addPass(new OutputPass());
function setEdges(on) {
  pixelPass.normalEdgeStrength = on ? 0.3 : 0;
  pixelPass.depthEdgeStrength = on ? 0.4 : 0;
}

function resize() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  const view = aspect < 1 ? viewSize * 1.35 : viewSize; // 세로 화면(휴대폰)에서는 더 넓게 본다
  camera.left = (-view * aspect) / 2;
  camera.right = (view * aspect) / 2;
  camera.top = view / 2;
  camera.bottom = -view / 2;
  if (viewShift) camera.setViewOffset(w, h, aspect >= 1 ? viewShift.x * w : 0, aspect >= 1 ? 0 : viewShift.y * h, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  pixelPass.setPixelSize(Math.max(3, Math.round(Math.min(w, h) / 200)));
}
addEventListener('resize', resize);
resize();
function setView(size) { viewSize = size; resize(); }

// ---------- 등장 요소 ----------
let state = load() ?? newState();
const heaven = makeHeaven();
const player = makeFigure(lookSpec(state.look));
const angel = makeAngel();
const waypoint = makeWaypoint();
const dressingRoom = makeDressingRoom();
scene.add(heaven.group, player, angel, waypoint.group, dressingRoom);
let creation = null;
let eden = null;

// ---------- 입력 ----------
// mode: 'none'(대사·연출 중) | 'walk'(걷기) | 'orbit'(창조를 둘러보기)
let mode = 'none';
const SPEED = 4;
let walkRadius = 8.5;
const keys = new Set();
let target = null;
let dragX = null;

addEventListener('keydown', (e) => keys.add(e.code));
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', (e) => {
  if (mode === 'orbit') { dragX = e.clientX; canvas.setPointerCapture(e.pointerId); return; }
  if (mode !== 'walk') return;
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  target = raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
});
canvas.addEventListener('pointermove', (e) => {
  if (dragX === null) return;
  camAngle -= (e.clientX - dragX) * 0.008;
  dragX = e.clientX;
});
for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, () => (dragX = null));

const held = (...codes) => (codes.some((c) => keys.has(c)) ? 1 : 0);

// 걷기: 속도를 부드럽게 올리고 줄여서 출발과 멈춤이 자연스럽다. 흔들림과 기울기는 animateFigure가 맡는다.
const vel = new THREE.Vector3();
const want = new THREE.Vector3();
function movePlayer(dt, t) {
  want.set(0, 0, 0);
  if (mode === 'walk') {
    const f = held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown');
    const r = held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft');
    // 카메라가 (+x, +z)에서 내려다보므로 화면 위쪽은 월드의 (-1, 0, -1) 방향이다. 걷기 중에는 camAngle이 0이다.
    want.set(r - f, 0, -r - f);
    if (want.lengthSq() > 0) target = null;
    else if (target) {
      want.subVectors(target, player.position).setY(0);
      if (want.length() < 0.15) { target = null; want.set(0, 0, 0); }
    }
    if (want.lengthSq() > 0) want.setLength(SPEED);
  }
  vel.lerp(want, Math.min(1, dt * 10));
  if (vel.lengthSq() > 1e-4) {
    player.position.addScaledVector(vel, dt);
    if (player.position.length() > walkRadius) player.position.setLength(walkRadius);
    turnFigure(player, Math.atan2(vel.x, vel.z), dt);
  }
  animateFigure(player, vel.length(), dt, t);
}

// 걸어서 닿으면 실행되는 지점들(문, 강 끝, 동물, 열매 나무)
let triggers = [];
function addTrigger(pos, r, cb) { const trig = { pos, r, cb }; triggers.push(trig); return trig; }
function checkTriggers() {
  if (mode !== 'walk') return;
  for (const trig of triggers) {
    if (player.position.distanceTo(trig.pos) < trig.r) {
      triggers = triggers.filter((x) => x !== trig);
      trig.cb();
      return;
    }
  }
}

let aimNearest = null; // 퀘스트 중이면 가장 가까운 목표로 길 안내를 맞춘다
function startWalk() { mode = 'walk'; setControls('walk'); }
function stopWalk() {
  mode = 'none';
  target = null;
  triggers = [];
  aimNearest = null;
  setControls(null);
  setQuest(null);
  waypoint.set(null);
}

// 여러 목표를 순서 없이 찾는 퀘스트. 모두 찾으면 끝난다.
function questFind({ title, targets, text, radius = 1.6, onFound }) {
  return new Promise((resolve) => {
    const left = new Set(targets);
    const render = () => setQuest({ title, items: targets.map((x) => ({ text: text(x), done: !left.has(x) })) });
    aimNearest = () => {
      let best = null, bd = Infinity;
      for (const x of left) { const d = x.pos.distanceTo(player.position); if (d < bd) { bd = d; best = x; } }
      waypoint.set(best ? best.pos : null);
    };
    render();
    startWalk();
    for (const x of targets) {
      addTrigger(x.pos, radius, async () => {
        left.delete(x);
        render();
        if (onFound) { mode = 'none'; target = null; await onFound(x); }
        if (left.size === 0) { stopWalk(); resolve(); return; }
        mode = 'walk';
      });
    }
  });
}

// ---------- 대천사 ----------
let angelFollow = false;
const angelGoal = new THREE.Vector3();
function moveAngel(dt, t) {
  if (angelFollow && angel.position.distanceTo(player.position) > 1.4) {
    // (+x, +z)는 카메라 쪽이라 관찰자를 가린다. 화면 오른쪽 옆인 (+x, -z)에 선다.
    angelGoal.copy(player.position).add(new THREE.Vector3(1, 0, -1));
    angel.position.lerp(angelGoal, Math.min(1, dt * 2.5));
  }
  angel.children.forEach((c) => (c.position.y += Math.sin(t * 2) * 0.002)); // 둥실거림
  angel.lookAt(player.position.x, angel.position.y, player.position.z);
}

// 대천사는 하나님의 빛기둥 안에서 내려온다.
function descendAngel() {
  angel.visible = true;
  const { x, z } = heaven.pillarPos;
  angel.position.set(x, 10, z);
  return tween(2200, (p) => (angel.position.y = 10 * (1 - p) ** 2));
}

function placeCompanions(at) {
  player.position.copy(at);
  vel.set(0, 0, 0);
  angel.position.copy(at).add(new THREE.Vector3(1, 0, -1));
  player.visible = angel.visible = true;
  angelFollow = true;
  camFollow = player.position;
  camFocus = null;
}

// ---------- 장면: 천국 ----------
async function runPrologue() {
  scene.background = new THREE.Color(0xfdf3d8);
  setEdges(true);
  heaven.group.visible = player.visible = true;
  dressFigure(player, lookSpec(state.look));
  setView(12);
  camAngle = 0;
  player.position.set(0, 0, -3);
  player.rotation.y = Math.PI;
  camFollow = player.position;
  angel.visible = false;
  angelFollow = false;
  mode = 'none';
  reach(state, 'prologue');
  await fade(0);

  await say(PROLOGUE.intro, state);
  if (!state.name) {
    state.name = await askName();
    // 꾸미는 동안 내 캐릭터를 가까이에서 정면으로 보여 준다
    setView(7);
    player.rotation.y = Math.PI / 4;
    turntable = true;
    state.look = await askLook(state.look, (look) => dressFigure(player, lookSpec(look)), {
      title: '천국에서의 내 모습',
      text: '고르는 대로 적용됩니다.',
      options: LOOK.heaven,
    });
    turntable = false;
    setView(12);
    save(state);
  }
  await say(PROLOGUE.named, state);
  await descendAngel();
  await say(PROLOGUE.angel, state);

  angelFollow = true;
  setQuest({ title: '천국의 부르심', items: [{ text: '빛의 문까지 걸어가기', done: false }] });
  waypoint.set(heaven.gatePos);
  startWalk();
  await new Promise((r) => addTrigger(heaven.gatePos, 1.6, r));
  setQuest({ title: '천국의 부르심', items: [{ text: '빛의 문까지 걸어가기', done: true }] });
  stopWalk();

  await say(PROLOGUE.gate, state);
  await fade(1);
  runCreation(1);
}

// ---------- 장면: 창조의 일곱 날 ----------
async function runCreation(fromDay = 1) {
  heaven.group.visible = player.visible = angel.visible = false;
  angelFollow = false;
  scene.background = new THREE.Color(0x020308);
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); }
  creation = makeCreation(scene);
  scene.add(creation.group);
  camera.add(creation.stars);
  setView(24);
  camAngle = 0;
  camFollow = ORIGIN;
  camFocus = null;
  mode = 'none';

  // 이어하기로 중간 날부터 볼 때는 앞 날의 연출을 순식간에 끝내 둔다
  setInstant(true);
  for (let day = 1; day < fromDay; day++) {
    for (const step of CREATION.days[day]) if (step.act) await creation.acts[step.act]();
  }
  setInstant(false);
  setEdges(fromDay > 1); // 빛이 생기기 전(창 1:2)에는 물의 윤곽선도 보이지 않게 한다
  await fade(0);

  if (fromDay === 1) await say(CREATION.start, state);
  for (let day = fromDay; day <= 7; day++) {
    reach(state, `creation-${day}`);
    showDayTitle(DAY_NAMES[day]);
    for (const step of CREATION.days[day]) {
      if (step.say) await say(step.say, state);
      if (step.act === 'light') setEdges(true);
      if (step.act) await creation.acts[step.act]();
    }
    mode = 'orbit';
    setControls('look');
    await waitButton(day < 7 ? `${DAY_NAMES[day + 1]}로` : '에덴 동산으로');
    mode = 'none';
    setControls(null);
  }
  await fade(1);
  runEden('eden');
}

// ---------- 꾸미기 방: 처음 땅에 내려가기 전, 지상에서의 모습을 전용 화면에서 고른다 ----------
async function runDressingRoom() {
  heaven.group.visible = angel.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); eden = null; }
  dressingRoom.visible = player.visible = true;
  scene.background = new THREE.Color(0xf6efe2);
  setEdges(true);
  player.position.set(0, 0, 0);
  player.rotation.y = Math.PI / 4;
  camFollow = new THREE.Vector3(0, 0.75, 0); // 발밑이 아니라 몸 가운데를 본다
  camFocus = null;
  camAngle = 0;
  camTarget.copy(camFollow);
  camOffset = ROOM_OFFSET;
  viewShift = { x: 0.2, y: 0.24 }; // 패널이 오른쪽(휴대폰은 아래)에 있으니 캐릭터를 반대쪽에 크게 둔다
  setView(4.2);
  await fade(0);
  turntable = true;
  state.earthLook = await askLook(state.earthLook ?? DEFAULT_EARTH, (look) => dressFigure(player, earthSpec(look)), {
    kicker: '에덴으로 내려가기 전',
    title: '지상에서의 내 모습',
    text: '땅에서도 사람들 눈에는 보이지 않아요.\n여러 시대를 함께 걸을 모습을 골라 주세요.',
    options: LOOK.earth,
    tabs: LOOK_TABS.earth,
    page: true,
    submit: '이 모습으로 내려가기',
  });
  turntable = false;
  save(state);
  await fade(1);
  dressingRoom.visible = false;
  camOffset = CAM_OFFSET;
  viewShift = null;
}

// ---------- 장면: 에덴(창 2~3장) ----------
async function runEden(from = 'eden') {
  if (!state.earthLook) await runDressingRoom();
  heaven.group.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); creation = null; }
  if (eden) scene.remove(eden.group);
  eden = makeEden(scene);
  scene.add(eden.group);
  scene.background = eden.sky.clone();
  setEdges(true);
  setView(13);
  camAngle = 0;
  walkRadius = EDEN_RADIUS;
  placeCompanions(eden.spots.start);
  dressFigure(player, state.earthLook ? earthSpec(state.earthLook) : lookSpec(state.look));
  mode = 'none';

  if (from === 'eden') await runEdenGarden();
  else { eden.skipToFall(); await fade(0); }
  await runEdenFall();
}

async function runEdenGarden() {
  reach(state, 'eden');
  camFocus = eden.spots.adam;
  await fade(0);
  await say(EDEN.arrive, state);
  await eden.acts.formAdam();
  await say(EDEN.adamAfter, state);
  camFocus = null;

  // 퀘스트 1: 네 강
  await questFind({
    title: '에덴에서 갈라진 네 강',
    targets: eden.riverEnds,
    text: (r) => `${r.name} 강으로 이동하기`,
    radius: 2,
    onFound: (r) => say(r.lines, state),
  });
  await say(EDEN.riversDone, state);
  camFocus = eden.spots.adam;
  await say(EDEN.command, state);

  // 퀘스트 2: 동물 도감
  await eden.acts.showAnimals();
  await say(EDEN.animalsIntro, state);
  camFocus = null;
  await questFind({
    title: '아담이 이름 지은 동물',
    targets: eden.animals.map((an) => ({ name: an.userData.name, pos: an.position })),
    text: (a) => `${a.name}에게 다가가 이름 듣기`,
    radius: 2.2,
    onFound: async (a) => toast(`바이블로그에 기록했어요: ${a.name}`),
  });
  camFocus = eden.spots.adam;
  await say(EDEN.animalsDone, state);
  await fade(1);
  eden.acts.showEve();
  await fade(0);
  await say(EDEN.eveAfter, state);
  camFocus = null;

  // 퀘스트 3: 먹어도 되는 열매. 선악을 알게 하는 나무에 다가가면 대천사가 한 번 알려 준다.
  const warn = addTrigger(eden.knowledge.position, 2.4, async () => {
    mode = 'none';
    await say(EDEN.forbidden, state);
    mode = 'walk';
  });
  await questFind({
    title: '먹어도 되는 열매',
    targets: eden.fruitTrees.slice(0, FRUITS.length).map((tree, i) => ({ tree, pos: tree.position, name: FRUITS[i] })),
    text: (f) => `${f.name} 따서 바구니에 담기`,
    radius: 1.8,
    onFound: async (f) => {
      f.tree.userData.fruits.forEach((x) => (x.visible = false));
      toast(`${f.name}를 바구니에 담았어요`, { gain: true });
    },
  });
  triggers = triggers.filter((x) => x !== warn);
  await say(EDEN.fruitDone, state);
}

async function runEdenFall() {
  reach(state, 'fall');
  stopWalk();
  camFocus = eden.spots.knowledge;
  await eden.acts.gatherAtTree();
  await say(FALL.serpent, state);
  await eden.acts.eat();
  await say(FALL.ate, state);
  await eden.acts.fall();
  eden.acts.figLeaves();
  await say(FALL.eyes, state);
  camFocus = eden.spots.hide;
  await Promise.all([eden.acts.hide(), eden.acts.presence()]);
  await say(FALL.trial, state);
  await say(FALL.curse, state);
  await eden.acts.clothe();
  await say(FALL.clothed, state);
  camFocus = eden.spots.gate;
  await eden.acts.expel();
  await say(FALL.guarded, state);
  await askQuiz(QUIZ);
  await fade(1);
  showEnd();
}

function showEnd() {
  $('endTitle').textContent = '다음 장면';
  $('endText').textContent = '다음 장면은 아직 만드는 중입니다.\n진행 상황은 저장되었습니다.';
  $('endcard').hidden = false;
  fade(0);
}
$('endBtn').onclick = () => location.reload();

// ---------- 첫 화면 ----------
function startAt(id) {
  if (id === 'prologue') return runPrologue();
  if (id.startsWith('creation-')) return runCreation(Number(id.split('-')[1]));
  return runEden(id);
}

function showTitle() {
  const menu = $('menu');
  const saved = load();
  const button = (label, fn, extra = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu__item';
    b.textContent = label;
    if (extra.recent) b.dataset.recent = '';
    b.onclick = fn;
    return b;
  };
  const begin = (fn) => () => {
    $('title').hidden = true;
    titleView = false;
    viewShift = null;
    resize();
    fn();
  };
  const head = (text) => {
    const p = document.createElement('p');
    p.className = 'menu__head';
    p.textContent = text;
    return p;
  };
  const span = (cls, text) => {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    return el;
  };
  const showMain = () => {
    menu.classList.remove('menu--list', 'menu--cards');
    menu.replaceChildren(button('처음부터', begin(() => { state = newState(saved); dressFigure(player, lookSpec(state.look)); runPrologue(); })));
    if (saved) menu.append(button('이어하기', showContinue));
    menu.querySelector('button').focus({ preventScroll: true });
  };
  const backButton = (fn) => {
    const back = button('돌아가기', fn);
    back.classList.add('menu__item--sub');
    return back;
  };
  // 이어하기 1단계: 장 카드. 열린 지점 수를 진행도로 보여 주고, 아직 못 간 장은 잠긴 카드로 보여 준다.
  const showContinue = () => {
    menu.classList.remove('menu--list');
    menu.classList.add('menu--cards');
    const cards = CHAPTERS.map((ch) => {
      const opened = ch.points.filter((p) => saved.unlocked.includes(p.id)).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.disabled = opened === 0;
      if (ch.points.some((p) => p.id === saved.scene)) b.dataset.recent = '';
      const bar = span('card__bar', '');
      bar.style.setProperty('--p', ch.points.length ? opened / ch.points.length : 0);
      const status = !ch.points.length ? '준비 중' : opened ? `${opened} / ${ch.points.length}` : '잠김';
      b.append(span('card__title', ch.title), span('card__range', ch.range), bar, span('card__status', status));
      b.onclick = () => showChapter(ch);
      return b;
    });
    menu.replaceChildren(head('어느 장으로 갈까요?'), ...cards, backButton(showMain));
    (menu.querySelector('.card[data-recent]') ?? menu.querySelector('button:not(:disabled)')).focus({ preventScroll: true });
  };
  // 이어하기 2단계: 장 안의 지점 목록
  const showChapter = (ch) => {
    menu.classList.remove('menu--cards');
    menu.classList.add('menu--list');
    const items = ch.points.map((pt) => {
      const open = saved.unlocked.includes(pt.id);
      const b = button(open ? pt.title : `${pt.title} · 잠김`, begin(() => { state = saved; startAt(pt.id); }), { recent: pt.id === saved.scene });
      b.disabled = !open;
      return b;
    });
    menu.replaceChildren(head(`${ch.title} · ${ch.range}`), ...items, backButton(showContinue));
    (menu.querySelector('[data-recent]') ?? menu.querySelector('button:not(:disabled)')).focus({ preventScroll: true });
  };
  // 방향키로 메뉴를 고른다
  menu.addEventListener('keydown', (e) => {
    const list = [...menu.querySelectorAll('button:not(:disabled)')];
    const i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
  });
  showMain();
  fade(0);
}

// ---------- 루프 ----------
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  movePlayer(dt, t);
  if (turntable) player.rotation.y += dt * 0.8;
  moveAngel(dt, t);
  checkTriggers();
  aimNearest?.();
  waypoint.update(t, player.position);
  creation?.update(dt, t);
  eden?.update(dt, t);
  if (heaven.group.visible) heaven.pillar.userData.pulse(t);
  if (titleView) camAngle += dt * 0.06;
  if (mode === 'orbit') camAngle += (held('KeyE') - held('KeyQ')) * dt * 1.5 + dt * 0.05;
  camTarget.lerp(camFocus ?? camFollow, Math.min(1, dt * 4));
  camera.position.copy(camTarget).add(camOffset.clone().applyAxisAngle(Y_AXIS, camAngle));
  camera.lookAt(camTarget);
  composer.render();
  requestAnimationFrame(tick);
}

// 개발 서버에서만: 브라우저 점검용으로 캐릭터와 세계에 접근한다(배포 빌드에는 빠진다).
if (import.meta.env.DEV) globalThis.__dev = { player, get eden() { return eden; }, get mode() { return mode; } };

scene.background = new THREE.Color(0xfdf3d8);
player.position.set(0, 0, -3);
camTarget.copy(player.position);
camFollow = player.position;
player.visible = angel.visible = false; // 첫 화면에는 천국 풍경만 보인다
tick();

// 첫 화면에 쓰는 글꼴을 먼저 불러온 뒤 화면을 보여 준다(새로고침 때 기본 글꼴로 그렸다가 바뀌는 깜빡임을 막는다).
// 네트워크가 느리면 1.5초 뒤에는 그냥 보여 준다.
const fontsReady = Promise.all([
  document.fonts.load('48px Galmuri11', '바이블로그'),
  document.fonts.load('600 20px "Pretendard Variable"', '처음부터 이어하기 돌아가기'),
  document.fonts.load('500 17px "Pretendard Variable"', '천국의 부르심을 받아 태초부터 이어진 성경의 순간들을 직접 보고 기록합니다'),
]).catch(() => {});
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
  document.documentElement.classList.add('is-ready');
  showTitle();
});
