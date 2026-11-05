// 1-11 얍복 강과 화해(창 32~33장): 하란의 스무 해는 서술 → 깊은 대화(야곱, 조건) → 나루 살피기(퀘스트) → 가족과 떼가 건넘
// → 홀로 남은 야곱에게 돌아가기 → 밤새 씨름(도전) → 새벽, 이스라엘과 브니엘 → 에서를 만남(일곱 번 엎드림, 껴안음)
// → 막간(에서) → 창 33:10 → 퀴즈(창 32:28)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, setArms } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/jabbok.js';

const ALONG = V(1, -1).normalize(); // 강이 흐르는 방향(화면 가로)
const FRONT = V(1, 1).normalize(); // 카메라 쪽 = 이쪽 둑
const FORD = V(0, 0); // 얍복 나루(여울)
const START = V(6, 5);
const CAMP = FORD.clone().addScaledVector(FRONT, 3.4).addScaledVector(ALONG, -2.4); // 이쪽 둑의 야곱 장막 자리
const WRESTLE = FORD.clone().addScaledVector(FRONT, 3).addScaledVector(ALONG, 2.6); // 홀로 남아 씨름한 자리
const FAR = FORD.clone().addScaledVector(FRONT, -3.2); // 건너편 둑
const MEET = FAR.clone().addScaledVector(FRONT, -1.6).addScaledVector(ALONG, 1.4); // 에서를 만나는 자리
const ESAU_FROM = MEET.clone().addScaledVector(FRONT, -5).addScaledVector(ALONG, 2);

export default {
  id: 'jabbok',
  data,
  records: ['place/jabbok', 'place/peniel', 'person/the-man', 'creature/goat', 'item/jacob-staff', 'word/gen-32-28'],
  kicker: '얍복 강가로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 3228, start: START, sky: 0xd0d8c8, ground: 0x7f9a5a,
      stages: { wrestle: { c: toCam(WRESTLE, 1.4), r: 2 }, meet: { c: toCam(MEET, 1.6), r: 2.4 } },
      trees: 12, keep: [CAMP, WRESTLE, FAR, MEET, ESAU_FROM],
    });
    // 강: 화면 가로로 흐르는 물줄기. 나루(가운데 폭 2.4)만 얕아서 건널 수 있다.
    const river = new THREE.Mesh(new THREE.BoxGeometry(30, 0.04, 2), mat(PAL.water));
    river.position.copy(FORD).setY(0.02);
    river.rotation.y = -Math.atan2(ALONG.z, ALONG.x);
    F.group.add(river);
    for (let k = -14; k <= 14; k += 0.5) if (Math.abs(k) > 1.2) F.block(FORD.clone().addScaledVector(ALONG, k), 0.95);
    // 여울의 디딤돌
    for (const k of [-0.6, 0.6]) for (const f of [-0.6, 0, 0.6]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.08, 6), mat(0xa39a8a));
      st.position.copy(FORD).addScaledVector(ALONG, k).addScaledVector(FRONT, f).setY(0.05);
      F.group.add(st);
    }
    const jacob = F.person('jacob', { hair: 'short', hairColor: 0x6b4428, beard: 'long', outfit: 'traveler', outfitColor: 0x8a6a4a, item: 'staff' }, CAMP);
    const family = [
      { hair: 'long', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0x6e3f73 },
      { hair: 'braid', hairColor: 0x231a16, outfit: 'robe', outfitColor: 0xb8452f },
      { hair: 'short', hairColor: 0x231a16, outfit: 'tunic', outfitColor: 0xd8c3a0, height: 0.75 },
      { hair: 'curly', hairColor: 0x3e2a1e, outfit: 'tunic', outfitColor: 0x9a6b45, height: 0.7 },
    ].map((spec, i) => F.person(`family${i}`, spec, CAMP.clone().addScaledVector(ALONG, -1 - i * 0.9).addScaledVector(FRONT, 0.6)));
    const flock = [['sheep', 0xf5f5f0, 0.8], ['sheep', 0xeeeae0, 0.75], ['generic', 0x5a4a3a, 0.7], ['camel', 0xc8a070, 0.85]]
      .map(([k, c, s], i) => F.animal(k, c, s, CAMP.clone().addScaledVector(ALONG, -4 - i * 1.1).addScaledVector(FRONT, 1.4), { roam: 0.8 }));
    // 그 사람: 얼굴 없는 빛나는 형체(창 32:24, 32:30)
    const man = F.person('man', { ghost: 0xe8e0ff, skin: 0xe8e0ff, hair: 'none', hairColor: 0xffffff, outfit: 'robe', outfitColor: 0xffffff }, WRESTLE.clone().addScaledVector(ALONG, 0.7));
    man.visible = false;
    const esau = F.person('esau', { hair: 'curly', hairColor: 0x8a4f2c, beard: 'long', outfit: 'shepherd', outfitColor: 0x9a6b45 }, ESAU_FROM);
    const men = [0, 1, 2, 3, 4].map((i) => F.person(`esau-man${i}`, { hair: 'short', hairColor: PAL.hairDark, outfit: 'tunic', outfitColor: 0x7f5a3a }, ESAU_FROM.clone().addScaledVector(ALONG, (i - 2) * 1).addScaledVector(FRONT, -1.2)));
    [esau, ...men].forEach((f) => (f.visible = false));
    Object.assign(F, { jacob, family, flock, man, esau, men });
    F.spots = { start: START, camp: CAMP, wrestle: WRESTLE, far: FAR, meet: MEET };
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { jacob, family, flock, man, esau, men } = F;
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(0, 3));
    g.meet('jacob');
    await g.talk(data.lines.arrive.slice(3, 4));
    F.acts.face(jacob, FORD);
    await F.acts.bow(jacob, 0.35);
    await g.talk(data.lines.arrive.slice(4, 5));
    await F.acts.bow(jacob, 0);
    await g.talk(data.lines.arrive.slice(5));
    await F.acts.dusk();

    // 깊은 대화(야곱): 나루를 살피기 전에 야곱 곁에 가면 열린다.
    const removeDeep = g.deep(jacob, data.deep);
    // 퀘스트 1: 나루 살피기. 여울 가운데와 건너편 둑을 밟아 보고 돌아온다.
    await g.quest({
      title: '얍복 나루',
      targets: [{ pos: FORD.clone(), i: 0 }, { pos: FAR.clone(), i: 1 }],
      text: (t) => ['여울 가운데 디딤돌 밟아 보기', '건너편 둑까지 건너 보기'][t.i],
      radius: 1.4,
      onFound: async (t) => g.reward(`ford/${t.i}`, 'step'),
    });
    removeDeep();
    // 가족과 떼가 나루를 건넌다(창 32:22~23)
    g.cam(FORD, 14);
    family.forEach((f, i) => F.acts.walkTo(f, FAR.clone().addScaledVector(ALONG, -1.5 - i * 0.9), 1.4));
    flock.forEach((an, i) => { an.userData.route = [FORD.clone().addScaledVector(FRONT, 0.6), FAR.clone().addScaledVector(ALONG, -5 - i), ]; an.userData.home = FAR.clone().addScaledVector(ALONG, -5 - i).addScaledVector(FRONT, -1); });
    await g.talk(data.lines.crossed.slice(0, 1));
    // 길을 앞서 살펴 가족이 무사히 건넘(선함)
    g.reward('ford-done', 'questDone', null, 'goodness');

    // 홀로 남은 야곱에게 돌아간다
    // 밤이 드는 동안 야곱이 씨름 자리로 걷고, 관찰자는 곧바로 움직일 수 있다(기다리는 구간 3초 이하)
    const toWrestle = F.acts.walkTo(jacob, WRESTLE, 1.4);
    await F.acts.night();
    g.cam(null, 13);
    await g.quest({ title: '홀로 남은 밤', targets: [{ pos: WRESTLE.clone().addScaledVector(ALONG, -1.6).addScaledVector(FRONT, 0.6) }], text: () => '이쪽 둑의 야곱에게 돌아가기', radius: 1.6 });
    await toWrestle;
    man.visible = true;
    g.note('person/the-man');
    F.acts.face(jacob, man.position);
    F.acts.face(man, jacob.position);
    g.cam(WRESTLE, 11);
    await g.talk(data.lines.crossed.slice(1));

    // 도전 자리는 야곱 왼쪽으로 떨어뜨린다(관찰자 오른쪽에 서는 대천사가 씨름하는 둘과 겹치지 않게).
    // 도전: 밤새 씨름. 금빛 구간에 맞춰 야곱과 함께 버틴다. 끝까지 놓지 않는 인내와 절제가 돕는다(창 32:26).
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
    await g.talk(data.lines.dawn.slice(0, 1));
    jacob.userData.limp = true; // 허벅지 관절이 어긋나 이 뒤로 절며 걷는다(창 32:25, 31)
    await F.acts.bow(jacob, 0.25);
    await g.talk(data.lines.dawn.slice(1, 7));
    await F.acts.bow(jacob, 0);
    await tween(1200, (p) => man.userData.rig.scale.setScalar(Math.max(0.01, 1 - p)));
    man.visible = false;
    await g.talk(data.lines.dawn.slice(7));
    g.note('place/peniel');
    g.note('place/jabbok');
    await F.acts.day();

    // 창 33:1~4 에서를 만난다. 야곱이 절뚝이며 건너 일곱 번 엎드리고, 에서가 달려와 껴안는다.
    g.cam(MEET, 14);
    g.stage('meet');
    [esau, ...men].forEach((f) => (f.visible = true));
    // 장면이 바뀌는 사이 야곱은 강을 건너 건너편 둑에 와 있다(절뚝이는 걸음이 대사 한 줄 안에 끝나게)
    jacob.position.copy(FAR.clone().addScaledVector(ALONG, 0.6));
    const limp = F.acts.walkTo(jacob, MEET.clone().addScaledVector(ALONG, -0.6), 0.9);
    await g.talk(data.lines.meet.slice(0, 1));
    await limp;
    F.acts.face(jacob, ESAU_FROM);
    // 야곱이 일곱 번 엎드리며 다가가는 동안 에서가 달려온다(창 33:3~4). 절은 대사와 함께 진행한다.
    const bows = (async () => { for (let i = 0; i < 7; i++) { await F.acts.prostrate(jacob, ESAU_FROM, 0.3); await F.acts.rise(jacob, 0.3); } })(); // 창 33:3 땅에 굽힘(R5)
    const run = F.acts.walkTo(esau, MEET.clone().addScaledVector(ALONG, 0.4), 3);
    await g.talk(data.lines.meet.slice(1, 2));
    await Promise.all([bows, run]);
    // 에서가 야곱을 맞아 목을 안고 함께 운다(창 33:4)
    const hug = F.acts.embrace(esau, jacob);
    men.forEach((m, i) => F.acts.walkTo(m, MEET.clone().addScaledVector(FRONT, -2.4).addScaledVector(ALONG, (i - 2) * 1.1), 1.4));
    await g.talk(data.lines.meet.slice(2));
    await hug;
    g.meet('esau');
    g.note('creature/goat');

    // 막간: 떼가 쉬는 동안 에서와 대화한다.
    await g.interlude(esau);
    g.cam(MEET, 12);
    await g.talk(data.lines.after);
    g.stage(null);
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-32-28'], memento: 'item/jacob-staff' });
  },
};
