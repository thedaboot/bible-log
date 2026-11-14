import assert from 'node:assert/strict';
import u1 from '../steps/u1-checks.mjs';
export default async t=>{
  await t.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await u1(t);
  const duration=await t.ev(`getComputedStyle(document.getElementById('fade')).transitionDuration`);
  assert.equal(duration,'0.15s','reduced-motion fade duration changed');
  console.log('PASS reduced-motion fade duration',duration);
};
