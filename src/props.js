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
const ITEMS = [
  { id: 'none', name: '없음' }, { id: 'staff', name: '지팡이' }, { id: 'band', name: '머리띠' },
  { id: 'bag', name: '가방' }, { id: 'scarf', name: '목도리' },
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
  switch (spec.outfit) {
    case 'tunic': add(new THREE.CylinderGeometry(0.31, 0.38, 0.55, 8), cloth, 0, 0.55, 0); break;
    case 'cape':
      add(new THREE.CylinderGeometry(0.31, 0.36, 0.45, 8), cloth, 0, 0.6, 0);
      add(new THREE.BoxGeometry(0.58, 0.9, 0.05), cloth, 0, 0.72, -0.3, 0.12);
      break;
    case 'robe': add(new THREE.ConeGeometry(0.46, 1.08, 8), cloth, 0, 0.54, 0); break;
    case 'shepherd':
      add(new THREE.CylinderGeometry(0.31, 0.4, 0.7, 8), cloth, 0, 0.5, 0);
      add(new THREE.TorusGeometry(0.31, 0.045, 4, 10), m(PAL.bark), 0, 0.72, 0, Math.PI / 2);
      break;
    case 'traveler':
      add(new THREE.CylinderGeometry(0.31, 0.38, 0.55, 8), cloth, 0, 0.55, 0);
      add(new THREE.BoxGeometry(0.58, 0.95, 0.05), cloth, 0, 0.7, -0.3, 0.12);
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
    case 'band': add(new THREE.TorusGeometry(0.27, 0.035, 4, 12), m(PAL.gold), 0, 1.38, 0, Math.PI / 2); break;
    case 'bag':
      add(new THREE.BoxGeometry(0.22, 0.26, 0.12), m(PAL.skins), -0.36, 0.62, 0.05);
      add(new THREE.BoxGeometry(0.05, 0.75, 0.05), m(PAL.skins), -0.05, 0.95, 0.27, 0.15);
      break;
    case 'scarf': add(new THREE.TorusGeometry(0.22, 0.07, 5, 10), m(PAL.fruit), 0, 1.06, 0, Math.PI / 2); break;
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
export function animateFigure(fig, speed, dt, t) {
  const { rig } = fig.userData;
  const s = Math.min(1, speed / 4);
  fig.userData.phase += speed * dt * 3.4;
  const p = fig.userData.phase;
  rig.position.y = Math.abs(Math.sin(p)) * 0.13 * s;
  rig.rotation.x = 0.14 * s;
  rig.rotation.z = Math.sin(p) * 0.06 * s;
  const h = fig.userData.height ?? 1;
  rig.scale.set(h, h * (1 + Math.sin(t * 2) * 0.015 * (1 - s)), h);
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
// kind: 'pine' | 'round' | 'fruit' | 'life'(생명나무) | 'knowledge'(선악을 알게 하는 나무)
export function makeTree(kind = 'round') {
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
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09 * k, 0), fruitM);
      f.position.set(Math.cos(a) * 0.5 * k, (0.8 + (i % 2) * 0.25) * k, Math.sin(a) * 0.5 * k);
      g.add(f);
      g.userData.fruits.push(f);
    }
  }
  return g;
}

export function makeAnimal(color, s) {
  const g = new THREE.Group();
  const m = mat(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1 * s, 0.55 * s, 0.45 * s), m);
  body.position.y = 0.6 * s;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.4 * s, 0.38 * s), m);
  head.position.set(0.6 * s, 0.9 * s, 0);
  g.add(body, head);
  for (const x of [-0.35, 0.35]) for (const z of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.4 * s, 0.12 * s), m);
    leg.position.set(x * s, 0.2 * s, z * s);
    g.add(leg);
  }
  return g;
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
  const ringM = new THREE.MeshBasicMaterial({ color: PAL.gold, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 16), ringM);
  ring.rotation.x = -Math.PI / 2;
  const shape = new THREE.Shape([new THREE.Vector2(0, 0.45), new THREE.Vector2(0.32, -0.15), new THREE.Vector2(0, 0), new THREE.Vector2(-0.32, -0.15)]);
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: PAL.gold, side: THREE.DoubleSide }));
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
      ring.position.set(target.x, 0.05, target.z);
      ring.scale.setScalar(1 + (t % 1.2) * 0.4);
      ringM.opacity = 0.6 * (1 - (t % 1.2) / 1.2);
      dir.subVectors(target, from).setY(0);
      const far = dir.length() > 2.5;
      arrowPivot.visible = far;
      if (far) {
        dir.normalize();
        const reach = 1.1 + (t * 1.2 % 1) * 0.4; // 목표 쪽으로 미끄러지듯 움직인다
        arrowPivot.position.set(from.x + dir.x * reach, 0.06, from.z + dir.z * reach);
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
