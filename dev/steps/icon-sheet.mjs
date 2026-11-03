// 아이콘 모음(dev/icon-sheet.html) 캡처
export default async ({ open, shot, wait }) => { await open(`${process.env.BASE ?? 'http://127.0.0.1:5183/'}dev/icon-sheet.html`); await wait(800); await shot('icons'); };
