import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';

// Production entry points: M and the shelter shop trigger. No direct openMenu mocks.
export default async t => {
  const read = s => t.ev(s);
  const click = async selector => {
    const r = await read(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;e.scrollIntoView({block:'nearest',inline:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,disabled:e.disabled}})()`);
    assert.ok(r && !r.disabled && r.w>0 && r.h>0, `unavailable control: ${selector}`);
    if(!(r.x>=0 && r.x<t.W && r.y>=0 && r.y<t.H)){
      console.log('offscreen',JSON.stringify({selector,rect:r,layout:await read(`Array.from(document.querySelectorAll('#menuBox,.menu-panel,#menuBody,.shop,.shop .slots,.shop .inv__detail,.shop__buy')).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {class:e.id||e.className,x:r.x,y:r.y,w:r.width,h:r.height,scroll:e.scrollTop,overflow:s.overflowY,scrollHeight:e.scrollHeight}})`)}));
      await t.shot('record-control-failed');
    }
    assert.ok(r.x>=0 && r.x<t.W && r.y>=0 && r.y<t.H, `offscreen control: ${selector}`);
    assert.ok(await read(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),h=document.elementFromPoint(${r.x},${r.y});return e===h||e.contains(h)})()`), `covered control: ${selector}`);
    if(t.W<900)await t.tap(r.x,r.y);
    else for(const type of ['mousePressed','mouseReleased'])await t.send('Input.dispatchMouseEvent',{type,x:r.x,y:r.y,button:'left',clickCount:1});
    await t.wait(350);
  };
  const preview = async () => {
    const p=await read(`(()=>{const c=document.querySelector('#menuBody .model__view');if(!c)return null;const r=c.getBoundingClientRect();return {w:r.width,h:r.height,lost:c.getContext('webgl2').isContextLost()}})()`);
    assert.ok(p && p.w>40 && p.h>40 && !p.lost,'actual 3D preview missing');
  };
  await boot(t,{...RICH,name:'성경을함께걷는여행자',earthLook:{...RICH.earthLook,height:'tall'}});
  await t.key('KeyM','m');await t.wait(500);
  assert.equal(await read(`document.querySelectorAll('.bud').length`),9,'growth must have nine buds');
  for(let i=1;i<=9;i++){
    await click(`.bud:nth-of-type(${i})`);
    assert.ok(await read(`document.querySelector('.grove__about')?.textContent.trim().length>5`),'growth detail absent');
  }
  await t.shot('record-growth-fit');
  await click('#menuTabs [data-id="inventory"]');await preview();
  assert.ok(await read(`document.querySelector('.me__name')===null||document.querySelector('.me__name').textContent==='성경을함께걷는여행자'`),'name changed');
  await click('[data-key="slot:jar"]');
  assert.ok(await read(`document.querySelector('.inv__detail').textContent.includes('물동이')`),'tool detail absent');
  await click('#menuBody .inv__cats .chip:nth-child(2)');
  await click('[data-key="slot:staff"]');
  await t.shot('record-inventory-fit');
  await click('#menuTabs [data-id="codex"]');
  assert.ok(await read(`document.querySelectorAll('.codex__cell').length>0`),'codex cells absent');
  await t.shot('record-codex-fit');
  await click('#menuClose');
  assert.equal(await read(`document.querySelectorAll('.model__view').length`),0,'preview leaked');
  await read(`__dev.player.position.set(-5,0,2.6);1`);await t.wait(2200);
  assert.ok(await read(`!document.getElementById('menuBox').hidden&&document.getElementById('menuBox').dataset.only==='shop'`),'actual shelter shop did not open');
  await preview();
  const sc=await read(`(()=>{const e=document.querySelector('.shop .slots'),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y,h:r.height,overflow:e.scrollHeight-e.clientHeight}})()`);
  assert.ok(sc.h>=80 && sc.overflow>0,'shop list has no usable scrolling area');
  if(t.W<900){
    await t.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sc.x,y:sc.y+sc.h-12}]});
    for(let i=1;i<=6;i++){
      await t.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sc.x,y:sc.y+sc.h-12-(sc.h-30)*i/6}]});await t.wait(35);
    }
    await t.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await t.wait(500);
    assert.ok(await read(`document.querySelector('.shop .slots').scrollTop>5`),'touch scrolling failed');
  }
  await click('[data-key="slot:stars"]');
  assert.ok(await read(`document.querySelector('.shop__buy').disabled`),'unaffordable item can be bought');
  assert.ok(await read(`document.querySelector('.model').dataset.try.includes('일곱 별')`),'try-on not shown');
  await t.shot('record-shop-stars-fit');
  const scroll=await read(`document.querySelector('.shop .slots').scrollTop`);
  await click('[data-key="slot:menorah"]');
  const afterScroll=await read(`document.querySelector('.shop .slots').scrollTop`);
  assert.ok(scroll>0 && afterScroll>0,'selection reset shop list to start');
  await t.shot('record-shop-bottom-fit');
  await click('[data-key="slot:pomegranate"]');
  const before=await read(`({talents:__dev.state.talents,looks:[...__dev.state.items.looks],look:{...__dev.state.earthLook}})`);
  assert.ok(!before.looks.includes('pomegranate'));
  assert.notEqual(before.look.item,'pomegranate','try-on changed equipped item before purchase');
  await click('.shop__buy');
  const after=await read(`({talents:__dev.state.talents,looks:[...__dev.state.items.looks],item:__dev.state.earthLook.item})`);
  assert.equal(after.talents,before.talents-40,'purchase currency mismatch');
  assert.equal(after.looks.filter(id=>id==='pomegranate').length,1,'ownership missing or duplicated');
  assert.equal(after.item,'pomegranate','purchase was not equipped');
  assert.ok(await read(`document.querySelector('.shop__buy').disabled`),'owned item still purchasable');
  await t.shot('record-shop-purchased-fit');
  await click('#menuClose');await t.wait(500);
  assert.equal(await read(`document.querySelectorAll('.model__view').length`),0,'shop preview leaked');
  assert.deepEqual(await read(`__e`),[],'runtime errors');
  console.log('PASS actual record: nine growth buds, inventory/tool detail, codex, shop touch scroll/try-on/insufficient funds/purchase/equip/dispose',JSON.stringify({size:[t.W,t.H],scroll,afterScroll,before:before.talents,after:after.talents}));
};
