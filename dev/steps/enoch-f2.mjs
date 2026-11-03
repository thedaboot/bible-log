import { boot } from './_save.mjs';
// 샛길 에녹(F12 가시 빼기, F13 언덕 끝 동네, F14 올라가심, R2 정체 모를 가시)을 멈춰 캡처하고, 끝까지 자동 플레이로 마침 창이 뜨는지 본다.
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('enoch'); 1`);
  const waitAuto = async () => { let k = 0; for (; k < 200; k++) { await t.wait(300); if (!(await t.ev(`__dev.auto`))) break; } return k < 200; };
  const until = async (text, name, ms = 1500) => {
    await t.ev(`__dev.pauseAt = ${JSON.stringify(text)}; __dev.auto = true; 1`);
    if (!(await waitAuto())) console.log('timeout', text);
    await t.wait(ms);
    if (name) await t.shot(name);
  };
  // R2: 장면의 가시 모양 물체(원뿔)를 모두 찾아 자리를 적는다
  await t.wait(1500);
  console.log('cones', await t.ev(`(() => { const out = []; __dev.field.group.traverse((o) => { if (o.isMesh && o.geometry.type === 'ConeGeometry') { const p = o.getWorldPosition(new o.position.constructor()); out.push([o.parent?.type, p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1), o.geometry.parameters.height.toFixed(2)].join(' ')); } }); return JSON.stringify(out); })()`));
  await t.shot('e0-start');
  // F12: 어린양 곁으로 가서 가시 빼기 화면
  await until('빼내 주겠소', null, 300);
  for (let k = 0; k < 40; k++) { if ((await t.ev(`__dev.mode`)) === 'walk') break; await t.ev(`document.getElementById('dialog').hidden || document.getElementById('dialog').click(); 1`); await t.wait(400); }
  await t.wait(1200);
  await t.shot('e1a-thorns');
  await t.ev(`(() => { const F = __dev.field, l = F.lamb.position, p = F.thorns ? F.thorns[0].pos : l.clone().setX(l.x + 0.9).setZ(l.z + 0.9); __dev.player.position.set(p.x, 0, p.z); return 1; })()`);
  await t.wait(1500);
  await t.shot('e1-thorns');
  // 빗나감(세게 당김) 반응: 실패 표시가 붙으면 어린양이 움찔한다
  await t.ev(`document.getElementById('challenge').classList.remove('is-hit','is-miss'); document.getElementById('challenge').classList.add('is-miss'); 1`);
  await t.wait(120);
  await t.shot('e1b-miss');
  // 다시 한 번 빗나감을 붙이고 1초 동안 어린양 높이·기울기의 최댓값을 잰다
  console.log('flinch', await t.ev(`(async () => { const P = document.getElementById('challenge'), l = __dev.field.lamb; await new Promise((r) => setTimeout(r, 600)); P.classList.remove('is-miss'); P.classList.add('is-miss'); let y = 0, x = 0; for (let k = 0; k < 40; k++) { await new Promise((r) => setTimeout(r, 25)); y = Math.max(y, l.position.y); x = Math.max(x, Math.abs(l.rotation.x)); } return JSON.stringify([y.toFixed(3), x.toFixed(3)]); })()`));
  // 가시 하나를 실제로 빼고(자동 플레이 한 번) 떨어진 모습을 본다
  await t.ev(`__dev.auto = true; 1`);
  for (let k = 0; k < 60; k++) { await t.wait(100); if (await t.ev(`!!__dev.field.thorns && __dev.field.thorns.some((s) => s.thorn.parent === __dev.field.group)`)) break; }
  await t.ev(`__dev.auto = false; 1`);
  await t.wait(900);
  await t.shot('e1c-pulled-one');
  await until('우리 집 양이오', 'e2-pulled', 1500);
  // F13: 언덕 끝에서 내려다보는 동네
  await until('아래 마을을', 'e3-look', 2000);
  await until('보라, 주께서', 'e3b-look', 1500);
  // F14: 올라가는 장면
  await until('데려가셔서', null, 0);
  await t.shot('e4-rise0');
  await t.wait(1500);
  await t.shot('e4-rise1');
  await t.wait(1800);
  await t.shot('e4-rise2');
  await until('어린양만', 'e5-after', 1500);
  await t.ev(`__dev.auto = true; 1`);
  for (let k = 0; k < 200; k++) { await t.wait(500); if (await t.ev(`!!document.getElementById('clearBox') && !document.getElementById('clearBox').hidden`)) break; }
  await t.shot('e6-clear');
  console.log('clear', await t.ev(`__dev.state.claimed.includes('enoch/clear')`), 'errors', await t.ev(`JSON.stringify(__e)`));
};
