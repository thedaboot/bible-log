export default async ({ open, shot, wait, ev }) => { await open('http://127.0.0.1:5183/dev/art-sheet.html'); await wait(1500); await shot('sheet'); };
