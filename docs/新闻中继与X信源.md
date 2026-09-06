# 境外信源中继与 X（推特）接入

## 1. 问题

阿里云北京 ECS 实测（2026-09-04）无法直连这些源：

| 源 | 结果 |
|---|---|
| X / Twitter | 不通 |
| Reddit | 超时 |
| HuggingFace（含 hf-mirror） | 超时 |
| Google DeepMind | 超时 |
| Meta AI / Mistral | 超时 |
| Google News RSS | 超时 |
| RSSHub 公共实例 | 超时 |

内容本身是公开的，缺的只是一条境外出口。

## 2. Cloudflare Worker 中继（解决大部分）

代码在 [`cloudflare/news-relay.worker.js`](../cloudflare/news-relay.worker.js)。免费档 10 万请求/天，
纯转发是 I/O 等待、不吃 CPU 配额，本项目日均约 300 次调用，远低于额度。

**部署**

1. Cloudflare 控制台 → Workers & Pages → Create Worker，粘贴那个文件
2. Settings → Variables → 加 Secret `RELAY_TOKEN`（随机 32 位以上）
3. 部署后拿到 `https://<name>.<account>.workers.dev`
4. 服务器 `.env.production` 加两行，然后 `docker compose --env-file .env.production up -d`：

```
NEWS_RELAY_URL=https://<name>.<account>.workers.dev
NEWS_RELAY_TOKEN=<与 RELAY_TOKEN 相同>
```

5. 后台「AI大事记 → 信源管理」把标着「需中继」的源启用

**安全提醒**：Worker 里的 `ALLOW` 白名单必须保留。去掉它就等于在自己域名下开了一个公开
SSRF 代理，任何人都能拿它扫内网和云元数据接口。

这一步之后可用的源：DeepMind、Meta AI、Mistral、HuggingFace 每日论文、Reddit r/LocalLLaMA。

## 3. X（推特）—— 中继解决不了

Worker 能换个出口 IP，但 **X 会拦数据中心 IP、且未登录看不到时间线**。所以 X 需要单独决策。

### 现状（2026 年 2 月起 X 改了计费模式）

X 取消了原来的分级订阅，新开发者默认走**按量付费**：

- **$0.005 / 条读取**，无月最低消费
- 上限 200 万条读取/月
- 原 Basic（$200/月）用户已于 2026-06-01 被强制迁移到按量付费
- 原 Pro（$5,000/月）也于 2026-08-14 宣布弃用
- Enterprise 起价约 $42,000/月

**取消月最低消费对我们是好事**——可以从很小的量开始。

### 成本估算（按 $0.005/条读取）

| 方案 | 账号数 | 频率 | 月读取量 | 月成本 |
|---|---|---|---|---|
| 保守 | 8 个核心账号 | 每 4 小时 | 约 1,440 条 | 约 $7（¥50） |
| 均衡 | 12 个账号 | 每 2 小时 | 约 4,300 条 | 约 $22（¥155） |
| 激进 | 15 个账号 | 每小时 | 约 32,000 条 | 约 $162（¥1,150） |

**建议走保守档**。理由：AI 圈真正重要的推文（模型发布、重大公告）在数小时内必然被
TechCrunch / The Verge / HN / 机器之心 / 量子位 覆盖，而这些源我们已经直连可用。
X 的价值是**更快**和**一手口径**，不是覆盖率——每 4 小时一次已经够快，
没必要为「快 3 小时」多付 20 倍的钱。

### 建议关注的账号

一手官方：`@OpenAI` `@AnthropicAI` `@GoogleDeepMind` `@Meta AI` `@MistralAI` `@Alibaba_Qwen`
负责人与研究者：`@sama` `@karpathy` `@ylecun` `@JeffDean` `@Thom_Wolf` `@rohanpaul_ai`

（参考站 aihot.virxact.com 的信源里就有 `X：Thomas Wolf（Hugging Face 联创/CSO）(@Thom_Wolf)`、
`X：Rohan Paul (@rohanpaul_ai)` 这类，说明这个路子是通的，只是要花钱。）

### 三条路对比

| 路线 | 成本 | 可靠性 | 说明 |
|---|---|---|---|
| **X 官方 API（推荐）** | 保守档约 ¥50/月 | 高 | 唯一合规稳定的路子。需要一张能付美元的卡 |
| 自建 RSSHub（境外 VPS） | VPS 约 ¥35/月 | 低 | RSSHub 的 twitter 路由现在也需要登录态 cookie，且频繁失效，维护成本高 |
| 不接 X | 0 | — | 靠已有的直连源二手覆盖，慢几小时。**先这样跑一个月看效果，再决定要不要花这个钱** |

我的建议：**先按第三条上线**，跑一两周看内容质量。如果确实感到「重要消息比同行慢半天」，
再接 X 官方 API 的保守档，那时你也更清楚该关注哪些账号。

接入时只需要在 `SEED_SOURCES` 里把 `x-*` 那几条的 `enabled` 改成 `true`，
并在 `lib/news/pipeline.ts` 的 collect 里补一个 `kind='X'` 的分支调 X API——
数据模型和展示层已经按「信源标注到人」的形态设计好了（`X：Sam Altman（OpenAI CEO）(@sama)`）。

---

**来源**：
[X (Twitter) API Pricing 2026: All Tiers](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/) ·
[How Much Does the X (Twitter) API Cost in 2026?](https://twitterapi.io/blog/x-api-cost-breakdown-2026) ·
[X (Twitter) API Pricing in 2026: All Tiers | Postproxy](https://postproxy.dev/blog/x-api-pricing-2026/)
（价格随时可能再变，下单前请以 X 开发者后台的实际报价为准）
