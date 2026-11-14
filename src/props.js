// 3D 디자인 시스템: 모든 장면이 이 파일의 색표(PAL)와 부품만 써서 같은 모양을 유지한다.
// 지금은 임시 도형이다. 직접 만든 .glb 모델이 나오면 같은 함수 안에서 모델을 불러오도록 바꾼다.
import * as THREE from 'three';
import { ITEMS as ALL_ITEMS, slotOf } from './data/items.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tween, easeOut } from './anim.js';

// ---------- 색표 ----------
export const PAL = {
  cloud: 0xfdfbff,
  cloudShade: 0xe9e4f5,
  gold: 0xf2cf66,
  goldGlow: 0xc9a24a,
  light: 0xfff2b0,
  holy: 0xffe08a,
  // 2026-11-14 6B: 원색을 걷고 같은 세계의 차분한 빛으로 맞췄다(마른 풀빛, 올리브 잎, 깊은 물빛, 리넨, 토기)
  grass: 0x8f9a5c,
  soil: 0x8b6b45,
  water: 0x4a7896,
  bark: 0x7a5230,
  leafDark: 0x4c6a3e,
  leafLight: 0x86a05a,
  fig: 0x577a44,
  skins: 0x8a5a3a,
  fruit: 0xe8603a,
  lifeFruit: 0xffd25a,
  skin: 0xe8c29c,
  hairDark: 0x4a3426,
  hairBrown: 0x7a4a2a,
  eye: 0x2b2340,
  robe: 0xf3ecdc, // 리넨(새하얗지 않다: 강한 빛에서 하얗게 타지 않게)
  horn: 0xe2d2a8, // 양각 나팔, 기름 뿔병
  clay: 0xb07a55, // 물동이
  wicker: 0xc49a5a, // 바구니
  plank: 0x9a7048, // 다리 판자
  waste: 0x8f7a5a, // 동산 밖 거친 땅
  thorn: 0x5a4632, // 가시덤불
};

// 표면(2026-11-14 새 공용 3D): 같은 색표 안에서 빛을 받는 방식으로 재질을 가른다. 물은 매끈하게 빛나고, 쇠붙이는 반짝임이 맺히고,
// 토기와 살갗은 조금 매끈하고, 잎은 덜 거칠고, 흙·나무껍질·천은 빛을 고르게 흩는다. 모든 물체가 같은 무광으로 보이지 않게 mat()가 색으로 고른다.
const SURFACE = new Map([
  [PAL.water, { roughness: 0.22, metalness: 0.08 }],
  [PAL.gold, { roughness: 0.42, metalness: 0.25 }], [PAL.goldGlow, { roughness: 0.42, metalness: 0.25 }],
  [PAL.clay, { roughness: 0.72 }], [PAL.skin, { roughness: 0.7 }], [PAL.horn, { roughness: 0.6 }],
  [PAL.leafDark, { roughness: 0.82 }], [PAL.leafLight, { roughness: 0.82 }], [PAL.fig, { roughness: 0.84 }], [PAL.grass, { roughness: 0.9 }],
  [0x9a9488, { roughness: 0.86 }], [0xb8b4aa, { roughness: 0.5, metalness: 0.3 }], // 돌, 쇠
]);
export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.95, ...SURFACE.get(color), ...extra });
// 표면의 결(2026-11-14 6B): 흙과 석회암의 타일 텍스처 두 장(public/assets/earth-v1.webp, limestone-v1.webp. 이 게임을 위해 생성한 albedo,
// 출처와 쓰는 곳은 docs/standards/art-3d.md "에셋"). 브라우저에서 한 번만 불러 모든 장면과 미리보기가 함께 쓴다(공유 텍스처라 장면을 떠날 때
// dispose하지 않는다: disposeTree는 도형과 재질만 내린다). Node 점검(document 없음)과 파일이 아직 오지 않은 동안에는 색만으로 그린다.
// 텍스처가 이미 흙빛·돌빛을 담고 있으므로 재질의 색을 그대로 곱하면 탁해진다. 그래서 "원하는 색 ÷ 텍스처의 평균색"을 재질의 색으로 준다
// (결과의 평균이 원하는 색이 된다). 가장자리가 이어지지 않아도 드러나지 않게 거울 반복으로 깐다.
const TILE = { earth: { avg: 0xbea07d }, limestone: { avg: 0xbeb7aa } };
function tiled(name, color, extra = {}) {
  const m = mat(color, extra);
  if (typeof document === 'undefined') return m;
  const t = TILE[name];
  if (!t.tex) {
    t.waiting = [];
    t.tex = new THREE.TextureLoader().load(new URL(`./assets/${name}-v1.webp`, document.baseURI).href, () => { t.ready = true; t.waiting.forEach((fn) => fn()); t.waiting = null; });
    t.tex.colorSpace = THREE.SRGBColorSpace;
    t.tex.wrapS = t.tex.wrapT = THREE.MirroredRepeatWrapping;
    t.tex.anisotropy = 4;
  }
  const apply = () => {
    const a = new THREE.Color(t.avg);
    m.color.setRGB(Math.min(1.6, m.color.r / a.r), Math.min(1.6, m.color.g / a.g), Math.min(1.6, m.color.b / a.b));
    m.map = t.tex;
    m.needsUpdate = true;
  };
  if (t.ready) apply(); else t.waiting.push(apply);
  return m;
}
export const earthMat = (color, extra) => tiled('earth', color, { roughness: 1, ...extra }); // 흙: 땅
export const stoneMat = (color, extra) => tiled('limestone', color, { roughness: 0.9, ...extra }); // 석회암: 우물, 집, 구유, 제단
// 도형의 UV를 k배로 늘려 텍스처가 그만큼 되풀이되게 한다(텍스처는 함께 쓰므로 되풀이 횟수는 도형이 정한다)
export function tileUV(geo, k) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
  return geo;
}
// 땅(2026-11-14 6B): 걸을 수 있는 땅과 그 바깥이 한 장으로 이어진다(둥근 판의 끝이 보이지 않는다). 걷는 범위 안은 평평하고(높이 0),
// 바깥은 멀어질수록 완만하게 솟아 먼 언덕이 된다. 화면 뒤쪽(카메라에서 먼 쪽)이 높고 앞쪽은 낮아 장면을 가리지 않는다.
// 땅빛은 꼭짓점마다 조금씩 달라 넓은 얼룩이 부드럽게 번지고(다각형 조각을 얹지 않는다), 길(paths: [[시작, 끝], ...])과
// 사람이 모이는 자리(clear: [{ x, z, r }, ...])는 밟혀서 밝다. 흙의 결은 타일 텍스처다(earthMat, 타일 하나가 5m).
// 돌려주는 무리의 userData.height(x, z)로 그 자리의 땅 높이를 안다(바깥에 나무나 바위를 세울 때).
export function makeLand({ radius, color, seed = 1, paths = [], clear = [], far = 46 }) {
  const g = new THREE.Group();
  const R1 = radius + 2, R2 = radius + far;
  const s1 = seed * 0.37, s2 = seed * 0.73, s3 = seed * 1.31;
  const noise = (x, z) => Math.sin(x * 0.21 + s1) * Math.sin(z * 0.17 + s2) * 0.5 + Math.sin(x * 0.07 + z * 0.11 + s3) * 0.5; // -1 ~ 1, 부드럽게 변한다
  const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const height = (x, z) => {
    const d = Math.hypot(x, z) - R1;
    if (d <= 0) return 0;
    const back = Math.min(1, Math.max(0, -(x + z) / (radius * 2)));
    return smooth(0, 22, d) * (0.3 + 3.4 * back) * (0.65 + 0.35 * noise(x * 1.7, z * 1.7));
  };
  const toSeg = (x, z, a, b) => { // 점에서 선분까지의 거리
    const dx = b.x - a.x, dz = b.z - a.z, t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
  };
  const tint = (x, z) => {
    let trod = 0;
    for (const [a, b] of paths) trod = Math.max(trod, 1 - smooth(0.4, 1.4, toSeg(x, z, a, b)));
    for (const c of clear) trod = Math.max(trod, 1 - smooth(c.r, c.r + 1.4, Math.hypot(x - c.x, z - c.z)));
    return 1 + 0.07 * noise(x, z) + 0.04 * noise(x * 2.9 + 5, z * 2.9) + 0.1 * trod - 0.14 * smooth(6, 40, Math.hypot(x, z) - R1); // 멀수록 조금 가라앉는다
  };
  const land = earthMat(color, { flatShading: false, vertexColors: true });
  const sheet = (r0, r1, rings) => {
    const geo = new THREE.RingGeometry(r0, r1, 72, rings).rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), k = tint(x, z);
      pos.setY(i, height(x, z));
      col.set([k, k, k * (1 - 0.04 * noise(x * 0.6, z * 0.6))], i * 3); // 밝은 곳은 조금 누렇고 어두운 곳은 조금 붉다
      uv.setXY(i, x / 5, z / 5);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, land));
  };
  sheet(0.001, R1, 30);
  if (far > 2) sheet(R1, R2, 18);
  g.userData.height = height;
  return g;
}
// 옷감의 색: 스테이지와 꾸미기가 주는 색을 자연 염료의 차분한 빛으로 누른다(채도를 낮추고, 아주 어둡거나 아주 밝은 색을 가운데로 모은다).
// 붉은 옷은 벽돌빛으로, 자주는 흐린 자줏빛으로, 짙은 갈색은 덩어리로 뭉개지지 않는 중간 갈색으로, 흰 리넨은 타지 않는 밝기로 간다.
const _hsl = { h: 0, s: 0, l: 0 };
export function dye(hex) {
  const c = new THREE.Color(hex);
  c.getHSL(_hsl);
  return c.setHSL(_hsl.h, _hsl.s * 0.6, 0.18 + _hsl.l * 0.68);
}

// 무리 안의 메시를 재질별로 하나씩 합친다(그리는 횟수를 줄인다). 움직이지 않는 장식 부품에만 쓴다.
export function bake(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const byMat = new Map();
  group.traverse((o) => { if (o.isMesh) { if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push(o); } });
  group.clear();
  for (const [m, list] of byMat) {
    const geos = list.map((o) => {
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      o.geometry.dispose();
      return geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    });
    group.add(new THREE.Mesh(mergeGeometries(geos), m));
  }
  return group;
}

// 장면을 떠날 때 지오메트리·재질을 GPU에서 내린다(scene.remove만으로는 남는다).
export function disposeTree(obj) {
  obj?.traverse((o) => { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose()); });
}
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
// 머리 이름은 실제 머리 모양 이름이다(2026-11-03 사용자 "옆 머리처럼 대충 쓰지 말 것"). id는 저장값이라 바꾸지 않는다.
const HAIR_NAMES = {
  none: '민머리', crop: '짧게 깎음', short: '짧은 머리', side: '옆가르마', fringe: '일자앞머리', curly: '곱슬머리',
  tied: '말총머리', bun: '올림머리', shoulder: '어깨 단발', wavy: '물결 단발', braid: '땋아 내림', twin: '양갈래',
  veil: '머릿수건', long: '긴 생머리', longwave: '긴 물결', locks: '일곱 가닥', crownbraid: '둘러 땋기',
};
const hairs = (ids) => ids.map((id) => ({ id, name: HAIR_NAMES[id] }));
const HAIRS = hairs(['none', 'short', 'long', 'tied', 'curly']);
// 지상 꾸미기 머리: 짧은 머리에서 긴 머리 순(남녀로 나누지 않는다). 상점 머리 셋(data/items.js STYLES)은 맨 뒤에 두고 산 뒤에만 보인다(main.js earthOptions)
const EARTH_HAIRS = hairs(['none', 'crop', 'short', 'side', 'fringe', 'curly', 'tied', 'bun', 'shoulder', 'wavy', 'braid', 'twin', 'veil', 'long', 'longwave', 'locks', 'crownbraid']);
const OUTFITS = [
  { id: 'tunic', name: '겉옷' }, { id: 'cape', name: '망토' }, { id: 'robe', name: '두루마기' },
  { id: 'shepherd', name: '목자 옷' }, { id: 'traveler', name: '나그네 옷' },
  { id: 'girded', name: '띠 띤 옷' }, { id: 'linen', name: '세마포 옷' }, { id: 'coat', name: '채색옷' }, // coat는 상점(F06)
];
// 소품은 성경에 나오는 물건만 쓴다(docs/standards/art-3d.md). 머리띠·목도리는 근거가 약해 뺐다. 목록은 data/items.js.
const NONE = { id: 'none', name: '없음' };
const SKINS = [
  { id: 's1', name: '밝은 피부', hex: 0xf3d3b5 }, { id: 's2', name: '연한 피부', hex: 0xe8c29c },
  { id: 's3', name: '올리브 피부', hex: 0xc99a6e }, { id: 's4', name: '구릿빛 피부', hex: 0xa8754a },
  { id: 's5', name: '갈색 피부', hex: 0x7d5232 }, { id: 's6', name: '짙은 갈색 피부', hex: 0x5a3a22 },
];
const HAIR_COLORS = [
  { id: 'black', name: '검정', hex: 0x231a16 }, { id: 'darkbrown', name: '흑갈색', hex: 0x3e2a1e },
  { id: 'brown', name: '갈색', hex: 0x6b4428 }, { id: 'chestnut', name: '밤색', hex: 0x8a4f2c },
  { id: 'sand', name: '모래색', hex: 0xc9a46a }, { id: 'gray', name: '회색', hex: 0x9a9590 },
  { id: 'auburn', name: '붉은 갈색', hex: 0x7a3a22 }, { id: 'copper', name: '붉은빛', hex: 0xa8532a },
  { id: 'ash', name: '잿빛 금색', hex: 0xb3a58a }, { id: 'white', name: '흰머리', hex: 0xe8e4dc },
];
const CLOTH = [
  { id: 'linen', name: '흰 아마포', hex: 0xf1ead8 }, { id: 'beige', name: '베이지', hex: 0xd8c3a0 },
  { id: 'earth', name: '흙빛', hex: 0x9a6b45 }, { id: 'olive', name: '올리브', hex: 0x7f8a4a },
  { id: 'indigo', name: '쪽빛', hex: 0x3f5a8a }, { id: 'purple', name: '자주', hex: 0x6e3f73 },
  { id: 'scarlet', name: '다홍', hex: 0xb8452f }, { id: 'sky', name: '하늘색', hex: 0x8fbcd8 },
  { id: 'black', name: '먹색', hex: 0x3a3430 }, { id: 'saffron', name: '노랑', hex: 0xd9a63a },
  { id: 'crimson', name: '홍색', hex: 0x8a2a3a },
];
const HEIGHTS = [{ id: 'small', name: '작게', k: 0.9 }, { id: 'mid', name: '보통', k: 1 }, { id: 'tall', name: '크게', k: 1.1 }];
const BEARDS = [{ id: 'none', name: '없음' }, { id: 'short', name: '짧은 수염' }, { id: 'long', name: '긴 수염' }];

// 천국은 간단하게(빛나는 형체), 지상은 여러 시대를 걸을 사람 모습이라 선택지를 넓게 준다.
export const LOOK = {
  heaven: { color: COLORS.slice(0, 6), hair: HAIRS.slice(0, 3), outfit: OUTFITS.slice(0, 3) },
  earth: {
    skin: SKINS, height: HEIGHTS, aura: COLORS,
    hair: EARTH_HAIRS, hairColor: HAIR_COLORS, beard: BEARDS,
    outfit: OUTFITS, outfitColor: CLOTH,
    // 소품 세 자리(손·허리·머리). 목록은 data/items.js의 slot을 따른다(npm run check가 맞춰 본다)
    item: [NONE, ...ALL_ITEMS.filter((i) => slotOf(i) === 'hand').map(({ id, name }) => ({ id, name }))],
    waist: [NONE, ...ALL_ITEMS.filter((i) => slotOf(i) === 'waist').map(({ id, name }) => ({ id, name }))],
    head: [NONE, ...ALL_ITEMS.filter((i) => slotOf(i) === 'head').map(({ id, name }) => ({ id, name }))],
  },
};
// 지상 꾸미기는 항목이 많아 탭으로 나눈다.
export const LOOK_TABS = {
  earth: [
    { label: '몸', keys: ['skin', 'height', 'aura'] },
    { label: '머리', keys: ['hair', 'hairColor', 'beard'] },
    { label: '옷', keys: ['outfit', 'outfitColor'] },
    { label: '소품', keys: ['item', 'waist', 'head'] }, // 가진 소품만 보인다(main.js runDressingRoom). 인벤토리에서도 단다
  ],
};
export const LOOK_LABELS = {
  color: '빛깔', hair: '머리 모양', outfit: '옷 모양', item: '손', waist: '허리', head: '머리',
  skin: '피부', height: '키', aura: '나를 감싸는 빛', hairColor: '머리색', beard: '수염', outfitColor: '옷 색',
};
export const DEFAULT_LOOK = { color: 'sky', hair: 'short', outfit: 'tunic' };
export const DEFAULT_EARTH = {
  skin: 's2', height: 'mid', aura: 'sky', hair: 'short', hairColor: 'darkbrown', beard: 'none',
  outfit: 'tunic', outfitColor: 'linen', item: 'none', waist: 'none', head: 'none',
};

// ---------- 꾸미기 조합 규칙(docs/standards/art-3d.md "꾸미기 조합 규칙") ----------
// 머리 소품: cover(덮어쓰는 것)는 hide에 든 머리 부품을 그리지 않고, 남은 머리카락 반지름에 맞춰 키운다. ring(두르는 것)은 머리카락 바깥에 맞춰 키운다.
// 머리 부품 꼬리표: top(정수리·뒤통수 위로 솟는 것), brow(이마를 덮는 것), back(뒤로 늘어져 두건 밖으로 뚫고 나오는 것)
const HEAD_FIT = {
  hood: { kind: 'cover', hide: ['top', 'brow', 'back'] },
  helmet: { kind: 'cover', hide: ['top', 'brow'] },
  turban: { kind: 'cover', hide: ['top', 'brow'] },
  oakwreath: { kind: 'ring', hide: [] },
  crown: { kind: 'ring', hide: [] },
  goldplate: { kind: 'ring', hide: ['brow'] }, // 이마 앞 금패: 앞머리를 덮는다
};
// 나그네 옷의 두건은 hood와 같은 부품을 숨긴다. 머리에 cover를 쓰거나 머릿수건이면 나그네 두건은 벗는다(그리지 않는다).
const TRAVELER_HIDE = HEAD_FIT.hood.hide;
// 머리카락 바깥 반지름(머리 가운데 y 1.33 기준). cover는 숨긴 뒤 남는 부피, ring은 전체 부피. 소품은 0.28에 맞춰 만들었다.
const HAIR_R = {
  cover: { none: 0.26, crop: 0.27, curly: 0.3, veil: 0.3, wavy: 0.3, longwave: 0.3 },
  ring: { none: 0.26, crop: 0.27, curly: 0.34, crownbraid: 0.335, veil: 0.3, wavy: 0.29, longwave: 0.29 },
};
const hairR = (hair, kind) => HAIR_R[kind][hair] ?? 0.28;
// ---------- 몸(2026-11-14 새 공용 3D, docs/standards/art-3d.md "인물") ----------
// 어른의 비례(일곱 등신에 가깝게, 2026-11-14 6B: 다섯 등신은 머리가 컸다): 머리·목·어깨·몸통·골반·다리·발이 따로 있다.
// 예전 몸(큰 공 머리, 캡슐 몸통, 다리 없음)을 늘인 것이 아니고, 키를 키워 등신을 맞춘 것도 아니다(키는 그대로 1.68).
// 치수는 인물 좌표(발밑이 0, 키 배수 1일 때). 걷기·앉기·절은 이 관절에서 움직인다(animateFigure, poseFigure).
export const BODY = {
  top: 1.68, // 정수리(머리카락 포함)
  neckY: 1.37, shoulderY: 1.36, shoulderX: 0.21, // 팔의 축
  waistY: 1.03, hipY: 0.86, hipX: 0.085, // 다리의 축
  thigh: 0.42, shin: 0.44, // 넓적다리, 정강이와 발
  arm: 0.6, // 어깨에서 손까지
  depth: 0.76, // 몸통의 앞뒤 두께(너비에 대한 비)
};
// 머리의 틀: 머리·눈·머리카락·수염·머리 소품은 예전 좌표(머리 가운데 y 1.33, 반지름 0.26)로 만들고 이 틀이 새 몸의 목 위에 얹는다.
// 그래서 머리 모양 열일곱 가지와 머리 소품, 꾸미기 조합 규칙(HEAD_FIT)이 그대로 맞는다. 긴 머리의 길이도 머리 크기를 따라 줄어든다.
const HEAD_K = 0.43, HEAD_Y = BODY.top - 1.59 * HEAD_K; // 예전 정수리(1.59)가 키에 닿는다. 턱(1.01)은 목 위 1.43에 온다. 머리 높이 0.25(키의 6.7분의 1)
const headPt = (x, y, z) => new THREE.Vector3(x * HEAD_K, HEAD_Y + y * HEAD_K, z * HEAD_K);
// 가슴의 틀: 스테이지가 목·가슴에 거는 것(사슬, 줄)을 예전 좌표(목 아래 y 1.06, 몸통 반지름 0.31)로 달 수 있게 새 가슴에 맞춘다
const CHEST_K = 0.62, CHEST_Y = BODY.neckY - 1.06 * CHEST_K;
// 옷자락: 허리(waistY)에서 hem 높이까지 반지름이 0.17에서 r로 넓어진다. 허리 위는 가슴(0.19). stride는 걸음의 폭(긴 옷은 좁게 걷는다).
const OUTFIT_SHAPE = {
  tunic: { hem: 0.5, r: 0.235, stride: 1 }, traveler: { hem: 0.5, r: 0.235, stride: 1 }, cape: { hem: 0.55, r: 0.225, stride: 1 },
  robe: { hem: 0.08, r: 0.275, stride: 0.55 }, shepherd: { hem: 0.36, r: 0.25, stride: 0.8 }, girded: { hem: 0.44, r: 0.23, stride: 1 },
  linen: { hem: 0.08, r: 0.235, stride: 0.5 }, coat: { hem: 0.08, r: 0.27, stride: 0.55 },
  figleaves: { hem: 0.62, r: 0.23, stride: 1 }, skins: { hem: 0.5, r: 0.24, stride: 1 },
};
// 높이 y에서 옷(또는 몸)의 바깥 반지름(옆 방향). 허리·손 소품이 옷 안에 파묻히지 않게 이 값만큼 밀어낸다.
export function outfitR(outfit, y) {
  const b = OUTFIT_SHAPE[outfit];
  if (y >= BODY.waistY) return 0.19;
  if (!b || y < b.hem) return 0.12; // 옷이 없는 높이는 다리
  return 0.17 + (b.r - 0.17) * (BODY.waistY - y) / (BODY.waistY - b.hem);
}
// 손 소품: grip은 소품을 쥐는 자리(소품을 만든 좌표), hand는 오른손을 뻗는 쪽(예전 어깨에서 본 방향)이다. 소품은 오른손에 붙어 팔과 함께 움직이고,
// 소품의 모양과 grip은 예전 좌표 그대로 두고 새 팔의 손끝에 grip을 맞춘다. ground: 땅을 짚는 지팡이(아래 끝이 발밑에 온다). scale: 새 몸에 맞춘 크기.
// 손에 무엇을 들면 그 팔은 걸을 때 흔들지 않는다(animateFigure). w·drop: 소품 반폭과 쥔 자리 아래로 내려오는 길이. 옷 반지름 + w보다 손이 몸에 가까우면 바깥으로 민다.
// both: 두 팔로 가슴 앞에 안는다(어린양). 두 팔을 다 고정하고 소품은 몸 앞에 둔다.
const LOW = [0.4, 0.55, 0.16], FRONT = [0.4, 0.7, 0.4];
const HOLD = {
  staff: { grip: [0.42, 0.58, 0.12], hand: LOW, ground: true }, jstaff: { grip: [0.42, 0.58, 0.12], hand: LOW, ground: true },
  sling: { grip: [0.42, 0.78, 0.12], hand: LOW, w: 0.08, drop: 0.4 }, horn: { grip: [0.44, 0.86, 0.1], hand: LOW, w: 0.1, drop: 0.1 },
  jar: { grip: [0.39, 1.36, 0.1], hand: [0.5, 1.42, 0.02], scale: 1.3 }, // 어깨 위에 얹고 든 손이 주둥이 곁을 잡는다(물동이가 팔 뒤, 머리 옆에 온다)
  timbrel: { grip: [0.42, 0.66, 0.18], hand: FRONT }, palm: { grip: [0.42, 0.62, 0.12], hand: FRONT },
  olive: { grip: [0.42, 0.66, 0.14], hand: FRONT }, lyre: { grip: [0.42, 0.74, 0.2], hand: FRONT },
  lamp: { grip: [0.42, 0.72, 0.18], hand: FRONT }, scroll: { grip: [0.38, 0.75, 0.2], hand: FRONT },
  basket: { grip: [0.42, 0.86, 0.16], hand: LOW, w: 0.17, drop: 0.32 }, sheaf: { grip: [0.42, 0.8, 0.16], hand: LOW, w: 0.1, drop: 0.25 },
  net: { grip: [0.42, 0.72, 0.14], hand: LOW, w: 0.2, drop: 0.26 }, sickle: { grip: [0.42, 0.62, 0.14], hand: LOW, w: 0.05, drop: 0.12 },
  torch: { grip: [0.42, 0.62, 0.14], hand: FRONT }, dove: { grip: [0.42, 0.53, 0.18], hand: FRONT },
  pomegranate: { grip: [0.42, 0.46, 0.16], hand: FRONT }, censer: { grip: [0.42, 0.89, 0.16], hand: LOW, w: 0.1, drop: 0.4 },
  pipe: { hand: [0.15, 1.0, 0.42] }, // 입에 댄다: 피리는 입과 손 사이에 그린다(grip 없음)
  lamb: { both: true, hand: [0.2, 0.66, 0.44] },
  myrrh: { grip: [0.42, 0.67, 0.18], hand: FRONT }, alabaster: { grip: [0.42, 0.65, 0.18], hand: FRONT },
  pearl: { grip: [0.42, 0.53, 0.18], hand: FRONT }, budrod: { grip: [0.42, 0.58, 0.12], hand: LOW, ground: true },
  menorah: { grip: [0.42, 0.62, 0.16], hand: FRONT }, stars: { grip: [0.42, 0.56, 0.2], hand: FRONT },
};
// 허리 자리지만 몸 가운데에 두르거나 다는 것(옆 허리로 돌리지 않는다)
const WAIST_CENTER = ['belt', 'breastplate'];
const OLD_SHOULDER = new THREE.Vector3(0.33, 0.96, 0); // HOLD의 hand가 기준으로 삼는 예전 어깨
const SHOULDER = new THREE.Vector3(BODY.shoulderX, BODY.shoulderY, 0);
// 오른손을 t(HOLD의 hand, 예전 어깨에서 본 방향) 쪽으로 뻗는 팔 회전 [x, z]과 새 몸에서의 손 자리. 팔은 곧은 한 마디라 그 방향 끝에 손이 온다.
function aimArm(t, out = 1) {
  const n = new THREE.Vector3(...t).sub(OLD_SHOULDER);
  n.x *= out; n.z *= out; // out > 1: 넓은 옷을 비켜 바깥으로
  n.normalize();
  return { rot: [Math.atan2(-n.z, -n.y), Math.asin(n.x)], hand: SHOULDER.clone().addScaledVector(n, BODY.arm) };
}

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
  disposeTree(rig);
  rig.clear();
  fig.userData.height = spec.height ?? 1;
  const ghost = spec.ghost;
  // ghost: 천국의 빛나는 형체. aura: 지상의 사람 모습에 은은하게 도는 빛(사람들 눈에는 보이지 않는 존재라는 표시)
  // 같은 색은 재질 하나를 함께 쓴다(같은 재질끼리 합쳐 그리는 횟수를 줄인다). 표면마다 거칠기가 다르다: 살갗은 조금 매끈하게, 천은 거칠게.
  const mats = new Map();
  // cloth: 옷감(dye로 차분하게 누른다). 원래 색은 material.userData.hex에 남는다(스테이지가 옷 재질을 원래 색으로 찾는다)
  const m = (hex, rough = 0.92, cloth = false) => {
    const key = `${hex}/${rough}/${cloth}`;
    if (!mats.has(key)) {
      const color = cloth && ghost === undefined ? dye(hex) : hex;
      const made = ghost !== undefined ? mat(new THREE.Color(ghost).lerp(new THREE.Color(hex), 0.25), { emissive: ghost, emissiveIntensity: 0.55, transparent: true, opacity: 0.72 })
        : spec.aura !== undefined ? mat(color, { roughness: rough, emissive: spec.aura, emissiveIntensity: 0.12 })
          : mat(color, { roughness: rough });
      made.userData.hex = hex;
      mats.set(key, made);
    }
    return mats.get(key);
  };
  const skin = m(spec.skin ?? PAL.skin, 0.7);
  const hairM = m(spec.hairColor ?? PAL.hairDark, 0.85);
  const cloth = m(spec.outfitColor ?? PAL.robe, 0.97, true); // 리넨: 거칠고 빛을 고르게 흩는다
  // 몸의 무리: upper(허리 위 전부: 몸통·팔·머리·소품, 절할 때 엉덩이에서 굽는다), core(몸통과 옷, 앞뒤로 납작하게),
  // headG(머리의 틀, 예전 머리 좌표), chestG(가슴의 틀, 스테이지가 목걸이·줄을 예전 좌표로 단다). 다리는 rig에 따로 둔다.
  const upper = new THREE.Group(), core = new THREE.Group(), headG = new THREE.Group(), chestG = new THREE.Group();
  core.scale.z = BODY.depth;
  headG.position.y = HEAD_Y;
  headG.scale.setScalar(HEAD_K);
  chestG.position.y = CHEST_Y;
  chestG.scale.setScalar(CHEST_K);
  upper.add(core, headG, chestG);
  rig.add(upper);
  Object.assign(fig.userData, { upper, headG, chestG, held: null });
  let into = headG; // 지금 만드는 부품이 들어갈 무리(머리부터 만든다). 소품은 자리마다 무리에 모아 한꺼번에 옮긴다
  const add = (geo, material, x, y, z, rx = 0) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    into.add(mesh);
    return mesh;
  };
  // 꾸미기 조합 규칙: 머리에 쓴 것(또는 나그네 두건)이 덮는 머리 부품은 그리지 않는다
  const fit = HEAD_FIT[spec.head];
  const travelerHood = spec.outfit === 'traveler' && fit?.kind !== 'cover' && spec.hair !== 'veil';
  const hide = new Set([...(fit?.hide ?? []), ...(travelerHood ? TRAVELER_HIDE : [])]);
  const hp = (tag, geo, x, y, z) => (hide.has(tag) ? null : add(geo, hairM, x, y, z));

  // 머리(예전 머리 좌표): 둥근 머리통 아래에 턱을 이어 얼굴이 길다. 눈은 작고 차분하게(검은 칸으로 보이지 않게 짙은 갈색의 작은 점),
  // 눈 위에 얕은 눈두덩 그늘, 코는 옆모습의 윤곽이다.
  add(new THREE.SphereGeometry(0.26, 12, 9), skin, 0, 1.33, 0);
  add(new THREE.SphereGeometry(0.2, 10, 7).scale(0.94, 0.95, 1), skin, 0, 1.19, 0.035);
  for (const x of [-0.092, 0.092]) add(new THREE.SphereGeometry(0.026, 6, 5).scale(1.15, 1, 0.5), m(PAL.eye, 0.4), x, 1.325, 0.249);
  add(new THREE.BoxGeometry(0.045, 0.1, 0.055), skin, 0, 1.25, 0.26);

  if (spec.hair && spec.hair !== 'none' && spec.hair !== 'veil') {
    // 짧은 머리(crop)는 정수리만 얇게 덮는다
    add(new THREE.SphereGeometry(spec.hair === 'crop' ? 0.27 : 0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI * (spec.hair === 'crop' ? 0.42 : 0.55)), hairM, 0, 1.33, -0.02);
  }
  if (spec.hair === 'long') {
    add(new THREE.BoxGeometry(0.46, 0.8, 0.12), hairM, 0, 1.02, -0.27); // 등 뒤로(새 몸의 등 바깥)
    for (const x of [-0.2, 0.2]) add(new THREE.BoxGeometry(0.11, 0.62, 0.1), hairM, x, 0.98, 0.24); // 가슴 앞으로 넘긴 두 가닥
  }
  if (spec.hair === 'tied') {
    hp('top', new THREE.SphereGeometry(0.11, 6, 5), 0, 1.38, -0.3);
    hp('back', new THREE.BoxGeometry(0.1, 0.32, 0.1), 0, 1.16, -0.33);
  }
  if (spec.hair === 'braid') {
    for (let i = 0; i < 4; i++) hp('back', new THREE.IcosahedronGeometry(0.075, 0), 0, 1.24 - i * 0.13, -0.3 - i * 0.015);
  }
  if (spec.hair === 'bun') hp('top', new THREE.SphereGeometry(0.14, 7, 5), 0, 1.58, -0.08);
  if (spec.hair === 'wavy') { // 물결 머리: 어깨에 닿는 굽은 머리 다발
    add(new THREE.BoxGeometry(0.5, 0.5, 0.12), hairM, 0, 1.15, -0.27);
    for (const x of [-0.24, 0.24]) for (let i = 0; i < 3; i++) add(new THREE.IcosahedronGeometry(0.075, 0), hairM, x + Math.sin(i * 2) * 0.03, 1.22 - i * 0.12, 0.05 + i * 0.1); // 아래 다발일수록 어깨 앞으로
  }
  if (spec.hair === 'twin') for (const x of [-0.26, 0.26]) { // 양갈래: 귀 뒤로 묶어 내린 두 다발
    hp('top', new THREE.SphereGeometry(0.07, 6, 5), x, 1.3, -0.12);
    for (let i = 0; i < 3; i++) add(new THREE.IcosahedronGeometry(0.06, 0), hairM, x * 1.08, 1.16 - i * 0.11, -0.12);
  }
  if (spec.hair === 'veil') { // 머릿수건: 머리를 덮고 등으로 늘어진 천(옷 색)
    add(new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58), cloth, 0, 1.32, -0.02);
    add(new THREE.BoxGeometry(0.5, 0.55, 0.06), cloth, 0, 1.05, -0.29, 0.08);
  }
  // 2026-11-03 F06 머리
  if (spec.hair === 'fringe') hp('brow', new THREE.BoxGeometry(0.4, 0.1, 0.08), 0, 1.47, 0.19);
  if (spec.hair === 'shoulder') {
    add(new THREE.BoxGeometry(0.5, 0.42, 0.12), hairM, 0, 1.18, -0.27);
    for (const x of [-0.22, 0.22]) add(new THREE.BoxGeometry(0.1, 0.36, 0.1), hairM, x, 1.2, 0.1);
  }
  if (spec.hair === 'side') {
    hp('brow', new THREE.BoxGeometry(0.24, 0.12, 0.1), -0.09, 1.47, 0.18);
    hp('brow', new THREE.BoxGeometry(0.1, 0.32, 0.12), -0.24, 1.26, 0.06);
  }
  if (spec.hair === 'locks') for (let i = 0; i < 7; i++) { // 일곱 가닥(삿 16:13): 뒤로 땋아 내린 가는 다발 일곱
    const a = Math.PI * (0.12 + 0.76 * i / 6);
    hp('back', new THREE.CylinderGeometry(0.04, 0.025, 0.6, 5), Math.cos(a) * 0.3, 1.06, -Math.sin(a) * 0.3 - 0.02);
  }
  if (spec.hair === 'longwave') { // 긴 물결(아 4:1): 허리까지 내려오는 머리와 굽이치는 옆 다발
    add(new THREE.BoxGeometry(0.5, 0.95, 0.12), hairM, 0, 0.95, -0.27);
    for (const x of [-0.23, 0.23]) for (let i = 0; i < 5; i++) add(new THREE.IcosahedronGeometry(0.075, 0), hairM, x + Math.sin(i * 1.7) * 0.03, 1.22 - i * 0.14, 0.04 + i * 0.06);
  }
  if (spec.hair === 'crownbraid') for (let i = 0; i < 12; i++) { // 땋은 관(아 7:5): 머리 둘레에 땋아 두른 머리
    const a = (i / 12) * Math.PI * 2;
    hp('top', new THREE.IcosahedronGeometry(0.07, 0), Math.cos(a) * 0.25, 1.47, Math.sin(a) * 0.25 - 0.02);
  }
  // 수염: 턱의 아래 절반을 감싸는 둥근 면(얼굴에 붙은 네모로 보이지 않게). 긴 수염은 그 아래로 가슴 쪽에 늘어진다
  if (spec.beard === 'short' || spec.beard === 'long') add(new THREE.SphereGeometry(0.212, 10, 5, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5).scale(0.96, 0.95, 1.02), hairM, 0, 1.185, 0.04);
  if (spec.beard === 'long') add(new THREE.ConeGeometry(0.12, 0.34, 7), hairM, 0, 0.95, 0.17, Math.PI);
  if (spec.hair === 'curly') {
    add(new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 1.35, -0.05);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      if (Math.sin(a) > 0.75) continue; // 이마 앞은 비워 얼굴이 보이게
      hp('top', new THREE.IcosahedronGeometry(0.08, 0), Math.cos(a) * 0.25, 1.38, Math.sin(a) * 0.25 - 0.04);
    }
    for (const [x, z] of [[0, 0.04], [-0.12, -0.08], [0.12, -0.08], [0, -0.18]]) hp('top', new THREE.IcosahedronGeometry(0.08, 0), x, 1.56, z);
  }

  // ── 몸통과 옷(새 몸의 좌표). core 안에서 앞뒤로 납작해진다 ──
  into = core;
  const leather = m(PAL.bark, 0.8);
  const W = BODY.waistY, S = BODY.shoulderY;
  // 위 반지름 rt(높이 yt)에서 아래 반지름 rb(높이 yb)까지의 통
  const tube = (rt, rb, yt, yb, material, seg = 10, open = false) => add(new THREE.CylinderGeometry(rt, rb, yt - yb, seg, 1, open), material, 0, (yt + yb) / 2, 0);
  // 맨몸: 골반, 허리에서 가슴으로 넓어지는 몸통, 어깨. 옷이 덮는 곳은 만들지 않는다
  const torso = (material, pelvis = true) => {
    if (pelvis) tube(0.15, 0.165, W + 0.02, 0.8, material, 8);
    tube(0.185, 0.15, S, W, material, 8);
    add(new THREE.SphereGeometry(0.185, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.38, 1), material, 0, S, 0);
  };
  add(new THREE.CylinderGeometry(0.046, 0.062, 0.12, 7), skin, 0, S + 0.06, 0); // 목: 어깨에서 턱 밑까지
  const shape = OUTFIT_SHAPE[spec.outfit];
  // 웃옷: 어깨를 덮고 허리로 좁아진다
  const bodice = (material) => {
    tube(0.195, 0.172, S, W - 0.01, material);
    add(new THREE.SphereGeometry(0.195, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.4, 1), material, 0, S, 0);
  };
  // 옷자락: 허리에서 hem까지 넓어지고, 앞에 세로 주름이 두 줄 잡힌다(천이 접힌 자리)
  const skirt = (material) => {
    const { hem, r } = shape;
    tube(0.172, r, W, hem, material, 12);
    for (const x of [-0.06, 0.07]) {
      const fold = add(new THREE.BoxGeometry(0.035, W - hem - 0.04, 0.03), material, x, (W + hem) / 2 - 0.02, (0.172 + r) / 2 + 0.006);
      fold.rotation.x = -Math.atan2(r - 0.172, W - hem);
    }
  };
  // 허리끈: 허리를 두르고 한쪽 끝이 앞으로 늘어진다
  const sash = (r = 0.18, y = W) => {
    add(new THREE.TorusGeometry(r, 0.028, 4, 12), leather, 0, y, 0, Math.PI / 2);
    add(new THREE.BoxGeometry(0.04, 0.2, 0.025), leather, -0.07, y - 0.11, r + 0.02);
  };
  // 겉에 걸친 천: 왼 어깨에서 오른 허리로 비스듬히 두른다(겹쳐 입은 리넨)
  const wrap = (material) => {
    const w = add(new THREE.CylinderGeometry(0.205, 0.2, S - W + 0.14, 10, 1, true, -0.6, Math.PI * 1.25), material, 0, (S + W) / 2 - 0.02, 0);
    w.rotation.z = 0.32;
  };
  // 망토: 목에서 여며 어깨부터 늘어지고 아래로 갈수록 넓어지는 천(원뿔대의 뒤쪽 절반). 목 앞에 여밈 장식.
  function addCape(material) {
    const back = material.clone();
    back.side = THREE.DoubleSide;
    add(new THREE.CylinderGeometry(0.2, 0.34, 0.96, 10, 1, true, Math.PI / 2, Math.PI), back, 0, S + 0.04 - 0.48, -0.02); // 어깨에서 종아리까지
    tube(0.1, 0.205, S + 0.07, S - 0.03, material, 10); // 목둘레 깃
    add(new THREE.IcosahedronGeometry(0.035, 0), m(PAL.gold, 0.45), 0, S + 0.01, 0.2);
  }
  switch (spec.outfit) {
    case 'tunic': bodice(cloth); skirt(cloth); sash(); break; // 무릎까지 오는 속옷과 허리끈
    case 'cape': bodice(cloth); skirt(cloth); addCape(cloth); break;
    case 'robe': bodice(cloth); skirt(cloth); sash(0.182); break; // 두루마기: 어깨에서 발목까지 덮고 아래로 넓어지는 긴 옷, 허리끈
    case 'shepherd': bodice(cloth); skirt(cloth); wrap(cloth); sash(0.186, W + 0.01); break; // 목자: 겉에 한 겹 더 두른다
    case 'traveler':
      bodice(cloth); skirt(cloth); addCape(cloth);
      if (travelerHood) { into = headG; add(new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), cloth, 0, 1.25, -0.12, -0.5); into = core; }
      break;
    case 'girded': { // 띠 띤 옷(왕상 18:46 허리를 동이고): 넓은 허리띠와 어깨에서 허리로 맨 끈
      bodice(cloth); skirt(cloth);
      tube(0.187, 0.187, W + 0.05, W - 0.05, leather, 10);
      const band = add(new THREE.BoxGeometry(0.04, 0.42, 0.03), leather, 0.01, (S + W) / 2, 0.195);
      band.rotation.z = 0.6;
      break;
    }
    case 'linen': // 세마포 옷(출 28:39): 발목까지 곧게 내려오는 옷과 금빛 목깃
      bodice(cloth); skirt(cloth);
      add(new THREE.TorusGeometry(0.105, 0.022, 4, 12), m(PAL.gold, 0.45), 0, S + 0.03, 0, Math.PI / 2);
      break;
    case 'coat': // 채색옷(창 37:3, 상점): 발목까지 오는 옷에 여러 빛깔 띠
      bodice(cloth); skirt(cloth);
      [0xb8452f, 0xe0b040, 0x3f5a8a, 0x6b8a3a, 0x6e3f73].forEach((hex, i) => {
        const y = 0.16 + i * 0.16;
        tube(outfitR('coat', y + 0.03) + 0.006, outfitR('coat', y - 0.03) + 0.006, y + 0.03, y - 0.03, m(hex, 0.97, true), 12, true);
      });
      break;
    case 'figleaves': torso(skin); tube(0.172, shape.r, W, shape.hem, m(PAL.fig, 0.95), 7); break;
    case 'skins': { // 가죽옷(창 3:21): 한쪽 어깨에 걸친 가죽
      const hide = m(PAL.skins, 0.98);
      torso(skin, false);
      tube(0.192, 0.172, S - 0.1, W, hide, 8);
      tube(0.172, shape.r, W, shape.hem, hide, 7);
      const band = add(new THREE.BoxGeometry(0.08, 0.3, 0.04), hide, 0.1, S - 0.02, 0.14);
      band.rotation.z = -0.5;
      break;
    }
    default: torso(skin); break; // 옷이 없으면 맨몸(몸의 세부는 그리지 않는다)
  }

  // 팔: 어깨에 축을 둔 무리(걷기·안기·들기에 따라 돌린다). 위팔·아래팔·손, 옷이 있으면 소매(긴 옷은 손목까지, 짧은 옷은 위팔까지).
  const sleeve = !shape || ['figleaves', 'skins'].includes(spec.outfit) ? 0 : ['robe', 'linen', 'coat'].includes(spec.outfit) ? 0.5 : 0.24;
  fig.userData.arms = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * BODY.shoulderX, BODY.shoulderY, 0);
    arm.rotation.z = side * 0.12;
    const piece = (geo, material, y) => { const p = new THREE.Mesh(geo, material); p.position.y = y; arm.add(p); };
    piece(new THREE.CapsuleGeometry(0.05, 0.2, 2, 6), skin, -0.15);
    piece(new THREE.CapsuleGeometry(0.042, 0.2, 2, 6), skin, -0.43);
    piece(new THREE.IcosahedronGeometry(0.05, 0).scale(0.85, 1.15, 0.7), skin, -BODY.arm);
    if (sleeve) piece(new THREE.CylinderGeometry(0.066, 0.084, sleeve, 7), cloth, -sleeve / 2 - 0.01);
    upper.add(arm);
    return arm;
  });
  // 다리: 엉덩이에 축을 둔 무리 안에 무릎 아래(정강이와 발)의 무리가 있다. 걷기·앉기·무릎 꿇기는 poseFigure가 돌린다.
  fig.userData.stride = shape?.stride ?? 1;
  const sole = m(PAL.skins, 0.9);
  fig.userData.legs = [-1, 1].map((side) => {
    const leg = new THREE.Group(), knee = new THREE.Group();
    leg.position.set(side * BODY.hipX, BODY.hipY, 0);
    knee.position.y = -BODY.thigh;
    const piece = (to, geo, material, y, z = 0) => { const p = new THREE.Mesh(geo, material); p.position.set(0, y, z); to.add(p); };
    piece(leg, new THREE.CapsuleGeometry(0.066, 0.28, 2, 6), skin, -BODY.thigh / 2);
    piece(knee, new THREE.CapsuleGeometry(0.05, 0.28, 2, 6), skin, -0.2);
    piece(knee, new THREE.BoxGeometry(0.085, 0.06, 0.2), skin, -(BODY.shin - 0.045), 0.045); // 발
    piece(knee, new THREE.BoxGeometry(0.095, 0.02, 0.22), sole, -(BODY.shin - 0.01), 0.045); // 신 바닥
    piece(knee, new THREE.BoxGeometry(0.09, 0.02, 0.03), sole, -(BODY.shin - 0.085), 0.03); // 발등을 가로지른 신 끈
    leg.add(knee);
    leg.userData.knee = knee;
    rig.add(leg);
    return leg;
  });

  fig.userData.hold = null;
  const strap = () => { into = core; const st = add(new THREE.BoxGeometry(0.045, 0.52, 0.03), m(PAL.skins, 0.9), 0, (S + W) / 2, 0.2); st.rotation.z = -0.72; }; // 오른 어깨에서 왼 허리로 맨 끈
  for (const [slot, prop] of [['hand', spec.item], ['waist', spec.waist], ['head', spec.head]]) {
  if (!prop || prop === 'none') continue;
  const g = new THREE.Group();
  g.name = prop; // 소품의 이름(스테이지가 손에 든 것이 무엇인지 이 이름으로 안다)
  (slot === 'head' ? headG : upper).add(g); // 머리 소품은 머리의 틀(예전 머리 좌표)에, 나머지는 허리 위 무리에
  into = g;
  switch (prop) {
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
      break;
    }
    case 'jar': // 물동이(창 24:15): 어깨에 멘 항아리
      add(new THREE.SphereGeometry(0.17, 8, 6), m(PAL.clay), 0.33, 1.13, -0.05);
      add(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 8), m(PAL.clay), 0.36, 1.32, -0.05);
      break;
    case 'timbrel': { // 소고(출 15:20): 손에 든 둥근 북, 가죽 면과 테두리의 작은 방울
      const t = add(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 10), m(PAL.skins), 0.42, 0.82, 0.18);
      t.rotation.x = Math.PI / 2;
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; add(new THREE.IcosahedronGeometry(0.03, 0), m(PAL.gold), 0.42 + Math.cos(a) * 0.18, 0.82 + Math.sin(a) * 0.18, 0.18); }
      break;
    }
    case 'palm': { // 종려 가지(요 12:13): 위로 든 긴 줄기와 갈라진 잎
      add(new THREE.CylinderGeometry(0.025, 0.03, 1.1, 5), m(PAL.bark), 0.42, 1.05, 0.12);
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        const leaf = add(new THREE.BoxGeometry(0.28, 0.04, 0.08), m(PAL.leafLight), 0.42 + side * 0.13, 1.35 + i * 0.12, 0.12);
        leaf.rotation.z = side * (0.5 + i * 0.15);
      }
      break;
    }
    case 'lyre': { // 수금(삼상 16:23): 두 팔과 가로대, 줄
      for (const x of [-0.1, 0.1]) { const arm = add(new THREE.BoxGeometry(0.05, 0.42, 0.05), m(PAL.bark), 0.42 + x, 0.95, 0.2); arm.rotation.z = -x * 2; }
      add(new THREE.BoxGeometry(0.3, 0.05, 0.05), m(PAL.bark), 0.42, 1.15, 0.2);
      add(new THREE.BoxGeometry(0.22, 0.1, 0.07), m(PAL.bark), 0.42, 0.76, 0.2);
      for (const x of [-0.05, 0, 0.05]) add(new THREE.BoxGeometry(0.01, 0.34, 0.01), m(PAL.gold), 0.42 + x, 0.96, 0.22);
      break;
    }
    case 'bag': // 목자 가방(삼상 17:40)
      add(new THREE.BoxGeometry(0.22, 0.26, 0.12), m(PAL.skins), -0.36, 0.62, 0.05);
      strap();
      break;
    case 'hood':
      add(new THREE.SphereGeometry(0.31, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), cloth, 0, 1.33, -0.03);
      add(new THREE.BoxGeometry(0.5, 0.45, 0.06), cloth, 0, 1.1, -0.3, 0.04);
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
    // ---- 대표 소품(스테이지를 마치면) ----
    case 'basket': // 열매 바구니(창 2:16): 손에 든 낮은 바구니와 열매
      add(new THREE.CylinderGeometry(0.17, 0.12, 0.14, 8), m(PAL.bark), 0.42, 0.62, 0.16);
      add(new THREE.TorusGeometry(0.15, 0.02, 4, 10, Math.PI), m(PAL.bark), 0.42, 0.69, 0.16);
      for (const [x, z, c] of [[-0.06, 0, PAL.fruit], [0.06, 0.03, 0xf2cf66], [0, -0.05, 0x9a4fd0]]) add(new THREE.IcosahedronGeometry(0.06, 0), m(c), 0.42 + x, 0.72, 0.16 + z);
      break;
    case 'lamb': { // 어린양(창 4:2): 품에 안은 작은 양
      const z = 0.44; // 예전 가슴 앞. 새 몸의 가슴 앞으로는 아래에서 무리째 옮긴다
      add(new THREE.IcosahedronGeometry(0.17, 1).scale(1.25, 0.85, 0.75), m(0xf3efe6), -0.03, 0.74, z);
      add(new THREE.BoxGeometry(0.11, 0.12, 0.12), m(0x3a302a), 0.22, 0.84, z + 0.02);
      for (const x of [-0.07, 0.05]) add(new THREE.BoxGeometry(0.04, 0.12, 0.04), m(0x3a302a), x, 0.6, z + 0.05);
      break;
    }
    case 'olive': // 올리브 가지(창 8:11): 위로 든 가는 가지와 잎
      add(new THREE.CylinderGeometry(0.018, 0.022, 0.6, 5), m(PAL.bark), 0.42, 0.9, 0.14);
      for (let i = 0; i < 5; i++) { const lf = add(new THREE.BoxGeometry(0.12, 0.03, 0.05), m(0x8aa85a), 0.42 + (i % 2 ? 0.06 : -0.06), 0.96 + i * 0.07, 0.14); lf.rotation.z = (i % 2 ? -0.6 : 0.6); }
      break;
    case 'jstaff': // 야곱의 지팡이(창 32:10): 위가 굽은 목자 지팡이
      add(new THREE.CylinderGeometry(0.035, 0.04, 1.6, 5), m(0x6b4428), 0.42, 0.8, 0.12);
      { const hook = add(new THREE.TorusGeometry(0.1, 0.035, 4, 8, Math.PI), m(0x6b4428), 0.52, 1.6, 0.12); hook.rotation.z = 0; }
      break;
    case 'sheaf': // 곡식 단(창 37:7): 끈으로 묶은 이삭 다발
      for (let i = 0; i < 7; i++) { const st = add(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), m(0xd9b54a), 0.42 + (i - 3) * 0.025, 0.85, 0.16); st.rotation.z = (i - 3) * 0.06; }
      add(new THREE.TorusGeometry(0.07, 0.02, 4, 8), m(PAL.bark), 0.42, 0.8, 0.16, Math.PI / 2);
      for (let i = 0; i < 5; i++) add(new THREE.IcosahedronGeometry(0.04, 0), m(0xe6c45a), 0.42 + (i - 2) * 0.04, 1.17, 0.16);
      break;
    case 'oakwreath': // 상수리 잎 관(창 12:6, 각색): 머리에 두른 잎 고리
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const lf = add(new THREE.BoxGeometry(0.1, 0.04, 0.06), m(0x5e8a3a), Math.cos(a) * 0.26, 1.45, Math.sin(a) * 0.26); lf.rotation.y = Math.PI / 2 - a; }
      break;
    case 'nosering': // 금 코걸이(창 24:22): 코 아래 작은 금 고리
      add(new THREE.TorusGeometry(0.035, 0.012, 4, 8), m(PAL.gold, 0.45), 0, 1.2, 0.3); // 코끝 아래
      break;
    case 'waterskin': // 가죽 부대(창 21:14): 어깨끈과 허리의 불룩한 부대
      add(new THREE.IcosahedronGeometry(0.16, 1).scale(0.8, 1, 0.7), m(PAL.skins), -0.36, 0.62, 0.02);
      strap();
      break;
    // ---- 상점 ----
    // ---- 2026-11-03 F05 ----
    case 'net': // 그물(눅 5:4): 손에 든 그물 뭉치와 찌
      add(new THREE.IcosahedronGeometry(0.2, 1).scale(1, 0.7, 0.6), m(0xb59a6a), 0.42, 0.6, 0.14);
      for (const z of [0.02, 0.26]) add(new THREE.IcosahedronGeometry(0.04, 0), m(PAL.gold), 0.42, 0.75, z);
      break;
    case 'sickle': { // 낫(막 4:29): 짧은 자루와 굽은 날
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), m(PAL.bark), 0.42, 0.7, 0.14);
      const b = add(new THREE.TorusGeometry(0.15, 0.025, 4, 10, Math.PI * 1.1), m(0xb8b4aa), 0.42, 0.95, 0.14);
      b.rotation.y = Math.PI / 2;
      break;
    }
    case 'torch': // 횃불 항아리(삿 7:16): 항아리 위로 솟은 횃불
      add(new THREE.SphereGeometry(0.13, 8, 6), m(PAL.clay), 0.42, 0.62, 0.14);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), m(PAL.bark), 0.42, 0.8, 0.14);
      add(new THREE.IcosahedronGeometry(0.08, 0), glowMat(0xffb347, 0.9), 0.42, 0.98, 0.14);
      break;
    case 'dove': { // 비둘기(마 10:16): 손 위에 앉은 흰 비둘기
      add(new THREE.SphereGeometry(0.1, 7, 5).scale(1.3, 0.9, 0.9), m(0xf4f2ee), 0.42, 0.62, 0.18);
      add(new THREE.SphereGeometry(0.065, 6, 5), m(0xf4f2ee), 0.5, 0.72, 0.2);
      const beak = add(new THREE.ConeGeometry(0.02, 0.05, 4), m(PAL.gold), 0.56, 0.72, 0.2);
      beak.rotation.z = -Math.PI / 2;
      break;
    }
    case 'pomegranate': // 석류(출 28:33): 붉은 열매와 꼭지
      add(new THREE.SphereGeometry(0.11, 8, 6), m(0xb8452f), 0.42, 0.55, 0.16);
      add(new THREE.CylinderGeometry(0.04, 0.02, 0.06, 6), m(0x7a2a1e), 0.42, 0.67, 0.16);
      break;
    case 'inkhorn': { // 먹 그릇(겔 9:2): 허리에 찬 작은 통과 붓
      add(new THREE.BoxGeometry(0.1, 0.16, 0.08), m(0x3a3530), -0.36, 0.62, 0.14);
      const pen = add(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 4), m(PAL.bark), -0.36, 0.78, 0.14);
      pen.rotation.z = 0.3;
      break;
    }
    case 'sword': { // 성령의 검(엡 6:17): 허리에 찬 칼집과 금빛 손잡이
      const sh = add(new THREE.BoxGeometry(0.06, 0.62, 0.04), m(PAL.skins), -0.36, 0.42, 0.1);
      sh.rotation.z = -0.35;
      add(new THREE.BoxGeometry(0.18, 0.04, 0.05), m(PAL.gold), -0.27, 0.72, 0.1);
      break;
    }
    case 'helmet': // 구원의 투구(엡 6:17): 머리를 덮는 쇠 투구와 금빛 볏
      add(new THREE.SphereGeometry(0.29, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), m(0xb8b4aa), 0, 1.35, -0.01);
      add(new THREE.BoxGeometry(0.05, 0.12, 0.4), m(PAL.gold), 0, 1.64, -0.02);
      break;
    case 'turban': // 세마포 관(출 28:39): 머리를 감아 두른 흰 천
      for (let i = 0; i < 3; i++) add(new THREE.TorusGeometry(0.25 - i * 0.04, 0.06, 5, 12), m(0xf1ead8), 0, 1.44 + i * 0.07, -0.02, Math.PI / 2);
      break;
    case 'pipe': { // 피리(삼상 10:5): 입에 대는 가는 관
      const mouth = headPt(0.03, 1.17, 0.27), dir = aimArm(HOLD.pipe.hand).hand.sub(mouth).normalize(); // 입(머리의 틀)에서 손까지
      const p = add(new THREE.CylinderGeometry(0.02, 0.024, 0.36, 6), m(0xc9a46a), 0, 0, 0);
      p.position.copy(mouth).addScaledVector(dir, 0.18);
      p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      break;
    }
    case 'belt': { // 금띠(계 1:13): 허리에 두른 금빛 띠(새 몸의 허리, 몸통처럼 앞뒤로 납작하다)
      const b = add(new THREE.TorusGeometry(0.19, 0.034, 4, 14), m(PAL.gold, 0.45), 0, BODY.waistY + 0.02, 0, Math.PI / 2);
      b.scale.y = BODY.depth + 0.03;
      break;
    }
    case 'censer': { // 금 향로(계 8:3): 사슬에 매단 향로와 피어오르는 연기
      add(new THREE.CylinderGeometry(0.1, 0.07, 0.12, 8), m(PAL.gold), 0.42, 0.55, 0.16);
      add(new THREE.BoxGeometry(0.015, 0.3, 0.015), m(PAL.gold), 0.42, 0.74, 0.16);
      add(new THREE.IcosahedronGeometry(0.05, 0), glowMat(0xffffff, 0.5), 0.42, 0.66, 0.16);
      break;
    }
    case 'crown': // 생명의 면류관(계 2:10): 머리 위의 금 관
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10, 1, true), m(PAL.gold), 0, 1.52, 0);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(new THREE.ConeGeometry(0.035, 0.1, 4), m(PAL.gold), Math.cos(a) * 0.24, 1.61, Math.sin(a) * 0.24); }
      break;
    // ---- 2026-11-03 상점(귀한 물건) ----
    case 'myrrh': // 몰약 합(마 2:11): 손바닥 위의 둥근 나무 합과 금 뚜껑
      add(new THREE.CylinderGeometry(0.08, 0.07, 0.12, 8), m(0x6b4428), 0.42, 0.74, 0.18);
      add(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 8), m(PAL.gold), 0.42, 0.815, 0.18);
      add(new THREE.IcosahedronGeometry(0.025, 0), m(PAL.gold), 0.42, 0.85, 0.18);
      break;
    case 'alabaster': // 옥합(막 14:3): 흰 돌로 깎은 목이 긴 향유 병
      add(new THREE.SphereGeometry(0.09, 8, 6).scale(1, 1.15, 1), m(0xf3eee2), 0.42, 0.75, 0.18);
      add(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 6), m(0xf3eee2), 0.42, 0.88, 0.18);
      add(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 6), m(0xd9cfb8), 0.42, 0.95, 0.18);
      break;
    case 'pearl': // 값진 진주(마 13:46): 손바닥 위에서 은은히 빛나는 큰 진주
      add(new THREE.SphereGeometry(0.075, 10, 8), glowMat(0xf6f1ff, 0.35), 0.42, 0.6, 0.18);
      break;
    case 'budrod': // 싹 난 지팡이(민 17:8): 지팡이 위쪽에 잎과 흰 살구꽃, 열매
      add(new THREE.CylinderGeometry(0.035, 0.04, 1.6, 5), m(0x7a5230), 0.42, 0.8, 0.12);
      for (let i = 0; i < 6; i++) {
        const side = i % 2 ? 1 : -1, y = 1.25 + i * 0.08;
        const lf = add(new THREE.BoxGeometry(0.12, 0.03, 0.05), m(0x8aa85a), 0.42 + side * 0.07, y, 0.12);
        lf.rotation.z = side * -0.5;
        add(new THREE.IcosahedronGeometry(0.035, 0), m(i % 3 ? 0xfbf3f0 : 0xd9a46a), 0.42 - side * 0.05, y + 0.04, 0.15);
      }
      break;
    case 'breastplate': { // 판결 흉패(출 28:15): 가슴 앞에 매단 금 판과 네 줄 보석 열두 개
      const z = 0.195 * BODY.depth + 0.014, gold = m(PAL.gold, 0.45); // 새 몸의 가슴 앞
      const y = BODY.shoulderY - 0.15; // 가슴 한가운데
      add(new THREE.BoxGeometry(0.17, 0.19, 0.024), gold, 0, y, z);
      [0xb8452f, 0x3f8a3a, 0x3f5a8a, 0xe0b040, 0x6e3f73, 0xf1ead8, 0x7fd6d0, 0x8a2a3a, 0x2f7d3a, 0xd9a63a, 0x5a3a22, 0x9fd0ff]
        .forEach((hex, i) => add(new THREE.BoxGeometry(0.035, 0.03, 0.016), m(hex, 0.5), (i % 3 - 1) * 0.05, y + 0.068 - Math.floor(i / 3) * 0.045, z + 0.016));
      for (const x of [-0.07, 0.07]) add(new THREE.BoxGeometry(0.016, 0.11, 0.016), gold, x, y + 0.14, z - 0.012);
      break;
    }
    case 'goldplate': // 성결 금패(출 28:36): 이마 앞 순금 패와 머리를 두른 청색 끈
      add(new THREE.TorusGeometry(0.25, 0.015, 4, 14), m(0x3f5a8a), 0, 1.46, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.17, 0.07, 0.025), m(PAL.gold), 0, 1.46, 0.255);
      break;
    case 'menorah': { // 금 등잔대(출 25:31): 가운데 줄기에서 양쪽으로 세 가지씩 굽어 오른 일곱 등잔
      const gm = m(PAL.gold);
      add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), gm, 0.42, 0.82, 0.16);
      add(new THREE.CylinderGeometry(0.07, 0.09, 0.04, 8), gm, 0.42, 0.62, 0.16);
      for (const r of [0.06, 0.11, 0.16]) { const arc = add(new THREE.TorusGeometry(r, 0.012, 4, 10, Math.PI), gm, 0.42, 1.0, 0.16); arc.rotation.z = Math.PI; }
      for (const x of [-0.16, -0.11, -0.06, 0, 0.06, 0.11, 0.16]) add(new THREE.IcosahedronGeometry(0.025, 0), glowMat(0xffb347, 0.9), 0.42 + x, 1.03, 0.16);
      break;
    }
    case 'stars': // 일곱 별(계 1:16): 손 위에 둥글게 떠 있는 일곱 별빛
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; add(new THREE.OctahedronGeometry(0.03, 0), glowMat(0xfff2b0, 1), 0.42 + Math.cos(a) * 0.1, 0.7 + Math.sin(a) * 0.1, 0.2); }
      break;
    default: break;
  }
  into = rig;
  if (slot === 'head' && fit) { // 머리 가운데(0, 1.33, 0)를 중심으로 머리카락 크기에 맞춰 키운다
    const k = hairR(spec.hair, fit.kind) / 0.28;
    g.scale.setScalar(k);
    g.position.y = 1.33 * (1 - k);
  }
  if (slot === 'waist' && !WAIST_CENTER.includes(prop)) {
    // 허리 소품은 예전 좌표(왼쪽 허리 x -0.335, y 0.62)로 만들었다. 왼쪽 옆구리에서 앞 허리로 돌려 걷는 팔과 비키고,
    // 새 몸의 허리 높이와 옷의 바깥(앞뒤로 납작한 몸통이라 비스듬한 쪽은 조금 안쪽)에 맞춰 옮긴다
    const a = 0.6, d = outfitR(spec.outfit, BODY.waistY - 0.08) * 0.92 - 0.335;
    g.rotation.y = a;
    g.position.set(-d * Math.cos(a), BODY.waistY - 0.62, d * Math.sin(a));
  }
  if (slot === 'hand') {
    const h = HOLD[prop] ?? { grip: [0.42, 0.75, 0.15], hand: LOW };
    const k = h.scale ?? 1;
    let aim = aimArm(h.hand);
    // 넓은 옷: 손이 소품 아래 끝 높이의 옷 반지름보다 안쪽이면 팔을 조금씩 바깥으로 벌린다
    if (h.w) for (let out = 1.15; out < 2.6 && Math.hypot(aim.hand.x, aim.hand.z) < outfitR(spec.outfit, aim.hand.y - (h.drop ?? 0)) + h.w + 0.02; out += 0.15) aim = aimArm(h.hand, out);
    const { rot, hand } = aim;
    const [left, right] = fig.userData.arms;
    if (h.both) { // 두 팔로 가슴 앞에 안는다: 소품은 새 몸의 가슴 앞으로 옮기고 몸에 둔다
      fig.userData.hold = [[rot[0], -rot[1]], rot];
      g.position.set(0, BODY.waistY + 0.1 - 0.74, 0.195 * BODY.depth + 0.13 - 0.44);
      left.rotation.set(rot[0], 0, -rot[1]);
      right.rotation.set(rot[0], 0, rot[1]);
    } else {
      fig.userData.hold = [null, rot];
      g.scale.setScalar(k);
      if (h.grip) g.position.copy(hand).sub(new THREE.Vector3(...h.grip).multiplyScalar(k)); // 소품의 쥐는 자리를 손끝에
      if (h.ground) g.position.y = 0; // 지팡이: 아래 끝이 발밑에
      right.rotation.set(rot[0], 0, rot[1]);
      right.attach(g); // 손에 붙여 팔과 함께 움직인다
      fig.userData.held = g; // 손에 든 소품의 무리(스테이지가 물동이의 주둥이 같은 자리를 이 무리의 좌표로 찾는다)
    }
  }
  }
  // 움직이지 않는 부품(머리, 몸통과 옷)은 재질별로 합친다. 팔·다리·손 소품은 따로 움직이므로 합치지 않는다
  bake(headG);
  bake(core);
  poseFigure(fig);

  // 지상 모습: 발밑의 빛 고리
  if (spec.aura !== undefined) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.44, 20),
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
    outfit: look.outfit, outfitColor: hexOf(CLOTH, look.outfitColor), item: look.item, waist: look.waist, head: look.head,
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
  // 어른의 걸음: 몸은 조금만 오르내리고 조금만 숙인다. 다리가 걷고(poseFigure) 팔은 다리와 엇갈려 흔든다. 말할 때는 고개를 끄덕인다.
  rig.position.y = Math.abs(Math.sin(p)) * 0.035 * s + Math.abs(Math.sin(t * 9)) * 0.015 * talk;
  rig.rotation.x = 0.06 * s;
  rig.rotation.z = Math.sin(p) * 0.025 * s + Math.sin(t * 0.9 + (u.seed ??= Math.random() * 6)) * 0.012 * idle;
  if (u.headG) { // 고개: 목을 축으로 끄덕인다(머리의 틀은 원점이 목보다 아래라, 돌린 만큼 자리를 되돌려 목 위에 머물게 한다)
    const a = Math.sin(t * 7) * 0.1 * talk + 0.04 * s, n = BODY.neckY + 0.035 - HEAD_Y;
    u.headG.rotation.x = a;
    u.headG.position.set(0, HEAD_Y + n * (1 - Math.cos(a)), -n * Math.sin(a));
  }
  if (u.armPose) setArms(fig, u.armPose);
  else u.arms?.forEach((arm, i) => { const hold = u.hold?.[i]; if (hold) { arm.rotation.x = hold[0]; arm.rotation.z = hold[1]; return; } arm.rotation.x = Math.sin(p + (i ? Math.PI : 0)) * 0.5 * s + Math.sin(t * 1.2 + i) * 0.03 * idle - 0.3 * talk * (i ? 1 : 0); arm.rotation.z = (i ? 1 : -1) * 0.12; });
  if (u.limp && s > 0) { rig.rotation.z += Math.max(0, Math.sin(p)) * 0.1 * s; rig.position.y -= Math.max(0, Math.sin(p)) * 0.03 * s; } // 저는 걸음: 한쪽 발을 디딜 때마다 그쪽으로 기운다
  const h = u.height ?? 1;
  rig.scale.set(h, h * (1 + Math.sin(t * 2 + u.seed) * 0.006 * idle), h);
  poseFigure(fig, p, s);
}

// 다리와 허리(2026-11-14 새 몸). 스테이지와 장면은 예전처럼 rig만 움직인다: rig.rotation.x로 숙이고, rig.position.y로 낮추고, pose로 자세의 이름을 건다.
// 이 함수가 그 값을 읽어 몸에 옮긴다.
//  - 숙이면 허리 위(upper)만 엉덩이에서 굽고 다리는 제자리에서 땅을 딛는다(몸 전체가 널빤지처럼 기울지 않는다).
//  - 낮추면 무릎이 굽는다. pose가 'sit'이면 넓적다리가 앞으로 나가 앉고, 그 밖에는 무릎을 꿇는다(엎드려 절하기, 주저앉기).
//  - 눕기(pose 'lie')와 깊이 젖힌 몸(1.5 이상)은 굽히지 않고 통째로 눕는다.
//  - phase·s를 주면 걷는다: 다리가 엇갈려 앞뒤로 가고, 앞으로 나가는 다리의 무릎이 굽는다. 긴 옷은 걸음이 좁다(stride).
// 걷거나 선 인물은 animateFigure가 부르고, 자세를 잡은 인물(pose)은 장면의 update가 프레임마다 부른다(field.js, eden.js, cain.js).
export function poseFigure(fig, phase = 0, s = 0) {
  const u = fig.userData, { rig, upper, legs } = u;
  if (!legs) return;
  const lie = u.pose === 'lie', sit = u.pose === 'sit', H = BODY.hipY;
  const x = rig.rotation.x;
  const bend = lie || x < 0 ? 0 : x * Math.min(1, Math.max(0, (1.5 - x) / 0.2)); // 뒤로 젖힐 때(눕고 일어날 때)는 굽히지 않는다
  const c = Math.cos(bend), sn = Math.sin(bend);
  upper.position.set(0, H * c - H, -H * sn); // 엉덩이가 제자리에 남게 허리 위를 되돌려 놓는다
  const drop = lie ? 0 : Math.max(0, -rig.position.y / (rig.scale.y || 1));
  const fold = drop > 0.01 ? Math.acos(Math.max(-0.3, 1 - drop / (sit ? BODY.thigh : BODY.shin))) : 0;
  const amp = 0.5 * (u.stride ?? 1) * s;
  legs.forEach((leg, i) => {
    const ph = phase + (i ? Math.PI : 0);
    leg.position.set((i ? 1 : -1) * BODY.hipX, H * c, -H * sn);
    leg.rotation.x = -bend - (sit ? fold : 0) - Math.sin(ph) * amp;
    leg.userData.knee.rotation.x = fold + Math.max(0, Math.cos(ph)) * 1.3 * amp;
  });
}
// 오른손의 자리(월드 좌표). 장면이 손에 든 물체를 여기에 둔다
export function handOf(fig, out = new THREE.Vector3()) {
  const arm = fig.userData.arms?.[1];
  if (!arm) { fig.updateMatrixWorld(true); return fig.localToWorld(out.set(BODY.shoulderX, 0.8, 0.2)); }
  arm.updateWorldMatrix(true, false);
  return arm.localToWorld(out.set(0, -BODY.arm, 0.03));
}

// 쓰러진다(창 4:8). 휘청이다 무릎이 꺾이고, 무게에 끌려 점점 빨라지며 옆으로 넘어진 뒤 바닥에서 한 번 튄다.
// 치는 동작은 그리지 않는다(quests-and-staging.md "연출"). 끝나면 pose 'lie'로 눕힌 채 둔다.
export async function collapseFigure(fig) {
  const { rig } = fig.userData;
  fig.userData.pose = 'lie';
  const h = fig.userData.height ?? 1;
  rig.scale.setScalar(h);
  // pose가 'lie'라 몸은 굽지 않고 통째로 기운다(poseFigure). 끝에는 옆으로 누워 어깨 너비의 절반(0.2)만큼 땅에서 뜬다
  const settle = () => poseFigure(fig);
  await tween(260, (p) => { rig.rotation.set(-0.3 * Math.sin(p * Math.PI * 0.5), 0, 0.12 * Math.sin(p * Math.PI * 2)); rig.position.y = 0.04 * Math.sin(p * Math.PI); settle(); });
  await tween(380, (p) => { const k = easeOut(p); rig.rotation.set(-0.3 + 0.75 * k, 0, 0.1 * k); rig.position.y = -0.1 * k; settle(); });
  await tween(420, (p) => { const k = p * p; rig.rotation.set(0.45 - 0.45 * k, 0, 0.1 + (Math.PI / 2 - 0.1) * k); rig.position.y = -0.1 + 0.3 * k; settle(); });
  await tween(260, (p) => { rig.rotation.z = Math.PI / 2 - 0.1 * Math.sin(p * Math.PI); rig.position.y = 0.2 + 0.04 * Math.sin(p * Math.PI); settle(); });
}

// 팔 자세. k(0~1)만큼 그 자세로 옮긴다.
// hug: 앞으로 뻗어 상대를 감싼다 / carry: 두 손을 앞으로 모아 든다 / grip: 맞잡고 버틴다(씨름) / raise: 두 팔을 든다(찬송·축복)
const ARM_POSES = { hug: [-1.35, 0.55], carry: [-0.9, 0.25], grip: [-1.15, 0.2], raise: [-2.6, -0.25], down: [0, -0.12] };
export function setArms(fig, pose, k = 1) {
  const [x, z] = ARM_POSES[pose] ?? ARM_POSES.down;
  fig.userData.arms?.forEach((arm, i) => { const side = i ? 1 : -1; arm.rotation.x += (x - arm.rotation.x) * k; arm.rotation.z += (side * (pose === 'down' ? 0.12 : -z) - arm.rotation.z) * k; });
}

// 방향을 부드럽게 돌린다(가장 짧은 쪽으로).
export function turnFigure(fig, targetYaw, dt) {
  let d = targetYaw - fig.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  fig.rotation.y += d * Math.min(1, dt * 12);
}

// ---------- 천사: 대천사와 그룹(케루빔)이 같은 모양을 쓴다 ----------
export function makeAngel({ cherub = false } = {}) {
  // 사람과 같은 어른의 비례(BODY): 발끝까지 내려오는 흰 옷, 어깨, 목, 작은 머리. 얼굴은 그리지 않는다(빛나는 존재). 날개는 어깨 뒤에서 세 겹으로 편다.
  const g = new THREE.Group();
  const robeM = glowMat(PAL.robe, 0.12), body = new THREE.Group();
  body.scale.z = BODY.depth;
  const part = (geo, material, y, to = body) => { const p = new THREE.Mesh(geo, material); p.position.y = y; to.add(p); return p; };
  part(new THREE.CylinderGeometry(0.17, 0.34, BODY.waistY, 10), robeM, BODY.waistY / 2); // 옷자락
  part(new THREE.CylinderGeometry(0.2, 0.17, BODY.shoulderY - BODY.waistY, 10), robeM, (BODY.shoulderY + BODY.waistY) / 2);
  part(new THREE.SphereGeometry(0.2, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.4, 1), robeM, BODY.shoulderY);
  for (const s of [-1, 1]) { const sleeve = part(new THREE.CylinderGeometry(0.06, 0.1, 0.52, 7), robeM, BODY.shoulderY - 0.25); sleeve.position.x = s * 0.235; sleeve.rotation.z = s * 0.14; }
  g.add(bake(body));
  part(new THREE.CylinderGeometry(0.046, 0.062, 0.12, 7), mat(PAL.skin), BODY.shoulderY + 0.06, g);
  part(new THREE.SphereGeometry(0.118, 12, 9).scale(0.95, 1.08, 1), mat(PAL.skin), BODY.top - 0.125, g);
  if (!cherub) {
    const halo = part(new THREE.TorusGeometry(0.12, 0.016, 4, 16), glowMat(0xffd84a, 0.8), BODY.top + 0.1, g);
    halo.rotation.x = Math.PI / 2;
  }
  const wingM = glowMat(PAL.cloud, cherub ? 0.6 : 0.25), wings = new THREE.Group();
  for (const s of [-1, 1]) for (const [y, rz] of cherub ? [[1.3, -0.6], [0.85, -1.1]] : [[1.18, -0.5]]) {
    // 접은 날개(2026-11-14 6B 교정: 부채처럼 편 날개가 곁의 사람을 덮었다): 등 뒤에서 아래로 모은 깃 세 겹. 어깨 너비를 조금만 넘는다
    for (let i = 0; i < 3; i++) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62 - i * 0.12, 0.2), wingM);
      wing.position.set(s * (0.13 + i * 0.075), y - 0.12 - i * 0.04 + (cherub ? 0.1 : 0), -0.17 - i * 0.02);
      wing.rotation.z = s * (cherub ? rz : -0.16 - i * 0.12);
      wings.add(wing);
    }
  }
  g.add(bake(wings));
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
  return bake(g);
}

// kind: 'pine' | 'round' | 'fruit' | 'life'(생명나무) | 'knowledge'(선악을 알게 하는 나무)
// fruit: 'fruit'일 때 달리는 열매 종류(FRUIT_LOOK). 'date'면 대추야자(종려)라 줄기가 긴 야자나무 모양이다.
export function makeTree(kind = 'round', fruit = null) {
  if (fruit === 'date') return makePalm();
  const g = new THREE.Group();
  // 어른 키(1.68)의 사람 곁에 서는 나무: 보통 나무는 사람 키의 한 배 반, 동산 가운데의 두 나무는 그 두 배다.
  // 줄기는 뿌리 쪽이 굵고, 잎은 큰 덩어리 하나에 작은 덩어리 둘을 어긋나게 겹쳐 그늘진 쪽이 생긴다(같은 잎 색의 밝고 어두운 두 톤).
  const big = kind === 'life' || kind === 'knowledge';
  const k = big ? 2.7 : 1.5;
  const wood = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075 * k, 0.13 * k, 0.75 * k, 6), mat(PAL.bark));
  trunk.position.y = 0.375 * k;
  const root = new THREE.Mesh(new THREE.ConeGeometry(0.2 * k, 0.22 * k, 6), mat(PAL.bark));
  root.position.y = 0.11 * k;
  wood.add(trunk, root);
  const crown = new THREE.Group();
  if (kind === 'pine') {
    for (const [r, h, y] of [[0.5, 0.75, 0.95], [0.4, 0.65, 1.35], [0.27, 0.55, 1.75]]) { // 세 단으로 쌓인 가지
      const tier = new THREE.Mesh(new THREE.ConeGeometry(r * k, h * k, 7), mat(PAL.leafDark));
      tier.position.y = y * k;
      crown.add(tier);
    }
  } else {
    const leaf = kind === 'life' ? glowMat(0x9fe07a, 0.35) : kind === 'knowledge' ? mat(PAL.leafDark) : mat(PAL.leafLight);
    const shade = kind === 'life' ? leaf : mat(kind === 'knowledge' ? 0x3c5a34 : 0x6f8a4c, { roughness: 0.82 });
    for (const [r, x, y, z, m] of [[0.55, 0, 1.05, 0, leaf], [0.36, -0.34, 0.86, 0.14, shade], [0.33, 0.3, 0.9, -0.2, shade]]) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r * k, 0).scale(1, 0.86, 1), m);
      blob.position.set(x * k, y * k, z * k);
      crown.add(blob);
    }
  }
  g.add(bake(wood), bake(crown));
  g.userData.fruits = [];
  if (kind === 'fruit' || big) {
    const fruitM = kind === 'life' ? glowMat(PAL.lifeFruit, 0.7) : mat(PAL.fruit);
    const n = big ? 7 : 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const f = fruit ? makeFruit(fruit) : new THREE.Mesh(new THREE.IcosahedronGeometry(big ? 0.16 : 0.1, 0), fruitM);
      if (fruit) f.scale.setScalar(1.7);
      f.position.set(Math.cos(a) * 0.52 * k, (0.82 + (i % 2) * 0.2) * k, Math.sin(a) * 0.52 * k); // 잎 덩어리의 아래 둘레(손이 닿는 높이)
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
  const crown = new THREE.Group();
  g.add(crown);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.y = 1.9;
    pivot.rotation.y = a;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.22), leafM);
    leaf.position.x = 0.4;
    leaf.rotation.z = -0.35;
    pivot.add(leaf);
    crown.add(pivot);
  }
  bake(crown);
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
// kind: 'lion' | 'sheep' | 'ram' | 'elephant' | 'deer' | 'horse' | 'bear' | 'camel' | 'cow' | 'donkey' | 'generic'
// 다리는 엉덩이에 축을 둔 그룹(userData.legs)이라 걸을 때 앞뒤로 흔든다. 나머지는 body 그룹에 모은다.
const ANIMAL_GAIT = { // walk: 걷는 속도, run: 서두를 때 속도
  camel: { walk: 0.7, run: 1.4 }, cow: { walk: 0.55, run: 1.2 }, donkey: { walk: 0.65, run: 1.4 }, ram: { walk: 0.6, run: 1.4 },
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
  // 몸의 덩어리(2026-11-14 6B): 몸통·목·머리·주둥이 같은 굵은 부분은 네모 상자가 아니라 둥근 덩어리(상자에 꽉 차는 타원체)로 만든다.
  // 꼬리·뿔·귀처럼 가는 부분(가장 얇은 변이 0.1보다 작은 것)은 곧은 막대 그대로 둔다. 자리와 크기, 부르는 법은 같다.
  const box = (w, h, d, x, y, z, material = m, rz = 0) => {
    const round = Math.min(w, h, d) >= 0.1;
    const b = new THREE.Mesh(round ? new THREE.IcosahedronGeometry(0.5, 1).scale(w * s * 1.2, h * s * 1.2, d * s * 1.2) : new THREE.BoxGeometry(w * s, h * s, d * s), material);
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
      hip.userData.y = h * s;
      // 다리: 위가 굵고 아래로 가늘어지는 둥근 기둥과 발굽(2026-11-14 6B, 전에는 네모 막대였다)
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.58 * s, w * 0.4 * s, h * s, 6), material);
      leg.position.y = (-h / 2) * s;
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.46 * s, w * 0.5 * s, Math.min(0.08, h * 0.15) * s, 6), dark);
      hoof.position.y = -(h - Math.min(0.04, h * 0.075)) * s;
      hip.add(leg, hoof);
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
    case 'ram': { // 숫양(창 22:13): 양 몸에 둥글게 말린 큰 뿔
      const face = mat(0x3a3330);
      const hornM = mat(PAL.horn);
      legs(0.08, 0.38, 0.26, 0.13, face);
      blob(new THREE.IcosahedronGeometry(0.48 * s, 1).scale(1.25, 0.9, 1), 0, 0.68, 0);
      box(0.24, 0.26, 0.2, 0.62, 0.8, 0, face);
      for (const z of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.TorusGeometry(0.13 * s, 0.05 * s, 4, 8, Math.PI * 1.5), hornM);
        horn.position.set(0.56 * s, 0.9 * s, z * 0.16 * s);
        horn.rotation.y = Math.PI / 2;
        body.add(horn);
      }
      break;
    }
    case 'camel': { // 낙타(창 24:10): 긴 다리, 등의 혹, 앞으로 굽은 긴 목
      // 2026-11-14 6B: 둥근 몸통과 등의 혹, 가슴에서 앞으로 굽어 오르는 긴 목, 긴 얼굴과 주둥이, 귀, 등에 덮은 깔개.
      // 목(neck)과 머리(head)는 이름이 붙은 무리다: 스테이지가 목 뿌리(0.36, 1.04)를 축으로 숙인다(물 마시기).
      legs(0.11, 0.9, 0.36, 0.13);
      blob(new THREE.IcosahedronGeometry(0.5 * s, 1).scale(1.12, 0.5, 0.48), 0, 1.1, 0);
      blob(new THREE.IcosahedronGeometry(0.28 * s, 1).scale(1.05, 0.9, 0.72), -0.06, 1.4, 0, dark);
      blob(new THREE.IcosahedronGeometry(0.24 * s, 1).scale(1, 1.05, 0.85), 0.4, 1.1, 0);
      blob(new THREE.BoxGeometry(0.46 * s, 0.04 * s, 0.5 * s), -0.05, 1.27, 0, mat(0x8a4a3a)); // 깔개(짐을 싣는 짐승)
      const neck = new THREE.Group(), head = new THREE.Group();
      neck.name = 'neck';
      head.name = 'head';
      neck.add(new THREE.Mesh(new THREE.CylinderGeometry(0.075 * s, 0.13 * s, 0.72 * s, 7), m));
      neck.position.set(0.58 * s, 1.36 * s, 0);
      neck.rotation.z = -0.62;
      const face = (geo, x, y, z, material = m) => { const p = new THREE.Mesh(geo, material); p.position.set(x * s, y * s, z * s); head.add(p); };
      face(new THREE.IcosahedronGeometry(0.13 * s, 1).scale(1.25, 0.95, 0.85), 0, 0, 0);
      face(new THREE.BoxGeometry(0.2 * s, 0.11 * s, 0.13 * s), 0.17, -0.04, 0, light);
      for (const z of [-0.07, 0.07]) face(new THREE.ConeGeometry(0.03 * s, 0.09 * s, 4), -0.08, 0.13, z, dark);
      head.position.set(0.86 * s, 1.67 * s, 0);
      body.add(neck, head);
      box(0.04, 0.42, 0.05, -0.57, 0.98, 0, dark, 0.3);
      break;
    }
    case 'cow': { // 소(창 41:2): 넓은 몸, 짧은 뿔, 흰 얼룩
      legs(0.13, 0.5, 0.36, 0.16);
      box(1.1, 0.55, 0.5, 0, 0.82, 0);
      box(0.4, 0.34, 0.34, 0.68, 0.92, 0);
      box(0.4, 0.3, 0.52, -0.1, 0.92, 0, light);
      for (const z of [-1, 1]) box(0.06, 0.16, 0.06, 0.66, 1.16, z * 0.15, mat(PAL.horn), z * 0.4);
      box(0.05, 0.5, 0.05, -0.6, 0.78, 0, m, 0.3);
      break;
    }
    case 'donkey': { // 나귀(창 22:3): 작은 몸, 긴 귀
      legs(0.09, 0.5, 0.3, 0.12);
      box(0.85, 0.4, 0.36, 0, 0.76, 0);
      box(0.18, 0.4, 0.2, 0.46, 0.98, 0, m, -0.5);
      box(0.36, 0.18, 0.18, 0.66, 1.15, 0, m, -0.3);
      for (const z of [-1, 1]) box(0.05, 0.3, 0.06, 0.58, 1.38, z * 0.07, m, z * 0.2);
      box(0.05, 0.4, 0.05, -0.48, 0.7, 0, dark, 0.3);
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
  // 무릎 꿇음: 다리를 몸 아래로 접고 몸을 낮춘다(낙타, 창 24:11)
  if (u.kneel) {
    u.legs.forEach((hip, i) => { hip.rotation.z = (i < 2 ? 1 : -1) * Math.PI / 2; hip.position.y = 0.1 * u.size; });
    u.body.position.y = -u.kneel * u.size + Math.sin(t * 1.6 + u.phase) * 0.006 * u.size;
    return;
  }
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

// ---------- 족장 시대의 소품: 여러 스테이지가 같이 쓴다 ----------
// 장막(창 12:8, 18:1): 기둥 셋에 천을 덮은 낮은 집. 입구는 +x 쪽이다.
export function makeTent(color = 0x6b4a32, s = 1) {
  // 2026-11-14 6B: 염소 털로 짠 넓고 낮은 장막. 용마루에서 양옆으로 천이 늘어지고(가운데가 조금 처진다), 낮은 옆벽, 앞(+x)은 열려 안이 어둡고
  // 한쪽 자락을 걷어 올렸다. 앞뒤의 기둥, 천의 줄무늬 띠, 땅에 박은 말뚝과 당김줄. 사람(키 1.68)이 허리를 조금 숙여 드는 높이(1.9)다.
  // 바닥의 크기(가로 3.9, 세로 3)와 입구의 방향은 전과 같다.
  const g = new THREE.Group();
  const cloth = mat(dye(color), { side: THREE.DoubleSide, roughness: 0.98 }), band = mat(dye(new THREE.Color(color).multiplyScalar(0.62)), { side: THREE.DoubleSide });
  const wood = mat(PAL.bark), cord = mat(0xb59a6a), dark = mat(0x241a14, { side: THREE.DoubleSide });
  const add = (geo, material, x, y, z) => { const m = new THREE.Mesh(geo, material); m.position.set(x * s, y * s, z * s); g.add(m); return m; };
  const L = 1.95, W = 1.5, H = 1.9, EAVE = 0.55; // 용마루의 절반 길이, 처마까지의 폭, 용마루 높이, 처마 높이
  const slope = Math.hypot(W, H - EAVE), tilt = Math.atan2(H - EAVE, W);
  for (const side of [-1, 1]) {
    const roof = add(new THREE.PlaneGeometry(L * 2 * s, slope * s, 4, 3), cloth, 0, (H + EAVE) / 2, side * W / 2); // 지붕 한쪽
    roof.rotation.x = -side * (Math.PI / 2 - tilt); // 위쪽 변이 용마루(가운데 위), 아래쪽 변이 처마(바깥 아래)에 온다
    const pos = roof.geometry.attributes.position; // 가운데가 조금 처진 천(면의 안쪽으로)
    for (let i = 0; i < pos.count; i++) pos.setZ(i, -0.05 * side * s * Math.cos((pos.getX(i) / (L * s)) * Math.PI / 2) * Math.sin(((pos.getY(i) / (slope * s)) + 0.5) * Math.PI));
    roof.geometry.computeVertexNormals();
    const stripe = add(new THREE.PlaneGeometry(L * 2 * s, 0.16 * s), band, 0, EAVE + (H - EAVE) * 0.2, side * W * 0.8); // 처마 가까이의 줄무늬 띠
    stripe.rotation.x = -side * (Math.PI / 2 - tilt);
    stripe.position.y += 0.015 * s;
    add(new THREE.PlaneGeometry(L * 2 * s, EAVE * s), cloth, 0, EAVE / 2, side * W); // 낮은 옆벽
    for (const x of [-L, L]) { // 당김줄과 말뚝
      const rope = add(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 1.05 * s, 4), cord, x * 0.96, EAVE / 2 + 0.02, side * (W + 0.42));
      rope.rotation.x = side * -1.0;
      add(new THREE.CylinderGeometry(0.03 * s, 0.02 * s, 0.22 * s, 5), wood, x * 0.96, 0.08, side * (W + 0.84));
    }
  }
  const back = add(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -W * s), new THREE.Vector3(0, 0, W * s), new THREE.Vector3(0, EAVE * s, W * s), new THREE.Vector3(0, H * s, 0), new THREE.Vector3(0, EAVE * s, -W * s)]), cloth, -L, 0, 0); // 뒤쪽 막음
  back.geometry.setIndex([0, 1, 2, 0, 2, 4, 4, 2, 3]);
  back.geometry.computeVertexNormals();
  const inside = add(back.geometry.clone(), dark, L - 0.25, 0, 0); // 열린 앞: 안쪽의 어둠
  inside.scale.set(1, 0.97, 0.94);
  const flap = add(new THREE.PlaneGeometry(0.75 * s, 1.25 * s), cloth, L, 0.72, W * 0.62); // 걷어 올린 한쪽 자락
  flap.rotation.set(0, Math.PI / 2, 0.22);
  for (const x of [-L, L]) add(new THREE.CylinderGeometry(0.04 * s, 0.05 * s, H * s, 6), wood, x, H / 2, 0); // 앞뒤 기둥
  return g;
}
// 돌 제단(창 8:20, 12:7, 22:9): 쌓은 돌. 위에 나무를 놓을 수 있다(userData.top).
export function makeAltar(s = 1) {
  // 2026-11-14 6B: 다듬지 않은 돌(출 20:25)을 두 단으로 쌓고 위에 넓적한 돌을 얹는다. 아래 단은 넓게 둘러 놓고 위 단은 안쪽으로 들여 쌓는다.
  // 돌은 석회암의 결(stoneMat)이고 밝고 어두운 두 톤이 섞인다. 위에 나무를 놓는 높이(userData.top)는 전과 같다.
  const g = new THREE.Group();
  const stone = stoneMat(0xc2b8a4), shade = stoneMat(0xa89e8a, { roughness: 0.94 });
  const rock = (r, x, y, z, i) => {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(r * s, 0).scale(1.15, 0.78, 1), i % 3 ? stone : shade);
    b.position.set(x * s, y * s, z * s);
    b.rotation.y = i * 1.7;
    g.add(b);
  };
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; rock(0.25, Math.cos(a) * 0.42, 0.17, Math.sin(a) * 0.42, i); } // 아래 단
  rock(0.3, 0, 0.2, 0, 1);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.5; rock(0.21, Math.cos(a) * 0.26, 0.47, Math.sin(a) * 0.26, i + 1); } // 위 단
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * s, 0.46 * s, 0.14 * s, 7), stone); // 위의 넓적한 돌
  slab.position.y = 0.7 * s;
  g.add(slab);
  g.userData.top = new THREE.Vector3(0, 0.85 * s, 0);
  return g;
}
// 우물(창 24:11, 21:19): 둥근 돌 둘레와 물빛
// 2026-11-14 6B: 석회암 덩이를 세 줄로 어긋나게 쌓은 둘레(줄눈이 보인다), 깊고 어두운 안쪽의 물, 두 기둥과 가로대의 나무 틀,
// 가로대에 감긴 줄과 두레박. 사람(키 1.68)의 허리 아래까지 오는 높이다. 둘레의 바깥 반지름은 0.9(스테이지가 0.95로 막는다).
export function makeWell() {
  const g = new THREE.Group();
  const lime = stoneMat(0xd6cab2), limeShade = stoneMat(0xbdb098, { roughness: 0.92 }), wood = mat(PAL.bark), cord = mat(0xb59a6a);
  const add = (geo, material, x, y, z) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); g.add(m); return m; };
  for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) {
    const a = ((i + (row % 2) * 0.5) / 12) * Math.PI * 2;
    const b = add(new THREE.BoxGeometry(0.4, 0.2, 0.25), (i + row * 2) % 3 ? lime : limeShade, Math.cos(a) * 0.775, 0.1 + row * 0.205, Math.sin(a) * 0.775);
    b.rotation.y = -a + Math.PI / 2;
  }
  add(new THREE.CylinderGeometry(0.66, 0.66, 0.6, 14, 1, true), mat(0x4a4338, { side: THREE.BackSide }), 0, 0.31, 0); // 안쪽 벽(그늘)
  const water = add(new THREE.CircleGeometry(0.66, 14), mat(PAL.water), 0, 0.26, 0);
  water.rotation.x = -Math.PI / 2;
  for (const x of [-0.98, 0.98]) add(new THREE.CylinderGeometry(0.055, 0.07, 1.95, 6), wood, x, 0.975, 0); // 두 기둥
  const beam = add(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), wood, 0, 1.9, 0);
  beam.rotation.z = Math.PI / 2;
  const coil = add(new THREE.CylinderGeometry(0.085, 0.085, 0.3, 8), cord, 0.05, 1.9, 0); // 가로대에 감긴 줄
  coil.rotation.z = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 4), cord, 0.05, 1.5, 0); // 늘어진 줄
  add(new THREE.CylinderGeometry(0.15, 0.115, 0.24, 8), wood, 0.05, 1.03, 0); // 두레박
  const hoop = add(new THREE.TorusGeometry(0.15, 0.012, 4, 10), mat(0x4a3a2a), 0.05, 1.12, 0);
  hoop.rotation.x = Math.PI / 2;
  return bake(g);
}
// 흙벽돌과 석회암으로 지은 집(창 24:23 브두엘의 집, 나홀의 성): 돌 기초 위의 벽, 난간이 둘린 평평한 지붕, 나무 문과 상인방, 작은 창,
// 벽 위로 나온 들보 끝, 지붕으로 오르는 바깥 계단. 문은 +x 쪽이다. 사람(키 1.68)이 드나드는 높이다(벽 2.2, 문 1.55).
export function makeHouse(s = 1, color = 0xd9ccb2) {
  const g = new THREE.Group();
  const wall = stoneMat(color, { roughness: 0.94 }), trim = stoneMat(new THREE.Color(color).multiplyScalar(0.84)), wood = mat(PAL.bark), dark = mat(0x3a2e24);
  const add = (w, h, d, material, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * s, h * s, d * s), material); m.position.set(x * s, y * s, z * s); g.add(m); return m; };
  const W = 1.6, H = 2.2, D = 1.4;
  add(W, H, D, wall, 0, H / 2, 0);
  add(W + 0.1, 0.24, D + 0.1, trim, 0, 0.12, 0); // 돌 기초
  for (const [w, d, x, z] of [[W + 0.08, 0.12, 0, D / 2], [W + 0.08, 0.12, 0, -D / 2], [0.12, D + 0.08, W / 2, 0], [0.12, D + 0.08, -W / 2, 0]]) add(w, 0.24, d, trim, x, H + 0.12, z); // 지붕 난간
  add(0.06, 1.55, 0.72, dark, W / 2 + 0.005, 0.775, 0.12); // 문틀 안의 그늘
  add(0.05, 1.46, 0.58, wood, W / 2 + 0.03, 0.73, 0.12); // 나무 문
  add(0.1, 0.13, 0.92, trim, W / 2 + 0.03, 1.62, 0.12); // 상인방
  add(0.05, 0.3, 0.22, dark, W / 2 + 0.005, 1.5, -0.45); // 작은 창
  for (const x of [-0.55, -0.1, 0.35]) { const b = add(0.09, 0.09, 0.2, wood, x, H - 0.22, D / 2 + 0.07); b.rotation.z = Math.PI / 4; } // 들보 끝
  for (let i = 0; i < 6; i++) add(0.27, 0.36 * (i + 1), 0.42, trim, -W / 2 + 0.135 + i * 0.27, 0.18 * (i + 1), D / 2 + 0.21); // 바깥 계단
  return bake(g);
}
// 곡식 자루(창 42:25)
export function makeSack(color = 0xc8b088) {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0).scale(0.9, 1.2, 0.9), mat(color));
  bag.position.y = 0.3;
  const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.14, 5), mat(new THREE.Color(color).multiplyScalar(0.7)));
  tie.position.y = 0.66;
  g.add(bag, tie);
  return g;
}
// 나뭇단(창 22:6 번제 나무, 창 6:14 방주 나무)
export function makeLogs(n = 3, color = PAL.bark) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 5), mat(color));
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0.06 + Math.floor(i / 2) * 0.1, (i % 2 - 0.5) * 0.13);
    g.add(log);
  }
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
    get target() { return target; },
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
  sun.position.set(-4, 9, 8); // 지상 장면과 같은 쪽(화면 왼쪽 앞 위)에서 비춘다
  group.add(sun);

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(10, 9, 1, 24), mat(PAL.cloudShade));
  ground.position.y = -0.5;
  group.add(ground);
  // 구름 바다(2026-11-14 6B): 낮은 시점에서는 섬 너머가 보인다. 섬 아래로 넓게 깔린 구름의 면과, 멀어질수록 큰 구름 덩이가 지평선까지 이어진다
  const seaM = glowMat(PAL.cloud, 0.3);
  const sea = new THREE.Mesh(new THREE.CircleGeometry(90, 40), glowMat(PAL.cloudShade, 0.3));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.3;
  group.add(sea);
  const far = new THREE.Group();
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + (i % 3) * 0.21, r = 15 + ((i * 37) % 23) * 2.4, k = 1.6 + r / 16;
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(k, 1).scale(1.7, 0.42, 1.2), seaM);
    puff.position.set(Math.cos(a) * r, -1.25 + k * 0.2, Math.sin(a) * r);
    puff.rotation.y = a;
    far.add(puff);
  }
  group.add(bake(far));

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

  // 쉼터: 상점 천사(왼쪽)와 기록대(오른쪽). 처음 부르심(프롤로그)에서도 같은 자리에 서 있다.
  const shopPos = new THREE.Vector3(-5, 0, 1.5);
  const shopAngel = makeAngel();
  shopAngel.position.copy(shopPos);
  shopAngel.rotation.y = Math.PI / 3;
  group.add(shopAngel);
  const bookPos = new THREE.Vector3(5, 0, 1.5);
  const lectern = new THREE.Group();
  const wood = mat(PAL.bark);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1, 0.25), wood);
  stand.position.y = 0.5;
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.6), wood);
  top.position.y = 1.05;
  top.rotation.x = -0.35;
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.48), glowMat(PAL.gold, 0.35));
  book.position.y = 1.12;
  book.rotation.x = -0.35;
  lectern.add(stand, top, book);
  lectern.position.copy(bookPos);
  lectern.rotation.y = -Math.PI / 3;
  group.add(lectern);

  return { group, pillar, pillarPos: new THREE.Vector3(0, 0, -6), gatePos, shopPos, bookPos };
}
