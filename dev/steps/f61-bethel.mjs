import { boot, SAVE } from './_save.mjs';
// F61 1-10 벧엘: 자동 플레이로 가다가 PAUSES(| 로 나눈 대사 일부)마다 멈춰 캡처하고, 끝까지 가서 'bethel/clear'와 __stuck를 본다.
// PAUSES='팥죽|에서인 척' TAG=before 처럼 고른다. 캡처 이름은 <TAG>-<순번>. 휴대폰은 대사를 쪽으로 나누므로 대사 첫머리를 고른다.
export default async (t) => {
  const pauses = (process.env.PAUSES ?? '').split('|').filter(Boolean);
  const tag = process.env.TAG ?? 'shot';
  const has = (c) => t.ev(`__dev.state.claimed.includes('${c}')`);
  // 다른 캡처가 함께 돌면 첫 화면이 늦게 떠 boot가 실패할 때가 있어 세 번까지 다시 띄운다
  for (let n = 0; ; n++) { try { await boot(t, { ...SAVE, xp: 3000 }); break; } catch (e) { if (n >= 2) throw e; } }
  await t.ev(`__dev.speed = 3; __dev.pauseAt = ${JSON.stringify(pauses[0] ?? null)}; __dev.run('bethel'); __dev.auto = true; 1`);
  for (const [i, p] of pauses.entries()) {
    let k = 0;
    for (; k < 900 && (await t.ev(`__dev.auto`)) && !(await has('bethel/clear')); k++) await t.wait(200);
    if (await has('bethel/clear')) { console.log('pause', i, p, 'MISSED (clear)'); break; }
    await t.wait(900);
    await t.shot(`${tag}-${String(i).padStart(2, '0')}`);
    console.log('pause', i, p, k >= 900 ? 'TIMEOUT' : 'ok');
    await t.ev(`__dev.pauseAt = ${JSON.stringify(pauses[i + 1] ?? null)}; __dev.auto = true; 1`);
  }
  let clear = false;
  for (let k = 0; k < 1200 && !clear; k++) { await t.wait(300); clear = await has('bethel/clear'); }
  console.log(JSON.stringify({ clear, errs: await t.ev(`JSON.stringify(window.__e)`), stuck: await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`), claimed: await t.ev(`__dev.state.claimed.filter((c) => c.startsWith('bethel/')).join(' ')`) }));
};
