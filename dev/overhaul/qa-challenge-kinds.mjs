import assert from 'node:assert/strict';
import {boot,SAVE} from '../steps/_save.mjs';
import {playOnce} from '../steps/_games.mjs';

export default async t=>{
  await boot(t,SAVE);
  for(const kind of ['time','rhythm','hold','mash','balance','trace','sequence','catch']){
    await t.ev(`__dev.stop();__dev.challenge({title:'도전 조작 검증',kind:${JSON.stringify(kind)},hits:99,spots:[{id:'kinds-probe',pos:__dev.player.position.clone(),text:'실제 입력으로 한 판'}]});1`);
    for(let i=0;i<60&&await t.ev(`document.getElementById('challenge').hidden`);i++)await t.wait(100);
    assert.equal(await t.ev(`document.getElementById('challenge').hidden`),false,`${kind}: challenge not shown`);
    await t.shot(`challenge-${kind}`);
    assert.ok(await playOnce(t,kind),`${kind}: input helper timed out`);
    await t.wait(250);
    const done=await t.ev(`Number(document.getElementById('challenge').dataset.done)`);
    assert.ok(done>0,`${kind}: helper returned without a real success`);
    console.log('PASS actual challenge input',kind,done);
  }
  assert.deepEqual(await t.ev(`__e`),[],'runtime errors');
};
