import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import run from '../steps/r3-stages.mjs';

export default async t=>{
  const arg=process.argv.find(s=>s.startsWith('--stages='));
  const stages=(arg?.slice('--stages='.length)??'enoch,noah,babel,abram,hagar,mamre,moriah,rebekah,bethel,jabbok,joseph,brothers').split(',');
  assert.ok(stages.every(id=>/^[a-z0-9-]+$/.test(id)),'invalid stage list');
  process.env.STAGES=stages.join(',');
  const log=[],print=console.log;
  console.log=(...args)=>{const line=args.map(String).join(' ');log.push(line);print(...args);};
  try{await run(t);}finally{
    console.log=print;
    fs.writeFileSync(new URL(`../shots/overhaul/all-stages-${stages.join('-')}-${t.W}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),size:[t.W,t.H],stages,scope:'real stage/dialog/choice/challenge/quiz/completion inputs; walking distances skipped by goNext',log},null,2)+'\n');
  }
  for(const id of stages){
    const line=log.find(s=>s.startsWith(`OK ${id} `));
    assert.ok(line,`${id}: missing successful whole-stage result`);
    assert.ok(line.endsWith('errs=[]'),`${id}: runtime errors: ${line}`);
    assert.ok(line.includes('완료 창'),`${id}: completion UI was not reached`);
    assert.ok(line.includes('퀴즈'),`${id}: final quiz was not reached`);
  }
  assert.ok(!log.some(s=>s.startsWith('NG ')),'an incomplete stage was reported');
  console.log('PASS asserted complete existing stages',JSON.stringify({size:[t.W,t.H],stages}));
};
