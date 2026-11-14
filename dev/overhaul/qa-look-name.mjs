import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';

export default async t => {
  const tap = async selector => {
    const r=await t.ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    assert.ok(r&&r.x>=0&&r.x<t.W&&r.y>=0&&r.y<t.H,`control offscreen: ${selector}`);
    if(t.W<900)await t.tap(r.x,r.y);
    else for(const type of ['mousePressed','mouseReleased'])await t.send('Input.dispatchMouseEvent',{type,x:r.x,y:r.y,button:'left',clickCount:1});
    await t.wait(350);
  };
  await boot(t,RICH);
  await t.ev(`__dev.state.earthLook=null;__dev.run('babel');1`);
  for(let i=0;i<60&&await t.ev(`document.getElementById('lookForm').hidden`);i++)await t.wait(250);
  assert.equal(await t.ev(`document.getElementById('lookForm').hidden`),false,'real stage did not request earth appearance');
  await tap('#lookTabs .tab:nth-child(2)');
  const pick=await t.ev(`(()=>{const r=Array.from(document.querySelectorAll('#lookForm input[name="hair"]')).find(e=>!e.checked&&!e.disabled);r.closest('label').dataset.qaPick='';return r.value})()`);
  await tap('[data-qa-pick]');
  assert.equal(await t.ev(`document.querySelector('#lookForm input[name="hair"]:checked').value`),pick);
  await t.shot('record-look-fit');
  await tap('#lookSubmit');await t.wait(800);
  assert.equal(await t.ev(`__dev.state.earthLook.hair`),pick,'appearance not applied to game state');
  assert.equal(await t.ev(`JSON.parse(localStorage.getItem('bible-rpg/save/v1')).earthLook.hair`),pick,'appearance not saved');
  assert.equal(await t.ev(`document.getElementById('lookForm').hidden`),true);
  await t.ev(`__dev.auto=true;__dev.speed=4;1`);
  let walking=false;
  for(let i=0;i<180&&!walking;i++){
    await t.wait(250);
    walking=await t.ev(`(()=>{if(__dev.mode!=='walk'||__dev.heaven.group.visible)return false;__dev.auto=false;return true})()`);
  }
  assert.ok(walking,'stage walking setup not reached');
  await t.key('KeyM','m');await t.wait(350);
  await tap('#menuTabs [data-id="inventory"]');
  await tap('[data-key="slot:jar"]');await tap('[data-key="inv:hold"]');
  assert.equal(await t.ev(`__dev.state.earthLook.item`),'jar','earth inventory equip failed');
  await tap('[data-key="inv:drop"]');
  assert.equal(await t.ev(`__dev.state.earthLook.item`),'none','earth inventory drop failed');
  await tap('#menuTabs [data-id="route"]');await t.wait(500);
  assert.equal(await t.ev(`document.querySelectorAll('.map__point').length`),0,'stage journal map permits stage entry');
  await tap('#mapClose');await t.wait(500);
  assert.equal(await t.ev(`document.getElementById('menuBox').hidden`),false,'stage map lost journal origin');
  assert.equal(await t.ev(`document.querySelector('#menuTabs [aria-selected="true"]').dataset.id`),'inventory','map return lost original tab');
  await tap('#menuClose');
  // Test the actual name dialog contract; its caller's save path is unchanged.
  for(const name of ['별<빛"안녕','성경을함께걷는여행자더긴이름']){
    await t.ev(`import('/src/ui.js').then(m=>{window.__nameResult=null;m.askName().then(v=>window.__nameResult=v);return 1})`);await t.wait(300);
    await tap('#nameForm button[type="submit"]');
    assert.equal(await t.ev(`document.getElementById('nameInput').getAttribute('aria-invalid')`),'true','empty name accepted');
    await tap('#nameInput');await t.send('Input.insertText',{text:name});
    const expected=name.slice(0,10);
    assert.equal(await t.ev(`document.getElementById('nameInput').value`),expected,'literal input or maxlength changed');
    await t.shot(name.includes('<')?'record-name-literal-fit':'record-name-long-fit');
    await tap('#nameForm button[type="submit"]');
    assert.equal(await t.ev(`__nameResult`),expected,'name dialog returned changed text');
  }
  assert.deepEqual(await t.ev(`__e`),[],'runtime errors');
  console.log('PASS real stage appearance pick/submit/save, inventory equip/drop, read-only map with original tab return; name dialog validation/literal/limit',JSON.stringify({size:[t.W,t.H],hair:pick}));
};
