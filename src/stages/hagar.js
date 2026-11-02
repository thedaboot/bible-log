// 곁길 하갈(창 16, 21장): 광야의 샘 찾기(퀘스트) → 여호와의 사자와 브엘라해로이 → 샘가 막간(하갈)
// → 여러 해 뒤 브엘세바 광야 → 하나님께서 눈을 밝히심 → 물 길어 오기(퀘스트) → 퀴즈(창 16:13)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeWell, makeAngel, makeThornBush } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/hagar.js';

const START = V(6, 5);
const DRY = [V(5, -3.5), V(-3, 5)];
const SPRING = V(-1.5, -1.5); // 술 길의 샘(창 16:7)
const HAGAR = SPRING.clone().add(V(1.3, 0.6));
const BUSH = V(-6.5, -5.5); // 브엘세바 광야의 덤불(창 21:15)
const WELL = V(-7.5, 1.5); // 하나님께서 보여 주신 샘(창 21:19)

export default {
  id: 'hagar',
  data,
  records: ['person/hagar', 'person/ishmael', 'place/beer-lahai-roi', 'place/beersheba', 'item/waterskin', 'word/gen-16-13'],
  kicker: '광야로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 1613, start: START, sky: 0xf0e2c2, ground: 0xd2b97e,
      stages: { spring: { c: toCam(SPRING, 1.2), r: 2.8 }, // 샘가에 선 관찰자도 비켜 서게 샘까지 덮는다
        bush: { c: toCam(BUSH, 1.6), r: 2.2 } },
      trees: 5, treeKinds: ['palm'], keep: [...DRY, WELL],
    });
    for (const [p, s] of [[V(3, 1), 1], [V(-4, 7), 0.8], [V(7, -6), 0.9], [V(1, 8), 0.7], [BUSH.clone().add(V(-0.6, -0.5)), 1.2]]) F.put(makeThornBush(s), p, 0.4 * s);
    for (const p of DRY) {
      const crack = new THREE.Mesh(new THREE.CircleGeometry(0.9, 7), mat(0xb89a62));
      crack.rotation.x = -Math.PI / 2;
      crack.position.copy(p).setY(0.02);
      F.group.add(crack);
    }
    // 샘: 처음에는 보이지 않고, 찾으면 물빛과 풀이 돋는다
    const spring = new THREE.Group();
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 10), mat(PAL.water));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.03;
    spring.add(pool);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 4), mat(PAL.leafLight));
      tuft.position.set(Math.cos(a) * 1.1, 0.2, Math.sin(a) * 1.1);
      spring.add(tuft);
    }
    F.put(spring, SPRING, 0.9);
    const well = makeWell();
    well.visible = false;
    F.put(well, WELL, 0.9);
    const messenger = makeAngel();
    messenger.visible = false;
    F.group.add(messenger);
    const hagar = F.person('hagar', { hair: 'long', hairColor: 0x231a16, outfit: 'robe', outfitColor: 0x3f5a8a }, HAGAR);
    const ishmael = F.person('ishmael', { hair: 'curly', hairColor: 0x231a16, outfit: 'tunic', outfitColor: 0xd8c3a0, height: 0.7 }, BUSH.clone().add(V(0.8, 0.8)));
    ishmael.visible = false;
    hagar.visible = false;
    // 가죽 부대(창 21:14)
    const skin = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0).scale(1, 1.3, 0.8), mat(0x8a5a3a));
    skin.visible = false;
    F.group.add(skin);
    Object.assign(F, { hagar, ishmael, spring, well, messenger, skin });
    F.spots = { start: START, spring: SPRING, hagar: HAGAR, bush: BUSH, well: WELL, dry0: DRY[0], dry1: DRY[1] };
    F.solid = ['spring', 'well'];
    spring.visible = false;
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { hagar, ishmael, spring, well, messenger, skin } = F;
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(0, 2));
    // 하갈이 지쳐 앉아 있다
    hagar.visible = true;
    hagar.position.copy(SPRING).add(V(2.6, 1.2));
    F.acts.bow(hagar, 0.4);
    g.meet('hagar');
    await g.talk(data.lines.arrive.slice(2));

    // 퀘스트 1: 광야의 샘 찾기. 마른 자리 둘을 살핀 뒤 샘이 보인다.
    await g.quest({
      title: '광야의 샘',
      targets: DRY.map((p, i) => ({ pos: p, i })),
      text: (t) => `${['동쪽', '북쪽'][t.i]} 마른 땅 살피기`,
      radius: 1.8, hold: 1, holdLabel: () => '땅을 살피는 중',
      onFound: async (t) => { await g.talk([data.lines.dry[t.i]]); g.reward(`dry/${t.i}`, 'step'); },
    });
    spring.visible = true;
    await tween(900, (p) => spring.scale.setScalar(Math.max(0.01, easeBack(p))));
    await g.quest({ title: '광야의 샘', targets: [{ pos: SPRING }], text: () => '샘물 곁에 머무르기', radius: 2, hold: 1.2, holdLabel: () => '샘물을 떠 보는 중' });
    // 마른 땅을 끝까지 살피고 샘을 찾음(인내)
    g.reward('spring-done', 'questDone', null, 'patience');

    // 창 16:7~14: 여호와의 사자가 샘 곁에서 하갈을 부른다.
    await F.acts.bow(hagar, 0);
    await F.acts.walkTo(hagar, HAGAR, 1.2);
    g.cam(SPRING, 12);
    g.stage('spring');
    messenger.position.copy(SPRING).add(V(1.5, -1.6));
    messenger.visible = true;
    messenger.lookAt(hagar.position.x, 0, hagar.position.z);
    F.acts.face(hagar, messenger.position);
    await tween(900, (p) => messenger.position.setY(2 * (1 - easeOut(p))));
    await g.talk(data.lines.spring.slice(0, 6));
    g.note('place/beer-lahai-roi');
    await g.talk(data.lines.spring.slice(6));
    await tween(900, (p) => messenger.position.setY(2 * easeOut(p)));
    messenger.visible = false;

    // 막간: 샘가에서 하갈과 대화한다.
    await g.interlude(hagar);
    g.stage(null);

    // 창 16:15~21:19: 여러 해 뒤 브엘세바 광야. 물이 떨어지고 아이를 덤불 아래 둔다.
    await F.acts.dusk();
    await F.acts.day();
    g.note('person/ishmael');
    g.note('place/beersheba');
    ishmael.visible = true;
    hagar.position.copy(BUSH).add(V(3, -0.6));
    g.place(BUSH.clone().add(V(3.6, 2.8)));
    g.cam(BUSH, 12);
    g.stage('bush');
    skin.visible = true;
    F.acts.carry(skin, hagar);
    await g.talk(data.lines.years.slice(0, 3));
    await F.acts.lie(ishmael);
    F.acts.face(hagar, BUSH.clone().add(V(4, -4)));
    await F.acts.bow(hagar, 0.5);
    await g.talk(data.lines.years.slice(3, 5));
    await F.acts.presence(hagar);
    await g.talk(data.lines.years.slice(5, 7));
    F.acts.presence(null);
    well.visible = true;
    await tween(900, (p) => well.scale.setScalar(Math.max(0.01, easeBack(p))));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.years.slice(7));

    // 퀘스트 2: 하갈의 가죽 부대를 받아 우물에서 물을 채우고 아이에게 가져간다.
    await F.acts.bow(hagar, 0);
    await g.quest({ title: '샘물', targets: [{ pos: hagar.position }], text: () => '하갈에게서 가죽 부대 받기', radius: 1.8 });
    F.acts.carry(skin, g.player);
    await g.quest({ title: '샘물', targets: [{ pos: WELL }], text: () => '우물에 머물러 부대에 물 채우기', radius: 1.9, hold: 1.4, holdLabel: () => '물을 긷는 중' });
    g.reward('water/fill', 'step');
    await g.quest({ title: '샘물', targets: [{ pos: ishmael.position }], text: () => '이스마엘에게 물 가져가기', radius: 1.8 });
    F.acts.carry(skin, null);
    skin.position.copy(ishmael.position).add(V(0.3, 0.3)).setY(0.15);
    // 목마른 아이에게 물을 가져다줌(친절, 마 10:42 냉수 한 그릇)
    g.reward('water-done', 'questDone', null, 'kindness');
    await F.acts.walkTo(hagar, ishmael.position.clone().add(V(0.7, 0.4)));
    await F.acts.lie(ishmael, true);
    g.cam(ishmael.position, 12);
    await g.talk(data.lines.drink);
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-16-13'], memento: 'item/waterskin' });
  },
};
