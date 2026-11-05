// 1-11 얍복 강과 화해(창 32~33장): 하란의 스무 해는 서술 → 두 무리로 나눔(32:7) → 깊은 대화(야곱, 조건)
// → 예물 떼를 사이를 두고 앞서 보냄(퀘스트, 32:13~21) → 밤, 식구와 떼가 여울을 건넘(퀘스트, 32:22~23)
// → 홀로 남은 야곱에게 돌아가기 → 밤새 씨름(도전) → 새벽, 이스라엘과 브니엘 → 해 돋을 때 절뚝이며 여울을 건넘(퀘스트, 32:31)
// → 에서와 사백 명이 옴, 식구를 차례로 세움(퀘스트, 33:1~2) → 일곱 번 엎드림, 달려와 안음(33:3~4) → 식구들이 차례로 절함(33:5~7)
// → 예물 떼(33:8) → 막간(에서) → 창 33:10~11 예물을 받음 → 퀴즈(창 32:28)
// 장소(2026-11-05 F61 "장면이 생략되어 있다, 장소가 그곳 같지 않다"): 골짜기 사이를 흐르는 강, 여울과 두 줄 디딤돌, 강가 바위·갈대,
// 이쪽 둑의 장막, 건너편 둑에서 고개(산 사이 틈)로 오르는 너른 길. 밤과 새벽은 하늘빛과 햇빛 색으로 보인다
// (정사영 카메라라 하늘이 산줄기 틈으로만 보여 별·해 물체는 두지 않았다).
// 각색: 예물 떼(암염소 이백 … 새끼 나귀 열)는 떼마다 두 마리와 종 하나로, 사백 명은 앞의 네 사람과 길을 메운 실루엣 예순으로 줄였다.
// 식구는 두 여종과 아이 둘, 레아와 아이 둘, 라헬과 요셉 아홉으로 줄였다(열한 아들, 창 32:22). 관찰자가 떼를 보내고 줄을 세우는 일은 각색이다.
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, setArms, makeTent, makeTree } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/jabbok.js';

const ALONG = V(1, -1).normalize(); // 강이 흐르는 방향(화면 가로)
const FRONT = V(1, 1).normalize(); // 카메라 쪽 = 이쪽 둑
const FORD = V(0, 0); // 얍복 나루(여울)
// 나루 기준 자리: a는 강을 따라(화면 오른쪽 +), f는 강을 가로질러(이쪽 둑 +, 건너편 둑 -)
const P = (a, f) => FORD.clone().addScaledVector(ALONG, a).addScaledVector(FRONT, f);
const RIVER = 1.2; // 강 반폭
const START = V(6, 5);
const CAMP = P(-1.4, 3.4); // 이쪽 둑의 야곱 장막 앞
const WRESTLE = P(2.6, 3); // 홀로 남아 씨름한 자리
const FAR = P(-1.6, -2.6); // 건너편 둑, 떼를 맞아들이는 자리
const LANDING = P(0.6, -2.8); // 해 돋을 때 야곱이 건너와 서는 자리
const JFRONT = P(0.8, -5); // 식구들 앞(창 33:3 "앞서 나아가")
const ESAU_STOP = P(2, -9.6); // 에서가 멈춰 바라본 자리
const TO_ESAU = ESAU_STOP.clone().sub(JFRONT).normalize();
const JEND = JFRONT.clone().addScaledVector(TO_ESAU, 1.4); // 일곱 번 엎드리며 다가간 끝
const MEET = JEND.clone().addScaledVector(TO_ESAU, 0.65); // 둘이 껴안는 자리
const ROAD = [P(1.2, -1.8), P(2.6, -12), P(3.2, -19.5)]; // 건너편 둑에서 고개로 오르는 길
// 예물 떼 다섯(창 32:14~15). 떼마다 두 마리와 모는 종 하나. 기다리는 자리는 이쪽 둑 오른쪽에 사이를 두고 늘어선다.
const DROVES = [
  { text: '염소 떼를 앞서 보내기', beasts: [['goat', 0x5a4636, 0.6], ['goat', 0x3a2e26, 0.7, true]] },
  { text: '양 떼를 앞서 보내기', beasts: [['sheep', 0xf2efe6, 0.75], ['ram', 0xe8e2d4, 0.8]] },
  { text: '낙타와 새끼를 앞서 보내기', beasts: [['camel', 0xc8a070, 0.85], ['camel', 0xd8b488, 0.5]] },
  { text: '암소와 황소를 앞서 보내기', beasts: [['cow', 0x8a5a3a, 0.8], ['cow', 0x4a3426, 0.95]] },
  { text: '나귀와 새끼를 앞서 보내기', beasts: [['donkey', 0x8a7a6a, 0.8], ['donkey', 0x9a8a7a, 0.5]] },
].map((d, i) => ({ ...d, at: P(3.4 + i * 1.5, 4.6 - (i % 2) * 0.7), meet: [P(4.2, -6.2), P(5.6, -6.8), P(7, -7.4), P(4.8, -8), P(6.2, -8.6)][i] }));
// 식구 아홉: 0~3 두 여종(빌하, 실바)과 아이 둘, 4~6 레아와 아이 둘, 7 라헬, 8 요셉. 창 33:2의 차례대로 묶는다.
const GROUPS = [[0, 1, 2, 3], [4, 5, 6], [7, 8]];
const LINE_TEXT = ['여종들과 아이들을 맨 앞에 세우기', '레아와 아이들을 다음에 세우기', '라헬과 요셉을 맨 뒤에 세우기'];
const HOME = (j) => P(-2.6 - (j % 3) * 0.85, 2.4 + Math.floor(j / 3) * 0.85); // 처음 장막 앞
const CAMP_B = (j) => P(-7.2 - (j % 2) * 0.85, 2.3 + Math.floor(j / 2) * 0.85); // 두 무리로 나눌 때 여종들 쪽(창 32:7~8)
const NIGHT = (j) => P(-3.4 - (j % 5) * 0.8, -2.6 - Math.floor(j / 5) * 0.9); // 건너편 둑에서 밤을 지낸 자리
const ROWS = [[P(-3.4, -4.8), P(-2.5, -4.8), P(-1.6, -4.8), P(-0.7, -4.8)], [P(-2.9, -3.6), P(-2, -3.6), P(-1.1, -3.6)], [P(-2.4, -2.4), P(-1.5, -2.4)]];

// 염소: 공용 짐승(generic)에 뒤로 젖힌 뿔, 턱수염, 치켜든 짧은 꼬리를 더한다(이 장면에만 나와 스테이지 파일에 둔다, art-3d.md)
function addGoatLook(an, s, male) {
  const { body } = an.userData;
  const horn = mat(PAL.horn), dark = mat(0x2a211a);
  const box = (w, h, d, x, y, z, m, rz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, d * s), m); b.position.set(x * s, y * s, z * s); b.rotation.z = rz; body.add(b); };
  for (const z of [-1, 1]) box(0.07, male ? 0.42 : 0.24, 0.07, 0.56, 1.2, z * 0.1, horn, 0.55);
  box(0.08, 0.2, 0.08, 0.8, 0.62, 0, dark, 0);
  box(0.08, 0.22, 0.08, -0.54, 0.95, 0, dark, -0.6);
}

export default {
  id: 'jabbok',
  data,
  records: ['place/jabbok', 'place/peniel', 'person/the-man', 'creature/goat', 'item/jacob-staff', 'word/gen-32-28'],
  kicker: '얍복 강가로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 3228, start: START, sky: 0xd0d8c8, ground: 0x7f9a5a,
      stages: { wrestle: { c: toCam(WRESTLE, 1.4), r: 2 }, meet: { c: toCam(MEET, 1.2), r: 2.2 } },
      trees: 0,
    });
    const rand = F.rand;
    const add = (geo, m, p, y = 0) => { const o = new THREE.Mesh(geo, m); o.position.copy(p).setY(y); F.group.add(o); return o; };
    const yawOf = (d) => Math.atan2(d.x, d.z);
    // 강: 깊은 물줄기(폭 2.4)와 여울의 얕은 물빛. 여울(가운데 폭 1.6) 말고는 막는다.
    const river = add(new THREE.BoxGeometry(30, 0.04, RIVER * 2), mat(0x3f6f8a), FORD, 0.02);
    river.rotation.y = -Math.atan2(ALONG.z, ALONG.x);
    const shallow = add(new THREE.BoxGeometry(2, 0.04, RIVER * 2), mat(0x8cb8c4), FORD, 0.03);
    shallow.rotation.y = river.rotation.y;
    for (let k = -15; k <= 15; k += 0.5) if (Math.abs(k) >= 2) F.block(P(k, 0), RIVER);
    // 여울을 건너는 디딤돌 두 줄
    const stoneM = mat(0xa39a8a);
    for (const a of [-0.45, 0.45]) for (let f = -1; f <= 1.01; f += 0.5) add(new THREE.CylinderGeometry(0.2, 0.25, 0.1, 6), stoneM, P(a + (f * 7 % 0.1), f), 0.06);
    // 강가 바위(막음)와 갈대 덤불(막지 않음)
    const rockM = [mat(0x8a8274), mat(0x6f685c)];
    for (const [a, f, r] of [[-4.6, 1.5, 0.4], [3.4, 1.55, 0.35], [-8.4, -1.5, 0.45], [8.6, 1.5, 0.4], [6, -1.55, 0.4], [-11, 1.6, 0.5], [-3.6, -1.5, 0.3]]) {
      const rock = add(new THREE.DodecahedronGeometry(r, 0), rockM[Math.round(a) & 1], P(a, f), r * 0.4);
      rock.scale.set(1.2, 0.8, 1);
      F.block(P(a, f), r);
    }
    const reed = mat(0x8a9a4a), reedTop = mat(0x6b5a3a);
    for (const [a, f] of [[-6.4, 1.45], [-2.6, 1.45], [2.4, 1.4], [5, 1.45], [7.2, 1.4], [-9.6, 1.45], [-6, -1.45], [-1.8, -1.4], [3, -1.45], [8.4, -1.45], [-10.2, -1.4]]) {
      for (let k = 0; k < 6; k++) {
        const h = 0.5 + rand() * 0.4, p = P(a + (rand() - 0.5) * 0.7, f + (rand() - 0.5) * 0.3);
        const st = add(new THREE.BoxGeometry(0.05, h, 0.05), reed, p, h / 2);
        st.rotation.z = (rand() - 0.5) * 0.3;
        add(new THREE.BoxGeometry(0.08, 0.14, 0.08), reedTop, p, h);
      }
    }
    // 골짜기: 강 양 끝은 두 둑 모두 바위 언덕으로 막히고, 건너편 멀리 산줄기 가운데 고개가 트였다
    const hillM = [mat(0x8a7a64), mat(0x7a6c58), mat(0x95866c)];
    const hill = (p, rx, h, rz) => {
      const m = add(new THREE.DodecahedronGeometry(1, 0), hillM[Math.floor(rand() * 3)], p, 0);
      m.scale.set(rx, h, rz);
      m.rotation.y = rand() * Math.PI;
      if (p.length() < 13.5) F.block(p, Math.min(rx, rz) * 0.85);
    };
    for (const s of [-1, 1]) for (const f of [-1, 1]) {
      hill(P(s * 12.2, f * 3.6), 2.2, 2.6, 2.2);
      hill(P(s * 13.6, f * 6.6), 2.6, 3.6, 2.6);
      hill(P(s * 15, f * 2.6), 2, 2.2, 2);
    }
    for (let a = -17; a <= 17; a += 2.3) if (Math.abs(a - 3.2) > 3.6) hill(P(a, -14.6 - rand() * 1.6), 1.8 + rand() * 0.6, 3.2 + rand() * 2.6 + Math.abs(a) * 0.08, 2.4);
    hill(P(0.2, -14.2), 1.4, 4, 1.8); // 고개 양쪽 바위벽
    hill(P(6, -14.4), 1.6, 4.4, 1.8);
    // 길: 건너편 둑에서 고개까지 흙길, 땅 끝에서는 고개로 오르는 비탈
    const dirt = mat(0xb39b72);
    const road = add(new THREE.BoxGeometry(1.8, 0.03, ROAD[0].distanceTo(ROAD[1])), dirt, ROAD[0].clone().lerp(ROAD[1], 0.5), 0.015);
    road.rotation.y = yawOf(ROAD[1].clone().sub(ROAD[0]));
    const SLOPE = 0.5, run = ROAD[1].distanceTo(ROAD[2]);
    const ramp = add(new THREE.BoxGeometry(2.4, 0.2, run / Math.cos(Math.atan(SLOPE))), dirt, ROAD[1].clone().lerp(ROAD[2], 0.5), run * SLOPE / 2 - 0.1);
    ramp.rotation.order = 'YXZ';
    ramp.rotation.y = yawOf(ROAD[1].clone().sub(ROAD[2]));
    ramp.rotation.x = Math.atan(SLOPE);
    // 장막 둘(이쪽 둑)과 강가 나무
    F.put(makeTent(0x6b4a32, 1), P(-6.6, 5.6), 1.1, 0.4);
    F.put(makeTent(0x8a6a4a, 0.9), P(-3.6, 6.6), 1, -0.3);
    for (const [a, f, s, kind] of [[-8.6, -4.6, 1.1, 'round'], [-7.2, -7.2, 1, 'pine'], [8.6, -4, 1.1, 'round'], [9.4, -6.6, 1, 'pine'], [-9.8, 6.8, 1, 'round'], [6.6, -10, 0.9, 'pine'], [-4.6, -9.4, 1, 'round']]) {
      const tree = makeTree(kind);
      tree.position.copy(P(a, f));
      tree.scale.setScalar(s);
      F.group.add(tree);
      F.block(P(a, f), 0.35 * s);
    }

    const jacob = F.person('jacob', { hair: 'short', hairColor: 0x6b4428, beard: 'long', outfit: 'traveler', outfitColor: 0x8a6a4a, item: 'staff' }, CAMP);
    const family = [
      { hair: 'long', hairColor: 0x231a16, outfit: 'robe', outfitColor: 0x8a7a5a },
      { hair: 'braid', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0x6a7a5a },
      { hair: 'short', hairColor: 0x231a16, outfit: 'tunic', outfitColor: 0xc8b088, height: 0.7 },
      { hair: 'curly', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0x9a6b45, height: 0.65 },
      { hair: 'long', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0x6e3f73 },
      { hair: 'short', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0xa08060, height: 0.85 },
      { hair: 'curly', hairColor: 0x231a16, outfit: 'tunic', outfitColor: 0x7f5a3a, height: 0.75 },
      { hair: 'braid', hairColor: 0x231a16, outfit: 'robe', outfitColor: 0xb8452f },
      { hair: 'short', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0xd8c3a0, height: 0.6 },
    ].map((spec, j) => F.person(`family${j}`, spec, HOME(j)));
    // 야곱의 떼: 처음부터 두 무리 쪽에 나뉘어 있다
    const flock = [['sheep', 0xf5f5f0, 0.8, P(-1.6, 5)], ['sheep', 0xeeeae0, 0.75, P(-0.9, 5.7)], ['generic', 0x5a4a3a, 0.7, P(-9.4, 4.4)], ['camel', 0xc8a070, 0.85, P(-8.6, 5.2)]]
      .map(([k, c, s, p]) => F.animal(k, c, s, p, { roam: 0.5 }));
    addGoatLook(flock[2], 0.7, false);
    // 예물 떼와 모는 종
    for (const [i, d] of DROVES.entries()) {
      d.animals = d.beasts.map(([kind, c, s, male], j) => {
        const an = F.animal(kind === 'goat' ? 'generic' : kind, c, s, d.at.clone().addScaledVector(ALONG, j ? 0.4 : -0.4).addScaledVector(FRONT, 0.3), { roam: 0.3 });
        if (kind === 'goat') addGoatLook(an, s, male);
        return an;
      });
      d.drover = F.person(`drover${i}`, { hair: 'short', hairColor: PAL.hairDark, outfit: 'shepherd', outfitColor: [0x9a6b45, 0x7f6a4a, 0x8a5a3a, 0x6b5a3a, 0xa08060][i], item: 'staff' }, d.at.clone().addScaledVector(FRONT, -0.7));
    }
    // 그 사람: 얼굴 없는 빛나는 형체(창 32:24, 32:30)
    const man = F.person('man', { ghost: 0xe8e0ff, skin: 0xe8e0ff, hair: 'none', hairColor: 0xffffff, outfit: 'robe', outfitColor: 0xffffff }, WRESTLE.clone().addScaledVector(ALONG, 0.7));
    man.visible = false;
    const esau = F.person('esau', { hair: 'curly', hairColor: 0x8a4f2c, beard: 'long', outfit: 'shepherd', outfitColor: 0x9a6b45 }, P(2.2, -11.2));
    const men = [0, 1, 2, 3].map((i) => F.person(`esau-man${i}`, { hair: 'short', hairColor: PAL.hairDark, outfit: 'tunic', outfitColor: 0x7f5a3a }, P(0.4 + i * 1.0, -11.6)));
    [esau, ...men].forEach((f) => (f.visible = false));
    // 사백 명(창 33:1): 길과 고개 비탈을 메운 실루엣 예순. 한 덩어리(InstancedMesh)로 그리고 march(0~1)만큼 길을 내려온다.
    const N = 60;
    const crowdAt = [];
    for (let i = 0; i < N; i++) {
      const f = -10.9 - (i / N) * 8.4 - rand() * 0.3;
      const spread = f > -12.3 ? 1.5 : 0.9;
      crowdAt.push([2.4 + (-10.9 - f) * 0.09 + (rand() - 0.5) * 2 * spread, f]);
    }
    const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.72, 0.26).translate(0, 0.36, 0), mat(0xffffff), N);
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.22, 0.22).translate(0, 0.86, 0), mat(0x9a6a48), N);
    const tunics = [0x7f5a3a, 0x6b4a32, 0x8a6a4a, 0x5a4636, 0x9a7a5a].map((c) => new THREE.Color(c));
    for (let i = 0; i < N; i++) bodies.setColorAt(i, tunics[i % tunics.length]);
    const crowd = new THREE.Group();
    crowd.add(bodies, heads);
    crowd.visible = false;
    bodies.frustumCulled = heads.frustumCulled = false;
    F.group.add(crowd);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(FRONT.x, FRONT.z)), one = new THREE.Vector3(1, 1, 1);
    let shown = -1;
    const march = { k: 0 };
    F.onUpdate(() => {
      if (!crowd.visible || march.k === shown) return;
      shown = march.k;
      crowdAt.forEach(([a, f], i) => {
        const ff = f - 1.6 * (1 - march.k);
        const y = ff < -12 ? (-12 - ff) * SLOPE : 0;
        const p = P(a, ff).setY(y);
        m4.compose(p, q, one);
        bodies.setMatrixAt(i, m4);
        heads.setMatrixAt(i, m4);
      });
      bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
    });

    Object.assign(F, { jacob, family, flock, man, esau, men, crowd, march });
    F.spots = { start: START, camp: CAMP, ...Object.fromEntries(DROVES.map((d, i) => [`drove${i}`, d.at])), ford: FORD, far: FAR, wrestle: WRESTLE, landing: LANDING, front: JFRONT, meet: MEET, esau: ESAU_STOP };
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { jacob, family, flock, man, esau, men, crowd, march } = F;
    const L = data.lines;
    g.cam(null, 13);
    await g.talk(L.arrive.slice(0, 3));
    g.meet('jacob');
    // 창 32:7 두 무리로 나눈다: 여종들과 아이들이 떼가 있는 왼쪽 장막 쪽으로 옮겨 간다
    GROUPS[0].forEach((j) => F.acts.walkTo(family[j], CAMP_B(j), 1.2));
    await g.talk(L.arrive.slice(3, 4));
    F.acts.face(jacob, FORD);
    await F.acts.bow(jacob, 0.35);
    await g.talk(L.arrive.slice(4, 5));
    await F.acts.bow(jacob, 0);
    const dusk = F.acts.dusk();
    // 창 32:13~20 예물: 카메라가 떼를 비추고 야곱이 종들에게 이른다
    g.cam(DROVES[2].at, 13);
    await g.talk(L.gift.slice(0, 3));
    F.acts.face(jacob, DROVES[0].at);
    await g.talk(L.gift.slice(3));
    await dusk;
    g.cam(null, 13);

    // 깊은 대화(야곱): 예물을 보내는 동안 야곱 곁에 가면 열린다.
    const removeDeep = g.deep(jacob, data.deep);
    // 퀘스트 1: 예물 떼를 하나씩 보낸다. 떼마다 종이 뒤에서 몰고, 여울을 건너 고개 길로 올라가 사라진다(떼와 떼 사이가 벌어진다, 창 32:16).
    await g.quest({
      title: '앞서 보내는 예물',
      targets: DROVES.map((d, i) => ({ pos: d.at.clone().addScaledVector(FRONT, 0.9), i })),
      text: (t) => DROVES[t.i].text,
      radius: 1.3, hold: 0.8, holdLabel: () => '떼를 모는 중',
      onFound: async (t) => {
        const d = DROVES[t.i];
        d.animals.forEach((an, j) => {
          const off = j ? 0.25 : -0.25;
          Object.assign(an.userData, { route: [P(off, RIVER + 0.8), P(off, -RIVER - 0.8), ROAD[0].clone(), P(2.2, -8.5), P(2.6, -11.6)], onArrive: () => (an.visible = false) });
        });
        F.acts.wait(700).then(() => F.acts.walkTo(d.drover, P(2.4, -11.2), 1.3)).then(() => (d.drover.visible = false));
        g.reward(`gift/${t.i}`, 'step');
      },
    });
    removeDeep();
    // 창 32:21 예물이 앞서 건너가고 야곱은 장막에서 밤을 지낸다. 그 사이 밤이 든다.
    const night = F.acts.night();
    await g.talk(L.sent);
    await night;

    // 퀘스트 2: 그 밤에 식구와 떼가 여울을 건넌다(창 32:22~23). 관찰자는 디딤돌에서 손을 잡아 주고, 건너편 둑에서 떼를 맞아들인다.
    F.acts.walkTo(jacob, P(-1.3, 2.1), 1.4);
    g.cam(P(0, -3.5), 15); // 건너편 산줄기 위 밤하늘이 보이게
    await g.talk(L.crossed.slice(0, 2));
    g.cam(null, 13);
    await g.quest({
      title: '밤의 여울',
      targets: [{ pos: FORD.clone(), i: 0 }, { pos: FAR.clone(), i: 1 }],
      text: (t) => ['디딤돌에서 식구들 손 잡아 주기', '건너편 둑에서 떼 맞아들이기'][t.i],
      radius: 1.2, hold: 1.4, holdLabel: (t) => ['손을 잡아 주는 중', '떼를 맞아들이는 중'][t.i],
      onFound: async (t) => {
        if (t.i === 0) family.forEach((f, j) => F.acts.wait(j * 450).then(() => F.acts.walkTo(f, NIGHT(j), 1.3)));
        else flock.forEach((an, j) => {
          const off = j % 2 ? 0.25 : -0.25, home = P(-6.8 - j * 0.7, -4.4 - (j % 2) * 0.9);
          Object.assign(an.userData, { route: [P(off, RIVER + 0.8), P(off, -RIVER - 0.8), home], home });
        });
        g.reward(`ford/${t.i}`, 'step');
      },
    });
    // 길을 앞서 살펴 식구들이 무사히 건넘(선함)
    g.reward('ford-done', 'questDone', null, 'goodness');

    // 홀로 남은 야곱에게 돌아간다. 야곱은 씨름 자리로 걷고, 관찰자는 곧바로 움직일 수 있다(기다리는 구간 3초 이하)
    const toWrestle = F.acts.walkTo(jacob, WRESTLE, 1.4);
    g.cam(null, 13);
    await g.quest({ title: '홀로 남은 밤', targets: [{ pos: WRESTLE.clone().addScaledVector(ALONG, -2.6).addScaledVector(FRONT, 0.8) }], text: () => '이쪽 둑의 야곱에게 돌아가기', radius: 1.6 });
    await toWrestle;
    man.visible = true;
    g.note('person/the-man');
    F.acts.face(jacob, man.position);
    F.acts.face(man, jacob.position);
    g.cam(WRESTLE, 11);
    await g.talk(L.crossed.slice(2));

    // 도전 자리는 야곱 왼쪽으로 떨어뜨린다(관찰자 오른쪽에 서는 대천사가 씨름하는 둘과 겹치지 않게).
    // 도전: 밤새 씨름. 빠르게 연달아 눌러 야곱과 함께 버틴다. 끝까지 놓지 않는 인내와 절제가 돕는다(창 32:26).
    // 씨름: 둘이 서로에게 몸을 기울여 맞붙고, 밀고 밀리며 좌우로 버틴다. 버틸 때마다(onHit) 야곱이 한 번 크게 밀어붙인다.
    let t0 = 0, shove = 0, wrestling = true;
    const jb = jacob.position.clone(), mb = man.position.clone();
    const axis = mb.clone().sub(jb).setY(0).normalize();
    for (const f of [jacob, man]) f.userData.pose = 'wrestle';
    const sway = (dt) => {
      if (!wrestling) return;
      t0 += dt;
      shove = Math.max(0, shove - dt * 2.5);
      const off = Math.sin(t0 * 1.7) * 0.12 + Math.sin(t0 * 4.3) * 0.03 + shove * 0.3;
      jacob.position.copy(jb).addScaledVector(axis, off);
      man.position.copy(mb).addScaledVector(axis, off);
      for (const [f, s] of [[jacob, 1], [man, -1]]) {
        const { rig } = f.userData;
        rig.rotation.set(0.3 + s * shove * 0.15, 0, s * Math.sin(t0 * 2.6) * 0.14);
        setArms(f, 'grip', 0.3);
        rig.position.y = -0.04 - Math.abs(Math.sin(t0 * 1.3)) * 0.04;
      }
    };
    F.onUpdate(sway);
    await g.challenge({
      title: '밤새 씨름', spots: [{ pos: WRESTLE.clone().addScaledVector(ALONG, -2.6).addScaledVector(FRONT, 0.4), text: '야곱 곁에서 끝까지 버티기', hits: 4 }],
      verb: '버티기', kind: 'mash', fruits: ['patience', 'control'], radius: 2.2,
      onHit: async (sp, n) => {
        F.acts.speak('jacob');
        shove = 1;
        // 버틸 때마다 하늘이 조금씩 밝아진다(날이 새도록, 창 32:24)
        await F.acts.sky(new THREE.Color(0x1c2340).lerp(new THREE.Color(0xe8b890), n / 6), 0.75 - n * 0.1, 0, 500);
        g.reward(`wrestle/${n}`, 'step');
      },
    });
    // 축복하지 않으면 놓지 않겠다고 버팀(인내, 창 32:26)
    g.reward('wrestle-done', 'challenge', null, 'patience');
    wrestling = false;
    jacob.position.copy(jb);
    man.position.copy(mb);
    for (const f of [jacob, man]) { f.userData.pose = null; f.userData.rig.rotation.set(0, 0, 0); f.userData.rig.position.y = 0; setArms(f, 'down'); }

    // 새벽: 허벅지 관절, 이스라엘, 브니엘
    await F.acts.sky(0xe8b890, 0.3, 0.6, 900);
    await g.talk(L.dawn.slice(0, 1));
    jacob.userData.limp = true; // 허벅지 관절이 어긋나 이 뒤로 절며 걷는다(창 32:25, 31)
    await F.acts.bow(jacob, 0.25);
    await g.talk(L.dawn.slice(1, 7));
    await F.acts.bow(jacob, 0);
    await tween(1200, (p) => man.userData.rig.scale.setScalar(Math.max(0.01, 1 - p)));
    man.visible = false;
    g.note('place/peniel');
    g.note('place/jabbok');
    // 창 32:31 해가 돋을 때 야곱이 절며 여울을 건넌다. 관찰자도 곁에서 함께 건넌다(장면을 건너뛰지 않는다).
    const limp = F.acts.walkTo(jacob, LANDING, 1.15);
    const day = F.acts.day();
    g.cam(FORD, 13);
    await g.talk(L.dawn.slice(7));
    g.cam(null, 13);
    await g.quest({ title: '해 돋는 여울', targets: [{ pos: P(1.7, -2.4) }], text: () => '절뚝이는 야곱 곁에서 여울 건너기', radius: 1.3 });
    await Promise.all([limp, day]);

    // 창 33:1 에서와 사백 명이 고개 길을 내려온다
    [esau, ...men].forEach((f) => (f.visible = true));
    crowd.visible = true;
    for (const d of DROVES) {
      // 예물 떼는 길에서 에서를 먼저 만나 그 무리 곁에 와 있다(창 32:17~19, 33:8)
      d.animals.forEach((an, j) => { an.position.copy(d.meet).addScaledVector(ALONG, j ? 0.4 : -0.4); Object.assign(an.userData, { home: an.position.clone(), route: null, roam: 0.3 }); an.visible = true; });
      d.drover.position.copy(d.meet).addScaledVector(FRONT, -0.7);
      d.drover.visible = true;
      F.acts.face(d.drover, JFRONT);
    }
    F.acts.face(jacob, ESAU_STOP);
    g.cam(P(1.6, -8), 14);
    const come = [tween(2600, (p) => (march.k = easeOut(p))), F.acts.walkTo(esau, ESAU_STOP, 1.2), ...men.map((m, i) => F.acts.walkTo(m, P(0.4 + i * 1.0, -10.4), 1.2))];
    await g.talk(L.meet.slice(0, 1));
    await Promise.all(come);
    // 창 33:1~2 식구를 여종들 → 레아 → 라헬과 요셉 차례로 세운다. 관찰자가 한 무리씩 찾아가 자리를 알려 준다.
    g.cam(P(-1.6, -3.6), 13);
    await g.talk(L.meet.slice(1, 3));
    g.cam(null, 13);
    const ahead = F.acts.walkTo(jacob, JFRONT, 1.1); // 야곱은 그동안 식구들 앞으로 나선다(창 33:3)
    for (const [k, grp] of GROUPS.entries()) {
      const at = grp.reduce((s, j) => s.add(family[j].position), V(0, 0)).multiplyScalar(1 / grp.length).setY(0);
      await g.quest({
        title: '식구들의 줄', targets: [{ pos: at.addScaledVector(FRONT, 0.6) }], text: () => LINE_TEXT[k], radius: 1.3, hold: 0.8, holdLabel: () => '자리를 알려 주는 중',
        onFound: async () => {
          grp.forEach((j, n) => F.acts.walkTo(family[j], ROWS[k][n], 1.3).then(() => F.acts.face(family[j], ESAU_STOP)));
          g.reward(`line/${k}`, 'step');
        },
      });
    }

    // 창 33:3~4 야곱이 앞서 나아가 일곱 번 땅에 엎드리며 다가가고, 넷째 절 무렵 에서가 달려온다
    g.stage('meet');
    g.cam(MEET, 13);
    let run = null;
    const bows = (async () => {
      await ahead;
      for (let i = 0; i < 7; i++) {
        await F.acts.prostrate(jacob, ESAU_STOP, 0.22);
        await F.acts.rise(jacob, 0.22);
        if (i === 3) run = F.acts.walkTo(esau, JEND.clone().addScaledVector(TO_ESAU, 0.4).addScaledVector(ALONG, 1.1), 3); // 화면 가로로 마주 서게(안을 때 겹치지 않게)
        await F.acts.walkTo(jacob, JFRONT.clone().addScaledVector(TO_ESAU, 0.2 * (i + 1)), 1.1);
      }
    })(); // 창 33:3 땅에 굽힘(R5)
    await g.talk(L.meet.slice(3, 4));
    await bows;
    await run;
    // 에서가 야곱을 맞아 목을 안고 함께 운다(창 33:4)
    const hug = F.acts.embrace(esau, jacob);
    men.forEach((m, i) => F.acts.walkTo(m, P(-0.2 + i * 1.2, -9.2), 1.4));
    await g.talk(L.meet.slice(4, 5));
    await hug;
    g.meet('esau');
    // 창 33:5~7 에서가 식구들을 보고 묻는다. 여종들과 아이들, 레아와 아이들, 요셉과 라헬이 차례로 나아와 절한다.
    F.acts.face(esau, family[4].position);
    await g.talk(L.meet.slice(5, 7));
    const approach = (k, delay = 0) => Promise.all(GROUPS[k].map(async (j) => {
      const f = family[j];
      await F.acts.wait(delay);
      await F.acts.walkTo(f, f.position.clone().addScaledVector(TO_ESAU, 0.6), 1.2);
      await F.acts.prostrate(f, esau.position, 0.6);
    }));
    const b0 = approach(0);
    await g.talk(L.meet.slice(7, 8));
    await b0;
    const b12 = Promise.all([approach(1), approach(2, 900)]);
    await g.talk(L.meet.slice(8, 9));
    await b12;
    await Promise.all(family.map((f) => F.acts.rise(f, 0.6)));
    // 창 33:8 길에서 만난 예물 떼
    g.cam(DROVES[2].meet, 13);
    F.acts.face(esau, DROVES[0].meet);
    await g.talk(L.meet.slice(9));
    g.note('creature/goat');

    // 막간: 떼가 쉬는 동안 에서와 대화한다.
    await g.interlude(esau);
    g.cam(MEET, 12);
    // 막간 동안 관찰자 곁에 왔던 에서가 야곱 앞으로 돌아온다
    F.acts.walkTo(esau, jacob.position.clone().addScaledVector(TO_ESAU, 0.8).addScaledVector(ALONG, 0.7), 1.6).then(() => { F.acts.face(esau, jacob.position); F.acts.face(jacob, esau.position); });
    await g.talk(L.after.slice(0, 1));
    // 창 33:11 에서가 예물을 받는다: 에서의 사람들이 떼 곁으로 가고, 떼는 에서의 무리 쪽으로 옮겨 간다
    men.forEach((m, i) => F.acts.walkTo(m, DROVES[i + 1].meet.clone().addScaledVector(FRONT, -0.9), 1.4));
    DROVES.forEach((d, i) => d.animals.forEach((an, j) => { const home = P(3.6 + (i % 3) * 0.9 + j * 0.4, -9.4 - Math.floor(i / 3) * 0.8); Object.assign(an.userData, { route: [home], home }); }));
    await g.talk(L.after.slice(1));
    g.stage(null);
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-32-28'], memento: 'item/jacob-staff' });
  },
};
