// 창조 6일의 세계. 하나의 세계를 만들어 두고 날마다 acts로 바꾼다. 모델은 모두 임시 도형이다.
import * as THREE from 'three';
import { mat, makeCloud, makeSpiritLight, makeTree, makeAnimal, makeBird, animateAnimal } from './props.js';
import { tween, easeOut, stagger } from './anim.js';

const C = (hex) => new THREE.Color(hex);
const SKY = {
  dark: C(0x020308), light: C(0xcfc8b8), day: C(0x9fd4f5), night: C(0x0b1030), rest: C(0xffe3b0),
};
const LAND_RADIUS = 7;

// 해·달·별의 겉보기 운동(지구 자전 때문에 땅에서 보이는 움직임).
// 해는 EAST(화면 오른쪽 바다)에서 떠서 UP(섬 너머 하늘 높은 곳)을 지나 반대편 바다로 진다.
// 수평선 아래로 내려간 해와 달은 바다 수면에 가려 보이지 않는다.
const ORBIT_R = 10;
const EAST = new THREE.Vector3(1, 0, -1).normalize();
const UP = new THREE.Vector3(-0.5, 1, -0.5).normalize();
const SUNSET = C(0xf6a56b);
const DUSK = C(0x7a64b0); // 해가 수평선 아래에 있을 때의 보랏빛 여명
const SUN_HIGH = C(0xffe27a), SUN_LOW = C(0xff9a4a);
const NOON = Math.PI / 2; // 해가 하늘 가장 높은 곳에 있는 한낮. 넷째 날 전 하늘(낮)과 색이 같다
const MOON_LAG = 0.035; // 달의 공전: 해보다 하루에 약 12.6°(2π×0.035) 늦게 뜬다
const LATE_AFTERNOON = Math.PI * 2 + 2.5; // 넷째 날 이후 해가 천천히 흘러가다 멈추는 위치

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeInOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
function orbitPos(theta, out) {
  return out.copy(EAST).multiplyScalar(Math.cos(theta) * ORBIT_R).addScaledVector(UP, Math.sin(theta) * ORBIT_R);
}

// 해의 각도(theta)로 하늘 색과 빛의 세기를 정한다. 수평선 근처에서는 노을빛이 섞인다.
const skyColor = new THREE.Color();
const glowColor = new THREE.Color();
export function skyState(theta) {
  const h = Math.sin(theta); // 해의 높이 -1~1
  const day = smooth(-0.12, 0.3, h);
  const glow = Math.max(0, 1 - Math.abs(h) / 0.3);
  // 어두운 밤색에 주황을 바로 섞으면 갈색이 되므로, 수평선 아래에서는 보랏빛에서 주황으로 옮겨 간다
  glowColor.lerpColors(DUSK, SUNSET, smooth(-0.25, 0.05, h));
  skyColor.lerpColors(SKY.night, SKY.day, day).lerp(glowColor, glow * 0.6);
  return { bg: skyColor, hemi: 0.22 + 0.88 * day, sun: 1.4 * smooth(0, 0.25, h), stars: 1 - smooth(-0.2, 0.05, h), glow };
}

// 아직 나타나지 않은 물체는 그리지 않는다(크기 0이어도 visible이면 그리는 횟수에 든다)
function scaleIn(obj, s) { obj.scale.setScalar(Math.max(0.0001, s)); obj.visible = s > 0.001; }

export function makeCreation(scene) {
  const group = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xdfefff, 0x445533, 0);
  const sunLight = new THREE.DirectionalLight(0xfff1d0, 0);
  sunLight.position.set(-6, 12, 4);
  group.add(hemi, sunLight);

  const waterMat = mat(0x05070d);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.4, 32), waterMat);
  water.position.y = -0.2;
  group.add(water);

  // 창 1:2 '하나님의 영'. 형상 없이 물 위를 움직이는 빛으로만 보여 준다.
  const spirit = makeSpiritLight();
  const spiritOrb = spirit.userData.orb;
  spirit.position.y = 1;
  group.add(spirit);

  const clouds = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = makeCloud(1 + Math.random() * 0.5); // 천국 구름과 같은 부품
    const r = 10 + Math.random() * 3; // 바다 위에 두어 땅을 가리지 않게 한다
    c.position.set(Math.cos(a) * r, 6 + Math.random(), Math.sin(a) * r);
    scaleIn(c, 0);
    clouds.push(c);
    group.add(c);
  }

  const landMat = mat(0x8b6b45);
  const land = new THREE.Mesh(new THREE.CylinderGeometry(LAND_RADIUS + 1, LAND_RADIUS + 2.5, 2, 12), landMat);
  land.position.y = -1.6; // 처음에는 물 아래에 잠겨 있다
  group.add(land);

  const trees = [];
  for (let i = 0; i < 24; i++) {
    const t = makeTree(i % 3 === 0 ? 'round' : 'pine');
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * (LAND_RADIUS - 1);
    t.position.set(Math.cos(a) * r, 1, Math.sin(a) * r); // land 기준 좌표: 윗면이 y=1
    t.userData.delay = Math.random() * 0.6;
    scaleIn(t, 0);
    trees.push(t);
    land.add(t);
  }

  const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), new THREE.MeshBasicMaterial({ color: 0xffe27a }));
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshBasicMaterial({ color: 0xe8eef8 }));
  sun.visible = moon.visible = false; // 넷째 날 전에는 빛만 있고 해와 달은 없다
  group.add(sun, moon);

  const starPos = [];
  // 별은 카메라에 붙여 먼 뒤쪽(z=-90)에 깐다. 땅과 바다에 가려진 별은 깊이 검사로 안 보인다.
  // 하늘과 함께 돌아도 모서리가 비지 않게 화면보다 넉넉한 정사각형에 뿌린다.
  for (let i = 0; i < 380; i++) starPos.push((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, -90);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0 });
  const stars = new THREE.Points(starGeo, starMat);
  stars.visible = false; // 투명도 0이어도 픽셀화 패스에 찍히므로 밤이 아닐 때는 끈다

  const fish = [];
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.28), mat(i % 2 ? 0xff9a3c : 0x5ec8e0));
    f.userData = { phase: Math.random(), a: Math.random() * Math.PI * 2, r: 10 + Math.random() * 4 };
    f.position.y = -1;
    fish.push(f);
    group.add(f);
  }

  const birds = [];
  for (let i = 0; i < 10; i++) {
    const b = makeBird();
    b.userData = { a: Math.random() * Math.PI * 2, r: 3 + Math.random() * 6, y: 4 + Math.random() * 2, speed: 0.4 + Math.random() * 0.3 };
    scaleIn(b, 0);
    birds.push(b);
    group.add(b);
  }

  const ANIMALS = [
    [0xf5f5f0, 0.6, 'sheep'], [0xc8a165, 0.8, 'lion'], [0x8d8d95, 1.1, 'elephant'], [0x9a6b3f, 0.75, 'deer'], [0x5a3d2b, 0.85, 'bear'],
    [0xe0c080, 0.8, 'horse'], [0x3a3a3a, 0.65, 'bear'], [0xd98e4a, 0.6, 'deer'], [0xffffff, 0.45, 'sheep'], [0x7a5a3a, 0.85, 'horse'],
  ];
  const animals = ANIMALS.map(([color, s, kind], i) => {
    const an = makeAnimal(color, s * 1.7, kind);
    const a = (i / ANIMALS.length) * Math.PI * 2;
    an.position.set(Math.cos(a) * 4, 0.5, Math.sin(a) * 4); // 땅이 다 솟은 뒤 윗면 높이
    Object.assign(an.userData, { heading: Math.random() * Math.PI * 2, delay: i * 0.06, speed: 0, timer: Math.random() * 3, moving: false });
    scaleIn(an, 0);
    group.add(an);
    return an;
  });

  const flags = { fish: false, birds: false, animalsWander: false };
  const sky = { on: false, drift: false, theta: NOON };

  function applySky(theta) {
    const st = skyState(theta);
    scene.background.copy(st.bg);
    hemi.intensity = st.hemi;
    sunLight.intensity = st.sun;
    orbitPos(theta, sun.position);
    sunLight.position.copy(sun.position); // 햇빛은 해가 있는 쪽에서 비친다
    sun.material.color.lerpColors(SUN_HIGH, SUN_LOW, st.glow); // 수평선 근처의 해는 주황빛
    orbitPos(theta + Math.PI - theta * MOON_LAG, moon.position);
    starMat.opacity = st.stars;
    stars.visible = st.stars > 0.02;
    stars.rotation.z = theta * 0.25; // 별도 하늘과 함께 돈다
  }

  const acts = {
    light: () => tween(2500, (p) => {
      hemi.intensity = p * 1.0;
      scene.background.lerpColors(SKY.dark, SKY.light, p);
      waterMat.color.lerpColors(C(0x05070d), C(0x3b4656), p);
      spiritOrb.material.opacity = 0.85 * (1 - p);
      spirit.intensity = 8 * (1 - p);
      spirit.visible = p < 1;
    }),
    sky: () => tween(3000, (p) => {
      scene.background.lerpColors(SKY.light, SKY.day, p);
      waterMat.color.lerpColors(C(0x3b4656), C(0x2f6fb5), p);
      hemi.intensity = 1 + p * 0.1;
      clouds.forEach((c, i) => scaleIn(c, easeOut(stagger(p, i * 0.07))));
    }),
    land: () => tween(3000, (p) => { land.position.y = -1.6 + easeOut(p) * 1.1; }),
    plants: () => tween(3500, (p) => {
      landMat.color.lerpColors(C(0x8b6b45), C(0x6fae4a), p);
      trees.forEach((t) => scaleIn(t, easeOut(stagger(p, t.userData.delay))));
    }),
    lights: async () => {
      // 1) 넷째 날 전의 낮하늘에서 그대로 이어진다. 한낮 자리에 해가 생겨나고 햇빛이 서서히 땅을 비춘다.
      //    달은 반대편 바다 아래에서 시작해, 밤이 되면 동쪽 바다에서 떠오른다(갑자기 나타나지 않게).
      sun.visible = moon.visible = true;
      orbitPos(NOON, sun.position);
      orbitPos(NOON + Math.PI - NOON * MOON_LAG, moon.position); // applySky와 같은 식이라 이어질 때 튀지 않는다
      sun.material.color.copy(SUN_HIGH);
      sunLight.position.copy(sun.position);
      const noon = skyState(NOON);
      const fromBg = scene.background.clone(), toBg = noon.bg.clone(), fromHemi = hemi.intensity;
      await tween(2200, (p) => {
        const e = easeOut(p);
        sun.scale.setScalar(Math.max(0.0001, e));
        sunLight.intensity = noon.sun * e;
        scene.background.lerpColors(fromBg, toBg, p);
        hemi.intensity = fromHemi + (noon.hemi - fromHemi) * p;
      });
      // 2) 하루가 돈다: 한낮 → 해넘이 → 달과 별의 밤 → 다음 날 해돋이 → 아침
      sky.on = true;
      const end = Math.PI * 2 + 0.9;
      await tween(16000, (p) => { sky.theta = NOON + (end - NOON) * easeInOut(p); });
      sky.drift = true; // 이후에는 아주 천천히 흐른다
    },
    seaAndSky: () => {
      flags.fish = flags.birds = true;
      return tween(2000, (p) => birds.forEach((b) => scaleIn(b, easeOut(p) * 2)));
    },
    animals: () => {
      flags.animalsWander = true;
      return tween(3000, (p) => animals.forEach((an) => scaleIn(an, easeOut(stagger(p, an.userData.delay)))));
    },
    rest: () => {
      flags.animalsWander = false;
      sky.on = false; // 안식: 해가 늦은 오후 자리에 머문다
      const from = scene.background.clone();
      return tween(3000, (p) => {
        scene.background.lerpColors(from, SKY.rest, p);
        hemi.color.lerpColors(C(0xdfefff), C(0xffe9c0), p);
        sunLight.intensity = 1.4 - p * 0.4;
      });
    },
  };

  const tmp = new THREE.Vector3();
  function update(dt, t) {
    if (sky.on) {
      if (sky.drift) sky.theta = Math.min(LATE_AFTERNOON, sky.theta + dt * 0.01);
      applySky(sky.theta);
    }
    spirit.position.set(Math.cos(t * 0.4) * 5, 1 + Math.sin(t * 1.3) * 0.2, Math.sin(t * 0.6) * 5);

    if (flags.fish) for (const f of fish) {
      const s = (t * 0.35 + f.userData.phase) % 1; // 주기의 앞 30%만 물 위로 뛰어오른다
      const a = f.userData.a + s * 0.6;
      f.position.set(Math.cos(a) * f.userData.r, s < 0.3 ? -0.3 + Math.sin((s / 0.3) * Math.PI) * 1.4 : -1, Math.sin(a) * f.userData.r);
      f.rotation.set(0, -a - Math.PI / 2, s < 0.3 ? Math.cos((s / 0.3) * Math.PI) * 0.8 : 0);
    }

    if (flags.birds) for (const b of birds) {
      const u = b.userData;
      const a = u.a + t * u.speed;
      b.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 2 + u.a) * 0.3, Math.sin(a) * u.r);
      b.rotation.y = -a - Math.PI / 2;
      b.children[1].rotation.x = Math.sin(t * 10 + u.a) * 0.6;
      b.children[2].rotation.x = -Math.sin(t * 10 + u.a) * 0.6;
    }

    // 동물: 걷다 서다를 번갈아 하고, 방향은 천천히 튼다(에덴과 같은 몸짓 animateAnimal)
    if (flags.animalsWander) for (const an of animals) {
      const u = an.userData;
      u.want ??= u.heading;
      u.timer -= dt;
      if (u.timer <= 0) {
        u.moving = !u.moving;
        u.timer = u.moving ? 2 + Math.random() * 3 : 1.5 + Math.random() * 3;
        u.want = u.heading + (Math.random() - 0.5) * 2;
      }
      // 땅 끝에 닿으면 가운데 쪽으로 돌아선다
      if (Math.hypot(an.position.x, an.position.z) > LAND_RADIUS - 1) { u.want = Math.atan2(-an.position.z, -an.position.x); u.moving = true; }
      const turn = Math.atan2(Math.sin(u.want - u.heading), Math.cos(u.want - u.heading));
      u.heading += Math.max(-1.5 * dt, Math.min(1.5 * dt, turn));
      u.speed += ((u.moving ? u.walk : 0) - u.speed) * Math.min(1, dt * 2);
      an.position.x += Math.cos(u.heading) * u.speed * dt;
      an.position.z += Math.sin(u.heading) * u.speed * dt;
      an.rotation.y = -u.heading;
      animateAnimal(an, u.speed, dt, t, !u.moving);
    }
  }

  return { group, stars, acts, update };
}
