// 1-10 야곱의 사닥다리(창 25~28장): 25~27장은 서술 → 해 진 들에서 돌베개 찾기(퀘스트) → 막간(야곱)
// → 잠 → 꿈의 사닥다리와 오르내리는 사자들(퀘스트: 곁에 머물러 지켜보기) → 창 28:13~15 약속 → 깨어 돌기둥(도전: 기름 붓기, 따라 긋기)과 벧엘 → 퀴즈(창 28:15)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAngel } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/bethel.js';

const START = V(6, 5);
const ALONG = V(1, -1).normalize();
const JACOB = V(0.5, 0.5); // 야곱이 머문 자리
const BED = V(-1.5, -1.5); // 돌베개를 베고 누운 자리
const STONES = [V(5, -4), V(-6, 2.5), V(-3.5, -6.5)]; // 날카로운 돌, 큰 바위, 매끈한 돌
// 기름 붓기 도전: 관찰자는 돌기둥(BED에서 -ALONG 0.8)의 왼쪽 앞, 야곱은 오른쪽 앞에 선다.
// 관찰자는 무대 왼쪽에서 걸어오고 대천사는 걸어온 쪽에 남으므로 기둥을 가리지 않는다(브라우저 캡처로 확인).
const OIL = BED.clone().addScaledVector(ALONG, -2).add(V(0.5, 0.5));
const LADDER = BED.clone().addScaledVector(ALONG, -2.4).add(V(-1, -1)); // 꿈의 사닥다리(누운 자리 곁, 화면 왼쪽 뒤)

export default {
  id: 'bethel',
  data,
  records: ['person/jacob', 'person/esau', 'creature/lentil', 'place/bethel', 'item/stone-pillow', 'word/gen-28-15'],
  kicker: '하란 가는 길로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 2815, start: START, sky: 0xe8b890, ground: 0x9c9466,
      stages: { bed: { c: toCam(BED, 1.6), r: 2.2 }, ladder: { c: toCam(LADDER, 2.2), r: 2 } },
      trees: 10, keep: [...STONES, JACOB, BED, LADDER, LADDER.clone().add(V(-1.5, -1.5)), LADDER.clone().addScaledVector(ALONG, -1.8).add(V(1, 1))],
    });
    const stoneM = mat(0x9a9488);
    const rocks = STONES.map((p, i) => {
      const geo = i === 1 ? new THREE.DodecahedronGeometry(0.75, 0) : i === 0 ? new THREE.TetrahedronGeometry(0.35, 0) : new THREE.IcosahedronGeometry(0.22, 1).scale(1.4, 0.7, 1);
      const r = new THREE.Mesh(geo, stoneM);
      r.position.copy(p).setY(i === 1 ? 0.5 : 0.2);
      F.group.add(r);
      if (i === 1) F.block(p, 0.75);
      return r;
    });
    // 꿈의 사닥다리: 땅에서 하늘까지 빛나는 두 기둥과 가로대
    const ladder = new THREE.Group();
    const glow = new THREE.MeshBasicMaterial({ color: PAL.light, transparent: true, opacity: 0.85 });
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 14, 0.1), glow);
      rail.position.set(s * 0.45, 7, 0);
      ladder.add(rail);
    }
    for (let i = 0; i < 28; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), glow);
      rung.position.y = 0.4 + i * 0.5;
      ladder.add(rung);
    }
    ladder.rotation.y = Math.PI / 4; // 로컬 x가 화면 가로(ALONG)를 향해 두 기둥과 가로대가 다 보인다
    ladder.position.copy(LADDER);
    ladder.visible = false;
    F.group.add(ladder);
    const climbers = [0, 1, 2, 3].map((i) => {
      const a = makeAngel();
      a.scale.setScalar(0.7);
      a.visible = false;
      a.userData.k = i / 4;
      a.userData.up = i % 2 === 0;
      F.group.add(a);
      return a;
    });
    F.onUpdate((dt) => {
      if (!ladder.visible) return;
      for (const a of climbers) {
        a.userData.k = (a.userData.k + dt * 0.06) % 1;
        const y = (a.userData.up ? a.userData.k : 1 - a.userData.k) * 12;
        a.position.copy(LADDER).addScaledVector(ALONG, a.userData.up ? -0.7 : 0.7).setY(y);
      }
    });
    const jacob = F.person('jacob', { hair: 'short', hairColor: PAL.hairBrown, beard: 'short', outfit: 'traveler', outfitColor: 0x8a6a4a, item: 'staff' }, JACOB);
    const pillow = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1).scale(1.4, 0.7, 1), stoneM);
    pillow.visible = false;
    F.group.add(pillow);
    Object.assign(F, { jacob, rocks, ladder, climbers, pillow });
    F.spots = { start: START, jacob: JACOB, bed: BED, oil: OIL, ladder: LADDER, ...Object.fromEntries(STONES.map((s, i) => [`stone${i}`, s])) };
    F.solid = ['stone1'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { jacob, rocks, ladder, climbers, pillow } = F;
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(0, 1));
    g.note('person/esau');
    await g.talk(data.lines.arrive.slice(1, 2));
    g.note('creature/lentil');
    await g.talk(data.lines.arrive.slice(2, 4));
    await F.acts.dusk();
    g.meet('jacob');
    await g.talk(data.lines.arrive.slice(4));

    // 퀘스트 1: 돌베개. 돌 셋을 살피고(머무르기), 매끈한 돌을 야곱에게 가져간다.
    await g.quest({
      title: '돌베개',
      targets: STONES.map((p, i) => ({ pos: p, i })),
      text: (t) => `${['날카로운 돌', '큰 바위', '매끈한 돌'][t.i]} 살피기`,
      radius: 1.8, hold: 1, holdLabel: () => '돌을 살피는 중',
      onFound: async (t) => { await g.talk([data.lines.stones[t.i]]); g.reward(`stone/${t.i}`, 'step'); },
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

    // 창 28:11 잠
    await F.acts.night();
    g.cam(BED, 12);
    g.stage('bed');
    await F.acts.walkTo(jacob, BED, 1.2);
    F.acts.carry(pillow, null);
    pillow.position.copy(BED).addScaledVector(ALONG, -0.8).setY(0.12);
    jacob.rotation.y = Math.atan2(ALONG.x, ALONG.z); // 머리가 돌베개 쪽
    await g.talk(data.lines.sleep);
    await F.acts.lie(jacob);

    // 창 28:12 꿈: 사닥다리와 사자들
    ladder.visible = true;
    climbers.forEach((a) => (a.visible = true));
    g.cam(LADDER.clone().setY(3), 15);
    await tween(1200, (p) => ladder.scale.set(1, Math.max(0.01, easeOut(p)), 1));
    await g.talk(data.lines.dream.slice(0, 2));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.dream.slice(2));
    await g.quest({ title: '사닥다리 꿈', targets: [{ pos: LADDER.clone().addScaledVector(ALONG, -1.8).add(V(1, 1)) }], text: () => '사닥다리 곁에 머물러 사자들 지켜보기', radius: 1.8, hold: 2.4, holdLabel: () => '오르내리는 사자들을 보는 중' });
    // 하늘에 닿은 사닥다리 곁에서 조용히 지켜봄(화평)
    g.reward('dream-done', 'questDone', null, 'peace');

    // 창 28:13~15 약속: 사닥다리 꼭대기의 빛
    g.cam(LADDER.clone().setY(4), 15);
    g.stage('ladder');
    await F.acts.presence(LADDER.clone().setY(9));
    await g.talk(data.lines.promise);
    F.acts.presence(null);

    // 창 28:16~22 깨어 돌기둥을 세운다
    await tween(900, (p) => ladder.scale.set(1, Math.max(0.01, 1 - p), 1));
    ladder.visible = false;
    climbers.forEach((a) => (a.visible = false));
    await F.acts.day();
    await F.acts.lie(jacob, true);
    g.cam(BED, 12);
    g.stage('bed');
    await g.talk(data.lines.woke.slice(0, 2));
    // 돌베개를 기둥으로 세운다
    await tween(900, (p) => { pillow.scale.set(1 - 0.3 * p, 1 + 3 * easeOut(p), 1 - 0.3 * p); pillow.position.y = 0.12 + 0.35 * easeOut(p); });
    await g.talk(data.lines.woke.slice(2, 3));
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
      verb: '기름 붓기', kind: 'trace', fruits: ['peace', 'faith'], radius: 0.8,
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
    await g.talk(data.lines.woke.slice(3, 5));
    g.note('place/bethel');
    await F.acts.bow(jacob, 0);
    await g.talk(data.lines.woke.slice(5));
    g.stage(null);
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-28-15'], memento: 'item/stone-pillow' });
  },
};
