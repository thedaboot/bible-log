import { boot, SAVE } from './_save.mjs';
// F56·F57 이어하기: 스테이지(STAGE, 기본 noah)를 자동 플레이로 진행하다 PAUSE 대사에서 멈추고 퀘스트 걷기 중에 자리를 옮긴 뒤,
// 페이지를 새로 열어(브라우저를 닫았다 온 것처럼) 첫 화면 이어하기 → 같은 퀘스트·같은 자리인지 본다. 지도 버튼도 본다.
const STAGE = process.env.STAGE ?? 'noah';
const PAUSE_N = Number(process.env.PAUSE_N ?? 6); // 이 순번(퀘스트) 이후의 걷기에서 멈춘다
export default async (t) => {
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.speed = 4; __dev.state.claimed = __dev.state.claimed.filter((c) => !c.startsWith('${STAGE}/')); __dev.run('${STAGE}'); __dev.auto = true; 1`);
  let r;
  for (let k = 0; k < 600; k++) {
    await t.wait(300);
    r = JSON.parse(await t.ev(`JSON.stringify({ res: __dev.state.resume, mode: __dev.mode, quest: document.getElementById('questTitle').textContent })`));
    if (r.res?.quest && r.res.n >= PAUSE_N && r.mode === 'walk') break;
  }
  await t.ev(`__dev.auto = false; 1`);
  await t.wait(600);
  // 퀘스트 걷기 중 자리를 옮긴다(사람이 걷다 나간 것처럼)
  await t.ev(`__dev.player.position.x += 1.2; __dev.player.position.z += 0.8; 1`);
  const before = JSON.parse(await t.ev(`JSON.stringify({ res: __dev.state.resume, quest: document.getElementById('questTitle').textContent, items: [...document.querySelectorAll('#questList li')].map(l=>l.textContent+(l.classList.contains('is-done')?'✓':'')), pos: __dev.player.position.toArray().map(v=>+v.toFixed(2)) })`));
  await t.shot('before-close');
  // 브라우저를 닫는 것처럼 pagehide를 보내고 다시 연다
  await t.ev(`dispatchEvent(new Event('pagehide')); 1`);
  const saved = await t.ev(`localStorage.getItem('bible-rpg/save/v1')`);
  const base = process.env.BASE ?? 'http://127.0.0.1:5174/';
  await t.open(base); await t.wait(1500);
  const labels = await t.ev(`[...document.querySelectorAll('.menu__item')].map(b=>b.textContent).join(',')`);
  await t.ev(`window.__e=[];addEventListener('error',e=>__e.push(e.message));[...document.querySelectorAll('.menu__item')].find(b => b.textContent === '이어하기').click(); 1`);
  const t0 = Date.now();
  let after;
  for (let k = 0; k < 200; k++) {
    await t.wait(300);
    after = JSON.parse(await t.ev(`JSON.stringify({ fade: document.getElementById('fade').style.opacity, resuming: document.getElementById('fade').classList.contains('is-resuming'), mode: __dev.mode, res: __dev.state.resume, quest: document.getElementById('questTitle').textContent, items: [...document.querySelectorAll('#questList li')].map(l=>l.textContent+(l.classList.contains('is-done')?'✓':'')), pos: __dev.player.position.toArray().map(v=>+v.toFixed(2)) })`));
    if (!after.resuming && after.mode === 'walk') break;
  }
  await t.wait(1500);
  await t.shot('after-resume');
  console.log('title menu', labels);
  console.log('before', JSON.stringify(before));
  console.log('after ', JSON.stringify(after), 'took', ((Date.now() - t0) / 1000).toFixed(1) + 's', 'errs', await t.ev(`JSON.stringify(__e)`));
  // 지도 버튼: 메뉴의 쉼터로 나가기 대신 지도 모듈을 바로 연다
  await t.ev(`import('/src/map.js').then(m => { m.openMap(__dev.state); return 1; })`); await t.wait(1200);
  console.log('map buttons', await t.ev(`[...document.querySelectorAll('.map__point')].map(b=>b.textContent).join(',')`));
  await t.shot('map');
  void saved;
};
