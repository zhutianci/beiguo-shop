---
title: Claude Agent SDK 入门：是什么、怎么装、第一个智能体（Python / TypeScript）
slug: claude-agent-sdk-quickstart
products: [claude]
models: []
accountTier: OTHER
excerpt: Claude Agent SDK（原 Claude Code SDK）是把 Claude Code 的工具和智能体循环做成的 Python / TypeScript 库。本文讲它和其他方式的区别、安装认证，并跑通一个自己读代码修 bug 的智能体。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/agent-sdk/overview
  - https://code.claude.com/docs/en/agent-sdk/quickstart
  - https://code.claude.com/docs/en/agent-sdk/migration-guide
  - https://code.claude.com/docs/en/agent-sdk/permissions
  - https://github.com/anthropics/claude-agent-sdk-demos
---

> 本文根据 Claude Code 官方文档的 Agent SDK 部分整理，核对日期 2026-10-07。示例代码基于官方快速开始改写。

## 适用于谁

- 想在自己的 Python / Node.js 程序里，嵌入一个能自己读文件、改代码、跑命令的 AI 智能体的开发者；
- 搜「claude agent sdk 教程」「claude code sdk 是什么」「agent sdk python 使用」的人；
- 用过旧的 Claude Code SDK、需要迁移的人。

## 结论先说

1. **Claude Agent SDK = 把 Claude Code 当成一个库来用**：它提供和 Claude Code 相同的内置工具（读写文件、执行命令、网页搜索）、智能体循环、上下文管理，以及权限、会话、Hooks、子代理、MCP、技能、插件，可以用 Python 或 TypeScript 编程控制。
2. 它就是以前的 **Claude Code SDK**，已经改名：npm 包 `@anthropic-ai/claude-code` → `@anthropic-ai/claude-agent-sdk`，Python 包 `claude-code-sdk` → `claude-agent-sdk`。
3. 要求 **Node.js 18+ 或 Python 3.10+**；SDK 包自带 Claude Code 原生程序，大多数情况下不用另装 Claude Code。
4. 认证用 **Claude Console 的 API Key**（`ANTHROPIC_API_KEY`），也支持 Bedrock、Vertex 等云平台。官方明确：**未经许可，第三方开发者不得在自己的产品里提供 claude.ai 登录或使用订阅的额度**。
5. 和直接调 API 的区别：用 Client SDK 你要自己写工具和循环；用 Agent SDK，Claude 直接执行内置工具，你只需要消费它输出的消息流。

## 一、几种「用代码调 Claude」的方式怎么选

| 你想要 | 用什么 | 特点 |
| --- | --- | --- |
| 在自己的应用里嵌入 Claude Code 那样的智能体，跑在你自己运营的进程里 | **Agent SDK** | 内置工具、权限、会话、Hooks 都有 |
| 在终端里交互式开发、跑一次性任务 | Claude Code 命令行 | 日常交互使用 |
| 从代码直接调用 Claude API | Client SDK（`anthropic` 包） | 工具循环自己写，或用 tool runner |
| 让 Anthropic 托管智能体 | Managed Agents | 在托管沙箱或自建沙箱里运行 |

想用 Python / TypeScript 之外的语言驱动同样的智能体循环，官方建议以子进程方式运行 `claude -p --output-format json`，详见本站《Claude Code headless 模式：用 claude -p 写脚本和自动化》。

## 二、安装

**Python（pip）：**

```bash
mkdir my-agent && cd my-agent
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\Activate.ps1
pip install claude-agent-sdk
```

（也可以用 uv：`uv init` 后 `uv add claude-agent-sdk`。）

**TypeScript：**

```bash
mkdir my-agent && cd my-agent
npm init -y
npm pkg set type=module
npm install @anthropic-ai/claude-agent-sdk
npm install --save-dev tsx
```

官方注意事项：SDK 通过平台对应的包自带 Claude Code 程序。如果 pip 装的是源码包而不是平台 wheel（比如 ARM64 Windows），或者 npm 安装时跳过了可选依赖（如 `npm ci --omit=optional`），就没有自带程序，需要另外原生安装 Claude Code。

## 三、设置 API Key

```bash
export ANTHROPIC_API_KEY=你的API Key           # macOS / Linux
$env:ANTHROPIC_API_KEY = "你的API Key"         # Windows PowerShell
```

SDK **不会自动读取 `.env` 文件**，用 `.env` 的话要自己先加载（比如用 dotenv）。API Key 的获取详见本站《Claude API Key 怎么获取：Claude Console 创建密钥、充值与用量查看》。

## 四、第一个智能体：自己找 bug、自己修

先准备一个有 bug 的文件 `utils.py`（官方示例）：

```python
def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)

def get_user_name(user):
    return user["name"].upper()
```

它有两个问题：空列表会除以零；传入 `None` 会报 TypeError。

新建 `agent.py`：

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

async def main():
    async for message in query(
        prompt="检查 utils.py 里会导致崩溃的 bug，并把它们修好。",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],   # 这些工具自动批准
            permission_mode="acceptEdits",            # 自动接受改文件
        ),
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    print(block.text)                 # Claude 的说明
                elif hasattr(block, "name"):
                    print(f"调用工具：{block.name}")
        elif isinstance(message, ResultMessage):
            print(f"完成：{message.subtype}")

asyncio.run(main())
```

运行 `python agent.py`。它会打印自己的思路和每次调用的工具，最后输出 `完成：success`。再打开 `utils.py`，会看到已经加上了处理空列表和空用户的防御代码——**整个过程 Claude 自己读文件、分析、改文件**，你没有写任何工具实现。

TypeScript 版本（`agent.ts`，用 `npx tsx agent.ts` 运行）：

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "检查 utils.py 里会导致崩溃的 bug，并把它们修好。",
  options: {
    allowedTools: ["Read", "Edit", "Glob"],
    permissionMode: "acceptEdits",
  },
})) {
  if (message.type === "assistant" && message.message?.content) {
    for (const block of message.message.content) {
      if ("text" in block) console.log(block.text);
      else if ("name" in block) console.log(`调用工具：${block.name}`);
    }
  } else if (message.type === "result") {
    console.log(`完成：${message.subtype}`);
  }
}
```

代码的三个部分：

- **`query`**：主入口，创建智能体循环，返回一个异步迭代器，Claude 思考、调用工具、观察结果的过程会逐条流出来；
- **`prompt`**：你要它做的事，它自己决定用哪些工具；
- **`options`**：配置，如允许的工具、权限模式、系统提示词、MCP 服务器等。

## 五、常用配置

**给它更多能力：**

| 允许的工具 | 智能体能做什么 |
| --- | --- |
| `Read`、`Glob`、`Grep` | 只读分析 |
| `Read`、`Edit`、`Glob` | 分析并修改代码 |
| `Read`、`Edit`、`Bash`、`Glob`、`Grep` | 完全自动化（能执行命令） |

加上 `WebSearch` 就能联网搜索；加上 `Bash` 后可以试试「给 utils.py 写单元测试、运行并修复失败」。

**自定义系统提示词：**

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Glob"],
    permission_mode="acceptEdits",
    system_prompt="你是一名资深 Python 开发者，始终遵循 PEP 8 规范。",
)
```

**权限**：权限模式（如 `acceptEdits`、`plan`、`dontAsk` 等）和 allow / deny 规则一起按固定顺序判定，规则和 Claude Code 一致，详见官方 Agent SDK 的 Permissions 页。给智能体执行命令的权限时要谨慎，生产环境建议在容器等隔离环境中运行（官方有专门的 Hosting 和安全部署文档）。

**会话、Hooks、子代理、MCP**：SDK 都支持，并且默认会像 Claude Code 一样加载项目 `.claude/` 和 `~/.claude/` 里的技能、命令和记忆。

## 六、从 Claude Code SDK 迁移

| | 旧 | 新 |
| --- | --- | --- |
| npm 包 | `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| Python 包 | `claude-code-sdk` | `claude-agent-sdk` |

步骤：卸载旧包、安装新包、把 import 改成新包名。官方提醒 v0.1.0 起有一些不兼容改动，例如 Python 的 `ClaudeCodeOptions` 改名为 `ClaudeAgentOptions`，迁移前请看官方迁移指南的 Breaking changes 一节。

## 七、品牌与条款（做产品时注意）

- Agent SDK 的使用受 Anthropic《商业服务条款》约束，包括你用它给自己客户提供产品和服务时；
- 你的产品可以叫「Claude Agent」或「XX Powered by Claude」，但**不能叫「Claude Code」**，也不能模仿 Claude Code 的视觉元素，产品要保持自己的品牌。

## 常见问题

**Q：报「Not logged in」或「Invalid API key」？**
确认在运行智能体的那个终端里设置了 `ANTHROPIC_API_KEY`；SDK 不会自动读 `.env`。

**Q：能用我的 Claude Pro / Max 订阅额度跑 SDK 吗？**
官方说明未经事先批准，第三方开发者不得在其产品中提供 claude.ai 登录或订阅额度，SDK 应使用 API Key 认证。

**Q：Agent SDK 和 Tool Use 有什么区别？**
Tool Use 是 API 层面的能力，工具要你自己实现和执行；Agent SDK 内置了一整套工具和循环，开箱即用。详见本站《Claude Tool Use（工具调用 / Function Calling）入门：定义工具与返回 tool_result》。

**Q：有完整的示例项目吗？**
官方 GitHub 仓库 anthropics/claude-agent-sdk-demos 提供了邮件助手、研究助手等示例。

## 参考资料

- Agent SDK overview（官方）：https://code.claude.com/docs/en/agent-sdk/overview
- Agent SDK Quickstart（官方）：https://code.claude.com/docs/en/agent-sdk/quickstart
- Migrate to Claude Agent SDK（官方）：https://code.claude.com/docs/en/agent-sdk/migration-guide
- Agent SDK Permissions（官方）：https://code.claude.com/docs/en/agent-sdk/permissions
- 示例项目（官方 GitHub）：https://github.com/anthropics/claude-agent-sdk-demos
