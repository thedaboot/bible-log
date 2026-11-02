// 바이블로그 도감(docs/design.md "도감"). 항목 id는 '분류/이름'이고 저장값 state.codex의 key와 같다.
// fact는 본문 사실 한 줄, ref는 그 장절, memo는 관찰자 메모 한 줄이다. memo는 본문에 없는 각색이라 감수 목록에 오른다.
// stage는 이 항목을 처음 만날 수 있는 스테이지(장 id)다.

export const CODEX_TABS = [
  { id: 'person', name: '인물' },
  { id: 'creature', name: '피조물' },
  { id: 'place', name: '장소' },
  { id: 'item', name: '물건' },
  { id: 'word', name: '말씀' },
];

export const CODEX = [
  { id: 'person/adam', name: '아담', stage: 'eden', fact: '흙으로 지음 받은 첫 사람', ref: '창 2:7', memo: '동물마다 이름을 지어 주는 목소리가 즐거워 보였다.' },
  { id: 'person/eve', name: '하와', stage: 'eden', fact: '모든 산 사람의 어머니', ref: '창 3:20', memo: '아담 곁에서 동산의 열매를 함께 돌보았다.' },

  { id: 'creature/lion', name: '사자', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '갈기가 바람에 흔들려도 아담 곁에서는 순했다.' },
  { id: 'creature/sheep', name: '양', stage: 'eden', fact: '아담이 이름을 지어 준 가축', ref: '창 2:20', memo: '부르면 고개를 들고 천천히 다가왔다.' },
  { id: 'creature/elephant', name: '코끼리', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '걸음은 느렸지만 땅이 울릴 만큼 컸다.' },
  { id: 'creature/deer', name: '사슴', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '가지 친 뿔을 숙이고 강가의 풀을 뜯었다.' },
  { id: 'creature/horse', name: '말', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '긴 갈기를 날리며 동산을 한 바퀴 돌았다.' },
  { id: 'creature/bear', name: '곰', stage: 'eden', fact: '아담이 이름을 지어 준 들짐승', ref: '창 2:19', memo: '둥근 귀를 쫑긋 세우고 아담을 바라보았다.' },
  { id: 'creature/fig', name: '무화과나무', stage: 'eden', fact: '두 사람이 잎을 엮어 몸을 가린 나무', ref: '창 3:7', memo: '넓은 잎 아래에 열매가 숨어 있었다.' },
  { id: 'creature/pomegranate', name: '석류나무', stage: 'eden', fact: '대제사장 옷단에 수놓은 열매', ref: '출 28:33', memo: '붉은 열매 안에 알갱이가 가득했다.' },
  { id: 'creature/grape', name: '포도나무', stage: 'eden', fact: '정탐꾼이 메고 온 큰 포도송이', ref: '민 13:23', memo: '송이가 무거워 가지가 휘어 있었다.' },
  { id: 'creature/olive', name: '올리브나무', stage: 'eden', fact: '약속의 땅에 나는 열매', ref: '신 8:8', memo: '잎 뒷면이 은빛으로 반짝였다.' },
  { id: 'creature/date', name: '대추야자나무', stage: 'eden', fact: '종려나무 성읍 여리고', ref: '신 34:3', memo: '높은 꼭대기에 열매가 주렁주렁 달렸다.' },
  { id: 'creature/serpent', name: '뱀', stage: 'eden', fact: '들짐승 가운데 가장 간교했다', ref: '창 3:1', memo: '말은 부드러웠지만 하나님의 말씀을 비틀었다.' },

  { id: 'place/eden', name: '에덴 동산', stage: 'eden', fact: '하나님께서 동쪽에 일구신 동산', ref: '창 2:8', memo: '보기에 아름답고 먹기에 좋은 나무가 가득했다.' },
  { id: 'place/pishon', name: '비손 강', stage: 'eden', fact: '금이 나는 하윌라 땅을 두른 강', ref: '창 2:11', memo: '물빛 아래로 모래가 반짝였다.' },
  { id: 'place/gihon', name: '기혼 강', stage: 'eden', fact: '구스 온 땅을 두른 강', ref: '창 2:13', memo: '굽이굽이 동산 가장자리를 돌아 흘렀다.' },
  { id: 'place/tigris', name: '힛데겔 강', stage: 'eden', fact: '앗수르 동쪽으로 흐른 강', ref: '창 2:14', memo: '물살이 빨라 다리 위에서도 소리가 들렸다.' },
  { id: 'place/euphrates', name: '유브라데 강', stage: 'eden', fact: '에덴에서 갈라진 넷째 강', ref: '창 2:14', memo: '넓고 잔잔하게 흘러 나갔다.' },

  { id: 'item/fig-leaf', name: '무화과 잎', stage: 'eden', fact: '두 사람이 엮어 몸을 가린 잎', ref: '창 3:7', memo: '에덴을 떠나며 받은 기념물. 가죽옷을 지어 입히신 일도 함께 기억한다.' },

  { id: 'word/gen-2-7', name: '흙과 생명의 숨', stage: 'eden', fact: '흙으로 사람을 지으시고 생명의 숨을 불어넣으셨다', ref: '창 2:7', memo: '사람이 살아 있는 존재가 된 처음 순간이다.' },
  { id: 'word/gen-3-15', name: '여자의 후손', stage: 'eden', fact: '여자의 후손이 뱀의 머리를 상하게 한다', ref: '창 3:15', memo: '대천사가 꼭 기억해 두라고 한 약속이다.' },

  { id: 'person/cain', name: '가인', stage: 'cain', fact: '아담의 맏아들, 땅을 일구는 사람', ref: '창 4:1~2', memo: '밭고랑은 곧게 갈았지만 웃는 얼굴은 보지 못했다.' },
  { id: 'person/abel', name: '아벨', stage: 'cain', fact: '가인의 아우, 양을 치는 사람', ref: '창 4:2', memo: '양마다 이름을 붙여 부르고 저녁마다 손가락으로 세었다.' },
  { id: 'person/seth', name: '셋', stage: 'cain', fact: '아벨 대신 주신 아담과 하와의 아들', ref: '창 4:25', memo: '셋의 아들 때부터 사람들이 여호와의 이름을 불렀다.' },
  { id: 'creature/lamb', name: '첫 새끼 양', stage: 'cain', fact: '아벨이 여호와께 가져온 양 떼의 첫 새끼', ref: '창 4:4', memo: '어미 곁을 한 걸음도 떠나지 않던 어린양이었다.' },
  { id: 'place/nod', name: '놋 땅', stage: 'cain', fact: '가인이 여호와 앞을 떠나 머문 에덴 동쪽 땅', ref: '창 4:16', memo: '떠도는 사람이 되리라는 말씀(창 4:12)과 이름의 소리가 닮았다.' },
  { id: 'item/wool', name: '양털 한 줌', stage: 'cain', fact: '아벨은 양을 치는 사람이었다', ref: '창 4:2', memo: '아벨의 어린양을 쓰다듬을 때 손에 남은 털. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-4-7', name: '죄를 다스려라', stage: 'cain', fact: '죄가 문 앞에 엎드려 있으나 너는 죄를 다스려야 한다', ref: '창 4:7', memo: '화가 난 가인에게 하나님께서 먼저 건네신 말씀이다.' },

  { id: 'person/noah', name: '노아', stage: 'noah', fact: '여호와께 은혜를 입고 하나님과 동행한 사람', ref: '창 6:8~9', memo: '굳은살 박인 손으로 마지막 판자까지 받쳤다.' },
  { id: 'person/shem', name: '셈', stage: 'noah', fact: '노아의 세 아들 가운데 맏아들', ref: '창 6:10', memo: '먹이 자루를 메고 방주를 몇 번이고 오갔다.' },
  { id: 'place/ark', name: '방주', stage: 'noah', fact: '고페르 나무로 짓고 안팎에 역청을 칠한 배', ref: '창 6:14', memo: '지붕 아래 창 하나와 옆으로 낸 문 하나가 있었다.' },
  { id: 'place/ararat', name: '아라랏 산', stage: 'noah', fact: '물이 줄어들 때 방주가 머문 산', ref: '창 8:4', memo: '물이 걷히자 산비탈에 풀빛이 먼저 돌아왔다.' },
  { id: 'creature/raven', name: '까마귀', stage: 'noah', fact: '노아가 창문을 열고 처음 내보낸 새', ref: '창 8:7', memo: '물이 마를 때까지 이리저리 날아다녔다.' },
  { id: 'creature/dove', name: '비둘기', stage: 'noah', fact: '새 올리브 잎을 물고 돌아온 새', ref: '창 8:11', memo: '세 번째로 날아간 뒤에는 돌아오지 않았다(창 8:12).' },
  { id: 'item/olive-leaf', name: '올리브 잎', stage: 'noah', fact: '물이 걷혔음을 알린 새 잎', ref: '창 8:11', memo: '비둘기가 물고 온 잎. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-9-13', name: '구름 속의 무지개', stage: 'noah', fact: '무지개는 하나님과 땅 사이의 언약의 표다', ref: '창 9:13', memo: '다시는 홍수로 멸하지 않겠다는 약속이다.' },

  { id: 'person/enoch', name: '에녹', stage: 'enoch', fact: '삼백 년 동안 하나님과 동행한 사람', ref: '창 5:22', memo: '날마다 같은 언덕길을 걸으며 하루 일을 다 아뢰었다.' },
  { id: 'person/methuselah', name: '므두셀라', stage: 'enoch', fact: '에녹의 아들, 노아의 할아버지', ref: '창 5:21~29', memo: '저녁이면 언덕 쪽을 보며 아버지를 기다렸다.' },
  { id: 'item/path-stone', name: '길가의 돌', stage: 'enoch', fact: '에녹이 하나님과 동행하던 길', ref: '창 5:24', memo: '언덕길 가장자리에서 주운 매끈한 돌. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-5-24', name: '하나님과 동행', stage: 'enoch', fact: '에녹이 하나님과 동행하더니 하나님이 그를 데려가셨다', ref: '창 5:24', memo: '죽음을 보지 않고 옮겨진 사람이다(히 11:5).' },

  { id: 'person/builder', name: '벽돌 굽는 이', stage: 'babel', fact: '시날 들판에서 벽돌을 구워 탑을 쌓던 사람들', ref: '창 11:3', memo: '본문에 이름이 없는 일꾼이다. 가마 불을 밤새 지켰다(각색 인물).' },
  { id: 'place/shinar', name: '시날 땅', stage: 'babel', fact: '사람들이 동쪽에서 옮겨 와 머문 들판', ref: '창 11:2', memo: '돌이 귀해 진흙을 구워 벽돌을 만들었다.' },
  { id: 'place/babel', name: '바벨', stage: 'babel', fact: '여호와께서 온 땅의 언어를 뒤섞으신 곳', ref: '창 11:9', memo: '꼭대기를 하늘에 닿게 하려던 탑이 거기서 멈추었다.' },
  { id: 'item/brick', name: '구운 벽돌', stage: 'babel', fact: '사람들이 돌 대신 쓴 벽돌', ref: '창 11:3', memo: '모서리가 반듯한 벽돌 한 장. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-11-9', name: '흩으심', stage: 'babel', fact: '여호와께서 거기서 언어를 뒤섞고 사람들을 온 땅에 흩으셨다', ref: '창 11:9', memo: '자기 이름을 내려던 일이 흩어짐으로 끝났다.' },

  { id: 'person/abraham', name: '아브라함', stage: 'abram', fact: '말씀을 따라 하란을 떠난 믿음의 조상', ref: '창 12:4', memo: '아브람이라 불리다가 많은 민족의 아버지라는 이름을 받았다(창 17:5).' },
  { id: 'person/sarah', name: '사라', stage: 'abram', fact: '아브라함의 아내, 이삭의 어머니', ref: '창 17:15', memo: '처음 만났을 때는 사래였다. 맷돌을 돌리며 웃음을 잃지 않았다.' },
  { id: 'person/lot', name: '롯', stage: 'abram', fact: '아브람의 조카, 함께 길을 떠난 사람', ref: '창 12:4', memo: '양 떼를 몰 때 목소리가 가장 컸다.' },
  { id: 'place/haran', name: '하란', stage: 'abram', fact: '아브람이 일흔다섯 살에 떠난 곳', ref: '창 12:4', memo: '흙벽돌 집을 뒤로하고 길을 나섰다.' },
  { id: 'place/shechem', name: '모레 상수리나무', stage: 'abram', fact: '세겜 땅에서 아브람이 처음 제단을 쌓은 곳', ref: '창 12:6~7', memo: '그늘이 넓어 무리가 다 쉬어 갈 수 있었다.' },
  { id: 'item/oak-leaf', name: '상수리나무 잎', stage: 'abram', fact: '세겜 모레 상수리나무', ref: '창 12:6', memo: '처음 제단을 쌓은 나무에서 떨어진 잎. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-12-2', name: '복이 되리라', stage: 'abram', fact: '큰 민족을 이루고 이름을 크게 하리니 너는 복이 될 것이다', ref: '창 12:2', memo: '바벨에서 사람들이 스스로 내려던 이름을 하나님께서 주신다.' },
  { id: 'word/gen-15-6', name: '믿음과 의', stage: 'abram', fact: '아브람이 여호와를 믿으니 이를 그의 의로 여기셨다', ref: '창 15:6', memo: '셀 수 없는 별 아래에서 들은 말씀이다.' },

  { id: 'person/hagar', name: '하갈', stage: 'hagar', fact: '사래의 애굽인 여종, 이스마엘의 어머니', ref: '창 16:1', memo: '광야에서 자기 이름을 불러 주신 분을 만났다.' },
  { id: 'person/ishmael', name: '이스마엘', stage: 'hagar', fact: '하나님이 들으신다는 이름의 아들', ref: '창 16:11', memo: '광야에서 자라 활 쏘는 사람이 되었다(창 21:20).' },
  { id: 'place/beer-lahai-roi', name: '브엘라해로이', stage: 'hagar', fact: '나를 살피시는 살아 계신 이의 우물', ref: '창 16:14', memo: '마른 땅 사이에 풀빛이 돋은 샘이었다.' },
  { id: 'place/beersheba', name: '브엘세바 광야', stage: 'hagar', fact: '하갈과 아이가 물이 떨어져 헤맨 광야', ref: '창 21:14', memo: '덤불 그늘 말고는 숨을 곳이 없었다.' },
  { id: 'item/waterskin', name: '가죽 부대', stage: 'hagar', fact: '아브라함이 하갈에게 준 물 부대', ref: '창 21:14', memo: '샘물을 가득 채워 아이에게 건넨 부대. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-16-13', name: '살피시는 하나님', stage: 'hagar', fact: '하갈이 자기에게 말씀하신 여호와를 나를 살피시는 하나님이라 불렀다', ref: '창 16:13', memo: '아무도 보지 않는다고 여긴 자리에서 들은 이름이다.' },

  { id: 'place/mamre', name: '마므레 상수리나무', stage: 'mamre', fact: '여호와께서 아브라함에게 나타나신 곳', ref: '창 18:1', memo: '한낮에도 나무 그늘 아래는 서늘했다.' },
  { id: 'person/guests', name: '세 사람', stage: 'mamre', fact: '아브라함의 장막 맞은편에 선 세 손님', ref: '창 18:2', memo: '얼굴은 볼 수 없었지만 그 말씀에 사라가 웃었다.' },
  { id: 'creature/calf', name: '송아지', stage: 'mamre', fact: '아브라함이 손님을 위해 고른 좋은 송아지', ref: '창 18:7', memo: '소 떼에서 가장 부드럽고 좋은 송아지였다.' },
  { id: 'item/cake', name: '고운 가루 떡', stage: 'mamre', fact: '사라가 고운 가루 세 스아로 만든 떡', ref: '창 18:6', memo: '나무 아래 상에 놓은 떡. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-18-14', name: '너무 어려운 일', stage: 'mamre', fact: '여호와에게 너무 어려운 일이 있겠느냐', ref: '창 18:14', memo: '웃던 사라에게 하신 말씀이다.' },

  { id: 'person/isaac', name: '이삭', stage: 'moriah', fact: '아브라함과 사라가 늙어서 얻은 약속의 아들', ref: '창 21:3', memo: '이름은 웃음이라는 뜻이다. 번제 나무를 등에 지고 산을 올랐다.' },
  { id: 'person/youth', name: '젊은 종 둘', stage: 'moriah', fact: '아브라함이 모리아로 데려간 젊은 종들', ref: '창 22:3', memo: '산 아래에서 나귀를 지키며 두 사람을 기다렸다.' },
  { id: 'place/moriah', name: '모리아 산', stage: 'moriah', fact: '하나님께서 일러 주신 산', ref: '창 22:2', memo: '사흘 길 끝에 멀리 보인 산이었다.' },
  { id: 'creature/ram', name: '숫양', stage: 'moriah', fact: '덤불에 뿔이 걸려 있던 숫양', ref: '창 22:13', memo: '이삭 대신 드려졌다.' },
  { id: 'item/firewood', name: '번제 나무', stage: 'moriah', fact: '아브라함이 쪼개어 이삭에게 지운 나무', ref: '창 22:6', memo: '이삭이 끈을 고쳐 매던 나뭇단의 한 토막. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-22-14', name: '여호와 이레', stage: 'moriah', fact: '여호와의 산에서 준비되리라', ref: '창 22:14', memo: '어린양은 하나님께서 친히 준비하신다는 말이 이루어졌다.' },

  { id: 'person/rebekah', name: '리브가', stage: 'rebekah', fact: '브두엘의 딸, 이삭의 아내', ref: '창 24:15', memo: '처음 본 나그네의 낙타 열 마리에게 물을 길어 주었다.' },
  { id: 'person/laban', name: '라반', stage: 'rebekah', fact: '리브가의 오라버니', ref: '창 24:29', memo: '누이의 금 코걸이를 보고 우물로 달려 나왔다.' },
  { id: 'person/servant', name: '늙은 종', stage: 'rebekah', fact: '아브라함의 모든 소유를 맡은 늙은 종', ref: '창 24:2', memo: '우물가에서 먼저 기도하고, 응답을 잠잠히 지켜보았다.' },
  { id: 'creature/camel', name: '낙타', stage: 'rebekah', fact: '종이 끌고 간 주인의 낙타 열 마리', ref: '창 24:10', memo: '한 마리가 한 번에 물동이 여러 개를 비웠다.' },
  { id: 'place/nahor', name: '나홀의 성', stage: 'rebekah', fact: '아브라함의 동생 나홀의 집안이 사는 성', ref: '창 24:10', memo: '저녁이면 여인들이 성 밖 우물로 물을 길으러 나왔다.' },
  { id: 'item/gold-ring', name: '금 코걸이', stage: 'rebekah', fact: '종이 리브가에게 준 반 세겔 금 코걸이', ref: '창 24:22', memo: '응답을 받은 날의 기억. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-24-27', name: '인도하시는 하나님', stage: 'rebekah', fact: '여호와께서 길에서 나를 인도하셨다', ref: '창 24:27', memo: '종이 우물가에서 머리를 숙여 드린 찬송이다.' },

  { id: 'person/jacob', name: '야곱', stage: 'bethel', fact: '에서의 발꿈치를 잡고 태어난 이삭의 아들', ref: '창 25:26', memo: '집을 떠난 첫날 밤, 돌베개를 베고 하늘의 문을 보았다.' },
  { id: 'person/esau', name: '에서', stage: 'bethel', fact: '이삭의 맏아들, 들사람이 된 사냥꾼', ref: '창 25:27', memo: '배가 고파 장자의 명분을 팥죽 한 그릇과 바꾸었다.' },
  { id: 'creature/lentil', name: '붉은 팥', stage: 'bethel', fact: '야곱이 끓인 팥죽의 콩', ref: '창 25:34', memo: '에서가 장자의 명분과 바꾼 한 그릇의 재료다.' },
  { id: 'place/bethel', name: '벧엘', stage: 'bethel', fact: '하나님의 집, 하늘의 문', ref: '창 28:19', memo: '돌기둥 하나가 서 있는 들이었다.' },
  { id: 'item/stone-pillow', name: '돌베개', stage: 'bethel', fact: '야곱이 베고 잔 뒤 기둥으로 세운 돌', ref: '창 28:18', memo: '매끈한 돌을 골라 건넨 기억. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-28-15', name: '너와 함께 있어', stage: 'bethel', fact: '내가 너와 함께 있어 네가 어디로 가든지 너를 지키리라', ref: '창 28:15', memo: '도망치던 밤에 들은 약속이다.' },

  { id: 'place/jabbok', name: '얍복 나루', stage: 'jabbok', fact: '야곱이 밤에 가족을 건너보낸 강 나루', ref: '창 32:22', memo: '여울에 디딤돌이 놓여 있었다.' },
  { id: 'place/peniel', name: '브니엘', stage: 'jabbok', fact: '하나님을 대면하여 보았다는 뜻의 땅', ref: '창 32:30', memo: '해가 돋을 때 야곱이 절뚝이며 떠난 곳이다.' },
  { id: 'person/the-man', name: '그 사람', stage: 'jabbok', fact: '날이 새도록 야곱과 씨름한 이', ref: '창 32:24', memo: '이름을 묻자 대답 대신 축복하였다(창 32:29).' },
  { id: 'creature/goat', name: '염소', stage: 'jabbok', fact: '야곱이 에서에게 예물로 보낸 암염소 이백', ref: '창 32:14', memo: '떼마다 사이를 두고 앞서 보냈다.' },
  { id: 'item/jacob-staff', name: '야곱의 지팡이', stage: 'jabbok', fact: '지팡이만 가지고 요단을 건넜던 야곱', ref: '창 32:10', memo: '절뚝이는 걸음을 받쳐 준 지팡이. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-32-28', name: '이스라엘', stage: 'jabbok', fact: '네 이름을 이스라엘이라 하리니 하나님과 겨루어 이겼다', ref: '창 32:28', memo: '발꿈치를 잡던 이가 새 이름을 받았다.' },

  { id: 'person/joseph', name: '요셉', stage: 'joseph', fact: '야곱이 사랑한 아들, 애굽을 다스린 이', ref: '창 41:41', memo: '옥에서도 죄수들의 빵을 나누고 맨 마지막에 앉았다.' },
  { id: 'person/pharaoh', name: '바로', stage: 'joseph', fact: '꿈을 꾸고 요셉에게 풀이를 들은 애굽 왕', ref: '창 41:15', memo: '요셉을 하나님의 영에 감동된 사람이라 불렀다.' },
  { id: 'person/cupbearer', name: '술 맡은 관원장', stage: 'joseph', fact: '옥에서 요셉에게 꿈 풀이를 들은 신하', ref: '창 40:9', memo: '두 해 동안 잊었다가 바로 앞에서 요셉을 기억해 냈다.' },
  { id: 'place/dothan', name: '도단', stage: 'joseph', fact: '형들이 양을 치다 요셉을 판 들', ref: '창 37:17', memo: '빈 구덩이 하나가 들 가운데 있었다.' },
  { id: 'place/egypt', name: '애굽', stage: 'joseph', fact: '요셉이 종으로 팔려 가 다스리는 자가 된 땅', ref: '창 39:1', memo: '옥에서 궁정까지, 요셉이 걸은 길은 끊기지 않고 이어졌다.' },
  { id: 'creature/cow', name: '살진 암소', stage: 'joseph', fact: '바로의 꿈에서 일곱 해의 풍년을 뜻한 소', ref: '창 41:26', memo: '나일 강가에서 갈밭 풀을 뜯던 소들이었다.' },
  { id: 'creature/grain', name: '충실한 이삭', stage: 'joseph', fact: '한 줄기에 일곱 이삭이 충실하게 맺힌 곡식', ref: '창 41:22', memo: '마른 이삭이 충실한 이삭을 삼켰다.' },
  { id: 'item/coat-thread', name: '채색옷 실', stage: 'joseph', fact: '야곱이 요셉에게 지어 입힌 채색옷', ref: '창 37:3', memo: '구덩이 곁에 떨어진 옷의 실 한 가닥. 이 스테이지의 기념물이다.' },
  { id: 'word/gen-39-23', name: '형통하게 하심', stage: 'joseph', fact: '여호와께서 요셉과 함께하사 그가 하는 일을 형통하게 하셨다', ref: '창 39:23', memo: '옥 안에서 들은 말씀이다.' },
];

// 닮은 인물: 인물마다 그 사람의 삶에서 두드러진 열매 두 가지와 긍정형 문장(감수 목록에 오른다).
// 문장에는 줄바꿈 기호를 넣지 않는다. 상태 창의 폭에 맞춰 text-wrap: balance가 나눈다.
// 상태 창은 도감에서 만난 인물 가운데 이 두 열매의 점수 합이 가장 큰 인물을 보여 준다.
export const LIKENESS = {
  adam: { fruits: ['faith', 'joy'], text: '맡겨진 동산을 일구고 지킨 아담처럼, 맡은 일을 끝까지 성실하게 해내요.', why: '창 2:15 일구고 지킴(신실), 창 2:23 기쁨의 고백(기쁨)' },
  abel: { fruits: ['faith', 'gentle'], text: '첫 새끼를 먼저 드린 아벨처럼, 아끼는 것을 먼저 하나님께 드려요.', why: '히 11:4 믿음으로 더 나은 제사(신실), 창 4:2 양을 치는 사람(온유)' },
  seth: { fruits: ['faith', 'peace'], text: '여호와의 이름을 부르기 시작한 셋의 집안처럼, 날마다 하나님을 불러요.', why: '창 4:26 여호와의 이름을 부름(신실), 창 4:25 슬픔 뒤에 주신 아들(화평)' },
  eve: { fruits: ['love', 'kindness'], text: '모든 산 사람의 어머니가 된 하와처럼, 곁에 있는 사람을 따뜻하게 품어요.', why: '창 3:20 모든 산 사람의 어머니(사랑), 창 4:1 생명을 품고 돌봄(친절)' },
  noah: { fruits: ['faith', 'patience'], text: '아무도 믿지 않을 때 방주를 끝까지 지은 노아처럼, 맡은 일을 오래 참고 해내요.', why: '히 11:7 믿음으로 방주를 준비함(신실), 벧전 3:20 오래 참으심 속에 방주를 지음(인내)' },
  enoch: { fruits: ['faith', 'peace'], text: '날마다 같은 길을 하나님과 걸은 에녹처럼, 하루하루를 그분께 이야기하며 걸어요.', why: '히 11:5 하나님을 기쁘시게 함(신실), 창 5:22 동행(화평)' },
  abraham: { fruits: ['faith', 'patience'], text: '갈 곳을 모르고도 길을 떠난 아브라함처럼, 약속을 믿고 오래 기다려요.', why: '히 11:8 믿음으로 나아감(신실), 히 6:15 오래 참아 약속을 받음(인내)' },
  sarah: { fruits: ['joy', 'patience'], text: '오래 기다린 끝에 웃음을 얻은 사라처럼, 기다림 속에서도 웃음을 잃지 않아요.', why: '창 21:6 하나님이 나를 웃게 하심(기쁨), 히 11:11 약속하신 이를 미쁘신 줄 앎(인내)' },
  hagar: { fruits: ['patience', 'faith'], text: '광야에서 살피시는 하나님을 만난 하갈처럼, 혼자라고 느낄 때도 그분이 보고 계심을 믿어요.', why: '창 16:9 돌아가 견딤(인내), 창 16:13 살피시는 하나님을 고백함(신실)' },
  isaac: { fruits: ['gentle', 'faith'], text: '나무를 지고 아버지와 함께 산을 오른 이삭처럼, 묵묵히 믿고 따라가요.', why: '창 22:6~8 함께 나아감(온유), 히 11:20 믿음으로 축복함(신실)' },
  rebekah: { fruits: ['kindness', 'goodness'], text: '낯선 나그네의 낙타에게까지 물을 길어 준 리브가처럼, 부탁받은 것보다 한 걸음 더 도와요.', why: '창 24:19 낙타도 마시게 하겠다(친절), 창 24:20 급히 물을 길음(선함)' },
  jacob: { fruits: ['patience', 'faith'], text: '돌베개를 베고도 약속을 붙든 야곱처럼, 먼 길 위에서도 함께하시는 분을 기억해요.', why: '창 29:20 칠 년을 며칠같이 여김(인내), 창 28:20~22 서원(신실)' },
  esau: { fruits: ['love', 'gentle'], text: '스무 해 만에 동생을 먼저 달려가 껴안은 에서처럼, 먼저 다가가 화해의 손을 내밀어요.', why: '창 33:4 달려와 껴안음(사랑), 창 33:9 넉넉하니 네 것은 네가 가지라(온유)' },
  joseph: { fruits: ['patience', 'faith'], text: '구덩이와 옥에서도 맡은 일을 해낸 요셉처럼, 어디에 있든 하나님이 함께하심을 믿고 성실하게 일해요.', why: '창 39:20~23 옥에서 형통함(인내), 창 41:16 하나님께서 대답하심(신실)' },
};
