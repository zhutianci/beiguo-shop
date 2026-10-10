---
title: Arize Phoenix 是什么、怎么用：看大模型应用的调用链路、做评测（安装与上手）
slug: arize-phoenix-llm-tracing-observability
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Arize Phoenix 是什么、怎么使用？按官方 README 讲清它的六项功能、基于 OpenTelemetry 的设计、pip 与 Docker 安装、phoenix serve 本地启动、各个子包的分工、支持哪些智能体框架和模型厂商，以及用它排查「智能体为什么答错」的基本思路。
checkedOn: 2026-10-11
sources:
  - https://github.com/Arize-ai/phoenix
verify:
  - 本地访问端口 6006 是根据官方 README 里指向 http://localhost:6006/mcp 的链接得出的，README 没有单独写明默认地址，以启动时终端打印的地址为准
  - 官方 README 没有给出最小的接入代码，本文未写代码，接入步骤以官方 Tracing 文档为准
  - 许可证为 Elastic License 2.0，不是常见的宽松开源许可，商用和对外提供托管服务前请阅读许可证条款
---

> 本文根据 Arize Phoenix 官方仓库 README 整理，资料核对于 2026-10-11。命令取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「arize phoenix 是什么」「arize phoenix 使用」的人；
- 做了一个智能体或 RAG 应用，回答不对时只能靠打印日志猜原因的人；
- 想知道一次请求里到底调用了几次模型、检索到了什么、每一步花了多少时间和 token 的人。

## 结论先说

1. **Phoenix 是 Arize 开源的 AI 可观测性平台**，官方定位是用于实验、评测和排查问题，可以自己部署。
2. **核心是追踪（Tracing）**：把应用运行时的每一步记录下来，包括每次模型调用的输入输出、每次工具调用、每次检索。
3. **基于 OpenTelemetry 和 OpenInference**，官方强调与厂商和语言无关。
4. **本地两步跑起来**：`pip install arize-phoenix`，然后 `phoenix serve`。
5. **不用自己埋点**：它对主流的智能体框架和模型 SDK 有现成的集成。
6. **许可证是 Elastic License 2.0**，使用前留意条款。

## 一、六项功能

| 功能 | 做什么 |
| --- | --- |
| Tracing（追踪） | 用基于 OpenTelemetry 的埋点，记录大模型应用的运行过程 |
| Evaluation（评测） | 用大模型给应用的表现打分，包括回答质量和检索质量 |
| Datasets（数据集） | 创建带版本的样例集，用于实验、评测和微调 |
| Experiments（实验） | 比较提示词、模型、检索方式改动前后的效果 |
| Playground | 迭代提示词、对比模型、调参数，并且可以重放追踪到的模型调用 |
| Prompt Management（提示词管理） | 给提示词做版本、打标签、测试改动 |

这六项连起来是一个闭环：线上的调用被追踪下来 → 挑出有问题的样例存进数据集 → 在 Playground 里改提示词 → 用实验对比新旧版本 → 用评测量化效果。

## 二、为什么需要追踪

一个智能体回答一个问题，背后可能是：一次检索、三次模型调用、两次工具调用。最后答错了，原因可能在任何一步：

- 检索回来的片段就不相关；
- 片段是对的，但模型没用上；
- 模型决定调用工具时参数填错了；
- 工具返回了错误，模型把错误当成了结果。

只看最终回答是分不清的。追踪把每一步的输入、输出、耗时都摆出来，像看程序的调用栈一样。追踪里的一条完整记录叫 trace，其中的每一步叫 span。

## 三、安装与启动

```bash
pip install arize-phoenix
phoenix serve
```

启动后在浏览器里打开终端打印出来的地址。官方 README 里的链接指向本机的 6006 端口。

**Docker**：官方镜像在 Docker Hub 上，名称是 `arizephoenix/phoenix`。运行参数见官方文档。

## 四、把应用接上去

README 给了一条自动配置的命令，它会检测你用的框架并接好追踪：

```bash
npx @arizeai/phoenix-cli setup
```

已经装了 Phoenix 的话，等价的写法是 `px setup`。

手动接入则是在应用里安装对应的埋点包并指向 Phoenix 的地址，README 没有给出最小代码，具体步骤见官方的 Tracing 文档。相关的子包：

| 包 | 作用 |
| --- | --- |
| `arize-phoenix-otel` | 对 OpenTelemetry 的轻量封装，带有适配 Phoenix 的默认设置 |
| `arize-phoenix-client` | 访问 Phoenix REST API 的轻量客户端 |
| `arize-phoenix-evals` | 评测工具，包括 RAG 相关性等 |
| `@arizeai/phoenix-otel`、`@arizeai/phoenix-client`、`@arizeai/phoenix-evals` | 上面三个的 TypeScript 版本（evals 标注为 alpha） |
| `@arizeai/phoenix-cli` | 命令行，用来获取追踪、数据集和实验 |

也就是说，生产环境里的应用只需要装轻量的埋点包，不需要装完整的 `arize-phoenix`。

## 五、支持哪些框架和厂商

README 列出的集成：

- **框架**：OpenAI Agents SDK、Claude Agent SDK、LangGraph、Vercel AI SDK、Mastra、CrewAI、LlamaIndex、DSPy；
- **模型厂商**：OpenAI、Anthropic、Google GenAI、Google ADK、AWS Bedrock、OpenRouter、LiteLLM 等。

本站介绍过的几个框架都在其中：[《OpenAI Agents SDK 教程》](/guides/openai-agents-sdk-python-quickstart)、[《Claude Agent SDK 快速上手》](/guides/claude-agent-sdk-quickstart)、[《Vercel AI SDK 是什么》](/guides/vercel-ai-sdk-getting-started)、[《Mastra 是什么》](/guides/mastra-ai-agent-framework-getting-started)。

因为底层是 OpenTelemetry，没有现成集成的系统也可以按标准自己上报。

## 六、给编程智能体用

README 里有专门面向编程智能体的部分：

- **MCP 服务器**：Phoenix 实例自带一个远程 MCP 端点，在实例地址后面加 `/mcp`，可以接到 Claude Code、Cursor 等支持 MCP 的客户端。接上之后，可以直接让编程智能体去查追踪记录、分析失败的调用；
- **Skills**：仓库的 `.agents/skills/` 里提供了 `phoenix-cli`、`phoenix-evals`、`phoenix-tracing` 三个技能。

MCP 的接法见[《Claude Code MCP 配置教程》](/guides/claude-code-mcp-setup)。

## 七、用它排查问题的基本思路

1. **先找到那条出问题的 trace**，按时间或输入内容定位；
2. **从后往前看**：最终回答是哪次模型调用产生的，它当时的完整输入是什么；
3. **检查输入里的每一部分**：系统提示词对不对、检索到的片段相不相关、工具返回了什么；
4. **定位到出问题的那一步**，再决定是改提示词、改检索，还是改工具的说明和返回格式；
5. **把这个案例存进数据集**，改完之后用它来验证，之后也作为回归用例。

检索不相关时怎么调，见[《Dify 知识库搭建教程》](/guides/dify-knowledge-base-chunking-retrieval)里的排查表；只想批量对比提示词，用更轻量的[《promptfoo 使用教程》](/guides/promptfoo-compare-prompts-models-eval)。

## 八、数据与许可

- **追踪数据里有用户输入和模型输出的原文**。自己部署时，这些数据在你的机器上；要注意谁能访问 Phoenix 的界面，以及是否需要对敏感内容做脱敏；
- **遥测**：README 说明默认会收集基础的网页分析数据，可以用环境变量 `PHOENIX_TELEMETRY_ENABLED=false` 关闭；同时声明不收集追踪数据和评测结果；
- **许可证**：Elastic License 2.0（ELv2）。它和 MIT、Apache 这类宽松许可不同，对把软件作为托管服务提供给第三方等用法有限制。公司内部自用一般不受影响，但要对外提供服务时请先阅读条款；
- **托管选项**：README 提到 Arize 另有托管平台 Arize AX，使用相同的埋点方式。

## 常见问题

**Q：和 promptfoo 是一类工具吗？**
侧重点不同。promptfoo 是「上线前用一批固定用例批量对比」；Phoenix 的核心是「运行时把每一步记录下来」，在此基础上再做评测和实验。两者可以一起用。

**Q：只在开发时用，还是也能用在生产环境？**
两种都可以。开发时在本机启动，边调边看；生产环境需要单独部署并规划存储，见官方的部署文档。

**Q：会不会拖慢我的应用？**
追踪基于 OpenTelemetry，数据通常是异步上报的。具体的性能影响和采样配置，以官方文档为准。

**Q：必须用它的评测功能吗？**
不必。很多人只用追踪这一项，就已经能解决大部分「不知道哪一步出了问题」的情况。

## 参考资料

- Arize-ai/phoenix（官方仓库与 README）：https://github.com/Arize-ai/phoenix
