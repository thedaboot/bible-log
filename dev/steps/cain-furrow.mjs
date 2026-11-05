import { SAVE } from './_save.mjs';
// _save.mjs boot과 같되, 낮은 가로 화면에서 첫 메뉴가 늦게 뜰 때까지 기다린다
async function boot({ ev, open, wait }) {
  await open(process.env.BASE ?? 'http://127.0.0.1:5174/');
  await ev(`localStorage.setItem('bible-rpg/save/v1', ${JSON.stringify(JSON.stringify(SAVE))})`);
  await open(process.env.BASE ?? 'http://127.0.0.1:5174/');
  for (let k = 0; k < 40 && !(await ev(`[...document.querySelectorAll('.menu__item')].some(b => b.textContent === '이어하기')`)); k++) await wait(250);
  await ev(`window.__e=[];addEventListener('error',e=>__e.push(e.message));addEventListener('unhandledrejection',e=>__e.push(String(e.reason?.stack||e.reason)))`);
  await ev(`[...document.querySelectorAll('.menu__item')].find(b => b.textContent === '이어하기').click()`);
  await wait(3000);
}
// 1-3 양 치기 중 가인의 밭: 처음 밟으면 경고(짧은 인사), 다시 밟으면 가인이 따라와 꾸짖고, 밭을 벗어나면 돌아간다.
export default async (t) => {
  await boot(t);
  await t.ev(`Object.assign(__dev, { speed: 4, auto: true }); __dev.run('cain'); 1`);
  // 퀘스트 1(걷기)이 시작되면 자동 플레이를 멈춘다
  for (let k = 0; k < 300; k++) { await t.wait(300); if (await t.ev(`__dev.mode === 'walk' && document.getElementById('dialog').hidden`)) break; }
  await t.ev(`Object.assign(__dev, { auto: false, speed: 1 }); 1`);
  const tp = (x, z) => t.ev(`__dev.player.position.set(${x}, 0, ${z}); 1`);
  const log = async (tag) => console.log(tag, await t.ev(`(() => { const c = __dev.cain.people.cain; return JSON.stringify({ cain: [c.position.x.toFixed(2), c.position.z.toFixed(2)], pose: c.userData.pose ?? null, toast: document.getElementById('toast').hidden ? null : document.getElementById('toast').textContent, dialog: document.getElementById('dialog').hidden ? null : document.getElementById('line').textContent, errs: __e }); })()`));
  await t.wait(600);
  await tp(4.8, -2.3); // 가인 곁(밭 바로 앞)
  await t.wait(900);
  await log('warn');
  await t.shot('0-warn');
  for (let k = 0; k < 10 && !(await t.ev(`document.getElementById('dialog').hidden`)); k++) { await t.ev(`document.getElementById('dialog').click()`); await t.wait(120); await t.ev(`document.getElementById('dialog').click()`); await t.wait(300); }
  await tp(7.6, -3); // 밭 밖
  await t.wait(700);
  await tp(2.4, -5.6); // 밭 먼 구석을 다시 밟는다
  await t.wait(700);
  await log('chase');
  if (process.env.U6) {
    // U6: 꾸짖는 중에 대사(연출)가 시작되면 그만두고, 대사 동안은 걸어 나가지 않다가 끝난 뒤 제자리로 간다
    await t.ev(`import('/src/ui.js').then(m => { window.__say = m.say([{ who: 'narr', text: '시험 대사' }], __dev.state); return 1; })`);
    await t.wait(800);
    await log('u6-talking');
    const p1 = await t.ev(`JSON.stringify(__dev.cain.people.cain.position)`); await t.wait(1200); const p2 = await t.ev(`JSON.stringify(__dev.cain.people.cain.position)`);
    console.log('u6 moved during talk', p1 !== p2);
    await t.shot('u6-talking');
    for (let k = 0; k < 6 && !(await t.ev(`document.getElementById('dialog').hidden`)); k++) { await t.ev(`document.getElementById('dialog').click()`); await t.wait(300); }
    await t.wait(2500);
    await log('u6-after');
    return;
  }
  await t.shot('1-chase');
  await t.wait(500);
  await log('angry');
  await t.shot('2-angry');
  await tp(8.2, -1); // 밭을 벗어난다
  await t.wait(1600);
  await log('back');
  await t.shot('3-back');
  await tp(2.4, -5.6); // 쉬는 동안에는 반응하지 않는다
  await t.wait(1000);
  await log('cool');
  await t.wait(4000);
  await log('again');
  await t.shot('4-again');
};
