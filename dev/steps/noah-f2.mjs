import { boot } from './_save.mjs';
// 1-4 노아 피드백 2차(F11 방주, F16 셈, F17 새, F19 도마뱀): 고치기 전(BASE=5175)과 후를 같은 자리에서 찍는다.
// 대사 창에 아래 글이 뜨면 자동 플레이를 멈추고 찍는다. 페이지 안 감시(20ms)가 프레임보다 먼저 멈추게 한다.
const STOPS = [
  ['용골', 'b0-keel'], ['층 바닥', 'b1-ribs'], ['섰구려', 'b1-frame'], ['판자를', 'b2-floors'], ['역청이오', 'b3-planks'],
  ['검은 방주', 'b4-built'], ['들여보내 보아요', 'quest'],
  ['떠다녔다', 'flood'], ['아라랏 산에', 'rest'], ['제단을 쌓고', 'out-birds'], ['멸하는', 'rainbow'],
];
export default async (t) => {
  await boot(t);
  await t.ev(`window.__stops = ${JSON.stringify(STOPS.map((s) => s[0]))}; window.__hit = null;
    setInterval(() => { const d = document.getElementById('dialog'); if (!__dev.auto || d.hidden) return;
      const line = document.getElementById('line').textContent; const k = __stops.findIndex((s) => line.includes(s));
      if (k >= 0) { __dev.auto = false; __hit = __stops[k]; __stops.splice(k, 1); } }, 20); 1`);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('noah'); 1`);
  const name = (s) => STOPS.find((x) => x[0] === s)[1];
  const nearShot = async (expr, shotName, tries = 60) => {
    for (let k = 0; k < tries; k++) { if (await t.ev(expr)) { await t.shot(shotName); return true; } await t.wait(150); }
    console.log('miss', shotName); return false;
  };
  for (let round = 0; round < 40; round++) {
    let k = 0;
    for (; k < 400; k++) { if (!(await t.ev(`__dev.auto`))) break; await t.wait(250); if (await t.ev(`!document.getElementById('clearBox').hidden`)) break; }
    if (await t.ev(`!document.getElementById('clearBox').hidden`)) break;
    const hit = await t.ev(`__hit`);
    if (!hit) { console.log('timeout'); break; }
    await t.wait(hit === 'out-birds' || name(hit) === 'out-birds' ? 3000 : 2200);
    await t.shot(name(hit));
    await t.ev(`__hit = null; 1`);
    if (name(hit) === 'b0-keel') {
      // 셈의 짧은 인사: 첫 도전이 시작되면(걷기) 셈 곁, 도전 자리에서 먼 곳에 세워 인사를 듣는다
      await t.ev(`__dev.auto = true; 1`);
      for (let k = 0; k < 200 && (await t.ev(`__dev.mode`)) !== 'walk'; k++) await t.wait(100);
      await t.ev(`__dev.auto = false; const s = __dev.field.people.shem.position; __dev.player.position.set(s.x + 1.1, 0, s.z + 1.1); 1`);
      for (let k = 0; k < 60; k++) { if (await t.ev(`!document.getElementById('dialog').hidden && document.getElementById('line').textContent.includes('먹이 자루')`)) break; await t.wait(150); }
      await t.wait(1500);
      await t.shot('shem');
    }
    if (hit === '들여보내 보아요') {
      // 퀘스트: 새 터와 도마뱀 곁으로 옮겨 찍고, 짐승이 발판을 오르는 모습을 찍는다
      await t.ev(`document.getElementById('dialog').click(); 1`);
      await t.wait(1500);
      await t.ev(`__dev.speed = 0.25; const b = __dev.field.spots.birds; __dev.player.position.set(b.x + 1.6, 0, b.z + 1.6); 1`);
      await t.wait(900);
      await t.shot('q-birds');
      await t.ev(`const l = __dev.field.pairs.find((p) => p.kind === 'lizard').animals[0].position; __dev.player.position.set(l.x + 1.2, 0, l.z + 1.2); 1`);
      await t.wait(900);
      await t.shot('q-lizard');
      await t.ev(`__dev.speed = 1.5; __dev.auto = true; 1`);
      const nearDoor = (kinds) => `(() => { const d = __dev.field.spots.door; return __dev.field.pairs.some((p) => ${JSON.stringify(kinds)}.includes(p.kind) && p.animals.some((a) => a.visible && a.userData.route && a.position.distanceTo(d) < 1.9)); })()`;
      await nearShot(nearDoor(['lion', 'horse']), 'q-door', 120);
      await nearShot(nearDoor(['lizard']), 'q-lizard-ramp', 120);
      await t.ev(`__dev.speed = 4; 1`);
    }
    if (!(await t.ev(`__hit`))) await t.ev(`__dev.auto = true; 1`);
  }
  for (let k = 0; k < 300; k++) { await t.wait(500); if (await t.ev(`!document.getElementById('clearBox').hidden`)) break; }
  await t.shot('z-clear');
  console.log('clear', await t.ev(`!document.getElementById('clearBox').hidden`), 'claimed', await t.ev(`JSON.stringify(__dev.state.claimed.filter((c) => c.startsWith('noah')))`),
    'codex', await t.ev(`JSON.stringify(Object.keys(__dev.state.codex).filter((c) => /lizard|fish|shem/.test(c)))`), 'errors', await t.ev(`JSON.stringify(__e)`));
};
