// 곁길 에녹의 동행(창 5:21~24). 걷는 동안 함께 하는 일 넷:
// 갈림길에서 함께 기도(게이지) → 길 잃은 어린양의 가시 빼기(도전) → 중턱 막간(에녹) → 언덕 끝에서 아래 동네를 내려다보며 예언 듣기(유 1:14~15)
// → 빛 쪽으로 함께 걷기(움직이는 목표) → 하나님께서 데려가심 → 퀴즈(창 5:24)
// 창 5:24는 본문이 말하는 만큼만: 에녹이 천천히 떠올라 모여드는 구름 속에서 보이지 않게 된다. 죽음 장면이 아니다(히 11:5 옮겨짐).
// 경로: 므두셀라(짧은 인사)는 장막 동쪽에 두어, 에녹의 언덕길과 퀘스트 목표 사이 길에서 2.2 안으로 들어오지 않게 한다.
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeTent, makeCloud, makeTree, setArms } from '../props.js';
import { tween, easeOut } from '../anim.js';
import data from '../data/enoch.js';

const START = V(6, 5);
const HOME = V(4.5, 1.2); // 에녹의 집(장막)
// 언덕길: 언덕 끝(LOOK)과 정상(TOP)은 땅 가장자리에 둔다. 그 너머 낮은 땅에 동네가 보인다(2026-11-03 F13)
const PATH = [V(2.5, 2.8), V(-0.5, 0.5), V(-3.2, -1.5), V(-8.2, -7.4), V(-4.8, -9.9)];
const FORK = PATH[1]; // 갈림길: 기도하는 자리
const WAIT = PATH[1].clone().lerp(PATH[2], 0.5); // 어린양 소리를 듣고 서는 자리
const LAMB = WAIT.clone().add(V(-1.6, 1.6)); // 길 밖 가시덤불(각색). 길의 화면 왼쪽: 관찰자 오른쪽의 대천사에 가리지 않는다
const LAMB_YAW = -Math.PI * 0.75; // 어린양은 머리를 덤불 쪽(화면 위)에 박고, 엉덩이와 옆구리를 카메라 쪽에 둔다
const BUSH = LAMB.clone().add(V(-0.55, -0.55));
const REST = PATH[2]; // 중턱의 쉼 바위
const LOOK = PATH[3]; // 언덕 끝: 동네를 내려다보며 예언하는 자리
const TOP = PATH[4]; // 정상: 올라가시는 자리
const VILLAGE = V(-14.4, -13.2); // 언덕 아래 동네(각색, 유 1:15 "모든 사람"): 땅 가장자리 너머 낮은 땅
const LOW = -2.4; // 동네 땅 높이. 집과 사람은 0.7배로 줄여 멀리 아래에 있는 것처럼 보인다
const SON = V(7, 0.6); // 므두셀라: 장막 동쪽, 언덕길 반대편
const BY = V(0.9, -0.9); // 관찰자는 에녹의 화면 오른쪽에 선다(에녹이 화면 왼쪽)
const LEFT = V(-0.7, 0.7); // 어린양은 따라가는 사람의 화면 왼쪽
// 어린양 털에 박힌 가시(각색, F12): 다가설 쪽(월드 각도, 도), 뺄 횟수. 다가설 자리는 어린양의 화면 왼쪽·오른쪽에 둔다.
// 카메라 쪽(45도)에 서면 관찰자가 어린양을 가린다. 가시는 등 위로 비스듬히 솟게 꽂아 어느 쪽에서도 보이게 한다.
const THORNS = [
  { a: -70, hits: 1, text: '오른쪽 어깨 가시' },
  { a: -20, hits: 1, text: '오른쪽 뒷다리 가시' },
  { a: 110, hits: 2, text: '왼쪽 뒷다리에 깊이 박힌 가시' },
  { a: 165, hits: 2, text: '왼쪽 어깨에 깊이 박힌 가시' },
];

// 가시덤불: 푸른 잎 덩이에 가시가 삐져나온다. 어두운 덩이 하나(props.js makeThornBush)는 무엇인지 알아보기 어려웠다(R2)
function makeBramble() {
  const g = new THREE.Group();
  const leaf = mat(0x4f6e36), thorn = mat(PAL.thorn);
  for (const [x, z, r] of [[0, 0, 0.42], [0.34, -0.2, 0.3], [-0.22, 0.32, 0.32]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leaf);
    b.position.set(x, r * 0.85, z);
    g.add(b);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.3, 4), thorn);
    sp.position.set(Math.cos(a) * 0.4, 0.25 + (i % 3) * 0.14, Math.sin(a) * 0.4);
    sp.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
    g.add(sp);
  }
  return g;
}
// 어린양 털에 박힌 가시 한 개: 가는 가지(+Y가 바깥쪽)에 작은 가시 둘
function makeThorn() {
  const g = new THREE.Group();
  const m = mat(0x3a2818); // 흰 털 위에서 보이게 덤불 가시보다 짙게, 픽셀이 뭉개지지 않게 굵게
  const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.065, 0.46, 5), m);
  twig.position.y = 0.13;
  g.add(twig);
  for (const [y, s] of [[0.16, 1], [0.26, -1]]) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), m);
    sp.position.set(0.07 * s, y, 0);
    sp.rotation.z = -s * 1.1;
    g.add(sp);
  }
  return g;
}
// 흙벽 집: 납작한 지붕(옛 근동의 흙집)과 어두운 문
function makeHouse(w = 1.2, d = 1, h = 0.8) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(0xc9a878));
  wall.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.1, d + 0.12), mat(0x9a7a52));
  roof.position.y = h + 0.05;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.45, 0.3), mat(0x2a1d14));
  door.position.set(w / 2 + 0.01, 0.23, 0);
  g.add(wall, roof, door);
  return g;
}

export default {
  id: 'enoch',
  data,
  records: ['person/enoch', 'person/methuselah', 'item/path-stone', 'word/gen-5-24'],
  kicker: '언덕길로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 5242, start: START, sky: 0xd2e2ee, ground: 0x93a85e,
      stages: { top: { c: toCam(TOP, 2), r: 2.6 }, look: { c: toCam(LOOK, 1.2), r: 1.8 }, rest: { c: toCam(REST, 1.2), r: 1.8 } },
      trees: 16, keep: [...PATH, LAMB],
    });
    F.put(makeTent(0x7a5a3a), HOME.clone().add(V(-1.2, -1.4)), 1.3, Math.PI / 4);
    // 길가의 돌: 길 양쪽에 놓아 언덕길을 보인다(언덕 끝에서 관찰자가 서는 쪽은 비운다)
    const stoneM = mat(0x9a9488);
    PATH.forEach((p, i) => {
      if (!i) return;
      const side = V(1, -1).normalize().multiplyScalar(1.4);
      for (const s of [-1, 1]) {
        if (i === 3 && s === 1) continue;
        const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + (i % 2) * 0.08, 0), stoneM);
        st.position.copy(p).addScaledVector(side, s).setY(0.15);
        F.group.add(st);
      }
    });
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), stoneM);
    rock.position.copy(REST).add(V(-0.9, -0.2)).setY(0.3);
    F.group.add(rock);
    F.block(rock.position, 0.5);

    // 가시덤불과 거기 걸린 어린양(각색: 본문에 없는 일, 눅 15:4 잃은 양을 찾음). 털에 가시 넷이 박혀 있다
    F.put(makeBramble(), BUSH, 0.45);
    const lamb = F.animal('sheep', 0xf2ede2, 0.6, LAMB, { still: true, yaw: LAMB_YAW });
    lamb.rotation.y = -LAMB_YAW;
    lamb.updateMatrixWorld(true);
    const body = lamb.userData.body;
    const bodyQ = body.getWorldQuaternion(new THREE.Quaternion()).invert();
    const thorns = THORNS.map((t, i) => {
      const a = (t.a * Math.PI) / 180, dir = V(Math.cos(a), Math.sin(a));
      const at = LAMB.clone().addScaledVector(dir, 0.2).setY(0.55);
      const out = dir.clone().setY(0.55).normalize(); // 화면 왼쪽·오른쪽으로 비스듬히 뻗어 덤불과 겹치지 않고 풀빛 위에 보인다
      const th = makeThorn();
      th.position.copy(body.worldToLocal(at.clone()));
      const outLocal = out.clone().applyQuaternion(bodyQ);
      th.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outLocal);
      body.add(th);
      return { pos: LAMB.clone().addScaledVector(dir, 1.05), text: t.text, hits: t.hits, i, thorn: th, dir, outLocal };
    });

    // 언덕 아래 동네(각색, F13): 땅 가장자리 너머 낮은 땅에 장막과 흙집, 저녁 연기, 사람들.
    // 낮은 땅은 들판 전체를 둘러 화면 끝까지 깔아, 들판이 들 위에 솟은 언덕으로 보이게 한다(작은 판이면 하늘에 뜬 섬처럼 보였다)
    const low = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 1.2, 40), mat(0x84985a));
    low.position.set(0, LOW - 0.6, 0);
    F.group.add(low);
    const at = (x, z) => VILLAGE.clone().add(V(x, z)).setY(LOW);
    for (const [x, z, c, yaw] of [[1.6, -1.8, 0x8a6a48, 0.4], [-1.8, 1.2, 0x6b4a32, 1.2], [2.4, 1.8, 0x9a7a58, -0.3], [-0.6, -3.4, 0x7a5a3a, 0.9]]) {
      const tent = makeTent(c, 0.6);
      tent.position.copy(at(x, z));
      tent.rotation.y = yaw;
      F.group.add(tent);
    }
    for (const [x, z, yaw] of [[-0.4, -0.6, 0.2], [0.9, 3.0, -0.5], [-2.8, -1.4, 0.7]]) {
      const house = makeHouse();
      house.scale.setScalar(0.7);
      house.position.copy(at(x, z));
      house.rotation.y = yaw;
      F.group.add(house);
    }
    for (const [x, z, s] of [[-3.6, 2.8, 0.9], [3.6, -0.8, 0.8], [-1.2, 4.2, 1]]) {
      const tree = makeTree(s > 0.85 ? 'round' : 'pine');
      tree.position.copy(at(x, z));
      tree.scale.setScalar(s * 0.7);
      F.group.add(tree);
    }
    // 저녁 연기: 집과 장막 곁에서 작은 덩이가 올라가며 흐려진다
    const smokeM = mat(0xe6e2da, { transparent: true, opacity: 0.7 });
    const puffs = [];
    for (const [x, z] of [[-0.4, -0.6], [1.6, -1.8], [0.9, 3.0]]) {
      for (let k = 0; k < 4; k++) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), smokeM);
        puff.userData.base = at(x, z).add(new THREE.Vector3(0, 0.65, 0));
        puff.userData.k = k / 4;
        F.group.add(puff);
        puffs.push(puff);
      }
    }
    F.onUpdate((dt, t) => {
      for (const p of puffs) {
        const f = (t * 0.3 + p.userData.k) % 1;
        p.position.copy(p.userData.base).add(new THREE.Vector3(Math.sin(f * 3 + p.userData.k * 6) * 0.15 + f * 0.4, f * 1.8, -f * 0.2));
        p.scale.setScalar(0.6 + f * 1.4);
      }
    });
    const villagers = [
      F.person('v1', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x8a5a3a }, at(0.6, -1.2)),
      F.person('v2', { hair: 'long', hairColor: PAL.hairBrown, outfit: 'robe', outfitColor: 0xb86a4a }, at(-1.2, 0.4)),
      F.person('v3', { hair: 'short', hairColor: PAL.hairBrown, outfit: 'tunic', outfitColor: 0x5a6a8a }, at(2.0, 0.6)),
    ];
    for (const v of villagers) v.scale.setScalar(0.7);

    // 구름: 정상 위 하늘에 내려와, 에녹이 그 속으로 올라간다(F14)
    const clouds = new THREE.Group();
    for (const [x, z, s] of [[0, 0, 1.4], [-1.6, 0.8, 1], [1.4, -1, 1.1]]) {
      const c = makeCloud(s);
      c.position.set(x, 0, z);
      clouds.add(c);
    }
    // 에녹이 구름 아래에 닿을 때 앞쪽(카메라 쪽)에서 감싸 오는 구름 둘. 처음에는 작게 숨겨 둔다
    for (const [x, z, s] of [[0.8, 1.3, 1.1], [-0.9, 1.0, 1.0]]) {
      const c = makeCloud(s);
      c.position.set(x * 2, -0.6, z);
      c.scale.setScalar(0.01);
      c.userData.wrap = s;
      clouds.add(c);
    }
    for (const c of clouds.children) c.userData.home = c.position.clone();
    const cloudGlow = new THREE.PointLight(PAL.holy, 0, 12);
    cloudGlow.position.set(0, -1.2, 0.8);
    clouds.add(cloudGlow);
    clouds.userData.glow = cloudGlow;
    clouds.position.copy(TOP).setY(16);
    clouds.visible = false;
    F.group.add(clouds);

    const enoch = F.person('enoch', { hair: 'long', hairColor: 0x9a9590, beard: 'long', outfit: 'robe', outfitColor: 0xf1ead8, item: 'staff' }, PATH[0]);
    const methuselah = F.person('methuselah', { hair: 'short', hairColor: PAL.hairDark, beard: 'short', outfit: 'tunic', outfitColor: 0x7f8a4a }, SON);
    Object.assign(F, { enoch, methuselah, rock, lamb, thorns, villagers, clouds });
    F.spots = { start: START, home: HOME, fork: FORK, lamb: LAMB, rest: REST, look: LOOK, top: TOP };
    F.plant();
    return F;
  },

  async run(g) {
    const { F } = g;
    const { enoch, methuselah, lamb, thorns, villagers, clouds } = F;
    F.acts.face(methuselah, START);
    // 동네 사람들이 집과 장막 사이를 오간다
    villagers.slice(0, 2).forEach(async (fig, n) => {
      const a = fig.position.clone(), b = a.clone().add(n ? V(1.4, 0.8) : V(-1.2, 1.4));
      for (let k = 0; k < 60; k++) { await F.acts.walkTo(fig, k % 2 ? a : b, 0.45); await F.acts.wait(1800 + n * 700); }
    });
    F.acts.face(villagers[2], villagers[1].position);
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

    // 2. 길 잃은 어린양(각색): 털에 박힌 가시 넷을 하나씩 뺀다(도전, F12). 성공할수록 구간이 좁아지고(main.js 난도),
    // 깊이 박힌 가시는 두 번에 나눠 뺀다. 빗나가면(세게 당기면) 어린양이 움찔한다. 감점은 없다.
    const toWait = F.acts.walkTo(enoch, WAIT, 1.1);
    g.cam(LAMB, 10);
    await g.talk(data.lines.lamb);
    g.cam(null, 8);
    await toWait;
    F.acts.face(enoch, LAMB);
    let flinching = false;
    const flinch = () => {
      if (flinching) return;
      flinching = true;
      const base = lamb.position.clone();
      const away = lamb.position.clone().sub(g.player.position).setY(0).normalize().multiplyScalar(0.16);
      tween(380, (p) => {
        const k = Math.sin(p * Math.PI);
        lamb.position.copy(base).addScaledVector(away, k).setY(k * 0.1);
        lamb.rotation.x = Math.sin(p * Math.PI * 5) * 0.14 * (1 - p);
      }).then(() => { lamb.position.copy(base); lamb.rotation.x = 0; flinching = false; });
    };
    const up = new THREE.Vector3(0, 1, 0);
    await g.challenge({
      title: '어린양의 가시 빼기', spots: thorns, verb: '살살 빼기', kind: 'hold', tier: 1, onMiss: flinch, missText: '너무 세게 당겨 어린양이 움찔했어요', radius: 0.9, fruits: ['gentle', 'patience'],
      onHit: async (sp, n) => {
        const th = sp.thorn;
        if (n < sp.hits) {
          // 깊은 가시: 반쯤 빠져나온다
          const from = th.position.clone();
          await tween(260, (p) => th.position.copy(from).addScaledVector(sp.outLocal, 0.08 * easeOut(p)));
          return;
        }
        // 다 빠진 가시는 털에서 떨어져 땅에 눕는다
        F.group.attach(th);
        const from = th.position.clone(), q0 = th.quaternion.clone();
        const to = from.clone().addScaledVector(sp.dir, 0.4).setY(0.03);
        const flat = new THREE.Quaternion().setFromUnitVectors(up, sp.dir.clone().applyAxisAngle(up, Math.PI / 2));
        await tween(520, (p) => {
          th.position.lerpVectors(from, to, p);
          th.position.y = from.y + (to.y - from.y) * p * p + Math.sin(p * Math.PI) * 0.2;
          th.quaternion.slerpQuaternions(q0, flat, easeOut(p));
        });
      },
    });
    // 가시가 다 빠지면 어린양이 몸을 털고 따라온다. 땅에 떨어진 가시는 치운다(남겨 두면 정체 모를 검은 물체로 보인다, R2)
    await tween(500, (p) => {
      lamb.rotation.x = Math.sin(p * Math.PI * 6) * 0.12 * (1 - p);
      for (const sp of thorns) sp.thorn.scale.setScalar(Math.max(0.01, 1 - p));
    });
    lamb.rotation.x = 0;
    for (const sp of thorns) F.group.remove(sp.thorn);
    Object.assign(lamb.userData, { lead: g.player, leadOffset: LEFT });
    g.cam(null, 13);
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

    // 3. 언덕 끝에서 함께 내려다보기: 에녹이 땅 가장자리에 서서 아래 동네 사람들을 두고 예언한다(유 1:14~15).
    const toLook = F.acts.walkTo(enoch, LOOK, 1.1);
    await g.quest({
      title: '에녹의 동행', targets: [{ pos: LOOK.clone().add(BY) }],
      text: () => '언덕 끝에서 에녹과 함께 내려다보기', radius: 1.6, hold: 1.6, holdLabel: () => '에녹과 같은 쪽을 보는 중',
    });
    await toLook;
    Object.assign(lamb.userData, { lead: null, home: lamb.position.clone(), still: true });
    removeGreet();
    // 카메라는 언덕 끝의 에녹을 가운데 두어, 그 너머(화면 위) 아래 동네가 함께 보이게 한다. 가로 화면에서도 에녹이 대사 창 위에 온다
    g.cam(LOOK, 12);
    g.stage('look');
    F.acts.face(enoch, VILLAGE);
    await g.talk(data.lines.prophecy.slice(0, 4));
    F.acts.face(enoch, g.player.position);
    await g.talk(data.lines.prophecy.slice(4));
    g.reward('prophecy', 'step');

    // 4. 빛 쪽으로 함께 걷기: 정상 위로 구름이 내려오고 형상 없는 빛이 머문다. 에녹이 그쪽으로 걷는다(움직이는 목표).
    g.cam(TOP, 13);
    clouds.visible = true;
    await Promise.all([
      tween(1600, (p) => (clouds.position.y = 16 - 7 * easeOut(p))),
      F.acts.presence(TOP.clone().setY(1.2), 1600),
    ]);
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

    // 창 5:24(F14, 2차): 발이 땅에서 아주 천천히 떨어지고, 일정한 느린 속도로 오르다가 구름 아래에서 더 느려진다.
    // 그동안 구름이 에녹 둘레로 모여 앞을 감싸고 구름 속 빛이 밝아진다. 에녹은 구름 속에서 서서히 흐려져 보이지 않게 되고,
    // 구름 위로 튀어 나가지 않는다(히 11:5 옮겨짐, 빛기둥 없음). 오르는 동안 창 5:24 서술이 떠 있다.
    g.stage('top');
    F.acts.face(enoch, g.player.position);
    const { rig } = enoch.userData;
    enoch.userData.pose = 'rise';
    enoch.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; } });
    const focus = TOP.clone();
    // 낮은 가로 화면(740×360)은 HUD와 대사 창 사이가 좁아 구름이 위 가장자리에 걸렸다(U5). 그 화면에서는 카메라가 에녹을 더 따라 오른다
    const follow = innerWidth > innerHeight && innerHeight <= 480 ? 1.25 : 0.85;
    g.cam(focus, 12);
    F.acts.presence(TOP.clone().setY(clouds.position.y - 1), 3000);
    const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    // 속도: 0~T1초 0에서 v까지 서서히, T2초까지 v로 일정, T3초에 0으로 멈춘다. 멈추는 높이 H는 위에서 내려다볼 때 구름 아래 끝에 닿는 곳(구름 중심은 9)
    const T1 = 1.6, T2 = 3.6, T3 = 6.6, H = 5.8;
    const v = H / (T1 / 2 + (T2 - T1) + (T3 - T2) / 2);
    const lift = (t) => t < T1 ? v * t * t / (2 * T1)
      : t < T2 ? v * (T1 / 2 + t - T1)
        : v * (T1 / 2 + T2 - T1 + (t - T2) - (t - T2) ** 2 / (2 * (T3 - T2)));
    const glow = clouds.userData.glow;
    // 구름 하나하나: k(0 제자리 ~ 1 모임)만큼 에녹 쪽으로 모이고 내려온다. 앞쪽 구름은 커지며 감싼다
    const gather = (k) => {
      for (const c of clouds.children) {
        const { home, wrap } = c.userData;
        if (!home) continue;
        c.position.set(home.x * (1 - 0.55 * k), home.y - (wrap ? 1.6 : 1.0) * k, home.z * (1 - 0.3 * k));
        if (wrap) c.scale.setScalar(Math.max(0.01, wrap * k));
        c.children[0].material.emissiveIntensity = 0.35 + 0.2 * k;
      }
    };
    const rise = tween(T3 * 1000, (p) => {
      const t = p * T3, h = lift(t);
      rig.position.y = h;
      rig.rotation.z = Math.sin(t * 1.6) * 0.03 * (1 - p);
      focus.y = h * follow;
      setArms(enoch, 'raise', 0.03);
      gather(ss(2.6, 5.8, t));
      glow.intensity = 6 * ss(2.6, 5.8, t);
      const a = 1 - ss(3.8, 6.4, t);
      enoch.traverse((o) => { if (o.isMesh) o.material.opacity = a; });
    });
    await g.talk(data.lines.taken.slice(0, 1));
    await rise;
    enoch.visible = false;
    F.acts.presence(null);
    // 구름은 천천히 흩어져 제자리로 돌아가고 빛이 잦아든다(어린양 대사와 함께, 기다리지 않는다)
    tween(3200, (p) => { gather(1 - easeOut(p)); glow.intensity = 6 * (1 - p); });
    lamb.rotation.z = 0.35; // 어린양이 고개를 들어 하늘을 본다(머리가 +x)
    g.cam(lamb.position.clone(), 12);
    await g.talk(data.lines.taken.slice(1, 2));
    g.cam(TOP, 12);
    await g.talk(data.lines.taken.slice(2));
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-5-24'], memento: 'item/path-stone' });
  },
};
