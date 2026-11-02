# 작업 방식 표준

## 문서

- 게임의 결정은 `docs/design.md`, 만드는 규칙은 `docs/standards/`, 세션 인수인계는 `docs/handoff/`에 둔다. 같은 내용을 두 곳에 쓰지 않고 서로 링크한다.
- 새 규칙이나 기준이 생기면 그 자리에서 `docs/standards/`의 해당 문서에 추가한다. 코드에 반영하기 전이면 `[미적용]`으로 표시한다.

## 점검

- 코드를 바꾸면 `npm run check`(데이터·저장·하늘 점검)와 `npm run build`를 둘 다 통과시킨다.
- 새로운 규칙이 데이터로 점검 가능하면 `scripts/check-data.mjs`에 넣는다(예: 줄바꿈, 이름표, 꾸미기 기본값).

## 성장 수치와 저장

- 성장 수치, 보상, 도감, 저장 형식 규칙은 [growth.md](growth.md)에 모은다.

## 배포

- `main`에 push하면 GitHub Actions(`.github/workflows/pages.yml`)가 `npm run check`·`npm run build` 뒤 GitHub Pages에 올린다. 주소: https://thedaboot.github.io/bible-log/ (휴대폰에서도 열린다)
- 빌드는 상대 경로(`vite.config.js`의 `base: './'`)라 하위 경로에서 열린다. `index.html`의 파일 경로도 `./`로 쓴다.
- 배포 결과는 `gh run list --limit 1`로 본다. 점검이 실패하면 배포되지 않는다.

## 브라우저 확인

- 화면 크기별 점검은 `dev/mobile.html?w=390&h=844`(세로), `?w=740&h=360`(가로), `?w=1280&h=720`(PC)에서 한다. 게임을 틀(iframe)에 띄우고 `go`·`step`·`finish`·`imp` 도우미로 진행하고 캡처한다(파일 머리 주석). 배포 빌드에는 들어가지 않는다.

- 사용자의 저장값을 건드리지 않도록, 확인은 별도 주소의 점검용 서버에서 한다. 저장소는 주소(origin)마다 따로 있다.
- 저장값이 없는 첫 방문도 따로 본다(점검용 서버에서 `localStorage.clear()` 뒤 첫 화면부터). 저장이 있는 브라우저에서만 보면 첫 방문 버그가 숨는다(2026-11-02 '처음부터'가 멈춘 일).
  - 실행: `npx vite --host 127.0.0.1 --port 5174 --strictPort`
  - 사용자 서버는 `npm run dev`(`localhost:5173`)이고 IPv6로만 열려서 `127.0.0.1`과 섞이지 않는다.
  - 끝나면 점검용 서버를 끈다. 백그라운드 작업을 멈춰도 node가 남을 수 있으니 5174 포트를 쓰는 프로세스를 확인해서 끈다.
- 개발 서버에서만 `globalThis.__dev`(player, eden, mode)로 캐릭터를 순간 이동시켜 퀘스트를 빠르게 확인할 수 있다. 배포 빌드에는 빠진다.
- 자동화 브라우저 창은 화면 갱신이 초당 2회 정도로 느리다. 걸어서 확인하지 말고 순간 이동으로 확인한다. 시간 기반 연출(`tween`)은 정상 속도로 돈다.
  - 브라우저 도구의 스크립트 실행은 45초에 끊긴다. 스테이지를 처음부터 돌리는 긴 점검은 `window.__run = (async () => {…})()`처럼 기다리지 않고 시작한 뒤, 진행 단계(`window.__step`)를 따로 읽는다.
  - 머무르기 게이지는 프레임 수로 차서(게임 시간 1.2초 = 약 24프레임) 자동화 창에서는 양 한 마리에 15초 남짓 걸린다. 시간 제한을 두지 말고 끝날 때까지 기다린다.
  - 1-3은 `__dev.cain`(장면), `__dev.state`(저장값), `__dev.cainInterlude()`(막간만)로 확인한다.
  - 1-4부터는 `__dev.run('<스테이지>')`로 바로 시작하고, `__dev.auto = true`면 대사를 넘기고 첫 선택지·퀴즈 정답을 고르고 목표로 순간 이동하며 도전을 성공시킨다(자동 플레이). `__dev.speed = 4`는 걷기·동물 같은 게임 시간을 4배로 앞당긴다. 장면은 `__dev.field`, 막간만은 `__dev.interludeOf('<스테이지>')`.
  - 자동 플레이는 사람의 손을 대신할 뿐이라 화면(겹침, 가독성)은 중간중간 캡처해서 본다. 키보드 조작은 브라우저 도구의 실제 키 입력으로 따로 본다.
  - `__dev.pauseAt = '대사 일부'`를 주면 그 대사가 나올 때 자동 플레이가 멈춘다. 멈춘 화면을 캡처한 뒤 다시 `__dev.auto = true`로 이어 간다.
  - 2026-11-02 세션에서 쓴 시작 코드다. 페이지를 새로 고친 뒤 실행하고, 45초 제한을 넘기지 않게 진행은 `__st()`로 따로 읽는다.

    ```js
    // 1) 저장값 넣기(1-3까지 마친 상태, 지상 모습 있음). 넣은 뒤 location.reload()
    localStorage.setItem('bible-rpg/save/v1', JSON.stringify({ name: '요한', look: { color: 'sky', hair: 'short', outfit: 'tunic' },
      earthLook: { skin: 's2', height: 'mid', aura: 'sky', hair: 'short', hairColor: 'darkbrown', beard: 'none', outfit: 'tunic', outfitColor: 'linen', item: 'none' },
      scene: 'cain', unlocked: ['prologue', 'creation-1', 'eden', 'fall', 'cain'], xp: 270, talents: 60, spirit: { joy: 6, faith: 6 },
      bonds: {}, codex: {}, items: { tools: [], looks: [] }, claimed: ['creation/clear', 'eden/clear', 'cain/clear'], learned: ['walk', 'look'] }));
    // 2) 첫 화면에서 이어하기 → 쉼터 → 스테이지 바로 시작. pause는 멈출 대사(없으면 null)
    window.__start = async (id, pause) => {
      [...document.querySelectorAll('.menu__item')].find((b) => b.textContent === '이어하기').click();
      await new Promise((r) => setTimeout(r, 2000));
      window.__errs = [];
      addEventListener('error', (e) => __errs.push(String(e.message)));
      addEventListener('unhandledrejection', (e) => __errs.push(String(e.reason?.stack || e.reason)));
      Object.assign(__dev, { speed: 4, pauseAt: pause, auto: true });
      __dev.run(id);
    };
    window.__go = (pause) => Object.assign(__dev, { pauseAt: pause, auto: true });
    window.__st = () => JSON.stringify({ auto: __dev.auto, mode: __dev.mode, errs: __errs,
      quest: document.getElementById('questTitle').textContent, line: document.getElementById('line').textContent,
      claimed: __dev.state.claimed.filter((c) => c.startsWith(__dev.state.scene)).slice(-4) });
    __start('noah', null); // 끝나면 claimed에 '<스테이지>/clear'가 생기고 쉼터로 돌아온다
    ```
- 걷기·동물 움직임은 프레임마다 `dt`(최대 0.05초)만큼만 진행해서, 자동화 창에서는 실제 시간의 10분의 1 정도로 느리다. 움직임을 확인할 때는 `__dev.eden.update(0.05, t, __dev.player.position)`을 여러 번 불러 시간을 앞당긴다.
- 짧은 시간 연출(`tween`)의 중간 모습을 캡처하려면 `performance.now`를 잠시 느리게 바꾼다(예: 실제의 0.08배). 확인이 끝나면 원래 함수로 돌려놓는다.
- 같은 이유로 CSS 애니메이션 시계가 0에 멈춰 있을 수 있다. 효과의 중간·끝 모습은 `el.getAnimations({ subtree: true })`로 `currentTime`을 정하거나 `finish()`를 부른 뒤 캡처한다. 알림(`toast`)은 2.2초 뒤 사라지므로 도구 호출 사이에 사라질 수 있다.
- 휴대폰 폭은 같은 페이지를 375px·320px iframe에 띄워 확인한다.

## 보고

- 주장마다 확인 수준(실측 / 확인 가능 / 미확인)을 적는다. 확인하지 못한 것은 확인하지 못했다고 적는다.
