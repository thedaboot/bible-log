// 곁길 에녹의 동행(창 5:21~24). 걷는 동안 함께 하는 일 넷:
// 갈림길에서 함께 기도(게이지) → 길 잃은 어린양 데려오기(목표 둘) → 중턱 막간(에녹) → 언덕 끝에서 예언 듣기(유 1:14~15)
// → 빛기둥으로 함께 걷기(움직이는 목표) → 하나님께서 데려가심 → 퀴즈(창 5:24)
// 창 5:24는 본문이 말하는 만큼만: 빛기둥 속에서 에녹이 보이지 않게 된다. 죽음 장면이 아니다(히 11:5).
// 경로: 므두셀라(짧은 인사)는 장막 동쪽에 두어, 에녹의 언덕길과 퀘스트 목표 사이 길에서 2.2 안으로 들어오지 않게 한다.
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeTent, makeThornBush } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/enoch.js';

const START = V(6, 5);
const HOME = V(4.5, 1.2); // 에녹의 집(장막)
const PATH = [V(2.5, 2.8), V(-0.5, 0.5), V(-3.2, -1.5), V(-5.2, -4.2), V(-7, -6.8)]; // 언덕길
const FORK = PATH[1]; // 갈림길: 기도하는 자리
const WAIT = PATH[1].clone().lerp(PATH[2], 0.5); // 어린양 소리를 듣고 서는 자리
const LAMB = WAIT.clone().add(V(-1.6, 1.6)); // 길 밖 가시덤불(각색). 길의 화면 왼쪽: 관찰자 오른쪽의 대천사에 가리지 않는다
const REST = PATH[2]; // 중턱의 쉼 바위
const LOOK = PATH[3]; // 언덕 끝: 예언하는 자리
const TOP = PATH[4];
const SON = V(7, 0.6); // 므두셀라: 장막 동쪽, 언덕길 반대편
const BY = V(0.9, -0.9); // 관찰자는 에녹의 화면 오른쪽에 선다(에녹이 화면 왼쪽)
const LEFT = V(-0.7, 0.7); // 어린양은 따라가는 사람의 화면 왼쪽

export default {
  id: 'enoch',
  data,
  records: ['person/enoch', 'person/methuselah', 'item/path-stone', 'word/gen-5-24'],
  kicker: '언덕길로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 5242, start: START, sky: 0xd2e2ee, ground: 0x93a85e,
      stages: { top: { c: toCam(TOP, 2), r: 2.6 }, rest: { c: toCam(REST, 1.2), r: 1.8 } },
      trees: 16, keep: [...PATH, LAMB],
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
    // 가시덤불과 거기 걸린 어린양(각색: 본문에 없는 일, 눅 15:4 잃은 양을 찾음)
    F.put(makeThornBush(1.3), LAMB.clone().add(V(-0.5, -0.5)));
    const lamb = F.animal('sheep', 0xf2ede2, 0.6, LAMB, { still: true });
    const enoch = F.person('enoch', { hair: 'long', hairColor: 0x9a9590, beard: 'long', outfit: 'robe', outfitColor: 0xf1ead8, item: 'staff' }, PATH[0]);
    const methuselah = F.person('methuselah', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x7f8a4a }, SON);
    Object.assign(F, { enoch, methuselah, rock, lamb });
    F.spots = { start: START, home: HOME, fork: FORK, lamb: LAMB, rest: REST, look: LOOK, top: TOP };
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { enoch, methuselah, lamb } = F;
    F.acts.face(methuselah, START);
    // 족보 서술 동안 에녹은 갈림길로 걸어가 기도하며 선다.
    const toFork = F.acts.walkTo(enoch, FORK, 1.1).then(() => { F.acts.face(enoch, FORK.clone().add(V(-1, -1))); return F.acts.bow(enoch, 0.35); });
    g.cam(PATH[0].clone().lerp(TOP, 0.4), 15);
    await g.talk(data.lines.arrive.slice(0, 3));
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(3));
    g.meet('enoch');
    const removeGreet = g.greet(methuselah, data.greetings.methuselah, 'methuselah');
    await toFork;

    // 1. 갈림길에서 함께 기도하기: 곁에 머무는 동안 게이지가 찬다(창 4:26 여호와의 이름을 부름, 창 5:22 동행).
    await g.quest({
      title: '에녹의 동행', targets: [{ pos: FORK.clone().add(BY) }],
      text: () => '갈림길에서 에녹과 함께 기도하기', radius: 1.6, hold: 2.4, holdLabel: () => '에녹 곁에서 함께 기도하는 중',
    });
    await F.acts.bow(enoch, 0);
    F.acts.face(enoch, g.player.position);
    await g.talk(data.lines.prayed);
    g.reward('pray', 'step');

    // 2. 길 잃은 어린양: 덤불에서 빼내고(머무르기), 따라오는 어린양을 에녹에게 데려간다(각색).
    const toWait = F.acts.walkTo(enoch, WAIT, 1.1);
    g.cam(LAMB, 13);
    await g.talk(data.lines.lamb);
    g.cam(null, 13);
    await toWait;
    F.acts.face(enoch, LAMB);
    await g.quest({
      title: '에녹의 동행', targets: [{ pos: LAMB.clone().add(V(0.7, 0.7)) }],
      text: () => '가시덤불에서 어린양 빼내기', radius: 1.6, hold: 1.4, holdLabel: () => '가시를 하나씩 떼어 내는 중',
    });
    Object.assign(lamb.userData, { lead: g.player, leadOffset: LEFT });
    g.reward('lamb', 'step');
    await g.quest({ title: '에녹의 동행', targets: [{ pos: enoch.position }], text: () => '어린양을 에녹에게 데려가기', radius: 1.8 });
    F.acts.face(enoch, g.player.position);
    Object.assign(lamb.userData, { lead: enoch });
    await g.talk(data.lines.found);
    g.reward('lamb-back', 'step');

    // 막간: 중턱 바위에서 쉬며 에녹과 대화한다. 어린양은 에녹 곁에 따라와 앉는다.
    g.cam(REST, 12);
    g.stage('rest');
    await F.acts.walkTo(enoch, REST.clone().add(V(-0.4, 0.3)));
    await g.interlude(enoch);
    g.stage(null);
    g.cam(null, 13);

    // 3. 언덕 끝에서 함께 내려다보기: 에녹이 사람들을 두고 예언한다(유 1:14~15).
    const toLook = F.acts.walkTo(enoch, LOOK, 1.1);
    await g.quest({
      title: '에녹의 동행', targets: [{ pos: LOOK.clone().add(BY) }],
      text: () => '언덕 끝에서 에녹과 함께 내려다보기', radius: 1.6, hold: 1.6, holdLabel: () => '에녹과 같은 쪽을 보는 중',
    });
    await toLook;
    Object.assign(lamb.userData, { lead: null, home: lamb.position.clone(), still: true });
    removeGreet();
    g.cam(LOOK, 12);
    g.stage('top');
    F.acts.face(enoch, g.player.position);
    await g.talk(data.lines.prophecy);
    g.reward('prophecy', 'step');

    // 4. 빛기둥으로 함께 걷기: 정상에 빛기둥이 내리고, 에녹이 그쪽으로 걷는다(움직이는 목표).
    g.cam(TOP, 13);
    await F.acts.pillar(TOP);
    await g.talk(data.lines.walked);
    g.stage(null);
    g.cam(null, 13);
    const toTop = F.acts.walkTo(enoch, TOP, 0.9);
    await g.quest({
      title: '에녹의 동행', targets: [{ pos: enoch.position }],
      text: () => '빛 쪽으로 에녹과 함께 걷기', radius: 2.4, hold: 2.4, holdLabel: () => '에녹 곁에서 걷는 중',
    });
    await toTop;
    // 동행: 에녹은 믿음으로 하나님을 기쁘시게 했다(히 11:5~6, 신실). 퀘스트 열매는 화평(동행하는 고요함, 창 5:22 → 미 6:8 겸손히 함께 행함)
    g.reward('walk-done', 'questDone', null, 'peace');
    g.meet('enoch', 'walked', 'faith');

    // 창 5:24: 빛기둥 속에서 에녹이 보이지 않게 된다.
    g.cam(TOP, 12);
    g.stage('top');
    F.acts.face(enoch, g.player.position);
    const { rig } = enoch.userData;
    enoch.userData.pose = 'rise';
    const rise = tween(2400, (p) => { rig.position.y = easeOut(p) * 2.5; rig.scale.setScalar(Math.max(0.01, 1 - p)); });
    await g.talk(data.lines.taken.slice(0, 1));
    await rise;
    enoch.visible = false;
    await F.acts.pillar(null);
    g.cam(lamb.position.clone(), 12);
    await g.talk(data.lines.taken.slice(1, 2));
    g.cam(TOP, 12);
    await g.talk(data.lines.taken.slice(2));
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-5-24'], memento: 'item/path-stone' });
  },
};
