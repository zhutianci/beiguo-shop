#!/bin/sh
# W8-4 演练（本地，不碰服务器）：在一次性 alpine 容器里用假的 sysfs 路径跑 build-with-swap.sh。
#   MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/scripts/ops:/ops:ro" nginx:alpine sh /ops/build-with-swap.selftest.sh
# 覆盖：cgroup v2 直接停手且不改设置；构建中 kill 脚本 → 两项设置还原、子进程不残留；构建进程自己被杀 → 还原成各自原值；
# 看门狗把构建进程树 oom_score_adj 设为 1000；上次 kill -9 残留状态文件 → 拒绝再跑、--restore 还原。
# W8-4 演练：在容器里用假的 sysfs 路径跑 build-with-swap.sh
S="${BWS_SCRIPT:-/ops/build-with-swap.sh}"
pass=0; fail=0
ok() { if [ "$1" = "0" ]; then pass=$((pass+1)); echo "  ✓ $2"; else fail=$((fail+1)); echo "  ✗ $2"; fi; }
echo "· 真实环境 stat -fc %T /sys/fs/cgroup = $(stat -fc %T /sys/fs/cgroup)"
# 1. cgroup v2（Docker Desktop 本身就是 v2）→ 直接停手，不改任何设置
mkdir -p /fake && echo 0 > /fake/swappiness
SWAPPINESS_FILE=/fake/swappiness SKIP_ROOT_CHECK=1 STATE_FILE=/fake/state sh $S > /fake/out1 2>&1; code=$?
[ "$code" = "3" ]; ok $? "cgroup v2 → 退出码 3（实际 $code）"
[ "$(cat /fake/swappiness)" = "0" ]; ok $? "cgroup v2 → vm.swappiness 未改动"
[ ! -f /fake/state ]; ok $? "cgroup v2 → 没留状态文件"
grep -q "RESULT: FAIL not-cgroup-v1" /fake/out1; ok $? "cgroup v2 → RESULT 行"
# 2. 模拟 v1：构建中途被 kill（SIGTERM 打脚本本身）→ 两项设置还原
mkdir -p /fake/cg/memory/docker/buildkit
echo 0 > /fake/swappiness
env CGROUP_FSTYPE=tmpfs CGROUP_ROOT=/fake/cg SWAPPINESS_FILE=/fake/swappiness SKIP_ROOT_CHECK=1 SKIP_ALIVE_CHECK=1 \
    STATE_FILE=/fake/state LOG_FILE=/fake/build.log MIN_FREE_MB=1 \
    BUILD_CMD='sleep 2; echo 0 > /fake/cg/memory/docker/buildkit/memory.swappiness; exec sleep 60' \
    sh $S > /fake/out2 2>&1 &
PID=$!
sleep 5
v_sys=$(cat /fake/swappiness); v_bk=$(cat /fake/cg/memory/docker/buildkit/memory.swappiness)
[ "$v_sys" = "60" ]; ok $? "构建中 vm.swappiness = 60（实际 $v_sys）"
[ "$v_bk" = "60" ]; ok $? "构建中 buildkit 内存组出现后被设为 60（实际 $v_bk）"
kill -TERM $PID; wait $PID; code=$?
[ "$(cat /fake/swappiness)" = "0" ]; ok $? "kill 后 vm.swappiness 还原为 0"
[ "$(cat /fake/cg/memory/docker/buildkit/memory.swappiness)" = "0" ]; ok $? "kill 后 buildkit memory.swappiness 还原为 0"
[ ! -f /fake/state ]; ok $? "kill 后状态文件已删除"
sleep 3; n=$(ps | grep -c "[s]leep 60"); [ "$n" = "0" ]; ok $? "kill 后构建子进程不残留（残留 $n）"
# 3. 构建进程自己失败（被 OOM 杀的等价）→ 还原 + RESULT FAIL
echo 5 > /fake/swappiness; echo 7 > /fake/cg/memory/docker/buildkit/memory.swappiness
env CGROUP_FSTYPE=tmpfs CGROUP_ROOT=/fake/cg SWAPPINESS_FILE=/fake/swappiness SKIP_ROOT_CHECK=1 SKIP_ALIVE_CHECK=1 \
    STATE_FILE=/fake/state LOG_FILE=/fake/build.log MIN_FREE_MB=1 BUILD_CMD='sleep 2; kill -9 $$' \
    sh $S > /fake/out3 2>&1; code=$?
[ "$code" = "1" ]; ok $? "构建进程被杀 → 退出码 1（实际 $code）"
[ "$(cat /fake/swappiness)" = "5" ] && [ "$(cat /fake/cg/memory/docker/buildkit/memory.swappiness)" = "7" ]; ok $? "构建进程被杀 → 两项还原成各自原值（5 / 7）"
tail -n 1 /fake/out3 | grep -q "RESULT: FAIL build-exit"; ok $? "最后一行是 RESULT: FAIL build-exit-…"
# 4. 看门狗：模拟一个名为 next build 的进程树，oom_score_adj 被调到 1000
echo 0 > /fake/swappiness
cat > /fake/nb.sh <<'EOS'
sh -c 'exec -a "node next build" sleep 30' &
wait
EOS
env CGROUP_FSTYPE=tmpfs CGROUP_ROOT=/fake/cg SWAPPINESS_FILE=/fake/swappiness SKIP_ROOT_CHECK=1 SKIP_ALIVE_CHECK=1 \
    STATE_FILE=/fake/state LOG_FILE=/fake/build.log MIN_FREE_MB=1 WATCH_PATTERN='sleep 30' BUILD_CMD='sleep 30' \
    sh $S > /fake/out4 2>&1 &
PID=$!
sleep 5
NB=$(pgrep -f 'sleep 30' | head -n 1)
adj=$(cat /proc/$NB/oom_score_adj 2>/dev/null)
[ "$adj" = "1000" ]; ok $? "看门狗把构建进程 oom_score_adj 设为 1000（实际 $adj）"
kill -TERM $PID; wait $PID
[ "$(cat /fake/swappiness)" = "0" ]; ok $? "看门狗用例结束后还原"
# 5. 上次被 kill -9 留下状态文件 → 拒绝再跑；--restore 还原
echo "/fake/swappiness 0" > /fake/state; echo 60 > /fake/swappiness
env CGROUP_FSTYPE=tmpfs CGROUP_ROOT=/fake/cg SWAPPINESS_FILE=/fake/swappiness SKIP_ROOT_CHECK=1 STATE_FILE=/fake/state MIN_FREE_MB=1 sh $S > /fake/out5 2>&1; code=$?
[ "$code" = "2" ]; ok $? "残留状态文件 → 拒绝构建（退出码 $code）"
STATE_FILE=/fake/state sh $S --restore > /dev/null 2>&1
[ "$(cat /fake/swappiness)" = "0" ] && [ ! -f /fake/state ]; ok $? "--restore 按状态文件还原"
echo "通过 $pass，失败 $fail"
[ "$fail" = "0" ]
