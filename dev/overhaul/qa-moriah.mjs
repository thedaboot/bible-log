// F66~F70 모리아: 실제 키로 계단을 올라 길목마다 서고(순간 이동 없이), 나뭇단 받치기를 직접 하고, 제단·제지·숫양 장면의 값을 재고 캡처한다.
//   node dev/cdp.mjs 1280 720 dev/overhaul/qa-moriah.mjs dev/shots/overhaul
import assert from 'node:assert/strict';
import {boot} from '../steps/_save.mjs';
import {RICH} from '../steps/ov-baseline.mjs';
import {playOnce} from '../steps/_games.mjs';
import {walkKeys} from './_walk.mjs';

export default async t => {
  const vis = id => t.ev(`(()=>{const e=document.getElementById('${id}');return !!e&&!e.hidden&&getComputedStyle(e).display!=='none';})()`);
  const quest = () => t.ev(`document.getElementById('quest')?.textContent??''`);
  await boot(t, RICH);
  await t.ev(`__dev.speed=3;__dev.run('moriah');1`);
  await t.wait(3000);
  // 표본: 대천사가 선 자리의 땅 높이와 대천사의 높이 차(관찰자가 걷는 동안), 숫양·아브라함·제단 사이 거리
  await t.ev(`window.__log=[];window.__samp=setInterval(()=>{const d=__dev,f=d.field;if(!f?.heightAt)return;const a=d.angel.position,r=f.ram,ab=f.abraham.position,al=f.spots.altar;
    __log.push({mode:d.mode,angelOff:+(a.y-f.heightAt(a)).toFixed(2),py:+d.player.position.y.toFixed(2),ram:r.visible?{toAbraham:+Math.hypot(r.position.x-ab.x,r.position.z-ab.z).toFixed(2),toAltar:+Math.hypot(r.position.x-al.x,r.position.z-al.z).toFixed(2),lift:+(r.userData.lift??0).toFixed(2),scale:+r.scale.x.toFixed(2)}:null});},100);1`);
  const fig = `(()=>{const f=__dev.field,u=o=>({arm:o.userData.armPose??null,pose:o.userData.pose??null,lift:+(o.userData.lift??0).toFixed(2)});const scr=o=>{const v=o.position.clone();v.y+=0.9;v.project(__dev.camera);return [Math.round((v.x+1)*innerWidth/2),Math.round((1-v.y)*innerHeight/2)];};return {abraham:u(f.abraham),isaac:u(f.isaac),messenger:f.messenger.visible,ram:f.ram.visible,py:+__dev.player.position.y.toFixed(2),at:{abraham:scr(f.abraham),isaac:scr(f.isaac),messenger:scr(f.messenger),ram:scr(f.ram),player:scr(__dev.player)}};})()`;
  const marks = [['손을 뻗어 칼을', 'f69-reach', 1400], ['아브라함아, 아브라함아', 'f69-call', 300], ['제가 여기 있습니다', 'f69-answer', 900], ['덤불에 뿔이', 'f70-thicket', 800], ['아들 대신 번제로', 'f70-lead', 1500], ['여호와 이레라', 'f70-offered', 600]];
  const seen = {}, climbs = [];
  let hits = 0;
  for (let k = 0; k < 4000; k++) {
    if (await vis('quiz')) break;
    if (await vis('dialog')) {
      const line = await t.ev(`document.getElementById('line').textContent`);
      const m = marks.find(([s, id]) => line.includes(s) && !seen[id]);
      if (m) { await t.wait(m[2]); seen[m[1]] = await t.ev(fig); await t.shot(m[1]); }
      if (await t.ev(`!!document.querySelector('#choices:not([hidden]) button')`)) { await t.ev(`document.querySelector('#choices button').click();1`); await t.wait(400); continue; }
      await t.ev(`document.getElementById('dialog').click();1`); await t.wait(120);
      continue;
    }
    if (await vis('dexCard')) { await t.ev(`document.getElementById('dexCard').click();1`); await t.wait(300); continue; }
    if (await vis('challenge')) { assert.ok(await playOnce(t, 'balance'), 'F67: balance challenge was not won with real keys'); hits++; await t.wait(300); continue; }
    const q = await quest();
    if (/길목|나뭇단 받쳐/.test(q) && await t.ev(`__dev.mode==='walk'&&!!__dev.waypoint.target`)) {
      // 실제 키로 목표(길목, 나뭇단 받칠 자리)까지 걷는다. 목표 고리는 목표의 높이에 있어야 한다
      const ring = await t.ev(`(()=>{const w=__dev.waypoint;return {ringY:w.group.children[1].position.y,targetY:w.target.y??0};})()`);
      assert.ok(Math.abs(ring.ringY - ring.targetY - 0.12) < 0.01, `F66: target ring is not at the target height ${JSON.stringify(ring)}`);
      const before = q;
      await t.ev(`__dev.speed=1;1`); // 배속을 풀고 걷는다: 한 표본 사이의 이동 거리로 순간 이동을 가려낸다
      const w = await walkKeys(t, `d.waypoint.target`, `(document.getElementById('quest')?.textContent??'')!==${JSON.stringify(before)}||!document.getElementById('challenge').hidden||d.mode!=='walk'`);
      await t.ev(`__dev.speed=3;1`);
      assert.ok(w.arrived, `F68: real-key climb did not reach "${q.replace(/\s+/g, ' ').trim()}" ${JSON.stringify(w.path.slice(-3))}`);
      assert.ok(w.maxStep < 1.2, `F68: the observer jumped ${w.maxStep.toFixed(2)} in one step while climbing`);
      climbs.push({quest: q.replace(/\s+/g, ' ').trim(), steps: w.steps, maxStep: +w.maxStep.toFixed(2), from: w.path[0], to: w.path.at(-1)});
      if (climbs.length <= 3) await t.shot(`f66-climb${climbs.length}`);
      continue;
    }
    await t.ev(`__dev.goNext();1`); await t.wait(300);
  }
  const log = await t.ev(`clearInterval(__samp);__log`);
  assert.ok(await vis('quiz'), 'moriah: quiz was not reached');
  // F68: 길목마다 실제 높이에 선다
  const heights = climbs.filter(c => /길목/.test(c.quest)).map(c => c.to[1]);
  assert.deepEqual(heights, [1.5, 3], `F68: trail heights ${JSON.stringify(climbs)}`);
  assert.ok(hits >= 3, `F67: expected three real supports, got ${hits}`);
  // F66: 대천사가 선 자리의 땅과 대천사의 높이가 맞는다(걷는 동안의 표본)
  const walk = log.filter(s => s.mode === 'walk'), off = walk.filter(s => Math.abs(s.angelOff) > 0.6);
  assert.ok(off.length / walk.length < 0.05, `F66: companion angel was off its ground in ${off.length}/${walk.length} walking samples ${JSON.stringify(off.slice(0, 3))}`);
  // F69: 손을 뻗은 채 부름을 듣고, 대답하며 손을 거둔다
  assert.deepEqual([seen['f69-reach']?.abraham.arm, seen['f69-reach']?.isaac.pose, seen['f69-reach']?.isaac.lift], ['hug', 'lie', 1], `F69 reach ${JSON.stringify(seen['f69-reach'])}`);
  assert.ok(seen['f69-call']?.messenger && seen['f69-call'].abraham.arm === 'hug', `F69 call ${JSON.stringify(seen['f69-call'])}`);
  assert.ok(seen['f69-answer']?.abraham.arm === null, `F69 answer ${JSON.stringify(seen['f69-answer'])}`);
  // 제단의 사건이 화면 안에서 일어난다: 관찰자가 꼭대기에 함께 있고, 그 순간의 사람들이 대사 위쪽 화면 안에 있다
  const inView=(id,who)=>who.every(w=>{const [x,y]=seen[id].at[w];return x>40&&x<t.W-40&&y>40&&y<t.H*0.7;});
  assert.equal(seen['f69-reach'].py,6,`F68: the observer is not on the summit ${JSON.stringify(seen['f69-reach'])}`);
  assert.ok(inView('f69-reach',['abraham','isaac','player']),`F69 reach is off screen ${JSON.stringify(seen['f69-reach'].at)}`);
  assert.ok(inView('f69-call',['abraham','isaac','messenger','player']),`F69 call is off screen ${JSON.stringify(seen['f69-call'].at)}`);
  assert.ok(inView('f70-thicket',['abraham','ram','player']),`F70 thicket is off screen ${JSON.stringify(seen['f70-thicket'].at)}`);
  // F70: 아브라함이 숫양 곁에 가서 붙들고, 숫양이 제단 위에 오른 뒤에 사라진다
  const ram = log.filter(s => s.ram).map(s => s.ram);
  assert.ok(Math.min(...ram.map(r => r.toAbraham)) < 1.2, 'F70: Abraham never reached the ram');
  const onAltar = ram.filter(r => r.toAltar < 0.15 && r.lift > 0.95);
  assert.ok(onAltar.length && onAltar[0].scale > 0.9, `F70: the ram was not placed on the altar before it faded ${JSON.stringify(ram.slice(-4))}`);
  assert.ok(ram.findIndex(r => r.scale < 0.9) > ram.findIndex(r => r.toAltar < 0.15), 'F70: the ram faded before reaching the altar');
  assert.deepEqual(await t.ev('__e'), []);
  assert.deepEqual(await t.ev('globalThis.__stuck??[]'), []);
  console.log('PASS moriah', JSON.stringify({climbs, hits, angelOff: `${off.length}/${walk.length}`, seen}));
};
