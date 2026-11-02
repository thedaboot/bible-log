// 1-9 우물가의 리브가(창 24장): 나홀의 성 우물가, 종의 기도 → 물동이 얻기(도구) → 리브가가 나옴
// → 낙타 물 주기(도전, 리브가와 동행) → 막간(리브가) → 금붙이와 종의 찬송(창 24:27) → 라반의 집으로
// → 리브가의 대답과 이삭의 들 → 퀴즈(창 24:27)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeWell } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/rebekah.js';

const START = V(6, 5);
const WELL = V(0, -1);
const SERVANT = WELL.clone().add(V(1.6, 1.2));
const TROUGHS = [V(-2.6, 1.2), V(-0.6, 2.6), V(2.6, -2.8)]; // 낙타 앞 물구유(무릎 꿇은 낙타 곁)
const HOUSE = V(-6.5, -5); // 브두엘의 집(창 24:23)
const GATE = HOUSE.clone().add(V(2.2, 2.2));
const FIELD = V(7.5, -5.5);
const ALONG = V(1, -1).normalize(); // 이삭이 묵상하던 들(창 24:63)

export default {
  id: 'rebekah',
  data,
  records: ['person/rebekah', 'person/laban', 'person/servant', 'creature/camel', 'place/nahor', 'item/gold-ring', 'word/gen-24-27'],
  kicker: '나홀의 성으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 2427, start: START, sky: 0xf0d8b8, ground: 0xbfae72,
      stages: { well: { c: toCam(WELL, 2.2), r: 2.2 }, field: { c: toCam(FIELD, 1.4), r: 1.8 } },
      trees: 9, treeKinds: ['palm', 'round'], keep: [...TROUGHS, GATE, FIELD],
    });
    F.put(makeWell(), WELL, 0.95);
    // 나홀의 성: 흙벽돌 집들
    for (const [dx, dz, s] of [[0, 0, 1.2], [-2, 1.4, 0.9], [1.5, -2, 1]]) {
      const house = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 1.1 * s, 1.5 * s), mat(0xd2b48a));
      F.put(house, HOUSE.clone().add(V(dx, dz)), 1 * s);
      house.position.y = 0.55 * s;
    }
    // 물구유와 낙타: 낙타는 무릎을 꿇은 듯 낮게 둔다(창 24:11)
    const camels = [];
    TROUGHS.forEach((t, i) => {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.4), mat(0x8a7a62));
      trough.position.copy(t).add(V(-0.6, -0.6)).setY(0.12);
      trough.rotation.y = Math.PI / 4;
      F.group.add(trough);
      const water = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.28), mat(PAL.water));
      water.position.copy(trough.position).setY(0.2);
      water.rotation.y = Math.PI / 4;
      water.scale.x = 0.01;
      F.group.add(water);
      F.block(trough.position, 0.45);
      const camel = F.animal('camel', 0xc8a070, 1, t.clone().add(V(-1.6, -1.6)), { still: true });
      camel.userData.yaw = -Math.PI / 4; // 화면 가로로 서서 옆모습(혹과 긴 목)이 보인다
      camel.position.y = -0.25; // 무릎 꿇은 듯 낮게(창 24:11)
      camels.push({ camel, water });
    });
    const servant = F.person('servant', { hair: 'short', hairColor: 0xd8d4cc, beard: 'long', outfit: 'traveler', outfitColor: 0x5a4a3a }, SERVANT);
    const rebekah = F.person('rebekah', { hair: 'braid', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xb8452f, item: 'jar' }, HOUSE.clone().add(V(2.6, 1.2)));
    const laban = F.person('laban', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x6e3f73 }, GATE.clone().addScaledVector(ALONG, -1.6));
    const isaac = F.person('isaac', { hair: 'short', hairColor: PAL.hairBrown, beard: 'short', outfit: 'robe', outfitColor: 0xd8c3a0 }, FIELD);
    isaac.visible = false;
    rebekah.visible = false;
    Object.assign(F, { servant, rebekah, laban, isaac, camels });
    F.spots = { start: START, well: WELL, servant: SERVANT, gate: GATE, field: FIELD, ...Object.fromEntries(TROUGHS.map((t, i) => [`trough${i}`, t])) };
    F.solid = ['well'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { servant, rebekah, laban, isaac, camels } = F;
    g.cam(WELL, 13);
    g.stage('well');
    await g.talk(data.lines.arrive.slice(0, 2));
    g.note('place/nahor');
    g.note('creature/camel');
    await F.acts.dusk();
    await g.talk(data.lines.arrive.slice(2, 3));
    F.acts.face(servant, WELL);
    await F.acts.bow(servant, 0.35);
    await g.talk(data.lines.arrive.slice(3));
    await F.acts.bow(servant, 0);
    g.stage(null);
    g.cam(null, 13);

    // 도구 얻기: 종에게 다가가면 짐 속의 빈 물동이를 건넨다(같은 스테이지 앞부분에서 얻는다).
    await g.quest({ title: '나홀의 우물', targets: [{ pos: servant.position }], text: () => '늙은 종에게 다가가기', radius: 1.8 });
    g.meet('servant');
    F.acts.face(servant, g.player.position);
    await g.talk(data.lines.jar);
    g.giveTool('jar');
    g.hold('jar');

    // 리브가가 물동이를 메고 나온다(창 24:15~19)
    rebekah.visible = true;
    g.cam(WELL, 12);
    g.stage('well');
    await F.acts.walkTo(rebekah, WELL.clone().add(V(-0.6, 1.3)), 1.6);
    F.acts.face(rebekah, servant.position);
    F.acts.face(servant, rebekah.position);
    g.meet('rebekah');
    await g.talk(data.lines.came.slice(0, 4));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.came.slice(4));

    // 도전: 낙타 물 주기. 물구유마다 F로 물동이를 기울이고, Space로 금빛 구간에 맞춰 붓는다. 리브가가 곁에서 함께 붓는다.
    const spots = TROUGHS.map((t, i) => ({ pos: t, text: `${['서쪽', '앞쪽', '동쪽'][i]} 물구유 채우기`, tool: true, i }));
    await g.challenge({
      title: '낙타 물 주기', spots, verb: '물 붓기', hits: 2, tool: 'jar', toolName: '물동이', fruits: ['kindness', 'patience'],
      onTool: async (sp) => { await F.acts.walkTo(rebekah, sp.pos.clone().add(V(-0.9, 0.5)), 2.6); F.acts.face(rebekah, sp.pos.clone().add(V(-0.6, -0.6))); },
      onHit: async (sp, n) => {
        F.acts.speak('rebekah');
        const w = camels[sp.i].water;
        const from = w.scale.x;
        await tween(400, (p) => (w.scale.x = from + (n / 2 - from) * easeOut(p)));
        g.reward(`water/${sp.i}/${n}`, 'step');
      },
    });
    // 나그네의 낙타까지 마시게 한 수고(친절, 창 24:19~20). 리브가와 함께 물을 길어 동행에 이른다(창 24:20 급히 → 선함).
    g.reward('water-done', 'challenge', null, 'kindness');
    g.meet('rebekah', 'walked', 'goodness');

    // 막간: 우물가에서 리브가와 대화한다(창 24:21~22 사이).
    await F.acts.walkTo(rebekah, WELL.clone().add(V(-0.4, 1.4)), 1.6);
    await g.interlude(rebekah);

    // 창 24:21~27 금붙이와 종의 찬송
    g.cam(WELL, 12);
    g.stage('well');
    await F.acts.walkTo(servant, rebekah.position.clone().add(V(1.1, -0.6)), 1.4);
    F.acts.face(servant, rebekah.position);
    F.acts.face(rebekah, servant.position);
    await g.talk(data.lines.watered.slice(0, 3));
    await F.acts.bow(servant, 0.5);
    await g.talk(data.lines.watered.slice(3));
    await F.acts.bow(servant, 0);
    g.stage(null);

    // 리브가의 집으로 따라간다. 성문 앞의 라반이 맞는다(창 24:29~31).
    const removeGreet = g.greet(laban, data.greetings.laban, 'laban');
    F.acts.walkTo(rebekah, GATE.clone().addScaledVector(ALONG, 0.2), 1.4); // 성문 앞에 화면 가로로 늘어선다(라반·리브가·종)
    F.acts.walkTo(servant, GATE.clone().addScaledVector(ALONG, 1.8), 1.3);
    g.cam(null, 13);
    await g.quest({ title: '브두엘의 집', targets: [{ pos: GATE.clone().add(V(1.8, 1.8)) }], text: () => '리브가를 따라 집으로 가기', radius: 1.6 });
    removeGreet();
    g.note('person/laban');
    g.cam(GATE, 12);
    await g.talk(data.lines.go.slice(0, 4));

    // 창 24:63~67 이삭의 들
    await F.acts.dusk();
    isaac.visible = true;
    g.cam(FIELD, 13);
    g.stage('field');
    F.acts.face(isaac, GATE);
    rebekah.position.copy(FIELD).add(V(-4, 1));
    servant.position.copy(FIELD).add(V(-4.6, 2));
    await g.talk(data.lines.go.slice(4, 5));
    await Promise.all([F.acts.walkTo(rebekah, FIELD.clone().add(V(-1, 0.4)), 1.4), F.acts.walkTo(isaac, FIELD.clone().add(V(-0.2, -0.2)), 1)]);
    F.acts.face(isaac, rebekah.position);
    F.acts.face(rebekah, isaac.position);
    await g.talk(data.lines.go.slice(5, 6));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.go.slice(6));
    await g.finish({ words: ['word/gen-24-27'], memento: 'item/gold-ring' });
  },
};
