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
// 무릎 꿇은 낙타 셋. 낙타는 화면 가로(옆모습)로 서고, 물구유는 낙타 머리 앞, 물 붓는 자리는 구유 건너편(화면 가로)이다.
// s: 낙타가 보는 쪽(1 화면 오른쪽, -1 왼쪽). 사람이 구유 앞(카메라 쪽)에 서면 구유와 물이 가려서 옆에 세운다.
const CAMELS = [[V(-4.2, -0.4), 1], [V(-2.2, 1), -1], [V(1, -4.4), -1]];
const SIDE = V(1, -1).normalize(); // 화면 오른쪽
const TROUGHS = CAMELS.map(([c, s]) => c.clone().addScaledVector(SIDE, 1.35 * s));
const POURS = TROUGHS.map((t, i) => t.clone().addScaledVector(SIDE, 1.1 * CAMELS[i][1])); // 물 붓는 자리
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
      trees: 9, treeKinds: ['palm', 'round'], keep: [...CAMELS.map(([c]) => c), ...TROUGHS, ...POURS, GATE, FIELD],
    });
    F.put(makeWell(), WELL, 0.95);
    // 나홀의 성: 흙벽돌 집들
    for (const [dx, dz, s] of [[0, 0, 1.2], [-2, 1.4, 0.9], [1.5, -2, 1]]) {
      const house = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 1.1 * s, 1.5 * s), mat(0xd2b48a));
      F.put(house, HOUSE.clone().add(V(dx, dz)), 1 * s);
      house.position.y = 0.55 * s;
    }
    // 물구유와 낙타: 낙타는 무릎을 꿇은 듯 낮게 둔다(창 24:11)
    // 구유는 바닥과 네 벽만 두어 속이 빈다. 물(water)은 바닥에서 벽 위까지 높이가 차오른다(level 0~1).
    const camels = [];
    const stone = mat(0x8a7a62);
    CAMELS.forEach(([at, s], i) => {
      const trough = new THREE.Group();
      trough.position.copy(TROUGHS[i]);
      trough.rotation.y = Math.PI / 4; // 긴 쪽이 화면 가로(낙타가 보는 쪽)로 놓여 물이 보인다
      for (const [w, h, d, x, y, z] of [[0.9, 0.06, 0.4, 0, 0.03, 0], [0.9, 0.26, 0.05, 0, 0.13, 0.175], [0.9, 0.26, 0.05, 0, 0.13, -0.175], [0.05, 0.26, 0.4, 0.425, 0.13, 0], [0.05, 0.26, 0.4, -0.425, 0.13, 0]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
        b.position.set(x, y, z);
        trough.add(b);
      }
      const water = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.3), mat(PAL.water, { emissive: PAL.water, emissiveIntensity: 0.25 }));
      water.visible = false;
      trough.add(water);
      F.group.add(trough);
      F.block(trough.position, 0.45);
      const camel = F.animal('camel', 0xc8a070, 1, at, { still: true });
      camel.userData.yaw = s > 0 ? -Math.PI / 4 : Math.PI * 0.75; // 화면 가로로 서서 옆모습(혹과 긴 목)이 보인다
      camel.userData.kneel = 0.66; // 성 밖 우물 곁에 무릎을 꿇렸다(창 24:11): 다리를 접고 몸을 낮춘다
      // 목과 머리(makeAnimal 'camel'의 body 셋째·넷째 부품)를 목 뿌리를 축으로 숙인다(마시기)
      const [neck, head] = camel.userData.body.children.slice(2, 4);
      const base = [neck, head].map((o) => ({ o, x: o.position.x, y: o.position.y, rz: o.rotation.z }));
      const bend = (a) => base.forEach(({ o, x, y, rz }) => {
        const dx = x - 0.36, dy = y - 1.04;
        o.position.set(0.36 + dx * Math.cos(a) - dy * Math.sin(a), 1.04 + dx * Math.sin(a) + dy * Math.cos(a), o.position.z);
        o.rotation.z = rz + a;
      });
      const pour = { level: 0, full: false, drink: 0 };
      const setLevel = (l) => { pour.level = l; water.visible = l > 0.01; water.scale.y = Math.max(0.001, 0.19 * Math.min(1, l)); water.position.y = 0.06 + water.scale.y / 2; };
      camels.push({ camel, water, trough, bend, pour, setLevel, top: trough.position.clone().setY(0.2) });
    });
    const servant = F.person('servant', { hair: 'short', hairColor: 0xd8d4cc, beard: 'long', outfit: 'traveler', outfitColor: 0x5a4a3a }, SERVANT);
    const rebekah = F.person('rebekah', { hair: 'braid', hairColor: 0x3e2a1e, outfit: 'robe', outfitColor: 0xb8452f, item: 'jar' }, HOUSE.clone().add(V(2.6, 1.2)));
    const laban = F.person('laban', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x6e3f73 }, GATE.clone().addScaledVector(ALONG, -1.6));
    const isaac = F.person('isaac', { hair: 'short', hairColor: PAL.hairBrown, beard: 'short', outfit: 'robe', outfitColor: 0xd8c3a0 }, FIELD);
    isaac.visible = false;
    rebekah.visible = false;
    Object.assign(F, { servant, rebekah, laban, isaac, camels });
    F.spots = { start: START, well: WELL, servant: SERVANT, gate: GATE, field: FIELD, ...Object.fromEntries(POURS.map((t, i) => [`trough${i}`, t])) };
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

    // 도전: 낙타 물 주기(창 24:19~20 "다시 우물로 달려가서 길어 모든 낙타를 위하여 긷는지라"). 구유마다 두 단계를 되풀이한다.
    //  1) 우물 곁에 머물러 물 긷기: 손에 든 물동이 입에 물빛이 찬다.
    //  2) 구유에 물 붓기(kind 'hold'): 꾹 누르는 동안 물동이가 기울고 물줄기가 흐르며 구유 물이 차오른다. 넘치기 전 금빛에서 뗀다.
    //     다 차면 낙타가 고개를 숙여 마신다. 리브가가 곁에서 함께 긷고 붓는다.
    const ORD = ['첫째', '둘째', '셋째'];
    const water = (opacity = 1) => mat(PAL.water, { emissive: PAL.water, emissiveIntensity: 0.3, transparent: opacity < 1, opacity });
    const jarOf = (fig) => fig.userData.arms?.[1]?.children.find((c) => c.isGroup && c.children.some((m) => m.geometry?.parameters?.radius === 0.17));
    const jarWater = (on) => [g.player, rebekah].forEach((fig) => {
      const j = jarOf(fig);
      if (!j) return;
      let d = j.getObjectByName('jarWater');
      if (!d) { d = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.02, 8), water()); d.name = 'jarWater'; d.position.set(0.36, 1.385, -0.05); j.add(d); }
      d.visible = on;
    });
    // 붓는 팔: 어깨에 멘 물동이를 앞으로 기울인다(animateFigure가 hold 값으로 팔을 세운다)
    const tilt = (fig, k) => { const h = fig.userData.hold?.[1]; if (!h) return; h.base ??= h[0]; h[0] = h.base + 0.95 * k; };
    const UP = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3();
    const streams = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 1, 6), water(0.85)); s.visible = false; F.group.add(s); return s; });
    const flow = (s, fig, to) => {
      const j = to && jarOf(fig);
      s.visible = !!j;
      if (!j) return;
      F.group.worldToLocal(j.localToWorld(a.set(0.36, 1.42, -0.05)));
      b.copy(to);
      s.position.copy(a).add(b).multiplyScalar(0.5);
      s.scale.y = a.distanceTo(b);
      s.quaternion.setFromUnitVectors(UP, b.sub(a).normalize());
    };
    // 붓는 정도는 도전의 꾹 누르기 진행값(onHold)으로 받는다
    let pourM = 0;
    const holdM = () => pourM;
    let cur = null; // 지금 물을 붓는 구유
    F.onUpdate((dt, t) => {
      for (const c of camels) if (c.pour.drink) c.bend(c.pour.drink * (-0.85 + Math.sin(t * 3 + c.top.x) * 0.06));
      if (!cur) return;
      const m = holdM(), on = m > 0.005;
      if (on) cur.setLevel(m);
      else if (!cur.pour.full && cur.pour.level > 0) cur.setLevel(Math.max(0, cur.pour.level - dt * 1.5)); // 덜 붓거나 넘치면 빠지고 다시 붓는다
      [g.player, rebekah].forEach((fig, i) => { tilt(fig, on ? Math.min(1, m * 3) : 0); flow(streams[i], fig, on ? cur.top : null); });
      if (on) g.player.rotation.y = Math.atan2(cur.top.x - g.player.position.x, cur.top.z - g.player.position.z);
    });
    for (const [i, c] of camels.entries()) {
      const title = `낙타 물 주기 ${i + 1} / ${camels.length}`;
      g.cam(WELL.clone().lerp(TROUGHS[i], 0.5), 11); // 우물과 이번 구유가 한 화면에 들어온다
      F.acts.walkTo(rebekah, WELL.clone().add(V(-0.6, 1.3)), 2.6);
      await g.quest({
        title, targets: [{ pos: WELL }], text: () => '우물 곁에 머물러 물 긷기', radius: 1.9, hold: 1.2, holdLabel: () => '물동이에 물 긷는 중',
        onFound: async () => { jarWater(true); g.reward(`draw/${i}`, 'step'); },
      });
      F.acts.walkTo(rebekah, TROUGHS[i].clone().add(V(-0.75, -0.75)), 2.6).then(() => F.acts.face(rebekah, c.top));
      cur = c;
      const last = i === camels.length - 1;
      const done = g.challenge({
        title, radius: 1.3, spots: [{ pos: POURS[i], text: `${ORD[i]} 구유에 물 붓기` }], verb: '물 붓기', hits: 1, kind: 'hold', tier: i,
        tool: last ? 'jar' : null, toolName: '물동이', fruits: ['kindness', 'patience'], missText: '넘쳤어요. 다시 부어요', hitText: '알맞게 채웠어요!', lowText: '조금 더 부어요', onHold: (m) => (pourM = m),
        onHit: async () => {
          c.pour.full = true;
          c.setLevel(1);
          jarWater(false);
          F.acts.speak('rebekah');
          g.reward(`water/${i}`, 'step');
          await tween(700, (p) => (c.pour.drink = easeOut(p)));
        },
      });
      // 물동이는 손에 든 채 붓는다(F로 따로 쓰지 않는다). 마지막 구유를 마치면 도구 규칙대로 물동이를 하나 쓴다(growth.md).
      if (last) document.getElementById('chTool').hidden = true;
      await done;
      cur = null;
      [g.player, rebekah].forEach((fig, k) => { tilt(fig, 0); flow(streams[k], fig, null); });
      if (i === 0) await g.talk(data.lines.pour);
    }
    g.cam(null, 13);
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
