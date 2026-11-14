import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';
import {playOnce,keys} from '../steps/_games.mjs';

export default async t=>{
  const {press,send}=keys(t), legacy=process.argv.includes('--basic')?[]:['sling','horn','lamp','net'];
  const read=expr=>t.ev(expr);
  const click=async selector=>{
    const r=await read(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    assert.ok(r&&r.x>=0&&r.y>=0&&r.x<t.W&&r.y<t.H,`unreachable ${selector}`);
    if(t.W<900)await t.tap(r.x,r.y);
    else for(const type of ['mousePressed','mouseReleased'])await t.send('Input.dispatchMouseEvent',{type,x:r.x,y:r.y,button:'left',clickCount:1});
    await t.wait(300);
  };
  const status=`({mode:__dev.mode,quest:document.getElementById('quest').textContent,ch:!document.getElementById('challenge').hidden,dialog:!document.getElementById('dialog').hidden,tools:[...__dev.state.items.tools],hand:__dev.state.earthLook.item,resume:__dev.state.resume})`;
  async function until(condition){
    for(let i=0;i<900;i++){
      const current=await read(`({reached:(${condition}),status:${status}})`);
      if(current.reached)return;
      const s=current.status;
      assert.deepEqual(await read('__e'),[]);
      assert.ok(!s.ch,`unexpected challenge while waiting for ${condition}: ${JSON.stringify(s)}`);
      if(await read(`!!document.querySelector('#choices:not([hidden]) button')`))await press('Digit1',100);
      else if(s.dialog)await press('Space',120);
      else if(await read(`!document.getElementById('dexCard').hidden||!document.getElementById('nextBtn').hidden`))await press('Space',120);
      else if(s.mode==='walk')await read('__dev.goNext();1');
      await t.wait(80);
    }
    throw Error(`story did not reach expected state: ${JSON.stringify(await read(status))}`);
  }
  const snapshot=()=>read(`(()=>{dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem('bible-rpg/save/v1'))})()`);
  const snapshots=[];
  await boot(t,{...RICH,xp:270,items:{tools:legacy,looks:['staff','bag']},earthLook:{...RICH.earthLook,item:legacy.length?'sling':'none'}});
  await read(`__dev.auto=false;__dev.speed=4;__dev.run('rebekah');1`);
  await until(`__dev.mode==='walk'&&document.getElementById('questItems').textContent.includes('늙은 종')`);
  snapshots.push({phase:'before',save:await snapshot(),expected:[...legacy]});
  await press('KeyM',400);await click('#menuTabs [data-id="inventory"]');
  if(legacy.length){
    assert.equal(await read('__dev.state.earthLook.item'),'sling','old held tool was silently discarded');
    await click('.inv__cats .chip:nth-child(1)');await click('[data-key="slot:sling"]');
    assert.ok(await read(`document.querySelector('.inv__detail').textContent.includes('보관')&&document.querySelector('.inv__detail').textContent.includes('쓰는 곳이 없어요')`),'unused old tool is presented as a current quest tool');
    await click('[data-key="inv:drop"]');
    assert.equal(await read(`!!document.querySelector('[data-key="inv:hold"]')`),false,'unused tool can be newly equipped');
  }else assert.equal(await read(`document.querySelector('.inv__cats').hidden`),true,'empty tools category still shown');
  assert.deepEqual(await read('__dev.state.items.tools'),legacy,'inventory changed owned tool records');
  await t.shot('story-tool-inventory-before');await click('#menuClose');
  await until(`__dev.mode==='walk'&&document.getElementById('questItems').textContent.includes('물 긷기')`);
  assert.deepEqual(await read('__dev.state.items.tools'),[...legacy,'jar'],'required story tool was not granted at full capacity');
  await t.wait(800);
  assert.equal(await read('__dev.state.earthLook.item'),'jar');
  await t.shot('story-tool-granted');
  for(let i=0;i<3;i++){
    if(i>0)await until(`__dev.mode==='walk'&&document.getElementById('questItems').textContent.includes('물 긷기')&&document.getElementById('questTitle').textContent.includes('${i+1} / 3')`);
    if(i===1)snapshots.push({phase:'between',save:await snapshot(),expected:[...legacy,'jar']});
    await until(`!document.getElementById('challenge').hidden`);
    assert.equal(await read(`document.getElementById('chTool').hidden`),true,'non-F story action exposed the tool button');
    // Change the actual equipped item through the real journal while the pour is waiting.
    await press('KeyM',400);await click('#menuTabs [data-id="inventory"]');
    if(i===0){
      await click('[data-key="slot:jar"]');
      assert.ok(await read(`document.querySelector('.inv__detail').textContent.includes('쓰는 곳')&&document.querySelector('.inv__detail').textContent.includes('구유')`),'tool has no concrete usage');
      await click('[data-key="inv:drop"]');
    }else{
      await click('.inv__cats .chip:nth-child(2)');
      await click('[data-key="slot:staff"]');await click('[data-key="inv:hold"]');
    }
    await click('#menuClose');
    assert.notEqual(await read('__dev.state.earthLook.item'),'jar');
    // Real hold input must restore the owned jar before drawing a visible stream.
    await read('__dev.speed=0.4;1');await t.wait(400);
    await send('Space','keyDown');await t.wait(500);
    assert.equal(await read('__dev.state.earthLook.item'),'jar','pour did not restore the owned jar');
    const physical=await read(`(()=>{const f=__dev.player;const water=f.getObjectByName('jarWater');return {water:!!water&&water.visible,level:__dev.field.camels[${i}].pour.level,hand:!!f.userData.hold?.[1]}})()`);
    console.log('physical pour',JSON.stringify({trough:i,...physical}));
    if(!(physical.hand&&physical.level>0))await t.shot('story-tool-physical-failed');
    assert.ok(physical.hand&&physical.level>0&&physical.water,'actual pour animation did not run');
    await t.shot(`story-tool-pouring-${i}`);
    await send('Space','keyUp');await t.wait(500);
    // The first probe can be an early/late release. Finish the same actual challenge via its normal keys.
    for(let attempt=0;attempt<5&&!await read(`__dev.field.camels[${i}].pour.full`);attempt++)await playOnce(t,'hold');
    assert.equal(await read(`__dev.field.camels[${i}].pour.full`),true,`trough ${i} never filled`);
    await read('__dev.speed=4;1');
    await t.wait(900);
    if(i<2)assert.deepEqual(await read('__dev.state.items.tools'),[...legacy,'jar'],'tool consumed too soon or duplicated');
  }
  await until(`__dev.mode==='walk'&&__dev.state.claimed.includes('rebekah/water-done')`);
  assert.deepEqual(await read('__dev.state.items.tools'),legacy,'consumption changed old tools or left the jar');
  assert.equal(await read('__dev.state.earthLook.item'),'none','consumed jar remains in hand');
  snapshots.push({phase:'after',save:await snapshot(),expected:[...legacy]});
  await t.shot('story-tool-consumed');
  for(const checkpoint of snapshots){
    await boot(t,checkpoint.save);
    for(let i=0;i<240&&!(await read(`__dev.mode==='walk'&&!__dev.heaven.group.visible&&Number(document.getElementById('fade').style.opacity)<0.01`));i++)await t.wait(150);
    const s=await read(status);
    assert.equal(s.mode,'walk',`${checkpoint.phase}: resume did not reach play`);
    assert.deepEqual(s.tools,checkpoint.expected,`${checkpoint.phase}: replay duplicated/removed tools`);
    if(checkpoint.phase==='between')assert.equal(s.hand,'jar','middle resume did not hold the jar');
    if(checkpoint.phase==='after')assert.equal(s.hand,'none','completed resume re-equipped the consumed jar');
    assert.deepEqual(await read('__e'),[]);
    console.log('PASS story-tool resume',checkpoint.phase,JSON.stringify(s));
  }
  fs.writeFileSync(new URL(`../shots/overhaul/integration-5-tool-${legacy.length?'legacy':'basic'}-${t.W}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),legacy,snapshots:snapshots.map(({phase,save,expected})=>({phase,resume:save.resume,expected})),passed:true},null,2)+'\n');
  console.log('PASS actual story grant/draw/pour/put-away/cosmetic-switch/consume/resume; original tools preserved',JSON.stringify({size:[t.W,t.H],legacy}));
};
