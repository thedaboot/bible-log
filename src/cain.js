// 가인과 아벨(창 4장)의 들판. 모든 모양은 props.js의 공용 부품을 쓴다. 에덴(eden.js)의 틀을 따른다.
// 창 4:8은 멀리서 비추고 쓰러지는 모습까지만 보인다(docs/standards/quests-and-staging.md "연출").
import * as THREE from 'three';
import {
  PAL, mat, makeTree, makeAnimal, animateAnimal, makeFigure, animateFigure, collapseFigure, turnFigure, makeLightPillar, makeSpiritLight,
} from './props.js';
import { tween, easeOut } from './anim.js';
import { CAIN, FLOCK } from './data/cain.js';
import { toast } from './ui.js';
import { SPEAKERS } from './text.js';

const V = (x, z) => new THREE.Vector3(x, 0, z);
const UP = new THREE.Vector3(0, 1, 0);
export const CAIN_RADIUS = 12.5;
export const CAIN_START = V(6, 6);
// 카메라가 (+x, +z)에서 내려다본다. 화면에서 나란히 보여야 하는 둘은 화면 가로 방향(1, 0, -1)으로 뗀다.
const ADAM_SPOT = V(3.4, 1.6);
const EVE_SPOT = V(1.8, 3.2);
const FOLD = V(-4.5, 2); // 아벨의 양 우리
const FOLD_R = 2.2;
const GATE_DIR = V(1, 0.35).normalize(); // 우리 문은 들판 쪽으로 열린다
const GATE_OUT = FOLD.clone().addScaledVector(GATE_DIR, FOLD_R + 1);
const ABEL_SPOT = FOLD.clone().addScaledVector(GATE_DIR, FOLD_R + 1.2).add(V(0.4, -1.1)); // 문 옆, 양이 드나드는 길을 비운다
const FIELD = V(4, -4.5); // 가인의 밭
const CAIN_SPOT = V(4, -3.2);
// 제물을 놓는 돌무더기 둘. 본문(창 4장)에는 제단이 나오지 않는다(첫 제단은 창 8:20). 각색이라 감수 목록에 올린다.
const ABEL_ALTAR = V(-1.6, -1.2);
const CAIN_ALTAR = V(1.0, -3.8);
const ALTARS = ABEL_ALTAR.clone().lerp(CAIN_ALTAR, 0.5);
const ABEL_AT_ALTAR = ABEL_ALTAR.clone().add(V(-0.8, 0.8));
const CAIN_AT_ALTAR = CAIN_ALTAR.clone().add(V(0.8, -0.8));
// 창 4:8 들: 카메라에서 먼 쪽. 멀리서 비춘다.
const OPEN_FIELD = V(-6.5, -5); // 땅 끝에 붙으면 멀리서 볼 때 하늘이 화면을 차지한다
const NOD_DIR = V(1, -0.6).normalize(); // 가인이 돌아서는 쪽(창 4:5)
// 창 4:8 뒤 가인이 아벨을 끌어다 덮는 자리(각색, 창 4:9 "모릅니다"와 4:10~11 땅이 피를 받음). 들의 화면 왼쪽, 덤불 밑.
const HIDE = V(-8, -3.6);
const BUSH = HIDE.clone().add(V(-0.6, -0.7)); // 카메라 반대쪽이라 덮은 자리를 가리지 않는다
const HIDE_STAND = HIDE.clone().add(V(1.1, -1.1)); // 덮은 자리 시작의 화면 오른쪽(cover가 흙더미 가운데 기준으로 다시 정한다). 빛은 그 오른쪽 위에 내려온다
const LEAVE_DIR = V(0.6, -1).normalize(); // 창 4:16 떠나는 걸음: 화면 오른쪽, 조금 먼 쪽. 짧게 걸어 휴대폰 세로 화면 안에서 끝난다
// 양의 터(FLOCK과 같은 순서). 무대와 우리에서 떨어진 들판 곳곳에 둔다.
const SHEEP_SPOTS = [V(-7.5, -2.5), V(-8.5, 5.5), V(-2, 8), V(2.5, 8.5), V(8, -0.5)];
const toCam = (p, k = 1.4) => p.clone().add(V(k, k));
export const STAGES = {
  home: { c: toCam(ADAM_SPOT.clone().lerp(EVE_SPOT, 0.5)), r: 3 },
  fold: { c: toCam(ABEL_SPOT, 1), r: 2.6 },
  altars: { c: toCam(ALTARS, 1.2), r: 3.8 },
  field: { c: toCam(OPEN_FIELD, 2.5), r: 5 }, // 창 4:8: 관찰자도 멀찍이 떨어진다
};

// 원형 장애물(울타리 기둥, 돌무더기, 나무). makeCain이 채운다.
const colliders = [];
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
  return hit;
}

// 연출 중 관찰자가 비켜 설 자리 후보(가까운 순): 무대 밖, 설 수 있고, 곧게 걸어 닿는 자리. makeCain 뒤에 쓴다.
export function stepAsideSpots(name, from, r = 0.35) {
  const st = STAGES[name];
  if (!st) return [];
  const spots = [];
  for (const k of [0.8, 1.6, 2.4]) for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const p = st.c.clone().add(V(Math.cos(a) * (st.r + k), Math.sin(a) * (st.r + k)));
    if (p.length() > CAIN_RADIUS - 0.5 || collide(p.clone(), r) || Object.values(STAGES).some((o) => p.distanceTo(o.c) < o.r)) continue;
    const n = Math.ceil(from.distanceTo(p) / 0.25);
    let ok = true;
    for (let j = 1; j <= n && ok; j++) ok = !collide(from.clone().lerp(p, j / n).setY(0), r * 0.8);
    if (ok) spots.push(p);
  }
  return spots.sort((a, b) => a.distanceTo(from) - b.distanceTo(from));
}

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCain(scene) {
  colliders.length = 0;
  const rand = seeded(20261102);
  const group = new THREE.Group();
  const sky = new THREE.Color(0xc9e4f2);
  const hemi = new THREE.HemisphereLight(0xf4f8e0, 0x6b5a3a, 1.1);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.3);
  sun.position.set(-6, 12, 5);
  group.add(hemi, sun);

  // 에덴 동쪽 들판: 동산보다 마른 풀빛(창 3:17~18 수고하여 일구는 땅)
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(13, 14.5, 2, 20), mat(0x8fae5a));
  ground.position.y = -1;
  group.add(ground);

  // 가인의 밭: 갈아 놓은 흙과 곡식 줄
  const soil = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.06, 3.2), mat(PAL.soil));
  soil.position.copy(FIELD).setY(0.03);
  group.add(soil);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) {
    const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 4), mat(0xb9b04a));
    sprout.position.set(FIELD.x - 1.8 + j * 0.6, 0.2, FIELD.z - 1.2 + i * 0.6);
    group.add(sprout);
  }

  // 양 우리: 둥글게 박은 말뚝과 가로대. 문(GATE_DIR 쪽)은 비운다.
  const postM = mat(PAL.plank);
  const gateA = Math.atan2(GATE_DIR.z, GATE_DIR.x);
  const posts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - gateA), Math.cos(a - gateA))) < 0.45) continue;
    const p = FOLD.clone().add(V(Math.cos(a) * FOLD_R, Math.sin(a) * FOLD_R));
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), postM);
    post.position.copy(p).setY(0.35);
    group.add(post);
    colliders.push({ x: p.x, z: p.z, r: 0.22 });
    posts.push(p);
  }
  for (let i = 0; i < posts.length - 1; i++) {
    const [a, b] = [posts[i], posts[i + 1]];
    if (a.distanceTo(b) > 1) continue; // 문 자리
    const rail = new THREE.Mesh(new THREE.BoxGeometry(a.distanceTo(b), 0.07, 0.06), postM);
    rail.position.copy(a).lerp(b, 0.5).setY(0.5);
    rail.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    group.add(rail);
  }
  // 말뚝 사이로 지나가지 못하게 울타리를 촘촘한 원으로 막는다(문 자리만 빈다)
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - gateA), Math.cos(a - gateA))) < 0.45) continue;
    colliders.push({ x: FOLD.x + Math.cos(a) * FOLD_R, z: FOLD.z + Math.sin(a) * FOLD_R, r: 0.12 });
  }

  // 돌무더기 둘(각색, 위 ALTARS 주석)
  const stoneM = mat(0x9a9488);
  const altarTop = {};
  for (const [key, at] of [['abel', ABEL_ALTAR], ['cain', CAIN_ALTAR]]) {
    for (const [dx, dz, h, y] of [[0, 0, 0.42, 0.2], [0.35, 0.2, 0.3, 0.15], [-0.3, 0.25, 0.32, 0.15], [0.05, -0.32, 0.3, 0.15], [0, 0.02, 0.26, 0.52]]) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(h, 0), stoneM);
      stone.position.set(at.x + dx, y, at.z + dz);
      group.add(stone);
    }
    colliders.push({ x: at.x, z: at.z, r: 0.6 });
    altarTop[key] = at.clone().setY(0.85);
  }

  // 들판 둘레의 나무(무대, 우리, 밭, 길, 양의 터는 비운다)
  // 덤불(창 4:8 뒤 덮는 자리): 잎 뭉치 셋과 돌 둘
  for (const [dx, dz, r, c] of [[0, 0, 0.45, PAL.leafDark], [0.35, 0.3, 0.32, 0x5f8f3a], [-0.4, 0.25, 0.3, 0x5f8f3a]]) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(c));
    leaf.position.set(BUSH.x + dx, r * 0.8, BUSH.z + dz);
    group.add(leaf);
  }
  for (const [dx, dz, r] of [[0.7, -0.2, 0.22], [-0.2, 0.6, 0.18]]) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), stoneM);
    stone.position.set(BUSH.x + dx, r * 0.6, BUSH.z + dz);
    group.add(stone);
  }
  colliders.push({ x: BUSH.x, z: BUSH.z, r: 0.45 });

  const keep = [CAIN_START, ADAM_SPOT, EVE_SPOT, FOLD, ABEL_SPOT, GATE_OUT, FIELD, ABEL_ALTAR, CAIN_ALTAR, OPEN_FIELD, HIDE, ...SHEEP_SPOTS];
  let placed = 0;
  for (let tries = 0; placed < 18 && tries < 600; tries++) {
    const a = rand() * Math.PI * 2, r = 6 + rand() * 6;
    const p = V(Math.cos(a) * r, Math.sin(a) * r);
    if (keep.some((k) => p.distanceTo(k) < 3) || Object.values(STAGES).some((s) => p.distanceTo(s.c) < s.r + 1) || colliders.some((c) => Math.hypot(p.x - c.x, p.z - c.z) < 1.6)) continue;
    if (p.x + p.z > 6) continue; // 카메라 쪽은 비워 장면을 가리지 않게 한다
    const tree = makeTree(placed % 3 ? 'round' : 'pine');
    tree.position.copy(p);
    const s = 1 + rand() * 0.4;
    tree.scale.setScalar(s);
    group.add(tree);
    colliders.push({ x: p.x, z: p.z, r: 0.35 * s });
    placed++;
  }

  // 사람: 아담과 하와(가죽옷, 창 3:21), 가인(밭 일꾼), 아벨(목자, 지팡이)
  const adam = makeFigure({ hair: 'short', hairColor: PAL.hairBrown, beard: 'short', outfit: 'skins' });
  const eve = makeFigure({ hair: 'long', hairColor: PAL.hairDark, outfit: 'skins' });
  const cain = makeFigure({ hair: 'short', hairColor: PAL.hairDark, outfit: 'tunic', outfitColor: 0x9a7a52 });
  const abel = makeFigure({ hair: 'short', hairColor: PAL.hairBrown, outfit: 'shepherd', outfitColor: 0xd8cfb8, item: 'staff' });
  adam.position.copy(ADAM_SPOT);
  eve.position.copy(EVE_SPOT);
  cain.position.copy(CAIN_SPOT);
  abel.position.copy(ABEL_SPOT);
  for (const f of [adam, eve, cain, abel]) f.rotation.y = Math.PI / 4;
  group.add(adam, eve, cain, abel);
  const people = { adam, eve, cain, abel };

  // 양 떼: 저마다 자기 터에서 풀을 뜯는다. 어린양(첫 새끼)은 어미 곁을 따라다닌다.
  const sheep = FLOCK.map((info, i) => {
    const an = makeAnimal(0xf5f5f0, info.size, 'sheep');
    an.position.copy(SHEEP_SPOTS[i]);
    const yaw = rand() * Math.PI * 2;
    Object.assign(an.userData, { id: info.id, name: info.name, radius: 0.45 * info.size, home: SHEEP_SPOTS[i].clone(), yaw, speed: 0, dest: null, wait: rand() * 3, route: null, penned: false });
    group.add(an);
    return an;
  });
  const mother = sheep.find((s) => s.userData.id === 'mother');
  const lamb = makeAnimal(0xfffdf6, 0.55, 'sheep');
  lamb.position.copy(mother.position).add(V(0.7, 0.4));
  Object.assign(lamb.userData, { id: 'lamb', name: '어린양', radius: 0.25, yaw: 0, speed: 0, follow: mother, route: null });
  group.add(lamb);
  // 우리 안 자리(양마다 하나, 어린양은 어미 곁)
  const slots = sheep.map((_, i) => FOLD.clone().add(V(Math.cos(i * 1.3 + 2.4) * 1.1, Math.sin(i * 1.3 + 2.4) * 1.1)));

  // 빛: 창 4:4 받으신 제물에 내리는 빛기둥, 창 4:6~15 말씀하시는 하나님(형상 없는 빛)
  const pillar = makeLightPillar(0.8, 20);
  pillar.position.copy(ABEL_ALTAR);
  pillar.visible = false;
  const presence = makeSpiritLight();
  presence.visible = false;
  // 가인의 제물(땅의 소산): 곡식 단. 가인이 손에 들고 와서 돌무더기 위에 놓는다.
  const sheaf = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), mat(0xd9b84a));
    stalk.position.set(Math.cos(i) * 0.06, 0, Math.sin(i) * 0.06);
    stalk.rotation.z = Math.cos(i * 2) * 0.15;
    sheaf.add(stalk);
  }
  sheaf.visible = false;
  // 창 4:15 가인에게 주신 표: 이마의 작은 빛
  const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: PAL.holy }));
  mark.position.set(0, 1.42, 0.2);
  mark.visible = false;
  cain.userData.rig.add(mark);
  // 가인이 덮은 흙더미(각색). 창 4:10 "피가 땅에서 울부짖는다"에서 은은히 빛난다(emissive).
  const moundMat = mat(PAL.soil, { emissive: PAL.holy, emissiveIntensity: 0 });
  const mound = new THREE.Group();
  const heap = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), moundMat);
  heap.scale.set(0.95, 0.32, 0.5);
  mound.add(heap);
  for (const [x, z, a] of [[-0.5, 0.1, 0.4], [0.1, -0.2, -0.6], [0.5, 0.15, 1.2]]) {
    const twig = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), mat(PAL.bark));
    twig.position.set(x, 0.3, z);
    twig.rotation.y = a;
    mound.add(twig);
  }
  mound.visible = false;
  let cry = false; // 창 4:10부터 흙더미가 빛난다
  const trialSpot = HIDE.clone().lerp(HIDE_STAND, 0.5); // 심문 장면 카메라 자리(cover가 정한다)
  group.add(pillar, presence, sheaf, mound);

  // ---------- 인물 이동: walkTo(fig, 목표) → 도착하면 끝나는 Promise. 막혀서 1.5초 넘게 못 가면 목표에 둔다. ----------
  const movers = new Map();
  const tmp = new THREE.Vector3();
  function walkTo(fig, to, speed = 1.6) {
    fig.userData.faceYaw = undefined;
    return new Promise((resolve) => movers.set(fig, { to: to.clone().setY(0), speed, resolve, best: Infinity, stuck: 0 }));
  }
  const face = (fig, p) => { fig.userData.faceYaw = Math.atan2(p.x - fig.position.x, p.z - fig.position.z); };
  const handOf = (fig) => { fig.updateMatrixWorld(true); return fig.localToWorld(new THREE.Vector3(0.36, 0.8, 0.22)); };
  let stage = null;
  let carry = null; // 가인이 손에 든 곡식 단
  let follow = null; // 관찰자를 따라오는 어린양 { target }

  const pen = (an, i) => {
    Object.assign(an.userData, { penned: true, route: [GATE_OUT.clone(), slots[i]], dest: null });
  };

  const acts = {
    stage: (name) => (stage = name ? STAGES[name] : null),
    speak: (who) => { if (people[who]) people[who].userData.talk = 1; },
    walkTo,
    face,
    // 양 한 마리가 우리로 걸어 들어간다(문 밖 → 우리 안 자리). 어린양은 어미를 따라간다.
    pen: (an) => pen(an, sheep.indexOf(an)),
    // 저녁과 아침: 하늘과 빛이 노을빛으로 물들었다가 돌아온다(막간 앞뒤).
    dusk: (on) => {
      const from = scene.background.clone(), to = on ? new THREE.Color(0xe8a878) : sky;
      return tween(1800, (p) => {
        scene.background.lerpColors(from, to, p);
        const k = on ? p : 1 - p;
        hemi.intensity = 1.1 - 0.4 * k;
        sun.intensity = 1.3 - 0.6 * k;
        sun.color.setHex(0xfff1d0).lerp(new THREE.Color(0xff9a5a), k);
      });
    },
    // 제물 준비: 어린양이 관찰자를 따라온다 / 아벨 곁 돌무더기 앞에 선다
    lambFollow: (target) => { follow = target ? { target } : null; lamb.userData.follow = target ? null : mother; },
    lambToAltar: async () => {
      follow = null;
      lamb.userData.route = [ABEL_ALTAR.clone().add(V(0.15, 0.85))];
      await new Promise((r) => { const id = setInterval(() => { if (!lamb.userData.route) { clearInterval(id); r(); } }, 100); });
      lamb.userData.yaw = Math.atan2(ABEL_ALTAR.z - lamb.position.z, ABEL_ALTAR.x - lamb.position.x);
    },
    // 두 형제가 저마다 제물을 들고 돌무더기 곁에 선다
    toAltars: async () => {
      sheaf.visible = true;
      carry = sheaf;
      await Promise.all([walkTo(cain, CAIN_AT_ALTAR, 1.4), walkTo(abel, ABEL_AT_ALTAR, 1.6)]);
      face(cain, CAIN_ALTAR);
      face(abel, ABEL_ALTAR);
      await tween(500, () => {});
      carry = null;
      const from = sheaf.position.clone();
      await tween(700, (p) => sheaf.position.lerpVectors(from, altarTop.cain, easeOut(p)).setY(from.y + (altarTop.cain.y - from.y) * p + Math.sin(p * Math.PI) * 0.3));
    },
    // 창 4:4 받으신 제물: 아벨의 돌무더기에 빛이 내린다. 어린양은 빛 속에서 보이지 않게 된다(죽이는 장면은 그리지 않는다).
    accept: async () => {
      pillar.visible = true;
      await tween(1600, (p) => pillar.scale.set(Math.max(0.01, easeOut(p)), 1, Math.max(0.01, easeOut(p))));
      await tween(1400, (p) => lamb.scale.setScalar(Math.max(0.001, 1 - p)));
      lamb.visible = false;
    },
    acceptEnd: () => { pillar.visible = false; },
    // 창 4:5 가인이 몹시 화가 나서 얼굴빛이 변한다: 돌아서서 고개를 떨군다.
    sulk: async () => {
      face(cain, CAIN_SPOT.clone().addScaledVector(NOD_DIR, 3));
      await tween(700, () => {});
      cain.userData.pose = 'down';
      const { rig } = cain.userData;
      await tween(600, (p) => (rig.rotation.x = 0.35 * p));
    },
    presence: async (near) => {
      const to = near.position.clone().add(new THREE.Vector3(0.9, 1.3, -0.9)); // 화면에서 인물 오른쪽(겹치지 않게)
      const from = presence.visible ? presence.position.clone() : to.clone().add(new THREE.Vector3(0, 4, 0)); // 처음에는 위에서 내려온다
      presence.visible = true;
      await tween(1600, (p) => presence.position.lerpVectors(from, to, easeOut(p)));
    },
    // 창 4:8 둘이 들로 나간다. 멀리 간 뒤 가인이 아벨에게 다가가고, 아벨이 쓰러진다(치는 동작은 그리지 않는다).
    toField: async () => {
      cain.userData.pose = null;
      pillar.visible = presence.visible = false;
      await Promise.all([walkTo(abel, OPEN_FIELD, 2.2), walkTo(cain, OPEN_FIELD.clone().add(V(1.6, -0.2)), 2.1)]);
      face(abel, cain.position);
      face(cain, abel.position);
      await tween(400, () => {});
    },
    approach: async () => {
      await walkTo(cain, abel.position.clone().add(V(0.6, -0.1)), 1);
      await tween(350, () => {});
      // 아벨이 휘청이며 무너지고, 가인은 놀란 듯 한 걸음 물러선다
      const back = cain.position.clone().addScaledVector(cain.position.clone().sub(abel.position).setY(0).normalize(), 0.7);
      const from = cain.position.clone();
      await Promise.all([
        collapseFigure(abel),
        tween(500, (p) => cain.position.lerpVectors(from, back, easeOut(p))).then(() => { cain.userData.pose = 'down'; return tween(500, (p) => (cain.userData.rig.rotation.x = 0.3 * p)); }),
      ]);
    },
    // 창 4:8 뒤(각색): 가인이 주위를 살피고 아벨을 덤불 밑으로 끌어간다. 멀리서 비춘다.
    drag: async () => {
      cain.userData.pose = null;
      for (const d of [V(-1, 1), V(1, -1)]) { face(cain, cain.position.clone().add(d)); await tween(650, () => {}); }
      const dir = HIDE.clone().sub(abel.position).setY(0).normalize();
      await walkTo(cain, abel.position.clone().addScaledVector(dir, 0.8), 1.2);
      face(cain, abel.position);
      cain.userData.armPose = 'carry';
      await tween(300, () => {});
      // 가인은 아벨 쪽을 본 채 뒷걸음질하고, 누운 몸이 끌리는 쪽으로 돌아 따라온다(몸은 눕힌 인물의 x축 방향)
      const from = cain.position.clone(), to = HIDE.clone().addScaledVector(dir, 0.8), body = abel.position.clone();
      const yaw0 = abel.rotation.y, yaw1 = Math.atan2(-dir.z, dir.x);
      await tween(from.distanceTo(to) * 1100, (p) => {
        cain.position.lerpVectors(from, to, p);
        abel.position.lerpVectors(body, HIDE, p);
        abel.rotation.y = yaw0 + Math.atan2(Math.sin(yaw1 - yaw0), Math.cos(yaw1 - yaw0)) * Math.min(1, p * 3);
      });
      cain.userData.armPose = null;
    },
    // 흙과 마른 가지로 덮는다: 몸을 굽혔다 폈다 하는 동안 흙더미가 차오르고 아벨은 그 밑으로 가려진다
    cover: async () => {
      // 흙더미(가로 반지름 0.95)와 겹치지 않게 누운 몸 가운데에서 화면 오른쪽으로 1.5 떨어져 선다
      new THREE.Box3().setFromObject(abel).getCenter(mound.position).setY(0);
      const stand = mound.position.clone().add(V(1.05, -1.05));
      trialSpot.copy(mound.position).lerp(stand, 0.5);
      await walkTo(cain, stand, 1.2);
      face(cain, mound.position);
      await tween(450, () => {});
      mound.rotation.y = abel.rotation.y;
      mound.scale.setScalar(0.01);
      mound.visible = true;
      cain.userData.pose = 'bend';
      const { rig } = cain.userData;
      await tween(2600, (p) => {
        rig.rotation.x = 0.15 + 0.4 * Math.abs(Math.sin(p * Math.PI * 3));
        mound.scale.setScalar(Math.max(0.01, easeOut(p)));
        if (p > 0.55) abel.visible = false;
      });
      rig.rotation.x = 0;
      cain.userData.pose = null;
    },
    faceLight: () => face(cain, presence.position),
    // 창 4:10 피가 땅에서 울부짖는다: 덮은 자리가 은은히 빛나고 가인이 그쪽을 돌아본다
    cry: () => { cry = true; face(cain, mound.position); },
    // 창 4:15 표를 주신다
    mark: async () => {
      mark.visible = true;
      await tween(800, (p) => mark.scale.setScalar(Math.max(0.01, easeOut(p) * 1.6)));
    },
    // 창 4:16 가인이 여호와 앞을 떠난다. 빛은 그 자리에 두고, 나무에 막히지 않는 길을 골라 화면 안에서 멀어진다.
    leave: async () => {
      const from = cain.position.clone();
      let to = from.clone().addScaledVector(LEAVE_DIR, 3.2);
      for (const a of [0, 0.35, -0.35, 0.7, -0.7]) {
        const p = from.clone().addScaledVector(LEAVE_DIR.clone().applyAxisAngle(UP, a), 3.2);
        if (p.length() > CAIN_RADIUS - 1) continue;
        let ok = true;
        for (let j = 1; j <= 18 && ok; j++) ok = !collide(from.clone().lerp(p, j / 18), 0.3);
        if (ok) { to = p; break; }
      }
      // 걸음 끝 40% 동안 흐려지며 사라진다(카메라는 그 자리에 둔다)
      const mats = [];
      cain.traverse((o) => { if (o.material) { o.material.transparent = true; mats.push(o.material); } });
      const start = from.distanceTo(to);
      const fadeId = setInterval(() => { const k = Math.min(1, cain.position.distanceTo(from) / start); for (const m of mats) m.opacity = Math.min(1, (1 - k) / 0.4); }, 50);
      await walkTo(cain, to, 1.4);
      clearInterval(fadeId);
      cain.visible = false;
    },
    hideField: () => { abel.visible = cain.visible = presence.visible = false; cry = false; moundMat.emissiveIntensity = 0; },
  };

  const inStage = (p, pad = 0) => stage && p.distanceTo(stage.c) < stage.r + pad;
  function stepToward(obj, to, speed, dt, r) {
    tmp.subVectors(to, obj.position).setY(0);
    const d = tmp.length();
    if (d < 0.05) return d;
    obj.position.addScaledVector(tmp.normalize(), Math.min(d, speed * dt));
    collide(obj.position, r);
    return d;
  }
  // 양이 걸을 때: 방향을 천천히 틀며 dest로 간다. 닿았으면 true.
  function sheepStep(an, dest, speed, dt) {
    const u = an.userData;
    const want = Math.atan2(dest.z - an.position.z, dest.x - an.position.x);
    const turn = Math.atan2(Math.sin(want - u.yaw), Math.cos(want - u.yaw));
    u.yaw += Math.max(-2.2 * dt, Math.min(2.2 * dt, turn));
    u.speed += (speed * Math.max(0.2, Math.cos(Math.min(Math.abs(turn), Math.PI / 2))) - u.speed) * Math.min(1, dt * 2.5);
    an.position.x += Math.cos(u.yaw) * u.speed * dt;
    an.position.z += Math.sin(u.yaw) * u.speed * dt;
    collide(an.position, u.radius);
    return an.position.distanceTo(dest) < 0.35;
  }

  // 밭 밟기(각색, CAIN.furrow): 경고(main.js 인사 CAIN_GREETING)를 들은 뒤 밭을 또 밟으면 가인이 몇 걸음 따라와 팔을 휘두르며 꾸짖는다.
  // 관찰자가 밭을 벗어나면 멈춰 제자리로 돌아가고, 한 번 꾸짖은 뒤 4초는 쉰다. 연출(stage)·대사 중에는 반응하지 않고, 걷기를 막지 않는다.
  const SIDE = V(1, -1).normalize(); // 화면 가로 방향(카메라가 (+x, +z)에서 본다)
  const onSoil = (p) => Math.abs(p.x - FIELD.x) < 2.2 && Math.abs(p.z - FIELD.z) < 1.6;
  const furrow = { warned: false, armed: false, from: null, t: 0, rest: 0, line: 0, away: false };
  function calm() {
    const { rig } = cain.userData;
    rig.position.y = rig.rotation.x = rig.rotation.z = 0;
    cain.userData.pose = null;
  }
  function furrowTick(dt, t, pp) {
    furrow.rest = Math.max(0, furrow.rest - dt);
    if (!pp || !globalThis.document) return;
    const u = cain.userData, mine = u.pose === 'furrow';
    const talking = !document.getElementById('dialog').hidden;
    const on = onSoil(pp);
    if (!furrow.warned) {
      // 가인 곁에서 대사 창이 뜬 순간(main.js 인사)을 경고로 본다
      if (talking && pp.distanceTo(cain.position) < 2.6) furrow.warned = true;
      return;
    }
    if (!mine) {
      if (talking) return;
      // 대사·연출로 꾸짖기를 그만둔 뒤에는 그것이 끝나고 나서 제자리로 돌아간다(U6: 연출 중에 걸어 나가 장면을 어지럽히지 않게)
      if (furrow.away) { if (stage) return; furrow.away = false; if (!movers.has(cain) && cain.position.distanceTo(CAIN_SPOT) > 0.3) walkTo(cain, CAIN_SPOT, 1.4).then(() => face(cain, CAIN_SPOT.clone().add(V(1, 1)))); return; }
      furrow.from ??= pp.clone();
      // 경고 뒤 밭을 한 번 벗어났거나 밭 위를 더 걸었으면 "다시 밟은" 것으로 본다
      if (!on || pp.distanceTo(furrow.from) > 1.2) furrow.armed = true;
      const free = !stage && cain.visible && !u.pose && !movers.has(cain) && cain.position.distanceTo(CAIN_SPOT) < 0.3;
      if (!(on && furrow.armed && free && !furrow.rest)) return;
      u.pose = 'furrow';
      furrow.t = 0;
      const line = CAIN.furrow[furrow.line++ % CAIN.furrow.length]; // 차례로 돌아 같은 말이 이어지지 않는다
      toast(`${SPEAKERS.cain}: ${line.text}`, { kind: 'say' });
    }
    furrow.t += dt;
    // 밭을 벗어났거나 다 꾸짖었으면 제자리로 돌아간다. 연출·대사가 시작되어도 그만둔다(연출이 가인을 옮기면 그쪽을 따른다).
    if (!on || furrow.t > 2.6 || stage || talking || !cain.visible) {
      calm();
      const scene = stage || talking || !cain.visible;
      Object.assign(furrow, { rest: 4, armed: false, from: pp.clone(), away: scene });
      if (!scene && !movers.has(cain)) walkTo(cain, CAIN_SPOT, 1.4).then(() => face(cain, CAIN_SPOT.clone().add(V(1, 1))));
      return;
    }
    // 관찰자 쪽으로 성큼 다가간다. 화면에서 겹치지 않게 관찰자의 화면 가로 옆(SIDE, 가인이 오던 쪽) 한 걸음에 서고, 제자리에서 3.2 넘게는 가지 않는다.
    const side = Math.sign(tmp.subVectors(cain.position, pp).dot(SIDE)) || 1;
    const goal = pp.clone().setY(0).addScaledVector(SIDE, 1.1 * side);
    if (goal.distanceTo(CAIN_SPOT) > 3.2) goal.sub(CAIN_SPOT).setLength(3.2).add(CAIN_SPOT);
    const d = stepToward(cain, goal, 2.6, dt, 0.3);
    turnFigure(cain, Math.atan2(pp.x - cain.position.x, pp.z - cain.position.z), dt);
    animateFigure(cain, d > 0.1 ? 2.6 : 0, dt, t, 1.3);
    // 꾸짖는 몸짓: 한 팔을 머리 위로 들어 휘두르고, 다른 팔은 앞으로 내지르며 몸을 들썩인다
    const { rig, arms } = u;
    rig.position.y += Math.abs(Math.sin(t * 9)) * 0.08;
    rig.rotation.x = 0.12 + Math.sin(t * 9) * 0.06;
    if (arms) {
      arms[0].rotation.x = -2.5 + Math.sin(t * 14) * 0.5;
      arms[1].rotation.x = -1.1 + Math.sin(t * 14 + Math.PI) * 0.35;
    }
  }

  function update(dt, t, playerPos = null) {
    furrowTick(dt, t, playerPos);
    if (pillar.visible) pillar.userData.pulse(t);
    if (cry) moundMat.emissiveIntensity = 0.35 + 0.2 * Math.sin(t * 2.4);
    for (const [fig, m] of movers) {
      const d = stepToward(fig, m.to, m.speed, dt, 0.3);
      if (d < m.best - 0.02) { m.best = d; m.stuck = 0; } else m.stuck += dt;
      if (d < 0.05 || m.stuck > 1.5) {
        if (m.stuck > 1.5) fig.position.copy(m.to);
        movers.delete(fig);
        m.resolve();
        continue;
      }
      turnFigure(fig, Math.atan2(tmp.x, tmp.z), dt);
      animateFigure(fig, m.speed, dt, t, 1.3);
    }
    for (const fig of Object.values(people)) {
      if (!fig.visible || movers.has(fig) || fig.userData.pose) continue;
      if (fig.userData.faceYaw !== undefined) turnFigure(fig, fig.userData.faceYaw, dt * 0.5);
      animateFigure(fig, 0, dt, t, 1.3);
    }
    if (carry) carry.position.copy(handOf(cain));
    for (const an of [...sheep, lamb]) {
      const u = an.userData;
      if (!an.visible) continue;
      let moving = false;
      if (u.route?.length) {
        // 우리로 가거나 돌무더기로 갈 때: 길(문 밖 → 자리)을 따라간다. 8초 넘게 막히면 자리에 둔다.
        u.routeT = (u.routeT ?? 0) + dt;
        if (sheepStep(an, u.route[0], 1.4, dt) || u.routeT > 8) {
          if (u.routeT > 8) an.position.copy(u.route.at(-1));
          u.route.shift();
          if (!u.route.length) { u.route = null; u.routeT = 0; }
        }
        moving = true;
      } else if (an === lamb && (follow || u.follow)) {
        // 어린양: 어미(또는 관찰자) 곁 한 걸음 뒤를 따라간다
        const lead = follow ? follow.target : u.follow.position;
        const goal = lead.clone().add(V(0.75, 0.45)).setY(0);
        if (an.position.distanceTo(goal) > 0.4) { sheepStep(an, goal, Math.min(4.2, 0.8 + an.position.distanceTo(goal) * 1.6), dt); moving = true; }
      } else if (!u.penned && an !== lamb) {
        // 풀 뜯기: 터 둘레(2.5)를 걷다 서다 한다. 무대 안에 있으면 비켜 준다.
        if (u.dest) {
          if (sheepStep(an, u.dest, inStage(an.position) ? 1.4 : 0.6, dt)) u.dest = null;
          moving = true;
        } else if ((u.wait -= dt) <= 0) {
          const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 2.5;
          const p = u.home.clone().add(V(Math.cos(a) * r, Math.sin(a) * r));
          if (!inStage(p, 0.6) && !collide(p.clone(), u.radius)) u.dest = p;
          u.wait = 2 + Math.random() * 4;
        }
        if (playerPos && !u.dest && an.position.distanceTo(playerPos) < 2.6) u.yaw += Math.atan2(Math.sin(Math.atan2(playerPos.z - an.position.z, playerPos.x - an.position.x) - u.yaw), Math.cos(Math.atan2(playerPos.z - an.position.z, playerPos.x - an.position.x) - u.yaw)) * Math.min(1, dt * 2);
      }
      if (!moving) u.speed += (0 - u.speed) * Math.min(1, dt * 4);
      an.rotation.y = -u.yaw;
      animateAnimal(an, u.speed, dt, t, !moving);
    }
  }

  return {
    group, sky, people, sheep, lamb, acts, update, collide, stepAside: stepAsideSpots,
    spots: { start: CAIN_START, home: ADAM_SPOT.clone().lerp(EVE_SPOT, 0.5), fold: FOLD, abel: ABEL_SPOT, cain: CAIN_SPOT, altars: ALTARS, abelAltar: ABEL_ALTAR, field: OPEN_FIELD, hide: HIDE, trial: trialSpot, fieldView: OPEN_FIELD.clone().add(V(1.6, 1.6)) },
  };
}
