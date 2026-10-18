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

## 七、本次部署实录（2026-10-19 凌晨）

| 项 | 记录 |
|---|---|
| 回滚标签 | `rollback-pre-sysc` = 镜像 `bb621ebfe8f9` |
| 腾磁盘 | 构建前 94% / 可用 2.5G。**删 28 个 3 周以上的回滚标签释放 0B**（层被保留的镜像共用），`docker image prune` 也是 0B；真正占地方的是 **docker 构建缓存**，`docker builder prune -f` 放出 **12G**（94% → 48%）。耗时约 25 分钟，期间 `docker inspect` 都超时过一次 |
| 拉代码 | `aafb920` → `99c5f0d` |
| 构建 | wrapper（停 jishi → build-with-swap → 自动拉回 jishi）01:18:41 → 02:40:33，**82 分钟**（编译阶段占绝大部分，可用内存压到 142MB、全靠 swap）。新镜像 `3ac21fc711a5`；swappiness 已还原 0、无残留 state；jishi 三容器 02:40:41 自动恢复 |
| 切换 | 02:42:47 确认 0 笔待支付后 `up -d --no-deps app`，app `✓ Ready in 403ms`，nginx→app 200（0.6s） |
| 冒烟 | `/redeem/sysc` 200；页面上 `applelll` / `chuanwen` / `兑换中心` / `GPT5x` 全为 0，「贝果科技」在；`/redeem/sysa|sysb|sysc` 都 200、`/redeem/sysz` 404（注册表生效）；`check` 接口拿假卡密回的是我们自己的文案而不是 500；后台 providers 接口 401（需鉴权，正常）。外网经 Cloudflare 复验：首页 / `/redeem/sysc` / `/products` 都 200，无上游泄漏 |

### 7.1 踩到两个坑，都已修进脚本

**坑一：`curl 127.0.0.1:3000` 必然 HTTP 000。** app 容器是 `ports=[3000/tcp]`——
**暴露但没发布到宿主**，只有 docker 网络内能访问。切换后要验活请走
`docker exec beiguo-nginx curl http://app:3000/` 或本机 `curl -H "Host: bigolab.com" http://127.0.0.1/`。
第一次差点误判成「应用没起来」。

**坑二：停 jishi 的构建，`build-with-swap.sh` 的退出码本来是不可读的。**
它的存活检查里 jishi 的 cloudflared 是**自动发现**的（不在 `ALIVE_CONTAINERS` 里，光改那个挡不住），
于是停了 jishi 必然命中 `DEAD` 分支 → `exit 4`，而那个 `exit 4` 发生在
「构建退出码」和「镜像换没换」两个检查**之前**，把它们完全掩掉。
历史部署实录里把这个 4 记成「预期的」，等于永久屏蔽了这个检查 ——
真有 `beiguo-app` / `beiguo-db` 被 OOM 杀掉，看到的也是同一个 4。

已修两处：

- `build-with-swap.sh`：自动发现改成 `EXTRA="${EXTRA_CONTAINERS-$(…)}"`，
  显式传空串才跳过（没传的照旧，老用法行为不变）；`DEAD` 分支现在把
  `build_code=` 与 `image_changed=` 一起打进日志和 `RESULT` 行
- `build-stop-jishi.sh`：传 `ALIVE_CONTAINERS="beiguo 四件套" EXTRA_CONTAINERS=""`

下次停 jishi 构建应当拿到 `build_exit=0`；再出现 4 就是**真的**有站点容器挂了。

### 7.2 顺带发现：`build-with-swap.selftest.sh` 本身是坏的（**先存着，不是这次改的**）

在服务器上跑它：**5 通过 / 12 失败**，失败里一片 `退出码 127`（command not found）、
`cat: /fake/cg/… No such file or directory`。
拿我改动**之前**那版（`99c5f0d`）跑同一个自测：**同样 5 通过 / 12 失败，一字不差** ——
所以这是既有问题，不是这次改坏的。

但它意味着一件不太好的事：**`build-with-swap.sh` 会改生产内核参数
（`vm.swappiness`、buildkit 内存组），而它的自测目前验证不了任何东西。**
真正能兜住的只有脚本里的 `trap` + `STATE_FILE` + `--restore`，以及每次构建后
人工确认 `swappiness` 回到 0、没有残留 state（这次都确认过了）。
值得单独修一轮。

> **磁盘的结论**：别再浪费时间删回滚标签（层共用，删了不释放）。
> 紧张时直接 `docker builder prune -f`，但它很慢（25 分钟）且期间机器很卡，
> 要留足时间、别和构建抢。
