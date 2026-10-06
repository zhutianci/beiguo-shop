# 调研 3：UGC 内容平台的 SEO / GEO 与合规

> 2026-10-06 调研。「官方」= Google Search Central / 百度搜索资源平台 / OpenAI 一手文档。第三方流量数字只看量级。【未核实】= 未找到官方原文。

## 一、Google

### 1.1 相关垃圾政策（官方 Spam policies，2026-08-28 更新）
来源：https://developers.google.com/search/docs/essentials/spam-policies
- **用户生成垃圾内容**：用户放进来的垃圾也算站点自己的问题。
- **规模化内容滥用**：批量生成低价值页面，无论 AI、采集轻改还是关键词拼凑。现有「AI 资讯」模块正落在风险区。
- **站点声誉滥用**：第三方内容主要为借主站排名而发布；2024-11-19 起第一方参与审核也不豁免。**「用户产品推广」区如果变成有人批量发软文蹭本站权重，就踩这条线。**
- 力度参考：2024-03 核心更新目标减少低质非原创内容 40%，事后称 45%；Causal「SEO heist」AI 铺 1800 篇后被人工处罚，自然流量掉约 99%。

### 1.2 AI 生成内容（官方，2026-10-01 更新）
来源：https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- 允许 AI 辅助，「大量生成且不增加价值」= 规模化滥用；标题、描述、结构化数据、alt 都要人工核实；向用户说明内容怎么产出。
- **AI 生成图片要写 IPTC `DigitalSourceType = TrainedAlgorithmicMedia`**——提示词板块全是 AI 图，必须照做。
- 有用内容自评要求讲清「谁写的、怎么做的、为什么做」：署名、作者页、如实披露自动化程度。

### 1.3 用户外链（官方，2025-12-10）
来源：https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- 用户帖链接默认 `rel="ugc"`（可叠加 nofollow）；付费 / 推广链接 `rel="sponsored"`；官方允许给长期优质贡献者去掉 ugc。

### 1.4 官方推荐「新用户帖先 noindex」（2025-12-10）
来源：https://developers.google.com/search/docs/monitor-debug/prevent-abuse
- 对没有信誉的新用户帖加 noindex，等积累信誉再放开；外链 ugc/nofollow、人工审核、注册防机器人、IP 黑名单、举报、监控异常。

### 1.5 论坛结构化数据
- **DiscussionForumPosting**（2026-09-08）：必填 `author.name`、`datePublished`，`text`/`image`/`video` 至少一个；推荐 `author.url`、`headline`、`comment`（按页面顺序嵌套）、`interactionStatistic`。**只用于用户发的帖子，站方编辑文章用 `Article`**；问答为主用 `QAPage`。来源：https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
- **ProfilePage**：`mainEntity` 为 Person，推荐粉丝/获赞/发帖数。来源：https://developers.google.com/search/docs/appearance/structured-data/profile-page
- 这两种标记会被「论坛和讨论」功能使用，但加了不保证展示。hidden gems 排名系统偏好第一手经验内容，入选无公开标准。

### 1.6 图片与视频
- 图片：用 `<img src>`（CSS 背景不收录）、描述性文件名和 alt、同一张图全站稳定 URL、图片 sitemap、`og:image` 指定主图。来源：https://developers.google.com/search/docs/appearance/google-images
- 图片版权元数据：`license`、`acquireLicensePage`、`creator`、`creditText`。
- **视频必须有「观看页」**（以单个视频为主体的页面，文章里嵌一段不算）；VideoObject 需 name/description/thumbnailUrl + contentUrl 或 embedUrl；缩略图 URL 稳定不被 robots 屏蔽。来源：https://developers.google.com/search/docs/appearance/video

### 1.7 分页 / 标签 / 筛选 / sitemap
- 分页：每页独立 URL，canonical 指向自己（不要统一指第 1 页）；无限滚动必须同时有 `<a href>` 分页链接。
- 筛选：排序、筛选参数 robots 屏蔽或用 `#`；**结果为空的组合返回 404**。
- sitemap：单文件 5 万条 / 50MB；`lastmod` 只有一贯准确才采用；priority、changefreq 被忽略。
- 删帖：410 比 404 出索引快几天。
- 跨平台转载：Google 2023-05 起推荐转载方 noindex 而不是跨域 canonical。

## 二、百度

- **飓风算法**：恶劣采集、拼凑、跨领域采集、站群。→ 论坛混入大量无关泛娱乐内容会被判领域模糊。来源：https://ziyuan.baidu.com/wiki/2848
- **劲风算法**（2020-03）：打击恶劣聚合页——跨领域、题文不符、**站内搜索结果生成的静态页**、**空短失效的聚合页**。→ 内容少的标签页不放收录，站内搜索页 robots 屏蔽。来源：https://ziyuan.baidu.com/college/articleinfo?id=2911
- 官方常见违规：标题堆砌；首屏主体内容占 50% 以上；**强制注册/登录/下载 APP 才能看完整内容属于违规**。→ 正文、图片、提示词全文必须对未登录用户和爬虫可见。来源：https://ziyuan.baidu.com/college/articleinfo?id=3166
- 细雨算法打 B2B 低质软文、穿插联系方式 → 对应「产品推广」区。
- **原创保护**：熊掌号下线后普通网站无可申请的原创保护通道【未核实】。现实做法：清晰首发时间戳、发布即 API 推送、署名水印、被采集走投诉。
- **备案**：百度未正式说不收录未备案站，但大量站长反馈 2020 年后未备案新站几乎不收录【经验共识，未核实】；未备案站 sitemap 每日上限被压到 1 个（本站交接文档已实测印证）。→ **百度只能当附带收获。**
- 资源平台：API 推送每次最多 2000 条，重复提交旧链接或低质链接会被下调配额。

## 三、AI 搜索 / GEO
- Google 官方（2026-07-10）：出现在 AI Overviews / AI Mode 无额外要求；**不需要 llms.txt，Google 不使用它**；不需要把内容切碎；核心是非同质化、有独特观点的原创内容 + 高质量图片视频。来源：https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- ChatGPT 搜索：robots 必须放行 **OAI-SearchBot**；GPTBot 只管训练可单独决定。来源：https://developers.openai.com/api/docs/bots
- 引用分布（Profound，6.8 亿条）：Perplexity 前 10 来源中 Reddit 占 46.7%，AI Overviews 中 Reddit 占 21% → **论坛形态、第一手经验内容最容易被 AI 引用**。来源：https://www.tryprofound.com/blog/ai-platform-citation-patterns
- GEO 论文（KDD 2024）：加入带出处的统计数据、引语，可见度最多提升约 40%。→ 实测数据（同一提示词多模型对比、价格、额度）、带日期的截图、可复现参数。
- 代价：有 AI 摘要时用户点击率明显下降（Pew：8% vs 15%）——AI 渠道价值更多在曝光与被引用。

## 四、案例量级（第三方估算）
- Reddit：2023-07 到 2024-04 Google 可见度 +1328%；2026 年 5 月核心更新后明显下滑，Google 称「没有特殊偏好」。论坛形态有红利但不是免死金牌。
- PromptHero 约 29% 来自 Google；Civitai 以直接访问为主。
- ai-bot.cn：cn.bing 贡献约 26%；中国搜索份额百度约 47~64%、必应约 16~23%。→ **对中文 AI 用户，必应是不能忽视的第二渠道，IndexNow 值得做。**

## 五、架构建议（摘要，详见主设计文档）
1. URL 以 id 为准、slug 不一致 301；用户主页 `/u/{handle}`。
2. hub/spoke：每个模型 / 产品一个站方 hub 页，聚合精选；商品页反向链接精选内容。
3. SSR 直出正文、首屏图、提示词全文、前若干条评论。
4. `dateModified` 只在实质编辑时更新，sitemap lastmod 与之一致。
5. sitemap 按类型拆分，只放可收录 URL。
6. IndexNow：过审、编辑、删除时推送（不含 Google）。
7. 删除 410、合并 301、临时隐藏 noindex。
8. 转载默认 noindex。
9. 薄内容门槛（建议值）：正文 >300 字，或「提示词 + 至少 1 张原创出图」；且作者信任等级达标或人工过审。
10. 标签页至少 5~10 篇可收录内容 + 一段站方介绍才放收录；站内搜索与筛选参数 robots 屏蔽。

## 上线前 SEO 硬约束清单
- [ ] 内容页、个人主页 SSR 直出；未登录可见完整正文与图片
- [ ] 未审核 / 新人内容默认 noindex 且不进 sitemap，过门槛自动放开
- [ ] 用户外链 `ugc nofollow`；推广链接 `sponsored`；推广区人工审核并显式标注
- [ ] 推广区禁止第三方批量付费铺稿
- [ ] DiscussionForumPosting / Article / QAPage / ProfilePage 按内容归属正确选择，结构化内容页面可见
- [ ] AI 图：页面「AI 生成」标识 + IPTC DigitalSourceType；`<img>`、alt、稳定 URL、图片 sitemap
- [ ] 视频独立观看页 + VideoObject
- [ ] id 主导 URL + 301；分页 canonical 自指；空标签、站内搜索、筛选参数 noindex 或屏蔽；空筛选 404
- [ ] 删除 410、合并 301、隐藏 noindex；同时推送 IndexNow
- [ ] sitemap 拆分、只收可收录 URL、lastmod 准确
- [ ] robots 放行 Googlebot / Bingbot / Baiduspider / OAI-SearchBot / PerplexityBot；检查 Cloudflare Bot 拦截
- [ ] 内容审核、举报、注册防机器人、IP 黑名单
