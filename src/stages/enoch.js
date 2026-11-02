// 곁길 에녹의 동행(창 5:21~24): 함께 걷기(퀘스트, 에녹과 동행) → 중턱 막간(에녹) → 정상에서 하나님께서 데려가심 → 퀴즈(창 5:24)
// 창 5:24는 본문이 말하는 만큼만: 빛기둥 속에서 에녹이 보이지 않게 된다. 죽음 장면이 아니다(히 11:5).
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeTent } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/enoch.js';

const START = V(6, 5);
const HOME = V(4.5, 1.2); // 에녹의 집(장막)
const PATH = [V(2.5, 2.8), V(-0.5, 0.5), V(-3.2, -1.5), V(-5.2, -4.2), V(-7, -6.8)]; // 언덕길
const REST = PATH[2]; // 중턱의 쉼 바위
const TOP = PATH[4];

export default {
  id: 'enoch',
  data,
  records: ['person/enoch', 'person/methuselah', 'item/path-stone', 'word/gen-5-24'],
  kicker: '언덕길로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 5242, start: START, sky: 0xd2e2ee, ground: 0x93a85e,
      stages: { top: { c: toCam(TOP, 2), r: 2.6 }, rest: { c: toCam(REST, 1.2), r: 1.8 } },
      trees: 16, keep: [...PATH],
    });
    F.put(makeTent(0x7a5a3a), HOME.clone().add(V(-1.2, -1.4)), 1.3, Math.PI / 4);
    // 길가의 돌: 길 양쪽에 놓아 언덕길을 보인다
    const stoneM = mat(0x9a9488);
    PATH.forEach((p, i) => {
      if (!i) return;
      const side = V(1, -1).normalize().multiplyScalar(1.4);
      for (const s of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + (i % 2) * 0.08, 0), stoneM);
        st.position.copy(p).addScaledVector(side, s).setY(0.15);
        F.group.add(st);
      }
    });
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), stoneM);
    rock.position.copy(REST).add(V(-0.9, -0.2)).setY(0.3);
    F.group.add(rock);
    F.block(rock.position, 0.5);
    const enoch = F.person('enoch', { hair: 'long', hairColor: 0x9a9590, beard: 'long', outfit: 'robe', outfitColor: 0xf1ead8, item: 'staff' }, PATH[0]);
    const methuselah = F.person('methuselah', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x7f8a4a }, HOME.clone().add(V(0.6, 0.9)));
    Object.assign(F, { enoch, methuselah, rock });
    F.spots = { start: START, home: HOME, rest: REST, top: TOP };
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { enoch, methuselah } = F;
    F.acts.face(enoch, START);
    g.cam(PATH[0].clone().lerp(TOP, 0.4), 15);
    await g.talk(data.lines.arrive.slice(0, 3));
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(3));
    g.meet('enoch');
    const removeGreet = g.greet(methuselah, data.greetings.methuselah, 'methuselah');

    // 퀘스트: 함께 걷기. 에녹이 길을 따라 걷고, 곁에 머무는 동안 게이지가 찬다(움직이는 목표).
    const walkLeg = async (to, n) => {
      const going = F.acts.walkTo(enoch, to, 1.1);
      await g.quest({
        title: '에녹과 함께 걷기',
        targets: [{ pos: enoch.position, name: '에녹' }],
        text: () => `에녹 곁에서 걷기 ${n} / 4`,
        radius: 2.4, hold: 2.2, holdLabel: () => '에녹 곁에서 걷는 중',
      });
      await going;
      g.reward(`walk/${n}`, 'step');
    };
    await walkLeg(PATH[1], 1);
    await walkLeg(REST, 2);
    removeGreet();

    // 막간: 중턱 바위에서 쉬며 에녹과 대화한다.
    g.cam(REST, 12);
    g.stage('rest');
    await F.acts.walkTo(enoch, REST.clone().add(V(-0.4, 0.3)));
    await g.interlude(enoch);
    g.stage(null);
    g.cam(null, 13);
    await walkLeg(PATH[3], 3);
    await walkLeg(TOP, 4);
    // 동행: 에녹은 믿음으로 하나님을 기쁘시게 했다(히 11:5~6, 신실). 퀘스트 열매는 화평(동행하는 고요함, 창 5:22 → 미 6:8 겸손히 함께 행함)
    g.reward('walk-done', 'questDone', null, 'peace');
    g.meet('enoch', 'walked', 'faith');

    // 창 5:24: 정상에서 빛기둥이 내리고 에녹이 보이지 않게 된다.
    g.cam(TOP, 12);
    g.stage('top');
    await g.talk(data.lines.walked);
    F.acts.face(enoch, TOP.clone().add(V(-1, -1)));
    await F.acts.pillar(TOP);
    await g.talk(data.lines.taken.slice(0, 1));
    const { rig } = enoch.userData;
    enoch.userData.pose = 'rise';
    await tween(2400, (p) => { rig.position.y = easeOut(p) * 2.5; rig.scale.setScalar(Math.max(0.01, 1 - p)); });
    enoch.visible = false;
    await F.acts.pillar(null);
    await g.talk(data.lines.taken.slice(1));
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-5-24'], memento: 'item/path-stone' });
  },
};
