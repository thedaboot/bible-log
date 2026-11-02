// 1-8 모리아 산(창 22장): 사흘 길 끝 산 아래(창 22:4~5) → 깊은 대화(아브라함, 조건) → 막간(이삭)
// → 산 오르기(퀘스트: 길목마다 앞서 기다리기) → 창 22:7~8 → 제단(멀리서) → 여호와의 사자가 부름(여기서 멈춤)
// → 숫양과 여호와 이레 → 퀴즈(창 22:14). 폭력 연출 규칙: 칼을 든 장면은 멀리서, 서술로만(quests-and-staging.md).
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAltar, makeLogs, makeThornBush, makeAngel } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/moriah.js';

const START = V(6, 5);
const FOOT = V(4, 1.5); // 산 아래, 종들과 나귀가 남는 곳(창 22:5)
const TRAIL = [V(1.5, -0.8), V(-1.5, -2.8), V(-4.2, -4.6)]; // 오르는 길목
const PEAK = V(-6.5, -6.5);
const ALTAR = PEAK.clone().add(V(0.4, 0.4));
const THICKET = PEAK.clone().add(V(-1.6, 1.4)); // 숫양이 뿔이 걸린 덤불(창 22:13)
const FAR = PEAK.clone().add(V(6, 6)); // 제단 장면을 멀리서 비추는 점

export default {
  id: 'moriah',
  data,
  records: ['person/isaac', 'person/youth', 'place/moriah', 'creature/ram', 'item/firewood', 'word/gen-22-14'],
  kicker: '모리아 땅으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 2214, start: START, sky: 0xdfe0dc, ground: 0x9a9a6a,
      stages: { foot: { c: toCam(FOOT, 1.2), r: 1.8 }, peak: { c: toCam(PEAK, 2.6), r: 2.6 } },
      trees: 14, treeKinds: ['pine', 'round', 'pine'], keep: [...TRAIL],
    });
    // 산: 길을 따라 높아지는 둔덕(겉모양만, 걷는 높이는 평평하다)
    TRAIL.concat([PEAK]).forEach((p, i) => {
      const mound = new THREE.Mesh(new THREE.CylinderGeometry(1.6 + i * 0.3, 2 + i * 0.4, 0.12 + i * 0.08, 9), mat(0x8a8a5c));
      mound.position.copy(p).setY((0.12 + i * 0.08) / 2 - 0.02);
      F.group.add(mound);
    });
    const altar = makeAltar(1.1);
    altar.visible = false;
    F.put(altar, ALTAR, 0.6);
    F.put(makeThornBush(1.3), THICKET, 0.5);
    const abraham = F.person('abraham', { hair: 'short', hairColor: 0xd8d4cc, beard: 'long', outfit: 'traveler', outfitColor: 0x7f5a3a }, FOOT.clone().add(V(-0.4, -1.2)));
    const isaac = F.person('isaac', { hair: 'short', hairColor: PAL.hairBrown, outfit: 'tunic', outfitColor: 0xd8c3a0, height: 0.95 }, FOOT.clone().add(V(-1.4, -0.2)));
    const servants = [V(5.6, 0.2), V(6.2, 1.6)].map((p, i) => F.person(`servant${i}`, { hair: 'short', hairColor: PAL.hairDark, outfit: 'tunic', outfitColor: 0x9a6b45 }, p));
    const donkey = F.animal('donkey', 0x8a7a6a, 0.85, V(6.6, -0.8), { roam: 0.8 });
    const ram = F.animal('ram', 0xe8e2d4, 0.9, THICKET.clone().add(V(0.9, 0.4)), { still: true });
    ram.visible = false;
    // 이삭이 진 나뭇단(창 22:6)
    const wood = makeLogs(4);
    F.group.add(wood);
    F.acts.carry(wood, isaac);
    const messenger = makeAngel();
    messenger.visible = false;
    F.group.add(messenger);
    Object.assign(F, { abraham, isaac, servants, donkey, ram, wood, altar, messenger });
    F.spots = { start: START, foot: FOOT, peak: PEAK, altar: ALTAR, ...Object.fromEntries(TRAIL.map((t, i) => [`trail${i}`, t])) };
    F.solid = ['altar', 'peak'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { abraham, isaac, servants, ram, wood, altar, messenger } = F;
    g.meet('abraham');
    g.cam(PEAK.clone().lerp(FOOT, 0.5), 16);
    await g.talk(data.lines.arrive.slice(0, 1));
    await F.acts.presence(abraham);
    await g.talk(data.lines.arrive.slice(1, 2));
    F.acts.presence(null);
    g.note('place/moriah');
    g.cam(FOOT, 13);
    g.stage('foot');
    await g.talk(data.lines.arrive.slice(2));
    g.stage(null);

    // 깊은 대화(아브라함): 관계 "대화" 이상 + 레벨 조건이면 열린다. 산 아래에서 오르기 전에 곁에 가면 된다.
    // 막간(이삭)은 깊은 대화 자리와 따로, 이삭에게 다가가 시작한다.
    const removeDeep = g.deep(abraham, data.deep);
    const removeGreet = g.greet(servants[0], data.greetings.youth, 'youth');
    await g.quest({ title: '산 아래', targets: [{ pos: isaac.position, name: '이삭' }], text: () => '나뭇단을 진 이삭에게 가기', radius: 1.8 });
    removeGreet();
    g.meet('isaac');
    g.cam(isaac.position, 12);
    await g.interlude(isaac);
    removeDeep();
    g.cam(null, 13);

    // 퀘스트: 산 오르기. 길목마다 먼저 가서 두 사람이 올 때까지 곁에 머문다(함께 나아감, 창 22:6, 22:8).
    await g.talk(data.lines.climb);
    for (const [i, p] of TRAIL.entries()) {
      const going = Promise.all([F.acts.walkTo(abraham, p.clone().add(V(0.6, -0.5)), 1.1), F.acts.walkTo(isaac, p.clone().add(V(-0.3, 0.6)), 1.1)]);
      await g.quest({ title: '산 오르기', targets: [{ pos: p }], text: () => `${['첫째', '둘째', '셋째'][i]} 길목에서 기다리기`, radius: 1.8, hold: 1.4, holdLabel: () => '두 사람을 기다리는 중' });
      await going;
      g.reward(`climb/${i}`, 'step');
      if (i === 1) {
        // 창 22:7~8 길 위의 물음
        F.acts.face(isaac, abraham.position);
        F.acts.face(abraham, isaac.position);
        g.cam(isaac.position.clone().lerp(abraham.position, 0.5), 11);
        await g.talk(data.lines.ask);
        g.cam(null, 13);
      }
    }
    // 길목마다 두 사람을 기다림(인내). 아브라함의 믿음(히 11:17)은 장면이 보여 준다.
    g.reward('climb-done', 'questDone', null, 'patience');

    // 창 22:9~10: 제단. 카메라는 멀리서 비추고 서술로만 전한다. 칼을 드는 동작은 그리지 않는다.
    g.stage('peak');
    await Promise.all([F.acts.walkTo(abraham, ALTAR.clone().add(V(0.9, -0.6)), 1), F.acts.walkTo(isaac, ALTAR.clone().add(V(-0.7, 0.9)), 1)]);
    g.cam(FAR, 16);
    F.acts.carry(wood, null);
    altar.visible = true;
    await tween(800, (p) => altar.scale.setScalar(1.1 * Math.max(0.01, easeBack(p))));
    wood.position.copy(ALTAR).setY(0.95);
    await g.talk(data.lines.altar);

    // 창 22:11~12: 여호와의 사자가 부른다. 여기서 멈춘다.
    messenger.position.copy(ALTAR).add(V(1.6, -1.8)).setY(3);
    messenger.visible = true;
    g.cam(ALTAR, 12);
    await tween(1000, (p) => messenger.position.setY(3 - 1.6 * easeOut(p)));
    messenger.lookAt(abraham.position.x, messenger.position.y, abraham.position.z);
    F.acts.face(abraham, messenger.position);
    await g.talk(data.lines.call);
    F.acts.face(isaac, abraham.position);
    await F.acts.walkTo(isaac, abraham.position.clone().add(V(-0.7, 0.7)), 1.4);

    // 창 22:13~14 숫양과 여호와 이레. 숫양은 빛 속에서 보이지 않게 된다(잡는 장면은 그리지 않는다).
    ram.visible = true;
    g.note('creature/ram');
    g.cam(THICKET, 12);
    await g.talk(data.lines.ram.slice(0, 1));
    ram.userData.route = [ALTAR.clone().add(V(-0.7, -0.4))];
    await F.acts.walkTo(abraham, ALTAR.clone().add(V(0.9, 0.2)), 1.2);
    g.cam(ALTAR, 12);
    await F.acts.pillar(ALTAR);
    await tween(1400, (p) => ram.scale.setScalar(Math.max(0.001, 1 - p)));
    ram.visible = false;
    await g.talk(data.lines.ram.slice(1, 3));
    await F.acts.pillar(null);
    messenger.visible = true;
    await g.talk(data.lines.ram.slice(3, 4));
    messenger.visible = false;
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.ram.slice(4));
    await g.finish({ words: ['word/gen-22-14'], memento: 'item/firewood' });
  },
};
