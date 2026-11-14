import assert from 'node:assert/strict';
import {boot,SAVE} from '../steps/_save.mjs';

export default async t=>{
  await boot(t,SAVE);
  await t.ev(`__dev.stop();window.__pauseProbe={progress:0,misses:0,ticks:0};__dev.challenge({title:'멈춤 검증',kind:'hold',hits:99,spots:[{id:'pause-probe',pos:__dev.player.position.clone(),text:'누른 채 멈추기'}],onHold:p=>{__pauseProbe.progress=p;__pauseProbe.ticks++},onMiss:()=>__pauseProbe.misses++});1`);
  for(let i=0;i<60&&await t.ev(`document.getElementById('challenge').hidden`);i++)await t.wait(100);
  assert.equal(await t.ev(`document.getElementById('challenge').hidden`),false);
  await t.send('Input.dispatchKeyEvent',{type:'keyDown',code:'Space',key:' ',windowsVirtualKeyCode:32});await t.wait(500);
  const started=await t.ev(`({...__pauseProbe})`);
  assert.ok(started.progress>0,'hold input did not start before pausing');
  await t.key('Escape');await t.wait(250);
  assert.equal(await t.ev(`document.getElementById('pauseBox').hidden`),false,'pause was not opened during challenge');
  const before=await t.ev(`({...__pauseProbe})`);
  await t.send('Input.dispatchKeyEvent',{type:'keyUp',code:'Space',key:' ',windowsVirtualKeyCode:32});
  await t.wait(3000);
  const after=await t.ev(`({...__pauseProbe})`);
  console.log('paused hold probe',JSON.stringify({started,before,after}));
  await t.shot('challenge-paused');
  assert.equal(after.progress,before.progress,'hold progress changed while paused');
  assert.equal(after.misses,before.misses,'hold missed while paused');
  assert.equal(after.ticks,before.ticks,'scene callback kept running while paused');
  await t.key('Escape');await t.wait(300);
  const resumed=await t.ev(`__pauseProbe.progress`);await t.wait(700);
  assert.equal(await t.ev(`__pauseProbe.progress`),resumed,'released hold input stuck after resume');
  assert.deepEqual(await t.ev(`__e`),[]);
  console.log('PASS challenge pause freezes judgement and scene callback; releasing under pause leaves no held input');
};
