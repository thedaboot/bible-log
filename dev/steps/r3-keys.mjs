import { SAVE } from './_save.mjs';
// R3: 마우스 없이 키 입력만으로 첫 화면 → 쉼터 → 메뉴(상태·인벤토리·도감) → 상점 → 지도 → 1-9 스테이지(대사, 막간 숫자 키, 도전 F·Space, 퀴즈 숫자 키) → 완료 창.
// 걷는 거리만 순간 이동으로 줄인다(자동화 창은 프레임이 느리다). 나머지는 모두 실제 키 입력(CDP keyDown/keyUp)이다.
const VK = { Enter: 13, Escape: 27, Space: 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Tab: 9, Backspace: 8, BracketLeft: 219, BracketRight: 221 };
export default async (t) => {
  const log = [];
  const ok = (name, cond, info = '') => { log.push(`${cond ? 'OK ' : 'NG '} ${name} ${info}`); };
  const press = async (code, key = code, ms = 250) => {
    const vk = VK[code] ?? (code.startsWith('Key') ? code.charCodeAt(3) : code.startsWith('Digit') ? 48 + Number(code[5]) : 0);
    for (const type of ['keyDown', 'keyUp']) await t.send('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode: vk, text: type === 'keyDown' ? (key === 'Enter' ? String.fromCharCode(13) : key.length === 1 ? key : undefined) : undefined });
    await t.wait(ms);
  };
  const act = () => t.ev(`(document.activeElement?.textContent || document.activeElement?.id || document.activeElement?.tagName || '').trim().slice(0, 30)`);
  const vis = (id) => t.ev(`!document.getElementById('${id}')?.hidden && getComputedStyle(document.getElementById('${id}')).display !== 'none'`);
  const base = process.env.BASE ?? 'http://127.0.0.1:5174/';
  await t.open(base);
  await t.ev(`localStorage.setItem('bible-rpg/save/v1', ${JSON.stringify(JSON.stringify({ ...SAVE, xp: 2000, talents: 300, claimed: [...SAVE.claimed, 'noah/clear', 'babel/clear', 'abram/clear', 'mamre/clear', 'moriah/clear'], unlocked: [...SAVE.unlocked, 'noah', 'babel', 'abram', 'mamre', 'moriah', 'rebekah'] }))})`);
  await t.open(base);
  await t.wait(1500);
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason?.stack||e.reason))); 1`);

  // 첫 화면: 포커스가 '이어하기'에 있고 Enter로 들어간다
  const first = await act();
  ok('첫 화면 포커스', first.includes('이어하기'), first);
  await press('Enter', 'Enter', 3500);
  ok('Enter로 쉼터', (await t.ev(`__dev.mode`)) === 'walk', await t.ev(`__dev.mode`));

  // 걷기: D를 누르고 있으면 움직인다
  const p0 = await t.ev(`__dev.player.position.x`);
  await t.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
  await t.wait(1500);
  await t.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd', windowsVirtualKeyCode: 68 });
  ok('D 키 걷기', Math.abs((await t.ev(`__dev.player.position.x`)) - p0) > 0.05);

  // 메뉴: M으로 열고, E·Q로 탭, 도감 키, Esc로 닫기
  await press('KeyM', 'm', 800);
  ok('M으로 메뉴', await vis('menuBox'));
  await press('KeyE', 'e', 500);
  ok('E로 인벤토리 탭', (await t.ev(`document.querySelector('#menuTabs [aria-selected="true"]')?.textContent`)) === '인벤토리');
  // 인벤토리: Tab으로 칸에 가서 Enter로 고르고, 다는 버튼을 Enter
  for (let k = 0; k < 6 && !(await act()).match(/지팡이|목자|비둘기|두건/); k++) await press('Tab', 'Tab', 150);
  const cell = await act();
  ok('Tab으로 꾸미기 칸', cell.length > 0, cell);
  await press('KeyE', 'e', 500);
  ok('E로 도감 탭', (await t.ev(`document.querySelector('#menuTabs [aria-selected="true"]')?.textContent`)) === '도감');
  const page0 = await t.ev(`document.querySelector('.pager--book')?.textContent ?? ''`);
  await press('BracketRight', ']', 500);
  const page1 = await t.ev(`document.querySelector('.pager--book')?.textContent ?? ''`);
  ok('] 로 다음 장', page0 !== page1, `${page0.slice(0, 12)} → ${page1.slice(0, 12)}`);
  await press('ArrowDown', 'ArrowDown', 400);
  ok('↓ 로 분류', (await t.ev(`document.querySelector('.codex__cats [aria-pressed="true"], .codex__tabs [aria-pressed="true"]')?.textContent`)) === '피조물');
  await press('Escape', 'Escape', 800);
  ok('Esc로 메뉴 닫기', !(await vis('menuBox')));

  // 상점: 상점 천사 곁으로 옮기면 열리고, 첫 포커스가 칸이다
  await t.ev(`__dev.player.position.set(-5, 0, 2.6); 1`);
  await t.wait(2500);
  ok('상점 열림', await vis('menuBox'));
  ok('상점 첫 포커스', (await act()) !== '닫기', await act());
  await press('Enter', 'Enter', 400);
  for (let k = 0; k < 20 && !(await act()).includes('달란트로 사기'); k++) await press('Tab', 'Tab', 150);
  const buy = await act();
  ok('Tab으로 사기 버튼', buy.includes('사기'), buy);
  await press('Escape', 'Escape', 1500);

  // 지도: 빛의 문으로 옮기면 열린다. ←·→로 표지, Enter로 입장
  await t.ev(`__dev.player.position.set(0, 0, 5.8); 1`);
  await t.wait(2500);
  ok('지도 열림', await vis('mapBox'), '');
  const sel = () => t.ev(`document.querySelector('.map [aria-current="true"], .map .is-picked, .map__stop[aria-pressed="true"]')?.textContent ?? document.activeElement?.textContent`);
  const s0 = await sel();
  await press('ArrowRight', 'ArrowRight', 400);
  const s1 = await sel();
  ok('→로 표지 옮김', s0 !== s1, `${s0} → ${s1}`);
  await press('ArrowLeft', 'ArrowLeft', 400);
  // 1-9 리브가까지 옮긴다
  for (let k = 0; k < 14 && !String(await sel()).includes('리브가') && !String(await sel()).includes('1-9'); k++) await press('ArrowRight', 'ArrowRight', 300);
  ok('1-9 표지 고름', String(await sel()).match(/리브가|1-9/) != null, await sel());
  await press('Enter', 'Enter', 5000);
  if (await vis('lookForm')) { await press('Enter', 'Enter', 3000); }

  // 스테이지: Space로 대사를 넘기고, 걷기가 되면 목표로 옮기고, 막간은 숫자 키, 도전은 F·Space, 퀴즈는 숫자 키
  let sawChoice = false, sawChallenge = false, sawQuiz = false, sawClear = false, toolUsed = false;
  for (let k = 0; k < 1500; k++) {
    if (k % 100 === 0) log.push('  진행 ' + (await t.ev(`JSON.stringify({ mode: __dev.mode, q: document.getElementById('questTitle').textContent, line: document.getElementById('line').textContent.slice(0, 20), dlg: !document.getElementById('dialog').hidden })`)));
    if (await vis('clearBox')) { sawClear = true; break; }
    if (await t.ev(`!!document.querySelector('#choices:not([hidden]) button')`)) {
      sawChoice = true;
      await press('Digit1', '1', 600);
      continue;
    }
    if (await vis('quiz')) {
      sawQuiz = true;
      if (!(await t.ev(`document.getElementById('quizNext').hidden`))) { await press('Enter', 'Enter', 800); continue; }
      for (const d of ['1', '2', '3']) { if (!(await vis('quiz'))) break; await press(`Digit${d}`, d, 900); }
      continue;
    }
    if (await vis('dialog')) { await press('Space', ' ', 120); continue; }
    if (await vis('challenge')) {
      sawChallenge = true;
      if ((await t.ev(`document.getElementById('chLabel').textContent`)).includes('쓰기')) { await press('KeyF', 'f', 800); toolUsed = true; }
      await press('Space', ' ', 60);
      continue;
    }
    // 걷는 중: 다음 목표로 옮긴다(걷기는 위에서 확인함)
    await t.ev(`(() => { const w = window.__dev; const a = w.aim?.() ?? null; return 1; })()`);
    await t.ev(`__dev.goNext?.(); 1`);
    await t.wait(400);
  }
  ok('막간 숫자 키', sawChoice);
  ok('도전 F·Space', sawChallenge, `도구 ${toolUsed}`);
  ok('퀴즈 숫자 키', sawQuiz);
  ok('완료 창', sawClear);
  if (sawClear) {
    ok('완료 창 첫 포커스 입장', (await act()).includes('입장'), await act());
    await press('Escape', 'Escape', 3000);
    ok('Esc로 쉼터', (await t.ev(`__dev.state.scene`)) !== 'rebekah' || (await t.ev(`__dev.mode`)) === 'walk');
  }
  log.push('errs ' + (await t.ev(`JSON.stringify(__errs)`)));
  console.log(log.join('\n'));
};
