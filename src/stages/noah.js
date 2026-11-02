// 1-4 노아의 방주(창 6~9장): 방주 짓기(도전, 노아와 동행) → 짐승 들여보내기(퀘스트) → 저녁 막간(노아)
// → 홍수(밤, 비, 물이 차오름) → 아라랏 산 → 까마귀와 비둘기 → 제단과 무지개 → 퀴즈(창 9:13)
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAltar, makeBird } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/noah.js';

const ALONG = V(1, -1).normalize(); // 방주 길이 방향: 화면 가로라 옆모습이 다 보인다
const FRONT = V(1, 1).normalize(); // 카메라 쪽
const ARK = V(-2.5, -2.5);
const ARK_LEN = 7;
const DOOR = ARK.clone().addScaledVector(FRONT, 1.25);
const NOAH = DOOR.clone().addScaledVector(FRONT, 1.2).addScaledVector(ALONG, -1.3);
const WORK = [-2.2, 0, 2.2].map((k) => ARK.clone().addScaledVector(FRONT, 1.9).addScaledVector(ALONG, k));
const MOUNT = V(-7.5, -7.5); // 아라랏 산(창 8:4)
const FOOT = MOUNT.clone().addScaledVector(FRONT, 3.6);
const ALTAR = FOOT.clone().addScaledVector(ALONG, -1.6);
const START = V(6, 5);
const out0 = () => MOUNT.clone().addScaledVector(FRONT, 2.6);
// 짐승 한 쌍씩의 터(무대와 방주에서 떨어진 들판)
const PAIRS = [
  { kind: 'sheep', name: '양 한 쌍', color: 0xf5f5f0, size: 0.9, home: V(7, -2) },
  { kind: 'deer', name: '사슴 한 쌍', color: 0xb07a4a, size: 0.9, home: V(2.5, -8.5) },
  { kind: 'horse', name: '말 한 쌍', color: 0x8a5a3a, size: 0.9, home: V(-8.5, 3) },
  { kind: 'lion', name: '사자 한 쌍', color: 0xd8a85a, size: 0.85, home: V(-2, 8) },
];

function makeArk() {
  const g = new THREE.Group();
  const wood = mat(PAL.plank);
  const keel = new THREE.Mesh(new THREE.BoxGeometry(ARK_LEN, 0.3, 1.4), wood);
  keel.position.y = 0.15;
  g.add(keel);
  const ribs = new THREE.Group();
  for (let i = 0; i <= 8; i++) for (const z of [-0.75, 0.75]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), mat(PAL.bark));
    rib.position.set(-ARK_LEN / 2 + (i * ARK_LEN) / 8, 0.8, z);
    ribs.add(rib);
  }
  const hullM = mat(PAL.plank);
  const hull = new THREE.Group();
  for (const z of [-0.78, 0.78]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(ARK_LEN, 1.2, 0.08), hullM);
    side.position.set(0, 0.9, z);
    hull.add(side);
  }
  for (const x of [-ARK_LEN / 2, ARK_LEN / 2]) {
    const end = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 1.6), hullM);
    end.position.set(x, 0.9, 0);
    hull.add(end);
  }
  // 지붕(창 6:16): 길이 방향으로 놓인 두 경사판
  const roof = new THREE.Group();
  for (const z of [-1, 1]) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(ARK_LEN + 0.2, 0.08, 1.05), mat(0x5a4030));
    slab.position.set(0, 1.78, z * 0.42);
    slab.rotation.x = z * 0.55;
    roof.add(slab);
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), mat(0x3a2a1c));
  door.position.set(0, 0.85, 0.82);
  const window_ = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.06), mat(0x2a1d14));
  window_.position.set(-1.6, 1.42, 0.82);
  g.add(ribs, hull, roof, door, window_);
  g.rotation.y = -Math.atan2(ALONG.z, ALONG.x); // 로컬 x가 ALONG, 로컬 +z가 FRONT를 본다
  return { g, ribs, hull, hullM, roof, door };
}

export default {
  id: 'noah',
  data,
  records: ['person/noah', 'person/shem', 'place/ark', 'creature/dove', 'creature/raven', 'place/ararat', 'item/olive-leaf', 'word/gen-9-13'],
  kicker: '방주가 서는 들판으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 6141, start: START, sky: 0xc4dceb,
      stages: {
        door: { c: toCam(DOOR, 1.8), r: 2.4 },
        foot: { c: toCam(FOOT, 1.4), r: 2.6 },
      },
      trees: 14,
    });
    const ark = makeArk();
    ark.g.position.copy(ARK);
    F.group.add(ark.g);
    for (let k = -ARK_LEN / 2 + 0.5; k <= ARK_LEN / 2 - 0.5; k += 0.7) F.block(ARK.clone().addScaledVector(ALONG, k), 0.95);
    // 아라랏 산: 처음부터 들 끝에 있고, 홍수 때 물에 잠긴다(창 7:20). 방주가 그 꼭대기에 머문다.
    const mount = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.5, 9), mat(0x7f8a5a));
    mount.position.copy(MOUNT).setY(0.75);
    F.group.add(mount);
    F.block(MOUNT, 3);
    const noah = F.person('noah', { hair: 'short', hairColor: 0x9a9590, beard: 'long', outfit: 'robe', outfitColor: 0xd8c3a0 }, NOAH);
    const wife = F.person('wife', { hair: 'long', hairColor: 0x6b6460, outfit: 'robe', outfitColor: 0x7f8a4a }, DOOR.clone().addScaledVector(FRONT, 1).addScaledVector(ALONG, 1.6));
    const shem = F.person('shem', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x9a6b45 }, WORK[2].clone().addScaledVector(FRONT, 1.4).addScaledVector(ALONG, 1));
    F.keep.push(...WORK, ...PAIRS.map((p) => p.home), FOOT, out0());
    // 짐승 한 쌍씩
    const pairs = PAIRS.map((p) => ({ ...p, animals: [0, 1].map((i) => F.animal(p.kind, p.color, p.size * (i ? 0.92 : 1), p.home.clone().add(V(i * 1.1, i * -0.4)), { roam: 1.6 })) }));
    // 홍수: 물, 빗줄기
    const water = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.2, 24), mat(PAL.water, { transparent: true, opacity: 0.88 }));
    water.position.y = -0.3;
    water.visible = false;
    const rain = new THREE.Group();
    const dropM = new THREE.MeshBasicMaterial({ color: 0xbcd4ec, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 180; i++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.55, 0.03), dropM);
      const a = F.rand() * Math.PI * 2, r = F.rand() * 13;
      d.position.set(Math.cos(a) * r, F.rand() * 10, Math.sin(a) * r);
      rain.add(d);
    }
    rain.visible = false;
    // 무지개(창 9:13): 들 끝 하늘에 걸린 반원. 화면을 마주 보게 돌린다.
    const rainbow = new THREE.Group();
    [0xe85a4a, 0xf2a03a, 0xf2d24a, 0x6fbf5a, 0x4a8ad8, 0x7a5ac8].forEach((c, i) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(10 - i * 0.35, 0.18, 4, 40, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75 }));
      rainbow.add(arc);
    });
    rainbow.position.copy(V(-11, -11)).setY(-1);
    rainbow.rotation.y = Math.PI / 4;
    rainbow.visible = false;
    const altar = makeAltar();
    altar.visible = false;
    F.put(altar, ALTAR);
    F.group.add(water, rain, rainbow);
    const raven = makeBird();
    raven.traverse((o) => { if (o.material) o.material = mat(0x22201e); });
    const dove = makeBird();
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.08), mat(0x7a9a3a));
    leaf.position.x = 0.2;
    leaf.visible = false;
    dove.add(leaf);
    raven.visible = dove.visible = false;
    F.group.add(raven, dove);
    F.onUpdate((dt, t) => {
      if (rain.visible) for (const d of rain.children) { d.position.y -= dt * 14; if (d.position.y < 0) d.position.y += 10; }
      if (water.visible && ark.floating) { ark.g.position.y = Math.max(0, water.position.y - 0.35) + Math.sin(t * 1.4) * 0.05; ark.g.rotation.z = Math.sin(t * 1.1) * 0.03; }
      for (const b of [raven, dove]) if (b.visible) b.children.slice(1, 3).forEach((w, i) => (w.rotation.x = Math.sin(t * 14) * 0.6 * (i ? 1 : -1)));
    });
    // 방주가 지어지는 정도(0~6번 성공): 뼈대 → 판자 → 지붕과 역청
    ark.hull.visible = false;
    ark.roof.visible = false;
    ark.ribs.children.forEach((r, i) => (r.visible = i < 6));
    ark.progress = (n) => {
      ark.ribs.children.forEach((r, i) => (r.visible = i < 6 + n * 6));
      ark.hull.visible = n >= 3;
      ark.hull.scale.y = n >= 4 ? 1 : 0.5;
      ark.hull.position.y = n >= 4 ? 0 : -0.3;
      ark.roof.visible = n >= 5;
      if (n >= 6) ark.hullM.color.setHex(0x3a2e24); // 안팎에 역청을 칠한다(창 6:14)
    };
    Object.assign(F, { ark, water, rain, rainbow, altar, raven, dove, leaf, mount, pairs, noahFig: noah, wife, shem });
    F.spots = { start: START, door: DOOR, noah: NOAH, foot: FOOT, altar: ALTAR, mount: MOUNT, ...Object.fromEntries(WORK.map((w, i) => [`work${i}`, w])) };
    F.solid = ['door', 'mount', 'altar'];
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { ark, noahFig: noah, wife, shem } = F;
    g.cam(ARK, 15);
    g.stage('door');
    await g.talk(data.lines.arrive.slice(0, 3));
    g.cam(ark.g.position.clone().setY(1), 13);
    await g.talk(data.lines.arrive.slice(3));
    g.cam(null, 13);
    g.stage(null);
    g.meet('noah');
    g.note('place/ark');

    // 도전 1: 방주 짓기. 노아가 관찰자가 일하는 자리로 와서 함께 일한다(동행). 오래 걸리는 일이라 인내와 신실이 돕는다.
    const removeGreet = g.greet(shem, data.greetings.shem, 'shem');
    let hits = 0;
    const spots = [['뼈대 세우기', 0], ['판자 대기', 1], ['역청 칠하기', 2]].map(([text, i]) => ({ pos: F.spots[`work${i}`], text: `함께 ${text}`, hits: 2 }));
    await g.challenge({
      title: '방주 짓기', spots, verb: '힘 모으기', fruits: ['patience', 'faith'],
      onHit: async (sp) => {
        await F.acts.walkTo(noah, sp.pos.clone().addScaledVector(ALONG, -1.1), 2.4); // 대천사는 관찰자의 화면 오른쪽(+ALONG)에 서므로 노아는 왼쪽에 선다
        F.acts.face(noah, ARK);
        F.acts.speak('noah');
        ark.progress(++hits);
        g.reward(`build/${hits}`, 'step');
      },
    });
    removeGreet();
    // 방주를 짓는 일은 오래 참는 일이다(벧전 3:20 하나님이 오래 참고 기다리실 때 방주를 준비함)
    g.reward('build-done', 'challenge', null, 'patience');
    // 동행: 노아의 일을 함께 했다. 노아는 믿음으로 방주를 준비했다(히 11:7, 신실).
    g.meet('noah', 'walked', 'faith');
    await F.acts.walkTo(noah, NOAH);
    F.acts.face(noah, g.player.position);
    await g.talk(data.lines.built);

    // 퀘스트: 짐승 들여보내기. 한 쌍 곁에 머무르면 둘이 방주 문으로 걸어 들어간다.
    await g.quest({
      title: '방주로 들어가는 짐승',
      targets: F.pairs.map((p) => ({ pos: p.animals[0].position, name: p.name, pair: p })),
      text: (t) => `${t.name} 곁에 머물러 방주로 보내기`,
      radius: 2.2, hold: 1.2, holdLabel: (t) => `${t.name} 곁에 머무르기`,
      onFound: async (t) => {
        t.pair.animals.forEach((an, i) => {
          an.userData.route = [DOOR.clone().addScaledVector(FRONT, 1.2 + i * 0.6), DOOR.clone()];
          an.userData.onArrive = () => (an.visible = false);
        });
        g.reward(`animals/${t.pair.kind}`, 'step');
      },
    });
    // 짐승을 돌보는 일(잠 12:10 의인은 자기 가축의 생명을 돌본다, 친절)
    g.reward('animals-done', 'questDone', null, 'kindness');
    g.cam(DOOR, 13);
    g.stage('door');
    await g.talk(data.lines.animalsIn);

    // 막간(창 7:4~10 비가 오기 전 이레): 해 질 녘 방주 문 앞에서 노아와 대화한다.
    await F.acts.dusk();
    await F.acts.walkTo(noah, DOOR.clone().addScaledVector(FRONT, 0.8));
    await g.interlude(noah);

    // 홍수: 가족이 들어가고 문이 닫힌다. 비가 오고 물이 차올라 방주가 뜬다.
    for (const an of F.animals) if (an.visible) { an.userData.route = [DOOR.clone()]; an.userData.onArrive = () => (an.visible = false); }
    await Promise.all([noah, wife, shem].map((f) => F.acts.walkTo(f, DOOR, 1.8)));
    [noah, wife, shem].forEach((f) => (f.visible = false));
    g.hideCompanions();
    await F.acts.night();
    F.rain.visible = true;
    F.water.visible = true;
    g.cam(ARK, 16);
    await g.talk(data.lines.flood.slice(0, 2));
    ark.floating = true;
    // 기다림이 3초를 넘지 않게 물이 차오르는 동안 대사를 함께 띄운다
    const rise = tween(4000, (p) => (F.water.position.y = -0.3 + 2.1 * easeOut(p)));
    await g.talk(data.lines.flood.slice(2, 3));
    await rise;
    // 물 위를 떠다니다 산 쪽으로 간다(창 7:18)
    const from = ark.g.position.clone();
    const peak = MOUNT.clone().addScaledVector(FRONT, 0.4);
    g.cam(peak.clone().lerp(from, 0.5), 16);
    const drift = tween(3600, (p) => { ark.g.position.x = from.x + (peak.x - from.x) * easeOut(p); ark.g.position.z = from.z + (peak.z - from.z) * easeOut(p); });
    await g.talk(data.lines.flood.slice(3));
    await drift;

    // 창 8:1~4: 바람이 불고 물이 줄어 방주가 아라랏 산에 머문다.
    F.rain.visible = false;
    await F.acts.day();
    await g.talk(data.lines.remembered.slice(0, 1));
    ark.floating = false;
    const recede = tween(3000, (p) => {
      F.water.position.y = 1.8 - 2.1 * p;
      ark.g.position.y = Math.max(1.15, F.water.position.y - 0.35);
      ark.g.rotation.z *= 0.95;
    });
    g.note('place/ararat');
    await g.talk(data.lines.remembered.slice(1));
    await recede;
    F.water.visible = false;

    // 창 8:6~12: 까마귀와 비둘기. 비둘기는 두 번째에 올리브 잎을 물고 돌아온다.
    const win = ark.g.localToWorld(new THREE.Vector3(-1.6, 1.5, 0.9));
    g.cam(win, 11);
    const fly = (bird, to, ms) => { const a = bird.position.clone(); return tween(ms, (p) => { bird.position.lerpVectors(a, to, p); bird.position.y += Math.sin(p * Math.PI) * 1.5; bird.rotation.y = -Math.atan2(to.z - a.z, to.x - a.x); }); };
    const far = win.clone().add(new THREE.Vector3(9, 2, -3));
    await g.talk(data.lines.birds.slice(0, 1), { onLine: () => {} });
    F.raven.visible = true;
    F.raven.position.copy(win);
    g.note('creature/raven');
    await fly(F.raven, far, 2200);
    F.raven.visible = false;
    await g.talk(data.lines.birds.slice(1, 2));
    F.dove.visible = true;
    F.dove.position.copy(win);
    g.note('creature/dove');
    await fly(F.dove, far, 1600);
    await fly(F.dove, win, 1600);
    F.leaf.visible = true; // 두 번째 날아갔다 돌아올 때 잎을 문다
    await g.talk(data.lines.birds.slice(2, 3));
    await fly(F.dove, far, 1300);
    await fly(F.dove, win, 1300);
    await g.talk(data.lines.birds.slice(3));
    F.dove.visible = false;

    // 창 8:16~22: 방주에서 나와 제단을 쌓는다. 가족과 짐승이 산기슭으로 내려온다.
    g.cam(FOOT, 13);
    g.stage('foot');
    const out = MOUNT.clone().addScaledVector(FRONT, 2.6);
    [noah, wife, shem].forEach((f, i) => { f.position.copy(out).addScaledVector(ALONG, i - 1); f.visible = true; });
    g.place(FOOT.clone().addScaledVector(ALONG, 2.6).addScaledVector(FRONT, -0.6));
    F.pairs.forEach((p, i) => p.animals.forEach((an, j) => {
      an.position.copy(out).addScaledVector(ALONG, i - 1.5);
      an.visible = true;
      an.userData.home = FOOT.clone().addScaledVector(ALONG, 4.8 + i * 1.3).addScaledVector(FRONT, 1.2 + j * 1.1);
      an.userData.route = [an.userData.home.clone()];
    }));
    await g.talk(data.lines.out.slice(0, 1));
    await Promise.all([F.acts.walkTo(noah, ALTAR.clone().addScaledVector(FRONT, 0.9)), F.acts.walkTo(wife, FOOT.clone().addScaledVector(ALONG, 0.6)), F.acts.walkTo(shem, FOOT.clone().addScaledVector(ALONG, 1.4))]);
    F.altar.visible = true;
    F.acts.face(noah, ALTAR);
    await g.talk(data.lines.out.slice(1, 2));
    await F.acts.bow(noah, 0.4);
    await F.acts.pillar(ALTAR);
    await g.talk(data.lines.out.slice(2));
    F.acts.pillar(null);
    await F.acts.bow(noah, 0);

    // 창 9:12~17 무지개
    F.rainbow.visible = true;
    g.cam(FOOT.clone().addScaledVector(FRONT, -3).setY(2), 17);
    await tween(1600, (p) => F.rainbow.scale.setScalar(Math.max(0.01, easeOut(p))));
    await g.talk(data.lines.rainbow);
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-9-13'], memento: 'item/olive-leaf' });
  },
};
