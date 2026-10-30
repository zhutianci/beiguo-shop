# sysd 充值系统 · 接入说明（2026-10-24）

> **2026-10-31 现状：提交被对方的人机校验拦着。** 要让对方发一个 niuniu888 的开放 API Key（店铺级，chuanwen 的不能共用），
> 配到 `SYSD_API_KEY` 后 `up -d --no-deps app` 就切过去，不用改代码。见 `docs/sysc-充值系统-协议逆向说明.md` 第 9 节。

对方：`niuniu888.applelll.com`（页面标题「兑换中心」），站内代号 **sysd**。
和 sysc（`chuanwen.applelll.com`）是**同一套多店铺白标系统的另一家店**。

**协议契约仍以 `docs/sysc-充值系统-协议逆向说明.md` 为准**，本文件只记 sysd 与 sysc 的差别、
这次怎么验的、上线后怎么用。改协议逻辑改 `src/lib/redeem/providers/sysc.ts`，两家店同时生效。

---

## 1. 为什么能直接复用 sysc

2026-10-24 拉两家的兑换页（`GET /`）对比：

| | chuanwen | niuniu888 |
|---|---|---|
| HTML 大小 | 67421 字节 | 67421 字节 |
| md5 | `ab9e6406…32ca2` | `ab9e6406…32ca2`（**完全相同**） |
| `last-modified` | 2026-10-21 06:56 GMT | 同 |

页面里 `getRef()` 按子域取店铺标识（`BASE_DOMAIN="applelll.com"`），所以 niuniu888 的
**`ref = "niuniu888"`**，其余一律相同。逐个核对了 10-21 这一版前端里与协议有关的部分，
和 10-19 逆向时**没有变化**：

- 写请求三个头（`mutationHeaders`）：`X-ASP-Timestamp` / `X-ASP-Nonce` / `Idempotency-Key`（与 nonce 同值），照旧
- `POST /api/store/redeem`：`{ref, cdk, account_id, product_id, email?, acct_structure?, acct_plan?}`；
  Claude SK 方式 `{ref, cdk, session_key, product_id}`，照旧
- `GET /api/store/redeem/status`、`POST …/status-batch`、`POST /api/store/remedy` + `GET …/remedy/status`，照旧
- `classifyStatus` / 轮询节奏（前 2 分钟 2.5 秒、之后 5 秒、约 25 分钟）/ `teamEvidence` / `extractId` / `acctMeta`，照旧
- 10-21 版新增的只是界面层：中英文切换（`applyI18n` / `setLang`）、粘贴 session 时的即时解析卡片（`parseInput`）

## 2. 实现：一个配置，不复制适配器

```
src/lib/redeem/providers/sysc.ts   协议逻辑（唯一一份）+ createStore(cfg) 工厂 + sysc 的配置
src/lib/redeem/providers/sysd.ts   只有 sysd 的配置：key / adminLabel / base / ref / 映射变量名 / 追踪号前缀
src/lib/redeem/registry.ts         注册 sysd
```

| | sysc | sysd |
|---|---|---|
| key（写进 `card_keys.redeem_provider`，**不能改**） | `sysc` | `sysd` |
| 后台辨识名 | C 系统（兑换中心 / chuanwen） | D 系统（兑换中心 / niuniu888） |
| base | `https://chuanwen.applelll.com` | `https://niuniu888.applelll.com` |
| ref | `chuanwen` | `niuniu888` |
| 手工映射变量 | `SYSC_PRODUCT_MAP` | `SYSD_PRODUCT_MAP` |
| 追踪号前缀（`redeem_order_ref`） | `SC-` | `SD-` |
| 商品清单缓存 | 各一份 | 各一份 |

sysc 的行为**一行没变**：工厂只是把原来的模块级常量（BASE / REF / 商品清单缓存）挪进每家店的配置里。
`scripts/check-redeem.ts` 原有 491 条照旧全过，另加了「两家配置互不串」的断言
（ref 串了就是拿别人的店铺下单）。

## 3. 环境变量：三个都不用配

| 变量 | 默认值 | 什么时候才要配 |
|---|---|---|
| `SYSD_BASE` | `https://niuniu888.applelll.com` | 对方换域名 |
| `SYSD_STORE_REF` | `niuniu888` | 对方给我们换店铺 slug |
| `SYSD_PRODUCT_MAP` | 空 | 只在对方查卡结果不带 `product_name` 时（实测会带） |

都不是密钥（对方接口完全匿名、凭 CDK 本身鉴权），已列进 `docker-compose.yml`。

## 4. 实测记录（2026-10-24，只读，**没有提交任何充值**）

**商品清单** `GET /api/store/site?ref=niuniu888` —— 只有 6 个（chuanwen 有 16 个）：

| product_id | name | platform | sku |
|---|---|---|---|
| 4 | GPTplus | gpt | chatgpt_plus_m |
| 5 | GPT5x | gpt | chatgpt_pro_5x_m |
| 6 | GPT20x | gpt | chatgpt_pro_20x_m |
| 11 | chatGPT plus年 | gpt | chatgpt_plus_y |
| 1315 | GPT50x | gpt | chatgpt_pro_50x_1m_ext |
| 8 | Claude Pro | claude | claude_pro_m |

没有 Grok、没有 `recharge_method=2` 的 game 池商品。

**站长给的测试卡 `VCK-…-GHV7`（完整卡密不进仓库）**：查询时（13:36 北京时间）这张卡**已经是
`status=redeemed / task_status=success`**，`product_name=GPT5x`，兑换时间 13:26（北京时间），
在我们开始联调之前就已经被充掉了（不是我们提交的 —— 本次联调全程只发过 GET）。

所以这次只验到了「已完成」这一条展示路径：

```
STORE=sysd npx tsx scripts/probe-sysc.ts check <测试卡密> "ChatGPT Pro 5x 自助充值"
  state COMPLETED / 文案「充值已完成」/ 显示已充到的账号 / 不出表单 / 响应无上游标识 ✓
```

「未使用 → 出表单 → 下单 → 轮询」这条路径的代码与 sysc 完全共用（并有 491 条断言守着），
但**对 niuniu888 这家店还没有用一张未使用的卡实测过**。

## 5. 上线后站长要做的

1. 后台【卡密管理】导入 sysd 的卡时，「本批充值系统」选 **D 系统（兑换中心 / niuniu888）**
2. 拿到一张**未使用**的 sysd 卡后，先只读确认（不消耗卡）：
   ```bash
   STORE=sysd npx tsx scripts/probe-sysc.ts status <卡密>
   STORE=sysd npx tsx scripts/probe-sysc.ts check  <卡密> "<本站商品名>"
   ```
   期望 `READY`，且判出的 product_id 与卡对应的商品一致
3. 第一次真实充值走正规路径：导入 → 订单页「去充值」→ `/redeem/sysd` → 提交。
   要盯的三件事与 sysc 相同，见 `docs/sysc-接入-部署说明.md` 第四节

## 6. 还没确认的

| # | 事项 |
|---|---|
| 1 | 下单（`POST /api/store/redeem`）对 niuniu888 从没跑过 —— 验它必须真扣一张卡 |
| 2 | 对方有没有 IP 限频 / 要不要报备服务器出口 IP（sysc 也没问到） |
| 3 | 已有订阅的号强制充值后对方的实际结果（sysc 同样未验） |

## 7. 部署实录（2026-10-24，sysb 修复与 sysd 一起上线）

| 项 | 记录 |
|---|---|
| 代码 | 服务器 `e943089` → `c91bb38`（`35c5c0e` sysb + `c91bb38` sysd） |
| 回滚标签 | `beiguo-shop-app:rollback-pre-sysd` = `e8ccadece356`（上线前镜像） |
| 环境变量 | `SYSB_CARD_V1` 1 → **0**（站长同意；备份 `.env.production.bak-20261024-142203-pre-cardv1-off`，权限仍 644）。SYSD_* 三个都没配，用默认值 |
| 顺带生效 | 当天 08:56 有人从 `.env.production` 删了 `VMQ_WEBHOOK_ACCEPT_LEGACY`，但旧镜像里打包的那份 `.env.production` 还带着它；这次重建后容器内两处都没有了（与安全加固的意图一致） |
| 构建 | 停 jishi 的 wrapper，14:22 → 17:08，**2 小时 46 分钟**（全程换页，可用内存 136~150MB、swap 1.0~1.46G）。`build_exit=0`、`[prerender] routes=0`；告警只有既有的 jose / Edge Runtime 两条；swappiness 两项还原为 0、无残留 state；jishi 17:08 自动拉回 3/3 |
| 切换 | 17:09:54 确认 0 笔待支付后 `up -d --no-deps app`，新镜像 `508187a31c5b`，4 秒 200，`✓ Ready in 428ms`，繁体代理 3001 正常 |
| 容器内 | `SYSB_CARD_V1=0`、`SYSB_API_TOKEN` 在；`/app/.env.production` 644 |
| 冒烟（容器网络） | `/redeem/sysa|sysb|sysc|sysd` 200、`/redeem/sysz` 404；四个兑换页标题都是「贝果科技 · AI会员自助充值系统」、上游标识 0；三家 check 接口拿编造的卡密都回我们自己的文案（不往上游转发） |
| 冒烟（ECS 出站） | 鸿运 `/account` 带 UA 200（`api_revision 2026-10-22`、worker online、card+ios）；只读查卡带视图头 200；niuniu888 商品清单 200（6 个）、chuanwen 200（16 个）。偶发一次 `fetch failed`，重试即好（10-08 记过的出站连接问题） |
| 旧单兼容 | 线上 6 笔最近的 `BG-` 单（都是停服期间的失败单）和 2 笔历史成功单都带 `result_confirmed=true` —— 收紧后的判定不影响老卡的展示 |
| 公网（Cloudflare） | 首页 / 商品 / 四个兑换页 200、`/redeem/sysz` 404、`/zh-hk/` 200、渠道站 `lulu…/zh-hk/` 仍 404；公网 `/redeem/sysd` 无上游标识 |

**并行会话**：17:10:28 安全加固会话在 `203e9c1`（建在 `c91bb38` 之上，含本次改动）上又起了一轮停 jishi 的构建，
所以 jishi 在 17:10 又被停掉，由那一轮的 wrapper 负责拉回。那一轮切换后 sysb / sysd 仍在。
