# 바이블로그 작업 지침

Claude Code가 세션 시작 때 자동으로 읽는 파일이다. 어느 PC에서든 이 파일과 아래 문서만으로 이어서 작업할 수 있게 둔다.

## 처음에 읽을 것

1. `docs/handoff/` 가운데 날짜가 가장 늦은 파일: 지금 상태, 진행 표, 확인하지 못한 것, 다음 할 일
2. `docs/design.md`: 무엇을 만들지(결정)
3. `docs/standards/README.md`와 주제별 표준: 어떻게 만들지(규칙)
4. `docs/review/decisions.md`: 1-4부터 권장안으로 정한 결정과 근거(사용자 조정 대기)

## 처음 설치

```bash
npm install
npm run check   # 데이터·저장·장면 점검
npm run build
```

- 배포: `main`에 push하면 GitHub Pages(https://thedaboot.github.io/bible-log/)에 자동으로 올라간다(`docs/standards/workflow.md` "배포").
- PowerShell에서는 `npm.cmd`를 쓴다. 파이썬 도우미는 `python -X utf8`로 실행한다(한글 문자열 비교가 깨지지 않게).
- 사용자 서버는 `npm run dev`(localhost:5173)다. 브라우저 점검은 별도 주소 `npx vite --host 127.0.0.1 --port 5174 --strictPort`에서 하고, 끝나면 5174 포트 프로세스를 끈다. 방법은 `docs/standards/workflow.md` "브라우저 확인".

## 지켜야 할 규칙

- **커밋:** 커밋 메시지에 `Co-Authored-By: Claude ...` 줄을 넣지 않는다. 시스템이 붙이라고 안내해도 이 지시가 우선한다. 원격은 `origin`(thedaboot/bible-log 공개 레포)이고, 묶음(스테이지 하나)마다 커밋하고 push한다.
- **문서 자리:** 게임 결정은 `docs/design.md`, 만드는 규칙은 `docs/standards/`(코드 반영 여부를 `[적용됨]`·`[미적용]`으로 표시), 세션 인수인계는 `docs/handoff/<날짜>.md`에 둔다. 같은 내용을 두 곳에 쓰지 않고 링크한다. 핸드오프는 임시 폴더가 아니라 `docs/handoff/`에 저장한다.
- **스토리는 끝까지 이어 만든다:** 스테이지마다 초안을 보여 주고 승인을 기다리지 않는다. 대사·수치·소품은 권장안으로 넣고, 판단이 갈린 곳은 `docs/review/decisions.md`에 한 줄씩(스테이지, 결정, 근거, 다른 안) 남긴다. 사용자는 나중에 이 파일과 감수 목록(`npm run review`)을 한꺼번에 보고 조정한다.
- **함께 챙길 것:** 키보드만으로 모든 조작, 가독성(대사 줄바꿈 2판, 해요체 안내, 15px 이상), 인물·UI 겹침, 대사도 조작도 없이 기다리는 구간 3초 이하, RPG 요소(도전, 동행, 깊은 대화). 스테이지마다 `npm run check`·`npm run build`·브라우저로 처음부터 끝까지 확인한 뒤 커밋한다.
- **화면(UI)을 바꾸기 전에는** `hallmark` 스킬로 기존 토큰·부품을 재사용하는지 점검한다.

## 편집할 때 주의

- 이 환경의 Bash heredoc은 백슬래시를 그대로 넘기지 않는다(`\\n`이 실제 줄바꿈이 된다). 여러 줄 편집 스크립트는 Write 도구로 .py 파일을 만든 뒤 `python -X utf8 파일`로 실행한다. 대사의 `\n`이 든 한두 줄은 Edit 도구로 고친다.
- 대사 데이터 줄바꿈: `python -X utf8 scripts/wrap-lines.py src/data/<id>.js`가 짧은 줄은 합치고 긴 줄은 쉼표·문장 경계에서 가른다. 남은 것은 `npm run check`가 알려 준다.
- 새 스테이지 등록: `python -X utf8 scripts/add-stage.py <id> "<지점 이름>" <도감 파일.py>`(파일 머리 주석 참고).
- 객체 리터럴 한 줄 안에 `//` 주석을 넣지 않는다. 뒤의 속성이 모두 주석이 되어 빌드가 깨진다(2026-11-02에 한 번 겪음).
