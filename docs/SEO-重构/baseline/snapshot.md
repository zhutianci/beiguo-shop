# 线上基线快照：页面元信息

- 抓取时间：2026-09-30 16:06–16:10（北京时间）
- 抓取方式：`curl`，UA 为桌面 Chrome 129，`Accept-Language: zh-CN`；出口经本机代理，Cloudflare 边缘节点 TLV。未执行 JS，所得即服务端首包 HTML。
- 原始文件：`html/<路径>.html`（首页为 `html/index.html`），响应头在 `headers.txt`；逐页明细（含 og:description、og:image、H2 列表）在 `snapshot.json`。
- 提取脚本口径：`robots` 取 `<meta name="robots">`；「JSON-LD 顶层类型」只算每个 `<script type="application/ld+json">` 的根对象和 `@graph` 成员，嵌套类型另列。
- 设计依据：`docs/SEO-重构/SEO-重构设计.md` §8.2 O 包「基线」、§0.1-6（AI 引用页改前改后存快照）。

## 本目录

| 文件 | 内容 |
|---|---|
| `snapshot.md` | 本文件：要点、协议检查、robots / sitemap 摘要、逐页元信息 |
| `snapshot.json` | 同一批数据的机器可读版（多出 og:description、og:image、keywords、H2 全列表） |
| `html/` | 21 页的服务端首包 HTML 原样存档 |
| `headers.txt` | 21 页的响应头 |
| `robots.txt`、`sitemap.xml` | 线上原样存档（16:06 抓取） |
| `psi.md` | PageSpeed Insights 移动端实测（4 页） |
| `extract_meta.py` | 生成 `snapshot.json` 的脚本，改后复抓时用同一口径对比 |

页面范围：首页、/products、/chongzhi 与它的 9 个子页、/news、/news 列表最前面的 3 篇详情、/jiema、/jiema/terms、/support、/about；另加 1 页昨天的日报（`/news/digest/daily/2026-09-29`），给 E1「日报补全」留改前样本。

## 要点

1. **21 页全部 200**：canonical 都只有一个，都指向自身（首页是 `https://bigolab.com`，不带斜杠）；没有 `X-Robots-Tag` 响应头。
2. **HTML 不走 CDN 缓存**：所有页面 `Cache-Control: private, no-cache, no-store`，`cf-cache-status: DYNAMIC`；源站耗时（`Server-Timing: cfOrigin`）448–700 ms，最慢的是 /jiema。
3. **http 还没有 301**：`http://bigolab.com/` 和 `http://www.bigolab.com/` 都直接返回 200。O 包验收项「`curl -I http://…` 返回 301」目前不满足。HSTS 只有 `max-age=300`。`https://www` 会 301 到主域，带尾斜杠的地址 308 到不带斜杠的，不存在的路径返回 404。
4. **title / H1 里的「代充」**（check-seo-copy 已知违规的线上原样）：
   - 首页 title「充值代充」，H1「充值与代充」
   - /chongzhi title「代充价格表」；/about title「AI 会员代充服务商」；grok-super title「会员代充多少钱」
   - chatgpt-plus title「代充值全指南」，claude-pro title「代充值指南」
5. **全站 `<meta name="keywords">` 是同一串**，包括 /news、/jiema 和大事记详情，都带「ChatGPT 代充」。
6. **/jiema 和 /jiema/terms 没有自己的 og 标签**：og:title / og:description 用的是根 layout 的默认值「贝果科技 - ChatGPT Plus / Claude Pro 充值与代充」，也没有 og:url。分享出去的卡片是充值文案。这两页的 `<meta name="robots">` 是 index, follow，但没有 googlebot 那条。
7. **JSON-LD 现状**：
   - 首页只有 Organization + WebSite
   - /products：ItemList + BreadcrumbList
   - /chongzhi 和 9 个子页：BreadcrumbList + FAQPage + ItemList
   - 大事记详情：Article
   - /jiema：FAQPage
   - /support：FAQPage + BreadcrumbList
   - /news、日报页、/jiema/terms、/about：没有 JSON-LD
   - 所有 JSON-LD 块都能正常解析
8. **大事记质量闸门在生效**：/news 列表最前面的两篇（ff0da12743、24360bade4）是 `noindex, follow`，也不在 sitemap 里；第三篇 cc16266328 可索引，在 sitemap 里。PSI 测的就是这一篇。
9. **/jiema 标题层级很平**：服务目录、价格、「号码怎么用」「没收到短信怎么办」等内容都在首包 HTML 里（main 区约 3,000 字），但只有 H1「短信接码」和一个 H2「常见问题」，其余区块都没有用 H2 或 H3。/jiema/terms 有 10 个 H2。

## 协议与主机名（16:10 用 curl 实测）

| 请求 | 结果 |
|---|---|
| `http://bigolab.com/` | 200（没有跳转） |
| `http://www.bigolab.com/` | 200（没有跳转） |
| `https://www.bigolab.com/` | 301 → `https://bigolab.com/` |
| `https://bigolab.com/chongzhi/` | 308 → `https://bigolab.com/chongzhi` |
| `https://bigolab.com/this-page-does-not-exist-baseline` | 404 |

## robots.txt 与 sitemap.xml 摘要

- robots.txt：`User-Agent: *`，`Allow: /`，Disallow 了 `/receipt/`、`/invoice-request/`、`/unsubscribe/`、`/finance/`、`/reply/`、`/pay/`、`/admin`、`/api/`、`/lookup`、`/*?s=`、`/*?n=`；有 `Host:` 行和 `Sitemap:` 行。没有 `Allow: /lookup$`（A 包要加）。
- sitemap.xml：单个 urlset，共 541 个 URL，其中 518 个带 lastmod：
  - 大事记详情 470（全部带 lastmod）
  - 日报 21、周报 4、月度归档 2（带 lastmod）
  - /products/<id> 21（带 lastmod）
  - /chongzhi 和子页 10、首页、/products、/news、/jiema、/jiema/terms、/support、/forum、/about、/links、/terms、/privacy、/games、/iptools：共 23 个，**都没有 lastmod**

## 总表

| 路径 | 状态 | title | H1 | robots | canonical | JSON-LD 顶层类型 |
|---|---|---|---|---|---|---|
| `/` | 200 OK | ChatGPT Plus / Claude Pro 充值代充 - 卡密自助兑换 - 贝果科技 | ChatGPT、Claude充值与代充 | index, follow | = 自身 | Organization, WebSite |
| `/products` | 200 OK | ChatGPT Plus / Claude Pro 充值与购买价格表 - 贝果科技 | AI 会员充值 价目表 | index, follow | = 自身 | ItemList, BreadcrumbList |
| `/chongzhi` | 200 OK | AI 会员充值 - ChatGPT Plus、Claude Pro 代充价格表 - 贝果科技 | AI 会员充值与账号服务 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/chatgpt-plus` | 200 OK | ChatGPT Plus 怎么充值、多少钱、代充值全指南 - 贝果科技 | ChatGPT Plus 充值：国内怎么充、多少钱、信用卡被拒怎么办 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/chatgpt-pro` | 200 OK | ChatGPT Pro 5x 怎么充值、多少钱、和 Plus 的区别 - 贝果科技 | ChatGPT Pro 5x 充值：价格、与 Plus 的区别、能不能覆盖已有 Plus | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/claude-pro` | 200 OK | Claude Pro 怎么充值、会员多少钱、代充值指南 - 贝果科技 | Claude Pro 充值：会员价格、iOS 订阅充值怎么用、封号风险说明 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/claude-max` | 200 OK | Claude Max 5x 怎么充值、多少钱、和 Pro 的区别 - 贝果科技 | Claude Max 5x 充值：价格、5x 与 20x 的额度差别、兑换前的四项检查 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/claude-kyc` | 200 OK | Claude KYC 认证是什么、被弹了怎么办、要不要找人代办 - 贝果科技 | Claude KYC 身份认证被弹了怎么办：先分清是不是封号、别急着做哪几件事 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/claude-zhuce` | 200 OK | Claude 怎么注册、注册不了、需要手机号验证怎么办 - 贝果科技 | Claude 注册全流程：注册不了怎么办、手机号验证、家宽 IP 与封号 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/codex-jiema` | 200 OK | Codex 接码怎么用、去哪买、美区实体卡验证码 - 贝果科技 | Codex 接码：OpenAI Codex 注册验证码怎么收、美区实体卡与虚拟号的区别 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/google-zhanghao` | 200 OK | 谷歌账号购买：成品号怎么登录、多少钱 - 贝果科技 | 谷歌账号购买：成品号是什么、2FA 与辅助邮箱怎么登、买来开 Gemini 要注意什么 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/chongzhi/grok-super` | 200 OK | Grok Super 充值 - xAI Grok 会员代充多少钱 - 贝果科技 | Grok Super 充值：三档怎么选、国内怎么付钱 | index, follow | = 自身 | BreadcrumbList, FAQPage, ItemList |
| `/news` | 200 OK | AI 圈大事记 - 每日 AI 动态聚合 | AI 圈大事记 | index, follow | = 自身 | （无） |
| `/news/2026-09-30-ff0da12743` | 200 OK | DeepSeek联合清华首发DSec，支撑V4训练的沙盒基础设施 - AI 圈大事记 | DeepSeek联合清华首发DSec，支撑V4训练的沙盒基础设施 | noindex, follow | = 自身 | Article |
| `/news/2026-09-30-24360bade4` | 200 OK | 36家机器人公司上市阵容成型，人形业务收入占比差距显著 - AI 圈大事记 | 36家机器人公司上市阵容成型，人形业务收入占比差距显著 | noindex, follow | = 自身 | Article |
| `/news/2026-09-30-cc16266328` | 200 OK | 作者分享国庆自驾攻略：人工定主线再用Agent微调 - AI 圈大事记 | 作者分享国庆自驾攻略：人工定主线再用Agent微调 | index, follow | = 自身 | Article |
| `/news/digest/daily/2026-09-29` | 200 OK | AI圈大事记 · 09月29日速览 - AI 圈大事记 | AI圈大事记 · 09月29日速览 | index, follow | = 自身 | （无） |
| `/jiema` | 200 OK | 短信接码 - 海外手机号在线接收验证码 - 贝果科技 | 短信接码 | index, follow | = 自身 | FAQPage |
| `/jiema/terms` | 200 OK | 短信接码服务条款 - 贝果科技 | 短信接码服务条款 | index, follow | = 自身 | （无） |
| `/support` | 200 OK | 常见问题与售后支持 - ChatGPT / Claude 充值答疑 - 贝果科技 | 购买之后，我们继续陪伴 | index, follow | = 自身 | FAQPage, BreadcrumbList |
| `/about` | 200 OK | 关于贝果科技 - AI 会员代充服务商 - 贝果科技 | 贝果科技让 AI 触手可及 | index, follow | = 自身 | （无） |

## 逐页明细

### `/`

- 文件：`html/index.html`（76,577 字节）
- title（46 字）：ChatGPT Plus / Claude Pro 充值代充 - 卡密自助兑换 - 贝果科技
- description（111 字）：贝果科技提供 ChatGPT Plus / Pro、Claude Pro / Max 5x 会员充值与代充：卡密自助兑换，无需信用卡，支付宝付款，可开增值税发票。另有 Codex 接码、Claude 注册与 KYC 认证。
- canonical：https://bigolab.com
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：ChatGPT Plus / Claude Pro 充值代充 - 卡密自助兑换 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com；og:type：website
- H1：ChatGPT、Claude充值与代充
- H2（5 个）：精选服务；AI 圈今日热点；IP 工具；准备好开始了吗？；按服务找：充值、注册与认证
- JSON-LD：1 个块，解析失败 0 个；顶层类型 Organization, WebSite；全部类型 ContactPoint, Country, ImageObject, Organization, WebSite

### `/products`

- 文件：`html/products.html`（101,036 字节）
- title（41 字）：ChatGPT Plus / Claude Pro 充值与购买价格表 - 贝果科技
- description（121 字）：ChatGPT Plus / Pro、Claude Pro / Max 会员充值与购买价格表，另有 Grok Super 充值、Codex 与 Claude 注册接码、谷歌账号。充值类为卡密自助兑换，仅支持支付宝；标价不含税，开票另付 6%。
- canonical：https://bigolab.com/products
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：ChatGPT Plus / Claude Pro 充值与购买价格表 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/products；og:type：website
- H1：AI 会员充值 价目表
- H2（6 个）：招 · 代理；Claude；ChatGPT；Gork；短信接码；谷歌邮箱
- JSON-LD：1 个块，解析失败 0 个；顶层类型 ItemList, BreadcrumbList；全部类型 BreadcrumbList, ItemList, ListItem

### `/chongzhi`

- 文件：`html/chongzhi.html`（123,678 字节）
- title（46 字）：AI 会员充值 - ChatGPT Plus、Claude Pro 代充价格表 - 贝果科技
- description（96 字）：ChatGPT Plus / Pro、Claude Pro / Max 会员充值与代充价格表，另有 Codex 接码、Claude 注册与 KYC 认证。卡密自助兑换，支持支付宝，无需信用卡。
- canonical：https://bigolab.com/chongzhi
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：AI 会员充值 - ChatGPT Plus、Claude Pro 代充价格表 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi；og:type：website
- H1：AI 会员充值与账号服务
- H2（4 个）：按服务分类；卡密充值是怎么运作的；怎么分辨一个代充卖家靠不靠谱；常见问题
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/chatgpt-plus`

- 文件：`html/chongzhi/chatgpt-plus.html`（158,738 字节）
- title（35 字）：ChatGPT Plus 怎么充值、多少钱、代充值全指南 - 贝果科技
- description（82 字）：ChatGPT Plus 国内充值全指南：￥135 起，卡密自助兑换，无需信用卡，支持支付宝。含信用卡被拒、付款未获批准、iOS 与信用卡两种充值方式的区别与排查。
- canonical：https://bigolab.com/chongzhi/chatgpt-plus
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：ChatGPT Plus 怎么充值、多少钱、代充值全指南 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/chatgpt-plus；og:type：website
- H1：ChatGPT Plus 充值：国内怎么充、多少钱、信用卡被拒怎么办
- H2（8 个）：价格与档位；两种充值方式怎么选；从下单到到账，一共四步；兑换报错了：对照这张表，先别急着提交第二次；信用卡被拒、付款未获批准：先分清是哪一种；为什么这一单可以放心下；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/chatgpt-pro`

- 文件：`html/chongzhi/chatgpt-pro.html`（199,929 字节）
- title（41 字）：ChatGPT Pro 5x 怎么充值、多少钱、和 Plus 的区别 - 贝果科技
- description（93 字）：ChatGPT Pro 5x 充值￥720 起，卡密自助兑换。讲清 Pro 与 Plus 的额度差别、信用卡档与 iOS 档能不能覆盖已有 Plus 订阅，以及充值前必须确认的账户状态。
- canonical：https://bigolab.com/chongzhi/chatgpt-pro
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：ChatGPT Pro 5x 怎么充值、多少钱、和 Plus 的区别 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/chatgpt-pro；og:type：website
- H1：ChatGPT Pro 5x 充值：价格、与 Plus 的区别、能不能覆盖已有 Plus
- H2（11 个）：价格与档位；「可覆盖 plus」和「不可覆盖 plus」差在哪；【强制充值】按下去会损失什么；Pro 5x 和 Plus 的差别：五倍价差买的是什么；下单前要确认的四件事；从下单到充值完成；兑换报错了：对照这张表，先别急着提交第二次；质保与退款：把难听的话说在前面；「ChatGPT Pro 代充靠谱吗」：可以核验的部分；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/claude-pro`

- 文件：`html/chongzhi/claude-pro.html`（173,192 字节）
- title（34 字）：Claude Pro 怎么充值、会员多少钱、代充值指南 - 贝果科技
- description（84 字）：Claude Pro 会员充值￥150 起，走 iOS 订阅充值无需上号，卡密自助兑换。含兑换前必须核对的两件事、Pro 升 Max 的做法，以及封号不质保的明确边界。
- canonical：https://bigolab.com/chongzhi/claude-pro
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：Claude Pro 怎么充值、会员多少钱、代充值指南 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/claude-pro；og:type：website
- H1：Claude Pro 充值：会员价格、iOS 订阅充值怎么用、封号风险说明
- H2（11 个）：价格与档位；iOS 订阅充值是什么意思：为什么不用把账号交出去；兑换前必须核对的两件事，错了就白损失一张卡密；频繁变动 IP：最常见的一类封号触发原因；Pro 够不够用，什么时候该升 Max；卡密怎么用：永久有效、24 小时自助、已核销不退；从下单到到账，一共四步；兑换报错了：对照这张表，先别急着提交第二次；Claude Pro 代充靠不靠谱：可以核验的几件事；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/claude-max`

- 文件：`html/chongzhi/claude-max.html`（193,156 字节）
- title（39 字）：Claude Max 5x 怎么充值、多少钱、和 Pro 的区别 - 贝果科技
- description（100 字）：Claude Max 5x 会员充值￥950，苹果订阅原价 125 美元/月。讲清 Pro / Max 5x / Max 20x 的额度差别、什么情况下该上 Max，以及兑换前必须核对的四项账户状态。
- canonical：https://bigolab.com/chongzhi/claude-max
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：Claude Max 5x 怎么充值、多少钱、和 Pro 的区别 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/claude-max；og:type：website
- H1：Claude Max 5x 充值：价格、5x 与 20x 的额度差别、兑换前的四项检查
- H2（10 个）：价格与档位；Pro / Max 5x / Max 20x：规格与定价对照；什么情况下值得从 Pro 升到 Max；兑换前必须确认的四件事；从下单到到账，一共四步；兑换报错了：对照这张表，先别急着提交第二次；质保到哪儿、不质保什么；第一次在这儿买，怎么判断靠不靠谱；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/claude-kyc`

- 文件：`html/chongzhi/claude-kyc.html`（118,944 字节）
- title（38 字）：Claude KYC 认证是什么、被弹了怎么办、要不要找人代办 - 贝果科技
- description（106 字）：Claude 账号突然要求 KYC 身份验证：怎么确认它不是封禁、为什么没有所谓的「必过材料清单」（含中国护照与香港身份这类问题为什么没有确定答案）、失败前该注意什么，以及￥180 的活人认证代办（失败不收费）。
- canonical：https://bigolab.com/chongzhi/claude-kyc
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：Claude KYC 认证是什么、被弹了怎么办、要不要找人代办 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/claude-kyc；og:type：website
- H1：Claude KYC 身份认证被弹了怎么办：先分清是不是封号、别急着做哪几件事
- H2（9 个）：价格与档位；Claude KYC 认证是什么；为什么偏偏是我：关于触发条件，能说的和不能说的；被弹 KYC 之后，先别急着做这几件事；需要准备什么：以界面提示为准，其余的别自己加戏；这项代办到底做什么、不做什么；从下单到完成；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/claude-zhuce`

- 文件：`html/chongzhi/claude-zhuce.html`（134,690 字节）
- title（34 字）：Claude 怎么注册、注册不了、需要手机号验证怎么办 - 贝果科技
- description（79 字）：Claude 账号注册卡在哪一步怎么解决：手机号验证收不到码、注册即封、IP 被判定为机房、需要家宽环境。含荷兰与美区实体卡接码（￥8 起）与家宽注册的普号。
- canonical：https://bigolab.com/chongzhi/claude-zhuce
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：Claude 怎么注册、注册不了、需要手机号验证怎么办 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/claude-zhuce；og:type：website
- H1：Claude 注册全流程：注册不了怎么办、手机号验证、家宽 IP 与封号
- H2（10 个）：价格与档位；注册 Claude 会死在哪三个地方；第一道坎：手机号验证，为什么虚拟号会被拒；第二道坎：家宽 IP 与机房 IP，差别到底在哪；第三道坎：验证码收不到，按这个顺序排查；买家宽注册的普号：先搞清楚它是什么，再看到手先做什么；注册成功之后：会员怎么充，被弹认证怎么办；从下单到到账；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/codex-jiema`

- 文件：`html/chongzhi/codex-jiema.html`（128,311 字节）
- title（31 字）：Codex 接码怎么用、去哪买、美区实体卡验证码 - 贝果科技
- description（77 字）：OpenAI Codex 注册要手机验证码怎么办：为什么虚拟号会被拒、美区实体手机卡接码（￥15）怎么用、收不到码的排查顺序，以及账号被封之后的替代路径。
- canonical：https://bigolab.com/chongzhi/codex-jiema
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：Codex 接码怎么用、去哪买、美区实体卡验证码 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/codex-jiema；og:type：website
- H1：Codex 接码：OpenAI Codex 注册验证码怎么收、美区实体卡与虚拟号的区别
- H2（9 个）：价格与档位；接码到底是什么：三句话说完；美区实体手机卡 vs 随机地区：钱到底花在哪；从下单到收到验证码；收不到验证码：按这个顺序排查；为什么不自己去接码平台买；接码只解决一关：什么时候该停下来；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/google-zhanghao`

- 文件：`html/chongzhi/google-zhanghao.html`（138,831 字节）
- title（25 字）：谷歌账号购买：成品号怎么登录、多少钱 - 贝果科技
- description（118 字）：谷歌账号购买：2020-2025 年注册的成品号 ￥30 起，支持支付宝，付款后即时发货。讲清 2FA 与辅助邮箱两种登录方式怎么分、到手先登录再改密码的顺序、「质保 3 天内首登」到底保什么，以及买号开 Gemini 前该知道的边界。
- canonical：https://bigolab.com/chongzhi/google-zhanghao
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：谷歌账号购买：成品号怎么登录、多少钱 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/google-zhanghao；og:type：website
- H1：谷歌账号购买：成品号是什么、2FA 与辅助邮箱怎么登、买来开 Gemini 要注意什么
- H2（10 个）：价格与档位；成品号是什么，以及它不是什么；两种登录方式：辅助邮箱接码，还是 2FA 动态码；到手第一件事：先确认能登录，再改密码；「质保 3 天内首登」到底保什么；买号是为了开 Gemini：先把边界说清楚；风险要说实话：这一单的边界在哪；从下单到到手；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/chongzhi/grok-super`

- 文件：`html/chongzhi/grok-super.html`（99,066 字节）
- title（39 字）：Grok Super 充值 - xAI Grok 会员代充多少钱 - 贝果科技
- description（103 字）：xAI Grok Super 会员充值：￥210 起，另有三个月档与 Super Heavy 档。卡密自助兑换，走 iOS 订阅充值，支付宝付款，无需境外支付方式。含三档差别、兑换前必须确认的事与退款口径。
- canonical：https://bigolab.com/chongzhi/grok-super
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：Grok Super 充值 - xAI Grok 会员代充多少钱 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/chongzhi/grok-super；og:type：website
- H1：Grok Super 充值：三档怎么选、国内怎么付钱
- H2（7 个）：价格与档位；三个档位怎么选；怎么交付、怎么兑换；下单前值得核验的几件事；风险与退款口径，说在前面；常见问题；其他充值与账号服务
- JSON-LD：1 个块，解析失败 0 个；顶层类型 BreadcrumbList, FAQPage, ItemList；全部类型 Answer, BreadcrumbList, FAQPage, ItemList, ListItem, Question

### `/news`

- 文件：`html/news.html`（192,948 字节）
- title（20 字）：AI 圈大事记 - 每日 AI 动态聚合
- description（59 字）：把一天里 AI 圈发生的事按事件聚合到一起：模型发布、产品更新、论文与工具。全部来自公开信源，由 AI 自动整理摘要。
- canonical：https://bigolab.com/news
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：AI 圈大事记 - 每日 AI 动态聚合（与 title 相同）
- og:url：https://bigolab.com/news；og:type：website
- H1：AI 圈大事记
- H2（4 个）：重点；9月30日 周三；速览与周报；按月回看
- JSON-LD：0 个块，解析失败 0 个；顶层类型 （无）；全部类型 （无）

### `/news/2026-09-30-ff0da12743`

- 文件：`html/news/2026-09-30-ff0da12743.html`（68,623 字节）
- title（42 字）：DeepSeek联合清华首发DSec，支撑V4训练的沙盒基础设施 - AI 圈大事记
- description（57 字）：DeepSeek与清华联合发布技术报告，首次公开支撑DeepSeek-V4全流程训练与评测的沙盒基础设施DSec。
- canonical：https://bigolab.com/news/2026-09-30-ff0da12743
- robots：noindex, follow；googlebot：noindex, follow；X-Robots-Tag：（无）
- og:title：DeepSeek联合清华首发DSec，支撑V4训练的沙盒基础设施
- og:url：https://bigolab.com/news/2026-09-30-ff0da12743；og:type：article
- H1：DeepSeek联合清华首发DSec，支撑V4训练的沙盒基础设施
- H2（4 个）：为什么值得看；信源1 家；关键事实；相关 · 工具
- JSON-LD：1 个块，解析失败 0 个；顶层类型 Article；全部类型 Article, CreativeWork, ImageObject, Organization, WebPage

### `/news/2026-09-30-24360bade4`

- 文件：`html/news/2026-09-30-24360bade4.html`（67,137 字节）
- title（37 字）：36家机器人公司上市阵容成型，人形业务收入占比差距显著 - AI 圈大事记
- description（91 字）：量子位梳理A股与港股至少36家已上市机器人相关企业，其中整机应用与系统部件各18家。人形机器人收入占比拉开巨大差距：宇树该业务占总收入51.1%，优必选占46.5%，越疆仅4.1%。
- canonical：https://bigolab.com/news/2026-09-30-24360bade4
- robots：noindex, follow；googlebot：noindex, follow；X-Robots-Tag：（无）
- og:title：36家机器人公司上市阵容成型，人形业务收入占比差距显著
- og:url：https://bigolab.com/news/2026-09-30-24360bade4；og:type：article
- H1：36家机器人公司上市阵容成型，人形业务收入占比差距显著
- H2（4 个）：为什么值得看；信源1 家；关键事实；相关 · 行业
- JSON-LD：1 个块，解析失败 0 个；顶层类型 Article；全部类型 Article, CreativeWork, ImageObject, Organization, WebPage

### `/news/2026-09-30-cc16266328`

- 文件：`html/news/2026-09-30-cc16266328.html`（73,048 字节）
- title（35 字）：作者分享国庆自驾攻略：人工定主线再用Agent微调 - AI 圈大事记
- description（107 字）：作者国庆带家人从山西自驾河南往返七天，做攻略时未将行程全丢给AI一键生成，而是人工确定主线后让Agent在底稿上微调细化。作者总结四原则：从噪音识别信号、一手信息优于二手、信任具体人胜过算法、输入质量决定输出质量。
- canonical：https://bigolab.com/news/2026-09-30-cc16266328
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：作者分享国庆自驾攻略：人工定主线再用Agent微调
- og:url：https://bigolab.com/news/2026-09-30-cc16266328；og:type：article
- H1：作者分享国庆自驾攻略：人工定主线再用Agent微调
- H2（5 个）：全文梳理；为什么值得看；信源1 家；关键事实；相关 · 工具
- JSON-LD：1 个块，解析失败 0 个；顶层类型 Article；全部类型 Article, CreativeWork, ImageObject, Organization, WebPage

### `/news/digest/daily/2026-09-29`

- 文件：`html/news/digest/daily/2026-09-29.html`（79,397 字节）
- title（27 字）：AI圈大事记 · 09月29日速览 - AI 圈大事记
- description（109 字）：本期涵盖：多模态模型原生反思与文生图指令遵循能力提升；强化学习提升LLM科研创意；连续潜空间扩散推理与图神经网络不确定性表示新模型；预测Agent耗Token量方法；OpenAI将发智能体平台；AI科学发现标准引争议。
- canonical：https://bigolab.com/news/digest/daily/2026-09-29
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：AI圈大事记 · 09月29日速览
- og:url：https://bigolab.com/news/digest/daily/2026-09-29；og:type：article
- H1：AI圈大事记 · 09月29日速览
- H2（9 个）：UMM-Reflection让统一多模态模型学会原生反思，GenEval提升1…；AI Night-Scientist框架用强化学习提升LLM科研创意；LFRM模型用连续潜空间扩散做推理，小骨干刷新数学与代码评测；新方法TokenCast可预测LLM Agent执行耗Token量；NeurIPS 2026 论文提出 DSS-GNN 统一图神经网络不确定性表示；新框架VVR提升文生图指令遵循能力，SD3.5准确率升至28.3%；OpenAI被曝将发Aeon智能体平台，追赶持续运行代理赛道；AI科学发现标准引争议：破解难题仍遭质疑；往期
- JSON-LD：0 个块，解析失败 0 个；顶层类型 （无）；全部类型 （无）

### `/jiema`

- 文件：`html/jiema.html`（203,961 字节）
- title（26 字）：短信接码 - 海外手机号在线接收验证码 - 贝果科技
- description（52 字）：选服务、选国家/地区，拿一个海外手机号在线接收短信验证码。没收到短信整单退回站内余额，收码前可免费换号。
- canonical：https://bigolab.com/jiema
- robots：index, follow；googlebot：（无）；X-Robots-Tag：（无）
- og:title：贝果科技 - ChatGPT Plus / Claude Pro 充值与代充
- og:url：（无）；og:type：website
- H1：短信接码
- H2（1 个）：常见问题
- JSON-LD：1 个块，解析失败 0 个；顶层类型 FAQPage；全部类型 Answer, FAQPage, Question

### `/jiema/terms`

- 文件：`html/jiema/terms.html`（129,632 字节）
- title（15 字）：短信接码服务条款 - 贝果科技
- description（83 字）：贝果科技短信接码服务条款：服务与退款规则、用途限制、服务性质与合法用途、使用行为与责任承担、平台的处置与记录留存、责任限制、相关法律条文摘录，以及举报违法使用的方式。
- canonical：https://bigolab.com/jiema/terms
- robots：index, follow；googlebot：（无）；X-Robots-Tag：（无）
- og:title：贝果科技 - ChatGPT Plus / Claude Pro 充值与代充
- og:url：（无）；og:type：website
- H1：短信接码服务条款
- H2（10 个）：一、服务与退款；二、用途限制（禁止行为）；三、服务性质与合法用途；四、使用行为与责任承担；五、平台的处置、报告与记录留存；六、责任限制；七、相关法律条文（摘录）；八、其他；举报违法使用；附：《余额与充值规则》（版本 2026-09-29）
- JSON-LD：0 个块，解析失败 0 个；顶层类型 （无）；全部类型 （无）

### `/support`

- 文件：`html/support.html`（102,718 字节）
- title（40 字）：常见问题与售后支持 - ChatGPT / Claude 充值答疑 - 贝果科技
- description（73 字）：ChatGPT、Claude 充值与订阅的常见问题：订单查不到怎么办、掉订阅如何退款、账号被封怎么处理、如何续费与换套餐，以及首次登录的分步指引。
- canonical：https://bigolab.com/support
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：常见问题与售后支持 - ChatGPT / Claude 充值答疑 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/support；og:type：website
- H1：购买之后，我们继续陪伴
- H2（4 个）：服务列表；使用教程；常见问题；短信接码
- JSON-LD：1 个块，解析失败 0 个；顶层类型 FAQPage, BreadcrumbList；全部类型 Answer, BreadcrumbList, FAQPage, ListItem, Question

### `/about`

- 文件：`html/about.html`（44,727 字节）
- title（26 字）：关于贝果科技 - AI 会员代充服务商 - 贝果科技
- description（126 字）：贝果科技（bigolab.com）由益阳市赫山区必高科技有限公司运营，提供 ChatGPT Plus / Pro、Claude Pro / Max 等 AI 会员充值与代充：卡密自助兑换，账号不经手，支付宝付款，可开增值税发票（标价不含税，税费另付）。
- canonical：https://bigolab.com/about
- robots：index, follow；googlebot：index, follow, max-image-preview:large, max-snippet:-1；X-Robots-Tag：（无）
- og:title：关于贝果科技 - AI 会员代充服务商 - 贝果科技（与 title 相同）
- og:url：https://bigolab.com/about；og:type：website
- H1：贝果科技让 AI 触手可及
- H2（3 个）：核心价值；下单前该知道的三件事；准备好开始了吗？
- JSON-LD：0 个块，解析失败 0 个；顶层类型 （无）；全部类型 （无）
