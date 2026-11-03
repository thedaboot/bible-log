import { boot, SAVE } from './_save.mjs';
// F05·F06: 새 머리·옷·소품을 꾸미기 방에서 하나씩 입혀 캡처한다. 상점 머리·옷은 산 저장값으로.
export default async (t) => {
  await boot(t, { ...SAVE, xp: 99999, talents: 999, items: { tools: ['net', 'sickle', 'torch'], looks: ['locks', 'longwave', 'crownbraid', 'coat', 'pomegranate', 'belt'] }, claimed: [...SAVE.claimed, 'noah/clear'] });
  await t.ev(`__dev.state.earthLook = null; __dev.run('babel'); 1`);
  await t.wait(4000);
  const pick = async (key, id, name) => {
    await t.ev(`(() => { const i = document.querySelector('#lookForm input[name="${key}"][value="${id}"]'); if (!i) return 0; i.click(); return 1; })()`);
    await t.wait(900);
    await t.shot(name);
  };
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[1].click(); 1`); await t.wait(500);
  await t.shot('hair-tab');
  for (const h of ['fringe', 'shoulder', 'side', 'locks', 'longwave', 'crownbraid']) await pick('hair', h, `hair-${h}`);
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[2].click(); 1`); await t.wait(500);
  for (const o of ['girded', 'linen', 'coat']) await pick('outfit', o, `outfit-${o}`);
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[3].click(); 1`); await t.wait(500);
  await t.shot('props-tab');
  for (const [k, id] of [['item', 'dove'], ['item', 'pomegranate'], ['item', 'net'], ['item', 'torch'], ['item', 'sickle'], ['waist', 'inkhorn'], ['waist', 'sword'], ['head', 'turban'], ['head', 'helmet']]) await pick(k, id, `prop-${id}`);
  console.log(await t.ev(`JSON.stringify(__e)`));
};
