# sysc 接入 · 部署说明（2026-10-19）

协议契约在 `docs/sysc-充值系统-协议逆向说明.md`，**改 sysc 的代码前先读那一份**。
本文件只讲这次怎么上线、以及上线后站长要做什么。

## 一、这次上了什么

| commit | 内容 |
|---|---|
| `9b6fcf3` | 接入 sysc 充值系统（适配器 + 注册 + 协议文档 + 只读探针脚本） |
| `cd693a6` | 已有订阅的号必须勾「强制充值」才能提交 |

新增 / 改动的文件：

```
新增  src/lib/redeem/providers/sysc.ts              适配器（协议全锁在这一个文件里）
新增  scripts/probe-sysc.ts                         只读探针：site/status/check/dryrun/skew
新增  docs/sysc-充值系统-协议逆向说明.md             协议契约
改    src/lib/redeem/registry.ts                    注册 sysc
改    src/lib/redeem/types.ts                       activate 入参加 productName、releaseIrreversible
改    src/lib/redeem/service.ts                     新增 releaseIrreversibleClaim()
改    src/app/api/redeem/[provider]/activate/route.ts  把上面两个传给适配器
改    scripts/check-redeem.ts                        sysc 断言（全套 491 条）
改    docker-compose.yml                             SYSC_BASE / SYSC_STORE_REF / SYSC_PRODUCT_MAP
```

**没有 schema 改动**，所以不需要 `db push`，部署顺序没有特殊要求。

## 二、环境变量：**三个都不用配**

| 变量 | 默认值 | 什么时候才需要配 |
|---|---|---|
| `SYSC_BASE` | `https://chuanwen.applelll.com` | 对方换域名 |
| `SYSC_STORE_REF` | `chuanwen` | **对方给我们单独的子域 / 店铺 slug 时必须改**（它决定结价与归属） |
| `SYSC_PRODUCT_MAP` | 空 | 只在对方查卡结果不带 `product_name` 时才用得上。实测会带，所以平时不配 |

三个都不是密钥 —— 对方的接口完全匿名、凭 CDK 本身鉴权，没有 Token 可配。
已经列进 `docker-compose.yml` 的 `environment`（漏了会静默不生效）。

## 三、上线前后要确认的

### 上线后立刻（不需要卡密）

```bash
# 1. 兑换页存在（不是 404），且页面上不出现上游标识
curl -s https://bigolab.com/redeem/sysc | grep -c "贝果科技"      # 应 >=1
curl -s https://bigolab.com/redeem/sysc | grep -ciE "applelll|chuanwen|兑换中心"  # 应为 0

# 2. 后台导入卡密的下拉里出现「C 系统（兑换中心 / chuanwen）」
#    后台 → 卡密导入 → 充值系统下拉
```

### 拿到卡密之后（站长做）

```bash
# 服务器上，只读，不消耗卡密
cd /opt/beiguo/beiguo-shop
docker compose --env-file .env.production exec -T app node -e "…"   # 或在本机跑：
npx tsx scripts/probe-sysc.ts status <卡密>     # 这张卡什么状态
npx tsx scripts/probe-sysc.ts check  <卡密>     # 我们会判出哪个渠道、让买家填什么
```

**写链路（会真的扣一张卡）必须走正规路径**，不要用脚本：
后台导入一张卡（充值系统选「C 系统」）→ 打开 `/redeem/sysc` → 提交。
只有这条路才覆盖了并发锁、「下单前先查状态」、凭据不落库、日志落库这几道保护。

## 四、第一次真实充值要盯的三件事

1. **成功路径**：提交后页面进「正在充值」自动轮询（≥15 秒一次），1-3 分钟出结果。
   后台 `redeem_logs` 里这张卡应有 `SUBMITTING`（带 trace 号）→ `PROCESSING` / `COMPLETED`。
2. **已有订阅的号**：拿一个已订阅的号试一次**不勾**强制框 —— 应当当场被拦下，
   报出具体档位，并且**这张卡仍然可以重新提交**（去 `probe-sysc.ts status` 确认还是 `active`）。
3. **possible_success**：如果出现这一格（「余额已变动，可能成功」），
   **不要重复提交**，直接联系对方核对。这一格我们既不交付也不重充，设计如此。

## 五、回滚

```bash
cd /opt/beiguo/beiguo-shop
docker tag beiguo-shop-app:rollback-pre-sysc beiguo-shop-app:latest
docker compose --env-file .env.production up -d --no-deps app
```

sysc 的代码对买家是**休眠**的：只有库里存在 `redeem_provider='sysc'` 的卡密、
而且那张卡已发出（status=USED），买家才可能走到这条路径。
所以万一 sysc 有问题，先把那批卡在后台停用，比回滚镜像更快、也不影响别的功能。

## 六、还没验证 / 还要问对方的

| # | 事项 |
|---|---|
| 1 | **下单（POST /api/store/redeem）从没跑过** —— 验它必须真扣一张卡 |
| 2 | 对方有没有 IP 限频、要不要报备我们服务器出口 IP（sysb 就有白名单） |
| 3 | `recharge_method` 1/2 的语义（我们要的 GPT5x 是 null，暂不影响） |
| 4 | 已订阅的号强制充值后，对方那边的实际结果（覆盖成功？还是报错？） |

## 七、本次部署实录

| 项 | 记录 |
|---|---|
| 回滚标签 | `rollback-pre-sysc`（镜像 `bb621ebfe8f9`） |
| 构建前磁盘 | 94%，可用 2.5G（`build-with-swap.sh` 的下限是 2048MB，刚够） |
| 清理 | 删了 28 个 3 周以上的回滚标签 —— **一点空间都没释放**（层被保留的镜像共用）；`docker image prune` 也是 0B |
| 构建 | 待填 |
| 切换 | 待填 |
| 冒烟 | 待填 |

> **磁盘是这台机器现在最紧的那根弦。** 删旧标签已经不管用了（层共用），
> 下次构建前要么扩盘，要么找别的腾空间办法。
