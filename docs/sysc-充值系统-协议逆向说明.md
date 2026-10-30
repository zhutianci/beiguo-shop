# sysc 充值系统 · 协议说明（逆向整理，2026-10-19）

对方（`chuanwen.applelll.com`，站内代号 **sysc**）不提供 API 文档，**经对方明确授权**，
由我们自行从其兑换中心前端整理出协议。本文件是唯一的协议依据，
`src/lib/redeem/providers/sysc.ts` 的实现必须与本文件一致；以后对方改了协议，先改这里。

来源：`GET https://chuanwen.applelll.com/` 返回的单页 HTML（页面内联 JS，约 51KB，未混淆、带中文注释）。
没有碰任何需要登录的后台，没有探测任何非公开路径 —— 下面全部接口都是那个兑换页自己在用的。

> **2026-10-24 补：这份协议同时适用于 sysd（`niuniu888.applelll.com`）。** 两家兑换页 md5 相同，
> 只差店铺标识 `ref`。10-21 对方更新过一版前端（加了中英文切换和粘贴即时解析），
> 逐项核对后协议**没有变化**。sysd 的差异与实测见 `docs/sysd-接入说明.md`。

---

## 0. 一句话结论：它和 sysa 是同一种模型，不是 sysb

| | sysa | sysb | **sysc** |
|---|---|---|---|
| 鉴权 | 无 | Bearer Token | **无**（凭 CDK 本身） |
| 能否预先查卡 | 能 | 文档禁止 | **能，而且权威** |
| 同步/异步 | 同步出结果 | 异步下单 + 轮询 | **异步下单 + 轮询** |
| 幂等锚 | 无 | order_id | **无 —— 靠「每次都先读状态」** |
| 失败后卡密 | 看 code | 看 failure | **自动回滚成未使用，可重充** |

所以 sysc 的适配器 = sysa 的「可预检」 + sysb 的「异步轮询」。

---

## 1. 基础

- Base：`https://chuanwen.applelll.com`（Cloudflare 回源，`Server: cloudflare`）
- 所有接口都挂在 `/api/store/*`，**全部匿名**，不需要 Cookie、Token、签名
- `ref`：店铺标识，每个请求都要带。取值规则（前端 `getRef()`）：
  1. 路径 `/s/<ref>` → 用它
  2. 否则主域名的子域 → 取子域
  3. 否则整个 hostname
  即 `chuanwen.applelll.com` → **`ref = "chuanwen"`**
- 时区：返回的时间戳是 UTC 裸时间（没有 `Z`），前端自己 `+8` 当北京时间显示。
  我们这边统一按 UTC 解析，别重复加 8 小时。

### 1.1 写请求必须带的三个头（**不是签名**）

```
Content-Type: application/json
X-ASP-Timestamp: <Math.floor(Date.now()/1000)>
X-ASP-Nonce:     <18 字节随机 → base64url，去掉 = 号>
Idempotency-Key: <和 X-ASP-Nonce 完全相同的那个值>
```

前端原文：

```js
var b=new Uint8Array(18); crypto.getRandomValues(b);
var n=btoa(String.fromCharCode.apply(null,b)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
h["X-ASP-Timestamp"]=String(Math.floor(Date.now()/1000));
h["X-ASP-Nonce"]=n;
h["Idempotency-Key"]=n;
```

**没有 HMAC、没有密钥、没有对 body 的签名。** 只有时间戳 + 随机数防重放。
GET 请求不需要这三个头。

> **【Idempotency-Key 不能当幂等键用】** 名字很像，但对方前端每次请求都塞一个**新的随机值**，
> 和 nonce 同一个值。这说明它在服务端被当成 nonce 校验（同值可能直接被拒），
> 而不是「同值 → 返回上次结果」的幂等语义。
> 所以我们**绝不依赖它防重复扣卡**，见 §5。

已实测（2026-10-19）：

- 按上面三个头 POST `/api/store/redeem/status-batch` 返回 200 —— 头的构造是对的
- **时间戳不做校验**：拿不存在的卡密打批量接口，`X-ASP-Timestamp` 偏移
  `0 / ±300 / ±3600` 秒**全部返回 200**（`npx tsx scripts/probe-sysc.ts skew` 可复现）。
  所以我们不依赖服务器时钟同步；但仍然按真实时间发，以免对方哪天收紧。

---

## 2. `GET /api/store/site?ref=<ref>` · 店铺与商品清单

公开、无需任何头。这是**把 CDK 的 `product_name` 翻译成 `product_id` / `platform` 的唯一依据**。

```jsonc
{
  "brand_name": "兑换中心",
  "slug": "chuanwen",
  "products": [
    { "product_id": 5,    "name": "GPT5x",        "platform": "gpt",    "sku": "chatgpt_pro_5x_m",      "recharge_method": null, "upstream_pool": "main" },
    { "product_id": 8,    "name": "Claude Pro",   "platform": "claude", "sku": "claude_pro_m",          "recharge_method": null, "upstream_pool": "main" },
    { "product_id": 1262, "name": "Claude Pro 年付","platform": "claude","sku": null,                    "recharge_method": 2,    "upstream_pool": "game" }
    // …
  ],
  "guide": "…取号指引纯文本…",
  "faq": "…",
  "claude_sessionkey_enabled": true
}
```

2026-10-19 实测全量（16 个）：

| product_id | name | platform | sku | recharge_method | pool |
|---|---|---|---|---|---|
| 7 | GPTgo | gpt | chatgpt_go_m | – | main |
| 4 | GPTplus | gpt | chatgpt_plus_m | – | main |
| 11 | chatGPT plus年 | gpt | chatgpt_plus_y | – | main |
| **5** | **GPT5x** | **gpt** | **chatgpt_pro_5x_m** | – | main |
| 6 | GPT20x | gpt | chatgpt_pro_20x_m | – | main |
| 1315 | GPT50x | gpt | chatgpt_pro_50x_1m_ext | – | main |
| 8 | Claude Pro | claude | claude_pro_m | – | main |
| 9 | Claude 5x | claude | claude_max_5x_m | – | main |
| 10 | Claude 20x | claude | claude_max_20x_m | – | main |
| 1262 | Claude Pro 年付 | claude | – | 2 | game |
| 12 | SuperGrok1个月 | grok | grok_pro_m_20260804 | – | main |
| 1264/1266/1267/1268/1269 | SuperGrok Plus/Pro/Heavy/Lite … | grok | – | 2 | game |

- `platform` ∈ `gpt` / `claude` / `grok`，**决定买家要填什么**（见 §3.1）
- `recharge_method` 只在 1 或 2 时前端显示「充值方式N」，语义对方没公开。
  `upstream_pool: "game"` 的那批都是 2 —— **我们要拿的 GPT5x 是 `main` / `null`**
- `sale_price` / `stock` 在这个 ref 下全是 `null`，拿不到价和库存

> **【已确认，2026-10-19】** 站长拿到的 5 张测试卡（`VCK-` 前缀）查出来
> `product_name` 全部是 **`GPT5x`** —— 也就是 **`product_id: 5` / `chatgpt_pro_5x_m` / `platform: gpt` / main 池**。
> 所以对方口中的「iOS 订阅渠道的 pro5x」就是这个商品，清单里没有第二个 5x，
> 也没有 iOS / 信用卡的通道区分。
>
> 顺带确认了 `ref = chuanwen` 是对的：这些卡在这个 ref 下查得到。

---

## 3. `POST /api/store/redeem` · 下单（不可逆，会消耗卡密）

带 §1.1 的三个头。两种互斥的提交方式。

### 3.1 方式 A：按账号 ID 充（gpt / claude / grok 都能用）

```jsonc
{
  "ref": "chuanwen",
  "cdk": "<卡密原文>",
  "product_id": 5,
  "account_id": "96eae38f-b751-4079-b116-484bd746c477",  // 必填，标准 UUID
  "email": "buyer@example.com",                           // 选填，但强烈建议带
  "acct_structure": "personal",                            // 选填，GPT 判个人号用
  "acct_plan": "free"                                      // 选填
}
```

各平台 `account_id` 取哪个值：

| platform | account_id | 从哪来 |
|---|---|---|
| gpt | `account.id`（**不是 `user.id`**） | `chatgpt.com/api/auth/session` 整段 JSON 里的 `account.id` |
| claude | Organization ID | `claude.ai/settings` 的 Organization ID |
| grok | 用户 UUID | `grok.com/api/auth/session` 的 `session.userId` |

对方前端的处理，我们必须照抄：

- `account_id` 一律先剥成**纯 UUID**：整段 session JSON 贴进来时，只 `JSON.parse` 取 `account.id`，
  **不做正则兜底**，取不到就原样发给服务端报错（`extractId`）
- **`email` 必须单独带**。因为输入框被剥成 UUID 之后服务端再也解析不出邮箱，
  而「实际充到哪个邮箱」是售后唯一的凭据。前端注释原话：
  「只送邮箱，不送整段 session（里面有 access token，不该上传落库）」。
  **这条对我们同样是硬约束：绝不把整段 session 发给 sysc。**
- `acct_structure` / `acct_plan` 只取 `account.structure` 和 `account.planType|plan_type|plan`，
  各截断 32 字符
- **GPT 的 Team / 企业工作区要在本地直接拒掉**，别浪费一张卡。判据（`teamEvidence`）：
  - `account.structure` 存在且不等于 `personal`
  - 任一 `accounts[*]` 的 `planType` / `plan_type` / `plan` 命中
    `team|business|enterprise|workspace|edu`
  - `accessToken` 的 JWT payload 里 `https://api.openai.com/auth`.`chatgpt_plan_type` 命中同一组词
  - 拿不到明确判据就放行 —— **宁可漏判也不能拒掉正常个人号**

### 3.2 方式 B：Claude 用 sessionKey 充（仅 `claude_sessionkey_enabled: true` 时）

```jsonc
{ "ref": "chuanwen", "cdk": "…", "product_id": 8, "session_key": "sk-ant-sid…" }
```

不传 `account_id`，服务端自己拿 sessionKey 去 claude.ai 查 organization uuid。
前端注释：「号被封 / 风控 / key 失效都会在**扣卡之前**被拦下（服务端保证顺序）」。
**对 Claude 来说这条路比方式 A 安全**，但代价是我们要把 sessionKey 转发给对方。

### 3.3 响应

- 成功：`200`，body `{ "account_id": "…", "email": "…" }`
  （`email` 是**服务端识别到的那个**，才是真正充值用的；方式 B 还会回填 `account_id`）
  → **此时只是「已受理」，不是「已成功」**，必须转去轮询 §4
- 失败：非 200，body `{ "detail": "<中文原因>" }`

> `detail` 是对方的原始文案，**不能直接透传给买家**（会泄漏货源、措辞也对不上）。
> 按 `providers/sysc.ts` 里的映射表转成我们自己的话。

---

## 4. `GET /api/store/redeem/status?ref=<ref>&cdk=<cdk>` · 查单条

不需要任何头。这是**判断一张卡当前到底什么状态的权威接口**。

- CDK 不存在 → `404`，body `{"detail":"CDK 无效"}`（已实测）
- 存在 → `200`，字段与 §4.2 的 batch 单元素一致

### 4.1 状态机（前端 `classifyStatus` 的原样翻译）

判定**必须按这个顺序**，顺序错了会把「可能成功」当成失败再充一次：

| # | 条件 | 含义 | 我们的 RedeemState |
|---|---|---|---|
| 1 | `found === false` | 卡不存在 | `NOT_FOUND` |
| 2 | `status === "redeemed"` 或 `task_status === "success"` | 已充成功 | `COMPLETED` |
| 3 | `task_status === "possible_success"` | **余额已变动，可能成功，等人工核对** | `PROCESSING`（**绝不重充**） |
| 4 | `task_status ∈ {failed, internal_error, cancelled, timeout}` | 上次失败，**卡密已自动回滚** | `ERROR`，可重试 |
| 5 | `status === "redeeming"` | 正在充 | `PROCESSING` |
| 6 | `status === "active"` | 未使用 | `READY` |
| 7 | `status === "refunded"` | 已退回 | `VOID` |

`status` 的四个值：`active` 未使用 / `redeeming` 兑换中 / `redeemed` 已兑换 / `refunded` 已退回。
`task_status` 的十个值：`pending` `queuing` `processing` `retrying` `success`
`possible_success` `failed` `internal_error` `cancelled` `timeout`。

两条关键语义，是整个适配器安全性的地基：

> **【失败会自动回滚】** 前端文案原话：「上次充值失败(卡密已回滚,可重新充值)」，
> FAQ 原话：「失败会自动回滚 CDK,可重试」。
> 所以 §4.1 第 4 行之后 `status` 会回到 `active` —— **失败是可重试的，不是废卡**。

> **【possible_success 是最危险的一格】** 文案「余额已变动，可能成功，请等待人工核对」。
> 对方已经扣了钱、但没法确认权益到没到。这一格**既不能当成功交付、也绝不能重充**，
> 必须停下来转人工。和 sysb 的 `manual_review` 同一类。

### 4.2 `POST /api/store/redeem/status-batch` · 批量查（一次最多 100 个）

带 §1.1 的三个头。`{ "ref": "chuanwen", "cdks": ["…", "…"] }`

实测响应（2026-10-19，用一个不存在的码）：

```json
{
  "results": [{
    "cdk": "ZZZZ-NOT-A-REAL-CODE-0000",
    "found": false, "status": null, "task_status": null, "message": null,
    "product_name": null, "redeem_account_id": null, "redeem_email": null,
    "attempt": null, "retried": false, "redeemed_at": null, "history": []
  }],
  "total": 1, "found": 0
}
```

字段：

| 字段 | 说明 |
|---|---|
| `found` | 卡在不在。**单条 GET 不返回这个，它直接 404** |
| `status` / `task_status` | 见 §4.1 |
| `message` | 对方的失败原因原文，**只给客服看，不给买家** |
| `product_name` | 对方的商品名，如 `GPT5x`。**→ 用 §2 的清单反查 product_id / platform** |
| `redeem_account_id` / `redeem_email` | 实际充到的账号 / 邮箱。售后凭据，必须落库 |
| `attempt` / `retried` | 对方会**自动换号重试**；`retried: true` 时 `status` 仍是 `redeeming`。**`attempt` 在没充过的卡上就已经是 `1`**（实测），所以「换过号」只能看 `retried` 或 `history.length`，不能看 `attempt > 1` |
| `redeemed_at` | UTC 裸时间 |
| `history[]` | `{ attempt, status, message, updated_at }`，每次尝试一条 |

还有 `POST /api/store/redeem/status-batch/export`（同样 body）用于导出，我们用不上。

> **批量接口是对账的利器**：一次 100 张，拿 `status` + `redeem_email` + `redeemed_at`
> 和我们自己的 `card_keys` / `redeem_logs` 对一遍，能查出「我们以为成功、对方其实失败」这类错账。
> 建议后面做一个 `scripts/` 对账脚本。

### 4.3 对方前端的轮询节奏（我们照着抄，不要更密）

- 兑换轮询：前 2 分钟 **2.5 秒**一次，之后退避到 **5 秒**，总窗口约 **25 分钟**（340 次）
- 注释原话：「会自动换号重试，总耗时比单次长，所以窗口拉长到约 25 分钟」

我们这边前端的轮询下限是 15 秒（`redeem-client.tsx`），比对方宽松，直接沿用即可。
**但要把 `activate()` 的「等结果」窗口放到 25 分钟量级**，别 2 分钟就判失败。

---

## 5. 防重复扣卡（**本次对接最重要的一节**）

sysc **没有任何幂等键**（§1.1 已说明 `Idempotency-Key` 不可依赖）。
同一张卡并发 POST 两次，就是两笔真实扣款。我们靠三道闸：

1. **`claimIrreversible()`**（`service.ts` 的 `claimForIrreversibleRedeem`）
   —— 一条 `WHERE redeem_lock_at IS NULL` 的 UPDATE，数据库裁决，挡住并发。
   和卡付 V1 用的是同一道锁。
2. **下单前必须先 `GET status`**，只有 `status === "active"` 才允许 POST。
   `redeeming` / `redeemed` / `possible_success` 一律停手。
3. **POST 超时 / 断网后，绝不重发 POST** —— 改成去 `GET status`：
   - `redeeming` / `redeemed` → 那笔落地了，转轮询
   - `active` → 没落地（或已回滚），才允许再发一次

第 3 条是 sysc 比 sysb 好做的地方：对方的按 CDK 查状态是**权威且实时**的，
我们不需要自己造订单号来对账。**代价是绝不能省掉那次查询。**

### 5.1 占位必须放得掉（`releaseIrreversibleClaim`）

`claimIrreversible()` 那把锁要 **15 分钟**才过期。而 sysc 有两种「卡还在、可以立刻重充」的情况：

- 上游当场拒了（账号 ID 填错、Team 号）—— 卡一点没动
- 充值失败，上游**自动把卡回滚成未使用** —— §4.1 第 4 行

两种都是「好卡 + 已经改对的输入」。不把锁放掉，买家会被自己的锁挡住干等 15 分钟，
而我们的文案还写着「可以重新提交」—— 那句话就成了假话。

所以新增了 `service.ts` 的 `releaseIrreversibleClaim()` 与 activate 的 `releaseIrreversible` 回调。
**它的举证责任在适配器**：`sysc.ts` 的 `releaseIfUntouched()` 会先向上游查一次，
只有 `status === 'active'` 且不是 `possible_success` 才放锁；查不动或状态对不上就**保留锁**。
查不到这种权威状态的平台（卡付 V1）不许用这个回调。

---

## 6. `POST /api/store/remedy` · 强刷（Claude 专用）

```jsonc
{ "ref": "chuanwen", "cdk": "…", "session_key": "sk-ant-sid…" }
```

- 前端只校验 `session_key.startsWith("sk-")`，且这个入口只在 Claude 下给出
- 成功 → `200` `{ "mission_id": "…" }`；失败 → 非 200 `{ "detail": "…" }`
- 轮询 `GET /api/store/remedy/status?ref=<ref>&id=<mission_id>`，2.5 秒一次约 7.5 分钟
- 响应 `{ "status": "...", "message": "...", "redeem": { "expires_date": "…" } }`
  - `status === "success"` → 成功，`redeem.expires_date` 是新的到期日
  - `status ∈ {failed, internal_error, cancelled, timeout}` → 失败
  - 其余值当「处理中」

对应我们 `RedeemProvider.rebind()`。**我们拿的是 GPT5x，这条路暂时用不上**，
实现了也只对 Claude 卡开放。

---

## 6.5 已有订阅的号：本地强制门（2026-10-19 加）

**对方已确认：在已有订阅的账号上充值会「直接覆盖」，原有会员的剩余时间作废。**
对方自己的前端对此没有任何提示，所以这道门必须我们自己加。

### 6.5.1 和 sysa 那套的区别：主动 vs 被动

| | sysa | **sysc（我们的做法）** |
|---|---|---|
| 怎么发现 | 先提交 → 上游回 `account.plan_not_allowed` → 买家才看到 | **提交前**从买家粘的 session 里当场读出档位 |
| 代价 | 白费一次尝试 | 零 |
| 实现位置 | 上游的错误码 | `detectPaidPlan()` + `pickAccountArgs()` 里 throw |

拦下的位置很关键：`pickAccountArgs` 在 `activate()` 里排在 `claimIrreversible()` **之前**，
所以不勾框的提交**既不消耗卡密、也不会白占那把 15 分钟的锁**。

sysb 没有这个概念（代码里明确写了不许传 `overwrite` 之类的额外字段）。

### 6.5.2 档位从哪读：**JWT claim 优先，`account.planType` 不可信**

session 里有两处写着档位，**它们会不一致**。2026-10-19 拿一个真实的已订阅账号对过：

| 来源 | 值 | 对不对 |
|---|---|---|
| session 的 `account.planType` | `plus` | ❌ **错的** |
| 同一份 session 的 accessToken JWT `chatgpt_plan_type` | `prolite` | ✅ |
| ChatGPT 官方 `accounts/check` 的 `subscription_plan` | `chatgptprolite` | ✅ |

所以 `detectPaidPlan()` **先读 JWT**（那是 OpenAI 签过名的），读不出来再退回
`account.planType`。展示给买家的档位名以 JWT 为准，否则会告诉他一个错的档位。
「是不是付费」仍然是两个来源任一命中就算 —— 宁可多问一句，不能漏。

### 6.5.3 判据用**反向白名单**：不是 `free` 就算付费

参照站 `b.171mail.com/#/home/chatgpt-sub` 的分类函数是正向匹配：

```js
includes('plus')→plus, includes('pro')→pro, includes('team')→team,
includes('enterprise')→enterprise, 其余一律落到 free
```

于是 **ChatGPT Go 这种付费档位会被它判成「免费计划」** —— 而 Go 是真实在售的
（对方商品列表里就有 GPTgo，§2）。两种错判的代价差着量级：

- 漏判 → 买家静默损失剩余会员时间，不可恢复，必然是客诉
- 误判 → 多勾一个确认框

所以我们只认 `free` 是免费，其余一概当「有订阅」。新档位出现时自动被覆盖。

### 6.5.4 已知局限：裸 UUID 读不出档位

买家走 `uid` 备选通道时我们拿不到 session，也就读不出档位，只能放行。
和 sysa 一样（它的 force 也只对 Session 通道有效）。
要堵死就只能取消 uid 通道，那会把拿不到 session 的买家卡死，不值得。

`force` **不发给对方** —— 那是个对方协议里没有的参数，发过去可能直接 400。
它只是我们这边的知情同意闸。

## 6.6 为什么不做「实时查订阅」：**服务器连不上 chatgpt.com**

调研过把判据换成实时查询（参照站就是这么做的，它的后端代为请求）。
官方端点确实可用，2026-10-19 在**本机**实测：

```
GET https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27
Authorization: Bearer <accessToken>
→ 200，accounts['<account_id>'].entitlement = {
    has_active_subscription: true,
    subscription_plan: "chatgptprolite",
    expires_at: "2026-11-16T17:07:43+00:00",   ← 能算出「还剩多少天」
    renews_at, cancels_at, billing_period: "monthly",
    billing_currency: "PHP", is_delinquent: false
  }
  accounts['<id>'].last_active_subscription = {
    purchase_origin_platform: "chatgpt_web",   ← web 还是 iOS 买的
    will_renew: false, cancellation_outcome: "deactivate"
  }
```

（参照站前端展示的 `seats_in_use` / `active_until` / `will_renew` / `is_delinquent` /
`billing_currency` 这些字段名就是从这里透传的。另外 `/backend-api/subscriptions`
要带 `account_id` 或 `organization_id`，否则 400；`/backend-api/me` 只有用户信息没有订阅。）

**但我们的 ECS（cn-beijing）根本连不上**：

```
curl https://chatgpt.com/backend-api/accounts/check/... → curl: (28) Connection timed out (20s)
curl https://api.ipify.org                             → 同样不通
```

所以实时查询在生产环境走不通。要做只有一条路：**走 Cloudflare Worker 中继**
（仓库里已有这个模式：`cloudflare/news-relay.worker.js` + `NEWS_RELAY_URL`）。
但那意味着把买家的 accessToken 经过多一跳我们自己运维的组件，
而 §7 第 3 条红线正是「凭据只过路、不留痕」—— 这是个需要单独拍板的取舍，没有顺手做。

**端点本身是未公开的**（搜不到任何官方文档），随时可能改名或下线。
这也是不把它做成硬依赖的理由之一：现在这套本地判据不依赖任何外部接口。

## 6.7 人机校验：对方 2026-10-30 新增 Cloudflare Turnstile（**sysc、sysd 同时受影响**）

**现象**：卡#3066（`VCK-…-AFTT`，Claude Pro）在本站连提 5 次都显示「充值系统拒绝了本次提交，请核对账号信息」，
同一张卡在对方页面上 19:35 充成了。我们的日志里对方的原文是：

```
400 {"detail":"人机校验还没完成,请等方框打上勾再点(网络连不上 Cloudflare 时会一直转)"}
```

**协议变化**（对方页面 `last-modified: 2026-10-30 09:57 UTC`，与 10-24 版逐行对比，只改了这一处）：

- `GET /api/store/site` 多了 `turnstile_site_key`（chuanwen 与 niuniu888 是同一个 key）
- `POST /api/store/redeem`、`POST /api/store/remedy` 的 body 要带 `turnstile_token` —— 浏览器里 Cloudflare 方框勾选后得到的
  **一次性** token。**校验排在卡密之前**：编造的卡也回同一句（这正好可以用来探测，见下）
- 只读的 `GET /status`、`POST /status-batch` 不受影响，查卡照常

对方代码的注释说 keys 没配时后端 verify 放行，所以这是一个开关，对方可以关，也可以在后端对特定来源放行。

**为什么我们自己解决不了**：token 只有真人的浏览器在对方域名的页面上才拿得到，这道校验就是用来挡服务器直接调接口的。
打码平台、无头浏览器、代过验证这些**不做**：那是绕过对方的安全措施，对方一收紧就全断，也不是合作方该干的事。

**能走通的路（都要对方配合）**：

| 方案 | 对方要做什么 | 我们要做什么 |
|---|---|---|
| **① 放行服务器 IP（推荐）** | 后端 verify 对 `182.92.209.103` 跳过校验 | **什么都不用做**，现有代码直接恢复 |
| ② 发专用凭据 | 给一个代理商 API Key / 请求头，带了就跳过 | 在 `request()` 里带上，要发版 |
| ③ 买家在本站勾方框 | 把 `bigolab.com` 加进 Turnstile 的允许域名，并接受这样来的 token | 兑换页渲染方框、转发 token，要发版；买家多一步 |

**我们这边做了什么**（`providers/sysc.ts` 的 `humanCheckRequired()`）：

- `check()` 发现要校验就不出表单，买家不用白填账号；文案说清「卡有效、没被消耗」，不再让他去核对账号
- `activate()` 不占锁、不发注定失败的提交；万一真被拒了（对方刚开校验）也认得出来，放掉锁、不给重试入口
- **自动恢复**：site key 非空时，发一张编造的卡（`ZZZZ-NOT-A-REAL-CARD-0000`）探测 —— 回人机校验就是还没放行，回卡密无效就是放行了。
  结果缓存：要校验 5 分钟、不要 30 分钟；探测超时或 5xx 不下结论，不能因为网络抖动把通道说成不可用。site key 为空（对方关了）不探测
- 备用按钮：`SYSC_FALLBACK_URL` / `SYSD_FALLBACK_URL`，**默认不设**（设了等于把货源站告诉买家，由站长决定），改它只需 `up -d --no-deps app`

**怎么确认对方放行了**：

```bash
# 服务器上（必须从 ECS 发，放行的是它的 IP）。要校验回「人机校验」那句，放行了回 CDK 无效
curl -s -X POST https://chuanwen.applelll.com/api/store/redeem -H 'Content-Type: application/json'   -H "X-ASP-Timestamp: $(date +%s)" -H "X-ASP-Nonce: probe$(date +%s%N)" -H "Idempotency-Key: probe$(date +%s%N)"   -d '{"ref":"chuanwen","cdk":"ZZZZ-NOT-A-REAL-CARD-0000","product_id":5,"account_id":"00000000-0000-4000-8000-000000000000"}'
# 本机：STORE=sysc|sysd npx tsx scripts/probe-sysc.ts humancheck
```

自测：`npx tsx scripts/check-sysc-human-check.ts`（42 条，全部打桩）。

## 7. 实现时的红线

1. **不透传对方的 `detail` / `message` 给买家** —— 泄漏货源，而且文案对不上。
   按机器可读的 `status` / `task_status` 走我们自己的映射表（和 sysa 一致）。
2. **`cache: 'no-store'` 一个字都不能少。** Next App Router 会把裸 `fetch` 的响应写进磁盘
   数据缓存并无限期复用 —— 「已受理」的响应被回放给后面每个人、而卡根本没提交出去。
   2026-09-09 那次两天静默宕机就是这个坑。
3. **绝不把整段 session JSON 发给 sysc**，只发剥出来的 UUID + 邮箱。对方前端自己就是这么做的。
4. **`possible_success` 单独一格**，既不交付也不重充，转人工。
5. **Team / 企业号本地先拒**（§3.1），省一张卡。
6. **对方的人机校验不绕过**（§6.7）。
7. 本站这边 `resolveCard` 那道「必须是我们自己卖出的卡」的闸原样生效 ——
   sysc 的接口完全匿名，我们要是对任意字符串都转发，就成了对方眼里的撞库跳板，
   而对方看到的是**我们服务器的 IP**。

## 8. 还没确认的事

2026-10-19 用站长提供的 5 张真实测试卡（只读查询，**一张都没消耗**）关掉了大部分：

| # | 事项 | 结论 |
|---|---|---|
| 1 | 「iOS 渠道 pro5x」是哪个商品 | ✅ **`product_id: 5` / `GPT5x` / `chatgpt_pro_5x_m` / gpt / main 池**，见 §2 |
| 2 | `ref` 用什么 | ✅ **`chuanwen`**，测试卡在这个 ref 下查得到。对方哪天给单独子域再改 `SYSC_STORE_REF` |
| 3 | 未使用的卡会不会返回 `product_name` | ✅ **会**（5 张全部返回 `GPT5x`）。所以 product_id 全自动判出，**`SYSC_PRODUCT_MAP` 平时不用配** |
| 4 | `X-ASP-Timestamp` 的时钟偏移容忍度 | ✅ **根本不校验**（±3600 秒全 200），见 §1.1 |
| 5 | 有没有 IP 限频、要不要报备服务器出口 IP | ❓ **还要问对方**（sysb 就有白名单）。只读查询没撞到限频，但写接口不知道 |
| 6 | `recharge_method` 1/2 的语义 | ❓ 还要问对方。我们要拿的 GPT5x 是 `null`，暂时不影响 |
| 7 | 下单（POST /api/store/redeem）的真实行为 | ❌ **没验过** —— 验它必须真扣一张卡。站长明确要求不提交 |

另外实测到一个小细节：**未使用的卡 `attempt` 已经是 `1` 而不是 `null`**，
所以「`attempt > 1` = 换过号」这个判据是错的，要用 `retried` 或 `history.length`。

### 怎么验（拿到测试卡之后）

```bash
# 1. 对方的接口通不通、这张卡什么状态（只读）
npx tsx scripts/probe-sysc.ts status <卡密>

# 2. 我们生产那条代码路径通不通：会判出哪个 product_id、让买家填哪些字段（只读）
npx tsx scripts/probe-sysc.ts check <卡密> "<本站商品名>"

# 3. 干跑：把「会往对方发什么」整个算出来并打印，但不发（只读）
#    session 走 stdin，不落盘、不进 shell 历史
npx tsx scripts/probe-sysc.ts dryrun <卡密> < session.json

# 4. 纯函数自测（不发请求），467 条
npx tsx scripts/check-redeem.ts
```

第 3 步会自己做一次**凭据泄漏自检**：断言发出去的 body 里只有 UUID 和邮箱，
没有 `accessToken` / `sessionToken`。这是 §7 第 3 条红线的机器检查。

真正的写链路（**会扣一张卡**）走正规路径，不要用脚本：
后台导入这张卡（充值系统选「C 系统」）→ 打开 `/redeem/sysc` → 提交。
那条路才完整覆盖了并发锁、「下单前先查状态」、凭据不落库、日志落库这些保护。

### 怎么验（拿到测试卡之后）

```bash
# 1. 只读：看这张卡现在什么状态、我们会判成什么、product_name 有没有
npx tsx scripts/probe-sysc.ts status <测试卡密>

# 2. 纯函数自测（不发请求），467 条
npx tsx scripts/check-redeem.ts
```

写链路（会真的扣卡）走正规路径，**不要用脚本**：
后台导入这张卡（充值系统选「C 系统」）→ 打开 `/redeem/sysc` → 提交。
那条路才完整覆盖了并发锁、「下单前先查状态」、凭据不落库、日志落库这些保护。
