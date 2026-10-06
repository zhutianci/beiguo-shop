"""kw7：批 2 用到的中文关键词，按 kw6 / R3 的同一方法实测下拉建议（2026-10-07）。

Google：suggestqueries.google.com/complete/search?client=firefox&hl=zh-CN&q=   （主数据，R3 §1 的接口）
Bing  ：api.bing.com/osjson.aspx?mkt=zh-CN&query=                             （辅助信号）
计数口径与 kw6/recount.py 相同（R3 口径）：去掉与原词相同的回显；联想必须包含原词全部词元（英文词元按词界匹配）。
条数是「相关联想条数」，是广度信号，**不是搜索量**。出口 IP 在境外（本机代理），地区偏向照 kw6 的做法标出台湾语境。
用法：python check.py  → result.tsv（原始联想）+ recount.tsv（R3 口径）
"""
import json, re, sys, time, urllib.parse, urllib.request

QUERIES = [l.strip() for l in open('queries.txt', encoding='utf-8') if l.strip() and not l.startswith('#')]
TW = ['统编', '归户', '报帐', '台币', 'ptt', '回馈', '补助', '台湾', '蝦皮', '虾皮', '香港', '澳门']

def norm(s): return re.sub(r'\s+', '', s.lower())

def has(t, s):
    if re.fullmatch(r'[a-z0-9.]+', t):
        return re.search(r'(?<![a-z0-9])' + re.escape(t) + r'(?![a-z0-9])', s.lower()) is not None
    return t in norm(s)

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode('utf-8', 'replace'))

def google(q):
    return fetch('https://suggestqueries.google.com/complete/search?client=firefox&hl=zh-CN&q=' + urllib.parse.quote(q))[1]

def bing(q):
    return fetch('https://api.bing.com/osjson.aspx?mkt=zh-CN&query=' + urllib.parse.quote(q))[1]

def r3(q, sug):
    toks = [norm(t) for t in q.split()]
    return [s for s in sug if norm(s) != norm(q) and all(has(t, s) for t in toks)]

raw = open('result.tsv', 'w', encoding='utf-8')
rc = open('recount.tsv', 'w', encoding='utf-8')
raw.write('query\tengine\tn\tsuggestions\n')
rc.write('query\tG_raw\tG_R3\tB_raw\tB_R3\tG_tw\tG_kept\n')
for q in QUERIES:
    try: g = google(q)
    except Exception as e: g = []; print('google fail', q, e, file=sys.stderr)
    time.sleep(0.6)
    try: b = bing(q)
    except Exception as e: b = []; print('bing fail', q, e, file=sys.stderr)
    time.sleep(0.6)
    raw.write(f'{q}\tgoogle\t{len(g)}\t{" | ".join(g)}\n')
    raw.write(f'{q}\tbing\t{len(b)}\t{" | ".join(b)}\n')
    gk, bk = r3(q, g), r3(q, b)
    tw = [s for s in gk if any(k in s.lower() for k in TW)]
    rc.write(f'{q}\t{len(g)}\t{len(gk)}\t{len(b)}\t{len(bk)}\t{len(tw)}\t{" | ".join(gk)}\n')
    print(f'{q}\tG{len(gk)}/{len(g)}\tB{len(bk)}/{len(b)}\t{" | ".join(gk)[:160]}')
raw.close(); rc.close()
