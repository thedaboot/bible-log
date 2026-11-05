import { SAVE } from './_save.mjs';
// F61 1-13 형제들: 자동 플레이로 끝까지 가며, 정해 둔 대사가 나올 때마다 멈춰 캡처한다. 끝나면 'brothers/clear'와 막힘(__stuck)을 보고한다.
// 쓰기: TAG=after BASE=http://127.0.0.1:5182/ node dev/cdp.mjs 390 844 dev/steps/f61-brothers.mjs dev/shots/brothers
// SHOTS='[["대사 일부","이름"],...]'로 캡처할 자리를 바꾼다(차례대로 찾는다).
const TAG = process.env.TAG ?? 'after';
const SHOTS = process.env.SHOTS ? JSON.parse(process.env.SHOTS) : [
  ['땅에 엎드려', 'bow'], ['곡식 단 꿈', 'granary'], ['시므온을', 'simeon'], ['돈뭉치', 'silver'], ['다섯 배', 'feast'],
  ['은잔은 막내', 'cupput'], ['은잔이 베냐민', 'search'], ['아이 대신', 'judah'], ['물러가라', 'clear'], ['나는 요셉', 'reveal'],
  ['목을 끌어안고', 'hug'], ['수레', 'wagons'], ['우리는 당신의 종', 'end'],
];
export default async (t) => {
  const until = async (expr, n = 600) => { for (let k = 0; k < n && !(await t.ev(expr)); k++) await t.wait(250); return t.ev(expr); };
  // 다른 크롬이 함께 돌면 첫 화면이 늦게 뜬다: 메뉴가 생길 때까지 기다린다(_save.mjs boot는 2.5초만 기다림)
  const base = process.env.BASE ?? 'http://127.0.0.1:5174/';
  await t.open(base);
  await t.ev(`localStorage.setItem('bible-rpg/save/v1', ${JSON.stringify(JSON.stringify({ ...SAVE, xp: 3000 }))}); 1`);
  await t.open(base);
  await until(`[...document.querySelectorAll('.menu__item')].some((b) => b.textContent === '이어하기')`, 240);
  await t.ev(`[...document.querySelectorAll('.menu__item')].find((b) => b.textContent === '이어하기').click(); 1`);
  await until(`!!globalThis.__dev?.run`, 120);
  await t.wait(3000);
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message))); globalThis.__stuck = []; __dev.speed = 3; __dev.state.claimed = __dev.state.claimed.filter((c) => !c.startsWith('brothers/')); __dev.run('brothers'); 1`);
  const left = [];
  for (const [text, name] of SHOTS) {
    await t.ev(`__dev.pauseAt = ${JSON.stringify(text)}; __dev.auto = true; 1`);
    if (!(await until(`!__dev.auto`, 480))) { left.push(name); continue; }
    await t.ev(`__dev.speed = 1; 1`);
    await t.wait(1800);
    await t.shot(`${TAG}-${name}`);
    await t.ev(`__dev.speed = 3; 1`);
  }
  await t.ev(`__dev.pauseAt = null; __dev.auto = true; 1`);
  const clear = await until(`__dev.state.claimed.includes('brothers/clear')`, 1600);
  console.log(JSON.stringify({ TAG, left, clear, errs: await t.ev(`JSON.stringify(__errs)`), stuck: await t.ev(`JSON.stringify(globalThis.__stuck ?? [])`) }));
};
