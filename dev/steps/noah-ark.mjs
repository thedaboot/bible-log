import { boot } from './_save.mjs';
// 1-4 노아: 방주 짓기 단계별, 홍수, 아라랏, 무지개를 멈춰 캡처하고, 끝까지 자동 플레이로 마침 창이 뜨는지 본다.
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('noah'); 1`);
  const until = async (text, name, ms = 1500) => {
    await t.ev(`__dev.pauseAt = ${JSON.stringify(text)}; __dev.auto = true; 1`);
    let k = 0; for (; k < 200; k++) { await t.wait(300); if (!(await t.ev(`__dev.auto`))) break; } if (k === 200) console.log("timeout", text);
    await t.wait(ms);
    if (name) await t.shot(name);
  };
  await until('용골이', 'n1-keel', 2500);
  await until('섰구려', 'n2-frame', 2500);
  await until('역청이오', 'n3-plank', 2500);
  await until('오십', 'n4-built', 2500);
  await until('가축과', 'n5-in', 1500);
  await until('떠올랐다', 'n6-flood1', 2500);
  await until('떠다녔다', 'n7-flood2', 3000);
  await until('열다섯', 'n8-flood3', 3000);
  await until('열이렛날', 'n9-rest', 3000);
  await until('종류대로', 'n10-out', 2500);
  await until('무지개를', 'n11-rainbow-mid', 1200);
  await until('멸하는', 'n12-rainbow', 1500);
  await t.ev(`__dev.auto = true; 1`);
  for (let k = 0; k < 200; k++) { await t.wait(500); if (await t.ev(`!!document.getElementById('clearBox') && !document.getElementById('clearBox').hidden`)) break; }
  await t.shot('n13-clear');
  console.log('clear', await t.ev(`!document.getElementById('clearBox').hidden`), 'errors', await t.ev(`JSON.stringify(__e)`));
};
