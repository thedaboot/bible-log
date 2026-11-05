import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { PAL, makeHeaven, makeFigure, dressFigure, lookSpec, animateFigure, turnFigure, makeAngel, makeWaypoint, LOOK, LOOK_TABS, DEFAULT_EARTH, earthSpec, makeDressingRoom, makeBasket, disposeTree } from './props.js';
import { makeCreation } from './creation.js';
import { makeEden, EDEN_RADIUS } from './eden.js';
import { makeCain, CAIN_RADIUS } from './cain.js';
import { STAGE_MODS } from './stages/index.js';
import { PROLOGUE } from './data/prologue.js';
import { CREATION, DAY_NAMES } from './data/creation.js';
import { EDEN, FALL, QUIZ, NAMING, INTERLUDE, EVE_GREETING } from './data/eden.js';
import { CAIN, CAIN_QUIZ, CAIN_INTERLUDE, CAIN_GREETING } from './data/cain.js';
import { load, save, reach, newState, openNext } from './save.js';
import { CHAPTERS } from './data/chapters.js';
import { josa } from './text.js';
import { REWARDS, SPIRIT } from './data/growth.js';
import { grant, bond, record, levelOf, looksOpened, choiceOpen, chooseFruit, buyLook, addTool, useTool, assistOf, deepOpen, codexDone, canHold, stageLooks } from './growth.js';
import { CHALLENGE, CODEX_TITLES } from './data/growth.js';
import { WORLDS } from './data/chapters.js';
import { ITEMS, SHOP, STYLES } from './data/items.js';
import { CODEX_ART } from './codex-art.js';
import { ITEM_ICONS, HAIR_ICONS, EMPTY } from './icons.js';
import { CODEX } from './data/codex.js';
import { openMenu, menuIsOpen } from './menu.js';
import { openMap, stageInfo } from './map.js';
import { tween, easeOut, setInstant } from './anim.js';
import {
  $, isTouch, say, askName, askLook, askClear, setQuest, setControls, toast, fade, showDayTitle, waitButton, askQuiz, setGauge, showCard, setHud, showHud, popHud, askQuit } from './ui.js';

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
const camTmp = new THREE.Vector3();
let camFollow = ORIGIN; // 카메라가 따라가는 점(보통은 내 캐릭터)
let camFocus = null; // 연출 중에 잠시 바라보는 점
let camPair = null; // 두 인물 사이를 따라 비춘다(camFocus가 없을 때). [a, b]
let camAngle = 0;
let viewSize = 14;
let creation = null; // 창조의 일곱 날 장면(있으면 세로 화면도 전체 폭을 본다, resize)
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

// 천국 모습 고르기 창(옆 창, 휴대폰은 아래 시트)이 떠 있는 동안 내 캐릭터가 창에 가리지 않게 장면을 민다
let wideShot = false;
function sideView(on) { viewShift = on ? { x: 0.2, y: 0.2 } : null; resize(); }
function resize() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  // 세로 화면(휴대폰): 높이 기준으로만 넓히면 가로로 보이는 폭이 데스크톱의 3분의 1로 줄어 대상이 화면 밖으로 나가고,
  // 가로 폭을 viewSize 전체로 맞추면 인물이 너무 작아진다(2026-11-02 사용자 캡처 S01). 가로 폭을 viewSize의 0.72배로 두고
  // 화면 밖 목표는 가장자리 화살표가 가리킨다. 창조의 일곱 날만 하늘과 땅 전체를 봐야 해서 viewSize 전체 폭이다.
  // 큰 구조물 전체를 보이는 장면(방주 등, g.cam의 wide)도 세로 화면에서 양 끝이 잘리지 않게 넓게 본다(2026-11-03, S22부터 남은 문제)
  const fitW = creation ? 1 : wideShot ? 1.15 : 0.72;
  const view = aspect < 1 ? Math.max(viewSize * 1.35, (viewSize * fitW) / aspect) : viewSize;
  camera.left = (-view * aspect) / 2;
  camera.right = (view * aspect) / 2;
  camera.top = view / 2;
  camera.bottom = -view / 2;
  // 메뉴·패널이 없을 때도 대사 창이 덮는 쪽을 피해 장면을 민다: 세로 화면은 위로(가로 화면은 데스크톱처럼 그대로)
  // 낮은 가로 화면(높이 30rem 이하)은 대사 창이 아래 40% 안팎을 덮어 인물이 획득 알림 높이에 걸렸다(2026-11-03 1-5 캡처). 장면을 10% 위로 민다
  const lowLand = aspect >= 1 && h <= 480;
  const shift = viewShift ?? (aspect < 1 ? { x: 0, y: 0.05 } : lowLand ? { x: 0, y: 0.1 } : null);
  if (shift) camera.setViewOffset(w, h, aspect >= 1 ? shift.x * w : 0, aspect < 1 || (lowLand && !viewShift) ? shift.y * h : 0, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  pixelPass.setPixelSize(Math.max(3, Math.round(Math.min(w, h) / 200)));
}
addEventListener('resize', resize);
addEventListener('contextmenu', (e) => { if (!e.target.closest('input, textarea')) e.preventDefault(); }); // 길게 누르기 메뉴(F24)
resize();
function setView(size, wide = false) { viewSize = size; wideShot = wide; resize(); }

// ---------- 등장 요소 ----------
let state = load() ?? newState();
const heaven = makeHeaven();
const player = makeFigure(lookSpec(state.look));
const angel = makeAngel();
const waypoint = makeWaypoint();
// 목표가 화면 밖이면 화면 가장자리에 목표 쪽을 가리키는 표시를 띄운다(세로 화면에서 목표가 잘 안 보인다)
const edgeTmp = new THREE.Vector3();
function edgeArrow() {
  const el = $('edgeArrow');
  const tgt = waypoint.target;
  if (!tgt || mode !== 'walk') { el.hidden = true; return; }
  edgeTmp.set(tgt.x, (tgt.y ?? 0) + 1, tgt.z).project(camera);
  const w = innerWidth, h = innerHeight, m = 36;
  let x = ((edgeTmp.x + 1) / 2) * w, y = ((1 - edgeTmp.y) / 2) * h;
  if (edgeTmp.z < 1 && x > m && x < w - m && y > m && y < h - m) { el.hidden = true; return; }
  const cx = w / 2, cy = h / 2, a = Math.atan2(y - cy, x - cx);
  // 화면 가운데에서 목표 쪽으로 뻗은 선이 가장자리(여백 m)와 만나는 점
  const k = Math.min((w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (h / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
  x = cx + Math.cos(a) * k;
  y = cy + Math.sin(a) * k;
  el.hidden = false;
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${a}rad)`;
}
const dressingRoom = makeDressingRoom();
scene.add(heaven.group, player, angel, waypoint.group, dressingRoom);
let eden = null;
let cain = null;
let field = null; // 1-4부터의 스테이지 장면(field.js)
const land = () => eden ?? cain ?? field; // 지금 걷는 지상 장면

// ---------- 입력 ----------
// mode: 'none'(대사·연출 중) | 'walk'(걷기) | 'orbit'(창조를 둘러보기)
let mode = 'none';
const SPEED = 4;
let walkRadius = 8.5;
const keys = new Set();
const tapped = new Set(); // 한 프레임 안에 눌렀다 뗀 키도 그 프레임에는 누른 것으로 친다(프레임이 느린 기기)
let target = null;
let dragX = null;

addEventListener('keydown', (e) => { keys.add(e.code); tapped.add(e.code); });
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const canvas = renderer.domElement;
// 걷기 입력(2026-11-02 사용자 캡처 S04): 짧게 누르면 그 자리로 걸어가고, 누른 채 끌면 그 자리에 떠 있는 조이스틱이 생겨
// 끄는 방향으로 걷는다(화면 어디서 눌러도 된다. 모바일 액션 RPG의 흔한 방식). 키보드 걷기와 같은 방향 계산을 쓴다.
const STICK_DEAD = 12; // 이만큼(px) 끌어야 조이스틱이 된다(그 전에 떼면 탭)
const STICK_MAX = 40; // 손잡이가 움직이는 반지름(px)
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0, on: false };
const stickEl = $('stick');
function stickDraw() {
  stickEl.hidden = !stick.on;
  if (!stick.on) return;
  stickEl.style.transform = `translate(${stick.x}px, ${stick.y}px)`;
  const k = Math.min(1, STICK_MAX / (Math.hypot(stick.dx, stick.dy) || 1));
  stickEl.firstElementChild.style.transform = `translate(${stick.dx * k}px, ${stick.dy * k}px)`;
}
function stickEnd() { stick.id = null; stick.on = false; stick.dx = stick.dy = 0; stickDraw(); }
canvas.addEventListener('pointerdown', (e) => {
  if (mode === 'orbit') { dragX = e.clientX; canvas.setPointerCapture(e.pointerId); return; }
  if (mode !== 'walk' || stick.id !== null) return;
  Object.assign(stick, { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, on: false });
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (dragX !== null) { camAngle -= (e.clientX - dragX) * 0.008; dragX = e.clientX; return; }
  if (e.pointerId !== stick.id) return;
  stick.dx = e.clientX - stick.x;
  stick.dy = e.clientY - stick.y;
  if (!stick.on && Math.hypot(stick.dx, stick.dy) > STICK_DEAD && mode === 'walk') { stick.on = true; target = null; }
  stickDraw();
});
for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, (e) => {
  dragX = null;
  if (e.pointerId !== stick.id) return;
  if (mode === 'walk') practiced('walk', LEARN_SEC); // 탭·드래그를 한 번 쓰면 조작 안내를 닫고 다시 띄우지 않는다
  // 끌지 않고 뗐으면 탭: 누른 자리로 걸어간다
  if (!stick.on && ev === 'pointerup' && mode === 'walk') {
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    target = raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
  }
  stickEnd();
});

const held = (...codes) => (codes.some((c) => keys.has(c) || tapped.has(c)) ? 1 : 0);

// 걷기: 속도를 부드럽게 올리고 줄여서 출발과 멈춤이 자연스럽다. 흔들림과 기울기는 animateFigure가 맡는다.
const vel = new THREE.Vector3();
const want = new THREE.Vector3();
const pairPoint = new THREE.Vector3();
function movePlayer(dt, t) {
  want.set(0, 0, 0);
  // 'auto': 연출 중에 관찰자가 장면 앞을 비켜 걸어 나간다(키 입력은 받지 않는다). 게임 시간 4초 안에 못 닿으면 그 자리에 선다.
  if (mode === 'auto') autoLeft -= dt;
  if (mode === 'auto' && (!target || autoLeft <= 0)) { target = null; mode = 'none'; }
  if (mode === 'walk' || mode === 'auto') {
    let f = mode === 'walk' ? held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown') : 0;
    let r = mode === 'walk' ? held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft') : 0;
    // 조이스틱: 화면에서 끈 방향(위쪽이 앞)을 키보드와 같은 앞·옆 값으로 바꾼다. 조금 끌면 천천히 걷는다
    if (stick.on && mode === 'walk') {
      const len = Math.hypot(stick.dx, stick.dy), k = Math.min(1, len / STICK_MAX) / (len || 1);
      f = -stick.dy * k;
      r = stick.dx * k;
    }
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
    if (want.lengthSq() > 0) want.setLength(SPEED * (stick.on ? Math.max(0.45, Math.min(1, Math.hypot(stick.dx, stick.dy) / STICK_MAX)) : 1));
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
// soft: 지나가다 듣는 짧은 인사처럼 퀘스트를 끊으면 안 되는 지점. 머무르기 게이지가 차는 중이거나 도전 목표 곁이면 미룬다(S19).
function addTrigger(pos, r, cb, soft = false) { const trig = { pos, r, cb, soft }; triggers.push(trig); return trig; }
function checkTriggers() {
  if (mode !== 'walk') return;
  for (const trig of triggers) {
    if (trig.soft && (holdQuest?.cur || ch?.near)) continue; // 퀘스트 진행 중에는 짧은 인사를 미룬다
    if (player.position.distanceTo(trig.pos) < trig.r) {
      triggers = triggers.filter((x) => x !== trig);
      trig.cb();
      return;
    }
  }
}

let aimNearest = null; // 퀘스트 중이면 가장 가까운 목표로 길 안내를 맞춘다
let aimPos = null; // 지금 안내하는 목표(개발용 자동 플레이가 순간 이동에 쓴다)
function startWalk() { mode = 'walk'; playerFace = null; showControls('walk'); }

// 조작 안내: 그 조작을 게임 시간으로 6초쯤 직접 써 보면 익힌 것으로 보고 다시 띄우지 않는다(state.learned).
const LEARN_SEC = 2; // 키보드로 이만큼 걸으면 익힌 것으로 본다. 탭·드래그는 한 번 걸으면 바로(2026-11-02 사용자 요청: 처음 조작할 때만)
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
  stickEnd();
  triggers = [];
  aimNearest = null;
  aimPos = null;
  holdQuest = null;
  endChallenge();
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
      aimPos = best?.pos ?? null;
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
let angelAway = null; // 막간 상대: 대천사가 이 인물의 반대쪽(관찰자 뒤)에 서서 둘 사이를 가리지 않는다
const angelGoal = new THREE.Vector3();
function moveAngel(dt, t) {
  if (angelFollow && angelAway) {
    // 화면 가로 방향(1, 0, -1)으로만 비킨다. 카메라 쪽으로 나오면 관찰자를 가린다.
    const side = Math.sign((player.position.x - angelAway.position.x) - (player.position.z - angelAway.position.z)) || 1;
    angelGoal.set(side, 0, -side).setLength(1.4).add(player.position);
    angel.position.lerp(angelGoal, Math.min(1, dt * 2.5));
  } else if (angelFollow && angel.position.distanceTo(player.position) > 1.4) {
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
  camFocus = null; camPair = null;
}

// ---------- 장면: 천국 ----------
async function runPrologue() {
  showHud(false); // 이야기를 보는 장면: HUD 없이
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
    // 꾸미는 동안 내 캐릭터를 가까이에서 정면으로 보여 준다(세로 화면은 아래 시트 위쪽 절반에 크게)
    setView(innerWidth < innerHeight ? 5 : 7);
    player.rotation.y = Math.PI / 4;
    turntable = true;
    sideView(true);
    state.look = await askLook(state.look, dressWith(lookSpec), {
      title: '천국에서의 내 모습',
      text: '고르는 대로 바로 바뀌어요.',
      options: LOOK.heaven,
    });
    turntable = false;
    sideView(false);
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
  showHud(false);
  heaven.group.visible = player.visible = angel.visible = false;
  angelFollow = false;
  scene.background = new THREE.Color(0x020308);
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); disposeTree(creation.group); disposeTree(creation.stars); }
  creation = makeCreation(scene);
  scene.add(creation.group);
  camera.add(creation.stars);
  setView(24);
  camAngle = 0;
  camFollow = ORIGIN;
  camFocus = null; camPair = null;
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
    await waitButton(day < 7 ? `${DAY_NAMES[day + 1]}로` : '이야기 마치기');
    mode = 'none';
    setControls(null);
  }
  reward('creation/clear', 'clear');
  codexReward();
  reach(state, 'eden'); // 다음 스테이지를 연다
  afterStage('creation');
}

// 꾸미기에서 고를 때: 항목마다 그 항목다운 방식으로 바뀐다(정말 입고 물드는 느낌). docs/standards/ui.md '꾸미기 창' 참고.
//  옷 모양 → 발밑부터 새 옷이 차오른다 / 피부·옷 색·머리색·빛깔 → 새 색이 위에서 아래로 물든다
//  머리 모양·수염 → 머리에 빛 알갱이가 모였다 흩어지며 새 모양이 나온다 / 소품 → 빛이 손으로 날아와 소품이 된다
//  키 → 부드럽게 늘고 준다 / 나를 감싸는 빛 → 발밑 고리가 새 색으로 퍼진다 / 무작위 → 이 효과들이 차례로
const PART_HEIGHT = { hair: 1.4, beard: 1.15 };
const HAND = new THREE.Vector3(0.4, 0.6, 0.2); // 빛 구슬이 날아가는 손 자리: props.js HOLD의 내린 손(LOW)과 앞 손(FRONT) 사이(2026-11-03 꾸미기 조합)
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
// 지상 꾸미기: 소품 세 자리는 가진 것만 보인다(없음 + 가진 꾸미기·도구)
// 머리 모양과 소품은 글자 대신 미리보기 그림 칩으로 보인다(S11)
const earthOptions = () => Object.fromEntries(Object.entries(LOOK.earth).map(([k, list]) => {
  if (['item', 'waist', 'head'].includes(k)) return [k, list.filter((o) => canHold(state, o.id)).map((o) => ({ ...o, icon: ITEM_ICONS[o.id] ?? EMPTY }))];
  // 상점 머리·옷(STYLES)은 산 뒤에만 보인다
  const sold = (o) => !STYLES.some((s) => s.id === o.id) || state.items.looks.includes(o.id);
  if (k === 'hair') return [k, list.filter(sold).map((o) => ({ ...o, icon: HAIR_ICONS[o.id] }))];
  if (k === 'outfit') return [k, list.filter(sold)];
  return [k, list];
}));
async function runDressingRoom({ kicker = '에덴으로 내려가기 전', submit = '이 모습으로 내려가기' } = {}) {
  heaven.group.visible = angel.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); disposeTree(creation.group); disposeTree(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); disposeTree(eden.group); eden = null; }
  if (field) { scene.remove(field.group); disposeTree(field.group); field = null; }
  dressingRoom.visible = player.visible = true;
  showHud(false); // 꾸미기 화면에서는 HUD를 숨긴다
  scene.background = new THREE.Color(0xf6efe2);
  setEdges(true);
  player.position.set(0, 0, 0);
  player.rotation.y = Math.PI / 4;
  camFollow = new THREE.Vector3(0, 0.75, 0); // 발밑이 아니라 몸 가운데를 본다
  camFocus = null; camPair = null;
  camAngle = 0;
  camTarget.copy(camFollow);
  camOffset = ROOM_OFFSET;
  viewShift = { x: 0.2, y: 0.31 }; // 패널이 오른쪽(휴대폰은 아래 62%)에 있으니 캐릭터를 반대쪽(위 38%의 가운데)에 크게 둔다
  setView(4.2);
  dressFigure(player, earthSpec(state.earthLook ?? DEFAULT_EARTH)); // 화면을 걷기 전에 지상 모습을 입힌다
  await fade(0);
  turntable = true;
  state.earthLook = await askLook(state.earthLook ?? DEFAULT_EARTH, dressWith(earthSpec), {
    kicker,
    title: '지상에서의 내 모습',
    text: '땅에서도 사람들 눈에는 보이지 않아요.\n여러 시대를 함께 걸을 모습을 골라 주세요.',
    options: earthOptions(),
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
  refreshHud();
  showHud(true);
  if (!state.earthLook) await runDressingRoom();
  heaven.group.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); disposeTree(creation.group); disposeTree(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); disposeTree(eden.group); }
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
function reward(key, kind, entry, spirit) {
  const stage = key.split('/')[0];
  if (entry) record(state, entry, stage);
  const before = levelOf(state.xp).level;
  const msgs = grant(state, key, spirit ? { ...REWARDS[kind], spirit } : REWARDS[kind]);
  save(state);
  if (!msgs) return;
  const { xp, talent } = REWARDS[kind];
  const after = levelOf(state.xp);
  popHud({ xp, talent }); // 경험치·달란트는 HUD에서 숫자가 떠오른다
  refreshHud({ levelUp: after.level > before });
  // 레벨·꾸미기 열림·열매 성장은 HUD 아래 배너로 차례로
  if (after.level > before) toast(`레벨 ${after.level} · ${after.title}`, { gain: true, kind: 'level' });
  for (const it of looksOpened(before, after.level)) toast(`꾸미기 열림 · ${it.name}`, { gain: true });
  if (kind === 'clear') for (const it of stageLooks(stage)) toast(`대표 소품 · ${it.name}`, { gain: true });
  for (const m of msgs) toast(m, { gain: true });
}
function note(entry, stage = 'eden') {
  record(state, entry, stage);
  save(state);
}
function meet(who, step, stage = 'eden', spirit) {
  record(state, `person/${who}`, stage);
  const msgs = bond(state, who, step, spirit);
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
  // 소품은 손·허리·머리 세 자리(data/items.js slot). id가 'none'이면 key 자리를 비운다.
  const onHold = state.earthLook && land() ? (id, key = 'item') => {
    state.earthLook = { ...state.earthLook, [key]: id };
    save(state);
    dressWith(earthSpec)(state.earthLook, 'item');
  } : null;
  // 스테이지 중(지상 장면)에만 '쉼터로 나가기'. 쉼터에서는 보이지 않는다
  let quitting = false;
  const onQuit = land() && stageSnap ? () => { quitting = true; } : null;
  await openMenu(state, { stage: chapterOf(state.scene), onHold, onQuit });
  if (quitting && await askQuit()) {
    // 이 이야기에 들어설 때의 저장값으로 되돌리고 쉼터로 간다. 걷던 퀘스트·도전의 기다림은 stopWalk가 풀어 이전 진행은 그 자리에서 멈춘다
    for (const k of Object.keys(state)) if (!(k in stageSnap)) delete state[k];
    Object.assign(state, JSON.parse(JSON.stringify(stageSnap)));
    save(state);
    stopWalk();
    setQuest(null);
    speaker = speakerFrame = null;
    camFocus = null; camPair = null;
    await fade(1);
    runShelter();
    return;
  }
  mode = 'walk';
}
$('menuBtn').onclick = showMenu;
const chapterOf = (scene) => CHAPTERS.find((ch) => ch.points.some((p) => p.id === scene))?.id;
addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat && !menuIsOpen()) showMenu(); });

// 에덴의 대사: 말하는 인물이 고개를 끄덕이며 들썩인다(eden.acts.speak).
function talk(lines, ctx, opts = {}) {
  return say(lines, ctx, { choices: opts.choices, onLine: (l, i) => { land()?.acts.speak(l.who); speaker = figOf(l.who); speakerFrame = null; opts.onLine?.(l, i); } })
    .finally(() => { speaker = speakerFrame = null; });
}
// 말하는 인물 비추기(2026-11-03 사용자 F23·F32 "대화 중 아담·노아가 화면 밖"): 대사가 떠 있는 동안 말하는 인물이 화면 밖이거나
// 대사 창 뒤로 내려가면, 그 대사가 끝날 때까지 인물과 관찰자 사이를 비춘다(한 번 잡으면 놓지 않아 카메라가 흔들리지 않는다).
let speaker = null, speakerFrame = null;
const figOf = (who) => { const L = land(); return L?.people?.[who] ?? (L && L === eden ? { adam: eden.adam, eve: eden.eve }[who] : null) ?? null; };
const ndc = new THREE.Vector3();
function speakerFocus() {
  if (!speaker?.visible || $('dialog').hidden) return null;
  if (!speakerFrame) {
    ndc.copy(speaker.position).setY(speaker.position.y + 1).project(camera);
    const bottom = innerHeight <= 480 && innerWidth > innerHeight ? -0.1 : -0.45; // 대사 창이 덮는 아래쪽
    if (Math.abs(ndc.x) < 0.82 && ndc.y < 0.8 && ndc.y > bottom) return null;
    speakerFrame = player.visible ? speaker.position.clone().lerp(player.position, 0.45) : speaker.position.clone();
  }
  return speakerFrame;
}

// 막간: say 다음에 choose가 오면 그 say의 마지막 대사에서 선택지를 띄운다. 고른 뒤 자라는 열매를 획득 효과로 보여 주고 답을 듣는다.
// 열매 단계로 열린 선택지(need)에는 그 열매 이름과 새싹 표시를 단다. key/번호마다 열매는 한 번만 자란다.
async function runInterlude(data, key) {
  const { steps } = data;
  // 막간 상대가 관찰자에게서 멀면(에덴: 이름 짓기를 마친 자리) 관찰자 화면 왼쪽 곁으로 걸어오고, 카메라가 두 사람 사이를 비춘다(2026-11-03 F23)
  const fig = figOf(data.who);
  const L = land();
  if (fig?.visible && player.visible && L?.acts.walkTo && fig.position.distanceTo(player.position) > 2.4) {
    const spot = player.position.clone().add(new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(1.5)).setY(0);
    L.collide?.(spot, 0.35);
    await L.acts.walkTo(fig, spot, 2.4);
  }
  if (fig) { L?.acts.face?.(fig, player.position); playerFace = fig.position; }
  // 에덴은 막간 전에 아담의 처음 자리(spots.adam)를 비추고 있어서, 이름 짓기로 옮겨 간 두 사람이 화면 밖이었다. 막간 동안은 늘 두 사람 사이를 비춘다
  const camBefore = camFocus;
  if (fig) camFocus = fig.position.clone().lerp(player.position, 0.5).add(new THREE.Vector3(1.4, 0, 1.4));
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
  if (fig) camFocus = camBefore;
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
  // 동물이 모이는 걸음(최대 6초)을 대사 없이 기다리면 아담이 가만히 서 있었다(2026-11-03 F20). 창 2:19 대사와 함께 모인다
  let gather = null;
  await talk(EDEN.animalsIntro, state, { onLine: (l, i) => { if (i >= 1 && !gather) { gather = eden.acts.gatherAnimals(); } } });
  await (gather ?? eden.acts.gatherAnimals());
  eden.acts.releaseAnimals();
  eden.acts.follow(eden.adam, player.position);
  setStage(null);
  camFocus = null;
  await questFind({
    title: '아담이 이름 지은 동물',
    targets: [...eden.animals.map((an) => ({ name: an.userData.name, pos: an.position, animal: an })), { name: '참새', pos: eden.perch.ground, animal: eden.perch.bird }],
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
      await showCard({ title: entry.name, text: entry.fact, ref: entry.ref, count: `${n} / ${total}`, pic: CODEX_ART[entry.id] });
      a.animal.userData.calm = false;
      reward(`eden/animal/${kind}`, 'animal', `creature/${kind}`);
    },
  });
  reward('eden/animals-done', 'animalsDone');
  eden.acts.follow(null);
  // 이름 짓기를 마친 뒤로는 아담과 관찰자 사이를 비춘다(2026-11-05 F47). 아담의 처음 자리를 비추면 두 사람이 화면 밖이었다
  camFocus = null;
  camPair = [eden.adam, player];
  await talk(EDEN.animalsDone.slice(0, 1), state);
  // 막간(창 2:20 뒤, 창 2:21 앞): 아담이 관찰자를 알아보고 끝까지 대화한다. 사건의 흐름은 바뀌지 않는다.
  eden.acts.face(eden.adam, player.position);
  playerFace = eden.adam.position;
  await runInterlude(INTERLUDE, 'eden/interlude');
  reward('eden/interlude', 'interlude');
  meet('adam', 'talked');
  // 창 2:21~22 화면 전환 없이: 아담이 잠들고, 옆구리에서 나온 빛이 하와가 된다.
  // 아담이 처음 자리로 돌아가 잠드는 동안 관찰자도 다리를 건너 곁을 따라간다(F47: 멀리 남으면 두 사람이 한 화면에 안 들어온다).
  // 잠든 뒤에는 하와가 지어지는 자리(무대)를 비켜 선다
  setStage('adam');
  playerFace = null;
  eden.acts.follow(player, eden.adam.position);
  // 걸어가는 몇 초를 대사 없이 기다리지 않게 창 2:21 서술과 함께 간다(대기 3초 규칙)
  const sleeping = eden.acts.sleep();
  await talk(EDEN.animalsDone.slice(1), state);
  await sleeping;
  eden.acts.follow(null);
  setStage('adam');
  await eden.acts.formEve();
  await talk(EDEN.eveAfter, state);
  camFocus = null;
  camPair = null;

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
      toast(`${josa(f.name, '을', '를')} 바구니에 담았어요`, { gain: true });
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
  codexReward();
  await new Promise((r) => setTimeout(r, 2400)); // 마친 보상 알림을 본 뒤 마침 창을 띄운다
  afterStage('eden');
}

// ---------- 장면: 가인과 아벨(창 4장) ----------
// 양 치기(퀘스트) → 저녁 막간(아벨) → 첫 새끼 데려가기(퀘스트) → 제사와 창 4:7 → 들(멀리서) → 심문과 놋 땅 → 셋 → 퀴즈
async function runCain() {
  refreshHud();
  showHud(true);
  if (!state.earthLook) await runDressingRoom({ kicker: '들판으로 내려가기 전' });
  heaven.group.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); disposeTree(creation.group); disposeTree(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); disposeTree(eden.group); eden = null; }
  if (cain) { scene.remove(cain.group); disposeTree(cain.group); }
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
    text: (s) => `${s.name} 곁에 머물러 우리로 보내기`,
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
  // 두 형제가 들로 걷는 동안 대사를 띄운다(대사 없이 기다리는 구간 3초 이하, quests-and-staging.md)
  setStage('field');
  camFocus = cain.spots.fieldView; // 들보다 카메라 쪽을 비춰 땅 끝 너머 하늘이 덜 보이게 한다
  setView(14);
  const toField = cain.acts.toField();
  await talk(CAIN.field, state);
  await toField;
  await cain.acts.approach();
  await talk(CAIN.fallen, state);
  // 각색: 가인이 주위를 살피고 아벨을 덤불 밑으로 끌어다 흙으로 덮는다(아직 멀리서). 동작은 대사와 겹쳐 시작한다.
  let hiding;
  await talk(CAIN.hidden, state, { onLine: (l, i) => { hiding = i ? (hiding ?? Promise.resolve()).then(cain.acts.cover) : cain.acts.drag(); } });
  await hiding;
  // 창 4:9~15: 빛이 덮은 자리 곁의 가인에게 내려온다. 카메라는 그 자리에 고정한다(가인을 따라가지 않는다).
  camFocus = cain.spots.trial;
  setView(12);
  await cain.acts.presence(cainFig);
  let leave;
  await talk(CAIN.trial, state, { onLine: (l) => {
    if (l.who === 'cain') cain.acts.faceLight();
    if (l.focus === 'cry') cain.acts.cry();
    if (l.ref === '창 4:15' && l.who === 'narr') cain.acts.mark();
    // 창 4:16: 하나님 말씀이 다 끝난 뒤 떠나는 걸음을 시작한다. 화면 안에서 멀어지고, 대사를 넘긴 뒤 사라진다.
    if (l.ref === '창 4:16' && !leave) { note('place/nod', 'cain'); leave = cain.acts.leave(); }
  } });
  await leave;
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
  codexReward();
  await new Promise((r) => setTimeout(r, 2400));
  afterStage('cain');
}

// ---------- 도전(docs/design.md "도전 조작"): 이동 WASD, 행동 Space, 도구 F ----------
// 목표 자리(spots)에 다가가면 막대가 나타나고, 표시가 금빛 구간에 들어왔을 때 Space를 누르면 한 번 성공한다.
// 자리마다 hits번 성공하면 끝난다. 실패해도 감점 없이 다시 한다. 열매가 자라 있으면 금빛 구간이 넓어진다(assistOf).
// spot.tool이 있으면 먼저 F로 도구를 써야 행동할 수 있다(예: 물동이에 물 긷기). 다 끝나면 도구를 하나 쓴다(useTool).
let ch = null;
const GRACE_MS = 150; // 도전 판정 여유: 누르기 전 이 시간 안에 표시가 금빛 구간에 있었으면 성공(터치·화면 지연)
// 난도(2026-11-03 사용자 F18 "갈수록 어렵게"): 성공할 때마다, 그리고 같은 스테이지의 다음 도전(tier)일수록 구간이 좁아지고 표시가 빨라진다.
// 성공 k번째: 속도 ×(1 + 0.12k), 구간 ×(1 − 0.08k). tier: 속도 ×(1 + 0.15·tier), 구간 ×(1 − 0.1·tier). 구간은 기본의 0.5배, 속도는 1.8배에서 멈춘다.
const challengeLevel = (k, tier = 0) => ({ speed: Math.min(1.8, (1 + 0.12 * k) * (1 + 0.15 * tier)), zone: Math.max(0.5, (1 - 0.08 * k) * (1 - 0.1 * tier)) });
function runChallenge({ title, spots, verb = '행동', hits = 3, fruits = [], tool = null, toolName = '', radius = 2, onHit, onTool, onMiss, missText = '다시 해 보세요', speed = CHALLENGE.speed, tier = 0, kind = 'time', hitText = '살살, 잘 뺐어요!', lowText = '조금 더 당겨요', onHold }) {
  return new Promise((resolve) => {
    const assist = assistOf(state, fruits);
    const left = new Set(spots);
    for (const sp of spots) { sp.n = 0; sp.ready = !sp.tool; }
    const render = () => setQuest({ title, items: spots.map((sp) => ({ text: sp.text, done: !left.has(sp) })) });
    const panel = $('challenge');
    $('chActName').textContent = verb;
    $('chTool').hidden = !tool;
    $('chToolName').textContent = toolName;
    let done = 0; // 이 도전에서 성공한 수(난도가 오른다)
    const newZone = () => {
      const lvl = challengeLevel(done, tier);
      ch.speed = speed * lvl.speed;
      const w = Math.min(0.6, CHALLENGE.zone * lvl.zone * (1 + assist) * (kind === 'time' ? 1 : 1.4));
      // 박자(rhythm)는 끝 가까이 고정, 꾹 누르기(hold)는 뒤쪽 절반 어딘가, 타이밍(time)은 아무 데나
      const at = kind === 'rhythm' ? 0.7 : kind === 'hold' ? 0.45 + Math.random() * (0.5 - w) : 0.15 + Math.random() * (0.7 - w);
      ch.zone = [at, 0];
      ch.zone[1] = ch.zone[0] + w;
      $('chZone').style.transform = `translateX(${ch.zone[0] * 100}%) scaleX(${w})`;
    };
    const flash = (cls) => { panel.classList.remove('is-hit', 'is-miss'); void panel.offsetWidth; panel.classList.add(cls); };
    const label = (text) => { ch.msg = text; ch.msgT = 1.2; };
    // 동작 세 가지(2026-11-03 사용자 F30b "힘 모으기 한 방식이 질린다"):
    //  time   표시가 오가다 금빛 구간에 들어올 때 누른다(물 붓기, 씨름, 꿈 풀기)
    //  rhythm 표시가 한쪽으로 흘러가며 박자마다 금빛 구간을 지난다. 박자에 맞춰 BEATS번 이어 누르면 한 번 성공(망치질)
    //  hold   꾹 누르는 동안 표시가 점점 빨리 차오른다. 금빛 구간에서 떼면 성공, 끝까지 가면 너무 세게(가시 빼기)
    const BEATS = 3;
    const inZone = (m) => m >= ch.zone[0] && m <= ch.zone[1];
    const miss = (sp, text = missText) => { label(text); flash('is-miss'); onMiss?.(sp); };
    const act = async () => {
      const sp = ch?.near;
      if (!sp || mode !== 'walk' || ch.busy) return;
      if (!sp.ready) { label(`${isTouch() ? '' : 'F 키로 '}${toolName} 먼저 쓰기`); flash('is-miss'); return; }
      if (kind === 'hold') { ch.holding = true; ch.m = 0; return; }
      // 판정(2026-11-02 S20 "구간에 들어왔는데 안 될 때가 많다"): 눈에 보인 표시는 몇 프레임 전 자리이고, 터치는 손을 댄 뒤
      // 조금 늦게 온다. 표시는 0.1초에 구간 폭(0.12)만큼 움직여서 그 사이에 구간을 벗어났다. 최근 GRACE_MS 안에 구간에 있었으면 성공이다.
      const now = performance.now();
      const ok = inZone(ch.m) || ch.hist.some((h) => now - h.t <= GRACE_MS && inZone(h.m));
      if (kind === 'rhythm') {
        if (ch.beatPressed) return; // 한 박자에 한 번만
        ch.beatPressed = true;
        if (!ok) { ch.combo = 0; miss(sp, '박자가 어긋났어요'); return; }
        ch.combo++;
        if (ch.combo < BEATS) { label(`좋아요! ${ch.combo} / ${BEATS}`); flash('is-hit'); return; }
        ch.combo = 0;
        return succeed(sp, '탕! 단단히 박혔어요');
      }
      if (!ok) { miss(sp); return; }
      // 구간 한가운데(가운데 40%)에 맞히면 "딱 맞아요"
      const mid = (ch.zone[0] + ch.zone[1]) / 2, half = (ch.zone[1] - ch.zone[0]) / 2;
      const best = Math.min(Math.abs(ch.m - mid), ...ch.hist.filter((h) => now - h.t <= GRACE_MS).map((h) => Math.abs(h.m - mid)));
      return succeed(sp, best <= half * 0.4 ? '딱 맞아요!' : '좋아요!');
    };
    // 꾹 누르기: 손을 떼는 순간 판정한다
    const release = () => {
      if (kind !== 'hold' || !ch?.holding) return;
      ch.holding = false;
      const sp = ch.near;
      const m = ch.m;
      ch.m = 0;
      if (!sp || ch.busy) return;
      if (inZone(m)) succeed(sp, hitText);
      else if (m < ch.zone[0]) { label(lowText); flash('is-miss'); } // 덜 당긴 것은 실패 반응(onMiss) 없이 다시
      else miss(sp);
    };
    const succeed = async (sp, text) => {
      label(text);
      flash('is-hit');
      sp.n++;
      done++;
      ch.busy = true;
      mode = 'none';
      await onHit?.(sp, sp.n);
      mode = 'walk';
      ch.busy = false;
      if (sp.n >= (sp.hits ?? hits)) { left.delete(sp); render(); }
      if (!left.size) {
        stopWalk();
        // 도구는 다 쓰면 사라진다. 손에 들고 있었으면 맨손이 되는 모습을 보여 준다.
        if (tool && useTool(state, tool) && state.earthLook.item === 'none') dressWith(earthSpec)(state.earthLook, 'item');
        save(state);
        resolve();
        return;
      }
      newZone();
    };
    const useIt = async () => {
      const sp = ch?.near;
      if (!sp || !sp.tool || sp.ready || mode !== 'walk' || ch.busy) return;
      if (!state.items.tools.includes(tool)) { label(`${toolName}이 없어요`); return; }
      sp.ready = true;
      ch.busy = true;
      mode = 'none';
      await onTool?.(sp);
      mode = 'walk';
      ch.busy = false;
      flash('is-hit');
    };
    const onKey = (e) => {
      if (mode !== 'walk' || e.repeat) return;
      if (e.code === 'Space') { e.preventDefault(); act(); }
      if (e.code === 'KeyF') { e.preventDefault(); useIt(); }
    };
    const onKeyUp = (e) => { if (e.code === 'Space') release(); };
    ch = { left, near: null, m: 0, dir: 1, zone: [0, 0], speed, radius, verb, hits, act, onKey, onKeyUp, panel, busy: false, msg: '', msgT: 0, toolName, hist: [],
      kind, onHold, beats: BEATS, combo: 0, beatPressed: false, holding: false, release: () => release(), miss: (sp, text) => miss(sp, text),
      auto: () => { if (ch.near) succeed(ch.near, '좋아요!'); } }; // auto: 개발용 자동 플레이(한 번 성공)
    newZone();
    panel.dataset.kind = kind;
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKeyUp);
    // 버튼은 손이 닿는 순간(pointerdown)에 판정한다. click은 손을 뗀 뒤에 와서 늦다. 키보드(Enter)로 누른 click만 따로 받는다.
    $('chAct').onpointerdown = (e) => { e.preventDefault(); act(); };
    $('chAct').onpointerup = $('chAct').onpointercancel = $('chAct').onpointerleave = () => release();
    $('chAct').onclick = (e) => { if (e.detail === 0) act(); };
    $('chTool').onpointerdown = (e) => { e.preventDefault(); useIt(); };
    $('chTool').onclick = (e) => { if (e.detail === 0) useIt(); };
    aimNearest = () => {
      let best = null, bd = Infinity;
      for (const x of left) { const d = x.pos.distanceTo(player.position); if (d < bd) { bd = d; best = x; } }
      waypoint.set(best ? best.pos : null);
      aimPos = best?.pos ?? null;
    };
    render();
    startWalk();
  });
}
function endChallenge() {
  if (!ch) return;
  removeEventListener('keydown', ch.onKey);
  removeEventListener('keyup', ch.onKeyUp);
  $('chAct').onpointerup = $('chAct').onpointercancel = $('chAct').onpointerleave = null;
  ch.panel.hidden = true;
  ch = null;
}
// 막대 표시가 오가고, 금빛 구간에 들어오면 패널이 금빛으로 바뀐다. 목표 곁에 있을 때만 보인다.
function challengeTick(dt) {
  if (!ch) return;
  let near = null, nd = Infinity;
  for (const sp of ch.left) { const d = sp.pos.distanceTo(player.position); if (d < ch.radius && d < nd) { nd = d; near = sp; } }
  ch.near = near;
  ch.panel.hidden = !near || mode !== 'walk';
  if (!near) return;
  if (ch.kind === 'rhythm') {
    // 한쪽으로 흘러가고 끝에서 처음으로 돌아온다(한 바퀴가 한 박자). 박자를 그냥 보내면 이어 친 수가 끊긴다
    ch.m += ch.speed * dt;
    if (ch.m > 1) {
      ch.m -= 1;
      if (ch.combo && !ch.beatPressed) { ch.combo = 0; ch.msg = '박자를 놓쳤어요'; ch.msgT = 1.2; }
      ch.beatPressed = false;
    }
  } else if (ch.kind === 'hold') {
    // 누르는 동안 점점 빨리 차오른다. 끝까지 가면 너무 세게 당긴 것이다
    if (ch.holding && !ch.busy) {
      ch.m += ch.speed * dt * (0.45 + ch.m);
      if (ch.m >= 1) { ch.holding = false; ch.m = 0; ch.miss(near); }
    }
    ch.onHold?.(ch.holding ? ch.m : 0); // 꾹 누르는 진행(0~1). 장면이 물높이 등에 쓴다
  } else {
    ch.m += ch.dir * ch.speed * dt;
    if (ch.m > 1) { ch.m = 1; ch.dir = -1; }
    if (ch.m < 0) { ch.m = 0; ch.dir = 1; }
  }
  // 최근 표시 자리(판정 여유용). GRACE_MS보다 오래된 것은 버린다
  const now = performance.now();
  ch.hist.push({ t: now, m: ch.m });
  while (ch.hist.length && now - ch.hist[0].t > GRACE_MS) ch.hist.shift();
  $('chMark').style.transform = `translateX(${ch.m * $('chTrack').clientWidth}px)`;
  ch.panel.classList.toggle('is-gold', near.ready && ch.m >= ch.zone[0] && ch.m <= ch.zone[1]);
  ch.msgT -= dt;
  const how = ch.kind === 'rhythm' ? ` · 박자 ${ch.combo} / ${ch.beats}` : ch.kind === 'hold' && !ch.holding ? ' · 꾹 눌렀다 금빛에서 떼기' : '';
  $('chLabel').textContent = ch.msgT > 0 ? ch.msg : near.ready ? `${ch.verb} ${near.n} / ${near.hits ?? ch.hits}${how}` : `${isTouch() ? '' : 'F 키로 '}${ch.toolName || '도구'} 쓰기`;
}

// ---------- 1-4부터의 스테이지: src/stages/<id>.js가 장면(build)과 진행(run)을 맡고, 여기는 공용 기능(g)만 건넨다 ----------
async function runStage(id) {
  refreshHud();
  showHud(true);
  const mod = STAGE_MODS[id];
  if (!state.earthLook) await runDressingRoom({ kicker: mod.kicker ?? '땅으로 내려가기 전' });
  heaven.group.visible = false;
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); disposeTree(creation.group); disposeTree(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); disposeTree(eden.group); eden = null; }
  if (cain) { scene.remove(cain.group); disposeTree(cain.group); cain = null; }
  if (field) { scene.remove(field.group); disposeTree(field.group); }
  field = mod.build(scene);
  scene.add(field.group);
  scene.background = field.sky.clone();
  setEdges(true);
  setView(13);
  camAngle = 0;
  walkRadius = field.radius;
  placeCompanions(field.spots.start);
  dressFigure(player, earthSpec(state.earthLook));
  mode = 'none';
  reach(state, id);
  await fade(0);
  await mod.run(stageApi(id, mod));
}

function stageApi(id, mod) {
  const F = field;
  const g = {
    F, state, player, V: (x, z) => new THREE.Vector3(x, 0, z),
    talk: (lines, opts) => talk(lines, state, opts),
    cam: (p, view, wide = false) => { camFocus = p ?? null; if (view) setView(view, wide); },
    stage: (name) => setStage(name),
    quest: questFind,
    challenge: runChallenge,
    reward: (key, kind, entry, spirit) => reward(`${id}/${key}`, kind, entry, spirit),
    note: (entry) => note(entry, id),
    meet: (who, step = 'met', spirit) => meet(who, step, id, spirit),
    // 관찰자가 인물을 바라본다(막간, 짧은 인사)
    // 관찰자와 대천사: 보이지 않게(방주 안 등) 하거나 그 자리에 다시 세운다
    hideCompanions: () => { player.visible = angel.visible = false; angelFollow = false; },
    place: (p) => placeCompanions(p),
    lookAt: (fig) => { F.acts.face(fig, player.position); playerFace = fig.position; },
    // 막간: 인물과 끝까지 대화한다. 마치면 관계 "대화"와 보상.
    interlude: async (fig, data = mod.data.interlude) => {
      g.lookAt(fig);
      angelAway = fig;
      // 선택지 패널(화면 아래 오른쪽)이 두 사람을 가리지 않게, 둘 사이에서 카메라 쪽으로 옮긴 점을 비춘다(인물이 화면 위로 오른다)
      camFocus = fig.position.clone().lerp(player.position, 0.5).add(new THREE.Vector3(1.4, 0, 1.4));
      setView(11);
      await runInterlude(data, `${id}/interlude`);
      reward(`${id}/interlude`, 'interlude');
      meet(data.bond ?? data.who, 'talked', id);
      playerFace = null;
      angelAway = null;
    },
    // 걷는 동안 인물 곁을 지나가면 한 번 듣는 짧은 인사(관계 "만남"). 지울 함수를 돌려준다.
    greet: (fig, lines, who) => {
      const trig = addTrigger(fig.position, 2.2, async () => {
        mode = 'none';
        F.acts.face(fig, player.position);
        await talk(lines, state);
        meet(who, 'met', id);
        mode = 'walk';
      }, true);
      return () => { triggers = triggers.filter((x) => x !== trig); };
    },
    // 깊은 대화(design.md): 관계 "대화" 이상 + 레벨 조건이면 열린다. 닫혀 있으면 짧은 인사(locked)만 한다.
    deep: (fig, data) => {
      const trig = addTrigger(fig.position, 2.2, async () => {
        mode = 'none';
        g.lookAt(fig);
        if (deepOpen(state, data.who)) {
          const back = camFocus;
          angelAway = fig;
          camFocus = fig.position.clone().lerp(player.position, 0.5).add(new THREE.Vector3(1.4, 0, 1.4));
          await runInterlude(data, `${id}/deep`);
          camFocus = back;
          angelAway = null;
          reward(`${id}/deep`, 'deep');
        } else await talk(data.locked, state);
        meet(data.who, 'met', id);
        playerFace = null;
        mode = 'walk';
      });
      return () => { triggers = triggers.filter((x) => x !== trig); };
    },
    deepOpen: (who) => deepOpen(state, who),
    giveTool: (tool) => { if (!state.items.tools.includes(tool)) addTool(state, tool); save(state); toast(`${josa(ITEMS.find((i) => i.id === tool).name, '을', '를')} 얻었어요`, { gain: true }); },
    hold: (tool) => { state.earthLook = { ...state.earthLook, item: tool }; save(state); dressWith(earthSpec)(state.earthLook, 'item'); },
    toast: (text) => toast(text, { gain: true }),
    card: showCard,
    // 스테이지 끝: 퀴즈, 말씀·기념물 기록, 보상, 쉼터로
    finish: async ({ quiz = mod.data.quiz, words = [], memento }) => {
      stopWalk();
      await askQuiz(quiz);
      for (const w of words) note(w, id);
      if (memento) note(memento, id);
      reward(`${id}/quiz`, 'quiz');
      reward(`${id}/clear`, 'clear');
      codexReward();
      await new Promise((r) => setTimeout(r, 2400));
      afterStage(id);
    },
  };
  return g;
}

// 도감 완성 보상: 월드의 도감 항목을 모두 만나면 칭호(CODEX_TITLES)를 한 번 받는다.
function codexReward() {
  for (const w of WORLDS) {
    const t = CODEX_TITLES[w.id];
    if (!t || !codexDone(state, w)) continue;
    reward(`${w.id}/codex`, 'codexDone');
    toast(`칭호 · ${t.title}`, { gain: true });
  }
}

// ---------- 개발 서버 전용: 자동 플레이(브라우저 점검용, __dev.auto = true) ----------
// 대사를 넘기고, 첫 선택지와 퀴즈 정답을 고르고, 퀘스트 목표로 순간 이동하고, 도전을 성공시킨다.
let autoT = 0;
function autoTick(dt) {
  if (!globalThis.__dev?.auto) return;
  autoT += dt;
  if (autoT < 0.15) return;
  autoT = 0;
  const vis = (id) => !$(id).hidden;
  // __dev.pauseAt: 이 글이 대사 창에 나오면 자동 플레이를 멈춘다(화면을 캡처해 볼 때)
  const stop = globalThis.__dev.pauseAt;
  if (stop && vis('dialog') && $('line').textContent.includes(stop)) { globalThis.__dev.auto = false; globalThis.__dev.pauseAt = null; return; }
  if (vis('choices')) { $('choices').querySelector('button')?.click(); return; }
  if (vis('dialog')) { $('dialog').click(); return; }
  if (vis('dexCard')) { $('dexCard').click(); return; }
  if (vis('quiz')) {
    if (!$('quizNext').hidden) { $('quizNext').click(); return; }
    const b = [...$('quizOptions').querySelectorAll('button:not([aria-invalid])')][0];
    b?.click();
    return;
  }
  if (!$('nextBtn').hidden) { $('nextBtn').click(); return; }
  if (mode !== 'walk') return;
  if (ch?.near && !ch.busy) {
    if (!ch.near.ready) { dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' })); return; }
    ch.auto();
    return;
  }
  if (holdQuest?.cur) { holdQuest.p = 1; return; }
  if (aimPos) { player.position.copy(aimPos).add(new THREE.Vector3(0.6, 0, 0.6)); land()?.collide(player.position, 0.35); }
}

// ---------- 스테이지 끝: 마침 창(2026-11-02 사용자 요청 S29) ----------
// 매번 쉼터로 나갔다가 빛의 문까지 걸어가는 것이 번거로워서, 마친 자리에서 다음 이야기로 바로 들어가게 한다.
// 다음 이야기는 월드 순서에서 이 스테이지 뒤의 열린(아직 안 마친) 본 이야기, 없으면 곁길, 없으면 앞쪽에서 찾는다.
function nextStage(id) {
  const order = WORLDS[0].stages;
  const k = order.indexOf(id);
  const after = [...order.slice(k + 1), ...order.slice(0, Math.max(0, k))];
  const open = after.map((s) => stageInfo(state, s)).filter((i) => i.status === 'open');
  return open.find((i) => !i.ch.side) ?? open[0] ?? null;
}
async function afterStage(id) {
  stopWalk();
  openNext(state);
  save(state);
  const cur = stageInfo(state, id);
  const next = nextStage(id);
  const label = (info) => { const n = WORLDS[0].stages.filter((s) => !stageInfo(state, s).ch.side).indexOf(info.ch.id); return info.ch.side ? '샛길' : `1-${n + 1}`; };
  const pick = await askClear({ kicker: `${label(cur)} · 완료`, title: cur.ch.title, next: next && `${label(next)} ${next.ch.title}` });
  if (pick === 'next' && next) { await fade(1); startAt(next.open[0].id); return; }
  if (pick === 'map') {
    const pid = await openMap(state);
    if (pid) { await fade(1); startAt(pid); return; }
  }
  await fade(1);
  runShelter();
}

// ---------- 쉼터: 천국을 넓힌 광장. 스테이지를 마치면 돌아오고, 이어하기도 여기서 시작한다 ----------
// 빛의 문 → 월드 지도, 기록대 → 도감, 상점 천사 → 상점. 걸어서 닿으면 열리고, 닫으면 한 걸음 물러난다.
async function runShelter() {
  stopWalk();
  refreshHud();
  showHud(true);
  if (creation) { scene.remove(creation.group); camera.remove(creation.stars); disposeTree(creation.group); disposeTree(creation.stars); creation = null; }
  if (eden) { scene.remove(eden.group); disposeTree(eden.group); eden = null; }
  if (cain) { scene.remove(cain.group); disposeTree(cain.group); cain = null; }
  if (field) { scene.remove(field.group); disposeTree(field.group); field = null; }
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
      setQuest(null);
      await fade(1);
      stopWalk();
      startAt(id);
      return true;
    } },
    { pos: heaven.bookPos, r: 1.4, open: async () => { await openMenu(state, { only: 'codex', stage: chapterOf(state.scene) }); return false; } },
    { pos: heaven.shopPos, r: 1.6, open: async () => {
      await openMenu(state, { only: 'shop', onBuy: (id) => {
        const it = SHOP.find((i) => i.id === id);
        if (!buyLook(state, id)) return false;
        // 머리·옷은 산 자리에서 지상 모습에 입힌다(다음 땅에 내려가면 보인다). 꾸미기 소품은 인벤토리에서 단다
        const style = STYLES.includes(it);
        if (style && state.earthLook) state.earthLook = { ...state.earthLook, [it.kind]: it.id };
        save(state);
        refreshHud();
        popHud({ talent: -it.price });
        toast(style ? `${it.kind === 'hair' ? '머리 모양' : '옷'} · ${it.name}` : `꾸미기 · ${it.name}`, { gain: true });
        return true;
      } });
      return false;
    } },
  ];
  const arm = (sp) => addTrigger(sp.pos, sp.r, async () => {
    mode = 'none';
    // 탭으로 정한 목적지가 문 한가운데라 닫은 뒤 다시 걸어 들어가 지도가 또 열렸다(S10). 목적지·조이스틱·눌린 키를 지운다.
    target = null;
    stickEnd();
    keys.clear();
    if (await sp.open()) return;
    target = null;
    keys.clear();
    // 한 걸음 물러나 다시 닿을 수 있게 한다
    const away = new THREE.Vector3().subVectors(player.position, sp.pos).setY(0);
    if (away.lengthSq() < 1e-6) away.set(0, 0, -1); // 정확히 그 자리에 서 있으면 광장 안쪽으로
    player.position.copy(sp.pos).add(away.setLength(sp.r + 0.5));
    mode = 'walk';
    arm(sp);
  });
  spots.forEach(arm);
  waypoint.set(heaven.gatePos);
  // 쉼터에서 할 일: 빛의 문에서 다음 이야기를 고른다(상점 천사·동행 인물은 곁에 가면 말을 건다)
  setQuest({ title: '쉼터', items: [{ text: '빛의 문으로 가서 다음 이야기 고르기', done: false }] });
  startWalk();
}

// ---------- 첫 화면 ----------
// 쉼터로 나가기(F26)에서 되돌릴 저장값: 스테이지에 들어설 때 떠 둔다
let stageSnap = null;
function startAt(id) {
  stageSnap = id === 'prologue' ? null : JSON.parse(JSON.stringify(state));
  if (id === 'prologue') return runPrologue();
  if (id.startsWith('creation-')) return runCreation(Number(id.split('-')[1]));
  if (id === 'cain') return runCain();
  if (STAGE_MODS[id]) return runStage(id);
  return runEden(id);
}

function showTitle() {
  const menu = $('menu');
  const saved = load();
  const button = (label, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu__item';
    b.textContent = label;
    b.onclick = fn;
    return b;
  };
  // 첫 화면에서 고르면 빛으로 화면을 덮은 뒤 첫 화면을 치우고, 고른 장면이 빛 속에서 드러난다(각 장면이 fade(0)을 부른다)
  const begin = (fn) => async () => {
    menu.inert = true;
    if ($('fade').style.opacity !== '1') await fade(1);
    $('title').hidden = true;
    refreshHud();
    showHud(true);
    titleView = false;
    viewShift = null;
    resize();
    fn();
    refreshHud(); // '처음부터'는 fn 안에서 새 상태를 만든다
  };
  const head = (text) => {
    const p = document.createElement('p');
    p.className = 'menu__head';
    p.textContent = text;
    return p;
  };
  const showMain = () => {
    menu.classList.remove('menu--list');
    // 첫 화면은 고를 것만: 저장이 있으면 가장 자주 누르는 '이어하기'를 맨 위에 둔다
    menu.replaceChildren();
    if (saved) menu.append(button('이어하기', begin(() => { state = saved; runShelter(); }))); // 이어하기는 쉼터에서 시작한다
    menu.append(button('처음부터', begin(() => { state = newState(saved); dressFigure(player, lookSpec(state.look)); runPrologue(); })));
    if (saved?.name) menu.append(button('모습 바꾸기', showLooks)); // 천국 꾸미기를 마친 사용자만
    if (saved) menu.append(button('도감', () => openMenu(saved, { only: 'codex', stage: chapterOf(saved.scene) }).then(() => menu.querySelector('button').focus({ preventScroll: true }))));
    menu.querySelector('button').focus({ preventScroll: true });
  };
  // 모습 바꾸기: 천국 모습은 옆 창, 지상 모습은 전용 꾸미기 화면. 저장한 뒤 첫 화면으로 돌아온다.
  const showLooks = () => {
    menu.classList.add('menu--list');
    const items = [button('천국 모습 바꾸기', begin(() => editLook('heaven')))];
    // 첫 화면(메뉴)이 떠 있는 채로 먼저 빛으로 다 덮은 뒤에 첫 화면을 치운다. 순서가 바뀌면 덮이는 동안 천국 장면이 드러난다.
    if (saved.earthLook) items.push(button('지상 모습 바꾸기', begin(() => editLook('earth')))); // begin이 먼저 빛으로 덮는다
    menu.replaceChildren(head('어느 모습을 바꿀까요?'), ...items, backButton(showMain));
    menu.querySelector('button').focus({ preventScroll: true });
  };
  async function editLook(kind) {
    state = saved;
    showHud(false);
    if (kind === 'earth') await runDressingRoom({ kicker: '모습 바꾸기', submit: '이 모습으로' }); // 화면은 메뉴에서 이미 덮었다
    else {
      camAngle = 0;
      player.visible = true;
      player.position.set(0, 0, -3);
      player.rotation.y = Math.PI / 4;
      camFollow = player.position;
      setView(7);
      turntable = true;
      sideView(true);
      await fade(0); // 첫 화면에서 덮은 빛을 걷는다
      state.look = await askLook(state.look, dressWith(lookSpec), {
        title: '천국에서의 내 모습',
        text: '고르는 대로 바로 바뀌어요.',
        options: LOOK.heaven,
      });
      turntable = false;
      sideView(false);
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
  // 개발 서버에서만: __dev.speed로 게임 시간을 앞당긴다(자동화 창은 초당 2프레임 안팎이라 걷기가 매우 느리다)
  const dt = Math.min(clock.getDelta(), 0.05) * (import.meta.env.DEV ? globalThis.__dev?.speed ?? 1 : 1);
  const canMenu = mode === 'walk' && !$('hud').hidden;
  if (canMenu !== menuMode) { menuMode = canMenu; $('menuBtn').hidden = !canMenu; } // 메뉴 버튼은 걷는 중에만 보인다
  const t = clock.elapsedTime;
  movePlayer(dt, t);
  if (turntable) player.rotation.y += dt * 0.8;
  moveAngel(dt, t);
  checkTriggers();
  aimNearest?.();
  waypoint.update(t, player.position);
  edgeArrow();
  creation?.update(dt, t);
  eden?.update(dt, t, player.position);
  cain?.update(dt, t, player.position);
  field?.update(dt, t, player.position);
  challengeTick(dt);
  if (import.meta.env.DEV) autoTick(dt);
  holdTick(dt);
  if (heaven.group.visible) heaven.pillar.userData.pulse(t);
  if (titleView) camAngle += dt * 0.06;
  if (mode === 'orbit') {
    camAngle += (held('KeyE') - held('KeyQ')) * dt * 1.5 + dt * 0.05;
    if (dragX !== null || held('KeyQ', 'KeyE')) practiced('look', dt);
  }
  tapped.clear();
  camTarget.lerp(speakerFocus() ?? camFocus ?? (camPair && pairPoint.copy(camPair[0].position).lerp(camPair[1].position, 0.5).setY(0)) ?? camFollow, Math.min(1, dt * 4));
  camera.position.copy(camTarget).add(camTmp.copy(camOffset).applyAxisAngle(Y_AXIS, camAngle));
  camera.lookAt(camTarget);
  composer.render();
  requestAnimationFrame(tick);
}

// 개발 서버에서만: 브라우저 점검용으로 캐릭터와 세계에 접근한다(배포 빌드에는 빠진다).
// run은 쉼터의 걸어서 닿는 자리를 지우고 시작한다(지도에서 들어갈 때와 같다).
if (import.meta.env.DEV) globalThis.__dev = { player, get heaven() { return heaven; }, get eden() { return eden; }, get cain() { return cain; }, get mode() { return mode; }, get state() { return state; }, interlude: () => runInterlude(INTERLUDE, 'eden/interlude'), cainInterlude: () => runInterlude(CAIN_INTERLUDE, 'cain/interlude'), get field() { return field; }, auto: false, run: (id) => { stopWalk(); $('title').hidden = true; refreshHud(); showHud(true); titleView = false; viewShift = null; resize(); startAt(id); }, interludeOf: (id) => runInterlude(STAGE_MODS[id].data.interlude, `${id}/interlude`), goNext: () => { if (mode !== 'walk') return; if (holdQuest?.cur) holdQuest.p = 1; else if (aimPos) { player.position.copy(aimPos).add(new THREE.Vector3(0.6, 0, 0.6)); land()?.collide(player.position, 0.35); } } }; // goNext: 키보드 점검(R3)에서 걷는 거리만 건너뛴다

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
