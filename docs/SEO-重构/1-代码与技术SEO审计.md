# 1 · 代码与技术 SEO 审计（bigolab.com）

- 审计对象：`D:/selfData/code/selling system/ai-service-shop-jiema`（短信接码会话的 worktree，Next 14.2.35 App Router）。下文 `文件:行号` 都指这份代码
- 线上核对：2026-09-30 13:44–14:00 用匿名 GET 抓取公开页面（没有登录，没有提交任何表单）。快照在 `scratchpad/seo/raw-1/`
- **worktree 比线上新**：线上 `/jiema/terms` 返回 404，sitemap 里也没有这一条，代码里两者都已经有了。凡是写「线上实测」的，说的都是**当前线上**的行为
- 三条主打业务：① AI 会员充值（`/chongzhi/*`、`/products/*`）② AI 大事记（`/news/*`，定位是**行业动态聚合工具**，不是新闻站）③ 短信接码（`/jiema`）
- 关键词本身怎么选不在本报告范围（见 kw/ 调研）。本报告只管「页面能不能被正确抓取、理解、引用、点击」，凡涉及措辞的建议，都以下拉建议实测为准

---

## 0. 结论速览（按优先级）

| # | 优先级 | 问题（一句话） | 位置 | 改动量 |
|---|---|---|---|---|
| 1 | **P0** | `/jiema` 和 `/jiema/terms` 的 og:title/og:description 继承了首页的「ChatGPT Plus / Claude Pro 充值与代充」（线上已确认）：分享卡片和 AI 爬虫读到的是另一门生意 | `jiema/layout.tsx:18-26`、`jiema/terms/page.tsx:31-35` | 小 |
| 2 | **P0** | canonical 写在带子路由的 `jiema/layout.tsx` 里，犯了交接文档 §24-⑧-④ 明令禁止的错。子页一律继承 `/jiema`，将来做服务落地页 `/jiema/[service]` 会全部自称是 `/jiema` 的副本 | `jiema/layout.tsx:23` | 小 |
| 3 | **P0** | 新闻详情页唯一的站内商业 CTA 链到 `/products?n=<slug>`，而 robots.txt 里 `Disallow: /*?n=`。465 个可索引新闻页往商业页送的链接权重，全部落在一个被禁抓的地址上 | `news/[slug]/page.tsx:393-400`、`robots.ts:105` | 小 |
| 4 | **P0** | `/jiema` 的 12 个热门服务链接是 `/jiema?s=tg` 这种形式，撞上了为新闻分享渠道写的 `Disallow: /*?s=`（参数重名） | `jiema/page.tsx:106-113`、`robots.ts:104` | 小 |
| 5 | **P0** | 同样 13 条接码 FAQ 同时在 `/support` 和 `/jiema` 两处标了 FAQPage（Google 规范要求重复的 FAQ 只标一处） | `support/layout.tsx:44-49`、`jiema/page.tsx:188` | 小 |
| 6 | **P0** | 没有自定义 404：线上是 Next 默认的英文页，有两个 `<title>`、两条互相矛盾的 robots meta，也没有导航 | 缺 `src/app/not-found.tsx` | 小 |
| 7 | **P0** | `http://bigolab.com/` 直接返回 200，不跳 https；HSTS 只有 300 秒 | Cloudflare / `nginx.conf:279` | 配置 |
| 8 | P1 | 接码只有一个页面：810 个服务全部是按钮，不是链接。「telegram 接码」「whatsapp 接码」这类长尾词没有可以排名的 URL | `jiema/page.tsx`，设计 §1.3 的 P2 | 中 |
| 9 | P1 | 大事记没有可抓取的分页、分类页和话题页。归档页服务端只输出本月前 20 条，其余走被 Disallow 的 `/api/`。sitemap 注释里「顺着归档页能走到每一条旧内容」这句不成立 | `news/archive/[month]/page.tsx:95`、`archive-list.tsx:45-46`、`sitemap.ts:127-128` | 中 |
| 10 | P1 | 三条业务之间几乎没有互链：9 个充值落地页链到 `/jiema` 的次数是 0，页脚没有 `/news`，首页服务端 HTML 里没有接码和大事记的内容 | 见 §8 | 中 |
| 11 | P1 | 首页的 title、H1、description、服务端正文只覆盖业务 ①。ChatGPT-User 抓得最多的正是首页，服务端 HTML 里还挂着一句「加载中...」 | `(shop)/page.tsx:33-45`、`home-client.tsx:97,317,381` | 中 |
| 12 | P1 | 性能：首页 H1 服务端输出 `opacity:0`，要等水合后才可见（拖慢 LCP）；页脚 220KB 的 PNG 被 React 自动 preload 到每一页；每页首屏 JS 208–229KB（gzip）；`/jiema` 的 HTML 有 188KB，其中 142KB 是 RSC 数据 | `home-client.tsx:149-153`、`footer.tsx:47-53` | 小到中 |
| 13 | P1 | 根布局 force-dynamic，所以全站 `Cache-Control: private, no-store`，Cloudflare 一律 DYNAMIC，零边缘缓存 | `app/layout.tsx:18` | 中 |
| 14 | P1 | sitemap 只有一个文件、不分段，Search Console 里没法按业务线看收录；落地页没有 lastmod；`/games` 这种无关主题的页面也在里面 | `sitemap.ts:51-75` | 小 |
| 15 | P1 | IndexNow 只推新闻，而且连 noindex 的薄页也推；商业页和 `/jiema` 从来不推 | `pipeline.ts:1576`、`api/cron/news/route.ts:140-148` | 小 |
| 16 | P1 | 公告弹窗对每个首次访问的人都会弹，包括从搜索进来、落在任何页面上的人，等于移动端的强制插页 | `announcement-modal.tsx:97` | 小 |
| 17 | P2 | Organization 的 description 和 slogan 只提「AI 会员代充」，没提另外两条业务；`/about` 的 title 里有「AI 会员代充」 | `lib/seo/graph.ts:79-81`、`about/layout.tsx:15` | 小 |
| 18 | P2 | 大事记的结构化数据有缺口：`/news`、归档、日报周报都是 0 个 JSON-LD；详情页没有 BreadcrumbList；Article 的 dateModified 没有传进去 | `news/[slug]/page.tsx:413-421` | 小 |
| 19 | P2 | og:site_name/og:locale 有缺（首页、`/news`、`/support`）；根布局的 keywords 把 ChatGPT 词带到了 `/jiema` 和 `/news` 上 | `(shop)/page.tsx:43`、`app/layout.tsx:89` | 小 |
| 20 | P2 | 百度推送的优先清单里没有 `/jiema` | `scripts/baidu-push.ts:72-91` | 小 |

**不要动的（已经做对，别在重构时改坏）**：根布局刻意不写 canonical（`app/layout.tsx:91-93`）；私密页是 noindex+follow，和 Disallow 互斥（`lib/seo/private-page.ts`）；薄新闻页 noindex，sitemap 与详情页共用同一个判定（`lib/news/thin.ts`、`sitemap.ts:113-115`）；Article 刻意不用 NewsArticle（`lib/news/seo.ts:8-12`）；不输出 aggregateRating；JSON-LD 转义（`lib/seo/jsonld.tsx` + `scripts/check-jsonld.ts`）；`?ref=` 靠 canonical 处理、不进 Disallow；渠道站用三道闸 noindex；`/jiema` 灰度期 noindex，sitemap 与页面用同一个开放判定 `jiemaPublicOpen`。

---

## 1. 公开路由与 metadata 总表

图例：S = Server Component 外壳，C = 客户端组件；「继承」指 metadata 从上层 layout 继承；OG✓ 表示本页自己写了 openGraph（Next 是整块替换，不是深合并，见 `lib/seo/og.ts:250-266`）。

| 路由 | 渲染 | title（代码/线上） | canonical | robots | OG | JSON-LD | sitemap | 渠道站 |
|---|---|---|---|---|---|---|---|---|
| `/` | S+C | ChatGPT Plus / Claude Pro 充值代充 - 卡密自助兑换 - 贝果科技 | `/` | index | ✓（缺 site_name/locale） | Organization + WebSite | 1.0 | 渲染，noindex |
| `/chongzhi` | S | AI 会员充值 - ChatGPT Plus、Claude Pro 代充价格表 - 贝果科技 | self | index | ✓ | Breadcrumb + FAQPage + ItemList | 0.9 | 404 |
| `/chongzhi/{chatgpt-plus,chatgpt-pro,claude-pro,claude-max,claude-kyc,claude-zhuce,codex-jiema,google-zhanghao,grok-super}` | S | 来自 `lib/landing/registry.ts` | self | index | ✓ | Breadcrumb + FAQPage + ItemList | 0.9 | 404 |
| `/products` | S+C | ChatGPT Plus / Claude Pro 充值与购买价格表 - 贝果科技 | `/products`（`?category=` 也指回这里，线上已验证） | index | ✓ | ItemList + Breadcrumb | 0.9 | noindex，不输出 ItemList |
| `/products/[id]` | S+C | `商品名 - 贝果科技`（`lib/product-seo.ts:64-68`） | self | index；不存在 → 404；库挂了 → 降级标题 + canonical | ✓ | Product + Organization + Breadcrumb | 0.8（21 条） | noindex，不输出 Product |
| `/news` | S+C | AI 圈大事记 - 每日 AI 动态聚合 | self | index | ✓（缺 locale） | **无** | 0.7 hourly | 404 |
| `/news/[slug]` | S | `{headline} - AI 圈大事记` | self | 薄页 noindex,follow | article | Article | 90 天内的非薄页（线上 465 条） | 404 |
| `/news/archive/[month]` | S+C | `{YYYY 年 M 月} AI 圈大事记 · 全月归档` | self | index | ✓ | **无** | 最近 24 个月（线上 2 条） | 404 |
| `/news/digest/[type]/[period]` | S | `{digest.title} - AI 圈大事记` | self | index | ✓ | **无** | 最近 60 期（线上 25 条） | 404 |
| `/jiema` | S+C | 短信接码 - 海外手机号在线接收验证码 - 贝果科技 | `/jiema`（**写在 layout 里**） | 开放 → index，灰度 → noindex | **✗，继承首页** | FAQPage（只在 OPEN 时） | 开放时 0.8（线上已在） | 404 |
| `/jiema/terms` | S | 短信接码服务条款 - 贝果科技 | self | 随 /jiema | **✗，继承首页** | 无 | 开放时 0.3（**线上未部署，404**） | 404 |
| `/jiema/records`、`/jiema/order/[no]` | C | 我的接码记录 / 短信接码 · 我的号码 | **继承 `/jiema`** | noindex, **nofollow** | ✗ | 无 | ✗ | 404 |
| `/support` | layout S + 页面 C | 常见问题与售后支持 - ChatGPT / Claude 充值答疑 - 贝果科技 | self | index | ✓（缺 site_name/locale） | FAQPage（开放后含 13 条接码 FAQ）+ Breadcrumb | 0.7 | — |
| `/about` | layout S | 关于贝果科技 - AI 会员代充服务商 - 贝果科技 | self | index | ✓ | 无 | 0.5 | — |
| `/terms`、`/privacy` | S | 服务条款 / 隐私政策 - 贝果科技 | self | index | ✓ | 无 | 0.3 | — |
| `/links` | S | 友情链接 · 招商合作 - 贝果科技 | self | index | ✓ | 无 | 0.4 | — |
| `/iptools` | layout S + C | IP 地址查询与网络检测工具合集 - 贝果科技 | self | index | ✓ | 无 | 0.3 | 关闭 |
| `/forum`、`/forum/[id]` | C | 社区讨论…（帖子页继承列表页标题） | 无 | index | 列表页 ✓ | 无 | `/forum` 0.6 | — |
| `/games`、`/games/{2048,snake,tetris}` | C | 各自有标题 | 无 | index | 列表页 ✓ | 无 | `/games` 0.3 | — |
| 私密页：login/register/forgot-password/orders/profile/*/wallet/*/vip/coupons/redeem/lookup | C | `X - 贝果科技` | 无 | noindex, follow（`private-page.ts:334-344`） | — | — | ✗ | — |
| `/coupon/[code]`、`/redeem/[provider]` | — | — | — | noindex, nofollow | — | — | ✗ | — |
| 带 token 的页：`/receipt` `/pay` `/finance` `/reply` `/invoice-request` `/unsubscribe` | — | 中性标题 | — | noindex + robots Disallow | — | — | ✗ | Disallow |

---

## 2. metadata 继承机制（generateMetadata 模板）

**现状**
- 根布局用 `generateMetadata` 按店面出站点级 metadata（`app/layout.tsx:178-182`、`81-172`）：metadataBase = 店面 origin；title/description = 首页那一套（`:23`、`:33-34`）；keywords（`:89`）；openGraph/twitter 带默认分享图（`:133-147`）；robots index + max-image-preview:large（`:148-153`）；百度的 `applicable-device`（`:165-167`）、`no-transform`/`no-siteapp`（`:197-200`）。渠道站在这个基础上改成 noindex,follow，并去掉站长验证 meta（`:169-171`）。
- 刻意不用 `title.template`（`:84-85`），每页写完整标题。刻意不写 canonical（`:91-93`）。
- Next 14.2 的合并规则（`node_modules/next/dist/lib/metadata/resolve-metadata.js:391-447`）：**只有页面自己没写 openGraph 时，父级的 openGraph 才整块继承下来**，而且只在 og 没有 title 的情况下才用页面 title 补。根布局的 og 带了 title，所以**任何只写 title/description、不写 openGraph 的页面，og:title/og:description 都会变成首页那句「ChatGPT Plus / Claude Pro 充值与代充」**。

**问题**
1. `/jiema`、`/jiema/terms` 正好中了这条（线上 `/jiema` 的 og:title 已确认是首页文案，快照在 `raw-1/p_jiema.html`）。`/jiema/records`、`/jiema/order/*` 同样中招，不过这两页 noindex，影响小。
2. 覆盖 openGraph 的页面，有的没展开 `OG_SITE`（`lib/seo/og.ts:296`），于是 og:site_name/og:locale 丢了：首页（`(shop)/page.tsx:43`）、`/support`（`support/layout.tsx:37` 附近）、`/about`、`/links`、`/iptools`、`/terms`、`/privacy`；`/news` 这一组缺 locale。
3. 404 页继承了根布局的 `robots: index, follow`，Next 又自动插了一条 `noindex`，线上 HTML 里两条并存，还有两个 `<title>`（`raw-1/p_this-page-does-not-exist-xyz.html`）。

**影响**：微信、Telegram、Slack 转发接码页时卡片写的是 ChatGPT 充值，点击率和信任都受损；AI 爬虫读到的 og 描述和页面主题对不上。

**建议**
- 在 `lib/seo/og.ts` 加一个 `pageOg({title, description, path, type})` 小工厂，统一返回 `{ openGraph: {...OG_SITE, images: OG_IMAGES, ...}, twitter: {...} }`。**所有自己写 title 的公开页都必须调它**。再加一个断言脚本：遍历公开路由，抓 HTML，检查 og:title === `<title>` 的主干。
- 根布局 og 的 title/description 改成品牌中性的一句（比如「贝果科技 bigolab.com」），这样漏写的页面至少不会冒用 ChatGPT 文案。

---

## 3. sitemap.ts

**现状**（`src/app/sitemap.ts`）
- 渠道站 / 没有店面的 Host 返回空（`:33-34`）。
- 静态页不写 lastmod，是刻意的（`:44-50`）。清单在 `:51-75`：首页、`/chongzhi` 和 9 个子页、`/products`、`/news`、`/support`、`/forum`、`/about`、`/links`、`/terms`、`/privacy`、`/games`、`/iptools`。
- `/jiema` 与 `/jiema/terms` 只在 `jiemaPublicOpen` 为真时收录（`:79-83`）。
- 新闻：90 天内、上限 2000 条、先粗筛 `detailState: 'DONE'`，再用 `shouldNoindexEvent` 精筛，lastmod = updatedAt（`:92-124`）。归档：最近 24 个月（`:130-150`）。日报周报：最近 60 期（`:153-175`）。商品：在售、上限 500（`:178-194`）。
- 线上：535 条，其中新闻详情 465、日报周报 25、归档 2、商品 21、落地页 10，另有 12 个静态页。**新闻类占 92%**。

**问题**
1. **只有一个文件、不分段**。Search Console 里没法按业务线（充值 / 接码 / 大事记）看「已提交 vs 已编入索引」，三条主打业务的收录率混成一个数。
2. 落地页有真实的人工核对日期 `LANDING_REVIEWED_AT`（`lib/landing/registry.ts:66`），却没用作 lastmod。这批页面是商业主力，恰恰最需要一个可信的新鲜度信号。
3. 注释 `:127-128` 说「爬虫顺着归档页仍然能走到每一条旧内容」，这句**不成立**（见 §11）。
4. `/games`（2048 / 贪吃蛇 / 俄罗斯方块）和 AI 充值、接码、AI 动态这几个主题无关，却一直在被提交；`/forum` 的正文全是客户端渲染，爬虫看到的是薄页（§28 已经决定暂不暴露论坛）。
5. `/jiema/terms` 线上没有（部署滞后），上线后要核对。

**建议**
- 用 Next 14 的 `generateSitemaps()`，或者手写 `/sitemap.xml` 作为 sitemap index，拆成 `sitemap/core.xml`（首页、充值、商品、接码、客服、信任页）、`sitemap/news.xml`（事件）、`sitemap/news-hub.xml`（归档、日报周报、以后的分类和话题页），每个分段在 GSC 里单独提交。**注意**：不要叫 Google News sitemap，也不要用 `<news:news>` 扩展，那是在自证新闻站。
- `/chongzhi/*` 的 lastmod = `LANDING_REVIEWED_AT`（真实值）；`/jiema/terms` 的 lastmod = `JIEMA_TERMS_VERSION`。
- `/games` 移出 sitemap，并考虑给它加 noindex,follow（页面保留）。`/forum` 等 §28 的限流做完再说。

---

## 4. robots.ts

**现状**（`src/app/robots.ts`）
- 主站（`:71-112`）：`*` Allow `/`，Disallow 带 token 的页、`/admin`、`/api/`、`/lookup`、`/*?s=`、`/*?n=`；输出 Sitemap 和 Host。
- 渠道站（`:45-69`）：8 个 AI 爬虫整站 Disallow；其余 UA 只挡私密路径，不写 `Disallow: /`（为了让 noindex 能被读到，这是对的）。
- 线上 robots.txt 与代码一致（`raw/robots.txt`）。

**问题**
1. **参数重名**：`?s=` 本来是新闻分享渠道（`lib/news/share.ts:19`），接码又拿 `?s=` 当服务选择（`jiema/jiema-client.tsx:16`、`jiema/page.tsx:109`）。结果 `/jiema?s=tg` 这类站内链接被禁抓。canonical 本来就指向 `/jiema`，所以不会产生重复内容，但这 12 条带服务名锚文本的内链白白浪费了。
2. **`/*?n=` 把新闻到商业页的链接挡了**（详见 §8、§11）。
3. `/*?s=` 只匹配 `s` 排在第一个参数的情况，`?ref=x&s=w` 不命中。这是小问题，因为 canonical 会兜底。
4. `Host:` 不是 Google 的指令，无害。

**建议**
- 接码服务参数改名（比如 `?svc=`），或者直接让热门服务链到 `/jiema/<service>`（P1 #8）。别去改 `/*?s=` 这条规则本身，那是给新闻分享副本用的。
- 新闻归因不再走 query（见 §11 建议 3），之后 `/*?n=` 仍然保留，用来兜住外部流传的旧链接。
- 主站**不要**加 AI 爬虫的 Disallow：chatgpt.com 是最大的外部来源，OAI-SearchBot 是第一大爬虫（§28）。可以考虑加一个显式的 `User-agent: OAI-SearchBot / ChatGPT-User / PerplexityBot / ClaudeBot` 组，内容与 `*` 相同，让意图更清楚（纯文档作用，行为不变）。

---

## 5. JSON-LD（lib/seo/graph.ts、lib/seo/jsonld.tsx、lib/product-seo.ts、lib/news/seo.ts）

**现状**
- `<JsonLd>` 统一转义 `< > & U+2028 U+2029`（`lib/seo/jsonld.tsx:226-249`），`scripts/check-jsonld.ts` 有断言覆盖。`ArticleJsonLd` 用自己的 `replace(/</g,'\\u003c')`，双反斜杠，是对的（`components/news/article-jsonld.tsx:18`）。
- Organization：只在首页和商品详情页输出，legalName = 益阳市赫山区必高科技有限公司，没有 sameAs（`graph.ts:55-92`）。WebSite：不带 SearchAction（`:102-113`）。
- 落地页：Breadcrumb + FAQPage + ItemList；商品详情：Product/Offer（`seller` 用 `@id` 引用 Organization）+ Organization + Breadcrumb（`products/[id]/page.tsx:283-300`）；新闻详情：Article（作者是组织，`citation` 列出信源）；`/jiema`：开放时只有 FAQPage；`/support`：FAQPage + Breadcrumb。
- 线上每页各有 1 个 `<script type="application/ld+json">`（多个节点放在一个数组里）。

**问题**
1. **FAQ 重复标注**：接码对全部用户开放时，`/support` 把 13 条接码 FAQ 并进了 FAQPage（`support/layout.tsx:44`），`/jiema` 也输出同一份（`jiema/page.tsx:188`）。Google 的 FAQ 规范是「同一个问答在站内重复出现时只标一处」。落地页 FAQ 和 `/support` FAQ 之间有没有重复题，也要顺手排一遍。
2. Organization 的 description 和 slogan（`graph.ts:79-81`）只写了「AI 会员的代充值与订阅开通」「AI 会员代充与订阅开通」，没有短信接码，没有 AI 动态聚合；也没有 `knowsAbout`、`sameAs`。对「贝果科技是做什么的」这类实体问题（GEO），这是模型能读到的唯一官方自述。
3. `/news`、归档、日报周报都是 0 个 JSON-LD；新闻详情没有 BreadcrumbList；Article 的 `publisher` 是内联对象，没有用 `@id` 指向 ORG_ID（`lib/news/seo.ts:86-91`）；页面调 `ArticleJsonLd` 时**没传 `updatedAt`**（`news/[slug]/page.tsx:413-421`），所以 dateModified 恒等于 datePublished。
4. `/jiema` 只有 FAQPage，没有 BreadcrumbList，也没有描述这项服务本身的节点。
5. Product：`brand` 写的是「贝果科技」（`product-seo.ts:168`），没有 `hasMerchantReturnPolicy`；没上传商品图时 image 回落到站标（`:166`）。这些都会在 GSC 的「商家信息」报告里变成警告，不是错误。

**建议**
- `/support` 在接码开放后只渲染 13 条接码 FAQ，**不**并进 FAQPage；FAQPage 只留在 `/jiema`。
- Organization：description 按三条业务重写（「AI 会员充值、短信接码、AI 行业动态聚合」，**不写「新闻」**）；加 `knowsAbout: ['ChatGPT Plus','Claude Pro','短信验证码接收', …]`；`sameAs` **只填真实存在的公开主页**（比如公众号「贝果科技bigo」有公开 URL 才填，没有就不写）。slogan 去掉「代充」，以词表结论为准。
- 大事记这一组：
  - `/news` 与归档：`CollectionPage` + `ItemList`（只放 url 和 name）+ `BreadcrumbList`，**不要**用 NewsMediaOrganization 或 NewsArticle
  - 详情页：BreadcrumbList（首页 › AI 圈大事记 › 分类 › 标题，要配可见面包屑）；`publisher: {'@id': ORG_ID}`；传入 `updatedAt`
  - 改动前按 `.claude/skills/ai-news-pipeline/SKILL.md §10` 确认：以上都不涉及那 5 条红线
- `/jiema`：可见面包屑 + BreadcrumbList。服务节点只用 `Service`（`provider` 引用 ORG、`areaServed`、`offers.priceSpecification` 写「起价」），不要用 Product/AggregateOffer 去编评分或库存。国家/地区的命名按 D44。
- Product：`brand` 改成被充值的品牌（OpenAI / Anthropic）存在商标误导风险，维持现状。补一条 `hasMerchantReturnPolicy`（数字商品，按 /terms 的退款口径写）是低风险的加分项。

---

## 6. 面包屑

| 页面 | 可见面包屑 | BreadcrumbList |
|---|---|---|
| `/chongzhi`、`/chongzhi/*` | ✓（`components/landing/landing-ui.tsx:28-47`） | ✓ |
| `/products` | ✓ | ✓ |
| `/products/[id]` | ✓（在 client 组件里，三级，不含分类，与 JSON-LD 对齐） | ✓ |
| `/support` | ✓（`support/layout.tsx`） | ✓ |
| `/news/[slug]`、归档、日报 | ✗（只有一个「← AI 圈大事记」返回链接） | ✗ |
| `/jiema`、`/jiema/terms` | ✗ | ✗ |
| `/about`、`/terms`、`/privacy` | ✗ | ✗ |

**建议**：大事记和接码两组都补「可见 + 结构化」的一对（复用 `Breadcrumbs` 组件）。搜索结果里面包屑代替裸 URL，是这类站最稳的一个富结果。接码：首页 › 短信接码 › {服务}（以后的服务页）；大事记：首页 › AI 圈大事记 › {分类}。

---

## 7. 渠道分站（tenant）对 SEO 的影响

**现状（做得对）**
- 三道 noindex 闸：根布局 robots 改成 noindex,follow（`app/layout.tsx:169-171`）；nginx `X-Robots-Tag: noindex, follow`（`nginx/nginx.conf:111,281`）；robots.txt 按店面输出，sitemap 为空（`sitemap.ts:33-34`）。
- canonical 通过「相对路径 + 店面 metadataBase」指向渠道自己的 origin（不跨域指回主站）。渠道价和主站价不同，自指 + noindex 是正确组合。
- 渠道站关闭 `/news`、`/chongzhi`、`/jiema`（各 layout 调 `notFoundOnChannel()`），不输出 Product JSON-LD 与 ItemList。
- `*.bigolab.com` 的通配子域按渠道处理（`nginx.conf:97`），新渠道自动 noindex；服务器 IP 直连按主站处理时，`siteOrigin()` 让 canonical 仍然指向 bigolab.com（`lib/storefront/resolve.ts:55`）。

**问题 / 影响**
1. 为了让店面按请求解析，根布局 `force-dynamic`（`app/layout.tsx:18`）→ **prerender routes = 0**，全站没有静态页，没有 ISR。这是分站方案给 SEO 性能带来的主要代价（见 §13）。
2. 渠道站把 AI 爬虫整站 Disallow，但仍然输出指向主站资源的绝对 og:image（`lib/seo/og.ts:279`）。这是无害的品牌一致。

**建议**：不需要为 SEO 改渠道逻辑。以后新增公开页面组（比如 `/jiema/[service]`、`/news/c/[cat]`）时照抄：layout 第一行 `notFoundOnChannel()`；**layout 不写 metadata**；sitemap 只在 PLATFORM 下出。

---

## 8. 内链（导航 / 页脚 / 正文互链）

**现状**
- 顶部导航（`components/layout/header.tsx:33-43`）：首页、充值(`/chongzhi`)、商品、接码(`/jiema`，只在开放时显示)、AI圈大事记、IP工具、论坛、客服、友链。header 是 `'use client'`，但会做 SSR，桌面导航在 HTML 里；移动菜单只在点开后才渲染（`:332-391`）。因为桌面版的 `<nav className="hidden md:flex">` 也在 HTML 里，爬虫照样拿得到链接。
- 页脚（`footer.tsx:83-172`）：`/chongzhi` + 9 个子页、Claude/ChatGPT 充值、全部商品、`/jiema`（开放时）、IP 工具、订阅查询、常见问题、关于、友链、隐私、条款。**没有 `/news`**。
- 首页服务端 HTML（`raw-1/p_.html`，可见文本 1561 字）：9 张落地页卡片 + hub + 商品；「精选服务」这一块是客户端 fetch `/api/products`，服务端 HTML 里留着「加载中...」（`home-client.tsx:97,317`）；「AI 圈今日热点」是客户端 fetch `/api/news/hot`（`news-hot-section.tsx:30`），服务端 HTML 里没有一条新闻链接；正文**没有接码入口**。
- 9 个落地页：互链（`RelatedLandings`）+ 商品页 + `/products` + `/support` + `/terms`。**链到 `/jiema` 的次数是 0**（grep 为空），链到 `/news` 的也是 0。
- 新闻详情（`news/[slug]/page.tsx`）：同分类 4 条相关（`:342-363`）、`/products?n=<slug>`（`:393-400`）、`/forum`。线上抽样一个详情页：正文里只有 1 条链到商品（带 `?n=`），其余商业链接全来自页脚。
- `/jiema`：链到 `/products`、`/support#jiema`、`/jiema/terms`，热门服务链到 `/jiema?s=`。

**问题**
1. **三条业务互相孤立**：
   - 接码 ← 充值：`claude-zhuce`（注册要手机号验证）、`codex-jiema`（Codex 验证码）说的正是接码的使用场景，却不链 `/jiema`。反过来，`/jiema` 上的 OpenAI、Claude 服务也不链相应的落地页
   - 大事记 → 充值：唯一的 CTA 被 `?n=` 挡住了；也没有按主题的上下文链接（讲 Claude 的条目不链 `/chongzhi/claude-pro`）
   - 页脚没有大事记，首页服务端 HTML 里既没有大事记也没有接码
2. **关键词内耗风险**：`/chongzhi/codex-jiema`（SMS 交付的单品，￥8 起）和 `/jiema` 的 OpenAI 服务（￥5.50 起）会同时去吃「codex 接码 / openai 接码」这组词。两页互不相链，也没有写清各自适合谁。
3. 锚文本：导航里是「充值」「接码」这种短词。页脚和首页卡片的锚文本（「ChatGPT Plus 充值」「Codex 接码」）质量是好的。

**建议（链接矩阵，以服务端直出的 `<a>` 为准）**

| 从 → 到 | 充值落地页 | /jiema（及服务页） | /news |
|---|---|---|---|
| 首页 | 已有 | **新增**服务端「短信接码」区块：热门 6 个服务 + 起价 + 链接 | **新增**服务端「最新 AI 动态」6 条（替换客户端 fetch） |
| 落地页 | 已有 | **新增**：claude-zhuce / codex-jiema / google-zhanghao 在「验证码」一节链到 `/jiema`（将来直接链 `/jiema/openai`、`/jiema/claude`、`/jiema/google`） | 可选：「近期 Claude/ChatGPT 动态」3 条（按话题查询） |
| /jiema | **新增**：OpenAI/Claude 服务旁链「需要 Plus/Pro 充值 →」 | 服务页互链 | — |
| 新闻详情 | **改**：按 category/tags 或实体给一条上下文 CTA（OpenAI → chatgpt-plus，Anthropic → claude-pro），干净 URL | — | 已有 |
| 页脚 | 已有 | 已有（开放时） | **新增** `/news` |

说明：以上都是站内导航，不涉及新闻内容本身，不碰 SKILL.md 的红线。新闻 CTA 的措辞保持中性（「本站在售的 AI 订阅」），不要把新闻正文写成软文。

---

## 9. 充值落地页 /chongzhi/*

**现状**：注册表驱动（`lib/landing/registry.ts`），纯 Server Component，正文、价格、FAQ 全部服务端直出；description 带实时最低价（`withLivePrice`）；可见的「内容核对于 2026-09-24」（`landing-ui.tsx:75`）；Breadcrumb + FAQPage + ItemList；有 og；渠道站 404。线上抽查 chatgpt-plus：可见文本 7829 字，HTML 124KB（其中 RSC 数据 70KB）。

**问题**
1. §28 的结论是「chatgpt-plus 被六家爬虫读，claude-pro 最厚但几乎没人读」，并且**暂不重构这 9 页**。技术面上唯一明显的缺口是落地页 → 接码、→ 大事记的互链（§8），以及 lastmod（§3）。
2. hub 的 title 是「AI 会员充值 - … 代充价格表」（`registry.ts:81`）。「AI 会员充值」这个品类词没有实测记录（「ai会员代充」实测为 0），要和词表调研对一下。
3. 核对日期只存在于可见文本里，结构化数据里没有。

**建议**：保持 §28 的「不重构」约束；只做这三件：① 补链到接码和大事记的内链；② sitemap 的 lastmod 用 `LANDING_REVIEWED_AT`；③ JSON-LD 加一个 `WebPage` 节点（`dateModified`/`lastReviewed` = `LANDING_REVIEWED_AT`，`publisher: {'@id': ORG_ID}`）。这是对 GEO 有利的「可核验新鲜度」信号。

---

## 10. 商品页 /products、/products/[id]

**现状**：Server 外壳 + 客户端组件，`initialProduct` 让整页直出（`products/[id]/page.tsx`）；canonical 指向干净 URL（`?ref=` 专属价不进索引）；三态：不存在 404、库挂降级、正常；description 不够 40 字时用模板补齐；Product 不带评分。

**问题**
1. title = 后台商品名 + 站名（`product-seo.ts:64-68`）。线上 `/products/4` 是「ChatGPT Plus自助充值 | 信用卡冲 - 贝果科技」，错别字「冲」出现在 title 和 H1 里（§28 待办，需要站长改后台）。
2. URL 是数字 ID，不带词。中文站这一项影响很小，不建议迁移（迁移要做 301，收益低）。
3. 商品正文仍然偏薄（§28 待办）。

**建议**：只推站长改后台文案（名称错别字、description、features），代码不动。

---

## 11. /news 大事记（列表 / 详情 / 分类 / 标签 / 分页 / canonical / noindex）

**现状**
- 列表 `/news`（`news/page.tsx`）：服务端直出最新 20 条（`NEWS_PAGE_SIZE`，`lib/news/format.ts:400`）、今日/本周重点、补录、日报周报入口、按月归档（最近 12 个月）；自指 canonical；`ai-generated` meta。
- 分类：6 个固定分类（`lib/news/constants.ts:6-13`），**只是客户端状态**（`news-stream.tsx:316-330` 的 `<button>`），不进 URL，没有分类页（`sitemap.ts:85-88` 有说明）。
- 标签：Article 的 keywords 里有，SKILL §4 规定是 60–80 个白名单词，但**没有话题页**。
- 分页：「加载更多」走 `fetch('/api/news/list')`（`news-stream.tsx:111`、`:419-429`），而 `/api/` 被 Disallow。**爬虫只能看到第 1 页的 20 条**。
- 归档 `/news/archive/[month]`：服务端只输出**本月按 baseScore 排的前 20 条**（`archive/[month]/page.tsx:95`），其余由 `archive-list.tsx:45-46` 客户端拉取。
- 日报周报：每期列出当期入选的事件，并有往期互链（`digest/[type]/[period]/page.tsx:149,233-256`），这是目前唯一一条能走到较旧条目的抓取路径。
- 详情 `/news/[slug]`：没有全文层（detail）的事件 noindex,follow（`:62-70`）；canonical 自指；og 用分类底图；AI 标识 6 处齐全；信源外链带 `nofollow`；相关推荐 4 条（同分类最新）。
- 今日/本周重点那一栏是 `<button>`，点了是滚动定位或 router.push（`news-stream.tsx:151-162,239-241`），不是链接。

**问题**
1. **抓取深度断层**：一个 90 天前的事件，如果既不在当月前 20、又没进日报周报，站内就没有任何服务端链接指向它。它也不在 sitemap 里（90 天窗口），实际上是孤儿页。`sitemap.ts:127-128` 的注释承诺与事实不符。
2. **没有可排名的聚合页**：「OpenAI 最新动态」「Claude 更新」「AI 模型发布」这类有持续搜索量的聚合意图，没有对应的 URL 去承接。而这些聚合页正好是连接大事记和充值业务的桥（Claude 话题页 ↔ claude-pro 落地页）。
3. **`?n=` 归因链接被 Disallow**（`news/[slug]/page.tsx:395` 的 `withNewsRef`）：465 个可索引页送给 `/products` 的权重全部浪费；而且链的是泛化的 `/products`，不是和话题相关的落地页。
4. 详情页的日期：`datePublished = happenedAt`（事件发生的时间），但补录条目是几天以后才写出来的（`publishedAt`）。这不影响收录，但 Article 的日期语义要统一：建议 datePublished 用 publishedAt，事件时间写进正文。
5. 列表和详情页的 title 不带站名（「… - AI 圈大事记」）。这是刻意为之（微信分享标题）。SERP 上 Google 通常会自己补站点名，可以保持。
6. 渠道站 404，没问题。

**建议**（每一条都**不**涉及 SKILL.md §10 的 5 条红线；新页面都必须带 `other: {'ai-generated':'true'}`，列表卡片带「AI 摘要」徽章）
1. **可抓取分页**：`/news?page=N`（或 `/news/page/N`）和 `/news/archive/2026-09?page=N`，服务端渲染，页面上有 `<a href>` 形式的「下一页 / 上一页」（「加载更多」可以留着做渐进增强，但底下要有真实链接）。分页页 canonical 自指，**不要**全部指回第一页（Google 已不支持 rel=prev/next，自指是官方建议）；第 2 页以后可以 noindex,follow，只当抓取通道。
2. **分类页 `/news/c/<slug>`**（6 个，固定）：服务端列表 + 分页 + 该分类的导语（自写，1 段），canonical 自指，进 sitemap 的 news-hub 分段。标题避开「新闻」，用「动态 / 大事记」。
3. **话题页 `/news/t/<tag>`**：只给白名单标签里条目 ≥ 10 条的开页（阈值以下 noindex 或不生成），防止薄页泛滥（SKILL §4 已经预警）。优先做实体话题：OpenAI、ChatGPT、Anthropic、Claude、Gemini、Grok、Codex。每个话题页固定一块「相关服务」卡片，链到对应的 `/chongzhi/*`，这就是业务 ② 往 ① 导流的主通道。
4. **归因改成不改 URL**：CTA 用干净的 href，点击时在 `onClick` 里把 slug 写进 localStorage（复用 `lib/news/attribution.ts` 的存储格式），或者改用 `#n=<slug>` 这种 hash 形式（爬虫忽略 fragment，capture 那一侧要同步改成读 hash）。改完 `/*?n=` 这条 Disallow 仍然保留，兜住外部流传的旧链接。
5. `ArticleJsonLd` 传 `updatedAt`；详情页补可见面包屑 + BreadcrumbList（首页 › AI 圈大事记 › {分类页}）。
6. sitemap 那句注释改成与事实一致，或者在做完第 1 条之后才算成立。

---

## 12. /jiema 与 /jiema/terms 的收录条件

**现状**
- 开放判定：`jiemaPublicOpen(sms_config)`，条件是整份校验通过 + enabled + audience=ALL + `JIEMA_ORDER_AVAILABLE`。页面 robots（`jiema/layout.tsx:18-26`）、导航和页脚（`(shop)/layout.tsx:52`）、sitemap（`sitemap.ts:79-83`）用的是同一个判定，读不到配置就按关处理（fail-closed）。线上现在是开放状态：`/jiema` 为 index，已进 sitemap，FAQPage 已输出。
- `/jiema/terms`：robots 跟随 layout，canonical 自指（`terms/page.tsx:31-35`），开放时进 sitemap。**线上仍是 404（未部署）**。
- 页面（`jiema/page.tsx`）：服务端外壳出 H1「短信接码」、一行说明、12 个热门服务链接、目录快照（交给客户端，810 个服务）、三栏规则、13 条 FAQ（放在 `<details>` 里，服务端直出）。线上 HTML 188KB，**可见文本 3288 字**（含导航和页脚），RSC 数据 142KB。
- 合规：HTML 和 RSC 数据里都搜不到 `hero-sms/herosms`（已验证）；标题和描述里没有国内平台名（Q6）；D44 的地区命名由种子数据保证。

**问题**
1. og 继承首页（§2），canonical 写在 layout（§0 #2）。
2. **只有一个 URL**，承接不了「<平台> 接码」「<国家> 手机号 接码」这类长尾词。服务列表是按钮，不是链接；热门链接又被 `?s=` 规则挡住。
3. 可见正文偏薄（去掉导航页脚大约 2.5K 字，其中大半是 FAQ）。没有「什么是短信接码 / 适用场景 / 与实体卡的区别 / 价格怎么定」这类能被 AI 引用的说明段。
4. 142KB 的目录快照随 HTML 下发，移动端首屏的解析和水合成本高。
5. `/jiema/records`、`/jiema/order/*` 是 `noindex, nofollow`（`records/page.tsx:15-18`、`order/[orderNo]/page.tsx:19-22`），和全站私密页「noindex, follow」的口径不一致，还继承了 canonical=/jiema，信号互相矛盾。页面需要登录，影响小。

**建议**
1. P0：canonical 从 layout 挪到 `jiema/page.tsx`（`export async function generateMetadata`，连同 robots、og 一起）。layout 只保留 `notFoundOnChannel()`；records/order 改用 `privatePageMetadata()`。
2. P1：做 **`/jiema/[service]` 白名单服务页**（设计 §1.3 已预留）：
   - 首批 ≤ 15–20 个，按实测搜索量挑（例如 openai、claude、telegram、whatsapp、google、discord…，**以词表调研为准**）。每页服务端直出：该服务在各国家/地区的实时起价表（复用 `pricing.salePriceCents`，别另算价）、「收不到码怎么办」的平台专属要点、可复用的规则摘要、链接到 `/jiema?svc=` 的下单入口、相关充值落地页
   - **不要**按「服务 × 国家」批量生成（810 × 180 个模板页），那正是 §24 列出的 doorway / scaled content 形态
   - canonical 自指，进 sitemap 的 core 分段，受同一个 `jiemaPublicOpen` 控制；可见面包屑 + BreadcrumbList
   - 标题措辞走词表实测，不写零需求词，不写「HeroSMS」，不链上游
3. `/jiema` 主页补一段服务端正文（300–600 字：用途边界、退款规则、与实体卡接码的区别、价格说明，每一句都要对照代码行为核实，§24-⑧-② 的教训），首屏只直出热门的 30 个服务，完整目录在客户端懒加载（或者分块流式输出），把 HTML 压到 60KB 以内。
4. 条款页上线后核对：线上 200、在 sitemap 里、og 正确。

---

## 13. prerender routes = 0（全部动态渲染）对性能与缓存的影响

**现状（线上实测，客户端在国内经代理访问）**
- 所有页面：`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`，`cf-cache-status: DYNAMIC`，没有 Set-Cookie。
- 以 Cloudflare 缓存命中的静态 chunk 为基线：TTFB 约 1.17s（其中 TLS 约 0.8s）。页面的 TTFB 在 1.64–1.73s，偶尔 2.8–3.1s（首页、`/news`）。也就是说**回源渲染比缓存命中多约 0.5s，波动时多 1.5–2s**。
- 静态资源：`/_next/static/*` 是 immutable、HIT；`/logo-full.png` 是 `max-age=14400`。
- 成因：根布局 `force-dynamic`（`app/layout.tsx:18`），各页还叠加了连库的 force-dynamic。多数数据读取没有缓存（§24-9 已经记录「落地页每次请求都同步打一次库」）。

**影响**
- 爬虫的每一次抓取都要打 1.8G 小机的 MySQL（OAI-SearchBot、bingbot、Googlebot 合计每天数百次，§28），Google 会根据响应时间自动下调抓取速率。
- 真实用户的 LCP 被 TTFB 抬高；高峰和构建期间（§28 记过 OOM）风险叠加。

**建议（由易到难）**
1. **数据层缓存**：落地页商品快照 `getLandingProducts`、新闻首屏列表、归档月份、日报列表，用 `unstable_cache` 包一层，revalidate 60–300s，库挂时仍然走现有的降级。纯代码改动，不影响分站。
2. **边缘缓存（需要验证后再开）**：用 Cloudflare Cache Rules 缓存匿名 GET 的 `/chongzhi/*`、`/news/*`、`/products/*`，Edge TTL 60–300s，**请求带 `token` cookie 或 `Authorization` 时 bypass**（登录态来自 `lib/auth.ts:146-158`），同时在 nginx 对这几个前缀覆盖 Cache-Control 为 `public, s-maxage=120, stale-while-revalidate=600`。**`/jiema` 不能缓存**：页面会读 `v.userId` 查「上次同意的条款版本」，并写进 RSC 数据（`jiema/page.tsx:75-77,128`），是按人渲染的。要缓存 `/jiema`，得先把这一步挪到客户端请求。RSC 请求带 `_rsc` 查询参数，缓存键天然区分。渠道 Host 由缓存键里的 hostname 自然隔离。
3. 长期：用 middleware 把 Host 改写到 `/(tenant)/[code]/...` 段，让主站页面可以用 ISR。改动大，列作备选。

---

## 14. 图片（next/image、alt）

**现状**：`images.unoptimized: true`（`next.config.js:31`，为了防 SSRF 和内存，理由成立），全站基本用原生 `<img>`，写死 width/height 防 CLS。

**问题**
1. **页脚 logo `/logo-full.png` 220KB**，显示高度只有 112–128px（`footer.tsx:47-53`），没加 `loading="lazy"`。React 在 SSR 时会给非 lazy 的 `<img>` 自动插入 `<link rel="preload" as="image">`，线上首页 head 里确实有它和 `/logo-mark.png`（55KB，显示 40px，`header.tsx:166-172`）。**每一页都以高优先级预载 275KB 的 PNG**，和 LCP 抢带宽。
2. 新闻详情页为了微信缩略图，在 body 里放了一张约 80KB 的分类图（`news/[slug]/page.tsx:122`），这是刻意的，保留。
3. alt：商品主图 `alt={product.name}` ✓；缩略图 `alt=""`（旁边有名称，装饰性）✓；页脚 logo 有完整 alt ✓；header logo `alt=""`，而品牌名在 `<lg` 屏宽下是 `hidden`（`header.tsx:176`），**移动端首页链接没有可访问名称**（a11y 问题，不影响收录）。
4. Product 没有商品图时回落到站标。

**建议**：`gen-brand-assets.py` 额外输出 WebP（或者把 logo 做成 SVG）：header 用 80×80 WebP（约 3KB），页脚用 256px 高的 WebP（约 15–25KB），并加 `loading="lazy" decoding="async"`（这样 React 就不会再 preload 它）；header 的 `<Link>` 加 `aria-label="贝果科技首页"`。

---

## 15. 字体

**现状**：`next/font/google` 的 Inter，只取 latin 子集（`app/layout.tsx:20`），自托管、有 preload（线上 `/_next/static/media/…woff2`）；中文走系统字体。**是对的**：中文 webfont 动辄几 MB，这里零成本。没有要改的。

---

## 16. 首屏 JS 体积

**现状（线上，按 `<script src>` 逐个取 gzip 传输量）**：首页 223KB、`/jiema` 229KB、`/news` 215KB、`/chongzhi/chatgpt-plus` 208KB、`/products/4` 218KB，另有 2 个 CSS。

**成因**：`(shop)/layout.tsx:62-77` 在每一页都挂了客户端组件：Header（framer-motion + AnimatePresence）、Footer（`'use client'`）、FloatingContact、LiveOrderNotification、AnnouncementModal、PageViewBeacon、MailLanding，加上根布局的 AuthFetchPatch。**纯服务端渲染的落地页，也要付 200KB+ 的外壳 JS**。首页额外还有 framer-motion 的 hero 动画、Typewriter、CountUp、MouseSpotlight。

**问题**
1. **首页 H1 服务端输出 `style="opacity:0;transform:translateY(40px)"`**（`home-client.tsx:149-153`，线上已确认）。LCP 元素要等 223KB JS 下载、解析、水合后才显示，低端安卓上 LCP 很容易超过 4s。hero 区的徽标、副标题、按钮同样是 `initial opacity 0`。
2. 页面到处是大面积 `blur-[128px]` 光斑加 `animate-pulse-glow`（`home-client.tsx:112-113`、`news/page.tsx` 等），在低端 GPU 上拖慢滚动和 INP（新闻页注释里自己也写了这条性能红线）。

**建议**
1. P1：LCP 元素不做「从透明淡入」。H1 和副标题改成 `initial={false}`，或者只动 transform 不动 opacity，或者换成纯 CSS 动画且首帧可见。
2. Header 的移动菜单动画可以换成 CSS transition，把 framer-motion 从全站共享 chunk 里拿掉（只让首页 hero 用，并 `dynamic()` 懒加载）；Footer 如果只是为了读店面 features，可以改成服务端组件，features 由 `(shop)/layout` 传进去。
3. 找一台内存够的机器跑 `ANALYZE=true next build`（@next/bundle-analyzer），拿到真实的 chunk 构成后再动手；**不要在 1.8G 生产机上跑**（参见 memory「本机构建 OOM」）。

---

## 17. 国际化 / hreflang

**现状**：`<html lang="zh-CN">`，og:locale 是 zh_CN，单语单 URL，没有 hreflang。

**结论**：**不需要 hreflang**（没有其他语言或地区版本，加了反而是无效标注）。港台繁体用户用「儲值/訂閱」这类词搜索，这是内容策略问题，不在本报告范围；如果要做，得另开 `/zh-hant/` 版本，并补 hreflang 与 `x-default`。

---

## 18. 404 / 301 / 协议与主机名

**现状（线上）**
- 不存在的路径 → 404 ✓，但页面是 Next 默认的英文「404: This page could not be found.」，没有站点导航，有两个 `<title>`，有 `noindex` 和 `index, follow` 两条 robots（`raw-1/p_this-page-does-not-exist-xyz.html`）。仓库里没有 `not-found.tsx`（find 结果为空）。
- `www` → 301 到裸域 ✓（Cloudflare 负责）；尾斜杠 `/about/` → 308 到 `/about` ✓（Next 默认）。
- **`http://bigolab.com/` 返回 200，不跳转**（§28 待办「Always Use HTTPS」仍未开）；HSTS 是 `max-age=300`（`nginx.conf:279`，试运行值）。
- 商品不存在走 `notFound()`，404 ✓；未来月份的归档 404 ✓；接码服务 `quote NOT_FOUND` 是接口层 404。

**建议**
1. 加 `src/app/not-found.tsx`（放在根，主站和渠道站都会用到）：中文说明，三条主打业务入口，渠道站只给首页和商品（`useStorefront()` 判断），保持 404 状态码。Next 会自动输出 noindex，页面自己**不要**再写 robots。根布局 robots 那条 `index, follow` 可以改成只在页面级声明，避免两条 meta 并存（或者接受现状，Google 取更严格的那条）。
2. Cloudflare 打开 **Always Use HTTPS**。观察一周无异常后，HSTS 调到 `max-age=31536000`（先不加 includeSubDomains，理由同 nginx 注释）。
3. 以后给新闻或接码改 URL 结构时（比如分类页上线），旧的 `?c=` 这类地址没有被收录过，不需要 301。唯一需要做 301 的是：如果把 `/chongzhi/*` 或 `/products/[id]` 改成带 slug 的 URL（本报告不建议改）。

---

## 19. baidu-push.ts 与 IndexNow

**IndexNow 现状**：`lib/indexnow.ts` 在 `/api/cron/news` 跑完后推送本轮**首次发布**的新闻 slug（`api/cron/news/route.ts:140-148`）；密钥文件在 `/indexnow-key.txt`（`app/indexnow-key.txt/route.ts`，no-store）；8s 超时、只推同 host 的 URL、每次上限 100 条。

**问题**
1. `publishedSlugs` 不看有没有全文层（`lib/news/pipeline.ts:1576`，与 `detailState` 无关），**noindex 的薄页也被推给必应**。这和 sitemap 排除薄页的口径矛盾，还浪费对方的抓取。
2. 薄页后来补齐全文变成可索引时，不会补推。
3. 商业页（落地页核对后、商品改价或改名、`/jiema` 开放、条款更新）从来不推。必应索引也是部分 AI 搜索产品的数据源之一，对 GEO 有意义。

**建议**：推送前用 `shouldNoindexEvent(parseDetail(detail))` 过滤；补齐全文的事件在补写成功那一步推；在后台改商品、改接码开放状态之后调一次 `submitUrls([...])`（先 await，保留 8s 超时和吞异常的写法）。

**百度推送现状**：`scripts/baidu-push.ts` 是人工运行的脚本，每天 10 条配额，写死了商业页优先的清单（`:72-91`）：10 个落地页，外加 products/support/terms/about；裸域站点已验证。

**建议**：清单加 `/jiema`（开放后）和将来的 `/jiema/<service>`，排在落地页之后；`/news` 继续交给 sitemap（配额另算）。§28 的结论「百度低优先」不变。

---

## 20. GEO（能被 AI 引用）的技术面补充

- ✓ AI 爬虫在主站全放行；正文、价格、FAQ 服务端直出；Organization 带 legalName；落地页有可见的核对日期。
- ✗ 首页（ChatGPT-User 抓得最多）服务端 HTML 里有「加载中...」，并且只讲一门生意（§8、§11）。
- ✗ Organization 自述只有代充（§5）。
- ✗ 接码页缺少可引用的定义性正文（§12）。
- 可选：加 `/llms.txt`（纯文本：三条业务一句话定义、主体、支付与开票口径、核心 URL 列表）。收益不确定，成本几乎为零；口径必须和 /terms、/about 逐字一致，不写营销语。
- 新鲜度：落地页 JSON-LD 加 `dateModified` 或 `lastReviewed`（§9）；新闻 Article 加 `dateModified`（§11）。

---

## 21. 实施清单（建议顺序；每一条都能单独上线）

| 批次 | 改动 | 文件 | 验证 |
|---|---|---|---|
| A（半天） | jiema 的 metadata 挪到 page，补 og/twitter；records/order 用 privatePageMetadata；`/support` 不再把接码 FAQ 并进 FAQPage；首页、/news、/support 补 OG_SITE；新闻 CTA 去掉 `?n=`，改成点击时写 localStorage；热门服务参数改名；加 not-found.tsx | `jiema/layout.tsx`、`jiema/page.tsx`、`jiema/records|order/page.tsx`、`support/layout.tsx`、`(shop)/page.tsx`、`news/page.tsx`、`news/[slug]/page.tsx`、`lib/news/attribution.ts`、`jiema/*client*`、`app/not-found.tsx` | curl 抓 HTML，断言 og:title 与 `<title>` 同主干；`/jiema/records` 没有 canonical；`/support` 的 FAQPage 条数；新闻页里没有 `?n=` 链接；404 页是中文且只有一条 robots |
| A' | CF Always Use HTTPS；HSTS 延长 | Cloudflare、`nginx.conf:279` | `curl -I http://bigolab.com/` 返回 301 |
| B（1 天） | 互链矩阵（§8）；页脚加 /news；首页服务端出接码区块和最新动态区块，替换「加载中...」 | `landing-ui.tsx` 或各落地页、`footer.tsx`、`(shop)/page.tsx`、`home-client.tsx` | 首页服务端 HTML 里出现 `/jiema` 和 `/news/<slug>` 的 `<a>`；落地页有 `/jiema` 链接 |
| B' | LCP 与图片：H1 首帧可见；logo 换 WebP 并 lazy | `home-client.tsx`、`footer.tsx`、`header.tsx`、`gen-brand-assets.py` | PageSpeed 或 Lighthouse 移动端 LCP；head 里不再 preload logo-full |
| C（2–3 天） | 大事记的分页、分类页、话题页（带阈值）；详情页面包屑；CollectionPage 结构化数据；sitemap 分段 + 落地页 lastmod；IndexNow 过滤薄页并推商业页 | `news/**`、`sitemap.ts`、`lib/news/seo.ts`、`api/cron/news/route.ts`、`pipeline.ts` | GSC 分段提交；抽查旧事件能从分类页服务端链接走到 |
| D（2–3 天） | `/jiema/[service]` 白名单服务页 + `/jiema` 正文与目录懒加载 | `jiema/[service]/page.tsx`（新）、`lib/jiema/*`、`sitemap.ts`、`baidu-push.ts` | 每页可见文本 ≥ 1500 字且各不相同；价格与下单报价同源（不触发 PRICE_CHANGED） |
| E | 缓存：数据层 `unstable_cache`，然后边缘缓存（登录态 bypass） | `lib/landing/products.ts`、`news/*`、nginx、CF 规则 | 反复请求时 `cf-cache-status: HIT`；已登录用户看到的页头正常 |
| F | Organization 自述、`/about` 标题、全站 keywords 这类措辞（等词表结论） | `lib/seo/graph.ts`、`about/layout.tsx`、`app/layout.tsx` | 下拉建议实测记录 |

**部署注意**：以上都不涉及 DDL；所有改动遵守「推送前本地 `npx tsc --noEmit` 零错误」；改大事记页面前读 SKILL.md，新页面带 `ai-generated` meta 和 AI 徽章；改买家可见的说明前，逐句对照代码行为（§24-⑧-②）。
