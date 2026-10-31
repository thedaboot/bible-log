// 에덴 동산(창 2~3장)의 세계. 모든 모양은 props.js의 공용 부품을 쓴다.
import * as THREE from 'three';
import {
  PAL, mat, makeTree, makeAnimal, makeBird, makeFigure, dressFigure, animateFigure, turnFigure,
  makeLightPillar, makeSpiritLight, makeSerpent, makeAngel,
} from './props.js';
import { tween, easeOut } from './anim.js';
import { RIVERS, ANIMALS } from './data/eden.js';

const C = (hex) => new THREE.Color(hex);
export const EDEN_RADIUS = 12.5;
const SPLIT = new THREE.Vector3(-5.5, 0, -5.5); // 강이 갈라지는 곳(동산 가운데를 비우려고 가장자리 쪽에 둔다)
// 네 강의 끝(동산 가장자리). RIVERS와 같은 순서.
const RIVER_ENDS = [[-2, -12], [-12, 1], [11.5, -5], [3, 11.5]].map(([x, z]) => new THREE.Vector3(x, 0, z));
const CENTER_LIFE = new THREE.Vector3(-0.2, 0, -1.8);
const CENTER_KNOWLEDGE = new THREE.Vector3(1.8, 0, 0.2); // 연출이 잘 보이게 카메라 쪽에 둔다
export const EDEN_START = new THREE.Vector3(7, 0, 7);
const ADAM_SPOT = new THREE.Vector3(4, 0, 3);
const HIDE_TREE = new THREE.Vector3(-4, 0, 2.5);
const EAST_GATE = new THREE.Vector3(9.5, 0, 6.5);

function distToSegment(p, a, b) {
  const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
  return p.distanceTo(a.clone().addScaledVector(ab, t));
}

export function makeEden(scene) {
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

  // 샘과 네 강(창 2:10). 강마다 한 번 꺾어 자연스럽게 흐르게 한다.
  const riverM = mat(0x4f8fd0, { emissive: 0x2f6fb5, emissiveIntensity: 0.25 });
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.08, 10), riverM);
  pool.position.copy(SPLIT).setY(0.03);
  group.add(pool);
  const segments = [];
  RIVER_ENDS.forEach((end, i) => {
    const bend = SPLIT.clone().lerp(end, 0.5).add(new THREE.Vector3(i % 2 ? 1.2 : -1.2, 0, i % 2 ? -1.2 : 1.2));
    for (const [a, b] of [[SPLIT, bend], [bend, end]]) {
      const len = a.distanceTo(b);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(len + 0.6, 0.06, 0.8), riverM);
      seg.position.copy(a).lerp(b, 0.5).setY(0.03);
      seg.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      group.add(seg);
      segments.push([a, b]);
    }
    // 강 끝 표지석
    for (const [dx, dz, h] of [[0.7, 0.4, 0.5], [-0.6, 0.6, 0.35], [0.2, -0.7, 0.4]]) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(h, 0), mat(0x9a9488));
      stone.position.set(end.x + dx, h * 0.4, end.z + dz);
      group.add(stone);
    }
  });

  // 나무: 동산 가운데의 두 나무 + 둘레의 나무들. 강과 길목은 비운다.
  const life = makeTree('life');
  life.position.copy(CENTER_LIFE);
  const knowledge = makeTree('knowledge');
  knowledge.position.copy(CENTER_KNOWLEDGE);
  const hideTree = makeTree('round');
  hideTree.position.copy(HIDE_TREE);
  hideTree.scale.setScalar(1.6);
  group.add(life, knowledge, hideTree);
  const fruitTrees = [];
  const clear = (p) => p.length() < 3.4 || p.distanceTo(EDEN_START) < 2.5 || p.distanceTo(ADAM_SPOT) < 2 || p.distanceTo(HIDE_TREE) < 1.5
    || p.distanceTo(EAST_GATE) < 2.5 || segments.some(([a, b]) => distToSegment(p, a, b) < 1.3);
  let placed = 0;
  for (let tries = 0; placed < 40 && tries < 600; tries++) {
    const a = Math.random() * Math.PI * 2, r = 3.5 + Math.random() * 8.5;
    const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (clear(p)) continue;
    const kind = placed < 10 ? 'fruit' : placed % 3 ? 'round' : 'pine';
    const tree = makeTree(kind);
    tree.position.copy(p);
    tree.scale.setScalar(1.1 + Math.random() * 0.4);
    group.add(tree);
    if (kind === 'fruit') fruitTrees.push(tree);
    placed++;
  }

  // 사람: 관찰자와 같은 뼈대(makeFigure). 처음에는 잎사귀와 머리카락으로 가린다.
  const adam = makeFigure({ hair: 'short', hairColor: PAL.hairBrown, outfit: 'leaves' });
  const eve = makeFigure({ hair: 'long', hairColor: PAL.hairDark, outfit: 'leaves' });
  adam.position.copy(ADAM_SPOT);
  eve.position.copy(ADAM_SPOT).add(new THREE.Vector3(1, 0, -0.9));
  adam.rotation.y = eve.rotation.y = Math.PI / 4;
  adam.visible = eve.visible = false;
  const dust = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.45, 7), mat(PAL.soil));
  dust.position.copy(ADAM_SPOT).setY(0.2);
  dust.visible = false;
  const pillar = makeLightPillar(0.9, 20);
  pillar.visible = false;
  group.add(adam, eve, dust, pillar);

  // 동물(창 2:19)과 새
  const animals = ANIMALS.map((info, i) => {
    const an = makeAnimal(info.color, info.size);
    const a = (i / ANIMALS.length) * Math.PI * 2 + 0.4;
    an.position.set(Math.cos(a) * 7.5, 0, Math.sin(a) * 7.5);
    an.userData = { name: info.name, heading: Math.random() * Math.PI * 2 };
    an.visible = false;
    group.add(an);
    return an;
  });
  const birds = Array.from({ length: 8 }, (_, i) => {
    const b = makeBird();
    b.scale.setScalar(1.2);
    b.userData = { a: (i / 8) * Math.PI * 2, r: 4 + Math.random() * 6, y: 5 + Math.random() * 1.5, speed: 0.3 + Math.random() * 0.2 };
    group.add(b);
    return b;
  });

  const serpent = makeSerpent();
  serpent.position.copy(CENTER_KNOWLEDGE).add(new THREE.Vector3(1.1, 0.1, 0.9));
  serpent.rotation.y = Math.PI * 0.75;
  serpent.scale.setScalar(1.6); // 작은 마디라 멀리서도 보이게 키운다
  serpent.visible = false;
  const presence = makeSpiritLight(); // 창 3:8 동산을 거니시는 하나님: 형상 없이 움직이는 빛
  presence.visible = false;
  const cherubim = [-1.3, 1.3].map((dx) => {
    const c = makeAngel({ cherub: true });
    c.position.copy(EAST_GATE).add(new THREE.Vector3(dx, 0, -dx));
    c.rotation.y = Math.PI / 4;
    c.visible = false;
    return c;
  });
  const sword = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.2), mat(0xff8a3a, { emissive: 0xff5a1a, emissiveIntensity: 1 }));
  sword.position.copy(EAST_GATE).setY(1.6);
  sword.visible = false;
  const swordLight = new THREE.PointLight(0xff7a2a, 10, 8);
  swordLight.position.copy(sword.position);
  swordLight.visible = false;
  group.add(serpent, presence, ...cherubim, sword, swordLight);

  // ---------- 인물 이동: walkTo(fig, 목표) → 도착하면 끝나는 Promise ----------
  const movers = new Map();
  function walkTo(fig, to, speed = 1.6) {
    return new Promise((resolve) => movers.set(fig, { to: to.clone(), speed, resolve }));
  }

  // ---------- 연출 ----------
  const fruitOf = (tree) => tree.userData.fruits.find((f) => f.visible);
  async function handFruit(tree, fig) {
    const f = fruitOf(tree);
    if (!f) return;
    const from = f.getWorldPosition(new THREE.Vector3());
    tree.remove(f);
    group.add(f);
    f.scale.setScalar(1.8);
    const to = fig.position.clone().setY(1.1);
    await tween(900, (p) => f.position.lerpVectors(from, to, easeOut(p)).setY(from.y + (to.y - from.y) * p + Math.sin(p * Math.PI) * 0.6));
    f.visible = false;
  }

  const materials = new Map(); // 타락 연출: 모든 색을 흐리고 차갑게 바꾸기 위해 원래 색을 기억한다
  const fallTint = C(0x7d8797);

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
    showEve: () => { eve.visible = true; },
    showAnimals: () => {
      animals.forEach((an) => (an.visible = true));
      return tween(1200, (p) => animals.forEach((an) => an.scale.setScalar(Math.max(0.0001, easeOut(p)))));
    },
    gatherAtTree: async () => {
      serpent.visible = true;
      animals.forEach((an) => (an.userData.calm = true));
      await Promise.all([
        walkTo(eve, CENTER_KNOWLEDGE.clone().add(new THREE.Vector3(1.6, 0, 1.4))),
        walkTo(adam, CENTER_KNOWLEDGE.clone().add(new THREE.Vector3(2.6, 0, 0.6))),
      ]);
      turnFigure(eve, Math.atan2(CENTER_KNOWLEDGE.x - eve.position.x, CENTER_KNOWLEDGE.z - eve.position.z), 1);
    },
    eat: async () => {
      await handFruit(knowledge, eve);
      await walkTo(adam, eve.position.clone().add(new THREE.Vector3(0.8, 0, -0.5)));
      await handFruit(knowledge, adam);
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
    hide: () => Promise.all([
      walkTo(adam, HIDE_TREE.clone().add(new THREE.Vector3(-0.6, 0, -1.1)), 2.4),
      walkTo(eve, HIDE_TREE.clone().add(new THREE.Vector3(-1.2, 0, -0.5)), 2.4),
    ]),
    presence: async () => {
      presence.visible = true;
      presence.position.set(EAST_GATE.x, 1.2, EAST_GATE.z);
      const to = HIDE_TREE.clone().add(new THREE.Vector3(2.2, 1.2, 1.2));
      const from = presence.position.clone();
      await tween(4000, (p) => presence.position.lerpVectors(from, to, p));
    },
    clothe: async () => {
      pillar.position.copy(adam.position).lerp(eve.position, 0.5).setY(0);
      pillar.visible = true;
      dressFigure(adam, { hair: 'short', hairColor: PAL.hairBrown, outfit: 'skins' });
      dressFigure(eve, { hair: 'long', hairColor: PAL.hairDark, outfit: 'skins' });
      await tween(1800, () => {});
      pillar.visible = false;
    },
    expel: async () => {
      presence.visible = false;
      const out = EAST_GATE.clone().add(new THREE.Vector3(3, 0, 3));
      await Promise.all([walkTo(adam, out, 1.4), walkTo(eve, out.clone().add(new THREE.Vector3(-0.8, 0, 0.6)), 1.4)]);
      adam.visible = eve.visible = false;
      cherubim.forEach((c) => (c.visible = true));
      sword.visible = swordLight.visible = true;
      await tween(1200, (p) => cherubim.forEach((c) => c.scale.setScalar(1.3 * Math.max(0.0001, easeOut(p)))));
    },
  };

  // 창 3장부터 바로 볼 때(이어하기 지점)는 2장이 끝난 상태로 맞춘다.
  function skipToFall() {
    adam.visible = eve.visible = true;
    adam.position.y = 0;
    animals.forEach((an) => { an.visible = true; an.scale.setScalar(1); });
    fruitTrees.forEach((t) => t.userData.fruits.forEach((f) => (f.visible = false)));
  }

  const tmp = new THREE.Vector3();
  function update(dt, t) {
    if (pillar.visible) pillar.userData.pulse(t);
    for (const [fig, m] of movers) {
      tmp.subVectors(m.to, fig.position).setY(0);
      const d = tmp.length();
      if (d < 0.05) { movers.delete(fig); animateFigure(fig, 0, dt, t); m.resolve(); continue; }
      const step = Math.min(d, m.speed * dt);
      fig.position.addScaledVector(tmp.normalize(), step);
      turnFigure(fig, Math.atan2(tmp.x, tmp.z), dt);
      animateFigure(fig, m.speed, dt, t);
    }
    for (const fig of [adam, eve]) if (fig.visible && !movers.has(fig)) animateFigure(fig, 0, dt, t);
    for (const b of birds) {
      const u = b.userData, a = u.a + t * u.speed;
      b.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 2 + u.a) * 0.3, Math.sin(a) * u.r);
      b.rotation.y = -a - Math.PI / 2;
      b.children[1].rotation.x = Math.sin(t * 10 + u.a) * 0.6;
      b.children[2].rotation.x = -Math.sin(t * 10 + u.a) * 0.6;
    }
    for (const an of animals) {
      if (!an.visible || an.userData.calm) continue;
      const u = an.userData;
      u.heading += (Math.random() - 0.5) * dt * 2;
      an.position.x += Math.cos(u.heading) * dt * 0.5;
      an.position.z += Math.sin(u.heading) * dt * 0.5;
      const r = Math.hypot(an.position.x, an.position.z);
      if (r > EDEN_RADIUS - 1.5 || r < 3.5) u.heading = Math.atan2(-an.position.z, -an.position.x) + (r < 3.5 ? Math.PI : 0);
      an.rotation.y = -u.heading;
    }
    if (serpent.visible) serpent.userData.wiggle(t);
    if (sword.visible) sword.rotation.y = t * 4; // 두루 도는 불 칼
  }

  return {
    group, sky, adam, eve, animals, fruitTrees, knowledge, acts, update, skipToFall,
    riverEnds: RIVERS.map((r, i) => ({ ...r, pos: RIVER_ENDS[i] })),
    spots: { start: EDEN_START, adam: ADAM_SPOT, knowledge: CENTER_KNOWLEDGE, hide: HIDE_TREE, gate: EAST_GATE },
  };
}
