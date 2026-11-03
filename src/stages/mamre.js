// 1-7 세 손님과 약속(창 18장): 세 손님을 맞음 → 손님 대접하기(퀘스트: 물, 떡, 엉긴 젖을 나무 아래로)
// → 상을 받는 동안 막간(아브라함) → 아들의 약속과 사라의 웃음(창 18:9~15) → 소돔을 위한 간구(짧게) → 퀴즈(창 18:14)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeTree, makeTent } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/mamre.js';

const START = V(6, 5);
const TENT = V(-1.5, 2.5);
// 장막 입구는 +x(화면 오른쪽 아래)를 본다. 카메라가 (+x, +z)에서 비스듬히 보므로 입구 안에 선 사라가 보인다.
const HIDE = TENT.clone().add(V(1.35, 0)); // 사라가 숨어 듣는 자리: 입구 천 바로 뒤(창 18:10 장막 문에서 들음)
const DENY = TENT.clone().add(V(2.15, -0.35)); // 창 18:15 문 밖으로 한 걸음 나와 부인하는 자리
const PEEK = TENT.clone().add(V(4, -2.2)); // 숨은 사라가 귀를 기울이는 쪽(입구 밖, 상 쪽). 옆얼굴이 보인다
const INTO =TENT.clone().add(V(2.1, 0.9)); // 장막 둘레를 돌아 입구로 드는 길목(장막 충돌을 가로지르지 않게)
const DOOR = TENT.clone().add(V(2.0, -1.0)); // 아브라함이 앉아 있던 장막 문 곁
const OAK = V(-3.2, -3.2); // 마므레 상수리나무
const ALONG = V(1, -1).normalize();
const TABLE = OAK.clone().add(V(2.2, 2.2)); // 나무 그늘 앞의 손님상(낮은 깔개)
// 세 손님은 나무와 상 사이에 화면 가로로 나란히 앉는다(서로, 나무와 겹치지 않게)
const GUESTS = [-1.3, 0, 1.3].map((k) => OAK.clone().add(V(1.1, 1.1)).addScaledVector(ALONG, k));
const SOURCES = [
  { id: 'water', name: '물', text: '우물가에서 물 받기', pos: V(5.5, -3), color: PAL.water },
  { id: 'bread', name: '떡', text: '사라에게서 떡 받기', pos: TENT.clone().add(V(-0.4, 2.4)), color: 0xe8c890 },
  { id: 'curds', name: '엉긴 젖', text: '소 떼 곁에서 엉긴 젖 받기', pos: V(5, 2.2), color: 0xf6f0dc },
];

// 창 18:12 속으로 웃음: 몸을 움츠려 낮추고 손을 입가로 모은 채 어깨를 들썩인다.
function giggle(fig) {
  const u = fig.userData, { rig, arms } = u;
  u.pose = 'laugh';
  return tween(1800, (p) => {
    const e = Math.min(1, p * 5, (1 - p) * 4);
    rig.position.y = -0.07 * e + Math.abs(Math.sin(p * Math.PI * 9)) * 0.03 * e;
    rig.rotation.set(0.22 * e, 0, Math.sin(p * Math.PI * 9) * 0.05 * e);
    arms?.forEach((a, i) => { a.rotation.x = -1.75 * e; a.rotation.z = (i ? 1 : -1) * (0.12 - 0.62 * e); });
  }).then(() => { u.pose = null; });
}

export default {
  id: 'mamre',
  data,
  records: ['place/mamre', 'person/guests', 'creature/calf', 'item/cake', 'word/gen-18-14'],
  kicker: '마므레 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 1814, start: START, sky: 0xeee4c8, ground: 0xb3a865,
      stages: { table: { c: toCam(TABLE, 1.8), r: 2.4 } },
      trees: 10, keep: [...SOURCES.map((s) => s.pos), HIDE, DENY, INTO],
    });
    const oak = makeTree('round');
    oak.scale.setScalar(2.6);
    F.put(oak, OAK, 0.8);
    // 장막: 입구(+x)를 비워 두고 뒤와 양옆만 막는다. 사라가 입구 안쪽에 설 수 있다.
    const tent = F.put(makeTent(0x5a3a28, 1.2), TENT);
    for (const [x, z, r] of [[-0.4, 0, 1.3], [0.5, 0.95, 0.6], [0.5, -0.95, 0.6]]) F.block(TENT.clone().add(V(x, z)), r);
    // 입구: 어두운 안쪽(makeTent의 문)을 사람 키만큼 키우고, 한쪽 천은 걷어 묶고 한쪽 천은 반쯤 드리운다(창 18:10 장막 문 뒤)
    const [, doorway] = tent.children;
    doorway.scale.set(1.25, 1.35, 1);
    doorway.position.y = 0.54 * 1.35;
    const flapM = mat(0x9a7048, { side: THREE.DoubleSide });
    // 드리운 천은 입구 가장자리(카메라 쪽)에서 비스듬히 나와 사라의 화면 왼쪽 절반을 가린다. 몸에 박히지 않게 앞으로 0.2 띄운다.
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 1.4), flapM);
    flap.position.set(1.5, 0.76, 0.4);
    flap.rotation.y = 0.67;
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), flapM);
    roll.position.set(1.3, 0.7, -0.5);
    tent.add(flap, roll);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.1), mat(0xb8452f));
    rug.position.copy(TABLE).setY(0.03);
    rug.rotation.y = Math.PI / 4;
    F.group.add(rug);
    // 물 항아리 자리(작은 우물)와 소 떼
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.6, 8), mat(PAL.clay));
    jar.position.copy(SOURCES[0].pos).add(V(-0.5, -0.5)).setY(0.3);
    F.group.add(jar);
    F.block(jar.position, 0.3);
    const cows = [0, 1, 2].map((i) => F.animal('cow', [0x8a5a3a, 0xc8b088, 0x6b4a32][i], 0.8 - i * 0.08, V(7 + i * 0.9, 0.5 - i), { roam: 1.4 }));
    const calf = F.animal('cow', 0xd8a87a, 0.5, V(6.2, -0.8), { roam: 1 });
    // 세 손님: 얼굴을 그리지 않은 빛나는 나그네(형상 없는 하나님 규칙, design.md)
    const guests = GUESTS.map((p, i) => F.person(`guest${i}`, { ghost: 0xfff2b0, skin: 0xfff2b0, hair: 'none', hairColor: 0xffffff, outfit: 'robe', outfitColor: 0xffffff }, p.clone().add(V(-7, -3))));
    guests.forEach((gst) => (gst.visible = false));
    const abraham = F.person('abraham', { hair: 'short', hairColor: 0x9a9590, beard: 'long', outfit: 'robe', outfitColor: 0x7f5a3a }, DOOR);
    const sarah = F.person('sarah', { hair: 'long', hairColor: 0x9a9590, outfit: 'robe', outfitColor: 0x6e3f73 }, SOURCES[1].pos.clone().add(V(0.8, 0.4)));
    const servant = F.person('servant', { hair: 'short', hairColor: PAL.hairDark, outfit: 'tunic', outfitColor: 0xd8c3a0 }, V(4.2, 3.4));
    const dishes = SOURCES.map((s) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.1, 8), mat(s.color));
      d.visible = false;
      F.group.add(d);
      return d;
    });
    Object.assign(F, { guests, abraham, sarah, servant, dishes, calf, cows });
    F.spots = { start: START, table: TABLE, door: DOOR, hide: HIDE, deny: DENY, into: INTO, oak: OAK, ...Object.fromEntries(SOURCES.map((s) => [s.id, s.pos])) };
    F.solid = ['oak'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { guests, abraham, sarah, dishes } = F;
    g.meet('abraham');
    await F.acts.bow(abraham, 0.2);
    g.cam(DOOR, 12);
    await g.talk(data.lines.arrive.slice(0, 2));
    // 세 사람이 맞은편에 나타나 나무 쪽으로 걸어온다
    guests.forEach((gst, i) => { gst.visible = true; gst.position.copy(GUESTS[i]).add(V(-2.5, -1.5)); });
    g.cam(TABLE, 13);
    g.stage('table');
    await Promise.all(guests.map((gst, i) => F.acts.walkTo(gst, GUESTS[i], 1.2)));
    guests.forEach((gst) => F.acts.face(gst, TABLE));
    g.note('person/guests');
    // 창 18:2 달려 나가 땅에 엎드림: 서술과 함께 달려가 무릎 꿇고 이마를 땅에 댄다. "내 주여"는 엎드린 채 말한다.
    await F.acts.bow(abraham, 0);
    const bowDown = F.acts.walkTo(abraham, TABLE.clone().addScaledVector(ALONG, 1.8), 2.4).then(() => F.acts.prostrate(abraham, GUESTS[1]));
    await g.talk(data.lines.arrive.slice(2, 3));
    await bowDown;
    await g.talk(data.lines.arrive.slice(3, 4));
    await F.acts.rise(abraham);
    g.note('place/mamre');
    // 아브라함이 장막과 소 떼로 달려간다(창 18:6~7)
    F.acts.walkTo(abraham, DOOR, 2.4);
    F.acts.walkTo(F.servant, F.calf.position.clone().add(V(-0.6, 0.6)), 2);
    g.note('creature/calf');
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.arrive.slice(4));

    // 퀘스트: 손님 대접하기. 받은 것은 손에 들려 있다가, 나무 아래 상에 내려놓는다.
    const removeGreet = g.greet(sarah, data.greetings.sarah, 'sarah');
    // 퀘스트 안에서 다른 퀘스트를 부르면 남은 목표가 지워지므로, 하나씩 받아 나른다.
    for (const [i, s] of SOURCES.entries()) {
      await g.quest({ title: '손님 대접하기', targets: [s], text: () => s.text, radius: 1.8 });
      dishes[i].visible = true;
      F.acts.carry(dishes[i], g.player);
      await g.quest({ title: '손님 대접하기', targets: [{ pos: TABLE }], text: () => `${s.name} 나무 아래 상에 놓기`, radius: 1.8 });
      F.acts.carry(dishes[i], null);
      const from = dishes[i].position.clone(), to = TABLE.clone().add(V((i - 1) * 0.4, (1 - i) * 0.4)).setY(0.1);
      await tween(500, (p) => dishes[i].position.lerpVectors(from, to, easeOut(p)));
      g.toast(`${s.name}을 상에 놓았어요`); // 물, 떡, 엉긴 젖은 모두 받침이 있다
      g.reward(`serve/${s.id}`, 'step');
    }
    removeGreet();
    // 나그네를 대접함(히 13:2, 롬 12:13 손 대접하기를 힘씀 → 선함)
    g.reward('serve-done', 'questDone', null, 'goodness');
    g.note('item/cake');

    // 떡을 내준 사라는 장막으로 들어가 입구 천 뒤에 선다. 장막을 가로지르지 않게 둘레의 길목을 돌아 든다.
    F.acts.walkTo(sarah, INTO, 1.4).then(() => F.acts.walkTo(sarah, HIDE, 0.9)).then(() => F.acts.face(sarah, PEEK));
    // 막간(창 18:8과 18:9 사이): 손님들이 상을 받는 동안 장막 곁에서 아브라함과 대화한다.
    await F.acts.walkTo(abraham, DOOR.clone().add(V(0.8, -0.6)), 2);
    g.cam(DOOR, 12);
    await g.interlude(abraham);

    // 창 18:8~15 아들의 약속, 사라의 웃음. 사라가 숨어 있는 동안 장막 입구가 화면에 들도록 비춘다.
    g.cam(TABLE, 12);
    await F.acts.walkTo(abraham, TABLE.clone().addScaledVector(ALONG, -1.8), 1.8); // 상 왼쪽(장막 쪽). 오른쪽은 비켜 선 관찰자 자리
    F.acts.face(abraham, GUESTS[1]);
    g.stage('table'); // 아브라함이 선 뒤에 켜야 관찰자가 아브라함과 겹치지 않는 자리로 비킨다
    if (sarah.position.distanceTo(HIDE) > 0.1) sarah.position.copy(HIDE); // 막간을 아주 빨리 넘겨 아직 걷는 중일 때
    F.acts.face(sarah, PEEK);
    const S = data.lines.served;
    const both = HIDE.clone().lerp(TABLE, 0.5);
    await g.talk(S, { onLine: (l) => {
      const k = S.indexOf(l);
      if (k === 0) g.cam(TABLE, 12);
      else if (k === 2) g.cam(HIDE, 9.5); // "장막 안에 있습니다": 입구 천 뒤의 사라
      else if (k === 4) { g.cam(HIDE, 9); giggle(sarah); } // 창 18:12 속으로 웃음
      else if (k === 7) { g.cam(both, 11); F.acts.walkTo(sarah, DENY, 1.1).then(() => F.acts.face(sarah, GUESTS[1])); } // 창 18:15 한 걸음 나와 부인
      else if (k === 8) F.acts.bow(sarah, 0.3); // 두려워 고개를 떨군다
      else g.cam(both, 12);
    } });
    await F.acts.bow(sarah, 0);

    // 창 18:16~33: 손님들이 소돔 쪽으로 걸어가고, 아브라함이 배웅하며 간구한다(짧게).
    const toward = TABLE.clone().addScaledVector(ALONG, -5).add(V(-1, -1));
    guests.forEach((gst, i) => F.acts.walkTo(gst, toward.clone().addScaledVector(ALONG, i * 0.9), 1));
    F.acts.walkTo(abraham, toward.clone().add(V(1.6, 1.6)), 1);
    await g.talk(data.lines.sodom.slice(0, 1));
    g.cam(abraham.position, 13);
    await g.talk(data.lines.sodom.slice(1, 3));
    guests.forEach((gst) => (gst.visible = false));
    g.stage(null);
    g.cam(null, 13);
    await g.talk(data.lines.sodom.slice(3));
    await g.finish({ words: ['word/gen-18-14'], memento: 'item/cake' });
  },
};
