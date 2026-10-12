# AI圈大事记：切到 DeepSeek + 每条新闻都要有全文（2026-10-12）

## 起因

- 站长 10-12 发现大事记不更新。查 `news_llm_calls.error`：10-08 19:06（北京）起智谱账户余额用完，每次调用返回
  `HTTP 429 code 1113「余额不足或无可用资源包」`，到切换前共失败 407 次。抓取正常（364 条堆在 `triage_state=RAW`），只是不再产生新事件。没有任何告警。
- 站长要求：换 DeepSeek V4.1 Flash、每天尽量少花钱、**每条新闻都要有全文，不能只有摘要**。

## 一、切换供应商（只改配置，20:21 生效）

`.env.production`（权限仍 644；旧值备份在 `.env.production.bak-20261012-glm`，600）：

| 变量 | 值 | 说明 |
|---|---|---|
| `LLM_PROVIDER` | `deepseek` | 代码里本来就有这家，base URL 用默认的 `https://api.deepseek.com/v1` |
| `LLM_FAST_MODEL` / `LLM_WRITE_MODEL` | `deepseek-flash` | 官方模型名；对应 DeepSeek-V4.1-Flash |
| `LLM_THINKING` | `disabled` | **必须关**：该模型默认开思考、档位 high，不关的话推理 token 按输出价计费，还会把 `max_tokens` 烧穿、返回空正文 |
| `LLM_IN_PRICE` / `LLM_OUT_PRICE` | `200` / `800` | 分 / 百万 token，按官方**高峰价**记账（输入 2 元、输出 8 元）；空闲时段实际半价，所以账面只会偏高 |
| `NEWS_DAILY_BUDGET_CENTS` | `300`（没动） | 账面每天最多 3 元 |

核对过的事实（2026-10-12，api-docs.deepseek.com 的「模型 & 价格」「思考模式」两页 + 从 ECS 实际调用）：

- 高峰时段 = 工作日 9:00–12:00、14:00–18:00，其余（含周末）半价。
- `response_format: json_schema` 会被拒（400 `This response_format type is unavailable now`），`json_object` 正常。
  **管线里没有任何调用传 `jsonSchema`，所以没事；以后也别传**——`llm.ts` 遇到 400 会把思考参数整个去掉重试，对 DeepSeek 等于重新打开思考。
- 关思考的参数就是 `thinking: {type: 'disabled'}`，与 `llm.ts` 现有写法一致。

## 二、全文层（代码 `d7de915`，镜像 `cf782e8d1c9e`，21:20 上线）

切换后第一轮：发布 8 条，只有 1 条有全文。历史上 1911 条已发布事件里 1231 条没有全文（`detail_state=SKIP`）。

**原因不是模型写不出来，是校验把第一稿整块丢掉并永久标 SKIP。** 用线上 16 条真实素材 + 线上同一套提示词在本机实验：

| 退回原因 | 实情 |
|---|---|
| 与原文连续 18 字重合 | 比较前去空白，英文专有名词一长必中：`Andreessen Horowitz`、`TechCrunch Disrupt 2026`、`GLM-5.3-Highspeed`、论文标题、安装命令 |
| 含原文未出现的数字 | 只比字面：`1.3 million` → 130 万、`1 billion` → 10 亿、`October 30th` → 10 月 30 日 全算编造 |
| 字数未达下限 | 八九百字的快讯写出 370–398 字的两段，差几个字整块作废 |
| （真问题）中文来源整句照搬 | 量子位、少数派的稿子，DeepSeek 会连搬 60–240 字；把原因告诉它重写也没用 |

改动：

- `score.ts`
  - `unsupportedNumbers` 认数量级换算（million / billion / k / M / B ↔ 万 / 亿）和月份（Oct ↔ 10 月）。自己算出来的数（两个百分比相减）仍然算「材料里没有」。
  - `sharedRun` 搬到这里，只认以中文为主的重合段（摘要的 20 字检查也跟着受益）。
  - 新增 `copiedStats`：最长逐字重合段 + 重合占比。全文层改用它：**最长段 ≥ 30 字（搬了一整句）或占比 > 25%（大面积搬运）才退回**。
- `pipeline.ts`
  - `detailOrRetry`：第一稿不过就重写一次。照抄类走**两步改写**（先把材料整理成 8–16 条转述过的要点，再只凭要点写——写稿那一步看不到原文）；其余带着退回原因重写。校验始终拿成稿与原始材料比。
  - 素材足够（抓到 ≥ 600 字正文）却没写成的，留 `detail_state=RAW` 交给 detail 段再写，满 3 次才 SKIP；素材确实不足才直接 SKIP。
  - 下限 400 → 300 字；超长从末尾去段而不是整篇作废；detail 段每轮 8 → 12 条、从新到旧；预算闸 40% → 60%；每轮结果带最近 6 条退回原因（看 cron 日志或后台运行记录）。

实验通过率：改之前 4/16；改之后英文来源一次通过 12/12，中文来源两步改写 4/4。

## 三、存量补写

- 备份 `/opt/beiguo/backups/news_events_20261012_212100_pre-detail-reset.sql`。
- `UPDATE news_events SET detail_state='RAW', detail_tries=0 WHERE status='PUBLISHED' AND compose_state='DONE' AND detail_state='SKIP' AND detail 为空` → 1242 条回到队列。
- 上线后手动跑一轮 detail：取 12 条，补出 9 条，3 条留待下轮。每小时 35 分自动跑一轮，从新到旧。
- 关掉补写：`NEWS_DETAIL_BACKFILL=0` 后重建 app 容器（新新闻自己的全文不受影响）。

## 四、花费

- 切换当晚（含消化 4 天积压）账面 0.32 元。
- 估算：每条新闻约 1.5 分（摘要 + 全文，三分之一要重写一次）；每天约 85 条 → 账面约 1.3–1.5 元，实际因半价时段更低。
- 存量 1235 条约需账面 20–25 元，受每天 3 元上限和 60% 闸控制，约两周补完。
- **DeepSeek 账户 10-12 余额 14.47 元，不够补完存量**——余额用完会和这次一样静默停更。

## 没做的

- 告警：LLM 连续失败时通知站长（问过，站长没表态）。
- openai.com 抓正文 403、arstechnica 405、theverge 偶发超时：这些来源素材只有 RSS 的一两句话，写不出全文的会停在 SKIP。
- `needsReview`（不进首页与重点榜）的误判率仍高（历史约 72%），这次只顺带降了「数字」和「连续重合」两类误判。

回滚：`docker tag beiguo-shop-app:rollback-news-17a0316 beiguo-shop-app:latest && docker compose --env-file .env.production up -d --no-deps app`（配置不用动）。
