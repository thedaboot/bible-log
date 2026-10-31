// 에덴 동산(창 2~3장)의 세계. 모든 모양은 props.js의 공용 부품을 쓴다.
import * as THREE from 'three';
import {
  PAL, mat, makeTree, makeAnimal, makeBird, makeFigure, dressFigure, animateFigure, turnFigure,
  makeLightPillar, makeSpiritLight, makeSerpent, makeAngel, makeBridge, makeThornBush, makeFruit, animateAnimal,
} from './props.js';
import { tween, easeOut } from './anim.js';
import { RIVERS, ANIMALS, FRUITS } from './data/eden.js';

const C = (hex) => new THREE.Color(hex);
const V = (x, z) => new THREE.Vector3(x, 0, z);
export const EDEN_RADIUS = 12.5;
const SPLIT = V(-5.5, -5.5); // 강이 갈라지는 곳(동산 가운데를 비우려고 가장자리 쪽에 둔다)
// 네 강의 끝(동산 가장자리). RIVERS와 같은 순서.
const RIVER_ENDS = [[-2, -12], [-12, 1], [11.5, -5], [3, 11.5]].map(([x, z]) => V(x, z));
const RIVER_HALF = 0.4; // 강폭의 절반
const CENTER_LIFE = V(-0.2, -1.8);
const CENTER_KNOWLEDGE = V(1.8, 0.2); // 연출이 잘 보이게 카메라 쪽에 둔다
const CENTER = CENTER_LIFE.clone().lerp(CENTER_KNOWLEDGE, 0.5);
export const EDEN_START = V(7, 7);
const ADAM_SPOT = V(4, 3);
const EVE_SPOT = V(5.1, 2.0);
// 네 강이 동산을 네 구역으로 나눈다. 연출에 쓰는 지점은 모두 출발점과 같은 구역(비손·기혼 강 사이)에 둔다.
const HIDE_TREE = V(6, -2.2);
// 연출에서 인물이 서는 자리(나무를 심지 않는다)
const EVE_AT_TREE = CENTER_KNOWLEDGE.clone().add(V(1.9, 1.7));
const ADAM_AT_TREE = CENTER_KNOWLEDGE.clone().add(V(3.1, 0.5));
const HIDE_OUT = [HIDE_TREE.clone().add(V(1.5, 1.2)), HIDE_TREE.clone().add(V(0.7, 1.8))];
// 연출에서 인물이 서는 자리. 이 자리와 카메라 사이(+x, +z 쪽 띠)에는 나무를 두지 않는다(inFrontOfScene).
const SCENE_SPOTS = [ADAM_SPOT, EVE_SPOT, EVE_AT_TREE, ADAM_AT_TREE, ...HIDE_OUT, CENTER_KNOWLEDGE];
export function inFrontOfScene(p) {
  return SCENE_SPOTS.some((s) => {
    const dx = p.x - s.x, dz = p.z - s.z;
    const depth = (dx + dz) / Math.SQRT2, side = Math.abs(dx - dz) / Math.SQRT2;
    return depth > 0 && depth < 7 && side < 1.4;
  });
}
const EAST_GATE = V(9.5, 6.5);
const OUT_DIR = EAST_GATE.clone().normalize(); // 동쪽 문 밖으로 나가는 방향
const WASTE = EAST_GATE.clone().addScaledVector(OUT_DIR, 9); // 동산 밖 거친 땅의 가운데
// 먹어도 되는 열매 나무(FRUITS와 같은 순서). 대추야자는 키가 커서 하와 장면을 가리지 않게 강 건너에 둔다.
const FRUIT_SPOTS = [V(3.5, -2.6), V(2, 4.6), V(10, -3), V(4.2, 7.8), V(-1.2, 5.2)];
// 동물의 터(ANIMALS와 같은 순서). 아담이 지음 받기 전부터 동산을 돌아다닌다(창 1:24~25).
// 한곳에 몰리지 않게 네 구역에 나눠 두고, 저마다 자기 터 둘레(HOME_RANGE)에서만 돌아다닌다.
// 터는 연출 지점과 카메라 사이(연출 지점에서 +x, +z 쪽)를 피해서 둔다.
const ANIMAL_SPOTS = [V(5, -8), V(5.8, 9.6), V(9, -7.6), V(-3.5, 5), V(-9, -6), V(-1, 8.5)];
const HOME_RANGE = 3.5;
// 무대: 연출 중에 동물이 들어오지 않는 자리. 카메라가 (+x, +z)에서 내려다보므로 연출 지점보다 카메라 쪽으로 넓게 잡는다.
const toCam = (p, k = 1.4) => p.clone().add(V(k, k));
export const STAGES = {
  adam: { c: toCam(ADAM_SPOT.clone().lerp(EVE_SPOT, 0.5)), r: 3.8 },
  center: { c: toCam(CENTER), r: 3.8 },
  knowledge: { c: toCam(EVE_AT_TREE.clone().lerp(ADAM_AT_TREE, 0.5)), r: 4 },
  hide: { c: toCam(HIDE_TREE, 1.8), r: 4.2 },
  gate: { c: EAST_GATE.clone(), r: 4.5 },
};

function closestOnSegment(p, a, b) {
  const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
  return a.clone().addScaledVector(ab, t).setY(0);
}

// 매번 같은 배치를 만드는 작은 난수(나무 배치를 점검 스크립트로 확인하려고 고정한다).
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 강과 다리: 강마다 한 번 꺾고, 두 번째 마디에 판자 다리를 하나 둔다.
export const RIVER_SEGMENTS = [];
export const BRIDGES = [];
RIVER_ENDS.forEach((end, i) => {
  const bend = SPLIT.clone().lerp(end, 0.5).add(V(i % 2 ? 1.2 : -1.2, i % 2 ? -1.2 : 1.2));
  RIVER_SEGMENTS.push([SPLIT, bend], [bend, end]);
  BRIDGES.push({ pos: bend.clone().lerp(end, 0.45), angle: Math.atan2(end.z - bend.z, end.x - bend.x) });
});
const BRIDGE_GAP = 0.65; // 다리 가운데에서 강을 따라 이만큼은 건널 수 있다

// 원형 장애물(나무, 바위, 샘, 문기둥). makeEden이 채운다.
const colliders = [];
function onBridge(q) { return BRIDGES.some((b) => q.distanceTo(b.pos) < BRIDGE_GAP); }
// p를 장애물과 물 밖으로 밀어낸다. r은 움직이는 쪽의 반지름. 밀렸으면 true.
export function collide(p, r = 0.35) {
  let hit = false;
  for (const c of colliders) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + r;
    if (d < min) {
      const k = d < 1e-4 ? [1, 0] : [dx / d, dz / d];
      p.x = c.x + k[0] * min;
      p.z = c.z + k[1] * min;
      hit = true;
    }
  }
  for (const [a, b] of RIVER_SEGMENTS) {
    const q = closestOnSegment(p, a, b);
    const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz), min = RIVER_HALF + r;
    if (d < min && !onBridge(q)) {
      const k = d < 1e-4 ? [0, 1] : [dx / d, dz / d];
      p.x = q.x + k[0] * min;
      p.z = q.z + k[1] * min;
      hit = true;
    }
  }
  return hit;
}

export function makeEden(scene) {
  colliders.length = 0;
  const rand = seeded(20261101);
  const group = new THREE.Group();
  const sky = C(0xbfe6ff);
  const hemi = new THREE.HemisphereLight(0xf4ffe8, 0x6b5a3a, 1.15);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.3);
  sun.position.set(-6, 12, 5);
  group.add(hemi, sun);

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(13, 14.5, 2, 20), mat(PAL.grass));
  ground.position.y = -1;
  const sea = new THREE.Mesh(new THREE.CylinderGeometry(32, 32, 0.4, 32), mat(PAL.water));
  sea.position.y = -0.6;
  group.add(ground, sea);

  // 동산 밖(창 3:17~18): 동쪽 문 밖의 거친 땅과 가시덤불. 추방 장면에서 두 사람이 이리로 걸어 나간다.
  const waste = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 2, 14), mat(PAL.waste));
  waste.position.copy(WASTE).setY(-1.02);
  group.add(waste);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r = 2 + rand() * 5.5;
    const p = WASTE.clone().add(V(Math.cos(a) * r, Math.sin(a) * r));
    if (p.distanceTo(EAST_GATE.clone().addScaledVector(OUT_DIR, 5)) < 2) continue; // 걸어 나갈 길은 비운다
    const thing = i % 4 === 0 ? new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rand() * 0.3, 0), mat(0x8a8172)) : makeThornBush(0.8 + rand() * 0.6);
    thing.position.copy(p);
    if (i % 4 === 0) thing.position.y = 0.15;
    group.add(thing);
  }
  // 동쪽 문: 문기둥 두 개
  const side = V(-OUT_DIR.z, OUT_DIR.x);
  for (const s of [-1.6, 1.6]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.5), mat(0xb9ab8f));
    post.position.copy(EAST_GATE).addScaledVector(side, s).setY(1.3);
    post.rotation.y = -Math.atan2(OUT_DIR.z, OUT_DIR.x);
    group.add(post);
    colliders.push({ x: post.position.x, z: post.position.z, r: 0.4 });
  }

  // 샘과 네 강(창 2:10)
  const riverM = mat(0x4f8fd0, { emissive: 0x2f6fb5, emissiveIntensity: 0.25 });
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.08, 10), riverM);
  pool.position.copy(SPLIT).setY(0.03);
  group.add(pool);
  colliders.push({ x: SPLIT.x, z: SPLIT.z, r: 1.2 });
  for (const [a, b] of RIVER_SEGMENTS) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(a.distanceTo(b) + 0.6, 0.06, RIVER_HALF * 2), riverM);
    seg.position.copy(a).lerp(b, 0.5).setY(0.03);
    seg.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    group.add(seg);
  }
  for (const b of BRIDGES) {
    const bridge = makeBridge(2.6, 1.2);
    bridge.position.copy(b.pos);
    bridge.rotation.y = -b.angle + Math.PI / 2; // 다리의 x축이 강을 가로지른다
    group.add(bridge);
  }
  // 강 끝 표지석
  RIVER_ENDS.forEach((end) => {
    for (const [dx, dz, h] of [[0.7, 0.4, 0.5], [-0.6, 0.6, 0.35], [0.2, -0.7, 0.4]]) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(h, 0), mat(0x9a9488));
      stone.position.set(end.x + dx, h * 0.4, end.z + dz);
      group.add(stone);
      colliders.push({ x: stone.position.x, z: stone.position.z, r: h * 0.8 });
    }
  });

  // 나무: 동산 가운데의 두 나무 + 열매 나무 + 둘레의 나무들. 강, 다리 어귀, 연출 지점은 비운다.
  const life = makeTree('life');
  life.position.copy(CENTER_LIFE);
  const knowledge = makeTree('knowledge');
  knowledge.position.copy(CENTER_KNOWLEDGE);
  const hideTree = makeTree('round');
  hideTree.position.copy(HIDE_TREE);
  hideTree.scale.setScalar(1.6);
  group.add(life, knowledge, hideTree);
  colliders.push({ x: CENTER_LIFE.x, z: CENTER_LIFE.z, r: 0.55 }, { x: CENTER_KNOWLEDGE.x, z: CENTER_KNOWLEDGE.z, r: 0.55 }, { x: HIDE_TREE.x, z: HIDE_TREE.z, r: 0.5 });
  const fruitTrees = FRUITS.map((f, i) => {
    const tree = makeTree('fruit', f.kind);
    tree.position.copy(FRUIT_SPOTS[i]);
    tree.scale.setScalar(1.25);
    tree.userData.fruitName = f.name;
    group.add(tree);
    colliders.push({ x: tree.position.x, z: tree.position.z, r: 0.4 });
    return tree;
  });
  const keep = [EDEN_START, ADAM_SPOT, EVE_SPOT, HIDE_TREE, EAST_GATE, CENTER, EVE_AT_TREE, ADAM_AT_TREE, ...HIDE_OUT, ...FRUIT_SPOTS, ...ANIMAL_SPOTS];
  const clear = (p) => p.length() < 3.4 || keep.some((k) => p.distanceTo(k) < 2.4)
    || BRIDGES.some((b) => p.distanceTo(b.pos) < 2.6)
    || RIVER_SEGMENTS.some(([a, b]) => p.distanceTo(closestOnSegment(p, a, b)) < 1.4)
    || p.distanceTo(SPLIT) < 2.2 || RIVER_ENDS.some((e) => p.distanceTo(e) < 2.6) || inFrontOfScene(p)
    || colliders.some((c) => Math.hypot(p.x - c.x, p.z - c.z) < 1.6);
  let placed = 0;
  for (let tries = 0; placed < 34 && tries < 800; tries++) {
    const a = rand() * Math.PI * 2, r = 3.5 + rand() * 8.5;
    const p = V(Math.cos(a) * r, Math.sin(a) * r);
    if (clear(p)) continue;
    const tree = makeTree(placed % 3 ? 'round' : 'pine');
    tree.position.copy(p);
    const s = 1.1 + rand() * 0.4;
    tree.scale.setScalar(s);
    group.add(tree);
    colliders.push({ x: p.x, z: p.z, r: 0.35 * s });
    placed++;
  }

  // 사람: 관찰자와 같은 뼈대(makeFigure). 처음에는 잎사귀와 머리카락으로 가린다.
  const adam = makeFigure({ hair: 'short', hairColor: PAL.hairBrown, outfit: 'leaves' });
  const eve = makeFigure({ hair: 'long', hairColor: PAL.hairDark, outfit: 'leaves' });
  adam.position.copy(ADAM_SPOT);
  eve.position.copy(EVE_SPOT);
  adam.rotation.y = eve.rotation.y = Math.PI / 4;
  adam.visible = eve.visible = false;
  const dust = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.45, 7), mat(PAL.soil));
  dust.position.copy(ADAM_SPOT).setY(0.2);
  dust.visible = false;
  const pillar = makeLightPillar(0.9, 20);
  pillar.visible = false;
  group.add(adam, eve, dust, pillar);

  // 동물(창 2:19): 처음부터 동산을 돌아다닌다. 새는 하늘을 돈다.
  const animals = ANIMALS.map((info, i) => {
    const an = makeAnimal(info.color, info.size, info.kind);
    an.position.copy(ANIMAL_SPOTS[i]);
    const yaw = rand() * Math.PI * 2;
    Object.assign(an.userData, {
      name: info.name, radius: 0.45 * info.size, home: ANIMAL_SPOTS[i].clone(),
      yaw, yawWant: yaw, speed: 0, state: 'idle', wait: rand() * 3, dest: null, goal: null, calm: false, best: Infinity, stuck: 0,
    });
    group.add(an);
    return an;
  });
  const birds = Array.from({ length: 8 }, (_, i) => {
    const b = makeBird();
    b.scale.setScalar(1.2);
    b.userData = { a: (i / 8) * Math.PI * 2, r: 4 + rand() * 6, y: 5 + rand() * 1.5, speed: 0.3 + rand() * 0.2 };
    group.add(b);
    return b;
  });

  // 뱀: 선악을 알게 하는 나무의 낮은 가지에 몸을 걸치고 머리를 하와 쪽으로 내민다(땅에 있는 하와 발밑과 겹치지 않게).
  const serpent = makeSerpent();
  // 화면에서 하와와 겹치지 않게 하와의 왼쪽(화면 기준)에 둔다. 머리는 앞으로, 몸은 줄기 쪽 잎 속으로 올라간다.
  serpent.position.copy(CENTER_KNOWLEDGE).add(new THREE.Vector3(0.2, 0.95, 1.5));
  serpent.rotation.set(0, -0.8, 0.45);
  serpent.scale.setScalar(1.4);
  serpent.visible = false;
  const presence = makeSpiritLight(); // 창 3:8 동산을 거니시는 하나님: 형상 없이 움직이는 빛
  presence.visible = false;
  const rib = makeSpiritLight(); // 창 2:21~22 아담의 옆구리에서 나와 하와가 되는 빛
  rib.visible = false;
  const cherubim = [-1.3, 1.3].map((dx) => {
    const c = makeAngel({ cherub: true });
    c.position.copy(EAST_GATE).addScaledVector(OUT_DIR, 2).addScaledVector(side, dx * 2); // 문기둥(±1.6) 바깥, 문 밖 2만큼
    c.rotation.y = Math.atan2(OUT_DIR.x, OUT_DIR.z);
    c.visible = false;
    return c;
  });
  const sword = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.2), mat(0xff8a3a, { emissive: 0xff5a1a, emissiveIntensity: 1 }));
  sword.position.copy(EAST_GATE).addScaledVector(OUT_DIR, 1.1).setY(1.6); // 도는 반지름 1.1: 기둥 사이를 지나지 않는다
  sword.visible = false;
  const swordLight = new THREE.PointLight(0xff7a2a, 10, 8);
  swordLight.position.copy(sword.position);
  swordLight.visible = false;
  group.add(serpent, presence, rib, ...cherubim, sword, swordLight);

  // 스포트라이트(창 2:9): 동산 가운데를 말할 때 선악을 알게 하는 나무만 밝힌다.
  const spot = new THREE.SpotLight(0xfff0c0, 0, 16, 0.3, 0.5, 0);
  spot.position.copy(CENTER_KNOWLEDGE).setY(10);
  spot.target.position.copy(CENTER_KNOWLEDGE);
  const beamM = new THREE.MeshBasicMaterial({ color: PAL.light, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.9, 10, 16, 1, true), beamM);
  beam.position.copy(CENTER_KNOWLEDGE).setY(5);
  beam.visible = false;
  group.add(spot, spot.target, beam);

  // ---------- 인물 이동: walkTo(fig, 목표) → 도착하면 끝나는 Promise. 장애물은 돌아가고, 막혀서 1.5초 넘게 못 가면 목표에 둔다. ----------
  const movers = new Map();
  function walkTo(fig, to, speed = 1.6) {
    fig.userData.faceYaw = undefined;
    return new Promise((resolve) => movers.set(fig, { to: to.clone().setY(0), speed, resolve, best: Infinity, stuck: 0 }));
  }
  const NPC_REF = 1.3; // 아담·하와는 천천히 걸어도 관찰자만큼 흔들리며 걷는다(animateFigure의 ref)
  // 따라다니기: 동물 퀘스트 동안 아담이 관찰자 곁을 따라다닌다.
  let follow = null;
  const FOLLOW_OFFSET = V(-1.1, 1.1);

  // ---------- 연출 ----------
  const v = new THREE.Vector3();
  const handOf = (fig) => { fig.updateMatrixWorld(true); return fig.localToWorld(v.set(0.36, 0.8, 0.22)).clone(); };
  // 바라보기: 기본은 천천히 돌아선다. instant면 바로 돌린다(손 위치를 바로 써야 할 때).
  const face = (fig, p, instant = false) => {
    const yaw = Math.atan2(p.x - fig.position.x, p.z - fig.position.z);
    if (instant) fig.rotation.y = yaw;
    fig.userData.faceYaw = yaw;
  };
  let stage = null;
  const arc = (obj, from, to, ms, lift = 0.6) => tween(ms, (p) => obj.position.lerpVectors(from, to, easeOut(p)).setY(from.y + (to.y - from.y) * p + Math.sin(p * Math.PI) * lift));

  const materials = new Map(); // 타락 연출: 모든 색을 흐리고 차갑게 바꾸기 위해 원래 색을 기억한다
  const fallTint = C(0x7d8797);
  let held = null; // 하와와 아담이 손에 든 열매 { fruit, fig }

  const acts = {
    formAdam: async () => {
      pillar.position.copy(ADAM_SPOT);
      dust.visible = pillar.visible = true;
      await tween(1200, (p) => dust.scale.setScalar(0.3 + p * 0.7));
      adam.visible = true;
      adam.position.y = -1.5;
      await tween(2600, (p) => {
        adam.position.y = -1.5 + easeOut(p) * 1.5;
        dust.scale.setScalar(1 - p * 0.9);
      });
      dust.visible = pillar.visible = false;
    },
    // 창 2:9 동산 가운데: 선악을 알게 하는 나무에 빛을 내리고 주변을 조금 어둡게 한다.
    spotlight: (on) => {
      beam.visible = true;
      return tween(1100, (p) => {
        const k = on ? easeOut(p) : 1 - p;
        spot.intensity = 9 * k;
        beamM.opacity = 0.22 * k;
        hemi.intensity = 1.15 - 0.45 * k;
        sun.intensity = 1.3 - 0.7 * k;
        if (!on && p === 1) beam.visible = false;
      });
    },
    // 창 2:19 하나님께서 동물들을 아담에게 데려가셨다: 동물들이 아담 둘레로 모인다.
    gatherAnimals: () => {
      animals.forEach((an, i) => {
        const a = (i / animals.length) * Math.PI * 2;
        goTo(an, ADAM_SPOT.clone().add(V(Math.cos(a) * 2.8, Math.sin(a) * 2.8)), false);
      });
      return Promise.race([
        new Promise((r) => { const id = setInterval(() => { if (animals.every((an) => !an.userData.goal)) { clearInterval(id); r(); } }, 100); }),
        new Promise((r) => setTimeout(r, 6000)),
      ]);
    },
    // 이름 짓기가 시작되면 동물들이 저마다 자기 터로 돌아간다(관찰자가 동산 곳곳을 다니며 찾는다).
    releaseAnimals: () => sendHome(),
    // 타락이 시작되면 동물들이 저마다 자기 터로 걸어 돌아간다.
    sendHome: () => sendHome(),
    // 연출 무대: 이름(STAGES의 키)을 주면 동물들이 그 자리를 비켜 준다. null이면 푼다.
    stage: (name) => (stage = name ? STAGES[name] : null),
    // 대사가 나올 때 말하는 인물이 고개를 끄덕이며 들썩인다.
    speak: (who) => {
      const fig = { adam, eve }[who];
      if (fig?.visible) fig.userData.talk = 1;
      if (who === 'serpent') serpent.userData.talk = 1;
    },
    follow: (fig, target) => { follow = target ? { fig, target } : null; },
    walkTo,
    face,
    // 창 2:21 아담이 깊이 잠든다(등을 대고 눕는다).
    sleep: async () => {
      await walkTo(adam, ADAM_SPOT);
      face(adam, EVE_SPOT);
      adam.userData.pose = 'lie';
      const { rig } = adam.userData;
      await tween(1400, (p) => { rig.rotation.set(-Math.PI / 2 * easeOut(p), 0, 0); rig.position.y = 0.3 * p; });
    },
    // 창 2:21~22 옆구리에서 나온 빛이 하와의 모습이 된다(화면 전환 없이).
    formEve: async () => {
      rib.visible = true;
      const from = adam.position.clone().add(new THREE.Vector3(0, 0.45, 0));
      const to = EVE_SPOT.clone().setY(0.9);
      rib.position.copy(from);
      rib.scale.setScalar(0.3);
      await tween(1600, (p) => { rib.position.lerpVectors(from, to, easeOut(p)); rib.position.y += Math.sin(p * Math.PI) * 0.8; rib.scale.setScalar(0.3 + p * 1.2); });
      eve.position.copy(EVE_SPOT);
      face(eve, adam.position);
      eve.visible = true;
      pillar.position.copy(EVE_SPOT);
      pillar.visible = true;
      await tween(2000, (p) => { eve.scale.setScalar(Math.max(0.001, easeOut(p))); rib.scale.setScalar(1.5 * (1 - p) + 0.001); });
      rib.visible = false;
      await tween(900, () => {});
      pillar.visible = false;
      // 아담이 깨어 일어난다
      const { rig } = adam.userData;
      await tween(1000, (p) => { rig.rotation.x = -Math.PI / 2 * (1 - easeOut(p)); rig.position.y = 0.3 * (1 - p); });
      adam.userData.pose = null;
      face(adam, eve.position);
    },
    gatherAtTree: async () => {
      serpent.visible = true;
      await Promise.all([
        walkTo(eve, EVE_AT_TREE),
        walkTo(adam, ADAM_AT_TREE),
      ]);
      face(eve, serpent.position);
      face(adam, eve.position);
    },
    // 창 3:6 하와가 열매를 따서 먹고, 함께 있던 아담에게 손에서 손으로 건넨다.
    eat: async () => {
      const f = knowledge.userData.fruits.find((x) => x.visible);
      const from = f.getWorldPosition(new THREE.Vector3());
      knowledge.remove(f);
      group.add(f);
      f.scale.setScalar(1.8);
      face(eve, CENTER_KNOWLEDGE, true);
      await arc(f, from, handOf(eve), 900, 0.3);
      held = { fruit: f, fig: eve };
      await tween(500, () => {});
      await tween(400, (p) => f.scale.setScalar(1.8 - 0.5 * p)); // 한 입 먹는다
      await walkTo(adam, eve.position.clone().add(V(0.9, -0.3)), 1.4);
      face(eve, adam.position, true);
      face(adam, eve.position, true);
      held = null;
      await arc(f, f.position.clone(), handOf(adam), 800, 0.25);
      held = { fruit: f, fig: adam };
      await tween(500, () => {});
      await tween(400, (p) => f.scale.setScalar(1.3 - 0.5 * p));
      held = null;
      f.visible = false;
    },
    fall: async () => {
      group.traverse((o) => {
        if (o.material && !materials.has(o.material) && o.material.color) materials.set(o.material, o.material.color.clone());
      });
      const fromSky = scene.background.clone();
      await tween(3000, (p) => {
        for (const [m, orig] of materials) m.color.copy(orig).lerp(fallTint, 0.35 * p).multiplyScalar(1 - 0.15 * p);
        scene.background.lerpColors(fromSky, C(0x9aa6b8), p);
        hemi.intensity = 1.15 - 0.35 * p;
      });
      serpent.visible = false;
    },
    figLeaves: () => {
      dressFigure(adam, { hair: 'short', hairColor: PAL.hairBrown, outfit: 'figleaves' });
      dressFigure(eve, { hair: 'long', hairColor: PAL.hairDark, outfit: 'figleaves' });
    },
    // 창 3:8 나무 사이에 숨는다: 카메라(+x, +z) 반대쪽인 나무 뒤로 간다.
    hide: () => Promise.all([
      walkTo(adam, HIDE_TREE.clone().add(V(-0.9, -1.0)), 2.4),
      walkTo(eve, HIDE_TREE.clone().add(V(-1.4, -0.3)), 2.4),
    ]),
    presence: async () => {
      presence.visible = true;
      presence.position.set(EAST_GATE.x, 1.2, EAST_GATE.z);
      const to = HIDE_TREE.clone().add(new THREE.Vector3(2.6, 1.2, 2.2));
      const from = presence.position.clone();
      await tween(4000, (p) => presence.position.lerpVectors(from, to, p));
    },
    // 창 3:9~10 "네가 어디 있느냐?" 부르심에 두 사람이 나무 뒤에서 나와 빛 앞에 선다(가죽옷 장면이 보이게).
    comeOut: async () => {
      await Promise.all([
        walkTo(adam, HIDE_OUT[0], 1.3),
        walkTo(eve, HIDE_OUT[1], 1.3),
      ]);
      face(adam, presence.position);
      face(eve, presence.position);
    },
    clothe: async () => {
      pillar.position.copy(adam.position).lerp(eve.position, 0.5).setY(0);
      pillar.visible = true;
      await tween(900, () => {});
      dressFigure(adam, { hair: 'short', hairColor: PAL.hairBrown, outfit: 'skins' });
      dressFigure(eve, { hair: 'long', hairColor: PAL.hairDark, outfit: 'skins' });
      await tween(1500, () => {});
      pillar.visible = false;
    },
    // 창 3:23~24 동쪽 문을 지나 거친 땅으로 걸어 나간다. 그 뒤 그룹들과 불 칼이 길을 지킨다.
    expel: async () => {
      presence.visible = false;
      const out = EAST_GATE.clone().addScaledVector(OUT_DIR, 6.5);
      await Promise.all([walkTo(adam, EAST_GATE.clone().addScaledVector(side, -0.4), 1.5), walkTo(eve, EAST_GATE.clone().addScaledVector(side, 0.4), 1.5)]);
      await Promise.all([walkTo(adam, out.clone().addScaledVector(side, -0.5), 1.3), walkTo(eve, out.clone().addScaledVector(side, 0.5), 1.3)]);
      cherubim.forEach((c) => (c.visible = true));
      sword.visible = swordLight.visible = true;
      await tween(1200, (p) => cherubim.forEach((c) => c.scale.setScalar(1.3 * Math.max(0.0001, easeOut(p)))));
    },
  };

  // 창 3장부터 바로 볼 때(이어하기 지점)는 2장이 끝난 상태로 맞춘다.
  function skipToFall() {
    adam.visible = eve.visible = true;
    adam.position.y = 0;
    eve.scale.setScalar(1);
  }

  const inStage = (p, pad = 0) => stage && p.distanceTo(stage.c) < stage.r + pad;
  // a에서 b로 곧게 가는 길이 강을 건너는지(다리 포함). 동물은 자기 터가 있는 강 이쪽에서만 돌아다닌다.
  const crossesRiver = (a, b) => {
    const n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.3));
    for (let i = 0; i <= n; i++) {
      const q = a.clone().lerp(b, i / n);
      if (q.distanceTo(SPLIT) < 1.6 || RIVER_SEGMENTS.some(([s, e]) => q.distanceTo(closestOnSegment(q, s, e)) < RIVER_HALF + 0.2)) return true;
    }
    return false;
  };
  // 강 건너로 갈 때는 다리 어귀 → 건너편 어귀 → 목표 순서로 간다. 강을 두 번 건너야 하면 다리 두 개를 지난다.
  // 그래도 길이 없으면 곧장 가고, 막히면 목표에 둔다.
  const ends = (br) => {
    const n = V(-Math.sin(br.angle), Math.cos(br.angle)); // 강에 수직인 방향
    return [[br.pos.clone().addScaledVector(n, 1.7), br.pos.clone().addScaledVector(n, -1.7)], [br.pos.clone().addScaledVector(n, -1.7), br.pos.clone().addScaledVector(n, 1.7)]];
  };
  function routeTo(from, to) {
    if (!crossesRiver(from, to)) return [to.clone()];
    for (const br of BRIDGES) for (const [a, b] of ends(br)) {
      if (!crossesRiver(from, a) && !crossesRiver(b, to)) return [a, b, to.clone()];
    }
    for (const b1 of BRIDGES) for (const [a1, c1] of ends(b1)) {
      if (crossesRiver(from, a1)) continue;
      for (const b2 of BRIDGES) for (const [a2, c2] of ends(b2)) {
        if (b2 !== b1 && !crossesRiver(c1, a2) && !crossesRiver(c2, to)) return [a1, c1, a2, c2, to.clone()];
      }
    }
    return [to.clone()];
  }
  // 돌아다닐 다음 자리: 자기 터 둘레(강 이쪽)에서 장애물·무대·동산 끝을 피해 고른다. 못 고르면 무대 밖이나 터로 간다.
  function pickDest(an) {
    const u = an.userData;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * HOME_RANGE;
      const p = u.home.clone().add(V(Math.cos(a) * r, Math.sin(a) * r));
      if (p.length() > EDEN_RADIUS - 1.2 || inStage(p, 0.6) || collide(p.clone(), u.radius) || crossesRiver(u.home, p)) continue;
      return p;
    }
    if (stage) {
      const out = stage.c.clone().addScaledVector(an.position.clone().sub(stage.c).setY(0).normalize(), stage.r + 1.5);
      if (!crossesRiver(u.home, out)) return out;
    }
    return u.home.clone();
  }
  function goTo(an, goal, back) {
    Object.assign(an.userData, { goal: goal.clone(), route: routeTo(an.position, goal), back, calm: false, best: Infinity, stuck: 0 });
  }
  function sendHome() {
    animals.forEach((an) => goTo(an, an.userData.home, true));
  }

  const tmp = new THREE.Vector3();
  function stepToward(obj, to, speed, dt, r) {
    tmp.subVectors(to, obj.position).setY(0);
    const d = tmp.length();
    if (d < 0.05) return d;
    obj.position.addScaledVector(tmp.normalize(), Math.min(d, speed * dt));
    collide(obj.position, r);
    return d;
  }
  function update(dt, t, playerPos = null) {
    if (pillar.visible) pillar.userData.pulse(t);
    for (const [fig, m] of movers) {
      const d = stepToward(fig, m.to, m.speed, dt, 0.3);
      if (d < m.best - 0.02) { m.best = d; m.stuck = 0; } else m.stuck += dt;
      if (d < 0.05 || m.stuck > 1.5) {
        if (m.stuck > 1.5) fig.position.copy(m.to); // 장애물에 막혀 못 가면 목표에 둔다(연출이 멈추지 않게)
        movers.delete(fig);
        animateFigure(fig, 0, dt, t);
        m.resolve();
        continue;
      }
      turnFigure(fig, Math.atan2(tmp.x, tmp.z), dt);
      animateFigure(fig, m.speed, dt, t, NPC_REF);
    }
    let walking = null; // 이번 프레임에 따라 걸은 인물
    if (follow && !movers.has(follow.fig)) {
      const fig = follow.fig;
      const goal = follow.target.clone().add(FOLLOW_OFFSET).setY(0);
      // 관찰자가 강 건너에 있으면 다리를 지나 따라간다. 관찰자가 또 다른 구역으로 가면 길을 다시 정한다.
      if (crossesRiver(fig.position, goal)) {
        if (!follow.route?.length || crossesRiver(follow.route.at(-1), goal)) follow.route = routeTo(fig.position, goal).slice(0, -1);
      } else follow.route = null;
      const aim = follow.route?.[0] ?? goal;
      const d = aim.distanceTo(fig.position), dGoal = goal.distanceTo(fig.position);
      if (follow.route && d < 0.6) follow.route.shift();
      follow.stuck = dGoal > 2 && d > (follow.last ?? Infinity) - 0.01 ? (follow.stuck ?? 0) + dt : 0;
      follow.last = d;
      // 안전장치: 아주 멀어지거나 5초 넘게 다가가지 못하면 관찰자 곁으로 옮긴다
      if (dGoal > 16 || follow.stuck > 5) { fig.position.copy(goal); collide(fig.position, 0.3); follow.stuck = 0; follow.route = null; }
      if (dGoal > 0.6) {
        const speed = Math.min(4, Math.max(1.4, dGoal * 1.5));
        stepToward(follow.fig, aim, speed, dt, 0.3);
        turnFigure(follow.fig, Math.atan2(tmp.x, tmp.z), dt);
        animateFigure(follow.fig, speed, dt, t, NPC_REF);
        walking = follow.fig;
      }
    }
    for (const fig of [adam, eve]) {
      if (!fig.visible || fig === walking || movers.has(fig) || fig.userData.pose === 'lie') continue;
      if (fig.userData.faceYaw !== undefined) turnFigure(fig, fig.userData.faceYaw, dt * 0.5);
      animateFigure(fig, 0, dt, t, NPC_REF);
    }
    if (held) held.fruit.position.copy(handOf(held.fig));
    for (const b of birds) {
      const u = b.userData, a = u.a + t * u.speed;
      b.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 2 + u.a) * 0.3, Math.sin(a) * u.r);
      b.rotation.y = -a - Math.PI / 2;
      b.children[1].rotation.x = Math.sin(t * 10 + u.a) * 0.6;
      b.children[2].rotation.x = -Math.sin(t * 10 + u.a) * 0.6;
    }
    // 동물의 움직임: 걷다가 멈춰 풀을 뜯고, 다시 다음 자리를 골라 걷는다. 방향은 천천히 틀고,
    // 많이 돌아야 하면 속도를 줄인다. 연출 무대 안에 있으면 서둘러 비켜 준다.
    for (const an of animals) {
      const u = an.userData;
      const near = playerPos && !u.goal && !u.calm && an.position.distanceTo(playerPos) < 2.6 && !inStage(an.position);
      let dest = null, want = 0;
      if (u.goal) {
        dest = u.route?.[0] ?? u.goal;
        want = u.walk * 1.4;
      } else if (u.calm) {
        want = 0;
      } else if (inStage(an.position)) {
        if (!u.dest || inStage(u.dest)) u.dest = pickDest(an);
        u.state = 'walk';
        dest = u.dest;
        want = u.run;
      } else if (near) {
        u.yawWant = Math.atan2(playerPos.z - an.position.z, playerPos.x - an.position.x); // 관찰자를 바라본다
      } else if (u.state === 'walk') {
        if (!u.dest || an.position.distanceTo(u.dest) < 0.4 || u.stuck > 2) {
          Object.assign(u, { state: 'idle', wait: 2 + Math.random() * 4, dest: null, stuck: 0 });
        } else {
          dest = u.dest;
          want = u.walk;
        }
      } else {
        u.wait -= dt;
        if (u.wait <= 0) Object.assign(u, { state: 'walk', dest: pickDest(an), best: Infinity, stuck: 0 });
      }
      if (dest) u.yawWant = Math.atan2(dest.z - an.position.z, dest.x - an.position.x);
      if (dest && u.side > 0) { u.side -= dt; u.yawWant += u.sideDir * 1.3; } // 막혔을 때 옆으로 비켜 돌아간다
      const turn = Math.atan2(Math.sin(u.yawWant - u.yaw), Math.cos(u.yawWant - u.yaw));
      u.yaw += Math.max(-2.2 * dt, Math.min(2.2 * dt, turn));
      const slow = Math.max(0.2, Math.cos(Math.min(Math.abs(turn), Math.PI / 2)));
      u.speed += (want * slow - u.speed) * Math.min(1, dt * 2.5);
      if (u.speed > 0.005) {
        an.position.x += Math.cos(u.yaw) * u.speed * dt;
        an.position.z += Math.sin(u.yaw) * u.speed * dt;
        if (collide(an.position, u.radius) && !u.goal && u.state === 'walk') u.stuck += dt;
      }
      // 서로 겹치지 않게 살짝 밀어낸다
      for (const o of animals) {
        if (o === an) continue;
        const dx = an.position.x - o.position.x, dz = an.position.z - o.position.z, d = Math.hypot(dx, dz);
        const min = (u.radius + o.userData.radius) * 1.15;
        if (d < min && d > 1e-4) { an.position.x += (dx / d) * (min - d) * 0.5; an.position.z += (dz / d) * (min - d) * 0.5; }
      }
      an.rotation.y = -u.yaw;
      // 목표(아담 곁, 자기 터)에 닿았는지, 강에 막혔는지
      if (dest) {
        const d = an.position.distanceTo(dest);
        if (d < u.best - 0.02) { u.best = d; u.stuck = 0; } else u.stuck += dt;
        if (u.stuck > 1.2 && !(u.side > 0) && Math.floor(u.stuck / 1.2) !== u.sideAt) {
          u.sideAt = Math.floor(u.stuck / 1.2);
          u.side = 0.9;
          u.sideDir = Math.random() < 0.5 ? 1 : -1;
        }
        if (u.goal && dest !== u.goal && d < 0.6) { u.route.shift(); u.best = Infinity; u.stuck = 0; } // 다리 어귀를 지났다
        else if (u.goal && (d < 0.9 || u.stuck > 8)) {
          if (u.stuck > 8) an.position.copy(u.goal); // 안전장치: 8초 넘게 못 가면 목표에 둔다(연출이 멈추지 않게)
          u.goal = null;
          if (u.back) Object.assign(u, { back: false, state: 'idle', wait: 1 + Math.random() * 2 });
          else { u.calm = true; u.yawWant = Math.atan2(ADAM_SPOT.z - an.position.z, ADAM_SPOT.x - an.position.x); }
          u.best = Infinity;
          u.stuck = 0;
        }
      }
      animateAnimal(an, u.speed, dt, t, u.state === 'idle' && !u.goal && !near && !u.calm);
    }
    if (serpent.visible) {
      const talk = serpent.userData.talk ?? 0;
      serpent.userData.talk = Math.max(0, talk - dt);
      serpent.userData.ph = (serpent.userData.ph ?? 0) + dt * (1 + talk * 1.5); // 말할 때 더 빨리 꿈틀거린다
      serpent.userData.wiggle(serpent.userData.ph);
    }
    if (sword.visible) sword.rotation.y = t * 4; // 두루 도는 불 칼
  }

  return {
    group, sky, adam, eve, animals, fruitTrees, knowledge, acts, update, skipToFall, collide, cherubim, pickDest,
    makeFruit,
    riverEnds: RIVERS.map((r, i) => ({ ...r, pos: RIVER_ENDS[i] })),
    spots: { start: EDEN_START, adam: ADAM_SPOT, eve: EVE_SPOT, knowledge: CENTER_KNOWLEDGE, center: CENTER, hide: HIDE_TREE, gate: EAST_GATE, waste: WASTE },
  };
}
