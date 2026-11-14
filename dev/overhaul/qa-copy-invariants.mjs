import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';

const root=process.cwd(), here=new URL('.',import.meta.url);
const approved=JSON.parse(fs.readFileSync(new URL('integration-5-approved-copy.json',here),'utf8'));
assert.equal(approved.data.length,31,'the reviewed copy list changed');
const files=[...new Set(approved.data.map(d=>d.path.split('.js.')[0]+'.js'))];
const entries=s=>s.match(/[A-Za-z_$][\w$-]*|\d+/g);
const locate=(o,parts)=>parts.slice(0,-1).reduce((v,k)=>v[k],o);
// Preserve aliases such as SHOP referencing the same item objects as ITEMS.
const plain=ns=>structuredClone(Object.fromEntries(Object.entries(ns).filter(([,v])=>typeof v!=='function')));
for(const file of files){
  const oldSource=execFileSync('git',['show',`0729d43:src/data/${file}`],{encoding:'utf8'});
  const before=plain(await import(`data:text/javascript;base64,${Buffer.from(oldSource).toString('base64')}`));
  const after=plain(await import(pathToFileURL(`${root}/src/data/${file}`).href));
  for(const change of approved.data.filter(d=>d.path.startsWith(file+'.'))){
    const parts=entries(change.path.slice(file.length+1)), key=parts.at(-1);
    const original=locate(before,parts), current=locate(after,parts);
    assert.equal(original[key],change.from,`review baseline mismatch: ${change.path}`);
    assert.equal(current[key],change.to,`approved copy not applied: ${change.path}`);
    original[key]=change.to;
  }
  if(file==='items.js'){
    const jar=after.ITEMS.find(i=>i.id==='jar');
    assert.equal(jar.use.stage,'rebekah');
    assert.ok(typeof jar.use.how==='string'&&jar.use.how.includes('우물')&&jar.use.how.includes('구유'),'jar usage must explain the real action');
    assert.deepEqual(Object.keys(jar.use).sort(),['how','stage']);
    before.ITEMS.find(i=>i.id==='jar').use=jar.use;
  }
  assert.ok(isDeepStrictEqual(after,before),`unreviewed data/ID/reference/reward/order change in ${file}`);
}
const result={at:new Date().toISOString(),baseline:'0729d43',files,approved:approved.data.length,unreviewedChanges:0};
fs.writeFileSync(new URL('../shots/overhaul/integration-5-copy-result.json',here),JSON.stringify(result,null,2)+'\n');
console.log('PASS exact reviewed copy changes; every other data field/ID/ref/reward/order preserved',JSON.stringify(result));
