import assert from 'node:assert/strict';
import {boot,SAVE} from '../steps/_save.mjs';

export default async t=>{
  await boot(t,SAVE);
  await t.ev(`__dev.auto=true;__dev.speed=4;__dev.run('enoch');1`);
  let ready=false;
  for(let i=0;i<200&&!ready;i++){
    await t.wait(100);
    ready=await t.ev(`(()=>{if(__dev.mode!=='walk'||!__dev.field?.villagers)return false;__dev.auto=false;document.getElementById('pauseBtn').click();return !document.getElementById('pauseBox').hidden})()`);
  }
  assert.ok(ready,'real stage pause setup failed');
  await t.ev(`import('/src/anim.js').then(m=>{window.__anim=m;window.__pauseTween={progress:0,done:false};m.tween(700,p=>__pauseTween.progress=p).then(()=>__pauseTween.done=true);return 1})`);
  const positions=()=>t.ev(`__dev.field.villagers.map(f=>({x:f.position.x,y:f.position.y,z:f.position.z}))`);
  const before=await positions();let drift=0;
  for(let i=0;i<20;i++){
    await t.wait(200);const after=await positions();
    drift=Math.max(drift,...after.map((p,k)=>Math.hypot(p.x-before[k].x,p.y-before[k].y,p.z-before[k].z)));
  }
  console.log('paused village maximum actor drift',drift);
  await t.shot('world-paused');
  assert.ok(drift<0.01,'NPC walkers kept moving while pause was open');
  assert.equal(await t.ev(`__pauseTween.progress`),0,'shared world tween moved under pause');
  assert.equal(await t.ev(`__pauseTween.done`),false,'shared world tween resolved under pause');
  await t.ev(`__anim.setInstant(true);const p=__anim.tween(700,v=>window.__instantProbe=v);__anim.setInstant(false);p.then(()=>window.__instantDone=true);1`);
  assert.equal(await t.ev(`__instantProbe`),1,'instant resume contract broken under pause');
  await t.key('Escape');await t.wait(150);
  const resumed=await t.ev(`__pauseTween.progress`);
  assert.ok(resumed>=0&&resumed<0.9,'world tween jumped over paused time on resume');
  await t.wait(900);assert.equal(await t.ev(`__pauseTween.done`),true,'world tween failed to resume');
  assert.equal(await t.ev(`document.getElementById('pauseBox').hidden`),true,'pause did not close');
  assert.equal(await t.ev(`__anim.isPaused()`),false,'world clock did not resume');
  // The resumed hold quest may finish and enter a normal cutscene. Reach the next walk before opening the journal.
  await t.ev(`__dev.auto=true;1`);
  let recordReady=false;
  for(let i=0;i<200&&!recordReady;i++){
    await t.wait(100);
    recordReady=await t.ev(`(()=>{if(__dev.mode!=='walk')return false;__dev.auto=false;document.getElementById('menuBtn').click();return !document.getElementById('menuBox').hidden})()`);
  }
  assert.ok(recordReady,'journal walking setup failed');
  const recordBefore=await positions();await t.wait(3000);const recordAfter=await positions();
  assert.ok(recordAfter.every((p,k)=>Math.hypot(p.x-recordBefore[k].x,p.y-recordBefore[k].y,p.z-recordBefore[k].z)<0.01),'NPC walkers moved under journal');
  await t.key('Escape');await t.wait(200);
  assert.deepEqual(await t.ev(`__e`),[]);
  console.log('PASS actual stage NPCs and shared tween freeze under pause/journal; tween resumes without jump and instant contract stays intact');
};
