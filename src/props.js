// 3D 디자인 시스템: 모든 장면이 이 파일의 색표(PAL)와 부품만 써서 같은 모양을 유지한다.
// 지금은 임시 도형이다. 직접 만든 .glb 모델이 나오면 같은 함수 안에서 모델을 불러오도록 바꾼다.
import * as THREE from 'three';

// ---------- 색표 ----------
export const PAL = {
  cloud: 0xfdfbff,
  cloudShade: 0xe9e4f5,
  gold: 0xf2cf66,
  goldGlow: 0xc9a24a,
  light: 0xfff2b0,
  holy: 0xffe08a,
  grass: 0x6fae4a,
  soil: 0x8b6b45,
  water: 0x2f6fb5,
  bark: 0x7a5230,
  leafDark: 0x2f7d3a,
  leafLight: 0x7cc35a,
  fig: 0x3f8a3a,
  skins: 0x8a5a3a,
  fruit: 0xe8603a,
  lifeFruit: 0xffd25a,
  skin: 0xe8c29c,
  hairDark: 0x4a3426,
  hairBrown: 0x7a4a2a,
  eye: 0x2b2340,
  robe: 0xfffdf4,
  horn: 0xe2d2a8, // 양각 나팔, 기름 뿔병
  clay: 0xb8683c, // 물동이
  wicker: 0xc49a5a, // 바구니
  plank: 0x9a7048, // 다리 판자
  waste: 0x8f7a5a, // 동산 밖 거친 땅
  thorn: 0x5a4632, // 가시덤불
};

export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, ...extra });
const glowMat = (color, intensity = 0.5) => mat(color, { emissive: color, emissiveIntensity: intensity });

// ---------- 구름: 천국과 창조의 하늘이 같은 구름을 쓴다 ----------
export function makeCloud(size = 1) {
  const g = new THREE.Group();
  const m = glowMat(PAL.cloud, 0.35);
  for (const [x, y, s] of [[0, 0, 1], [-0.9, -0.15, 0.7], [0.85, -0.1, 0.75]]) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(size * s, 0).scale(1.4, 0.7, 1.1), m);
    puff.position.set(x * size, y * size, 0);
    g.add(puff);
  }
  return g;
}

// ---------- 하나님의 임재: 형상 없이 빛기둥과 움직이는 빛으로만 표현한다 ----------
export function makeLightPillar(radius = 1.2, height = 30) {
  const m = new THREE.MeshBasicMaterial({ color: PAL.light, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16, 1, true), m);
  beam.position.y = height / 2;
  const glow = new THREE.PointLight(PAL.holy, 12, 10);
  glow.position.y = 2;
  g.add(beam, glow);
  g.userData.pulse = (t) => (m.opacity = 0.45 + Math.sin(t * 1.5) * 0.1);
  return g;
}

export function makeSpiritLight() {
  const light = new THREE.PointLight(0xcfe0ff, 8, 10);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.85 }));
  light.add(orb);
  light.userData.orb = orb;
  return light;
}

// ---------- 인물: 관찰자(반투명)와 아담·하와가 같은 뼈대를 쓴다 ----------
const COLORS = [
  { id: 'sky', name: '하늘', hex: 0x9fd0ff },
  { id: 'dawn', name: '새벽', hex: 0xc6b5ff },
  { id: 'sunset', name: '노을', hex: 0xffc29a },
  { id: 'sprout', name: '새싹', hex: 0xa8e6b4 },
  { id: 'gold', name: '금빛', hex: 0xffe08a },
  { id: 'rose', name: '장미', hex: 0xffb3c7 },
  { id: 'sea', name: '바다', hex: 0x7fd6d0 },
  { id: 'olive', name: '올리브', hex: 0xc9d48a },
  { id: 'clay', name: '흙빛', hex: 0xd9a982 },
  { id: 'mist', name: '안개', hex: 0xdfe6ee },
];
const HAIRS = [
  { id: 'none', name: '없음' }, { id: 'short', name: '단발' }, { id: 'long', name: '장발' },
  { id: 'tied', name: '묶은 머리' }, { id: 'curly', name: '곱슬머리' },
];
const OUTFITS = [
  { id: 'tunic', name: '겉옷' }, { id: 'cape', name: '망토' }, { id: 'robe', name: '두루마기' },
  { id: 'shepherd', name: '목자 옷' }, { id: 'traveler', name: '나그네 옷' },
];
// 소품은 성경에 나오는 물건만 쓴다(docs/standards/art-3d.md). 머리띠·목도리는 근거가 약해 뺐다.
const ITEMS = [
  { id: 'none', name: '없음' }, { id: 'staff', name: '지팡이' }, { id: 'sling', name: '물매' },
  { id: 'horn', name: '양각 나팔' }, { id: 'oil', name: '기름 뿔병' }, { id: 'jar', name: '물동이' },
  { id: 'bag', name: '목자 가방' },
];
const SKINS = [
  { id: 's1', name: '밝은 피부', hex: 0xf3d3b5 }, { id: 's2', name: '연한 피부', hex: 0xe8c29c },
  { id: 's3', name: '올리브 피부', hex: 0xc99a6e }, { id: 's4', name: '구릿빛 피부', hex: 0xa8754a },
  { id: 's5', name: '갈색 피부', hex: 0x7d5232 }, { id: 's6', name: '짙은 갈색 피부', hex: 0x5a3a22 },
];
const HAIR_COLORS = [
  { id: 'black', name: '검정', hex: 0x231a16 }, { id: 'darkbrown', name: '흑갈색', hex: 0x3e2a1e },
  { id: 'brown', name: '갈색', hex: 0x6b4428 }, { id: 'chestnut', name: '밤색', hex: 0x8a4f2c },
  { id: 'sand', name: '모래색', hex: 0xc9a46a }, { id: 'gray', name: '회색', hex: 0x9a9590 },
];
const CLOTH = [
  { id: 'linen', name: '흰 아마포', hex: 0xf1ead8 }, { id: 'beige', name: '베이지', hex: 0xd8c3a0 },
  { id: 'earth', name: '흙빛', hex: 0x9a6b45 }, { id: 'olive', name: '올리브', hex: 0x7f8a4a },
  { id: 'indigo', name: '쪽빛', hex: 0x3f5a8a }, { id: 'purple', name: '자주', hex: 0x6e3f73 },
  { id: 'scarlet', name: '다홍', hex: 0xb8452f }, { id: 'sky', name: '하늘색', hex: 0x8fbcd8 },
];
const HEIGHTS = [{ id: 'small', name: '작게', k: 0.9 }, { id: 'mid', name: '보통', k: 1 }, { id: 'tall', name: '크게', k: 1.1 }];
const BEARDS = [{ id: 'none', name: '없음' }, { id: 'short', name: '짧은 수염' }, { id: 'long', name: '긴 수염' }];

// 천국은 간단하게(빛나는 형체), 지상은 여러 시대를 걸을 사람 모습이라 선택지를 넓게 준다.
export const LOOK = {
  heaven: { color: COLORS.slice(0, 6), hair: HAIRS.slice(0, 3), outfit: OUTFITS.slice(0, 3) },
  earth: {
    skin: SKINS, height: HEIGHTS, aura: COLORS,
    hair: [...HAIRS, { id: 'braid', name: '땋은 머리' }, { id: 'bun', name: '올림머리' }], hairColor: HAIR_COLORS, beard: BEARDS,
    outfit: OUTFITS, outfitColor: CLOTH,
    item: [...ITEMS, { id: 'hood', name: '두건' }, { id: 'lamp', name: '등잔' }, { id: 'scroll', name: '두루마리' }],
  },
};
// 지상 꾸미기는 항목이 많아 탭으로 나눈다.
export const LOOK_TABS = {
  earth: [
    { label: '몸', keys: ['skin', 'height', 'aura'] },
    { label: '머리', keys: ['hair', 'hairColor', 'beard'] },
    { label: '옷', keys: ['outfit', 'outfitColor'] },
    { label: '소품', keys: ['item'] },
  ],
};
export const LOOK_LABELS = {
  color: '빛깔', hair: '머리 모양', outfit: '옷 모양', item: '소품',
  skin: '피부', height: '키', aura: '나를 감싸는 빛', hairColor: '머리색', beard: '수염', outfitColor: '옷 색',
};
export const DEFAULT_LOOK = { color: 'sky', hair: 'short', outfit: 'tunic' };
export const DEFAULT_EARTH = {
  skin: 's2', height: 'mid', aura: 'sky', hair: 'short', hairColor: 'darkbrown', beard: 'none',
  outfit: 'tunic', outfitColor: 'linen', item: 'none',
};

// spec: { ghost?: 0xRRGGBB (반투명 관찰자), skin, hair, hairColor, outfit, outfitColor }
export function makeFigure(spec) {
  const fig = new THREE.Group();
  const rig = new THREE.Group(); // 걷기 흔들림·기울기는 rig에만 준다(fig는 위치와 방향)
  fig.add(rig);
  fig.userData = { rig, phase: 0, yaw: 0 };
  dressFigure(fig, spec);
  return fig;
}

export function dressFigure(fig, spec) {
  const rig = fig.userData.rig;
  rig.clear();
  fig.userData.height = spec.height ?? 1;
  const ghost = spec.ghost;
  // ghost: 천국의 빛나는 형체. aura: 지상의 사람 모습에 은은하게 도는 빛(사람들 눈에는 보이지 않는 존재라는 표시)
  const m = (hex) => {
    if (ghost !== undefined) return mat(new THREE.Color(ghost).lerp(new THREE.Color(hex), 0.25), { emissive: ghost, emissiveIntensity: 0.55, transparent: true, opacity: 0.72 });
    if (spec.aura !== undefined) return mat(hex, { emissive: spec.aura, emissiveIntensity: 0.12 });
    return mat(hex);
  };
  const skin = m(spec.skin ?? PAL.skin);
  const hairM = m(spec.hairColor ?? PAL.hairDark);
  const add = (geo, material, x, y, z, rx = 0) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    rig.add(mesh);
    return mesh;
  };

  add(new THREE.CapsuleGeometry(0.28, 0.5, 3, 8), skin, 0, 0.62, 0);
  add(new THREE.SphereGeometry(0.26, 8, 6), skin, 0, 1.3, 0);
  for (const x of [-0.09, 0.09]) add(new THREE.BoxGeometry(0.05, 0.07, 0.03), m(PAL.eye), x, 1.33, 0.245);

  if (spec.hair && spec.hair !== 'none') {
    add(new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, 0, 1.33, -0.02);
  }
  if (spec.hair === 'long') {
    add(new THREE.BoxGeometry(0.46, 0.8, 0.12), hairM, 0, 1.02, -0.18);
    for (const x of [-0.2, 0.2]) add(new THREE.BoxGeometry(0.11, 0.62, 0.1), hairM, x, 0.98, 0.13);
  }
  if (spec.hair === 'tied') {
    add(new THREE.SphereGeometry(0.11, 6, 5), hairM, 0, 1.38, -0.3);
    add(new THREE.BoxGeometry(0.1, 0.32, 0.1), hairM, 0, 1.16, -0.33);
  }
  if (spec.hair === 'braid') {
    for (let i = 0; i < 4; i++) add(new THREE.IcosahedronGeometry(0.075, 0), hairM, 0, 1.24 - i * 0.13, -0.3 - i * 0.015);
  }
  if (spec.hair === 'bun') add(new THREE.SphereGeometry(0.14, 7, 5), hairM, 0, 1.58, -0.08);
  if (spec.beard === 'short') add(new THREE.BoxGeometry(0.3, 0.12, 0.12), hairM, 0, 1.17, 0.19);
  if (spec.beard === 'long') add(new THREE.BoxGeometry(0.28, 0.32, 0.12), hairM, 0, 1.07, 0.2);
  if (spec.hair === 'curly') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      add(new THREE.IcosahedronGeometry(0.1, 0), hairM, Math.cos(a) * 0.25, 1.42 + (i % 2) * 0.06, Math.sin(a) * 0.25 - 0.04);
    }
  }

  const cloth = m(spec.outfitColor ?? PAL.robe);
  // 망토: 목에서 여며 어깨부터 늘어지고 아래로 갈수록 넓어지는 천(원뿔대의 뒤쪽 절반). 목 앞에 여밈 장식.
  function addCape(material) {
    const back = material.clone();
    back.side = THREE.DoubleSide;
    add(new THREE.CylinderGeometry(0.25, 0.56, 0.98, 10, 1, true, Math.PI / 2, Math.PI), back, 0, 0.6, -0.02);
    add(new THREE.CylinderGeometry(0.27, 0.3, 0.1, 10), material, 0, 1.06, 0); // 목둘레 깃
    add(new THREE.IcosahedronGeometry(0.06, 0), m(PAL.gold), 0, 1.04, 0.27);
  }
  switch (spec.outfit) {
    case 'tunic': add(new THREE.CylinderGeometry(0.31, 0.38, 0.55, 8), cloth, 0, 0.55, 0); break;
    case 'cape':
      add(new THREE.CylinderGeometry(0.31, 0.36, 0.45, 8), cloth, 0, 0.6, 0);
      addCape(cloth);
      break;
    case 'robe': add(new THREE.ConeGeometry(0.46, 1.08, 8), cloth, 0, 0.54, 0); break;
    case 'shepherd':
      add(new THREE.CylinderGeometry(0.31, 0.4, 0.7, 8), cloth, 0, 0.5, 0);
      add(new THREE.TorusGeometry(0.31, 0.045, 4, 10), m(PAL.bark), 0, 0.72, 0, Math.PI / 2);
      break;
    case 'traveler':
      add(new THREE.CylinderGeometry(0.31, 0.38, 0.55, 8), cloth, 0, 0.55, 0);
      addCape(cloth);
      add(new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), cloth, 0, 1.25, -0.12, -0.5);
      break;
    case 'leaves': add(new THREE.CylinderGeometry(0.32, 0.4, 0.3, 8), m(PAL.leafLight), 0, 0.5, 0); break;
    case 'figleaves': add(new THREE.CylinderGeometry(0.33, 0.43, 0.42, 7), m(PAL.fig), 0, 0.48, 0); break;
    case 'skins':
      add(new THREE.CylinderGeometry(0.33, 0.42, 0.78, 7), m(PAL.skins), 0, 0.55, 0);
      add(new THREE.BoxGeometry(0.12, 0.5, 0.06), m(PAL.skins), 0.14, 1.0, 0.2, 0.2);
      break;
    default: break;
  }

  switch (spec.item) {
    case 'staff': add(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 5), m(PAL.bark), 0.42, 0.85, 0.12); break;
    case 'sling': { // 물매(삼상 17:40): 손에서 늘어진 두 줄과 돌을 담는 가죽 주머니
      for (const z of [0.06, 0.18]) add(new THREE.BoxGeometry(0.025, 0.36, 0.025), m(PAL.skins), 0.42, 0.6, z);
      add(new THREE.IcosahedronGeometry(0.08, 0).scale(1, 0.6, 1.2), m(PAL.skins), 0.42, 0.41, 0.12);
      add(new THREE.IcosahedronGeometry(0.045, 0), m(0x9a9488), 0.42, 0.45, 0.12);
      break;
    }
    case 'horn': { // 양각 나팔(수 6:4): 손에 든 굽은 뿔
      const h = add(new THREE.TorusGeometry(0.17, 0.045, 5, 8, Math.PI * 0.85), m(PAL.horn), 0.44, 0.9, 0.12);
      h.rotation.set(0, Math.PI / 2, 0.4);
      add(new THREE.CylinderGeometry(0.075, 0.03, 0.08, 6), m(PAL.horn), 0.44, 1.05, 0.0);
      break;
    }
    case 'oil': { // 기름 뿔병(삼상 16:13): 허리에 찬 작은 뿔병과 금빛 마개
      const o = add(new THREE.ConeGeometry(0.07, 0.3, 6), m(PAL.horn), -0.36, 0.56, 0.12);
      o.rotation.z = Math.PI - 0.3;
      add(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 6), m(PAL.gold), -0.4, 0.71, 0.12);
      add(new THREE.BoxGeometry(0.03, 0.3, 0.03), m(PAL.skins), -0.3, 0.82, 0.12, 0.3);
      break;
    }
    case 'jar': // 물동이(창 24:15): 어깨에 멘 항아리
      add(new THREE.SphereGeometry(0.17, 8, 6), m(PAL.clay), 0.33, 1.13, -0.05);
      add(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 8), m(PAL.clay), 0.36, 1.32, -0.05);
      break;
    case 'bag': // 목자 가방(삼상 17:40)
      add(new THREE.BoxGeometry(0.22, 0.26, 0.12), m(PAL.skins), -0.36, 0.62, 0.05);
      add(new THREE.BoxGeometry(0.05, 0.75, 0.05), m(PAL.skins), -0.05, 0.95, 0.27, 0.15);
      break;
    case 'hood':
      add(new THREE.SphereGeometry(0.31, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), cloth, 0, 1.33, -0.03);
      add(new THREE.BoxGeometry(0.5, 0.45, 0.06), cloth, 0, 1.1, -0.26, 0.1);
      break;
    case 'lamp':
      add(new THREE.BoxGeometry(0.16, 0.1, 0.12), m(PAL.soil), 0.42, 0.78, 0.18);
      add(new THREE.IcosahedronGeometry(0.06, 0), glowMat(PAL.holy, 1), 0.42, 0.88, 0.18);
      break;
    case 'scroll': {
      const roll = add(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6), m(0xf1ead8), 0.38, 0.75, 0.2);
      roll.rotation.z = Math.PI / 2.4;
      break;
    }
    default: break;
  }

  // 지상 모습: 발밑의 빛 고리
  if (spec.aura !== undefined) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.56, 20),
      new THREE.MeshBasicMaterial({ color: spec.aura, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    rig.add(ring);
  }
}

const hexOf = (list, id) => (list.find((x) => x.id === id) ?? list[0]).hex;
export function earthSpec(look) {
  return {
    skin: hexOf(SKINS, look.skin), hair: look.hair, hairColor: hexOf(HAIR_COLORS, look.hairColor), beard: look.beard,
    outfit: look.outfit, outfitColor: hexOf(CLOTH, look.outfitColor), item: look.item,
    height: (HEIGHTS.find((h) => h.id === look.height) ?? HEIGHTS[1]).k, aura: hexOf(COLORS, look.aura),
  };
}

export function lookSpec(look) {
  const color = COLORS.find((c) => c.id === look.color) ?? COLORS[0];
  return { ghost: color.hex, skin: color.hex, hair: look.hair, hairColor: 0xffffff, outfit: look.outfit, outfitColor: 0xffffff, item: look.item };
}

// 걷기: 위아래 흔들림 + 앞으로 기울기 + 좌우 흔들림. 멈춰 있을 때는 숨쉬듯 아주 조금 움직인다.
// ref는 흔들림이 가장 커지는 속도다. 관찰자는 4, 천천히 걷는 아담·하와는 1.3을 넘겨 같은 생동감을 준다.
// 멈춰 있을 때는 숨 쉬며 무게를 좌우로 옮기고, userData.talk(0~1)가 있으면 말하듯 고개를 끄덕이며 들썩인다.
export function animateFigure(fig, speed, dt, t, ref = 4) {
  const u = fig.userData;
  const { rig } = u;
  const s = Math.min(1, speed / ref);
  u.phase += speed * dt * 3.4 * (4 / ref);
  const p = u.phase;
  const idle = 1 - s;
  const talk = u.talk ?? 0;
  if (talk > 0) u.talk = Math.max(0, talk - dt * 0.9);
  rig.position.y = Math.abs(Math.sin(p)) * 0.13 * s + Math.abs(Math.sin(t * 9)) * 0.05 * talk;
  rig.rotation.x = 0.14 * s + Math.sin(t * 7) * 0.06 * talk;
  rig.rotation.z = Math.sin(p) * 0.06 * s + Math.sin(t * 0.9 + (u.seed ??= Math.random() * 6)) * 0.025 * idle;
  const h = u.height ?? 1;
  rig.scale.set(h, h * (1 + Math.sin(t * 2 + u.seed) * 0.015 * idle), h);
}

// 방향을 부드럽게 돌린다(가장 짧은 쪽으로).
export function turnFigure(fig, targetYaw, dt) {
  let d = targetYaw - fig.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  fig.rotation.y += d * Math.min(1, dt * 12);
}

// ---------- 천사: 대천사와 그룹(케루빔)이 같은 모양을 쓴다 ----------
export function makeAngel({ cherub = false } = {}) {
  const g = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 8), mat(PAL.robe));
  robe.position.y = 0.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), mat(PAL.skin));
  head.position.y = 1.4;
  g.add(robe, head);
  if (!cherub) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 4, 12), glowMat(0xffd84a, 0.8));
    halo.position.y = 1.75;
    halo.rotation.x = Math.PI / 2;
    g.add(halo);
  }
  const wingM = glowMat(PAL.cloud, cherub ? 0.6 : 0.2);
  for (const s of [-1, 1]) for (const [y, rz] of cherub ? [[1.25, -0.6], [0.75, -1.1]] : [[1.05, -0.5]]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.6), wingM);
    wing.position.set(s * 0.34, y, -0.25);
    wing.rotation.z = s * rz;
    g.add(wing);
  }
  if (cherub) g.scale.setScalar(1.3);
  return g;
}

// ---------- 나무와 동물: 창조와 에덴이 같은 모양을 쓴다 ----------
// 열매: 에덴 열매 퀘스트에 쓰는 성경의 열매들(src/data/eden.js의 FRUITS). 지름은 0.2 안팎이다.
const FRUIT_LOOK = {
  fig: { color: 0x6b3a5a }, pomegranate: { color: 0xc0303a }, grape: { color: 0x5a2f7a },
  olive: { color: 0x55682a }, date: { color: 0xb5651d },
};
export function makeFruit(kind) {
  const g = new THREE.Group();
  const m = mat(FRUIT_LOOK[kind]?.color ?? PAL.fruit);
  const ball = (r, x, y, z, sx = 1, sy = 1) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0).scale(sx, sy, sx), m);
    b.position.set(x, y, z);
    g.add(b);
  };
  switch (kind) {
    case 'fig': ball(0.1, 0, 0, 0, 0.9, 1.2); break;
    case 'pomegranate': {
      ball(0.11, 0, 0, 0);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 5), m);
      crown.position.y = 0.12;
      g.add(crown);
      break;
    }
    case 'grape': for (const [x, y] of [[-0.05, 0.05], [0.05, 0.05], [0, 0.05], [-0.025, -0.02], [0.025, -0.02], [0, -0.08]]) ball(0.045, x, y, (x * 7) % 0.04); break;
    case 'olive': for (const [x, y] of [[-0.05, 0], [0.04, 0.03], [0, -0.05]]) ball(0.04, x, y, 0, 0.8, 1.2); break;
    case 'date': for (const [x, y] of [[-0.05, 0], [0, 0.02], [0.05, 0], [-0.025, -0.06], [0.025, -0.06]]) ball(0.035, x, y, 0, 0.8, 1.4); break;
    default: ball(0.1, 0, 0, 0);
  }
  return g;
}

// kind: 'pine' | 'round' | 'fruit' | 'life'(생명나무) | 'knowledge'(선악을 알게 하는 나무)
// fruit: 'fruit'일 때 달리는 열매 종류(FRUIT_LOOK). 'date'면 대추야자(종려)라 줄기가 긴 야자나무 모양이다.
export function makeTree(kind = 'round', fruit = null) {
  if (fruit === 'date') return makePalm();
  const g = new THREE.Group();
  const big = kind === 'life' || kind === 'knowledge';
  const k = big ? 1.8 : 1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * k, 0.14 * k, 0.6 * k, 5), mat(PAL.bark));
  trunk.position.y = 0.3 * k;
  g.add(trunk);
  let top;
  if (kind === 'pine') {
    top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.3, 6), mat(PAL.leafDark));
    top.position.y = 1.15;
  } else {
    const leaf = kind === 'life' ? glowMat(0x9fe07a, 0.35) : kind === 'knowledge' ? mat(PAL.leafDark) : mat(PAL.leafLight);
    top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * k, 0), leaf);
    top.position.y = 0.95 * k;
  }
  g.add(top);
  g.userData.fruits = [];
  if (kind === 'fruit' || big) {
    const fruitM = kind === 'life' ? glowMat(PAL.lifeFruit, 0.7) : mat(PAL.fruit);
    const n = big ? 7 : 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const f = fruit ? makeFruit(fruit) : new THREE.Mesh(new THREE.IcosahedronGeometry(0.09 * k, 0), fruitM);
      if (fruit) f.scale.setScalar(1.7);
      f.position.set(Math.cos(a) * 0.5 * k, (0.8 + (i % 2) * 0.25) * k, Math.sin(a) * 0.5 * k);
      g.add(f);
      g.userData.fruits.push(f);
    }
  }
  g.userData.fruitKind = fruit;
  return g;
}

// 대추야자(종려, 신 34:3): 긴 줄기 위에 넓게 퍼진 잎, 잎 아래에 열매송이
function makePalm() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.9, 6), mat(PAL.bark));
  trunk.position.y = 0.95;
  g.add(trunk);
  const leafM = mat(PAL.leafLight);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.y = 1.9;
    pivot.rotation.y = a;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.22), leafM);
    leaf.position.x = 0.4;
    leaf.rotation.z = -0.35;
    pivot.add(leaf);
    g.add(pivot);
  }
  g.userData.fruits = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const f = makeFruit('date');
    f.scale.setScalar(1.9);
    f.position.set(Math.cos(a) * 0.22, 1.72, Math.sin(a) * 0.22);
    g.add(f);
    g.userData.fruits.push(f);
  }
  g.userData.fruitKind = 'date';
  return g;
}

// 바구니: 열매 퀘스트 동안 관찰자 옆구리에 든다. slots에 담긴 열매를 차례로 놓는다.
export function makeBasket() {
  const g = new THREE.Group();
  const m = mat(PAL.wicker);
  m.side = THREE.DoubleSide;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.2, 9, 1, true), m);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.17, 9), m);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 4, 10, Math.PI), m);
  g.add(wall, floor, handle);
  g.userData.slots = [[-0.08, -0.03, 0.06], [0.08, -0.03, 0.05], [0, -0.03, -0.09], [-0.09, 0.03, -0.04], [0.09, 0.03, -0.05]]
    .map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return g;
}

// 나무 판자 다리: 로컬 x 방향으로 건넌다(len은 건너는 길이).
export function makeBridge(len = 2.6, width = 1.2) {
  const g = new THREE.Group();
  const m = mat(PAL.plank);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(len / n - 0.05, 0.08, width), m);
    plank.position.set(-len / 2 + (i + 0.5) * (len / n), 0.1 + Math.sin((i / (n - 1)) * Math.PI) * 0.08, 0);
    g.add(plank);
  }
  for (const z of [-width / 2, width / 2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), mat(PAL.bark));
    rail.position.set(0, 0.42, z);
    g.add(rail);
    for (const x of [-len / 2, 0, len / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), mat(PAL.bark));
      post.position.set(x, 0.22, z);
      g.add(post);
    }
  }
  return g;
}

// 가시덤불(창 3:18): 마른 가지가 사방으로 뻗은 덤불
export function makeThornBush(s = 1) {
  const g = new THREE.Group();
  const m = mat(PAL.thorn);
  for (let i = 0; i < 9; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.7 * s, 4), m);
    const a = (i / 9) * Math.PI * 2;
    spike.position.set(Math.cos(a) * 0.15 * s, 0.3 * s, Math.sin(a) * 0.15 * s);
    spike.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    g.add(spike);
  }
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25 * s, 0), m);
  core.position.y = 0.2 * s;
  g.add(core);
  return g;
}

// 동물: 머리는 +x 쪽이다. kind마다 실루엣 특징을 더해 그 동물로 바로 알아보게 한다(docs/standards/art-3d.md).
// kind: 'lion' | 'sheep' | 'elephant' | 'deer' | 'horse' | 'bear' | 'generic'
// 다리는 엉덩이에 축을 둔 그룹(userData.legs)이라 걸을 때 앞뒤로 흔든다. 나머지는 body 그룹에 모은다.
const ANIMAL_GAIT = { // walk: 걷는 속도, run: 서두를 때 속도
  elephant: { walk: 0.55, run: 1.1 }, sheep: { walk: 0.6, run: 1.4 }, lion: { walk: 0.8, run: 1.8 },
  bear: { walk: 0.65, run: 1.4 }, deer: { walk: 1.0, run: 2.2 }, horse: { walk: 1.0, run: 2.2 }, generic: { walk: 0.7, run: 1.5 },
};
export function makeAnimal(color, s, kind = 'generic') {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const legsOut = [];
  const m = mat(color);
  const dark = mat(new THREE.Color(color).multiplyScalar(0.55));
  const light = mat(new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45));
  const box = (w, h, d, x, y, z, material = m, rz = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, d * s), material);
    b.position.set(x * s, y * s, z * s);
    b.rotation.z = rz;
    body.add(b);
    return b;
  };
  const blob = (geo, x, y, z, material = m) => {
    const b = new THREE.Mesh(geo, material);
    b.position.set(x * s, y * s, z * s);
    body.add(b);
    return b;
  };
  // 순서: (-x,-z), (-x,+z), (+x,-z), (+x,+z). 0·3번과 1·2번이 대각선 짝으로 함께 움직인다.
  const legs = (w, h, xs, zs, material = m) => {
    for (const x of [-xs, xs]) for (const z of [-zs, zs]) {
      const hip = new THREE.Group();
      hip.position.set(x * s, h * s, z * s);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, w * s), material);
      leg.position.y = (-h / 2) * s;
      hip.add(leg);
      g.add(hip);
      legsOut.push(hip);
    }
  };
  switch (kind) {
    case 'deer': { // 가는 다리, 짧은 흰 꼬리, 가지 친 뿔
      legs(0.07, 0.62, 0.28, 0.11);
      box(0.78, 0.36, 0.32, 0, 0.8, 0);
      box(0.15, 0.42, 0.15, 0.4, 1.06, 0, m, -0.45);
      box(0.32, 0.2, 0.19, 0.58, 1.27, 0);
      box(0.12, 0.12, 0.13, 0.76, 1.23, 0, dark);
      box(0.08, 0.13, 0.1, -0.42, 0.9, 0, mat(0xf5f0e6), 0.5);
      const antler = mat(0xe8d9b5);
      for (const z of [-0.07, 0.07]) {
        box(0.035, 0.38, 0.035, 0.52, 1.52, z * 1.6, antler, 0.25);
        box(0.03, 0.2, 0.03, 0.6, 1.58, z * 2.2, antler, -0.7);
        box(0.03, 0.18, 0.03, 0.43, 1.68, z * 2.4, antler, 0.8);
        box(0.08, 0.12, 0.04, 0.5, 1.37, z * 2.6, m, 0.6); // 귀
      }
      break;
    }
    case 'lion': { // 갈기, 꼬리 끝 술
      const mane = mat(0x8a5a2a);
      legs(0.14, 0.45, 0.34, 0.15);
      box(0.95, 0.48, 0.44, 0, 0.68, 0);
      blob(new THREE.IcosahedronGeometry(0.44 * s, 0).scale(0.75, 1, 1.05), 0.5, 0.95, 0, mane);
      box(0.34, 0.34, 0.34, 0.7, 0.93, 0);
      box(0.14, 0.14, 0.2, 0.86, 0.86, 0, light);
      box(0.06, 0.55, 0.06, -0.6, 0.68, 0, m, 0.9);
      box(0.13, 0.13, 0.13, -0.82, 0.55, 0, mane);
      break;
    }
    case 'elephant': { // 큰 귀, 긴 코, 굵은 다리
      legs(0.26, 0.55, 0.32, 0.18);
      box(1.1, 0.72, 0.72, 0, 0.9, 0);
      box(0.44, 0.5, 0.46, 0.7, 1.04, 0);
      const earM = mat(new THREE.Color(color).multiplyScalar(0.78));
      for (const z of [-1, 1]) {
        const ear = box(0.42, 0.66, 0.06, 0.56, 1.06, z * 0.3, earM); // 옆으로 펼친 큰 귀
        ear.rotation.y = z * 0.35;
        box(0.26, 0.05, 0.05, 0.98, 0.8, z * 0.12, mat(0xf3ead8), -0.5);
      }
      box(0.16, 0.72, 0.16, 0.97, 0.62, 0, m, 0.08); // 긴 코
      box(0.2, 0.1, 0.16, 1.02, 0.28, 0, m);
      box(0.05, 0.4, 0.05, -0.58, 0.75, 0, m, 0.4);
      break;
    }
    case 'sheep': { // 둥근 털 덩어리 몸, 작은 머리
      const face = mat(0x3a3330);
      legs(0.07, 0.36, 0.26, 0.13, face);
      blob(new THREE.IcosahedronGeometry(0.46 * s, 1).scale(1.25, 0.9, 1), 0, 0.66, 0);
      box(0.22, 0.24, 0.2, 0.6, 0.78, 0, face);
      for (const z of [-1, 1]) box(0.06, 0.06, 0.14, 0.55, 0.86, z * 0.15, face);
      break;
    }
    case 'horse': { // 긴 목, 갈기, 긴 꼬리
      const hair = mat(0x2e2018);
      legs(0.1, 0.75, 0.36, 0.13);
      box(1.05, 0.44, 0.38, 0, 0.98, 0);
      box(0.2, 0.62, 0.22, 0.56, 1.32, 0, m, -0.5);
      box(0.44, 0.19, 0.19, 0.84, 1.58, 0, m, -0.45);
      box(0.06, 0.62, 0.08, 0.48, 1.42, 0, hair, -0.5);
      box(0.08, 0.66, 0.1, -0.6, 0.78, 0, hair, -0.3);
      for (const z of [-1, 1]) box(0.05, 0.12, 0.05, 0.7, 1.78, z * 0.06, m);
      break;
    }
    case 'bear': { // 둥근 귀, 묵직한 몸
      legs(0.2, 0.4, 0.32, 0.18);
      blob(new THREE.IcosahedronGeometry(0.5 * s, 1).scale(1.15, 0.75, 0.8), 0, 0.72, 0);
      box(0.4, 0.36, 0.38, 0.62, 0.92, 0);
      box(0.15, 0.14, 0.18, 0.86, 0.87, 0, light);
      for (const z of [-1, 1]) blob(new THREE.SphereGeometry(0.08 * s, 6, 5), 0.56, 1.13, z * 0.14);
      break;
    }
    default: {
      legs(0.12, 0.4, 0.35, 0.15);
      box(1, 0.55, 0.45, 0, 0.6, 0);
      box(0.4, 0.4, 0.38, 0.6, 0.9, 0);
    }
  }
  const gait = ANIMAL_GAIT[kind] ?? ANIMAL_GAIT.generic;
  g.userData = { body, legs: legsOut, size: s, kind, walk: gait.walk, run: gait.run, phase: Math.random() * 6, graze: 0 };
  return g;
}

// 동물의 몸짓: speed는 이번 프레임의 실제 이동 속도. 걸을 때는 대각선 짝 다리를 흔들고 몸을 살짝 오르내리며,
// 멈춰 있을 때 grazing이면 몸을 앞으로 숙여 풀을 뜯는다. 큰 동물일수록 걸음이 느리고 보폭이 크다.
export function animateAnimal(an, speed, dt, t, grazing = false) {
  const u = an.userData;
  if (!u.legs) return;
  const k = Math.min(1, speed / u.walk);
  u.phase += (speed / u.size) * dt * 7;
  u.legs.forEach((hip, i) => (hip.rotation.z = Math.sin(u.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 * k));
  u.graze += ((grazing && k < 0.05 ? 1 : 0) - u.graze) * Math.min(1, dt * 2);
  u.body.position.y = Math.abs(Math.sin(u.phase)) * 0.04 * u.size * k + Math.sin(t * 1.6 + u.phase) * 0.006 * u.size;
  u.body.rotation.z = -0.16 * u.graze + Math.sin(t * 3 + u.phase) * 0.03 * u.graze + Math.sin(u.phase * 2) * 0.02 * k;
}

export function makeBird() {
  const g = new THREE.Group();
  const m = mat(0xffffff);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.12), m));
  for (const z of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.35), m);
    wing.position.z = z * 0.2;
    g.add(wing);
  }
  return g;
}

// 뱀: 마디를 이어 붙이고, update에서 물결치게 움직인다.
export function makeSerpent() {
  const g = new THREE.Group();
  const m = mat(0x5f9a3a);
  for (let i = 0; i < 9; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), m);
    seg.position.x = -i * 0.2;
    g.add(seg);
  }
  const head = g.children[0];
  head.scale.set(1.4, 1.2, 1.3);
  for (const z of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), mat(0xffe27a));
    eye.position.set(0.08, 0.06, z);
    head.add(eye);
  }
  g.userData.wiggle = (t) => g.children.forEach((seg, i) => (seg.position.z = Math.sin(t * 4 - i * 0.7) * 0.08 * Math.min(1, i)));
  return g;
}

// ---------- 길 안내: 목표 위의 금빛 표식 + 발밑의 방향 화살표. 모든 장면이 같은 방식을 쓴다 ----------
export function makeWaypoint() {
  const group = new THREE.Group();
  const goldM = glowMat(PAL.gold, 0.7);
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), goldM);
  marker.rotation.x = Math.PI; // 아래를 가리킨다
  // 바닥 표시(고리, 화살표)는 물·지형 위에서도 묻히지 않게 깊이 검사를 끄고 맨 나중에 그린다.
  const ringM = new THREE.MeshBasicMaterial({ color: PAL.gold, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 16), ringM);
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 10;
  const shape = new THREE.Shape([new THREE.Vector2(0, 0.45), new THREE.Vector2(0.32, -0.15), new THREE.Vector2(0, 0), new THREE.Vector2(-0.32, -0.15)]);
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: PAL.gold, side: THREE.DoubleSide, depthTest: false, depthWrite: false }));
  arrow.renderOrder = 11;
  arrow.rotation.x = Math.PI / 2; // 모양의 뾰족한 끝(+y)이 진행 방향(+z)을 향하게 눕힌다
  const arrowPivot = new THREE.Group();
  arrowPivot.add(arrow);
  group.add(marker, ring, arrowPivot);
  group.visible = false;
  let target = null;
  const dir = new THREE.Vector3();
  return {
    group,
    set(pos) { target = pos; group.visible = !!pos; },
    update(t, from) {
      if (!target) return;
      marker.position.set(target.x, (target.y ?? 0) + 2.6 + Math.sin(t * 3) * 0.2, target.z);
      marker.rotation.y = t * 1.5;
      ring.position.set(target.x, 0.12, target.z);
      ring.scale.setScalar(1 + (t % 1.2) * 0.4);
      ringM.opacity = 0.6 * (1 - (t % 1.2) / 1.2);
      dir.subVectors(target, from).setY(0);
      const far = dir.length() > 2.5;
      arrowPivot.visible = far;
      if (far) {
        dir.normalize();
        const reach = 1.1 + (t * 1.2 % 1) * 0.4; // 목표 쪽으로 미끄러지듯 움직인다
        arrowPivot.position.set(from.x + dir.x * reach, 0.15, from.z + dir.z * reach);
        arrowPivot.rotation.y = Math.atan2(dir.x, dir.z);
      }
    },
  };
}

// ---------- 꾸미기 방: 땅에 내려가기 전, 구름 받침대 위에 내 캐릭터만 세워 두는 전용 공간 ----------
export function makeDressingRoom() {
  const group = new THREE.Group();
  group.add(new THREE.HemisphereLight(0xfff8e7, 0xb9a6d8, 1.2));
  const key = new THREE.DirectionalLight(0xfff4dc, 1.3);
  key.position.set(4, 8, 6);
  group.add(key);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.3, 16), mat(PAL.cloudShade));
  pedestal.position.y = -0.15;
  group.add(pedestal);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const c = makeCloud(0.32);
    c.position.set(Math.cos(a) * 1.35, -0.12, Math.sin(a) * 1.35);
    c.rotation.y = -a;
    group.add(c);
  }
  group.visible = false;
  return group;
}

// ---------- 천국 ----------
export function makeHeaven() {
  const group = new THREE.Group();
  group.add(new THREE.HemisphereLight(0xfff8e7, 0xb9a6d8, 1.1));
  const sun = new THREE.DirectionalLight(0xfff4dc, 1.2);
  sun.position.set(5, 10, 3);
  group.add(sun);

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(10, 9, 1, 24), mat(PAL.cloudShade));
  ground.position.y = -0.5;
  group.add(ground);

  // 섬 가장자리의 구름(창조의 구름과 같은 부품)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const c = makeCloud(0.9 + Math.random() * 0.4);
    const r = 10 + Math.random();
    c.position.set(Math.cos(a) * r, -0.1 + Math.random() * 0.4, Math.sin(a) * r);
    c.rotation.y = -a;
    group.add(c);
  }

  // 하나님의 음성: 빛기둥
  const pillar = makeLightPillar();
  pillar.position.set(0, 0, -6);
  group.add(pillar);

  // 빛의 문
  const gatePos = new THREE.Vector3(0, 0, 7);
  const gold = glowMat(PAL.gold, 0.5);
  for (const x of [-1.3, 1.3]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), gold);
    post.position.set(gatePos.x + x, 1.5, gatePos.z);
    group.add(post);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.2, 6, 12, Math.PI), gold);
  arch.position.set(gatePos.x, 3, gatePos.z);
  group.add(arch);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  portal.position.set(gatePos.x, 2, gatePos.z);
  group.add(portal);

  return { group, pillar, pillarPos: new THREE.Vector3(0, 0, -6), gatePos };
}
