// 첫 방문: 처음부터 → 프롤로그 첫 대사, 대천사 대사, 이름 입력
export default async ({ ev, shot, wait, open }) => {
  const base = process.env.BASE ?? 'http://127.0.0.1:5174/';
  await open(base);
  await ev('localStorage.clear()');
  await open(base);
  await wait(1500);
  await ev(`[...document.querySelectorAll('.menu__item')].find(b => b.textContent.includes('처음'))?.click()`);
  await wait(4500);
  await shot('s01-first');
  const next = async (n) => { for (let k = 0; k < n; k++) { await ev(`document.getElementById('dialog').click()`); await wait(120); await ev(`document.getElementById('dialog').click()`); await wait(200); } };
  for (let k = 0; k < 12; k++) {
    if (await ev(`!document.getElementById('nameForm').hidden`)) break;
    await next(1);
  }
  await wait(600);
  await shot('s02-name');
  await ev(`document.getElementById('nameInput').value='준석'; document.getElementById('nameForm').requestSubmit()`);
  await wait(1500);
  await shot('s03-look');
  await ev(`document.getElementById('lookSubmit').click()`);
  await wait(1500);
  for (let k = 0; k < 12; k++) {
    const t = await ev(`document.getElementById('line').textContent`);
    if (t.includes('지켜보는')) break;
    await next(1); await wait(300);
  }
  await wait(1500);
  await shot('s05-angel');
};
