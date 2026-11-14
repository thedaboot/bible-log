import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {boot,SAVE} from '../steps/_save.mjs';

// Auto-play sets up the completion state; the map/close/home path uses real input.
export default async t=>{
 const results=[];
 const visible=id=>t.ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)});return !!e&&!e.hidden&&e.getClientRects().length>0})()`);
 const tapElement=async id=>{
  const r=await t.ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  assert.ok(r.x>=0&&r.x<t.W&&r.y>=0&&r.y<t.H,`${id} outside viewport`);
  if(t.W<900)await t.tap(r.x,r.y);
  else{
   await t.send('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});
   await t.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});
  }
  await t.wait(650);
 };
 await boot(t,{...SAVE,claimed:SAVE.claimed.filter(k=>!k.startsWith('enoch/')),unlocked:[...SAVE.unlocked,'enoch']});
 await t.ev(`Object.assign(__dev,{speed:10,auto:true});__dev.run('enoch');1`);
 for(let i=0;i<480&&!await visible('clearBox');i++)await t.wait(500);
 assert.ok(await visible('clearBox'),'completion state not reached');
 await t.ev('__dev.auto=false;1');
 await t.shot('flow-01-complete');
 await tapElement('clearMap');
 assert.ok(await visible('mapBox'),'map not open from completion');
 await tapElement('mapClose');
 assert.ok(!await visible('mapBox'),'map stayed open');
 assert.ok(await visible('clearBox'),'map X lost completion state');
 results.push('PASS completion → map → X retains completion');
 await t.shot('flow-02-map-closed');
 await tapElement('clearHome');
 await t.wait(2600);
 for(const id of ['clearBox','pauseBox','mapBox','menuBox'])assert.ok(!await visible(id),`${id} reopened after home`);
 assert.equal(await t.ev('__dev.mode'),'walk','shelter did not return to walking');
 results.push('PASS home returns to shelter without duplicate modal');
 await t.shot('flow-03-shelter');
 await t.key('Escape');await t.wait(400);
 assert.ok(await visible('pauseBox'),'Escape did not open pause');
 assert.ok(!await visible('pauseQuitItem'),'shelter offers leaving for shelter');
 await t.shot('flow-04-pause');
 await t.key('Escape');await t.wait(400);
 assert.ok(!await visible('pauseBox'),'Escape did not close pause');
 await t.key('KeyM','m');await t.wait(400);
 assert.ok(await visible('menuBox'),'M did not open journal');
 await t.key('Escape');await t.wait(400);
 assert.ok(!await visible('menuBox'),'Escape did not close journal');
 assert.ok(!await visible('pauseBox'),'closing journal also opened pause');
 assert.equal(await t.ev('__dev.mode'),'walk');
 results.push('PASS Escape pause toggle and M journal close do not open another modal');
 const layout=await t.ev(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,scale:visualViewport?.scale,errors:__e})`);
 assert.ok(layout.scrollWidth<=t.W+1,'horizontal viewport overflow');
 assert.ok(layout.scrollHeight<=t.H+1,'page height overflow');
 assert.equal(layout.scale,1);
 assert.deepEqual(layout.errors,[]);
 results.push('PASS viewport bounded and runtime errors empty');
 fs.writeFileSync(new URL(`../shots/overhaul/./modal-flow-${t.W}x${t.H}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),setup:'dev auto-play enoch',controls:'real pointer map/close/home',viewport:[t.W,t.H],results,layout},null,2));
 console.log(results.join('\n'));
};
