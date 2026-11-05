// 1-13 요셉과 형제들(창 42~46, 49~50장). 창세기의 마지막 스테이지다.
// 곡식 창고 마당: 형들이 엎드림 → 정탐꾼이라 함 → 형들의 뉘우침, 요셉이 돌아서서 욺 → 시므온을 묶어 가둠 → 곡식 받기(도전, catch) → 청지기가 돈을 도로 넣음
// → 가나안 장막: 자루에서 돈뭉치가 나옴, 야곱의 거절, 유다의 담보 → 저녁 막간(유다) → 베냐민과 다시 내려감
// → 요셉의 집: 시므온이 풀려남, 엎드림, 안방에서 욺, 나이 차례로 앉음, 음식 놓기(퀘스트) → 밤에 은잔을 막내의 자루에
// → 성 밖 길: 맏이부터 막내까지 자루 풀기(퀘스트) → 은잔이 나옴, 옷을 찢음 → 요셉의 집: 다시 엎드림, 유다의 간청, 모두 물러가라, "나는 요셉입니다", 껴안음
// → 바로의 수레를 따라 가나안으로(퀘스트) → 야곱의 기운이 살아남 → 고센으로(퀘스트) → 요셉과 야곱이 껴안음 → 창 50:18~21 → 퀴즈(창 50:20).
// 2026-11-05 F61 "뒤로 갈수록 생략되어 있다, 감옥도 감옥 안 같지 않다": 장소를 벽으로 둘러 짓고(지붕 없이 뒤·옆 벽은 높게, 앞벽은 낮게),
// 대사로만 넘기던 사건을 인물의 움직임으로 보여 준다. 각색은 줄마다 주석과 data/brothers.js, docs/review/decisions.md에 적었다.
import * as THREE from 'three';
import { makeField, V } from '../field.js';
import { PAL, mat, makeSack, makeTent } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/brothers.js';

// 화면 자리: s는 화면 오른쪽, d는 카메라 쪽(카메라가 +x, +z에서 내려다본다). 방의 벽을 화면과 나란히 세우려고 이 좌표로 놓는다.
const SD = (s, d) => V((s + d) * Math.SQRT1_2, (d - s) * Math.SQRT1_2);
const START = V(6, 5);
const NAMES = ['맏형 르우벤', '둘째 시므온', '셋째 레위', '넷째 유다', '다섯째 단', '막내 베냐민'];

// 곡식 창고 마당(창 41:56 창고를 열고 팔았다): 화면 가로 5.6, 깊이 4.5, 앞벽 가운데 문
const GR = { s: -5.6, d: -3, w: 5.6, dp: 4.5, door: -5 };
const JOSEPH_GR = SD(-5.6, -4.2);
const SCRIBE = SD(-6.35, -4.45);
const STEWARD_GR = SD(-4.5, -4.25);
const CELL = SD(-7.65, -4.6); // 마당 왼쪽 안의 갇히는 칸(창 42:17 "옥", 42:24)
const BOW_GR = [0, 1, 2, 3, 4].map((i) => SD(-6.75 + i * 0.75, -2.3));
const SACKS = [-7.4, -6.4, -3.8, -2.9].map((s) => SD(s, 0.6)); // 문 앞 빈 자루(곡식 받기 자리)
const DONKEYS = SACKS.map((p) => p.clone().add(SD(0, 1.3)));
// 요셉의 집(창 43:16): 화면 가로 7, 깊이 4.4. 오른쪽 안에 안방(창 43:30)
const HS = { s: 1.9, d: -6, w: 7, dp: 4.4, door: 2 };
const JOSEPH_HALL = SD(-0.7, -5.3);
const HALL_ROW = [0, 1, 2, 3, 4, 5].map((i) => SD(0.1 + i * 0.65, -4.65)); // 맏이 → 막내
const SEATS = [0, 1, 2, 3, 4, 5].map((i) => SD(-0.1 + i * 0.6, -7.15)); // 나이 차례대로 앉는 자리(창 43:33)
const TABLE = SD(1.4, -6.45);
const BY_TABLE = SD(-0.55, -7.4); // 상 왼쪽 끝을 돌아 자리로 들어가는 길목
const JOSEPH_SEAT = SD(-1.05, -6.4);
const INNER = SD(4.7, -7.5); // 안방
const INNER_DOOR = SD(4.7, -6.1);
const STEWARD_HALL = SD(3.9, -5.0), SERVANT_HALL = SD(4.6, -5.0); // 애굽 사람의 상(창 43:32)
const GATE = [0.9, 3.1].map((s) => SD(s, -0.6)); // 성문 기둥 둘(집 앞을 가리지 않게 앞으로 내고 낮춘다)
const OUTSIDE = [SD(-0.4, -2.1), SD(4.4, -2.1)]; // 물러간 애굽 사람이 서는 문밖
const WAGON_PARK = [SD(6.4, -5.2), SD(6.4, -4.0)], WAGON_OUT = [SD(4.6, -1.0), SD(5.8, -1.0)];
const DONKEY_PARK = [0, 1, 2, 3].map((i) => SD(6.6, -2.4 + i * 0.85));
// 성 밖 길(창 44:4): 자루 여섯이 화면 가로로 늘어서고, 형제는 자루 뒤에 선다
const ROW_S = [-0.6, 0.3, 1.2, 2.1, 3.0, 3.9];
const ROW = ROW_S.map((s) => SD(s, 1.3));
const ROW_MEN = ROW_S.map((s) => SD(s, 0.55));
// 가나안 장막
const CANAAN = SD(8.6, 0.6);
const JACOB = SD(7.3, 2.1);
const CAN_ROW = [0, 1, 2, 3, 4, 5].map((i) => SD(3.2 + i * 0.7, 2.3));
const CAN_ARRIVE = SD(7.6, 5.4);
// 고센(창 45:10, 47:27): 장막과 가축
const GOSHEN = SD(-4.6, 2.5);
const JACOB_G = SD(-3.2, 5.4);
const GOSHEN_ROW = [0, 1, 2, 3, 4, 5].map((i) => SD(-6.6 + i * 0.75, 6.6)); // 장막 앞을 비워 엎드린 형들이 장막에 겹치지 않게
const JOSEPH_G = SD(-4.25, 5.6);
const GOSHEN_ARRIVE = SD(-1.2, 7);
const PASTURE = SD(-8.2, 4.4);

export default {
  id: 'brothers',
  data,
  records: ['person/judah', 'person/benjamin', 'item/silver-cup', 'place/goshen', 'item/grain-handful', 'word/gen-50-20'],
  kicker: '애굽의 곡식 창고로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 5020, start: START, sky: 0xe8dcc0, ground: 0xb8aa70,
      stages: {
        granary: { c: SD(-5.3, -0.2), r: 2 }, hall: { c: SD(2, -1.4), r: 1.6 }, road: { c: SD(1.6, 3.2), r: 1.7 },
        canaan: { c: SD(4.9, 3.9), r: 1.5 }, goshen: { c: SD(-4.6, 8.4), r: 1.4 },
      },
      trees: 9, treeKinds: ['palm', 'round'],
      keep: [...SACKS, ...DONKEYS, ...ROW, ...CAN_ROW, CANAAN, GOSHEN, PASTURE, ...WAGON_OUT, ...DONKEY_PARK, ...[0, 1, 2, 3, 4, 5].map((k) => SD(-4 + k * 2.4, 3))],
    });
    const add = (obj, p, y = 0, yaw = 0) => { obj.position.copy(p).setY(y); obj.rotation.y = yaw; F.group.add(obj); return obj; };
    const box = (w, h, d, c) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    // 벽: a에서 b까지, 촘촘한 작은 원으로 막는다(문 자리만 비운다)
    const wall = (a, b, h, m, solid = true) => {
      const len = a.distanceTo(b);
      const w = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.22), m);
      w.position.copy(a).lerp(b, 0.5).setY(h / 2);
      w.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      F.group.add(w);
      if (solid) for (let k = 0, n = Math.max(1, Math.round(len / 0.35)); k <= n; k++) F.block(a.clone().lerp(b, k / n), 0.2);
      return w;
    };
    // 지붕 없는 방: 뒤벽은 높게, 옆벽은 중간, 앞벽은 낮게 두어 위에서 보는 카메라에서도 안이 보인다
    const room = ({ s, d, w, dp, door, wallC, floorC, back = 2, side = 1.1, front = 0.4 }) => {
      const m = mat(wallC);
      const L = s - w / 2, R = s + w / 2, B = d - dp / 2, N = d + dp / 2;
      add(box(w, 0.04, dp, floorC), SD(s, d), 0.02, Math.PI / 4);
      wall(SD(L, B), SD(R, B), back, m);
      wall(SD(L, B), SD(L, N), side, m);
      wall(SD(R, B), SD(R, N), side, m);
      wall(SD(L, N), SD(door - 0.8, N), front, m);
      wall(SD(door + 0.8, N), SD(R, N), front, m);
      for (const k of [-0.8, 0.8]) add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.2, 6), m), SD(door + k, N), 0.6); // 문설주
      for (let a = L + 0.8; a < R; a += 1.2) for (let b = B + 0.8; b < N; b += 1.2) F.keep.push(SD(a, b)); // 방 안에 나무를 심지 않는다
      return { L, R, B, N };
    };
    // 저장 항아리(흙으로 빚은 큰 독)
    const jar = (p) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.11, 0.56, 7), mat(0xb07850));
      body.position.y = 0.28;
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.1, 7), mat(0x9a6440));
      neck.position.y = 0.6;
      g.add(body, neck);
      return add(g, p);
    };
    // 낮은 상(길이는 화면 가로)
    const table = (p, len) => { const t = box(len, 0.26, 0.55, 0x8a6a4a); add(t, p, 0.13, Math.PI / 4); return t; };
    // 음식 한 몫: 접시와 빵·과일
    const dish = (p, y = 0.27) => {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.03, 8), mat(0xd8c8a8));
      const food = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(0xc8843a));
      food.position.y = 0.05;
      g.add(plate, food);
      return add(g, p, y);
    };

    // ---------- 곡식 창고 마당 ----------
    room({ ...GR, wallC: 0xc9a878, floorC: 0xc8b48a });
    // 갇히는 칸: 오른쪽 창살(막힘), 앞 창살은 시므온이 들어간 뒤에 닫힌다(보이기만)
    const barM = mat(0x5a4632);
    const bars = (a, b, solid) => {
      const g = new THREE.Group();
      for (let k = 0; k <= 6; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 4), barM); bar.position.copy(a.clone().lerp(b, k / 6)).setY(0.65); g.add(bar); }
      const top = wall(a, b, 0.08, barM, solid);
      top.position.y = 1.3;
      g.add(top);
      F.group.add(g);
      return g;
    };
    bars(SD(-6.9, -5.25), SD(-6.9, -3.9), true);
    const cellGate = bars(SD(-8.4, -3.9), SD(-6.9, -3.9), false);
    cellGate.visible = false;
    // 요셉의 자리: 단 위의 금빛 의자
    add(box(1.2, 0.12, 1, 0xd8c8a0), SD(-5.6, -4.75), 0.06, Math.PI / 4);
    add(box(0.5, 0.45, 0.5, PAL.gold), SD(-5.6, -4.85), 0.35, Math.PI / 4);
    add(box(0.5, 0.7, 0.08, PAL.gold), SD(-5.6, -5.08), 0.75, Math.PI / 4);
    // 곡식 더미 둘(창 41:49 바다 모래같이 쌓음)과 쌓은 자루
    for (const [p, r, h] of [[SD(-3.45, -4.5), 0.65, 1.1], [SD(-3.4, -3.1), 0.5, 0.8]]) {
      add(new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat(0xd8b860)), p, h / 2);
      F.block(p, r);
    }
    for (const [k, y] of [[0, 0], [0.45, 0], [0.22, 0.5]]) { const s = makeSack(0xd8c8a0); add(s, SD(-4.5 + k, -5.0), y); s.scale.setScalar(0.8); }
    for (const p of [SD(-3.2, -1.2), SD(-3.2, -1.65), SD(-3.65, -1.15), SD(-7.8, -1.2), SD(-7.8, -1.65)]) jar(p);
    // 저울(창 42:25 돈, 곡식을 달아 팖): 받침, 기둥, 가로대, 접시 둘
    {
      const g = new THREE.Group(), brass = 0xb08a40;
      const post = box(0.06, 0.9, 0.06, brass);
      post.position.y = 0.55;
      const beam = box(0.8, 0.04, 0.04, brass);
      beam.position.y = 1.0;
      const base = box(0.4, 0.1, 0.3, 0x8a6a4a);
      base.position.y = 0.05;
      g.add(post, beam, base);
      for (const x of [-0.36, 0.36]) {
        const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.04, 8), mat(brass));
        pan.position.set(x, 0.7, 0);
        const cord = box(0.015, 0.3, 0.015, brass);
        cord.position.set(x, 0.85, 0);
        g.add(pan, cord);
      }
      add(g, SD(-4.1, -4.85), 0, Math.PI / 4);
    }
    // 서기관의 파피루스와 먹 팔레트(곡식을 셈, 창 41:49 "세다가 그쳤다"에 기댄 각색 소품)
    add(box(0.36, 0.02, 0.22, 0xece0b8), SCRIBE.clone().add(SD(0, 0.45)), 0.08, Math.PI / 4);
    add(box(0.16, 0.03, 0.06, 0x3a2a1a), SCRIBE.clone().add(SD(0.3, 0.4)), 0.08, Math.PI / 4);

    // ---------- 요셉의 집 ----------
    room({ ...HS, wallC: 0xe8e0cc, floorC: 0xdcd0b0 });
    add(box(HS.w - 0.3, 0.16, 0.05, 0x3a8a8a), SD(HS.s, HS.d - HS.dp / 2 + 0.14), 1.7, Math.PI / 4); // 뒤벽의 채색 띠
    add(box(HS.w - 0.3, 0.08, 0.05, 0xc0503a), SD(HS.s, HS.d - HS.dp / 2 + 0.14), 1.55, Math.PI / 4);
    // 안방 칸막이(높이 1.1, 안이 반쯤 가려진다)
    const wallH = mat(0xe0d6c0);
    wall(SD(3.8, -8.2), SD(3.8, -6.6), 1.1, wallH);
    wall(SD(3.8, -6.6), SD(4.0, -6.6), 1.1, wallH);
    { const stand = box(0.2, 0.5, 0.2, 0x8a6a4a); add(stand, SD(5.05, -7.85), 0.25); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.1, 8), mat(0xb08a40)); add(bowl, SD(5.05, -7.85), 0.55); } // 얼굴 씻는 대야(창 43:31)
    // 기둥 둘(연꽃 머리)
    for (const s of [-1.1, 3.4]) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 8), mat(0xece4d0)), SD(s, -7.75), 1.1);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.16, 0.3, 8), mat(0x6aa08a)), SD(s, -7.75), 2.3);
      F.block(SD(s, -7.75), 0.22);
    }
    add(box(4.2, 0.02, 1.4, 0xa04a3a), SD(1.4, -6.75), 0.045, Math.PI / 4); // 상 밑 깔개
    table(TABLE, 3.6); // 형제들의 상
    table(SD(-0.95, -5.85), 0.8); // 요셉의 상(따로, 창 43:32)
    table(SD(4.25, -4.45), 1.3); // 애굽 사람의 상(따로)
    dish(SD(-1.1, -5.85));
    dish(SD(-0.8, -5.85));
    dish(SD(4.0, -4.45));
    dish(SD(4.5, -4.45));
    for (const p of [SD(-1.25, -4.3), SD(5.1, -7.0)]) jar(p);
    // 형제들 앞에 놓일 몫(처음에는 보이지 않는다). 베냐민의 몫은 다섯(창 43:34).
    const portions = SEATS.map((p, i) => (i === 5 ? [-0.2, -0.1, 0, 0.1, 0.2] : [0]).map((k, n) => {
      const d = dish(p.clone().add(SD(k, 0.7 + (n % 2) * 0.16)));
      d.visible = false;
      return d;
    }));
    // 성문 기둥 둘과 가로 들보(성 밖과 안을 나눈다)
    for (const p of GATE) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 1.5, 4), mat(0xe0d4b4)), p, 0.75, Math.PI / 4); F.block(p, 0.4); }
    add(box(2.9, 0.22, 0.45, 0xd4c8a8), GATE[0].clone().lerp(GATE[1], 0.5), 1.55, Math.PI / 4);
    // 바로의 수레(창 45:19): 짐칸, 바퀴 둘, 끌채. 처음에는 집 오른쪽 곁에 서 있다.
    const wagons = WAGON_PARK.map((p) => {
      const g = new THREE.Group();
      const bed = box(0.6, 0.22, 0.95, 0x9a7048);
      bed.position.y = 0.42;
      const pole = box(0.06, 0.06, 0.7, 0x6a4a30);
      pole.position.set(0, 0.35, 0.8);
      g.add(bed, pole);
      for (const x of [-0.36, 0.36]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 10), mat(0x5a3a22));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.27, -0.1);
        g.add(wheel);
      }
      return add(g, p, 0, Math.PI / 4);
    });

    // ---------- 가나안과 고센의 장막 ----------
    add(makeTent(0x5a3a28), CANAAN, 0, -Math.PI / 4);
    F.block(CANAAN, 1.2);
    const goshenTent = add(makeTent(0x6a4a30, 1), GOSHEN, 0, -Math.PI / 4);
    for (let i = 0; i < 3; i++) F.animal('sheep', [0xeee8dc, 0xe0d8c8, 0xf4f0e8][i], 0.6, PASTURE.clone().add(SD(i * 0.8 - 0.8, (i % 2) * 0.6)), { roam: 1.2 });

    // ---------- 소품: 자루, 돈뭉치, 은잔, 밧줄, 옷 ----------
    const sacks = SACKS.map((p) => { const s = makeSack(0xd8c8a0); add(s, p); s.scale.setScalar(0.6); return s; });
    const donkeys = DONKEYS.map((p, i) => { const d = F.animal('donkey', [0x8a7a6a, 0x7a6a5a, 0x9a8a7a, 0x6a5a4a][i], 0.8, p, { still: true }); d.userData.yaw = -Math.PI / 4; return d; });
    const rowSacks = ROW.map((p) => { const s = makeSack(0xc8b088); add(s, p); s.visible = false; return s; });
    const silverM = mat(0xd0d4d8, { metalness: 0.6, roughness: 0.35 });
    const bundles = sacks.map(() => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), silverM); b.visible = false; F.group.add(b); return b; });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.2, 8), mat(0xd8dce0, { metalness: 0.6, roughness: 0.3 }));
    cup.visible = false;
    F.group.add(cup);
    const spills = ROW.map((p) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.12, 7), mat(0xd8b860)); add(c, p.clone().add(SD(0.3, 0.2)), 0.06); c.visible = false; return c; });
    const robes = box(0.3, 0.16, 0.22, 0x8fbcd8); // 베냐민에게 준 옷 다섯 벌(창 45:22)
    robes.visible = false;
    F.group.add(robes);

    // ---------- 인물 ----------
    const joseph = F.person('joseph', { hair: 'short', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xf1ead8 }, JOSEPH_GR);
    const gold = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 4, 10), mat(PAL.gold));
    gold.rotation.x = Math.PI / 2;
    gold.position.y = 1.22;
    joseph.userData.rig.add(gold); // 금 사슬(창 41:42)
    const LOOKS = [[0x231a16, 0x9a6b45], [0x3e2a1e, 0x7f8a4a], [0x6b4428, 0xd8c3a0], [0x231a16, 0x5a4a3a], [0x3e2a1e, 0x8a6a4a]];
    const IDS = ['reuben', 'brother1', 'brother2', 'judah', 'brother4']; // 르우벤, 시므온, 레위, 유다, 단
    const brothers = LOOKS.map(([h, c], i) => F.person(IDS[i], { hair: 'short', hairColor: h, beard: 'long', outfit: 'shepherd', outfitColor: c }, SD(-6.9 + i * 0.75, 3.4)));
    const [reuben, simeon, , judah] = brothers;
    const benjamin = F.person('benjamin', { hair: 'curly', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0x8fbcd8 }, SD(7.9, 2.8));
    const jacob = F.person('jacob', { hair: 'short', hairColor: 0xd8d4cc, beard: 'long', outfit: 'robe', outfitColor: 0x6a5a4a, item: 'staff' }, JACOB);
    // 애굽 사람: 청지기, 종, 서기관(말하지 않는다. 수염을 깎고 흰 베옷을 입는다, 창 41:14·42)
    const egyptian = (id, p) => F.person(id, { hair: 'short', hairColor: 0x1a1410, outfit: 'tunic', outfitColor: 0xf4efe0 }, p);
    const steward = egyptian('steward', STEWARD_GR);
    const servant = egyptian('servant2', SERVANT_HALL);
    const scribe = egyptian('scribe', SCRIBE);
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 4, 10), mat(0x8a6a3a));
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.85;
    rope.visible = false;
    simeon.userData.rig.add(rope);

    Object.assign(F, { joseph, brothers, reuben, simeon, judah, benjamin, jacob, steward, servant, scribe, sacks, donkeys, rowSacks, bundles, cup, spills, robes, rope, cellGate, portions, wagons, goshenTent });
    F.spots = {
      start: START, ...Object.fromEntries(BOW_GR.map((p, i) => [`bow${i}`, p])), joseph: JOSEPH_GR, steward: STEWARD_GR, cell: CELL,
      ...Object.fromEntries(SACKS.map((p, i) => [`sack${i}`, p])), canArrive: CAN_ARRIVE, jacob: JACOB,
      ...Object.fromEntries(CAN_ROW.map((p, i) => [`can${i}`, p])), hall: JOSEPH_HALL, ...Object.fromEntries(HALL_ROW.map((p, i) => [`hall${i}`, p])),
      inner: INNER, byTable: BY_TABLE, ...Object.fromEntries(SEATS.map((p, i) => [`seat${i}`, p])), josephSeat: JOSEPH_SEAT, stewardHall: STEWARD_HALL,
      ...Object.fromEntries(ROW_MEN.map((p, i) => [`road${i}`, p])), ...Object.fromEntries(ROW.map((p, i) => [`look${i}`, p.clone().add(SD(0, 0.8))])),
      outside0: OUTSIDE[0], outside1: OUTSIDE[1], goshenArrive: GOSHEN_ARRIVE, jacobG: JACOB_G, josephG: JOSEPH_G, ...Object.fromEntries(GOSHEN_ROW.map((p, i) => [`goshen${i}`, p])),
    };
    F.plant();
    // 수레는 끄는 사람 뒤 1.2를 두고 따라간다
    F.onUpdate((dt) => {
      for (const w of wagons) {
        const lead = w.userData.lead;
        if (!lead) continue;
        const to = lead.position.clone().setY(0).sub(w.position), d = to.length();
        if (d < 1.2) continue;
        to.normalize();
        w.position.addScaledVector(to, Math.min(d - 1.2, dt * Math.min(3, 0.6 + d)));
        w.rotation.y = Math.atan2(to.x, to.z);
      }
    });
    return F;
  },

  async run(g) {
    const { F } = g;
    const { joseph, brothers, reuben, simeon, judah, benjamin, jacob, steward, servant, scribe, sacks, donkeys, rowSacks, bundles, cup, spills, robes, rope, cellGate, portions, wagons } = F;
    const { walkTo, face } = F.acts;
    const all = () => [...brothers, benjamin];
    const at = (fig) => fig.position.clone().setY(0);
    // 앉기(낮은 상 앞에 무릎 꿇고 앉는다)와 일어서기
    const sit = (fig, toward) => {
      if (toward) fig.rotation.y = Math.atan2(toward.x - fig.position.x, toward.z - fig.position.z);
      fig.userData.pose = 'sit';
      const { rig } = fig.userData;
      return tween(450, (p) => { rig.position.y = -0.3 * easeOut(p); rig.rotation.set(0, 0, 0); });
    };
    const stand = (fig) => { const { rig } = fig.userData, y0 = rig.position.y; return tween(400, (p) => (rig.position.y = y0 * (1 - easeOut(p)))).then(() => { fig.userData.pose = null; }); };
    // 울기: 고개를 숙이고 두 손으로 얼굴을 가린 채 어깨를 들썩인다(reach가 작으면 가슴을 움켜쥔다: 옷을 찢음)
    const weep = (fig, ms = 2400, reach = 2.3) => {
      const u = fig.userData;
      u.pose = 'weep';
      return tween(ms, (p) => {
        const k = Math.min(1, p * 5, (1 - p) * 5);
        u.rig.rotation.set(0.32 * k, 0, Math.sin(p * ms / 80) * 0.05 * k);
        u.arms?.forEach((a, i) => { a.rotation.x = -reach * k; a.rotation.z = (i ? 1 : -1) * (0.12 - 0.62 * k); });
      }).then(() => { u.pose = null; u.rig.rotation.set(0, 0, 0); });
    };
    // 놀라 뒷걸음질(돌아서지 않고 물러선다)
    const recoil = (fig, from, dist = 0.5) => {
      const p0 = at(fig), dir = p0.clone().sub(from).setY(0).normalize();
      face(fig, from);
      return tween(500, (p) => fig.position.copy(p0).addScaledVector(dir, dist * easeOut(p)));
    };
    const later = (ms, fn) => tween(ms, () => {}).then(fn);
    // 나귀: 사람을 따라가거나(lead), 한자리에 매어 둔다
    const DONKEY_LEAD = [0, 2, 3, 4];
    const follow = () => donkeys.forEach((d, i) => Object.assign(d.userData, { lead: brothers[DONKEY_LEAD[i]], leadOffset: SD(0.35, -0.75), route: null, still: true }));
    const park = (spots) => donkeys.forEach((d, i) => Object.assign(d.userData, { lead: null, route: [spots[i].clone()], routeT: 0 }));

    g.meet('joseph');

    // ===== 곡식 창고 마당(창 42:1~24) =====
    g.cam(SD(-5.4, -2.4), 13);
    g.stage('granary');
    face(joseph, SD(-5.2, 0));
    sit(scribe, SD(-6.35, 0));
    const arrive = Promise.all(brothers.map((b, i) => walkTo(b, BOW_GR[i], 1.6)));
    await g.talk(data.lines.arrive);
    await arrive;
    brothers.forEach((b) => face(b, JOSEPH_GR));
    await Promise.all(brothers.map((b) => F.acts.prostrate(b, JOSEPH_GR, 0.7))); // 창 42:6 땅에 엎드려 절함(R5)
    await g.talk(data.lines.bow);
    // 창고에 쌓인 곡식 더미를 비추며 꿈을 떠올린다(창 37:7 곡식 단이 절함 → 42:9)
    g.cam(SD(-4.3, -3.6), 11);
    await g.talk(data.lines.dream);
    g.cam(SD(-5.4, -2.4), 13);
    await Promise.all(brothers.map((b) => F.acts.rise(b, 0.7)));
    await g.talk(data.lines.accuse);
    // 형들이 서로 돌아보며 뉘우친다(창 42:21~22). 르우벤이 동생들 쪽으로 돈다.
    brothers.forEach((b, i) => face(b, BOW_GR[i === 0 ? 1 : 0]));
    await g.talk(data.lines.regret);
    // 요셉이 형들에게서 돌아서서 단 뒤로 물러나 운다(창 42:24)
    await walkTo(joseph, SD(-6.3, -3.2), 1.4);
    face(joseph, SD(-8, -6));
    const cry1 = weep(joseph, 2600);
    await g.talk(data.lines.weep);
    await cry1;
    // 시므온을 끌어내어 묶고(창 42:24), 청지기가 칸으로 데려간다. 칸의 앞 창살이 닫힌다.
    await walkTo(joseph, JOSEPH_GR, 1.4);
    face(joseph, BOW_GR[1]);
    brothers.forEach((b) => face(b, JOSEPH_GR));
    await walkTo(steward, BOW_GR[1].clone().add(SD(0.5, -0.45)), 2);
    rope.visible = true;
    simeon.userData.hold = [[0.55, -0.05], [0.55, 0.05]]; // 두 손을 등 뒤로 묶음
    const lead = Promise.all([walkTo(simeon, CELL, 1.1), walkTo(steward, CELL.clone().add(SD(0.7, 0.9)), 1.1)]);
    await g.talk(data.lines.bind);
    await lead;
    face(simeon, SD(-7.65, 0));
    cellGate.visible = true;
    cellGate.scale.y = 0.01;
    await tween(500, (p) => (cellGate.scale.y = Math.max(0.01, easeBack(p))));
    walkTo(steward, STEWARD_GR, 1.6);

    // 도전: 곡식 받기(창 42:25 곡식을 그들의 그릇에 채우고, F58 받기). 자루마다 쏟아지는 곡식을 받으면 자루가 차올라 나귀 등으로 실린다.
    // 각색: 본문에서는 요셉의 사람들이 채운다. 관찰자가 자루를 받쳐 거드는 것은 각색이다.
    face(joseph, SD(-5.2, 0));
    await g.talk(data.lines.fill);
    g.stage(null);
    g.cam(null, 13);
    await g.challenge({
      title: '곡식 자루', spots: SACKS.map((p, i) => ({ pos: p, text: `${['첫째', '둘째', '셋째', '넷째'][i]} 자루에 곡식 받기`, i })),
      verb: '받기', hits: 1, kind: 'catch', hint: '자루를 옮겨 곡식 받기', radius: 1.8, fruits: ['goodness', 'patience'],
      onHit: async (sp) => {
        const s = sacks[sp.i], from = s.position.clone(), to = donkeys[sp.i].position.clone().setY(0.75);
        await tween(400, (p) => s.scale.setScalar(0.6 + 0.4 * easeOut(p)));
        await tween(600, (p) => { s.position.lerpVectors(from, to, easeOut(p)); s.position.y += Math.sin(p * Math.PI) * 0.6; });
        donkeys[sp.i].attach(s); // 나귀와 함께 간다
        g.reward(`sack/${sp.i}`, 'step');
      },
    });
    g.reward('sacks-done', 'challenge', null, 'goodness');
    g.note('item/grain-handful');

    // 청지기가 자루마다 돈을 도로 넣는다(창 42:25). 은빛 돈뭉치가 자루 입구로 들어간다.
    g.cam(SD(-5.2, 1.4), 13);
    const putBack = (async () => {
      for (const [i, d] of donkeys.entries()) {
        await walkTo(steward, d.position.clone().add(SD(-0.6, -0.5)), 2.2);
        const b = bundles[i], top = d.position.clone().setY(1.05);
        b.visible = true;
        await tween(450, (p) => b.position.copy(top).setY(1.5 - 0.45 * easeOut(p)));
        b.visible = false;
      }
      walkTo(steward, SD(1.4, -4.0), 1.6); // 집으로 돌아간다(다음에 요셉의 집에서 맞는다)
    })();
    await g.talk(data.lines.silver.slice(0, 1));
    await putBack;
    // 깊은 대화(요셉): 형들이 떠난 뒤, 창고 안의 요셉에게 가면 열린다(조건이 맞을 때).
    const removeDeep = g.deep(joseph, data.deep);
    await g.talk(data.lines.silver.slice(1));
    // 형들(시므온 빼고 넷)이 나귀를 이끌고 가나안 장막으로 돌아간다. 관찰자도 따라간다.
    follow();
    const homeBros = brothers.filter((b) => b !== simeon);
    homeBros.forEach((b, i) => walkTo(b, CAN_ROW[i], 1.7));
    await g.quest({ title: '가나안으로', targets: [{ pos: CAN_ARRIVE }], text: () => '형들을 따라 가나안 장막으로 가기', radius: 1.8 });
    removeDeep();
    walkTo(joseph, JOSEPH_HALL, 1.6); // 다음에는 집에서 맞는다(화면 밖)

    // ===== 가나안 장막(창 42:29~43:14) =====
    g.cam(SD(5.6, 2.6), 12);
    g.stage('canaan');
    await Promise.all(homeBros.map((b, i) => walkTo(b, CAN_ROW[i], 2)));
    homeBros.forEach((b) => face(b, at(b).add(SD(0, 1))));
    // 자루를 나귀에서 내려 앞에 쏟으니 돈뭉치가 나온다(창 42:35)
    park(CAN_ROW.slice(0, 4).map((p) => p.clone().add(SD(0.2, -1.3))));
    const unload = Promise.all(sacks.map(async (s, i) => {
      F.group.attach(s);
      const from = s.position.clone(), to = CAN_ROW[i].clone().add(SD(0, 0.6));
      await tween(600, (p) => { s.position.lerpVectors(from, to, easeOut(p)); s.position.y = from.y * (1 - p) + Math.sin(p * Math.PI) * 0.3; });
      s.rotation.z = 0.5;
      const b = bundles[i];
      b.visible = true;
      b.scale.setScalar(0.01);
      b.position.copy(to).add(SD(0.25, 0.15)).setY(0.12);
      await tween(500, (p) => b.scale.setScalar(Math.max(0.01, easeBack(p) * 1.3)));
    }));
    await g.talk(data.lines.home.slice(0, 1));
    await unload;
    face(jacob, CAN_ROW[2]);
    homeBros.forEach((b) => recoil(b, at(b).add(SD(0, 0.6)), 0.35)); // 두려워 물러섬
    await g.talk(data.lines.home.slice(1, 4));
    // 흉년이 길어져 곡식이 떨어진다(창 43:1~2). 유다가 아버지 앞으로 나서 담보가 된다(43:8~9).
    bundles.forEach((b) => (b.visible = false));
    await g.talk(data.lines.home.slice(4, 5));
    await walkTo(judah, JACOB.clone().add(SD(-0.9, 0.2)), 1.4);
    face(judah, JACOB);
    face(jacob, at(judah));
    await F.acts.bow(judah, 0.4);
    await g.talk(data.lines.home.slice(5));
    await F.acts.bow(judah, 0);
    g.stage(null);

    // 막간: 해 질 녘 장막 앞에서 유다와 대화한다(창 43:8~10 뒤).
    g.meet('benjamin');
    g.meet('jacob');
    await Promise.all([F.acts.dusk(), walkTo(judah, CAN_ARRIVE.clone().add(SD(-0.9, -0.3)), 1.8)]);
    g.meet('judah');
    await g.interlude(judah);

    // 아침: 야곱이 선물과 두 배의 돈을 들려 보낸다(창 43:11~14). 베냐민도 함께 간다.
    g.stage('canaan');
    g.cam(SD(5.6, 2.6), 12);
    await Promise.all([F.acts.day(), walkTo(judah, CAN_ROW[2], 1.8)]);
    face(jacob, CAN_ROW[2]);
    homeBros.forEach((b) => face(b, JACOB));
    await walkTo(benjamin, CAN_ROW[4], 1.4);
    face(benjamin, JACOB);
    await g.talk(data.lines.depart.slice(0, 2));
    g.stage(null);
    // 애굽으로 내려간다(창 43:15). 걷는 동안 서술하고, 카메라는 요셉의 집을 비춘다.
    sacks.forEach((s, i) => { s.rotation.z = 0; donkeys[i].attach(s); s.position.set(0, 0.95, 0); });
    follow();
    const down = Promise.all([...homeBros, benjamin].map((b, i) => walkTo(b, HALL_ROW[[0, 2, 3, 4, 5][i]], 1.9)));
    // 갇혀 있던 시므온은 청지기가 데리러 간다(창 43:23). 앞 창살을 열고 집으로 데려온다.
    cellGate.visible = false;
    walkTo(simeon, OUTSIDE[0], 1.6);
    await g.talk(data.lines.depart.slice(2));
    g.cam(SD(1.9, -4.6), 13);
    g.stage('hall');
    await g.talk(data.lines.house.slice(0, 2));
    await down;
    park(DONKEY_PARK);
    walkTo(steward, SD(1.3, -4.3), 1.6);
    await g.talk(data.lines.house.slice(2, 3));
    // 시므온이 형들에게로 온다. 청지기가 밧줄을 푼다.
    const freed = walkTo(simeon, HALL_ROW[1], 1.6);
    await g.talk(data.lines.house.slice(3));
    await freed;
    rope.visible = false;
    simeon.userData.hold = null;

    // 요셉이 오자 형들이 엎드린다(창 43:26). 요셉이 베냐민을 본다(43:29).
    walkTo(steward, STEWARD_HALL, 1.6);
    face(joseph, HALL_ROW[3]);
    all().forEach((b) => face(b, JOSEPH_HALL));
    await Promise.all(all().map((b) => F.acts.prostrate(b, JOSEPH_HALL, 0.7))); // 창 43:26 땅에 엎드려 절함
    await g.talk(data.lines.greet.slice(0, 1));
    await Promise.all(all().map((b) => F.acts.rise(b, 0.7)));
    await g.talk(data.lines.greet.slice(1, 2));
    face(joseph, at(benjamin));
    await g.talk(data.lines.greet.slice(2));
    // 요셉이 급히 안방으로 들어가 울고(창 43:30), 얼굴을 씻고 나온다(43:31)
    const go = walkTo(joseph, INNER_DOOR, 2.2).then(() => walkTo(joseph, INNER, 1.6));
    await g.talk(data.lines.inner.slice(0, 1));
    await go;
    face(joseph, SD(4.7, -9));
    await weep(joseph, 2200);
    face(joseph, SD(5.05, -7.85));
    const out = walkTo(joseph, INNER_DOOR, 1.4).then(() => walkTo(joseph, JOSEPH_SEAT, 1.6));
    await g.talk(data.lines.inner.slice(1));

    // 상을 차린다: 요셉도, 형들도, 애굽 사람들도 따로(창 43:32). 형들은 맏이부터 막내까지 차례로 앉는다(43:33).
    const seat = (b, i) => later((5 - i) * 300, () => walkTo(b, BY_TABLE, 1.8)).then(() => walkTo(b, SEATS[i], 1.4)).then(() => sit(b, SEATS[i].clone().add(SD(0, 2))));
    const seated = Promise.all([...all().map(seat), out.then(() => sit(joseph, SEATS[2])), walkTo(servant, SERVANT_HALL, 1.4).then(() => sit(servant, SD(4.6, 0))), walkTo(steward, STEWARD_HALL, 1.4).then(() => sit(steward, SD(3.9, 0)))]);
    await g.talk(data.lines.feast.slice(0, 1));
    await seated;
    all().forEach((b, i) => { b.rotation.y += (i % 2 ? 0.5 : -0.5); }); // 서로 놀라 쳐다봄
    await g.talk(data.lines.feast.slice(1));
    all().forEach((b, i) => { b.rotation.y -= (i % 2 ? 0.5 : -0.5); });
    // 퀘스트: 음식 놓기. 요셉의 상에서 보낸 몫을 형제 앞에 하나씩 놓는다(창 43:34). 베냐민의 자리에는 다섯 몫이 놓인다.
    // 각색: 몫을 나르는 것은 본문에서 요셉의 사람들이다. 관찰자가 거드는 것은 각색이다.
    await g.quest({
      title: '음식 놓기', targets: SEATS.map((p, i) => ({ pos: p.clone().add(SD(0, 1.75)), i })),
      text: (t) => `${NAMES[t.i]} 앞에 음식 놓기`, radius: 0.9, hold: 0.6, holdLabel: () => '음식을 놓는 중',
      onFound: async (t) => {
        for (const d of portions[t.i]) { d.visible = true; d.scale.setScalar(0.01); await tween(220, (p) => d.scale.setScalar(Math.max(0.01, easeBack(p)))); }
        g.reward(`serve/${t.i}`, 'step');
      },
    });
    // 맏이부터 막내까지 빠짐없이 대접함(양선, 창 43:34 각색)
    g.reward('serve-done', 'questDone', null, 'kindness');
    g.cam(SD(1.6, -6.3), 11);
    g.stage('hall');
    await g.talk(data.lines.feasted);

    // 밤: 청지기가 자루를 채우고 은잔을 막내의 자루 맨 위에 넣는다(창 44:1~2)
    rowSacks.forEach((s) => (s.visible = true));
    sacks.forEach((s) => (s.visible = false)); // 나귀 등의 자루는 길가의 자루 여섯으로 바뀐다(화면 밖)
    await F.acts.night();
    await stand(joseph);
    face(joseph, STEWARD_HALL);
    await stand(steward);
    await g.talk(data.lines.cup.slice(0, 1));
    await walkTo(steward, JOSEPH_SEAT.clone().add(SD(0.6, 0.3)), 1.8);
    cup.visible = true;
    F.acts.carry(cup, steward);
    g.cam(SD(2.6, -0.4), 13);
    await walkTo(steward, ROW[5].clone().add(SD(-0.6, -0.4)), 1.8);
    F.acts.carry(cup, null);
    const c0 = cup.position.clone(), c1 = ROW[5].clone().setY(0.6);
    await tween(500, (p) => cup.position.lerpVectors(c0, c1, easeOut(p)));
    cup.visible = false;
    // 이튿날 아침 형들이 떠난다(창 44:3): 자리에서 일어나 집을 나와 자루 뒤에 선다
    g.cam(SD(1.6, -1.6), 14);
    await F.acts.day();
    walkTo(steward, STEWARD_HALL, 1.8);
    walkTo(joseph, JOSEPH_HALL, 1.4);
    await Promise.all(all().map((b) => stand(b)));
    follow();
    const leave = Promise.all(all().map((b, i) => later(i * 250, () => walkTo(b, BY_TABLE, 1.8)).then(() => walkTo(b, ROW_MEN[i], 1.8))));
    await g.talk(data.lines.cup.slice(1));
    await leave;
    all().forEach((b) => face(b, at(b).add(SD(0, 2))));

    // ===== 성 밖 길(창 44:4~13) =====
    g.cam(SD(1.6, 0.6), 13);
    g.stage('road');
    const chase = walkTo(steward, ROW[2].clone().add(SD(0.45, -1.4)), 2.8);
    await g.talk(data.lines.road.slice(0, 1));
    await chase;
    face(steward, at(judah));
    all().forEach((b) => face(b, at(steward)));
    await g.talk(data.lines.road.slice(1, 4));
    // 자루를 내리고 저마다 푼다(창 44:11)
    all().forEach((b) => face(b, at(b).add(SD(0, 2))));
    await Promise.all(all().map((b) => F.acts.bow(b, 0.35, 400)));
    await Promise.all(all().map((b) => F.acts.bow(b, 0, 400)));
    await g.talk(data.lines.road.slice(4));
    g.stage(null);
    // 퀘스트: 맏이의 자루부터 막내의 자루까지 청지기와 함께 차례로 푼다(창 44:12). 청지기는 관찰자의 화면 왼쪽에 선다.
    // 각색: 본문에서는 청지기가 뒤진다. 관찰자가 자루 입구를 함께 푸는 것은 각색이다.
    for (const [i, p] of ROW.entries()) {
      walkTo(steward, p.clone().add(SD(-0.75, 0.55)), 2);
      await g.quest({ title: '은잔', targets: [{ pos: p.clone().add(SD(0, 0.8)) }], text: () => `${NAMES[i]}의 자루 풀어 보기`, radius: 1.2, hold: 0.8, holdLabel: () => '자루를 푸는 중' });
      const s = rowSacks[i];
      await tween(350, (k) => (s.rotation.x = 0.5 * easeOut(k))); // 자루 입구가 열린다
      if (i < 5) { spills[i].visible = true; g.reward(`cup/${i}`, 'step'); }
      else g.reward(`cup/${i}`, 'step');
    }
    // 은잔이 베냐민의 자루에서 나온다
    g.cam(ROW[5].clone().add(SD(-0.6, 0)), 11);
    g.stage('road');
    cup.visible = true;
    cup.position.copy(ROW[5]).setY(0.6);
    await tween(700, (p) => (cup.position.y = 0.6 + easeOut(p) * 0.6));
    g.note('item/silver-cup');
    // 끝까지 차례대로 살핌(인내)
    g.reward('cup-done', 'questDone', null, 'patience');
    face(benjamin, at(cup));
    const tear = Promise.all(brothers.map((b, i) => later(i * 120, () => weep(b, 2200, 1.1)))); // 옷을 찢음(창 44:13): 가슴께 옷을 움켜쥐고 몸을 떤다
    await g.talk(data.lines.found.slice(0, 1));
    await tear;
    // 저마다 자루를 들고 성으로 돌아간다. 은잔은 청지기가 들고 간다.
    F.acts.carry(cup, steward);
    spills.forEach((c) => (c.visible = false));
    rowSacks.forEach((s, i) => { s.rotation.x = 0; F.acts.carry(s, all()[i]); });
    g.cam(SD(1.9, -4.6), 13);
    const ret = Promise.all([...all().map((b, i) => later(i * 200, () => walkTo(b, HALL_ROW[i], 1.8))), walkTo(steward, STEWARD_HALL, 1.8)]);
    await g.talk(data.lines.found.slice(1));
    await ret;
    park(DONKEY_PARK);
    rowSacks.forEach((s, i) => { F.acts.carry(s, null); s.position.copy(HALL_ROW[i]).add(SD(0.3, 0.35)).setY(0); });
    F.acts.carry(cup, null);
    cup.position.copy(SD(4.0, -4.45)).setY(0.33); // 애굽 사람의 상 위

    // ===== 요셉의 집, 다시(창 44:14~45:15) =====
    g.stage('hall');
    face(joseph, HALL_ROW[3]);
    all().forEach((b) => face(b, JOSEPH_HALL));
    await Promise.all(all().map((b) => F.acts.prostrate(b, JOSEPH_HALL, 0.7))); // 창 44:14 땅에 엎드림
    await g.talk(data.lines.back.slice(0, 1));
    await Promise.all(all().map((b) => F.acts.rise(b, 0.7)));
    await g.talk(data.lines.back.slice(1));
    // 유다의 간청: 요셉에게 가까이 다가가 고개를 숙인다(창 44:18)
    const step = walkTo(judah, JOSEPH_HALL.clone().add(SD(0.85, 0.35)), 1.2);
    await g.talk(data.lines.plea.slice(0, 1));
    await step;
    face(judah, JOSEPH_HALL);
    face(joseph, at(judah));
    await F.acts.bow(judah, 0.45);
    await g.talk(data.lines.plea.slice(1));
    await F.acts.bow(judah, 0);
    // 모두 물러가라(창 45:1): 청지기와 종이 문밖으로 나간다
    await g.talk(data.lines.clear.slice(0, 1));
    await stand(servant);
    const leaveHall = Promise.all([walkTo(steward, OUTSIDE[0], 2), walkTo(servant, OUTSIDE[1], 2)]);
    await g.talk(data.lines.clear.slice(1, 2));
    await leaveHall;
    // 요셉이 소리 내어 운다(창 45:2). 문밖의 애굽 사람들이 돌아본다.
    const cry2 = weep(joseph, 3000);
    later(900, () => { face(steward, JOSEPH_HALL); face(servant, JOSEPH_HALL); });
    await g.talk(data.lines.clear.slice(2));
    await cry2;
    // "나는 요셉입니다"(창 45:3): 형들이 놀라 뒷걸음질한다
    face(joseph, HALL_ROW[3]);
    await g.talk(data.lines.reveal.slice(0, 1));
    await Promise.all(all().map((b) => recoil(b, JOSEPH_HALL, 0.45)));
    await g.talk(data.lines.reveal.slice(1));
    // "내게 가까이 오십시오"(창 45:4): 형들이 다가온다
    const nearer = Promise.all(all().map((b, i) => walkTo(b, HALL_ROW[i].clone().add(SD(-0.2, -0.35)), 1)));
    await g.talk(data.lines.near.slice(0, 1));
    await nearer;
    all().forEach((b) => face(b, JOSEPH_HALL));
    await g.talk(data.lines.near.slice(1));
    // 요셉이 베냐민의 목을 안고 울고(창 45:14), 형들과 하나하나 입 맞춘다(45:15)
    const hug = F.acts.embrace(joseph, benjamin);
    await g.talk(data.lines.hug.slice(0, 1));
    await hug;
    const kiss = (async () => {
      for (const b of [...brothers].reverse()) {
        await walkTo(joseph, at(b).add(SD(0, -0.6)), 2);
        face(joseph, at(b));
        face(b, at(joseph));
        await Promise.all([F.acts.bow(joseph, 0.25, 300), F.acts.bow(b, 0.25, 300)]);
        await Promise.all([F.acts.bow(joseph, 0, 300), F.acts.bow(b, 0, 300)]);
      }
    })();
    await g.talk(data.lines.hug.slice(1));
    await kiss;
    g.note('place/goshen');

    // 바로의 수레(창 45:16~19)가 성문 밖으로 나오고, 요셉이 베냐민에게 옷 다섯 벌을 건넨다(45:22)
    g.cam(SD(2.6, -3.4), 14);
    const roll = Promise.all(wagons.map((w, i) => { const a = w.position.clone(), b = WAGON_OUT[i]; return tween(2400, (p) => w.position.lerpVectors(a, b, easeOut(p))); }));
    await g.talk(data.lines.wagons.slice(0, 1));
    await roll;
    face(joseph, at(benjamin));
    robes.visible = true;
    F.acts.carry(robes, joseph);
    await walkTo(joseph, at(benjamin).add(SD(-0.7, 0)), 1.4);
    face(joseph, at(benjamin));
    face(benjamin, at(joseph));
    await g.talk(data.lines.wagons.slice(1, 2));
    F.acts.carry(robes, benjamin);
    await F.acts.wait(500);
    await g.talk(data.lines.wagons.slice(2));
    g.stage(null);

    // 수레를 따라 가나안으로(창 45:24~25). 유다와 르우벤이 수레를 끈다(각색).
    follow();
    wagons[0].userData.lead = judah;
    wagons[1].userData.lead = reuben;
    all().forEach((b, i) => walkTo(b, CAN_ROW[i], 1.7));
    await g.quest({ title: '가나안으로', targets: [{ pos: CAN_ARRIVE }], text: () => '수레를 따라 가나안 장막으로 가기', radius: 1.8 });

    // ===== 가나안, 다시(창 45:25~28) =====
    g.cam(SD(5.8, 2.2), 12);
    g.stage('canaan');
    await Promise.all(all().map((b, i) => walkTo(b, CAN_ROW[i], 2)));
    all().forEach((b) => face(b, JACOB));
    F.acts.carry(robes, null);
    robes.visible = false;
    face(jacob, CAN_ROW[3]);
    await g.talk(data.lines.revive.slice(0, 1));
    // 야곱이 믿지 못해 고개를 떨군다(창 45:26 "마음이 어리둥절하였다") → 수레를 보고 고개를 들어 수레 쪽으로 걸어간다(45:27)
    await F.acts.bow(jacob, 0.35, 900);
    face(jacob, at(wagons[0]));
    const look = F.acts.bow(jacob, 0, 1200).then(() => walkTo(jacob, at(wagons[0]).add(SD(0.9, 0.3)), 0.9));
    await g.talk(data.lines.revive.slice(1, 2));
    await look;
    face(jacob, at(wagons[0]));
    F.acts.speak('jacob');
    await g.talk(data.lines.revive.slice(2));
    g.stage(null);

    // ===== 고센(창 46:5~30, 47:27, 49:33, 50:15~21) =====
    // 온 집안이 수레와 함께 고센으로 내려간다. 요셉도 집에서 고센으로 올라온다.
    wagons[0].userData.lead = jacob;
    const family = Promise.all([walkTo(jacob, JACOB_G, 1.5), ...all().map((b, i) => walkTo(b, GOSHEN_ROW[i], 1.6))]);
    await g.talk(data.lines.goshen.slice(0, 1));
    await g.quest({ title: '고센으로', targets: [{ pos: GOSHEN_ARRIVE }], text: () => '야곱의 집안을 따라 고센으로 가기', radius: 1.8 });
    g.cam(SD(-4.2, 5.4), 12);
    g.stage('goshen');
    park([0, 1, 2, 3].map((i) => SD(-2.0 + i * 0.7, 2.5)));
    await Promise.all([family, walkTo(joseph, JOSEPH_G, 2)]);
    const meet = F.acts.embrace(joseph, jacob, 2400); // 창 46:29 아버지의 목을 안고 한참 욺
    await g.talk(data.lines.goshen.slice(1, 2));
    await meet;
    await g.talk(data.lines.goshen.slice(2));
    // 여러 해가 흐른다. 야곱은 장막 안으로 들어가고(창 49:33), 하늘빛이 한 번 저물었다 밝아진다.
    const inTent = walkTo(jacob, GOSHEN.clone().add(SD(0, 1.2)), 0.9).then(async () => {
      const a = at(jacob);
      await tween(700, (p) => jacob.position.lerpVectors(a, GOSHEN, p));
      jacob.visible = false;
    });
    await g.talk(data.lines.years.slice(0, 1));
    await Promise.all([inTent, F.acts.dusk()]);
    await g.talk(data.lines.years.slice(1));
    await F.acts.day();

    // 창 50:15~21
    await walkTo(joseph, JOSEPH_G, 1.4);
    face(joseph, GOSHEN_ROW[2]);
    all().forEach((b) => face(b, JOSEPH_G));
    await Promise.all(all().map((b) => F.acts.prostrate(b, JOSEPH_G, 0.7))); // 창 50:18 그의 앞에 엎드림(R5)
    await g.talk(data.lines.end.slice(0, 3));
    await Promise.all(all().map((b) => F.acts.rise(b, 0.7)));
    await g.talk(data.lines.end.slice(3, 5));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.end.slice(5));
    await g.finish({ words: ['word/gen-50-20'], memento: 'item/grain-handful' });
  },
};
