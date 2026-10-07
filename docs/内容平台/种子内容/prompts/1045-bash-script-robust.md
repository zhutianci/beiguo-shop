---
title: Bash 脚本怎么写提示词（严格模式、参数解析、日志、幂等与 dry-run，可放心放进定时任务）
slug: bash-script-robust
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要写部署脚本、备份脚本、数据处理脚本，又怕脚本中途出错还继续跑、误删文件时用：描述脚本要做的事，得到带严格模式、参数校验、日志、错误处理、预演模式的健壮 Bash 脚本，并附上 ShellCheck 级别的自查。
prompt: |
  你是一名写过大量生产环境 Shell 脚本的运维工程师。请按下面的需求写一个 Bash 脚本。

  - 脚本要做的事（按步骤写）：[脚本功能]
  - 运行环境：[如 Ubuntu 24.04、CentOS 7、macOS 自带 bash、容器内]
  - 运行方式：[手动执行/crontab 定时/CI 流水线]
  - 输入参数：[如目标目录、保留天数]
  - 依赖的外部命令：[如 rsync、jq、aws cli]

  脚本要求：
  1. 开头使用严格模式（遇错退出、未定义变量报错、管道中任一命令失败即失败），并说明这些选项各自的作用和需要注意的例外情况（例如允许失败的命令要显式处理）。
  2. 参数：支持帮助信息；校验必填参数和取值；提供预演模式，只打印将要执行的操作、不真正修改任何东西。
  3. 安全：
     - 所有变量引用加双引号；
     - 删除、覆盖类操作之前检查路径非空且在预期目录内，绝不出现可能展开成根目录的删除命令；
     - 临时文件用安全的方式创建，并在退出时（包括出错退出）自动清理；
     - 不在脚本中写死密码和密钥，从环境变量或配置文件读取。
  4. 日志：带时间戳输出到标准错误或日志文件，区分信息、警告和错误；出错时打印出错的行号和命令。
  5. 幂等：重复执行不会产生副作用（例如已经存在的目录不报错、已经处理过的文件跳过）。
  6. 定时任务场景：防止上一次还没跑完、下一次又启动（加锁）；使用绝对路径或明确设置 PATH；退出码有意义。
  7. 检查依赖命令是否存在，不存在时给出明确提示。

  输出：完整脚本（带中文注释）、使用示例、可能存在的平台差异（比如 macOS 与 Linux 的 date、sed 参数不同）、建议用 ShellCheck 检查。
negativePrompt: null
source: null
verify:
  - 把生成的脚本交给 ShellCheck 检查（https://www.shellcheck.net），记录警告数量；用预演模式跑一次确认不会修改文件
---
**怎么填变量**：[运行环境] 很重要：macOS 自带的 Bash 版本较老，`date`、`sed -i` 的用法和 Linux 不同；容器里的精简镜像可能连 bash 都没有，只有 sh。[运行方式] 是定时任务时，AI 会额外处理加锁和 PATH 问题。

**常见坑**：
- 变量没加引号，路径里有空格就出错；变量为空时，删除命令可能删到完全意想不到的目录。这是 Shell 脚本最危险的问题。
- 定时任务里的环境变量和手动登录时不一样，脚本里用到的命令找不到。使用绝对路径或在脚本开头设置 PATH。
- 严格模式下，`grep` 没匹配到内容会返回非零码导致脚本退出，这类「允许失败」的命令需要显式处理。

**追问技巧**：追问「列出这个脚本在哪些情况下会中途失败、失败后系统会处于什么状态、重新执行是否安全」。

### 示例输出

> 示例，仅供参考（清理过期备份脚本，节选）

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

log() { printf '%s [%s] %s\n' "$(date '+%F %T')" "$1" "$2" >&2; }
trap 'log ERROR "第 ${LINENO} 行出错：${BASH_COMMAND}"' ERR

BACKUP_DIR="" ; KEEP_DAYS=7 ; DRY_RUN=0
while getopts "d:k:nh" opt; do
  case "$opt" in
    d) BACKUP_DIR="$OPTARG" ;;
    k) KEEP_DAYS="$OPTARG" ;;
    n) DRY_RUN=1 ;;
    h) echo "用法: $0 -d 备份目录 [-k 保留天数] [-n 预演]"; exit 0 ;;
    *) exit 2 ;;
  esac
done

[[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]] || { log ERROR "备份目录无效"; exit 2; }
[[ "$BACKUP_DIR" == /data/backups/* ]] || { log ERROR "只允许清理 /data/backups 下的目录"; exit 2; }

exec 9>/tmp/cleanup-backups.lock
flock -n 9 || { log WARN "上一次任务仍在运行，本次跳过"; exit 0; }

find "$BACKUP_DIR" -name '*.tar.gz' -mtime +"$KEEP_DAYS" -print0 |
while IFS= read -r -d '' f; do
  if (( DRY_RUN )); then log INFO "将删除 $f"; else rm -f -- "$f"; log INFO "已删除 $f"; fi
done
```
