export default async ({ ev, wait, open }) => {
  await open('http://127.0.0.1:5174/');
  await wait(1000);
  console.log(await ev(`document.documentElement.className + ' | ' + document.getElementById('fade').style.opacity`));
  console.log(await ev(`import('/src/main.js').then(()=>'ok').catch(e=>String(e.stack||e))`));
};
