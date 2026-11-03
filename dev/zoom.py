# 개발 점검용: look-grid 캡처에서 칸 몇 개를 잘라 크게 붙인다.
#   python -X utf8 dev/zoom.py <캡처.png> <열 수> <행 수> <출력.png> <행,행,...> [열,열,...] [배율]
import sys
from PIL import Image
src, nc, nr, out, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], [int(x) for x in sys.argv[5].split(',')]
im = Image.open(src)
cols = [int(x) for x in sys.argv[6].split(',')] if len(sys.argv) > 6 and sys.argv[6] else list(range(nc))
k = float(sys.argv[7]) if len(sys.argv) > 7 else 2
cw, ch = (im.width - 70) / nc, (im.height - 18) / nr
# 가로로 넓은 칸은 가운데만 쓴다(인물 폭)
w = int(min(cw, ch * 1.2))
res = Image.new('RGB', (w * len(cols), int(ch) * len(rows)), 'white')
for a, r in enumerate(rows):
    for b, c in enumerate(cols):
        x = int(70 + c * cw + (cw - w) / 2)
        res.paste(im.crop((x, int(18 + r * ch), x + w, int(18 + (r + 1) * ch))), (b * w, a * int(ch)))
res.resize((int(res.width * k), int(res.height * k))).save(out)
