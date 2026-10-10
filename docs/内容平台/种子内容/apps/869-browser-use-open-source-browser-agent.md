---
title: "Browser Use 是什么、怎么用：让 AI 自己操作浏览器的开源智能体框架"
slug: browser-use-open-source-browser-agent
name: Browser Use
url: https://github.com/browser-use/browser-use
pricing: 开源免费（MIT）/ 云服务按量付费
platforms: Python / TypeScript / 命令行 / 云端浏览器
trialNote: 云服务新注册赠 15 美元额度
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Browser Use 是 MIT 许可的开源浏览器智能体框架，让大模型像人一样点击、输入、翻页来完成网页任务，可在本地或云端浏览器运行，支持 OpenAI、Anthropic、Google 及 Ollama 本地模型。"
checkedOn: 2026-10-11
sources:
  - https://github.com/browser-use/browser-use
---

> 本文根据 Browser Use 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Browser Use 的一句话介绍是「会使用浏览器的智能体」，README 的常见问题里称它是开源的浏览器智能体（Python 与 TypeScript）。你用自然语言给出目标，比如「到某网站查这款产品的价格并整理成表格」，大模型就通过它控制真实的浏览器，一步步点击、输入、滚动，直到完成。仓库约有 11.75 万星标，采用 MIT 许可。

## 能做什么

README 列出的特性：

- **本地或云端运行**：可以驱动本机浏览器，也可以使用云端浏览器；提供 Python 库和命令行两种用法。
- **可复用 Chrome 配置文件**：沿用已登录的会话，免去让智能体处理登录。
- **自定义工具与系统提示词**：给智能体增加自己的动作，或调整它的行为规则。
- **对接 Claude 的浏览器工具集**：README 称实现了 31 种浏览器动作以及 Bash。
- **多模型支持**：官方推荐自家的 `ChatBrowserUse` 模型，也支持 `ChatOpenAI`、`ChatAnthropic`、`ChatGoogle`，以及通过 Ollama 使用本地模型。

## 怎么上手

README 给出的快速开始：

```bash
uv init --python 3.12   # 可选：新建项目
uv add browser-use
```

然后在 `.env` 文件里写入模型服务的密钥（README 的例子是 `OPENAI_API_KEY=your-key`），编写一个 `agent.py` 描述任务，再运行：

```bash
uv run agent.py
```

命令行方式的初始化命令是 `browser-use skill install`。任务脚本的写法见官方文档与示例。

## 免费与付费

- **开源框架**：免费，费用只有调用大模型的开销。
- **Browser Use Cloud**：README 标明云端浏览器 0.02 美元/浏览器小时，并提供托管的智能体 API；用 Google、GitHub 或 Microsoft 账号新注册可获 15 美元额度。其他收费项以官网为准。

## 适合谁 / 不适合谁

**适合：** 需要自动化没有 API 的网站操作的开发者；做网页测试、信息采集、表单填写类智能体的团队；研究「电脑操作智能体」的学习者。

**不适合：** 不写代码的用户（可以看带界面的智能体产品）；有稳定 API 可用的场景——直接调 API 更快更可靠；对成功率要求接近 100% 的关键业务流程。

## 注意事项

- **让智能体使用已登录的浏览器要格外小心**：它可能误操作付款、发送消息或删除数据，涉及这类动作务必加人工确认。
- 网页上的文字可能包含针对智能体的恶意指令，不要让它带着重要账号访问不可信站点。
- 遵守目标网站的服务条款，不要用于绕过验证或批量抓取受限内容。
