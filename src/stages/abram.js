// 1-6 아브람의 부르심(창 12, 15장): 길 떠나기(퀘스트: 하란 → 세겜 모레 상수리나무, 제단 쌓기 도전 → 벧엘 동쪽 산)
// → 장막 저녁 막간(사래) → 밤의 환상(창 15:1~5) → 별 세기(퀘스트) → 창 15:6 → 퀴즈(창 12:2, 15:6)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeTree, makeTent, makeAltar } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/abram.js';

const START = V(6, 5);
const HARAN = V(7.5, 1.5); // 떠나는 집들
const OAK = V(0.8, 0.2); // 모레 상수리나무(창 12:6)
const SHECHEM_ALTAR = OAK.clone().add(V(1.4, -1.3));
const CAMP = V(-5, -3.5); // 벧엘 동쪽 산의 장막(창 12:8)
const BETHEL_ALTAR = CAMP.clone().add(V(1.8, -1.6));
// 제단 쌓기 도전: 아브람은 제단 앞 왼쪽, 관찰자는 제단 뒤에 선다. 쌓이는 돌이 사람에게 가리지 않는다.
const ALTAR_ABRAM = SHECHEM_ALTAR.clone().addScaledVector(V(1, -1).normalize(), -0.9).add(V(0.5, 0.5));
const ALTAR_WORK = SHECHEM_ALTAR.clone().addScaledVector(V(1, -1).normalize(), 0.4).add(V(-0.9, -0.9));
const HILLS = [V(-9, 1.5), V(-2.5, -8.5), V(3, -6.5), V(-8.5, -6)]; // 별을 세는 언덕
const ALONG = V(1, -1).normalize();

export default {
  id: 'abram',
  data,
  records: ['person/abraham', 'person/sarah', 'person/lot', 'place/haran', 'place/shechem', 'word/gen-12-2', 'word/gen-15-6', 'item/oak-leaf'],
  kicker: '하란 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 1215, start: START, sky: 0xd8e4ea, ground: 0xa8a462,
      stages: { oak: { c: toCam(SHECHEM_ALTAR, 1.6), r: 2.2 }, camp: { c: toCam(CAMP, 2.4), r: 2.4 } },
      trees: 12, keep: [...HILLS, ALTAR_WORK],
    });
    // 하란의 집: 흙벽돌 집 셋
    for (const [dx, dz, s] of [[0, 0, 1], [1.6, -1.8, 0.8], [-0.4, -2.6, 0.9]]) {
      const house = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s, 1 * s, 1.4 * s), mat(0xc9a982));
      F.put(house, HARAN.clone().add(V(dx, dz)), 0.9 * s);
      house.position.y = 0.5 * s;
    }
    const oak = makeTree('round');
    oak.scale.setScalar(2.2);
    F.put(oak, OAK, 0.7);
    const altar1 = makeAltar();
    altar1.visible = false;
    F.put(altar1, SHECHEM_ALTAR, 0.6);
    const tent = makeTent(0x5a3a28, 1.1);
    F.put(tent, CAMP.clone().addScaledVector(ALONG, -1.2).add(V(-1, -1)), 1.4, Math.PI / 4);
    const altar2 = makeAltar();
    altar2.visible = false;
    F.put(altar2, BETHEL_ALTAR, 0.6);
    // 언덕: 낮은 둔덕
    for (const h of HILLS) {
      const mound = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.5, 8), mat(0x968f58));
      mound.position.copy(h).setY(0.1);
      F.group.add(mound);
    }
    const abram = F.person('abram', { hair: 'short', hairColor: 0x6b6460, beard: 'long', outfit: 'traveler', outfitColor: 0x7f5a3a, item: 'staff' }, HARAN.clone().add(V(-1.6, 1.4)));
    const sarai = F.person('sarai', { hair: 'long', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0x6e3f73 }, HARAN.clone().add(V(-1, 2.4)));
    const lot = F.person('lot', { hair: 'short', hairColor: PAL.hairBrown, beard: 'short', outfit: 'shepherd', outfitColor: 0xd8c3a0 }, HARAN.clone().add(V(-2.6, 0.4)));
    // 길을 따르는 짐승: 나귀 둘과 양 셋(창 12:5 모은 소유)
    const herd = [['donkey', 0x8a7a6a, 0.85], ['donkey', 0x7a6a5a, 0.8], ['sheep', 0xf5f5f0, 0.85], ['sheep', 0xf5f5f0, 0.8], ['sheep', 0xeeeae0, 0.75]]
      .map(([k, c, s], i) => F.animal(k, c, s, HARAN.clone().add(V(-3 - (i % 3) * 0.9, 1.6 + Math.floor(i / 3) * 1.1)), { roam: 1 }));
    // 별: 밤에 언덕을 하나 셀 때마다 더 많이 보인다
    const stars = new THREE.Group();
    const starM = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
    for (let i = 0; i < 260; i++) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 + F.rand() * 0.05, 0), starM);
      const a = F.rand() * Math.PI * 2, r = 3 + F.rand() * 13;
      st.position.set(Math.cos(a) * r - 4, 5 + F.rand() * 6, Math.sin(a) * r - 4);
      st.visible = false;
      stars.add(st);
    }
    F.group.add(stars);
    Object.assign(F, { abram, sarai, lot, herd, stars, altar1, altar2, oak });
    F.spots = { start: START, oak: OAK, shechem: SHECHEM_ALTAR, altarAbram: ALTAR_ABRAM, altarWork: ALTAR_WORK, camp: CAMP, bethel: BETHEL_ALTAR, ...Object.fromEntries(HILLS.map((h, i) => [`hill${i}`, h])) };
    F.solid = ['oak', 'shechem', 'bethel'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { abram, sarai, lot, herd } = F;
    g.meet('abraham');
    g.cam(abram.position, 12);
    await F.acts.presence(abram);
    await g.talk(data.lines.arrive.slice(0, 3));
    F.acts.presence(null);
    g.note('place/haran');
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(3));
    const removeGreet = g.greet(lot, data.greetings.lot, 'lot');
    // 무리: 아브람이 앞서고 사래·롯·짐승이 뒤따른다
    const caravan = (to) => {
      herd.forEach((an, i) => { an.userData.lead = i < 2 ? abram : lot; an.userData.leadOffset = V(-0.9 - (i % 3) * 0.7, 0.8 + Math.floor(i / 3) * 0.6); });
      // 겹치지 않게 화면 가로 방향(ALONG)으로 늘어선다
      return Promise.all([F.acts.walkTo(abram, to, 1.3), F.acts.walkTo(sarai, to.clone().addScaledVector(ALONG, -1), 1.3), F.acts.walkTo(lot, to.clone().addScaledVector(ALONG, -2), 1.3)]); // 제단(오른쪽)을 비우고 왼쪽으로
    };
    const settle = (at) => herd.forEach((an, i) => { an.userData.lead = null; an.userData.home = at.clone().addScaledVector(ALONG, -3.6 - (i % 3) * 1.1).add(V(0.6, 0.6).multiplyScalar(Math.floor(i / 3))); an.userData.dest = null; });

    // 퀘스트 1: 길 떠나기. 무리를 앞서 머물 곳으로 간다. 무리가 따라와 거기 선다.
    const going1 = caravan(OAK.clone().add(V(1.1, 1.1)));
    await g.quest({ title: '길 떠나기', targets: [{ pos: OAK.clone().add(V(2.6, 2.6)), name: '모레 상수리나무' }], text: () => '세겜 모레 상수리나무로 가기', radius: 1.8 });
    g.reward('road/shechem', 'step');
    await going1;
    settle(OAK);
    g.cam(SHECHEM_ALTAR, 12);
    g.stage('oak');
    g.note('place/shechem');
    await g.talk(data.lines.shechem.slice(0, 1));
    await F.acts.presence(abram);
    await g.talk(data.lines.shechem.slice(1, 2));
    F.acts.presence(null);
    await F.acts.walkTo(abram, ALTAR_ABRAM);
    F.acts.face(abram, SHECHEM_ALTAR);
    // 도전: 세겜의 제단 쌓기(창 12:7). 흔들리는 돌을 금빛에 머물게 해 하나씩 얹는다(균형, F58).
    // 관찰자가 돌을 함께 얹고, 한 번 해낼 때마다 돌 둘이 떨어져 앉는 모습은 각색이다.
    const stones = F.altar1.children;
    stones.forEach((s) => (s.visible = false));
    F.altar1.visible = true;
    await g.talk(data.lines.shechem.slice(2, 3));
    await g.challenge({
      title: '세겜의 제단', spots: [{ pos: ALTAR_WORK, text: '아브람과 함께 제단 돌 얹기', hits: 3 }],
      verb: '돌 얹기', kind: 'balance', fruits: ['faith', 'patience'], radius: 1.6,
      onHit: async (sp, n) => {
        F.acts.speak('abram');
        const pair = stones.slice((n - 1) * 2, n * 2);
        const ys = pair.map((s) => s.position.y);
        pair.forEach((s) => (s.visible = true));
        await tween(450, (p) => pair.forEach((s, k) => (s.position.y = ys[k] + 0.7 * (1 - easeOut(p)))));
        g.reward(`altar/${n}`, 'step');
      },
    });
    // 자기에게 나타나신 여호와께 예배함(창 12:7, 사랑)
    g.reward('altar-done', 'challenge', null, 'love');
    await g.talk(data.lines.shechem.slice(3));
    g.stage(null);
    g.cam(null, 13);
    const going2 = caravan(CAMP.clone().add(V(1.4, 1.4)));
    await g.quest({ title: '길 떠나기', targets: [{ pos: CAMP.clone().add(V(3.4, 3.4)), name: '벧엘 동쪽 산' }], text: () => '벧엘 동쪽 산으로 가기', radius: 1.8 });
    g.reward('road/bethel', 'step');
    await going2;
    settle(CAMP);
    removeGreet();
    // 말씀을 따라 갈 바를 모르고 길을 나섬(히 11:8, 신실)
    g.reward('road-done', 'questDone', null, 'faith');
    g.cam(CAMP, 12);
    g.stage('camp');
    await g.talk(data.lines.bethel.slice(0, 1));
    await F.acts.walkTo(abram, BETHEL_ALTAR.clone().add(V(0.9, 0.9)));
    F.acts.face(abram, BETHEL_ALTAR);
    F.altar2.visible = true;
    await tween(700, (p) => F.altar2.scale.setScalar(Math.max(0.01, easeBack(p))));
    await g.talk(data.lines.bethel.slice(1));

    // 막간: 저녁 장막 앞에서 사래와 대화한다.
    await F.acts.dusk();
    await F.acts.walkTo(sarai, CAMP.clone().add(V(0.6, 0.6)));
    await g.interlude(sarai);
    g.stage(null);

    // 창 15:1~5: 밤의 환상. 아브람이 장막 밖으로 나와 하늘을 본다.
    await F.acts.night();
    const shown = (n) => F.stars.children.forEach((st, i) => (st.visible = i < n));
    shown(20);
    await F.acts.walkTo(abram, CAMP.clone().add(V(2.4, 0.6)));
    g.cam(abram.position, 12);
    await F.acts.presence(abram);
    await g.talk(data.lines.vision.slice(0, 3));
    g.cam(null, 13);
    await g.talk(data.lines.vision.slice(3));

    // 퀘스트 2: 별 세기. 언덕마다 머물러 하늘을 보면 별이 더 보인다.
    let counted = 0;
    await g.quest({
      title: '하늘의 별',
      targets: HILLS.map((h, i) => ({ pos: h, i })),
      text: (t) => `${['서쪽', '남쪽', '동쪽', '먼'][t.i]} 언덕에 머물러 별 세기`,
      radius: 1.8, hold: 1.4, holdLabel: () => '별을 세는 중',
      onFound: async (t) => {
        counted++;
        const from = 20 + (counted - 1) * 60;
        await tween(900, (p) => shown(Math.round(from + 60 * p)));
        g.reward(`stars/${t.i}`, 'step');
      },
    });
    // 셀 수 없는 별 앞에서 약속을 기다림(창 15:5~6, 롬 4:18 바랄 수 없는 중에 바라고 믿음 → 기쁨으로 셈)
    g.reward('stars-done', 'questDone', null, 'joy');
    shown(260);
    g.cam(abram.position, 13);
    await g.talk(data.lines.stars.slice(0, 2));
    await F.acts.bow(abram, 0.35);
    await g.talk(data.lines.stars.slice(2));
    F.acts.presence(null);
    await g.finish({ words: ['word/gen-12-2', 'word/gen-15-6'], memento: 'item/oak-leaf' });
  },
};
