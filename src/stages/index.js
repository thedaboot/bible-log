// 1-4부터의 스테이지 모음. 스테이지 파일은 { id, data, records, build(scene), run(g) }를 내보낸다.
// data는 src/data/<id>.js(대사·막간·인사·퀴즈), records는 그 스테이지가 도감에 남기는 항목(npm run check가 도감에 있는지 본다).
// main.js startAt이 여기서 찾아 runStage로 돌리고, scripts/check-data.mjs와 review.mjs도 이 목록을 돈다.
import noah from './noah.js';
import enoch from './enoch.js';
import babel from './babel.js';
import abram from './abram.js';
import hagar from './hagar.js';
import mamre from './mamre.js';
import moriah from './moriah.js';

export const STAGE_MODS = Object.fromEntries([noah, enoch, babel, abram, hagar, mamre, moriah].map((m) => [m.id, m]));
