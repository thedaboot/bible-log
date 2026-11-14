import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {boot,SAVE} from '../steps/_save.mjs';

export default async t=>{
  await boot(t,SAVE);
  await t.ev(`__dev.auto=true;__dev.speed=4;__dev.run('enoch');1`);
  let ready=false;
  for(let i=0;i<240&&!ready;i++){
    await t.wait(100);
    ready=await t.ev(`(()=>{if(__dev.mode!=='walk'||!__dev.field?.hemi)return false;__dev.auto=false;__dev.stop();return true})()`);
  }
  assert.ok(ready,'real field setup not reached');
  await t.ev(`import('/src/anim.js').then(m=>{window.__lightAnim=m;return 1})`);
  const phases=[],errors=[];
  const near=(a,b)=>['sun','hemi','sky'].every(k=>a[k].every((v,i)=>Math.abs(v-b[k][i])<1e-6))&&Math.abs(a.sunPower-b.sunPower)<1e-6&&Math.abs(a.hemiPower-b.hemiPower)<1e-6;
  const lights=`(()=>{const f=__dev.field;return {sun:f.sun.color.toArray(),sunPower:f.sun.intensity,hemi:f.hemi.color.toArray(),hemiPower:f.hemi.intensity,sky:f.group.parent.background.toArray()}})()`;
  async function change(action){
    // Freeze the shared tween clock for this synchronous sample so the first step is exactly p=0, not a few microseconds later.
    const pair=await t.ev(`(()=>{__lightAnim.setPaused(true);try{const read=()=>${lights};const before=read();window.__lightDone=false;__dev.field.acts.${action}().then(()=>__lightDone=true);return {before,after:read()}}finally{__lightAnim.setPaused(false)}})()`);
    const jump=Math.max(...['sun','hemi','sky'].flatMap(k=>pair.before[k].map((v,i)=>Math.abs(v-pair.after[k][i]))),Math.abs(pair.before.sunPower-pair.after.sunPower),Math.abs(pair.before.hemiPower-pair.after.hemiPower));
    if(jump>1e-5)errors.push(`${action} changes light at p=0 by ${jump}`);
    for(let i=0;i<100&&!await t.ev('__lightDone');i++)await t.wait(100);
    assert.equal(await t.ev('__lightDone'),true,`${action} transition never finished`);
    const end=await t.ev(lights);
    for(const n of [...end.sun,end.sunPower,...end.hemi,end.hemiPower])assert.ok(Number.isFinite(n)&&n>=0,`${action} invalid light`);
    phases.push({action,jump,before:pair.before,end});
    console.log('light transition',JSON.stringify({action,jump,end}));
    return end;
  }
  const day=await change('day');
  for(let round=0;round<2;round++){
    await change('dusk');await t.shot(`light-${round}-dusk`);
    const night=await change('night');await t.shot(`light-${round}-night`);
    assert.ok(night.sunPower+night.hemiPower>0,'night extinguished all actor light');
    const restored=await change('day');
    assert.ok(near(restored,day),'day/night cycles accumulate color/intensity damage');
  }
  // A new request starts from the current intermediate light, and remains the last request after the old tween ends.
  await t.ev('__dev.field.acts.night();1');await t.wait(650);
  const restored=await change('day');await t.wait(400);
  assert.ok(near(restored,day),'interrupting night failed to restore the daylight target');
  assert.ok(near(await t.ev(lights),day),'an older transition overwrote the latest lighting request');
  assert.deepEqual(await t.ev('__e'),[]);
  fs.writeFileSync(new URL(`../shots/overhaul/light-transitions-${process.argv.includes('--before')?'before':'after'}-${t.W}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),phases,errors},null,2)+'\n');
  assert.deepEqual(errors,[],'lighting transitions contain an initial color jump');
  console.log('PASS continuous p=0 light, two day/dusk/night cycles and interrupted transition');
};
