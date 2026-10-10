---
title: Claude Code headless 模式：用 claude -p 写脚本和自动化
slug: claude-code-headless-mode
products: [claude]
models: []
accountTier: PLUS
excerpt: headless（非交互）模式就是 claude -p：一次输入、输出结果就退出，适合脚本、CI 和定时任务。本文讲常用参数、JSON 与流式输出、自动批准工具、--bare 模式、无浏览器环境怎么登录。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/headless
  - https://code.claude.com/docs/en/cli-reference
  - https://code.claude.com/docs/en/authentication
  - https://code.claude.com/docs/en/permission-modes
  - https://code.claude.com/docs/en/agent-sdk/overview
---

> 本文根据 Claude Code 官方文档《Run Claude Code programmatically》《CLI reference》《Authentication》整理，核对日期 2026-10-07。示例改写自官方示例。

## 适用于谁

- 想在 shell 脚本、`package.json`、CI 流水线、定时任务里调用 Claude Code 的开发者；
- 搜「claude code headless 是什么」「headless mode」「headless authentication」的人；
- 想把 Claude 的输出变成 JSON 交给其他程序处理的人。

## 结论先说

1. **headless 模式 = 给 `claude` 加上 `-p`（或 `--print`）**：不进交互界面，处理完这一句就把结果打印出来并退出。官方现在把它归入 Agent SDK 的命令行用法。
2. 成功时退出码为 0，失败为非 0，脚本可以据此判断；可以用管道把内容喂给它，也能把结果重定向到文件。
3. 没人点「允许」，所以要提前用 `--allowedTools` 或 `--permission-mode` 规定它能做什么，CI 里推荐 `dontAsk` 加精确白名单。
4. 在 CI 和脚本里官方推荐加 `--bare`：跳过本机的 Hooks、技能、插件、MCP、CLAUDE.md 自动加载，保证每台机器结果一致，**但它只认 API Key，不认订阅登录**。
5. 没有浏览器的环境要用订阅账号，用 `claude setup-token` 生成长期令牌，设置为 `CLAUDE_CODE_OAUTH_TOKEN`。

## 一、基本用法

```bash
# 问一个问题，打印回答后退出
claude -p "认证模块是做什么的？"

# 让它修 bug，并预先允许读、改文件和执行命令
claude -p "找到并修复 auth.py 里的 bug" --allowedTools "Read,Edit,Bash"
```

**用管道处理数据：**

```bash
cat build-error.txt | claude -p "简要说明这个构建错误的根本原因" > output.txt
```

管道输入上限 10MB，超过会报错退出；更大的内容先写进文件，再在提示词里给出路径。

**放进构建脚本**（官方示例：把相对 main 的 diff 交给 Claude 找错别字）：

```json
{
  "scripts": {
    "lint:claude": "git diff main | claude -p \"你是错别字检查器。对 diff 里的每个错别字，第一行写 文件名:行号，第二行写问题。其他什么都不要输出。\""
  }
}
```

运行 `npm run lint:claude` 即可。把 diff 通过管道喂进去，Claude 就不需要执行 git 命令的权限。

## 二、常用参数

| 参数 | 作用 |
| --- | --- |
| `-p` / `--print` | 非交互模式 |
| `--output-format text\|json\|stream-json` | 输出格式，默认 text |
| `--json-schema '<schema>'` | 配合 json 输出，按指定结构返回，结果在 `structured_output` 字段 |
| `--allowedTools "..."` | 这些工具不经询问直接用，写法同权限规则 |
| `--permission-mode <模式>` | 设定整个会话的权限基线 |
| `--max-turns N` | 最多执行 N 轮，到了就报错退出 |
| `--max-budget-usd 金额` | 预估花费达到上限就停止（按客户端估算，可能与账单不同） |
| `--continue` / `--resume <ID>` | 继续最近一次 / 指定的对话 |
| `--append-system-prompt "..."` | 在默认系统提示词后追加指令 |
| `--bare` | 跳过自动加载本机配置，启动更快、结果更稳定 |
| `--model <模型>` | 指定模型 |

## 三、拿到结构化结果

```bash
# JSON：文本结果在 result 字段，另含 session_id、用量和预估花费
claude -p "总结一下这个项目" --output-format json | jq -r '.result'

# 按指定结构输出
claude -p "提取 auth.py 里主要的函数名" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}' \
  | jq '.structured_output'
```

`json` 输出里带有 `total_cost_usd` 和按模型拆分的花费，方便脚本统计开销；官方说明这是客户端估算，可能和实际账单不同。

**流式输出**（边生成边显示）：

```bash
claude -p "解释一下递归" --output-format stream-json --verbose --include-partial-messages
```

每行一个 JSON 事件，最后一行是包含最终结果、花费和会话信息的 `result` 消息。

## 四、权限：没人点「允许」怎么办

**方式一：精确列出允许的工具**

```bash
claude -p "查看暂存的改动并写一个合适的提交" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

`Bash(git diff *)` 里 `*` 前面的空格很重要：没有空格的 `Bash(git diff*)` 还会匹配到 `git diff-index`。

**方式二：设定权限模式**

- `--permission-mode dontAsk`：凡是需要询问的一律拒绝，只执行无需批准的读取和你白名单里的工具，**最适合锁死权限的 CI**；
- `--permission-mode acceptEdits`：自动改文件和执行常见文件命令，其他 shell 命令仍需白名单；
- `--permission-mode auto`：由分类器审核每个操作。

官方提醒：不指定时会采用内置的起始模式（可能是 auto），所以脚本里最好明确写出你想要的模式。完全无人值守的定时任务可以再加 `--permission-prompts none`（v2.1.259 起），让所有「本该弹窗询问」的请求直接拒绝并告诉 Claude 不要重试。权限模式详解见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》。

## 五、--bare 模式：CI 的推荐写法

不加 `--bare` 时，`claude -p` 会像交互会话一样加载当前目录和 `~/.claude` 里的一切：Hooks、技能、插件、MCP 服务器、自动记忆和 CLAUDE.md。而且**`-p` 模式不会弹出「信任此文件夹」和 MCP 批准提示**，在陌生仓库里运行会直接执行它 `.claude/settings.json` 里的 Hooks、连接它 `.mcp.json` 里的服务器。

加上 `--bare` 后这些都不自动加载，需要的东西用参数显式传入：

```bash
claude --bare -p "总结 README.md" --allowedTools "Read"
```

| 想加载 | 用 |
| --- | --- |
| 追加系统提示词 | `--append-system-prompt`、`--append-system-prompt-file` |
| 设置 | `--settings <文件或JSON>` |
| MCP 服务器 | `--mcp-config <文件或JSON>` |
| 自定义子代理 | `--agents <文件或JSON>` |
| 插件 | `--plugin-dir <路径>` |

官方说明 `--bare` 是脚本和 SDK 调用的推荐模式，未来会成为 `-p` 的默认行为。注意：bare 模式**不读订阅登录凭据**，要用 Claude Console 的 `ANTHROPIC_API_KEY`（或 `apiKeyHelper`）。

## 六、在服务器 / CI 里怎么登录

| 方式 | 适用 | 说明 |
| --- | --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` | 用 Pro / Max / Team / Enterprise 订阅 | 在有浏览器的电脑上运行 `claude setup-token`，授权后终端会打印一个有效期一年的令牌（不会保存），把它设为环境变量 |
| `ANTHROPIC_API_KEY` | 用 Console 预付费额度 | 在 Claude Console 创建 API Key；`-p` 模式下只要设置了就会使用 |

```bash
export CLAUDE_CODE_OAUTH_TOKEN=你的令牌    # macOS / Linux
$env:CLAUDE_CODE_OAUTH_TOKEN = "你的令牌"  # PowerShell
```

官方说明：这个订阅令牌只能发起模型请求，不能建立 Remote Control 会话，也拿不到 claude.ai 上的连接器；本地配置的 MCP 服务器照常可用。`--bare` 模式不读这个令牌。令牌等同于账号凭据，务必放在 CI 的密钥管理里，不要写进仓库。

## 七、多轮对话

```bash
claude -p "检查这个代码库的性能问题"
claude -p "现在重点看数据库查询" --continue
claude -p "汇总所有发现的问题" --continue
```

同时跑多个对话时，记下会话 ID 再精确恢复：

```bash
session_id=$(claude -p "开始一次代码审查" --output-format json | jq -r '.session_id')
claude -p "继续刚才的审查" --resume "$session_id"
```

## 常见问题

**Q：`-p` 模式下能用斜杠命令吗？**
你自己写的技能和自定义命令可以，把 `/技能名` 写进提示词即可；`/login` 这类只能在交互界面运行的命令不行。`/model sonnet`、`/config thinking=false` 这类带参数的写法新版本支持。

**Q：GitHub Actions 里怎么用？**
官方有专门的 Claude Code GitHub Action，详见本站《Claude Code GitHub Actions 配置教程：@claude 自动审 PR、修 issue》。

**Q：想在 Python / TypeScript 程序里调用怎么办？**
用 Claude Agent SDK，它提供和 Claude Code 相同的工具、智能体循环和上下文管理，还有结构化输出和工具审批回调，详见本站《Claude Agent SDK 入门：是什么、怎么装、第一个智能体（Python / TypeScript）》。

**Q：headless 模式会消耗订阅额度吗？**
用订阅令牌登录时，用量和交互使用一样计入你的套餐额度；用 API Key 时按 API 用量计费。额度说明详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 参考资料

- Run Claude Code programmatically（官方）：https://code.claude.com/docs/en/headless
- CLI reference（官方）：https://code.claude.com/docs/en/cli-reference
- Authentication（官方）：https://code.claude.com/docs/en/authentication
- Choose a permission mode（官方）：https://code.claude.com/docs/en/permission-modes
- Agent SDK overview（官方）：https://code.claude.com/docs/en/agent-sdk/overview
