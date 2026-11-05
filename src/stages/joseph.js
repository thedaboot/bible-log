// 1-12 요셉의 꿈(창 37, 39~41장): 채색옷과 곡식 단 꿈 → 도단의 구덩이(창 37:23~24, 멀리서) → 이스마엘 대상에게 팔림(37:25~28)
// → 대상을 따라 애굽으로(퀘스트) → 보디발에게 팔리고 옥에 갇힘(39:1~20) → 차꼬를 풀고 옥의 일을 맡음(39:21~22)
// → 죄수들에게 빵 나르기(퀘스트) → 두 관원장의 꿈(40장) → 옥의 저녁 막간(요셉) → 바로의 꿈과 술 맡은 관원장의 기억(41:1~13)
// → 신하가 가져온 옷 건네기(퀘스트) → 수염을 깎고 옷을 갈아입음(41:14) → 궁전 대전(41:15~24) → 꿈 풀기(도전, 순서 기억)
// → 인장 반지·세마포 옷·금 사슬(41:42) → 버금 수레(41:43) → 퀴즈(창 39:23).
// 2026-11-05 F60 "땅굴 파고 갇히고 이런 게 현실적으로, 감옥도 감옥 안 같고 바로가 있던 곳도 궁전 안 같던데":
//  구덩이는 땅을 실제로 뚫어(바닥 원판에 구멍을 낸 돌출 도형) 위에서 들여다보면 바닥의 요셉이 보인다.
//  옥은 지붕 없이 뒤쪽 벽을 높이, 앞쪽 벽은 낮게 두고 좁은 창으로 빛이 든다. 궁전은 돌판 바닥, 기둥 두 줄, 세 층 단 위의 왕좌, 휘장, 화로, 신하 줄을 둔 실내 대전이다.
// 폭력 연출 규칙: 구덩이에 던지는 장면은 멀리서, 숫염소의 피와 떡 굽는 관원장의 죽음은 서술로만(quests-and-staging.md).
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, dressFigure, makeSack, makeBasket, makeTree, bake } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/joseph.js';

const ALONG = V(1, -1).normalize(); // 화면 가로(오른쪽)
const UP = V(-1, -1).normalize(); // 화면 안쪽(카메라에서 멀어짐)
const START = V(6, 5);
const DOTHAN = V(7.2, -0.6); // 형들이 양을 치던 들
// 구덩이: 반지름, 깊이(사람 키보다 깊다). 카메라가 40도쯤 내려다보므로 요셉은 안쪽(UP) 벽에 붙여 세워야 머리와 어깨가 보인다
const PIT = V(6.6, -4.4), PIT_R = 1.1, PIT_D = 2;
const JRIM = PIT.clone().addScaledVector(UP, 1.65); // 구덩이 뒤쪽 가장자리
const RING = [PIT.clone().addScaledVector(ALONG, -1.9), PIT.clone().addScaledVector(ALONG, 1.9), PIT.clone().add(UP.clone().sub(ALONG).setLength(1.9)), PIT.clone().add(UP.clone().add(ALONG).setLength(1.9)), PIT.clone().addScaledVector(ALONG, 2.6).add(V(0.6, 0.6))];
const CAR0 = V(10.2, 2.4); // 길르앗 쪽(동쪽)에서 오는 대상
const CARSTOP = V(9.4, -1.6);
const MID = V(5.2, 1.4);
// 옥(창 39:20): 지붕 없는 돌벽 방. 뒤쪽 두 벽은 높고 앞쪽 두 벽은 낮다. 문은 동쪽(+x) 벽에 있다. pr(x, z)는 옥 기준 자리
const pr = (x, z) => V(x - 1.6, z + 0.6);
const MARKET = pr(1.8, 3.8); // 애굽: 대상이 요셉을 보디발에게 넘기는 곳
const POTI = pr(0.2, 2.8);
const PRISON = pr(-4, 5), PX0 = -8.2, PX1 = -3.0, PZ0 = 3.0, PZ1 = 8.2;
const DOOR_OUT = pr(-0.6, 5), DOOR_IN = pr(-2.2, 5);
const SLOTS = [3.3, 4.55, 5.8, 7.05].map((z) => pr(-5.9, z)); // 차꼬 자리. 2번이 요셉
const JSLOT = SLOTS[2];
const OFF = [pr(-4.8, 3.05), pr(-2.8, 3.05)]; // 두 관원장이 앉는 자리(창 밑)
const JTALK = pr(-3.8, 4.25); // 창으로 드는 빛 속
const TABLE = pr(-2.2, 6.95), BASIN = pr(-3.4, 7.0);
const WINDOW = pr(-3.8, 2.4);
// 궁전 대전: 안쪽 모서리(CORNER)에 세 층 단과 왕좌, 바깥 모서리에 입구. hallPt(u, w): u는 입구→왕좌 방향, w는 화면 가로
const HALL = V(-3.6, -4), H = 4;
const CORNER = HALL.clone().add(V(-H, -H));
const hallPt = (u, w) => HALL.clone().addScaledVector(UP, u).addScaledVector(ALONG, w);
const TIERS = [[2.6, 0.22], [2.0, 0.44], [1.4, 0.66]];
const THRONE = CORNER.clone().add(V(0.62, 0.62));
const JSPOT = hallPt(1.3, 0); // 단 아래 요셉이 서는 자리
const HALL_IN = hallPt(-3.4, 0);
const DREAM_W = [-2.0, -0.7, 0.7, 2.0];
const DREAMS = DREAM_W.map((w) => hallPt(-1.7, w)); // 꿈의 장면 넷
const COLS = [0.2, 1.7, 3.2].flatMap((u) => [hallPt(u, -1.7), hallPt(u, 1.7)]);
const BRAZIERS = [hallPt(2.45, -1.0), hallPt(2.45, 1.0)];
const CUP_SPOT = hallPt(1.0, -2.1), BAKER_SPOT = hallPt(1.0, 2.1);
const CHARIOT = V(2.0, -2.0);
const ARRIVE = [V(6.8, 3.0), V(3.6, 0.6), CHARIOT]; // 수레가 대전 앞으로 들어오는 길
const ROAD = [CHARIOT, V(5.0, -1.6), V(8.4, -0.4)]; // 요셉을 태우고 나가는 길
const TOWN = [V(3.9, -0.2), V(4.6, -3.0), V(7.3, 0.9)];

// 걷는 높이: 대전 바닥 돌판과 세 층 단
export function heightAt(p) {
  const dx = p.x - CORNER.x, dz = p.z - CORNER.z;
  if (dx < 0 || dz < 0 || dx > 2 * H || dz > 2 * H) return 0;
  let y = 0.06;
  for (const [l, h] of TIERS) if (dx < l && dz < l) y = h;
  return y;
}

// 옷이 바뀌는 전환(quests-and-staging.md): 경계선이 지나가며 한쪽은 예전 옷, 다른 쪽은 새 옷만 그린다(main.js wipe와 같은 방식, 재질 clippingPlanes).
// down이면 위에서 아래로(옷을 벗김), glow면 금빛 고리가 함께 지나간다(바로가 입힘).
async function redress(fig, spec, { down = false, ms = 1000, glow = false } = {}) {
  const { rig } = fig.userData;
  const old = new THREE.Group();
  old.add(...rig.children);
  old.position.copy(rig.position);
  old.rotation.copy(rig.rotation);
  old.scale.copy(rig.scale);
  fig.add(old);
  dressFigure(fig, spec);
  const showNew = new THREE.Plane(new THREE.Vector3(0, down ? 1 : -1, 0), 0);
  const showOld = new THREE.Plane(new THREE.Vector3(0, down ? -1 : 1, 0), 0);
  rig.traverse((o) => o.material && (o.material.clippingPlanes = [showNew]));
  old.traverse((o) => o.material && (o.material.clippingPlanes = [showOld]));
  let ring = null;
  if (glow) {
    ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.55, 24), new THREE.MeshBasicMaterial({ color: PAL.gold, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    fig.add(ring);
  }
  const base = fig.position.y;
  await tween(ms, (p) => {
    const k = easeOut(p), y = base + (down ? 1 - k : k) * 1.9;
    showNew.constant = down ? -y : y;
    showOld.constant = down ? y : -y;
    if (ring) ring.position.y = y - base;
  });
  fig.remove(old);
  old.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  if (ring) { fig.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
  rig.traverse((o) => o.material && (o.material.clippingPlanes = null));
}

// 앉기: 몸을 낮춰 바닥(또는 왕좌)에 앉는다. 일어설 때는 F.acts.rise
function sit(fig, yaw, ms = 500) {
  fig.rotation.y = yaw;
  fig.userData.faceYaw = yaw;
  fig.userData.pose = 'sit';
  const r = fig.userData.rig;
  return tween(ms, (p) => (r.position.y = -0.34 * easeOut(p)));
}

const JOSEPH = { hair: 'short', hairColor: 0x3e2a1e, outfit: 'coat', outfitColor: 0xd8c39a };
const PLAIN = { hair: 'short', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0xb8a684 };
const CLEAN = { hair: 'short', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xf0ead8 };
const LINEN = { hair: 'short', hairColor: 0x3e2a1e, outfit: 'linen', outfitColor: 0xf6f1e4 };
const EGYPT = (outfitColor, extra = {}) => ({ hair: 'none', hairColor: 0x231a16, outfit: 'robe', outfitColor, ...extra });

export default {
  id: 'joseph',
  data,
  records: ['person/joseph', 'person/pharaoh', 'person/cupbearer', 'place/dothan', 'place/egypt', 'creature/cow', 'creature/grain', 'item/coat-thread', 'word/gen-39-23'],
  kicker: '도단 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 3923, start: START, sky: 0xe8dcc0, ground: 0xb8aa70,
      stages: { pit: { c: toCam(PIT, 2.2), r: 2 }, hall: { c: toCam(JSPOT, 1), r: 1.5 } },
      trees: 0,
    });
    const add = (geo, m, p, y, yaw = 0) => { const o = new THREE.Mesh(geo, m); o.position.copy(p).setY(y); o.rotation.y = yaw; F.group.add(o); return o; };
    // 곧은 벽(축에 나란한 두 점 사이): 상자 하나와 0.3 간격의 작은 원 충돌
    const wall = (a, b, h, m, t = 0.3) => {
      const o = add(new THREE.BoxGeometry(Math.abs(b.x - a.x) + t, h, Math.abs(b.z - a.z) + t), m, a.clone().lerp(b, 0.5), h / 2);
      const n = Math.ceil(a.distanceTo(b) / 0.3);
      for (let k = 0; k <= n; k++) F.block(a.clone().lerp(b, k / n), 0.2);
      return o;
    };

    // ---------- 구덩이(창 37:24): 땅 원판에 구멍을 뚫는다 ----------
    // field.js의 땅은 평평한 원기둥이라, 같은 자리에 구멍 난 돌출 도형으로 바꾼다. 옆면(흙 단면)은 구덩이 안벽이 된다.
    const floor = F.group.children.find((o) => o.isMesh && o.geometry.type === 'CylinderGeometry' && o.position.y === -1);
    const shape = new THREE.Shape();
    shape.absarc(0, 0, F.radius + 0.5, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(PIT.x, -PIT.z, PIT_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    floor.geometry.dispose();
    floor.geometry = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false, curveSegments: 40 });
    floor.material = [floor.material, mat(0x6e5a40)];
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    const pitFloor = add(new THREE.CircleGeometry(PIT_R, 24), mat(0x3a2e22), PIT, -PIT_D + 0.02);
    pitFloor.rotation.x = -Math.PI / 2;
    // 파낸 흙더미와 돌: 가장자리를 둘러 땅을 판 자리로 보이게
    const dirt = new THREE.Group(), soil = [mat(0x8a7350), mat(0x9a9488)];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.3, r = PIT_R + 0.28 + (i % 3) * 0.06;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + (i % 2) * 0.08, 0), soil[i % 4 ? 0 : 1]);
      m.scale.set(1, 0.4, 1);
      m.position.set(PIT.x + Math.cos(a) * r, 0.04, PIT.z + Math.sin(a) * r);
      m.rotation.y = i;
      dirt.add(m);
    }
    F.group.add(bake(dirt));
    F.block(PIT, PIT_R + 0.15);

    // ---------- 옥(창 39:20, 시 105:18 차꼬와 쇠사슬) ----------
    const stone = mat(0x5e564c), stoneTop = mat(0x7a7266);
    const c = [V(PX0, PZ0), V(PX1, PZ0), V(PX1, PZ1), V(PX0, PZ1)];
    wall(c[0], c[3], 2.6, stone); // 뒤(왼쪽 위)
    wall(c[0], c[1], 2.6, stone); // 뒤(오른쪽 위), 좁은 창
    wall(c[3], c[2], 0.7, stone); // 앞(왼쪽 아래): 낮게 잘라 안이 보이게
    wall(c[1], V(PX1, PZ0 + 2.0), 0.7, stone); // 앞(오른쪽 아래), 문 양옆
    wall(V(PX1, PZ0 + 3.2), c[2], 0.7, stone);
    for (const [a, b, h] of [[c[0], c[3], 2.6], [c[0], c[1], 2.6], [c[3], c[2], 0.7], [c[1], V(PX1, PZ0 + 2.0), 0.7], [V(PX1, PZ0 + 3.2), c[2], 0.7]]) {
      add(new THREE.BoxGeometry(Math.abs(b.x - a.x) + 0.4, 0.1, Math.abs(b.z - a.z) + 0.4), stoneTop, a.clone().lerp(b, 0.5), h + 0.05);
    }
    // 문: 기둥 둘과 인방, 밖으로 열어 둔 무거운 나무 문짝
    const wood = mat(0x6a4a2c);
    for (const z of [PZ0 + 1.95, PZ0 + 3.25]) { add(new THREE.BoxGeometry(0.34, 2.2, 0.34), stoneTop, V(PX1, z), 1.1); F.block(V(PX1, z), 0.24); }
    add(new THREE.BoxGeometry(0.4, 0.3, 1.66), stoneTop, V(PX1, PZ0 + 2.6), 2.3);
    add(new THREE.BoxGeometry(0.1, 1.9, 1.1), wood, V(PX1 + 0.18, PZ0 + 3.8), 0.95);
    for (const z of [3.5, 3.9, 4.3]) F.block(V(PX1 + 0.2, PZ0 + z), 0.12);
    // 바닥: 어두운 돌판, 죄수 자리에 짚
    const flags = new THREE.Group(), flagM = [0x3c3833, 0x45403a, 0x37332e].map((h) => mat(h)), straw = mat(0x9a8a50);
    for (let i = 0; i < 5; i++) for (let k = 0; k < 5; k++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 1.0), flagM[(i * 2 + k) % 3]);
      m.position.set(PX0 + 0.6 + i * 1.02, 0.02, PZ0 + 0.6 + k * 1.02);
      flags.add(m);
    }
    for (const s of SLOTS) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 1.0), straw); m.position.copy(s).setY(0.05); flags.add(m); }
    F.group.add(bake(flags));
    // 좁은 창과 쇠창살, 창으로 드는 한 줄기 빛(바닥에 빛 자국)
    add(new THREE.BoxGeometry(0.56, 0.36, 0.34), mat(0x14110e), WINDOW.clone().add(V(0, 0.02)), 1.95);
    for (const dx of [-0.14, 0, 0.14]) add(new THREE.BoxGeometry(0.04, 0.36, 0.04), mat(0x2a2a2e), WINDOW.clone().add(V(dx, 0.2)), 1.95);
    const lightM = new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.08, depthWrite: false });
    const spot = new THREE.Vector3(WINDOW.x, 0.02, PZ0 + 2.0), from = new THREE.Vector3(WINDOW.x, 1.95, PZ0 + 0.2);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, from.distanceTo(spot)), lightM);
    beam.position.copy(from).lerp(spot, 0.5);
    beam.lookAt(spot);
    F.group.add(beam);
    const patch = add(new THREE.PlaneGeometry(0.7, 0.55), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.35, depthWrite: false }), spot, 0.06);
    patch.rotation.x = -Math.PI / 2;
    // 차꼬(발을 끼우는 나무 틀)와 벽 고리에 맨 쇠사슬: 자리마다 하나
    const iron = mat(0x34343a);
    const stocks = SLOTS.map((s) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 1.0), wood));
      for (const z of [-0.2, 0.2]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.1, 0.12), mat(0x2a1d14)); h.position.set(0, 0.1, z); g.add(h); }
      g.position.copy(s).add(V(0.55, 0)).setY(0.13);
      F.group.add(g);
      return g;
    });
    const chains = SLOTS.map((s) => {
      const g = new THREE.Group();
      const a = new THREE.Vector3(PX0 + 0.2, 1.25, s.z), b = new THREE.Vector3(s.x - 0.05, 0.45, s.z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 4, 8), iron);
      ring.position.copy(a);
      ring.rotation.y = Math.PI / 2;
      g.add(ring);
      for (let k = 1; k <= 5; k++) {
        const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 4, 6), iron);
        l.position.lerpVectors(a, b, k / 5).y -= Math.sin((k / 5) * Math.PI) * 0.12;
        l.rotation.set(k % 2 ? Math.PI / 2 : 0, Math.PI / 2, 0);
        g.add(l);
      }
      F.group.add(g);
      return g;
    });
    // 간수장의 탁자(빵 바구니, 물동이)와 씻는 대야
    add(new THREE.BoxGeometry(1.0, 0.07, 0.6), wood, TABLE, 0.62);
    for (const [dx, dz] of [[-0.42, -0.24], [0.42, -0.24], [-0.42, 0.24], [0.42, 0.24]]) add(new THREE.BoxGeometry(0.07, 0.6, 0.07), wood, TABLE.clone().add(V(dx, dz)), 0.3);
    F.block(TABLE, 0.5);
    const basket = makeBasket();
    basket.position.copy(TABLE).add(V(-0.2, 0)).setY(0.77);
    F.group.add(basket);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4).scale(1.3, 0.7, 1), mat(0xb88a4a)); basket.add(b); b.position.copy(basket.userData.slots[i]).add(new THREE.Vector3(0, 0.1, 0)); }
    add(new THREE.CylinderGeometry(0.14, 0.18, 0.4, 8), mat(0xa0663a), TABLE.clone().add(V(0.3, 0)), 0.85);
    add(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), wood, BASIN, 0.25);
    add(new THREE.CylinderGeometry(0.34, 0.24, 0.18, 10), mat(0x8a7a62), BASIN, 0.58);
    add(new THREE.CircleGeometry(0.3, 10), mat(PAL.water), BASIN, 0.66).rotation.x = -Math.PI / 2;
    F.block(BASIN, 0.35);
    // 죄수들에게 줄 빵(처음에는 보이지 않는다)
    const loaves = SLOTS.map((s) => { const b = add(new THREE.SphereGeometry(0.12, 6, 4).scale(1.4, 0.6, 1), mat(0xb88a4a), s.clone().add(V(0.55, 0.32)), 0.3); b.visible = false; return b; });

    // ---------- 궁전 대전(창 41:14~43) ----------
    const sand = mat(0xd9c79c), sandDark = mat(0xc4b088);
    const tiles = new THREE.Group(), tileM = [mat(0xb8a888), mat(0xd8cdb2)];
    for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.98), tileM[(i + k) % 2]);
      m.position.set(CORNER.x + 0.5 + i, 0.03, CORNER.z + 0.5 + k);
      tiles.add(m);
    }
    F.group.add(bake(tiles));
    const far = CORNER.clone().add(V(2 * H, 2 * H));
    wall(CORNER, V(CORNER.x, far.z), 3.4, sand, 0.35); // 뒤(왼쪽 위)
    wall(CORNER, V(far.x, CORNER.z), 3.4, sand, 0.35); // 뒤(오른쪽 위)
    wall(V(far.x, CORNER.z), V(far.x, far.z - 1.6), 0.5, sandDark); // 앞: 낮은 담, 입구 쪽 모서리를 튼다
    wall(V(CORNER.x, far.z), V(far.x - 1.6, far.z), 0.5, sandDark);
    // 벽 윗단의 칠한 띠, 휘장(붉은빛·푸른빛 번갈아, 금 막대와 술)
    for (const [a, b, n] of [[CORNER, V(CORNER.x, far.z), V(1, 0)], [CORNER, V(far.x, CORNER.z), V(0, 1)]]) {
      const len = a.distanceTo(b), along = b.clone().sub(a).normalize();
      const wide = (w, h, t) => new THREE.BoxGeometry(Math.abs(along.x) * w + Math.abs(n.x) * t, h, Math.abs(along.z) * w + Math.abs(n.z) * t);
      add(wide(len, 0.3, 0.06), mat(0x3a6a8a), a.clone().lerp(b, 0.5).addScaledVector(n, 0.2), 3.05);
      add(wide(len, 0.08, 0.06), mat(PAL.gold), a.clone().lerp(b, 0.5).addScaledVector(n, 0.21), 2.82);
      [2.3, 4.4, 6.5].forEach((d, i) => {
        const p = a.clone().addScaledVector(along, d).addScaledVector(n, 0.2);
        add(wide(1.0, 2.3, 0.05), mat(i % 2 ? 0x2a4a80 : 0x8a2a24), p, 1.55);
        add(wide(1.2, 0.08, 0.08), mat(PAL.gold), p.clone().addScaledVector(n, 0.03), 2.72);
        add(wide(1.0, 0.1, 0.06), mat(PAL.gold), p.clone().addScaledVector(n, 0.02), 0.42);
      });
    }
    // 입구 기둥 둘(낮게: 카메라 쪽이라 안을 가리지 않게)
    for (const p of [V(far.x, far.z - 1.6), V(far.x - 1.6, far.z)]) { add(new THREE.BoxGeometry(0.45, 1.2, 0.45), sand, p, 0.6); add(new THREE.BoxGeometry(0.55, 0.12, 0.55), mat(PAL.gold), p, 1.26); }
    // 기둥 두 줄: 받침, 몸통, 연꽃 머리(애굽 대전 기둥 모양, 각색)
    const shaft = mat(0xe8dcc0), lotus = mat(0x4f8a78), band = mat(0x8a2a24);
    for (const p of COLS) {
      add(new THREE.BoxGeometry(0.66, 0.14, 0.66), sandDark, p, 0.13);
      add(new THREE.CylinderGeometry(0.26, 0.3, 2.7, 8), shaft, p, 1.5);
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8), band, p, 2.5);
      add(new THREE.CylinderGeometry(0.46, 0.28, 0.45, 8), lotus, p, 3.06);
      add(new THREE.BoxGeometry(0.72, 0.12, 0.72), shaft, p, 3.34);
      F.block(p, 0.36);
    }
    // 세 층 단과 왕좌
    TIERS.forEach(([l, h], i) => add(new THREE.BoxGeometry(l, h, l), mat([0xc9a24a, 0xd6b25a, 0xe0c070][i]), CORNER.clone().add(V(l / 2, l / 2)), h / 2));
    const gold = mat(0xd4a83a), top = TIERS[2][1];
    add(new THREE.BoxGeometry(0.8, 0.36, 0.6), gold, THRONE, top + 0.18, Math.PI / 4);
    add(new THREE.BoxGeometry(0.9, 1.5, 0.14), gold, THRONE.clone().addScaledVector(UP, 0.36), top + 0.75, Math.PI / 4);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.3, 0.6), gold, THRONE.clone().addScaledVector(ALONG, s * 0.42), top + 0.48, Math.PI / 4);
    add(new THREE.BoxGeometry(1.3, 2.6, 0.06), mat(0x8a2a24), THRONE.clone().addScaledVector(UP, 0.55), top + 1.3, Math.PI / 4);
    // 화로 둘: 세발 받침, 청동 그릇, 흔들리는 불(빛을 낸다)
    const flames = BRAZIERS.map((p) => {
      add(new THREE.CylinderGeometry(0.05, 0.12, 0.9, 5), mat(0x5a4a3a), p, 0.45);
      add(new THREE.CylinderGeometry(0.3, 0.16, 0.22, 8), mat(0x8a6a3a), p, 1.0);
      const f = add(new THREE.ConeGeometry(0.17, 0.46, 6), new THREE.MeshBasicMaterial({ color: 0xffa040 }), p, 1.33);
      const glow = new THREE.PointLight(0xffb060, 1.6, 5, 2);
      glow.position.copy(p).setY(1.5);
      F.group.add(glow);
      F.block(p, 0.28);
      return f;
    });

    // ---------- 버금 수레(창 41:43)와 말 ----------
    const chariot = new THREE.Group();
    const cgold = mat(0xc9a24a);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.9), cgold);
    body.position.y = 0.6;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.9), mat(0x8a2a24));
    rail.position.set(0.4, 0.95, 0);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), mat(0x6a4a2c));
    pole.position.set(1.1, 0.55, 0);
    chariot.add(body, rail, pole);
    for (const z of [-0.52, 0.52]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.08, 10), mat(0x6a4a2c));
      w.rotation.x = Math.PI / 2;
      w.position.set(-0.1, 0.44, z);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 6), cgold);
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(w.position);
      chariot.add(w, hub);
    }
    chariot.position.copy(CHARIOT);
    chariot.visible = false; // 요셉이 총리가 될 때 길에서 들어온다
    F.group.add(chariot);
    F.block(CHARIOT, 0.65);
    const horses = [-0.36, 0.36].map((z) => { const h = F.animal('horse', 0xe8e2d4, 0.8, CHARIOT.clone().add(V(1.7, z)), { still: true }); h.userData.yaw = 0; h.visible = false; return h; });

    // ---------- 나무(대추야자): 들판 가장자리에만, 카메라 쪽과 구조물 곁은 비운다 ----------
    for (const [p, s] of [[V(-9.6, 1.2), 1.1], [V(-8.9, -1.4), 1], [V(1.6, -9.2), 1.1], [V(4.6, -9.0), 1], [V(10.8, -4.4), 1.1], [V(-1.2, 9.6), 1]]) {
      const tree = makeTree('palm', 'date');
      tree.position.copy(p);
      tree.scale.setScalar(s);
      F.group.add(tree);
      F.block(p, 0.35 * s);
    }

    // ---------- 꿈의 장면: 살진 암소, 충실한 이삭, 파리한 암소, 마른 이삭(처음에는 보이지 않는다) ----------
    const visions = DREAMS.map((p, i) => {
      const g = new THREE.Group();
      if (i === 0 || i === 2) {
        for (let n = 0; n < 3; n++) {
          const at = p.clone().addScaledVector(ALONG, (n - 1) * 0.42).addScaledVector(UP, n === 1 ? 0.6 : 0);
          const cow = F.animal('cow', i === 0 ? 0xc89a6a : 0x7a6a5a, i === 0 ? 0.8 : 0.62, at, { still: true });
          cow.userData.yaw = Math.PI / 8; // 카메라 쪽으로 비스듬히: 옆 장면과 겹치지 않게
          if (i === 2) cow.scale.set(1, 1, 0.6); // 파리한 소
          cow.visible = false;
          g.userData.cows = [...(g.userData.cows ?? []), cow];
        }
      } else {
        const ear = mat(i === 1 ? 0xe0c050 : 0x9a8a5a);
        for (let n = 0; n < 7; n++) {
          const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), mat(0x8a9a4a));
          stalk.position.set((n - 3) * 0.14, 0.45, 0);
          const head = new THREE.Mesh(new THREE.IcosahedronGeometry(i === 1 ? 0.12 : 0.06, 0).scale(1, 2, 1), ear);
          head.position.set((n - 3) * 0.14, 0.95, 0);
          g.add(stalk, head);
        }
        g.position.copy(p);
        g.rotation.y = Math.PI / 4;
      }
      g.visible = false;
      F.group.add(g);
      return g;
    });

    // ---------- 인물 ----------
    // 장면에만 서는 사람(이름표를 쓰지 않는다: 만남 기록이나 대사가 없다)
    const npc = (id, spec, p, yaw) => F.person(id, spec, p, yaw);
    const joseph = F.person('joseph', JOSEPH, DOTHAN.clone().add(V(3, 3)));
    const brothers = ['reuben', 'judah', 'brother2', 'brother3', 'brother4'].map((id, i) => npc(id, { hair: ['short', 'curly', 'short', 'tied', 'short'][i], hairColor: [0x231a16, 0x3e2a1e, 0x6b4428, 0x231a16, 0x3e2a1e][i], beard: 'short', outfit: 'shepherd', outfitColor: [0x9a6b45, 0x7f8a4a, 0xd8c3a0, 0x5a4a3a, 0x8a6a4a][i] }, DOTHAN.clone().addScaledVector(ALONG, (i - 2) * 1.1 + 0.55)));
    const sheep = [0, 1, 2].map((i) => F.animal('sheep', 0xf5f5f0, 0.75, V(3.6, -6.2).addScaledVector(ALONG, i), { roam: 1 }));
    // 이스마엘 대상(창 37:25): 향품 자루를 실은 낙타 셋과 상인 둘. 구덩이 장면에서 나타난다
    const camels = [0, 1, 2].map((i) => {
      const an = F.animal('camel', [0xc8a070, 0xb8905e, 0xd0aa78][i], 0.85, CAR0.clone().add(V(0.2 * i, 1.0 * i)), { still: true });
      an.userData.yaw = Math.PI * 0.9;
      for (const z of [-0.3, 0.3]) { const s = makeSack([0x9a7a4a, 0x7a8a5a, 0xa86a3a][(i + (z > 0)) % 3]); s.scale.setScalar(0.75); s.position.set(-0.05, 0.85, z); an.children[0].add(s); }
      an.visible = false;
      return an;
    });
    const merchants = [0, 1].map((i) => { const m = npc(`merchant${i}`, { hair: 'short', hairColor: 0x231a16, beard: 'long', outfit: 'traveler', outfitColor: [0x6a5a8a, 0x8a5a3a][i] }, CAR0.clone().add(V(-0.7, 0.9 + 1.4 * i))); m.visible = false; return m; });
    const pouch = makeSack(0xb8b8c0);
    pouch.scale.setScalar(0.35);
    F.group.add(pouch);
    F.acts.carry(pouch, merchants[0]);
    pouch.visible = false;
    const coat = new THREE.Group();
    [0xb8452f, 0xe0b040, 0x3f5a8a, 0x6b8a3a].forEach((hex, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.1), mat(hex)); b.position.set(0, 0.03 * (i % 2), (i - 1.5) * 0.1); coat.add(b); });
    coat.visible = false;
    F.group.add(coat);
    // 애굽: 친위대장 보디발, 간수장, 차꼬를 찬 죄수 셋
    const potiphar = npc('potiphar', EGYPT(0xe8e0c8, { outfit: 'girded', item: 'staff' }), POTI);
    const keeper = npc('keeper', { hair: 'short', hairColor: 0x231a16, beard: 'short', outfit: 'girded', outfitColor: 0x5a4a3a }, pr(-2.7, 6.1));
    const prisoners = [0, 1, 3].map((s, i) => {
      const p = npc(`prisoner${i}`, { hair: ['curly', 'short', 'short'][i], hairColor: [0x231a16, 0x3e2a1e, 0x6b4428][i], beard: ['short', 'long', 'short'][i], outfit: 'tunic', outfitColor: [0x7a6a52, 0x6a5a48, 0x8a7a5a][i] }, SLOTS[s], Math.PI / 2);
      p.userData.pose = 'sit';
      p.userData.rig.position.y = -0.34;
      p.userData.slot = s;
      return p;
    });
    // 바로와 신하들(대전 양옆에 줄지어 선다). 바로는 왕좌에 앉아 있다
    const pharaoh = F.person('pharaoh', EGYPT(0xf4efe0, { outfit: 'linen' }), THRONE);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 6), mat(PAL.gold));
    crown.position.set(0, 1.62, 0);
    pharaoh.userData.rig.add(crown);
    pharaoh.position.y = top + 0.1;
    pharaoh.userData.fixY = true;
    pharaoh.userData.pose = 'sit';
    pharaoh.userData.rig.position.y = -0.34;
    const courtiers = [[-0.2, -2.6], [-0.2, 2.6], [2.0, -2.6], [2.0, 2.6]].map(([u, w], i) => {
      const f = npc(`courtier${i}`, EGYPT([0xece6d6, 0xe0d8c0][i % 2]), hallPt(u, w));
      F.acts.face(f, hallPt(u, 0)); // 가운데 길을 바라본다
      return f;
    });
    const herald = courtiers[0];
    const cupbearer = F.person('cupbearer', EGYPT(0x3f5a8a, { hair: 'short' }), CUP_SPOT);
    const baker = npc('baker', EGYPT(0xd8c8a0, { hair: 'short' }), BAKER_SPOT);
    F.acts.face(cupbearer, THRONE);
    F.acts.face(baker, THRONE);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.14, 8), mat(PAL.gold));
    F.group.add(cup);
    F.acts.carry(cup, cupbearer);
    cupbearer.userData.armPose = null; // 잔은 한 손에 든다(두 팔을 모으지 않게)
    const townsfolk = TOWN.map((p, i) => { const f = npc(`townsman${i}`, { hair: 'short', hairColor: 0x231a16, outfit: 'tunic', outfitColor: [0xc8b088, 0x9a7a5a, 0xd8c8a8][i] }, p); f.visible = false; F.acts.face(f, ROAD[1]); return f; });
    // 깨끗한 옷(창 41:14)과 인장 반지(41:42), 금 사슬
    const garment = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.32), mat(0xf6f1e4));
    garment.visible = false;
    F.group.add(garment);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 4, 8), mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.4 }));
    ring.visible = false;
    F.group.add(ring);

    Object.assign(F, { joseph, brothers, sheep, camels, merchants, pouch, coat, potiphar, keeper, prisoners, pharaoh, courtiers, herald, cupbearer, baker, cup, townsfolk, garment, ring, visions, stocks, chains, loaves, basket, chariot, horses, flames });
    F.spots = {
      start: START, dothan: DOTHAN.clone().add(V(1.3, 1.3)), jrim: JRIM, carstop: CARSTOP.clone().add(V(-1, 1)), market: MARKET, doorOut: DOOR_OUT, doorIn: DOOR_IN, jslot: JSLOT,
      jtalk: JTALK, hallIn: HALL_IN, jspot: JSPOT, ...Object.fromEntries(DREAM_W.map((w, i) => [`dream${i}`, hallPt(-2.7, w)])), chariot: CHARIOT.clone().add(V(-0.9, 0.6)), pit: PIT, throne: THRONE,
    };
    F.solid = ['pit', 'throne'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { joseph, brothers, camels, merchants, pouch, coat, potiphar, keeper, prisoners, pharaoh, courtiers, herald, cupbearer, baker, cup, townsfolk, garment, ring, visions, stocks, chains, loaves, basket, chariot, horses, flames } = F;
    const [reuben, judah] = brothers;
    const walkPath = async (fig, pts, speed) => { for (const p of pts) await F.acts.walkTo(fig, p, speed); };
    // 물건을 손에서 손으로 건넨다(quests-and-staging.md)
    const pass = async (obj, to, ms = 700) => {
      F.acts.carry(obj, null);
      obj.visible = true;
      const a = obj.position.clone();
      await tween(ms, (p) => obj.position.lerpVectors(a, F.handOf(to), easeOut(p)));
      F.acts.carry(obj, to);
    };
    let riding = null;
    // 버금 수레 몰기: path를 ms 동안 따라가며 방향은 천천히 돈다. 말은 수레 앞에서 끈다. rider는 수레 위에 서고, 지나는 길가의 사람들은 엎드린다
    let cartYaw = 0; // 수레가 향한 쪽(x축에서 z축으로 잰 각)
    const cartAt = (path, k) => {
      const legs = path.slice(1).map((q, i) => q.distanceTo(path[i]));
      let d = k * legs.reduce((a, b) => a + b, 0), i = 0;
      while (i < legs.length - 1 && d > legs[i]) d -= legs[i++];
      return { p: path[i].clone().lerp(path[i + 1], Math.min(1, d / legs[i])), dir: path[i + 1].clone().sub(path[i]).normalize() };
    };
    const placeCart = (p, moving, rider) => {
      const dir = V(Math.cos(cartYaw), Math.sin(cartYaw));
      chariot.position.copy(p);
      chariot.rotation.y = -cartYaw;
      horses.forEach((h, i) => { h.position.copy(p).addScaledVector(dir, 1.7).add(V(-dir.z, dir.x).multiplyScalar(i ? 0.36 : -0.36)); h.userData.yaw = cartYaw; h.userData.speed = moving ? 1.6 : 0; });
      if (rider) { rider.position.copy(p).setY(0.42); rider.rotation.y = rider.userData.faceYaw = Math.PI / 2 - cartYaw; }
    };
    const bowed = new Set();
    const drive = async (path, ms, rider = null) => {
      let k = 0;
      const first = cartAt(path, 0);
      if (!rider) cartYaw = Math.atan2(first.dir.z, first.dir.x);
      riding = (dt) => {
        const { p, dir } = cartAt(path, k), want = Math.atan2(dir.z, dir.x);
        cartYaw += Math.max(-dt * 2.5, Math.min(dt * 2.5, Math.atan2(Math.sin(want - cartYaw), Math.cos(want - cartYaw))));
        placeCart(p, true, rider);
        if (rider) townsfolk.forEach((f) => { if (!bowed.has(f) && f.position.distanceTo(p) < 2.6) { bowed.add(f); F.acts.prostrate(f, p, 0.7); } });
      };
      await tween(ms, (p) => (k = p));
      riding = null;
      const end = cartAt(path, 1);
      cartYaw = Math.atan2(end.dir.z, end.dir.x);
      placeCart(end.p, false, rider);
    };
    F.onUpdate((dt, t) => {
      for (const o of [g.player, joseph, pharaoh, cupbearer, baker, ...courtiers]) if (o.visible && !o.userData.fixY) o.position.y = heightAt(o.position);
      flames.forEach((f, i) => f.scale.set(1, 0.85 + 0.2 * Math.sin(t * 9 + i * 2), 1));
      riding?.(dt);
    });

    // 창 37:3~22 도단
    g.meet('joseph');
    g.cam(DOTHAN, 14);
    F.acts.face(joseph, DOTHAN);
    await g.talk(data.lines.arrive.slice(0, 2));
    brothers.forEach((b) => F.acts.face(b, joseph.position));
    await g.talk(data.lines.arrive.slice(2, 4));
    g.note('place/dothan');
    // 르우벤의 말(37:21~22)이 오가는 동안 요셉이 다가오고, 형들이 구덩이 둘레로 간다
    F.acts.face(reuben, PIT);
    g.cam(PIT.clone().lerp(DOTHAN, 0.4), 14);
    const toPit = Promise.all([F.acts.walkTo(joseph, JRIM, 1.8), ...brothers.map((b, i) => F.acts.walkTo(b, RING[i], 1.4))]);
    await g.talk(data.lines.arrive.slice(4));
    await toPit;

    // 창 37:23~24: 채색옷을 벗기고 구덩이에 던진다. 멀리서 비추고, 던지는 몸짓 없이 요셉이 구덩이 안으로 떨어져 보이지 않게 된다.
    g.stage('pit');
    g.cam(PIT, 15);
    brothers.forEach((b) => F.acts.face(b, joseph.position));
    F.acts.face(joseph, judah.position);
    await Promise.all([2, 3].map((i) => F.acts.walkTo(brothers[i], JRIM.clone().lerp(RING[i], 0.55), 1.2)));
    const strip = redress(joseph, PLAIN, { down: true, ms: 1100 }).then(() => { coat.visible = true; F.acts.carry(coat, brothers[2]); });
    await g.talk(data.lines.pit.slice(0, 1));
    await strip;
    joseph.userData.fixY = true;
    const rim = joseph.position.clone(), bottom = PIT.clone().addScaledVector(UP, 0.5);
    await tween(1300, (p) => { joseph.position.lerpVectors(rim, bottom, easeOut(Math.min(1, p * 1.8))).setY(-PIT_D * p * p); });
    F.acts.face(joseph, PIT.clone().add(V(2, 2))); // 구덩이 바닥에서 위(카메라 쪽)를 올려다본다
    await Promise.all([2, 3].map((i) => F.acts.walkTo(brothers[i], RING[i], 1.2)));
    // 구덩이 안: 가까이 들여다본다. 이때 화면 밖에서 대상이 나타난다
    camels.forEach((c) => (c.visible = true));
    merchants.forEach((m) => (m.visible = true));
    g.cam(PIT.clone().setY(-0.6), 8);
    await g.talk(data.lines.pit.slice(1, 3));

    // 창 37:25 형들이 앉아 먹다가 대상을 본다
    g.cam(PIT.clone().lerp(CARSTOP, 0.5), 14);
    const seated = [0, 3, 4].map((i) => sit(brothers[i], Math.atan2(CARSTOP.x - brothers[i].position.x, CARSTOP.z - brothers[i].position.z)));
    camels.forEach((c, i) => (c.userData.route = [CARSTOP.clone().add(V(1.15 * i, 0.35 * i))]));
    // 유다는 앉지 않고 대상 쪽으로 걸어간다(창 37:26에서 먼저 말을 꺼낸다)
    const caravan = Promise.all([F.acts.walkTo(merchants[0], CARSTOP.clone().add(V(-1.0, 0.9)), 1.3), F.acts.walkTo(merchants[1], CARSTOP.clone().add(V(0.5, 1.4)), 1.3), F.acts.walkTo(judah, CARSTOP.clone().add(V(-1.9, 0.4)), 1.2)]);
    await g.talk(data.lines.pit.slice(3, 5));
    await Promise.all([...seated, caravan]);
    // 창 37:26~28 유다가 팔자고 하고, 형들이 요셉을 끌어올려 은 이십에 판다
    await Promise.all([0, 3, 4].map((i) => F.acts.rise(brothers[i])));
    F.acts.face(judah, merchants[0].position);
    F.acts.face(merchants[0], judah.position);
    await g.talk(data.lines.pit.slice(5, 6));
    const lip = PIT.clone().addScaledVector(ALONG, 1.65);
    await Promise.all([F.acts.bow(brothers[3], 0.6), F.acts.bow(brothers[4], 0.6)]);
    await tween(1300, (p) => { joseph.position.lerpVectors(bottom, lip, easeOut(p)).setY(-PIT_D * (1 - easeOut(p))); });
    joseph.userData.fixY = false;
    await Promise.all([F.acts.bow(brothers[3], 0), F.acts.bow(brothers[4], 0)]);
    // 값(은 이십)을 받은 형이 누구인지는 본문에 없다. 팔자고 한 유다가 받는다(각색)
    const pay = Promise.all([pass(pouch, judah), F.acts.walkTo(joseph, merchants[0].position.clone().add(V(0.3, 0.8)), 1.8)]);
    await g.talk(data.lines.pit.slice(6, 7));
    await pay;
    // 창 37:31~32 형들은 채색옷을 들고 집으로(남쪽 헤브론 쪽) 돌아간다. 피는 그리지 않는다
    const home = brothers.map((b, i) => F.acts.walkTo(b, V(9.0, -7.4).add(V(0.5, 0.5).multiplyScalar(i - 2)), 1.3));
    await g.talk(data.lines.pit.slice(7));
    g.stage(null);

    // 퀘스트 1: 대상을 따라 애굽으로. 대상과 요셉이 먼저 길을 간다
    camels.forEach((c, i) => (c.userData.route = [MID.clone().add(V(1.2 * i, -0.6 * i)), MARKET.clone().add(V(1.6 + 1.1 * i, -1.2 - 0.6 * i))]));
    const going = Promise.all([
      walkPath(merchants[0], [MID, MARKET.clone().add(V(0.6, -0.4))], 2),
      walkPath(merchants[1], [MID.clone().add(V(1, 0.6)), MARKET.clone().add(V(1.2, 0.6))], 2),
      walkPath(joseph, [MID.clone().add(V(0.4, 0.7)), MARKET.clone().add(V(0.1, 0.6))], 2),
    ]);
    g.cam(null, 13);
    await g.quest({ title: '애굽으로', targets: [{ pos: MARKET.clone().add(V(1.4, 1.4)) }], text: () => '요셉을 따라 애굽까지 가기', radius: 1.8 });
    await Promise.all([going, ...home]);
    brothers.forEach((b) => (b.visible = false));
    coat.visible = pouch.visible = false;
    g.reward('egypt', 'step');
    g.note('place/egypt');
    g.note('item/coat-thread');

    // 창 39:1 보디발이 요셉을 산다. 값을 손에서 손으로 치른다
    g.cam(MARKET, 11);
    await F.acts.walkTo(potiphar, MARKET.clone().add(V(-0.9, -0.2)), 1.3);
    F.acts.face(potiphar, merchants[0].position);
    F.acts.face(merchants[0], potiphar.position);
    F.acts.carry(pouch, potiphar);
    pouch.visible = true;
    const sold = pass(pouch, merchants[0]);
    await g.talk(data.lines.egypt.slice(0, 1));
    await sold;
    // 대상은 동쪽으로 돌아간다(화면 밖에서 막간 동안 치운다)
    camels.forEach((c, i) => (c.userData.route = [V(8.4 + i, 6.2 - i * 0.8)]));
    merchants.forEach((m, i) => F.acts.walkTo(m, V(7.4 + i, 5.6 - i), 1.4));
    await F.acts.walkTo(joseph, potiphar.position.clone().add(V(0.5, 0.7)), 1.3);
    await g.talk(data.lines.egypt.slice(1, 2));
    // 창 39:20 보디발이 요셉을 옥으로 데려간다
    const toDoor = Promise.all([F.acts.walkTo(potiphar, DOOR_OUT.clone().add(V(0.2, -0.7)), 1.3), F.acts.walkTo(joseph, DOOR_OUT, 1.3)]);
    g.cam(DOOR_OUT, 11);
    await g.talk(data.lines.egypt.slice(2));
    await toDoor;

    // 옥: 어둡고 좁은 빛. 간수장이 문에서 받고, 요셉은 빈 차꼬 자리에 앉는다
    await F.acts.walkTo(keeper, DOOR_IN, 1.3);
    F.acts.face(keeper, joseph.position);
    const inside = F.acts.walkTo(joseph, JSLOT.clone().add(V(0.15, 0)), 1.2);
    const dark = F.acts.sky(0x2e2822, 0.62, 0, 1200);
    g.cam(PRISON, 11);
    await g.talk(data.lines.prison.slice(0, 1));
    await Promise.all([inside, dark]);
    F.acts.walkTo(potiphar, POTI, 1.3);
    await sit(joseph, Math.PI / 2);
    F.acts.walkTo(keeper, PRISON.clone().add(V(1.2, -0.2)), 1.2);
    await g.talk(data.lines.prison.slice(1, 2));
    // 창 39:21 간수장이 요셉의 차꼬를 풀어 준다(차꼬를 벽에 세우고 사슬을 벗긴다, 각색)
    await F.acts.walkTo(keeper, JSLOT.clone().add(V(1.05, 0.5)), 1.2);
    F.acts.face(keeper, JSLOT);
    const unlock = (async () => {
      await F.acts.bow(keeper, 0.5);
      const s = stocks[2], from = s.position.clone(), to = JSLOT.clone().add(V(-0.35, 0.9)).setY(0.5);
      await tween(700, (p) => { s.position.lerpVectors(from, to, easeOut(p)); s.rotation.x = -1.3 * easeOut(p); });
      chains[2].visible = false;
      await F.acts.bow(keeper, 0);
      await F.acts.rise(joseph);
    })();
    await g.talk(data.lines.prison.slice(2, 3));
    await unlock;
    // 창 39:22 옥의 일을 맡는다: 간수장의 탁자에서 빵 바구니를 든다
    const fetch = (async () => { await F.acts.walkTo(joseph, TABLE.clone().add(V(-0.2, -0.75)), 1.4); F.acts.face(joseph, TABLE); F.acts.carry(basket, joseph); })();
    F.acts.walkTo(keeper, DOOR_IN.clone().add(V(-0.2, -0.8)), 1.2);
    await g.talk(data.lines.prison.slice(3, 4));
    await fetch;
    await g.talk(data.lines.prison.slice(4, 5));
    // 퀘스트 2(나르기): 요셉과 함께 차꼬 찬 죄수 셋에게 저녁 빵을 건넨다(창 39:22 옥의 일을 맡음, 빵과 바구니는 각색)
    const nth = ['첫째', '둘째', '셋째'];
    await g.quest({
      title: '옥의 저녁', targets: prisoners.map((p, i) => ({ pos: p.position.clone().add(V(1.3, -0.35)), i })), text: (t) => `${nth[t.i]} 죄수에게 빵 건네기`, radius: 1.3,
      onFound: async (t) => {
        const p = prisoners[t.i];
        await F.acts.walkTo(joseph, p.position.clone().add(V(0.8, t.i < 2 ? 0.45 : -0.45)), 1.8);
        F.acts.face(joseph, p.position);
        loaves[p.userData.slot].visible = true;
        await tween(500, (k) => (p.userData.rig.rotation.x = 0.35 * Math.sin(k * Math.PI))); // 고개 숙여 받는다
        g.reward(`bread/${t.i}`, 'step');
      },
    });
    await F.acts.walkTo(joseph, TABLE.clone().add(V(-0.2, -0.75)), 1.6);
    F.acts.carry(basket, null);
    basket.position.copy(TABLE).add(V(-0.2, 0)).setY(0.77);
    // 창 40:1~4 두 관원장이 대전에서 옥으로 끌려온다(친위대장 보디발이 데려온다). 39:23 서술 동안 길을 나선다
    F.acts.carry(cup, null);
    cup.visible = false;
    const brought = Promise.all([F.acts.walkTo(cupbearer, OFF[0], 2.4), F.acts.walkTo(baker, OFF[1], 2.4), F.acts.walkTo(potiphar, DOOR_OUT.clone().add(V(0.3, -0.8)), 1.6)]);
    await g.talk(data.lines.prison.slice(5));
    // 억울한 옥에서도 맡은 일을 해냄을 곁에서 지켜봄(인내)
    g.reward('prison', 'questDone', null, 'patience');
    await g.talk(data.lines.officials.slice(0, 1));
    await brought;
    // 근심하는 두 사람: 창 밑에 앉아 고개를 떨군다
    await Promise.all([sit(cupbearer, 0), sit(baker, 0)]);
    for (const f of [cupbearer, baker]) f.userData.rig.rotation.x = 0.35;
    F.acts.walkTo(joseph, JTALK, 1.4);
    await g.talk(data.lines.officials.slice(1, 2));
    F.acts.face(joseph, OFF[0].clone().lerp(OFF[1], 0.5));
    await g.talk(data.lines.officials.slice(2, 3));
    cupbearer.userData.rig.rotation.x = 0;
    await g.talk(data.lines.officials.slice(3, 6));
    baker.userData.rig.rotation.x = 0;
    await g.talk(data.lines.officials.slice(6, 8));
    baker.userData.rig.rotation.x = 0.35;
    // 창 40:20~22 사흘째: 친위대장이 두 사람을 데리고 나간다. 술 맡은 관원장은 대전으로, 떡 굽는 관원장은 밖으로
    await F.acts.walkTo(potiphar, DOOR_IN, 1.5);
    await Promise.all([F.acts.rise(cupbearer), F.acts.rise(baker)]);
    const out = [F.acts.walkTo(cupbearer, CUP_SPOT, 1.4), F.acts.walkTo(baker, V(1.4, 1.2), 1.2), F.acts.walkTo(potiphar, POTI, 1.4)];
    await g.talk(data.lines.officials.slice(8, 9));
    await F.acts.walkTo(joseph, DOOR_IN.clone().add(V(-0.7, 0.3)), 1.2);
    F.acts.face(joseph, DOOR_OUT);
    await g.talk(data.lines.officials.slice(9));
    g.note('person/cupbearer');

    // 막간: 옥의 저녁, 요셉과 대화한다(두 해 사이).
    await F.acts.dusk();
    await g.interlude(joseph);
    await Promise.all(out);
    baker.visible = false; // 막간 동안 화면 밖으로 나갔다(죽음은 서술로만)
    camels.forEach((c) => (c.visible = false));
    merchants.forEach((m) => (m.visible = false));
    pouch.visible = false;
    await F.acts.day();

    // 창 41:1~13 바로의 꿈을 아무도 풀지 못하고, 술 맡은 관원장이 요셉을 기억한다
    g.cam(hallPt(2.2, 0), 12);
    g.stage('hall');
    g.meet('pharaoh');
    cup.visible = true;
    F.acts.carry(cup, cupbearer);
    cupbearer.userData.armPose = null;
    await Promise.all(courtiers.map((c) => F.acts.bow(c, 0.3)));
    await g.talk(data.lines.called.slice(0, 1));
    dressFigure(joseph, { ...PLAIN, beard: 'short' }); // 두 해 넘게 옥에서 자란 수염(창 41:14 수염을 깎음). 대전을 비추는 동안(옥은 화면 밖) 바꾼다
    joseph.position.copy(pr(-2.9, 5.6));
    await Promise.all(courtiers.map((c) => F.acts.bow(c, 0)));
    await F.acts.walkTo(cupbearer, hallPt(1.6, -0.7), 1.2);
    F.acts.face(cupbearer, THRONE);
    F.acts.face(pharaoh, cupbearer.position);
    await g.talk(data.lines.called.slice(1, 2));
    // 41:14 신하가 옷을 들고 옥으로 달려간다
    garment.visible = true;
    F.acts.carry(garment, herald);
    const run = F.acts.walkTo(herald, pr(-2.2, 4.6), 2.6);
    F.acts.walkTo(cupbearer, CUP_SPOT, 1.2);
    g.stage(null);
    g.cam(DOOR_IN, 11);
    await g.talk(data.lines.called.slice(2, 3));
    await run;
    F.acts.face(herald, joseph.position);
    await g.talk(data.lines.called.slice(3, 4));
    // 퀘스트 3(받고 건네기): 신하에게서 옷을 받아 요셉에게 건넨다(옷을 누가 가져왔는지는 본문에 없다, 각색)
    await g.quest({ title: '바로의 부름', targets: [{ pos: herald.position.clone() }], text: () => '신하에게서 새 옷 받기', radius: 1.6, onFound: async () => { F.acts.face(herald, g.player.position); await pass(garment, g.player); } });
    await g.quest({ title: '바로의 부름', targets: [{ pos: joseph.position.clone() }], text: () => '요셉에게 새 옷 건네기', radius: 1.6, onFound: async () => { F.acts.face(joseph, g.player.position); await pass(garment, joseph); g.reward('garment', 'step'); } });
    // 대야에서 수염을 깎고 옷을 갈아입는다(창 41:14, 대야는 각색)
    await F.acts.walkTo(joseph, BASIN.clone().add(V(0.5, -0.45)), 1.3);
    F.acts.face(joseph, BASIN);
    F.acts.carry(garment, null);
    garment.visible = false;
    await F.acts.bow(joseph, 0.45);
    const change = redress(joseph, CLEAN, { ms: 1300 });
    await g.talk(data.lines.called.slice(4));
    await change;
    await F.acts.bow(joseph, 0);
    // 요셉을 따라 궁전으로
    const toHall = Promise.all([F.acts.walkTo(joseph, JSPOT, 2.6), walkPath(herald, [hallPt(-2.4, -0.8), hallPt(-0.2, -2.6)], 2.6)]);
    g.cam(null, 13);
    await g.quest({ title: '바로의 부름', targets: [{ pos: HALL_IN }], text: () => '요셉을 따라 바로의 궁전으로 가기', radius: 1.8 });
    await toHall;
    F.acts.face(herald, hallPt(-0.2, 0));

    // 창 41:15~24 대전: 단 아래의 요셉과 왕좌의 바로
    g.cam(hallPt(2.2, 0), 12);
    g.stage('hall');
    F.acts.face(joseph, THRONE);
    await g.talk(data.lines.pharaoh.slice(0, 2));
    await g.talk(data.lines.pharaoh.slice(2, 3));
    visions.forEach((v) => { v.visible = true; (v.userData.cows ?? []).forEach((c) => (c.visible = true)); });
    const rise = tween(800, (p) => visions.forEach((v) => !v.userData.cows && v.scale.setScalar(Math.max(0.01, easeOut(p)))));
    g.cam(hallPt(-0.6, 0), 12);
    await g.talk(data.lines.pharaoh.slice(3, 4));
    await rise;
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.pharaoh.slice(4));

    // 도전: 꿈 풀기. 꿈의 장면마다 다가가 꿈에 나온 것(암소·이삭·나일 강·동풍, 창 41:1~6)이 빛나는 순서를 기억해 누르면 요셉이 풀이를 말한다(순서 기억, F58).
    // 꿈을 푸는 이는 하나님이시라는 요셉의 고백(창 41:16)에 기대어 신실과 화평이 돕는다.
    const names = ['살진 일곱 암소', '알이 꽉 찬 일곱 이삭', '뼈만 남은 일곱 암소', '마른 일곱 이삭']; // 요셉의 풀이 대사(data/joseph.js)와 같은 말
    await g.challenge({
      title: '바로의 꿈', spots: DREAM_W.map((w, i) => ({ pos: hallPt(-2.7, w), text: `${names[i]} 풀기`, i })),
      verb: '풀기', hits: 1, kind: 'sequence', symbols: ['암소', '이삭', '나일', '동풍'], fruits: ['faith', 'peace'],
      onHit: async (sp) => {
        await F.acts.walkTo(joseph, hallPt(-0.7, DREAM_W[sp.i]), 2.4);
        F.acts.face(joseph, DREAMS[sp.i]);
        await g.talk([data.lines.dreams[sp.i]]);
        g.note(sp.i % 2 ? 'creature/grain' : 'creature/cow');
        g.reward(`dream/${sp.i}`, 'step');
      },
    });
    // 하나님께서 평안한 대답을 주신다는 고백(창 41:16, 화평)
    g.reward('dreams-done', 'challenge', null, 'peace');

    // 창 41:32~41 꿈이 걷히고, 요셉이 다시 단 아래에 선다
    g.cam(hallPt(2.2, 0), 12);
    g.stage('hall');
    const fade = tween(700, (p) => visions.forEach((v) => !v.userData.cows && v.scale.setScalar(Math.max(0.01, 1 - p))));
    visions.forEach((v) => (v.userData.cows ?? []).forEach((c) => (c.visible = false)));
    await F.acts.walkTo(joseph, JSPOT, 1.6);
    await fade;
    visions.forEach((v) => (v.visible = false));
    F.acts.face(joseph, THRONE);
    // 대전 밖 길가에 사람들이 모여든다(화면 밖에서 걸어온다)
    townsfolk.forEach((f, i) => { f.visible = true; f.position.copy(TOWN[i]).add(V(3.5, 3.5)); F.acts.walkTo(f, TOWN[i], 1.4).then(() => F.acts.face(f, ROAD[1])); });
    await g.talk(data.lines.ruler.slice(0, 3));
    // 바로가 왕좌에서 일어나 단을 내려온다
    await F.acts.rise(pharaoh, 0.8);
    pharaoh.userData.fixY = false;
    await F.acts.walkTo(pharaoh, hallPt(2.0, 0), 1);
    F.acts.face(pharaoh, joseph.position);
    await g.talk(data.lines.ruler.slice(3, 4));
    // 창 41:42 인장 반지를 손에서 손으로, 세마포 옷과 금 사슬
    const robe = (async () => {
      ring.visible = true;
      F.acts.carry(ring, pharaoh);
      await F.acts.wait(300);
      await pass(ring, joseph);
      F.acts.carry(ring, null);
      ring.visible = false;
      await redress(joseph, LINEN, { glow: true, ms: 1300 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 4, 12), mat(PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.3 }));
      chain.position.set(0, 0.98, 0.06);
      chain.rotation.x = Math.PI / 2 - 0.45;
      joseph.userData.rig.add(chain);
    })();
    // 그동안 버금 수레가 길에서 대전 앞으로 들어와 선다
    chariot.visible = true;
    horses.forEach((h) => (h.visible = true));
    const arrive = drive(ARRIVE, 3600);
    await g.talk(data.lines.ruler.slice(4, 5));
    await Promise.all([robe, arrive]);
    g.stage(null);

    // 창 41:43 버금 수레: 대전 밖으로 나가 수레에 오르고, 길가의 사람들이 엎드린다
    const back = CHARIOT.clone().addScaledVector(V(Math.cos(cartYaw), Math.sin(cartYaw)), -0.95);
    const toCart = F.acts.walkTo(joseph, back, 2.2);
    F.acts.walkTo(pharaoh, hallPt(-1.6, 0.5), 1.2);
    g.cam(CHARIOT, 12);
    await g.talk(data.lines.ruler.slice(5, 6));
    await toCart;
    joseph.userData.fixY = true;
    const step = joseph.position.clone();
    await tween(500, (p) => joseph.position.lerpVectors(step, CHARIOT, p).setY(0.42 * Math.sin(p * Math.PI / 2)));
    // 수레는 길을 따라 동쪽으로 간다. 요셉은 수레 위에 서고, 길가의 사람들이 수레가 지나갈 때 엎드린다
    g.cam(V(5.4, -1.2), 14);
    const ride = drive(ROAD, 4200, joseph);
    await g.talk(data.lines.ruler.slice(6, 7));
    await ride;
    await g.talk(data.lines.ruler.slice(7));
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-39-23'], memento: 'item/coat-thread' });
  },
};
