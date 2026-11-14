// F62 하갈 천사 퇴장, F63 출산 전후 빛, F64 마므레 엉긴 젖: 실제 장면을 진행하며 값을 재고 캡처한다.
//   node dev/cdp.mjs 1280 720 dev/overhaul/qa-f62-64.mjs dev/shots/overhaul [--hagar|--mamre]
import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';
import {keys} from '../steps/_games.mjs';

const only=a=>!process.argv.some(x=>x==='--hagar'||x==='--mamre')||process.argv.includes(a);
const until=async(t,expr,tries=1200,ms=100)=>{for(let i=0;i<tries;i++){if(await t.ev(expr))return true;await t.wait(ms);}return false;};

async function hagar(t){
  await boot(t,RICH);
  await t.ev(`Object.assign(__dev,{speed:4,auto:true,pauseAt:'브엘라해로이'});__dev.run('hagar');1`);
  assert.ok(await until(t,`!__dev.auto`),'hagar: spring line was not reached');
  // 표본: 천사의 발이 화면 어디에 있는지(ndc y, 1보다 크면 화면 위 밖)와 해의 세기, 이스마엘이 보이는지
  await t.ev(`window.__log=[];window.__samp=setInterval(()=>{const f=__dev.field;if(!f)return;const m=f.messenger,i=f.people.ishmael;__log.push({t:performance.now()|0,mv:m.visible,my:+m.position.y.toFixed(2),ndc:+m.position.clone().project(__dev.camera).y.toFixed(3),sun:+f.sun.intensity.toFixed(3),ish:!!i?.visible});},30);__dev.speed=1;1`);
  await t.ev(`document.getElementById('dialog').click();1`);await t.wait(150);
  await t.ev(`document.getElementById('dialog').click();1`);
  await t.wait(700);
  await t.shot('f62-angel-rising');
  assert.ok(await until(t,`!__dev.field.messenger.visible`,100),'hagar: messenger never left');
  await t.ev(`Object.assign(__dev,{speed:4,auto:true,pauseAt:'아들을 낳자'});1`);
  assert.ok(await until(t,`!__dev.auto`),'hagar: birth line was not reached');
  await t.wait(600);
  await t.shot('f63-after-birth');
  const log=await t.ev(`clearInterval(__samp);__log`);
  const rise=log.filter(s=>s.mv);
  const last=rise.at(-1);
  for(let i=1;i<rise.length;i++)assert.ok(rise[i].my>=rise[i-1].my-0.01,`F62: messenger moved down while leaving ${JSON.stringify(rise[i])}`);
  assert.ok(last.ndc>1,`F62: messenger was hidden while its feet were still on screen ${JSON.stringify(last)}`);
  const flip=log.findIndex(s=>s.ish),day=Math.max(...log.map(s=>s.sun));
  assert.ok(flip>0,'F63: Ishmael never appeared');
  const jump=Math.max(...log.slice(1).map((s,i)=>Math.abs(s.sun-log[i].sun)));
  assert.ok(day-log[flip].sun>0.12,`F63: scene changed while the light was not at its evening low ${JSON.stringify({day,at:log[flip]})}`);
  assert.ok(jump<0.08,`F63: sun intensity jumped ${jump} between samples`);
  assert.deepEqual(await t.ev('__e'),[]);
  console.log('PASS hagar',JSON.stringify({riseSamples:rise.length,lastVisible:last,sunDay:day,sunAtSceneChange:log[flip].sun,maxSunStep:jump}));
}

async function mamre(t){
  const {send}=keys(t);
  await boot(t,RICH);
  await t.ev(`Object.assign(__dev,{speed:4,auto:true});__dev.run('mamre');1`);
  const quest=`(document.getElementById('quest')?.textContent??'')`;
  assert.ok(await until(t,`${quest}.includes('엉긴 젖 받기')&&(__dev.auto=false,true)`,6000,50),'mamre: curds quest was not reached');
  await t.ev(`__dev.speed=2;1`);
  const cow=()=>t.ev(`(()=>{const c=__dev.field.cows[0].position,p=__dev.player.position;return {cx:c.x,cz:c.z,x:p.x,z:p.z,d:Math.hypot(c.x-p.x,c.z-p.z),mode:__dev.mode,quest:${quest},hold:document.body.innerText.includes('엉긴 젖 받는 중')}})()`);
  // 멀리서는 완료되지 않는다: 소에서 2.6 떨어진 자리(고치기 전 목표가 있던 거리)에 3초 서 있어 본다
  await t.ev(`(()=>{const c=__dev.field.cows[0].position;__dev.player.position.set(c.x-2.3,0,c.z+1.2);})();1`);
  await t.wait(3000);
  let s=await cow();
  assert.ok(s.quest.includes('엉긴 젖 받기'),`F64: quest completed ${s.d.toFixed(2)} away from the cow`);
  await t.shot('f64-far');
  // 실제 키로 소 곁까지 걷는다
  const held=new Set();let done=false,sawHold=false;
  for(let i=0;i<400&&!done;i++){
    s=await cow();sawHold||=s.hold;
    done=!s.quest.includes('엉긴 젖 받기');
    const tx=s.cx-1.1,tz=s.cz+0.6,dx=tx-s.x,dz=tz-s.z,desired=new Set();
    if(!done&&Math.hypot(dx,dz)>0.5){
      const r=dx-dz,f=-dx-dz,m=Math.max(Math.abs(r),Math.abs(f));
      if(Math.abs(r)>m*0.42)desired.add(r>0?'KeyD':'KeyA');
      if(Math.abs(f)>m*0.42)desired.add(f>0?'KeyW':'KeyS');
    }
    for(const c of held)if(!desired.has(c)){await send(c,'keyUp');held.delete(c);}
    for(const c of desired)if(!held.has(c)){await send(c,'keyDown');held.add(c);}
    if(s.hold&&!mamre.shot){mamre.shot=true;await t.shot('f64-receiving');}
    await t.wait(80);
  }
  for(const c of held)await send(c,'keyUp');
  assert.ok(done,`F64: walking to the cow with keys never completed ${JSON.stringify(s)}`);
  assert.ok(sawHold,'F64: the receiving gauge label never showed');
  assert.ok(s.d<2,`F64: completed ${s.d.toFixed(2)} away from the cow`);
  assert.deepEqual(await t.ev('__e'),[]);
  console.log('PASS mamre',JSON.stringify(s));
}

export default async t=>{
  if(only('--hagar'))await hagar(t);
  if(only('--mamre'))await mamre(t);
};
