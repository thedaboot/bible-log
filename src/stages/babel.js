// 1-5 바벨탑(창 11:1~9): 일꾼들의 말 듣기(퀘스트) → 가마 앞 막간(벽돌 굽는 이) → 여호와께서 내려오심
// → 흩어지는 말 듣기(퀘스트, 들은 일꾼은 제 길로 떠난다) → 바벨이라 부름 → 퀴즈(창 11:9)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/babel.js';

const START = V(6, 5);
const TOWER = V(-3.5, -3.5);
const KILN = V(3.2, -2.2); // 벽돌 가마(창 11:3)
const BUILDER = KILN.clone().add(V(0.4, 1.4));
const WORKERS = [V(-0.8, -1.2), V(-4.8, 0.2), V(0.4, -5.6), V(2.6, 2.8)];
// 흩어질 때 저마다 떠나는 쪽(창 11:8)
const AWAY = [V(12, -4), V(-13, 3), V(2, -13), V(4, 13)];
const LOOKS = [
  { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x9a6b45 },
  { hair: 'tied', hairColor: PAL.hairBrown, outfit: 'tunic', outfitColor: 0xd8c3a0 },
  { hair: 'curly', hairColor: 0x231a16, beard: 'long', outfit: 'robe', outfitColor: 0x7f8a4a },
  { hair: 'long', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xb8452f },
];

function makeTower() {
  const g = new THREE.Group();
  const brick = mat(0xb8683c);
  const tiers = [];
  [[5, 0.9], [4, 0.9], [3.1, 0.9], [2.3, 0.9], [1.6, 0.9], [1, 0.8]].forEach(([w, h], i) => {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), i % 2 ? mat(0xa85d34) : brick);
    tier.position.y = i * 0.9 + h / 2;
    tier.visible = i < 3;
    g.add(tier);
    tiers.push(tier);
  });
  // 비계(사다리 장대)
  for (const [x, z] of [[2.6, 0], [0, 2.6]]) {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.4, 0.08), mat(PAL.plank));
    pole.position.set(x, 1.7, z);
    g.add(pole);
  }
  g.userData.tiers = tiers;
  return g;
}

export default {
  id: 'babel',
  data,
  records: ['place/shinar', 'place/babel', 'item/brick', 'word/gen-11-9'],
  kicker: '시날 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 1109, start: START, sky: 0xe6dcc0, ground: 0xc9b47a,
      stages: { tower: { c: toCam(TOWER, 4), r: 2.4 }, kiln: { c: toCam(BUILDER, 1.2), r: 1.6 } },
      trees: 8, treeKinds: ['palm', 'round'], keep: [...WORKERS, ...AWAY.map((a) => a.clone().setLength(9))],
    });
    const tower = makeTower();
    F.put(tower, TOWER, 2.9);
    // 가마: 둥근 흙 가마와 불빛, 곁에 쌓인 벽돌
    const kiln = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x9a6a44));
    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0xff8a3a }));
    fire.position.set(0.45, 0.2, 0.45);
    fire.rotation.y = Math.PI / 4;
    kiln.add(dome, fire);
    const glow = new THREE.PointLight(0xff8a3a, 4, 4);
    glow.position.set(0.6, 0.4, 0.6);
    kiln.add(glow);
    F.put(kiln, KILN, 0.9);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.18), mat(0xb8683c));
      b.position.copy(KILN).add(V(-1.1, 0.4 + (i % 3) * 0.2)).setY(0.06 + Math.floor(i / 3) * 0.12);
      F.group.add(b);
    }
    const builder = F.person('builder', { hair: 'short', hairColor: 0x3e2a1e, beard: 'short', outfit: 'tunic', outfitColor: 0x9a7a52 }, BUILDER);
    const workers = WORKERS.map((p, i) => F.person(`worker${i}`, LOOKS[i], p));
    workers.forEach((w) => F.acts.face(w, TOWER));
    // 일꾼이 든 벽돌
    const bricks = workers.map((w) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.16), mat(0xb8683c));
      F.group.add(b);
      F.acts.carry(b, w);
      return b;
    });
    Object.assign(F, { tower, builder, workers, bricks, fire });
    F.spots = { start: START, tower: TOWER, kiln: KILN, builder: BUILDER, ...Object.fromEntries(WORKERS.map((w, i) => [`w${i}`, w])) };
    F.solid = ['tower', 'kiln'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { tower, builder, workers } = F;
    g.cam(TOWER.clone().setY(2), 15);
    g.stage('tower');
    await g.talk(data.lines.arrive.slice(0, 3));
    g.note('place/shinar');
    await g.talk(data.lines.arrive.slice(3, 7));
    // 탑이 한 층 오른다(창 11:4 쌓자)
    const tiers = tower.userData.tiers;
    tiers[3].visible = true;
    await tween(800, (p) => tiers[3].scale.setScalar(Math.max(0.01, easeBack(p))));
    g.cam(null, 13);
    g.stage(null);
    await g.talk(data.lines.arrive.slice(7));

    // 퀘스트 1: 일꾼마다 곁에 머물러 같은 말을 듣는다.
    await g.quest({
      title: '하나의 말',
      targets: workers.map((w, i) => ({ pos: w.position, i })),
      text: (t) => `${['벽돌 나르는', '역청 바르는', '꼭대기를 보는', '터를 고르는'][t.i]} 일꾼 말 듣기`,
      radius: 2, hold: 1, holdLabel: () => '곁에서 듣는 중',
      onFound: async (t) => {
        F.acts.face(workers[t.i], g.player.position);
        await g.talk([data.lines.workers[t.i]]);
        F.acts.face(workers[t.i], TOWER);
        g.reward(`listen/${t.i}`, 'step');
      },
    });
    // 한 마음으로 일하는 사람들 곁에 머물며 끝까지 듣는다(인내)
    g.reward('listen-done', 'questDone', null, 'patience');
    tiers[4].visible = true;
    await tween(800, (p) => tiers[4].scale.setScalar(Math.max(0.01, easeBack(p))));

    // 막간: 해 질 녘 가마 앞에서 벽돌 굽는 이와 대화한다.
    g.cam(KILN, 12);
    g.stage('kiln');
    await F.acts.dusk();
    await g.interlude(builder);
    g.stage(null);
    await F.acts.day();

    // 창 11:5~7 여호와께서 내려오셔서 언어를 뒤섞으신다.
    g.cam(TOWER.clone().setY(2.5), 15);
    g.stage('tower');
    await g.talk(data.lines.down.slice(0, 1), {});
    await F.acts.presence(TOWER.clone().setY(4.2), 2200);
    await g.talk(data.lines.down.slice(1, 3));
    F.acts.presence(null);
    workers.forEach((w) => F.acts.face(w, g.player.position));
    g.cam(null, 13);
    g.stage(null);
    await g.talk(data.lines.down.slice(3));

    // 퀘스트 2: 흩어지는 말. 곁에서 들은 일꾼은 벽돌을 내려놓고 제 길로 떠난다(창 11:8).
    await g.quest({
      title: '흩어지는 말',
      targets: workers.map((w, i) => ({ pos: w.position, i })),
      text: (t) => `${['벽돌 나르는', '역청 바르는', '꼭대기를 보는', '터를 고르는'][t.i]} 일꾼 곁에 머물기`,
      radius: 2, hold: 1, holdLabel: () => '곁에서 듣는 중',
      onFound: async (t) => {
        F.acts.face(workers[t.i], g.player.position);
        await g.talk(data.lines.scattered.slice(t.i * 2, t.i * 2 + 2));
        F.acts.carry(F.bricks[t.i], null);
        F.bricks[t.i].position.copy(workers[t.i].position).setY(0.06);
        const w = workers[t.i];
        F.acts.walkTo(w, AWAY[t.i].clone().setLength(11), 1.8).then(() => (w.visible = false));
        g.reward(`scatter/${t.i}`, 'step');
      },
    });
    // 알아듣지 못하는 말 앞에서도 끝까지 곁에 머문다(온유, 약 1:19 듣기는 속히)
    g.reward('scatter-done', 'questDone', null, 'gentle');
    workers.forEach((w) => (w.visible = false));
    g.cam(TOWER.clone().setY(2), 15);
    g.stage('tower');
    F.fire.visible = false; // 가마 불도 꺼진다(성읍 쌓기를 그침)
    await g.talk(data.lines.name.slice(0, 2));
    g.note('place/babel');
    g.cam(null, 13);
    await g.talk(data.lines.name.slice(2));
    await g.finish({ words: ['word/gen-11-9'], memento: 'item/brick' });
  },
};
