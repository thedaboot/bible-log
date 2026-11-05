import { boot, SAVE } from './_save.mjs';
// F58 1-5 바벨(벽돌 나르기, 균형)과 1-13 형제들(곡식 받기, 받기): 자동 플레이로 도전 안내 대사까지 가서
// 도전 자리에 서서 놀이판을 캡처하고, 한 번 해낸 뒤 장면(벽돌·자루)을 캡처한다. FULL=1이면 끝까지 가서 claimed에 '<id>/clear'가 생기는지 본다.
// 쓰기: STAGE=babel FULL=1 BASE=http://127.0.0.1:5182/ node dev/cdp.mjs 390 844 dev/steps/f58-stages.mjs dev/shots/<폴더>
const STAGE = process.env.STAGE ?? 'babel';
const GUIDE = { babel: '벽돌 더 달라는', brothers: '빈 자루가 줄지어' }[STAGE];
export default async (t) => {
  const vis = (id) => t.ev(`!document.getElementById('${id}').hidden`);
  const until = async (expr, n = 600) => { for (let k = 0; k < n && !(await t.ev(expr)); k++) await t.wait(250); return t.ev(expr); };
  await boot(t, { ...SAVE, xp: 3000 });
  await t.ev(`__dev.speed = 3; __dev.state.claimed = __dev.state.claimed.filter((c) => !c.startsWith('${STAGE}/')); __dev.run('${STAGE}'); __dev.pauseAt = '${GUIDE}'; __dev.auto = true; 1`);
  await until(`!__dev.auto`);
  await t.ev(`__dev.speed = 1; 1`); // 놀이판은 제 빠르기로 본다(빠르게 돌리면 곡식이 금방 다 떨어진다)
  await t.wait(800);
  await t.shot(`${STAGE}-guide`);
  // 안내 대사를 끝까지 넘긴다(글자가 찍히는 중이면 첫 클릭은 글을 다 보이게만 한다)
  for (let k = 0; k < 20 && (await vis('dialog')); k++) { await t.ev(`document.getElementById('dialog').click(); 1`); await t.wait(300); }
  await until(`__dev.mode === 'walk'`, 40);
  await t.ev(`__dev.goNext(); 1`);
  await t.wait(2500);
  await t.shot(`${STAGE}-game`);
  const label = await t.ev(`document.getElementById('chLabel').textContent`);
  // 한 번 해낸 뒤의 장면
  await t.ev(`__dev.auto = true; 1`);
  await t.wait(1200);
  await t.ev(`__dev.auto = false; 1`);
  await t.wait(1500);
  await t.shot(`${STAGE}-hit`);
  let clear = null;
  if (process.env.FULL) {
    await t.ev(`__dev.speed = 3; __dev.auto = true; 1`);
    clear = await until(`__dev.state.claimed.includes('${STAGE}/clear')`, 1600);
  }
  console.log(JSON.stringify({ STAGE, label, clear, errs: await t.ev(`JSON.stringify(window.__e)`) }));
};
