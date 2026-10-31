#!/bin/sh
# =====================================================================================
# 贝果科技 · 「停 jishi 腾内存」的构建 wrapper
#
# 为什么需要它（docs/收款与利润口径-1012-部署说明.md、安全-攻防加固设计-1015.md §构建）：
#   这台 ECS 只有 1.8G。不停 jishi 的构建要 60~90 分钟（全程在换页）；
#   停掉 jishi 三个容器之后明显加快（实测 32 分钟 vs 60 分钟）。
#
# 【但手工停 jishi 是有代价的，这个 wrapper 就是为那个代价存在的】
#   2026-10-12 有一次会话中途断开，jishi 被停了 3 小时没人拉起来。
#   所以：**停 jishi 和拉起 jishi 必须在同一个脱离了会话的脚本里**，用 trap 保证
#   无论构建成功、失败、还是脚本被 Ctrl-C / SIGTERM，jishi 都会被拉回来。
#
# 用法（服务器上，root，必须 setsid 脱离会话，否则 workbench exec 会话结束会连带杀掉它）：
#   setsid nohup sh scripts/ops/build-stop-jishi.sh > /tmp/sysc-build-wrapper.out 2>&1 < /dev/null &
#   tail -n 40 /tmp/sysc-build-wrapper.log
#
# 退出码：沿用 build-with-swap.sh 的（0 成功；1 构建失败/镜像没变；2 前置不满足；3 不是 cgroup v1；4 有站点容器不在）
# =====================================================================================
set -u

SHOP="${SHOP:-/opt/beiguo/beiguo-shop}"
JISHI="${JISHI:-/opt/jishi}"
LOG="${LOG:-/tmp/sysc-build-wrapper.log}"

log() { echo "[$(date '+%F %H:%M:%S')] $*" | tee -a "$LOG"; }

# ---------------------------------------------------------------------------------
# 拉回 jishi。重试 3 次 —— 构建刚结束时内存还很紧，第一次 up 可能起不来。
#
# 【绝不能拉起 jishi-cloudflared】它的 token 与 beiguo-cloudflared 是同一条隧道，两个连接器会分流公网请求，
# 而它把 nginx:80 解析成 jishi-nginx：bigolab.com 和所有渠道站约一半请求变成吉狮的页面（2026-11-01 00:32 ~ 01:20 事故）。
# ---------------------------------------------------------------------------------
restore_jishi() {
  log "=== 恢复 jishi ==="
  i=0
  while [ "$i" -lt 3 ]; do
    if (cd "$JISHI" && docker compose up -d app nginx) >>"$LOG" 2>&1; then
      break
    fi
    i=$((i + 1))
    log "jishi 拉起失败，第 $i 次重试（等 15 秒让内存回落）"
    sleep 15
  done
  n=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -c '^jishi' || true)
  log "jishi 在跑的容器数：$n（期望 2：app、nginx）"
  [ "$n" -lt 2 ] && log "⚠️ jishi 没全起来，**要人工处理**：cd $JISHI && docker compose up -d app nginx"
  return 0
}

# trap 必须在停 jishi 之前装好，否则停完就被杀会留下 jishi 停着
trap 'restore_jishi; log "wrapper 退出"' EXIT INT TERM HUP

log "=== 停 jishi 三容器腾内存 ==="
(cd "$JISHI" && docker compose stop) >>"$LOG" 2>&1
log "当前容器：$(docker ps --format '{{.Names}}' | sort | tr '\n' ' ')"
log "可用内存：$(free -m | awk 'NR==2{print $7}')MB"

# ---------------------------------------------------------------------------------
# 构建。
#
# 【ALIVE_CONTAINERS 必须去掉 jishi-app，这不是偷懒】
# build-with-swap.sh 默认的存活清单里有 jishi-app，而我们刚刚主动把它停了 ——
# 于是脚本每次都以 exit 4（有站点容器不在运行）结束。
# 历史上这个 4 被当成「预期的」记在部署实录里，可那等于**永久屏蔽了这个检查**：
# 真有 beiguo-app 或 beiguo-db 在构建期被 OOM 杀掉，我们看到的也是同一个 4，分不出来。
# 把 jishi-app 从清单里去掉，退出码就重新有意义了：0 是真成功，4 是真的有站点容器挂了。
# ---------------------------------------------------------------------------------
log "=== build-with-swap 开始（存活清单只留 beiguo 四件套，退出码恢复可读）==="
cd "$SHOP" || { log "进不去 $SHOP"; exit 9; }
# EXTRA_CONTAINERS="" 是必须的：build-with-swap.sh 会**自动发现** jishi 的 cloudflared，
# 光改 ALIVE_CONTAINERS 挡不住它（2026-10-19 第一次跑就是这么拿到一个假的 exit 4）。
ALIVE_CONTAINERS="beiguo-app beiguo-db beiguo-nginx beiguo-cloudflared" \
  EXTRA_CONTAINERS="" \
  sh scripts/ops/build-with-swap.sh >>"$LOG" 2>&1
rc=$?
log "build_exit=$rc  （0=成功；4=真的有站点容器不在运行，要立刻查）"

exit "$rc"
