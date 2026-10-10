---
title: Pydantic AI 是什么、怎么用：安装、结构化输出、工具与依赖注入入门
slug: pydantic-ai-agent-getting-started
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: OTHER
excerpt: Pydantic AI 是什么、怎么样、怎么上手？按官方 README 和安装文档讲清它的定位与卖点、完整版与 slim 版的安装命令、用 output_type 拿到校验过的结构化结果、用 @agent.tool 加工具、RunContext 与依赖注入是什么，以及适合什么人用。
checkedOn: 2026-10-11
sources:
  - https://github.com/pydantic/pydantic-ai
  - https://pydantic.dev/docs/ai/install/
verify:
  - 官方文档地址 ai.pydantic.dev 现已跳转到 pydantic.dev/docs/ai/
  - 示例里的模型字符串取自官方 README 当天版本，以官方文档为准
  - 可选依赖组的完整列表会随版本变化，本文只列了常用的几个
---

> 本文根据 Pydantic AI 官方仓库 README 和官方安装文档整理，资料核对于 2026-10-11。文中代码取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「pydantic ai 是什么」「pydantic ai 教程」「pydantic ai 怎么样」的人；
- 用 Python 写智能体，受够了从模型返回的文本里手动抠字段的人；
- 已经在用 Pydantic 或 FastAPI，希望智能体代码也有类型检查的人。

## 结论先说

1. **Pydantic AI 是 Pydantic 团队出的 Python 智能体框架**。官方的一句话定位是：一个带类型、可扩展的智能体循环，换模型只需要改一个字符串。
2. **安装**：`pip install pydantic-ai` 或 `uv add pydantic-ai`，需要 Python 3.11 及以上。
3. **最有特色的是结构化输出**：给 `Agent` 传一个 Pydantic 模型作为 `output_type`，拿到的 `result.output` 就是校验过的对象，字段类型和取值范围都有保证。
4. **工具就是加了装饰器的函数**：函数签名和文档字符串自动变成给模型看的工具定义。
5. **依赖注入**：数据库连接、当前用户这类运行时才有的东西，通过 `RunContext` 传进工具和指令里，而不是用全局变量。

## 一、它主打什么

README 的「为什么用 Pydantic AI」里列的几项：

| 卖点 | 说明 |
| --- | --- |
| 与模型无关 | 一套 Python 接口覆盖多家厂商，换模型只改字符串 |
| 类型安全 | 结构化输出、带类型的依赖注入、带类型的工具 |
| 可观测性 | 原生支持 OpenTelemetry，一行代码接入 Logfire，也可以接任何 OTel 后端 |
| 评测 | Pydantic Evals，像用 pytest 测代码那样测智能体的行为 |
| MCP | 通过核心的 MCP 能力接入 |
| 人工确认 | 内置工具调用审批 |
| 持久化执行 | 可以运行在 Temporal、DBOS、Prefect 这类引擎上，重启后能接着跑 |
| 图 | Pydantic Graph 提供带类型的、基于图的流程控制 |

## 二、安装

**完整版**

```bash
pip install pydantic-ai
```

```bash
uv add pydantic-ai
```

官方说明完整版包含 `pydantic_ai` 包、核心依赖，以及 OpenAI、Anthropic、Google 三家模型所需的库，还带上了命令行、MCP、Evals、Web 界面和 Logfire 的集成。其他模型和集成需要加附加项，例如 `pydantic-ai[bedrock,temporal]`。

**slim 版：只装需要的**

```bash
pip install "pydantic-ai-slim[openai]"
```

```bash
pip install "pydantic-ai-slim[openai,google,logfire]"
```

`pydantic-ai-slim` 只安装你选的附加项。常用的可选组名有 `openai`、`anthropic`、`google`、`groq`、`mistral`、`bedrock`、`openrouter`、`mcp`、`evals`、`logfire`、`cli` 等，完整列表见官方安装文档。

想让依赖尽量少（做成镜像、放进函数计算）时用 slim 版；本地学习直接装完整版。

然后把对应厂商的 API Key 设成环境变量，例如用 OpenAI 的模型就设 `OPENAI_API_KEY`。

## 三、第一个智能体：结构化输出加一个工具

README 里最短的完整示例：

```python
from typing import Literal

from pydantic import BaseModel, Field

from pydantic_ai import Agent, RunContext


class Sentiment(BaseModel):
    label: Literal['positive', 'negative', 'neutral']
    score: float = Field(ge=-1, le=1)


agent = Agent('openai:gpt-6-sol', output_type=Sentiment)


@agent.tool
def recent_reviews(ctx: RunContext, product: str) -> list[str]:
    """Fetch recent review snippets for a product."""
    return ['The new release fixed everything I complained about!']


result = agent.run_sync('How are people feeling about the Extract app?')
print(result.output)
#> label='positive' score=0.9
```

逐段看：

- **`Sentiment`**：一个普通的 Pydantic 模型。`label` 只能是三个值之一，`score` 必须在 -1 到 1 之间；
- **`Agent('openai:gpt-6-sol', output_type=Sentiment)`**：第一个参数是 `'厂商:模型'` 形式的模型字符串，换模型就改这里；`output_type` 声明最终结果必须是一个 `Sentiment`；
- **`@agent.tool`**：把函数注册为工具。函数签名和文档字符串成为工具的参数定义和说明。模型需要评论数据时会调用它；
- **`agent.run_sync(...)`**：同步运行。框架负责「调用模型 → 执行工具 → 再调用模型」的循环；
- **`result.output`**：拿到的是一个 `Sentiment` 对象，可以直接用 `result.output.label`。

模型返回的内容不符合 `Sentiment` 的约束时，校验会失败，而不是把一个不合格的结果悄悄交给你的业务代码。这就是它相对「在提示词里要求输出 JSON」的主要好处，原理见[《如何让大模型稳定输出 JSON》](/guides/llm-json-structured-output-reliable)。

## 四、依赖注入是什么

实际的工具往往需要外部资源：数据库连接、HTTP 客户端、当前登录的用户。README 的银行客服示例展示了这套机制，涉及的几个概念：

| 概念 | 作用 |
| --- | --- |
| `deps_type` | 声明这个智能体运行时需要的依赖类型 |
| `RunContext` | 运行上下文，把依赖带进工具函数和指令函数 |
| `@agent.tool` | 注册工具，第一个参数是 `RunContext` |
| `@agent.instructions` | 动态指令：在运行时根据依赖生成一段指令，比如把当前客户的姓名写进去 |
| `output_type` | 让每次运行返回一个校验过的、带类型的对象 |

好处有两个：一是类型检查器能发现「工具里用了依赖上不存在的属性」这类错误；二是测试时可以传入假的依赖，不必连真的数据库。

README 里还提到 Capabilities：把工具、指令、钩子和设置打包成可以复用的单元。入门阶段可以先不管。

## 五、看得见运行过程

README 把可观测性放在很靠前的位置：框架按 OpenTelemetry 标准输出追踪数据，接 Pydantic 自家的 Logfire 只需要一行代码，也可以接其他支持 OTel 的后端。slim 版需要加 `logfire` 附加项：

```bash
pip install "pydantic-ai-slim[logfire]"
```

之后按官方的 Logfire 设置指南配置。智能体多步运行时，哪一步调用了哪个工具、每次请求和响应是什么，都能在追踪里看到。

## 六、适合谁，不适合谁

适合：

- 需要把模型输出**交给下游代码**使用的场景：抽取、分类、填表、生成配置；
- 团队已有 Pydantic、类型标注的习惯；
- 希望不绑定某一家模型厂商。

可以先不用：

- 只是写个脚本调一次模型，直接用厂商的 SDK 更省事，见[《OpenAI API Python 快速上手》](/guides/openai-api-python-quickstart)、[《Claude API Python 快速上手》](/guides/claude-api-python-quickstart)；
- 项目是 TypeScript 的，看[《Vercel AI SDK 是什么》](/guides/vercel-ai-sdk-getting-started)或[《Mastra 是什么》](/guides/mastra-ai-agent-framework-getting-started)。

## 常见问题

**Q：和 Pydantic 是什么关系？**
同一个团队的作品。Pydantic 是做数据校验的库，Pydantic AI 用它来定义和校验模型的输出、工具的参数。

**Q：能用国内的模型吗？**
官方的可选依赖组里列了十几家厂商，包括 `openrouter`、`zai` 等。具体哪些模型受支持、怎么配置，以官方模型文档为准。

**Q：和 OpenAI Agents SDK 怎么选？**
主要用 OpenAI 的模型、想要官方的交接和追踪，选前者，见[《OpenAI Agents SDK 教程》](/guides/openai-agents-sdk-python-quickstart)；看重类型安全和跨厂商，选 Pydantic AI。

**Q：`result.output` 校验失败会怎样？**
会报校验错误。框架对重试的处理方式和配置项，以官方文档为准。

## 参考资料

- pydantic/pydantic-ai（官方仓库）：https://github.com/pydantic/pydantic-ai
- Installation（官方文档）：https://pydantic.dev/docs/ai/install/
