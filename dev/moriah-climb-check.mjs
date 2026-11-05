// 1-8 모리아 산길 점검(F59): 연출 길(산 아래 → 길목 → 계단 → 꼭대기)을 field.js 길찾기로 걸어 보며
// 0.1 간격마다 걷는 높이가 0.35 넘게 튀지 않는지(절벽을 건너뛰지 않고 계단으로 오르는지) 본다. 실행: node dev/moriah-climb-check.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import mod, { heightAt } from '../src/stages/moriah.js';

const F = mod.build({ background: new THREE.Color() });
const S = F.spots;
const V = (x, z) => new THREE.Vector3(x, 0, z);
const legs = [[S.foot, S.trail0], [S.trail0, S.trail1], [S.trail1, S.trail2], [S.trail2, S.altar.clone().add(V(0.9, -0.6))], [S.start, S.trail2]];
for (const [a, b] of legs) {
  let at = a.clone().setY(0), maxJump = 0;
  const route = F.acts.routeTo(at, b);
  for (const q of route) {
    const n = Math.ceil(at.distanceTo(q) / 0.1);
    for (let j = 1; j <= n; j++) {
      const p0 = at.clone().lerp(q, (j - 1) / n), p1 = at.clone().lerp(q, j / n);
      maxJump = Math.max(maxJump, Math.abs(heightAt(p1) - heightAt(p0)));
    }
    at = q;
  }
  const end = route.at(-1);
  console.log(`(${a.x.toFixed(1)},${a.z.toFixed(1)}) → (${b.x.toFixed(1)},${b.z.toFixed(1)}): 꺾는 점 ${route.length}, 끝 높이 ${heightAt(end).toFixed(2)}, 가장 큰 높이 차 ${maxJump.toFixed(2)}`);
  assert.ok(end.distanceTo(b.clone().setY(0)) < 0.5, '목표에 닿지 못함');
  assert.ok(maxJump < 0.35, '절벽을 건너뜀');
}
console.log('OK: 모리아 산길 점검 통과');
