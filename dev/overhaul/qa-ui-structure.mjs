import assert from 'node:assert/strict';
import {RICH} from '../steps/ov-baseline.mjs';

export default async t=>{
  const insets=t.W===390?{top:47,bottom:34,left:0,right:0}:t.W===844?{top:0,bottom:21,left:47,right:47}:{top:0,bottom:0,left:0,right:0};
  console.log('structure profile',JSON.stringify({size:[t.W,t.H],insets}));
  await t.send('Emulation.setSafeAreaInsetsOverride',{insets});
  console.log('safe-area override ready');
  const check=async name=>{
    const leaks=await t.ev(`Array.from(document.querySelectorAll('[hidden]')).filter(e=>e.getClientRects().length>0).map(e=>e.id||e.className?.baseVal||e.className||e.tagName)`);
    assert.deepEqual(leaks,[],`${name}: hidden elements still painted`);
    assert.ok(await t.ev(`document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1`),`${name}: page overflows`);
    assert.deepEqual(await t.ev(`__e`),[],`${name}: runtime errors`);
  };
  const click=async selector=>{
    const r=await t.ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    assert.ok(r.x>=insets.left&&r.x<=t.W-insets.right&&r.y>=insets.top&&r.y<=t.H-insets.bottom,`control centre outside safe area: ${selector}`);
    assert.ok(await t.ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),h=document.elementFromPoint(${r.x},${r.y});return e===h||e.contains(h)})()`),`covered control: ${selector}`);
    if(t.W<900)await t.tap(r.x,r.y);
    else for(const type of ['mousePressed','mouseReleased'])await t.send('Input.dispatchMouseEvent',{type,x:r.x,y:r.y,button:'left',clickCount:1});
    await t.wait(400);
  };
  const base=process.env.BASE??'http://127.0.0.1:5174/';
  await t.open(base);console.log('first navigation ready');await t.ev(`localStorage.setItem('bible-rpg/save/v1',${JSON.stringify(JSON.stringify(RICH))});1`);await t.open(base);console.log('saved navigation ready');
  for(let i=0;i<80&&!await t.ev(`document.documentElement.classList.contains('is-ready')`);i++)await t.wait(100);
  await t.ev(`window.__e=[];addEventListener('error',e=>__e.push(e.message));addEventListener('unhandledrejection',e=>__e.push(String(e.reason?.stack||e.reason)));1`);
  await check('title');console.log('title structure checked; capturing');await t.shot('structure-title');
  await click('#menu .menu__item');await t.wait(2800);await check('shelter');
  await click('#menuBtn');await check('journal-growth');await t.shot('structure-growth');
  await click('#menuTabs [data-id="inventory"]');await check('journal-inventory');await t.shot('structure-inventory');
  await click('#menuTabs [data-id="codex"]');await check('journal-codex');
  await click('#menuTabs [data-id="route"]');await check('journal-map');await t.shot('structure-map');
  await click('#mapClose');await check('journal-return');
  await click('#menuClose');await t.wait(200);await click('#pauseBtn');await check('pause');await t.shot('structure-pause');
  await click('#pauseResume');await check('resume');
  console.log('PASS native pointer UI structure/hidden/safe-area/title→journal/map return/pause',JSON.stringify({size:[t.W,t.H],insets}));
};
