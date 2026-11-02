# 대사 줄바꿈 2판 맞추기(scripts/check-data.mjs wrapErrors와 같은 셈법). 실행: python -X utf8 scripts/wrap-lines.py src/data/<id>.js
# 대사 데이터(const lines가 있는 파일)만 고친다. 닮은 인물 문장(codex.js)은 줄바꿈을 넣으면 안 되므로 건너뛴다.
# 자동으로 못 가르는 대사(쉼표도 문장 경계도 없음)는 그대로 두니, npm run check가 남긴 것을 손으로 고친다.
# - 합쳐 36자 이하인데 \n으로 가른 대사는 한 줄로 합친다.
# - 줄바꿈 없이 36자를 넘는 대사는 문장 경계(두 문장 이상) 또는 쉼표(한 문장)에서 가운데에 가까운 곳을 골라 한 번 가른다(두 조각 모두 12자 이상).
import re, sys

def n(t):
    return len(re.sub(r'[.,?!…]', '', t.replace('{nameVoc}', '이름이야').replace('{name}', '이름이')))

def split(t):
    total = n(t)
    cands = [m.end() for m in re.finditer(r'[.?!…] ', t)]
    if not cands:
        cands = [m.end() for m in re.finditer(r', ', t)]
    best = None
    for c in cands:
        a, b = t[:c].rstrip(), t[c:]
        if n(a) < 12 or n(b) < 12 or n(a) > 36 or n(b) > 36:
            continue
        score = abs(n(a) - n(b))
        if best is None or score < best[0]:
            best = (score, a + '\\n' + b)
    return best[1] if best else t

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if 'const lines' not in s:
        print('skip', p)
        continue
    def fix(m):
        t = m.group(1)
        if '\\n' in t:
            joined = t.replace('\\n', ' ')
            return m.group(0).replace(t, joined) if n(joined) <= 36 else m.group(0)
        if n(t) > 36:
            return m.group(0).replace(t, split(t))
        return m.group(0)
    s2 = re.sub(r"text: '((?:[^'\\]|\\.)*)'", fix, s)
    if s2 != s:
        open(p, 'w', encoding='utf-8').write(s2)
        print('fixed', p)
