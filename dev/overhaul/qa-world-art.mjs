import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync(new URL('../shots/overhaul/',import.meta.url),{recursive:true});
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';
import {keys} from '../steps/_games.mjs';

export default async t=>{
  const report=[],{send}=keys(t);
  const evaluate=t.ev;
  t.ev=async expr=>{try{return await evaluate(expr);}catch(error){console.log('world-art evaluate failed',expr.slice(0,240));throw error;}};
  for(const id of process.argv.includes('--well-only')?['rebekah']:['shelter','rebekah','moriah','jabbok']){
    console.log('world-art booting',id);
    await boot(t,RICH);
    console.log('world-art booted',id);
    if(id!=='shelter'){
      await t.ev(`__dev.auto=false;__dev.speed=4;__dev.run(${JSON.stringify(id)});1`);
      let ready=false;
      for(let i=0;i<400&&!ready;i++){
        const s=await t.ev(`({ready:__dev.mode==='walk'&&!__dev.heaven.group.visible&&!!__dev.field,dialog:!document.getElementById('dialog').hidden,next:!document.getElementById('nextBtn').hidden})`);
        ready=s.ready;
        if(!ready&&(s.dialog||s.next))await t.key('Space',' ');
        await t.wait(100);
      }
      assert.ok(ready,`${id}: first actual walking state was not reached`);
      if(id==='rebekah'){
        const held=new Set();let arrived=false;
        for(let i=0;i<300&&!arrived;i++){
          const s=await t.ev(`({walking:__dev.mode==='walk',x:__dev.player.position.x,z:__dev.player.position.z,tx:__dev.field.servant.position.x,tz:__dev.field.servant.position.z})`);
          const desired=new Set();
          if(s.walking){
            const r=(s.tx-s.x)-(s.tz-s.z),f=-(s.tx-s.x)-(s.tz-s.z),m=Math.max(Math.abs(r),Math.abs(f));
            if(Math.abs(r)>m*0.42)desired.add(r>0?'KeyD':'KeyA');
            if(Math.abs(f)>m*0.42)desired.add(f>0?'KeyW':'KeyS');
          }else arrived=true;
          for(const code of held)if(!desired.has(code)){await send(code,'keyUp');held.delete(code);}
          for(const code of desired)if(!held.has(code)){await send(code,'keyDown');held.add(code);}
          await t.wait(100);
        }
        for(const code of held)await send(code,'keyUp');
        assert.ok(arrived,'actual keyboard walk never reached the servant');
        let introduced=false;
        for(let i=0;i<300&&!introduced;i++){
          const s=await t.ev(`({introduced:__dev.field.rebekah.visible&&!document.getElementById('dialog').hidden&&__dev.field.rebekah.position.distanceTo(__dev.field.spots.well)<2.5,dialog:!document.getElementById('dialog').hidden})`);
          introduced=s.introduced;
          if(!introduced&&s.dialog)await t.key('Space',' ');
          await t.wait(100);
        }
        assert.ok(introduced,'Rebekah did not enter the well dialogue');
        // --aside: the observer's real step-aside spot toward the camera from the 2026-11-14 PC failure (reached only in some runs).
        if(process.argv.includes('--aside')){await t.ev(`__dev.player.position.set(4.32,0,3.32);1`);await t.wait(2500);}
      }
    }
    await t.wait(1200);
    console.log('world-art importing bounds tool',id);
    await t.ev(`import('/node_modules/three/build/three.module.js').then(m=>{window.__qaThree=m;return 1})`);
    console.log('world-art measuring',id);
    const measured=await t.ev(`(()=>{
      const T=__qaThree, d=__dev, cam=d.camera;
      if(!cam||!d.renderer)return null;
      const rect=f=>{
        if(!f?.visible)return null;
        f.updateMatrixWorld(true);
        const body=f.userData.rig??f,b=new T.Box3().setFromObject(body),points=[],p=new T.Vector3();
        // Project the actual visible mesh vertices. A world AABB invents empty corners and overstates clipping when the jar is raised.
        body.traverseVisible(o=>{const a=o.isMesh&&o.geometry?.attributes.position;if(!a)return;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(cam);points.push({x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,z:p.z});}});
        if(!points.length)return null;
        return {x0:Math.min(...points.map(p=>p.x)),x1:Math.max(...points.map(p=>p.x)),y0:Math.min(...points.map(p=>p.y)),y1:Math.max(...points.map(p=>p.y)),behind:points.every(p=>p.z>1),height:b.max.y-b.min.y};
      };
      let meshes=0,invalid=0;
      const world=d.field?.group??d.heaven.group;
      world.traverse(o=>{if(o.isMesh){meshes++;for(const n of [...o.position.toArray(),...o.scale.toArray(),...o.quaternion.toArray()])if(!Number.isFinite(n))invalid++;}});
      const r=d.renderer.info;
      const dialog=document.getElementById('dialog'),quest=document.getElementById('quest');
      let readBottom=innerHeight;
      if(!dialog.hidden){
        const box=dialog.getBoundingClientRect(),shade=getComputedStyle(dialog,'::before');
        const h=parseFloat(shade.height),bottom=parseFloat(shade.bottom);
        // The strong gradient begins at its 55% stop measured from the bottom. Keep whole actors above it and the actual text box.
        readBottom=Math.min(box.top-16,box.bottom-bottom-h+h*0.45);
      }
      const readTop=quest.hidden?0:quest.getBoundingClientRect().bottom+12;
      return {player:rect(d.player),angel:rect(d.angel),cast:Object.fromEntries(['servant','rebekah'].filter(id=>d.field?.people[id]).map(id=>[id,rect(d.field.people[id])])),positions:Object.fromEntries(Object.entries({player:d.player,angel:d.angel,...d.field?.people}).filter(([,f])=>f?.visible).map(([id,f])=>[id,f.position.toArray()])),nearby:Object.entries(d.field?.people??{}).filter(([,f])=>f.visible&&f.position.distanceTo(d.player.position)<4).map(([id,f])=>({id,rect:rect(f)})),readArea:{top:readTop,bottom:readBottom},camera:{type:cam.type,position:cam.position.toArray(),direction:cam.getWorldDirection(new T.Vector3()).toArray(),fov:cam.fov,aspect:cam.aspect,view:cam.view},meshes,invalid,render:{...r.render},memory:{...r.memory},quest:quest.textContent};
    })()`);
    assert.ok(measured,'DEV camera/renderer inspection is missing');
    assert.equal(measured.invalid,0,`${id}: invalid actual object transform`);
    await t.shot(`world-art-${id}`);
    if(id==='rebekah'&&measured.angel){
      const p=measured.player,a=measured.angel;
      measured.angelPlayerRectOverlap=Math.max(0,Math.min(p.x1,a.x1)-Math.max(p.x0,a.x0))*Math.max(0,Math.min(p.y1,a.y1)-Math.max(p.y0,a.y0))/((p.x1-p.x0)*(p.y1-p.y0));
    }
    report.push({id,...measured});
    fs.writeFileSync(new URL(`../shots/overhaul/world-art-${t.W}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),scope:'real scene entries and well introduction after actual keyboard walking, projected rig bounds and renderer counters; not phone FPS or final staging approval',report},null,2)+'\n');
    const p=measured.player;
    assert.ok(p&&!p.behind&&p.x1>0&&p.x0<t.W&&p.y1>0&&p.y0<t.H,`${id}: actual player is outside the viewport`);
    assert.ok(p.y0>=0&&p.y1<=t.H,`${id}: player is vertically clipped ${JSON.stringify(p)}`);
    assert.deepEqual(await t.ev('__e'),[]);
    if(id==='rebekah'){
      for(const [actor,r] of Object.entries({player:p,...measured.cast,...(measured.angel?{angel:measured.angel}:{})})){
        assert.ok(r&&!r.behind&&r.x0>=-1&&r.y0>=-1&&r.x1<=t.W+1&&r.y1<=t.H+1,`well introduction clips required actor ${actor}: ${JSON.stringify(r)}`);
        assert.ok(r.y0>=measured.readArea.top-2&&r.y1<=measured.readArea.bottom+2,`well introduction puts required actor ${actor} behind UI or strong shade: ${JSON.stringify({rect:r,readArea:measured.readArea})}`);
      }
      if(measured.angel){
        assert.ok(measured.angelPlayerRectOverlap<0.15,`angel covers the observer's projected body rectangle (${(100*measured.angelPlayerRectOverlap).toFixed(1)}%); actual opacity still requires visual review`);
      }
    }
    console.log('actual world art metrics',JSON.stringify({id,size:[t.W,t.H],...measured}));
  }
  fs.writeFileSync(new URL(`../shots/overhaul/world-art-${t.W}.json`,import.meta.url),JSON.stringify({at:new Date().toISOString(),scope:'real scene entries and well introduction after actual keyboard walking, projected rig bounds and renderer counters; not phone FPS or final staging approval',report},null,2)+'\n');
  console.log('PASS real world startup/visible player/finite transforms; visual review remains required');
};
