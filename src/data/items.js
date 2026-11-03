// 손에 드는 물건(docs/design.md "손에 드는 물건"). id는 props.js LOOK.earth.item의 id와 같아서 그대로 손에 그려진다.
// kind 'tool': 도전에서 쓰고 다 쓰면 사라진다. 인벤토리 칸을 차지한다. 같은 스테이지 앞부분에서 얻는다.
// 여는 레벨(2026-11-02 다시 봄): 창세기를 마치면 레벨 11~12(실측)라서 두루마리·기름 뿔병은 뒤 월드(15, 25)로 미뤘다.
// kind 'look': 꾸미기. level에 이르면 열리거나, price가 있으면 쉼터 상점에서 달란트로 산다. 계속 가지고 칸을 차지하지 않는다.
// note는 성경에서 그 물건이 나오는 자리 한 줄이다.
// slot: 몸에 다는 자리. 손(hand)·허리(waist)·머리(head)에 하나씩, 한 번에 셋까지 단다(2026-11-02 사용자 요청 S11 "소품은 최대 3개").
// stage: 그 스테이지를 마치면 받는 대표 소품(인물의 물건, 사용자 요청 "아브라함의 지팡이 같은 대표 소품").
// 달란트 계획(growth.md "달란트 계획"): 창세기 끝 약 320, 요한계시록 끝 약 3,000(계산값). 상점 합계 6,270이라 성경을 끝내도
// 다 사지 못한다. 무엇을 살지 골라 모으게 한다(2026-11-03 사용자 "달란트 모으는 맛").
export const SLOTS = { hand: '손', waist: '허리', head: '머리' };
export const SLOT_KEY = { hand: 'item', waist: 'waist', head: 'head' }; // earthLook에서 그 자리의 키
export const ITEMS = [
  { id: 'sling', kind: 'tool', name: '물매', ref: '삼상 17:40', note: '다윗이 시냇가의 돌 다섯 개와 함께 든 물매' },
  { id: 'horn', kind: 'tool', name: '양각 나팔', ref: '수 6:4', note: '여리고 성을 돌며 제사장들이 분 나팔' },
  { id: 'lamp', kind: 'tool', name: '등잔', ref: '마 25:1', note: '신랑을 맞으러 나간 처녀들의 등잔' },
  { id: 'jar', kind: 'tool', name: '물동이', ref: '창 24:15', note: '리브가가 어깨에 메고 나온 물동이' },
  { id: 'net', kind: 'tool', name: '그물', ref: '눅 5:4', note: '시몬이 말씀대로 깊은 데로 가서 내린 그물' },
  { id: 'sickle', kind: 'tool', name: '낫', ref: '막 4:29', note: '곡식이 익으면 곧 대는 낫' },
  { id: 'torch', kind: 'tool', name: '횃불 항아리', ref: '삿 7:16', note: '기드온의 용사들이 빈 항아리 속에 감춘 횃불' },
  // 레벨로 열리는 꾸미기
  { id: 'staff', kind: 'look', slot: 'hand', level: 2, name: '지팡이', ref: '출 4:2', note: '모세의 손에 들린 지팡이' },
  { id: 'bag', kind: 'look', slot: 'waist', level: 3, name: '목자 가방', ref: '삼상 17:40', note: '돌을 넣어 둔 목자의 주머니' },
  { id: 'dove', kind: 'look', slot: 'hand', level: 4, name: '비둘기', ref: '마 10:16', note: '비둘기같이 순결하라고 하신 그 새' },
  { id: 'inkhorn', kind: 'look', slot: 'waist', level: 9, name: '먹 그릇', ref: '겔 9:2', note: '세마포 옷 입은 사람이 허리에 찬 서기관의 먹 그릇' },
  { id: 'turban', kind: 'look', slot: 'head', level: 12, name: '세마포 관', ref: '출 28:39', note: '가는 베실로 짜서 머리에 두른 관' },
  { id: 'hood', kind: 'look', slot: 'head', level: 6, name: '두건', ref: '출 28:4', note: '머리를 감싸는 천' },
  { id: 'scroll', kind: 'look', slot: 'hand', level: 15, name: '두루마리', ref: '렘 36:2', note: '말씀을 받아 적은 두루마리' },
  { id: 'oil', kind: 'look', slot: 'waist', level: 25, name: '기름 뿔병', ref: '삼상 16:13', note: '사무엘이 다윗에게 부은 기름의 뿔병' },
  { id: 'helmet', kind: 'look', slot: 'head', level: 30, name: '구원의 투구', ref: '엡 6:17', note: '하나님의 전신 갑주 가운데 머리를 지키는 투구' },
  { id: 'sword', kind: 'look', slot: 'waist', level: 35, name: '성령의 검', ref: '엡 6:17', note: '하나님의 말씀이라 부른 성령의 검' },
  // 스테이지를 마치면 받는 대표 소품(그 이야기 인물의 물건)
  { id: 'basket', kind: 'look', slot: 'hand', stage: 'eden', name: '열매 바구니', ref: '창 2:16', note: '동산 각종 나무의 열매를 담던 바구니(각색)' },
  { id: 'lamb', kind: 'look', slot: 'hand', stage: 'cain', name: '어린양', ref: '창 4:2', note: '양 치는 자 아벨이 돌보던 어린양' },
  { id: 'olive', kind: 'look', slot: 'hand', stage: 'noah', name: '올리브 가지', ref: '창 8:11', note: '비둘기가 물고 온 감람나무 새 잎' },
  { id: 'oakwreath', kind: 'look', slot: 'head', stage: 'abram', name: '상수리 잎 관', ref: '창 12:6', note: '아브람이 머문 모레 상수리나무의 잎(각색)' },
  { id: 'waterskin', kind: 'look', slot: 'waist', stage: 'hagar', name: '가죽 부대', ref: '창 21:14', note: '하갈이 어깨에 메고 간 물 한 가죽 부대' },
  { id: 'nosering', kind: 'look', slot: 'head', stage: 'rebekah', name: '금 코걸이', ref: '창 24:22', note: '늙은 종이 리브가에게 준 반 세겔 금 코걸이' },
  { id: 'jstaff', kind: 'look', slot: 'hand', stage: 'jabbok', name: '야곱의 지팡이', ref: '창 32:10', note: '야곱이 이 지팡이만 가지고 요단을 건넜다' },
  { id: 'sheaf', kind: 'look', slot: 'hand', stage: 'joseph', name: '곡식 단', ref: '창 37:7', note: '요셉의 꿈에서 일어선 곡식 단' },
  // 상점 꾸미기(쉼터의 상점 천사). 값은 decisions.md "F(제안)"를 받아 올렸다
  { id: 'pomegranate', kind: 'look', slot: 'hand', price: 40, name: '석류', ref: '출 28:33', note: '대제사장 옷단에 수놓은 석류' },
  { id: 'timbrel', kind: 'look', slot: 'hand', price: 60, name: '소고', ref: '출 15:20', note: '홍해를 건넌 뒤 미리암이 손에 든 소고' },
  { id: 'pipe', kind: 'look', slot: 'hand', price: 70, name: '피리', ref: '삼상 10:5', note: '선지자 무리가 산당에서 내려오며 분 저' },
  { id: 'palm', kind: 'look', slot: 'hand', price: 90, name: '종려 가지', ref: '요 12:13', note: '예루살렘에 들어오시는 예수님을 맞은 종려 가지' },
  { id: 'lyre', kind: 'look', slot: 'hand', price: 120, name: '수금', ref: '삼상 16:23', note: '다윗이 사울 앞에서 탄 수금' },
  { id: 'belt', kind: 'look', slot: 'waist', price: 150, name: '금띠', ref: '계 1:13', note: '인자 같은 이가 가슴에 띤 금띠' },
  { id: 'censer', kind: 'look', slot: 'hand', price: 200, name: '금 향로', ref: '계 8:3', note: '천사가 성도의 기도와 함께 드린 금 향로' },
  { id: 'crown', kind: 'look', slot: 'head', price: 500, name: '생명의 면류관', ref: '계 2:10', note: '죽도록 충성하는 이에게 주시는 면류관' },
  // 2026-11-03 사용자 "더 많은 물품, 조금 더 희귀한 것": 성경에 한 번 나오는 귀한 물건. 값은 귀한 정도대로 200~1,000
  { id: 'myrrh', kind: 'look', slot: 'hand', price: 200, name: '몰약 합', ref: '마 2:11', note: '동방 박사들이 아기 예수께 드린 몰약' },
  { id: 'alabaster', kind: 'look', slot: 'hand', price: 300, name: '옥합', ref: '막 14:3', note: '한 여자가 깨뜨려 예수의 머리에 부은 나드 향유의 옥합' },
  { id: 'pearl', kind: 'look', slot: 'hand', price: 400, name: '값진 진주', ref: '마 13:46', note: '장사가 가진 것을 다 팔아 산 값진 진주 하나' },
  { id: 'budrod', kind: 'look', slot: 'hand', price: 500, name: '싹 난 지팡이', ref: '민 17:8', note: '움이 돋고 꽃이 피어 살구 열매가 열린 아론의 지팡이' },
  { id: 'breastplate', kind: 'look', slot: 'waist', price: 600, name: '판결 흉패', ref: '출 28:15', note: '열두 지파의 이름을 새긴 보석 열두 개를 단 대제사장의 흉패' },
  { id: 'goldplate', kind: 'look', slot: 'head', price: 700, name: '성결 금패', ref: '출 28:36', note: '여호와께 성결이라 새겨 청색 끈으로 관 앞에 맨 순금 패' },
  { id: 'menorah', kind: 'look', slot: 'hand', price: 800, name: '금 등잔대', ref: '출 25:31', note: '순금을 쳐서 만든 일곱 가지 등잔대' },
  { id: 'stars', kind: 'look', slot: 'hand', price: 1000, name: '일곱 별', ref: '계 1:16', note: '인자 같은 이가 오른손에 든 일곱 별' },
];
// 상점에서 파는 머리 모양과 옷(2026-11-03 사용자 F06 "옷이나 머리도 어느 정도는 기본 제공하나, 이쁜 머리는 상점에서").
// kind는 지상 모습의 키(hair·outfit)다. 사면 state.items.looks에 들고, 지상 모습에 바로 입힌다. props.js LOOK.earth에 같은 id가 있다.
export const STYLES = [
  { id: 'longwave', kind: 'hair', price: 100, name: '긴 물결', ref: '아 4:1', note: '길르앗 산기슭에 누운 염소 떼 같은 머리털' },
  { id: 'locks', kind: 'hair', price: 120, name: '일곱 가닥', ref: '삿 16:13', note: '삼손이 일곱 가닥으로 땋아 내린 머리' },
  { id: 'crownbraid', kind: 'hair', price: 140, name: '둘러 땋기', ref: '아 7:5', note: '자줏빛 머리카락을 땋아 머리에 두른 모양' },
  { id: 'coat', kind: 'outfit', price: 180, name: '채색옷', ref: '창 37:3', note: '야곱이 요셉에게 지어 입힌 여러 빛깔의 옷' },
];
// 상점 진열(값 순서): 꾸미기 소품과 머리·옷
export const SHOP = [...ITEMS.filter((i) => i.price), ...STYLES].sort((a, b) => a.price - b.price);
// 자리: 도구는 모두 손에 든다
export const slotOf = (it) => it.slot ?? 'hand';
