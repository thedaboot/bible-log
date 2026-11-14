import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {keys} from '../steps/_games.mjs';

export default async t=>{
  const {press,send}=keys(t), base=process.env.BASE??'http://127.0.0.1:5174/';
  await t.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__e=[];addEventListener('error',e=>__e.push(e.message));addEventListener('unhandledrejection',e=>__e.push(String(e.reason?.stack||e.reason)));`});
  await t.open(base);await t.ev('localStorage.clear();1');await t.open(base);
  for(let i=0;i<100&&!await t.ev(`!!document.querySelector('.menu__item')`);i++)await t.wait(100);
  assert.equal(await t.ev(`document.activeElement?.textContent`),'처음부터');
  await press('Enter',500);
  await t.ev('__dev.auto=false;__dev.speed=4;1');
  for(let i=0;i<200&&await t.ev(`document.getElementById('nameForm').hidden`);i++){
    if(await t.ev(`!document.getElementById('dialog').hidden`))await press('Space',100);
    else await t.wait(100);
  }
  assert.equal(await t.ev(`document.getElementById('nameForm').hidden`),false,'first visit never requested a name');
  assert.equal(await t.ev(`document.activeElement.id`),'nameInput');
  const name='느린길';
  await t.send('Input.insertText',{text:name});await press('Enter',500);
  assert.equal(await t.ev(`document.getElementById('lookForm').hidden`),false,'heaven appearance did not follow name entry');
  await t.shot('fresh-heaven-look');
  const submitLook=async()=>{
    for(let i=0;i<80&&await t.ev(`document.activeElement?.id!=='lookSubmit'`);i++)await press('Tab',30);
    assert.equal(await t.ev(`document.activeElement.id`),'lookSubmit','appearance submit not keyboard reachable');
    await press('Enter',700);
  };
  await submitLook();
  const held=new Set(),days=new Set();let reachedCreation=false,clear=false;
  for(let i=0;i<2400&&!clear;i++){
    const s=await t.ev(`({mode:__dev.mode,scene:__dev.state.scene,name:__dev.state.name,dialog:!document.getElementById('dialog').hidden,next:!document.getElementById('nextBtn').hidden,clear:!document.getElementById('clearBox').hidden,look:!document.getElementById('lookForm').hidden,p:{x:__dev.player.position.x,z:__dev.player.position.z},gate:{x:__dev.heaven.gatePos.x,z:__dev.heaven.gatePos.z}})`);
    assert.deepEqual(await t.ev('__e'),[]);
    assert.equal(s.name,name);
    if(s.scene.startsWith('creation-')){
      reachedCreation=true;
      if(!days.has(s.scene)){
        days.add(s.scene);
        if(['creation-3','creation-5','creation-6','creation-7'].includes(s.scene))await t.shot(`fresh-${s.scene}`);
      }
    }
    const desired=new Set();
    if(!reachedCreation&&s.mode==='walk'){
      // Actual walking keys in the game's fixed quarter-view basis; no teleport/goNext.
      const dx=s.gate.x-s.p.x,dz=s.gate.z-s.p.z,r=dx-dz,f=-dx-dz;
      if(Math.abs(r)>0.25)desired.add(r>0?'KeyD':'KeyA');
      if(Math.abs(f)>0.25)desired.add(f>0?'KeyW':'KeyS');
    }
    for(const code of held)if(!desired.has(code)){await send(code,'keyUp');held.delete(code);}
    for(const code of desired)if(!held.has(code)){await send(code,'keyDown');held.add(code);}
    if(s.clear){clear=true;break;}
    if(s.dialog||s.next)await press('Space',100);
    else await t.wait(100);
  }
  for(const code of held)await send(code,'keyUp');
  assert.ok(clear,'fresh journey did not reach creation completion');
  assert.equal(days.size,7,'fresh player did not see all seven creation days');
  assert.ok(await t.ev(`__dev.state.claimed.includes('creation/clear')&&__dev.state.unlocked.includes('eden')`));
  await t.shot('fresh-creation-complete');
  // Follow the actual completion button into first-time earth appearance.
  const next=await t.ev(`(()=>{const e=document.getElementById('clearGo');if(!e||e.hidden)return null;e.focus();return document.getElementById('clearNextTitle').textContent})()`);
  assert.ok(next,'creation completion has no next-stage action');
  await press('Enter',600);
  for(let i=0;i<200&&await t.ev(`document.getElementById('lookForm').hidden`);i++){
    if(await t.ev(`!document.getElementById('dialog').hidden`))await press('Space',100);else await t.wait(100);
  }
  assert.equal(await t.ev(`document.getElementById('lookForm').hidden`),false,'first earth appearance did not open');
  await t.shot('fresh-earth-look');await submitLook();
  const saved=await t.ev(`JSON.parse(localStorage.getItem('bible-rpg/save/v1'))`);
  assert.equal(saved.name,name);assert.ok(saved.earthLook,'first earth appearance not saved');
  assert.deepEqual(await t.ev('__e'),[]);
  fs.writeFileSync(new URL(`../shots/overhaul/first-journey-${t.W}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),size:[t.W,t.H],days:[...days],name:saved.name,earthLook:saved.earthLook,passed:true},null,2)+'\n');
  console.log('PASS fresh keyboard name/heaven look/actual gate walk/seven creation days/completion/first earth look/save',JSON.stringify({size:[t.W,t.H],days:[...days]}));
};
