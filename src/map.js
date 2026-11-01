// 월드 지도: 쉼터의 빛의 문으로 들어가 스테이지를 고른다(양피지 픽셀 지도). 규칙은 docs/standards/ui.md "월드 지도".
// 고른 지점 id로 끝나고, 닫으면 null로 끝난다.
import { $ } from './ui.js';
import { CHAPTERS, WORLDS } from './data/chapters.js';
import { CODEX } from './data/codex.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// 스테이지 상태: 준비 중(지점 없음) / 잠김 / 열림 / 마침. 마쳤는데 도감에 못 만난 항목이 남으면 별(볼거리 남음).
export function stageInfo(state, id) {
  const ch = CHAPTERS.find((c) => c.id === id);
  const open = ch.points.filter((p) => state.unlocked.includes(p.id));
  const entries = CODEX.filter((c) => c.stage === id);
  const cleared = state.claimed.includes(`${id}/clear`);
  return {
    ch,
    open,
    status: !ch.points.length ? 'soon' : !open.length ? 'locked' : cleared ? 'cleared' : 'open',
    star: cleared && entries.some((c) => !state.codex[c.id]),
    words: entries.filter((c) => c.id.startsWith('word/')),
    met: entries.filter((c) => state.codex[c.id]).length,
    total: entries.length,
  };
}
const STATUS = { soon: '준비 중', locked: '잠김', open: '열림', cleared: '마침' };

export function openMap(state) {
  const box = $('mapBox');
  const world = WORLDS[0]; // shortcut: 월드가 하나뿐이다. 출애굽기를 만들 때 월드 넘기기를 더한다.
  const infos = world.stages.map((id) => stageInfo(state, id));
  const words = infos.flatMap((i) => i.words);
  $('mapTitle').textContent = world.title;
  $('mapProgress').textContent = `말씀 ${words.filter((w) => state.codex[w.id]).length} / ${words.length}`;
  let sel = Math.max(0, infos.findLastIndex((i) => i.status === 'open' || i.status === 'cleared'));

  return new Promise((resolve) => {
    const nodes = $('mapNodes');
    const detail = $('mapDetail');
    const close = (value) => {
      box.hidden = true;
      removeEventListener('keydown', onKey, true);
      resolve(value);
    };
    const paint = () => {
      nodes.querySelectorAll('.map__node').forEach((n, k) => n.setAttribute('aria-pressed', String(k === sel)));
      const it = infos[sel];
      const view = el('div', 'map__info');
      const head = el('div', 'map__infohead');
      head.append(el('p', 'quest__label', `${1}-${sel + 1} · ${STATUS[it.status]}`), el('p', 'map__stage', it.ch.title), el('p', 'map__range', it.ch.range));
      view.append(head);
      if (it.total) {
        const stats = el('p', 'map__stats');
        stats.append(el('span', null, `도감 ${it.met} / ${it.total}`));
        if (it.star) stats.append(el('span', 'map__left', '볼거리가 남아 있어요'));
        view.append(stats);
      }
      const go = el('div', 'map__go');
      if (it.status === 'soon') go.append(el('p', 'map__note', '아직 만드는 중이에요.'));
      else if (it.status === 'locked') go.append(el('p', 'map__note', '앞 스테이지를 마치면 열려요.'));
      else {
        // 스테이지 안의 중간 지점(예: 타락과 추방)도 여기서 함께 고른다
        for (const p of it.open) {
          const b = el('button', 'btn map__point', p.title);
          b.type = 'button';
          b.onclick = () => close(p.id);
          go.append(b);
        }
      }
      view.append(go);
      detail.replaceChildren(view);
    };
    nodes.replaceChildren(...infos.map((it, k) => {
      const b = el('button', 'map__node');
      b.type = 'button';
      b.dataset.status = it.status;
      b.setAttribute('aria-label', `${1}-${k + 1} ${it.ch.title}, ${STATUS[it.status]}`);
      const mark = el('span', 'map__mark', `1-${k + 1}`);
      if (it.star) mark.append(el('span', 'map__star'));
      b.append(mark, el('span', 'map__name', it.ch.title));
      b.onclick = () => { sel = k; paint(); };
      return b;
    }));
    const onKey = (e) => {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        sel = (sel + (e.code === 'ArrowRight' ? 1 : infos.length - 1)) % infos.length;
        paint();
        nodes.children[sel].focus({ preventScroll: true });
      }
    };
    addEventListener('keydown', onKey, true);
    $('mapClose').onclick = () => close(null);
    box.hidden = false;
    paint();
    nodes.children[sel].focus({ preventScroll: true });
  });
}
