import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';
export default async t => {
  await boot(t,RICH);
  await t.ev(`window.__worldLost=0;document.querySelector('canvas:not(.model__view)').addEventListener('webglcontextlost',()=>__worldLost++);1`);
  for(let i=0;i<20;i++){
    await t.key('KeyM','m');await t.wait(250);
    await t.ev(`document.querySelector('#menuTabs [data-id=inventory]').click();1`);await t.wait(400);
    const view=await t.ev(`(()=>{const c=document.querySelector('#menuBody .model__view');if(!c)return null;const r=c.getBoundingClientRect();return {width:r.width,height:r.height,pixels:c.width*c.height,lost:c.getContext('webgl2').isContextLost()}})()`);
    assert.ok(view&&view.width>40&&view.height>40&&view.pixels>10000&&!view.lost,'3D preview is absent, blank-sized or lost');
    if(i===0)await t.shot('preview-live');
    await t.key('Escape');await t.wait(250);
    assert.equal(await t.ev(`document.querySelectorAll('.model__view').length`),0,'preview canvas remains after closing');
    assert.equal(await t.ev(`__worldLost`),0,`main world lost its context after preview ${i+1}`);
  }
  console.log('PASS preview opens/closes 20 times; one main canvas remains and its context never lost');
};
