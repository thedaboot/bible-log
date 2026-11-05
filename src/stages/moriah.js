// 1-8 모리아 산(창 22장): 사흘 길 끝 산 아래(창 22:4~5) → 깊은 대화(아브라함, 조건) → 막간(이삭)
// → 산 오르기(퀘스트: 길목마다 앞서 기다리기) → 창 22:7~8 → 가파른 비탈에서 이삭의 나뭇단 받쳐 주기(도전, 균형)
// → 제단(멀리서) → 여호와의 사자가 부름(여기서 멈춤) → 숫양과 여호와 이레 → 퀴즈(창 22:14).
// 폭력 연출 규칙: 칼을 든 장면은 멀리서, 서술로만(quests-and-staging.md).
// 산(2026-11-05 F59 "언덕 같아 보이지도 않고 깊이감이 없다"): 정상을 가운데 둔 네 층의 바위 단을 쌓고, 단마다 절벽 아래를 감아
// 오르는 돌계단 길을 좌우로 번갈아 둔다(굽이진 길). 걷는 높이는 heightAt이 정하고 F.onUpdate가 인물마다 맞춘다(1-4 방주 발판과 같은 방법).
// 절벽은 작은 원 충돌을 촘촘히 둘러 막고, 계단 끝만 터 두어 field.js 길찾기가 계단으로 돌아가게 한다.
import * as THREE from 'three';
import { makeField, V, toCam } from '../field.js';
import { PAL, mat, makeAltar, makeLogs, makeThornBush, makeAngel, makeTree } from '../props.js';
import { tween, easeOut, easeBack } from '../anim.js';
import data from '../data/moriah.js';

const START = V(6, 5);
const FOOT = V(4, 1.5); // 산 아래, 종들과 나귀가 남는 곳(창 22:5)
const PEAK = V(-5.5, -5.5);
const ALTAR = PEAK.clone().add(V(-0.3, -0.3)); // 꼭대기 단의 안쪽: 무대 가운데에서 비켜 서는 길을 막지 않게
const THICKET = PEAK.clone().add(V(-1.5, 1.2)); // 숫양이 뿔이 걸린 덤불(창 22:13)

// 산의 모양: 단 가장자리 반지름(바깥부터), 단 하나의 높이, 계단 폭. 계단 i는 단 i 절벽 바깥을 따라 각도 [아래, 위](도)로 오른다.
const RINGS = [9.2, 7.2, 5.2, 3.3];
const STEP = 1.5; // 절벽 하나가 사람 키의 한 배 반
const RW = 1.4;
// 계단은 아래 BOT만큼 평평하게 들어서서 오르고, 위 끝 LAND 앞에서 다 올라 층계참이 되며, 층계참은 끝(t)을 지나 OVER만큼 이어진다.
// 절벽 틈은 층계참 곁에만 열린다(그래서 단에 오르는 길은 계단뿐이다)
const BOT = 0.8, LAND = 1.4, OVER = 1.1;
const RAMPS = [[20, 50], [50, 20], [20, 60], [60, 0]]; // 화면 오른쪽(작은 각) ↔ 왼쪽(큰 각)으로 번갈아 오른다
const RAD = Math.PI / 180;
const polar = (a, r) => PEAK.clone().add(V(Math.cos(a * RAD) * r, Math.sin(a * RAD) * r));
// 계단 i의 모양: 방향(각이 커지면 1), 가운데 줄 반지름, 오르는 길이(가운데 줄 기준), 길이 s 자리의 각
const ramp = (i) => {
  const [b, t] = RAMPS[i], dir = Math.sign(t - b), rm = RINGS[i] + RW / 2;
  return { b, t, dir, rm, r: RINGS[i], arc: Math.abs(t - b) * RAD * rm, angle: (s) => b + (dir * s) / rm / RAD };
};
// 계단 위 길이 s 자리에서 오른 비율(0~1)
const rise = (i, s) => { const R = ramp(i); return Math.min(1, Math.max(0, (s - BOT) / (R.arc - LAND - BOT))); };
// 걷는 높이: 안쪽 단일수록 STEP씩 높고, 계단 위에서는 길을 따라 고르게 오른다
export function heightAt(p) {
  const dx = p.x - PEAK.x, dz = p.z - PEAK.z, d = Math.hypot(dx, dz);
  const lvl = RINGS.filter((r) => d < r).length;
  let y = lvl * STEP;
  if (lvl < RINGS.length) {
    const R = ramp(lvl), s = (Math.atan2(dz, dx) / RAD - R.b) * R.dir * RAD * R.rm;
    if (d >= R.r && d <= R.r + RW && s >= 0 && s <= R.arc + OVER) y += STEP * rise(lvl, s);
  }
  return y;
}
const at = (p) => p.clone().setY(heightAt(p));
// 계단 i 위의 점(f 0 아래 ~ 1 위), 계단 가운데 줄
const onRamp = (i, f) => { const R = ramp(i); return polar(R.angle(f * R.arc), R.rm); };
// 길목: 계단 i를 다 올라선 단 위(절벽 끝에서 한 걸음 안쪽)
const TRAIL = RAMPS.slice(0, 3).map(([, t], i) => polar(t, RINGS[i] - 1));

export default {
  id: 'moriah',
  data,
  records: ['person/isaac', 'person/youth', 'place/moriah', 'creature/ram', 'item/firewood', 'word/gen-22-14'],
  kicker: '모리아 땅으로 내려가기 전',

  build(scene) {
    const F = makeField({
      scene, seed: 2214, start: START, sky: 0xdfe0dc, ground: 0x9a9a6a,
      stages: { foot: { c: toCam(FOOT, 1.2), r: 1.8 }, peak: { c: PEAK.clone().add(V(0.6, 0.6)), r: 1.4 } },
      trees: 0,
    });
    const rock = [mat(0x857563), mat(0x76685a)];
    const top = [mat(0x8f9a62), mat(0xa29a6a), mat(0xb0a47a), mat(0xbcb08c)];
    // 바위 단: 옆면은 바위색 띠를 번갈아, 윗면은 아래 풀빛에서 위 마른 돌빛으로. 가장자리를 ±0.3 흔들어 깎은 원통처럼 보이지 않게 한다
    // (걷는 사람은 절벽 충돌 때문에 가장자리에서 0.45 넘게 떨어져 서므로 흔든 만큼 허공에 뜨거나 묻히지 않는다).
    RINGS.forEach((r, i) => {
      const y = (i + 1) * STEP;
      const geo = new THREE.CylinderGeometry(r, r + 0.12, y + 0.6, 28, 1);
      const pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const x = pos.getX(k), z = pos.getZ(k), a = Math.atan2(z, x), h = Math.hypot(x, z);
        if (h > 0.01) { const s = 1 + (0.18 * Math.sin(a * 5 + i * 1.7) + 0.12 * Math.sin(a * 13 + i)) / h; pos.setX(k, x * s); pos.setZ(k, z * s); }
      }
      geo.computeVertexNormals();
      const tier = new THREE.Mesh(geo, [rock[i % 2], top[i], rock[i % 2]]);
      tier.position.copy(PEAK).setY((y - 0.6) / 2);
      F.group.add(tier);
      // 절벽: 원 충돌을 가장자리에 촘촘히(계단 층계참 곁만 비운다). 땅 밖(반지름 12.6 너머)은 걸어 닿지 못하므로 두지 않는다
      const R = ramp(i);
      const gap = [R.angle(R.arc - LAND + 0.1), R.angle(R.arc + OVER - 0.1)].sort((m, n) => m - n);
      const n = Math.ceil((Math.PI * 2 * r) / 0.38);
      for (let k = 0; k < n; k++) {
        let a = (k / n) * 360;
        if (a > 180) a -= 360;
        if (a >= gap[0] && a <= gap[1]) continue;
        const p = polar(a, r - 0.12);
        if (p.length() < 12.6) F.block(p, 0.22);
      }
    });
    // 돌계단: 절벽 바깥을 감아 오른다. 아랫단을 뺀 바깥 가장자리와 끝에 돌을 놓아 계단으로만 단에 오르게 한다
    const stair = mat(0xc2ab82), stone = mat(0x8a8478);
    RAMPS.forEach((_, i) => {
      const R = ramp(i), len = R.arc + OVER, n = Math.ceil(len / 0.34);
      for (let k = 0; k < n; k++) {
        const sk = ((k + 0.5) / n) * len, h = STEP * rise(i, sk) + 0.07;
        const st = new THREE.Mesh(new THREE.BoxGeometry(RW, h, (len / n) * 1.08), stair);
        st.position.copy(polar(R.angle(sk), R.rm)).setY(i * STEP - 0.05 + h / 2);
        st.rotation.y = -R.angle(sk) * RAD;
        F.group.add(st);
      }
      const rocks = [];
      for (let sk = BOT; sk <= len + 0.2; sk += 0.34) rocks.push(polar(R.angle(sk), R.r + RW + 0.1));
      for (let k = 0; k <= 3; k++) rocks.push(polar(R.angle(len + 0.2), R.r + 0.1 + (RW / 3) * k));
      rocks.forEach((p, k) => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + (k % 3) * 0.03, 0), stone);
        m.position.copy(p).setY(i * STEP + 0.12);
        m.rotation.set(k, k * 2, 0);
        F.group.add(m);
        F.block(p, 0.22);
      });
    });
    // 나무: 산자락 단 위에는 작게(멀리 큰 산으로 보이게), 들판에는 제 크기로. 계단 둘레와 카메라 쪽(x+z>5)은 비운다
    const trees = [
      [V(-9.5, 3.5), 1.2, 'pine'], [V(-4, 7.5), 1.1, 'round'], [V(9, -5), 1.2, 'pine'], [V(7.5, -7.5), 1, 'round'], [V(1.5, 6.2), 1, 'pine'],
      [polar(100, 8), 0.5, 'pine'], [polar(118, 8.1), 0.45, 'pine'], [polar(-15, 8), 0.5, 'round'], [polar(-35, 7.8), 0.45, 'pine'],
      [polar(90, 5.9), 0.4, 'pine'], [polar(-10, 5.8), 0.4, 'pine'], [polar(110, 3.8), 0.35, 'pine'], [polar(-45, 3.9), 0.35, 'round'],
    ];
    for (const [p, s, kind] of trees) {
      const tree = makeTree(kind);
      tree.position.copy(at(p));
      tree.scale.setScalar(s);
      F.group.add(tree);
      F.block(p, 0.35 * s);
    }
    const altar = makeAltar(1.1);
    altar.visible = false;
    F.put(altar, at(ALTAR), 0.6);
    F.put(makeThornBush(1.1), at(THICKET), 0.45);
    const abraham = F.person('abraham', { hair: 'short', hairColor: 0xd8d4cc, beard: 'long', outfit: 'traveler', outfitColor: 0x7f5a3a }, FOOT.clone().add(V(0.2, -1)));
    const isaac = F.person('isaac', { hair: 'short', hairColor: PAL.hairBrown, outfit: 'tunic', outfitColor: 0xd8c3a0, height: 0.95 }, FOOT.clone().add(V(-0.6, 1.2)));
    const servants = [V(5.6, 0.2), V(6.2, 1.6)].map((p, i) => F.person(`servant${i}`, { hair: 'short', hairColor: PAL.hairDark, outfit: 'tunic', outfitColor: 0x9a6b45 }, p));
    const donkey = F.animal('donkey', 0x8a7a6a, 0.85, V(6.6, -0.8), { roam: 0.8 });
    const ram = F.animal('ram', 0xe8e2d4, 0.9, at(THICKET.clone().add(V(0.8, 0.5))), { still: true });
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
    // 걷는 높이: 관찰자·두 사람·숫양이 서 있는 단과 계단 높이에 선다
    let sway = 0; // 나뭇단 흔들림(도전 중)
    const climbCam = new THREE.Vector3();
    F.onUpdate((dt, t) => {
      for (const o of [g.player, abraham, isaac, ram]) if (o.visible) o.position.y = heightAt(o.position);
      // 오르는 동안 카메라는 관찰자와 산 아래 들판(종들과 나귀) 사이 3분의 1 자리를 본다: 오를수록 아래가 멀어 보인다
      climbCam.copy(g.player.position).lerp(at(FOOT), 0.3);
      sway = Math.max(0, sway - dt * 0.25);
      wood.rotation.z = sway * Math.sin(t * 5);
      wood.rotation.x = sway * 0.5 * Math.sin(t * 3.3);
    });
    g.meet('abraham');
    // 사흘째 멀리 보인 산(창 22:4): 산 전체와 산 아래가 한 화면에 들어온다
    g.cam(at(PEAK).lerp(FOOT, 0.5), 18);
    await g.talk(data.lines.arrive.slice(0, 1));
    await F.acts.presence(abraham);
    await g.talk(data.lines.arrive.slice(1, 2));
    F.acts.presence(null);
    g.note('place/moriah');
    await g.talk(data.lines.arrive.slice(2, 4));
    g.cam(FOOT, 13);
    g.stage('foot');
    await g.talk(data.lines.arrive.slice(4));
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
    g.cam(climbCam, 15);
    for (const [i, p] of TRAIL.slice(0, 2).entries()) {
      const going = Promise.all([F.acts.walkTo(abraham, p.clone().add(V(0.6, -0.5)), 1.1), F.acts.walkTo(isaac, p.clone().add(V(-0.3, 0.6)), 1.1)]);
      await g.quest({ title: '산 오르기', targets: [{ pos: at(p) }], text: () => `${['첫째', '둘째'][i]} 길목에서 기다리기`, radius: 1.8, hold: 1.4, holdLabel: () => '두 사람을 기다리는 중' });
      await going;
      g.reward(`climb/${i}`, 'step');
      if (i === 1) {
        // 창 22:7~8 길 위의 물음
        F.acts.face(isaac, abraham.position);
        F.acts.face(abraham, isaac.position);
        g.cam(isaac.position.clone().lerp(abraham.position, 0.5), 11);
        await g.talk(data.lines.ask);
        g.cam(climbCam, 15);
      }
    }

    // 도전(F58, 각색): 가장 가파른 셋째 계단에서 이삭이 진 나뭇단이 기울지 않게 곁에서 받쳐 준다(창 22:6 이삭이 나무를 지고 오름).
    // 아브라함은 계단 위에서 기다리고, 받쳐 줄 때마다 이삭이 계단을 한 마디씩 오른다. 놓치면 나뭇단이 크게 흔들린다.
    const top = TRAIL[2];
    await Promise.all([F.acts.walkTo(abraham, top.clone().add(V(0.6, -0.5)), 1.2), F.acts.walkTo(isaac, onRamp(2, 0.08), 1.1)]);
    F.acts.face(isaac, onRamp(2, 0.5));
    sway = 0.35;
    g.cam(at(onRamp(2, 0.4)), 13);
    await g.talk(data.lines.steady.slice(0, 2));
    g.cam(climbCam, 15);
    const behind = (f) => at(onRamp(2, Math.max(0, f - 0.2)));
    await g.challenge({
      title: '나뭇단 받쳐 주기', spots: [{ pos: behind(0.08), text: '이삭 곁에서 나뭇단 받쳐 주기', hits: 3 }],
      verb: '받치기', kind: 'balance', fruits: ['kindness', 'patience'], radius: 1.8,
      onMiss: () => { sway = 0.6; F.acts.speak('isaac'); },
      onHit: async (sp, n) => {
        sway = 0.05;
        const f = [0.4, 0.72, 1][n - 1];
        await F.acts.walkTo(isaac, n < 3 ? onRamp(2, f) : top.clone().add(V(-0.3, 0.6)), 1.2);
        sp.pos.copy(behind(f));
        if (n < 3) sway = 0.3;
        g.reward(`steady/${n}`, 'step');
      },
    });
    sway = 0;
    g.reward('climb/2', 'step');
    // 무거운 짐을 함께 받쳐 줌(갈 6:2 짐을 서로 지라, 자비)
    g.reward('steady-done', 'challenge', null, 'kindness');
    F.acts.face(isaac, abraham.position);
    await g.talk(data.lines.steady.slice(2));
    g.cam(null, 13);
    // 길목마다 두 사람을 기다림(인내). 아브라함의 믿음(히 11:17)은 장면이 보여 준다.
    g.reward('climb-done', 'questDone', null, 'patience');

    // 창 22:9~10: 제단. 카메라는 멀리서, 산꼭대기와 저 아래 산자락(종들과 나귀)이 함께 보이게 비추고 서술로만 전한다.
    // 칼을 드는 동작은 그리지 않는다.
    g.stage('peak');
    await Promise.all([F.acts.walkTo(abraham, ALTAR.clone().add(V(0.9, -0.6)), 1), F.acts.walkTo(isaac, ALTAR.clone().add(V(-0.7, 0.9)), 1)]);
    g.cam(at(PEAK).lerp(FOOT, 0.4), 18);
    F.acts.carry(wood, null);
    wood.rotation.set(0, 0, 0);
    altar.visible = true;
    await tween(800, (p) => altar.scale.setScalar(1.1 * Math.max(0.01, easeBack(p))));
    wood.position.copy(at(ALTAR)).y += 0.95;
    await g.talk(data.lines.altar);

    // 창 22:11~12: 여호와의 사자가 부른다. 여기서 멈춘다.
    const peakY = heightAt(ALTAR);
    messenger.position.copy(ALTAR).add(V(1.4, -1.4)).setY(peakY + 3);
    messenger.visible = true;
    g.cam(at(ALTAR), 12);
    await tween(1000, (p) => messenger.position.setY(peakY + 3 - 1.6 * easeOut(p)));
    messenger.lookAt(abraham.position.x, messenger.position.y, abraham.position.z);
    F.acts.face(abraham, messenger.position);
    await g.talk(data.lines.call);
    F.acts.face(isaac, abraham.position);
    await F.acts.walkTo(isaac, abraham.position.clone().add(V(-0.7, 0.7)), 1.4);

    // 창 22:13~14 숫양과 여호와 이레. 숫양은 빛 속에서 보이지 않게 된다(잡는 장면은 그리지 않는다).
    ram.visible = true;
    g.note('creature/ram');
    g.cam(at(THICKET), 12);
    await g.talk(data.lines.ram.slice(0, 1));
    ram.userData.route = [ALTAR.clone().add(V(-0.7, -0.4))];
    await F.acts.walkTo(abraham, ALTAR.clone().add(V(0.9, 0.2)), 1.2);
    g.cam(at(ALTAR), 12);
    await F.acts.pillar(ALTAR);
    await tween(1400, (p) => ram.scale.setScalar(Math.max(0.001, 1 - p)));
    ram.visible = false;
    await g.talk(data.lines.ram.slice(1, 3));
    await F.acts.pillar(null);
    messenger.visible = true;
    await g.talk(data.lines.ram.slice(3, 4));
    messenger.visible = false;
    g.stage(null);
    // 산꼭대기에서 내려다본 산 아래: 종들과 나귀가 기다리는 들판(창 22:5, 22:19 종들에게로 돌아감)
    g.cam(at(PEAK).lerp(FOOT, 0.5), 18);
    await g.talk(data.lines.ram.slice(4));
    g.cam(null, 13);
    await g.finish({ words: ['word/gen-22-14'], memento: 'item/firewood' });
  },
};
