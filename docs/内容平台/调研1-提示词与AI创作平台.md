# 调研 1：提示词 / AI 创作展示平台

> 2026-10-06 调研。流量数字均为 Semrush 估算（2026-08），只看量级。标【未核实】的为二手或无法抓取的来源。

## 0. 直接影响栏目设计的四条事实

1. **Sora 独立 App 与网页版已于 2026-04-26 关停，Sora API 于 2026-09-24 关停**（OpenAI 2026-03-24 宣布）。有报道称视频生成并入 ChatGPT，但具体形态**未核实**。→「Sora 视频提示词」不能再写成「去 sora.com 生成」，视频栏目要按模型中立设计（Seedance / 即梦 / 可灵 / Veo 等）。
   来源：https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/ 、https://9to5google.com/2026/03/24/openai-shutting-down-sora-video-generation-app-but-without-explaining-why/
2. **gpt-image-2（ChatGPT Images 2.0）2026-04-21 发布**，所有 ChatGPT 用户可用，Plus 及以上有 Thinking 模式、最高 2K、画幅 3:1~1:3。是 2026 年 GitHub 提示词仓库爆发的直接原因，也是本站图片提示词最该押的模型。
   来源：https://itbrief.news/story/openai-launches-chatgpt-images-2-0-with-api-access
3. **合规**：《人工智能生成合成内容标识办法》2025-09-01 起施行，平台提供 AI 内容下载/复制/导出时要加显式或隐式标识。来源：https://www.cac.gov.cn/2025-03/14/c_1743654685899683.htm
4. **版权**：北京互联网法院 2023-11-27「AI 文生图第一案」认定提示词+调参生成的图片可构成作品、用户是作者——给「原创提示词署名」提供依据。来源：https://www.thepaper.cn/newsDetail_forward_25725671

## 1. 各平台拆解

### 1.1 Civitai（模型 + 图片社区标杆）
- 图片页带完整生成数据（prompt / negative / sampler / steps / CFG / seed / 尺寸 / 所用资源），资源靠文件元数据里的模型哈希自动识别并链回模型页。
- **Remix Gallery（2026 新机制）**：每张图可有「二创画廊」。投稿者先发布二创，再付 Buzz 投到原图画廊（原作者自定价 50~5000 Buzz，平台不抽成）；原作者逐条人工审核，48 小时不处理过期；接受后一周内不能撤；被拒原作者留 30%；系统校验投稿确实是站内从原图生成的；原作者可置顶 4 张。来源：https://civarchive.com/articles/33868/remix-galleries-iterate-share-get-discovered
- 激励：站内货币 Buzz；创作者计划用上月营收的一部分做奖金池，按存入 Buzz 占比分钱（2025-03 发出约 4.3 万美元，254 人）。
- 审核：PG/PG-13/R/X/XXX 五级，自动打标 + 用户投票修正；2026-04 拆成 civitai.com（安全）与 civitai.red（成人）两个域名。
- **SEO**：月访问 13.68M，直接访问 60%，自然搜索仅约 42 万 → 靠社区和品牌，不靠 SEO。

### 1.2 PromptHero（SEO 型提示词站，最该参考）
- URL：`/prompt/{11位hex}-{模型}-{描述slug}`；落地页按「模型 × 主题」：`/midjourney-prompts`、`/midjourney-anime-prompts`、`/photography-prompts`。
- 详情页：H1=标题、完整 prompt、模型、参数、分类、作者、日期；按钮 Try / Copy / Download / Share / Favorite；底部内链「More by @作者」「Explore Related（同主题其他模型）」「prompt 拆词 tag 链接」。
- 排序 Featured / Hot / New / Top；变现：会员 + Academy 课程。
- 流量：月访问 2.24M（+14%），搜索 31%，外链 6050 个域名，还有来自 ChatGPT 的约 1.4 万访问。

### 1.3 Lexica（只做搜索、没有社区，衰落中）
- 月访问 27.7 万（-26%），一年前 78 万。**教训：只吃模型红利、没有创作者和社区的提示词库，会随底层模型过气而衰退。**

### 1.4 Midjourney Explore
- For You / Random / Hot / Top（日、周、月）；悬停即可复用图片/prompt、搜相似、点赞；独立的 Styles（--sref 风格码）浏览器——「风格码」本身就是可分享的内容单元。【官方文档 403，来自二手教程】

### 1.5 Sora App（已关停，但 feed 原则值得借鉴）
- Feed 排序公开原则：优先原创、参与和 Remix，而不是消费时长；可用自然语言引导排序。来源：https://openai.com/index/sora-feed-philosophy
- Remix 只改一个维度，强度 subtle/mild/strong/custom；Cameo 肖像被使用者自动成为共同作者；视频带 C2PA 与可见水印。
- 用户峰值约 100 万、关停前不足 50 万——**纯「看 AI 视频」的社区黏性很差**。

### 1.6 PromptBase（付费提示词市场）
- 抽成 20%（市场）/ 10%（定制）；上架人工审核 + Verified 徽章。
- 核心短板：买到的 prompt 可被随意转发 → **卖整条 prompt 的模式天然防不住泄露**。

### 1.7 OpenArt / Krea / Lovart / FlowGPT
- OpenArt 转向工作台，ComfyUI 工作流作者按使用量分钱。
- **FlowGPT 是反面教材**：从提示词库滑向角色扮演机器人商店，审核宽松，首页甚至有 jailbreak 分类。

### 1.8 国内：Liblib / 吐司 / 即梦 / 可灵
- Liblib：近 1000 万用户、原创模型超 10 万；闭环「看到作品 → 同款生成」；按算力消耗给模型作者分成（比例未核实）。
- 即梦：公开所有生成参数 +「一键同款」，「从消费内容到创作内容的极短转化路径」。来源：https://www.woshipm.com/ai/6370967.html
- 可灵：「创意圈」+ 做同款；创作者分「超级 / 优质」申请制，权益为认证标识、内测、激励、合作。

## 2. GitHub 爆火提示词仓库

| 仓库 | Star | 条目结构 |
|---|---|---|
| PicoTrex/Awesome-Nano-Banana-images | 23.8k | 「例 N：标题」+ 原推链接 + 作者；输入图/输出图并排；prompt 代码块，`[ ]` 标出可替换变量；NOTE 说明怎么替换；CC BY 4.0；6 种语言 |
| YouMind-OpenLab/awesome-nano-banana-pro-prompts | 13.5k | 1 万多条；README 只是入口，内容在 youmind.com 画廊（每条独立页） |
| jamez-bondos/awesome-gpt4o-images | 8.2k | 100 个编号案例；作者 + 来源 + 前后对比图 + Prompt + 注意事项 +「需上传参考图」 |
| EvoLinkAI/awesome-gpt-image-2-prompts | ~15-17k | 按用途分类（电商/广告/人像/海报/角色/UI）；每条 try-it 链接导向自家 API 站 |

**为什么火**：① 踩准新模型发布窗口（GPT-4o 生图 2025-03、Nano Banana 2025-08、Nano Banana Pro 2025-11、gpt-image-2 2026-04），头几周谁先出「案例大全」谁吃流量；② 每条都是「效果图在前 + 可复制 prompt + 原作者署名」；③ `[ ]` 变量化模板，换上自己的照片就能出图；④ GitHub 积累 star 和外链，独立站承接 SEO 与转化（YouMind 每条独立页 `/prompts/{slug}-{id}`，按用途/风格/主体三维分类）。

## 3. 共性
- **内容单元最小字段**：标题、模型和版本、prompt 全文（带变量标记）、negative（可选）、参数（画幅/seed/风格参数）、是否需要参考图、输出图或视频（多张）、作者、原始来源、许可证、分类标签、发布时间。
- 复用链路：复制是底线，「一键同款」带参跳转生成器是加分项。
- 排序通用组合：Featured（人工）+ Hot + New + Top（日/周/月）。
- **真正吃到搜索流量的是「每条 prompt 一个独立页 + 模型×主题落地页 + 详情页大量内链」**（PromptHero、YouMind）；Civitai、Lexica 主要靠直接访问。

## 4. 可直接借鉴的功能点
1. 单条提示词独立页，URL「短 ID + slug」【PromptHero / YouMind】
2. 「模型 × 主题」落地页（有足够条目才开放收录）【PromptHero】
3. 详情页三组内链：作者更多 / 同主题其他模型 / prompt 拆词 tag【PromptHero】
4. 「效果图在前 + 代码块 prompt + `[ ]` 变量 + 替换说明 + 是否需参考图」标准条目模板【GitHub 仓库】
5. 复制按钮旁放「去 ChatGPT 生成」→ 导向本站 ChatGPT Plus【即梦一键同款思路】
6. 强制署名 + 原始来源 URL + 许可证【GitHub 通行做法】
7. 「同款 / 二创」关系链 + 原作品二创墙，原作者可置顶【Civitai Remix Gallery】
8. Featured / Hot / New / Top 排序，Hot 给「被复制 / 被二创」加权【Midjourney / Sora feed 原则】
9. 按新模型发布节奏做「案例大全」专题 + 同步开 GitHub awesome 仓库攒外链【EvoLinkAI / YouMind】
10. 积分 + 月度奖池，兑换本站余额【Civitai 创作者计划 / Liblib 算力分成】
11. 创作者分级认证（申请制）【可灵】
12. 内容分级 + 自动打标；国内站只收 PG / PG-13 两级【Civitai】
13. 人工复现后打「实测可用」徽章；文本相似度去重【PromptBase Verified】
14. 「用户推广自家产品」单独开区、强制标注、不进 Hot【FlowGPT 反面教训】

## 5. 未能核实
Similarweb 数据未拿到；Civitai 详情页 DOM 为 JS 渲染未抓到；Midjourney 官方文档 403；PromptBase 卖家规则 403；Liblib / 吐司分成比例、即梦 / 可灵二创署名规则无公开资料。
