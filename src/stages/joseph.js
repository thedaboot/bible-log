// 1-12 요셉의 꿈(창 37, 39~41장): 채색옷과 곡식 단 꿈 → 도단의 구덩이(멀리서, 서술) → 대상을 따라 애굽으로(퀘스트)
// → 옥에서 형통함(창 39:23) → 옥의 저녁 막간(요셉) → 바로의 꿈 → 꿈 풀기(도전, 요셉과 함께) → 애굽을 다스리는 자 → 퀴즈(창 39:23)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/joseph.js';

const ALONG = V(1, -1).normalize();
const START = V(6, 5);
const DOTHAN = V(4, -2.5); // 형들이 양을 치던 들
const PIT = DOTHAN.clone().addScaledVector(ALONG, 2.2).add(V(-0.8, -0.8));
const PRISON = V(-4.5, 3.5); // 왕의 죄수를 가두는 옥
const PRISON_IN = PRISON.clone().add(V(0.2, 0.2));
const HALL = V(-5.5, -5); // 바로의 궁정
const THRONE = HALL.clone().add(V(-1.2, -1.2));
const DREAMS = [-3, -1, 1, 3].map((k) => HALL.clone().add(V(2.6, 2.6)).addScaledVector(ALONG, k * 1.1)); // 꿈의 장면 넷

export default {
  id: 'joseph',
  data,
  records: ['person/joseph', 'person/pharaoh', 'person/cupbearer', 'place/dothan', 'place/egypt', 'creature/cow', 'creature/grain', 'item/coat-thread', 'word/gen-39-23'],
  kicker: '도단 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 3923, start: START, sky: 0xe8dcc0, ground: 0xb8aa70,
      stages: { pit: { c: toCam(PIT, 2.4), r: 2.2 }, hall: { c: toCam(HALL, 2), r: 2 } },
      trees: 8, treeKinds: ['palm', 'round'], keep: [DOTHAN, PRISON, ...DREAMS],
    });
    // 구덩이: 바닥에 둥근 어둠과 돌 둘레
    const pit = new THREE.Mesh(new THREE.CircleGeometry(0.7, 10), mat(0x2a2218));
    pit.rotation.x = -Math.PI / 2;
    pit.position.copy(PIT).setY(0.02);
    F.group.add(pit);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 4, 10), mat(0x9a9488));
    rim.rotation.x = Math.PI / 2;
    rim.position.copy(PIT).setY(0.08);
    F.group.add(rim);
    // 옥: 흙벽 셋(앞은 비워 안이 보인다)
    const wallM = mat(0x9a8a6a);
    for (const [dx, dz, w, d] of [[-1.6, 0, 0.2, 3.2], [0, -1.6, 3.2, 0.2], [1.6, -0.9, 0.2, 1.4]]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), wallM);
      wall.position.copy(PRISON).add(V(dx, dz)).setY(0.6);
      F.group.add(wall);
    }
    for (let k = -1.5; k <= 1.5; k += 0.5) { F.block(PRISON.clone().add(V(-1.6, k)), 0.2); F.block(PRISON.clone().add(V(k, -1.6)), 0.2); }
    // 궁정: 기둥과 단, 바로의 자리
    const stone = mat(0xe0d4b4);
    for (const k of [-2, 2]) for (const f of [-1.5, 1.5]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.6, 8), stone);
      const at = HALL.clone().addScaledVector(ALONG, k).add(V(f * 0.5, f * 0.5));
      col.position.copy(at).setY(1.3);
      F.group.add(col);
      F.block(at, 0.3);
    }
    const dais = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 2), mat(0xc9a24a));
    dais.position.copy(THRONE).setY(0.1);
    dais.rotation.y = Math.PI / 4;
    F.group.add(dais);
    // 꿈의 장면: 살진 암소, 충실한 이삭, 파리한 암소, 마른 이삭(처음에는 보이지 않는다)
    const visions = DREAMS.map((p, i) => {
      const g = new THREE.Group();
      if (i === 0 || i === 2) {
        for (let n = 0; n < 3; n++) {
          const cow = F.animal('cow', i === 0 ? 0xc89a6a : 0x7a6a5a, i === 0 ? 0.75 : 0.5, p.clone().addScaledVector(ALONG, (n - 1) * 0.7), { still: true });
          cow.userData.yaw = -Math.PI / 4;
          if (i === 2) cow.scale.set(1, 1, 0.6); // 파리한 소
          cow.visible = false;
          g.userData.cows = [...(g.userData.cows ?? []), cow];
        }
      } else {
        const ear = mat(i === 1 ? 0xe0c050 : 0x9a8a5a);
        for (let n = 0; n < 7; n++) {
          const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), mat(0x8a9a4a));
          stalk.position.set((n - 3) * 0.18, 0.45, 0);
          const head = new THREE.Mesh(new THREE.IcosahedronGeometry(i === 1 ? 0.12 : 0.06, 0).scale(1, 2, 1), ear);
          head.position.set((n - 3) * 0.18, 0.95, 0);
          g.add(stalk, head);
        }
        g.position.copy(p);
        g.rotation.y = Math.PI / 4;
      }
      g.visible = false;
      F.group.add(g);
      return g;
    });
    const joseph = F.person('joseph', { hair: 'short', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xb8452f }, DOTHAN.clone().add(V(3, 3)));
    const brothers = [0, 1, 2, 3, 4].map((i) => F.person(`brother${i}`, { hair: ['short', 'curly', 'short', 'tied', 'short'][i], hairColor: [0x231a16, 0x3e2a1e, 0x6b4428, 0x231a16, 0x3e2a1e][i], beard: 'short', outfit: 'shepherd', outfitColor: [0x9a6b45, 0x7f8a4a, 0xd8c3a0, 0x5a4a3a, 0x8a6a4a][i] }, DOTHAN.clone().addScaledVector(ALONG, (i - 2) * 1.1)));
    const sheep = [0, 1, 2].map((i) => F.animal('sheep', 0xf5f5f0, 0.75, DOTHAN.clone().add(V(-1.8, -1.8)).addScaledVector(ALONG, i * 1.2), { roam: 1 }));
    const pharaoh = F.person('pharaoh', { hair: 'none', hairColor: 0x231a16, outfit: 'robe', outfitColor: 0xf1ead8 }, THRONE);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 6), mat(PAL.gold));
    crown.position.set(0, 1.62, 0);
    pharaoh.userData.rig.add(crown);
    const cupbearer = F.person('cupbearer', { hair: 'short', hairColor: 0x231a16, outfit: 'tunic', outfitColor: 0x3f5a8a }, THRONE.clone().addScaledVector(ALONG, 1.1).add(V(1.6, 1.6))); // 기둥 사이, 바로 곁
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.4), mat(0xb8452f));
    coat.visible = false;
    F.group.add(coat);
    Object.assign(F, { joseph, brothers, sheep, pharaoh, cupbearer, visions, coat });
    F.spots = { start: START, dothan: DOTHAN, pit: PIT, prison: PRISON_IN, hall: HALL, throne: THRONE, ...Object.fromEntries(DREAMS.map((d, i) => [`dream${i}`, d])) };
    F.solid = ['throne'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { joseph, brothers, pharaoh, visions, coat } = F;
    g.meet('joseph');
    g.cam(DOTHAN, 14);
    F.acts.face(joseph, DOTHAN);
    await g.talk(data.lines.arrive.slice(0, 2));
    brothers.forEach((b) => F.acts.face(b, joseph.position));
    await g.talk(data.lines.arrive.slice(2));
    g.note('place/dothan');

    // 창 37:23~28: 멀리서 비춘다. 구덩이에 던지는 동작은 그리지 않는다. 요셉이 구덩이 곁에 섰다가 보이지 않게 되고, 대상을 따라 떠난다.
    g.cam(PIT.clone().add(V(-2, -2)), 16);
    g.stage('pit');
    await F.acts.walkTo(joseph, PIT.clone().addScaledVector(ALONG, 0.9), 1.4);
    await Promise.all(brothers.slice(0, 2).map((b, i) => F.acts.walkTo(b, PIT.clone().addScaledVector(ALONG, 1.8 + i * 0.9), 1.2)));
    coat.visible = true;
    coat.position.copy(PIT).addScaledVector(ALONG, 2.4).setY(0.04);
    joseph.visible = false;
    await g.talk(data.lines.pit.slice(0, 2));
    joseph.visible = true;
    joseph.position.copy(PIT).add(V(-1, -1));
    g.stage(null);
    const going = F.acts.walkTo(joseph, PRISON.clone().add(V(1.6, 1.6)), 1.6);
    g.cam(null, 13);
    await g.talk(data.lines.pit.slice(2, 3));
    g.note('place/egypt');
    g.note('item/coat-thread');

    // 퀘스트 1: 요셉을 따라 애굽으로. 길은 끊기지 않고 이어진다.
    await g.quest({ title: '애굽으로', targets: [{ pos: PRISON.clone().add(V(2.6, 2.6)) }], text: () => '요셉을 따라 애굽의 옥까지 가기', radius: 1.8 });
    await going;
    g.reward('egypt', 'step');
    await F.acts.walkTo(joseph, PRISON_IN, 1.2);
    await g.talk(data.lines.pit.slice(3));
    g.cam(PRISON, 12);
    await g.talk(data.lines.prison);
    await g.talk(data.lines.cupbearer);
    g.note('person/cupbearer');
    // 억울한 옥에서도 맡은 일을 해냄을 곁에서 지켜봄(인내)
    g.reward('prison', 'questDone', null, 'patience');

    // 막간: 옥의 저녁, 요셉과 대화한다.
    await F.acts.dusk();
    await g.interlude(joseph);
    await F.acts.day();

    // 창 41:1~16 바로의 꿈
    g.cam(HALL, 14);
    g.stage('hall');
    g.meet('pharaoh');
    await g.talk(data.lines.pharaoh.slice(0, 2));
    await F.acts.walkTo(joseph, THRONE.clone().add(V(2, 2)), 1.6);
    F.acts.face(joseph, THRONE);
    F.acts.face(pharaoh, joseph.position);
    await g.talk(data.lines.pharaoh.slice(2, 4));
    visions.forEach((v) => { v.visible = true; (v.userData.cows ?? []).forEach((c) => (c.visible = true)); });
    await tween(800, (p) => visions.forEach((v) => !v.userData.cows && v.scale.setScalar(Math.max(0.01, easeOut(p)))));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.pharaoh.slice(4));

    // 도전: 꿈 풀기. 꿈의 장면마다 다가가 금빛 구간에 맞추면 요셉이 풀이를 말한다.
    // 꿈을 푸는 이는 하나님이시라는 요셉의 고백(창 41:16)에 기대어 신실과 화평이 돕는다.
    const names = ['살진 일곱 암소', '알이 꽉 찬 일곱 이삭', '뼈만 남은 일곱 암소', '마른 일곱 이삭']; // 요셉의 풀이 대사(data/joseph.js)와 같은 말
    await g.challenge({
      title: '바로의 꿈', spots: DREAMS.map((p, i) => ({ pos: p.clone().add(V(1.2, 1.2)), text: `${names[i]} 풀기`, i })),
      verb: '풀기', hits: 2, fruits: ['faith', 'peace'],
      onHit: async (sp, n) => {
        if (n < 2) return;
        await F.acts.walkTo(joseph, DREAMS[sp.i].clone().add(V(1.2, 1.2)).addScaledVector(ALONG, -1.4), 2.4);
        F.acts.face(joseph, DREAMS[sp.i]);
        await g.talk([data.lines.dreams[sp.i]]);
        g.note(sp.i % 2 ? 'creature/grain' : 'creature/cow');
        g.reward(`dream/${sp.i}`, 'step');
      },
    });
    // 하나님께서 평안한 대답을 주신다는 고백(창 41:16, 화평)
    g.reward('dreams-done', 'challenge', null, 'peace');

    // 창 41:32~46 애굽을 다스리는 자
    g.cam(HALL, 13);
    g.stage('hall');
    await F.acts.walkTo(joseph, THRONE.clone().add(V(2, 2)), 1.6);
    F.acts.face(joseph, THRONE);
    await g.talk(data.lines.ruler.slice(0, 2));
    await F.acts.walkTo(pharaoh, THRONE.clone().add(V(0.9, 0.9)), 1);
    await g.talk(data.lines.ruler.slice(2, 3));
    await F.acts.bow(joseph, 0.35);
    await g.talk(data.lines.ruler.slice(3, 4));
    await F.acts.bow(joseph, 0);
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.ruler.slice(4));
    await g.finish({ words: ['word/gen-39-23'], memento: 'item/coat-thread' });
  },
};
