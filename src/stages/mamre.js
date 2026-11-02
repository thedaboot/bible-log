// 1-7 세 손님과 약속(창 18장): 세 손님을 맞음 → 손님 대접하기(퀘스트: 물, 떡, 엉긴 젖을 나무 아래로)
// → 상을 받는 동안 막간(아브라함) → 아들의 약속과 사라의 웃음(창 18:9~15) → 소돔을 위한 간구(짧게) → 퀴즈(창 18:14)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeTree, makeTent } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/mamre.js';

const START = V(6, 5);
const TENT = V(-1.5, 2.5);
const DOOR = TENT.clone().add(V(1.5, -1.5)); // 장막 입구는 돌린 방향(+x → 화면 오른쪽) 밖
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

export default {
  id: 'mamre',
  data,
  records: ['place/mamre', 'person/guests', 'creature/calf', 'item/cake', 'word/gen-18-14'],
  kicker: '마므레 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 1814, start: START, sky: 0xeee4c8, ground: 0xb3a865,
      stages: { table: { c: toCam(TABLE, 1.8), r: 2.4 } },
      trees: 10, keep: [...SOURCES.map((s) => s.pos)],
    });
    const oak = makeTree('round');
    oak.scale.setScalar(2.6);
    F.put(oak, OAK, 0.8);
    F.put(makeTent(0x5a3a28, 1.2), TENT, 1.6, Math.PI / 4);
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
    F.spots = { start: START, table: TABLE, door: DOOR, oak: OAK, ...Object.fromEntries(SOURCES.map((s) => [s.id, s.pos])) };
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
    await g.talk(data.lines.arrive.slice(2, 3));
    await F.acts.bow(abraham, 0);
    await F.acts.walkTo(abraham, TABLE.clone().addScaledVector(ALONG, 1.8), 2.4);
    await F.acts.bow(abraham, 0.6);
    await g.talk(data.lines.arrive.slice(3, 4));
    await F.acts.bow(abraham, 0);
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

    // 막간(창 18:8과 18:9 사이): 손님들이 상을 받는 동안 장막 곁에서 아브라함과 대화한다.
    await F.acts.walkTo(abraham, DOOR.clone().add(V(0.8, -0.6)), 2);
    g.cam(DOOR, 12);
    await g.interlude(abraham);

    // 창 18:8~15 아들의 약속, 사라의 웃음
    g.cam(TABLE, 12);
    g.stage('table');
    await F.acts.walkTo(abraham, TABLE.clone().addScaledVector(ALONG, -1.8), 1.8); // 상 왼쪽(장막 쪽). 오른쪽은 비켜 선 관찰자 자리
    F.acts.face(abraham, GUESTS[1]);
    await F.acts.walkTo(sarah, DOOR.clone().add(V(-0.3, 0.9)), 1.6);
    F.acts.face(sarah, TABLE);
    await g.talk(data.lines.served.slice(0, 4));
    g.cam(sarah.position, 11);
    await g.talk(data.lines.served.slice(4, 5));
    g.cam(TABLE, 12);
    await g.talk(data.lines.served.slice(5, 7));
    g.cam(sarah.position.clone().lerp(TABLE, 0.5), 12);
    await g.talk(data.lines.served.slice(7));

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
