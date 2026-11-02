// 개발 점검용(배포 빌드에 들어가지 않는다): 헤드리스 크롬을 휴대폰·PC 크기로 띄워 스크립트대로 진행하고 캡처한다.
// 브라우저 도구 없이 터미널에서 돌린다. 점검용 서버(5174)를 먼저 띄운다: npx vite --host 127.0.0.1 --port 5174 --strictPort
//   node dev/cdp.mjs <w> <h> <steps.mjs> [outDir]
// steps.mjs는 `export default async ({ ev, shot, wait, tap, key, reload }) => { ... }` 꼴이다.
//   ev(expr)      페이지에서 식을 계산(Promise면 기다림)해 값을 돌려준다
//   shot(name)    outDir/<name>-<w>x<h>.png로 캡처
//   tap(x, y)     터치 한 번(휴대폰 크기일 때), key(code) 키 누르고 떼기
// 휴대폰 크기(w < 900)는 터치 기기로 흉내 낸다(pointer: coarse).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [w, h, stepsFile, outDir = 'dev/shots'] = process.argv.slice(2);
const W = Number(w), H = Number(h), mobile = W < 900;
mkdirSync(outDir, { recursive: true });
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let k = 0; k < 50 && !target; k++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
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
try {
  const steps = (await import(pathToFileURL(resolve(stepsFile)).href)).default;
  await steps({ ev, shot, wait: sleep, tap, key, open, send, W, H });
} catch (e) {
  console.error('ERR', e.message);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
}
