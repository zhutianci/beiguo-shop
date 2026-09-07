# AIHOT 线索接入（授权号 AIHOTAPI20260907001）

> 这份文档是**授权边界的书面对照表**，出争议时它就是我们的证据。
> 改动 `src/lib/news/aihot.ts` 或 collect / triage 里任何与线索相关的逻辑前，先读这一份。

---

## 一、授权事实

| | |
|---|---|
| 授权方 | aihot.virxact.com |
| 授权号 | **AIHOTAPI20260907001** |
| 取得日期 | 2026-09-07 |
| 联系人邮箱 | `wzglyay@virxact.com` |
| 授权性质 | 商业使用授权（本站 bigolab.com 售卖 AI 订阅，属其《公开使用规则》§4 的「外部商业使用」） |

**授权号不上公开页面。** 它对读者零信息量，却是一个可被冒用的标识。只出现在两处：
这份文档，以及取数时的 `X-License` 请求头（便于对方识别我们是已授权方）。

---

## 二、取什么、不取什么（逐条对照）

我们主动把范围收窄到「选题发现信号」——只回答「**去哪儿看**」，不碰「他们怎么写」。

### ✅ 取

| 字段 | 落到哪里 | 用途 |
|---|---|---|
| `title` | `news_items.title` | 分诊输入之一 |
| `links.original` | `news_items.url` | **我们自己去抓正文**，这是全部素材的来源 |
| `source.name` | `news_items.origin_source_name` | 详情页展示原发布者名（SKILL §6 的硬要求） |
| `publishedAt` | `news_items.published_at` | 时间轴排序 |
| `attribution.url` | `news_items.lead_url` | 授权要求的回链 |

### ❌ 不取（这一列比上一列重要）

| 字段 | 为什么不取 |
|---|---|
| `summary` | 他们写的摘要。取了就超出授权范围，也违反 SKILL.md §1.1「只能自写摘要」 |
| `reason` | 同上，是他们的编辑判断 |
| `score` | 他们的重要性判断。用了等于让第三方的编辑判断决定我们的排序，超出「选题发现信号」 |
| `selected` | 同上 |
| `category` | 他们的分类体系与我们固定的六分类不同，映射只会引入语义误差。分类交给我们自己的 triage |
| `originalTitle` | 用不上（我们抓原文时会拿到真正的标题） |

### 这条边界靠什么守

**不是靠注释提醒，是靠类型系统和数据结构：**

1. `aihot.ts` 里的 zod shape 只声明我们要的字段，zod 默认剥掉未声明的键 —— `summary` / `reason` 在解析出口就不存在了
2. 导出的 `AihotLead` 类型里没有这两个字段名，任何想往下游传的写法都过不了 `tsc`
3. `collect()` 的线索分支把 `summaryRaw` **写死 `null`**，不是「碰巧为空」
4. `eventMaterials()` 对 `leadVia` 非空的条目把 `desc` 显式置为空串
5. `scripts/check-news-a1b1.ts` 有断言：含 `summary`/`reason` 的样本 JSON 解析后，结果里不存在这两个键

**所以：线索条目的 `summary_raw` 永远是 NULL，这是设计不是 bug，不要「顺手补上」。**

---

## 三、页面标注（授权条件）

用到线索的事件，详情页有两处标注：

1. 正文开头的 AI 提示条里加一句：
   「本条选题由第三方线索发现；线索方提供的摘要未被采用，本页内容依据下方信源整理。**线索来源：AIHOT**」
   —— 「线索来源：AIHOT」是回链，指向 `attribution.url`，带 `rel="noopener noreferrer nofollow"`
2. 信源列表里对应那一条挂一个「线索来自 AIHOT」的小标签

**措辞的约束**：不能写「摘要由本站撰写」这类绝对断言。模型不可用时会走
`degradePublish` 降级路径，直接引用信源自带的 description 并标「未经 AI 摘要」，
那时绝对断言会和正文当场打架 —— 而这是挂着授权号给授权方看的书面声明。
现在的措辞只陈述两件**永远为真**的事：线索方的摘要我们没用；本页内容依据下方信源。

**没用到线索的事件不标。** 没用还标等于对读者虚构一个来源。

---

## 四、实测数据（2026-09-07，从生产 ECS，91 条样本）

这决定了接入方式，不是拍脑袋定的。

### 线索的原文域名分布

| 类别 | 占比 | 说明 |
|---|---|---|
| 抓不到正文 | 33/91（36%） | x.com 27、mp.weixin.qq.com 3、huggingface.co 3 |
| 与我们已有信源重复 | 29/91（32%） | ithome、openai、the-decoder、anthropic、techcrunch、theverge…… urlHash 会去重，价值只是「比我们早发现」 |
| **真正新增且可抓** | 29/91（32%） | 见下表 |

### 新增域名的正文可达性（逐个实测）

✅ 可抓：`claude.com`、`platform.claude.com`、`blog.google`、`blogs.nvidia.com`、
`cursor.com`、`runwayml.com`、`dev.to`、`arcprize.org`、`tomtunguz.com`、`babyloniantwins.com`

⚠️ 正文过短：`github.blog`(237 字)、`metr.org`(354 字)

❌ 抓不到：`x.ai`(连接超时)、`research.google`(超时)、`developers.googleblog.com`(超时)、
`deepmind.google`(302)、`garymarcus.substack.com`(超时)、`ifm.ai`(403)、
`artificialintelligence-news.com`(403)

### 微信公众号的实测结论

3 篇实测全部：HTTP 200、响应约 17.7KB、`js_content` 提取长度 **0**。
返回的是空壳页，正文不在 HTML 里。所以 `mp.weixin.qq.com` 进域名黑名单。

---

## 五、实现要点

```
collect  kind='AIHOT' 走独立分支（不与普通 feed 共用循环，避免有人在那个循环里给 summaryRaw 赋值）
         → parseAihotLeads 白名单解析 + 域名黑名单过滤
         → summaryRaw 写死 null，落 lead_via / lead_url / origin_source_name

triage   线索条目没有 description，**先去抓原文正文**当分诊输入
         抓不到 → 直接判 SKIP，不进后续任何环节
         （只拿标题分诊会让黑名单判定明显变松，而判错的代价是合规风险）

cluster  与普通条目一样

compose  素材来自我们自己抓的正文。hasMaterial 闸门：素材只剩标题时不写，留 RAW 等下轮

rank     线索**不计入 sourceCount**（见下）
```

### 为什么线索不计入 sourceCount

`sourceCount` 的语义是「有几家**独立媒体**报了这件事」，它是热度分里权重最高的一项（×2.0），
也是 SKILL §7 那条「单源 + tier3 → 标待复核」的判据。

线索中介不是一家独立报道的媒体。把它算进去的直接后果是：一条只有单一原发布者的线索
会记成 `sourceCount=2`，从此永远不满足「单源」条件 —— 那道人工复核闸门对所有线索条目
**一次都不会触发**，而线索恰恰是最需要复核的那一类。

---

## 六、出厂状态与开启条件

信源 `aihot` 出厂 **`enabled: false`**。

**开启前的前置条件**：`/admin/news` 的「待写摘要（积压）」计数已经稳定在低位。

理由：AIHOT 每轮最多 30 条新线索，会让 triage / cluster / compose 三段队列同时变长，
把本轮刚修好的积压问题重新压出来。先让双车道跑一周、确认积压在消化，再开这个源。

开启方式：后台「AI 大事记 → 信源管理」找到「AIHOT 线索」，点启用。
建议先点「测试」按钮 —— 它会显示「域名过滤后剩 N 条可用线索」，
N 为 0 不代表接入坏了，而是这批线索都指向我们抓不到正文的站点。

---

## 七、一条 SQL 停用

出任何争议时立即停用，不需要发版：

```sql
UPDATE news_sources SET enabled = 0 WHERE `key` = 'aihot';
```

已入库的线索条目仍在（`lead_via='AIHOT'`），页面上的标注与回链照常展示。
若要连历史条目一起下线：

```sql
UPDATE news_events e
  JOIN news_items i ON i.event_id = e.id
  SET e.status = 'UNLISTED'
  WHERE i.lead_via = 'AIHOT';
```

（用 `UNLISTED` 而不是物理删除 —— 保留证据，见 SKILL.md §9）

---

## 八、限流与礼节

- 对方 nginx 限流 `aihot_api_ip_rl=60r/m`
- 我们每小时取 1 次、**不翻页**，用量约 1r/h，余量极大
- 请求带 `X-License: AIHOTAPI20260907001` 与站点 UA，便于对方识别与联系
- 429 / 503 不累加 `failCount`（撞上限流不该把源熔断禁用）
- `robots.txt` 明确 `Allow: /api/v1/`，我们只走 `/api/v1/items`
