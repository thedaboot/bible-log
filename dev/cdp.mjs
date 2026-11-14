// 개발 점검용(배포 빌드에 들어가지 않는다): 헤드리스 크롬을 휴대폰·PC 크기로 띄워 스크립트대로 진행하고 캡처한다.
// 브라우저 도구 없이 터미널에서 돌린다. 점검용 서버(5174)를 먼저 띄운다: npx vite --host 127.0.0.1 --port 5174 --strictPort
//   node dev/cdp.mjs <w> <h> <steps.mjs> [outDir]
// steps.mjs는 `export default async ({ ev, shot, wait, tap, key, reload }) => { ... }` 꼴이다.
//   ev(expr)      페이지에서 식을 계산(Promise면 기다림)해 값을 돌려준다
//   shot(name)    outDir/<name>-<w>x<h>.png로 캡처
//   tap(x, y)     터치 한 번(휴대폰 크기일 때), key(code) 키 누르고 떼기
// 휴대폰 크기(w < 900)는 터치 기기로 흉내 낸다(pointer: coarse).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [w, h, stepsFile, outDir = 'dev/shots'] = process.argv.slice(2);
const W = Number(w), H = Number(h), mobile = W < 900;
mkdirSync(outDir, { recursive: true });
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
try {
let target;
const readyBy = Date.now() + 10000;
while (!target && Date.now() < readyBy) {
  await sleep(200);
  try {
    const port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
    target = (await (await fetch(`http://127.0.0.1:${port}/json`, {signal:AbortSignal.timeout(1000)})).json()).find((t) => t.type === 'page');
  } catch {}
}
if (!target) throw new Error('Chrome CDP target did not become ready');
ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('CDP connection timed out')), 10000);
  ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
  ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
});
let id = 0;
const pending = new Map();
const disconnected = () => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('CDP connection closed')); } pending.clear(); };
ws.addEventListener('close', disconnected);
ws.addEventListener('error', disconnected);
ws.onmessage = (m) => { const d = JSON.parse(m.data), p = pending.get(d.id); if (p) { clearTimeout(p.timer); pending.delete(d.id); p.resolve(d); } };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  if (ws.readyState !== WebSocket.OPEN) return reject(new Error('CDP connection closed'));
  const n = ++id;
  const timer = setTimeout(() => { pending.delete(n); reject(new Error(`CDP response timed out: ${method}`)); }, 30000);
  pending.set(n, { resolve, reject, timer });
  ws.send(JSON.stringify({ id: n, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile });
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
  return r.result?.result?.value;
};
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = join(outDir, `${name}-${W}x${H}.png`);
  writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  console.log('shot', file);
};
const tap = async (x, y) => {
  for (const type of ['touchStart', 'touchEnd']) await send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
};
const key = async (code, k = code) => {
  for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: { Space: 32, Enter: 13, Escape: 27 }[code] ?? 0 });
};
const open = async (url) => { await send('Page.navigate', { url }); await sleep(2500); };
  const steps = (await import(pathToFileURL(resolve(stepsFile)).href)).default;
  await steps({ ev, shot, wait: sleep, tap, key, open, send, W, H });
} catch (e) {
  console.error('ERR', e.message);
  process.exitCode = 1;
} finally {
  ws?.close();
  chrome.kill();
}
