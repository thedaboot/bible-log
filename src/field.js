// 1-4부터 쓰는 공용 장면 틀. 가인과 아벨(cain.js)에서 장면마다 같던 부분(땅, 나무, 충돌, 비켜 서기, 인물 이동,
// 형상 없는 빛, 하늘빛 바꾸기, 동물 돌아다니기)을 모았다. 스테이지 파일(src/stages/*.js)은 이 틀 위에 소품과 연출만 더한다.
// 규칙은 docs/standards/art-3d.md(충돌, 겹침), quests-and-staging.md(무대, 비켜 서기, 연출)를 따른다.
import * as THREE from 'three';
import { PAL, mat, makeTree, makeAnimal, animateAnimal, makeFigure, animateFigure, turnFigure, makeLightPillar, makeSpiritLight } from './props.js';
import { tween, easeOut } from './anim.js';

export const V = (x, z) => new THREE.Vector3(x, 0, z);
// 장면 앞(카메라 쪽, +x +z)으로 k만큼 옮긴 점. 무대 중심을 잡을 때 쓴다.
export const toCam = (p, k = 1.4) => p.clone().add(V(k, k));

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// cfg: { seed, radius, ground(색), sky(색), start, stages: { 이름: { c, r } }, trees(개수), treeKinds, keep(나무를 두지 않을 점), light }
export function makeField(cfg) {
  const { seed = 1, radius = 12.5, ground = 0x8fae5a, sky: skyHex = 0xc9e4f2, start = V(6, 6), stages = {}, trees = 14, treeKinds = ['round', 'pine', 'round'], keep = [] } = cfg;
  const rand = seeded(seed);
  const group = new THREE.Group();
  const sky = new THREE.Color(skyHex);
  const hemi = new THREE.HemisphereLight(0xf4f8e0, 0x6b5a3a, 1.1);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.3);
  sun.position.set(-6, 12, 5);
  group.add(hemi, sun);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.5, radius + 2, 2, 20), mat(ground));
  floor.position.y = -1;
  group.add(floor);

  // ---------- 충돌: 원형 장애물 ----------
  const colliders = [];
  const block = (p, r) => colliders.push({ x: p.x, z: p.z, r });
  function collide(p, r = 0.35) {
    let hit = false;
    for (const c of colliders) {
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + r;
      if (d < min) {
        const k = d < 1e-4 ? [1, 0] : [dx / d, dz / d];
        p.x = c.x + k[0] * min;
        p.z = c.z + k[1] * min;
        hit = true;
      }
    }
    return hit;
  }
  // 연출 중 관찰자가 비켜 설 자리 후보(가까운 순): 무대 밖, 설 수 있고, 곧게 걸어 닿는 자리
  function stepAside(name, from, r = 0.35) {
    const st = stages[name];
    if (!st) return [];
    const spots = [];
    for (const k of [0.8, 1.6, 2.4]) for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const p = st.c.clone().add(V(Math.cos(a) * (st.r + k), Math.sin(a) * (st.r + k)));
      if (p.length() > radius - 0.5 || collide(p.clone(), r) || Object.values(stages).some((o) => p.distanceTo(o.c) < o.r)) continue;
      // 인물·동물 곁에는 서지 않는다(연출 중인 사람들 사이에 끼지 않게, 대천사가 설 자리까지 1.6)
      if ([...Object.values(people), ...animals].some((o) => o.visible && o.position.distanceTo(p) < 1.6)) continue;
      const n = Math.ceil(from.distanceTo(p) / 0.25);
      let ok = true;
      for (let j = 1; j <= n && ok; j++) ok = !collide(from.clone().lerp(p, j / n).setY(0), r * 0.8);
      if (ok) spots.push(p);
    }
    return spots.sort((a, b) => a.distanceTo(from) - b.distanceTo(from));
  }

  // 소품을 두고 원형으로 막는다(r 없으면 막지 않는다)
  const put = (obj, p, r = 0, yaw = 0) => {
    obj.position.copy(p);
    obj.rotation.y = yaw;
    group.add(obj);
    if (r) block(p, r);
    keep.push(p.clone());
    return obj;
  };

  // ---------- 인물 ----------
  const people = {};
  const person = (id, spec, p, yaw = Math.PI / 4) => {
    const fig = makeFigure(spec);
    fig.position.copy(p);
    fig.rotation.y = yaw;
    group.add(fig);
    people[id] = fig;
    keep.push(p.clone());
    return fig;
  };

  // ---------- 동물: 자기 터 둘레에서 걷다 서다 한다. route가 있으면 그 길을 따라간다. lead가 있으면 그 뒤를 따른다. ----------
  const animals = [];
  const animal = (kind, color, size, home, extra = {}) => {
    const an = makeAnimal(color, size, kind);
    an.position.copy(home);
    Object.assign(an.userData, { radius: 0.45 * size, home: home.clone(), yaw: rand() * Math.PI * 2, speed: 0, dest: null, wait: rand() * 3, route: null, lead: null, roam: 2.2, ...extra });
    group.add(an);
    animals.push(an);
    return an;
  };

  // ---------- 하나님의 임재(형상 없는 빛)와 빛기둥 ----------
  const presenceLight = makeSpiritLight();
  presenceLight.visible = false;
  const pillar = makeLightPillar(0.8, 20);
  pillar.visible = false;
  group.add(presenceLight, pillar);

  // ---------- 인물 이동: walkTo(fig, 목표) → 도착하면 끝나는 Promise. 막혀서 1.5초 넘게 못 가면 목표에 둔다. ----------
  const movers = new Map();
  const tmp = new THREE.Vector3();
  function walkTo(fig, to, speed = 1.6) {
    fig.userData.faceYaw = undefined;
    return new Promise((resolve) => movers.set(fig, { to: to.clone().setY(0), speed, resolve, best: Infinity, stuck: 0 }));
  }
  const face = (fig, p) => { fig.userData.faceYaw = Math.atan2(p.x - fig.position.x, p.z - fig.position.z); };
  const handOf = (fig) => { fig.updateMatrixWorld(true); return fig.localToWorld(new THREE.Vector3(0.36, 0.8, 0.22)); };
  const carried = new Map(); // 물체 → 드는 인물
  let stage = null;
  const updaters = [];

  const acts = {
    stage: (name) => (stage = name ? stages[name] : null),
    speak: (who) => { if (people[who]) people[who].userData.talk = 1; },
    walkTo,
    face,
    // 인물이 물체를 손에 든다(fig가 null이면 내려놓는다)
    carry: (obj, fig) => { if (fig) carried.set(obj, fig); else carried.delete(obj); },
    // 형상 없는 빛이 인물(또는 점) 곁 화면 오른쪽 위에 머문다. 처음에는 위에서 내려온다.
    presence: async (near, ms = 1600) => {
      if (!near) { presenceLight.visible = false; return; }
      const at = near.position ?? near;
      const to = at.clone().add(new THREE.Vector3(0.9, 1.3, -0.9));
      const from = presenceLight.visible ? presenceLight.position.clone() : to.clone().add(new THREE.Vector3(0, 4, 0));
      presenceLight.visible = true;
      await tween(ms, (p) => presenceLight.position.lerpVectors(from, to, easeOut(p)));
    },
    pillar: async (p) => {
      if (!p) { pillar.visible = false; return; }
      pillar.position.copy(p).setY(0);
      pillar.visible = true;
      await tween(1400, (k) => pillar.scale.set(Math.max(0.01, easeOut(k)), 1, Math.max(0.01, easeOut(k))));
    },
    // 하늘빛: to(색), dim(0 밝음 ~ 1 어둠), warm(노을빛 섞기)
    sky: (to, dim = 0, warm = 0, ms = 1800) => {
      const from = cfg.scene.background.clone(), target = new THREE.Color(to);
      const h0 = hemi.intensity, s0 = sun.intensity;
      return tween(ms, (p) => {
        cfg.scene.background.lerpColors(from, target, p);
        hemi.intensity = h0 + (1.1 - 0.6 * dim - h0) * p;
        sun.intensity = s0 + (1.3 - 1.0 * dim - s0) * p;
        sun.color.setHex(0xfff1d0).lerp(new THREE.Color(0xff9a5a), warm * p);
      });
    },
    day: () => acts.sky(sky, 0, 0),
    dusk: () => acts.sky(0xe8a878, 0.4, 1),
    night: () => acts.sky(0x1c2340, 0.75, 0),
    // 고개를 숙이거나(엎드림 0.6, 절 0.35) 바로 선다(0)
    bow: (fig, k = 0.35, ms = 600) => {
      fig.userData.pose = k ? 'bow' : null;
      const { rig } = fig.userData;
      const from = rig.rotation.x;
      return tween(ms, (p) => (rig.rotation.x = from + (k - from) * easeOut(p)));
    },
    // 눕는다(잠, 창 28:11). up이면 일어난다.
    lie: (fig, up = false) => {
      fig.userData.pose = up ? null : 'lie';
      const { rig } = fig.userData;
      return tween(900, (p) => { const k = up ? 1 - easeOut(p) : easeOut(p); rig.rotation.set(-Math.PI / 2 * k, 0, 0); rig.position.y = 0.3 * k; });
    },
    wait: (ms) => tween(ms, () => {}),
  };

  const inStage = (p, pad = 0) => stage && p.distanceTo(stage.c) < stage.r + pad;
  function stepToward(obj, to, speed, dt, r) {
    tmp.subVectors(to, obj.position).setY(0);
    const d = tmp.length();
    if (d < 0.05) return d;
    obj.position.addScaledVector(tmp.normalize(), Math.min(d, speed * dt));
    collide(obj.position, r);
    return d;
  }
  function animalStep(an, dest, speed, dt) {
    const u = an.userData;
    const want = Math.atan2(dest.z - an.position.z, dest.x - an.position.x);
    const turn = Math.atan2(Math.sin(want - u.yaw), Math.cos(want - u.yaw));
    u.yaw += Math.max(-2.2 * dt, Math.min(2.2 * dt, turn));
    u.speed += (speed * Math.max(0.2, Math.cos(Math.min(Math.abs(turn), Math.PI / 2))) - u.speed) * Math.min(1, dt * 2.5);
    an.position.x += Math.cos(u.yaw) * u.speed * dt;
    an.position.z += Math.sin(u.yaw) * u.speed * dt;
    collide(an.position, u.radius);
    return an.position.distanceTo(dest) < 0.35;
  }

  function update(dt, t, playerPos = null) {
    if (pillar.visible) pillar.userData.pulse(t);
    for (const [fig, m] of movers) {
      const d = stepToward(fig, m.to, m.speed, dt, 0.3);
      if (d < m.best - 0.02) { m.best = d; m.stuck = 0; } else m.stuck += dt;
      if (d < 0.05 || m.stuck > 1.5) {
        if (m.stuck > 1.5) fig.position.copy(m.to);
        movers.delete(fig);
        m.resolve();
        continue;
      }
      turnFigure(fig, Math.atan2(tmp.x, tmp.z), dt);
      animateFigure(fig, m.speed, dt, t, 1.3);
    }
    for (const fig of Object.values(people)) {
      if (!fig.visible || movers.has(fig) || fig.userData.pose) continue;
      if (fig.userData.faceYaw !== undefined) turnFigure(fig, fig.userData.faceYaw, dt * 0.5);
      animateFigure(fig, 0, dt, t, 1.3);
    }
    for (const [obj, fig] of carried) obj.position.copy(handOf(fig));
    for (const an of animals) {
      const u = an.userData;
      if (!an.visible) continue;
      let moving = false;
      if (u.route?.length) {
        u.routeT = (u.routeT ?? 0) + dt;
        if (animalStep(an, u.route[0], an.userData.run, dt) || u.routeT > 8) {
          if (u.routeT > 8) an.position.copy(u.route.at(-1));
          u.route.shift();
          u.routeT = 0;
          if (!u.route.length) { u.route = null; u.onArrive?.(); u.onArrive = null; }
        }
        moving = true;
      } else if (u.lead) {
        const lead = u.lead.position ?? u.lead;
        const goal = lead.clone().add(u.leadOffset ?? V(0.75, 0.45)).setY(0);
        if (an.position.distanceTo(goal) > 0.4) { animalStep(an, goal, Math.min(4.2, 0.8 + an.position.distanceTo(goal) * 1.6), dt); moving = true; }
      } else if (!u.still) {
        if (u.dest) {
          if (animalStep(an, u.dest, inStage(an.position) ? u.run : u.walk, dt)) u.dest = null;
          moving = true;
        } else if ((u.wait -= dt) <= 0) {
          const a = Math.random() * Math.PI * 2, r = 0.5 + Math.random() * u.roam;
          const p = u.home.clone().add(V(Math.cos(a) * r, Math.sin(a) * r));
          if (!inStage(p, 0.6) && !collide(p.clone(), u.radius) && p.length() < radius - 1) u.dest = p;
          u.wait = 2 + Math.random() * 4;
        }
        if (playerPos && !u.dest && an.position.distanceTo(playerPos) < 2.6) {
          const want = Math.atan2(playerPos.z - an.position.z, playerPos.x - an.position.x);
          u.yaw += Math.atan2(Math.sin(want - u.yaw), Math.cos(want - u.yaw)) * Math.min(1, dt * 2);
        }
      }
      if (!moving) u.speed += (0 - u.speed) * Math.min(1, dt * 4);
      an.rotation.y = -u.yaw;
      animateAnimal(an, u.speed, dt, t, !moving);
    }
    for (const fn of updaters) fn(dt, t, playerPos);
  }

  // 나무: 장면을 만든 뒤에 심는다(keep 자리, 무대, 장애물, 카메라 쪽은 비운다)
  function plant() {
    let placed = 0;
    for (let tries = 0; placed < trees && tries < 800; tries++) {
      const a = rand() * Math.PI * 2, r = 5 + rand() * (radius - 5.5);
      const p = V(Math.cos(a) * r, Math.sin(a) * r);
      if ([start, ...keep].some((k) => p.distanceTo(k) < 2.6) || Object.values(stages).some((s) => p.distanceTo(s.c) < s.r + 1) || colliders.some((c) => Math.hypot(p.x - c.x, p.z - c.z) < c.r + 1.2)) continue;
      if (p.x + p.z > 5) continue; // 카메라 쪽은 비워 장면을 가리지 않게 한다
      const tree = makeTree(treeKinds[placed % treeKinds.length], treeKinds[placed % treeKinds.length] === 'palm' ? 'date' : null);
      tree.position.copy(p);
      const s = 1 + rand() * 0.4;
      tree.scale.setScalar(s);
      group.add(tree);
      block(p, 0.35 * s);
      placed++;
    }
  }

  return {
    group, sky, radius, stages, hemi, sun, people, animals, acts, update, collide, stepAside, block, put, person, animal, plant, rand,
    onUpdate: (fn) => updaters.push(fn), handOf, keep, spots: { start },
  };
}

export { PAL, mat };
