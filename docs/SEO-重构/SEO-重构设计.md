# bigolab.com SEO 重构设计：AI 会员充值 · AI 圈大事记 · 短信接码

> **版本 v1.0 / 2026-09-30 / 状态：待站长确认**
>
> 本文是只读设计：没有改仓库，没有碰服务器，没有登录任何网站，也没有提交表单。
>
> **v1.0 相对初稿的主要变化**（67 条评审意见逐条核对代码后的处理，见文末「评审处理记录」）：
> - 下线全站左下角的假成交弹窗（LiveOrderNotification），列入 P0
> - 被 AI 引用的页先测基线、再分两步改，新内容只追加在原有段落之后
> - 接码页与账号类、KYC 商品彻底隔离；大事记里的商业入口标「广告」
> - 所有指向 /jiema 的入口、首页接码区块，都按「是否已对全部用户开放」控制
> - 缓存改用仓库唯一允许的 `storefrontCached`，提到 P1，作为大事记新抓取通道的前置条件
> - 构建攒批：每个阶段一次构建，回滚改用镜像回滚标签
>
> 输入材料：
> - 同目录的 1–5 号调研报告，下文引用写作 [R1 §x] 到 [R5 §x]
> - 本文补测：64 个词的 Google 下拉建议，2026-09-30 实测，原始结果在 `seo/kw6/result1.tsv`、`result2.tsv`，按 R3 口径重算的结果在 `seo/kw6/recount.tsv`，下文记作 [kw6]
> - 仓库只读核对：短信接码 worktree `ai-service-shop-jiema`（HEAD `244831c`），写作 `文件:行号`；交接文档写作 §19 / §24 / §27 / §28 / §37
>
> 读法：
> - §0 是给站长拍板的一页纸
> - §1–§7 是设计
> - §8 是给实现会话的施工包
> - §9 是红线和待站长决定的事
> - 附录 B 列出本文对 5 份调研报告的更正
> - 文末「评审处理记录」逐条写明采纳与否及理由

---

> **现状更正（2026-09-30 14:30）**：接码已于 2026-09-30 10:33 对全部用户开放（sms_config enabled+ALL），即 J 日 = 09-30；文中「灰度期」分支目前不适用，支柱三各项按「已开放」执行。

## 0. 执行摘要

### 0.1 先看这 10 条

1. **现在卡在「没被收录」，不在「词没选对」。**
   - Google `site:` 一共只列出 17 个 URL。大事记 0/492，/jiema 0。充值 10 页里只收录了 5 页，ChatGPT 在回答里引用的 /chongzhi 和 chatgpt-plus 都不在 [R2 §4.1][R3 §5.0]。
   - 约 20 个主打词的 Google、Bing 前 10 里，本站一次都没出现。
   - 所以第一周的动作在站长这边：开 GSC 网域资源和 Bing Webmaster（包括 AI Performance 报告），打开 Cloudflare 的 Always Use HTTPS，逐页请求编入索引。同时建好 AI 来源的基线（§0.4）。代码侧所有改动的效果，都要靠这条反馈回路来衡量（§6.5）。
2. **站长的叫法和用户的搜法不一样。**
   - 「AI 会员代充」「AI 大事记新闻」是内部叫法。「代充 / 代开 / 代购 / 代订阅 / AI 会员代充」在 Google 下拉里联想数为 0。「新闻」二字有资质风险。
   - 对外的主词换成以下几组（对照表见 0.2）：
     - AI 会员：按产品分别选「购买 / 价格 / 订阅 / 会员 / 充值」。「会员」用在 ChatGPT 上要等站长确认（§9.4 #19）
     - 大事记：「今日 AI 热点」，加上「实体 × 最新 / 更新」
     - 接码：「短信接码」「海外手机号」「接收验证码」
3. **三条业务各做成「一个 hub + 有限个子页」，全部留在主域。** 不开子域，不迁移已有 URL：
   - /chongzhi：10 页变 11 页，新增 claude-code（只承接它独有的「额度够不够、订阅方案、API 与订阅的区别」）
   - /news：新增 6 个分类页（带分页）、≤10 个话题页；日报页补上当天全部**可索引**条目的链接。/news 本身不做深分页
   - /jiema：**对全部用户开放之后**，才新增 ≤20 个白名单服务页。首批按本站真实订单和收码数据挑，不按联想热度挑。不做国家页，永远不做「服务 × 国家」
4. **程序化生成的页面一律先过闸**：白名单、本站真实订单与收码数据达标、经人工逐条核对的正文、数量上限，达不到就 noindex（§1.7）。
   - Google 9 月垃圾内容更新 09-24 开始推送，预计 10-08 前后结束 [R4 §0]。这段时间不上新的程序化页。
5. **GEO（让 AI 引用）和 SEO 是同一件事。**
   - 每个商业页加一张「事实卡」：价格、交付方式、付款、开票、售后、经营主体、核对日期，上方配一句能单独成立的总结句。数据全部实时取库或取代码常量。
   - 正文用问题式小标题，第一句直接给答案，并链到官方来源。
   - Organization 结构化数据改写成覆盖三条业务（接码那一条按开放状态输出）。
   - 衡量 GEO 的第一指标是 nginx 日志里 OAI-SearchBot、ChatGPT-User 有没有来抓新页：被 ChatGPT 引用的 chatgpt-plus 在 Google 和 Bing 都没被收录，引用来自 OpenAI 自己的抓取 [R2 §4][§28]。Bing 与 IndexNow 是辅助。
6. **已经被 AI 引用的页，先测基线、再分两步改。**
   - /chongzhi 和 chatgpt-plus 是 ChatGPT 带来访客的入口：§27 记录的 3 个 ChatGPT 访客都是先落在 /chongzhi。P0 基线里出现 AI 来源访客的其他落地页，同样按这条处理。
   - P0 先建 AI 来源的基线（Bing AI Performance、PageView 的 `source='ai'`、nginx 爬虫日志），满 4 周（10-29）再动。
   - 第一步只换 `<title>` 和 description，观察 2–4 周；第二步再把事实卡、新 H2 **追加在现有段落之后**。改前改后都存 HTML 快照。
7. **体验和信任上最大的两个问题：假成交弹窗和公告弹窗。**
   - 主站每一页左下角每 8–15 秒弹一次「某某 刚刚 购买了…」。城市是轮换的假城市，时间是随机生成的，真实订单不足 5 条时还混入写死的假订单（`live-order-notification.tsx:19-28、43`，`api/orders/recent/route.ts:10、50`）。这是虚构成交信息，**P0 下线**（§6.6、§9.4 #20）。
   - 公告弹窗首次访问时全屏遮挡，PSI 实测它就是最大内容绘制（LCP）元素，4 个代表页的 LCP 都在 3.2–3.5s [R2 §3]。改成底部可关闭的提示条。
   - 更正一点：Googlebot 渲染页面时，`/api/` 被 robots 禁止抓取，拿不到公告内容，所以弹窗对 Google「侵入式插页」判定的影响大概率有限。真正受影响的，是从搜索和 ChatGPT 点进来的真人（附录 B-1）。
8. **合规隔离写成硬规则。**
   - 接码页不链接任何账号类商品和 KYC 代办；claude-kyc 页的标题、描述一个字都不改。
   - 大事记里的商业入口做成独立区块，标「广告 · 本站服务」。
   - 灰度期（仅管理员）全站不出现指向 /jiema 的链接。
9. **构建攒批，回滚用镜像标签。** 每个阶段只构建一次（1.8G 小机每次构建都要临时放开 swap），构建前打回滚标签，出问题秒级切回旧镜像（§8.2）。
10. **预期要讲实话。**
   - 新页被收录通常要 1–4 周；中文商业词排到有意义的位置要 2–6 个月（§24-7）。
   - 12 周的目标是「核心页全部收录，4 个竞争弱的词进 Google 前 10」，不是「全面上首页」。
   - 接码相关的收录 KPI 从站长把接码切到「全部用户」的那天开始计时。

### 0.2 内部叫法与对外主词

| 站长叫法 | 对外的 title / H1 主词 | 依据 | 「代充」「新闻」这类词放在哪 |
|---|---|---|---|
| AI 会员代充服务 | 按产品选词：<br>• ChatGPT Plus：「国内怎么购买」<br>• Claude Pro：「会员」「国内怎么买」<br>• ChatGPT Pro / Claude Max：「价格」<br>• Claude Code：「订阅」「额度」<br>• Grok：「订阅」<br>• 总览页：「AI 会员价格对比与充值」（改名前先实看 SERP，§2.2） | 「代充」一类联想 0–3 条，代开 / 代购 / 代订阅为 0 [R3 §2.1]<br>补测：`ai会员` 的联想里真实出现了「比价 / 价格对比 / 充值」[kw6] | 「代充」只放进总览页正文已有的「怎么分辨一个代充卖家靠不靠谱」一节（`chongzhi/page.tsx:292`），用来承接「代充靠谱吗」这类信任审查搜索 |
| AI 大事记新闻 | • 「今日 AI 热点」<br>• 「{实体} 最新模型 / 更新日志」（页面上写明「第三方整理」）<br>• 「AI 日报 + 日期」只进日报页的 `<title>`；「一周 AI 大事件」<br>• H1 保留品牌名「AI 圈大事记」 | `ai大事记` 联想 0/0/0；`ai动态` 有歧义，联想到的是动态壁纸；「实体 × 最新 / 更新」Google 9–10 [R3 §3][kw6]<br>「新闻」禁用 [R5 §1.2] | 「新闻」在任何可见位置都不出现<br>「AI 资讯」只在 description 里出现一次<br>面包屑、H1 用「每日速览」「AI 动态速览」 |
| 短信接码 | 「短信接码」+「海外手机号」+「接收验证码」<br>服务页用用户的原话，例如「{服务}注册需要手机号」「收不到验证码」；**不原样引用平台的拒绝提示** | 联想数：接收验证码 10、海外 / 国外手机号 9、短信接码 8 [R3 §4.1][kw6]<br>「接码平台」在 Bing 国内版前 10 全是犯罪报道 [R3 §5.3] | 「接码平台」只在正文里解释一次，不进 title、H1、description |

### 0.3 裁决表

「被否方案」一栏写明出处，方便回溯是哪份报告提的。

| # | 决策点 | 选择 | 依据 | 被否方案 |
|---|---|---|---|---|
| 1 | 支柱一主词 | 按产品选词（见 0.2）；hub 改为「AI 会员价格对比与充值」，**改名前先实看「ai会员 价格对比」「ai订阅 比价」的 SERP**（§2.2） | [R3 §2.1–2.4]<br>[kw6]：`ai会员` 联想含 比价 / 价格对比 / 充值 | 用「AI 会员代充」做 title / H1<br>新建「AI 会员代充」品类页（任务书禁止，新数据也不支持） |
| 2 | 「会员」能不能用在 ChatGPT 上 | **待站长确认（§9.4 #19）**。确认前按任务书的既有结论执行：ChatGPT 页的 title、H1 不用「会员」；首页 H1 写「ChatGPT、Claude 充值」 | 任务书列为必须遵守的结论是「会员对 ChatGPT 不成立」[R5 §4-2]<br>新数据：`chatgpt会员` 9/10/6，联想为购买、价格、怎么买（09-19 返回的是亚美尼亚语）[R3 §2.1]；本文复测仍为 9 [kw6] | 由本文直接推翻任务书的结论（初稿的做法：没有经过站长） |
| 3 | 支柱二主词 | • title 主词用「今日 AI 热点」和「实体 × 最新 / 更新」<br>• H1 保留品牌「AI 圈大事记」<br>• 「AI 资讯」只进 description 一次 | • `ai资讯` G9 [R3 §3.1]，但前 10 被 AIBase、量子位等占住，本站拿到的机会小<br>• 不用它当 title 主词，放弃的机会不大，换来的合规收益是确定的 [R5 §1.2] | 「AI 资讯日报：……（每日聚合）」做 title [R3 §3.3]<br>维持现在的「每日 AI 动态聚合」（「动态」有歧义） |
| 4 | 支柱三主词 | 「短信接码 / 海外手机号 / 接收验证码」 | [R3 §4.1、§5.3]<br>反电信网络诈骗法第十四条第（三）项 [R5 §3.1] | 把「短信接码平台」放进 title [R2 §5 P1-5] |
| 5 | 首页定位 | 做「品牌 + 三条业务分发」页<br>title：`贝果科技 BigoLab - ChatGPT/Claude 充值、短信接码、AI 动态`（灰度期不写「短信接码」，§3.3） | • 现在首页和 chatgpt-plus 抢同一批词<br>• 百度规范要求首页写「品牌 - slogan」[R4 §2]<br>• 「贝果科技」这个品牌词被台湾同名公司占住，需要加 BigoLab 区分 [R2 §4.1]<br>• 首页只写三条业务的概括，不和 hub、/products 用同一个短语 | 保留现标题「……充值代充 - 卡密自助兑换」 |
| 6 | /chongzhi 下已有的 10 页 | • 不重写正文<br>• **AI 引用页**（/chongzhi、chatgpt-plus，以及 P0 基线里出现 AI 来源访客的页）：基线满 4 周后分两步，先只换 title / description，2–4 周后再把新区块追加在现有段落之后<br>• 其他页：改 title / description（和结构改动错开 ≥2 周），加事实卡、互链<br>• 开票问答只在 hub 写完整的一份<br>• claude-pro、claude-max 复制 chatgpt-plus 的结构（§28 已批准） | • §28 叫停了重构：「现在改，以后永远说不清」<br>• 未被收录的页改标题，没有排名可丢 | 整页重写<br>改 URL<br>把 hub 改写成全新的比价页<br>在基线之前改 AI 引用页（初稿的排期） |
| 7 | 新建 /chongzhi/claude-code | **做**，只承接它独有的意图：Pro 额度够不够用、订阅方案、API 按量付费与订阅的区别。「Pro 还是 Max 怎么选」归 claude-max | `claude code 充值` 10、`价格` 9、`订阅` 9；`claude code pro` 按 R3 口径 3 条（额度、够用吗、价格）[kw6] | 并进 claude-pro（一页承接两种意图）<br>不做<br>title 写「用 Pro 还是 Max」（和 claude-max 自我竞争） |
| 8 | 接码服务页 | • /jiema/<服务> 白名单，总数 ≤20<br>• **对全部用户开放之后**才建<br>• 首批候选 google、openai、whatsapp、instagram，按本站近 30 天已付款单数和内部收码成功率重排，取达标的前 3 个（§1.7）<br>• openai 要先按官方帮助页核实（§3.3） | [R3 §4.2]、[R4 §1.2、§3.1]、§24-3<br>历史激活成功率只有 31%（接码设计 D3、D7）：成功率低的服务建页，带来的是退款和跳出 | 按 810 个服务全量生成<br>「服务 × 国家」组合页<br>国家页<br>按联想热度挑首批（初稿的做法） |
| 9 | Telegram 服务页 | **首批不做**；目录里照常可以买；**首页和 /jiema 服务端直出的热门区块也不出现** | 排除的依据是境外搜索结果的犯罪语境（「开盒」「警方提醒」）和合规风险 [R3 §4.2、§5.3]，不是「境内屏蔽」（WhatsApp 同样境内不可用，它是否入选看内部数据和 SERP 语境实看） | 按搜索量第一的位置优先建页 |
| 10 | 国家页 | 本轮不做；「美国手机号」放在 /jiema 里做一个 H2 区块 | 只有美国有交易意图 [R3 §4.3]<br>国家页的独有信息少，而且碰地区命名红线 D44 [R4 §1.2] | 单独建 /jiema/us [R3 §6.3] |
| 11 | 「codex 接码」由哪页承接 | /chongzhi/codex-jiema（已收录）。如果核实下来 ChatGPT 注册基本不要手机号，就不建 /jiema/openai，改在 codex-jiema 里加一节「按国家/地区选号接收 OpenAI 验证码」 | 同一个意图只做一页（§24-3）<br>OpenAI 帮助中心的手机验证说明主要针对首次生成 API key；仅手机号注册只在部分国家作为可选方式（2026-09-30 检索摘要，帮助页正文 403 未能直读，动笔前人工核实） | 新建 /jiema/codex<br>/jiema/openai 和 codex-jiema 同时承接 Codex 登录验证 |
| 12 | 大事记的可抓取性 | • 深度抓取通道只保留一套：**分类分页 + 日报**<br>• 6 个分类页 `?page=N`，canonical 指自己，index,follow，不进 sitemap，**只列可索引事件**<br>• 日报列出当天全部**可索引**条目的链接，薄页不列<br>• /news 不做服务端深分页；月度归档改成按天分组的 Top 列表，不逐条分页 | 归档页写着 1387 条，只有 20 个可抓取链接 [R2 §2]<br>约 2/3 的事件是 noindex 薄页（§24），「noindex 不省抓取预算」（§28）<br>Google 分页指引：每页用自己的 canonical | 第 2 页起 noindex [R1 §11]：长期 noindex 最终会被当成 nofollow，抓取通道会断<br>所有分页 canonical 指向第 1 页<br>/news、分类、归档三套分页并存（初稿的做法） |
| 13 | 话题页 | • 只做白名单实体，≤10 个；首批 Claude、OpenAI、Gemini<br>• 近 90 天有 ≥10 条可索引事件，并且导语、速查块经人工逐条核对（记录 reviewedAt），才允许收录；退出有滞回（§1.7）<br>• 页面写明「第三方整理，非官方页面」 | SKILL §4、百度劲风算法、Google scaled content abuse<br>反不正当竞争法第七条（引人误认） | 按标签自动全量开页<br>门槛 8 条 [R4]：取两份报告中更严的一个 |
| 14 | 大事记的产量 | 不收缩 sitemap，不整体 noindex。分诊已经有「和 AI 相关吗」的判定（`pipeline.ts:617、778`），离题样例要先**排查**是哪条路径放进来的，再针对性修 | §28 叫停第 2 条<br>离题样例：「国庆自驾攻略」[R2 §2]<br>SKILL §1.3 允许「开发者实践与教程」，个人生活类使用心得容易被判成相关 | 停更，或对薄页返回 410（§24-4 的待决项）<br>再加一道相关性过滤（初稿的做法：已经存在） |
| 15 | 大事记的 lastmod / dateModified | 取 **max(publishedAt, reviewedAt)**，不再用 updatedAt。局限：补齐全文层不体现在 lastmod 上，Bing 靠 IndexNow 补推，Google 靠站内抓取通道 | 热度重算每 15 分钟通过 `prisma.newsEvent.update` 写一次行（`pipeline.ts:1913`），浏览、分享计数也会写，updatedAt 于是变成噪声（附录 B-2）<br>NewsEvent 没有记录全文层完成时间的字段，本方案不改表结构 | 把 updatedAt 传给 dateModified [R1 §5]<br>「第一个非空值」（初稿：先审核后发布的事件会取到较早的时间） |
| 16 | 结构化数据 | • 不为富结果再加 FAQ<br>• Article 不换成 NewsArticle<br>• 接码用 Service，不打 Product<br>• 落地页不新增 WebPage 节点：dateModified、lastReviewed、publisher 挂在现有 FAQPage 上（带 `@id`）<br>• 补 Organization（被引用的页同页输出）/ CollectionPage / BreadcrumbList | FAQ 富结果已于 2026-05 下线 [R4 §1.3]<br>合规要求 [R5 §1.3]<br>FAQPage 本身是 WebPage 的子类型；§24 教训 #10 | 换成 NewsArticle<br>给接码打 Product / AggregateOffer<br>同一 URL 输出 FAQPage 和 WebPage 两个页面实体 |
| 17 | 接码 FAQ 在 /support 和 /jiema 重复标注 | 降为 P2 顺手做：/support 页面上照常显示，FAQPage 只留在 /jiema | 富结果和对应文档都已删除，重复标注既没有收益也不会被罚 | 列为 P0 [R1 §0 #5] |
| 18 | 公告弹窗 | 改成**底部**固定、可关闭的提示条，只显示标题加「查看详情」，点开再用现有弹层看全文；首次访问也不弹全屏 | PSI 实测它是 LCP 元素 [R2 §3]；本文更正见附录 B-1<br>公告正文最长 5000 字（`lib/announcement.ts:12`），顶部横条放不下；放顶部要么压在固定页头上，要么在客户端拉取后把内容推下去，产生布局偏移 | 维持现状<br>顶部横条（初稿的做法）<br>只对搜索来访者关掉（徒增复杂度） |
| 19 | 缓存 | • **P1**：数据层用仓库唯一允许的 `storefrontCached`（`src/lib/storefront/cache.ts`），后台改价、上下架时 `clearStorefrontCache`。这是 E1 的前置条件<br>• **P3**：E1 上线满 2 周、看过 GSC 抓取统计和服务器负载后，再决定是否用 Cloudflare Cache Rules 给 `/news/*` 开边缘缓存；不改 nginx；/jiema 永不缓存 | 国内经代理实测，页面 TTFB 1.64–3.1s，回源比缓存命中多 0.5–2s [R1 §13]；这台 1.8G 机器 09-16 到 09-21 已经 OOM 9 次（§28）<br>`unstable_cache` 被边界检查规则 9 禁止（`check-tenant-boundary.mjs:613`），挂在 prebuild 上，构建会直接失败 | 用 `unstable_cache` + `revalidateTag`（初稿的做法）<br>按 PSI 从 Google 机房测到的 200ms TTFB 推迟缓存<br>立即全站开边缘缓存 |
| 20 | sitemap | • `/sitemap.xml` 保持同一个 URL，改成 sitemap index，下分 6 段<br>• 条目抽成纯函数 `src/lib/seo/sitemap-entries.ts`，两份现有 itest 改成调用它<br>• 渠道站维持空 urlset<br>• lastmod 只写真实值 | 在 GSC 里按业务线看收录情况 [R1 §3]<br>`wp1.ts:510`、`itest-jiema-catalog.ts:534` 直接 import `app/sitemap.ts` | 维持单文件<br>渠道站输出空 sitemapindex（不合 XSD） |
| 21 | 标题里写年份 | 默认不写；站长承诺每月真实核对一次之后，才由**该页自己的** reviewedAt 渲染出年月 | 人为改日期是负面信号 [R4 §1.1、§5]<br>`LANDING_REVIEWED_AT` 是全站唯一常量（`registry.ts:66`），改一页就等于宣称全部页刚核对过 | 全站标题加「2026 最新」（竞品的做法）|
| 22 | 标题里写价格 | • 充值 SKU 的稳定价可以写（claude-max），写成「充值价」，不写成「Claude Max 价格」<br>• 接码价格不进标题，description 里只写「实时报价」、不写日期 | Google 标题文档：变化快的价格别进标题 [R4 §5]<br>「Claude Max 价格：¥x」会被 AI 当成官方人民币定价引用 | 所有页都加价格<br>接码写「低至」<br>description 写「截至 MM-DD」（几周后在搜索结果里显得过时） |
| 23 | IndexNow | 过滤掉薄页；扩展到商业页的变更，**只挂在后台保存上，成交不触发** | [R1 §19]、[R4 §1.6] | 维持只推新闻 |
| 24 | 站外获客 | • 推广人计划定向招募教程作者：只推充值 SKU，给书面文案规范，强制标「广告」，链接加 sponsored；**接码、账号类、KYC 不参与**<br>• 公众号：每篇带 AI 标识，后台人工勾选 AI 生成标识<br>• 不自建 GitHub 仓库，不做站群 | 搜索结果被 UGC 平台上的教程占住 [R3 §5.1]<br>这类做法属于 site reputation abuse [R4 §3.2]<br>广告法第四条；《互联网广告管理办法》第九条；反电诈法（接码引流推广） | 自建仓库、批量发帖、刷提及<br>只要求 sponsored 和文中披露（初稿） |
| 25 | robots 里给 AI 爬虫单列分组 | **不加** | 单列分组后，这个爬虫只认本组规则。漏抄一条 Disallow 就会放开私密路径（附录 B-4） | 可选的文档性分组 [R1 §4] |
| 26 | meta keywords | 删掉根 layout 里的 keywords，也不逐页补 | Google 不读这个标签；现在的值全站相同，还带着零需求词 [R2 §2] | 按栏目分别生成 |
| 27 | 接码成功率 | **不显示百分比**。内部收码成功率只用于服务页开页决策。「中位到码时长」样本满 30 单才显示（待站长确认） | D26「不显示成功率百分比」；广告法 | 显示「近 30 天成功收码率」[R4 §3.1] |
| 28 | llms.txt | 可选的 P3，零成本做一份事实索引 | Google 忽略它，读它的主要是编程类智能体 [R4 §4.1] | 当成 GEO 的主要手段 |
| 29 | 左下角成交弹窗（LiveOrderNotification） | **P0 整体下线**；删掉假城市、随机相对时间和写死的假订单；信任信号改用首页已有的「累计成交 N 笔（本站订单统计）」 | 城市来自 `FAKE_CITIES` 轮换（`api/orders/recent/route.ts:10、50`），时间随机生成（`live-order-notification.tsx:43`），不足 5 条混入 `FALLBACK_ORDERS`（同文件 19–28 行，价格也已过时）：虚构成交细节（电子商务法第十七条、反不正当竞争法第九条）<br>移动端每十几秒遮一次正文 | 只在落地页和大事记关掉<br>保留但改成真实商品名 + 真实日期（§9.4 #20 的备选） |
| 30 | 接码与账号类、KYC 的隔离 | /jiema*、大事记详情和话题页的 CTA 一律不链 `/chongzhi/google-zhanghao`、`/chongzhi/claude-kyc`，也不链带「普号 / 成品号」SKU 的价格表锚点；google-zhanghao 只从充值 hub 和页脚进入；claude-kyc 的 title、description、H2 维持原样 | 反电诈法第十四条（接码）与第三十一条（买卖互联网账号、提供实名核验帮助）[R5 §3.1、§3.4]；接码条款禁止出售账号、为他人规避实名与风控（`jiema-legal.ts` 第二节） | 「/jiema/google → 看成品号」桥接<br>claude-kyc 补「实名认证」、新增封号申诉 H2（初稿的做法） |
| 31 | 大事记里的商业入口 | 做成独立区块，显著标注「广告 · 本站服务」，与 AI 摘要、AI 免责声明视觉分开，不进 Article JSON-LD；只在标签明确对应在售产品时出现，不设「其余 → hub」兜底 | 《互联网广告管理办法》第九条：以知识介绍等形式推销商品并附购物链接的，应显著标明「广告」<br>守住「行业动态聚合工具」的定位 | 措辞中性、放在正文之后即可（初稿） |
| 32 | 接码服务页怎么下单 | 服务页直出「国家/地区价格表」，每行直链到 /jiema 并预选服务和国家/地区，**一次点击到达确认面板**；不在服务页里嵌入下单组件 | 嵌入 JiemaClient、CheckoutPanel、ConsentDialog 要读登录、余额、条款同意状态，页面变成按人渲染、无法缓存，全是接码会话的核心文件<br>doorway 防线改为依靠独有正文和实时价格表 | 服务页就地下单<br>只放一个跳 /jiema 的按钮（落在「只能跳转」的中间页形态） |
| 33 | 公开页上的接码服务参数 | `?svc=` 用本站自己的 slug（`telegram`、`openai`…），服务端映射回上游代码；`?s=<code>` 只做旧链接兼容，站内不再生成 | §1.2 自己的规定：上游代码写进服务端直出的链接等于暴露上游；客服口径「绝不告诉买家上游是谁」[R5 §3.2] | `?svc=<上游代码>`（初稿）<br>`#svc=` 片段（登录回跳、分享要走 query，片段不稳） |
| 34 | 首页、/jiema 的热门服务 / 热门国家/地区区块 | 取代码里的 SEO 白名单常量，与后台 hotRank 脱钩；排除 tg、国内实名类、金融/支付/加密货币服务和中国 +86；hotRank 只影响客户端目录排序和 cron 预热 | 默认 `hotServices` 是 `['dr','acz','tg','wa','go','ig','fb','tw','ds','am','wx','mm']`（`jiema-config-schema.ts:97`），第 3 位是 Telegram（注意 `wx` 在上游代码里是 Apple，不是微信）；D25 开放了 +86 与国内平台 | 取 catalogSnapshot 的 hot 排名（初稿） |

### 0.4 目标 KPI 与衡量方法

**核心商业页**：首页、/chongzhi、9 个落地页，共 11 页；上线 claude-code 后是 12 页。/jiema 单独计。

**时间点**：「4 周」指 10-28，「12 周」指 12-23，「6 个月」指 2027-03-31。**接码相关的 KPI 从站长把接码切到「全部用户」的那天（记作 J 日）起算**：在此之前 /jiema 按 D28 一律 noindex，SEO 改动对它的收录没有任何效果。

| KPI | 口径和数据源 | 基线（09-30） | 4 周 | 12 周 | 6 个月 |
|---|---|---|---|---|---|
| 核心商业页收录 | GSC 网址检查，以及按 sitemap 分段的「网页」报告 | Google `site:` 约 6/11（首页和 5 个落地页）| ≥10/11 | 12/12 | 保持 100% |
| 接码页收录 | GSC jiema 分段 | 0 | J+4 周：/jiema 和 /jiema/terms 已收录 | J+12 周：已上线服务页 ≥80% | ≥90% |
| 大事记聚合页收录（/news、分类第 1 页、话题、日报周报、归档）| GSC news-hub 分段 | 0 | 已提交，开始出现「已编入」| ≥60% | ≥80% |
| 大事记事件页收录率（诊断用）| GSC news-events 分段 | 0/465 | >0 | ≥25% | ≥40% |
| http 和 www 版本的重复收录 | `site:` 抽查，以及 GSC 的「备用网页」报告 | Google 3 条，Bing 十余条 | http 已 301 到 https | Google 为 0 | 0 |
| 核心词排名 | • GSC 效果报告：查询按正则分组，看**展示量和平均排名的趋势**<br>• 每月手工查一次 SERP，固定下面列出的 20 个查询串 | 20 个词进前 10 的数量为 0 | 开始有展示 | • Google 前 10 ≥4 个。优先这几个弱竞争词：claude 会员、claude max 价格、claude code 充值、codex 接码<br>• Bing 前 10 ≥6 个 | • Google 前 10 ≥10 个<br>• chatgpt plus 国内 / 购买进前 20 |
| 展示量 | GSC 与 Bing Webmaster | 没有基线，需要先建 | 建立周基线 | 周展示量达到第 2 周的 3 倍 | 8 倍 |
| 点击率（参考指标） | GSC，按页面组看，只统计平均排名 ≤10 的查询。展示量接近 0 时前后对比没有统计意义，**只作参考，不作验收** | 无 | — | 商业页 ≥3% | ≥4% |
| AI 引用 | • **第一指标**：nginx 日志按爬虫和路径统计（§28 的方法），新页或改过的页上线后 2 周内 OAI-SearchBot、ChatGPT-User 有没有来抓<br>• 站内 PageView 中 `source='ai'` 的会话，按 engine 和落地页细分<br>• Bing AI Performance：引用次数与 grounding queries（AI 检索时用的查询词），辅助<br>• 每月手测固定 10 问，见下 | • chatgpt.com 是最大的外部来源（§27）<br>• 6 万行日志中 ChatGPT-User 61 次、OAI-SearchBot 347 次（§28）<br>• **P0 第一周就开始记录**，满 4 周（10-29）定稿 | 基线定稿；AI 来源的落地页清单确定（它们按 §0.1-6 两步走） | • AI 来源会话翻倍<br>• 10 问里至少 3 问引用本站 | • 4 倍<br>• 至少 5 问 |
| 自然搜索和 AI 来访 → 下单 | • **代理口径**：PageView 按 viewerKey 串起会话。`source` 为 search 或 ai 的访客中，7 天内出现付款后落地页（以代码为准，例如 /orders）浏览的比例<br>• 精确口径要在订单上记录入口来源，需要改表结构（DDL），§9 待决 | 无 | 建立基线 | 比基线高 30% | 月报写出自然搜索和 AI 带来的已付订单数 |
| 体验 | PSI 移动端，4 个代表页（含一个大事记详情页） | LCP 3.2–3.5s | <2.5s（B 包含新闻详情页图片处理，§6.6） | 维持；等 CrUX 有了真实用户数据，看 INP 是否 <200ms | 同左 |

**固定跟踪的 20 个查询串**（每月手查 SERP 与 GSC 正则分组都用这一份，基线可复现）：

| # | 查询串 | 主承接页 | # | 查询串 | 主承接页 |
|---|---|---|---|---|---|
| 1 | ai会员充值 | /chongzhi | 11 | grok 订阅 | grok-super |
| 2 | ai会员价格对比 | /chongzhi | 12 | ai热点 | /news |
| 3 | chatgpt plus 国内 | chatgpt-plus | 13 | ai日报 | 日报页 |
| 4 | chatgpt plus 购买 | chatgpt-plus | 14 | claude 最新模型 | /news/t/claude |
| 5 | chatgpt pro 价格 | chatgpt-pro | 15 | openai 最新发布 | /news/t/openai |
| 6 | claude 会员 | claude-pro | 16 | 短信接码 | /jiema |
| 7 | claude pro 国内 | claude-pro | 17 | 海外手机号接收验证码 | /jiema |
| 8 | claude max 价格 | claude-max | 18 | 接收验证码 | /jiema |
| 9 | claude code 充值 | claude-code | 19 | 谷歌注册手机号 | /jiema/google（未上线前记 /jiema） |
| 10 | codex 接码 | codex-jiema | 20 | chatgpt注册手机号 | /jiema/openai 或 codex-jiema（按 §3.3 的核实结果） |

说明：2、17、19、20 自身的下拉联想为 0，但都是短词的联想项 [kw6]，属于「有人这么搜、没有更长的延伸」。「claude kyc」不列入跟踪词（§9.4 #21）。

**AI 引用手测 10 问**：每月一次，分别问 ChatGPT 搜索、Perplexity、Copilot，记下是否引用 bigolab、引用了哪一页。只做人工手测，不做自动化抓取。

1. 国内怎么充 ChatGPT Plus
2. ChatGPT Plus 信用卡被拒怎么办
3. Claude Pro 国内怎么买
4. Claude Max 5x 和 20x 多少钱
5. Claude Code 用 Pro 还是 Max
6. ChatGPT 注册需要手机号吗
7. 注册谷歌需要手机号怎么办
8. 海外手机号怎么接收验证码
9. Claude 最新模型是什么
10. 哪里充 ChatGPT 能开发票

### 0.5 路线图

每个阶段只构建一次（§8.2 部署注意事项）。接码相关的包由接码会话并进它自己的发版，不单独构建。

| 阶段 | 时间 | 构建批与施工包（§8） | 进入下一阶段的条件 |
|---|---|---|---|
| **P0 基线与止血** | 09-30 – 10-07（国庆期间，站长方便时操作） | • O：站长后台操作<br>• 基线：GSC、Bing AI Performance、PageView `source='ai'` 按落地页、nginx 爬虫日志、核心页 HTML 快照<br>• **构建批 1**：A（技术止血）+ B（下线假成交弹窗、公告改提示条、LCP）<br>• 接码会话：AJ 并进接码的首次部署 | • GSC 和 Bing 已验证、sitemap 已提交<br>• http 已 301<br>• 假成交弹窗已下线，公告已改成提示条<br>• 基线开始记录 |
| **P1 结构** | 10-08 – 10-21 | • **构建批 2**：C（首页三业务、页脚导航、组织实体）+ G（sitemap 分段、IndexNow）+ Ha（数据层缓存）+ D1a（非 AI 引用页的事实卡、开票问答收口、商品页面包屑、/products 定位）<br>• 接码会话：F1 随「开放全部用户」那次（或之后）发 | • Google 宣布垃圾内容更新结束<br>• 拿到 GSC 首周数据 |
| **P2 标题与首批新页** | 10-22 – 11-18 | • **构建批 3**（10-29 或之后：AI 基线满 4 周，且与批 2 间隔 ≥2 周）：D1b（非 AI 引用页的 title / description）+ AI 引用页第一步（只换 title / description）+ D2（claude-code）+ E1（大事记分类分页、日报补全、结构化数据）<br>• 接码会话：F2 第 1 批（开放满 1 周、过闸） | • 每批上线满 2 周看一次 GSC<br>• AI 来源会话没有明显下滑 |
| **P3 追加与扩展** | 11-19 – 12-23 | • **构建批 4**：AI 引用页第二步（追加事实卡、新 H2）+ E2（首批 3 个话题页）+ I（可选项）<br>• Hb：Cloudflare 边缘缓存（只改规则，不构建；E1 上线满 2 周后评估）<br>• 接码会话：F2 第 2 批 | 12 周复盘，对照 0.4 |
| 之后 | 每月 | 月度核对、IndexNow、AI 引用复盘；是否扩页按 GSC 数据决定 | — |

---
## 1. 信息架构重构

### 1.1 目标态站点结构

```
bigolab.com（唯一参与 SEO 的域名；*.bigolab.com 渠道站永远 noindex）
├─ /                                     首页：品牌 + 三条业务分发（三块内容都由服务端直出；接码一块按开放状态输出）
│
├─ 支柱一 AI 会员充值
│  ├─ /chongzhi                          hub：AI 会员价格对比与充值（AI 引用页，两步走；改名前实看 SERP）
│  ├─ /chongzhi/chatgpt-plus             ChatGPT Plus 国内怎么购买（AI 引用页，两步走）
│  ├─ /chongzhi/chatgpt-pro              ChatGPT Pro 价格
│  ├─ /chongzhi/claude-pro               Claude Pro / Claude 会员（新增「封号了怎么办」H2）
│  ├─ /chongzhi/claude-max               Claude Max 充值价（5x / 20x），唯一承接「Pro 与 Max 怎么选」
│  ├─ /chongzhi/claude-code              【新】Claude Code 订阅：Pro 额度够不够用、Max 方案、API 与订阅的区别
│  ├─ /chongzhi/claude-kyc               KYC（title、description、H2 全部维持原样）
│  ├─ /chongzhi/claude-zhuce             Claude 注册（链到接码，接码开放后才出现链接）
│  ├─ /chongzhi/codex-jiema              Codex 接码（承接「codex 接码」，和接码支柱互链）
│  ├─ /chongzhi/google-zhanghao          谷歌账号（维持，不扩张；只从 hub 和页脚进入）
│  ├─ /chongzhi/grok-super               Grok 订阅（SuperGrok）
│  ├─ /products                          全部商品目录（导航型，不抢主打词）
│  └─ /products/[id]                     SKU 详情：全站唯一输出 Product/Offer 的页面
│
├─ 支柱二 AI 圈大事记（行业动态聚合工具，不是新闻站）
│  ├─ /news                              hub：今日 AI 热点（不做服务端深分页）
│  ├─ /news/c/{ai-models|ai-products|industry|paper|tool|opinion}   【新】6 个固定分类页，?page=N 只列可索引事件
│  ├─ /news/t/{claude|openai|gemini|…}   【新】话题页：白名单，≤10 个，过闸才收录，注明第三方整理
│  ├─ /news/digest/daily/{YYYY-MM-DD}    每日速览（title 用「AI 日报」；补上当天全部可索引条目的链接）
│  ├─ /news/digest/weekly/{YYYY-MM-DD}   一周 AI 大事件
│  ├─ /news/archive/{YYYY-MM}            月度 AI 大事件盘点（按天分组的 Top 列表，不逐条分页）
│  └─ /news/[slug]                       事件详情（薄页 noindex 的做法维持不变）
│
├─ 支柱三 短信接码（对全部用户开放之前整组 noindex，站内不出现入口）
│  ├─ /jiema                             hub：全目录，下单入口
│  ├─ /jiema/{google|openai|…}           【新】白名单服务页：≤20 个，开放之后按内部数据分批上线
│  ├─ /jiema/terms                       服务条款
│  └─ /jiema/records、/jiema/order/[no]  私密页：noindex,follow
│
├─ 信任与支持：/about  /support  /terms  /privacy  /links
└─ 其他：/iptools（保留）；/forum、/games 改为 noindex,follow 并移出 sitemap
```

所有新增页面组都照抄现有的渠道站写法 [R1 §7]：
- layout 第一行调用 `notFoundOnChannel()`
- layout 里不写 canonical（robots 的默认值例外：/jiema 页面组的 layout 保留 fail-closed 的 robots，§1.3）
- sitemap 只在 PLATFORM 下输出

### 1.2 URL 规则

1. **形态**：全小写、连字符、不带尾斜杠。
   - 充值页沿用拼音或英文 slug，新页叫 `claude-code`。
   - 接码服务页用**服务的英文品牌小写**（`google`、`openai`、`whatsapp`、`instagram`）。**不用上游的服务代码**（`go`、`dr`、`wa`）：那是 HeroSMS 的代码体系，写进 URL 等于暴露上游。
   - 分类页沿用 `constants.ts` 里已有的 6 个 slug。
2. **可以被收录的参数只有一个：`?page=N`**（只用于 `/news/c/*` 的分页）。其余参数一律 canonical 回干净的 URL，并且**站内链接不主动生成它们**：
   - `?ref=`：推广码
   - `?s=`：新闻分享渠道，被 `Disallow: /*?s=` 挡着；接码的旧预选参数也叫 `s`，只做旧链接兼容
   - `?n=`：新闻归因，被 `Disallow: /*?n=` 挡着。捕获端 `captureNewsRef` 全仓没有调用、`news_ref` 没有读取方，是死代码（§1.11）
   - `?via=`：营销邮件
   - `?svc=`、`?c=`：接码预选的服务、国家/地区，由客户端接管，canonical 指 `/jiema`
3. **接码预选参数改名，值也换成本站自己的 slug**：
   - `?s=<上游代码>` 改成 `?svc=<本站 slug>`（`openai`、`telegram`…，由 nameEn 规范化，或在 `service-pages.ts` 里维护映射），服务端或客户端再映射回上游代码。国家/地区参数同理改用本站 slug（例如 ISO 3166-1 两字母码），是否一起改由接码会话评估。
   - 原因有两个：`s` 和新闻分享参数重名，站内热门服务链接因此被 robots 挡住了 [R1 §4]；`?s=dr` 这类值把上游代码写进了服务端直出的 HTML，和第 1 条的规定矛盾 [R5 §3.2]。
   - `?s=<code>` 继续认，只做旧分享链接和旧登录回跳的兼容，站内不再生成。
   - 这条改动碰到下单路径：`jiema-client.tsx` 把 `?s=&c=&op=&confirm=1` 写进地址栏（桌面 replaceState，手机 pushState + popstate），登录回跳也靠它恢复选择。验收要覆盖三条路径：旧 `?s=` 分享链接、登录回跳、手机端 popstate。
   - 已进白名单且已上线的服务，站内链接直接指向 `/jiema/<服务>`；其余只在客户端目录里出现，公开页服务端 HTML 不生成它们的链接（§1.6）。
4. **永久不变的路径**：
   - `/news` 不改成别的词：已有 400 多条 URL，OAI-SearchBot 和 ClaudeBot 在持续回访 [R5 §1.2]。
   - `/chongzhi/*`、`/products/[id]` 不改成带词的 slug：收益低，还要做 301 [R1 §10]。

### 1.3 各类页面的索引规则

| 页面 | robots | canonical（只写在 page.tsx 里） | sitemap 分段 | lastmod |
|---|---|---|---|---|
| 首页 | index | `/` | core | 不写 |
| /about、/support、/links | index | 自指 | core | 不写 |
| /terms、/privacy | index | 自指 | core | 条款或隐私政策的版本日期常量 |
| /chongzhi 及其子页 | index | 自指 | chongzhi | **该页自己的 reviewedAt**（registry 里每页一个）；hub 取子页里最新的那个；真核对过才改 |
| /products | index | `/products`，`?category=` 也指这里（现状） | products | 不写 |
| /products/[id] | 在售：index；不存在：404 | 自指干净 URL | products | **不写**：`Product.updatedAt` 每笔付款都会刷新（`vmq.ts:1588` 的 `sales increment`，后台改订单 `admin/orders/[id]/route.ts:524、743`），和附录 B-2 是同一类噪声。以后后台保存商品时另记 `Setting` 的 `product_edited_<id>`，再改用它 |
| /jiema | 由 `jiemaPublicOpen` 决定（layout 默认值，fail-closed） | `/jiema`，**从 layout 挪到 page.tsx** | jiema | 不写：价格每小时变，写了也不可信 |
| /jiema/[service] | 过闸为 index，否则 noindex,follow（§1.7）。只允许比 layout 默认值更严 | 自指 | jiema（只收过闸的） | 服务页正文的 reviewedAt 常量 |
| /jiema/terms | **继承 /jiema 页面组 layout 的默认 robots**（`terms/page.tsx` 用静态 metadata、自己不声明 robots，注释写明继承） | 自指 | jiema | `JIEMA_TERMS_VERSION` |
| /jiema/records、/jiema/order/* | **noindex,follow**：改用 `privatePageMetadata()`，现在是 nofollow | 不写 | — | — |
| /news | index | 自指 | news-hub | 最新一条的 publishedAt |
| /news/c/* 与分页 | index | 自指，`?page=N` 也指自己；`?page=1` 308 到无参 URL；非法值（0、负数、小数、非数字）和越界一律 404 | news-hub（只收第 1 页）| 该分类最新一条的 publishedAt |
| /news/t/* | 过闸为 index，否则 noindex,follow | 自指 | news-hub（只收过闸的）| 最新 publishedAt 与导语 reviewedAt 取较晚者 |
| 日报 / 周报 | index；当期条数 <3 时 noindex,follow | 自指 | news-hub（最近 60 期，维持现状）| 该期的生成时间 |
| 月度归档 | index | 自指（不分页） | news-hub（最近 24 个月）| 当月最新一条的 publishedAt |
| /news/[slug] | 有全文层为 index；薄页 noindex,follow（维持） | 自指 | news-events（90 天内的非薄页，维持）| **max(publishedAt, reviewedAt)**（附录 B-2）。局限：补齐全文层不体现在 lastmod 上 |
| /forum/*、/games/* | **noindex,follow** | 不写 | **移出** | — |
| 其他私密页 | noindex,follow（维持） | — | — | — |
| 带 token 的页面 | noindex 加 Disallow（维持） | — | — | — |
| /lookup（无参） | noindex（维持）；robots 改为 `Allow: /lookup$`，让爬虫读得到 noindex；带参数的形态继续被 `Disallow: /lookup` 挡住 | — | — | — |
| 404 | Next 自动加 noindex。根 layout 的 robots（含 googleBot 的 index,follow）**维持原样**，404 页因此有两条互相矛盾的 robots，Google 取更严格的 noindex，记为已知、无害（§6.8） | — | — | — |

「过闸」的具体条件见 §1.7。

**/jiema 页面组 robots 的写法（fail-closed）**：`jiema/layout.tsx` 里保留 `robots: jiemaPublicOpen ? index,follow : noindex,follow` 作为整组的默认值，只把 canonical 挪到 `page.tsx`。子页面只允许收得更严：records、order 用 `privatePageMetadata()`；服务页不过闸就 noindex。这样灰度期（仅管理员）的 /jiema/terms 和以后新增的子页，漏写 robots 时默认也不会被收录（D28、Q6）。

### 1.4 支柱一：/chongzhi 落地页矩阵

- **hub 的职责**（目标态，分两步落地，见下）：
  1. 各档位价格。官方定价和本站售价并列时，表头写「官方定价（美元，以官方页面为准，核对于 {date}）」和「本站售价（人民币，不含税）」；**不加划线价、原价、「省 X%」列，不写「比官方便宜」**（R5 §2.3）。如果 SERP 实看显示「ai会员 价格对比」是跨区官方价比较的意图（kw6 里 chatgpt pro、claude max 的价格联想大半是土耳其 / 尼日利亚区价格，§2.7），补一节「各区官方价参考（以官方为准）」。
  2. 怎么选：ChatGPT 与 Claude；Pro 与 Max 只写一句并链到 claude-max（唯一承接页）；拼车与独享只写判断标准，不贬低其他经营者（广告法第十三条）。
  3. 怎么判断卖家靠不靠谱：**已经存在**（`chongzhi/page.tsx:292`「怎么分辨一个代充卖家靠不靠谱」），只在这一节里补段落，不新增 H2。
  4. 能开发票吗：**已经存在**（hub FAQ「可以开发票吗？」，`chongzhi/page.tsx:89-90`，带 6%）。它就是全站完整开票问答的唯一出处，其他页不再新增开票 FAQ。
  5. 链到全部子页（现状由 registry 驱动）。
- **hub 和 chatgpt-plus 是 AI 引用入口，改动分两步**（P0 基线里出现 AI 来源访客的其他落地页同样处理）：
  - 第一步（构建批 3，10-29 或之后）：只换 `<title>` 和 description。H1 维持「AI 会员充值与账号服务」。
  - 第二步（构建批 4，第一步上线 2–4 周后，AI 来源会话没有下滑）：事实卡、新 H2 一律**追加在现有段落之后**。现有顺序是「按服务分类 → 卡密充值是怎么运作的 → 怎么分辨一个代充卖家靠不靠谱 → 常见问题」（`page.tsx:196-336`），不插在 H1 下面，不改顺序。
  - 两步前后都把线上 HTML 存成快照。
- **子页**：每个产品族只对应一个意图，关键词的归属见 §2。价格表继续按规则匹配商品（`registry.ts` 的 match），不写死商品 ID（§24-2）。
- **每个 SKU 只有一个主落地页**：
  - `landingForProduct` 的规则是「按 LANDINGS 顺序取第一个命中」（`product-intro.ts:138`）。claude-code 的价格区只放摘要、链到 claude-pro 和 claude-max，不整表复制；它追加在 LANDINGS 末尾，并标 `ownsProducts: false`，不参与 `landingForProduct`。
  - 这样 Pro、Max 各档商品的「完整购买指南」链接、商品介绍、面包屑、IndexNow 的所属落地页仍然分别指向 claude-pro、claude-max。`check-product-intro.ts` 加断言。
- **商品页和落地页的关系**：
  - 落地页是「选购指南 + 价格表」，承接品类词和问题词。
  - `/products/[id]` 是具体 SKU 的交易页，承接「某一档」的长尾词。
  - 商品页的面包屑改成「首页 › AI 会员充值 › {主落地页} › {商品名}」，现在是「› 全部商品」，并加一条回到主落地页的正文链接。**这两项和商品页事实卡都只在主站输出**（`!channel`）：/products/[id] 是全站唯一在渠道站也开放的商业页，渠道站没有 /chongzhi（`products/[id]/page.tsx:268-271` 已经按渠道关掉了 JSON-LD 和 intro.guide）。
- **不建的页**：
  - 「AI 会员代充」品类页
  - 「chatgpt plus 代充」「多少钱」这类与已有页同意图的拆分页
  - Gemini / Google AI Pro 页：只有在售 SKU 时才建（站长决定）
  - 「XX 账号购买」一类新页：接触反电诈法第三十一条 [R5 §3.4]
  - 按城市或地区拆的页

### 1.5 支柱二：/news 大事记结构

| 页面 | 服务端直出的内容 | 抓取通道的作用 |
|---|---|---|
| /news | 今日重点、今日速览卡片、6 个分类链接、话题链接、最近 12 个月的归档链接、最新 20 条；「加载更多」维持客户端追加 | 入口，把权重分给分类页和日报。**不做服务端深分页** |
| /news/c/<cat> | 分类导语：按 `constants.ts` 的 hint 扩写，固定文本 80–150 字，**只在第 1 页出现**；每页 30 条**可索引**事件（与 sitemap 共用 `shouldNoindexEvent`），上一页 / 下一页 `<a>` | 深度抓取通道之一：按时间倒序走到本分类全部可索引事件 |
| /news/t/<topic> | H1 下一行可见说明：「本页为第三方按公开信源整理，非 Anthropic / OpenAI / Google 官方页面；官方更新日志见 [外链]」；导语 150–300 字（AI 起草、人工逐条核对，写明「核对于 {reviewedAt}」，纳入本页 AI 标识范围，署名仍为 Organization）；「当前版本速查」小表（外链官方页面，标注核对日期）；话题下最近 30 条可索引事件（**不分页**，深度抓取靠分类分页和日报）；「广告 · 本站服务」区块 | 实体长尾 + 通往支柱一的桥 |
| 日报 | 现有的 Top 10 摘要；**新增「当天全部可索引条目」列表**，只放标题链接，按分类分组，薄页不列；前一天 / 后一天、本周周报、本月盘点的链接 | 深度抓取通道之二：把按天归属的可索引事件全部挂上链接，解决孤儿页 |
| 周报 | 现有的 Top 15；本周 7 天的日报链接 | — |
| 月度归档 | 本月 Top 10（按 baseScore）；本月各周周报；**按天分组的列表**：每天前 3–5 条可索引事件加当天日报链接，不逐条分页；导语用确定性文案，例如「本月共收录 N 条……」 | 按月回看；不和分类分页重复列同一批事件 |
| 详情页 | 可见面包屑：首页 › AI 圈大事记 › {分类} › 标题；相关条目（现有）；话题链接；**「广告 · 本站服务」区块**（§2.5、§7.4） | — |

**目标**：每一条可索引事件，都至少能从两条服务端渲染的 `<a>` 路径走到：分类分页，加上日报。这样 `sitemap.ts:127` 那句注释「顺着归档页能走到每一条旧内容」才算成立 [R1 §11]。

**为什么只保留一套深分页**：按 §24，约 2/3 的事件没有全文层、是 noindex 薄页；§28 已经记下「noindex 不省抓取预算」。初稿的 /news、分类、归档三套分页列的是同一批事件，而且没过滤薄页，1.8G 小机的抓取量会大半花在不会被收录的页面上。

**性能**：分类页第 2 页起只渲染事件列表、上下页链接和月份导航，不跑今日、本周、补录这类查询；总数和月份列表用 `storefrontCached` 缓存 60 秒（§6.6-8）。数据层缓存（Ha）必须先于 E1 上线。

**合规前提**：每个新增页面都遵守 SKILL.md（附录 C）：
- 带 `<meta name="ai-generated" content="true">`
- 列表卡片带「AI 摘要」徽章
- 页面文字里没有「新闻 / 快讯 / 头条」
- 作者是 Organization
- 不用原文配图，不开评论，不设 AI 输入入口
- 商业入口只放在标「广告 · 本站服务」的独立区块里，和 AI 摘要、AI 免责声明视觉分开
- 这些都属于 SKILL §10 以外的「UI / 分类文案」常规迭代，不碰那 5 条需要事先确认的红线

### 1.6 支柱三：/jiema 结构

**前提**：以下内容只在接码对全部用户开放（`jiemaPublicOpen`）之后才有收录意义。灰度期 /jiema 整组 noindex，站内任何公开页都不出现指向 /jiema 的链接（D28）。

- **/jiema hub**，服务端直出，按页面顺序：
  1. H1 和一句话说明
  2. 600–1000 字的正文：什么是短信接码、适合什么场景、价格怎么定、没收到短信怎么退（整单退回站内余额，不可提现、不退回支付宝）、合法用途的边界。**号码类型只写一句**：「本站不区分、也不能指定号码类型（实体号 / 虚拟号），号码能否被平台接受由平台决定」（D26）。
  3. 热门服务表：≤12 行，取代码里的 **SEO 白名单常量**（与服务页白名单同源，排除 tg、国内实名类、金融 / 支付 / 加密货币类服务），列出服务名、本站起价、可选的国家/地区数；已上线服务页的链到服务页，其余链 `/jiema?svc=<本站 slug>`。不取后台 hotRank（默认第 3 位是 Telegram，§0.3 #34）
  4. 「热门国家/地区」区块：同样取代码常量（美国、英国、中国香港、日本……，**排除中国 +86**），写起价和可用服务数，命名按 D44
  5. 规则摘要
  6. 13 条 FAQ（FAQPage 只在 OPEN 时输出，只输出在这一页）
  7. 条款链接
  - **目录加载**：hot 以外的服务改为客户端懒加载；地址栏里预选的服务在服务端直出，恢复选择不用等网络请求。「首屏不等网络、搜索全在前端」（接码设计 §1.4）不能退化。`RowList` 已经是虚拟列表（`jiema-client.tsx:150`），不用再做。目标是把 HTML 从 188KB 压到 60KB 以内 [R1 §12]。
  - **SEO 白名单里的服务必须同时在 cron 预热清单里**（后台 hotRank；`catalog.ts:1073` 只预热 hotRank 非空的前 40 个），否则价格表会退回第 ① 层的「约 ¥x 起」。check 脚本断言。
- **服务页 /jiema/<服务>**，按页面顺序排 8 个区块，照 [R4 §3.1] 改到符合本站口径：
  1. H1（问句，如实作答）和一句话答案
  2. 总结句 + 事实卡（§4.3）
  3. 各国家/地区的实时起价表：复用 `pricing.salePriceCents`，与下单报价同源，不能触发 PRICE_CHANGED；**每行直链 /jiema 并预选服务和国家/地区，一次点击到达确认面板**（§0.3 #32）
  4. 2–4 步操作说明：每一步都要对照代码确认存在
  5. 本站实测数据（样本达标才显示，写明样本量和统计区间）：中位到码时长（≥30 单）、近 30 天下单最多的国家/地区；换号规则按配置渲染（免费换号次数、冷却时间）
  6. 本服务专属的注意事项：**AI 起草、人工逐条核对**（写明「核对于 {reviewedAt}」），至少一段对照官方帮助页并外链。排查建议只写「用本人常用号码、稍后再试」这类常规做法，**不写「换号码类型」**（本站不能指定号码类型），不写绕过平台风控
  7. 3–6 条专属 FAQ（页面上可见，不输出 FAQPage）：通用问题链回 `/jiema#jiema-faq`
  8. 相关服务和对应充值落地页的互链（**不链账号类商品和 KYC**，§2.5），非隶属与商标声明，条款链接
  - **不显示成功率百分比**（D26）。内部收码成功率只用于开页决策（§1.7）。
- **不做的页**：
  - 国家页（本轮）
  - 「服务 × 国家」组合页（永远不做）
  - 公开号码列表或短信内容页（永远不做：号码列表正是 Google 政策原文举的关键词堆砌例子）
  - 国内平台、金融、支付、加密货币类服务页（D25、Q6）

### 1.7 程序化页面的护栏

判定依据：Google 垃圾内容政策中的 scaled content abuse、doorway、keyword stuffing [R4 §1.2]；百度劲风算法；§24-3 的门页四条。

| 页面组 | 生成条件（全部满足） | 数量上限 | 不满足时 | 复核 |
|---|---|---|---|---|
| /chongzhi/* | ① 有在售 SKU，或是明确的服务（KYC、注册）<br>② 过 §24-3 四条门页自查，§2 映射表里有它独占的词簇<br>③ 信息检查清单：本页独有数据点 ≥5 个（价格、档位、交付方式、额度等，实时取数）；每一步操作都对应到代码；至少一段官方外链核实 | 12 | 不建 | 每月核对一次，真核对才改**该页**的 reviewedAt |
| /jiema/[service] | ① 在代码里的 SEO 白名单常量中（境外服务；非金融、支付、加密、国内平台），并且在 cron 预热清单里<br>② `jiemaPublicOpen` 为真<br>③ 该服务在 ≥5 个国家/地区有可售报价<br>④ **近 30 天该服务本站已付款单 ≥20，且内部收码成功率 ≥ 阈值**（默认 50%，站长定；只用于决策，不展示）<br>⑤ 正文 AI 起草、**经人工逐条核对并记录 reviewedAt**；信息检查清单：本站独有数据点 ≥3 个、每一步操作对应到代码、至少一段官方帮助页外链<br>⑥ 价格表一次点击到达确认面板 | 20：首批 3 个，每批 ≤5 个，两批间隔 ≥2 周 | • 闸门状态由 cron 每天算一次，写进现有 `Setting` 表的 `seo_gate_<slug>`（首次不满足的时间、当前状态），页面和 sitemap 只读这个状态，不按请求实时判断<br>• 滞回：③ 进入要求 ≥5 个，低于 3 个连续 7 天才退出；④ 连续 14 天不达标才退出<br>• 退出时改为 noindex,follow 并移出 sitemap，页面仍返回 200、不 404<br>• 上线 8 周零展示：301 或 308 回 /jiema | 每批上线满 2 周看 GSC |
| /news/t/[topic] | ① 在话题白名单里（TAG_WHITELIST 的子集）<br>② 近 90 天 ≥10 条可索引事件<br>③ 导语和速查块 AI 起草、经人工逐条核对（带 reviewedAt） | 10 | noindex,follow，不进 sitemap。状态同样每天算一次，存 `seo_gate_topic_<slug>`；低于 7 条连续 7 天才退出 | 每月 |
| /news/c/[cat] | 固定 6 个 | 6 | — | — |
| `?page=N` 分页（只用于分类页） | 本页至少 1 条可索引事件 | 自然增长 | `?page=1` 308 到无参 URL；非法值和越界返回 404 | — |
| 日报 / 周报 | 当期 ≥3 条 | — | noindex,follow | — |
| 国家页 | 本轮不做 | 0 | — | 12 周复盘时，按 GSC 里「美国手机号」相关查询的展示量再议 |
| 服务 × 国家、号码列表、站内搜索结果页 | **永不做** | 0 | — | — |

**首批服务页怎么挑**：候选 google、openai、whatsapp、instagram。开放满 1 周后，按条件 ④ 的内部数据重排，取达标的前 3 个；google 不达标就不建。openai 还要先过 §3.3 的官方核实。WhatsApp 和被排除的 Telegram 一样在境内不可用，它能不能入选只看内部数据和 SERP 语境实看：如果它的境外搜索结果同样是诈骗、开盒一类语境，同样排除。

**加一个自动化护栏**：新增脚本 `scripts/check-page-uniqueness.ts`。
- 抓取服务页和话题页，**只对「服务专属区块」**（服务页的第 5、6、7 块，话题页的导语和速查块）按 5 字一组切片，两两计算重合度（Jaccard），**>0.25 即失败**。
- 整页正文另设一条宽线：>0.5 失败（共用模板会稀释差异，所以整页的线只用来兜底）。
- 同时检查所有页面的 title 和 description 在全站是否唯一（分页页带「第 N 页」）。
- 不设字数门槛：字数门槛会鼓励凑字，评估员指南已新增 filler 一节 [R4 §1.1]。改用上面各行的信息检查清单。

### 1.8 面包屑

每条都要做成「可见面包屑 + BreadcrumbList」一对，复用 `Breadcrumbs` 组件：

- 首页 › AI 会员充值 › ChatGPT Plus 充值
- 首页 › AI 会员充值 › ChatGPT Plus 充值 › {商品名}（商品页，从现在的「全部商品」改过来；归属取主落地页；只在主站输出）
- 首页 › 短信接码 › Google 验证码（服务页）；首页 › 短信接码 › 服务条款
- 首页 › AI 圈大事记 › {分类} › {标题}（详情页）
- 首页 › AI 圈大事记 › 话题 › Claude
- 首页 › AI 圈大事记 › 每日速览 › 2026-09-30（「AI 日报」只留在 `<title>` 里，面包屑和 H1 用现有 UI 的「每日速览」，`digest/[type]/[period]/page.tsx:110`）
- 首页 › 关于我们 / 常见问题

注：面包屑自 2025-01 起只在桌面端的搜索结果里显示 [R4 §1.3]。它仍然是这类站点最稳的富结果，Google 已经给落地页显示了「› AI 会员充值」。

### 1.9 导航与页脚

**顶部导航**（`header.tsx`，桌面端的链接会进服务端 HTML）：

- 宽屏：首页 ｜ AI 会员充值 ｜ 短信接码（跟随 `jiemaOpen`，现状）｜ AI 圈大事记 ｜ 商品 ｜ 客服 ｜ 更多▾（IP 工具、论坛、友链）
- 「更多▾」用 `<details>/<summary>` 或 CSS 隐藏实现，**下拉里的链接始终在服务端 HTML 里**：`wp1.ts:643` 断言主站页头有 /chongzhi、/news、/iptools、/forum、/links、/profile/referral、/wallet 等入口
- 窄屏：沿用现在的短标签「充值」「接码」
- 「充值」的指向和 D16 一致，指 /chongzhi
- header 的 `<Link>` 加 `aria-label="贝果科技首页"` [R1 §14]

**页脚**（`footer.tsx`）**维持客户端组件**，分 4 栏，总链接数 ≤35，避免堆砌：

1. **AI 会员充值**：hub 和 10 个子页（含新增的 claude-code；registry 驱动，现状）
2. **短信接码**：/jiema、服务条款，跟随现有的 `jiemaOpen` prop。**不列服务页**：那需要服务端的闸门数据，客户端页脚拿不到；服务页的入口在 /jiema hub
3. **AI 圈大事记**：/news 和 6 个分类页（固定常量）。**/news 是新增的，现在的页脚里没有**；按 `features` 控制，渠道站不出现
4. **关于与支持**：关于、常见问题、订阅查询、服务条款、隐私政策、友链、IP 工具；另加一行经营主体全称和营业执照信息（§9 待决，涉及电子商务法第十五条）

不改 `(shop)/layout.tsx`：页脚现有的 props（`catalogOpen`、`jiemaOpen`）和 `useStorefront()` 的 features 够用。页脚改成服务端组件的方案作废：`footer.tsx` 是 `'use client'`，features 来自 context；`mods-p3.ts`、`wp1.ts:646` 用 react-dom 的同步 `renderToString` 渲染它，async 服务端组件在那里渲染不了。

### 1.10 首页怎么分发权重

首页是 ChatGPT-User 抓取最多的页面，6 万行日志里抓了 29 次（§28）。它要承担两件事：让 AI 读到三条业务的定义，把权重分给三个 hub。

服务端直出的区块顺序：

1. **Hero**：H1，一句话定义，入口卡片。去掉 H1 的 `opacity:0` 初始态 [R1 §16]。
2. **支柱一**：hub 链接，加 6 张热门落地页卡片，带实时起价。现在「精选服务」这一块是客户端拉取、服务端 HTML 里显示「加载中...」，改为服务端直出（§24-5-④ 同一类问题）。
3. **支柱三**：只在 `features.jiema && jiemaPublicOpen(await readSmsConfigCached())` 时输出，并且只在主站输出。6 个服务取 SEO 白名单常量（§1.6），带起价，链到服务页或 `/jiema?svc=<本站 slug>`，加 /jiema 入口。读不到数据就不显示这一块，不能让首页 500。
4. **支柱二**：今日速览卡片、最新 6 条事件（带「AI 摘要」徽章）、3 个话题链接。现在的「AI 圈今日热点」是客户端拉取的，改为服务端直出。按 features 控制，渠道站不出现。
5. **信任条**：经营主体、付款方式、开票口径、售后口径、累计成交数（取库里实时值，已有）。它替代被下线的左下角成交弹窗。
6. **品牌级 FAQ**：3–5 问，例如「贝果科技是什么公司」「和官方是什么关系」。开票只写一句并链到 hub 的开票问答。

灰度期（接码未对全部用户开放）首页的 title、H1、description 和 Organization 都不写「短信接码」（§3.3、§4.2），页面上没有 `href="/jiema`。

目标：首页服务端可见正文从 966 字提高到约 2000 字（用信息检查清单衡量，不设硬字数门槛），且没有任何「加载中」。

### 1.11 迁移与 301：不丢任何已收录页

本方案**不移动任何现有 URL**，只新增 URL。需要处理的只有这几项：

| 对象 | 处理 | 负责 |
|---|---|---|
| `http://` 全站 | Cloudflare 打开 Always Use HTTPS，301 到 https；HSTS 先观察一周，再从 300 秒提到 1 年，暂不加 includeSubDomains。HSTS 改 nginx，和其他 nginx 改动攒到同一次 `force-recreate nginx`，放在低峰时段 | 站长 |
| www | 已经 301 到裸域，维持 | — |
| `/jiema?s=` | 继续有效，只做旧链接兼容；站内改用服务页或 `?svc=<本站 slug>` | 接码会话 |
| `/products?n=` | 继续能打开（canonical 到干净 URL）。`?n=` 的捕获端是死代码（`captureNewsRef` 全仓没有调用，`news_ref` 没有读取方），站内停止生成这种链接；`lib/news/attribution.ts` 标记待删，由主进程决定 | 实现 |
| 已下架的 `/products/11、13、22` | 能确定对应哪条产品线的，用 `next.config.js` 的 redirects（`statusCode: 301`，随发版）指到该线的落地页；确定不了的维持 404 | 站长提供对应关系 |
| Bing 里的 noindex 旧快照（/login、/register、/forgot-password） | 用 IndexNow 推送这些 URL，促使 Bing 重新抓取、读到 noindex | 实现（一次性脚本） |
| `/lookup`（robots 禁抓，Bing 读不到它的 noindex） | robots 加 `Allow: /lookup$`，无参的 /lookup 可以抓、读得到 noindex；带邮箱或 token 的查询形态继续被 `Disallow: /lookup` 挡住。Bing Webmaster 的 Block URLs 只作过渡（约 90 天到期） | 实现（A 包）+ 站长 |
| /forum/*、/games/* | 加 noindex,follow，让它们自然退出索引 | 实现 |
| 服务页过闸失败满 8 周 | 301 或 308 回 /jiema，不做 404 | 接码会话 |

---

## 2. 关键词与页面映射总表

### 2.1 规则

1. **每个关键词簇只对应一个主承接页**。
   - 其他页面可以在正文里提到这个词、并链到主承接页，但 title 和 H1 不能用同一个主词。
   - 例外：首页 title 只写三条业务的概括，不写单品，也不和 hub、/products 用同一个短语。
2. **出现冲突时，按这个顺序决定归属**：
   1. 已经被收录的页优先
   2. 能就地下单的页优先
   3. 意图更具体的页优先
3. **写进 title 的词必须有下拉建议的实测记录**，数据来自 [R3] 或 [kw6]。
4. **每个 SKU 只有一个主落地页**（§1.4）：面包屑、「完整购买指南」、IndexNow 的所属落地页都只认它。
5. **表头说明**：
   - G / B / D 分别是 Google / Bing / 百度的「相关联想条数」，是广度信号，**不是搜索量** [R3 §1]。
   - **计数口径统一为 R3 口径**：去掉与原词相同的回显，且联想串必须包含原词的全部词元（英文词元按词界匹配，`pro` 不匹配 `proxy`）。[kw6] 的数字已按这个口径重算（`seo/kw6/recount.tsv`），和原始条数不同的都标了出来。
   - ★ 表示列入 0.4 的跟踪词簇；具体跟踪哪 20 个查询串见 §0.4 的列表。
   - 「位置」一列说明这个词放在 title、H1、H2、description 还是正文。

### 2.2 支柱一：AI 会员充值

| 关键词簇 | G/B/D | 意图 | 主承接页 | 位置 |
|---|---|---|---|---|
| ★ ai会员 / ai订阅（比价、价格对比、充值） | 8/10/10、9/10/10<br>[kw6]：联想里有「ai会员价格对比」「ai会员比价」「ai会员充值」；`ai订阅` 9 条里 2 条是台湾语境（信用卡回馈、补助） | 比较→交易（「价格对比」可能是跨区官方价比较，见 §2.7） | /chongzhi | title；H1 维持现状。**改名前先实看「ai会员 价格对比」「ai订阅 比价」的 SERP** |
| ★ chatgpt plus 国内 / 怎么 / 购买 / 便宜 | 10/9/3、10/12/5、9/8/4、9/8/0 | 交易 | /chongzhi/chatgpt-plus | title（AI 引用页，两步走的第一步） |
| chatgpt plus 充值 / gpt充值 / chatgpt 充值 | 6/8/3、10/11/4、8/9/9 | 交易 | chatgpt-plus | H1（现有 H1 已有「充值」）、description |
| chatgpt plus 信用卡（被拒）/ 付款未获批准 | 10/10/1 | 信息→交易 | chatgpt-plus | title、H2 |
| chatgpt plus 支付宝 | 5/3/1<br>[kw6] 3 | 交易 | chatgpt-plus | title |
| chatgpt会员（购买、价格、怎么买） | 9/10/6<br>[kw6] 9 | 交易 | chatgpt-plus | **待站长确认（§9.4 #19）**；确认前只进正文 |
| chatgpt plus codex 额度 / codex 充值 | 字母扩展里出现；8/10/2 | 交易 | chatgpt-plus | 新增 H2「Plus 里的 Codex 额度」（第二步追加） |
| ★ chatgpt pro 价格 / 5x / 5x 和 20x 区别 / 升级 pro | 9/6/2（[kw6] 9，其中 6 条是跨区价格：土耳其、尼日利亚、日区等）、[kw6] 9、9/6/3 | 交易 | chatgpt-pro | title |
| ★ claude 会员 / claude pro 怎么 / 国内 / 价格 | 9/7/9、10/9/0、8/5/0（[kw6] 8）、9/5/1 | 交易 | claude-pro | title |
| ios 订阅 claude | 8/2/0 | 交易 | claude-pro | title |
| claude 礼品卡 | 8/7/9 | 交易 | claude-pro | H2：讲清本站交付的不是礼品卡，写明两者差别 |
| claude 封号 / 申诉 / organization disabled | 9/10/10 | 信息（信任） | claude-pro（现有 H1 已有「封号风险说明」） | 新增 H2「封号了怎么办、能不能申诉」，中性信息，**不带 KYC 代办的 CTA** |
| ★ claude max 价格 / 20x / 5x；**Pro 与 Max 怎么选 / 区别** | 9/7/1（[kw6] 9，其中 5 条是跨区价格）、9/11/4、9/11/1 | 交易 | claude-max（「Pro 与 Max 怎么选」的**唯一**承接页） | title，价格写成「充值价」。其他页把「Pro 还是 Max」从 title、H1、description 里拿掉，只在正文里链过来 |
| ★ claude code 充值 / 价格 / 订阅；claude code pro 额度 / 够用吗；claude code api 充值 | [kw6] 10 / 9 / 9；`claude code pro` 原始 9、按 R3 口径 3（额度、够用吗、价格；去掉 proxy、prompt 等 6 条）；`claude code 充值` 的联想含「api 充值」 | 交易+信息 | **/chongzhi/claude-code（新）** | title 写它独有的：Pro 额度够不够用、Max 方案与价格、API 与订阅的区别 |
| claude 发票 / claude code 发票 / chatgpt 发票 | 9/8/0（[kw6] 9，其中 2 条是统编、归户）、[kw6] chatgpt 发票 5（3 条是统编、归户、报帐） | 信息（**台湾电子发票意图为主，大陆需求未证实**，R3 百度 0） | hub 已有的开票问答（`chongzhi/page.tsx:89`） | **不作为数据支撑的主词**，不列 ★；只保留为 FAQ，必须带「标价不含税，开票另付 6%」 |
| claude kyc / 实名 | 8/9/4、3/7/9 | 信息 | claude-kyc | **title、description、H2 全部维持原样**；不补「实名认证」，不列 ★，等站长或律师确认后再议（§9.4 #21） |
| claude 注册 / 注册 手机号 | 9/9/9、3/9/1 | 信息 | claude-zhuce | 维持；接码开放后链到 /jiema |
| ★ codex 接码 / codex 手机号验证 | 9/11/8（[kw6] 10）、6/6/9 | 交易+信息 | codex-jiema | title |
| ★ grok 订阅 / grok 会员 / supergrok | 9/9/9（[kw6] 10，其中 2 条台湾语境）、5/7/9、[kw6] 9 | 交易 | grok-super | title |
| 谷歌账号购买 | 5/11/8 | 交易 | google-zhanghao | 维持，不扩张；只从 hub 和页脚进入 |
| chatgpt代充 / gpt代充 / claude代充（靠谱吗） | 3/11/0、2/11/7、1/8/1 | 信任审查 | hub 已有的 H2「怎么分辨一个代充卖家靠不靠谱」；/about | 不进 title |
| claude 拼车 / chatgpt 拼车 | 9/7/5、3/6/0 | 交易（竞品的模式） | hub 的「拼车与独享」一节（第二步追加） | 正文，只写判断标准 |
| 全部商品 / 价格表（导航型） | — | 导航 | **/products** | title 改为不含主打词的「全部商品与价格 - 贝果科技」，H1 去掉「AI 会员充值」；「AI 会员价格 / 充值」由 hub 独占 |
| gemini 会员 / google ai pro | 9/7/9、9/4/0 | 交易 | 暂无；有在售 SKU 才建 | §9 待决 |

### 2.3 支柱二：AI 圈大事记

| 关键词簇 | G/B/D | 意图 | 主承接页 | 位置 |
|---|---|---|---|---|
| ★ 今日ai（热点）/ ai热点 | 4/10/2、5/11/7（[kw6] 5） | 信息 | /news | title |
| ai资讯 / ai资讯日报 | 9/11/4（[kw6] 9） | 信息（导航型） | /news | **只进 description，出现一次**（合规） |
| ★ ai日报 + 日期 | 3/10/6；Bing 的联想带日期 | 信息 | /news/digest/daily/<日期> | **只进 title**；面包屑、H1 用「每日速览」「AI 动态速览」 |
| ai大事件 / 一周 / 盘点 | 1/3/4（[kw6] 原始 2，按 R3 口径 1：去掉「愛大事件」）；搜索结果页是盘点、周报页型 | 信息 | 周报、月度归档 | title |
| ★ claude 最新 / 最新模型 / 更新日志 / opus / sonnet | 9/11/10、[kw6] 5、[kw6] 7、9/11/10、9/11/9 | 信息 | /news/t/claude | title；description 和页面上写明「第三方整理，非官方页面」 |
| ★ openai 最新 / openai 发布 / chatgpt 更新（日志）/ gpt5 | 9/9/10、9/11/9（[kw6] 9）、[kw6] 10、9/11/9 | 信息 | /news/t/openai | 同上 |
| gemini 更新（日志）/ google ai 最新 | 9/11/10（[kw6] 10）、9/5/2 | 信息 | /news/t/gemini | 同上 |
| 大模型 最新（发布、进展） | 9/10/9（[kw6] 10） | 信息 | /news/c/ai-models | title |
| 大模型排行榜 | 9/10/9 | 信息 | 暂无：数据来源和授权需站长决定 | §9 待决 |
| ai新闻 / 人工智能新闻 | 9/10/3、1/11/9 | 信息 | **不承接**（合规） | — |
| ai动态 | 9/11/7，但联想是动态壁纸 | 意图错配 | **不承接** | 只在 description 里用「AI 行业动态」做描述语 |
| ai大事记 / ai圈大事记 | 0/0/0 | — | 只作为 H1 品牌名 | — |

### 2.4 支柱三：短信接码

以下各行都只在接码对全部用户开放之后生效。

| 关键词簇 | G/B/D | 意图 | 主承接页 | 位置 |
|---|---|---|---|---|
| ★ 短信接码 / sms接码 / 在线接码 | 8/10/9（[kw6] 8）、9/11/4、5/10/0 | 交易 | /jiema | title 开头 |
| ★ 海外手机号 / 国外手机号（接码、验证码、接收短信） | 9/11/9 ×2（[kw6] 9） | 交易 | /jiema | title |
| ★ 接收验证码 / 收验证码 | 10/11/10（[kw6] 10） | 交易 | /jiema | title |
| 美国手机号（接收验证码）/ 美国 接码 | 9/11/10（[kw6] 9，联想首位就是「美国手机号接收验证码」）、5/11/7 | 交易+信息 | /jiema | H2「美国手机号接收验证码」 |
| 虚拟手机号 / 虚拟号码 | 9/11/9 | 混合 | /jiema | 正文只写一句：本站不区分、也不能指定号码类型，能否被平台接受由平台决定（D26）。不讲「虚拟号与实体号的区别」 |
| 接码 / 接码平台 | 9/11/10、10/11/10 | 交易+信任审查 | /jiema | **只在正文解释一次**，不进 title / H1 / description |
| ★ 谷歌 / gmail 注册 手机号 | 谷歌 注册 手机号 3/10/9；gmail 注册 手机号 4/9/6<br>[kw6]：gmail 手机号 3，google 手机号验证 2 | 信息→交易 | **/jiema/google**（过闸才建） | title 写「谷歌注册需要手机号」；**不原样引用 Google 的拒绝提示**，不承诺能解决报错 |
| ★ chatgpt 注册（手机号、需要手机号吗）/ openai 注册 | [kw6] 10 / 5；chatgpt 注册 手机号 2/10/6。联想里同时有「chatgpt 注册 不需要手机号了」和「chatgpt注册需要手机号吗」 | 信息→交易 | **/jiema/openai**（先按 OpenAI 官方帮助页核实；核实下来基本不需要，就不建，改在 codex-jiema 加一节） | title 用问句并如实作答 |
| whatsapp 注册（收不到验证码）/ whatsapp 接码 | [kw6] 9；4/7/3 | 信息→交易 | **/jiema/whatsapp**（候选，按内部数据和 SERP 语境决定） | title |
| ins 注册（收不到验证码、验证码无效） | [kw6] 10；1/9/9 | 信息→交易 | /jiema/instagram（候选） | title |
| 亚马逊注册手机号 / 微软 / outlook / line / discord | 1/9/9、0/8/6、1/7/0、2/7/1、0/2/0 | 信息 | 第 2 批候选；在此之前只在客户端目录里出现 | — |
| codex 接码 | 见 2.2 | — | codex-jiema（URL 属于支柱一） | 和 /jiema/openai 互链（锚文本中性，§2.5） |
| claude 注册 手机号 | 见 2.2 | — | claude-zhuce | 接码开放后链到 /jiema，预选 Claude |
| telegram / tg / 电报 接码 | 8/11/0、5/9/0、3/8/3 | 交易（有合规风险） | **首批不建页**；目录里照常可买；首页和 /jiema 服务端直出的热门区块不出现 | §9 待决 |
| 临时手机号 / 免费接码 | 9/11/9、9/11/10 | 找免费的 | **不承接**（意图和收费服务错配） | — |

### 2.5 跨支柱的桥接词（互链锚文本）

**硬规则**（写进 §3.4 的 lint 和 §8.2 C、D1a、F2 的验收）：
- /jiema*、大事记详情页和话题页上的 CTA，一律不链 `/chongzhi/google-zhanghao`、`/chongzhi/claude-kyc`，也不链带「普号 / 成品号」SKU 的价格表锚点。
- google-zhanghao 只从充值 hub 和页脚进入；它页面里现有指向接码的链接改成中性的「手机号验证说明」，或者去掉。
- 所有指向 /jiema 的链接，统一用 `features.jiema && jiemaPublicOpen(await readSmsConfigCached())` 控制，并且只在主站输出。灰度期全站 HTML 里没有 `href="/jiema`。

| 从 | 到 | 锚文本示例 |
|---|---|---|
| claude-zhuce「手机号验证」一节 | /jiema，预选 Claude | 「用海外手机号接收 Claude 验证码」 |
| codex-jiema 正文（**不放在「虚拟号为什么被拒」一节里**） | /jiema/openai（或 /jiema 预选 OpenAI） | 「按国家/地区选号接收 OpenAI 验证码（实时报价）」。不写「更便宜」「嫌实体卡贵」：本站不能指定号码类型（D26），「更便宜」也不对每个组合成立（D13 只规定 dr 组合售价 ≥ 旧单品 × 0.8） |
| /jiema/openai | codex-jiema；chatgpt-plus | 「Codex 登录验证见 Codex 接码」「注册完开通 ChatGPT Plus」 |
| /news/t/claude | claude-pro、claude-max、claude-code | 「广告 · 本站服务」区块：「本站在售的 Claude 订阅」 |
| /news/t/openai | chatgpt-plus、chatgpt-pro | 「广告 · 本站服务」区块：「本站在售的 ChatGPT 订阅」 |
| 事件详情（按标签：OpenAI、GPT → Plus；Anthropic、Claude → Pro；xAI → Grok；Claude Code → claude-code） | 对应落地页的干净 URL | 「广告 · 本站服务」区块：「本站在售的 {产品} 订阅」。**标签对不上就不出现**，不设「其余 → hub」兜底；映射表永不指向 claude-kyc、google-zhanghao |

### 2.6 不承接和禁用

- **零需求词，不进 title / H1**：
  - 代开、代购、代订阅、ai会员代充、ai代充、chatgpt plus 开通 / 卡密 / 兑换码
  - ai大事记、ai新闻聚合
  - 海外手机号接收验证码（作为整句）、twitter / x / microsoft 接码 [R3 §7][kw6]
- **有搜索量但不承接**：
  - 虚拟号或海外号注册微信 / 抖音 / 小红书 / QQ：属于规避实名的场景
  - 临时手机号、免费接码
  - sms-activate 替代：合规禁用，因为会牵出上游品牌
  - 大模型排行榜：数据来源问题
  - openai 营收 / 估值：财经选题
  - claude 实名认证代办、KYC 代过一类：反电诈法第三十一条「提供实名核验帮助」[R5 §3.4]
- **品牌词禁用**：herosms、hero sms、5sim、smspool、SMS-Activate
- **合规词**：见 §3.4 的 lint 清单

### 2.7 本文补测数据要点 [kw6]

64 个词，Google 下拉，`hl=zh-CN`，2026-09-30。**已按 R3 口径重算**（去掉原词回显；联想必须包含原词全部词元，英文按词界匹配），结果在 `seo/kw6/recount.tsv`。重算后和原始条数不同的只有三个：`claude code pro` 9→3（去掉 proxy、prompt 等）、`ai大事件` 2→1（去掉「愛大事件」）、`bigolab` 2→0。

- **可用**：
  - claude code 充值 10 / 价格 9 / 订阅 9；claude max 价格 9；chatgpt pro 价格 9
  - grok 订阅 10；supergrok 9；codex 接码 10
  - chatgpt 注册 10，联想包括「chatgpt注册手机号」「chatgpt注册需要手机号吗」，也包括「不需要手机号了」
  - whatsapp 注册 9，联想包括「收不到短信 / 验证码」
  - ins 注册 10，联想包括「收不到验证码 / 验证码无效」
  - chatgpt会员 9；ai会员 8，联想包括「价格对比 / 比价 / 充值」
- **长句本身为 0**，但作为短词的联想出现过：ai会员价格对比、今日ai热点、谷歌注册手机号无法验证、海外手机号接收验证码。这是下拉接口对长尾的正常表现，说明「有人这么搜，但没有更长的延伸」。
- **地区偏向没剔干净的，单独标出**（出口 IP 在海外）：
  - 发票簇：`claude 发票` 9 条里 2 条（统编、归户），`chatgpt 发票` 5 条里 3 条（统编、归户、报帐）是台湾电子发票意图；剩下的是「怎么拿到官方发票」。**大陆需求未证实**，只保留为 FAQ。
  - `ai订阅` 9 条里 2 条（信用卡回馈、补助）、`grok 订阅` 10 条里 2 条是台湾语境。
- **「价格」联想大半是跨区官方价比较**：`chatgpt pro 价格` 9 条里 6 条、`claude max 价格` 9 条里 5 条是土耳其 / 尼日利亚 / 日区 / 美元价。所以 hub 的「价格对比」未必是「官方价 vs 本站价」的意思，改名前先实看 SERP；如果是跨区意图，hub 补「各区官方价参考（以官方为准）」。
- **没做 SERP 实看的**：「ai会员」「ai订阅」两簇。这是 hub 改名的前置条件（D1b 的验收项）。
- **品牌词**：「贝果科技」只联想到「贝果科技有限公司」；「bigolab」按 R3 口径 0 条。品牌目前没有搜索需求，所以首页和关于页用「贝果科技 BigoLab」来和同名公司区分。

---
## 3. 页面模板规范

### 3.1 通用规则

**title**
- 长度：**不含品牌后缀的主体部分 ≤26 个汉字当量**（英文字母按 0.5 计），含后缀 ≤32；核心词放在前 15 个字内。
  - 这是按 Google 约 600px 的截断宽度估算的，没有实测 [R4 §5]。
  - 超长时被截掉的是品牌后缀，可以接受：Google 结果页会在标题上方另外显示站点名称。
- 结尾统一：
  - 普通页面用「 - 贝果科技」
  - 大事记页面用「 - AI 圈大事记」，现状如此，照顾微信分享标题
  - 首页和关于页把品牌放在最前面
- 分隔符只用「：」「、」「，」「 - 」。
- 价格符号统一用全角「￥」，和 `withLivePrice` 的匹配模式（`/￥\d+/`）一致。
- 不用【】、emoji、「官网」，不用「官方」形容本站，不写年份（例外见 0.3 #21），不用任何最高级。
- 全站唯一，由脚本校验；分页页加「（第 N 页）」。

**description**
- 70–120 个汉字，至少包含 3 个可以核验的事实：价格或起价、交付方式、付款或开票口径。
- 价格一律在请求时渲染，见下面的「价格占位符」。
- **不写日期**：接码写「实时报价」。Google 展示的是抓取当天的 description，几周后「截至 09-30」反而显得过时。
- 写到开票，必须带上「标价不含税，开票另付 6%」。这条对**所有非 /jiema 页面**和 JSON-LD 的 description 都生效。
- 接码页写 D37 的原文，不能写成可开票。

**价格占位符**
- 新增 `renderPriceTemplate(tpl, { key: ProductMatch })`：按占位符名分别匹配 SKU、各自求最低价。现有 `withLivePrice` 只替换第一个「￥数字」（`landing/products.ts:143`），一句里有多个价格时不够用。
- 任何一个占位符取不到价格，整句退回 §3.3 里写好的无数字版本，不留下「￥{p}」这种半成品。
- registry 里的 title 现在是静态字符串，所以涉及价格的页面要改的是**每页的 generateMetadata 加 registry**，不只是加 FAQ 条目。

**H1**
- 每页只有一个，服务端直出、首帧可见。
- 可以和 title 措辞不同，但要讲同一件事，并且包含主词。

**首屏**（移动端 375×812）
- 非 AI 引用页：不滚动就能看到 H1、一句话答案、事实卡、主 CTA。AI 引用页按 §1.4 两步走，事实卡追加在现有段落之后。
- 首屏里主体内容的占比 ≥50%：百度《违规低质页面问题说明》把「首屏主体内容占比低于 50%」列为问题 [R4 §2]。
- 没有遮挡页面的弹层：公告改成底部提示条，左下角成交弹窗下线（§6.6）。

**正文**
- 用问题式 H2，第一句直接给答案，下面再展开。
- 对比类信息用表格。
- 官方价格和官方政策一律外链到 OpenAI / Anthropic 的官方页面，并写「以官方页面为准」。
- 官方价和本站价并列时，按 §1.4 的表头规则写，不加划线价、原价、「省 X%」。

**FAQ**
- 3–11 问，每一条答案都要在代码或条款里找得到出处。
- 不为富结果去加 FAQ。
- FAQPage 只标在这组 FAQ 独有的那一页。
- **开票问答的完整版只有一份**：hub 现有的「可以开发票吗？」（`chongzhi/page.tsx:89-90`）。其他页不再新增开票 FAQ，需要时写一句并链过去；开票口径放进事实卡，由 `lib/invoice.ts` 单一来源渲染。chatgpt-plus、grok-super、google-zhanghao 现有的开票问答维持（AI 引用页不动，其余不值得为此改动）。

**信任区**
- 经营主体全称、付款方式（充值：只收支付宝；接码：支付宝或站内余额，按配置）、开票口径、售后口径、「我们不是 OpenAI / Anthropic 官方」、条款链接、内容核对日期。

**内链**
- 每页至少 3 条同一业务线的上下文链接，另加至少 1 条跨业务线的桥接链接（§2.5）。
- 指向 /jiema 的链接按开放状态输出；/jiema* 和大事记页面不链账号类商品和 KYC（§2.5 硬规则）。
- 锚文本要能说明目标页，不用「点这里」。

**信息检查清单**（替代字数门槛：字数门槛会鼓励凑字 [R4 §1.1]）

| 页面类型 | 检查清单 |
|---|---|
| 充值落地页 | 现有页 5.8k–10.3k 字，维持。新页：本页独有数据点 ≥5 个（实时取数）、每一步操作对应到代码、至少一段官方外链核实 |
| 接码服务页 | 本站独有数据点 ≥3 个、每一步操作对应到代码、至少一段官方帮助页外链；服务专属区块两两重合度 ≤0.25（§1.7） |
| /jiema hub | 目录之外有 §1.6 列出的正文各段（参考量 600–1000 字） |
| 话题页 | 导语 + 速查块（每个事实有官方外链和核对日期）+ ≥10 条可索引事件 |
| 分类页 | 导语（只在第 1 页）+ 列表 |
| 日报 | 导语 + 10 条摘要 + 当天全部可索引条目的链接 |
| /about | 三条业务、不做什么、主体与执照、付款与开票、售后、出问题找谁，各有一段 |
| 首页 | §1.10 的六个区块齐全（接码一块按开放状态），没有「加载中」 |

### 3.2 各类页面模板

**A. 首页**
- title：`贝果科技 BigoLab - {三条业务的概括}`；灰度期只写两条业务
- H1：业务并列（灰度期不写短信接码）
- 首屏：一句话定义，入口卡
- 正文：按 §1.10 的区块顺序
- 结构化数据：Organization + WebSite
- CTA：各业务卡片的入口

**B. 充值 hub（/chongzhi）**：AI 引用页，按 §1.4 两步走
- 第一步只改：
  - title：`AI 会员价格对比与充值：{产品列表} 多少钱 - 贝果科技`（前提是 SERP 实看支持「价格对比」，§2.7）
  - description：各产品的实时起价 + 付款方式 + 开票口径
- H1、首屏、现有 H2 的顺序都不动。
- 第二步追加在现有段落之后：总结句 + 事实卡、「ChatGPT 还是 Claude」「拼车与独享」、视 SERP 结果补「各区官方价参考」。「怎么判断卖家」「能开发票吗」已经存在，只补段落。
- FAQ：沿用现有 FAQ（已含开票一问）。
- 结构化数据：BreadcrumbList + ItemList + FAQPage（给 FAQPage 加 `@id` = 页面 URL，挂 dateModified、lastReviewed、publisher）+ 同页 Organization。不新增 WebPage 节点。

**C. 充值落地页（/chongzhi/<slug>）**
- title：`{产品} {主问题}：{副词1}、{副词2} - 贝果科技`
- description 依次写：`{产品}{主词}：￥{实时价} 起`、交付方式、付款方式，再加 2 个本页独有的问题点
- 首屏（非 AI 引用页）：H1 → 一句话答案 → 总结句 + **事实卡** → 「看价格表」锚点和下单入口
- 正文：保持现有结构。只做这些增量：
  - 事实卡
  - 跨支柱链接（按开放状态）
  - claude-pro、claude-max 复制 chatgpt-plus 的结构（§28）
  - 本页新增的 H2（§2.2、§5.2）
- 信任区：现有的「怎么判断卖家」段落，加上事实卡
- CTA：价格表里每个 SKU 链到 `/products/[id]`
- 结构化数据：同 B，FAQPage 挂该页自己的 reviewedAt

**D. 商品详情（/products/[id]）**
- title：后台商品名 + ` - 贝果科技`（维持现状）。站长需要在后台改掉错别字：`信用卡冲`、`Gork`、`Superr`。
- 新增，**全部只在主站输出（`!channel`）**：面包屑里加入主落地页一级；一条「选购指南」正文链接回主落地页；事实卡。
- 商品页的事实卡**不放价格**：带 `?ref=` 的访客，客户端会把价格覆盖成推广专属价，服务端直出的标价会和它打架。价格由 product-client 统一显示；事实卡只放交付、付款、开票、售后、主体。
- 结构化数据：Product/Offer + Organization + BreadcrumbList（维持），可选加 `hasMerchantReturnPolicy`，但必须和 /terms 一字不差。

**E. 接码 hub（/jiema）**
- 按 §1.6 的区块顺序。
- title / H1 / description 见 3.3。
- 结构化数据：BreadcrumbList + FAQPage（只在开放时输出）+ Service + 同页 Organization。

**F. 接码服务页（/jiema/<服务>）**
- title：`{用户的问句，如实作答}：海外手机号接收 {服务} 验证码 - 贝果科技`
- description 依次写：
  1. 用户的场景（**不原样引用平台的拒绝提示**，不承诺能解决报错）
  2. 本站的做法，加起价和「实时报价」（不写日期）
  3. 退款去向：退回站内余额
  4. 「号码能否通过验证由 {服务} 决定」，加合法用途边界
- 首屏：H1 → 一句话答案 → 总结句 + 事实卡 → 国家/地区价格表（每行一次点击到达确认面板）
- 正文：§1.6 的 8 个区块
- 结构化数据：BreadcrumbList + Service + 同页 Organization，**不加 FAQPage**：没有富结果收益，还会增加和 /jiema 重复标注的风险

**G. 大事记 hub、分类页、话题页**
- title：`{搜索主词}：{副词} - AI 圈大事记`；分页页加「（第 N 页）」，description 同样加
- H1：品牌名或分类名 + 可见的副标题（带主词）
- 首屏：导语（只在第 1 页），加前 5 条事件卡（带「AI 摘要」徽章）
- 话题页：H1 下一行写「本页为第三方按公开信源整理，非 {公司} 官方页面；官方更新日志见 [外链]」；不用对方 logo 或近似配色
- 正文：列表、服务端分页（只在分类页）、话题的速查块、「广告 · 本站服务」区块（只在话题页出现）
- 结构化数据：CollectionPage + ItemList（只放 url 和 name）+ BreadcrumbList；广告区块不进结构化数据
- 必须带 `ai-generated` meta

**H. 日报、周报、月度盘点**
- title：
  - 日报：`AI 日报 {YYYY-MM-DD}：{首条的主实体 + 动作}等 {N} 条 - AI 圈大事记`，日期格式和 Bing 上排名靠前的日报页一致
  - 周报：`一周 AI 大事件 {M.D}–{M.D}：{首条的主实体 + 动作}等 {N} 条 - AI 圈大事记`
  - 月度：`{YYYY年M月} AI 大事件盘点 - AI 圈大事记`
- 「首条的主实体 + 动作」的取法：compose 契约的 headline 是「主体 + 动作 + 关键事实」，取第一个「：」或「，」之前的部分；仍然超长时**按词界截断**，不把英文产品名截在词中间（例如得到「Anthropic 发布 Claude 新模型」，而不是「Anthropic 发布 Claude O」）。
- H1：
  - 日报：`2026年9月30日 AI 动态速览`（「AI 日报」只留在 `<title>` 里，§9.4 #2）
  - 周报：`一周 AI 大事件 9.22–9.28`
  - 月度：和 title 主干一致
- 现在的日报标题没有年份，品牌名还重复了一次 [R2 §2]，新 H1 补上年份。
- SEO 标题在 `generateMetadata` 里按请求计算；数据库里 `news_digests.title` 保持原样，不改管线写入的内容。

**I. 事件详情（/news/[slug]）**
- 维持现状：`{headline} - AI 圈大事记`，6 处 AI 标识齐全。
- 新增：可见面包屑和 BreadcrumbList；dateModified 按 0.3 #15 的口径取值；`publisher` 用 `@id` 指向 ORG_ID，并在同一页输出 Organization 节点；「广告 · 本站服务」区块（干净 URL，不写 localStorage，不进 Article JSON-LD）。

**J. 信任页（/about、/support）**
- /about 的 title：`关于我们：贝果科技 BigoLab 的经营主体、付款与售后`
- /about 的 description 按 §4.2 的口径重写：带「标价不含税，开票另付 6%」；删掉「账号不经手」（ChatGPT Plus iOS 档、Grok 需要提供登录凭据，`chatgpt-plus/page.tsx:99`、`grok-super/page.tsx:78`），或者限定为「Claude Pro iOS 档无需上号」；不写「代充」；接码按开放状态写。
- /about 正文依次写：
  - 我们做什么：各业务一段
  - 不做什么
  - 经营主体与执照
  - 付款与开票
  - 售后与退款口径
  - 出问题找谁
- /about 的结构化数据：AboutPage + Organization。
- /support 的 title：`常见问题与售后：充值、短信接码、退款与开票 - 贝果科技`（灰度期去掉「短信接码」）

**K. 404（新增 `src/app/not-found.tsx`）**
- 中文说明，给出业务入口和客服入口（接码入口按开放状态）。
- 渠道站只给首页和商品入口。
- 页面自己不写 robots，由 Next 自动输出 noindex；根 layout 的 robots 不改（§6.8）。

### 3.3 三条业务核心页的具体文案

**使用说明**
- `{p}` 类占位符由 `renderPriceTemplate` / `salePriceCents` 在请求时填入。取不到价格时，整句退回不带数字的写法（见各行备注）。
- 每条都已对照 §2 的联想数据，并按 §3.4 的禁用词表检查。
- 表中的「字数」为估算的汉字当量，英文字母按 0.5 计。
- 「批次」指 §0.5 的构建批。

**首页 `/`**（构建批 2，C 包）
- title：
  - 接码开放后：`贝果科技 BigoLab - ChatGPT/Claude 充值、短信接码、AI 动态`
  - 灰度期：`贝果科技 BigoLab - ChatGPT/Claude 充值与每日 AI 动态`
- description：
  - 接码开放后：`ChatGPT Plus / Pro 充值、Claude Pro / Max 会员充值：卡密自助兑换，支付宝付款，可开增值税发票（标价不含税，开票另付 6%）；短信接码用海外手机号在线接收验证码；AI 圈大事记每天按事件聚合 AI 行业动态。`
  - 灰度期：去掉「短信接码……」一句
- H1：
  - 接码开放后：`ChatGPT、Claude 充值 · 短信接码 · 每日 AI 动态`
  - 灰度期：`ChatGPT、Claude 充值 · 每日 AI 动态`
- 依据与检查：
  - 不再和 chatgpt-plus 抢「ChatGPT Plus 充值」，也不和 hub 的「AI 会员价格对比与充值」、/products 的「全部商品与价格」同短语
  - 删掉「代充」
  - 「会员」只用在 Claude 上（§0.3 #2，待站长确认）
  - 「AI 动态」在这里是描述语，不是要排名的词
  - 首页是 ChatGPT-User 抓得最多的页，改之前存 HTML 快照

**支柱一 AI 会员充值**

| 页面 | 批次 | title（字数） | description | H1 | 依据与检查 |
|---|---|---|---|---|---|
| /chongzhi | 批 3，AI 引用页第一步 | `AI 会员价格对比与充值：ChatGPT、Claude、Grok 多少钱 - 贝果科技`（主体约 26）<br>SERP 实看不支持「价格对比」时：`AI 会员充值：ChatGPT、Claude、Grok 价格与购买方式 - 贝果科技` | `ChatGPT Plus ￥{p1} 起、Claude Pro ￥{p2} 起、Claude Max ￥{p3} 起、SuperGrok ￥{p4} 起：按档位列出官方定价（以官方页面为准）、本站售价与交付方式。支付宝付款，登录后下单，可开增值税发票（标价不含税，开票另付 6%）。`<br>取不到价格时：`ChatGPT Plus、Claude Pro / Max、SuperGrok 各档位：按档位列出官方定价（以官方页面为准）、本站售价与交付方式。支付宝付款，登录后下单，可开增值税发票（标价不含税，开票另付 6%）。` | **维持**「AI 会员充值与账号服务」 | • ai会员 → 价格对比 / 充值 [kw6]<br>• AI 引用页：第一步只改 title 和 description<br>• 「官方定价」里的「官方」指 OpenAI 等，允许；不写「比官方便宜」 |
| chatgpt-plus | 批 3，AI 引用页第一步 | `ChatGPT Plus 国内怎么购买：价格、支付宝、信用卡被拒 - 贝果科技`（主体约 26）| `ChatGPT Plus 国内购买与充值：￥{p} 起，卡密自助兑换，无需境外信用卡，支付宝付款。讲清信用卡被拒、付款未获批准怎么办，以及 iOS 与信用卡两种充值方式的区别。` | 维持现有 H1（含「充值」） | • 国内 10、怎么 10、信用卡 10、价格 9、支付宝 3–5<br>• AI 引用页：第一步只改 title 和 description |
| chatgpt-pro | 批 3（D1b） | `ChatGPT Pro 价格：5x 与 20x 区别、Plus 怎么升级 - 贝果科技` | `ChatGPT Pro 5x ￥{p} 起（人民币），卡密自助兑换，支付宝付款。讲清 Pro 5x、20x 与 Plus 的额度差别，信用卡档与 iOS 档能不能覆盖已有 Plus 订阅，以及充值前必须确认的账户状态。` | `ChatGPT Pro 5x 充值：价格、和 20x 与 Plus 的区别、能不能覆盖已有 Plus` | • `chatgpt pro 充值` 为 0，改用「价格 / 5x / 升级」<br>• **依赖**：正文要先补上 5x 与 20x 的 H2（D2，同一批） |
| claude-pro | 批 3（D1b） | `Claude Pro 国内怎么买：会员多少钱、iOS 订阅充值 - 贝果科技` | `Claude Pro 会员充值 ￥{p} 起，走 iOS 订阅充值，无需上号，卡密自助兑换，支付宝付款。含兑换前必须核对的两件事、封号了怎么办，以及封号不质保的明确边界。` | 维持 | • claude 会员 9、claude pro 国内 8、ios 订阅 claude 8<br>• 去掉初稿里的「Pro 升 Max 的做法」：「Pro 与 Max 怎么选」归 claude-max |
| claude-max | 批 3（D1b） | `Claude Max 充值价：5x ￥{p5}、20x ￥{p20}，和 Pro 怎么选 - 贝果科技`（主体约 25）<br>取不到任一价格时：`Claude Max 充值价格：5x 与 20x 多少钱、和 Pro 怎么选 - 贝果科技` | `Claude Max 会员充值：Max 5x ￥{p5}、Max 20x ￥{p20}（官方定价以 Anthropic 页面为准）。讲清 Pro、Max 5x、Max 20x 的额度差别，什么情况下该从 Pro 换到 Max，以及兑换前必须核对的四项账户状态。` | `Claude Max 充值：5x 与 20x 价格、和 Pro 怎么选、兑换前的四项检查` | • 价格进标题，参照竞品 dgtsell 的写法 [R3 §5.1]；写成「充值价」，避免被 AI 当成官方人民币定价<br>• 「Pro 与 Max 怎么选」的唯一承接页<br>• 现在 20x 有货（§28），H1 补上 20x |
| **claude-code（新）** | 批 3（D2） | `Claude Code 订阅：Pro 额度够用吗、Max 方案与价格 - 贝果科技` | `Claude Code 随 Claude Pro / Max 订阅提供（以 Anthropic 官方页面为准），Pro ￥{p} 起。讲清 Pro 的 Claude Code 额度够不够用、Max 各档方案，以及 API 按量付费和订阅的区别。支付宝付款，可开增值税发票（标价不含税，开票另付 6%）。` | `Claude Code 订阅：Pro 额度够不够用、Max 方案、API 与订阅的区别` | • [kw6] 充值 10、价格 9、订阅 9；`claude code pro` 按 R3 口径 3（额度、够用吗、价格）；`claude code 充值` 联想含「api 充值」<br>• 不写「用 Pro 还是 Max」，正文链到 claude-max<br>• 价格区只放摘要，链到 claude-pro、claude-max<br>• 「随 Pro / Max 提供」和各档额度，**动笔时对照 Anthropic 官方页面核实并外链** |
| codex-jiema | 批 3（D1b） | `Codex 接码：手机号验证收不到码怎么办、美区实体卡接码 - 贝果科技`（主体约 26） | 维持现有写法，价格实时取 | 维持 | • codex 接码 10、codex 手机号验证 6/6/9；这页已被收录，只做小幅调整<br>• 「实体卡」后面必须紧跟「接码」，单独出现读起来像在卖实体 SIM 卡 [R5 §3.2] |
| grok-super | 批 3（D1b） | `Grok 订阅：SuperGrok 会员多少钱、国内怎么开 - 贝果科技` | `xAI Grok 会员（SuperGrok）订阅：￥{p} 起，另有三个月档与 Super Heavy 档。卡密自助兑换，走 iOS 订阅充值，支付宝付款。含三档差别、兑换前必须确认的事与退款口径。` | `Grok 会员（SuperGrok）充值：三档怎么选、国内怎么付钱` | `grok super 充值` 为 1/1/1，换成 `grok 订阅` 10 |
| /products | 批 3（D1b） | `全部商品与价格 - 贝果科技` | `贝果科技全部在售商品与实时价格：ChatGPT、Claude、Grok 订阅充值，Codex 与 Claude 注册接码等。充值类为卡密自助兑换，仅支持支付宝；标价不含税，开票另付 6%。` | `全部在售商品与价格` | • 导航型目录，不抢 hub 和 chatgpt-plus 的主打词<br>• ItemList 保留 |
| claude-kyc、claude-zhuce、google-zhanghao | 不动 | 维持 | 维持（claude-kyc **不补**「实名认证」） | 维持 | • [R3] 判定用词正确<br>• claude-kyc、google-zhanghao 是 title 对照组（§7.6），整个测试窗口内完全不动<br>• claude-zhuce 没被 Google 收录，不作对照 |

**支柱二 AI 圈大事记**

| 页面 | title | description | H1 / 副标题 |
|---|---|---|---|
| /news | `今日 AI 热点：模型发布、产品更新与开源工具 - AI 圈大事记` | `按事件聚合的 AI 行业动态与每日 AI 资讯速览：OpenAI、Anthropic、Google 等的模型发布、产品更新、论文与开源工具。AI 依据公开信源整理摘要，每条附原文链接。` | H1：`AI 圈大事记`<br>副标题：`今日 AI 热点与行业动态` |
| /news/c/ai-models | `大模型最新发布与版本更新 - AI 圈大事记`；第 2 页起加「（第 N 页）」，其余分类同 | `大模型发布、版本更新与能力评测，按事件聚合，每条附原文链接。AI 依据公开信源整理摘要，请以原文为准。`；分页页同样加「第 N 页」 | `模型：大模型发布与版本更新` |
| /news/c/ai-products | `AI 产品更新与功能上线 - AI 圈大事记` | 同一结构 | `产品：AI 产品功能上线与定价变化` |
| /news/c/industry | `AI 公司动态：融资并购与生态合作 - AI 圈大事记` | 同一结构 | `行业：AI 公司动态` |
| /news/c/paper | `AI 论文与技术方法速览 - AI 圈大事记` | 同一结构 | `论文：AI 论文、技术方法与基准测试` |
| /news/c/tool | `AI 开源项目与开发者工具 - AI 圈大事记` | 同一结构 | `工具：开源项目与开发者工具` |
| /news/c/opinion | `AI 从业者公开观点 - AI 圈大事记` | 同一结构 | `观点：AI 从业者公开观点摘录` |
| /news/t/claude | `Claude 最新模型与更新日志 - AI 圈大事记` | `第三方整理：Anthropic Claude 的模型发布、版本更新与产品功能变化，按时间排列，附 Opus、Sonnet 当前版本速查（核对于 {date}）。AI 依据公开信源整理摘要，每条附原文链接。` | `Claude 最新动态：模型发布与更新日志`<br>下一行：「本页为第三方按公开信源整理，非 Anthropic 官方页面；官方更新日志见 [外链]」 |
| /news/t/openai | `OpenAI 最新发布与 ChatGPT 更新日志 - AI 圈大事记` | 同一结构，开头写「第三方整理」 | `OpenAI 与 ChatGPT 最新动态`，加同样的说明行 |
| /news/t/gemini | `Gemini 更新日志与 Google AI 最新发布 - AI 圈大事记` | 同一结构，开头写「第三方整理」 | `Gemini 与 Google AI 最新动态`，加同样的说明行 |
| 日报 | `AI 日报 2026-09-30：{首条的主实体 + 动作}等 {N} 条 - AI 圈大事记` | `2026年9月30日 AI 圈 {N} 条动态速览：{首条}；{次条}；{第三条}。AI 依据公开信源整理摘要，附原文链接。` | `2026年9月30日 AI 动态速览` |
| 周报 | `一周 AI 大事件 9.22–9.28：{首条的主实体 + 动作}等 {N} 条 - AI 圈大事记` | 同一结构 | `一周 AI 大事件 9.22–9.28` |
| 月度归档 | `2026年9月 AI 大事件盘点 - AI 圈大事记`（不分页） | `2026年9月 AI 行业动态盘点：本月 Top 10 与每周大事件，按天整理，每条附原文链接。` | `2026年9月 AI 大事件盘点` |

说明：
- **industry 分类不叫「行业动态」**：`ai行业动态` 联想为 0 [kw6]，改用「AI 公司动态」。「融资并购」是 SKILL §1.3 允许的选题。避开营收、估值这类财经口径。
- **opinion 不写「分析」**：《互联网新闻信息服务管理规定》第二条对新闻信息的定义包括「评论」；SKILL §1.3 允许的只是「从业者公开观点」，「分析」读起来像站方自己在评论。
- **话题页的「更新日志」**：这个词和官方 release notes 几乎同名，搜它的人会预期看到官方页面。所以 description 开头写「第三方整理」，H1 下写明非官方、外链官方更新日志，不用对方 logo 或近似配色（反不正当竞争法第七条、《网络反不正当竞争暂行规定》第七条）。
- **合规检查**：以上文案没有新闻、快讯、头条、要闻、突发、报道、独家、最、第一、权威、日报（H1 和面包屑里）。「最新」是描述时间，不是「最」字的最高级用法，§3.4 的 lint 会把它列入白名单。

**支柱三 短信接码**（全部在接码对全部用户开放之后生效；服务页过闸才建）

| 页面 | title | description | H1 |
|---|---|---|---|
| /jiema | `短信接码：海外手机号在线接收验证码 - 贝果科技`（只把「-」换成「：」） | `选服务、选国家/地区，用海外手机号在线接收短信验证码：{S} 个服务、{C} 个国家/地区可选，￥{min} 起，实时报价。{付款方式}付款，没收到短信整单退回站内余额，收码前可免费换号。`<br>`{付款方式}` 按 `canUseForJiema` 渲染为「支付宝或站内余额」，读不到配置时写「支付宝」 | `短信接码：海外手机号在线接收验证码` |
| /jiema/google | `谷歌注册需要手机号：用海外手机号接收 Google 验证码 - 贝果科技`（主体约 24） | `注册谷歌或 Gmail 要验证手机号、手边没有海外号码时：选国家/地区取一个海外手机号接收 Google 验证码，￥{min} 起，实时报价；号码能否通过验证由 Google 决定。没收到短信整单退回站内余额；仅限本人账号的合法验证。` | `注册谷歌需要手机号：用海外手机号接收 Google 验证码` |
| /jiema/openai（先核实） | `ChatGPT 注册需要手机号吗：海外手机号接收 OpenAI 验证码 - 贝果科技`（主体约 26） | `ChatGPT 和 OpenAI 平台什么时候会要求验证手机号（以 OpenAI 官方帮助页为准），手边没有海外号码时怎么接收验证码：各国家/地区实时报价，￥{min} 起。没收到短信整单退回站内余额；仅限本人账号的合法验证。` | `ChatGPT 注册需要手机号吗：什么时候要验证、怎么接收 OpenAI 验证码` |
| /jiema/whatsapp（候选） | `WhatsApp 注册收不到验证码：海外手机号接收验证码 - 贝果科技` | `WhatsApp 注册时收不到短信验证码的常见原因与排查顺序，以及手边没有海外号码时怎么接收：各国家/地区实时报价，￥{min} 起；号码能否通过由 WhatsApp 决定。没收到短信整单退回站内余额；仅限本人账号的合法注册验证。` | `WhatsApp 注册收不到验证码：用海外手机号接收 WhatsApp 验证码` |
| /jiema/terms | 维持 `短信接码服务条款 - 贝果科技` | 维持 | 维持 |

说明：
- **/jiema/openai 的前提要先核实**：kw6 里「chatgpt 注册」的联想同时有「不需要手机号了」和「需要手机号吗」，所以 title 用问句、正文如实作答。2026-09-30 检索 help.openai.com 的结果摘要显示：手机验证文档主要针对**首次生成 API key**；「仅手机号注册」只在美国、英国、日本、印度等部分国家作为可选方式推出。帮助页正文直接抓取返回 403，没能逐字核对。**动笔前由实现会话在浏览器里打开官方帮助页核实，并外链到它们**。核实下来如果 ChatGPT 注册基本不要手机号、真实需求主要来自 API 平台和 Codex，就**不建** /jiema/openai，改在 codex-jiema 里加一节「按国家/地区选号接收 OpenAI 验证码」，避免同一意图两页。
- **description 不写 Codex**：「codex 接码」归 codex-jiema（§0.3 #11），服务页正文里用一句「Codex 登录验证见 Codex 接码」链过去。
- **合规检查**：
  - 没有接码平台、批量、API、租号、匿名、成功率、100%、秒收、全额退款、HeroSMS。
  - 写到「退」的地方都写明了退到哪里（D3、D4）。
  - 没有出现国内平台名（Q6）。
  - 接码价格只进 description，不进 title；description 不写日期。
  - 不原样引用平台的拒绝提示（「此电话号码无法用于进行验证」「验证次数过多」），不承诺能解决报错：页面主张「能解决这个报错」，既像在教人绕过平台风控或频控（条款第二节第（六）项、第三节第 2 条），也和条款「不对号码适用于任何特定用途作出承诺」冲突。
- **写服务页正文的注意点**：
  - 说明平台拒收号码的原因时，只写现象和常规排查（用本人的常用号码、稍后再试），**不写「换号码类型」**（本站不能指定号码类型，D26），**不写「绕过 / 过风控」**，不承诺一定成功。
  - 本站的号码作为「手边没有海外号码时的选项」出现。

### 3.4 文案 lint：自动检查 title、H1、description

新增 `scripts/check-seo-copy.ts`，逐项断言。

**0. 运行方式**
- 支持 `--base https://bigolab.com`：上线后对线上只读抓取，**这是正式验收**。本地种子库的商品名、新闻数据和线上不同，本地跑的结论只作开发参考。
- 仿照 `check-tenant-boundary.mjs` 的 EXCEPTIONS 机制，维护一份「已知违规基线」（例如首页、hub、chatgpt-plus、claude-pro、grok-super 的 title 现在就有「代充」，要到 P1、P2 才改）。**每个包只要求不新增违规，并清掉属于本包的基线条目**；不要求 P0 的包一次清零。

**1. 结构断言**
- `<title>` 只有 1 个；robots 类 meta（`robots` 和 `googlebot`）的组合不含 index 与 noindex 同时出现的情况，404 页除外（§6.8 记为已知）
- canonical 存在，且指向页面自身的干净 URL
- og:title 和 `<title>` 的主干一致
- og:site_name 和 og:locale 都存在
- H1 只有 1 个，并且非空
- 首页服务端 HTML 里没有「加载中」
- title、description 全站唯一；分页页带「第 N 页」

**2. 禁用词（按路由分组）**：出现在该组页面的 title、H1、description 任意一处即失败

| 词组 | 适用范围 | 禁用词 |
|---|---|---|
| 零需求词与自称 | 全站 | 代开、代购、代订阅、AI会员代充、AI 会员代充、AI代充 |
| 冒充官方 | 全站 | 官网、官方渠道、官方直充、官方授权、官方认证、官方合作伙伴、官方旗舰、授权经销商、合作伙伴、代理商、经销商、正版、正版授权、旗舰、中文版、国内版、镜像 |
| 跨境访问 | 全站 | 翻墙、梯子、VPN、节点、机场、科学上网、免翻墙、国内直连 |
| 最高级与承诺 | **站点模板部分和商业页**（首页、/chongzhi*、/products*、/jiema*、/about、/support） | 最、最佳、最好、最低价、最便宜、全网最低、史上最低、第一、No.1、TOP1、首选、唯一、顶级、顶尖、极致、王牌、全球领先、100%、百分百、绝对、永久、万能、零风险、无风险、秒到、秒充、秒发、秒收、包过、必过、不封号、防封、保证可用 |
| KYC 与账号 | 全站 | 代实名、代刷脸、实名认证代办、代过、包过 KYC、借用身份、养号、老号、白号 |
| 新闻采编用语 | **大事记的站点模板部分**（分类、话题、日报周报月报的模板字、导语、面包屑）和全站导航 | 新闻、快讯、头条、要闻、突发、时事、早报、晚报、报道、首发、独家、爆料、记者、编辑部、本站原创、本网讯、资讯平台、资讯网 |
| 接码违规用语 | **只查 /jiema\***（充值页的 codex-jiema、claude-zhuce 也查，但「API」在充值页豁免，见下） | 批量、接码平台（title / H1 / description 里）、API、对接、多开、群控、猫池、卡商、协议号、注册机、租号、出租、卖号、养号、囤号、过风控、免实名、不用实名、代实名、绕过、匿名、不留记录、无法追踪、长期号、永久号、成功率、必收、包收、秒退、无限换号、全平台、免费接码、全额退款、原路退回 |
| 推荐与抽奖 | 全站 | 躺赚、稳赚、月入、必中、百分百中奖 |
| 上游与竞品品牌 | 全站 | HeroSMS、hero-sms、SMS-Activate、5sim、smspool |

- 「最」字白名单：「最新」「最近」。
- **LLM 生成的内容整体豁免失败判定**：/news/[slug] 的 title 和 H1（就是管线写的 headline）、日报 description 里的 digest intro、列表页里嵌入的事件标题。它们已经受管线 `score.ts` 的 `FORBIDDEN_WORDS` / `blocklistHit` 约束。lint 对它们只抽样告警、不判失败。
- **「API」在充值页豁免**：claude-code 需要「API 与订阅的区别」来区分两种付费方式（kw6：`claude code api 充值`）；只允许出现在「API 按量付费」「API 与订阅」这类说明语境里。

**3. 分区规则**
- 「代充」在 title 和 H1 里禁用，description 和正文里允许。
- /jiema* 的 title、description、URL 中，不得出现国内平台名，即 `services-cn.json` 里标注的国内服务。
- /jiema* 里「国家」后面必须跟「/地区」；「台湾 / 香港 / 澳门」前面必须有「中国」（D44）。
- 「实体卡」后面必须紧跟「接码 / 验证码 / 收码」。
- 大事记页面必须有 `ai-generated` meta；「广告 · 本站服务」区块不能出现在 Article JSON-LD 里。
- 凡是出现「开票」或「发票」：
  - 所有非 /jiema 页面，以及 JSON-LD 的 description，必须同时出现「6%」
  - /jiema* 必须是 D37 的原文，不得出现「可开票」「开发票」
- **链接断言**：
  - /jiema*、/news/[slug]、/news/t/* 的 HTML 里不得有指向 `/chongzhi/google-zhanghao`、`/chongzhi/claude-kyc` 的 `<a>`
  - 灰度配置下，全站公开页 HTML 里没有 `href="/jiema`；OPEN 配置下才有
  - 公开页 HTML 里 `svc=` 的值不能是上游代码形态（只允许 SEO 白名单里的本站 slug）
  - 首页和 /jiema 的服务端 HTML 里不出现 Telegram、国内实名类、金融 / 支付 / 加密货币服务名，不出现 +86
  - 大事记详情页里没有 `?n=` 链接

依据：[R5 §2、§3、§6]、SKILL §1.1。

---
## 4. 结构化数据与 GEO

### 4.1 各类页面的 JSON-LD（按 Google 2026-09 的现行支持情况）

通用规则：被 `@id` 引用的节点必须在同一页输出（§24 教训 #10）；`check-jsonld.ts` 加一条「页内没有悬空 `@id`」的断言。

| 页面 | 输出 | 不输出 | 备注 |
|---|---|---|---|
| 首页 | Organization（完整，见 4.2）+ WebSite | SearchAction | 站内搜索框的富结果已于 2024-11 下线 |
| /about | AboutPage（`about`、`mainEntity` 都用 `@id` 指向 ORG）+ Organization | — | — |
| /chongzhi 及子页 | BreadcrumbList + ItemList + FAQPage（维持）。**不新增 WebPage 节点**：给现有 FAQPage 加 `@id` = 页面 URL，把 `dateModified`、`lastReviewed`（取该页自己的 reviewedAt）、`publisher`（`@id` 指向 ORG）挂在它上面；同页输出 Organization | Product、HowTo、第二个页面实体 | FAQPage 本身是 WebPage 的子类型，同一 URL 出两个「页面」实体会让 dateModified 挂在哪个上面有歧义。开票问答只在 hub 的 FAQPage 里 |
| /products/[id] | Product/Offer + Organization + BreadcrumbList（维持，主站）；可选加 `hasMerchantReturnPolicy` | aggregateRating、Review；渠道站不输出 Product（现状） | 退货政策的文字必须和 /terms 一致 |
| /jiema | BreadcrumbList + FAQPage（只在 OPEN 时）+ **Service**（name、description、provider 用 `@id` 指向 ORG、url、serviceType「短信验证码接收」）+ **Organization** | Product、AggregateOffer、价格、国家列表 | 价格每小时都在变，不写进结构化数据 |
| /jiema/[service] | BreadcrumbList + Service + **Organization** | FAQPage、Product | 同上 |
| /news、分类、话题、归档、日报周报 | **CollectionPage + ItemList**（只放 url 和 name）+ BreadcrumbList | NewsMediaOrganization、Google News sitemap、LiveBlogPosting；「广告 · 本站服务」区块 | 合规要求 [R5 §1.3] |
| /news/[slug] | Article（维持：作者为 Organization，带 citation 和 disambiguatingDescription）+ **BreadcrumbList**；`publisher` 改用 `@id`，同页输出 Organization；dateModified 按 0.3 #15 取值 | NewsArticle 及其子类型、Person 作者、ClaimReview；「广告 · 本站服务」区块 | datePublished 建议改为 publishedAt，事件发生时间写进正文 [R1 §11] |
| /support | BreadcrumbList + FAQPage（接码那 13 条不并进来，P2） | — | — |
| 百度时间因子 | 可选：日报和详情页加 `pubDate` / `upDate` | — | P3 [R4 §1.3] |

### 4.2 Organization 与 WebSite 改写（`lib/seo/graph.ts`）

**description**（接码开放后）
> 贝果科技（bigolab.com）由益阳市赫山区必高科技有限公司运营，提供 ChatGPT Plus / Pro、Claude Pro / Max 等 AI 订阅充值（卡密自助兑换，支付宝付款，可开增值税发票，标价不含税、开票另付 6%）、短信接码（海外手机号在线接收验证码）与 AI 圈大事记（AI 行业动态聚合，AI 自动整理并附原文出处）。

灰度期去掉「短信接码（……）」一段。`graph.ts` 是渠道、主站共用的文件，按开放状态分支时同样只在主站读接码配置。

**slogan**
> AI 会员充值 · 短信接码 · AI 行业动态（灰度期：AI 会员充值 · AI 行业动态）

去掉「代充」。

**其他字段**
- `knowsAbout`：`['ChatGPT Plus','ChatGPT Pro','Claude Pro','Claude Max','Claude Code','SuperGrok','短信验证码接收','AI 行业动态']`（「短信验证码接收」按开放状态）
- `taxID`（统一社会信用代码）和 `address`：站长提供后再加，**必须与营业执照、发票一致**（§9 待决）。
- `sameAs`：**只填真实存在的公开主页**，例如公众号「贝果科技bigo」有公开 URL 才填；没有就不写。
- `contactPoint`：维持。
- WebSite：`name: 贝果科技`、`alternateName: ['BigoLab','bigolab.com']`，和 og:site_name 一致。

**文件约束**：经营主体名称的常量不要放进 `lib/legal.ts`。那个文件被营销模块引用（`PRIVACY_UPDATED_AT` 用于 `marketing_consent_logs`），属于共享文件。沿用 `graph.ts`，或新建 `lib/seo/entity.ts`。

### 4.3 GEO：让 ChatGPT、Perplexity、Copilot、AI Overviews 引用本站

原则：只做「真实、可核验、带日期」的内容。Google 2026-05-15 已把「操纵生成式 AI 回答」写进垃圾内容政策 [R4 §0]。

**1. 总结句 + 事实卡**

新增组件 `components/seo/fact-card.tsx`，服务端组件。非 AI 引用页放在 H1 和一句话答案之后；AI 引用页追加在现有段落之后（§1.4）。

事实卡上方先写**一句能单独成立、带主体和日期的总结句**，例如「截至 {该页 reviewedAt}，贝果科技（益阳市赫山区必高科技有限公司）在售 ChatGPT Plus 两个档位，支付宝付款，卡密自助兑换。」完整陈述句比「标签 : 值」的网格更容易被 AI 摘录。

每一格的数据都有唯一来源：

| 格 | 充值页 | 接码页 | 数据源 |
|---|---|---|---|
| 价格 | `￥{min} 起（实时价格，以下单页为准）`。以后后台保存商品时记下 `product_edited_<id>`，再补「价格更新于 {日期}」，用 `<time>` 标注、放在价格格子里 | `￥{min} 起，按服务和国家/地区实时报价`，用 `<time>` 标注目录同步时间（catalogSnapshot 的 `updatedAt`，`catalog.ts:789`），放在价格格子里 | `renderPriceTemplate` / `pricing.salePriceCents` |
| 交付 | 付款后自动发卡密 / 自动取号接码 / 人工办理 | 付款后自动取号，在号码页查看验证码 | 商品的交付类型（AUTO / SMS / MANUAL） |
| 付款 | 支付宝，登录后下单 | **支付宝或站内余额，登录后下单**（按 `canUseForJiema` 渲染；余额不够时差额走支付宝） | 代码行为（`purchase-modal.tsx`、`vmq.ts`；接码设计 §0 第 4 条、D2、D33） |
| 开票 | 可开增值税发票，标价不含税，开票另付 6% | D37 原文 | `lib/invoice.ts`、D37 |
| 售后 | 订阅期内非因你自身原因掉订阅，按剩余未使用天数折算退款；封号不质保 | 没收到短信整单退回站内余额（不可提现、不退回支付宝） | /terms、`lib/terms/jiema-*.ts` |
| 主体 | 益阳市赫山区必高科技有限公司 | 同左 | 同一个常量 |
| 核对 | 内容核对于 {该页 reviewedAt} | 条款版本 `{JIEMA_TERMS_VERSION}` | registry 每页一个 reviewedAt；常量 |

- 页面级日期只有「核对于 {reviewedAt}」这一个。价格格子里的时间是价格快照的真实时间，不放在署名位，不在 H1 附近放每天变化的日期。
- 商品详情页的事实卡不放价格（§3.2-D）。

效果预期写成方向性的：事实卡对应 GEO 论文里「加统计数字」「引用来源」这类做法，**预期有帮助**。论文的数字来自 GEO-bench 的模拟引擎，不能直接套到本站，所以这里不写百分比 [R4 §4.1]。

**2. 问答式段落**
- 新增的 H2 都用用户会问的原话，第一句能单独成立。例如：「国内怎么买 ChatGPT Plus？——在本站用支付宝买卡密，到订单里的兑换页自行提交充值（iOS 档需按商品说明提供登录凭据）。」
- **不能写成「到 chatgpt.com / claude.ai 上兑换」**：实际流程是在本站的兑换页提交卡密（`chongzhi/chatgpt-plus/page.tsx:87、99`），写成官方网站兑换，会让人以为卡密是官方兑换码，带有冒充官方渠道的意味。这类首句是为了让 AI 摘走的，错一个字就会被放大。
- 所有问答式首句都要对照 chongzhi/* 页面和商品说明逐字核对（D1a、D1b、D2、D3 的验收项）。
- 不需要把页面切成碎片 [R4 §4.1]。

**3. 引用官方来源**
- 官方价格、政策、Claude Code 的套餐范围、OpenAI 的手机验证规则，一律外链到 OpenAI / Anthropic 的官方页面，并写「以官方页面为准」。

**4. 同一事实只有一个出处**
- 全站同一个事实只从一个常量或函数渲染，这个原则写进 §8 各包的验收清单。开票口径只从 `lib/invoice.ts` 渲染，完整问答只在 hub。
- 反例：claude-max 的 FAQ 写错档位（§28）；隐私政策第一节写「下单时填写的邮箱」，和「下单不填邮箱」矛盾 [R5 §7-2]，由站长决定怎么改。

**5. 首页和 Organization 覆盖三条业务**
- ChatGPT-User 抓首页最多。首页服务端 HTML 里要能读到各业务的定义和关键事实（§1.10）；接码按开放状态。

**6. 可核验的新鲜度**
- 落地页上已有可见的核对日期，再在 FAQPage 节点上加 dateModified、lastReviewed（§4.1），都取该页自己的 reviewedAt。
- 大事记的 dateModified 不再用 updatedAt（附录 B-2）。

**7. 爬虫放行**
- 维持主站对 OAI-SearchBot、ChatGPT-User、GPTBot、ClaudeBot、PerplexityBot 全部放行。
- 不给它们单列 robots 分组（附录 B-4）。

**8. 反馈回路的主次**
- **第一指标**：新页或改过的页上线后，用 nginx 日志确认 OAI-SearchBot 和 ChatGPT-User 有没有来抓。被 ChatGPT 引用的 chatgpt-plus 在 Google 和 Bing 都没被收录 [R2 §4]，引用实际来自 OpenAI 自己的抓取（§28：OAI-SearchBot 347 次）。
- **辅助**：ChatGPT 搜索的数据来源里也点名了 Bing [R4 §4.1]，所以 IndexNow 推商业页的变更（§6.4），开通 Bing AI Performance 报告（§6.5）。

**9. llms.txt**
- 可选的 P3。只列事实和核心 URL，措辞和 /terms、/about 一字不差，不写营销话术。
- 预期没有排名收益，主要给编程类智能体读。

**不做的事**
- 「2026 最好的 10 个充值平台」这类把自己排第一的榜单
- 到知乎、贴吧刷「贝果科技靠谱」
- 写给 AI 看的隐藏文字
- 编造评分、用户数、成交动态
- 批量问答页

### 4.4 反馈回路：每月一次，写进月报

1. **nginx 日志**（第一指标）：按爬虫 UA 和路径分组，§28 的做法；重点看新页、改过的页有没有被 OAI-SearchBot、ChatGPT-User 抓到。⚠️ 不要跑 `docker system df`（记忆和交接文档第六节）。
2. **站内 PageView**：`source='ai'`，按 engine 和落地页交叉统计。AI 引用页两步走的放行判断看它。
3. **Bing AI Performance**：哪些页被引用、对应哪些 grounding queries。被引用最多的页，把它的结构复制到别的页。
4. **GSC 效果报告**（AI 功能带来的流量计入「网页」类型）；如果 GSC 提供生成式 AI 报告，也一并看。
5. **手测 10 问**（§0.4）。

---

## 5. 内容计划

### 5.1 谁来生产

| 角色 | 负责 |
|---|---|
| 站长 | 事实核对：价格、档位、条款、营业执照、开票；后台商品名和描述；在 GSC、Bing、Cloudflare 上的操作；本文 §9 的待决事项 |
| Claude 实现会话 | **起草**：按代码核对后写正文（§24-8-② 的教训）；服务页正文；话题页导语和速查块；落地页的月度核对 |
| 人工核对 | 上面由 Claude 起草的正文，逐条对照代码或官方来源核对，记录 reviewedAt。页面上如实写「AI 起草、人工逐条核对（核对于 {reviewedAt}）」，**不写「人工撰写」**；话题页导语纳入该页的 AI 标识范围，署名仍为 Organization（SKILL §6、《人工智能生成合成内容标识办法》） |
| 大事记管线（自动） | 事件；日报、周报；分类页和话题页的事件列表；月度盘点的 Top 10；IndexNow 推送 |

### 5.2 支柱一：AI 会员充值

| 内容 | 页面 | 时间 | 约束 |
|---|---|---|---|
| title 和 description 换词（§3.3） | 非 AI 引用页：chatgpt-pro、claude-pro、claude-max、codex-jiema、grok-super、/products（D1b）<br>AI 引用页：/chongzhi、chatgpt-plus（第一步） | 构建批 3（10-29 或之后），记下日期 | 只改 title、description、个别 H1（AI 引用页 H1 不动）；改之前存 HTML 快照；和 C、G 错开 ≥2 周；对照组 claude-kyc、google-zhanghao 不动 |
| 事实卡、跨支柱链接 | 非 AI 引用页（对照组除外） | 构建批 2（D1a） | 开票口径只从 `lib/invoice.ts` 渲染；**不新增开票 FAQ**（hub 已有完整一份）；接码链接按开放状态 |
| AI 引用页的追加区块 | /chongzhi、chatgpt-plus | 构建批 4（第一步上线 2–4 周后） | 事实卡、新 H2 一律追加在现有段落之后 |
| 新增 H2 | • chatgpt-plus（第二步追加）：「Plus 里的 Codex 额度」<br>• chatgpt-pro：「5x 与 20x 的区别」「Plus 升级 Pro 要补差价吗」<br>• claude-pro：「礼品卡和卡密有什么不同」「封号了怎么办、能不能申诉」（中性信息，不带 KYC 代办的 CTA）<br>• hub（第二步追加）：ChatGPT 还是 Claude、拼车与独享、视 SERP 补「各区官方价参考」；「怎么分辨卖家」「能开发票吗」已存在，只补段落 | 批 3–批 4 | 每句都要对照代码或官方来源。claude-kyc **不加** H2。「GPT Plus 与 ChatGPT 会员是一回事吗」等站长对 §9.4 #19 拍板后再定 |
| claude-pro、claude-max 复制 chatgpt-plus 的结构 | 2 页 | 构建批 3（D2） | §28 已批准 |
| **claude-code 新页** | 1 页 | 构建批 3（D2） | 按信息检查清单（§3.1）：本页独有数据点 ≥5 个、每一步对应到代码、Claude Code 的套餐范围和用量对照官方页面并外链；价格区只放摘要，链到 claude-pro、claude-max；LANDINGS 末尾、`ownsProducts: false` |
| 「新模型发布，国内怎么用」这类桥接内容 | **不新建 URL**，写进相关落地页的「近期变化」一节（带日期，AI 起草、人工核对；AI 引用页只能追加在现有段落之后） | 每周 ≤2 条 | 避免追热点的薄页 [R4 §1.2]；遵守一个意图一个页 |
| 月度核对 | 11 页 | 每月第一个工作日 | 真的核对过哪一页，才改**哪一页**的 reviewedAt（registry 每页一个；`LANDING_REVIEWED_AT` 拆开，§8.2 D1a）；hub 取子页里最新的那个 |

### 5.3 支柱二：AI 圈大事记（能否交给管线，按 SKILL.md 判断）

| 内容 | 能不能交给管线 | 理由和约束 |
|---|---|---|
| 事件、日报、周报 | 能，现状就是 | 维持 SKILL 的全部约束 |
| 分类页、话题页的列表，分页 | 能：纯查询，不经过 LLM | 只列可索引事件；新页面必须带 6 处 AI 标识中适用于页面的部分：meta，以及列表卡片上的徽章 |
| 日报、周报的 SEO 标题 | 能：确定性拼接，取首条 headline「：」或「，」之前的部分，按词界截断 | 不改 `buildDigest`，在 `generateMetadata` 里计算 |
| 月度盘点 | 能：Top 10 按 baseScore，按天分组的列表，导语用确定性文案 | 不新增 digest 类型，避免改表结构 |
| **话题页的导语和「当前版本速查」** | **不能交给管线** | 这是整站最「不像大路货」的内容。由实现会话 AI 起草、人按官方来源逐条核对。管线的导语只允许依据标题写 80 字，不适合常青内容。放在 `lib/news/topics.ts` 常量里，带 reviewedAt，每月核对 |
| 选题相关性 | **先排查，再针对性修** | 分诊已经输出 `isAiRelated`，判为 false 的直接 SKIP（`pipeline.ts:617、778`；SKILL §3.2）。离题样例「国庆自驾攻略：人工定主线再用 Agent 微调」能通过，是因为它被判成了「和 AI 相关」的使用心得。做法见 §8.2 E1：查出这条事件的 items 来源和 triage 记录，确认是哪一步放进来的：全仓唯一把条目写成 `OK` 的是分诊结果（`pipeline.ts:778、786`），所以要么是分诊模型把它判成了相关（SKILL §1.3 允许「开发者实践与教程」，个人使用心得容易被当成这一类），要么是聚类阶段（`pipeline.ts:929-974` 按 `triageState='OK'` 取条目、按实体交集召回）把它并进了别的事件，也可能来自线索源的正文抓取。如果是分诊的问题，就收紧分诊提示词里对「AI 行业动态」的定义：个人使用心得、生活类应用案例不算，加入反例样本。属于 SKILL §10 以外的常规迭代；黑名单不放宽 |
| 日报导语 | 能，现状 | 维持「只依据标题」的约束 |

**频率**：每小时聚合（现状）、每天 21:00 日报、每周一 09:00 周报。话题页每月人工核对一次。

**不做**：
- 「大模型排行榜」：需要站长决定数据来源和授权
- 财经类话题
- 任何黑名单选题
- 评论和 AI 问答入口

### 5.4 支柱三：短信接码

以下都在接码对全部用户开放之后（J 日起）做，由接码会话负责。

| 内容 | 页面 | 时间 | 约束 |
|---|---|---|---|
| hub 正文，600–1000 字 | /jiema | 随「开放全部用户」那次发（F1） | 每句对照 `lib/jiema/*` 的行为和条款；地区命名按 D44；不写成功率；号码类型只写「本站不区分、不能指定」 |
| 服务页第 1 批：从 google、openai、whatsapp、instagram 里按内部数据挑达标的前 3 个 | ≤3 页 | J+1 周以后，且 ≥10-22 | §1.7 的闸门；按信息检查清单（§3.1）；openai 先核实官方帮助页 |
| 服务页第 2 批：其余候选，再从 amazon、outlook、line、discord 里按第 1 批的 GSC 数据和内部数据挑 | ≤5 页 | 第 1 批上线满 2 周后 | 同上 |
| 「收不到验证码怎么办」通用排查 | 写进 /jiema 的 FAQ 和 /support#jiema，不单独建页 | 随 F1 | 只写「用本人常用号码、稍后再试、收码前可换号」这类常规做法 |
| 月度核对 | 服务页 | 每月 | 真的核对过才改 reviewedAt |

### 5.5 站外

- **推广人定向招募教程和博客作者**（只推充值 SKU）。
  - 背景：「chatgpt plus 充值」「claude pro 充值」的 Google 前 10 被知乎、CSDN、掘金、GitHub 上的教程占住 [R3 §5.1]。
  - 给推广人一份**书面文案规范**：
    - 附 R5 §6 的禁用词表（官方渠道、最便宜、不封号、代开……）；
    - 文章里显著标注「广告」（广告法第四条：广告主对广告内容的真实性负责；《互联网广告管理办法》第九条：体验分享加购物链接要显著标明「广告」）；
    - 链接加 `rel="sponsored"`；
    - 推广范围只限充值 SKU，明确排除 /jiema、账号类商品和 KYC；
    - 约定违规撤稿、扣回返现。
  - **接码业务不参与这类招募**：第三方写出「接码平台 / 批量注册」这类教程，就构成反电诈法意义上的引流推广（接码条款第二节第（一）项也点了「引流推广」）。
  - 这是站外获客，不碰本站的排名风险。
- **公众号「贝果科技bigo」**：已有发文流水线，可以发 AI 大事记的周报摘要，链回 /news/digest/weekly。
  - 每篇推文文首、文末都写「AI 摘要，依据公开信源整理」（SKILL §6 要求导出和分享的内容同样带 AI 标识）；发布时在公众号后台**人工勾选** AI 生成标识（这个号的 AI 标识只能后台人工勾）。
  - 标题沿用「一周 AI 大事件」「AI 动态速览」，不得出现新闻、快讯、头条、突发。
  - 确认有公开主页 URL 后，把它加进 Organization 的 sameAs。
- **不做**：自己开 GitHub 仓库或站群刷教程；到社区批量发帖；买链接；大规模交换友链 [R4 §7]。

---
## 6. 技术 SEO

### 6.1 协议与主机名

- **现状**：`http://bigolab.com/*` 返回 200，不跳转；HSTS 只有 `max-age=300`。Google 和 Bing 都把 http、www 版本当成独立页面收录了 [R2 §4]。
- **做法**：
  1. Cloudflare 打开 **Always Use HTTPS**（站长操作）。
  2. 观察一周没有异常，把 `nginx.conf:279` 的 HSTS 调长（nginx 注释原计划 15552000，本文建议最终到 31536000）。暂不加 includeSubDomains 和 preload，理由沿用 nginx 里的注释。
     - 改 nginx.conf 之后要 `up -d --no-deps --force-recreate nginx`，reload 不够（`docker-compose.yml` 的 nginx 段注释、交接文档第二十三节）。和其他 nginx 改动攒到同一次，放在低峰时段。
  3. www 跳裸域的 301 维持不动。
- **验收**：`curl -I http://bigolab.com/chongzhi/chatgpt-plus` 返回 301，`Location` 是 https 的裸域地址。

### 6.2 sitemap 分段与 lastmod

**结构**：`/sitemap.xml` 保持同一个 URL，但内容改成 **sitemap index**。这样站长在 GSC、Bing、百度里已经提交过的地址不用变。index 下挂 6 个子文件：

| 子文件 | 内容 | 预计条数 |
|---|---|---|
| `/sitemaps/core.xml` | 首页、/about、/support、/terms、/privacy、/links、/iptools | 7 |
| `/sitemaps/chongzhi.xml` | hub 和子页 | 10–11 |
| `/sitemaps/products.xml` | 在售商品，上限 500 | 约 21 |
| `/sitemaps/jiema.xml` | /jiema、/jiema/terms、过闸的服务页；受 `jiemaPublicOpen` 控制，灰度期为空 | 0–22 |
| `/sitemaps/news-hub.xml` | /news、6 个分类页（只第 1 页）、过闸的话题页、最近 60 期日报周报、最近 24 个月归档 | 约 95 |
| `/sitemaps/news-events.xml` | 90 天内的非薄页事件，上限 2000，判定继续共用 `shouldNoindexEvent` | 约 465 |

**实现要点**
- Next 14.2 的 `generateSitemaps()` 不会自动生成 index，而且 `app/sitemap.ts` 和 `app/sitemap.xml/route.ts` 不能同时存在。做法：
  - 先抽出 **`src/lib/seo/sitemap-entries.ts`**：按分段返回条目数组（纯函数加查询），route handler 只负责序列化
  - 删掉 `app/sitemap.ts`
  - 新建 `app/sitemap.xml/route.ts`，输出 index
  - 新建 `app/sitemaps/[name]/route.ts`，按白名单名字输出各段的 urlset
- **两份现有测试直接 import `app/sitemap.ts`，改写是 G 包的必做项**，提前和渠道、接码两个会话约定：
  - `scripts/itest-tenant/wp1.ts:510`（W1-6：渠道 sitemap 为 []，主站与基线逐字相同）
  - `scripts/itest-jiema-catalog.ts:534`（灰度期 sitemap 里没有 /jiema）
  - 两份都改成调用 `sitemap-entries.ts`，原有断言（渠道为空、灰度期没有 /jiema、DB 挂掉时静态部分照出）原样保留。
  - 注意 W1-6 的「主站与基线逐字相同」拿的是 `git HEAD` 版本做基线（`wp1.ts:99-110`），是提交前的回归护栏：有意改动主站 sitemap、robots 输出时，提交前跑会报差异，要在提交后跑，或同步调整这条断言。
- **渠道站**：`/sitemap.xml` 维持输出空 urlset（或直接 404），**不输出空的 `<sitemapindex>`**：按 sitemaps.org 的 XSD，没有子项的 sitemapindex 不合法。子文件返回 404。
- 两个 route 都显式写 `export const dynamic = 'force-dynamic'` 并调用 `getStorefront()`（不包进 try），否则会被构建期预渲染，触发 Dockerfile 的 `PRERENDER_STRICT` 硬闸（`Dockerfile:57-58`）。
- 手写 XML 要转义 `& < > " '`；验收加一步 `xmllint --noout` 校验。
- 现有文件里的这些规则**原样搬过去**：数据库不可达时静态部分照常输出、`RECENT_DAYS`、`MAX_EVENTS`、薄页过滤。
- **不用** `<news:news>` 扩展，也不把任何一段命名为 news sitemap：那等于自证是新闻站 [R5 §1.3]。

**lastmod 只写真实值**，取值规则见 §1.3。有四处要改：
1. **新闻事件**：改为 `max(publishedAt, reviewedAt)`，不再用 updatedAt（附录 B-2）。局限：补齐全文层不体现在 lastmod 上（NewsEvent 没有记录这个时间的字段，本方案不改表结构），对 Bing 靠 §6.4 的补推兜底，对 Google 靠新的站内抓取通道。
2. **落地页**：用**该页自己的** reviewedAt（registry 每页一个），hub 取子页里最新的那个。
3. **商品页**：**不写**。`Product.updatedAt` 每笔付款都会刷新（`vmq.ts:1588`、`admin/orders/[id]/route.ts:524、743`）。以后后台保存商品时另记 `Setting` 的 `product_edited_<id>`，再改用它。
4. **条款**：用版本日期常量。

`changefreq` 和 `priority` Google 会忽略，可以留着，也可以删掉。

**移出 sitemap**：/games、/forum。

**提交**：
- GSC 里提交 index，**6 个子文件也逐个提交**，这样「网页」报告能按业务线分别看收录情况。
- Bing 同样处理。
- robots.txt 的 `Sitemap:` 行不变。

### 6.3 robots

- **维持现状**：`/api/`、带 token 的路径、`/lookup`、`/*?s=`、`/*?n=` 继续 Disallow；私密页只靠 noindex,follow，不加 Disallow（§24-8-③）。
- **唯一的新增**：主站 `*` 组加 `Allow: /lookup$`。无参的 /lookup 可以抓、读得到它的 noindex；带邮箱或 token 的查询形态（`/lookup?…`、`/lookup/…`）仍然只匹配 `Disallow: /lookup`，继续挡住。Google 和 Bing 都支持 `$` 结尾匹配、按最长规则取胜。
- **不新增**：不给 AI 爬虫单列分组（附录 B-4）。`?page=`、`?svc=` 不加 Disallow：前者要被收录；后者 canonical 已经指回 `/jiema`，爬虫读得到 canonical 才能正确归并。
- 渠道站的 robots 分支完全不动 [R5 §5]。`robots.ts` 依靠 `getStorefront()` 转成动态，不能包进 try。改完跑 itest-tenant（注意 W1-6 基线的说明，§6.2）。

### 6.4 IndexNow 与百度推送

`lib/indexnow.ts` 保留现有的 8 秒超时、只推同 host、每批 ≤100 条。

**IndexNow（Bing、Yandex 等；Google 不支持）**

1. **过滤薄页**：`pipeline.ts:1576` 的 `publishedSlugs` 先用 `shouldNoindexEvent(parseDetail(detail))` 过滤一遍，再推送。
2. **补推**：薄页后来补齐了全文层、变成可索引时，在写入全文层的那一步补推一次（lastmod 不会变，靠这一步让 Bing 重抓）。
3. **商业页触发点**：

| 触发事件 | 推送的 URL |
|---|---|
| 后台保存商品（改价、改名、改描述、上下架） | `/products/[id]` 和它的主落地页。**只挂在后台保存上，成交不触发**；同一步写 `product_edited_<id>` 和调用 `clearStorefrontCache` |
| 接码开放状态变化 | `/jiema`、`/jiema/terms` |
| 服务页上线或下线（闸门状态变化） | 对应的服务页 |
| 落地页核对日期变更 | 改了日期的那几页，部署后执行一次脚本 |
| 大事记新增分类页、话题页过闸 | 在 cron 里推 |

4. **一次性清理**：把 Bing 里的旧快照 URL 推一遍，促使 Bing 重抓后读到 noindex、404 或 301（§1.11）。包括 /login、/register、/forgot-password、/lookup、/products/11、13、22，以及 http 版本的 /about、/support、/products。

**百度（低优先，只做零成本的事）**
- `scripts/baidu-push.ts` 的优先清单里，在落地页之后加上 `/jiema` 和已上线的服务页（接码开放之后）。
- 每天 10 条配额，继续只给商业页用。
- 新闻交给 sitemap。
- 未备案，不宣称已备案（§28）。

### 6.5 Search Console、Bing Webmaster、Cloudflare：需要站长做的步骤

以下都是站长在后台的操作，Claude 做不了。

**Google Search Console**
1. **添加「网域」资源 `bigolab.com`**，用 Cloudflare DNS 的 TXT 记录验证。网域资源一次覆盖 http、https、www，不需要改代码或重新部署。已经用 meta 标签验证过的「网址前缀」资源可以保留。
2. 提交 `https://bigolab.com/sitemap.xml`。§6.2 上线后，再逐个提交 6 个子文件。
3. 用网址检查对以下页面「请求编入索引」，每天有配额限制，分两天做：
   - 第一天：/、/chongzhi、chatgpt-plus、chatgpt-pro、claude-pro、claude-max、claude-zhuce、/news、/about
   - 第二天：其余落地页
   - /jiema 等接码开放那天再请求
4. **记录基线**，截图或导出保存，这是 §0.4 各项 KPI 的起点：
   - 「网页」报告里的已编入数，以及未编入的原因分布，重点看「已抓取 - 尚未编入索引」和「已发现 - 尚未编入索引」
   - 效果报告近 28 天的数据，以及 §0.4 那 20 个查询串的展示和排名
   - 设置 → 抓取统计信息
5. 以后每周看一次，每月导出一次，写进月报。

**Bing Webmaster Tools**
1. 验证。仓库里已有 `BING_SITE_VERIFICATION`，也可以直接从 GSC 导入。
2. 提交 sitemap。确认 IndexNow 的密钥 `/indexnow-key.txt` 能访问。
3. **开通 AI Performance 报告**，P0 第一周就开始记，满 4 周（10-29）定基线。
4. 「Block URLs」里临时屏蔽 `/lookup` 只作过渡（约 90 天到期）；长期靠 A 包的 `Allow: /lookup$` 让 Bing 读到 noindex。旧快照可以按需用「内容删除」处理。

**Cloudflare**
1. SSL/TLS → Edge Certificates → **Always Use HTTPS 打开**。
2. 一周后告诉实现会话，把 HSTS 调长（和其他 nginx 改动一起 recreate）。
3. 边缘缓存规则放到 P3，E1 上线满 2 周、看过抓取统计和服务器负载后再评估，按 §6.6-8 第二步的条件配置。

**需要站长提供的信息**
- 统一社会信用代码：用于 Organization 的 taxID 和页脚执照信息
- 公众号或其他公开主页的 URL：用于 sameAs
- 已下架商品 11、13、22 分别对应哪条产品线：用于 301

### 6.6 性能：Core Web Vitals、INP、渲染与缓存

**先看现状** [R2 §3]：PSI 移动端性能 89–91，CLS 为 0，TBT ≤20ms，LCP 3.2–3.5s，没有 CrUX 真实用户数据。
- 从 Google 机房测，TTFB 约 200ms，瓶颈在客户端。
- 但目标用户在大陆：R1 §13 从国内经代理实测，页面 TTFB 1.64–1.73s、偶尔 2.8–3.1s，回源渲染比缓存命中多 0.5–2s；这台 1.8G 机器 09-16 到 09-21 已经 OOM 9 次（§28）。**缓存的决策以国内实测为准**。

按优先级：

1. **下线左下角成交弹窗（B 包，P0）**
   - `live-order-notification.tsx` 删掉 `LiveOrderNotificationInner`、`FALLBACK_ORDERS`、`getRelativeTime`，组件恒返回 null；保留导出，兼容 `(shop)/layout.tsx` 的挂载点和 `wp1.ts:616、659` 的 import。
   - `api/orders/recent/route.ts` 删掉 `FAKE_CITIES` 和 `city` 字段（`itest-security.ts:276-278` 的「不含 createdAt、id 为序号」断言不受影响）。
   - **不改 `lib/storefront/public.ts` 的 `liveOrders` 开关**：`check-tenant-math.ts:296` 断言「PLATFORM 全开」，改开关会让它失败；也不改 `(shop)/layout.tsx`（营销会话的文件）。挂载点以后和营销会话一起清理。
   - 它也是 framer-motion 留在全站共享包里的原因之一。
   - **B 包遗留（B 包评审后记录，待清理；和挂载点、`features.liveOrders` 一起做，先和营销、渠道、接码会话约定）**：
     - **`/api/orders/recent` 仍公开脱敏买家信息**：弹窗下线后它已没有任何前台调用方，却仍对任何人返回本店最近 20 笔成交（脱敏昵称或邮箱、商品名、成交价；主站和渠道 Host 各返回本店数据，route 里没有 `denyOnChannel`）。已没有业务目的，不符合个人信息保护法的最小必要原则（第 6 条；公开处理个人信息另需单独同意，第 25 条）。清理方式：生产环境返回空数组，或只在测试环境响应；同时调整依赖它的断言 `itest-security.ts:276-280`、`itest-tenant/wp2.ts:826`、`itest-tenant/cross-tenant.ts:864`、`itest-wallet-b1-http.ts:194`。route 文件头已写明。
     - `lib/floating-widgets.ts`（接码会话的文件）的 `hideLiveOrdersOn` 已没有运行时调用方，只剩 `check-jiema-s2b.ts:167` 断言它；文件头注释仍按「弹窗在线」写让位理由。清理挂载点时连同 s2b 那条断言一起删。
     - `(shop)/layout.tsx:69`（营销会话的文件）公告挂载点的注释「买家进入前台任意页面即弹窗展示」已过时（公告已改底部提示条）。
2. **公告弹窗改成底部提示条（B 包，P0）**
   - `fixed` 在页面底部、可关闭，只显示公告标题和「查看详情」；点开再用现有弹层展示全文（公告正文最长 5000 字，`lib/announcement.ts:12`）。关闭状态沿用 `announce_seen_*` 这个 localStorage 键。
   - 放底部没有布局偏移，也不用改 layout：放顶部要么压在固定页头上，要么在客户端拉取之后改 `--header-h` 把内容推下去，CLS 会从 0 变差。
   - `pinned` 的强提醒也只以提示条形式出现。
   - 只改 `components/announcement-modal.tsx` 和 `lib/announcement.ts` 的展示逻辑，**不改 `(shop)/layout.tsx`**：那个文件挂着营销模块的 MailLanding。
   - 和右下角的 FloatingContact、/jiema 的底部结算栏避让：提示条出现时用 CSS 变量把 FloatingContact 往上抬；/jiema* 页面上提示条让位（沿用 `lib/floating-widgets.ts` 的做法）。
   - 公告文案里「所有商品均有货」这类绝对化表述，请站长在后台改掉 [R2 §5 P0-1]。
3. **首帧可见**：
   - 首页 `home-client.tsx:149-153` 的 `initial={{opacity:0}}` 改成 `initial={false}`，或者只做位移动画。副标题和按钮同样处理 [R1 §16]。
   - header 的 `initial={{ y: -100 }}`（`header.tsx:135`）同样改成 `initial={false}`：现在 SSR 首帧页头在屏幕外。
   - **首页打字机占位（B 包评审修复）**：hero 是 `min-h-screen` + 垂直居中，副标题里的打字机在手机上随短语折成 1 行或 2 行（375 宽实测副标题 84↔112px），每换一句 H1（LCP 元素）、按钮、查询框、卖点整体上下跳约 13px。实验室 PSI 通常在第一次换句（2.5s）前就结束，看不到；真实用户的 CLS（CrUX）会一直记。已改为打字机那一行按「前缀 + 最长短语」占位（单格 grid + `::before{content:attr(data-reserve)}`，副本不进正文文本），320 / 375 / 768 / 1366 宽走完一整轮 H1 位置不变。评审另报的「约 1.1s 时 hero 容器 0.019 的偏移」来自后台标签页 + dev 模式，本地未复现（后台标签页不产生 layout-shift 记录），上线后看 PSI 与 CrUX 的 CLS。
   - **/support、/iptools、/links 还没做（B 包评审遗留，归 C 包）**：这三页 index,follow，服务端 HTML 仍有 framer-motion 的 `initial` opacity:0（本地 dev：/support 23 处、/iptools 19 处、/links 2 处），/support 的 H1「购买之后，我们继续陪伴」本身就包在 `style="opacity:0;transform:translateY(20px)"` 里，违反 §3.1「H1 服务端直出、首帧可见」，慢设备上 LCP 要等水合。做法同首页：挂载即播的改 `initial={false}`（或只留位移），`whileInView` 的只留位移、不从透明开始。`check-seo-b.ts --base` 现对这三页告警并注明归属（`FIRST_FRAME_PENDING`），C 包改完把它们挪进 `FIRST_FRAME_STRICT` 变成失败。
4. **图片**：
   - `gen-brand-assets.py` 额外输出 WebP。header 用 80×80（约 3KB），页脚用 256px 高（约 20KB），并加 `loading="lazy" decoding="async"`，这样 React 就不再把它们自动 preload 到每一页。
   - **新闻详情页**：R2 列出的 LCP 成因是图片 267KiB、宽高比不对 [R2 §3]。改成 WebP，写对 width 和 height；正文里的分类图如果是 LCP 元素，就加 `fetchpriority="high"`，或者挪出首屏。
     - **B 包实际做法（与上句不同）**：这张分类图不是 LCP 元素，是隐形的微信分享缩略图（`news/[slug]/page.tsx` 的 `news-wx-thumb`）。只加了 `object-cover`（修「宽高比不对」：preflight 的 `max-width:100%` 把它压成 375×315）和 `fetchPriority="low"`（去掉它的 preload），**格式保持 PNG**：它唯一的用途是微信缩略图，微信对 WebP 缩略图的支持没有实测。所以每篇详情页仍会下载这张约 73–83KB 的 PNG。
     - 「267KiB 的大头是两张 PNG 站标」目前只是估计，没有改后的 PSI 实测。**上线后**对同一篇详情页跑 PSI：「图片传送」里如果这张图仍列着约 80KB，再决定是否实测微信对 WebP 缩略图的支持（实测可行再换 WebP）。本地库没有已发布的大事记，本地验收渲染不到这张图。
   - 静态资源的缓存由 4 小时改为带版本号 + 1 年 immutable [R1 §14][R2 §5 P1-13]。
5. **framer-motion**：全站挂载、引用了它的组件有 header（`motion.header` 本身，不只是移动菜单）、announcement-modal、floating-contact、contact-modal（页脚和 floating-contact 都用它）、live-order-notification。只改其中一个，共享包的体积不会变。
   - 要做就这几个一起改成 CSS 过渡或 `dynamic()` 懒加载（live-order-notification 随第 1 项下线，announcement-modal 本来就在 B 包里）。
   - 验收用 bundle analyzer 的前后对比，**在内存充足的非生产机上跑，不要在 1.8G 的生产机上跑** [R1 §16]。
   - 如果 B 包做不完，就把这一项整体挪出 B、C 包，不写进它们的验收。
   - 页脚**维持客户端组件**（§1.9）。
6. **/jiema 的 INP**（接码会话在 F1 里做）：
   - hot 以外的服务改为懒加载，地址栏里预选的服务在服务端直出；搜索框加防抖或 `useTransition`。
   - `RowList` 已经是虚拟列表（`jiema-client.tsx:150`，超过 60 行虚拟滚动），不用再做。
   - 触控目标 ≥44px（PSI 点名过）。
7. **阻塞渲染的 CSS**（440–540ms）：优先级 P3。bundle analyzer 看完之后，再评估 `experimental.optimizeCss`。现在不动。
8. **缓存**
   - **第一步 Ha（P1，E1 的前置条件）**：数据层用仓库**唯一允许**的 `storefrontCached(name, (sfId, ...args) => ..., ttlMs)`（`src/lib/storefront/cache.ts`）。
     - `unstable_cache` 和 `export const revalidate` 都被边界检查规则 9 禁止（`check-tenant-boundary.mjs:611-613`），它挂在 prebuild 上，Dockerfile 的 `npm run build` 会直接失败。禁止的原因是多店面下缓存键漏掉店面就会串店（渠道站读到主站价）。
     - 覆盖：落地页商品快照、首页新增的服务端区块、/news 的总数、月份列表、日报列表、分类列表、接码「中位到码时长」统计。TTL 30–60 秒。
     - 后台改价、上下架时调用 `clearStorefrontCache('landing-products')` 这类按名清理，不用 tag 失效。
     - 渠道站 DRAFT 店面带 `previewUserId` 的查询不进缓存。
     - 库挂掉时的降级路径不变。
   - **第二步 Hb（P3，E1 上线满 2 周后评估）**：只用 **Cloudflare Cache Rules**，**不改 nginx**。
     - 不改 nginx 的原因：`nginx.conf:285` 的注释写明，`location /` 下的嵌套 location 只要写一条 `add_header` 或 `proxy_set_header`，就不再继承上层配置，x-middleware-subrequest 清洗（CVE-2025-29927）、访客 IP 头覆盖、渠道站 X-Robots-Tag 会一起失效。
     - 规则条件：`http.host eq "bigolab.com"`（`*.bigolab.com` 已经指向渠道站，必须限定主机名）；路径白名单，先只开 `/news/*`，观察一周再考虑 `/chongzhi/*`；请求头里没有 `RSC`、`Next-Router-State-Tree`；没有登录 token cookie、推广码相关 cookie、`Authorization`。
     - 缓存键保留**完整查询串**：App Router 客户端导航用同一个 URL 加 `?_rsc=` 请求 RSC 负载，设成「忽略查询串」会让 HTML 和 RSC 互相覆盖，用户直接看到 RSC 原文；`?page=N` 也必须在键里。
     - Edge TTL 设为忽略源站 Cache-Control，60–300 秒；Browser TTL 不改。
     - 部署手册加一步：新镜像起来后 purge `/news*`、`/chongzhi*`。否则边缘上的旧 HTML 引用已经不存在的 chunk，TTL 内会水合失败、报 ChunkLoadError。
     - 上线前要核实：服务端渲染会不会读 cookie 里的推广码来决定显示价格。如果会，这些路径就不能缓存，或者必须把相关 cookie 加进绕过条件。
     - **/jiema 永不缓存**：页面按人渲染条款同意状态 [R1 §13]。

### 6.7 渠道站

- 不改渠道逻辑：三道 noindex、AI 爬虫整站 Disallow、sitemap 为空，全部维持 [R5 §5]。
- 新增的路由组照抄 §1.1 末尾的写法，并**加进 `scripts/itest-tenant.routes.json`**，验证渠道站访问这些路由都返回 404。
- 首页新增的服务端区块、商品页新增的面包屑和事实卡，都只在主站输出。wp1 的 W1-9 只测 `HomeClient`，所以在 wp1（或新的 SEO itest）里加一条：**渠道站首页的完整 HTML**（`page.tsx` 的输出，不只是 HomeClient）不含 `/news`、`/jiema`、`/chongzhi`；用渠道 Host 渲染商品页，HTML 里没有 `href="/chongzhi`。
- 主站页面不链接渠道站；不开关键词子域名。

### 6.8 404、301、其他清理

- **`src/app/not-found.tsx`**（A 包）：见 §3.2-K。
  - **根 layout 的 robots 维持原样**（含 `googleBot: { index: true, follow: true, … }`）。404 页因此同时有 Next 自动加的 noindex 和根 layout 的 index 两条，Google 取更严格的 noindex，记为已知、无害。
  - 不改的原因：`itest-tenant/wp1.ts:478` 硬性断言 `mainMeta.robots?.index === true && googleBot.index === true`；而且根 layout 除了 robots 还有 googleBot 对象（`layout.tsx:148-153`），只删 robots 里的 index、follow，googlebot 那条照样输出 index，问题并不会消失。收益接近零，却要改渠道会话的测试。
  - 如果以后一定要改：robots 和 googleBot 两处都只保留 `max-image-preview`、`max-snippet`，同步修改 `wp1.ts:478`（和渠道会话协调），并在主站、渠道站两个 Host 上分别验证 404 页和普通页的 robots、googlebot 输出。
- **meta keywords**：删掉根 layout 里的 keywords。
- **og 与根 layout 的默认文案**：
  - 新增 `lib/seo/og.ts` 的 `pageOg({title, description, path, type})` 工厂，统一带上 `OG_SITE`（site_name、locale）和 `OG_IMAGES`。所有自己写 title 的公开页都改用它。
  - 根 layout 的默认 title、description 和 og 文案**一起改**：现在的默认 title「贝果科技 - ChatGPT Plus / Claude Pro 充值与代充」、DESCRIPTION「……可开增值税发票」（不带 6%，`layout.tsx:23、34`）会被所有没有自己 metadata 的页面继承。改成只写品牌和业务的概括、不写开票，例如 title `贝果科技 BigoLab - AI 订阅充值与 AI 行业动态`。默认文案**不写短信接码**：它是兜底值，灰度期也会被继承。
  - /about 的 description 按 §3.2-J 重写（带 6%，删掉「账号不经手」和「代充」）。
- **/forum/*、/games/***：noindex,follow，移出 sitemap。/forum 按 §28 的要求，先加限流，再决定是否开放。
- **商品后台错别字**（站长）：`信用卡冲` 改为 `信用卡充值`，`Gork` 改为 `Grok`，`Superr` 改掉。§28 已验证改名不影响匹配规则。/products 页 19 张图有 18 张缺 alt，一并补上。

---
## 7. UX 与转化

### 7.1 落地页首屏（移动端优先）

从上到下（非 AI 引用页；AI 引用页的首屏不动，§1.4）：

1. **H1**：不超过两行。
2. **一句话答案**：≤60 字，比如「用支付宝买卡密，到订单里的兑换页自行提交充值」。写到时长的，数值必须来自商品页已写明的数字，没有就不写。
3. **总结句 + 事实卡**：移动端两列 3 行，写最关键的 6 格。
4. **主按钮**「看价格 / 去下单」，锚点到价格表；**次按钮**「不确定选哪档？」，锚点到对比段落。
5. **底部固定条**：高度 ≤56px，只在充值落地页出现，只放一个主按钮。
   - 不遮挡正文，不做弹层。
   - 滚动到价格表时自动隐藏，避免和表里的按钮重复（百度规定「同屏重复功能不超过 2 个」）。
   - 出现时用 CSS 变量把右下角 FloatingContact 往上抬，和公告提示条错开；**/jiema* 页面不显示**（那里已有底部结算栏）。

### 7.2 信任要素（全部可核验）

| 要素 | 展示位置 | 数据来源 |
|---|---|---|
| 经营主体全称 | 事实卡、页脚、/about | 常量 |
| 营业执照信息或链接 | 页脚、/about | 站长提供；电子商务法第十五条要求（§9 待决） |
| 付款方式：充值只收支付宝；接码支付宝或站内余额；登录后下单 | 事实卡 | 代码行为 |
| 开票口径 | 事实卡；完整问答只在 hub | `lib/invoice.ts` |
| 售后与退款口径 | 事实卡、条款 | /terms、接码条款 |
| 累计成交 N 笔（本站订单统计） | 首页信任条、hub | 数据库实时值（§28 已改成这样） |
| 「我们不是 OpenAI / Anthropic 官方」 | 落地页信任区、/terms 第一节（**不能删**） | 条款 |
| 内容核对日期 | 落地页 | 该页自己的 reviewedAt |
| 客服入口 | 浮动联系按钮（现状）、/support | — |

**不做**：
- **虚构的成交动态**：左下角「某某 刚刚 购买了…」弹窗 P0 下线（§6.6-1）。城市是轮换的假城市、时间是随机生成的、还混入写死的假订单，属于虚构成交细节的商业宣传（电子商务法第十七条、反不正当竞争法第九条），和本节「全部可核验」正面冲突。
- 评分、用户数、「好评返券」一类激励评价。Google 2026-07-24 起明文禁止未披露的激励评价 [R4 §1.3]。
- 秒到、100% 之类的承诺。

### 7.3 移动端

- 首屏没有遮挡物：公告改成底部提示条（§6.6-2），左下角成交弹窗下线（§6.6-1）。移动端那个 `max-w-xs` 浮层现在每 8–15 秒遮一次落地页和大事记正文。
- 底部固定元素互相避让：公告提示条、落地页底部 CTA 条、FloatingContact 用同一组 CSS 变量错开；/jiema* 上都让位给结算栏。
- 触控目标 ≥44px。
- 表格在窄屏下要么横向滚动（加阴影提示），要么改成卡片。
- 修掉 PSI 列出的无障碍问题：链接和按钮缺可访问名称、对比度不足、标题层级跳级 [R2 §3]。这些同时影响 PSI 新增的「智能体浏览」分项。

### 7.4 页内引导：跨支柱转化

| 场景 | 引导 | 实现 |
|---|---|---|
| 读 claude-zhuce，卡在手机号验证 | 「用海外手机号接收 Claude 验证码 →」，链到 /jiema 并预选 Claude | 正文链接；**接码开放后才出现** |
| 读 codex-jiema | 「按国家/地区选号接收 OpenAI 验证码（实时报价）→」，链到 /jiema/openai 或 /jiema 预选 OpenAI | 正文链接，**不放在「虚拟号为什么被拒」一节里**；接码开放后才出现 |
| 在 /jiema/openai 接完码 | 「注册完开通 ChatGPT Plus →」 | 服务页的相关服务卡片；号码页（接码会话决定要不要加） |
| 读大事记的 Claude 条目或话题页 | 「本站在售的 Claude 订阅 →」，链到 claude-pro、claude-max、claude-code | 独立区块，显著标注「**广告 · 本站服务**」，和 AI 摘要、AI 免责声明视觉分开，不进 Article JSON-LD；按标签映射，标签对不上就不出现；干净 URL，**不写 localStorage**（`?n=` 的捕获端是死代码，转化用 §0.4 的 PageView 代理口径，站内跳转本来就能按会话串起来） |
| 在首页 | 各业务的入口卡片 | §1.10 |

**硬规则**（和 §2.5 相同，写进 C、D1a、F2 的验收）：
- /jiema*、大事记详情和话题页的 CTA，不链 `/chongzhi/google-zhanghao`、`/chongzhi/claude-kyc`，也不链带「普号 / 成品号」SKU 的价格表锚点。
- 所有指向 /jiema 的链接按 `features.jiema && jiemaPublicOpen(...)` 输出，只在主站。

**措辞约束**：大事记里的商业区块保持中性，只放在正文之后，不把摘要写成软文 [R1 §8]。

### 7.5 转化路径上的摩擦（记录，本轮不改）

下单必须登录，这是既定事实。本轮能做的是**提前告知**：在事实卡和价格表旁边写明「登录后下单，卡密发到账号邮箱」，减少用户走到半路才发现要注册。注册页和营销相关的同意逻辑（`register/page.tsx`）属于营销会话的范围，本方案不碰。

### 7.6 A/B 测试与分阶段观察

流量太小，不适合做页内同时分流的 A/B 测试。改为以下三种做法：

**1. 标题测试：前后对比 + 对照组**
- 测试组：构建批 3 改 title 的、**已被 Google 收录**的页：claude-max、codex-jiema、grok-super。chatgpt-pro、claude-pro 没被收录，没有排名可比，只看展示量从 0 起步的速度。
- 对照组：claude-kyc、google-zhanghao（都已收录），**从现在到测试结束完全不动**：不加事实卡、不加链接、不改 title。claude-zhuce 没被 Google 收录（R3 §5.0），不作对照。
- 标题改动和结构改动错开：C、G 在构建批 2（10-08 前后），D1b 的标题在构建批 3（10-29 或之后），间隔 ≥2 周。
- **主要看展示量和平均排名的趋势**，点击率只作参考：现在展示量接近 0，前后 28 天的点击率对比没有统计意义。
- AI 引用页的两步走单独观察：看 PageView 的 AI 来源会话和 nginx 日志，不和上面的标题测试混在一起。

**2. 下线成交弹窗、公告改提示条：看前后同期的会话深度**
- 两项在同一批上线，一起评估。
- 指标：PageView 按 viewerKey 统计「浏览 ≥2 页的会话占比」「首页 → 落地页 → 商品页的漏斗」，对比改动前后各 14 天。

**3. 分批上线**
- 服务页、话题页每批上线后隔 2 周再上下一批，每批只动一个变量，并在 `docs/交接-进度与待办.md` 里记下上线日期。
- 这样排名波动能归因到具体的改动，而不是和 Google 的核心更新、垃圾内容更新混在一起。

---
## 8. 实施分包

### 8.1 文件归属与冲突

**必须回避的营销模块文件**（另一个会话正在做营销邮件，共用仓库）：
- `src/lib/marketing/**`、`src/app/admin/marketing/**`、`src/app/api/admin/marketing/**`、`src/app/api/cron/marketing*`、`src/app/api/account/marketing/**`
- `src/components/mail-landing.tsx`、`src/lib/mail.ts`
- `src/lib/legal.ts`：它的 `PRIVACY_UPDATED_AT` 被营销同意日志引用
- `src/app/(shop)/register/page.tsx`、`src/app/(shop)/profile/page.tsx`
- `src/app/(shop)/layout.tsx`：挂着 MailLanding。左下角成交弹窗的挂载点也在这里，本方案**不动它**，组件自己恒返回 null（§6.6-1）
- `prisma/schema.prisma`：本方案不做任何表结构改动。需要持久化的状态（闸门状态、商品编辑时间）都写进现有的 `Setting` 键值表

本方案所有改动都**落在子组件里，不需要改 `(shop)/layout.tsx`**。

**渠道会话的文件和测试**，改之前先和它约定：
- `src/lib/storefront/public.ts`（features 开关；`check-tenant-math.ts:296` 断言「PLATFORM 全开」，本方案不改）
- `src/lib/storefront/cache.ts`（只调用，不改）
- `scripts/itest-tenant/wp1.ts`、`mods-p3.ts`：G 包要改 W1-6 的 sitemap import（§6.2）；其余断言（W1-5 的 robots、W1-9 的页头页脚入口）本方案保持成立

**接码会话的文件**，由接码会话来做，或者先和它协调：
- `src/app/(shop)/jiema/**`、`src/lib/jiema/**`、`src/lib/jiema-config-schema.ts`、`src/lib/floating-widgets.ts`
- `src/lib/terms/jiema-*.ts`：条款文字 SEO 一个字都不改（§24、R5 §4-23）
- `scripts/itest-jiema-catalog.ts`（G 包要改它的 sitemap import）、`scripts/itest-jiema-terms.ts`（AJ 包要加 robots 断言）

**多方共享的文件**，改之前先 rebase 到最新代码，一次只改一个包：
- `src/app/sitemap.ts`（G 包会删除它）、`src/app/robots.ts`、`src/app/layout.tsx`
- `src/components/layout/header.tsx`、`footer.tsx`
- `src/app/(shop)/support/layout.tsx`、`src/lib/seo/graph.ts`

### 8.2 施工包

**所有代码包共同的验收要求**：
- `npx tsc --noEmit` 零错误；`node scripts/check-tenant-boundary.mjs` 通过（它挂在 prebuild 上，不过就构建不了）
- 动过结构化数据的，跑 `scripts/check-jsonld.ts`（含「页内没有悬空 `@id`」断言）
- 动过 layout、robots、sitemap、graph 的，跑 `scripts/itest-tenant/run-all.ts`。W1-6 的「主站与基线逐字相同」拿 `git HEAD` 做基线，有意改动主站 robots、sitemap 输出时，在提交之后跑，或同步调整断言（§6.2）
- `scripts/check-seo-copy.ts`（§3.4）：**不新增违规，并清掉属于本包的基线条目**；不要求一次清零
- 上线后用 `check-seo-copy.ts --base https://bigolab.com` 对线上只读抓取，这是正式验收；再用 curl 抓线上 HTML，对照本包的验收清单逐条核对
- 所有问答式首句、事实卡的每一格，对照 chongzhi/* 页面、商品说明和代码逐字核对（§4.3-2）

**部署注意事项**：
- **按阶段攒批，每个阶段只构建一次**（§0.5）：P0 一次（A + B），P1 一次（C + G + Ha + D1a），P2 一次（D1b + AI 引用页第一步 + D2 + E1），P3 一次（D3 + E2 + I）。AJ、F1、F2 由接码会话并进它自己的发版。Hb 只改 Cloudflare 规则，不构建。
- 本机构建目前一定会 OOM，每次构建都要用 `scripts/ops/build-with-swap.sh` 临时放开 buildkit 的内存和 swap，**先征得站长同意**，并在群里告知。
- **构建前先打回滚标签**：`docker tag beiguo-shop-app:latest beiguo-shop-app:rollback-<旧 HEAD 短哈希>`（沿用部署说明里的惯例）。
- **回滚**：`docker tag beiguo-shop-app:rollback-<旧 HEAD> beiguo-shop-app:latest && docker compose --env-file .env.production up -d --no-deps app`。秒级完成，不用重新构建，不冒第二次 OOM 的风险；代码侧再 revert 对应提交，下一批构建时带上。sitemap、根 layout 这种全站级故障，必须用这种方式回滚。
- HSTS 调整和其他 nginx 改动攒到同一次 `up -d --no-deps --force-recreate nginx`（reload 不够），放在低峰时段。
- 服务器操作遵守三条铁律：命令用 base64 传；耗时任务放后台跑；**绝不跑 `docker system df`**。
- 所有包都不涉及改表结构（DDL）。

---

**O · 站长后台操作与基线**（P0，约 1–2 小时，不涉及代码）

- 内容：
  - §6.5 全部步骤；Cloudflare Always Use HTTPS
  - 后台商品错别字；公告文案去掉绝对化表述
  - 提供营业执照信息、公众号 URL、已下架 ID 的对应关系
  - **基线**（P0 第一周开始记，10-29 定稿）：GSC、Bing AI Performance 截图或导出；站内 PageView 按 `source='ai'` 和落地页统计（据此确定「AI 引用页」清单）；nginx 日志按爬虫 UA 和路径统计（经站长同意由实现会话按铁律执行）；首页、/chongzhi、各落地页的线上 HTML 快照
- 验收：
  - GSC 网域资源显示「已验证」
  - sitemap 状态为「成功」
  - `curl -I http://…` 返回 301
  - 基线截图、导出和 HTML 快照已存档
- 风险：无。

---

**A · 技术止血，不含接码文件**（P0，构建批 1，半天到一天）

- 内容：
  - `pageOg` 工厂，公开页补 OG_SITE
  - 根 layout：默认 title、description、og 改成品牌中性的一句（不写开票、不写短信接码，§6.8），删 keywords；**robots 不改**
  - 新增 `not-found.tsx`
  - 大事记详情页现有的商品 CTA：改成干净 URL（去掉 `withNewsRef` 生成的 `?n=`），并包进「广告 · 本站服务」区块
  - /forum、/games 改 noindex,follow，并移出 sitemap
  - /about：title 去掉零需求词；description 按 §3.2-J 重写（带 6%，删「账号不经手」「代充」）；正文去掉「全球顶尖」
  - robots 主站 `*` 组加 `Allow: /lookup$`
  - 新增 `scripts/check-seo-copy.ts`（含已知违规基线和 `--base` 参数）
- 文件：
  - `src/lib/seo/og.ts`、`src/app/layout.tsx`、`src/app/not-found.tsx`（新）、`src/app/robots.ts`
  - `news/page.tsx`（只改 og）、`support/layout.tsx`
  - `about/layout.tsx`、`about/page.tsx`、`links`、`iptools`、`terms`、`privacy` 的 metadata
  - `news/[slug]/page.tsx`
  - `games/layout.tsx`、`forum/layout.tsx`、`src/app/sitemap.ts`（只删 games、forum 两条）
- 验收：
  - 每个公开页 og:title 和 `<title>` 主干一致，og:site_name、og:locale 都在
  - 404 页是中文、有导航；它的两条 robots 记为已知（§6.8）
  - 大事记详情页里没有 `?n=` 链接，商品入口在「广告 · 本站服务」区块里
  - sitemap 里没有 games、forum
  - robots.txt 有 `Allow: /lookup$`，`/lookup?x=1` 仍被挡住（用 Google robots 测试工具或同等解析器核对）
  - `wp1.ts:478`（主站 robots index:true）照常通过
- 风险与回滚：动了根 layout，渠道分支必须用 itest-tenant 回归；出问题按回滚标签切回。

---

**AJ · 接码页元信息**（接码会话做，约 2 小时；并进接码的首次部署，不单独构建）

- 内容：
  - **canonical** 从 `jiema/layout.tsx` 挪到 `jiema/page.tsx` 的 `generateMetadata`。**robots 留在 layout**：`robots: jiemaPublicOpen ? index,follow : noindex,follow` 作为整组的 fail-closed 默认值（§1.3）。子页面只允许收得更严。
  - `terms/page.tsx` 补 og（robots 继续继承 layout，和它第 19 行的注释一致）
  - records、order 两页改用 `privatePageMetadata()`（noindex,follow）
  - 预选参数改名 `?svc=`，值用本站 slug（§1.2）；`?s=<code>` 只做兼容
  - 更新 H1、description（§3.3：不写日期，付款方式按 `canUseForJiema` 渲染）
- 文件：`src/app/(shop)/jiema/layout.tsx`、`page.tsx`、`terms/page.tsx`、`records/page.tsx`、`order/[orderNo]/page.tsx`、`jiema-client.tsx`、`scripts/itest-jiema-terms.ts`
- 验收：
  - **灰度配置下 curl /jiema、/jiema/terms，以及一个不存在的服务页路径（以后的 /jiema/<服务>），robots 都必须是 noindex**；这条断言写进 `itest-jiema-terms.ts`（现有 check-jiema-*、itest-jiema-* 都不检查 robots，出了问题是静默的）
  - OPEN 配置下 /jiema、/jiema/terms 是 index,follow
  - /jiema 的 og:title 不再是首页那句
  - /jiema/records 没有 canonical，robots 为 noindex,follow
  - 公开页 HTML 里的预选链接不再是 `?s=`，`svc=` 的值不是上游代码
  - `?svc=` 覆盖三条路径：旧 `?s=` 分享链接能恢复选择、登录回跳能恢复选择、手机端 popstate 前进后退正常
  - `check-jiema-*` 各脚本通过
- 风险：客户端兼容两个参数，分享出去的旧链接不受影响。

---

**B · 下线假成交弹窗、公告提示条、LCP**（P0，构建批 1，一到两天）

- 内容：§6.6 的 1–5 项；header 的 aria-label。
  - 第 5 项（framer-motion）如果做不完，整体挪出本包，不写进验收。
- 文件：
  - `src/components/live-order-notification.tsx`、`src/app/api/orders/recent/route.ts`
  - `src/components/announcement-modal.tsx`、`src/lib/announcement.ts`（如有需要）
  - `src/app/(shop)/home-client.tsx`、`src/components/layout/header.tsx`、`footer.tsx`（只改 logo 图片）
  - `src/app/(shop)/news/[slug]/page.tsx`（只改图片）
  - `public/logo-*.webp`（新）、`scripts/gen-brand-assets.py`
  - （做第 5 项时）`floating-contact.tsx`、`contact-modal.tsx`
- 验收：
  - 代码里 grep 不到 `FAKE_CITIES`、`FALLBACK_ORDERS`、`getRelativeTime`；`/api/orders/recent` 的响应里没有 city
  - 主站任意页面 30 秒内左下角不出现成交弹窗
  - `check-jiema-s2b.ts`、`itest-security.ts`、`itest-tenant` 照常通过
  - PSI 移动端 4 个代表页（含一个大事记详情页）的 LCP <2.5s，LCP 元素不再是公告；CLS 保持 0
  - head 里不再 preload logo-full.png
  - 首页和页头的服务端 HTML 没有 `opacity:0`、`translateY(-100…)` 这类首帧隐藏
  - （做第 5 项时）bundle analyzer 前后对比，共享包里不再有 framer-motion
- 风险：站长依赖弹窗发强提醒。提示条保留 pinned 语义，可以回滚。
- **评审修复与遗留（2026-09-30）**：
  - 首页打字机那一行按最长短语占位，换句时 H1 不再上下跳（§6.6-3）；打字机里的开票短语改为「可开增值税发票（开票另付 6%）」（§9.2-3）。`check-seo-b` 进程内加了占位与 6% 的断言。
  - 商品详情页描述模板（`lib/product-seo.ts` 的 `deliveryPitch`：后台说明不足 40 字时拼进 meta description、og:description 与 Product JSON-LD）原来写「标价不含税，税费另付」、没带 6%，已改为「标价不含税，开票另付 6%」，`check-product-seo` 断言它与 `TAX_RATE` 一致。**注意**：本地库没有在售商品，A、B 两包本地 `check-seo-copy` 的「无新增违规」**不覆盖商品详情页**；以上线后 `check-seo-copy --base https://bigolab.com` 为准。届时商品页如果报 invoice-6pct，先看是不是后台写的商品说明（≥40 字时原样使用）里提到开票没带 6%——那是后台内容，请站长在后台改，不是模板。
  - 新闻详情页缩略图保持 PNG、上线后 PSI 复核（§6.6-4）；`/api/orders/recent`、`floating-widgets.ts`、`(shop)/layout.tsx` 注释的遗留清理见 §6.6-1；/support、/iptools、/links 的首帧隐藏归 C 包（§6.6-3）。

---

**C · 首页三业务、页脚导航、组织实体**（P1，构建批 2，1–2 天）

- 内容：
  - §1.10 首页区块改为服务端直出（替换两处客户端拉取）；接码区块按 `features.jiema && jiemaPublicOpen(await readSmsConfigCached())`、只在主站输出，服务取 SEO 白名单常量
  - 首页 title、H1、description 按开放状态输出两个版本（§3.3）
  - 页脚 4 栏（维持客户端组件，不改 layout）；导航「更多▾」下拉的链接始终在 SSR HTML 里
  - 落地页公共组件加「相关服务」区块（接码链接按开放状态，大事记链接按 features）；claude-zhuce、codex-jiema 的桥接链接（§2.5 锚文本）
  - 大事记详情页按标签映射「广告 · 本站服务」区块（`lib/news/commerce-link.ts`，映射表永不指向 claude-kyc、google-zhanghao；没有兜底）
  - Organization 和 /about 改写（§4.2，按开放状态）；营业执照信息（待站长提供）
  - **首帧可见补齐**（B 包评审遗留，§6.6-3）：/support、/iptools、/links 去掉 framer-motion 的首帧 opacity:0（挂载即播的改 `initial={false}` 或只留位移，`whileInView` 的只留位移）
- 文件：
  - `src/app/(shop)/page.tsx`、`home-client.tsx`、`src/components/news-hot-section.tsx`
  - `src/app/(shop)/support/page.tsx`（接码会话 09-30 刚改过它，动手前先 rebase、和接码会话打招呼）、`src/app/(shop)/iptools/page.tsx`、`src/app/(shop)/links/links-client.tsx`、`scripts/check-seo-b.ts`（三页从 `FIRST_FRAME_PENDING` 挪进 `FIRST_FRAME_STRICT`）
  - `src/components/layout/footer.tsx`、`header.tsx`、`src/components/landing/landing-ui.tsx`
  - `src/lib/news/commerce-link.ts`（新）、`src/app/(shop)/news/[slug]/page.tsx`
  - `src/lib/seo/graph.ts`、`about/layout.tsx`、`about/page.tsx`
  - `src/lib/jiema/seo-whitelist.ts`（新，SEO 白名单常量；和接码会话约定放在这里还是 `service-pages.ts`），只读调用 `lib/jiema/catalog.ts`
- 验收：
  - 首页服务端 HTML 满足 §3.1 的首页检查清单，没有「加载中」
  - **灰度配置下，全站公开页 HTML 里没有 `href="/jiema`**；OPEN 配置下首页和 9 个落地页才有
  - 页脚有 /news；`wp1.ts:643` 的「主站页头：入口齐全」照常通过
  - **渠道站首页的完整 HTML**（`page.tsx` 的输出，不只是 HomeClient）不含 `/news`、`/jiema`、`/chongzhi`（新增到 wp1 或新的 SEO itest）
  - 首页和 /jiema 的服务端 HTML 不出现 Telegram、+86 和国内实名、金融类服务名
  - /jiema*、/news/[slug]、/news/t/* 的 HTML 里没有指向 google-zhanghao、claude-kyc 的 `<a>`
  - Organization 的 description 覆盖各业务（接码按开放状态），不含「代充」，开票带 6%
  - `check-seo-b.ts --base`：/、/support、/iptools、/links 的服务端 HTML 都没有带内容的 opacity:0（失败级，不再是告警）；/support 的 H1 首帧可见
- 风险：
  - 首页读接码目录，要加 try 和降级：读不到就不显示这一块，不能让首页 500
  - 首页是 ChatGPT-User 抓得最多的页，改之前存 HTML 快照

---

**D1a · 事实卡、每页核对日期、商品页归属**（P1，构建批 2，1 天）

- 内容：
  - `fact-card.tsx`（服务端组件，§4.3：总结句 + 事实卡）
  - `LANDING_REVIEWED_AT` 拆成 registry 里每页一个 reviewedAt，hub 取子页里最新的那个
  - 事实卡上到**非 AI 引用页、非对照组**的落地页（chatgpt-pro、claude-pro、claude-max、codex-jiema、grok-super、claude-zhuce；最终清单以 P0 基线定出的 AI 引用页为准）
  - 这些页的 FAQPage 加 `@id`、dateModified、lastReviewed、publisher（不新增 WebPage）
  - registry 给 SKU 标主落地页；商品页的面包屑、「选购指南」链接、事实卡（不放价格），全部 `!channel`
  - **不新增开票 FAQ**
  - claude-zhuce 删掉 FAQ 里「如果你需要很多个，请直接联系客服说明用途」一句（站长确认后，§9.4 #21）
- 文件：
  - `src/lib/landing/registry.ts`、`src/components/seo/fact-card.tsx`（新）、`landing-ui.tsx`
  - `src/lib/seo/graph.ts`、`src/lib/product-intro.ts`
  - `src/app/(shop)/products/[id]/*`
- 验收：
  - 事实卡里的价格与 `/api/products` 的公开价一致；付款格按业务区分
  - AI 引用页和对照组（/chongzhi、chatgpt-plus、claude-kyc、google-zhanghao）的 HTML 与改前快照相比没有变化
  - 用渠道 Host 渲染商品页，HTML 里没有 `href="/chongzhi`
  - 每页的核对日期来自自己的 reviewedAt
- 风险：回滚按标签切回。

---

**D1b · 标题与描述，AI 引用页第一步**（P2，构建批 3，10-29 或之后，1 天）

- 前置条件：
  - AI 基线满 4 周（§0.4）
  - 和构建批 2 间隔 ≥2 周
  - hub 改名前已实看「ai会员 价格对比」「ai订阅 比价」的 SERP，结论记进交接文档
- 内容：
  - `renderPriceTemplate`（§3.1）
  - §3.3 支柱一：chatgpt-pro、claude-pro、claude-max、codex-jiema、grok-super、/products 的 title、description、个别 H1
  - AI 引用页第一步：/chongzhi、chatgpt-plus **只换 `<title>` 和 description**（og 同步）
- 文件：`src/lib/landing/registry.ts`、`src/lib/landing/products.ts`、**每页的 `generateMetadata`**（`src/app/(shop)/chongzhi/*/page.tsx`、`chongzhi/page.tsx`）、`products/page.tsx`、`products-client.tsx`（H1）
- 验收：
  - 线上 title 和 §3.3 一致；任何占位符取不到价格时整句退回无数字版本，线上 HTML 里搜不到 `{p`
  - AI 引用页的 HTML 与改前快照相比，只有 `<title>`、description、og 的 title 和 description 变了
  - 对照组两页完全不变
  - 改动前后的 HTML 快照已存档
- 风险：
  - 已收录的 claude-max、codex-jiema、grok-super 改标题后，短期排名可能波动。有对照组可以观察。

---

**D2 · claude-code 新页，claude-pro / claude-max 复制结构**（P2，构建批 3，2–3 天）

- 内容：registry 在 LANDINGS **末尾**新增 claude-code，标 `ownsProducts: false`；新页按信息检查清单写，**Claude Code 的套餐范围对照 Anthropic 官方页面核实并外链**；§28 已批准的结构复制；§5.2 列出的非 AI 引用页新增 H2。
- 文件：`registry.ts`、`product-intro.ts`、`src/app/(shop)/chongzhi/claude-code/page.tsx`（新）、`claude-pro/page.tsx`、`claude-max/page.tsx`、`chatgpt-pro/page.tsx`（只加 H2）、`scripts/check-product-intro.ts`
- 验收：
  - 新页的价格区是摘要，链到 claude-pro、claude-max，不整表复制；按规则匹配，不写死 ID
  - `check-product-intro.ts` 断言：Claude Pro 各档、Max 各档商品的归属仍然是 claude-pro、claude-max
  - 页面里每一句操作说明都能在代码中找到对应行为
  - hub、页脚、相关链接自动出现新页（由 registry 驱动）
  - 门页四条自查已记录；title、H1 里没有「Pro 还是 Max」
- 风险：Claude Code 的官方政策变化快，每月核对。

---

**D3 · AI 引用页第二步**（P3，构建批 4，1 天）

- 前置条件：D1b 上线满 2–4 周，AI 来源会话和 nginx 日志里 OpenAI 爬虫的抓取没有明显下滑。
- 内容：/chongzhi、chatgpt-plus 的总结句 + 事实卡、新 H2（§5.2），**一律追加在现有段落之后**，不改现有 H2 顺序；hub 的价格表按 §1.4 的表头规则。
- 验收：改后 HTML 与快照对比，原有段落一字未动、顺序不变；新增内容都在原有最后一个 H2 之后。

---

**E1 · 大事记的抓取通道与结构化数据**（P2，构建批 3，2–3 天，**动手前先读 SKILL.md**；前置条件 Ha 已上线）

- 内容：
  - 6 个分类页 `/news/c/[category]`，`?page=N` 只列可索引事件（共用 `shouldNoindexEvent`）；导语只在第 1 页；`?page=1` 308 到无参 URL，非法值和越界 `notFound()`；第 2 页起不跑今日、本周、补录查询；news-stream 的分类按钮改成 `<a>`，保留客户端交互。分类页如果复用 NewsStream：它的 page state 从 1 开始、「加载更多」是追加模式（`news-stream.tsx:64、419-429`），要加 `initialPage` 参数，「加载更多」从 initialPage+1 开始，同时服务端直出 `<a href="?page=N+1">`
  - **/news 不做服务端深分页**，「加载更多」维持现状
  - 日报补「当天全部可索引条目」（薄页不列），周报补当周日报链接，月度归档改成按天分组的 Top 列表
  - 日报、周报、归档的 SEO 标题和 H1（§3.3：H1 用「AI 动态速览」，截断按词界）
  - CollectionPage、ItemList、BreadcrumbList；详情页的面包屑和 publisher `@id`（同页 Organization）
  - dateModified 和 sitemap lastmod 改成 max(publishedAt, reviewedAt)（附录 B-2）
  - IndexNow 过滤薄页，补齐全文层时补推
  - **离题条目排查**：在后台查出「国庆自驾攻略」那条事件的 items 来源和 triage 记录，确认是哪一步放进来的：分诊误判（全仓唯一写 `OK` 的地方是 `pipeline.ts:778、786`）、聚类阶段（`pipeline.ts:929-974` 按 `triageState='OK'` 取条目、按实体交集召回）把它并进了别的事件，或线索源的正文抓取。再针对性修：分诊误判就收紧提示词里对「AI 行业动态」的定义并加反例；聚类误并就收紧实体召回条件；也可以在 compose 落库前加关键词兜底。遵守 SKILL §10，不放宽黑名单
- 文件：
  - `news-stream.tsx`、`news/c/[category]/page.tsx`（新）
  - `archive/[month]/page.tsx`、`digest/[type]/[period]/page.tsx`、`[slug]/page.tsx`
  - `src/lib/news/seo.ts`、`src/components/news/article-jsonld.tsx`
  - `src/lib/news/pipeline.ts`（IndexNow 过滤、按排查结果修分诊）、`src/app/api/cron/news/route.ts`
  - `src/lib/seo/sitemap-entries.ts` 里 news 相关的部分（G 包之后做）
- 验收：
  - 任意抽 10 条可索引事件，都能从服务端 HTML 的 `<a>` 经分类分页和日报两条路径走到
  - 分类分页和日报列表里没有薄页链接
  - 新页都有 `ai-generated` meta 和「AI 摘要」徽章
  - `check-seo-copy` 不新增违规，页面里没有「新闻」字样
  - 分页页的 canonical 指向自己；`?page=1` 返回 308；`?page=0`、`?page=abc`、越界返回 404
  - 抽查近 7 天 OK 条目的离题率，记进交接文档
  - `check-news-*` 脚本通过
- 风险：分类分页会带来更多抓取量。上线后 2 周看 GSC 抓取统计和服务器负载，再决定是否做 Hb。

---

**E2 · 话题页首批 3 个**（P3，构建批 4，2 天，另加人工核对导语）

- 内容：`src/lib/news/topics.ts`（新），包含 slug、名称、tags、导语、速查块、reviewedAt、相关落地页；`/news/t/[topic]/page.tsx`（新）；闸门逻辑（§1.7，状态每天由 cron 算好存 `Setting`，带滞回）；H1 下的非官方说明行。
- 验收：
  - 未过闸的话题页输出 noindex,follow，且不在 sitemap 里
  - 速查块里每个事实都有官方外链和核对日期；导语标注「AI 起草、人工逐条核对」
  - description 开头有「第三方整理」，页面上有非官方说明和官方更新日志外链
  - 页面唯一性脚本通过（专属区块 ≤0.25）
- 风险：速查块过时。每月核对，过期超过 45 天的自动隐藏速查块。

---

**F1 · /jiema hub 正文与目录懒加载**（接码会话做，1–2 天；随「开放全部用户」那次发，或之后）

- 内容：§1.6 的 hub 区块；热门服务表和热门国家/地区表取 SEO 白名单常量、由服务端直出、带起价；hot 以外的服务懒加载，预选服务服务端直出；面包屑；Service + Organization 结构化数据；INP 优化。
- 文件：`src/app/(shop)/jiema/page.tsx`、`jiema-client.tsx`，`src/lib/jiema/catalog.ts` 视需要增加一个只读的摘要函数，SEO 白名单常量文件。
- 验收：
  - /jiema 的 HTML ≤60KB，§1.6 列出的正文各段齐全
  - 起价和下单报价同源
  - SEO 白名单里的服务都在 cron 预热清单里（check 脚本断言）
  - 服务端 HTML 里没有 Telegram、+86、国内实名与金融类服务名，没有上游代码形态的 `svc=`
  - 正文里没有「接码平台」以外的禁用词，「接码平台」只出现一次，并且在解释语境中；号码类型只有「不区分、不能指定」那一句
  - D44 地区命名检查通过
  - 预选恢复（地址栏、登录回跳、popstate）不用等网络请求
  - `check-jiema-*` 通过
- 风险：懒加载失败会影响下单。回滚方式是恢复服务端下发目录。

---

**F2 · 接码服务页**（接码会话做；第 1 批 ≤3 页在开放满 1 周后，第 2 批 ≤5 页在第 1 批满 2 周后）

- 内容：`src/lib/jiema/service-pages.ts`（新），白名单常量包含 slug、上游代码映射、正文、FAQ、reviewedAt、相关落地页；`src/app/(shop)/jiema/[service]/page.tsx`（新）；闸门逻辑（cron 每天算、存 `Setting` 的 `seo_gate_<slug>`、带滞回）；国家/地区价格表每行一次点击到达确认面板；sitemap 的 jiema 分段（走 `sitemap-entries.ts`）；baidu-push 清单。
- 验收：
  - 闸门条件 ④ 的内部数据（近 30 天已付款单、内部收码成功率）达标，并记录在交接文档里（数字不上页面）
  - 每页满足信息检查清单，服务专属区块两两重合度 ≤0.25
  - 价格和下单同源，不触发 PRICE_CHANGED；价格表的链接一次点击到达确认面板
  - 没有成功率百分比；description 没有日期；不原样引用平台的拒绝提示；没有「换号码类型」
  - title、description 里没有国内平台名和上游代码
  - 页面里没有指向账号类商品和 KYC 的链接
  - 灰度配置下 robots 为 noindex（继承 layout 的 fail-closed 默认值）
  - 渠道站访问返回 404（加入 itest-tenant 路由表）
  - 门页四条自查已记录
- 风险：
  - 第 1 批上线满 2 周前不上第 2 批。
  - 上线 8 周零展示的页，301 或 308 回 /jiema。

---

**G · sitemap 分段、IndexNow 扩展、百度清单**（P1，构建批 2，1–1.5 天）

- 内容：§6.2、§6.4。
- 文件：
  - `src/lib/seo/sitemap-entries.ts`（新）、`src/app/sitemap.ts`（删除）、`src/app/sitemap.xml/route.ts`（新）、`src/app/sitemaps/[name]/route.ts`（新）
  - `scripts/itest-tenant/wp1.ts`（W1-6 的 import）、`scripts/itest-jiema-catalog.ts`（第 534 行的 import）：**必做**，提前和渠道、接码两个会话约定
  - `src/lib/indexnow.ts`；后台保存商品的接口（加推送调用、写 `product_edited_<id>`、调 `clearStorefrontCache`）
  - `scripts/baidu-push.ts`、`scripts/indexnow-backfill.ts`（新，一次性脚本）
- 验收：
  - `/sitemap.xml` 是 index，6 个子文件都能访问，`xmllint --noout` 通过，总条数和改造前相当（差异能逐条解释）
  - lastmod 符合 §1.3：商品段没有 lastmod，新闻取 max(publishedAt, reviewedAt)
  - 渠道站 `/sitemap.xml` 是空 urlset（或 404），不是空 sitemapindex；子文件 404
  - 两个 route 都是 `force-dynamic`，构建期 prerender 清单为空（`PRERENDER_STRICT` 不报错）
  - 改写后的 W1-6 和 `itest-jiema-catalog` 通过，原有断言（渠道为空、灰度期没有 /jiema、DB 挂掉时静态部分照出）都在
  - 成交不触发 IndexNow，只有后台保存触发
  - GSC 里 6 个子文件都显示「成功」
- 风险：sitemap 出错会影响全站发现。上线当天就在 GSC 里核对；回滚按标签切回旧镜像。

---

**Ha · 数据层缓存**（P1，构建批 2，1 天；E1 的前置条件）

- 内容：§6.6-8 第一步。只用 `storefrontCached`，不用 `unstable_cache`、`revalidateTag`、`export const revalidate`。
- 文件：`src/lib/landing/products.ts`、首页和新闻的数据读取函数、后台保存商品和上下架的接口（调 `clearStorefrontCache`）。
- 验收：
  - `check-tenant-boundary.mjs` 通过
  - 后台改价、上下架后 ≤60 秒生效
  - 渠道站和主站价格互不串（`itest-tenant/cross-tenant.ts` 通过）
  - DRAFT 店面的预览查询不进缓存
  - 数据库挂掉时的降级路径不变
- 风险：缓存到旧价。TTL 只有 30–60 秒，且后台保存会主动清理。

---

**Hb · 边缘缓存**（P3，只改 Cloudflare 规则，不构建；E1 上线满 2 周后评估）

- 内容：§6.6-8 第二步。站长在 Cloudflare 里配规则；部署手册加「新镜像起来后 purge `/news*`、`/chongzhi*`」。
- 验收：
  - 匿名重复请求 `/news/*` 时 `cf-cache-status: HIT`
  - 带 `RSC: 1` 请求头的请求 `cf-cache-status` 是 BYPASS
  - 客户端点站内链接跳转正常，不出现 RSC 原文
  - 部署后 5 分钟内没有 ChunkLoadError
  - 登录用户看到的页头和价格正确
- 风险：缓存到错误价格或登录态。先只开 `/news/*` 观察一周，再考虑 `/chongzhi/*`；出问题直接关掉规则即可。

---

**I · 可选项**（P3，构建批 4）

- llms.txt 事实索引；百度时间因子；/support 的 FAQPage 去重；Product 的 `hasMerchantReturnPolicy`；已下架商品 ID 的 301（`next.config.js` 的 redirects，`statusCode: 301`，要随发版）。
- 验收里的「301」一律写成「301 或 308」：App Router 的 `permanentRedirect()` 返回 308，Google 对两者一视同仁。

### 8.3 排期

| 周 | 日期 | 构建批 | 包 |
|---|---|---|---|
| W0 | 09-30 – 10-07 | 批 1 | O（含基线）、A、B；接码会话：AJ 并进接码首发 |
| W1–2 | 10-08 – 10-21 | 批 2（10-08 前后） | C、G、Ha、D1a；接码会话：F1 随「开放全部用户」 |
| W3–6 | 10-22 – 11-18 | 批 3（10-29 或之后） | D1b（含 AI 引用页第一步）、D2、E1；接码会话：F2 第 1 批（开放满 1 周、过闸） |
| W7–12 | 11-19 – 12-23 | 批 4（11-19 前后） | D3（AI 引用页第二步）、E2、I；Hb（不构建）；接码会话：F2 第 2 批；12-23 复盘 |

---

## 9. 风险、红线与需要站长决定的事

### 9.1 降权风险

| 风险 | 触发条件 | 防线 |
|---|---|---|
| scaled content abuse（按站点整体判定） | 服务页、话题页批量上线，或模板化严重 | §1.7 闸门（含本站真实订单和收码数据）、数量上限、分批；唯一性脚本只算专属区块；10-08 之前不上 |
| doorway | 同一意图拆成多页；出现只能跳转、不能下单的中间页 | §2.1 一个词簇一个页，每个 SKU 一个主落地页；服务页靠独有正文和实时价格表，价格表一次点击到达确认面板；§24-3 自查 |
| 自我竞争 | 多页的 title、H1 争同一个意图（例如「Pro 还是 Max」） | §2.2 指定唯一承接页；其他页只在正文里链过去；/products 改成导航型 |
| 关键词堆砌 | 号码列表、国家名堆砌 | 永远不做号码页；国家/地区区块只放白名单常量里的前 N 个 |
| 被 AI 引用的页面退化 | 在基线之前、或一次性大改 /chongzhi、chatgpt-plus | 先测 4 周基线；第一步只换 title 和 description；第二步只在现有段落之后追加；改前改后存快照；AI 来源会话和 OpenAI 爬虫抓取按周监控 |
| 信号自相矛盾 | layout 写 canonical；Disallow 和 noindex 叠加用在同一页；lastmod 是噪声 | §1.3 总表；lint 脚本；附录 B-2；商品页 lastmod 不写 |
| 旧快照长期存在 | http、www、noindex 页残留在 Bing 索引里 | §1.11；IndexNow 回推；`Allow: /lookup$`；Bing Block URLs 只作过渡 |
| 抓取压力拖慢小机 | 分类分页增加抓取量 | Ha 缓存先于 E1 上线；深度分页只保留一套，并且只列可索引事件；上线 2 周看抓取统计和负载，再决定 Hb |
| 部署事故恢复慢 | sitemap、根 layout 这种全站级改动出错 | 构建前打回滚标签，出事秒级切回旧镜像，不用重新构建 |

### 9.2 合规红线（违反的后果比降权更严重）

1. **大事记**：
   - 不用新闻类措辞，不用 NewsArticle；H1、面包屑不用「日报」做栏目名
   - 不署真人名
   - 不转载，不用原文配图，不开评论，不设 AI 输入入口
   - 6 处 AI 标识一处不少；AI 起草的导语、正文不写成「人工撰写」
   - 不为了流量放宽选题黑名单（SKILL §1、§6、§10）
   - 商业入口做成独立区块，标「广告 · 本站服务」，不进 Article JSON-LD（《互联网广告管理办法》第九条）
   - 话题页写明第三方整理、非官方页面（反不正当竞争法第七条）
2. **接码**：
   - 不写「批量 / API / 租号 / 过风控 / 绕过实名 / 匿名 / 成功率 / 全额退款」
   - 不出现国内平台名，不出现上游品牌、上游代码
   - 地区按 D44 命名
   - 不改条款文字
   - 灰度期不收录，也不在任何公开页出现入口（反电信网络诈骗法第十四条、第三十一条；D25、D26、D28、D44、Q6）
   - **不链接账号类商品和 KYC 代办**；不原样引用平台的拒绝提示，不承诺能解决报错；不暗示可以挑号码类型
   - 不参与推广人招募
3. **充值**：
   - 不冒充官方；不写「在 chatgpt.com / claude.ai 上兑换」
   - 不用最高级；官方价和本站价并列时不加划线价、「省 X%」
   - 不编造数字、评分和成交动态（左下角成交弹窗下线）
   - 写到开票必带 6%
   - 只写支付宝
   - 不写「下单填邮箱」
   - 不承诺不封号（广告法第九、十一、二十八条；反不正当竞争法第七条、第九条；电子商务法第十七条）
4. **账号类商品和 KYC 代办**：本轮不扩张；claude-kyc 的 title、description、H2 维持原样，措辞保持「协助完成、需要你本人配合」[R5 §3.4]。
5. **渠道站**永远 noindex；不开关键词子域名。
6. **站外**：推广人文章必须标「广告」，只推充值 SKU，遵守书面文案规范；公众号推文带 AI 标识并在后台人工勾选。

### 9.3 品牌风险

- 「贝果科技」这个品牌词被台湾同名公司和 MoBagel 占住。首页和关于页统一写「贝果科技 BigoLab」，站外也统一用这个写法。
- 竞品互相举报可能直接触发人工处罚 [R4 §1.2]，规则要按字面执行。虚构的成交动态是最容易被截图举报的一类。
- 旧快照里「代开平台」「1000+ 用户」「微信支付」这类说法要尽快清掉（§1.11），否则 AI 回答里可能引用过时的错误信息。

### 9.4 需要站长决定的事（每条附默认建议）

| # | 问题 | 默认建议 | 理由 |
|---|---|---|---|
| 1 | 「AI 资讯」能不能进 /news 的 title | **不进 title**，只在 description 里出现一次 | 合规上属于「慎用」；通用词被大站占住，放弃的机会不大 |
| 2 | 日报页用不用「AI 日报」 | **只放进 `<title>` 承接搜索**；面包屑写「每日速览」，H1 写「{日期} AI 动态速览」，不做成栏目名 | Bing 用户按日期搜「ai日报」；R5 §1.2 把「日报」列为慎用，现有 UI 用的就是「每日速览」 |
| 3 | 建不建 Telegram 服务页 | **首批不建**；首页和 /jiema 服务端直出的热门区块也不放；第 2 批之后结合律师意见再议 | 境外语境是开盒、警方提醒 |
| 4 | 建不建美国国家页 | **本轮不建**，先放在 /jiema 的 H2 区块 | 独有信息少；12 周后看 GSC 的展示量 |
| 5 | 建不建 claude-code 新页 | **建**，只承接额度、订阅方案、API 与订阅的区别 | [kw6] 充值 10、价格 9、订阅 9，站内还没有承接页 |
| 6 | 建不建 Gemini / Google AI Pro 页 | 有在售 SKU 才建 | 没有 SKU 就是空页 |
| 7 | 建不建「大模型排行榜」页 | **不建** | 数据来源和授权问题 |
| 8 | 公告弹窗怎么改 | **改成底部固定、可关闭的提示条**，只显示标题和「查看详情」，点开看全文；pinned 也只用提示条 | LCP、体验和布局偏移（§6.6-2） |
| 9 | 页脚和 /about 放不放营业执照信息，Organization 加不加 taxID | **放**。需要站长提供统一社会信用代码 | 电子商务法第十五条；这是最强的可核验信任信号 |
| 10 | 标题写不写「2026」 | 站长承诺每月真实核对一次后才写，由该页自己的核对日期渲染；在此之前不写 | 人为改日期是负面信号 |
| 11 | 接码服务页显示哪些本站数据 | **显示**中位到码时长（样本 ≥30 单）和近 30 天下单最多的国家/地区，注明样本量和统计区间；**成功率百分比不显示** | D26 只禁止成功率百分比；这类统计数字对 GEO 有利 |
| 12 | 在订单上记录入口来源（精确的转化口径） | **先不加**，用代理口径；3 个月后再议 | 需要改表结构，按 schema 流程先 db push 再换镜像 |
| 13 | 边缘缓存开不开 | E1 上线满 2 周后评估；开的话只用 Cloudflare Cache Rules，先开 /news | 需要先核实 cookie 对服务端渲染的影响；不改 nginx（§6.6-8） |
| 14 | D37 的「暂不支持开票，可联系客服开票处理」前后矛盾 | 建议改成「暂不支持自助开票，如需发票请联系客服处理」，由站长定稿；在此之前维持原文 | AI 可能把原句理解成自相矛盾；这是站长已经拍板过的措辞，要改须站长同意 |
| 15 | 隐私政策里「下单时填写的邮箱」 | 改成「账号邮箱」，或写明适用场景；同步更新 `PRIVACY_UPDATED_AT` | 与「下单不填邮箱」矛盾 [R5 §7-2]；该常量营销模块也在用，要和营销会话协调 |
| 16 | 大事记每小时产量要不要降 | **维持现状**，先排查离题条目是哪条路径放进来的；8 周后如果事件页收录率 <10%，而聚合页收录正常，再评估降频 | §28 叫停了收缩 sitemap；现在没有 GSC 数据，不宜先砍 |
| 17 | 推广人计划是否定向招募教程作者 | **是，但只推充值 SKU**：给书面文案规范、强制标「广告」、链接加 sponsored、违规撤稿并扣回返现；接码、账号类、KYC 不参与 | 能接住 UGC 教程上的流量；广告法第四条、《互联网广告管理办法》第九条；接码教程会构成引流推广 |
| 18 | 已下架的 /products/11、13、22 | 能确定产品线的 301 到对应落地页，其余维持 404 | 保留旧链接的价值 |
| 19 | **「会员」能不能用在 ChatGPT 上**（推翻任务书的既有结论） | **暂不推翻**：ChatGPT 页的 title、H1 不用「会员」，首页 H1 写「ChatGPT、Claude 充值」。站长确认后，可以放进 chatgpt-plus 的 description 和 H2「GPT Plus 与 ChatGPT 会员是一回事吗」 | 任务书列为必须遵守的结论是「会员对 ChatGPT 不成立」。新数据：`chatgpt会员` 09-19 返回的是亚美尼亚语联想 [R3 §2.1]；09-30 复测为 9 条，联想是「chatgpt会员购买 / 价格 / 怎么买」一类 [kw6 result2.tsv]。数据支持推翻，但要站长拍板 |
| 20 | **左下角成交弹窗怎么处理** | **整体下线**（P0，B 包）；信任信号用首页已有的「累计成交 N 笔（本站订单统计）」 | 城市是假的、时间是随机的、不足 5 条时混入写死的假订单：虚构成交细节（电子商务法第十七条、反不正当竞争法第九条）。备选：只显示真实商品名和真实下单日期，不显示城市，移动端首屏不弹（注意 `itest-security.ts:278` 断言接口不下发 createdAt，要改成只下发日期并同步测试） |
| 21 | **账号类商品和 KYC 代办的合规定性** | 本轮不扩张，不做 SEO；「claude kyc」不列入跟踪词；claude-kyc 页维持原样。另外建议在 D1a 里删掉 claude-zhuce FAQ 的「如果你需要很多个，请直接联系客服说明用途」（`claude-zhuce/page.tsx:121`）：在同时卖接码单品和普号的页面上，这句话就是批量买号的招揽。**请站长或律师确认** | 反电诈法第三十一条同时覆盖「非法买卖互联网账号」和「提供实名核验帮助」[R5 §3.4]；现有 description 卖的是「￥180 的活人认证代办（失败不收费）」（`registry.ts:136`） |
| 22 | 接码服务页的开页门槛 | 近 30 天该服务本站已付款单 **≥20**，内部收码成功率 **≥50%**（只用于决策，不展示） | 历史激活成功率只有 31%（接码设计 D3、D7）；成功率低的服务建页，带来的是退款和跳出 |
| 23 | 首批服务页候选里要不要放 WhatsApp | **放进候选，但和其他候选一样按内部数据和 SERP 语境决定** | 它和 Telegram 一样境内不可用；排除 Telegram 的依据是犯罪语境，不是「境内屏蔽」 |

### 9.5 数据局限

- **联想条数不是搜索量**，没法比较两个都打满的词谁的量更大。要知道量，得等 GSC 的展示数据 [R3 §8]。
- **Google 搜索结果页是从以色列出口 IP 看到的**，和国内翻墙用户看到的相近，但不完全一样。Bing 的 `site:` 和百度的搜索结果页都出了验证码，**没有破解**，已换用其他数据源 [R2 §0][R3 §5]。
- **GSC 和 Bing 后台的实际数据拿不到**，包括覆盖率、「已抓取 - 尚未编入索引」等。所以 §0.4 的 KPI 基线要等 O 包完成后补齐。
- **本文补测 [kw6] 只查了 Google 下拉**，没有查 Bing 和百度；已按 R3 口径重算（`seo/kw6/recount.tsv`）。「ai会员」「ai订阅」没有做 SERP 实看，是 hub 改名的前置条件。
- **OpenAI 的手机验证规则只看到检索摘要**：help.openai.com 正文直接抓取返回 403，没有逐字核对；/jiema/openai 动笔前要人工核实（§3.3）。

---

## 附录 A · 为什么不建「AI 会员代充」页，也不叫「AI 大事记新闻」

- **「AI 会员代充」**：
  - `ai会员代充` 和 `ai代充` 在 Google 下拉里联想数为 0。09-19 和 09-30 两次实测结果相同 [R3 §2.1]。
  - 同一类用户实际搜的是 `ai会员` 和 `ai订阅`，联想集中在比价、价格对比、充值 [kw6]。所以现有 hub 改名为「AI 会员价格对比与充值」（改名前先实看 SERP，AI 引用页两步走的第一步只换 title），不新建页面。
  - 「代充」只承接「靠谱吗」这类信任审查的搜索，放在 hub 正文里回答。本站有可核验的经营主体和发票，这部分用户的转化率反而高（§24-1）。
- **「AI 大事记新闻」**：
  - 本站没有互联网新闻信息服务许可。合规策略是让内容不落入「新闻信息」的定义，而 title、H1、结构化数据属于站点对自己的描述，是最容易被当作证据引用的部分 [R5 §1.1]。
  - 从搜索角度看，`ai新闻` 的前 10 被持证媒体和大型聚合站占住，本站拿不到。真正能拿到的是「实体 × 最新 / 更新」和带日期的日报 [R3 §3.2、§5.2]。放弃「新闻」这个词，几乎没有流量损失。

## 附录 B · 对 5 份调研报告的更正与补充

| # | 原说法 | 更正或补充 | 依据 |
|---|---|---|---|
| B-1 | 「Googlebot 每次抓取都是首访，都会看到公告弹窗」[R2 §5 P0-1] | Googlebot 渲染页面时遵守 robots.txt。弹窗的数据来自 `fetch('/api/announcement')`（`announcement-modal.tsx:89`），而 `/api/` 被 Disallow，所以 Googlebot 大概率拿不到公告，弹窗不会渲染。对 Google「侵入式插页」判定的影响有限；受影响的是真人用户和实验室里测到的 LCP。**结论不变**：照样要改成不遮挡页面的提示条（本文定为底部提示条，§6.6-2） | robots.ts；Google 渲染服务遵守 robots 的规则 |
| B-2 | 「sitemap 的新闻 lastmod 用 updatedAt」（现状）；建议「把 updatedAt 传给 dateModified」[R1 §5、§11] | 热度重算每 15 分钟通过 `prisma.newsEvent.update` 写一次行（`pipeline.ts:1913`），浏览、分享也会自增计数（`api/news/view`、`share`），updatedAt 随之变化。lastmod 就成了噪声，Google 只会采用「一贯准确」的 lastmod [R4 §1.6]。改为 `max(publishedAt, reviewedAt)`。同类噪声也出现在商品上：`Product.updatedAt` 每笔付款都会刷新（`vmq.ts:1588`），所以商品页的 lastmod 不写 | 代码核对 |
| B-3 | 「/support 与 /jiema 的 FAQ 重复标注」列为 P0 [R1 §0 #5] | FAQ 富结果 2026-05-07 下线，相关文档 06-15 删除 [R4 §0]。重复标注既没有收益也不会被罚，降为 P2 顺手做 | R4 |
| B-4 | 「可以加一个显式的 AI 爬虫 UA 分组，内容与 `*` 相同，纯文档作用」[R1 §4] | robots 的匹配规则是：一个爬虫只遵守和它最匹配的那一组，不会叠加 `*` 组的规则。单列分组后，任何一条 Disallow 漏抄，私密或带 token 的路径就对该爬虫放开了。收益为零，风险真实存在，**不加** | Robots Exclusion Protocol（RFC 9309）组匹配规则 |
| B-5 | 「ai会员充值 G0」「AI 会员充值无实测记录」[R3 §2.1][R1 §9] | `ai会员` 本身的联想里真实出现了「ai会员充值」「ai会员价格对比」「ai会员比价」，只是这些长句自己没有更长的延伸。所以 hub 的 H1 保留「AI 会员充值」、title 加上「价格对比」都有联想数据支持。但「价格对比」的意图可能是跨区官方价比较（§2.7），改名前仍要实看 SERP | [kw6] |
| B-6 | 「分页第 2 页起可以 noindex,follow」[R1 §11] | 长期 noindex 的页面，Google 最终也不会再跟进上面的链接，抓取通道会断。改为 index,follow + canonical 指向自己，但分页页不进 sitemap | Google 分页最佳实践（每页自有 canonical）；Google 搜索关系团队的公开说明：长期 noindex 最终按 nofollow 处理 |
| B-7 | 「服务页展示近 30 天成功收码率」[R4 §3.1] | 和 D26「不显示成功率百分比」冲突。改为不显示百分比，只在样本 ≥30 单时显示中位到码时长（待站长确认） | 短信接码设计 D26 |
| B-8 | 「Organization 常量可以集中到一个法务文件」 | `lib/legal.ts` 被营销模块引用，属于共享文件，**不往里放**。沿用 `graph.ts`，或新建 `lib/seo/entity.ts` | 代码核对 |
| B-9 | /jiema 标题建议用「短信接码平台」[R2 §5 P1-5] | 否决。「接码平台」在 Bing 国内版前 10 全是犯罪报道，而且和反电诈法第十四条第（三）项的法条表述只差「批量」两个字 | R3 §5.3、R5 §3.2 |
| B-10 | GEO 论文的「加统计数字可见度约 +33%」「引用来源约 +28%」[R4 §4.1] | 这是 GEO-bench 模拟引擎上的实验结果，不能直接套到本站。本文只写「方向性、预期有帮助」，不写百分比；GEO 的第一指标改为 nginx 日志里 OpenAI 爬虫的抓取（§4.3-8） | 评审意见；R2 §4（被引用的页两家搜索引擎都没收录） |
| B-11 | 「服务页首批按联想热度挑」（本文初稿），R4 §3.1 原有「本站近 30 天有真实订单、实测指标拿得到」的门槛 | 恢复 R4 的门槛，并具体化为「近 30 天已付款单 ≥20、内部收码成功率 ≥50%」（§1.7 条件 ④，站长定） | 接码设计 D3、D7（历史成功率 31%） |

## 附录 C · 修改大事记页面前的 SKILL.md 自查

对照 `.claude/skills/ai-news-pipeline/SKILL.md`，本方案对大事记的全部改动：
- 分类页、话题页、分页、结构化数据、标题模板、「广告 · 本站服务」区块、IndexNow 过滤、离题条目排查（按排查结果修分诊路径或加兜底），都属于 §10 以外的「信源、评分、分类文案、UI」常规迭代。
- **没有**放宽 §1.2 的选题黑名单。
- **没有**去掉 §6 的任何一处 AI 标识；新增页面同样带 meta 和徽章；话题页导语由 AI 起草、人工核对，纳入该页的 AI 标识范围，不写成「人工撰写」。
- 商业入口只放在标「广告 · 本站服务」的独立区块里，和 AI 摘要、AI 免责声明视觉分开，不进 Article JSON-LD。
- **没有**使用原文配图。
- **没有**开评论或 AI 输入入口。
- **没有**改作者署名。
- 标签只用 `TAG_WHITELIST`；分类固定为 6 个（SKILL §4）。

## 附录 D · 来源索引

- [R1] `seo/1-代码与技术SEO审计.md`：代码行号、路由总表、实施清单 A–F
- [R2] `seo/2-线上与收录审计.md`：收录现状、PSI、页面体检，原始数据在 `seo/raw/`
- [R3] `seo/3-关键词实测与SERP.md`：1344 词 × 3 家搜索引擎，原始数据在 `seo/3a-联想原始数据.tsv`、`seo/kw/`
- [R4] `seo/4-成熟方案与大厂实践.md`：Google、Bing、百度的规则，同行的做法，GEO 证据，来源 S1–S66
- [R5] `seo/5-合规与业务约束.md`：禁用词和推荐写法总表、踩过的 28 个坑、渠道站
- [kw6] `seo/kw6/result1.tsv`、`result2.tsv`：本文补测，脚本为 `seo/kw6/check.py`；按 R3 口径重算的结果在 `seo/kw6/recount.tsv`（脚本 `seo/kw6/recount.py`）
- 仓库：`docs/交接-进度与待办.md` §19、§23、§24、§26、§27、§28、§37；`docs/短信接码-设计.md` §0、§1.3、§1.4、D2、D3、D7、D13、D25、D26、D28、D33、D37、D44、Q6；`.claude/skills/ai-news-pipeline/SKILL.md`；`docs/2026-09-24-推荐有奖·抽奖·发票关联-部署说明.md`（回滚标签的惯例）
- OpenAI 帮助中心（2026-09-30 检索摘要，正文 403 未能直读）：[Phone verification](https://help.openai.com/en/collections/8471299-phone-verification)、[Phone-only signups](https://help.openai.com/en/articles/10388702-phone-only-signups)


---

## 评审处理记录（v1.0，2026-09-30）

67 条意见逐条对照代码（worktree `ai-service-shop-jiema`，HEAD `244831c`）和调研原件核实。结论：**采纳 64 条，部分采纳 3 条（#20、#36、#59），不采纳 0 条**。部分采纳的写明了理由。行号按本次核对的实际位置写，和意见原文不一致的在「核实」里注明。

| # | 严重度 | 意见摘要 | 结论 | 核实与处理 |
|---|---|---|---|---|
| 1 | critical | 漏了 LiveOrderNotification（假城市、随机时间、写死的假订单） | 采纳 | 核实：`(shop)/layout.tsx:68` 挂载；`floating-widgets.ts` 只在 /jiema、/wallet 让位；`FAKE_CITIES`（`api/orders/recent/route.ts:10、50`）、`getRelativeTime`（`live-order-notification.tsx:43`）、`FALLBACK_ORDERS`（同文件 19–28 行）都属实。处理：P0 整体下线（§0.3 #29、§6.6-1、§7.2、§7.3、§9.4 #20、B 包）。实现上组件恒返回 null、删掉三个常量；**不改** `public.ts` 的 `liveOrders` 开关（`check-tenant-math.ts:296` 断言 PLATFORM 全开），也不改 layout（营销会话的文件）。验收加 grep |
| 2 | major | AI 引用页在基线之前就改；hub 的 H2 顺序规定与「不改顺序」矛盾；「怎么判断卖家」已存在；hub H1 也改了 | 采纳 | 核实：`chongzhi/page.tsx:196-336` 的 H2 顺序、`:292` 的「怎么分辨一个代充卖家靠不靠谱」、hub H1「AI 会员充值与账号服务」（`registry.ts:80`）都属实。处理：P0 建基线，满 4 周（10-29）后分两步：先只换 title / description（D1b），2–4 周后把新区块追加在现有段落之后（D3）；删掉 hub 的 H2 顺序规定；H1 维持；「怎么判断卖家」只补段落（§0.1-6、§0.3 #6、§1.4、§3.2-B） |
| 3 | major | Claude 族四页争「Pro 还是 Max」；claude-code 复用 SKU 导致面包屑多归属 | 采纳 | 「Pro 与 Max 怎么选」只归 claude-max；claude-code 的 title 改为评审建议的「Claude Code 订阅：Pro 额度够用吗、Max 方案与价格」；claude-pro 的 description 去掉「Pro 升 Max」；claude-code 价格区只放摘要；每个 SKU 一个主落地页（§0.3 #7、§1.4、§2.2、§3.3） |
| 4 | major | /products 没进关键词映射，和 hub、chatgpt-plus 争词 | 采纳 | 核实 `products/page.tsx:82`、`products-client.tsx:163-165` 属实。§2.2 补一行，title 改「全部商品与价格 - 贝果科技」，H1 改「全部在售商品与价格」，放进 D1b |
| 5 | major | 服务页闸门去掉了「本站真实订单」门槛；WhatsApp 入选理由不一致；「人工正文」名不副实 | 采纳 | 核实：接码设计 D3、D7「历史激活成功率只有 31%」；`catalog.ts:1073` 只预热 hotRank 非空的前 40 个服务。处理：闸门加条件 ④（近 30 天已付款单 ≥20、内部收码成功率 ≥50%，站长定，不展示）；首批按内部数据重排；④ 改名「经人工逐条核对的正文」；本站独有数据作页面主体；白名单必须在预热清单里（§1.6、§1.7、§9.4 #22、#23） |
| 6 | major | /jiema/openai 把「注册必须手机号」当前提；description 写 Codex 与裁决 #11 冲突 | 采纳 | 检索 help.openai.com（摘要）：手机验证文档主要针对首次生成 API key，仅手机号注册只在部分国家作为可选方式；正文抓取 403，没能逐字核对。处理：title 改问句，description 删 Codex，动笔前人工核实并外链；核实下来不需要就不建、改在 codex-jiema 加一节（§0.3 #11、§3.3） |
| 7 | major | /jiema/google → google-zhanghao「看成品号」桥接 | 采纳 | 同 #26 |
| 8 | major | 缓存优先级前后不一致；依据用了 Google 机房的 TTFB | 采纳 | 核实 R1 §13（第 312 行）国内实测 TTFB 1.64–3.1s。数据层缓存 Ha 提到 P1、作为 E1 前置；边缘缓存 Hb 放 P3、E1 满 2 周后评估；决策依据改用国内实测。缓存机制按 #47 改（§0.3 #19、§6.6-8、§0.5、§8.3） |
| 9 | major | 新抓取通道没排除薄页；三套分页冗余 | 采纳 | 深度分页只保留「分类分页 + 日报」，只列可索引事件（共用 `shouldNoindexEvent`）；/news 不做深分页；日报不列薄页；月度归档改按天分组的 Top 列表（§0.3 #12、§1.5） |
| 10 | major | `?svc=<code>` 暴露上游代码；首页热门服务会挂 Telegram | 采纳 | 核实 `jiema-config-schema.ts:97` 默认 `['dr','acz','tg',…]` 属实（另注：`wx` 在上游代码里是 Apple，不是微信，`services-cn.json:14`）。`?svc=` 改用本站 slug；热门区块取 SEO 白名单常量；lint 加断言（§0.3 #33、#34，§1.2、§1.6、§3.4） |
| 11 | minor | 商品页 lastmod 用 updatedAt 是噪声；新闻「第一个非空值」公式不对 | 采纳 | 核实 `vmq.ts:1588` 付款时 `sales increment`，后台改订单写在 `admin/orders/[id]/route.ts:524、743`（意见写的 758 是渠道 listing 的扣减）。商品段不写 lastmod；新闻改 max(publishedAt, reviewedAt) 并写明局限（§0.3 #15、§1.3、§6.2、附录 B-2） |
| 12 | minor | 开票 FAQ 在十几页重复并标注 | 采纳 | 另外核实到：hub **已经有**完整的开票问答（`chongzhi/page.tsx:89-90`，带 6%），chatgpt-plus、grok-super、google-zhanghao 也各有一条。处理：不再新增任何开票 FAQ，hub 那条是唯一完整出处；开票口径进事实卡；现有几条维持（§1.4、§3.1、D1a） |
| 13 | minor | 同一 URL 两个页面实体；接码页 Service 引用 ORG 却不输出 Organization | 采纳 | 不新增 WebPage，字段挂到带 `@id` 的 FAQPage；/jiema 与服务页同页输出 Organization；check-jsonld 加悬空 `@id` 断言（§0.3 #16、§4.1） |
| 14 | minor | 禁用词对全站生效，范围太宽 | 采纳 | 按路由分组，LLM 生成的标题整体豁免失败判定，「API」在充值页的说明语境豁免（§3.4；与 #35、#54 合并处理） |
| 15 | minor | description 写「截至 MM-DD」；事实卡日期天天变 | 采纳 | description 不写日期；价格格子里的时间取价格快照的真实时间（接码取 catalogSnapshot 的 `updatedAt`，`catalog.ts:789`）。充值没有「最近一次改价时间」字段，先不写日期，等后台保存时记 `product_edited_<id>` 再补（§3.1、§4.3） |
| 16 | minor | `LANDING_REVIEWED_AT` 全站一个常量 | 采纳 | 核实 `registry.ts:66`。拆成每页一个 reviewedAt，hub 取子页最新（§1.3、§5.2、D1a） |
| 17 | minor | 分页标题重复、导语重复、`?page=1`、截断不看词界 | 采纳 | 分页加「第 N 页」；导语只在第 1 页；`?page=1` 308；截断取首条 headline「：」前的主体加动作、按词界截（§1.3、§1.7、§3.2-H） |
| 18 | minor | Jaccard 阈值太宽；字数门槛鼓励凑字 | 采纳 | 只对专属区块算、阈值 0.25，整页另设 0.5；字数门槛全部改成信息检查清单（§1.7、§3.1） |
| 19 | minor | B 包只靠弹窗做不到 LCP <2.5s；framer-motion 还有别的使用方 | 采纳 | 核实 header、announcement-modal、floating-contact、contact-modal（页脚也引用它）、live-order-notification 都 import framer-motion。B 包补新闻详情页图片；framer-motion 要做就全部一起改并用 bundle analyzer 验收，做不完就移出 B、C 的验收（§6.6-4、§6.6-5、B 包） |
| 20 | minor | 根 layout 还有 googleBot 的 index,follow，只删 robots 会让 404 仍然矛盾 | 部分采纳 | 观察属实（`layout.tsx:148-153`）。但按 #50，根 layout 的 robots 整体不改、从 A 包删掉这一项，404 的两条 robots 记为已知无害；lint 同时检查 robots 和 googlebot 两种 meta，404 页例外（§1.3、§3.4、§6.8） |
| 21 | minor | Bing Block URLs 约 90 天到期，Disallow 下读不到 noindex | 采纳 | robots 主站加 `Allow: /lookup$`，带参数形态仍被挡；Block URLs 只作过渡；放进 A 包（§1.3、§1.11、§6.3、§6.5）。另注：W1-6 的 robots 基线比对拿 `git HEAD`，提交前跑会报差异 |
| 22 | minor | kw6 口径和 R3 不同；台湾意图；「价格对比」可能是跨区比价；没看 SERP | 采纳 | 按 R3 口径（英文词元按词界）重算，结果在 `seo/kw6/recount.tsv`：只有 `claude code pro` 9→3、`ai大事件` 2→1、`bigolab` 2→0 变化。发票簇标为台湾意图为主、不作主词；`chatgpt pro 价格` 9 条里 6 条、`claude max 价格` 9 条里 5 条是跨区价格；hub 改名前实看 SERP，必要时补「各区官方价参考」（§2.1、§2.2、§2.7） |
| 23 | minor | 20 个跟踪词没定；对照组被污染；多包同时上线无法归因 | 采纳 | §0.4 列出 20 个查询串；对照组改为 claude-kyc、google-zhanghao（都已收录），测试期间完全不动；claude-zhuce 未收录，移出对照组；标题（批 3）和 C、G（批 2）错开 ≥2 周；主要看展示量和排名趋势，CTR 只作参考（§0.4、§7.6） |
| 24 | minor | GEO 效果数字说得太实；主要杠杆判断有偏差；网格不如陈述句 | 采纳 | 删掉百分比；nginx 日志里 OpenAI 爬虫的抓取作第一指标，Bing 作辅助；事实卡上方加总结句（§0.1-5、§4.3、§4.4、附录 B-10） |
| 25 | minor | 分诊已经有 `isAiRelated` | 采纳 | 核实 `pipeline.ts:617、778`。改成「排查后针对性修」（与 #59 合并，§0.3 #14、§5.3、E1） |
| 26 | critical | /jiema/google 链成品号，接码与卖号首尾相连 | 采纳 | 删掉桥接；§2.5、§7.4 写硬规则；C、D1a、F2 验收和 §3.4 lint 加断言：/jiema*、大事记详情和话题页不得有指向 google-zhanghao、claude-kyc 的 `<a>`，也不链「普号 / 成品号」锚点；google-zhanghao 只从 hub 和页脚进入，它指向接码的链接改中性或去掉（§0.3 #30） |
| 27 | major | claude-kyc 补「实名认证」、新增封号申诉 H2，搜索端呈现为「实名认证代办」 | 采纳 | 核实现有 description 含「￥180 的活人认证代办（失败不收费）」（`registry.ts:136`，意见写 138）。title、description、H2 全部维持；「封号了怎么办」移到 claude-pro，中性、不带 KYC CTA；「claude kyc」不列 ★；lint 补 KYC 词（§2.2、§3.3、§3.4、§9.4 #21） |
| 28 | major | /jiema/google 围绕 Google 的拒绝提示写，像在教人绕风控；「换号码类型」和 D26 冲突 | 采纳 | title 改为「谷歌注册需要手机号：用海外手机号接收 Google 验证码」，description 按建议重写，写明「号码能否通过由 Google 决定」；删掉「换号码类型」；手测第 7 问改「注册谷歌需要手机号怎么办」（§0.4、§3.2-F、§3.3） |
| 29 | major | GEO 示例「登录 chatgpt.com 兑换」与事实不符 | 采纳 | 核实 `chatgpt-plus/page.tsx:87、99`：到本站兑换页完成充值，iOS 档要提供 session。示例改正；D1a/D1b/D2/D3 验收加「问答式首句逐字核对，不得出现在 chatgpt.com / claude.ai 上兑换」（§4.3-2、§8.2 共同验收） |
| 30 | major | codex-jiema →/jiema/openai 的「更便宜」「嫌实体卡贵」引人误解 | 采纳 | 核实 D13（只规定 dr 组合 ≥ 旧单品 × 0.8）、D26（不显示也不能指定号码类型）。锚文本改中性，移出「虚拟号为什么被拒」一节；/jiema hub 不讲「虚拟号与实体号的区别」，只写「不区分、不能指定」（§1.6、§2.4、§2.5、§7.4） |
| 31 | major | codex-jiema 新 title 截成「美区实体卡」 | 采纳 | 改为「……美区实体卡接码」；lint 加「实体卡」后必须紧跟接码 / 验证码 / 收码（§3.3、§3.4） |
| 32 | major | 热门服务、热门国家/地区由 hotRank 驱动，会直出 Telegram 和 +86 | 采纳 | 与 #10 合并：SEO 区块取白名单常量，排除 tg、国内实名类、金融/支付/加密类和 +86，与 hotRank 脱钩；C、F1 验收加断言（§0.3 #34、§1.6、§1.10） |
| 33 | major | 大事记 CTA 未标「广告」，还有「其余 → hub」兜底 | 采纳 | 独立区块、显著标「广告 · 本站服务」、不进 Article JSON-LD；取消兜底；映射永不指向 claude-kyc、google-zhanghao（§0.3 #31、§1.5、§2.5、§7.4） |
| 34 | major | 推广人招募只要求 sponsored 和披露 | 采纳 | 书面文案规范、强制标「广告」、只推充值 SKU、违规撤稿扣返现；接码不参与（§0.3 #24、§5.5、§9.4 #17） |
| 35 | minor | 禁用词表比 R5 §6 窄；分区不对；6% 只查充值页；D44 没进 lint | 采纳 | 按 R5 §1.2、§2.2、§2.4、§3.2、§6 补齐；接码违规词只查 /jiema* 和 codex-jiema、claude-zhuce（「API」在充值页豁免）；大事记另用采编词表；6% 扩到所有非 /jiema 页和 JSON-LD；/jiema* 不得出现「可开票」；加 D44 断言（§3.4） |
| 36 | minor | 根 layout 默认 title、description 仍含「代充」、不带 6%；/about「账号不经手」与事实不符 | 部分采纳 | 核实 `layout.tsx:23、34`、`about/layout.tsx:17`、`chatgpt-plus/page.tsx:99`、`grok-super/page.tsx:78` 属实。/about 按建议重写。根 layout 的默认文案改成品牌中性、不写开票，但**不写短信接码**：它是兜底值，灰度期（接码未开放）也会被继承，写了就等于在收录页上宣传未开放业务（与 #52 一致）（§3.2-J、§6.8、A 包） |
| 37 | minor | 面包屑和 H1 把「日报」做成栏目 | 采纳 | 核实现有 UI 用「每日速览」（`digest/[type]/[period]/page.tsx:110`）。面包屑改「每日速览」，H1 改「{日期} AI 动态速览」，「AI 日报」只留在 `<title>`（§1.8、§3.2-H、§9.4 #2） |
| 38 | minor | opinion H1「分析」像站方评论 | 采纳 | 改为「观点：AI 从业者公开观点摘录」（§3.3） |
| 39 | minor | 话题页「更新日志」易被误认为官方 | 采纳 | H1 下加非官方说明和官方外链，description 开头写「第三方整理」，不用对方 logo 与近似配色（§1.5、§3.2-G、§3.3） |
| 40 | minor | 用新数据推翻「会员对 ChatGPT 不成立」却没请站长拍板；首页 H1 自相矛盾 | 采纳 | 放进 §9.4 #19（附 kw6 数据），确认前按既有结论执行；首页 H1 改「ChatGPT、Claude 充值 · …」（§0.3 #2、§3.3） |
| 41 | minor | `?svc=` 仍写上游代码 | 采纳 | 与 #10 合并：`?svc=` 收本站 slug，`?s=<code>` 只兼容；国家/地区参数同理，由接码会话评估（§1.2） |
| 42 | minor | AI 起草却称「人工」 | 采纳 | 统一改称「AI 起草、人工逐条核对（核对于 {reviewedAt}）」，话题页导语纳入 AI 标识范围；闸门写成「经人工逐条核对并记录 reviewedAt」（§1.5–§1.7、§5.1、附录 C） |
| 43 | minor | 公众号没提 AI 标识和标题约束 | 采纳 | 文首文末写 AI 摘要说明、后台人工勾选 AI 生成标识、标题不得用新闻类词（§5.5） |
| 44 | minor | 价格对比表的呈现方式没规定；「Claude Max 价格：¥x」会被当成官方价 | 采纳 | 表头写明美元官方价（以官方为准、核对日期）与人民币本站价（不含税），不加划线价、原价、「省 X%」；拼车一节只写标准；claude-max title 改「充值价」（§1.4、§3.1、§3.3） |
| 45 | minor | 接码事实卡付款格漏了余额 | 采纳 | 改为「支付宝或站内余额，登录后下单」，按 `canUseForJiema` 渲染（接码上线时充值默认关，余额是否可用取配置）；充值页维持「支付宝，登录后下单」（§4.3、§3.3） |
| 46 | critical | AJ 把 robots 挪出 layout，/jiema/terms 灰度期会变成可收录 | 采纳 | 核实 `terms/page.tsx` 用静态 metadata、第 19 行注释写明 robots 继承 layout；`jiema/layout.tsx` 的 `generateMetadata` 现在按 `jiemaPublicOpen` 给 robots。处理：layout 保留 fail-closed 的 robots 默认值，只挪 canonical；子页只能更严；AJ 验收加「灰度配置下 /jiema、/jiema/terms、服务页路径都是 noindex」，写进 `itest-jiema-terms.ts`（§1.3、AJ 包） |
| 47 | major | `unstable_cache` 被边界检查禁止，构建会失败；§0.3 与路线图优先级矛盾 | 采纳 | 核实 `check-tenant-boundary.mjs:611-613`（规则 9）、`package.json` 的 prebuild、`storefront/cache.ts` 的 `storefrontCached` / `clearStorefrontCache`。改用 `storefrontCached`，按名清理，DRAFT 预览不进缓存；覆盖首页区块、新闻计数、接码统计；优先级统一为 P1（§0.3 #19、§6.6-8、Ha 包） |
| 48 | major | Cloudflare 边缘缓存漏了 RSC、chunk 换名、nginx 继承坑、主机名 | 采纳 | 核实 `nginx.conf:285` 的继承警告、`docker-compose.yml` 的 force-recreate 注释。只用 Cloudflare Cache Rules、不改 nginx；限定 `bigolab.com`；排除 RSC 请求头和 token cookie；缓存键保留完整查询串；部署后 purge；验收三条（§6.6-8、Hb 包） |
| 49 | major | 删 `app/sitemap.ts` 会让两份 itest 在 import 时崩；空 sitemapindex 不合 XSD | 采纳 | 核实 `wp1.ts:510`、`itest-jiema-catalog.ts:534`、`Dockerfile:57-58`。抽出 `sitemap-entries.ts`，两份测试改写列为必做；渠道维持空 urlset；route 写 force-dynamic；xmllint 校验。另外发现 W1-6 的基线比对拿的是 `git HEAD`（`wp1.ts:99-110`），已写进注意事项（§0.3 #20、§6.2、G 包） |
| 50 | major | `wp1.ts:478` 断言主站 robots 和 googleBot 都是 index | 采纳 | 核实属实。根 layout 的 robots 保持原样，从 A 包删掉这一项；404 的两条 robots 记为已知无害（§6.8） |
| 51 | major | Footer 是客户端组件，改服务端组件会让 mods-p3、wp1 渲染失败；「更多▾」要保证 SSR 出链接 | 采纳 | 核实 `footer.tsx` 为 `'use client'`、features 来自 `useStorefront()`；`mods-p3.ts` 导入 footer，`wp1.ts:643、646` 用同步 renderToString。页脚维持客户端组件、**不列服务页**（这样 layout 一行都不用改）；「更多▾」用 details/summary，链接始终在 SSR；framer-motion 不写进 C 的验收（§1.9、C 包） |
| 52 | major | 灰度期首页和落地页会大量链到 noindex 的 /jiema | 采纳 | 核实 `(shop)/layout.tsx:52` 的 jiemaOpen、`support-zone.ts:31`。所有接码入口统一用 `features.jiema && jiemaPublicOpen(...)`、只在主站输出；验收改成「灰度无 `href="/jiema`、OPEN 才有」；新增渠道站首页完整 HTML 的断言。并延伸到首页 title、H1、description 和 Organization：灰度期都不写短信接码（§1.10、§2.5、§3.3、§4.2、C 包） |
| 53 | major | 服务页「就地下单」与模板里的「跳 /jiema」矛盾 | 采纳 | 选 (b)：服务页直出国家/地区价格表，每行一次点击到达确认面板；doorway 防线改为独有正文加实时价格表（§0.3 #32、§1.6、§1.7、§9.1） |
| 54 | major | lint 在 P0 必然过不了；LLM 标题天天红；本地数据不代表线上 | 采纳 | 分区禁用词；LLM 生成内容只抽样告警；加已知违规基线，每包只要求不新增并清掉本包条目；`--base https://bigolab.com` 线上只读抓取作正式验收（§3.4、§8.2） |
| 55 | major | 每包一次构建太多；revert 重建回滚太慢；nginx 要 recreate | 采纳 | 核实 `scripts/ops/build-with-swap.sh`、部署说明里的 `rollback-<旧HEAD>` 惯例。每阶段一次构建（共 4 批），构建前打回滚标签，回滚改为切回旧镜像；nginx 改动攒到一次低峰 recreate（§0.1-9、§0.5、§8.2、§8.3） |
| 56 | minor | 多个价格占位符，`withLivePrice` 只替换第一个 | 采纳 | 核实 `landing/products.ts:134-153`。新增 `renderPriceTemplate`，取不到任一价格就整句退回；D1b 文件清单改为「每页 generateMetadata + registry」；价格符号统一「￥」（§3.1、D1b） |
| 57 | minor | claude-code 排在前面会抢走 Pro、Max 商品的归属 | 采纳 | 核实 `product-intro.ts:138`「按 LANDINGS 顺序取第一个命中」。追加在末尾并标 `ownsProducts: false`；check-product-intro 加断言（§1.4、D2） |
| 58 | minor | 「连续 7 天不满足」需要持久化状态，实时判断会抖动 | 采纳 | 核实 `Setting` 表存在（key 为 VarChar(50)）。cron 每天算一次存 `seo_gate_<slug>`，加滞回（§1.7） |
| 59 | minor | 分诊已有 AI 相关性判断，漏网原因在别处 | 部分采纳 | 「先排查再修」采纳。但意见里「`pipeline.ts:929-974` 是直接写 `triageState:'OK'` 的路径」经核实不成立：那几行是聚类阶段按 `triageState='OK'` **读取**条目；全仓唯一写 OK 的是分诊结果（第 778、786 行）。排查方向改为「分诊误判 / 聚类误并 / 线索源正文」三选一（§5.3、E1） |
| 60 | minor | /news 分页每页跑 6–8 个查询；page=1、非法值、NewsStream 状态没写 | 采纳 | 核实 `news/page.tsx:83-153` 的查询、`news-stream.tsx:64、419-429`。/news 直接不做深分页；分类页第 2 页起精简查询、计数和月份走 `storefrontCached`；`?page=1` 308、非法值和越界 404；复用 NewsStream 时加 `initialPage`（§1.3、§1.5、E1） |
| 61 | minor | 商品 lastmod 是成交时间 | 采纳 | 同 #11；IndexNow 也只挂在后台保存上（§6.2、§6.4） |
| 62 | minor | 商品详情页新增项没考虑渠道站；事实卡价格和推广价打架 | 采纳 | 核实 `products/[id]/page.tsx:268-271`。面包屑、选购指南、事实卡一律 `!channel`；事实卡不放价格；验收加渠道 Host 断言（§1.4、§3.2-D、§6.7、D1a） |
| 63 | minor | 顶部横条会有布局偏移、放不下 5000 字；和底部多个浮层互相遮挡 | 采纳 | 核实 `announcement.ts:12` 上限 5000。改为底部固定提示条，标题加「查看详情」；和 FloatingContact 用 CSS 变量避让，/jiema* 让位；验收加 CLS 保持 0（§0.3 #18、§6.6-2、§7.1、§7.3） |
| 64 | minor | framer-motion 有 5 个使用方；header 首帧 `y:-100` | 采纳 | 核实 `header.tsx:135`。同 #19；header 也改 `initial={false}`（§6.6-3、§6.6-5） |
| 65 | minor | `?n=` 归因捕获端是死代码 | 采纳 | 核实 `captureNewsRef`、`getNewsRef` 全仓无调用，只有 `news/[slug]/page.tsx:395` 用 `withNewsRef` 生成链接。CTA 改干净 URL、不写 localStorage，`attribution.ts` 标记待删、交主进程决定（§1.2、§1.11、§7.4、A 包） |
| 66 | minor | `permanentRedirect()` 返回 308 | 采纳 | 验收写「301 或 308」；需要 301 就用 `next.config.js` 的 redirects（§1.7、§1.11、I 包） |
| 67 | minor | 接码上线后仍是「仅管理员」，AJ、F1 的收录效果取决于开放时间；`?svc=` 改名碰下单路径；RowList 已虚拟化 | 采纳 | 核实交接文档 §37、`jiema-client.tsx:16、86、216、238`、`RowList`（第 150 行，超过 60 行虚拟滚动）。AJ 并进接码首发、F1 随「开放全部用户」；KPI 从 J 日计时；`?svc=` 验收覆盖三条路径；懒加载只针对 hot 以外、预选服务端直出；删掉「长列表做虚拟化」（§0.4、§0.5、§1.2、§1.6、§6.6-6） |

**评审之外，核对中顺带发现并已写进文档的**：
- hub 已有完整的开票问答（`chongzhi/page.tsx:89-90`），初稿「各页加开票 FAQ」本来就是重复劳动（见 #12）。
- claude-zhuce 同时卖接码单品和普号，FAQ 里有「如果你需要很多个，请直接联系客服说明用途」（`claude-zhuce/page.tsx:121`），是批量买号的招揽，建议站长确认后在 D1a 删掉（§9.4 #21）。
- itest-tenant W1-6 的 robots、sitemap 基线比对拿 `git HEAD` 做基线，有意的 SEO 改动要在提交后跑（§6.2、§8.2）。
- 上游代码 `wx` 是 Apple 不是微信（`services-cn.json:14`），写白名单和 lint 时不要按字面猜（#10）。
