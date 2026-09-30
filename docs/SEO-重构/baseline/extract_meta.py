"""从 html/ 下的快照提取 SEO 元信息，写出 snapshot.json（用 Python 标准库，没有第三方依赖）。

用法（改后复抓时用同一口径对比）：
  1. 在一个工作目录里抓页面，响应头存成同名 .hdr：
       UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
       curl -sS -A "$UA" -H "Accept-Language: zh-CN,zh;q=0.9" -D html/chongzhi.html.hdr -o html/chongzhi.html https://bigolab.com/chongzhi
     首页存成 html/index.html，其余存成 html/<路径>.html。
  2. python extract_meta.py <工作目录>
     页面清单见下面的 ORDER；缺 .hdr 时，状态码和缓存头两栏留空。

口径：robots 取 <meta name="robots">；JSON-LD 顶层类型只算每个脚本块的根对象和 @graph 成员。
"""
import json, os, re, sys
from html.parser import HTMLParser

ROOT = sys.argv[1]
ORDER = [
    "/", "/products", "/chongzhi",
    "/chongzhi/chatgpt-plus", "/chongzhi/chatgpt-pro", "/chongzhi/claude-pro",
    "/chongzhi/claude-max", "/chongzhi/claude-kyc", "/chongzhi/claude-zhuce",
    "/chongzhi/codex-jiema", "/chongzhi/google-zhanghao", "/chongzhi/grok-super",
    "/news", "/news/2026-09-30-ff0da12743", "/news/2026-09-30-24360bade4",
    "/news/2026-09-30-cc16266328", "/news/digest/daily/2026-09-29", "/jiema", "/jiema/terms", "/support", "/about",
]


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self._in_title = False
        self.meta = {}
        self.links = {}
        self.hx = []  # (level, text)
        self._hstack = None
        self._ld = None
        self.ld = []
        self.lang = None
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "title" and self.title is None:
            self._in_title = True
            self.title = ""
        elif tag == "meta":
            k = a.get("name") or a.get("property")
            if k and "content" in a:
                self.meta.setdefault(k.lower(), []).append(a["content"])
        elif tag == "link":
            rel = (a.get("rel") or "").lower()
            if rel in ("canonical", "alternate") and a.get("href"):
                key = rel if rel == "canonical" else f"alternate:{a.get('hreflang') or a.get('type') or ''}"
                self.links.setdefault(key, []).append(a["href"])
        elif tag in ("h1", "h2") and self._hstack is None:
            self._hstack = [int(tag[1]), ""]
        elif tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self._ld = ""
        elif tag in ("script", "style", "svg") and self._hstack is not None:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title" and self._in_title:
            self._in_title = False
        elif tag in ("h1", "h2") and self._hstack is not None and int(tag[1]) == self._hstack[0]:
            self.hx.append((self._hstack[0], re.sub(r"\s+", " ", self._hstack[1]).strip()))
            self._hstack = None
        elif tag == "script" and self._ld is not None:
            self.ld.append(self._ld)
            self._ld = None
        elif tag in ("script", "style", "svg") and self._skip:
            self._skip -= 1

    def handle_data(self, d):
        if self._in_title:
            self.title += d
        if self._ld is not None:
            self._ld += d
        elif self._hstack is not None and not self._skip:
            self._hstack[1] += d


def ld_types(raw_list):
    types, errs = [], 0

    def walk(o, depth):
        if isinstance(o, dict):
            t = o.get("@type")
            if t is not None and depth == 0:
                types.extend(t if isinstance(t, list) else [t])
            for k, v in o.items():
                if k == "@graph":
                    walk(v, 0)
                elif isinstance(v, (dict, list)):
                    walk(v, depth + 1)
        elif isinstance(o, list):
            for x in o:
                walk(x, depth)

    nested = []

    def walk_all(o):
        if isinstance(o, dict):
            t = o.get("@type")
            if t is not None:
                nested.extend(t if isinstance(t, list) else [t])
            for v in o.values():
                walk_all(v)
        elif isinstance(o, list):
            for x in o:
                walk_all(x)

    for raw in raw_list:
        try:
            o = json.loads(raw)
        except Exception:
            errs += 1
            continue
        walk(o, 0)
        walk_all(o)
    return types, nested, errs


def fname(p):
    return os.path.join(ROOT, "html", "index.html" if p == "/" else p.lstrip("/") + ".html")


def hdr(p):
    f = fname(p) + ".hdr"
    out = {}
    if not os.path.exists(f):
        return out
    blocks = open(f, encoding="utf-8", errors="replace", newline="").read().replace("\r\n", "\n").strip().split("\n\n")
    last = blocks[-1].splitlines()
    out["status"] = last[0].strip()
    for line in last[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            out.setdefault(k.strip().lower(), v.strip())
    return out


rows = []
for p in ORDER:
    raw = open(fname(p), encoding="utf-8").read()
    x = P()
    x.feed(raw)
    h = hdr(p)
    top, nested, errs = ld_types(x.ld)
    m = x.meta
    first = lambda k: (m.get(k) or [None])[0]
    rows.append({
        "path": p,
        "file": os.path.relpath(fname(p), ROOT).replace("\\", "/"),
        "status": h.get("status"),
        "bytes": len(raw.encode("utf-8")),
        "cache_control": h.get("cache-control"),
        "cf_cache_status": h.get("cf-cache-status"),
        "x_robots_tag": h.get("x-robots-tag"),
        "lang": x.lang,
        "title": (x.title or "").strip(),
        "description": first("description"),
        "canonical": (x.links.get("canonical") or [None])[0],
        "canonical_count": len(x.links.get("canonical") or []),
        "robots": first("robots"),
        "googlebot": first("googlebot"),
        "og_title": first("og:title"),
        "og_description": first("og:description"),
        "og_url": first("og:url"),
        "og_type": first("og:type"),
        "og_image": first("og:image"),
        "twitter_card": first("twitter:card"),
        "keywords": first("keywords"),
        "alternates": {k: v for k, v in x.links.items() if k != "canonical"},
        "h1": [t for lv, t in x.hx if lv == 1],
        "h2": [t for lv, t in x.hx if lv == 2],
        "jsonld_blocks": len(x.ld),
        "jsonld_parse_errors": errs,
        "jsonld_types_top": top,
        "jsonld_types_all": sorted(set(nested)),
    })

json.dump(rows, open(os.path.join(ROOT, "snapshot.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(json.dumps([{k: r[k] for k in ("path", "status", "title", "robots", "canonical", "h1", "jsonld_types_top")} for r in rows], ensure_ascii=False, indent=1))
