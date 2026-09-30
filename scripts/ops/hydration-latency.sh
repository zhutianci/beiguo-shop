#!/bin/sh
# =====================================================================================
# 贝果科技 · 前台「打开后多久 JS 才跑起来」按浏览器分组统计（只读，只读 nginx 容器日志）
#
# 为什么需要它（2026-09-30 iPhone「打不开」排查）：
#   买家说 iPhone 上 Safari / Chrome 经常打不开首页、微信里打开却正常。服务端日志里 HTML 全是 200，
#   看不出问题；真正的症状在客户端——HTML 到了，但 /_next 的 JS 走 Cloudflare 边缘缓存（不回源、日志里没有），
#   要晚 10~40 秒才到，而首页首屏原来是 opacity:0，JS 不到就是一片黑。
#   本脚本用「HTML GET 之后，同一 IP 第一次请求 /api/auth/me、/api/announcement、/api/orders/recent 的间隔」
#   近似「水合完成」的耗时，按浏览器（iOS Safari / 微信 / 安卓 Chrome / 桌面…）和页面协议（http / https，
#   取自这些 API 请求的 Referer）分组。当时的基线（72 小时）：
#     iOS-Safari https  hydrated= 29  le3s=  8  4to8s=  4  gt8s= 17
#     iOS-Safari http   hydrated=  8  le3s=  7  4to8s=  1  gt8s=  0
#     iOS-WeChat https  hydrated= 18  le3s= 18  4to8s=  0  gt8s=  0
#     And-Chrome https  hydrated= 20  le3s= 20  4to8s=  0  gt8s=  0
#   Cloudflare 关掉 HTTP/3 或改了前端之后，用它对比 iOS-Safari https 这一行（关 h3 后至少等 24 小时，
#   浏览器缓存的 alt-svc 有效期是 ma=86400）。
#
# 用法（服务器上）：sh scripts/ops/hydration-latency.sh [时间窗，默认 24h，docker logs --since 的写法]
# 只读：docker logs 是流式读取，不会像 docker system df 那样遍历镜像层（那条命令会把 dockerd 撑到 OOM，绝不要跑）。
# 局限：同一出口 IP 下多人并发时会串；「never」（60 秒内没有 API 请求）里混有爬虫和秒退，只看 hydrated 的分布。
# =====================================================================================
set -eu
SINCE="${1:-24h}"
LOG=/tmp/hydration-latency.$$.log
trap 'rm -f "$LOG"' EXIT
docker logs --since "$SINCE" beiguo-nginx 2>/dev/null > "$LOG"
echo "window=$SINCE lines=$(wc -l < "$LOG")"
awk '
function cls(ua){
  if (ua ~ /MicroMessenger/) return (ua ~ /iPhone|iPad/) ? "iOS-WeChat" : "And-WeChat";
  if (ua ~ / QQ\/|MQQBrowser/) return (ua ~ /iPhone|iPad/) ? "iOS-QQ" : "And-QQ";
  if (ua ~ /iPhone|iPad/) {
    if (ua ~ /CriOS/) return "iOS-Chrome";
    if (ua ~ /Version\/13\.0\.3/) return "bot13";   # 腾讯云段上的老 UA 扫描器
    if (ua ~ /Version\/[0-9.]+ Mobile\/[0-9A-Z]+ Safari/) return "iOS-Safari";
    return "iOS-other" }
  if (ua ~ /Android/) { if (ua ~ /Chrome\/[0-9.]+ Mobile Safari\/537.36$/) return "And-Chrome"; return "And-other" }
  if (ua ~ /Windows NT|Macintosh/) return "desktop";
  return "other" }
{
  n = split($0, q, "\""); req = q[2]; ua = q[6]
  split(q[1], f, " "); ip = f[1]
  split(req, r, " "); path = r[2]
  split(q[3], sb, " "); st = sb[1]
  split(f[4], a, /[\/:\[]/); t = a[2]*86400 + a[5]*3600 + a[6]*60 + a[7]
  if (path ~ /^\/api\/(auth\/me|announcement|orders\/recent)/) { na[ip]++; at[ip, na[ip]] = t; ar[ip, na[ip]] = q[4] }
  # 前台 HTML 整页加载：GET 200，排除 RSC 预取、接口、静态资源、后台
  if (r[1] == "GET" && st == "200" && path !~ /_rsc=/ && path !~ /^\/(api|_next|admin|uploads)/ && path !~ /\.[a-z0-9]{2,5}(\?|$)/) {
    nh++; hip[nh] = ip; ht[nh] = t; hc[nh] = cls(ua) }
}
END {
  for (i = 1; i <= nh; i++) {
    ip = hip[i]; c = hc[i]; d = -1; rr = ""
    for (j = 1; j <= na[ip]; j++) { x = at[ip, j] - ht[i]; if (x >= 0 && x <= 60) { d = x; rr = ar[ip, j]; break } }
    if (d < 0) { never[c]++; continue }
    k = c " " ((rr ~ /^https:/) ? "https" : "http")
    n2[k]++; if (d <= 3) f2[k]++; else if (d <= 8) m2[k]++; else sl[k]++
  }
  for (k in n2) printf "%-18s hydrated=%3d  le3s=%3d  4to8s=%3d  gt8s=%3d\n", k, n2[k], f2[k], m2[k], sl[k]
  for (c in never) printf "%-18s never(60s)=%d\n", c, never[c]
}' "$LOG" | sort
