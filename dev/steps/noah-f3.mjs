import { boot } from './_save.mjs';
// 1-4 노아 피드백 3차: (1) 첫 도전 자리에 실제로 걸어서 닿는지와 노아가 걸리는지 (2) 비 오는 방주 지붕(여러 장, 번쩍임)
// (3) 최고 수위에서 땅이 다 잠기는지 (4) 번제 장면 포커스. WALK=0이면 걷기 점검을 건너뛴다.
// 대사 창에 아래 글이 뜨면 자동 플레이를 멈추고 찍는다.
const STOPS = [['갈빗대 하나가', 'a-hint'], ['떠올랐다', 'rain'], ['열다섯 규빗', 'flood-top'], ['번제로', 'altar'], ['다시는 사람', 'altar2']];
export default async (t) => {
  await boot(t);
  await t.ev(`window.__stops = ${JSON.stringify(STOPS.map((s) => s[0]))}; window.__hit = null;
    setInterval(() => { const d = document.getElementById('dialog'); if (!__dev.auto || d.hidden) return;
      const line = document.getElementById('line').textContent; const k = __stops.findIndex((s) => line.includes(s));
      if (k >= 0) { __dev.auto = false; __hit = __stops[k]; __stops.splice(k, 1); } }, 20); 1`);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('noah'); 1`);
  const name = (s) => STOPS.find((x) => x[0] === s)[1];
  const hold = async (code, ms) => {
    await t.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: code });
    await t.wait(ms);
    await t.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: code });
  };
  for (let round = 0; round < 20; round++) {
    for (let k = 0; k < 600; k++) { if (!(await t.ev(`__dev.auto`))) break; await t.wait(250); if (await t.ev(`!document.getElementById('clearBox').hidden`)) break; }
    if (await t.ev(`!document.getElementById('clearBox').hidden`)) break;
    const hit = await t.ev(`__hit`);
    if (!hit) { console.log('timeout'); break; }
    const n = name(hit);
    if (n === 'rain' || n === 'flood-top') {
      // 비 오는 밤 방주 지붕: 짧은 간격으로 여러 장
      for (let i = 0; i < (n === 'rain' ? 6 : 2); i++) { await t.wait(n === 'rain' ? 700 : 1800); await t.shot(`${n}-${i}`); }
    } else { await t.wait(2200); await t.shot(n); }
    await t.ev(`__hit = null; 1`);
    if (n === 'a-hint' && process.env.WALK !== '0') {
      // 첫 도전: 대사를 넘긴 뒤 자동 플레이 없이 실제 키 입력으로 첫 자리까지 걷는다
      await t.ev(`document.getElementById('dialog').click(); 1`);
      for (let k = 0; k < 100 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) { await t.wait(100); await t.ev(`if (!document.getElementById('dialog').hidden) document.getElementById('dialog').click(); 1`); }
      await t.ev(`__dev.speed = 1; 1`);
      const goal = await t.ev(`JSON.stringify(__dev.field.spots.work0)`);
      const G = JSON.parse(goal);
      let reached = false, last = null, stuck = 0;
      for (let k = 0; k < 160; k++) {
        const p = JSON.parse(await t.ev(`JSON.stringify(__dev.player.position)`));
        const dx = G.x - p.x, dz = G.z - p.z, d = Math.hypot(dx, dz);
        if (!(await t.ev(`document.getElementById('challenge').hidden`)) && d < 1.6) { reached = true; break; }
        if (last && Math.hypot(p.x - last.x, p.z - last.z) < 0.02) stuck++; else stuck = 0;
        if (stuck > 8) { console.log('walk stuck at', JSON.stringify(p)); break; }
        last = p;
        // 화면 앞(f)·옆(r) 값으로 바꾼다: dx = r - f, dz = -r - f
        const r = (dx - dz) / 2, f = -(dx + dz) / 2;
        const code = Math.abs(r) > Math.abs(f) ? (r > 0 ? 'KeyD' : 'KeyA') : (f > 0 ? 'KeyW' : 'KeyS');
        await hold(code, 260);
      }
      console.log('walk reached', reached);
      await t.shot('a-walked');
      // 한 번 성공시켜 노아가 곁으로 오는 모습(걸리지 않는지)
      await t.ev(`__dev.speed = 4; __dev.auto = true; 1`);
      await t.wait(1200);
      await t.ev(`__dev.auto = false; 1`);
      for (let k = 0; k < 60 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(100);
      await t.wait(400);
      await t.shot('a-noah');
      console.log('noah at', await t.ev(`JSON.stringify(__dev.field.people.noah.position)`), 'want', await t.ev(`JSON.stringify(__dev.field.spots.work0)`));
    }
    await t.ev(`__dev.auto = true; 1`);
  }
  for (let k = 0; k < 300; k++) { await t.wait(500); if (await t.ev(`!document.getElementById('clearBox').hidden`)) break; }
  await t.shot('z-clear');
  console.log('clear', await t.ev(`!document.getElementById('clearBox').hidden`), 'claimed', await t.ev(`JSON.stringify(__dev.state.claimed.filter((c) => c.startsWith('noah')))`), 'errors', await t.ev(`JSON.stringify(__e)`));
};
