#!/bin/sh
# =====================================================================================
# 贝果科技 · 服务器构建 app 镜像（临时放开 swap；WP8，设计 15.4 A 段第 8 步，实施分包 11.4）
#
# 为什么需要它（docs/营销推广-部署说明.md 七·五、九）：
#   这台 ECS 只有 1.8G 内存，next build 要 800~900MB；cgroup v1 下 docker 内存组 memory.swappiness=0（创建时继承，
#   改 vm.swappiness 对它无效），构建用不上 swap。构建进程挂在 dockerd（oom_score_adj -500）下被保护，
#   整机 OOM 时内核先杀 beiguo-app / jishi-app / cloudflared。2026-09-25 第 4 次构建的成功做法就是这里固化的：
#   ① 只放开**构建自己的内存组**（/sys/fs/cgroup/memory/docker/buildkit）与 vm.swappiness，db 与站点容器保持 0；
#   ② 看门狗每 2 秒把 next build 进程树 oom_score_adj 调到 1000：真 OOM 时先杀构建，不杀站点；
#   ③ 无论成败都把两项设置改回原值（trap）；被 kill -9 时 trap 跑不到，原值另存在 STATE_FILE，
#      `sh build-with-swap.sh --restore` 可手工还原。
# **这是改生产内核参数，站长已同意（设计 15.4 A.8）；每次执行前仍在群里说一声。**
#
# 用法（服务器上，/opt/beiguo 下，root；耗时任务一律后台跑、轮询日志，不在前台等）：
#   setsid nohup sh scripts/ops/build-with-swap.sh > /tmp/build-with-swap.out 2>&1 < /dev/null &
#   （必须 setsid + </dev/null：只用 nohup … & 时 workbench exec 会话结束会把它连带取消——立刻 EXIT=1、无输出，
#    2026-09-26 安全修复部署实录。日志为空且进程已不在时，先看 STATE_FILE 在不在，在就先 --restore 再重跑）
#   tail -n 30 /tmp/build-with-swap.out          # 最后一行 RESULT: OK … / RESULT: FAIL …
#   sh scripts/ops/build-with-swap.sh --restore   # 只做还原（脚本被 kill -9 之后用）
#
# 退出码：0 成功；1 构建失败或镜像没变；2 前置条件不满足（非 root、磁盘不足）；3 不是 cgroup v1（直接停手，没改任何设置）；
#        4 构建后有站点容器不在运行（立刻人工查看）。
#
# 只用 POSIX sh（busybox 也能跑）、不 import src/（实施分包规则 10）。
# 下面这些环境变量只给演练 / 测试用（W8-4 在本地容器里用假路径跑），生产不要设：
#   CGROUP_ROOT、CGROUP_FSTYPE（覆盖 stat 结果）、SWAPPINESS_FILE、BUILDKIT_SWAPPINESS_FILE、BUILD_CMD、IMAGE、
#   ALIVE_CONTAINERS、SKIP_ALIVE_CHECK=1、SKIP_ROOT_CHECK=1、MIN_FREE_MB、STATE_FILE、LOG_FILE、WATCH_PATTERN
# =====================================================================================
set -u

CGROUP_ROOT="${CGROUP_ROOT:-/sys/fs/cgroup}"
SWAPPINESS_FILE="${SWAPPINESS_FILE:-/proc/sys/vm/swappiness}"
BUILDKIT_SWAPPINESS_FILE="${BUILDKIT_SWAPPINESS_FILE:-$CGROUP_ROOT/memory/docker/buildkit/memory.swappiness}"
BUILD_CMD="${BUILD_CMD:-docker compose --env-file .env.production build app}"
IMAGE="${IMAGE:-beiguo-shop-app:latest}"
ALIVE_CONTAINERS="${ALIVE_CONTAINERS:-beiguo-app jishi-app beiguo-db beiguo-nginx beiguo-cloudflared}"
MIN_FREE_MB="${MIN_FREE_MB:-2048}"
STATE_FILE="${STATE_FILE:-/tmp/build-with-swap.state}"
LOG_FILE="${LOG_FILE:-/tmp/beiguo-build-$(date +%Y%m%d-%H%M%S).log}"
WATCH_PATTERN="${WATCH_PATTERN:-next build}"
TARGET_SWAPPINESS=60

log() { echo "[$(date '+%H:%M:%S')] $*"; }
readv() { [ -f "$1" ] && cat "$1" 2>/dev/null | tr -d ' \n' || echo ""; }
writev() { [ -f "$1" ] && { echo "$2" > "$1" 2>/dev/null || log "⚠ 写 $1=$2 失败"; }; }

# ---------------------------------------------------------------------------------
# 还原：从 STATE_FILE 读原值写回（trap 与 --restore 共用）。STATE_FILE 每行 "路径 原值"
# ---------------------------------------------------------------------------------
restore() {
  [ -f "$STATE_FILE" ] || return 0
  while read -r f v; do
    [ -n "$f" ] || continue
    if [ -f "$f" ]; then
      writev "$f" "$v"
      log "已还原 $f = $(readv "$f")（原值 $v）"
    else
      log "⚠ $f 已不存在（buildkit 内存组随构建结束被回收属正常），无需还原"
    fi
  done < "$STATE_FILE"
  rm -f "$STATE_FILE"
}

if [ "${1:-}" = "--restore" ]; then
  restore
  exit 0
fi

# ---------------------------------------------------------------------------------
# 前置条件
# ---------------------------------------------------------------------------------
if [ "${SKIP_ROOT_CHECK:-}" != "1" ] && [ "$(id -u)" != "0" ]; then
  log "❌ 需要 root（要写 vm.swappiness 与 cgroup 参数）"
  echo "RESULT: FAIL not-root"
  exit 2
fi

FSTYPE="${CGROUP_FSTYPE:-$(stat -fc %T "$CGROUP_ROOT" 2>/dev/null || echo unknown)}"
if [ "$FSTYPE" != "tmpfs" ]; then
  # cgroup v2 的挂载点类型是 cgroup2fs；v2 没有 memory.swappiness（要改的是 memory.swap.max），这套做法不适用。
  log "❌ $CGROUP_ROOT 的文件系统类型是 $FSTYPE，不是 cgroup v1（tmpfs）。停手：没有改任何设置。"
  echo "RESULT: FAIL not-cgroup-v1"
  exit 3
fi

if [ -f "$STATE_FILE" ]; then
  log "❌ 发现上次未还原的 $STATE_FILE（上次被 kill -9？）。先执行 --restore 并核对，再重跑。"
  cat "$STATE_FILE"
  echo "RESULT: FAIL stale-state"
  exit 2
fi

FREE_MB=$(df -Pm / 2>/dev/null | awk 'NR==2 { print $4 }')
if [ -n "$FREE_MB" ] && [ "$FREE_MB" -lt "$MIN_FREE_MB" ]; then
  log "❌ 根分区可用 ${FREE_MB}MB < ${MIN_FREE_MB}MB。先 docker image prune -f、docker builder prune -f（**不要跑 docker system df**）"
  echo "RESULT: FAIL low-disk"
  exit 2
fi

BEFORE=$(docker images --no-trunc --format '{{.ID}}' "$IMAGE" 2>/dev/null | head -n 1)
log "构建前镜像 $IMAGE = ${BEFORE:-（无）}；日志 $LOG_FILE"

# ---------------------------------------------------------------------------------
# 放开 swap（先记原值再改）
# ---------------------------------------------------------------------------------
: > "$STATE_FILE"
ORIG_SYS=$(readv "$SWAPPINESS_FILE")
echo "$SWAPPINESS_FILE $ORIG_SYS" >> "$STATE_FILE"
writev "$SWAPPINESS_FILE" "$TARGET_SWAPPINESS"
log "vm.swappiness：$ORIG_SYS → $(readv "$SWAPPINESS_FILE")"

WATCH_PID=""
BK_PID=""
BUILD_PID=""
cleanup() {
  code=$?
  trap - EXIT INT TERM HUP
  [ -n "$BUILD_PID" ] && kill "$BUILD_PID" 2>/dev/null
  [ -n "$WATCH_PID" ] && kill "$WATCH_PID" 2>/dev/null
  [ -n "$BK_PID" ] && kill "$BK_PID" 2>/dev/null
  restore
  exit "$code"
}
trap cleanup EXIT
trap 'log "收到中断信号，开始还原"; exit 130' INT TERM HUP

# buildkit 内存组在第一次构建开始后才出现：出现后记一次原值（写进 STATE_FILE），并保持为 60 直到构建结束
(
  seen=0
  while :; do
    if [ -f "$BUILDKIT_SWAPPINESS_FILE" ]; then
      cur=$(readv "$BUILDKIT_SWAPPINESS_FILE")
      if [ "$seen" = "0" ]; then
        grep -q "^$BUILDKIT_SWAPPINESS_FILE " "$STATE_FILE" 2>/dev/null || echo "$BUILDKIT_SWAPPINESS_FILE $cur" >> "$STATE_FILE"
        seen=1
        log "buildkit 内存组出现，memory.swappiness 原值 $cur → $TARGET_SWAPPINESS"
      fi
      [ "$cur" != "$TARGET_SWAPPINESS" ] && writev "$BUILDKIT_SWAPPINESS_FILE" "$TARGET_SWAPPINESS"
    fi
    sleep 1
  done
) &
BK_PID=$!

# 看门狗：每 2 秒把 next build 进程树的 oom_score_adj 设为 1000（OOM 时先杀构建，不杀站点）
(
  while :; do
    for p in $(pgrep -f "$WATCH_PATTERN" 2>/dev/null); do
      todo="$p"
      while [ -n "$todo" ]; do
        set -- $todo
        cur="$1"
        shift
        todo="$*"
        [ -w "/proc/$cur/oom_score_adj" ] && echo 1000 > "/proc/$cur/oom_score_adj" 2>/dev/null
        kids=$(pgrep -P "$cur" 2>/dev/null | tr '\n' ' ')
        [ -n "$kids" ] && todo="$todo $kids"
      done
    done
    sleep 2
  done
) &
WATCH_PID=$!

# ---------------------------------------------------------------------------------
# 构建（后台跑、等它结束；输出全部落日志文件）
# ---------------------------------------------------------------------------------
log "开始构建：$BUILD_CMD"
sh -c "$BUILD_CMD" > "$LOG_FILE" 2>&1 &
BUILD_PID=$!
wait "$BUILD_PID"
BUILD_CODE=$?
BUILD_PID=""
log "构建进程结束，退出码 $BUILD_CODE；日志末尾："
tail -n 15 "$LOG_FILE" 2>/dev/null | sed 's/^/    /'

# 先还原再做检查（缩短放开 swap 的时间窗）
kill "$WATCH_PID" "$BK_PID" 2>/dev/null
WATCH_PID=""
BK_PID=""
restore

# ---------------------------------------------------------------------------------
# 站点存活检查（构建期间若发生 OOM，最先看到的就是这里）
# ---------------------------------------------------------------------------------
DEAD=""
if [ "${SKIP_ALIVE_CHECK:-}" != "1" ]; then
  EXTRA=$(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -i 'jishi' | grep -i 'cloudflared' | tr '\n' ' ')
  for c in $ALIVE_CONTAINERS $EXTRA; do
    st=$(docker inspect -f '{{.State.Running}} {{.State.StartedAt}}' "$c" 2>/dev/null || echo "missing")
    log "容器 $c：$st"
    case "$st" in true*) ;; *) DEAD="$DEAD $c" ;; esac
  done
fi

AFTER=$(docker images --no-trunc --format '{{.ID}}' "$IMAGE" 2>/dev/null | head -n 1)
log "构建后镜像 $IMAGE = ${AFTER:-（无）}"

if [ -n "$DEAD" ]; then
  log "❌ 这些容器不在运行：$DEAD —— 立刻人工查看（dmesg | grep -i oom）"
  echo "RESULT: FAIL containers-down:$DEAD"
  exit 4
fi
if [ "$BUILD_CODE" != "0" ]; then
  echo "RESULT: FAIL build-exit-$BUILD_CODE log=$LOG_FILE"
  exit 1
fi
if [ -z "$AFTER" ] || [ "$AFTER" = "$BEFORE" ]; then
  # 两个 ID 相同 = 构建没产出新镜像（例如 next build 被 OOM 杀掉却静默 0 退出、命中坏缓存），停手
  echo "RESULT: FAIL image-unchanged before=$BEFORE after=$AFTER"
  exit 1
fi
echo "RESULT: OK image=$AFTER before=$BEFORE log=$LOG_FILE"
exit 0
