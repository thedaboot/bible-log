// 이어하기 지점으로 바로 갈 때 앞 장면의 연출을 순식간에 끝내기 위한 스위치.
let instant = false;
export function setInstant(on) { instant = on; }

// 월드 시간 멈춤(2026-11-14: 멈춤 화면과 기록장이 열린 동안, main.js haltChallenge가 켜고 끈다).
// tween은 장면의 움직임(걷기 연출, 기다림 field.acts.wait, 등장 효과)에 쓰인다. 멈춘 동안에는 진행값이 제자리에 머물고,
// 풀리면 멈춘 시간만큼을 빼고 그 자리에서 이어 간다(건너뛰지 않는다). instant(이어하기 앞 연출 건너뛰기)의 계약은 그대로다.
// 화면 전환(CSS, ui.js fade의 setTimeout)과 기록장의 내 모습 미리보기는 이 시계를 쓰지 않으므로 멈추지 않는다.
let paused = false, pausedAt = 0, lost = 0;
const now = () => (paused ? pausedAt : performance.now()) - lost;
export function setPaused(on) {
  if (on === paused) return;
  if (on) pausedAt = performance.now();
  else lost += performance.now() - pausedAt;
  paused = on;
}
export const isPaused = () => paused;

// ms 동안 fn(0~1)을 매 프레임 호출한다. instant면 바로 fn(1)만 호출한다.
export function tween(ms, fn) {
  if (instant || ms <= 0) { fn(1); return Promise.resolve(); }
  return new Promise((resolve) => {
    const start = now();
    const step = () => {
      const p = Math.min(1, (now() - start) / ms);
      fn(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    step();
  });
}

export const easeOut = (p) => 1 - (1 - p) ** 3;
export const wait = (ms) => (instant ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
export const isInstant = () => instant;
// 0~1 진행값 p에서 delay부터 len 동안 0→1로 오르는 값 (여러 물체를 차례로 등장시킬 때 쓴다)
export const stagger = (p, delay, len = 0.4) => Math.min(1, Math.max(0, (p - delay) / len));
// 끝에서 살짝 넘쳤다가 자리 잡는다(제단·샘처럼 새로 나타나는 물체가 툭 놓이는 느낌)
export const easeBack = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
