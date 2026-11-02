import { boot, next } from './_save.mjs';
export default async (t) => {
  await boot(t);
  await t.ev(`__dev.interludeOf('noah'); 1`);
  for (let k = 0; k < 30; k++) { if (await t.ev(`!document.getElementById('choices').hidden`)) break; await next(t); }
  await t.wait(800);
  await t.shot('s21-choice');
  console.log(await t.ev(`JSON.stringify(__e)`));
};
