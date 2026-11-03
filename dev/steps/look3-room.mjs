import { boot, SAVE } from './_save.mjs';
// 꾸미기 조합(2026-11-03): 꾸미기 방에서 머리 탭 이름·순서와, 어린양·바구니·투구를 입힌 모습을 찍는다. BASE=http://127.0.0.1:5183/
export default async (t) => {
  await boot(t, { ...SAVE, xp: 99999, talents: 9999, items: { tools: [], looks: ['lamb', 'basket', 'helmet', 'stars', 'menorah', 'breastplate', 'locks', 'longwave', 'crownbraid', 'coat'] }, claimed: [...SAVE.claimed, 'noah/clear'] });
  await t.ev(`__dev.state.earthLook = null; __dev.run('babel'); 1`);
  await t.wait(4000);
  const pick = async (key, id, name) => {
    await t.ev(`(() => { const i = document.querySelector('#lookForm input[name="${key}"][value="${id}"]'); if (!i) return 0; i.click(); return 1; })()`);
    await t.wait(900);
    if (name) await t.shot(name);
  };
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[1].click(); 1`); await t.wait(500);
  await pick('hair', 'curly');
  await t.shot('room-hair-tab');
  console.log(await t.ev(`[...document.querySelectorAll('#lookForm input[name="hair"]')].map((i) => i.closest('label')?.textContent.trim()).join(',')`));
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[2].click(); 1`); await t.wait(400);
  await pick('outfit', 'robe');
  await t.ev(`document.querySelectorAll('#lookTabs .tab')[3].click(); 1`); await t.wait(400);
  await pick('head', 'helmet');
  await pick('item', 'lamb', 'room-lamb');
  await pick('item', 'basket', 'room-basket');
  await pick('waist', 'breastplate');
  await pick('item', 'menorah', 'room-menorah');
  console.log('errors', await t.ev(`JSON.stringify(__e)`));
};
