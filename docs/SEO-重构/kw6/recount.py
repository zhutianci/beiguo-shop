import re,sys
TW=['统编','统 编','归户','报帐','报 帐','台币','ptt','回馈','补助','台湾','蝦皮','虾皮']
XR=['土耳其','尼日利亚','土区','土 区','尼区','尼 区','日区','日 区','日本','印度','阿根廷','巴西','全球','美元','125','google play']
def norm(s): return re.sub(r'\s+','',s.lower())
rows=[]
for fn in ['result1.tsv','result2.tsv']:
    for line in open(fn,encoding='utf-8'):
        p=line.rstrip('\n').split('\t')
        if len(p)<2: continue
        q,n=p[0],int(p[1]); sug=[s.strip() for s in p[2].split(' | ')] if len(p)>2 and p[2] else []
        toks=[norm(t) for t in q.split()]
        def has(t,s):
            m=re.fullmatch(r'[a-z0-9.]+',t)
            if m: return re.search(r'(?<![a-z0-9])'+re.escape(t)+r'(?![a-z0-9])',s.lower()) is not None
            return t in norm(s)
        keep=[s for s in sug if all(has(t,s) for t in toks)]
        tw=[s for s in keep if any(k in s.lower() for k in TW)]
        xr=[s for s in keep if any(k in s.lower() for k in XR)]
        rows.append((q,n,len(keep),len(tw),len(xr),' | '.join(s for s in sug if s not in keep)))
with open('recount.tsv','w',encoding='utf-8') as f:
    f.write('query\traw\tR3filtered\ttw_intent\tcross_region\tdropped\n')
    for r in rows: f.write('\t'.join(map(str,r))+'\n')
for r in rows:
    if r[1]!=r[2] or r[3] or r[4]: print('\t'.join(map(str,r)))
