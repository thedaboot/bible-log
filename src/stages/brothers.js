// 1-13 요셉과 형제들(창 42~45, 50장): 곡식 창고 앞에서 형들이 엎드림 → 곡식 자루 채워 싣기(퀘스트) → 깊은 대화(요셉, 조건)
// → 형들이 가나안으로 돌아가고 저녁 막간(유다) → 베냐민과 다시 내려옴 → 은잔 찾기(퀘스트: 맏형부터 막내까지 자루 살피기)
// → 유다의 간청 → "나는 요셉입니다"(창 45:3~5) → 창 50:19~20 → 퀴즈(창 50:20). 창세기의 마지막 스테이지다.
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeSack, makeTent } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/brothers.js';

const ALONG = V(1, -1).normalize();
const START = V(6, 5);
const GRANARY = V(-4.5, -4.5); // 곡식 창고
const JOSEPH = GRANARY.clone().add(V(2.2, 2.2));
const YARD = JOSEPH.clone().add(V(2, 2)); // 형들이 엎드리는 마당
const SACKS = [-2.4, -0.8, 0.8, 2.4].map((k) => YARD.clone().add(V(1.6, 1.6)).addScaledVector(ALONG, k)); // 채울 자루
const DONKEYS = SACKS.map((p) => p.clone().add(V(1.4, 1.4)));
const CANAAN = V(5.5, -6); // 가나안의 장막(막간 자리)
const ROW = [-3, -1.5, 0, 1.5, 3].map((k) => YARD.clone().addScaledVector(ALONG, k * 0.9).add(V(0.6, 0.6))); // 은잔을 찾는 자루 줄(맏형 → 막내)

export default {
  id: 'brothers',
  data,
  records: ['person/judah', 'person/benjamin', 'item/silver-cup', 'place/goshen', 'item/grain-handful', 'word/gen-50-20'],
  kicker: '애굽의 곡식 창고로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 5020, start: START, sky: 0xe8dcc0, ground: 0xb8aa70,
      stages: { yard: { c: toCam(YARD, 1.6), r: 2.6 }, canaan: { c: toCam(CANAAN, 1.4), r: 2 } },
      trees: 9, treeKinds: ['palm', 'round'], keep: [...SACKS, ...DONKEYS, ...ROW, CANAAN],
    });
    // 곡식 창고: 흙벽돌 곳간 둘과 쌓인 자루
    for (const [dx, dz, s] of [[0, 0, 1.4], [-1.8, 1.8, 1]]) {
      const store = new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 1.4 * s, 1.8 * s), mat(0xd2b48a));
      F.put(store, GRANARY.clone().add(V(dx, dz)), 1.2 * s);
      store.position.y = 0.7 * s;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2 * s, 0.6 * s, 4), mat(0xb89a6a));
      roof.position.copy(store.position).setY(1.4 * s + 0.3 * s);
      roof.rotation.y = Math.PI / 4;
      F.group.add(roof);
    }
    F.put(makeTent(0x5a3a28), CANAAN.clone().add(V(-1.7, -1.7)), 1.4, Math.PI / 4);
    const sacks = SACKS.map((p) => { const s = makeSack(0xd8c8a0); s.position.copy(p); s.scale.setScalar(0.6); F.group.add(s); return s; });
    const donkeys = DONKEYS.map((p, i) => { const d = F.animal('donkey', [0x8a7a6a, 0x7a6a5a, 0x9a8a7a, 0x6a5a4a][i], 0.8, p, { still: true }); d.userData.yaw = -Math.PI / 4; return d; });
    const rowSacks = ROW.map((p) => { const s = makeSack(0xc8b088); s.position.copy(p); s.visible = false; F.group.add(s); return s; });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.2, 8), mat(0xd8dce0, { metalness: 0.6, roughness: 0.3 }));
    cup.visible = false;
    F.group.add(cup);
    const joseph = F.person('joseph', { hair: 'short', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xf1ead8 }, JOSEPH);
    const gold = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 4, 10), mat(PAL.gold));
    gold.rotation.x = Math.PI / 2;
    gold.position.y = 1.22;
    joseph.userData.rig.add(gold); // 금 사슬(창 41:42)
    const LOOKS = [[0x231a16, 0x9a6b45], [0x3e2a1e, 0x7f8a4a], [0x6b4428, 0xd8c3a0], [0x231a16, 0x5a4a3a], [0x3e2a1e, 0x8a6a4a]];
    const brothers = LOOKS.map(([h, c], i) => F.person(i === 2 ? 'judah' : `brother${i}`, { hair: 'short', hairColor: h, beard: 'long', outfit: 'shepherd', outfitColor: c }, YARD.clone().addScaledVector(ALONG, (i - 2) * 1.1).add(V(3.5, 3.5))));
    const judah = brothers[2];
    const benjamin = F.person('benjamin', { hair: 'curly', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0x8fbcd8 }, CANAAN.clone().addScaledVector(ALONG, -6.4).add(V(1.4, 1.4)));
    benjamin.visible = false;
    Object.assign(F, { joseph, brothers, judah, benjamin, sacks, donkeys, rowSacks, cup });
    F.spots = { start: START, joseph: JOSEPH, yard: YARD, canaan: CANAAN, ...Object.fromEntries(SACKS.map((s, i) => [`sack${i}`, s])) };
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { joseph, brothers, judah, benjamin, sacks, donkeys, rowSacks, cup } = F;
    g.meet('joseph');
    g.cam(YARD, 14);
    g.stage('yard');
    // 형들이 마당으로 와서 엎드린다(창 42:6, 요셉의 꿈이 이루어짐). 걷는 동안 대사를 띄운다.
    // 반 칸 비켜 서서 요셉과 화면에서 겹치지 않는다
    const arrive = Promise.all(brothers.map((b, i) => F.acts.walkTo(b, YARD.clone().addScaledVector(ALONG, (i - 2) * 1.1 + 0.55), 1.6)));
    await g.talk(data.lines.arrive.slice(0, 2));
    await arrive;
    brothers.forEach((b) => F.acts.face(b, JOSEPH));
    F.acts.face(joseph, YARD);
    await Promise.all(brothers.map((b) => F.acts.bow(b, 0.6)));
    await g.talk(data.lines.arrive.slice(2, 5));
    await Promise.all(brothers.map((b) => F.acts.bow(b, 0)));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(5));

    // 퀘스트 1: 곡식 자루. 자루 곁에 머무르면 곡식이 차오르고, 자루가 나귀 등으로 실린다.
    await g.quest({
      title: '곡식 자루',
      targets: SACKS.map((p, i) => ({ pos: p, i })),
      text: (t) => `${['첫째', '둘째', '셋째', '넷째'][t.i]} 자루 곁에 머물러 곡식 채우기`,
      radius: 1.8, hold: 1.2, holdLabel: () => '곡식을 채우는 중',
      onFound: async (t) => {
        const s = sacks[t.i], from = s.position.clone(), to = donkeys[t.i].position.clone().setY(0.75);
        await tween(400, (p) => s.scale.setScalar(0.6 + 0.4 * easeOut(p)));
        await tween(600, (p) => { s.position.lerpVectors(from, to, easeOut(p)); s.position.y += Math.sin(p * Math.PI) * 0.6; });
        g.reward(`sack/${t.i}`, 'step');
      },
    });
    // 굶주린 형들의 자루를 채움(선함, 창 42:25 곡식을 채우고 돈을 돌려줌)
    g.reward('sacks-done', 'questDone', null, 'goodness');
    g.note('item/grain-handful');

    // 깊은 대화(요셉): 형들이 떠나기 전, 창고 곁의 요셉에게 가면 열린다(조건이 맞을 때).
    const removeDeep = g.deep(joseph, data.deep);
    await g.talk(data.lines.loaded.slice(0, 1));
    // 형들이 가나안의 장막으로 돌아간다. 관찰자도 따라간다.
    // 형들은 장막 왼쪽에 줄지어 쉬고, 유다만 오른쪽으로 나와 관찰자와 대화한다
    brothers.forEach((b, i) => F.acts.walkTo(b, CANAAN.clone().addScaledVector(ALONG, (i - 2) * 1.1 - 3.4).add(V(1.4, 1.4)), 1.6));
    donkeys.forEach((d, i) => { d.userData.still = false; d.userData.route = [CANAAN.clone().add(V(2.6 + i * 0.4, 0.4 - i))]; d.userData.home = d.userData.route[0].clone(); d.userData.roam = 0.6; });
    sacks.forEach((s) => (s.visible = false));
    await g.quest({ title: '가나안으로', targets: [{ pos: CANAAN.clone().addScaledVector(ALONG, -0.8).add(V(2.4, 2.4)) }], text: () => '형들을 따라 가나안 장막으로 가기', radius: 1.8 });
    removeDeep();

    // 막간: 해 질 녘 장막 앞에서 유다와 대화한다(창 43:8~10 뒤).
    benjamin.visible = true;
    g.meet('benjamin');
    await Promise.all([F.acts.dusk(), F.acts.walkTo(judah, CANAAN.clone().addScaledVector(ALONG, 1.2).add(V(1.2, 1.2)), 1.8)]);
    g.meet('judah');
    await g.interlude(judah);

    // 다시 애굽으로(창 43:15). 베냐민도 함께 간다. 날이 밝는 동안 걷는다.
    await Promise.all([F.acts.day(), ...[...brothers, benjamin].map((b, i) => F.acts.walkTo(b, YARD.clone().addScaledVector(ALONG, (i - 2.5) * 1.05), 3))]);
    g.cam(YARD, 13);
    g.stage('yard');
    F.acts.face(joseph, benjamin.position);
    await g.talk(data.lines.loaded.slice(1));
    g.stage(null);

    // 퀘스트 2: 은잔. 맏형의 자루부터 막내의 자루까지 차례로 살핀다(창 44:12).
    rowSacks.forEach((s) => (s.visible = true));
    await g.talk(data.lines.cup);
    for (const [i, p] of ROW.entries()) {
      await g.quest({ title: '은잔', targets: [{ pos: p.clone().add(V(0.9, 0.9)) }], text: () => `${['맏형', '둘째 형', '유다', '넷째 형', '막내 베냐민'][i]}의 자루 살피기`, radius: 1.4, hold: 0.8, holdLabel: () => '자루를 푸는 중' });
      g.reward(`cup/${i}`, 'step');
    }
    cup.visible = true;
    cup.position.copy(ROW[4]).setY(0.75);
    await tween(700, (p) => (cup.position.y = 0.75 + easeOut(p) * 0.4));
    g.note('item/silver-cup');
    // 끝까지 차례대로 살핌(인내)
    g.reward('cup-done', 'questDone', null, 'patience');
    g.cam(YARD, 12);
    g.stage('yard');
    await g.talk(data.lines.found.slice(0, 1));
    await F.acts.walkTo(judah, JOSEPH.clone().addScaledVector(ALONG, 1.3).add(V(0.9, 0.9)), 1.4); // 요셉 앞을 가리지 않게 화면 오른쪽 앞
    F.acts.face(judah, joseph.position);
    await F.acts.bow(judah, 0.6);
    await g.talk(data.lines.found.slice(1));
    await F.acts.bow(judah, 0);

    // 창 45:1~15 "나는 요셉입니다"
    await g.talk(data.lines.reveal.slice(0, 3));
    await F.acts.walkTo(joseph, benjamin.position.clone().addScaledVector(ALONG, -0.7), 1.6);
    F.acts.face(joseph, benjamin.position);
    F.acts.face(benjamin, joseph.position);
    await g.talk(data.lines.reveal.slice(3));
    g.note('place/goshen');

    // 창 50:15~21
    await g.talk(data.lines.end.slice(0, 2));
    await Promise.all(brothers.map((b) => F.acts.bow(b, 0.6)));
    await g.talk(data.lines.end.slice(2, 5));
    await Promise.all(brothers.map((b) => F.acts.bow(b, 0)));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.end.slice(5));
    await g.finish({ words: ['word/gen-50-20'], memento: 'item/grain-handful' });
  },
};
