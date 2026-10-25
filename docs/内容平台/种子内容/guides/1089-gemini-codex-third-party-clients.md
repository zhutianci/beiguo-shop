---
title: Gemini 怎么接入 Codex：官方支持的是文档 MCP 和技能，直接调用 Gemini 模型官方没有这条路
slug: gemini-codex-third-party-clients
products: [gemini, codex]
models: []
accountTier: OTHER
excerpt: Gemini 能接入 Codex 吗？分两种意思：让 Codex 查 Gemini 官方文档、用 Gemini 技能，官方明确支持（codex mcp add 即可）；让 Codex 直接调用 Gemini 模型，官方文档没有这条路，原因是 Codex 只认 responses 协议。
checkedOn: 2026-10-25
sources:
  - https://ai.google.dev/gemini-api/docs/coding-agents
  - https://ai.google.dev/gemini-api/docs/openai
  - https://developers.openai.com/codex/config-advanced
  - https://developers.openai.com/codex/config-reference
  - https://geminicli.com/docs/get-started/authentication
verify:
  - 「Gemini 文档 MCP 服务器支持 OpenAI Codex」以及 `codex mcp add` 和 config.toml 的两种写法，直接取自 Gemini API 官方文档「Coding agent setup」页（2026-10-25）；服务器地址以该页为准，本文未在本站实际运行验证
  - 「直接调用 Gemini 模型」为本文的推断，不是官方明确的结论：Codex 官方配置参考里 wire_api 的取值只有 responses；Gemini API 官方 OpenAI 兼容页（2026-10-25）示例和说明只涉及 chat/completions、images/generations、embeddings 和批量，没有出现 responses 接口。两边文档对不上，所以本文说「官方文档没有这条路」，而不是「一定不能」
  - 官方 Gemini 原生接口现在主推 Interactions API；本文不写非官方的转换、中转或反代方案
  - Gemini CLI 的个人账号路径已于 2026-06-18 调整，详见本站《Gemini CLI 怎么用》一文
  - Antigravity Plugin 与 Gemini Agent Skills 的可用环境以官方页「Availability」一列为准：Skills 预装在 AI Studio Build，可用 skills.sh、Context7 或托管智能体安装；官方页说明的文档 MCP 在 Claude Code、Cursor、OpenAI Codex、VS Code 中可用
---

> 本文根据 Gemini API 官方「Coding agent setup」页、Gemini OpenAI 兼容页和 Codex 官方配置文档整理，资料核对于 2026-10-25。官方没有写「Gemini 模型接入 Codex」的专门页面，下文把能核对的和不能核对的分开写。

## 适用于谁

- 搜「gemini怎么接入codex」的人；
- 想让 Codex 帮忙写 Gemini API 代码的开发者；
- 想在 Codex 里直接选 Gemini 模型的人。

## 结论先说

1. **这个问题有两种意思**，答案不同。
2. **让 Codex 用上 Gemini 的资料：官方明确支持**。Gemini API 官方「Coding agent setup」页说，Gemini 文档 MCP 服务器在 Claude Code、Cursor、OpenAI Codex、VS Code 里都可用，Codex 的加法是 `codex mcp add geminiDocs --url <官方页给出的地址>`，或在 `~/.codex/config.toml` 里写 `[mcp_servers.geminiDocs]`。
3. **让 Codex 直接调用 Gemini 模型：官方文档里没有这条路**。Codex 官方配置参考里，自定义提供方的 `wire_api` 只有 `responses` 一种取值；而 Gemini 官方 OpenAI 兼容页只写了 chat/completions 等接口，没有 responses。两边对不上，所以本文不提供「填什么 base_url」的写法。
4. **想在终端里用 Gemini 模型写代码**：官方的产品是 Antigravity CLI，见 [/guides/gemini-cli-how-to-use-antigravity-cli](/guides/gemini-cli-how-to-use-antigravity-cli)。
5. **想用 Codex 官方模型**：需要 ChatGPT 套餐，见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

![「Gemini 接入 Codex」的几种意思和官方做法](seed:g1089-gemini-codex-meanings.png)
*图：本站根据 [Gemini API Coding agent setup](https://ai.google.dev/gemini-api/docs/coding-agents) 与 [Codex 配置文档](https://developers.openai.com/codex/config-reference) 整理的示意图*

## 一、官方支持的：给 Codex 加上 Gemini 文档 MCP

官方 Coding agent setup 页列出了几种资源：

| 资源 | 提供什么 | 可用环境（官方写法） |
| --- | --- | --- |
| Gemini Agent Skills | 针对具体功能的规则、SDK 写法和辅助脚本，包括 gemini-api-dev、gemini-live-api-dev、gemini-omni-flash-api | 预装在 AI Studio Build；可用 skills.sh、Context7 或托管智能体安装 |
| Gemini Docs MCP Server | 在线搜索文档（gemini_search_docs）和读取整页文档（gemini_get_doc） | Claude Code、Cursor、OpenAI Codex、VS Code |
| Gemini API Plugin | 官方技能、文档 MCP 和 API Key 工具的合集 | Antigravity |
| 机器可读文档 | 干净的 Markdown 页面和 llms.txt 索引 | ai.google.dev/gemini-api/docs 下的所有页面 |

给 Codex 加文档 MCP，官方给了两种写法：

![给 Codex 加 Gemini 文档 MCP 的步骤](seed:g1089-gemini-docs-mcp-codex-steps.png)
*图：本站根据 [Gemini API Coding agent setup](https://ai.google.dev/gemini-api/docs/coding-agents) 整理的示意图*

1. 命令行：`codex mcp add geminiDocs --url <官方页给出的 MCP 地址>`；
2. 或编辑用户级 `~/.codex/config.toml`，新增 `[mcp_servers.geminiDocs]`，写入 `url = "<同一地址>"`。

这样做之后，Codex 写 Gemini API 代码时可以查官方最新文档，核对请求格式、模型限制和新功能。注意这**不是**让 Codex 的模型换成 Gemini，只是给它多了一个文档查询工具。

官方技能的安装命令（技能仓库为 google-gemini/gemini-skills）：`npx skills add google-gemini/gemini-skills --list` 列出所有技能，`npx skills add google-gemini/gemini-skills --skill <技能名> --global` 全局安装某个技能。其中 gemini-api-dev 教的是用 Interactions API 和官方 SDK 写 Gemini API 应用，也包含迁移旧版 generateContent 代码的内容。

## 二、为什么「直接调 Gemini 模型」官方没有说通

Codex 官方的自定义模型提供方写法（`config.toml`）有 `base_url`、`env_key`、`wire_api` 等字段，参考页里 `wire_api` 的取值只有 `responses`。这意味着 Codex 期望对端提供 Responses 接口。以 xAI 为例，官方 API 就明确支持 Responses，所以能对上，见 [/guides/grok-codex-cursor-setup](/guides/grok-codex-cursor-setup)；DeepSeek 官方也写明支持 Responses API，见 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。

Gemini 这边：

- 官方 OpenAI 兼容页给的 `base_url` 是 `https://generativelanguage.googleapis.com/v1beta/openai/`；
- 页面里的示例涉及聊天补全（chat/completions）、图片生成、嵌入、批量等，没有 responses；
- Gemini 官方原生的新接口是 Interactions API。

所以按两家官方文档，没有一条受支持的路能把 Codex 的模型直接指向 Gemini。网上有人用第三方转换层或中转，那不属于官方方案，本文不涉及，也不建议把 Google 账号或 API Key 交给不明服务。

## 三、想用 Gemini 写代码，官方的路

| 需求 | 官方做法 |
| --- | --- |
| 在终端里用 Gemini 模型 | Antigravity CLI，见 [/guides/gemini-cli-how-to-use-antigravity-cli](/guides/gemini-cli-how-to-use-antigravity-cli) |
| 在 API 里调用 Gemini | 用 Gemini API Key，见 [/guides/gemini-api-key](/guides/gemini-api-key) 与 [/guides/gemini-api-python-quickstart](/guides/gemini-api-python-quickstart) |
| 让 AI 编程助手写对 Gemini 代码 | Gemini 文档 MCP 加官方技能（Codex 可用） |
| 在网页里快速试模型 | Google AI Studio，见 [/guides/google-ai-studio-how-to](/guides/google-ai-studio-how-to) |

Gemini 订阅相关见 [/guides/gemini-ultra-vs-pro-difference](/guides/gemini-ultra-vs-pro-difference)，需要谷歌账号相关服务可看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

## 常见问题

**Q：Gemini API 的 OpenAI 兼容接口能当通用 OpenAI 接口用吗？**
官方说明是用 OpenAI 库把 `base_url` 指向 Gemini 的兼容地址，再按 chat/completions 等调用，见 [/guides/gemini-api-base-url-openai-compatible](/guides/gemini-api-base-url-openai-compatible)。是否支持 Codex 需要的 Responses 接口，官方页面没有写。

**Q：有没有让 Codex 用 Gemini 的免费办法？**
没有官方说明。官方 API 免费层的额度见 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits)。

**Q：Codex 接别的模型怎么配？**
DeepSeek 和 Grok 的写法见开头链接的两篇，字段相同，地址和密钥不同。

## 参考资料

- Gemini API：Coding agent setup — https://ai.google.dev/gemini-api/docs/coding-agents
- Gemini API：OpenAI 兼容 — https://ai.google.dev/gemini-api/docs/openai
- OpenAI：Codex 高级配置 — https://developers.openai.com/codex/config-advanced
- OpenAI：Codex 配置参考 — https://developers.openai.com/codex/config-reference
- Gemini CLI 文档：认证 — https://geminicli.com/docs/get-started/authentication
