import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';

export default async t=>{
  const safe=t.W===844?{top:0,bottom:21,left:47,right:47}:t.W===390?{top:47,bottom:34,left:0,right:0}:{top:0,bottom:0,left:0,right:0};
  await t.send('Emulation.setSafeAreaInsetsOverride',{insets:safe});
  await boot(t,RICH);
  const touch=(type,x,y)=>t.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
  const start=await t.ev(`({x:__dev.player.position.x,z:__dev.player.position.z})`);
  const x=t.W*0.45,y=t.H*0.48;
  await touch('touchStart',x,y);await touch('touchMove',x+70,y+10);await t.wait(700);
  const stick=await t.ev(`(()=>{const e=document.getElementById('stick'),r=e.getBoundingClientRect();return {hidden:e.hidden,cx:r.x+r.width/2,cy:r.y+r.height/2,width:r.width,height:r.height}})()`);
  assert.equal(stick.hidden,false,'joystick did not appear');
  assert.ok(Math.abs(stick.cx-x)<1&&Math.abs(stick.cy-y)<1,'joystick moved away from the touch origin');
  assert.equal(stick.width,96);assert.equal(stick.height,96);
  const moved=await t.ev(`({x:__dev.player.position.x,z:__dev.player.position.z})`);
  assert.ok(Math.hypot(moved.x-start.x,moved.z-start.z)>0.05,'joystick did not move the player');
  await t.shot('navigation-stick');await touch('touchCancel');await t.wait(150);
  assert.equal(await t.ev(`document.getElementById('stick').hidden`),true,'cancel left the joystick visible');
  // movePlayer deliberately decelerates. Assert that it settles, not that velocity becomes zero immediately.
  let previous=await t.ev(`({x:__dev.player.position.x,z:__dev.player.position.z})`),stable=0;
  for(let i=0;i<12&&stable<3;i++){
    await t.wait(500);const current=await t.ev(`({x:__dev.player.position.x,z:__dev.player.position.z})`);
    stable=Math.hypot(current.x-previous.x,current.z-previous.z)<0.015?stable+1:0;previous=current;
  }
  assert.equal(stable,3,'cancel left movement stuck after deceleration');
  const arrows=[];
  // These test positions stay inside the actual shelter walking radius8.5. Travel is skipped only to exercise every edge direction.
  for(const [px,pz] of [[-5.8,-5.8],[5.8,-5.8],[5.8,5.8],[-5.8,5.8]]){
    await t.ev(`__dev.player.position.set(${px},0,${pz});1`);await t.wait(1000);
    const r=await t.ev(`(()=>{const e=document.getElementById('edgeArrow'),r=e.getBoundingClientRect();return {hidden:e.hidden,x:r.x,y:r.y,w:r.width,h:r.height,transform:e.style.transform}})()`);
    if(r.hidden)continue;
    arrows.push(r);console.log('edge marker',JSON.stringify({safe,position:[px,pz],rect:r}));
    await t.shot('navigation-edge-light');
    assert.ok(r.x>=safe.left-1&&r.y>=safe.top-1&&r.x+r.w<=t.W-safe.right+1&&r.y+r.h<=t.H-safe.bottom+1,'edge marker enters a device unsafe area');
    assert.ok(!r.transform.includes('NaN'),'edge direction is not finite');
  }
  assert.ok(arrows.length,'offscreen objective never showed an edge marker');
  // Synthetic dark backdrop tests UI legibility; this is not evidence for final night lighting.
  await t.ev(`document.querySelector('body > canvas').style.filter='brightness(0.12)';1`);await t.shot('navigation-dark-backdrop');
  assert.deepEqual(await t.ev(`__e`),[]);
  console.log('PASS joystick real touch/movement/cancel and edge marker bounds',JSON.stringify({size:[t.W,t.H],arrows:arrows.length}));
};
