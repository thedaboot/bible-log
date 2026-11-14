import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';

// Production challenge and UI contracts. This does not replace stage walkthroughs.
export default async t=>{
  const bound=async (id,control=false)=>{
    const r=await t.ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect();return {hidden:e.hidden,x:r.x,y:r.y,w:r.width,h:r.height,font:parseFloat(getComputedStyle(e).fontSize)}})()`);
    assert.ok(!r.hidden&&r.w>0&&r.h>0,`${id} not visible`);
    assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.w<=t.W+1&&r.y+r.h<=t.H+1,`${id} clipped: ${JSON.stringify(r)}`);
    if(control)assert.ok(r.w>=44&&r.h>=44,`${id} touch target too small`);
    return r;
  };
  await boot(t,RICH);
  for(const kind of ['time','trace','catch']){
    await t.ev(`__dev.stop();window.__toolCalls=0;__dev.challenge({title:'도전 화면 검증',kind:${JSON.stringify(kind)},hits:99,tool:${kind==='time'?'"jar"':'null'},toolName:'물동이',spots:[{id:'layout-probe',pos:__dev.player.position.clone(),text:'곁에서 함께하기',tool:${kind==='time'}}],onTool:()=>__toolCalls++});1`);
    for(let i=0;i<60&&await t.ev(`document.getElementById('challenge').hidden`);i++)await t.wait(100);
    await t.wait(400);
    await bound('challenge');
    const text=await bound('chLabel');assert.ok(text.font>=15,'challenge copy too small');
    if(kind==='time'){
      await bound('chAct',true);await bound('chTool',true);
      await t.key('KeyF','f');await t.wait(300);await t.key('KeyF','f');await t.wait(150);
      assert.equal(await t.ev(`__toolCalls`),1,'tool action did not run exactly once');
    }else await bound('chPad');
    await t.shot(`work-${kind}-fit`);
  }
  await t.ev(`__dev.stop();import('/src/ui.js').then(m=>{window.__ui=m;m.setGauge('두 사람을 기다리는 중',0.65);return 1})`);
  await t.wait(350);await bound('gauge');await t.shot('work-gauge-fit');
  await t.ev(`__ui.setGauge(null);__ui.setControls('walk');1`);await t.wait(350);
  await bound('controls');await t.shot('work-controls-fit');
  await t.ev(`__ui.setControls(null);Promise.all([import('/src/data/codex.js'),import('/src/glyphs.js')]).then(([{CODEX},{glyph}])=>{const c=CODEX.reduce((a,b)=>a.fact.length>b.fact.length?a:b);window.__cardDone=false;__ui.showCard({title:c.name,text:c.fact,ref:c.ref,count:'도감 108 / 108',pic:glyph('',c.id.split('/')[0])}).then(()=>__cardDone=true);return c.id})`);
  await t.wait(250);await bound('dexCard');await t.shot('work-card-fit');
  await t.key('Escape');await t.wait(100);assert.equal(await t.ev(`__cardDone`),true,'card did not close with Escape');
  assert.equal(await t.ev(`document.getElementById('pauseBox').hidden`),true,'card Escape also opened pause');
  await t.ev(`__ui.showDayTitle('첫째 날');window.__nextDone=false;__ui.waitButton('다음 날로').then(()=>__nextDone=true);1`);
  await t.wait(350);await bound('dayTitle');await bound('nextBtn',true);await t.shot('work-next-fit');
  await t.key('Enter');await t.wait(100);assert.equal(await t.ev(`__nextDone`),true,'next did not resolve');
  await t.ev(`__ui.toast('기쁨이 자랐어요',{gain:true});__ui.toast('레벨 14',{gain:true});__ui.toast('지팡이를 받았어요',{gain:true});1`);
  const messages=new Set();
  for(let i=0;i<45;i++){
    await t.wait(150);
    if(await t.ev(`document.getElementById('toast').hidden`))break;
    await bound('toast');messages.add(await t.ev(`document.getElementById('toast').textContent`));
    if(messages.size===1&&i===1)await t.shot('work-toast-fit');
  }
  assert.equal(messages.size,3,'queued notifications were lost');
  assert.equal(await t.ev(`document.getElementById('toast').hidden`),true,'notifications remained visible');
  assert.deepEqual(await t.ev(`__e`),[],'runtime errors');
  console.log('PASS challenge layouts, tool once, gauge, controls, actual longest codex fact, card Escape, next and queued notifications',JSON.stringify([t.W,t.H]));
};
