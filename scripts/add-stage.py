# 새 스테이지 등록(1-4부터 쓴 도우미). 실행: python -X utf8 scripts/add-stage.py <id> "<지점 이름>" <도감 파일.py>
# 하는 일: src/stages/index.js에 import와 목록 추가, src/data/chapters.js 지점 채우기,
#          src/data/codex.js에 도감 항목(ENTRIES)과 닮은 인물(LIKE) 추가. 이미 있으면 건너뛴다.
# 도감 파일은 파이썬 문자열 둘을 담는다: ENTRIES = """ { id: 'person/x', ... }, """  LIKE = """  x: { fruits: [...], ... },"""
# 먼저 src/data/<id>.js(대사)와 src/stages/<id>.js(장면)를 만들어 둔다. 실행 뒤 npm run check로 확인한다.
import sys, re
sid, point, codex_file = sys.argv[1], sys.argv[2], sys.argv[3]
ns = {}
exec(open(codex_file, encoding='utf-8').read(), ns)
if 'CX' in ns: ns['ENTRIES'], ns['LIKE'] = ns['CX'][sid]

p = 'src/stages/index.js'; s = open(p, encoding='utf-8').read()
if f"from './{sid}.js'" not in s:
    s = re.sub(r"(import \w+ from '\./\w+\.js';\n)(?!import)", lambda m: m.group(1) + f"import {sid} from './{sid}.js';\n", s, count=1)
    s = re.sub(r"Object\.fromEntries\(\[([^\]]*)\]", lambda m: f"Object.fromEntries([{m.group(1)}, {sid}]", s, count=1)
open(p, 'w', encoding='utf-8').write(s)

p = 'src/data/chapters.js'; s = open(p, encoding='utf-8').read()
s2 = re.sub(r"(\{ id: '" + sid + r"', [^\n]*?points: )\[\]", lambda m: m.group(1) + f"[{{ id: '{sid}', title: '{point}' }}]", s, count=1)
assert s2 != s or f"id: '{sid}', title: '{point}'" in s, 'chapters'
open(p, 'w', encoding='utf-8').write(s2)

p = 'src/data/codex.js'; s = open(p, encoding='utf-8').read()
if ns['ENTRIES'].strip().split('\n')[0].strip() not in s:
    a = "];\n\n// 닮은 인물"
    s = s.replace(a, ns['ENTRIES'].rstrip() + '\n' + a, 1)
    if ns.get('LIKE'):
        s = s.rstrip()
        assert s.endswith('};')
        s = s[:-2] + ns['LIKE'].rstrip() + '\n};\n'
open(p, 'w', encoding='utf-8').write(s)
print('registered', sid)
