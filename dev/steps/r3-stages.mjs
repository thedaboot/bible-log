import { boot, SAVE } from './_save.mjs';
// R3 전 스테이지: 스테이지마다 실제 키 입력(Space·Enter·숫자·F·Esc)만으로 대사·막간·깊은 대화·도전·퀴즈·완료 창을 지난다.
// 걷는 거리만 __dev.goNext로 건너뛴다. 스테이지 목록은 STAGES 환경 변수(쉼표로 구분).
const VK = { Enter: 13, Escape: 27, Space: 32 };
export default async (t) => {
  const press = async (code, key = code, ms = 200) => {
    const vk = VK[code] ?? (code.startsWith('Key') ? code.charCodeAt(3) : code.startsWith('Digit') ? 48 + Number(code[5]) : 0);
    const text = key === 'Enter' ? String.fromCharCode(13) : key.length === 1 ? key : undefined;
    for (const type of ['keyDown', 'keyUp']) await t.send('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode: vk, text: type === 'keyDown' ? text : undefined });
    await t.wait(ms);
  };
  const vis = (id) => t.ev(`(() => { const e = document.getElementById('${id}'); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; })()`);
  const stages = (process.env.STAGES ?? 'noah').split(',');
  await boot(t, { ...SAVE, xp: 3000, talents: 300 });
  await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason?.stack||e.reason))); __dev.speed = 4; 1`);
  for (const id of stages) {
    const key = id.startsWith('creation') ? 'creation' : id === 'fall' ? 'eden' : id;
    // 저장값에 이미 '완료'가 있으면 끝난 줄로 잘못 판정한다. 시작 전에 그 기록을 지운다
    await t.ev(`__dev.state.claimed = __dev.state.claimed.filter((c) => c !== '${key}/clear'); __dev.run(${JSON.stringify(id)}); 1`);
    await t.wait(4000);
    if (await vis('lookForm')) await t.ev(`document.getElementById('lookSubmit').focus(); 1`), await press('Enter', 'Enter', 3000);
    const seen = new Set();
    let done = false, stuck = 0, last = '';
    for (let k = 0; k < 2500 && !done; k++) {
      if (await vis('clearBox')) { seen.add('완료 창'); await press('Escape', 'Escape', 3000); done = true; break; }
      if (await t.ev(`__dev.state.claimed.includes('${key}/clear')`) && (await t.ev(`__dev.mode`)) === 'walk' && !(await vis('clearBox'))) { await t.wait(3000); if (!(await vis('clearBox'))) { done = true; break; } }
      if (await t.ev(`!!document.querySelector('#choices:not([hidden]) button')`)) { seen.add('선택지'); await press('Digit1', '1', 500); continue; }
      if (await vis('quiz')) {
        seen.add('퀴즈');
        if (!(await t.ev(`document.getElementById('quizNext').hidden`))) { await press('Enter', 'Enter', 700); continue; }
        for (const d of ['1', '2', '3']) { if (!(await vis('quiz')) || !(await t.ev(`document.getElementById('quizNext').hidden`))) break; await press(`Digit${d}`, d, 700); }
        continue;
      }
      if (await vis('dexCard')) { seen.add('도감 카드'); await press('Space', ' ', 300); continue; }
      if (await vis('dialog')) { seen.add('대사'); await press('Space', ' ', 100); continue; }
      if (await vis('nextBtn')) { seen.add('다음 버튼'); await t.ev(`document.getElementById('nextBtn').focus(); 1`); await press('Enter', 'Enter', 600); continue; }
      if (await vis('challenge')) {
        seen.add('도전');
        if ((await t.ev(`document.getElementById('chLabel').textContent`)).includes('쓰기')) { seen.add('도구 F'); await press('KeyF', 'f', 700); }
        if ((await t.ev(`document.getElementById('challenge').dataset.kind`)) === 'hold') {
          // 꾹 누르기: Space를 누른 채 표시가 금빛 구간에 들면 뗀다(느린 창이라 게임 시간 배속을 잠시 끈다)
          seen.add('꾹 누르기');
          await t.ev(`__dev.speed = 1; 1`);
          await t.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Space', key: ' ', windowsVirtualKeyCode: 32, text: ' ' });
          for (let j = 0; j < 200; j++) {
            const inz = await t.ev(`(() => { const tr = document.getElementById('chTrack').clientWidth || 1; const m = (parseFloat(document.getElementById('chMark').style.transform.slice(11)) || 0) / tr; const zs = document.getElementById('chZone').style.transform; const a = parseFloat(zs.split('translateX(')[1]) / 100, w = parseFloat(zs.split('scaleX(')[1]); if (!(w > 0)) return false; return m >= a + w * 0.2 && m <= a + w * 0.8; })()`);
            if (inz) break;
            await t.wait(15);
          }
          await t.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Space', key: ' ', windowsVirtualKeyCode: 32 });
          await t.ev(`__dev.speed = 4; 1`);
          await t.wait(400);
          continue;
        }
        await press('Space', ' ', 50);
        continue;
      }
      const now = await t.ev(`JSON.stringify([__dev.mode, document.getElementById('questTitle').textContent, Math.round(__dev.player.position.x*10), Math.round(__dev.player.position.z*10)])`);
      stuck = now === last ? stuck + 1 : 0;
      last = now;
      if (stuck > 400) break; // 대사 없는 연출(창조, 홍수)이 느린 창에서 1분 넘게 이어진다
      await t.ev(`__dev.goNext(); 1`);
      await t.wait(300);
    }
    const errs = await t.ev(`JSON.stringify(__errs.splice(0))`);
    if (!done) { await t.shot(`stuck-${id}`); await boot(t, { ...SAVE, xp: 3000, talents: 300 }); await t.ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message))); __dev.speed = 4; 1`); }
    console.log(`${done ? 'OK' : 'NG'} ${id} [${[...seen].join(', ')}] errs=${errs}${done ? '' : ' 멈춘 곳=' + last}`);
  }
};
