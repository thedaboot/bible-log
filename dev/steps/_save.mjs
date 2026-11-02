// 1-3까지 마친 저장값을 넣고 이어하기로 쉼터에 선다
export const SAVE = { name: '요한', look: { color: 'sky', hair: 'short', outfit: 'tunic' },
  earthLook: { skin: 's2', height: 'mid', aura: 'sky', hair: 'short', hairColor: 'darkbrown', beard: 'none', outfit: 'tunic', outfitColor: 'linen', item: 'none' },
  scene: 'cain', unlocked: ['prologue', 'creation-1', 'eden', 'fall', 'cain'], xp: 270, talents: 60, spirit: { joy: 6, faith: 6, patience: 30 },
  bonds: {}, codex: {}, items: { tools: [], looks: [] }, claimed: ['creation/clear', 'eden/clear', 'cain/clear'], learned: ['walk', 'look'] };
export async function boot({ ev, open, wait }, save = SAVE) {
  const base = process.env.BASE ?? 'http://127.0.0.1:5174/';
  await open(base);
  await ev(`localStorage.setItem('bible-rpg/save/v1', ${JSON.stringify(JSON.stringify(save))})`);
  await open(base);
  await wait(1200);
  await ev(`window.__e=[];addEventListener('error',e=>__e.push(e.message));addEventListener('unhandledrejection',e=>__e.push(String(e.reason?.stack||e.reason)))`);
  await ev(`[...document.querySelectorAll('.menu__item')].find(b => b.textContent === '이어하기').click()`);
  await wait(3000);
}
export const next = async ({ ev, wait }, n = 1) => { for (let k = 0; k < n; k++) { await ev(`document.getElementById('dialog').click()`); await wait(80); await ev(`document.getElementById('dialog').click()`); await wait(150); } };
