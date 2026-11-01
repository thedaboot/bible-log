// 손에 드는 물건(docs/design.md "손에 드는 물건"). id는 props.js LOOK.earth.item의 id와 같아서 그대로 손에 그려진다.
// kind 'tool': 도전에서 쓰고 다 쓰면 사라진다. 인벤토리 칸을 차지한다. 같은 스테이지 앞부분에서 얻는다.
// kind 'look': 꾸미기. level에 이르면 열리고 계속 가진다. 칸을 차지하지 않는다.
// note는 성경에서 그 물건이 나오는 자리 한 줄이다.
export const ITEMS = [
  { id: 'sling', kind: 'tool', name: '물매', ref: '삼상 17:40', note: '다윗이 시냇가의 돌 다섯 개와 함께 든 물매' },
  { id: 'horn', kind: 'tool', name: '양각 나팔', ref: '수 6:4', note: '여리고 성을 돌며 제사장들이 분 나팔' },
  { id: 'lamp', kind: 'tool', name: '등잔', ref: '마 25:1', note: '신랑을 맞으러 나간 처녀들의 등잔' },
  { id: 'jar', kind: 'tool', name: '물동이', ref: '창 24:15', note: '리브가가 어깨에 메고 나온 물동이' },
  { id: 'staff', kind: 'look', level: 2, name: '지팡이', ref: '출 4:2', note: '모세의 손에 들린 지팡이' },
  { id: 'bag', kind: 'look', level: 3, name: '목자 가방', ref: '삼상 17:40', note: '돌을 넣어 둔 목자의 주머니' },
  { id: 'hood', kind: 'look', level: 5, name: '두건', ref: '출 28:4', note: '머리를 감싸는 천' },
  { id: 'scroll', kind: 'look', level: 8, name: '두루마리', ref: '렘 36:2', note: '말씀을 받아 적은 두루마리' },
  { id: 'oil', kind: 'look', level: 12, name: '기름 뿔병', ref: '삼상 16:13', note: '사무엘이 다윗에게 부은 기름의 뿔병' },
];
