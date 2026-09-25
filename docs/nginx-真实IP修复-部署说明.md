# nginx 真实 IP 修复：部署说明（2026-09-25）

## 一、修的是什么

nginx 把客户端自己带来的 `CF-Connecting-IP` / `X-Forwarded-For` 原样转给了 app，
而宿主机 80 又对公网开着。直连服务器 IP、自己写一个 `CF-Connecting-IP`，app 就当它是真实 IP：
全站按 IP 的限流（领券每 IP 一张、兑换、上传、开票填写、新闻浏览/分享计数、友链点击……）
和日志、通知里的 IP 全都能随手伪造。另外 realip 只信任 Cloudflare 边缘段，
而隧道流量来自 cloudflared 容器的内网 IP，realip 实际上从没生效过。

本地用真 nginx（同为 `nginx:alpine`）复现过：旧配置下直连伪造 `6.6.6.6`，app 收到的就是 `6.6.6.6`。

## 二、怎么修的

**信任跟着监听口走，不跟着源地址走。** nginx 开两个口：

| 容器端口 | 谁连 | 信不信 `CF-Connecting-IP` |
|---|---|---|
| 80 | cloudflared（隧道 ingress 配的是 `nginx:80`，走容器网络） | 信（Cloudflare 边缘会覆盖访客自带的值）。**不映射到宿主机** |
| 8080 | 宿主机 80 映射到这里：公网 IP 直连 + 服务器上 `curl http://127.0.0.1` | 不信。用 TCP 对端地址覆盖后经回环转给容器 80 |

两个口共用容器 80 的同一套 location，路由和 CVE-2025-29927 那道清洗只维护一份。
转给 app 时 `CF-Connecting-IP`、`X-Forwarded-For`、`X-Real-IP` 三个头一律写成核实后的地址，
app 里各处的取 IP 写法（共用的 `clientIp()` 和几个路由里的同款副本）不用改，拿到的都是同一个值。

**为什么不用「`set_real_ip_from` docker 子网」那种单口方案**：本地实测，经 docker-proxy 转发的连接
（宿主机本地访问、IPv6、部分 Docker 配置下的全部流量）源地址是**网桥网关**，正好落在 docker 子网里。
单口 + 信任子网时，从发布端口进来伪造 `6.6.6.6` 照样能透传给 app。

改动文件：

- `nginx/nginx.conf`：两个 server；删掉 Cloudflare 边缘 IP 段（走隧道根本用不上，留着反而多一个口子）；
  日志行尾加 `peer="…"`，即 realip 改写前的 TCP 对端（cloudflared 的 IP = 走域名；`127.0.0.1` = 走公网 IP 直连）
- `docker-compose.yml`：nginx `ports` 从 `"80:80"` 改成 `"80:8080"`
- `src/lib/news/rate-limit.ts`：计数表加容量上限（见第五节），`api/upload` 那张私有的无上限表并进来
- 几处写着「IP 可伪造」的注释改成现在的说法

## 三、部署前检查（只读，必须做）

新方案的前提是**隧道走容器网络连 `nginx:80`**。如果隧道 ingress 实际配的是宿主机地址
（比如公网 IP 或 `172.17.0.1`），改完之后所有走域名的访客都会从 8080 进来、共用同一个 IP：
大面积 429，「每 IP 一张券」变成全站只有一个人领得到。所以先核对（按第二节的 base64 方式传命令）：

```bash
LOG=$(docker inspect -f '{{.LogPath}}' beiguo-nginx)
echo "cloudflared: $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' beiguo-cloudflared)"
# 最近走域名的请求，按 nginx 看到的 $remote_addr 计数
tail -n 3000 "$LOG" | grep -F 'host=\"bigolab.com\"' | sed 's/^{"log":"//' | awk '{print $1}' | sort | uniq -c | sort -rn | head
```

**期望：只有一个地址，就是上面 cloudflared 的 IP。** 如果是 `172.x.0.1`（网关）或者服务器自己的 IP，
**停手**，先去 Cloudflare Zero Trust → Tunnels → Public Hostname 把 service 改成 `http://nginx:80`。

（直接读容器的日志文件，不走 `docker logs`；`tail -n` 有上限，不会把这台 1.8G 的机器压垮。
json-file 日志里引号是转义过的，所以 grep 写的是 `\"`。若 `LogPath` 为空（不是 json-file 驱动），
改用 `docker logs --tail 3000 beiguo-nginx 2>/dev/null`，去掉 `sed` 那一段，grep 里的 `\"` 换回 `"`。）

## 四、部署（只动 nginx，停机一两秒）

```bash
cd /opt/beiguo/beiguo-shop
git rev-parse --short HEAD          # 记下来，回滚用
git pull origin main

# 先用临时容器测**新文件**。注意 exec 进正在跑的 nginx 做 nginx -t 测的是旧文件（第二十三节的 inode 坑）
NET=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' beiguo-nginx)
docker run --rm --network "$NET" -v "$PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t

# 单文件 bind-mount，reload 读不到新文件；端口映射也变了，必须重建容器。
# --no-deps：这次 pull 会顺带拉下尚未部署的营销模块（compose 里 app 多了环境变量），
# 不加的话 compose 可能拿旧镜像把 app 也重建一遍
docker compose --env-file .env.production up -d --no-deps --force-recreate nginx
```

app 镜像**不用**为这一步重建。限流表的改动随下一次 app 构建上线即可（两者互不依赖，nginx 这步单独就堵上了伪造）。

## 五、验证

```bash
docker exec beiguo-nginx nginx -T 2>/dev/null | grep -c 'listen 8080'   # 期望 1：加载的是新文件
docker port beiguo-nginx       # 期望只有 8080/tcp -> 0.0.0.0:80（及 [::]:80），不能出现 80/tcp

LOG=$(docker inspect -f '{{.LogPath}}' beiguo-nginx)   # 容器重建过，日志文件也换了
P="/__ipcheck_$(date +%s)"
curl -s -o /dev/null -H "Host: bigolab.com" -H "CF-Connecting-IP: 6.6.6.6" -H "X-Forwarded-For: 7.7.7.7" "http://127.0.0.1$P"
grep -F "$P" "$LOG" | tail -1
# 期望：行首是网桥网关（172.x.0.1），不是 6.6.6.6；末尾 peer=\"127.0.0.1\"

# 等一两分钟有真实访客之后：走域名的请求行首应是各式各样的公网 IP，peer 是 cloudflared 的 IP
tail -n 300 "$LOG" | grep -F 'host=\"bigolab.com\"' | sed 's/^{"log":"//' | awk '{print $1}' | sort | uniq -c | sort -rn | head

# CVE-2025-29927 那道清洗仍然生效：带绕过头应是 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: bigolab.com" \
  -H "x-middleware-subrequest: src/middleware:src/middleware:src/middleware:src/middleware:src/middleware" \
  http://127.0.0.1/api/admin/cardkeys
```

再从自己电脑上打一次公网 IP：`curl -H "CF-Connecting-IP: 6.6.6.6" http://<公网IP>/__ipcheck_me`，
日志里那一行的行首应该是你自己的真实公网 IP。最后用浏览器打开首页、商品页和一张 `/uploads/` 图片。

**回滚**：`git checkout <上面记下的 commit> -- nginx/nginx.conf docker-compose.yml`，再执行一次上面那条
`up -d --no-deps --force-recreate nginx`。

## 六、限流表的容量上限（app 侧）

`rateLimited()` 的 key 多半带着请求方能随便换的东西（匿名 id、viewerKey、IPv6 地址），
nginx 修好之后照样能用随机 key 往表里灌。旧实现还有两个问题：key 都在窗口内时一条也删不掉，
超过 5000 条后每个请求都全表扫一遍（本地实测 3 万个 key 用了 5.2 秒）；扫的时候又拿「本次调用」
的窗口去判断所有 key，60 秒窗口的调用会把 24 小时窗口的分享去重计数提前删掉（已复现）。

现在按 key 前缀分桶，每桶最多 5000 个，按最近使用淘汰，每个条目按自己的窗口判断过期。
刷一个桶挤不掉别的桶（拿随机 viewerKey 刷浏览计数，清不掉兑换、开票的计数）。
自测：`npx tsx scripts/check-rate-limit.ts`（15 条，不连库）。

## 七、提议：公网 80 可以不开了

compose 里写的「供 IP 直接访问」是隧道之前的遗留。仓库里能看到的依赖都走域名：
SmsForwarder 收款回调的文档地址是 `https://bigolab.com/api/pay/sms-notify`（后台收款监控页按 `APP_URL` 生成），
第二站的共享库存接口也是 `https://bigolab.com/...`，cron 直连 `app:3000`，交接文档里的冒烟全是在服务器上
`curl http://127.0.0.1`。域名未备案，阿里云本来就拦掉了源站 80 上的 `bigolab.com`，
能用上公网 80 的只剩「直接敲 IP」的访问，基本都是扫描器。关掉的收益不止 IP 这一件：
Cloudflare 的 WAF / 防 CC 不能再被绕开，第二十三节那种直连源站打漏洞的路径也就没了。

**但收款回调是钱路径，万一手机上配的是 IP，关掉之后到账就不会再自动确认。** 所以先查一遍：

```bash
cd /opt/beiguo/beiguo-shop
LOG=$(docker inspect -f '{{.LogPath}}' beiguo-nginx)
grep -E '^APP_URL=' .env.production                   # 期望 https://bigolab.com
tail -n 200000 "$LOG" | grep -vF -e 'host=\"bigolab.com\"' -e 'host=\"www.bigolab.com\"' | grep -cE '/api/pay/sms-notify|/api/inventory/'
# 期望 0：没有任何收款回调 / 共享库存请求是走 IP 进来的
tail -n 200000 "$LOG" | grep -vF -e 'host=\"bigolab.com\"' -e 'host=\"www.bigolab.com\"' \
  | sed 's/^{"log":"//' | awk '{print $7}' | sort | uniq -c | sort -rn | head -20
# 看一眼走 IP 进来的都是什么路径：若全是 /wp-login.php、/.env 这类扫描，就可以关
```

都没问题的话，只改一行，再照第四节重建 nginx：

```yaml
    ports:
      - "127.0.0.1:80:8080"   # 只留给服务器本机 curl 冒烟用
```

阿里云安全组里的 80 入方向也可以一并关掉，当第二层。nginx 的两口设计不依赖这一步：
端口开着也伪造不了 IP，关掉只是把源站整个藏到 Cloudflare 后面。

## 八、没做的（已知局限）

- **IPv6 按单个地址限流形同虚设**：经 Cloudflare 进来的 IPv6 访客手里通常有一整个 /64，
  可以换着地址来。要收紧的话，限流 key 对 IPv6 取 /64 前缀（日志里仍记完整地址）。
- 领券、开票台、一键回复几个路由里还各有一份取 IP 的副本。nginx 已经把三个头都覆盖了，结果正确，
  合并到 `clientIp()` 只是清理，不影响安全。
- 第二十三节的第二步（升级 Next）：2026-09-26 已在 package.json 升到 **14.2.35**（14.2.25～14.2.34 均被 npm 标为有漏洞，
  见 2025-12-11 安全公告，交接文档里建议的 14.2.33 已过时），随下一次 app 构建上线，见第九节 9.3。

## 九、同一次重建顺带上线的加固（2026-09-26 安全审计 B-infra 包）

这一轮在上面的真实 IP 修复基础上又叠了几项，**nginx 与 cron 的部分都不用重建 app 镜像**，
跟第四节那次 `force-recreate nginx` 合成一次做即可。app 侧的部分随下一次镜像构建上线（构建前先问站长放开 swap）。

### 9.1 nginx（nginx.conf，第四节同一条命令生效）

| 改动 | 为什么 |
|---|---|
| `server_tokens off` | 404/502 页脚与 `Server` 头不再带 `nginx/1.31.0` |
| 带 `Next-Action` 头的请求一律 400；对非 `/api/*` 路径的非 GET/HEAD 请求一律 405 | Next 14 的 RSC 反序列化 DoS（CVE-2025-55184/67779）入口。本站无 Server Actions，所有写请求都走 `/api/*`。升级 Next 后也保留 |
| `location ^~ /api/cron/ { return 404; }` | cron 直连 `app:3000`、后台手动触发走容器内 `127.0.0.1:3000`，都不经 nginx；对外关掉，也杜绝拿域名 + `?secret=` 排障把密钥写进日志 |
| `location = /api/upload` 嵌套块 `client_max_body_size 6m` | 超过 6MB 在 nginx 读请求体之前就 413，不必先缓冲 20MB 再交给 Node |
| `proxy_set_header Upgrade ""` | 全站没有 WebSocket，不给 Next 转升级请求。`Connection 'upgrade'` 刻意没动（改了会影响上游 keepalive，POST 下单可能偶发 502） |
| 安全响应头：`X-Frame-Options: SAMEORIGIN`、`CSP: frame-ancestors 'self'`、`nosniff`、`Referrer-Policy`（app 自己设了就以 app 为准）、`HSTS max-age=300`；`proxy_hide_header X-Powered-By` | 防点击劫持、隐藏框架指纹。HSTS 先 300 秒试运行，一周没问题再改 15552000，不加 includeSubDomains / preload |

**部署前多做一条只读检查**：`grep -E '^NEWS_INTERNAL_BASE=' .env.production`，期望**没有输出**或是容器内地址。
如果配成了公网域名，后台「手动触发管线」会被 `/api/cron/` 的 404 挡掉，先改掉它（或先不上这一段）。

本地已用 `nginx:alpine` + 假上游跑过：`nginx -t` 通过；上面每一条的状态码、请求头清洗、响应头都符合预期。

**验证（接在第五节后面）**：

```bash
H='Host: bigolab.com'
curl -sI -H "$H" http://127.0.0.1/ | grep -iE 'x-frame|content-security|nosniff|referrer|strict-transport|powered|^server'
# 期望：前五个头都有；没有 X-Powered-By；Server 只写 nginx、不带版本号
curl -sI -H "$H" http://127.0.0.1/api/mkt/unsubscribe/x | grep -ic referrer-policy     # 期望 1（只剩 app 自己那条 no-referrer）
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "$H" -H 'Next-Action: x' http://127.0.0.1/   # 期望 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "$H" http://127.0.0.1/login                  # 期望 405
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "$H" -H 'Content-Type: application/json' -d '{}' http://127.0.0.1/api/auth/login
# 期望：业务返回的 4xx（400/401），不是 405
curl -s -o /dev/null -w '%{http_code}\n' -H "$H" http://127.0.0.1/api/cron/vmq-close          # 期望 404
head -c 7000000 /dev/zero > /tmp/big && curl -s -o /dev/null -w '%{http_code}\n' -H "$H" -F file=@/tmp/big http://127.0.0.1/api/upload; rm -f /tmp/big
# 期望 413
```

再用浏览器：首页、商品页、`/pay/<订单号>`、后台首页、营销编辑页（预览 iframe 要正常），看控制台有没有
`Refused to execute` / MIME 相关报错；论坛发一帖带图、后台传一张商品图。

### 9.2 cron 任务表与容器日志上限（docker-compose.yml + cron/crontab）

- `cron/crontab`：原来 8 条用 `?secret=` 的任务全部改成 `-H "x-cron-secret: ..."`（与 remind / marketing 一致）。
  现有 app 本来就接受这个头，**不用等 app 发版**。
- `docker-compose.yml`：顶部 `x-logging` 锚点，app / nginx / cron / cloudflared 的 stdout 日志每个容器上限约 100MB
  （20m × 5，json-file，不压缩 —— 第三、五节 tail `LogPath` 的做法照常能用）。**db 刻意不加**：
  它是 app 的依赖，配置一变，下一次 `up -d app` 会连带重建 MySQL。

上线（按交接文档铁律：命令 base64 传；看空间只用 `df -h` 和对单个文件 `ls -lh`，**绝不跑 `docker system df`，也不 du /var/lib/docker**）：

```bash
docker compose --env-file .env.production config | grep -c 'max-size'   # 期望 4 或 5（新版 compose 会把顶层 x-logging 锚点也输出一次）；YAML 写错会在这里报错，不动任何容器
df -h /
ls -lh "$(docker inspect -f '{{.LogPath}}' beiguo-nginx)"              # 记下旧日志大小，重建后随容器删除

# nginx：就是第四节那条，日志上限顺带生效
# cron：任何时候都可以（容器启动要联网 apk，有静默卡住的历史，必须盯着它起来）
docker compose --env-file .env.production up -d --no-deps --force-recreate cron
docker compose exec cron pgrep crond                             # 有进程号
docker compose exec cron sh -c "grep -v '^#' /etc/crontabs/root | grep -c 'secret='"    # 期望 0（只看任务行；注释里提到 query 写法不算）
# 等 1～2 分钟
docker compose exec cron tail -n 20 /var/log/cron.log            # vmq-close / sms-poll 是成功 JSON，没有 401
# cloudflared：挑低峰（隧道会断 2～5 秒），或等它下次被重建时顺带生效
docker compose --env-file .env.production up -d --no-deps --force-recreate cloudflared
# app：下一次常规构建 up -d app 时自动生效

for c in beiguo-nginx beiguo-app beiguo-cron beiguo-cloudflared; do docker inspect -f '{{.Name}} {{json .HostConfig.LogConfig}}' $c; done
# 已重建的应显示 {"Type":"json-file","Config":{"max-file":"5","max-size":"20m"}}
df -h /
```

手工触发新闻管线等排障，一律在 cron 容器里带头直连（外层单引号，让变量在容器里展开）：

```bash
docker compose --env-file .env.production exec -T cron sh -c 'curl -s -m 1500 -H "x-cron-secret: $(cat /run/cron_secret)" "http://app:3000/api/cron/news?stage=rank"'
```

`src/lib/cron-auth.ts` 的 `?secret=` 分支**这一轮还保留**，只加了一条告警日志（`[cron-auth] ... 仍在用 ?secret=`）。
cron 容器重建、`docker compose logs app | grep 'cron-auth'` 连续几天没有这条之后，再删那个分支。
**顺序不能反**：先删分支、cron 容器还跑着旧任务表，收款单兜底关闭和接码轮询会一直 401。

### 9.3 随下一次 app 镜像构建上线的部分

- **Next 14.2.3 → 14.2.35**（`package.json` / `package-lock.json`，eslint-config-next 同步）。lock 里 `@next/swc-*` 是 14.2.33，
  这是 14.2.35 自己声明的版本，正常。
- `next.config.js`：`images: { unoptimized: true }`（原来 `remotePatterns hostname '**'` 让 `/_next/image` 成了匿名外链代理）、
  `poweredByHeader: false`。
- `Dockerfile`：deps 阶段仍是 `npm install`（终审发现 npm 10 对本地 npm 11 生成的 lock 做 npm ci 会失败，暂不切换，见 Dockerfile 注释）；新增 `.dockerignore`（去掉 .git / docs / node_modules 等，
  **刻意保留 `.env*`**，理由写在文件头）。
- `/api/upload` + `lib/upload-store.ts`：落盘串行化（修并发绕过总量上限）、磁盘剩余空间低于 `UPLOAD_MIN_FREE_MB`（默认 2048）一律 507、
  先看 Content-Length 再读请求体、匿名限流改按 IP（不再认 `x-anon-id`）、`products` / `links` 目录只许管理员。
- `docker-compose.yml` 的 app 新列了几个裸变量（`APP_URL`、`DISPENSE_API_SECRET`、两个 TTL、`COUPON_LOCK_SWEEP_MIN`、
  `SYSB_FALLBACK_URL`、`NEXT_PUBLIC_SITE_URL`、`NEWS_INTERNAL_BASE`、`UPLOAD_MIN_FREE_MB`）。

构建前只读预检：

```bash
ls -la /opt/beiguo/beiguo-shop/.env*          # 确认只有 .env.production（若有 .env.local 之类，先搞清楚用途）
# 宿主机 .env.production 与当前镜像里那份是否一致（只比哈希，不 cat，免得密钥出现在终端）：
docker run --rm --entrypoint sha256sum beiguo-shop-app:latest /app/.env.production
sha256sum .env.production
# 不一致 = 宿主机文件在上次构建后改过；上面新列的变量会按宿主机的值立即生效，先确认那些改动可以上线
df -h /     # 磁盘剩余低于 2GB 时新代码会拒收所有上传（507），上线前先确认余量，必要时调 UPLOAD_MIN_FREE_MB
```

构建、`up -d app` 之后：

```bash
docker exec beiguo-app node -p "require('next/package.json').version"   # 期望 14.2.35
docker compose exec -T app ls -la /app/.env.production /app/templates/  # 两个都在
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: bigolab.com' 'http://127.0.0.1/_next/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=64&q=75'  # 期望 404
curl -sI -H 'Host: bigolab.com' http://127.0.0.1/wechat-qr.jpg | head -1   # 期望 200
```

冒烟：首页 / 商品页 / 落地页；未登录访问 `/admin` 跳 `/login`、`/api/admin/*` 回 401（带 `x-middleware-subrequest` 头也是 401）；
联系弹窗的微信二维码能显示（img src 是 `/wechat-qr.jpg`）；下单 → 付款匹配 → 发货；开票与开票填写链接；新闻页；
sitemap.xml / robots.txt / indexnow-key.txt；后台各页点一遍；论坛匿名 / 登录各发一帖带图、后台传商品图和友链 logo、营销编辑器传图。
匿名请求 `scope=products` 应 403。

**回滚**：`git checkout <上一版> -- package.json package-lock.json next.config.js Dockerfile` 后重新构建。不涉及 schema。

**可选，且必须在新镜像上线之后**：nginx 加 `location ^~ /_next/image { return 404; }` 再挡一层。
**不能早于新镜像**：旧镜像里联系弹窗二维码的 src 还是 `/_next/image?url=%2Fwechat-qr.jpg...`，先加会变裂图（客户找客服的入口）。
升级 + unoptimized 之后 Next 自己就会 404，这一条不加也行。

### 9.4 Cloudflare 边缘（站长在控制台做）

http → https 跳转**不要**开一刀切的 Always Use HTTPS，改建一条 Redirect Rule（Rules → Redirect Rules → Single Redirect）：

- 表达式：`(not ssl and http.host in {"bigolab.com" "www.bigolab.com"} and http.request.method in {"GET" "HEAD"})`
- 目标：动态 `concat("https://", http.host, http.request.uri.path)`，勾选保留查询字符串，301。

只跳 GET/HEAD：误配成 http 的 POST 回调（SmsForwarder 收款 `/api/pay/sms-notify`、共享库存接口）被 301 会丢请求体、到账通知就丢了。
开之前核一眼 SmsForwarder 的 Webhook 地址、二站调共享库存的基址，都应是 `https://bigolab.com`。
