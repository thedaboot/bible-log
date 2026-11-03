// 1-4 노아의 방주(창 6~9장): 방주 짓기(갈빗대 → 층 바닥 → 판자와 지붕 → 역청, 노아와 동행) → 짐승·새·기는 것 들여보내기(퀘스트)
// → 저녁 막간(노아) → 홍수(밤, 비, 언덕과 나무와 산이 차례로 잠김, 방주가 뜸) → 아라랏 산 → 까마귀와 비둘기
// → 제단과 무지개(구름이 걷히며 땅 끝에서 그려짐) → 퀴즈(창 9:13)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAltar, makeBird, makeTree, makeLogs, makeCloud } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/noah.js';

const ALONG = V(1, -1).normalize(); // 방주 길이 방향: 화면 가로라 옆모습이 다 보인다
const FRONT = V(1, 1).normalize(); // 카메라 쪽
// 방주 치수(창 6:15): 길이는 300규빗(1규빗 = 18/300)을 따른다. 높이는 30규빗 비율(1.8)이면 위에서 내려다보는 카메라에서
// 납작한 상자로 보여서(2026-11-03 사용자 F11), 사자·말이 서서 드나드는 아래층과 세 층이 보이도록 키웠다(docs/review/decisions.md 1-4).
const CUBIT = 18 / 300;
const ARK_L = 300 * CUBIT, ARK_W = 3.2;
const FLOORS = [1.8, 1.35, 1.35]; // 아래층·가운데층·위층 높이(창 6:16). 아래층은 큰 짐승이 서는 높이다.
const ARK_H = FLOORS[0] + FLOORS[1] + FLOORS[2];
const RISE = 1.1; // 이물·고물이 갑판보다 솟는 높이
const HULL_Y = 0.35; // 받침목(0.2)과 용골(0.15) 위에서 선체가 시작한다
const TOP = HULL_Y + ARK_H; // 갑판
const KEEL = ARK_L / 2 - 2.0; // 바닥(용골)의 반 길이. 위로 갈수록 이물·고물이 앞뒤로 뻗는다.
const FLAT = ARK_L / 2 - 3.0; // 갑판이 평평한 반 길이. 그 바깥은 끝으로 갈수록 솟는다.
const xOut = (y) => KEEL + (ARK_L / 2 - KEEL) * Math.sin((Math.min(1, y / (ARK_H + RISE)) * Math.PI) / 2); // 선체 바닥에서 y 높이의 옆모습 끝
const sheer = (x) => ARK_H + RISE * (Math.max(0, Math.abs(x) - FLAT) / (ARK_L / 2 - FLAT)) ** 2; // 갑판 선(선체 바닥에서 잰 높이)
const DOOR_W = 1.5, DOOR_H = 1.7, SILL = HULL_Y + 0.05; // 옆문: 말 머리가 닿지 않는 높이
const RAMP = Math.sqrt(DOOR_H ** 2 - SILL ** 2); // 문이 열려 땅에 닿은 발판의 가로 길이
const FLOAT = 0.8; // 물에 뜬 방주: 물 높이에서 이만큼 아래가 방주 무리의 바닥
const ARK = V(-3, -3);
const DOOR = ARK.clone().addScaledVector(FRONT, ARK_W / 2);
const NOAH = DOOR.clone().addScaledVector(FRONT, 1.2).addScaledVector(ALONG, -1.3);
const WORK = [-5.4, -2.4, 2.4, 5.4].map((k) => ARK.clone().addScaledVector(FRONT, ARK_W / 2 + 0.8).addScaledVector(ALONG, k));
const MOUNT = V(-8.5, -8.5); // 아라랏 산들(창 8:4): 가운데 봉우리와 양옆 낮은 봉우리
const PEAKS = [[0, 3.2, 2.6], [-4.2, 2.6, 1.7], [4.2, 2.6, 1.7]]; // [ALONG 거리, 반지름, 높이]
const ARK_REST = 1.8 - HULL_Y; // 방주 바닥이 봉우리 사이에 걸치는 높이
const FOOT = MOUNT.clone().addScaledVector(FRONT, 3.8);
const ALTAR = FOOT.clone().addScaledVector(ALONG, -1.6);
const START = V(6, 5);
const RADIUS = 15;
const out0 = () => MOUNT.clone().addScaledVector(FRONT, 2.6);
// 짐승 한 쌍씩의 터(무대와 방주에서 떨어진 들판). 도마뱀은 땅에 기는 것(창 7:14)이다.
const PAIRS = [
  { kind: 'sheep', name: '양 한 쌍', color: 0xf5f5f0, size: 0.9, home: V(7, -2) },
  { kind: 'deer', name: '사슴 한 쌍', color: 0xb07a4a, size: 0.9, home: V(7, -9) },
  { kind: 'horse', name: '말 한 쌍', color: 0x8a5a3a, size: 0.9, home: V(-9, 7) },
  { kind: 'lion', name: '사자 한 쌍', color: 0xd8a85a, size: 0.85, home: V(-2, 8) },
  { kind: 'lizard', name: '도마뱀 한 쌍', color: 0xc08a3a, size: 0.38, home: V(3, 10) },
];
const BIRD_HOME = V(10, 2); // 비둘기 한 쌍과 까마귀 한 쌍이 앉아 있는 나무 앞(관찰자가 서는 자리)
const BIRD_TREE = BIRD_HOME.clone().add(V(-1, -1)); // 새가 앉은 나무: 관찰자 뒤(화면 위)에 선다
const OLIVE = FOOT.clone().addScaledVector(ALONG, -3.6).addScaledVector(FRONT, -0.6); // 방주에서 나온 새 한 쌍이 앉는 나무(산기슭, 제단 왼쪽 뒤)
// 낮은 언덕들: 홍수 때 물이 차오르는 높이를 보여 준다. [자리, 반지름, 높이, 꼭대기 나무]
const HILLS = [[V(-13, 3), 2.0, 1.1, 'pine'], [V(3, -13), 2.0, 1.0, 'pine'], [V(10, -6), 1.8, 0.8, 'round'], [V(-6, 10), 1.8, 0.9, null]];
const WATER_TOP = PEAKS[0][2] + 15 * CUBIT; // 창 7:20 산들보다 열다섯 규빗 위
const RAINBOW_R = 9.4; // 방주(길이 18)보다 넓게. 세로 화면에서는 줄인다(화면 폭이 좁다).

// 새로 나타나는 부품은 살짝 넘쳤다가 자리 잡는다(art-3d.md "easeBack"). 바닥판은 옆으로 뻗어 나온다(axis 'x').
const pop = (obj, ms = 700, axis = 'y') => { obj.visible = true; return tween(ms, (p) => (obj.scale[axis] = Math.max(0.01, easeBack(p)))); };
const wait = (ms) => tween(ms, () => {});

// 선체 띠 하나(y0~y1, 선체 바닥에서 잰 높이): 옆모습을 너비만큼 밀어낸 것. 위로 갈수록 이물·고물이 앞뒤로 뻗고,
// 맨 위 띠는 갑판 선을 따라 양 끝이 솟는다.
function hullBand(y0, y1, m, top) {
  const pts = [];
  const yEnd = top ? ARK_H + RISE : y1;
  for (let i = 0; i <= 8; i++) { const y = y0 + ((yEnd - y0) * i) / 8; pts.push([xOut(y), y]); }
  if (top) for (let i = 1; i < 24; i++) { const x = ARK_L / 2 - (ARK_L * i) / 24; pts.push([x, sheer(x)]); }
  for (let i = 8; i >= 0; i--) { const y = y0 + ((yEnd - y0) * i) / 8; pts.push([-xOut(y), y]); }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y - y0))), { depth: ARK_W, bevelEnabled: false });
  geo.translate(0, 0, -ARK_W / 2);
  const band = new THREE.Mesh(geo, m);
  band.position.y = HULL_Y + y0;
  return band;
}

// 방주(창 6:14~16): 받침목 위 용골과 이물·고물 기둥 → 갈빗대 → 세 층 바닥 → 판자(아래·가운데·위층)와 옆문, 갑판 위 집채와 지붕·창 → 역청
// 카메라가 위에서 내려다보므로 옆면은 해를 덜 받는다. 옆면이 묻히지 않게 재질에 제 빛을 조금 준다(lit).
const lit = (c, k = 0.35) => mat(c, { emissive: c, emissiveIntensity: k });
function makeArk() {
  const g = new THREE.Group();
  const frameM = lit(PAL.bark);
  const lowM = lit(PAL.plank); // 아래·가운데층 판자와 문(역청 첫 번째)
  const upM = lit(PAL.plank); // 위층 판자와 집채 벽(역청 두 번째)
  const floorM = lit(0xb08a5a, 0.3);
  const waleM = lit(0x9a7a52, 0.5);
  const seamM = lit(0x6a4e34, 0.2);
  const roofM = lit(0x7a5a3a, 0.25);
  const darkM = mat(0x140f0b);
  const box = (w, h, d, m, x, y, z, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  const beam = (x0, y0, x1, y1, z, t, m, parent) => { const b = box(Math.hypot(x1 - x0, y1 - y0) + t * 0.5, t, t, m, (x0 + x1) / 2, (y0 + y1) / 2, z, parent); b.rotation.z = Math.atan2(y1 - y0, x1 - x0); return b; };
  const outline = (s, z, t, m, parent, n = 6) => { for (let i = 0; i < n; i++) { const a = ((ARK_H + RISE) * i) / n, b = ((ARK_H + RISE) * (i + 1)) / n; beam(s * xOut(a), HULL_Y + a, s * xOut(b), HULL_Y + b, z, t, m, parent); } };
  // 받침목과 용골, 이물·고물 기둥: 처음부터 놓여 있다
  const cradle = new THREE.Group();
  for (let x = -6; x <= 6; x += 3) box(0.5, 0.2, ARK_W * 0.7, frameM, x, 0.1, 0, cradle);
  const keel = new THREE.Group();
  box(KEEL * 2, 0.15, 0.4, frameM, 0, 0.275, 0, keel);
  for (const s of [-1, 1]) outline(s, 0, 0.2, frameM, keel);
  // 갈빗대: 고물에서 이물 쪽으로 차례로 선다(양옆 기둥 + 바닥·갑판 가로대). 이어서 이물·고물의 옆 뼈대와 층마다 긴 띠장.
  // 한 InstancedMesh로 그리고 count로 차례로 보인다.
  const parts = [];
  const q = new THREE.Quaternion(), eul = new THREE.Euler();
  const part = (x, y, z, w, h, d, rz = 0) => parts.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromEuler(eul.set(0, 0, rz)).clone(), new THREE.Vector3(w, h, d)));
  let half = 0;
  for (let x = -KEEL + 0.35; x <= KEEL - 0.3; x += 0.7) {
    const h = sheer(x);
    for (const z of [-1, 1]) part(x, HULL_Y + h / 2, z * (ARK_W / 2 - 0.06), 0.1, h, 0.1);
    part(x, HULL_Y + 0.06, 0, 0.1, 0.1, ARK_W - 0.1);
    part(x, HULL_Y + h - 0.05, 0, 0.1, 0.1, ARK_W - 0.1);
    if (x <= 0) half = parts.length;
  }
  for (const s of [-1, 1]) for (const z of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const a = ((ARK_H + RISE) * i) / 6, b = ((ARK_H + RISE) * (i + 1)) / 6;
      const x0 = s * xOut(a), x1 = s * xOut(b);
      part((x0 + x1) / 2, HULL_Y + (a + b) / 2, z * (ARK_W / 2 - 0.06), Math.hypot(x1 - x0, b - a) + 0.05, 0.1, 0.1, Math.atan2(b - a, x1 - x0));
    }
  }
  for (const y of [FLOORS[0], FLOORS[0] + FLOORS[1]]) for (const z of [-1, 1]) part(0, HULL_Y + y, z * (ARK_W / 2 - 0.03), 2 * xOut(y) - 0.4, 0.08, 0.08);
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), frameM, parts.length);
  parts.forEach((m4, i) => ribs.setMatrixAt(i, m4));
  ribs.count = 0;
  // 세 층 바닥: 갈빗대 사이로 아래층·가운데층·위층 바닥판이 보인다
  const floors = [0.06, FLOORS[0], FLOORS[0] + FLOORS[1]].map((y) => box(2 * xOut(y) - 0.3, 0.08, ARK_W - 0.16, floorM, 0, HULL_Y + y, 0, g));
  // 세 층 판자. 층 사이의 밝은 띠(wale)가 아래·가운데·위층을 드러내고, 띠마다 판자 이음 줄이 하나씩 있다.
  const ys = [0, FLOORS[0], FLOORS[0] + FLOORS[1], ARK_H];
  const bands = [0, 1, 2].map((k) => hullBand(ys[k], ys[k + 1], k < 2 ? lowM : upM, k === 2));
  bands.forEach((b, k) => {
    const mid = (ys[k] + ys[k + 1]) / 2;
    box(2 * xOut(mid) - 0.1, 0.035, ARK_W + 0.03, seamM, 0, mid - ys[k], 0, b);
    if (k) box(2 * xOut(ys[k]) - 0.1, 0.14, ARK_W + 0.06, waleM, 0, 0, 0, b);
  });
  box(2 * FLAT, 0.12, ARK_W + 0.06, waleM, 0, ys[3] - ys[2] - 0.06, 0, bands[2]); // 갑판 가장자리 띠
  // 갑판 위 집채: 벽 → 창(창 6:16 "위에서부터 한 규빗", 지붕 바로 아래를 빙 둘러 트인 띠) → 낮은 맞배지붕(처마를 줄여 옆면을 가리지 않게)
  const HL = 10, HW = ARK_W - 0.8, WALL = 0.7, WIN = Math.max(0.3, CUBIT * 4);
  const houseFrame = new THREE.Group(), houseWalls = new THREE.Group();
  houseFrame.position.y = houseWalls.position.y = TOP;
  const postXs = [];
  for (let x = -HL / 2; x <= HL / 2 + 0.01; x += HL / 14) postXs.push(x);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, WALL + WIN, 0.09), frameM, postXs.length * 2);
  const m4 = new THREE.Matrix4();
  postXs.forEach((x, i) => [-1, 1].forEach((z, j) => posts.setMatrixAt(i * 2 + j, m4.makeTranslation(x, (WALL + WIN) / 2, (z * HW) / 2))));
  houseFrame.add(posts);
  box(HL, 0.08, HW, frameM, 0, WALL + WIN - 0.04, 0, houseFrame);
  box(HL - 0.05, WALL, HW - 0.04, upM, 0, WALL / 2, 0, houseWalls);
  box(HL - 0.1, WIN, HW - 0.1, darkM, 0, WALL + WIN / 2, 0, houseWalls);
  const pitchA = 0.3, ridge = (HW / 2) * Math.tan(pitchA);
  for (const z of [-1, 1]) {
    const slab = box(HL + 0.3, 0.08, HW / 2 + 0.12, roofM, 0, WALL + WIN + ridge / 2, (z * HW) / 4, houseWalls);
    slab.rotation.x = z * pitchA;
  }
  // 옆문(창 6:16): 아래층에 사자·말이 지나갈 만큼 크게 낸다. 아래 경첩으로 열려 땅까지 닿는 발판이 되고(안쪽 면의 디딤목이 위로 온다),
  // 여호와께서 닫으신다(창 7:16).
  const doorway = box(DOOR_W, DOOR_H, 0.02, darkM, 0, SILL + DOOR_H / 2, ARK_W / 2 + 0.012, g);
  const door = new THREE.Group();
  door.position.set(0, SILL, ARK_W / 2 + 0.04);
  box(DOOR_W, DOOR_H, 0.07, lowM, 0, DOOR_H / 2, 0, door);
  for (let k = 1; k <= 6; k++) box(DOOR_W - 0.14, 0.05, 0.05, frameM, 0, (k * DOOR_H) / 7, -0.06, door);
  const OPEN = Math.PI / 2 + Math.asin(SILL / DOOR_H);
  door.rotation.x = OPEN;
  g.add(cradle, keel, ribs, ...bands, houseFrame, houseWalls, door);
  for (const o of [...floors, ...bands, houseFrame, houseWalls, door, doorway]) o.visible = false;
  g.rotation.y = -Math.atan2(ALONG.z, ALONG.x); // 로컬 x가 ALONG, 로컬 +z가 FRONT를 본다

  const pitch = new THREE.Color(0x2b231c);
  const showRibs = (n) => { const from = ribs.count; return tween(800, (p) => (ribs.count = Math.round(from + (n - from) * p))); };
  const tar = (m) => { const from = m.color.clone(); return tween(900, (p) => { m.color.lerpColors(from, pitch, p); m.emissive.copy(m.color); }); };
  // 짓는 단계(1~8): 갈빗대 고물 쪽 절반 → 갈빗대 전부와 띠장 → 아래·가운데층 바닥 → 위층 바닥과 집채 뼈대
  // → 아래·가운데층 판자와 문 → 위층 판자와 집채 벽·창·지붕 → 아래쪽 역청 → 위쪽 역청
  const progress = async (step) => {
    if (step === 1) await showRibs(half);
    if (step === 2) await showRibs(parts.length);
    if (step === 3) { pop(floors[0], 600, 'x'); await wait(250); await pop(floors[1], 600, 'x'); }
    if (step === 4) { pop(floors[2], 600, 'x'); await wait(250); await pop(houseFrame); }
    if (step === 5) { pop(bands[0]); await wait(250); doorway.visible = door.visible = true; await pop(bands[1]); }
    if (step === 6) { pop(bands[2]); await wait(250); await pop(houseWalls); }
    if (step === 7) await tar(lowM);
    if (step === 8) await tar(upM);
  };
  const closeDoor = () => { const from = door.rotation.x; return tween(900, (p) => (door.rotation.x = from * (1 - easeOut(p)))); };
  // 새가 드나드는 창 자리(집채 창의 앞쪽)
  const winAt = (x) => g.localToWorld(new THREE.Vector3(x, TOP + WALL + WIN / 2, HW / 2 + 0.05));
  // 열린 문(발판) 위에 선 자리의 높이: 문턱에서 땅까지 곧게 내려간다. 발판 밖이면 0.
  const tmp = new THREE.Vector3();
  const rampY = (p) => {
    if (!door.visible || door.rotation.x < 1) return 0;
    tmp.subVectors(p, DOOR).setY(0);
    const f = tmp.dot(FRONT), a = tmp.dot(ALONG);
    if (Math.abs(a) > DOOR_W / 2 + 0.1 || f < -0.3 || f > RAMP) return 0;
    return SILL * (1 - Math.max(0, f) / RAMP);
  };
  return { g, cradle, progress, closeDoor, window: winAt, rampY };
}

// 도마뱀(창 7:14 땅에 기는 것): 공용 짐승 몸을 비우고 다시 짓는다. 낮고 긴 몸, 납작한 머리, 옆으로 벌린 짧은 네 다리,
// 몸보다 길고 끝으로 가늘어지는 꼬리. 다리 순서는 공용 몸짓(animateAnimal)의 대각선 짝을 따른다.
function lizardize(an, color) {
  const u = an.userData;
  const k = u.size / 0.5;
  u.body.clear();
  for (const hip of u.legs) an.remove(hip);
  const m = mat(color), dark = mat(new THREE.Color(color).multiplyScalar(0.55));
  const box = (w, h, d, x, y, z, mm, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * k, h * k, d * k), mm); b.position.set(x * k, y * k, z * k); parent.add(b); return b; };
  box(0.8, 0.16, 0.34, 0, 0.15, 0, m, u.body);
  box(0.72, 0.05, 0.14, 0, 0.24, 0, dark, u.body); // 등줄
  box(0.3, 0.12, 0.26, 0.53, 0.15, 0, m, u.body); // 납작한 머리
  box(0.14, 0.07, 0.15, 0.71, 0.13, 0, m, u.body);
  for (const z of [-1, 1]) box(0.05, 0.05, 0.05, 0.56, 0.21, z * 0.08, dark, u.body);
  const tail = new THREE.Group();
  tail.position.set(-0.4 * k, 0.15 * k, 0);
  u.body.add(tail);
  box(0.5, 0.12, 0.2, -0.25, 0, 0, m, tail);
  const tip = new THREE.Group();
  tip.position.x = -0.5 * k;
  tail.add(tip);
  box(0.45, 0.08, 0.12, -0.22, -0.01, 0, m, tip);
  box(0.25, 0.05, 0.06, -0.55, -0.02, 0, dark, tip);
  const legs = [];
  for (const x of [-0.24, 0.26]) for (const z of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(x * k, 0.15 * k, z * 0.16 * k);
    box(0.08, 0.06, 0.18, 0, 0, z * 0.09, m, hip); // 옆으로 뻗은 윗다리
    box(0.08, 0.14, 0.08, 0, -0.07, z * 0.18, m, hip); // 땅으로 꺾인 아랫다리
    box(0.15, 0.03, 0.1, 0.03, -0.14, z * 0.2, dark, hip); // 발
    an.add(hip);
    legs.push(hip);
  }
  Object.assign(u, { legs, tail, tip, sway: 0, lastPhase: u.phase });
}
// 걸을 때 몸을 좌우로 흔들고 꼬리를 반대로 휘두른다(멈추면 잦아든다)
function swayLizard(an, dt) {
  const u = an.userData;
  const moving = u.phase !== u.lastPhase;
  u.lastPhase = u.phase;
  u.sway += ((moving ? 1 : 0) - u.sway) * Math.min(1, dt * 4);
  const s = Math.sin(u.phase) * u.sway;
  u.body.rotation.y = s * 0.25;
  u.tail.rotation.y = -s * 0.45;
  u.tip.rotation.y = -s * 0.55;
}

// 새가 앉는 나무: 둥근 나무에 양옆으로 뻗은 가지 둘. 가지 위 앉을 자리(세계 좌표)를 돌려준다.
function perchTree(pos, s = 1.5) {
  const t = makeTree('round');
  const along = -Math.atan2(ALONG.z, ALONG.x);
  for (const side of [-1, 1]) {
    const branch = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.07), mat(PAL.bark));
    branch.position.set(side * 0.55, side < 0 ? 0.55 : 0.68, 0);
    branch.rotation.z = side * 0.12;
    t.add(branch);
  }
  t.scale.setScalar(s);
  t.rotation.y = along;
  t.position.copy(pos);
  // 가지 바깥쪽 두 자리씩: 앞 둘은 +ALONG 가지, 뒤 둘은 -ALONG 가지
  const seats = [[0.72, 1], [0.95, 1], [-0.72, -1], [-0.95, -1]].map(([x, side]) => {
    const y = (side < 0 ? 0.55 : 0.68) + side * 0.12 * (Math.abs(x) - 0.55) + 0.03;
    return pos.clone().addScaledVector(ALONG, x * s).setY(y * s + 0.09);
  });
  return { tree: t, seats };
}

// 비둘기·까마귀: 공용 새 몸에 머리와 꼬리를 단다. 앉아 있을 때는 날개를 접는다.
const birdOf = (color) => {
  const b = makeBird();
  const body = b.children[0];
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.1));
  head.position.set(0.17, 0.07, 0);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.1));
  tail.position.set(-0.2, 0.02, 0);
  body.add(head, tail);
  b.traverse((o) => { if (o.material) o.material = mat(color); });
  b.scale.setScalar(1.5);
  return b;
};
const foldWings = (b, folded) => [1, 2].forEach((i) => {
  const w = b.children[i];
  w.rotation.x = 0;
  w.position.set(folded ? -0.03 : 0, folded ? 0.04 : 0, (i === 1 ? -1 : 1) * (folded ? 0.065 : 0.2));
  w.scale.set(folded ? 1.4 : 1, 1, folded ? 0.25 : 1);
});

// 물고기(홍수 물속): 몸통과 꼬리. 방주 앞 물 위로 이따금 뛰어올랐다 들어간다.
function makeFish(color) {
  const g = new THREE.Group();
  const m = mat(color);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), m));
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.04), mat(new THREE.Color(color).multiplyScalar(0.7)));
  tail.position.x = -0.25;
  g.add(tail);
  return g;
}

// 무지개(창 9:13 "구름 속에"): 땅 끝에서 시작해 아치가 그려지듯 자란다. 반투명한 일곱 빛 띠와 은은한 빛무리.
function makeRainbow(R) {
  const g = new THREE.Group();
  const arcs = [];
  const add = (r0, r1, color, opacity) => {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    const arc = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48, 1, 0, Math.PI), m);
    arc.userData.base = opacity;
    g.add(arc);
    arcs.push(arc);
  };
  add(R - 2.2, R + 0.4, 0xfff6e0, 0.14);
  [0xe85a4a, 0xf2a03a, 0xf2d24a, 0x6fbf5a, 0x4a8ad8, 0x5a5ac8, 0x8a5ac8].forEach((c, i) => add(R - (i + 1) * 0.26, R - i * 0.26, c, 0.55));
  g.rotation.y = Math.PI / 4; // 화면을 마주 본다. 로컬 +x(그리기 시작점)는 화면 오른쪽(ALONG)
  g.userData.draw = (p) => arcs.forEach((a) => a.geometry.setDrawRange(0, Math.round(48 * p) * 6));
  g.userData.glow = (t) => arcs.forEach((a, i) => (a.material.opacity = a.userData.base * (0.85 + 0.15 * Math.sin(t * 1.2 + i * 0.3))));
  g.userData.draw(0);
  return g;
}

export default {
  id: 'noah',
  data,
  records: ['person/noah', 'person/shem', 'place/ark', 'creature/dove', 'creature/raven', 'creature/lizard', 'creature/fish', 'place/ararat', 'item/olive-leaf', 'word/gen-9-13'],
  kicker: '방주가 서는 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 6141, start: START, sky: 0xc4dceb, radius: RADIUS,
      stages: {
        door: { c: toCam(DOOR, 1.8), r: 2.4 },
        foot: { c: toCam(FOOT, 1.4), r: 2.6 },
      },
      trees: 16,
    });
    const ark = makeArk();
    ark.g.position.copy(ARK);
    F.group.add(ark.g);
    for (let k = -ARK_L / 2 + 0.9; k <= ARK_L / 2 - 0.9; k += 0.8) F.block(ARK.clone().addScaledVector(ALONG, k), ARK_W / 2 - 0.1);
    // 고페르 나무 더미와 역청 통(창 6:14)
    for (const k of [-6.6, 6.6]) F.put(makeLogs(6, 0x9a7048), ARK.clone().addScaledVector(FRONT, ARK_W / 2 + 1).addScaledVector(ALONG, k), 0.5, Math.PI / 4);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.32, 7), mat(0x2b231c));
    pot.position.y = 0.16;
    const potG = new THREE.Group().add(pot);
    F.put(potG, WORK[3].clone().addScaledVector(ALONG, 0.6).addScaledVector(FRONT, -0.55));
    // 아라랏 산들: 처음부터 들 끝에 있고, 홍수 때 물에 잠긴다(창 7:20). 방주가 봉우리 사이에 머문다.
    const mount = new THREE.Group();
    for (const [k, r, h] of PEAKS) {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), mat(0x7f8a5a));
      const p = MOUNT.clone().addScaledVector(ALONG, k);
      peak.position.copy(p).setY(h / 2);
      mount.add(peak);
      F.block(p, r * 0.9);
    }
    F.group.add(mount);
    // 낮은 언덕과 그 위의 나무: 평평한 들보다 물이 차오르는 것이 잘 보인다
    const hillM = mat(0x86a556);
    for (const [p, r, h, tree] of HILLS) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), hillM);
      hill.scale.y = h / r;
      hill.position.copy(p);
      F.group.add(hill);
      F.block(p, r * 0.8);
      if (tree) { const t = makeTree(tree); t.position.copy(p).setY(h * 0.9); t.scale.setScalar(1.2); F.group.add(t); }
    }
    const noah = F.person('noah', { hair: 'short', hairColor: 0x9a9590, beard: 'long', outfit: 'robe', outfitColor: 0xd8c3a0 }, NOAH);
    const wife = F.person('wife', { hair: 'long', hairColor: 0x6b6460, outfit: 'robe', outfitColor: 0x7f8a4a }, DOOR.clone().addScaledVector(FRONT, 1).addScaledVector(ALONG, 1.6));
    const shem = F.person('shem', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x9a6b45 }, WORK[3].clone().addScaledVector(FRONT, 1.4).addScaledVector(ALONG, 1));
    F.keep.push(...WORK, ...PAIRS.map((p) => p.home), BIRD_HOME, FOOT, out0());
    // 짐승 한 쌍씩
    const pairs = PAIRS.map((p) => ({ ...p, animals: [0, 1].map((i) => {
      const an = F.animal(p.kind === 'lizard' ? 'generic' : p.kind, p.color, p.size * (i ? 0.92 : 1), p.home.clone().add(V(i * 1.1, i * -0.4)), { roam: 1.6 });
      if (p.kind === 'lizard') lizardize(an, p.color);
      return an;
    }) }));
    const lizards = pairs.find((p) => p.kind === 'lizard').animals;
    // 새 두 쌍(창 7:14~15): 비둘기와 까마귀. 들판 끝 나뭇가지에 앉아 있다가 방주 창으로 날아 들어간다.
    const nest = perchTree(BIRD_TREE);
    F.put(nest.tree, BIRD_TREE, 0.3, nest.tree.rotation.y);
    const olive = perchTree(OLIVE, 1.3);
    F.put(olive.tree, OLIVE, 0.3, olive.tree.rotation.y);
    const doves = [0, 1].map(() => birdOf(0xf4f2ee));
    const ravens = [0, 1].map(() => birdOf(0x22201e));
    const birds = [...doves, ...ravens];
    birds.forEach((b, i) => {
      b.userData.perch = nest.seats[i];
      b.position.copy(b.userData.perch);
      b.rotation.y = -Math.atan2(FRONT.z, FRONT.x) + (i % 2 ? 0.9 : -0.6); // 카메라 쪽을 비스듬히 본다
      foldWings(b, true);
      F.group.add(b);
    });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.08), mat(0x7a9a3a));
    leaf.position.x = 0.25;
    leaf.visible = false;
    doves[0].add(leaf);
    // 홍수: 물결치는 물(가운데에서 바깥까지 고리 6겹)과 들 가장자리의 물 벽
    const water = new THREE.Group();
    const waterM = mat(PAL.water, { transparent: true, opacity: 0.86 });
    const surfGeo = new THREE.RingGeometry(0, RADIUS + 0.7, 40, 6).rotateX(-Math.PI / 2);
    const surface = new THREE.Mesh(surfGeo, waterM);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS + 0.7, RADIUS + 0.7, 1, 40, 1, true), waterM);
    water.add(surface, skirt);
    water.position.y = -0.2;
    water.visible = false;
    const wavePos = surfGeo.attributes.position;
    // 빗줄기 260개를 메시 하나(InstancedMesh)로 그린다. 비구름 아래 방주 둘레에 내린다.
    const N_DROP = 260;
    // 바람에 비스듬히 내린다: 빗줄기를 기울이고 떨어지는 동안 옆으로도 민다
    const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.75, 0.05).rotateZ(-0.18), new THREE.MeshBasicMaterial({ color: 0xb8cce4, transparent: true, opacity: 0.5 }), N_DROP);
    const drops = Array.from({ length: N_DROP }, () => { const a = F.rand() * Math.PI * 2, r = Math.sqrt(F.rand()) * 11; return new THREE.Vector3(Math.cos(a) * r, F.rand() * 10, Math.sin(a) * r); });
    rain.visible = false;
    rain.frustumCulled = false; // 기준 도형(원점) 기준으로 잘리지 않게
    // 빗방울이 물에 떨어져 퍼지는 물결 고리 28개
    const N_RIP = 28;
    const ripples = new THREE.InstancedMesh(new THREE.RingGeometry(0.5, 0.62, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xcfe0f2, transparent: true, opacity: 0.55, depthWrite: false }), N_RIP);
    const rip = Array.from({ length: N_RIP }, (_, i) => ({ x: 0, z: 0, age: i / N_RIP }));
    ripples.visible = false;
    ripples.frustumCulled = false;
    const fish = [0xc8dce6, 0xe8b850, 0xc8dce6, 0xb0d8b8, 0xe0906a].map((c, i) => {
      const f = makeFish(c);
      f.scale.setScalar(2.4);
      Object.assign(f.userData, { along: -5 + i * 2.4, front: ARK_W / 2 + 1.6 + (i % 2) * 1.8, period: 2.6 + i * 0.45, phase: i * 1.3, dir: i % 2 ? 1 : -1 });
      f.visible = false;
      F.group.add(f);
      return f;
    });
    // 무지개와 구름: 방주가 머문 산들 바로 뒤에 선다. 두 발이 방주 양 끝 너머 땅 끝(지평선) 위에 닿는다.
    const rainbow = makeRainbow(RAINBOW_R);
    rainbow.position.copy(MOUNT).addScaledVector(FRONT, -1.8);
    rainbow.visible = false;
    const clouds = [-1, -1, 1, 1].map((side, i) => {
      const c = makeCloud(1.3 - (i % 2) * 0.3);
      c.rotation.y = Math.PI / 4;
      c.userData.side = side;
      c.visible = false;
      F.group.add(c);
      return c;
    });
    const altar = makeAltar();
    altar.visible = false;
    F.put(altar, ALTAR);
    F.group.add(water, rain, ripples, rainbow);
    const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    F.onUpdate((dt, t) => {
      const lvl = water.position.y;
      if (water.visible) {
        for (let i = 0; i < wavePos.count; i++) { const x = wavePos.getX(i), z = wavePos.getZ(i); wavePos.setY(i, Math.sin(x * 0.9 + t * 1.7) * 0.06 + Math.sin(z * 1.3 - t * 1.3) * 0.05); }
        wavePos.needsUpdate = true;
        skirt.scale.y = Math.max(0.01, lvl);
        skirt.position.y = -lvl / 2;
      }
      const c = ark.g.position;
      if (rain.visible) {
        for (const [i, p] of drops.entries()) { p.y -= dt * 14; p.x -= dt * 14 * 0.18; if (p.y < 0) { p.y += 10; p.x += 10 * 0.18; } rain.setMatrixAt(i, m4.makeTranslation(c.x + p.x, Math.max(lvl, 0) + p.y, c.z + p.z)); }
        rain.instanceMatrix.needsUpdate = true;
      }
      if (ripples.visible) {
        for (const [i, r] of rip.entries()) {
          r.age += dt * 1.1;
          if (r.age >= 1) { r.age -= 1; const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 8; r.x = c.x + Math.cos(a) * d; r.z = c.z + Math.sin(a) * d; if (Math.hypot(r.x, r.z) > RADIUS) { r.x *= 0.7; r.z *= 0.7; } }
          ripples.setMatrixAt(i, m4.compose(pv.set(r.x, lvl + 0.1, r.z), q0, sv.setScalar(0.2 + r.age * 1.3)));
        }
        ripples.instanceMatrix.needsUpdate = true;
      }
      for (const f of fish) {
        const u = f.userData, k = ((t + u.phase) % u.period) / 0.8;
        f.visible = water.visible && lvl > 0.5 && k < 1;
        if (!f.visible) continue;
        if (F.onFish) { F.onFish(); F.onFish = null; } // 처음 뛰어오른 물고기를 도감에 남긴다(창 9:2)
        const base = c.clone().addScaledVector(FRONT, u.front).addScaledVector(ALONG, u.along);
        f.position.copy(base).addScaledVector(ALONG, u.dir * (k - 0.5) * 1.4).setY(lvl - 0.1 + Math.sin(k * Math.PI) * 1.1);
        f.rotation.set(0, u.dir > 0 ? -Math.atan2(ALONG.z, ALONG.x) : Math.PI - Math.atan2(ALONG.z, ALONG.x), Math.cos(k * Math.PI) * 0.9);
      }
      if (ark.drift) { const d = ark.drift, k = Math.min(1, Math.max(0, (lvl - d.lo) / (d.hi - d.lo))); ark.g.position.lerpVectors(d.from, d.to, k * k * (3 - 2 * k)); }
      if (water.visible && ark.floating) { ark.g.position.y = Math.max(0, lvl - FLOAT) + Math.sin(t * 1.4) * 0.05; ark.g.rotation.z = Math.sin(t * 1.1) * 0.03; }
      ark.cradle.visible = ark.g.position.y < 0.3; // 받침목은 들판에 남는다(물에 뜨거나 산에 머문 방주 밑에는 없다)
      // 열린 문(발판)을 오르는 짐승과 사람은 발판 높이에 선다
      for (const o of [...F.animals, noah, wife, shem]) if (o.visible) o.position.y = ark.rampY(o.position);
      // 방주로 가는 짐승은 문턱 앞에 이르면 들어간다(문 둘레는 선체 충돌에 막혀 길 끝까지 다가가지 못한다)
      for (const an of F.animals) {
        const u = an.userData;
        if (!an.visible || !u.toArk || !u.route?.length || Math.hypot(an.position.x - DOOR.x, an.position.z - DOOR.z) > 0.75) continue;
        const done = u.onArrive;
        Object.assign(u, { route: null, onArrive: null, toArk: false });
        done?.();
      }
      for (const an of lizards) if (an.visible) swayLizard(an, dt);
      for (const b of birds) {
        if (!b.visible) continue;
        if (b.userData.flying) for (const i of [1, 2]) b.children[i].rotation.x = Math.sin(t * 14) * 0.6 * (i === 2 ? 1 : -1);
        else if (b.userData.perch) { b.position.y = b.userData.perch.y + Math.max(0, Math.sin(t * 2.2 + b.id)) * 0.03; b.children[0].rotation.z = Math.sin(t * 0.9 + b.id) * 0.12; }
      }
      if (rainbow.visible) rainbow.userData.glow(t);
    });
    Object.assign(F, { ark, water, rain, ripples, rainbow, clouds, altar, birds, doves, ravens, raven: ravens[0], dove: doves[0], leaf, mount, pairs, olive, noahFig: noah, wife, shem });
    F.spots = { start: START, door: DOOR, noah: NOAH, foot: FOOT, altar: ALTAR, mount: MOUNT, birds: BIRD_HOME, ...Object.fromEntries(WORK.map((w, i) => [`work${i}`, w])) };
    F.solid = ['door', 'mount', 'altar'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { ark, noahFig: noah, wife, shem } = F;
    const fly = (bird, to, ms, arc = 1.5) => {
      const a = bird.position.clone();
      bird.userData.flying = true;
      bird.userData.perch = null;
      bird.children[0].rotation.z = 0;
      foldWings(bird, false);
      return tween(ms, (p) => { bird.position.lerpVectors(a, to, p); bird.position.y += Math.sin(p * Math.PI) * arc; bird.rotation.y = -Math.atan2(to.z - a.z, to.x - a.x); });
    };
    const land = (bird, perch) => { bird.userData.flying = false; bird.userData.perch = perch; foldWings(bird, true); };
    // 관찰자도 열린 발판 위에서는 발판 높이에 선다
    F.onUpdate(() => { if (g.player.visible) g.player.position.y = ark.rampY(g.player.position); });
    const onRamp = (p) => p.clone().setY(ark.rampY(p)); // 길 끝 판정이 높이까지 재므로 발판 위 길목은 발판 높이로 준다
    F.onFish = () => g.note('creature/fish');
    g.cam(ARK.clone().setY(1.5), 15, true);
    g.stage('door');
    await g.talk(data.lines.arrive.slice(0, 3));
    g.cam(ARK.clone().setY(2.5), 19, true);
    await g.talk(data.lines.arrive.slice(3));
    g.cam(null, 13);
    g.stage(null);
    g.meet('noah');
    g.note('place/ark');

    // 도전: 방주 짓기 네 단계(갈빗대 → 층 바닥 → 판자와 지붕 → 역청). 노아가 관찰자가 일하는 자리로 와서 함께 일한다(동행).
    // 한 단계에 두 번 힘을 모으고, 그때마다 방주가 실제로 지어져 간다(창 6:14~16). 뒤 단계일수록 어렵다(tier). 오래 걸리는 일이라 인내와 신실이 돕는다.
    const removeGreet = g.greet(shem, data.greetings.shem, 'shem');
    let hits = 0;
    const steps = [
      ['갈빗대', '용골 위에 갈빗대 세우기', 'buildFrame'],
      ['층 바닥', '세 층 바닥 깔기', 'buildFloor'],
      ['판자', '판자로 옆 막고 지붕 얹기', 'buildPlank'],
      ['역청', '안팎에 역청 칠하기', 'buildPitch'],
    ];
    for (const [i, [name, text, say]] of steps.entries()) {
      g.cam(WORK[i].clone().lerp(ARK, 0.4).setY(1.5), 15);
      await g.talk(data.lines[say]);
      g.cam(null, 13);
      await g.challenge({
        title: `방주 짓기 ${i + 1}/${steps.length}: ${name}`, spots: [{ pos: WORK[i], text: `함께 ${text}`, hits: 2 }], verb: '힘 모으기', fruits: ['patience', 'faith'], tier: i,
        onHit: async (sp) => {
          await F.acts.walkTo(noah, sp.pos.clone().addScaledVector(ALONG, -1.1), 2.4); // 대천사는 관찰자의 화면 오른쪽(+ALONG)에 서므로 노아는 왼쪽에 선다
          F.acts.face(noah, ARK);
          F.acts.speak('noah');
          g.cam(ARK.clone().addScaledVector(ALONG, (i - 1.5) * 2).setY(2.2), 17, true);
          await ark.progress(++hits);
          g.reward(`build/${hits}`, 'step');
          g.cam(null, 13);
        },
      });
    }
    removeGreet();
    // 방주를 짓는 일은 오래 참는 일이다(벧전 3:20 하나님이 오래 참고 기다리실 때 방주를 준비함)
    g.reward('build-done', 'challenge', null, 'patience');
    // 동행: 노아의 일을 함께 했다. 노아는 믿음으로 방주를 준비했다(히 11:7, 신실).
    g.meet('noah', 'walked', 'faith');
    await F.acts.walkTo(noah, NOAH);
    F.acts.face(noah, g.player.position);
    g.cam(ARK.clone().setY(2.5), 19, true);
    await g.talk(data.lines.built.slice(0, 2));
    g.cam(DOOR.clone().setY(1), 13);
    await g.talk(data.lines.built.slice(2));
    g.cam(null, 13);

    // 퀘스트: 짐승·새·기는 것 들여보내기. 한 쌍 곁에 머무르면 둘이 열린 문(발판)을 올라 들어가고, 새는 나뭇가지에서 창으로 날아 들어간다.
    const birdTarget = { pos: F.spots.birds, name: '비둘기와 까마귀', birds: true };
    await g.quest({
      title: '방주로 들어가는 생명',
      targets: [...F.pairs.map((p) => ({ pos: p.animals[0].position, name: p.name, pair: p })), birdTarget],
      text: (t) => `${t.name} 곁에 머물러 방주로 보내기`,
      radius: 2.2, hold: 1.2, holdLabel: (t) => `${t.name} 곁에 머무르기`,
      onFound: async (t) => {
        if (t.birds) {
          F.birds.forEach((b, i) => fly(b, ark.window(-4 + i * 0.6), 1800 + i * 200, 2).then(() => (b.visible = false)));
          g.reward('animals/birds', 'step');
          return;
        }
        t.pair.animals.forEach((an, i) => {
          an.userData.route = [onRamp(DOOR.clone().addScaledVector(FRONT, 2.2 + i * 0.6)), onRamp(DOOR.clone().addScaledVector(FRONT, 0.9)), onRamp(DOOR.clone())];
          an.userData.onArrive = () => { an.visible = false; if (t.pair.kind === 'lizard' && !i) g.note('creature/lizard'); };
          an.userData.toArk = true;
        });
        g.reward(`animals/${t.pair.kind}`, 'step');
      },
    });
    // 짐승을 돌보는 일(잠 12:10 의인은 자기 가축의 생명을 돌본다, 친절)
    g.reward('animals-done', 'questDone', null, 'kindness');
    g.cam(DOOR.clone().setY(1), 13);
    g.stage('door');
    await g.talk(data.lines.animalsIn);

    // 막간(창 7:4~10 비가 오기 전 이레): 해 질 녘 방주 문 앞에서 노아와 대화한다.
    await F.acts.dusk();
    await F.acts.walkTo(noah, DOOR.clone().addScaledVector(FRONT, 0.8));
    await g.interlude(noah);

    // 홍수: 가족이 들어가고 여호와께서 문을 닫으신다. 비가 오고 물이 차올라 언덕, 나무, 산이 차례로 잠기고 방주가 뜬다.
    for (const an of F.animals) if (an.visible) { Object.assign(an.userData, { route: [onRamp(DOOR.clone())], toArk: true }); const was = an.userData.onArrive; an.userData.onArrive = () => { was?.(); an.visible = false; }; }
    for (const b of F.birds) b.visible = false;
    await Promise.all([noah, wife, shem].map((f) => F.acts.walkTo(f, DOOR, 1.8)));
    [noah, wife, shem].forEach((f) => (f.visible = false));
    g.hideCompanions();
    g.cam(DOOR.clone().setY(1.2), 13);
    const shut = ark.closeDoor();
    await g.talk(data.lines.flood.slice(0, 1));
    await shut;
    await F.acts.night();
    F.rain.visible = F.ripples.visible = true;
    F.water.visible = true;
    ark.floating = true;
    g.cam(ark.g.position, 19, true);
    // 기다림이 3초를 넘지 않게 물이 차오르는 동안 대사를 함께 띄운다. 물은 들 → 언덕과 나무 → 산 순서로 잠근다.
    const rise = (to, ms) => { const from = F.water.position.y; return tween(ms, (p) => (F.water.position.y = from + (to - from) * easeOut(p))); };
    let r = rise(1.4, 4200);
    await g.talk(data.lines.flood.slice(1, 3));
    await r;
    // 물 위를 떠다니다 산 쪽으로 간다(창 7:18)
    // 물 높이를 따라 산 쪽으로 옮겨 가므로, 물이 산을 덮기 전에는 봉우리 위에 닿지 않는다
    ark.drift = { from: ark.g.position.clone(), to: MOUNT.clone().addScaledVector(FRONT, 0.3), lo: F.water.position.y, hi: WATER_TOP };
    r = rise(2.3, 4000);
    await g.talk(data.lines.flood.slice(3, 4));
    await r;
    r = rise(WATER_TOP, 3000);
    await g.talk(data.lines.flood.slice(4));
    await r;
    ark.drift = null;

    // 창 8:1~4: 바람이 불고 물이 줄어 방주가 아라랏 산에 머문다.
    F.rain.visible = F.ripples.visible = false;
    await F.acts.day();
    await g.talk(data.lines.remembered.slice(0, 1));
    ark.floating = false;
    const recede = tween(3000, (p) => {
      F.water.position.y = WATER_TOP - (WATER_TOP + 0.3) * p;
      ark.g.position.y = Math.max(ARK_REST, F.water.position.y - FLOAT);
      ark.g.rotation.z *= 0.95;
    });
    g.note('place/ararat');
    await g.talk(data.lines.remembered.slice(1));
    await recede;
    F.water.visible = false;

    // 창 8:6~12: 까마귀와 비둘기. 방주에 들어간 그 새들이다. 비둘기는 두 번째에 올리브 잎을 물고 돌아온다.
    const win = ark.window(-2.5);
    g.cam(win, 11);
    const far = win.clone().add(new THREE.Vector3(9, 2, -3));
    await g.talk(data.lines.birds.slice(0, 1));
    F.raven.visible = true;
    F.raven.position.copy(win);
    g.note('creature/raven');
    await fly(F.raven, far, 2200);
    F.raven.visible = false;
    await g.talk(data.lines.birds.slice(1, 2));
    F.dove.visible = true;
    F.dove.position.copy(win);
    g.note('creature/dove');
    await fly(F.dove, far, 1600);
    await fly(F.dove, win, 1600);
    F.leaf.visible = true; // 두 번째 날아갔다 돌아올 때 잎을 문다
    await g.talk(data.lines.birds.slice(2, 3));
    await fly(F.dove, far, 1300);
    await fly(F.dove, win, 1300);
    await g.talk(data.lines.birds.slice(3));
    F.dove.visible = false;

    // 창 8:16~22: 방주에서 나와 제단을 쌓는다. 가족과 짐승이 산기슭으로 내려오고, 남은 새 한 쌍이 창에서 날아 나와 산기슭 나뭇가지에 앉는다.
    g.cam(FOOT, 13);
    g.stage('foot');
    const out = out0();
    [noah, wife, shem].forEach((f, i) => { f.position.copy(out).addScaledVector(ALONG, i - 1); f.visible = true; });
    g.place(FOOT.clone().addScaledVector(ALONG, 2.6).addScaledVector(FRONT, -0.3));
    F.pairs.forEach((p, i) => p.animals.forEach((an, j) => {
      an.position.copy(out).addScaledVector(ALONG, i - 2);
      an.visible = true;
      an.userData.home = FOOT.clone().addScaledVector(ALONG, 4.2 + (i % 3) * 1.4).addScaledVector(FRONT, 0.6 + Math.floor(i / 3) * 1.2 + j * 0.6);
      an.userData.route = [an.userData.home.clone()];
    }));
    await g.talk(data.lines.out.slice(0, 1));
    [F.doves[1], F.ravens[1]].forEach((b, i) => {
      b.visible = true;
      b.position.copy(ark.window(1 + i));
      const perch = F.olive.seats[i * 2];
      fly(b, perch, 2400, 2.5).then(() => land(b, perch));
    });
    await g.talk(data.lines.out.slice(1, 2));
    await Promise.all([F.acts.walkTo(noah, ALTAR.clone().addScaledVector(FRONT, 0.9)), F.acts.walkTo(wife, FOOT.clone().addScaledVector(ALONG, 0.6)), F.acts.walkTo(shem, FOOT.clone().addScaledVector(ALONG, 1.4))]);
    F.altar.visible = true;
    F.acts.face(noah, ALTAR);
    await g.talk(data.lines.out.slice(2, 3));
    await F.acts.bow(noah, 0.4);
    await F.acts.pillar(ALTAR);
    await g.talk(data.lines.out.slice(3));
    F.acts.pillar(null);
    await F.acts.bow(noah, 0);

    // 창 9:12~17 무지개: 구름이 걷히며 산들 뒤 땅 끝에서부터 아치가 그려진다. 구름 속에 발을 둔다(창 9:13).
    // 카메라: 산기슭의 사람들은 대사 창 위에, 무지개 꼭대기는 화면 위 끝 아래에 오도록 방주가 머문 자리를 비춘다.
    // 세로 화면은 화면 폭이 좁아 무지개를 줄여 두 발이 화면 안에 들게 한다.
    // 세로 화면에서는 방주가 화면 폭을 다 덮어 두 발이 가려지므로, 발을 방주 지붕 위 하늘(구름 속)에 띄운다.
    const k = innerWidth < innerHeight ? 0.62 : 1, R = RAINBOW_R * k, base = k < 1 ? 3.2 : 0;
    F.rainbow.scale.setScalar(k);
    F.rainbow.position.y = base;
    g.cam(MOUNT.clone().addScaledVector(FRONT, 0.3).setY(1.2), 17);
    // 구름이 무지개 자리를 덮고 있다가 양옆으로 걷히며 두 발 쪽에 머문다(무지개가 구름 속에 걸린다)
    for (const [i, c] of F.clouds.entries()) {
      const near = i % 2;
      c.userData.from = F.rainbow.position.clone().addScaledVector(ALONG, c.userData.side * (0.8 + near * 1.8)).setY(base + R * 0.85 - near * 0.8);
      c.userData.to = F.rainbow.position.clone().addScaledVector(ALONG, c.userData.side * (R + 0.4 - near * 1.2)).addScaledVector(FRONT, 0.6).setY(base + 0.5 + near * 0.8);
      c.position.copy(c.userData.from);
      c.visible = true;
    }
    F.rainbow.visible = true;
    const show = tween(3600, (p) => {
      for (const c of F.clouds) c.position.lerpVectors(c.userData.from, c.userData.to, easeOut(Math.min(1, p * 1.5)));
      F.rainbow.userData.draw(easeOut(Math.max(0, (p - 0.25) / 0.75)));
    });
    await g.talk(data.lines.rainbow.slice(0, 1));
    await show;
    await g.talk(data.lines.rainbow.slice(1));
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-9-13'], memento: 'item/olive-leaf' });
  },
};
