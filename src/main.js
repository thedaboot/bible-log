import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { PAL, makeHeaven, makeFigure, dressFigure, lookSpec, animateFigure, turnFigure, makeAngel, makeWaypoint, LOOK, LOOK_TABS, DEFAULT_EARTH, earthSpec, makeDressingRoom, makeBasket } from './props.js';
import { makeCreation } from './creation.js';
import { makeEden, EDEN_RADIUS } from './eden.js';
import { makeCain, CAIN_RADIUS } from './cain.js';
import { PROLOGUE } from './data/prologue.js';
import { CREATION, DAY_NAMES } from './data/creation.js';
import { EDEN, FALL, QUIZ, NAMING, INTERLUDE, EVE_GREETING } from './data/eden.js';
import { CAIN, CAIN_QUIZ, CAIN_INTERLUDE, CAIN_GREETING } from './data/cain.js';
import { load, save, reach, newState, openNext } from './save.js';
import { CHAPTERS } from './data/chapters.js';
import { REWARDS, SPIRIT } from './data/growth.js';
import { grant, bond, record, levelOf, looksOpened, choiceOpen, chooseFruit, buyLook } from './growth.js';
import { ITEMS } from './data/items.js';
import { CODEX } from './data/codex.js';
import { openMenu, menuIsOpen } from './menu.js';
import { openMap } from './map.js';
import { tween, easeOut, setInstant } from './anim.js';
import {
  $, say, askName, askLook, setQuest, setControls, toast, fade, showDayTitle, waitButton, askQuiz, setGauge, showCard, setHud, showHud, logGain,
} from './ui.js';

// ---------- 렌더링: 쿼터뷰 정사영 카메라 + 픽셀화 후처리 ----------
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(1);
renderer.localClippingEnabled = true; // 가죽옷이 발밑부터 차오르는 연출(eden.js acts.clothe)
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
let cain = null;
const land = () => eden ?? cain; // 지금 걷는 지상 장면(에덴, 가인과 아벨의 들판)

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
  // 'auto': 연출 중에 관찰자가 장면 앞을 비켜 걸어 나간다(키 입력은 받지 않는다). 게임 시간 4초 안에 못 닿으면 그 자리에 선다.
  if (mode === 'auto') autoLeft -= dt;
  if (mode === 'auto' && (!target || autoLeft <= 0)) { target = null; mode = 'none'; }
  if (mode === 'walk' || mode === 'auto') {
    const f = mode === 'walk' ? held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown') : 0;
    const r = mode === 'walk' ? held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft') : 0;
    // 카메라가 (+x, +z)에서 내려다보므로 화면 위쪽은 월드의 (-1, 0, -1) 방향이다. 걷기 중에는 camAngle이 0이다.
    want.set(r - f, 0, -r - f);
    if (want.lengthSq() > 0) target = null;
    else if (target) {
      want.subVectors(target, player.position).setY(0);
      const d = want.length();
      if (d < 0.15) { target = null; want.set(0, 0, 0); }
      else if (mode === 'auto') {
        // 비키는 중 0.5초 넘게 가까워지지 않으면(막힘) 다음 후보로 가고, 후보가 없으면 그 자리에 선다
        if (d < autoBest - 0.02) { autoBest = d; autoStuck = 0; } else autoStuck += dt;
        if (autoStuck > 0.5) { nextAside(); if (!target) want.set(0, 0, 0); }
      }
    }
    if (want.lengthSq() > 0) want.setLength(SPEED);
    if (mode === 'walk' && want.lengthSq() > 0) practiced('walk', dt);
  }
  vel.lerp(want, Math.min(1, dt * 10));
  prevPos.copy(player.position);
  if (vel.lengthSq() > 1e-4) {
    player.position.addScaledVector(vel, dt);
    if (player.position.length() > walkRadius) player.position.setLength(walkRadius);
    land()?.collide(player.position, 0.35); // 나무·바위·물은 통과하지 못한다(다리로만 강을 건넌다)
    turnFigure(player, Math.atan2(vel.x, vel.z), dt);
  } else if (mode === 'none' && playerFace) {
    turnFigure(player, Math.atan2(playerFace.x - player.position.x, playerFace.z - player.position.z), dt); // 비킨 뒤 장면 쪽을 본다
  }
  // 걷는 몸짓은 실제로 움직인 거리로 정한다(장애물에 막혀 제자리 걸음을 하지 않게)
  animateFigure(player, dt > 0 ? player.position.distanceTo(prevPos) / dt : 0, dt, t);
}
const prevPos = new THREE.Vector3();

// 연출 무대: 동물과 관찰자가 장면 앞(카메라 쪽)을 비켜 준다. 연출 중에 관찰자가 무대 안에 있으면 가장자리로 걸어 나간다.
// 비킬 자리는 실제로 설 수 있고 곧게 걸어 닿는 후보(stepAsideSpots, 가까운 순)에서 고르고, 막히면 다음 후보로 간다.
let autoLeft = 0, autoQueue = [], autoBest = Infinity, autoStuck = 0, playerFace = null;
function nextAside() {
  target = autoQueue.shift() ?? null;
  autoBest = Infinity;
  autoStuck = 0;
  if (!target) mode = 'none';
}
function setStage(name) {
  const st = land().acts.stage(name);
  playerFace = null;
  if (!st || mode !== 'none' || player.position.distanceTo(st.c) >= st.r) return;
  autoQueue = land().stepAside(name, player.position);
  playerFace = st.c;
  autoLeft = 4;
  mode = 'auto';
  nextAside();
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
function startWalk() { mode = 'walk'; playerFace = null; showControls('walk'); }

// 조작 안내: 그 조작을 게임 시간으로 6초쯤 직접 써 보면 익힌 것으로 보고 다시 띄우지 않는다(state.learned).
const LEARN_SEC = 6;
const practice = { walk: 0, look: 0 };
function showControls(kind) { setControls(kind && !state.learned.includes(kind) ? kind : null); }
function practiced(kind, dt) {
  if (state.learned.includes(kind)) return;
  practice[kind] += dt;
  if (practice[kind] < LEARN_SEC) return;
  state.learned.push(kind);
  save(state);
  setControls(null);
}
function stopWalk() {
  mode = 'none';
  target = null;
  triggers = [];
  aimNearest = null;
  holdQuest = null;
  setGauge(null);
  setControls(null);
  setQuest(null);
  waypoint.set(null);
}

// 여러 목표를 순서 없이 찾는 퀘스트. 모두 찾으면 끝난다.
// hold(초)를 주면 다가가기만으로는 끝나지 않고, 목표 곁에 그 시간만큼 머물러 게이지를 채워야 한다.
let holdQuest = null;
function holdTick(dt) {
  const q = holdQuest;
  if (!q) return;
  if (mode !== 'walk') { setGauge(null); return; }
  let near = null, nd = Infinity;
  for (const x of q.left) { const d = x.pos.distanceTo(player.position); if (d < q.radius && d < nd) { nd = d; near = x; } }
  if (near !== q.cur) { q.cur = near; q.p = 0; }
  if (!near) { setGauge(null); return; }
  q.p += dt / q.hold;
  setGauge(q.label(near), q.p);
  if (q.p >= 1) { q.cur = null; q.p = 0; setGauge(null); q.found(near); }
}
function questFind({ title, targets, text, radius = 1.6, onFound, hold = 0, holdLabel }) {
  return new Promise((resolve) => {
    const left = new Set(targets);
    const render = () => setQuest({ title, items: targets.map((x) => ({ text: text(x), done: !left.has(x) })) });
    aimNearest = () => {
      let best = null, bd = Infinity;
      for (const x of left) { const d = x.pos.distanceTo(player.position); if (d < bd) { bd = d; best = x; } }
      waypoint.set(best ? best.pos : null);
    };
    const found = async (x) => {
      left.delete(x);
      render();
      if (onFound) { mode = 'none'; target = null; await onFound(x, targets.length - left.size, targets.length); }
      if (left.size === 0) { stopWalk(); resolve(); return; }
      mode = 'walk';
    };
    render();
    startWalk();
    if (hold) holdQuest = { left, radius, hold, label: holdLabel, found, cur: null, p: 0 };
    else for (const x of targets) addTrigger(x.pos, radius, () => found(x));
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
    state.look = await askLook(state.look, dressWith(lookSpec), {
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
    showControls('look');
    await waitButton(day < 7 ? `${DAY_NAMES[day + 1]}로` : '쉼터로 돌아가기');
    mode = 'none';
    setControls(null);
  }
  reward('creation/clear', 'clear');
  reach(state, 'eden'); // 다음 스테이지를 연다
  await fade(1);
  runShelter();
}

// 꾸미기에서 고를 때: 항목마다 그 항목다운 방식으로 바뀐다(정말 입고 물드는 느낌). docs/standards/ui.md '꾸미기 창' 참고.
//  옷 모양 → 발밑부터 새 옷이 차오른다 / 피부·옷 색·머리색·빛깔 → 새 색이 위에서 아래로 물든다
//  머리 모양·수염 → 머리에 빛 알갱이가 모였다 흩어지며 새 모양이 나온다 / 소품 → 빛이 손으로 날아와 소품이 된다
//  키 → 부드럽게 늘고 준다 / 나를 감싸는 빛 → 발밑 고리가 새 색으로 퍼진다 / 무작위 → 이 효과들이 차례로
const PART_HEIGHT = { hair: 1.4, beard: 1.15 };
const HAND = new THREE.Vector3(0.42, 0.82, 0.15);
const glow = (color, opacity = 0.95) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
const hexOf = (key, id) => (LOOK.earth[key] ?? LOOK.heaven[key])?.find((o) => o.id === id)?.hex;
let finishWipe = null; // 진행 중인 차오름/물듦을 바로 끝내는 함수(빨리 연달아 고를 때)

// 경계선(높이)이 움직이며 한쪽은 예전 몸, 다른 쪽은 새 몸만 그린다(재질 clippingPlanes, eden.js 가죽옷과 같은 방식).
function wipe(swap, { up = true, ms = 700, color = PAL.gold }) {
  finishWipe?.();
  const { rig } = player.userData;
  const old = new THREE.Group();
  old.add(...rig.children);
  player.add(old);
  swap();
  const top = 1.9 * (player.userData.height ?? 1);
  const showNew = new THREE.Plane(new THREE.Vector3(0, up ? -1 : 1, 0), 0);
  const showOld = new THREE.Plane(new THREE.Vector3(0, up ? 1 : -1, 0), 0);
  rig.traverse((o) => o.material && (o.material.clippingPlanes = [showNew]));
  old.traverse((o) => o.material && (o.material.clippingPlanes = [showOld]));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.55, 24), glow(color, 0.9));
  ring.rotation.x = -Math.PI / 2;
  player.add(ring);
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    player.remove(old, ring);
    old.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    ring.geometry.dispose();
    ring.material.dispose();
    rig.traverse((o) => o.material && (o.material.clippingPlanes = null));
    if (finishWipe === end) finishWipe = null;
  };
  finishWipe = end;
  return tween(ms, (p) => {
    if (done) return;
    const k = easeOut(p);
    const y = up ? k * top : (1 - k) * top;
    const wy = player.position.y + y;
    showNew.constant = up ? wy : -wy;
    showOld.constant = up ? -wy : wy;
    ring.position.y = y;
    ring.material.opacity = 0.9 * (1 - p * p);
    old.position.copy(rig.position);
    old.rotation.copy(rig.rotation);
    old.scale.copy(rig.scale);
  }).then(end);
}

// 빛 알갱이: 둘레에서 center로 모였다가(이때 바꾼다) 다시 흩어진다.
function sparkle(center, swap, color = PAL.holy) {
  const bits = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2, b = (i % 3 - 1) * 0.6;
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b));
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), glow(color));
    player.add(m);
    return { m, dir };
  });
  const at = (r, s) => bits.forEach(({ m, dir }) => { m.position.copy(center).addScaledVector(dir, r); m.scale.setScalar(s); });
  return tween(260, (p) => at(0.75 * (1 - easeOut(p)), 0.6 + p))
    .then(() => { swap?.(); return tween(320, (p) => { at(0.1 + easeOut(p) * 0.6, 1.6 * (1 - p) + 0.01); }); })
    .then(() => bits.forEach(({ m }) => { player.remove(m); m.geometry.dispose(); m.material.dispose(); }));
}

// 빛 한 덩이가 바깥에서 손으로 날아와 소품이 된다.
function orbToHand(swap) {
  const h = player.userData.height ?? 1;
  const hand = HAND.clone().multiplyScalar(h);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), glow(PAL.holy));
  player.add(orb);
  const from = new THREE.Vector3(1.1, 1.9, 0.9);
  return tween(380, (p) => { orb.position.lerpVectors(from, hand, easeOut(p)); orb.position.y += Math.sin(p * Math.PI) * 0.3; })
    .then(() => { player.remove(orb); orb.geometry.dispose(); orb.material.dispose(); return sparkle(hand, swap); });
}

// 발밑 고리가 퍼진다(나를 감싸는 빛).
function footRing(color) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.58, 24), glow(color, 0.9));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  player.add(ring);
  return tween(600, (p) => { ring.scale.setScalar(1 + easeOut(p) * 1.6); ring.material.opacity = 0.9 * (1 - p); })
    .then(() => { player.remove(ring); ring.geometry.dispose(); ring.material.dispose(); });
}

function dressFx(key, look, swap) {
  if (!key || matchMedia('(prefers-reduced-motion: reduce)').matches) { finishWipe?.(); swap(); return; }
  const h = player.userData.height ?? 1;
  const head = (k) => new THREE.Vector3(0, PART_HEIGHT[k] * h, 0);
  switch (key) {
    case 'outfit': wipe(swap, { up: true }); break;
    case 'skin': case 'outfitColor': case 'hairColor': case 'color':
      wipe(swap, { up: false, ms: 650, color: hexOf(key, look[key]) ?? PAL.gold }); break;
    case 'hair': case 'beard': sparkle(head(key), swap); break;
    case 'item': orbToHand(swap); break;
    case 'height': {
      const from = h;
      swap();
      const to = player.userData.height;
      player.userData.height = from;
      tween(450, (p) => (player.userData.height = from + (to - from) * easeOut(p)));
      break;
    }
    case 'aura': swap(); footRing(hexOf('aura', look.aura) ?? PAL.gold); break;
    case 'all': // 무작위: 발밑부터 새 모습이 차오르고, 이어서 머리·손·발밑에 빛이 차례로 지나간다
      wipe(swap, { up: true, ms: 800 })
        .then(() => sparkle(head('hair')))
        .then(() => orbToHand())
        .then(() => footRing(look.aura ? hexOf('aura', look.aura) ?? PAL.gold : PAL.gold));
      break;
    default: swap();
  }
}
const dressWith = (spec) => (look, key) => dressFx(key, look, () => { finishWipe?.(); dressFigure(player, spec(look)); });

// ---------- 꾸미기 방: 처음 땅에 내려가기 전, 지상에서의 모습을 전용 화면에서 고른다 ----------
// 손에 드는 물건(item)은 인벤토리에서 고르므로 꾸미기 화면(무작위 포함)에서 뺀다.
const EARTH_OPTIONS = Object.fromEntries(Object.entries(LOOK.earth).filter(([k]) => k !== 'item'));
async function runDressingRoom({ kicker = '에덴으로 내려가기 전', submit = '이 모습으로 내려가기' } = {}) {
  heaven.group.visible = angel.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); eden = null; }
  dressingRoom.visible = player.visible = true;
  showHud(false); // 꾸미기 화면에서는 HUD를 숨긴다
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
  dressFigure(player, earthSpec(state.earthLook ?? DEFAULT_EARTH)); // 화면을 걷기 전에 지상 모습을 입힌다
  await fade(0);
  turntable = true;
  state.earthLook = await askLook(state.earthLook ?? DEFAULT_EARTH, dressWith(earthSpec), {
    kicker,
    title: '지상에서의 내 모습',
    text: '땅에서도 사람들 눈에는 보이지 않아요.\n여러 시대를 함께 걸을 모습을 골라 주세요.',
    options: EARTH_OPTIONS,
    tabs: LOOK_TABS.earth,
    page: true,
    submit,
  });
  turntable = false;
  save(state);
  await fade(1);
  dressingRoom.visible = false;
  showHud(true);
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

// 성장 보상: 같은 보상은 한 번만 받고(key는 'eden/river/pishon'처럼 스테이지로 시작), 받은 것을 획득 알림으로 차례로 보여 준다.
// entry를 주면 도감에 처음 만난 스테이지를 남긴다.
// 경험치·달란트·레벨은 HUD(늘 보임)와 오른쪽 아래 획득 기록(잠깐)으로 보여 주고, 열매 성장만 가운데 획득 알림으로 띄운다.
function reward(key, kind, entry) {
  const stage = key.split('/')[0];
  if (entry) record(state, entry, stage);
  const before = levelOf(state.xp).level;
  const msgs = grant(state, key, REWARDS[kind]);
  save(state);
  if (!msgs) return;
  const { xp, talent } = REWARDS[kind];
  const after = levelOf(state.xp);
  logGain([
    xp && `경험치 +${xp}`, talent && `달란트 +${talent}`, after.level > before && `레벨 ${after.level} · ${after.title}`,
    ...looksOpened(before, after.level).map((it) => `꾸미기 열림 · ${it.name}`),
  ].filter(Boolean));
  refreshHud({ levelUp: after.level > before });
  for (const m of msgs) toast(m, { gain: true });
}
function note(entry, stage = 'eden') {
  record(state, entry, stage);
  save(state);
}
function meet(who, step, stage = 'eden') {
  record(state, `person/${who}`, stage);
  const msgs = bond(state, who, step);
  save(state);
  for (const m of msgs) toast(m, { gain: true });
}
const refreshHud = (gain) => setHud({ ...levelOf(state.xp), talents: state.talents }, gain);

// 메뉴(상태 창·도감): 걷는 중에만 연다(연출 중에는 막는다). M 키나 HUD의 메뉴 버튼.
async function showMenu() {
  if (mode !== 'walk' || menuIsOpen()) return;
  mode = 'none';
  target = null;
  // 손에 들기: 지상에서만(천국 모습에는 손에 드는 물건이 없다). 빛이 손으로 날아와 물건이 된다(dressFx 'item').
  const onHold = state.earthLook && land() ? (id) => {
    state.earthLook = { ...state.earthLook, item: id };
    save(state);
    dressWith(earthSpec)(state.earthLook, 'item');
  } : null;
  await openMenu(state, { stage: chapterOf(state.scene), onHold });
  mode = 'walk';
}
$('menuBtn').onclick = showMenu;
const chapterOf = (scene) => CHAPTERS.find((ch) => ch.points.some((p) => p.id === scene))?.id;
addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat && !menuIsOpen()) showMenu(); });

// 에덴의 대사: 말하는 인물이 고개를 끄덕이며 들썩인다(eden.acts.speak).
function talk(lines, ctx, opts = {}) {
  return say(lines, ctx, { choices: opts.choices, onLine: (l, i) => { land()?.acts.speak(l.who); opts.onLine?.(l, i); } });
}

// 막간: say 다음에 choose가 오면 그 say의 마지막 대사에서 선택지를 띄운다. 고른 뒤 자라는 열매를 획득 효과로 보여 주고 답을 듣는다.
// 열매 단계로 열린 선택지(need)에는 그 열매 이름과 새싹 표시를 단다. key/번호마다 열매는 한 번만 자란다.
async function runInterlude(data, key) {
  const { steps } = data;
  for (let i = 0; i < steps.length; i++) {
    const { say: lines } = steps[i];
    const next = steps[i + 1]?.choose;
    if (!next) { await talk(lines, state); continue; }
    const open = next.filter((c) => choiceOpen(state, c));
    const mark = (c) => c.need && SPIRIT.find((f) => f.id === Object.keys(c.need)[0]).name;
    const n = await talk(lines, state, { choices: open.map((c) => ({ text: c.text, mark: mark(c) })) });
    const picked = open[n];
    for (const m of chooseFruit(state, `${key}/${i + 1}`, picked.fruit)) toast(m, { gain: true });
    save(state);
    await talk(picked.reply, state);
    i++;
  }
}

async function runEdenGarden() {
  reach(state, 'eden');
  camFocus = eden.spots.adam;
  setStage('adam');
  await fade(0);
  note('place/eden');
  await talk(EDEN.arrive, state);
  await eden.acts.formAdam();
  meet('adam', 'met'); // 만남은 자동으로 오른다
  // 창 2:9 동산 가운데를 말하는 대사가 나오면 카메라가 가운데로 가고 선악을 알게 하는 나무에 빛이 내린다.
  let spotOn = false;
  await talk(EDEN.adamAfter, state, {
    onLine: (l) => {
      if (l.focus === 'center') { spotOn = true; camFocus = eden.spots.center; setView(10); setStage('center'); eden.acts.spotlight(true); }
      else if (spotOn) { spotOn = false; camFocus = eden.spots.adam; setView(13); setStage('adam'); eden.acts.spotlight(false); }
    },
  });
  camFocus = null;
  setStage(null);

  // 퀘스트 1: 네 강
  await questFind({
    title: '에덴에서 갈라진 네 강',
    targets: eden.riverEnds,
    text: (r) => `${r.name} 강으로 이동하기`,
    radius: 2,
    onFound: async (r) => { await talk(r.lines, state); reward(`eden/river/${r.id}`, 'river', `place/${r.id}`); },
  });
  await talk(EDEN.riversDone, state);
  reward('eden/rivers-done', 'riversDone');
  camFocus = eden.spots.adam;
  setStage('adam');
  await talk(EDEN.command, state);

  // 퀘스트 2: 동물 이름 짓기. 하나님께서 동물들을 아담에게 데려가시고(창 2:19), 아담이 관찰자 곁을 따라다닌다.
  await eden.acts.gatherAnimals();
  await talk(EDEN.animalsIntro, state);
  eden.acts.releaseAnimals();
  eden.acts.follow(eden.adam, player.position);
  setStage(null);
  camFocus = null;
  await questFind({
    title: '아담이 이름 지은 동물',
    targets: eden.animals.map((an) => ({ name: an.userData.name, pos: an.position, animal: an })),
    text: (a) => `${a.name} 곁에 머물러 이름 듣기`,
    radius: 2.4,
    hold: 1.6,
    holdLabel: (a) => `${a.name} 곁에 머무는 중`,
    onFound: async (a, n, total) => {
      a.animal.userData.calm = true;
      eden.acts.face(eden.adam, a.animal.position);
      camFocus = a.animal.position.clone().lerp(eden.adam.position, 0.5);
      await talk(NAMING, { ...state, animal: a.name });
      camFocus = null;
      const { kind } = a.animal.userData;
      const entry = CODEX.find((c) => c.id === `creature/${kind}`);
      await showCard({ title: entry.name, text: `${entry.fact} · ${entry.ref}`, count: `${n} / ${total}` });
      a.animal.userData.calm = false;
      reward(`eden/animal/${kind}`, 'animal', `creature/${kind}`);
    },
  });
  reward('eden/animals-done', 'animalsDone');
  eden.acts.follow(null);
  camFocus = eden.spots.adam;
  setStage('adam');
  await talk(EDEN.animalsDone.slice(0, 1), state);
  // 막간(창 2:20 뒤, 창 2:21 앞): 아담이 관찰자를 알아보고 끝까지 대화한다. 사건의 흐름은 바뀌지 않는다.
  eden.acts.face(eden.adam, player.position);
  playerFace = eden.adam.position;
  await runInterlude(INTERLUDE, 'eden/interlude');
  reward('eden/interlude', 'interlude');
  meet('adam', 'talked');
  // 창 2:21~22 화면 전환 없이: 아담이 잠들고, 옆구리에서 나온 빛이 하와가 된다.
  await eden.acts.sleep();
  await talk(EDEN.animalsDone.slice(1), state);
  await eden.acts.formEve();
  await talk(EDEN.eveAfter, state);
  camFocus = null;

  // 퀘스트 3: 먹어도 되는 열매. 따면 열매가 관찰자의 바구니로 날아가 담긴다.
  // 선악을 알게 하는 나무에 다가가면 대천사가 한 번 알려 준다.
  setStage(null);
  basket = makeBasket();
  basket.position.set(-0.6, 0.55, 0.15);
  basket.scale.setScalar(BASKET_SIZE);
  player.add(basket);
  // 하와와는 열매를 모으는 동안 다가가면 짧게 인사한다(막간의 짧은 인사, 관계 "만남").
  const greet = addTrigger(eden.eve.position, 2.2, async () => {
    mode = 'none';
    eden.acts.face(eden.eve, player.position);
    await talk(EVE_GREETING, state);
    meet('eve', 'met');
    mode = 'walk';
  });
  const warn = addTrigger(eden.knowledge.position, 2.4, async () => {
    mode = 'none';
    await talk(EDEN.forbidden, state);
    mode = 'walk';
  });
  await questFind({
    title: '먹어도 되는 열매',
    targets: eden.fruitTrees.map((tree) => ({ tree, pos: tree.position, name: tree.userData.fruitName })),
    text: (f) => `${f.name} 따서 바구니에 담기`,
    radius: 2,
    onFound: async (f, n) => {
      const kind = f.tree.userData.fruitKind;
      const picked = f.tree.userData.fruits.find((x) => x.visible);
      const from = picked.getWorldPosition(new THREE.Vector3());
      picked.visible = false;
      const fly = eden.makeFruit(kind);
      fly.scale.setScalar(2.4);
      scene.add(fly);
      const to = new THREE.Vector3();
      await tween(800, (p) => {
        basket.getWorldPosition(to);
        fly.position.lerpVectors(from, to, easeOut(p));
        fly.position.y += Math.sin(p * Math.PI) * 0.9;
      });
      scene.remove(fly);
      const inside = eden.makeFruit(kind);
      inside.position.copy(basket.userData.slots[(n - 1) % basket.userData.slots.length]);
      inside.scale.setScalar(1.4);
      basket.add(inside);
      toast(`${f.name}를 바구니에 담았어요`, { gain: true });
      reward(`eden/fruit/${kind}`, 'fruit', `creature/${kind}`);
      await tween(320, (p) => basket.scale.setScalar(BASKET_SIZE * (1 + Math.sin(p * Math.PI) * 0.3)));
    },
  });
  triggers = triggers.filter((x) => x !== warn && x !== greet);
  reward('eden/fruit-done', 'fruitDone');
  await talk(EDEN.fruitDone, state);
}

let basket = null;
const BASKET_SIZE = 1.6; // 바구니와 담긴 열매가 멀리서도 보이게 키운다

async function runEdenFall() {
  reach(state, 'fall');
  stopWalk();
  eden.acts.follow(null);
  if (basket) { player.remove(basket); basket = null; }
  // 타락이 시작되면 동물들은 저마다 자기 터로 걸어 돌아가고, 연출 무대(장면 앞)를 비켜 준다.
  eden.acts.sendHome();
  setStage('knowledge');
  camFocus = eden.spots.knowledge;
  await eden.acts.gatherAtTree();
  note('creature/serpent');
  await talk(FALL.serpent, state);
  await eden.acts.eat();
  await talk(FALL.ate, state);
  await eden.acts.fall();
  eden.acts.figLeaves();
  await talk(FALL.eyes, state);
  camFocus = eden.spots.hide;
  setStage('hide');
  await Promise.all([eden.acts.hide(), eden.acts.presence()]);
  await talk(FALL.trial.slice(0, 1), state); // "네가 어디 있느냐?"
  await eden.acts.comeOut();
  await talk(FALL.trial.slice(1), state);
  await talk(FALL.curse, state);
  await eden.acts.clothe();
  await talk(FALL.clothed, state);
  // 추방: 두 사람을 따라 동쪽 문 밖 거친 땅까지 카메라가 간다.
  camFocus = eden.adam.position;
  setStage('gate');
  setView(16);
  await eden.acts.expel();
  camFocus = eden.spots.gate;
  await talk(FALL.guarded, state);
  setView(13);
  await askQuiz(QUIZ);
  note('word/gen-2-7');
  note('word/gen-3-15');
  note('item/fig-leaf'); // 스테이지 기념물: 인벤토리에 두지 않고 도감에만 남는다
  reward('eden/quiz', 'quiz');
  reward('eden/clear', 'clear');
  await new Promise((r) => setTimeout(r, 2400)); // 마친 보상 알림을 본 뒤 화면을 덮는다
  await fade(1);
  runShelter();
}

// ---------- 장면: 가인과 아벨(창 4장) ----------
// 양 치기(퀘스트) → 저녁 막간(아벨) → 첫 새끼 데려가기(퀘스트) → 제사와 창 4:7 → 들(멀리서) → 심문과 놋 땅 → 셋 → 퀴즈
async function runCain() {
  if (!state.earthLook) await runDressingRoom({ kicker: '들판으로 내려가기 전' });
  heaven.group.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); eden = null; }
  if (cain) scene.remove(cain.group);
  cain = makeCain(scene);
  scene.add(cain.group);
  scene.background = cain.sky.clone();
  setEdges(true);
  setView(13);
  camAngle = 0;
  walkRadius = CAIN_RADIUS;
  placeCompanions(cain.spots.start);
  dressFigure(player, earthSpec(state.earthLook));
  mode = 'none';
  reach(state, 'cain');
  const { adam, eve, abel } = cain.people;
  const cainFig = cain.people.cain;

  camFocus = cain.spots.home;
  setStage('home');
  cain.acts.face(adam, eve.position);
  cain.acts.face(eve, adam.position);
  await fade(0);
  await talk(CAIN.arrive.slice(0, 2), state);
  camFocus = cain.spots.fold.clone().lerp(cain.spots.cain, 0.5); // 두 형제가 일하는 들판을 비춘다
  setView(16);
  await talk(CAIN.arrive.slice(2, 4), state);
  camFocus = null;
  setView(13);
  setStage(null);
  await talk(CAIN.arrive.slice(4), state);

  // 퀘스트 1: 양 치기(창 4:2). 양 곁에 머무르면 그 양이 우리로 걸어 들어간다. 가인 곁을 지나가면 짧은 인사를 듣는다.
  const greet = addTrigger(cainFig.position, 2.2, async () => {
    mode = 'none';
    cain.acts.face(cainFig, player.position);
    await talk(CAIN_GREETING, state);
    meet('cain', 'met', 'cain');
    mode = 'walk';
  });
  await questFind({
    title: '아벨의 양 떼',
    targets: cain.sheep.map((an) => ({ an, pos: an.position, name: an.userData.name })),
    text: (s) => `${s.name} 우리로 몰기`,
    radius: 1.8,
    hold: 1.2,
    holdLabel: (s) => `${s.name} 곁에 머무르기`,
    onFound: async (s) => {
      cain.acts.pen(s.an);
      reward(`cain/sheep/${s.an.userData.id}`, 'sheep');
    },
  });
  triggers = triggers.filter((x) => x !== greet);
  reward('cain/sheep-done', 'sheepDone');

  // 막간(창 4:3 "세월이 지난 후" 앞): 해 질 녘 우리 앞에서 아벨과 끝까지 대화한다.
  camFocus = cain.spots.abel;
  setStage('fold');
  await cain.acts.dusk(true);
  await talk(CAIN.sheepDone, state);
  cain.acts.face(abel, player.position);
  playerFace = abel.position;
  await runInterlude(CAIN_INTERLUDE, 'cain/interlude');
  reward('cain/interlude', 'interlude');
  meet('abel', 'talked', 'cain');
  await cain.acts.dusk(false); // 다음 날 아침

  // 퀘스트 2: 제물 준비(창 4:3~4). 어린양 곁에 머무르면 따라오고, 돌무더기 앞의 아벨에게 데려간다.
  setStage(null);
  camFocus = null;
  await talk(CAIN.offering, state);
  cain.acts.walkTo(abel, cain.spots.abelAltar.clone().add(new THREE.Vector3(-0.8, 0, 0.8)));
  await questFind({
    title: '첫 새끼',
    targets: [{ pos: cain.lamb.position, name: '어린양' }],
    text: () => '어린양 곁에 머무르기',
    radius: 2.2,
    hold: 1.5,
    holdLabel: () => '어린양 곁에 머무르기',
    onFound: async () => { cain.acts.lambFollow(player.position); note('creature/lamb', 'cain'); },
  });
  await questFind({
    title: '첫 새끼',
    targets: [{ pos: abel.position, name: '아벨' }],
    text: () => '어린양을 아벨에게 데려가기',
    radius: 1.8,
  });
  await cain.acts.lambToAltar();
  reward('cain/offering', 'offering');

  // 제사(창 4:3~7): 받으신 제물에 빛이 내리고, 가인이 고개를 떨군다. 하나님께서 형상 없는 빛으로 말씀하신다.
  camFocus = cain.spots.altars;
  setView(11);
  setStage('altars');
  note('person/cain', 'cain');
  await cain.acts.toAltars();
  await talk(CAIN.offered, state, { onLine: (l, i) => {
    if (l.focus === 'abel') cain.acts.accept();
    if (i === 2) cain.acts.sulk();
    if (i === 3) cain.acts.presence(cainFig);
  } });
  cain.acts.acceptEnd();

  // 창 4:8: 멀리서 비춘다. 가인이 다가가고 아벨이 쓰러지는 데까지만 보인다.
  setStage('field');
  await talk(CAIN.field, state);
  camFocus = cain.spots.fieldView; // 들보다 카메라 쪽을 비춰 땅 끝 너머 하늘이 덜 보이게 한다
  setView(14);
  await cain.acts.toField();
  await cain.acts.approach();
  await talk(CAIN.fallen, state);
  // 창 4:9~16: 빛이 가인 곁에 머문다. 표를 주시고, 가인은 동쪽으로 떠난다.
  camFocus = cainFig.position;
  setView(15);
  await cain.acts.presence(cainFig);
  await talk(CAIN.trial, state, { onLine: (l) => {
    if (l.ref === '창 4:15' && l.who === 'narr') cain.acts.mark();
    if (l.ref === '창 4:16') note('place/nod', 'cain');
  } });
  await cain.acts.leave();
  cain.acts.hideField();

  // 창 4:25~26 셋. 퀴즈(창 4:7).
  camFocus = cain.spots.home;
  setView(13);
  setStage('home');
  note('person/seth', 'cain');
  await talk(CAIN.seth, state);
  await askQuiz(CAIN_QUIZ);
  note('word/gen-4-7', 'cain');
  note('item/wool', 'cain'); // 스테이지 기념물: 도감에만 남는다
  reward('cain/quiz', 'quiz');
  reward('cain/clear', 'clear');
  await new Promise((r) => setTimeout(r, 2400));
  await fade(1);
  runShelter();
}

// ---------- 쉼터: 천국을 넓힌 광장. 스테이지를 마치면 돌아오고, 이어하기도 여기서 시작한다 ----------
// 빛의 문 → 월드 지도, 기록대 → 도감, 상점 천사 → 상점. 걸어서 닿으면 열리고, 닫으면 한 걸음 물러난다.
async function runShelter() {
  stopWalk();
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); eden = null; }
  if (cain) { scene.remove(cain.group); cain = null; }
  if (basket) { player.remove(basket); basket = null; }
  scene.background = new THREE.Color(0xfdf3d8);
  setEdges(true);
  heaven.group.visible = true;
  dressFigure(player, lookSpec(state.look));
  setView(12);
  camAngle = 0;
  walkRadius = 8.5;
  placeCompanions(new THREE.Vector3(0, 0, 3));
  mode = 'none';
  openNext(state); // 마친 스테이지 다음을 연다
  save(state);
  await fade(0);
  const spots = [
    { pos: heaven.gatePos, r: 1.6, open: async () => {
      const id = await openMap(state);
      if (!id) return false;
      await fade(1);
      stopWalk();
      startAt(id);
      return true;
    } },
    { pos: heaven.bookPos, r: 1.4, open: async () => { await openMenu(state, { only: 'codex', stage: chapterOf(state.scene) }); return false; } },
    { pos: heaven.shopPos, r: 1.6, open: async () => {
      await openMenu(state, { only: 'shop', onBuy: (id) => {
        const it = ITEMS.find((i) => i.id === id);
        if (!buyLook(state, id)) return false;
        save(state);
        refreshHud();
        logGain([`달란트 -${it.price}`, `꾸미기 · ${it.name}`]);
        return true;
      } });
      return false;
    } },
  ];
  const arm = (sp) => addTrigger(sp.pos, sp.r, async () => {
    mode = 'none';
    if (await sp.open()) return;
    // 한 걸음 물러나 다시 닿을 수 있게 한다
    const away = new THREE.Vector3().subVectors(player.position, sp.pos).setY(0);
    if (away.lengthSq() < 1e-6) away.set(0, 0, -1); // 정확히 그 자리에 서 있으면 광장 안쪽으로
    player.position.copy(sp.pos).add(away.setLength(sp.r + 0.5));
    mode = 'walk';
    arm(sp);
  });
  spots.forEach(arm);
  waypoint.set(heaven.gatePos);
  startWalk();
}

// ---------- 첫 화면 ----------
function startAt(id) {
  if (id === 'prologue') return runPrologue();
  if (id.startsWith('creation-')) return runCreation(Number(id.split('-')[1]));
  if (id === 'cain') return runCain();
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
    refreshHud();
    showHud(true);
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
  const showMain = () => {
    menu.classList.remove('menu--list', 'menu--cards');
    menu.replaceChildren(button('처음부터', begin(() => { state = newState(saved); dressFigure(player, lookSpec(state.look)); runPrologue(); })));
    if (saved) menu.append(button('이어하기', begin(() => { state = saved; runShelter(); }))); // 이어하기는 쉼터에서 시작한다
    if (saved?.name) menu.append(button('커스텀 변경하기', showLooks)); // 천국 꾸미기를 마친 사용자만
    if (saved) menu.append(button('도감', () => openMenu(saved, { only: 'codex', stage: chapterOf(saved.scene) }).then(() => menu.querySelector('button').focus({ preventScroll: true }))));
    menu.querySelector('button').focus({ preventScroll: true });
  };
  // 커스텀 변경하기: 천국 모습은 옆 창, 지상 모습은 전용 꾸미기 화면. 저장한 뒤 첫 화면으로 돌아온다.
  const showLooks = () => {
    menu.classList.remove('menu--cards');
    menu.classList.add('menu--list');
    const items = [button('천국 모습 변경하기', begin(() => editLook('heaven')))];
    // 첫 화면(메뉴)이 떠 있는 채로 먼저 빛으로 다 덮은 뒤에 첫 화면을 치운다. 순서가 바뀌면 덮이는 동안 천국 장면이 드러난다.
    if (saved.earthLook) items.push(button('지상 모습 변경하기', async () => { menu.inert = true; await fade(1); begin(() => editLook('earth'))(); }));
    menu.replaceChildren(head('어느 모습을 바꿀까요?'), ...items, backButton(showMain));
    menu.querySelector('button').focus({ preventScroll: true });
  };
  async function editLook(kind) {
    state = saved;
    showHud(false);
    if (kind === 'earth') await runDressingRoom({ kicker: '커스텀 변경하기', submit: '이 모습으로' }); // 화면은 메뉴에서 이미 덮었다
    else {
      camAngle = 0;
      player.visible = true;
      player.position.set(0, 0, -3);
      player.rotation.y = Math.PI / 4;
      camFollow = player.position;
      setView(7);
      turntable = true;
      state.look = await askLook(state.look, dressWith(lookSpec), {
        title: '천국에서의 내 모습',
        text: '고르는 대로 적용됩니다.',
        options: LOOK.heaven,
      });
      turntable = false;
      save(state);
      await fade(1);
    }
    location.reload();
  }
  const backButton = (fn) => {
    const back = button('돌아가기', fn);
    back.classList.add('menu__item--sub');
    return back;
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
let menuMode = null;
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const canMenu = mode === 'walk' && !$('hud').hidden;
  if (canMenu !== menuMode) { menuMode = canMenu; $('menuBtn').hidden = !canMenu; } // 메뉴 버튼은 걷는 중에만 보인다
  const t = clock.elapsedTime;
  movePlayer(dt, t);
  if (turntable) player.rotation.y += dt * 0.8;
  moveAngel(dt, t);
  checkTriggers();
  aimNearest?.();
  waypoint.update(t, player.position);
  creation?.update(dt, t);
  eden?.update(dt, t, player.position);
  cain?.update(dt, t, player.position);
  holdTick(dt);
  if (heaven.group.visible) heaven.pillar.userData.pulse(t);
  if (titleView) camAngle += dt * 0.06;
  if (mode === 'orbit') {
    camAngle += (held('KeyE') - held('KeyQ')) * dt * 1.5 + dt * 0.05;
    if (dragX !== null || held('KeyQ', 'KeyE')) practiced('look', dt);
  }
  camTarget.lerp(camFocus ?? camFollow, Math.min(1, dt * 4));
  camera.position.copy(camTarget).add(camOffset.clone().applyAxisAngle(Y_AXIS, camAngle));
  camera.lookAt(camTarget);
  composer.render();
  requestAnimationFrame(tick);
}

// 개발 서버에서만: 브라우저 점검용으로 캐릭터와 세계에 접근한다(배포 빌드에는 빠진다).
if (import.meta.env.DEV) globalThis.__dev = { player, get eden() { return eden; }, get cain() { return cain; }, get mode() { return mode; }, get state() { return state; }, interlude: () => runInterlude(INTERLUDE, 'eden/interlude'), cainInterlude: () => runInterlude(CAIN_INTERLUDE, 'cain/interlude') };

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
