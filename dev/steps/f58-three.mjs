import { boot, SAVE } from './_save.mjs';
// F58 1-6·1-7·1-10 도전: 자동 플레이로 가다가 도전 안내 대사에서 멈추고, 자동으로 도전 자리까지 걸어가 놀이 화면을 캡처한다.
// 한 번 해낸 뒤(돌이 얹히고, 상에 오르고, 기둥이 젖는 모습)도 캡처하고, 자동 플레이로 끝까지 가서 claimed에 '<id>/clear'가 생기는지 본다.
// STAGES=abram,mamre로 고를 수 있다. 스테이지마다 새로 불러 앞 스테이지의 완료 창이 남지 않게 한다.
const ALL = { abram: ['제단 돌을 함께', 'altarWork', 'altar', 1.6], mamre: ['부르는 차례대로', 'serve', 'table', 1.4], bethel: ['기름이 흐를 길', 'oil', 'oil', 0.8] };
export default async (t) => {
  const vis = (id) => t.ev(`(() => { const e = document.getElementById('${id}'); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; })()`);
  const has = (c) => t.ev(`__dev.state.claimed.includes('${c}')`);
  const out = {};
  for (const id of (process.env.STAGES ?? 'abram,mamre,bethel').split(',')) {
    const [line, spot, key, r] = ALL[id];
    await boot(t, { ...SAVE, xp: 3000 });
    await t.ev(`__dev.speed = 3; __dev.pauseAt = '${line}'; __dev.run('${id}'); __dev.auto = true; 1`);
    for (let k = 0; k < 600 && (await t.ev(`__dev.auto`)); k++) await t.wait(300);
    await t.wait(800);
    await t.shot(`${id}-guide`);
    for (let k = 0; k < 40 && !(await vis('challenge')); k++) { if (await vis('dialog')) await t.ev(`document.getElementById('dialog').click(); 1`); await t.wait(250); }
    // 자동 플레이로 걸어가다 자리 가까이에서 멈춘다(닿으면 곧바로 한 번 해내므로)
    await t.ev(`__dev.auto = true; 1`);
    await t.ev(`window.__near = setInterval(() => { if (__dev.player.position.distanceTo(__dev.field.spots['${spot}']) < ${r + 0.3}) { __dev.auto = false; clearInterval(__near); } }, 5); 1`);
    for (let k = 0; k < 400 && (await t.ev(`__dev.auto`)); k++) await t.wait(30);
    // 반경 바로 안쪽까지 조금만 옮긴다(대천사가 따라온 자리를 흐트러뜨리지 않게)
    await t.ev(`__dev.speed = 1; const s = __dev.field.spots['${spot}'], p = __dev.player.position; p.lerp(s, 1 - ${r - 0.3} / p.distanceTo(s)); 1`);
    await t.wait(2500);
    await t.shot(`${id}-game`);
    const label = await t.ev(`document.getElementById('chLabel')?.textContent`);
    // 한 번 해내면 곧바로 자동 플레이를 끈다(놀이판이 떠 있는 채로 돌이 얹힌 모습을 본다)
    await t.ev(`window.__h1 = setInterval(() => { if (__dev.state.claimed.includes('${id}/${key}/1')) { __dev.auto = false; clearInterval(__h1); } }, 2); __dev.auto = true; 1`);
    for (let k = 0; k < 200 && !(await has(`${id}/${key}/1`)); k++) await t.wait(30);
    await t.wait(1200);
    await t.shot(`${id}-hit1`);
    await t.ev(`__dev.speed = 3; __dev.auto = true; 1`);
    let clear = false;
    for (let k = 0; k < 900 && !clear; k++) { await t.wait(300); clear = await has(`${id}/clear`); }
    out[id] = { clear, label, challenge: await t.ev(`__dev.state.claimed.filter((c) => c.startsWith('${id}/${key}')).join(' ')`), errs: await t.ev(`JSON.stringify(window.__e)`), stuck: await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`) };
    await t.ev(`__dev.auto = false; 1`);
  }
  console.log(JSON.stringify(out));
};
