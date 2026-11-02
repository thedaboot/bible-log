// 1-4 노아의 방주(창 6~9장): 방주 짓기(뼈대 → 판자 → 역청, 노아와 동행) → 짐승·새·기는 것 들여보내기(퀘스트)
// → 저녁 막간(노아) → 홍수(밤, 비, 언덕과 나무와 산이 차례로 잠김, 방주가 뜸) → 아라랏 산 → 까마귀와 비둘기
// → 제단과 무지개(구름이 걷히며 땅 끝에서 그려짐) → 퀴즈(창 9:13)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAltar, makeBird, makeTree, makeLogs, makeCloud } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/noah.js';

const ALONG = V(1, -1).normalize(); // 방주 길이 방향: 화면 가로라 옆모습이 다 보인다
const FRONT = V(1, 1).normalize(); // 카메라 쪽
// 방주 치수(창 6:15): 300 : 50 : 30 규빗. 장면에서는 1규빗을 18/300로 줄인다(선체만으로 사람 키를 넘는 배).
const CUBIT = 18 / 300;
const ARK_L = 300 * CUBIT, ARK_W = 50 * CUBIT, ARK_H = 30 * CUBIT;
const HULL_Y = 0.35; // 받침목(0.2)과 용골(0.15) 위에서 선체가 시작한다
const TOP = HULL_Y + ARK_H;
const ARK = V(-3, -3);
const DOOR = ARK.clone().addScaledVector(FRONT, ARK_W / 2);
const NOAH = DOOR.clone().addScaledVector(FRONT, 1.2).addScaledVector(ALONG, -1.3);
const WORK = [-3.2, 0, 3.2].map((k) => ARK.clone().addScaledVector(FRONT, ARK_W / 2 + 0.8).addScaledVector(ALONG, k));
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
  { kind: 'lizard', name: '도마뱀 한 쌍', color: 0xc08a3a, size: 0.55, home: V(3, 10) },
];
const BIRD_HOME = V(10, 2); // 비둘기 한 쌍과 까마귀 한 쌍이 앉아 있는 풀밭
// 낮은 언덕들: 홍수 때 물이 차오르는 높이를 보여 준다. [자리, 반지름, 높이, 꼭대기 나무]
const HILLS = [[V(-13, 3), 2.0, 1.1, 'pine'], [V(3, -13), 2.0, 1.0, 'pine'], [V(10, -6), 1.8, 0.8, 'round'], [V(-6, 10), 1.8, 0.9, null]];
const WATER_TOP = PEAKS[0][2] + 15 * CUBIT; // 창 7:20 산들보다 열다섯 규빗 위
const RAINBOW_R = 9.4; // 방주(길이 18)보다 넓게. 세로 화면에서는 줄인다(화면 폭이 좁다).

// 새로 나타나는 부품은 살짝 넘쳤다가 자리 잡는다(art-3d.md "easeBack")
const pop = (obj, ms = 700) => { obj.visible = true; return tween(ms, (p) => (obj.scale.y = Math.max(0.01, easeBack(p)))); };

// 선체 띠 하나(옆모습 사다리꼴을 너비만큼 밀어낸 것). 이물·고물이 위로 갈수록 길어져 배 모양이 된다.
function hullBand(y0, y1, m) {
  const rake = 0.9;
  const xEnd = (y) => ARK_L / 2 - rake * (1 - (y - HULL_Y) / ARK_H);
  const s = new THREE.Shape([new THREE.Vector2(-xEnd(y0), 0), new THREE.Vector2(xEnd(y0), 0), new THREE.Vector2(xEnd(y1), y1 - y0), new THREE.Vector2(-xEnd(y1), y1 - y0)]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: ARK_W, bevelEnabled: false });
  geo.translate(0, 0, -ARK_W / 2);
  const band = new THREE.Mesh(geo, m);
  band.position.y = y0;
  band.userData.len = xEnd(y1) * 2;
  return band;
}

// 방주(창 6:14~16): 받침목 위 용골 → 뼈대 → 세 층 판자(아래·가운데·위층) → 지붕과 창, 옆문 → 역청
// 카메라가 위에서 내려다보므로 옆면은 해를 덜 받는다. 옆면이 묻히지 않게 재질에 제 빛을 조금 준다(lit).
const lit = (c, k = 0.35) => mat(c, { emissive: c, emissiveIntensity: k });
function makeArk() {
  const g = new THREE.Group();
  const frameM = lit(PAL.bark);
  const hullM = lit(PAL.plank);
  const waleM = lit(0x8a6a48, 0.5);
  const darkM = mat(0x140f0b);
  const box = (w, h, d, m, x, y, z, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  // 받침목과 용골, 이물·고물 기둥: 처음부터 놓여 있다
  const cradle = new THREE.Group();
  for (let x = -7.5; x <= 7.5; x += 3) box(0.5, 0.2, ARK_W * 0.7, frameM, x, 0.1, 0, cradle);
  const keel = new THREE.Group();
  box(ARK_L - 1.8, 0.15, 0.4, frameM, 0, 0.275, 0, keel);
  for (const s of [-1, 1]) {
    const post = box(0.16, Math.hypot(0.9, ARK_H), 0.2, frameM, s * (ARK_L / 2 - 0.45), HULL_Y + ARK_H / 2, 0, keel);
    post.rotation.z = -s * Math.atan2(0.9, ARK_H);
  }
  // 뼈대: 갈빗대(양옆 기둥 + 위 가로대)와 층마다 긴 띠장. 한 InstancedMesh로 그리고 count로 차례로 보인다.
  const parts = [];
  for (let x = -ARK_L / 2 + 1.1; x <= ARK_L / 2 - 1.1; x += 0.75) {
    for (const z of [-1, 1]) parts.push([x, HULL_Y + ARK_H / 2, z * (ARK_W / 2 - 0.06), 0.09, ARK_H, 0.09]);
    parts.push([x, TOP - 0.04, 0, 0.09, 0.08, ARK_W - 0.1]);
  }
  for (const k of [1, 2, 3]) for (const z of [-1, 1]) parts.push([0, HULL_Y + (ARK_H * k) / 3 - 0.04, z * (ARK_W / 2 - 0.02), ARK_L - 2.2, 0.07, 0.07]);
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), frameM, parts.length);
  const m4 = new THREE.Matrix4();
  parts.forEach(([x, y, z, w, h, d], i) => ribs.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d))));
  ribs.count = 0;
  // 세 층 판자. 층 사이 밝은 띠(wale)가 아래·가운데·위층을 드러낸다.
  const bands = [0, 1, 2].map((k) => hullBand(HULL_Y + (ARK_H * k) / 3, HULL_Y + (ARK_H * (k + 1)) / 3, hullM));
  for (const b of bands.slice(1)) box(b.userData.len - 0.3, 0.08, ARK_W + 0.05, waleM, 0, 0, 0, b);
  // 지붕: 처마 없이 선체 위에 얹은 낮은 맞배지붕(옆면을 가리지 않게)
  const roof = new THREE.Group();
  roof.position.y = TOP;
  const roofM = lit(0x7a5a3a, 0.25);
  const pitchA = 0.22, ridge = (ARK_W / 2) * Math.tan(pitchA);
  for (const z of [-1, 1]) {
    const slab = box(ARK_L + 0.1, 0.07, ARK_W / 2 + 0.05, roofM, 0, ridge / 2, z * ARK_W / 4, roof);
    slab.rotation.x = z * pitchA;
  }
  // 창(창 6:16 "위에서부터 한 규빗"): 용마루를 따라 한 규빗 높이로 띄운 긴 창. 기둥 사이가 트여 있고 위를 작은 지붕이 덮는다.
  // 카메라가 위에서 보므로 옆벽 띠 대신 지붕 위 띠 창으로 그렸다(docs/review/decisions.md 1-4). 보이도록 한 규빗보다 조금 크게 그린다.
  const winH = Math.max(0.2, CUBIT * 3);
  box(ARK_L - 1.4, winH, 0.62, darkM, 0, ridge + winH / 2, 0, roof);
  const postXs = [];
  for (let x = -ARK_L / 2 + 0.9; x <= ARK_L / 2 - 0.9; x += 0.6) postXs.push(x);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, winH, 0.08), frameM, postXs.length * 2);
  postXs.forEach((x, i) => [-1, 1].forEach((z, j) => posts.setMatrixAt(i * 2 + j, m4.makeTranslation(x, ridge + winH / 2, z * 0.33))));
  roof.add(posts);
  box(ARK_L - 1.0, 0.07, 1.0, roofM, 0, ridge + winH + 0.035, 0, roof);
  // 옆문(창 6:16): 아래 경첩으로 열려 짐승이 오르는 발판이 된다. 여호와께서 닫으신다(창 7:16).
  const doorway = box(0.9, 1.1, 0.02, darkM, 0, HULL_Y + 0.55, ARK_W / 2 + 0.012, g);
  const door = new THREE.Group();
  door.position.set(0, HULL_Y, ARK_W / 2 + 0.04);
  box(0.9, 1.1, 0.07, hullM, 0, 0.55, 0, door);
  const OPEN = Math.PI / 2 + Math.asin(HULL_Y / 1.1);
  door.rotation.x = OPEN;
  g.add(cradle, keel, ribs, ...bands, roof, door);
  for (const o of [...bands, roof, door, doorway]) o.visible = false;
  g.rotation.y = -Math.atan2(ALONG.z, ALONG.x); // 로컬 x가 ALONG, 로컬 +z가 FRONT를 본다

  const plank = new THREE.Color(PAL.plank), pitch = new THREE.Color(0x2b231c);
  const showRibs = (n) => { const from = ribs.count; return tween(700, (p) => (ribs.count = Math.round(from + (n - from) * p))); };
  const frames = parts.length - 6;
  // 짓는 단계(1~6): 뼈대 절반 → 뼈대 전부와 띠장 → 아래·가운데층 판자 → 위층·지붕·창·문 → 역청 절반 → 역청 전부
  const progress = async (step) => {
    if (step === 1) await showRibs(Math.round(frames / 2 / 3) * 3);
    if (step === 2) await showRibs(parts.length);
    if (step === 3) { pop(bands[0]); await tween(250, () => {}); await pop(bands[1]); }
    if (step === 4) { pop(bands[2]); doorway.visible = door.visible = true; await tween(250, () => {}); await pop(roof); }
    if (step >= 5) {
      const from = hullM.color.clone(), to = plank.clone().lerp(pitch, step === 5 ? 0.55 : 1);
      await tween(800, (p) => { hullM.color.lerpColors(from, to, p); hullM.emissive.copy(hullM.color); });
    }
  };
  const closeDoor = () => tween(900, (p) => (door.rotation.x = OPEN * (1 - easeOut(p))));
  // 새가 드나드는 창 자리(지붕 위 띠 창의 앞쪽)
  const winAt = (x) => g.localToWorld(new THREE.Vector3(x, TOP + ridge + winH / 2, 0.4));
  return { g, cradle, progress, closeDoor, window: winAt };
}

// 도마뱀: 공용 짐승 몸을 낮고 길게 눌러 기는 모습으로 만들고 긴 꼬리를 단다(창 7:14 땅에 기는 것)
function lizardize(an, color) {
  const s = an.userData.size;
  an.scale.set(1.5, 0.42, 1.7);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.1 * s, 0.2 * s, 0.16 * s), mat(new THREE.Color(color).multiplyScalar(0.8)));
  tail.position.set(-1.0 * s, 0.5 * s, 0);
  tail.rotation.z = 0.15;
  an.userData.body.add(tail);
}

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
  records: ['person/noah', 'person/shem', 'place/ark', 'creature/dove', 'creature/raven', 'place/ararat', 'item/olive-leaf', 'word/gen-9-13'],
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
    F.put(potG, WORK[2].clone().addScaledVector(ALONG, 1.0).addScaledVector(FRONT, -0.3));
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
    const shem = F.person('shem', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x9a6b45 }, WORK[2].clone().addScaledVector(FRONT, 1.4).addScaledVector(ALONG, 1));
    F.keep.push(...WORK, ...PAIRS.map((p) => p.home), BIRD_HOME, FOOT, out0());
    // 짐승 한 쌍씩
    const pairs = PAIRS.map((p) => ({ ...p, animals: [0, 1].map((i) => {
      const an = F.animal(p.kind === 'lizard' ? 'generic' : p.kind, p.color, p.size * (i ? 0.92 : 1), p.home.clone().add(V(i * 1.1, i * -0.4)), { roam: 1.6 });
      if (p.kind === 'lizard') lizardize(an, p.color);
      return an;
    }) }));
    // 새 두 쌍(창 7:14~15): 비둘기와 까마귀. 풀밭에서 콩콩 뛰며 모이를 쪼다가 방주 창으로 날아 들어간다.
    const birdOf = (color) => { const b = makeBird(); b.traverse((o) => { if (o.material) o.material = mat(color); }); b.scale.setScalar(1.5); return b; };
    const doves = [0, 1].map(() => birdOf(0xf4f2ee));
    const ravens = [0, 1].map(() => birdOf(0x22201e));
    const birds = [...doves, ...ravens];
    birds.forEach((b, i) => {
      b.userData.perch = BIRD_HOME.clone().add(V(Math.cos(i * 1.7) * 0.7, Math.sin(i * 1.7) * 0.7));
      b.position.copy(b.userData.perch);
      b.rotation.y = i * 1.3;
      F.group.add(b);
    });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.08), mat(0x7a9a3a));
    leaf.position.x = 0.2;
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
      Object.assign(f.userData, { along: -5 + i * 2.4, front: 3.2 + (i % 2) * 1.8, period: 2.6 + i * 0.45, phase: i * 1.3, dir: i % 2 ? 1 : -1 });
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
        const base = c.clone().addScaledVector(FRONT, u.front).addScaledVector(ALONG, u.along);
        f.position.copy(base).addScaledVector(ALONG, u.dir * (k - 0.5) * 1.4).setY(lvl - 0.1 + Math.sin(k * Math.PI) * 1.1);
        f.rotation.set(0, u.dir > 0 ? -Math.atan2(ALONG.z, ALONG.x) : Math.PI - Math.atan2(ALONG.z, ALONG.x), Math.cos(k * Math.PI) * 0.9);
      }
      if (ark.drift) { const d = ark.drift, k = Math.min(1, Math.max(0, (lvl - d.lo) / (d.hi - d.lo))); ark.g.position.lerpVectors(d.from, d.to, k * k * (3 - 2 * k)); }
      if (water.visible && ark.floating) { ark.g.position.y = Math.max(0, lvl - 0.6) + Math.sin(t * 1.4) * 0.05; ark.g.rotation.z = Math.sin(t * 1.1) * 0.03; }
      for (const b of birds) {
        if (!b.visible) continue;
        if (b.userData.flying) for (const i of [1, 2]) b.children[i].rotation.x = Math.sin(t * 14) * 0.6 * (i === 2 ? 1 : -1);
        else if (b.userData.perch) { b.position.y = Math.abs(Math.sin(t * 3 + b.id)) * 0.08; b.children[0].rotation.z = Math.max(0, Math.sin(t * 1.3 + b.id)) * -0.5; }
      }
      if (rainbow.visible) rainbow.userData.glow(t);
    });
    Object.assign(F, { ark, water, rain, ripples, rainbow, clouds, altar, birds, doves, ravens, raven: ravens[0], dove: doves[0], leaf, mount, pairs, noahFig: noah, wife, shem });
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
      return tween(ms, (p) => { bird.position.lerpVectors(a, to, p); bird.position.y += Math.sin(p * Math.PI) * arc; bird.rotation.y = -Math.atan2(to.z - a.z, to.x - a.x); });
    };
    g.cam(ARK, 15);
    g.stage('door');
    await g.talk(data.lines.arrive.slice(0, 3));
    g.cam(ARK.clone().setY(1), 18);
    await g.talk(data.lines.arrive.slice(3));
    g.cam(null, 13);
    g.stage(null);
    g.meet('noah');
    g.note('place/ark');

    // 도전 1: 방주 짓기. 뼈대 → 판자 → 역청 차례로 하고, 노아가 관찰자가 일하는 자리로 와서 함께 일한다(동행).
    // 단계마다 방주가 실제로 지어져 간다(창 6:14~16). 오래 걸리는 일이라 인내와 신실이 돕는다.
    const removeGreet = g.greet(shem, data.greetings.shem, 'shem');
    let hits = 0;
    const steps = [
      ['뼈대', '용골 위에 뼈대 세우기', 'buildFrame'],
      ['판자', '판자로 세 층 막기', 'buildPlank'],
      ['역청', '안팎에 역청 칠하기', 'buildPitch'],
    ];
    for (const [i, [name, text, say]] of steps.entries()) {
      g.cam(WORK[i].clone().lerp(ARK, 0.4), 14);
      await g.talk(data.lines[say]);
      g.cam(null, 13);
      await g.challenge({
        title: `방주 짓기 ${i + 1}/3: ${name}`, spots: [{ pos: WORK[i], text: `함께 ${text}`, hits: 2 }], verb: '힘 모으기', fruits: ['patience', 'faith'],
        onHit: async (sp) => {
          await F.acts.walkTo(noah, sp.pos.clone().addScaledVector(ALONG, -1.1), 2.4); // 대천사는 관찰자의 화면 오른쪽(+ALONG)에 서므로 노아는 왼쪽에 선다
          F.acts.face(noah, ARK);
          F.acts.speak('noah');
          g.cam(ARK.clone().addScaledVector(ALONG, (i - 1) * 2.5).setY(1), 15);
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
    g.cam(ARK.clone().setY(1), 18);
    await g.talk(data.lines.built.slice(0, 2));
    g.cam(DOOR, 13);
    await g.talk(data.lines.built.slice(2));
    g.cam(null, 13);

    // 퀘스트: 짐승·새·기는 것 들여보내기. 한 쌍 곁에 머무르면 둘이 방주 문(발판)으로 들어가고, 새는 창으로 날아 들어간다.
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
          an.userData.route = [DOOR.clone().addScaledVector(FRONT, 1.2 + i * 0.6), DOOR.clone()];
          an.userData.onArrive = () => (an.visible = false);
        });
        g.reward(`animals/${t.pair.kind}`, 'step');
      },
    });
    // 짐승을 돌보는 일(잠 12:10 의인은 자기 가축의 생명을 돌본다, 친절)
    g.reward('animals-done', 'questDone', null, 'kindness');
    g.cam(DOOR, 13);
    g.stage('door');
    await g.talk(data.lines.animalsIn);

    // 막간(창 7:4~10 비가 오기 전 이레): 해 질 녘 방주 문 앞에서 노아와 대화한다.
    await F.acts.dusk();
    await F.acts.walkTo(noah, DOOR.clone().addScaledVector(FRONT, 0.8));
    await g.interlude(noah);

    // 홍수: 가족이 들어가고 여호와께서 문을 닫으신다. 비가 오고 물이 차올라 언덕, 나무, 산이 차례로 잠기고 방주가 뜬다.
    for (const an of F.animals) if (an.visible) { an.userData.route = [DOOR.clone()]; an.userData.onArrive = () => (an.visible = false); }
    for (const b of F.birds) b.visible = false;
    await Promise.all([noah, wife, shem].map((f) => F.acts.walkTo(f, DOOR, 1.8)));
    [noah, wife, shem].forEach((f) => (f.visible = false));
    g.hideCompanions();
    g.cam(DOOR.clone().setY(0.8), 13);
    const shut = ark.closeDoor();
    await g.talk(data.lines.flood.slice(0, 1));
    await shut;
    await F.acts.night();
    F.rain.visible = F.ripples.visible = true;
    F.water.visible = true;
    ark.cradle.visible = false;
    ark.floating = true;
    g.cam(ark.g.position, 18);
    // 기다림이 3초를 넘지 않게 물이 차오르는 동안 대사를 함께 띄운다. 물은 들 → 언덕과 나무 → 산 순서로 잠근다.
    const rise = (to, ms) => { const from = F.water.position.y; return tween(ms, (p) => (F.water.position.y = from + (to - from) * easeOut(p))); };
    let r = rise(1.0, 4200);
    await g.talk(data.lines.flood.slice(1, 3));
    await r;
    // 물 위를 떠다니다 산 쪽으로 간다(창 7:18)
    // 물 높이를 따라 산 쪽으로 옮겨 가므로, 물이 산을 덮기 전에는 봉우리 위에 닿지 않는다
    ark.drift = { from: ark.g.position.clone(), to: MOUNT.clone().addScaledVector(FRONT, 0.3), lo: 1.0, hi: WATER_TOP };
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
      ark.g.position.y = Math.max(ARK_REST, F.water.position.y - 0.6);
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

    // 창 8:16~22: 방주에서 나와 제단을 쌓는다. 가족과 짐승이 산기슭으로 내려오고, 남은 새 한 쌍이 창에서 날아 나온다.
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
      const perch = FOOT.clone().addScaledVector(ALONG, 3.4 + i * 0.7).addScaledVector(FRONT, -0.6);
      fly(b, perch, 2400, 2.5).then(() => { b.userData.flying = false; b.userData.perch = perch; });
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
