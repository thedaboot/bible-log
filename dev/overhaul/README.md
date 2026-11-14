# 전면 개편 검증 도구

기존 로컬 검증 도구 18개를 저장소에서 실행할 수 있게 옮긴 사본이다. 이후 제품 검증은 이 폴더를 기준으로 수정한다. 예전 `.orchestrator/runtime/ui-overhaul/qa-*`는 당시 기록이며 새 도구의 의존성이 아니다. 테스트 성공 판정과 실제 입력은 바꾸지 않았고, 상대 import와 결과 저장 위치만 옮겼다.

Node와 설치된 Chrome을 사용한다. 모델·API·Codex·Herdr·MCP는 필요 없다. 저장값과 캡처는 전용 Chrome 프로필 및 QA origin에서만 다루며, 결과는 이미 Git에서 제외하는 `dev/shots/overhaul/`에 쓴다.

## 실행

저장소 루트에서 실행한다. PowerShell에서는 아래처럼 `.cmd`를 쓴다. 이미 의존성이 있으면 다시 설치하지 않는다.

```powershell
npm.cmd install
npx.cmd vite --config dev/overhaul/vite.config.mjs
```

두 번째 터미널에서 필요한 검사 하나씩 실행한다. 서버는5174, 사용자 개발 서버는5173이다. 동시에 여러 Chrome을 띄우지 않는다.

```powershell
node dev/overhaul/qa-copy-invariants.mjs
node dev/cdp.mjs 1280 720 dev/overhaul/qa-world-art.mjs dev/shots/overhaul --well-only
node dev/cdp.mjs 390 844 dev/overhaul/qa-world-art.mjs dev/shots/overhaul --well-only
```

1280 우물 검사는 이전에 인물 머리 잘림으로 실패했다. 이관한 도구를 직접 실행한 한 차례는 **같은 카메라 소스에서 통과**했다. 접근 방향·비키는 자리·수렴 시점의 차이일 가능성은 있으나 원인은 미확인이다. 단일 통과로 해결됐다고 보고하지 않고 이전 실패와 조건을 비교한다. 실패를 성공으로 바꾸거나 경계를 완화하지 않는다. 카메라/배우 좌표와 결과 저장까지 이관본의 실제 실행을 확인했다. 아래 첫 방문/전체 스테이지 도구는 아직 완주 검증하지 않았다.

| 검사 파일 (`qa-*.mjs`) | 목적 | 권장 화면 |
|---|---|---|
| world-art | 실제 걷기·배우·그늘·가림 | 1280/390 |
| first-journey | 새 저장·이름·창조·첫 꾸미기 | 1280/390 |
| all-stages | 대사·도전·퀴즈·완료 | 1280/390 |
| story-tool | 물동이·옛 도구·이어하기 | 390/1280 |
| light-transitions | 전환 첫값·반복·중간 요청 | 740 |
| navigation-input | 조이스틱·취소·안전 영역 | 390/844/320 |
| world-pause | 실제 인물·연출 시간 정지 | 1280 |
| challenge-pause | 도전 진행·콜백 정지 | 390/740 |
| challenge-kinds | 도전8종의 실제 성공 | 1280 |
| input-flow | 연타·받기 드래그·취소 | 390/740 |
| record-flows | 상점·지도·소지품·구매 | 320/740/1280 |
| look-name | 꾸미기·이름 입력 계약 | 320/740/1280 |
| preview-lifecycle | 실제3D 미리보기20회 | 390/1280 |
| modal-flow | 쉼터·완료·지도 복귀 | 390/740 |
| ui-structure | 숨김·안전 영역·넘침 | 390/844/768 |
| work-layout | 안내·도전·카드 배치 | 320/740/1280 |
| u1-reduced | 저장/나가기·움직임 줄이기 | 740 |
| copy-invariants | 승인 문구29·다른 데이터 보존 | Node 단독 |

화면 값은 너비다. 세로390×844·320×568, 가로740×360·844×390, PC1280×720을 쓴다. UI 구조의 실제 안전 영역은390과844 프로필에서 주입한다.

```powershell
node dev/cdp.mjs 390 844 dev/overhaul/qa-story-tool.mjs dev/shots/overhaul --basic
node dev/cdp.mjs 1280 720 dev/overhaul/qa-story-tool.mjs dev/shots/overhaul
node dev/cdp.mjs 740 360 dev/overhaul/qa-light-transitions.mjs dev/shots/overhaul
node dev/cdp.mjs 1280 720 dev/overhaul/qa-all-stages.mjs dev/shots/overhaul --stages=hagar,mamre,moriah
node dev/cdp.mjs 1280 720 dev/overhaul/qa-all-stages.mjs dev/shots/overhaul --stages=rebekah,bethel,jabbok
node dev/cdp.mjs 1280 720 dev/overhaul/qa-all-stages.mjs dev/shots/overhaul --stages=joseph,brothers
node dev/cdp.mjs 1280 720 dev/overhaul/qa-all-stages.mjs dev/shots/overhaul --stages=eden,fall,cain
```

`all-stages`는 기본12개 지상 스테이지를 실행한다. `goNext`로 걷는 거리만 건너뛰므로 산 오르기·벽 관통·다리·목적지 도착의 증거가 아니다. 그런 피드백은 실제 키/포인터로 걸어 별도로 확인한다. 창조는 퀴즈가 없는 별도 흐름이라 `first-journey`로 확인한다. 테스트 코드 자체의 실패와 제품 결함을 구분한다.

`copy-invariants`는 Git의0729d43과 `integration-5-approved-copy.json`을 대조한다. 전체 Git 이력이 필요하다. 의도적으로 새 문구를 고쳤다면 원문·변경·근거를 별도로 검토한 뒤 기대값을 명시적으로 갱신한다. 현재 데이터로 기준선을 다시 캡처해 오류를 감추지 않는다.

Chrome 경로가 다르면 `CHROME` 환경 변수에 실제 실행 파일을 지정한다. Node22 CDP의2560 PNG 전송은 과거 연결 종료가 있었다. 정확한 원인은 미확인이다. 설치된 Playwright나 사람이 쓰는 브라우저로 같은 화면을 확인할 수 있지만, 새 모델을 호출하거나 검사 결과를 생략하지 않는다. 기본 도구는 Playwright를 요구하지 않는다.

현재 단위 검사 대부분은 UI1~5 당시 통과했고, 공용3D/원근 변경 뒤 전체 회귀는 남아 있다. Chrome의 기기 흉내를 실제 iOS/PWA·폰FPS·사람의 손맛 검사로 보고하지 않는다. 종료할 때 자신이 띄운5174 프로세스와 전용 Chrome만 정리한다.
