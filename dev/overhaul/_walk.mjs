// 실제 키(WASD)로 목표까지 걷는다. 길은 게임의 길찾기(field.acts.routeTo)가 준 꺾는 점을 따라간다: 순간 이동(goNext)을 쓰지 않는다.
// targetExpr: 페이지에서 {x, z}(또는 Vector3)를 주는 식. done: 페이지에서 참이 되면 멈추는 식.
// 돌려주는 값: { arrived, steps, maxStep(한 번에 움직인 가장 큰 거리: 순간 이동이 없었는지 본다), path }
import {keys} from '../steps/_games.mjs';

export async function walkKeys(t, targetExpr, done, {tries = 900, reach = 0.45} = {}) {
  const {send} = keys(t), held = new Set(), path = [];
  let arrived = false, maxStep = 0, last = null;
  for (let i = 0; i < tries && !arrived; i++) {
    const s = await t.ev(`(()=>{const d=__dev,p=d.player.position,g=${targetExpr};if(${done})return{done:true,x:p.x,y:p.y,z:p.z};
      if(d.mode!=='walk'||!g)return{wait:true,x:p.x,y:p.y,z:p.z};
      const goal=p.clone().set(g.x,0,g.z),from=p.clone().setY(0);
      const r=d.field.acts.routeTo(from,goal,0.35)[0]??goal;
      return{x:p.x,y:p.y,z:p.z,tx:r.x,tz:r.z,left:Math.hypot(g.x-p.x,g.z-p.z)};})()`);
    if (last) maxStep = Math.max(maxStep, Math.hypot(s.x - last.x, s.z - last.z));
    last = s;
    path.push([+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)]);
    const desired = new Set();
    if (s.done) arrived = true;
    else if (!s.wait && s.left > reach) {
      const dx = s.tx - s.x, dz = s.tz - s.z, r = dx - dz, f = -dx - dz, m = Math.max(Math.abs(r), Math.abs(f));
      if (Math.abs(r) > m * 0.42) desired.add(r > 0 ? 'KeyD' : 'KeyA');
      if (Math.abs(f) > m * 0.42) desired.add(f > 0 ? 'KeyW' : 'KeyS');
    }
    for (const c of held) if (!desired.has(c)) { await send(c, 'keyUp'); held.delete(c); }
    for (const c of desired) if (!held.has(c)) { await send(c, 'keyDown'); held.add(c); }
    await t.wait(70);
  }
  for (const c of held) await send(c, 'keyUp');
  return {arrived, steps: path.length, maxStep, path};
}
