---
title: OpenAI Agents SDK 教程：安装、第一个智能体、工具与多智能体交接（Python）
slug: openai-agents-sdk-python-quickstart
products: [chatgpt, ai-tools]
models: [gpt]
topics: [ai-agent]
accountTier: OTHER
excerpt: OpenAI Agents SDK 是什么、怎么上手？按官方 README 和 Quickstart 讲清安装命令、设置 API Key、十行代码跑起第一个智能体、给它加函数工具、用 handoffs 做多智能体分工、在 Trace viewer 里看调用过程，以及它的核心概念各是什么。
checkedOn: 2026-10-11
sources:
  - https://github.com/openai/openai-agents-python
  - https://openai.github.io/openai-agents-python/quickstart/
verify:
  - 函数工具的写法以 Quickstart 当前页面为准（页面示例用的是 from agents.decorators import tool 与 @tool）；旧教程里常见的 @function_tool 是否仍可用以官方文档为准
  - 官方页面没有写明默认模型；调用 API 按用量计费，价格以 OpenAI 官方定价页为准
  - 本文只覆盖 Python 版；官方另有 JavaScript / TypeScript 版 SDK
---

> 本文根据 OpenAI Agents SDK 官方仓库 README 和官方文档 Quickstart 整理，资料核对于 2026-10-11。文中代码取自官方页面，没有在本机运行验证。还没有 API Key 的话先看[《OpenAI API Key 怎么获取》](/guides/openai-api-key)。

## 适用于谁

- 搜「openai agents sdk 教程」「openai agents sdk 使用」「openai agents sdk 是什么」的人；
- 已经会调 OpenAI API，想从「一问一答」升级到「能自己调用工具、多步完成任务」的人；
- 在几个智能体框架之间做选择，想先知道官方这一套长什么样的人。

## 结论先说

1. **它是 OpenAI 官方的智能体开发框架**，README 的定位是：一个轻量但功能完整的、用来构建多智能体工作流的框架。
2. **安装一行**：`pip install openai-agents`，需要 Python 3.10 及以上，并设置环境变量 `OPENAI_API_KEY`。
3. **最小程序只有三步**：定义 `Agent`（名称加指令）→ 用 `Runner` 运行 → 读 `result.final_output`。
4. **两种多智能体模式**：交接（handoffs，把对话转给另一个智能体）和把智能体当工具用（主智能体保持控制权）。
5. **自带追踪**。每次运行的过程可以在 OpenAI 控制台的 Trace viewer 里看到。

## 一、核心概念

README 列出的概念和各自的定义：

| 概念 | 含义 |
| --- | --- |
| Agents（智能体） | 配置了指令、工具、护栏和交接的大模型 |
| Tools（工具） | 让智能体执行操作的函数、MCP 服务器和托管工具 |
| Handoffs / Agents as tools | 把特定任务委派给其他智能体 |
| Guardrails（护栏） | 可配置的输入、输出安全校验 |
| Sessions（会话） | 跨多次运行自动管理对话历史 |
| Tracing（追踪） | 内置的运行记录，用来查看、调试和优化工作流 |
| Human in the loop | 在智能体运行过程中让人参与的内置机制 |
| Sandbox agents | 预先配置好、能在容器里长时间工作的智能体 |
| Realtime / Voice agents | 低延迟的语音与多模态智能体；语音转文字、智能体、文字转语音组成的流水线 |

入门只需要前三个。

## 二、安装与设置

```bash
mkdir my_project
cd my_project
python -m venv .venv
```

激活虚拟环境：macOS / Linux 用 `source .venv/bin/activate`，Windows 用 `.venv\Scripts\activate`。然后安装：

```bash
pip install openai-agents
```

用 uv 的话是 `uv init` 之后 `uv add openai-agents`。

设置 API Key（把 `sk-...` 换成你自己的）：

```bash
export OPENAI_API_KEY=sk-...
```

Windows PowerShell 的写法是 `$env:OPENAI_API_KEY = "sk-..."`。

可选的附加项：语音功能 `pip install 'openai-agents[voice]'`，用 Redis 存会话 `pip install 'openai-agents[redis]'`。

## 三、第一个智能体

README 的 Hello world：

```python
from agents import Agent, Runner

agent = Agent(name="Assistant", instructions="You are a helpful assistant")

result = Runner.run_sync(agent, "Write a haiku about recursion in programming.")
print(result.final_output)
```

- `Agent(name=..., instructions=...)`：`instructions` 相当于这个智能体的系统提示词；
- `Runner.run_sync(...)`：同步运行。它内部是一个循环：调用模型，模型要用工具就执行工具，把结果交回模型，直到产出最终回答；
- `result.final_output`：最终的回答。

异步写法（Quickstart 的例子）：

```python
import asyncio
from agents import Agent, Runner

agent = Agent(
    name="History Tutor",
    instructions="You answer history questions clearly and concisely.",
)

async def main():
    result = await Runner.run(agent, "When did the Roman Empire fall?")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

## 四、加一个函数工具

把一个普通的 Python 函数变成智能体可以调用的工具。Quickstart 当前页面的写法：

```python
from agents import Agent
from agents.decorators import tool

@tool
def history_fun_fact() -> str:
    """Return a short history fact."""
    return "Sharks are older than trees."

agent = Agent(
    name="History Tutor",
    instructions="Answer history questions clearly. Use history_fun_fact when it helps.",
    tools=[history_fun_fact],
)
```

函数的名称、参数类型和文档字符串会成为给模型看的工具定义。所以文档字符串要写清这个工具做什么、什么时候该用；在 `instructions` 里点一下「什么情况下用哪个工具」也有帮助。

工具的基本原理见[《Claude 工具调用入门》](/guides/claude-tool-use-basics)，各家的机制是相通的。

## 五、多智能体：交接

一个分诊智能体把问题转给合适的专家智能体。每个专家设置 `handoff_description`，告诉分诊者什么时候该转给它：

```python
history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You answer history questions clearly and concisely.",
)
```

分诊者用 `handoffs=[...]` 声明可以转给谁：

```python
triage_agent = Agent(
    name="Triage Agent",
    instructions="Route each homework question to the right specialist.",
    handoffs=[history_tutor_agent, math_tutor_agent],
)
```

（`math_tutor_agent` 的定义方式和历史老师相同。）运行时对 `triage_agent` 调用 `Runner.run` 即可。

**交接和「智能体当工具」的区别**：交接之后，接手的智能体直接负责后面的对话；把智能体当工具用时，主智能体始终保持控制，只是把专家的输出当作一次工具结果。官方文档把后者称为 Agents as tools 模式，适合需要汇总多个专家结果的场景。

## 六、看运行过程

SDK 默认开启追踪。官方给的查看位置是 OpenAI 控制台的 Trace viewer：`https://platform.openai.com/traces`。在那里可以看到每次运行里模型调用了什么、工具返回了什么、在哪一步交接。

智能体行为不符合预期时，先看追踪，再改指令或工具说明，比盲目改提示词有效。

## 七、能用别家的模型吗

README 的说法：SDK 支持 OpenAI 的 Responses API 和 Chat Completions API，并且是「provider-agnostic」的，还能通过可选依赖接入 100 多种其他大模型，README 点名的集成途径是 any-llm 和 LiteLLM。具体配置以官方文档为准。

Responses API 是什么见[《OpenAI Responses API》](/guides/openai-responses-api)。

## 八、Sandbox agents

README 把它放在了显眼的位置：预先配置好、在容器里长时间工作的智能体。README 的示例使用 `UnixLocalSandboxClient`，支持 macOS 和 Linux；Windows 上官方建议用 `DockerSandboxClient` 或托管的沙箱客户端。细节见官方的 Sandbox agents 文档。

## 常见问题

**Q：和直接调 Responses API 有什么区别？**
直接调 API 时，「模型要调用工具 → 你执行 → 把结果传回去 → 再调用」这个循环要自己写。SDK 把循环、交接、会话历史和追踪都做好了。

**Q：和 Claude Agent SDK 是一类东西吗？**
都是官方的智能体开发工具包，设计取向不同。Claude 那一套见[《Claude Agent SDK 快速上手》](/guides/claude-agent-sdk-quickstart)。

**Q：报 429 或提示额度不足？**
这是 API 层面的限制，见[《OpenAI API 429 错误》](/guides/openai-api-429-error)。智能体一次任务会调用模型多次，用量比单次问答大，测试时留意消耗。

**Q：智能体会自己执行危险操作吗？**
它只能调用你给它的工具。有副作用的工具（删除、付款、发消息）要么不给，要么配合护栏和人工确认机制使用。

## 参考资料

- openai/openai-agents-python（官方仓库）：https://github.com/openai/openai-agents-python
- Quickstart（官方文档）：https://openai.github.io/openai-agents-python/quickstart/
