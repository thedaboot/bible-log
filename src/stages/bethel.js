// 1-10 야곱의 사닥다리(창 25~28장). 2026-11-05 F61 "뒤로 갈수록 생략되어 있다": 서술로 넘기던 25~27장을 장면으로 보인다.
// 브엘세바 이삭의 장막 앞에서 팥죽(퀘스트: 팥 떠다 넣기, 창 25:29~34) → 장막 안 축복(창 27장: 염소 가죽, 에서의 옷, 별미, 손을 더듬음)
// → 에서의 울부짖음과 노함(27:30~41) → 리브가가 야곱을 보냄(퀘스트: 길양식 건네기, 27:42~28:5) → 몰래 떠나 해 진 돌밭(28:10~11)
// → 돌베개(퀘스트) → 막간(야곱) → 잠 → 꿈의 사닥다리와 오르내리는 사자들(퀘스트: 지켜보기) → 28:13~15 약속
// → 깨어 두려워함, 돌기둥(도전: 기름 붓기, 따라 긋기)과 벧엘, 옛 이름 루스 → 퀴즈(창 28:15)
// 각색: 브엘세바와 벧엘(실제로는 며칠 길)을 한 들에 두고, 장막 뒤 길목에서 돌밭까지 걷는 동안 해가 지게 줄였다.
// 장막은 안이 들여다보이게 지붕을 뒤쪽 처마만 남기고 걷었다. 휘장으로 이삭의 방(오른쪽)과 리브가의 방(왼쪽)을 나눈 것은 각색이다.
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAngel, makeSack, makeCloud, setArms } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/bethel.js';

const START = V(6, 5);
const ALONG = V(1, -1).normalize(); // 화면 가로(오른쪽)
const FRONT = V(1, 1).normalize(); // 카메라 쪽
const at = (o, a, f) => o.clone().addScaledVector(ALONG, a).addScaledVector(FRONT, f);

// 브엘세바의 장막: 지역 좌표 (가로 a, 앞 f). 뒤 벽 f -1.4, 옆 벽 a ±2.5, 휘장 a 0.3(오른쪽이 이삭의 방)
const TENT = V(5.2, -4.2);
const ISAAC = at(TENT, 1.95, -0.55); // 깔개 위에 앉은 이삭
const BEFORE = at(TENT, 0.95, -0.1); // 이삭 앞에 서는 자리
const KNEEL = at(TENT, 1.1, -0.35); // 손을 내밀어 만져 볼 만큼 가까이 꿇는 자리(창 27:21)
const LISTEN = at(TENT, -0.25, -0.6); // 휘장 너머에서 듣는 리브가(창 27:5)
const R_ROOM = at(TENT, -1.0, -0.4);
const J_ROOM = at(TENT, -1.3, 0.7); // 리브가의 방 앞쪽, 야곱이 옷을 갈아입는 자리
const CHEST = at(TENT, -1.9, -1.0); // 에서의 좋은 옷을 둔 자리(창 27:15 집 안 리브가에게 있던 옷)
const SACK = at(TENT, -0.6, -0.85); // 붉은 팥 자루
const HEARTH = at(TENT, -3.3, 2.0); // 장막 앞 화덕과 솥
const COOK = at(TENT, -4.1, 2.0); // 죽을 젓는 야곱
const R_COOK = at(TENT, -3.3, 1.25); // 별미를 만드는 리브가(화덕 뒤)
const HAND = at(TENT, -3.0, 2.65);
const POUR = at(TENT, -1.4, 2.9); // 관찰자가 팥을 넣는 자리(에서가 설 자리의 화면 오른쪽): 뒤 장면에서 대천사가 에서·야곱을 가리지 않게
const ASIDE = at(TENT, 3.3, -0.6); // 세월이 흐른 뒤 관찰자가 서는 장막 오른쪽 밖 // 야곱이 팥죽을 건네는 자리
const ESAU_EAT = at(TENT, -2.5, 2.1);
const ESAU_FROM = V(10.8, 0.5); // 에서가 들에서 돌아오는 쪽
const GRUDGE = at(TENT, 2.9, 2.4); // 장막 밖에서 야곱 쪽을 노려보는 에서(창 27:41)
const GOATS = V(10, -1.8);
const J_GOATS = V(9.0, -1.4);
const J_BACK = at(TENT, -3.9, 1.2);
const BEHIND = at(TENT, -1.0, -2.3); // 염소 새끼를 데려가는 장막 뒤(잡는 장면은 그리지 않는다)
const R_GIVE = at(TENT, -3.2, 0.9); // 리브가가 길양식을 건네는 자리
const WAIT = at(TENT, -3.2, -1.6); // 장막 뒤 길목: 야곱이 몰래 기다린다
const ROAD = V(-1.5, -3.5);

// 해 진 돌밭(벧엘)
const JACOB = V(0.5, 0.5); // 야곱이 머문 자리
const BED = V(-1.5, -1.5); // 돌베개를 베고 누운 자리
const STONES = [V(-1, 4.5), V(-6, 2.5), V(-3.5, -6.5)]; // 날카로운 돌, 큰 바위, 매끈한 돌
// 기름 붓기 도전: 관찰자는 돌기둥(BED에서 -ALONG 0.8)의 왼쪽 앞, 야곱은 오른쪽 앞에 선다.
const OIL = BED.clone().addScaledVector(ALONG, -2).add(V(0.5, 0.5));
const LADDER = BED.clone().addScaledVector(ALONG, -2.4).add(V(-1, -1)); // 꿈의 사닥다리 밑동(누운 자리 곁, 화면 왼쪽 뒤)
const LUZ = V(-7, -8.6); // 멀리 보이는 루스 성(창 28:19)
// 사닥다리: 밑동에서 카메라 반대쪽(-FRONT)으로 기울어 하늘까지 오르는 빛의 층계. 칸마다 높이 RISE, 깊이 RUN
const RUNG = 30, RISE = 0.4, RUN = 0.15;
const UP = FRONT.clone().negate();
const TOP = LADDER.clone().addScaledVector(UP, (RUNG - 1) * RUN).setY(0.2 + (RUNG - 1) * RISE);
const MID = LADDER.clone().addScaledVector(UP, RUNG * RUN * 0.5).setY(TOP.y * 0.5);

const LINEN = 0xd8c3a0, ESAU_CLOTH = 0x9a6b45, GOAT = 0x3a2e26;

// 앉기·꿇기: rig를 낮추고 몸을 기울인다(일어날 때는 stand). 자세가 있는 동안 field.js는 숨쉬기 몸짓을 하지 않는다.
function kneel(fig, lean = 0.12, ms = 500) {
  const u = fig.userData, { rig } = u;
  u.pose = 'kneel';
  const y0 = rig.position.y, x0 = rig.rotation.x;
  return tween(ms, (p) => { const e = easeOut(p); rig.position.y = y0 + (-0.32 - y0) * e; rig.rotation.x = x0 + (lean - x0) * e; });
}
function stand(fig, ms = 400) {
  const u = fig.userData, { rig } = u;
  const y0 = rig.position.y, x0 = rig.rotation.x, z0 = rig.rotation.z;
  return tween(ms, (p) => { const e = easeOut(p); rig.position.y = y0 * (1 - e); rig.rotation.x = x0 * (1 - e); rig.rotation.z = z0 * (1 - e); setArms(fig, 'down', e); })
    .then(() => { u.pose = null; });
}
// 떨림(창 27:33 이삭이 심히 크게 떨며, 창 28:17 두려워하여)
// 선 채로 떨 때는 잠시 자세를 걸어 둔다(없으면 숨쉬기 몸짓이 기울기를 덮어쓴다)
function tremble(fig, ms = 1200, amp = 0.06) {
  const u = fig.userData, own = !u.pose;
  if (own) u.pose = 'tremble';
  return tween(ms, (p) => (u.rig.rotation.z = Math.sin(p * Math.PI * 22) * amp * (1 - p))).then(() => { if (own) u.pose = null; });
}
// 팔을 앞으로 내민다(k 0~1). 자세가 있는 인물에만 쓴다(없으면 걷기 몸짓이 덮어쓴다)
const reach = (fig, x, ms = 500) => { const a0 = fig.userData.arms.map((a) => a.rotation.x); return tween(ms, (p) => fig.userData.arms.forEach((a, i) => { a.rotation.x = a0[i] + (x - a0[i]) * easeOut(p); a.rotation.z = (i ? 1 : -1) * 0.12; })); };

export default {
  id: 'bethel',
  data,
  records: ['person/jacob', 'person/esau', 'creature/lentil', 'place/bethel', 'item/stone-pillow', 'word/gen-28-15'],
  kicker: '하란 가는 길로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 2815, start: START, sky: 0xe8d8b0, ground: 0x9c9466,
      stages: {
        hearth: { c: at(HEARTH, -0.3, 1.3), r: 1.4 }, tent: { c: at(TENT, 0.8, 2.4), r: 1.8 },
        bed: { c: toCam(BED, 1.6), r: 2.2 }, ladder: { c: toCam(LADDER, 2.2), r: 2 },
      },
      trees: 6, keep: [...STONES, JACOB, BED, LADDER, LADDER.clone().add(V(-1.5, -1.5)), LADDER.clone().addScaledVector(ALONG, -1.8).add(V(1, 1)), ROAD, WAIT, J_GOATS, ESAU_FROM, GRUDGE, J_BACK],
    });
    const G = F.group;
    const add = (geo, m, p, y = 0) => { const o = new THREE.Mesh(geo, m); o.position.copy(p).setY(y); G.add(o); return o; };

    // ---------- 장막(창 25:27 장막에 거주하는 야곱): 검은 염소 털 천, 지붕은 뒤 처마만 ----------
    const tent = new THREE.Group();
    tent.position.copy(TENT);
    tent.rotation.y = Math.PI / 4; // 지역 x가 화면 가로(ALONG), 지역 z가 카메라 쪽(FRONT)
    const hair = mat(0x3b302a, { side: THREE.DoubleSide });
    const box = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); tent.add(o); return o; };
    box(5.0, 1.5, 0.06, 0, 0.75, -1.4, hair);
    for (const s of [-1, 1]) box(0.06, 1.5, 2.8, s * 2.5, 0.75, 0, hair);
    const eave = box(5.1, 0.05, 1.0, 0, 1.72, -1.0, hair); // 뒤 처마: 뒤 벽 위에서 안쪽으로 비스듬히
    eave.rotation.x = -0.45;
    const pole = mat(PAL.bark);
    for (const x of [-2.5, 0.3, 2.5]) box(0.08, 2.0, 0.08, x, 1.0, 1.4, pole);
    // 휘장: 이삭의 방과 리브가의 방을 가른다(앞쪽은 드나드는 틈)
    box(0.04, 1.35, 1.9, 0.3, 0.675, -0.45, mat(0x8a3a2a, { side: THREE.DoubleSide }));
    box(0.05, 0.12, 1.9, 0.3, 1.05, -0.45, mat(0xd8b060));
    // 깔개와 이삭의 자리, 화로, 항아리
    box(2.1, 0.03, 2.6, 1.4, 0.02, 0, mat(0xb8452f));
    box(1.5, 0.035, 1.9, 1.4, 0.025, 0, mat(0xe0c070));
    box(2.7, 0.03, 2.6, -1.1, 0.02, 0, mat(0x7a5a3a));
    box(0.3, 0.26, 0.42, 2.3, 0.13, -0.55, mat(0x6e3f73)); // 이삭이 기대는 방석
    box(0.55, 0.32, 0.4, -1.9, 0.16, -1.0, mat(0x6b4a32)); // 옷 궤
    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.22, 8), mat(0x5a4a3a));
    brazier.position.set(2.05, 0.11, 0.95);
    const coals = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
    coals.position.set(2.05, 0.23, 0.95);
    tent.add(brazier, coals);
    for (const [x, z, h] of [[2.25, -1.15, 0.55], [-2.25, -1.15, 0.6], [-1.85, -1.2, 0.42], [-0.15, -1.15, 0.5]]) {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, h, 8), mat(PAL.clay));
      jar.position.set(x, h / 2, z);
      tent.add(jar);
    }
    const camp0 = G.children.length; // 여기부터 옷 궤의 옷까지가 브엘세바 장막 자리(밤이 되면 감춘다)
    G.add(tent);
    // 벽과 휘장: 작은 원을 촘촘히(앞은 열어 둔다)
    for (let a = -2.5; a <= 2.51; a += 0.36) F.block(at(TENT, a, -1.4), 0.18);
    for (const s of [-1, 1]) for (let f = -1.4; f <= 1.31; f += 0.35) F.block(at(TENT, s * 2.5, f), 0.18);
    for (let f = -1.4; f <= 0.51; f += 0.35) F.block(at(TENT, 0.3, f), 0.15);
    F.block(at(TENT, 0.3, 1.4), 0.1);

    // 화덕과 솥(창 25:29 죽을 쑤었더니): 솥 안의 죽은 팥을 넣으면 붉어진다
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      add(new THREE.DodecahedronGeometry(0.1, 0), mat(0x8a8478), HEARTH.clone().add(V(Math.cos(a) * 0.32, Math.sin(a) * 0.32)), 0.07);
    }
    const flame = new THREE.MeshBasicMaterial({ color: 0xff9a3a });
    for (const [x, z] of [[0.08, 0], [-0.08, 0.05], [0, -0.08]]) add(new THREE.ConeGeometry(0.07, 0.22, 5), flame, HEARTH.clone().add(V(x, z)), 0.12);
    add(new THREE.CylinderGeometry(0.3, 0.22, 0.32, 10), mat(0x3a3430), HEARTH, 0.36);
    const stew = add(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 10), mat(0x8a7a5a), HEARTH, 0.5);
    F.block(HEARTH, 0.35);
    // 들고 옮기는 것들: 팥 한 바가지, 팥죽 그릇, 별미 두 접시, 에서의 옷, 길양식 자루
    const bowlOf = (top) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.1, 8), mat(0x7a5230)); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 8), mat(top)); t.position.y = 0.05; g.add(b, t); g.visible = false; G.add(g); return g; };
    const lentils = bowlOf(0x9a3a2a), bowl = bowlOf(0xa8402a), dish = bowlOf(0x8a4a2a), esauDish = bowlOf(0x8a4a2a);
    const sack = F.put(makeSack(0xb08a5a), SACK.clone().add(V(-0.25, -0.25)));
    sack.scale.setScalar(0.8);
    const clothes = add(new THREE.BoxGeometry(0.4, 0.14, 0.3), mat(ESAU_CLOTH), CHEST, 0.39);
    clothes.rotation.y = Math.PI / 4;
    const camp = G.children.slice(camp0);
    const bundle = makeSack(0xc8b088);
    bundle.scale.setScalar(0.45);
    bundle.visible = false;
    G.add(bundle);

    // ---------- 해 진 돌밭: 크고 작은 돌이 흩어진 마른 들(창 28:11 그곳의 돌) ----------
    const stoneM = mat(0x9a9488), stoneD = mat(0x857f74);
    const rocks = STONES.map((p, i) => {
      const geo = i === 1 ? new THREE.DodecahedronGeometry(0.75, 0) : i === 0 ? new THREE.TetrahedronGeometry(0.35, 0) : new THREE.IcosahedronGeometry(0.22, 1).scale(1.4, 0.7, 1);
      const r = add(geo, stoneM, p, i === 1 ? 0.5 : 0.2);
      if (i === 1) F.block(p, 0.75);
      return r;
    });
    const spots = [...STONES, JACOB, BED, OIL, LADDER, ROAD, WAIT, START, HEARTH, LUZ];
    const gravel = new THREE.Group();
    for (let n = 0, tries = 0; n < 70 && tries < 600; tries++) {
      const p = V((F.rand() * 2 - 1) * 11, (F.rand() * 2 - 1) * 11);
      if (p.length() > 11.5 || p.distanceTo(TENT) < 4.2 || p.x + p.z > 6 || spots.some((s) => p.distanceTo(s) < 1)) continue;
      const big = n % 9 === 0 && !spots.some((s) => p.distanceTo(s) < 2.6);
      const s = big ? 0.35 + F.rand() * 0.15 : 0.08 + F.rand() * 0.1;
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), n % 2 ? stoneM : stoneD);
      r.position.copy(p).setY(s * 0.4);
      r.rotation.set(F.rand() * 3, F.rand() * 3, 0);
      r.scale.set(1.2, 0.7, 1);
      gravel.add(r);
      if (big) F.block(p, s);
      n++;
    }
    G.add(gravel);

    // ---------- 멀리 루스 성(창 28:19): 언덕 위 흙벽돌 성벽과 평평한 지붕 집 ----------
    const luz = new THREE.Group();
    const mound = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.9, 0.9, 10), mat(0x8a845a));
    mound.position.y = 0.45;
    luz.add(mound);
    const brick = mat(0xb89a6a), roof = mat(0xc8ac7a);
    for (let i = 0; i < 12; i++) {
      if (i === 1) continue; // 성문(카메라 쪽)
      const a = (i / 12) * Math.PI * 2 + Math.PI / 4;
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.18), brick);
      w.position.set(Math.cos(a) * 1.8, 1.2, Math.sin(a) * 1.8);
      w.rotation.y = -a + Math.PI / 2;
      luz.add(w);
    }
    for (const [x, z, h] of [[-0.6, -0.4, 0.7], [0.3, -0.7, 0.55], [0.6, 0.3, 0.6], [-0.3, 0.5, 0.45], [-0.9, 0.4, 0.5], [0.1, -0.1, 1.1]]) {
      const hs = new THREE.Mesh(new THREE.BoxGeometry(0.55, h, 0.5), brick);
      hs.position.set(x, 0.9 + h / 2, z);
      const rf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.55), roof);
      rf.position.set(x, 0.92 + h, z);
      luz.add(hs, rf);
    }
    luz.scale.setScalar(0.75); // 들 건너 멀리 있는 성으로 보이게 줄인다
    F.put(luz, LUZ, 2.1);

    // ---------- 밤하늘의 별: 밤이 되면 돋는다 ----------
    const starM = new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0 });
    const stars = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.07, 0), starM, 180);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 180; i++) {
      const a = F.rand() * Math.PI * 2, r = 2 + F.rand() * 15, s = 0.6 + F.rand() * 0.9;
      m4.makeScale(s, s, s).setPosition(Math.cos(a) * r - 5, 6 + F.rand() * 12, Math.sin(a) * r - 5);
      stars.setMatrixAt(i, m4);
    }
    stars.frustumCulled = false;
    stars.visible = false;
    G.add(stars);

    // ---------- 꿈의 사닥다리(창 28:12): 땅에 선 밑동에서 하늘까지 층층이 빛나는 층계, 오르내리는 사자들 ----------
    const ladder = new THREE.Group();
    ladder.position.copy(LADDER);
    ladder.rotation.y = Math.atan2(UP.x, UP.z); // 지역 z가 위로 오르는 쪽
    const steps = [];
    for (let i = 0; i < RUNG; i++) {
      const m = new THREE.MeshBasicMaterial({ color: PAL.light, transparent: true, opacity: 0.9 });
      m.userData.base = 0.95 - 0.45 * (i / RUNG);
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.07, 0.36), m);
      st.position.set(0, 0.2 + i * RISE, i * RUN);
      ladder.add(st);
      steps.push(st);
    }
    const railM = new THREE.MeshBasicMaterial({ color: 0xfff8d8, transparent: true, opacity: 0.8 });
    const railLen = Math.hypot((RUNG - 1) * RISE, (RUNG - 1) * RUN) + 0.4;
    const rails = [-1, 1].map((s) => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, railLen), railM);
      r.position.set(s * 0.7, 0.2 + ((RUNG - 1) * RISE) / 2 + 0.25, ((RUNG - 1) * RUN) / 2);
      r.rotation.x = -Math.atan2((RUNG - 1) * RISE, (RUNG - 1) * RUN);
      ladder.add(r);
      return r;
    });
    const cloud = makeCloud(1.3);
    cloud.position.set(0, 0.6 + (RUNG - 1) * RISE, (RUNG - 1) * RUN);
    ladder.add(cloud);
    const climbers = [0, 1, 2, 3, 4, 5].map((i) => {
      const a = makeAngel();
      a.scale.setScalar(0.5);
      a.userData.k = (i * 0.37) % 1;
      a.userData.up = i % 2 === 0;
      a.rotation.y = a.userData.up ? 0 : Math.PI;
      ladder.add(a);
      return a;
    });
    ladder.visible = false;
    G.add(ladder);
    F.onUpdate((dt, t) => {
      if (!ladder.visible) return;
      // 빛이 아래 칸부터 위 칸으로 물결처럼 오른다
      steps.forEach((st, i) => (st.material.opacity = st.material.userData.base * (0.7 + 0.3 * Math.sin(t * 3 - i * 0.45))));
      for (const a of climbers) {
        a.userData.k = (a.userData.k + dt * 0.035) % 1;
        const k = a.userData.up ? a.userData.k : 1 - a.userData.k, i = k * (RUNG - 1);
        a.position.set(a.userData.up ? -0.32 : 0.32, 0.24 + i * RISE + Math.abs(Math.sin(t * 7 + i)) * 0.05, i * RUN);
        a.visible = k < 0.96; // 꼭대기 구름 속으로 들어가고 나온다
      }
    });

    // ---------- 사람과 짐승 ----------
    const jacob = F.person('jacob', { hair: 'short', hairColor: PAL.hairBrown, beard: 'short', outfit: 'shepherd', outfitColor: LINEN, item: 'staff' }, COOK);
    const esau = F.person('esau', { hair: 'curly', hairColor: 0x8a4f2c, beard: 'long', outfit: 'shepherd', outfitColor: ESAU_CLOTH }, ESAU_FROM);
    esau.visible = false;
    // 에서의 활(창 27:3 화살통과 활): 등에 멘다
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 4, 12, Math.PI), mat(PAL.bark));
    bow.position.set(0.05, 0.85, -0.3);
    bow.rotation.set(0, Math.PI / 2, Math.PI / 2);
    esau.userData.rig.add(bow);
    const isaac = F.person('isaac', { hair: 'short', hairColor: 0xd8d4cc, beard: 'long', outfit: 'robe', outfitColor: 0x8f7a5a }, ISAAC);
    const rebekah = F.person('rebekah', { hair: 'braid', hairColor: 0x5a4434, outfit: 'robe', outfitColor: 0xb8452f }, R_ROOM);
    // 눈이 어두운 이삭(창 27:1): 눈을 흐린 빛으로
    isaac.userData.rig.traverse((o) => { if (o.isMesh && o.material.color?.getHex() === PAL.eye) o.material.color.setHex(0xa8aeb4); });
    isaac.userData.pose = 'sit';
    isaac.userData.rig.position.y = -0.32;
    // 야곱의 옷(색이 바뀌는 재질)과 염소 가죽(창 27:16 손과 목)
    const robe = [];
    jacob.userData.rig.traverse((o) => { if (o.isMesh && o.material.color?.getHex() === LINEN) robe.push(o.material); });
    const goatM = mat(GOAT);
    const skins = jacob.userData.arms.map((arm) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.2, 0.17), goatM); s.position.y = -0.36; arm.add(s); return s; });
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.1, 8), goatM);
    neck.position.y = 1.05;
    jacob.userData.rig.add(neck);
    skins.push(neck);
    skins.forEach((s) => (s.visible = false));
    const goats = [0, 1, 2].map((i) => F.animal('ram', [0x2e2620, 0x4a3a2e, 0x2a2420][i], 0.75, GOATS.clone().add(V(i * 0.8 - 0.8, (i % 2) * 0.7)), { roam: 0.8 }));
    const kids = [0, 1].map((i) => F.animal('generic', [0x3a3028, 0x5a4636][i], 0.42, GOATS.clone().add(V(-0.6 + i * 0.7, -0.9)), { roam: 0.5 }));
    const pillow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1).scale(1.4, 0.7, 1), stoneM);
    pillow.visible = false;
    G.add(pillow);
    Object.assign(F, { camp, jacob, esau, isaac, rebekah, rocks, ladder, steps, rails, climbers, pillow, stars, robe, skins, stew, lentils, bowl, dish, esauDish, clothes, bundle, kids, goats });
    F.spots = {
      start: START, jacob: JACOB, bed: BED, oil: OIL, ladder: LADDER, ...Object.fromEntries(STONES.map((s, i) => [`stone${i}`, s])),
      isaac: ISAAC, before: BEFORE, kneel: KNEEL, listen: LISTEN, rroom: R_ROOM, jroom: J_ROOM, sack: SACK, hearth: HEARTH, cook: COOK, rcook: R_COOK,
      hand: HAND, esauEat: ESAU_EAT, esauFrom: ESAU_FROM, grudge: GRUDGE, jgoats: J_GOATS, jback: J_BACK, give: R_GIVE, wait: WAIT, road: ROAD, luz: LUZ, aside: ASIDE, pour: POUR,
    };
    F.solid = ['stone1', 'hearth', 'luz'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { camp, goats, jacob, esau, isaac, rebekah, rocks, ladder, steps, rails, climbers, pillow, stars, robe, skins, stew, lentils, bowl, dish, esauDish, clothes, bundle, kids } = F;
    const L = data.lines;
    const dye = (to, ms = 900) => { const c0 = robe[0].color.clone(), c1 = new THREE.Color(to); return tween(ms, (p) => robe.forEach((m) => m.color.copy(c0).lerp(c1, p))); };
    const skinsOn = (on) => { skins.forEach((s) => (s.visible = true)); return tween(600, (p) => skins.forEach((s) => s.scale.setScalar(Math.max(0.01, on ? easeBack(p) : 1 - p)))).then(() => { if (!on) skins.forEach((s) => (s.visible = false)); }); };
    const place = (obj, p, y = 0.08, ms = 400) => { const from = obj.position.clone(), to = p.clone().setY(y); return tween(ms, (k) => obj.position.lerpVectors(from, to, easeOut(k))); };

    // 창 25:24~27 쌍둥이. 장막 앞에서 야곱이 죽을 쑨다.
    g.cam(at(TENT, -2.2, 1.6), 12);
    F.acts.face(jacob, HEARTH);
    await g.talk(L.arrive.slice(0, 1));
    g.note('person/esau');
    await g.talk(L.arrive.slice(1, 2));
    g.meet('jacob');
    await g.talk(L.arrive.slice(2));

    // 퀘스트 1: 팥죽. 장막 안 자루에서 붉은 팥을 떠다(머무르기) 야곱의 솥에 넣는다.
    await g.quest({ title: '팥죽', targets: [{ pos: SACK }], text: () => '자루에서 붉은 팥 뜨기', radius: 1.3, hold: 1, holdLabel: () => '팥을 뜨는 중' });
    lentils.visible = true;
    F.acts.carry(lentils, g.player);
    await g.quest({ title: '팥죽', targets: [{ pos: POUR }], text: () => '야곱의 솥에 팥 넣기', radius: 0.9 });
    F.acts.carry(lentils, null);
    await place(lentils, HEARTH, 0.62);
    lentils.visible = false;
    const red = new THREE.Color(0xa8402a), c0 = stew.material.color.clone();
    tween(1200, (p) => stew.material.color.copy(c0).lerp(red, p));
    g.note('creature/lentil');
    g.reward('lentil-done', 'questDone');

    // 창 25:29~34 지쳐 돌아온 에서와 팥죽 한 그릇
    g.stage('hearth');
    g.cam(at(HEARTH, 0.4, 0.2), 11);
    esau.visible = true;
    const come = F.acts.walkTo(esau, ESAU_EAT, 1.1).then(() => { F.acts.face(esau, jacob.position); return F.acts.bow(esau, 0.3); });
    await g.talk(L.stew.slice(0, 1));
    await come;
    F.acts.face(jacob, esau.position);
    await g.talk(L.stew.slice(1, 3));
    await F.acts.bow(esau, 0);
    await g.talk(L.stew.slice(3, 6));
    // 창 25:33 맹세: 오른손을 든다
    esau.userData.pose = 'swear';
    const arm = esau.userData.arms[1];
    tween(500, (p) => (arm.rotation.x = -2.5 * easeOut(p)));
    await g.talk(L.stew.slice(6, 7));
    arm.rotation.x = 0;
    esau.userData.pose = null;
    // 창 25:34 야곱이 그릇을 손에서 손으로 건네고, 에서는 먹고 마시고 일어나 간다
    bowl.position.copy(HEARTH).setY(0.6);
    bowl.visible = true;
    F.acts.carry(bowl, jacob);
    const meal = F.acts.walkTo(jacob, HAND, 1.2).then(async () => {
      F.acts.face(jacob, esau.position);
      F.acts.carry(bowl, esau);
      esau.userData.pose = 'eat';
      await tween(1600, (p) => { setArms(esau, 'carry'); esau.userData.rig.rotation.x = 0.15 + 0.18 * Math.abs(Math.sin(p * Math.PI * 3)); });
      esau.userData.rig.rotation.x = 0;
      esau.userData.pose = null;
      F.acts.carry(bowl, null);
      await place(bowl, ESAU_EAT.clone().addScaledVector(ALONG, 0.5), 0.05);
      return F.acts.walkTo(esau, ESAU_FROM, 1.8);
    });
    await g.talk(L.stew.slice(7, 8));
    await g.talk(L.stew.slice(8));
    await meal;
    g.stage(null);

    // 창 27:1~4 세월이 흘러, 장막 안. 늙어 눈이 어두운 이삭이 맏아들을 부른다.
    F.acts.walkTo(jacob, J_ROOM, 1.4);
    bowl.visible = false;
    g.place(ASIDE); // 세월이 흐른 장면: 관찰자와 대천사는 장막 오른쪽 밖에서 본다
    g.cam(at(TENT, 0.4, 0.3), 9.5);
    g.stage('tent');
    const toIsaac = F.acts.walkTo(esau, BEFORE, 2.2).then(() => F.acts.face(esau, ISAAC));
    await g.talk(L.bless.slice(0, 1));
    await toIsaac;
    F.acts.walkTo(rebekah, LISTEN, 0.9).then(() => F.acts.face(rebekah, ISAAC));
    await g.talk(L.bless.slice(1, 3));
    // 에서는 활을 메고 들로 나간다
    const hunt = F.acts.walkTo(esau, ESAU_FROM, 2.2).then(() => (esau.visible = false));
    await g.talk(L.bless.slice(3, 4));
    await F.acts.walkTo(rebekah, J_ROOM.clone().addScaledVector(ALONG, 0.8), 1.4);
    F.acts.face(rebekah, jacob.position);
    F.acts.face(jacob, rebekah.position);
    await g.talk(L.bless.slice(4, 7));
    // 창 27:14 염소 새끼 둘을 끌어오고, 리브가는 화덕에서 별미를 만든다
    g.cam(at(TENT, -0.5, 1.2), 12);
    const fetch = F.acts.walkTo(jacob, J_GOATS, 2.6).then(() => {
      kids.forEach((k, i) => { k.userData.lead = jacob; k.userData.leadOffset = V(0.5 - i, 0.6); });
      return F.acts.walkTo(jacob, J_BACK, 2.4);
    }).then(() => kids.forEach((k) => {
      k.userData.lead = null;
      k.userData.route = [at(TENT, -3.6, -0.2), at(TENT, -2.9, -2.0), BEHIND];
      k.userData.onArrive = () => (k.visible = false);
    }));
    const cook = F.acts.walkTo(rebekah, R_COOK, 1.4).then(() => { F.acts.face(rebekah, HEARTH); return F.acts.bow(rebekah, 0.3); });
    await g.talk(L.bless.slice(7, 8));
    await Promise.all([fetch, cook, hunt]);
    await F.acts.bow(rebekah, 0);
    dish.position.copy(HEARTH).setY(0.6);
    dish.visible = true;
    // 창 27:15 에서의 좋은 옷을 입힌다(옷 궤에서 들고 와 입히면 옷 색이 에서의 옷으로 바뀐다)
    g.cam(at(TENT, -1.4, 0.8), 9.5);
    const dress = F.acts.walkTo(jacob, J_ROOM, 1.6).then(() => F.acts.face(jacob, CHEST))
      .then(() => F.acts.walkTo(rebekah, CHEST.clone().addScaledVector(FRONT, 0.5), 1.6))
      .then(() => { F.acts.carry(clothes, rebekah); return F.acts.walkTo(rebekah, J_ROOM.clone().addScaledVector(ALONG, -0.7), 1.4); })
      .then(() => { F.acts.face(rebekah, jacob.position); F.acts.carry(clothes, null); return Promise.all([place(clothes, jacob.position, 1.0, 500).then(() => (clothes.visible = false)), dye(ESAU_CLOTH)]); });
    await g.talk(L.bless.slice(8, 9));
    await dress;
    // 창 27:16 염소 새끼 가죽을 손과 목에
    const wrap = skinsOn(true);
    await g.talk(L.bless.slice(9, 10));
    await wrap;
    // 창 27:17 별미와 떡을 손에 들려 준다(화덕에서 들고 와 손에서 손으로)
    const serve = F.acts.walkTo(rebekah, R_COOK, 1.8).then(() => { F.acts.carry(dish, rebekah); return F.acts.walkTo(rebekah, J_ROOM.clone().addScaledVector(ALONG, -0.7), 1.8); })
      .then(() => { F.acts.face(rebekah, jacob.position); F.acts.carry(dish, jacob); });
    await g.talk(L.bless.slice(10));
    await serve;

    // 창 27:18~29 야곱이 에서인 척 아버지 앞에 선다. 본문대로 보이고 꾸미지 않는다.
    g.cam(at(TENT, 1.0, 0.2), 9);
    const D = L.deceive;
    const enter = F.acts.walkTo(jacob, BEFORE, 1.2).then(() => F.acts.face(jacob, ISAAC));
    F.acts.walkTo(rebekah, LISTEN, 1.2).then(() => F.acts.face(rebekah, ISAAC));
    await g.talk(D.slice(0, 1));
    await enter;
    await g.talk(D.slice(1, 5));
    // 창 27:21~23 가까이 꿇은 야곱의 가죽 두른 손을 이삭이 더듬는다
    await F.acts.walkTo(jacob, KNEEL, 0.8);
    F.acts.face(jacob, ISAAC);
    F.acts.carry(dish, null);
    const near = place(dish, at(TENT, 1.35, 0.05), 0.08);
    await kneel(jacob, 0.1);
    await reach(jacob, -1.0);
    const feel = reach(isaac, -1.2, 700);
    await g.talk(D.slice(5, 6));
    await feel;
    let stroking = true;
    const stroke = (async () => { while (stroking) await tween(700, (p) => isaac.userData.arms.forEach((a, i) => (a.rotation.x = -1.2 + Math.sin(p * Math.PI * 2 + i) * 0.15))); })();
    await g.talk(D.slice(6, 10));
    stroking = false;
    await stroke;
    await near;
    // 창 27:25~27 먹고, 입을 맞추고, 옷 냄새를 맡는다
    await Promise.all([reach(isaac, 0), reach(jacob, 0)]);
    const kiss = tween(1400, (p) => { const e = Math.sin(p * Math.PI); isaac.userData.rig.rotation.x = 0.35 * e; jacob.userData.rig.rotation.x = 0.1 + 0.25 * e; });
    await g.talk(D.slice(10, 11));
    await kiss;
    // 창 27:28~29 축복: 이삭이 두 손을 든다
    const lift = reach(isaac, -2.4, 700);
    await g.talk(D.slice(11));
    await lift;
    await reach(isaac, 0, 400);

    // 창 27:30~35 야곱이 나가자마자 에서가 돌아온다
    g.cam(at(TENT, 1.2, 0.8), 10.5);
    await stand(jacob);
    const out = F.acts.walkTo(jacob, J_ROOM, 1.6).then(() => F.acts.face(jacob, ISAAC));
    esau.visible = true;
    esauDish.visible = true;
    F.acts.carry(esauDish, esau);
    const back = F.acts.walkTo(esau, BEFORE, 2.4).then(() => F.acts.face(esau, ISAAC));
    await g.talk(L.esau.slice(0, 1));
    await Promise.all([out, back]);
    F.acts.carry(esauDish, null);
    const put = place(esauDish, at(TENT, 1.2, 0.2), 0.08);
    await g.talk(L.esau.slice(1, 4));
    await put;
    // 창 27:33 이삭이 크게 떤다
    const shake = tremble(isaac, 1600, 0.07);
    await g.talk(L.esau.slice(4, 5));
    await shake;
    // 창 27:34 에서가 꿇어 얼굴을 감싸고 울부짖는다
    await kneel(esau, 0.35);
    const sob = Promise.all([reach(esau, -1.9, 500), tremble(esau, 2400, 0.05)]);
    await g.talk(L.esau.slice(5, 8));
    await sob;
    // 창 27:41 장막 밖에서 야곱 쪽을 노려보며 속으로 말한다
    await stand(esau);
    g.stage(null);
    g.cam(at(TENT, -0.2, 1.6), 12);
    const glare = F.acts.walkTo(esau, GRUDGE, 1.4).then(() => F.acts.face(esau, jacob.position));
    await g.talk(L.esau.slice(8, 9));
    await glare;
    await g.talk(L.esau.slice(9));

    // 창 27:42~28:5 리브가가 야곱을 하란으로 보낸다. 가죽을 벗기고 제 옷으로 돌아온다.
    g.cam(at(TENT, -1.2, 0.8), 10);
    const undress = F.acts.walkTo(rebekah, J_ROOM.clone().addScaledVector(ALONG, -0.7), 1.4).then(() => { F.acts.face(rebekah, jacob.position); F.acts.face(jacob, rebekah.position); return Promise.all([skinsOn(false), dye(LINEN)]); });
    await g.talk(L.flee.slice(0, 1));
    await undress;
    await g.talk(L.flee.slice(1, 3));
    // 창 28:1 이삭이 야곱을 불러 축복한다
    g.cam(at(TENT, 0.8, 0.2), 9.5);
    g.stage('tent');
    const call = F.acts.walkTo(jacob, KNEEL, 1.4).then(() => { F.acts.face(jacob, ISAAC); return kneel(jacob, 0.25); }).then(() => reach(isaac, -2.4, 700));
    await g.talk(L.flee.slice(3, 4));
    await call;
    await reach(isaac, 0, 400);
    await stand(jacob);
    g.stage(null);
    // 야곱은 장막 뒤 길목으로 몰래 나가 기다리고, 리브가는 길양식을 싸 들고 화덕 곁에 선다
    F.acts.walkTo(jacob, WAIT, 1.6).then(() => F.acts.face(jacob, TENT));
    bundle.visible = true;
    F.acts.carry(bundle, rebekah);
    F.acts.walkTo(rebekah, R_GIVE, 1.4);
    g.cam(null, 13);
    await g.talk(L.flee.slice(4));

    // 퀘스트 2: 길양식. 리브가에게서 받아 장막 뒤 길목의 야곱에게 건넨다(창 27:43~45, 막간의 "어머니가 싸 준 떡"과 잇는다).
    await g.quest({ title: '길양식', targets: [{ pos: R_GIVE }], text: () => '리브가에게서 길양식 받기', radius: 1.6 });
    F.acts.carry(bundle, g.player);
    await g.quest({ title: '길양식', targets: [{ pos: WAIT }], text: () => '장막 뒤 길목의 야곱에게 길양식 건네기', radius: 1.6 });
    F.acts.carry(bundle, jacob);
    // 쫓기는 사람의 길을 챙김(사랑)
    g.reward('bundle-done', 'questDone', null, 'love');

    // 창 28:10~11 아무도 모르게 떠나 걷는 동안 해가 진다. 한 번 뒤를 돌아본다.
    g.cam(jacob.position, 12);
    const go = F.acts.walkTo(jacob, ROAD, 1.6)
      .then(() => { F.acts.face(jacob, TENT); return F.acts.wait(800); })
      .then(() => F.acts.walkTo(jacob, JACOB, 1.6));
    const dusk = F.acts.sky(0xe8a878, 0.4, 1, 4000);
    await g.talk(L.road.slice(0, 2));
    await Promise.all([go, dusk]);
    F.acts.carry(bundle, null);
    await place(bundle, JACOB.clone().add(V(0.5, -0.3)), 0.12, 300);
    g.cam(JACOB, 13); // 대천사의 안내 동안 돌밭에 선 야곱을 비춘다(관찰자는 아직 장막 곁)
    await g.talk(L.road.slice(2));
    g.cam(null, 13);

    // 퀘스트 3: 돌베개. 돌 셋을 살피고(머무르기), 매끈한 돌을 야곱에게 가져간다.
    await g.quest({
      title: '돌베개',
      targets: STONES.map((p, i) => ({ pos: p, i })),
      text: (t) => `${['날카로운 돌', '큰 바위', '매끈한 돌'][t.i]} 살피기`,
      radius: 1.8, hold: 1, holdLabel: () => '돌을 살피는 중',
      onFound: async (t) => { await g.talk([L.stones[t.i]]); g.reward(`stone/${t.i}`, 'step'); },
    });
    rocks[2].visible = false;
    pillow.visible = true;
    F.acts.carry(pillow, g.player);
    await g.quest({ title: '돌베개', targets: [{ pos: jacob.position }], text: () => '매끈한 돌을 야곱에게 가져가기', radius: 1.8 });
    F.acts.carry(pillow, jacob);
    // 지친 나그네에게 쉴 자리를 마련함(친절)
    g.reward('stone-done', 'questDone', null, 'kindness');

    // 막간: 해 진 들에서 야곱과 대화한다.
    await g.interlude(jacob);

    // 창 28:11 잠: 밤이 되며 별이 돋고, 야곱이 돌을 내려놓고 눕는다
    // 브엘세바와 벧엘을 한 들에 둔 각색이므로, 벧엘의 밤과 아침에는 떠나온 장막 자리를 비운다(카메라가 돌밭을 비춘 뒤)
    [...camp, isaac, rebekah, esau, ...goats, ...kids].forEach((o) => (o.visible = false));
    stars.visible = true;
    await Promise.all([F.acts.night(), tween(1800, (p) => (stars.material.opacity = p))]);
    g.cam(BED, 12);
    g.stage('bed');
    await F.acts.walkTo(jacob, BED, 1.2);
    F.acts.face(jacob, BED.clone().addScaledVector(ALONG, -1));
    await F.acts.bow(jacob, 0.5);
    F.acts.carry(pillow, null);
    await place(pillow, BED.clone().addScaledVector(ALONG, -0.8), 0.12, 500);
    await F.acts.bow(jacob, 0);
    jacob.rotation.y = Math.atan2(ALONG.x, ALONG.z); // 머리가 돌베개 쪽
    await g.talk(L.sleep);
    await F.acts.lie(jacob);

    // 창 28:12 꿈: 층계가 밑동부터 하늘까지 차례로 빛나며 놓이고, 사자들이 오르내린다
    ladder.visible = true;
    steps.forEach((s) => (s.visible = false));
    rails.forEach((r) => (r.visible = false));
    climbers.forEach((a) => (a.visible = false));
    g.cam(MID, 18); // 밑동(누운 야곱)부터 꼭대기 구름까지 한 화면에(가로 화면에서는 대사 창이 아래를 덮는다)
    await tween(1400, (p) => steps.forEach((s, i) => (s.visible = i <= p * RUNG)));
    rails.forEach((r) => (r.visible = true));
    await g.talk(L.dream.slice(0, 2));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(L.dream.slice(2));
    await g.quest({ title: '사닥다리 꿈', targets: [{ pos: LADDER.clone().addScaledVector(ALONG, -1.8).add(V(1, 1)) }], text: () => '사닥다리 곁에 머물러 사자들 지켜보기', radius: 1.8, hold: 2.4, holdLabel: () => '오르내리는 사자들을 보는 중' });
    // 하늘에 닿은 사닥다리 곁에서 조용히 지켜봄(화평)
    g.reward('dream-done', 'questDone', null, 'peace');

    // 창 28:13~15 약속: 사닥다리 꼭대기의 빛
    g.cam(MID.clone().setY(MID.y + 1.5), 18);
    g.stage('ladder');
    await F.acts.presence(TOP.clone().setY(TOP.y - 3.5));
    await g.talk(L.promise);
    F.acts.presence(null);

    // 창 28:16~17 깨어 두려워한다: 층계가 위에서부터 사라지고 아침이 온다. 벌떡 일어나 둘러보고, 뒷걸음질하며 떤다.
    await tween(900, (p) => steps.forEach((s, i) => (s.visible = i < (1 - p) * RUNG)));
    ladder.visible = false;
    await Promise.all([F.acts.day(), tween(1800, (p) => (stars.material.opacity = 1 - p))]);
    stars.visible = false;
    g.cam(BED, 12);
    g.stage('bed');
    await F.acts.lie(jacob, true);
    const look = F.acts.wait(10).then(async () => { F.acts.face(jacob, LADDER); await F.acts.wait(700); F.acts.face(jacob, BED.clone().addScaledVector(ALONG, 2)); await F.acts.wait(700); F.acts.face(jacob, LADDER); });
    await g.talk(L.woke.slice(0, 1));
    await look;
    const fear = F.acts.walkTo(jacob, BED.clone().addScaledVector(ALONG, 0.6).addScaledVector(FRONT, 0.3), 0.9).then(() => { F.acts.face(jacob, LADDER); return tremble(jacob, 1400, 0.05); });
    await g.talk(L.woke.slice(1, 2));
    await fear;
    // 돌베개를 기둥으로 세운다
    await tween(900, (p) => { pillow.scale.set(1 - 0.3 * p, 1 + 3 * easeOut(p), 1 - 0.3 * p); pillow.position.y = 0.12 + 0.35 * easeOut(p); });
    await g.talk(L.woke.slice(2, 3));
    // 도전: 기둥 위에 기름 붓기(창 28:18). 기름이 흐를 길을 놀이판에 따라 긋는다(따라 긋기, F58).
    // 관찰자가 함께 붓고, 부을 때마다 돌이 기름에 젖어 짙어지고 꼭대기에 기름이 고이는 모습은 각색이다.
    pillow.material = pillow.material.clone(); // 들의 다른 돌과 같은 재질을 나눠 쓰므로 기둥만 따로 젖게 한다
    const dry = pillow.material.color.clone(), wet = new THREE.Color(0x8a7448);
    const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 10), new THREE.MeshBasicMaterial({ color: 0xe8c860, transparent: true, opacity: 0.85 }));
    oil.position.copy(pillow.position).setY(pillow.position.y + 0.5);
    oil.scale.setScalar(0.01);
    oil.visible = false;
    F.group.add(oil);
    // PC 화면에서는 놀이판이 화면 가운데를 덮으므로 기둥이 화면 위쪽에 오게 카메라를 앞으로 당긴다
    g.cam(BED.clone().add(V(1.3, 1.3)), 12);
    F.acts.walkTo(jacob, BED.clone().addScaledVector(ALONG, 0.2).add(V(0.4, 0.4)), 1.2).then(() => F.acts.face(jacob, pillow.position));
    await g.challenge({
      title: '돌기둥에 기름 붓기', spots: [{ pos: OIL, text: '야곱과 함께 기둥 위에 기름 붓기', hits: 2 }],
      verb: '기름 붓기', kind: 'trace', fruits: ['peace', 'faith'], radius: 0.9,
      onHit: async (sp, n) => {
        F.acts.speak('jacob');
        oil.visible = true;
        const c0 = pillow.material.color.clone(), c1 = dry.clone().lerp(wet, n / 2), s0 = oil.scale.x;
        await tween(600, (p) => { pillow.material.color.copy(c0).lerp(c1, p); oil.scale.setScalar(Math.max(0.01, s0 + (n / 2 - s0) * easeOut(p))); });
        g.reward(`oil/${n}`, 'step');
      },
    });
    // 하나님을 만난 자리를 거룩히 구별함(창 28:18~22, 신실)
    g.reward('oil-done', 'challenge', null, 'faith');
    g.cam(BED, 12);
    await F.acts.bow(jacob, 0.35);
    await g.talk(L.woke.slice(3, 5));
    g.note('place/bethel');
    await F.acts.bow(jacob, 0);
    // 창 28:19 옛 이름 루스: 카메라가 들 건너 성을 비춘다
    F.acts.face(jacob, LUZ);
    g.cam(LUZ.clone().lerp(BED, 0.35), 13);
    await g.talk(L.woke.slice(5, 6));
    g.cam(BED, 12);
    F.acts.face(jacob, pillow.position);
    await g.talk(L.woke.slice(6));
    g.stage(null);
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-28-15'], memento: 'item/stone-pillow' });
  },
};
