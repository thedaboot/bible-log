import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {boot,SAVE} from '../steps/_save.mjs';

export default async t=>{
 const results=[];
 const rect=selector=>t.ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,cx:r.x+r.width/2,cy:r.y+r.height/2}})()`);
 const setup=async kind=>{
  await t.ev(`__dev.stop();__dev.challenge({title:'입력 검증',kind:${JSON.stringify(kind)},hits:99,spots:[{id:'input-check',pos:__dev.player.position.clone(),text:'조작 확인'}]});1`);
  for(let i=0;i<60;i++){if(await t.ev('!document.getElementById("challenge").hidden'))break;await t.wait(100);}
  assert.ok(await t.ev('!document.getElementById("challenge").hidden'),'challenge not visible');
  await t.wait(400); // Let the entrance animation settle before fixing screen coordinates.
 };
 await boot(t,SAVE);
 await setup('mash');
 let button=await rect('#chAct');
 await t.shot('input-00-mash-ready');
 for(let i=0;i<24;i++){await t.tap(button.cx,button.cy);await t.wait(45);}
 assert.ok(Number(await t.ev('document.getElementById("challenge").dataset.done'))>0,'rapid taps did not progress mash');
 const viewport=await t.ev(`({scale:visualViewport.scale,scrollX,scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})`);
 assert.equal(viewport.scale,1,'double taps zoomed page');
 assert.equal(viewport.scrollX,0);assert.equal(viewport.scrollY,0);
 assert.ok(viewport.width<=t.W+1&&viewport.height<=t.H+1,'rapid taps expanded document');
 results.push('PASS rapid taps progress with bounded viewport');
 await t.shot('input-01-mash');
 await setup('catch');
 const pad=await rect('#chPad');
 const mouse=async(type,x,y,buttons=0)=>t.send('Input.dispatchMouseEvent',{type,x,y,button:buttons||type!=='mouseMoved'?'left':'none',buttons,clickCount:type==='mouseMoved'?0:1});
 const right=pad.x+pad.width*0.8;
 await mouse('mousePressed',right,pad.cy,1);
 const before=await rect('#chPad .pad__basket');
 await mouse('mouseMoved',Math.max(2,pad.x-12),pad.cy,1);
 await t.wait(100);
 const after=await rect('#chPad .pad__basket');
 await mouse('mouseReleased',Math.max(2,pad.x-12),pad.cy);
 console.log('basket drag',JSON.stringify({pad,before,after}));
 await t.shot('input-02-catch-drag');
 assert.ok(after.cx<before.cx-pad.width*0.35,'basket stopped when dragged past pad edge');
 results.push('PASS basket follows captured mouse drag beyond pad');
 const touch=async(type,x,y)=>t.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
 await touch('touchStart',pad.x+pad.width*0.8,pad.cy);
 await touch('touchCancel');
 await touch('touchStart',pad.x+pad.width*0.2,pad.cy);
 await touch('touchMove',pad.x+pad.width*0.35,pad.cy);
 await touch('touchEnd');
 const recovered=await rect('#chPad .pad__basket');
 assert.ok(recovered.cx<pad.cx,'touch cancel blocked new basket gesture');
 results.push('PASS touch cancel allows a new gesture');
 await t.shot('input-02-catch');
 assert.deepEqual(await t.ev('__e'),[]);
 fs.writeFileSync(new URL(`../shots/overhaul/./input-flow-${t.W}x${t.H}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),viewport:[t.W,t.H],results,layout:viewport,basket:{before,after,recovered},limits:'Chrome emulation; real iOS standalone viewport remains a device check'},null,2));
 console.log(results.join('\n'));
};
