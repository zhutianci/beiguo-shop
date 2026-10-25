---
title: Codex 接入第三方模型：DeepSeek、Gemini、Grok 能不能接，怎么配置自定义模型提供方（官方配置总览）
slug: codex-third-party-models-deepseek-gemini-grok
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 能接 DeepSeek、Gemini、Grok 吗？按 Codex 官方配置文档，自定义提供方在 config.toml 里配置，协议只支持 Responses。本文对照三家官方 API 文档，说明哪家协议对得上、哪家文档没写，并给出配置步骤和示例。
checkedOn: 2026-10-25
sources:
  - https://developers.openai.com/codex/config-advanced
  - https://developers.openai.com/codex/config-reference
  - https://developers.openai.com/codex/config-sample
  - https://docs.x.ai/docs/guides/chat
  - https://api-docs.deepseek.com/
  - https://ai.google.dev/gemini-api/docs/openai
verify:
  - Codex 配置文档写 wire_api「只支持 responses，且省略时默认就是 responses」；是否有其他协议的转换层，Codex 官方没有写，正文不讨论转换工具
  - DeepSeek 官方首页文档只写了 OpenAI 格式的 chat/completions 和 Anthropic 格式，没有提到 Responses，也没有 Codex 教程；Gemini 的 OpenAI 兼容页只写了 chat/completions；这只表示「官方文档没写」，不等于一定不行，以各家官方后续说明为准
  - xAI 文档把 Responses API 称为推荐方式、Chat Completions 标为旧接口，协议上和 Codex 要求一致；但 xAI 和 Codex 官方都没有写 Grok 接入 Codex 的专门教程，下面的 toml 是按 Codex 官方示例格式套用 xAI 官方的 base_url 和示例模型名，并非官方原文，未逐项验证
  - xAI Responses API 默认把对话保存在服务器 30 天，文档写明可以关闭；用于代码时请自行评估
  - 模型名（grok-4.7、deepseek-flash 等）和 base_url 以各家官方文档当前页面为准，更新很快
---

> 本文根据 OpenAI Codex 的配置文档（Advanced Configuration、Configuration Reference、Sample Configuration）和 xAI、DeepSeek、Google 的官方 API 文档整理，资料核对于 2026-10-25。**本文不讲转接、中转或绕过**，只讲 Codex 官方支持的「自定义模型提供方」配置，以及三家官方文档里写了什么。Codex 本身的入门见 [/guides/codex-getting-started](/guides/codex-getting-started)。

## 适用于谁

- 在用 Codex，想知道能不能换成 DeepSeek、Gemini 或 Grok 的人；
- 搜「Codex 接入第三方模型」「codex 怎么接 deepseek」的人；
- 想弄懂 `model_providers`、`wire_api` 这些配置项的人。

## 结论先说

1. **Codex 官方支持自定义模型提供方**：在 `~/.codex/config.toml` 里写 `[model_providers.<id>]`，再用 `model_provider` 指向它。官方示例里有 Mistral、本地 Ollama、LLM 代理、Azure 等。
2. **关键限制：协议。** 官方参考文档写得很明确：`wire_api` **只支持 `responses`**（省略时默认也是它）。也就是说，对方必须提供 OpenAI 的 **Responses API** 接口。
3. **三家对照（2026-10 查询）：**
   - **Grok（xAI）**：官方文档把 Responses API 列为推荐方式，Chat Completions 标为旧接口，**协议上对得上**；
   - **DeepSeek**：官方文档写的是 OpenAI 格式的 chat/completions 和 Anthropic 格式，**没有提到 Responses**；官方的「Agent 工具集成」指南列的是 Claude Code、GitHub Copilot、OpenCode，没有 Codex；
   - **Gemini**：官方 OpenAI 兼容页只写了 chat/completions，**没有提到 Responses**。
4. **「文档没写」不等于「一定不行」**，但也不能当成「能用」。本站只写官方写了的。
5. **用 Codex 最稳妥的方式仍然是官方模型**：Plus 在价格页上有 Codex 扩展用量，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；用量说明见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

![Codex 接第三方模型：Codex 要求 responses 协议，xAI、DeepSeek、Gemini 官方文档写的接口对照](seed:g1044-provider-compat.png)
*图：本站根据 [Codex 配置参考](https://developers.openai.com/codex/config-reference) 与 xAI、DeepSeek、Google 官方 API 文档整理的示意图*

## 一、Codex 官方怎么配置自定义提供方

![Codex 添加自定义模型提供方的 4 步：打开 config.toml、新增 model_providers、指向 model_provider、环境变量放 Key](seed:g1044-config-steps.png)
*图：本站根据 [Codex Advanced Configuration](https://developers.openai.com/codex/config-advanced) 整理的示意图*

官方说明：一个模型提供方定义了 Codex 怎么连接模型，包括 base URL、协议、认证和可选的 HTTP 头。自定义提供方**不能使用保留的内置 ID：`openai`、`ollama`、`lmstudio`**。

官方示例（节选自 Advanced Configuration）：

```toml
model = "gpt-6.1-sol"
model_provider = "proxy"

[model_providers.mistral]
name = "Mistral"
base_url = "https://api.mistral.ai/v1"
env_key = "MISTRAL_API_KEY"
```

几个常用配置项（来自官方 Configuration Reference）：

| 配置项 | 含义 |
| --- | --- |
| `name` | 提供方的显示名 |
| `base_url` | 提供方的 API 基础地址 |
| `env_key` | 存放 API Key 的环境变量名 |
| `wire_api` | 协议，只支持 `responses` |
| `http_headers` / `env_http_headers` | 额外的请求头 |
| `query_params` | 追加到请求里的查询参数 |
| `request_max_retries` | HTTP 请求重试次数，默认 4 |

官方还提醒：**直接把密钥写进配置文件（`experimental_bearer_token`）不推荐，请用 `env_key`**；项目目录下的 `.codex/config.toml` 不能覆盖提供方、认证这类机器本地的设置，只有被信任的项目才会加载项目配置。

## 二、Grok：协议对得上，官方没有 Codex 教程

xAI 官方文本生成文档写：**Responses API 是与模型交互的首选方式**，OpenAI SDK 的用法是 `base_url="https://api.x.ai/v1"`，调用 `client.responses.create(...)`，示例模型名是 `grok-4.7`；Chat Completions 被标为旧接口（Legacy）。文档还特别说明：Responses API 默认会把对话保存在 xAI 服务器上 30 天，可以按文档说明关闭。

按 Codex 官方示例的格式，把 xAI 官方文档里的地址套进去，大致是这样（**这是按两边官方格式拼出来的示例，不是官方原文，也没有逐项验证**）：

```toml
model = "grok-4.7"
model_provider = "xai"

[model_providers.xai]
name = "xAI"
base_url = "https://api.x.ai/v1"
env_key = "XAI_API_KEY"
wire_api = "responses"
```

Grok 本身的订阅和使用见本站相关文章；需要 Grok 订阅可看 [/chongzhi/grok-super](/chongzhi/grok-super)。注意：xAI 的 API 和 Grok 订阅是两回事，API 单独计费。

## 三、DeepSeek：文档里没有 Responses

DeepSeek 官方首页文档的「第一次调用」写：API 兼容 OpenAI 和 Anthropic 格式，OpenAI 格式的地址是 `https://api.deepseek.com`，模型名有 `deepseek-flash`、`deepseek-v4-pro`，示例调用的是 `chat/completions`。「Integrate with Agent Tools」一节写，DeepSeek 可作为 Claude Code、GitHub Copilot、OpenCode 等工具的后端。**页面没有提到 Responses API，也没有 Codex。**

所以，按 Codex「只支持 responses」的要求，**官方文档并没有给出 DeepSeek 直接接 Codex 的方式**。要在 Codex 里用 DeepSeek，需要先看 DeepSeek 官方有没有新增 Responses 接口；没有的话，不建议用来路不明的转换工具，密钥会经过第三方。

## 四、Gemini：OpenAI 兼容页只写了 chat/completions

Google 官方「OpenAI compatibility」页面给出的 base_url 是 `https://generativelanguage.googleapis.com/v1beta/openai/`，示例调用的都是 `chat/completions`，没有提到 Responses。**和 DeepSeek 同理：官方文档没写，就不能说 Codex 能直接接 Gemini。** Gemini 自己的命令行工具见本站 Gemini 相关教程。

## 五、更稳妥的几种做法

- **用 Codex 官方模型**：这是 Codex 最完整的使用方式，用量规则见 [/guides/codex-usage-limits](/guides/codex-usage-limits)；
- **本地模型**：Codex 官方配置里有 Ollama 的示例，且 `ollama`、`lmstudio` 是保留的内置 ID；本站有一篇 [/guides/ollama-launch-claude-code-codex](/guides/ollama-launch-claude-code-codex) 讲本地模型启动 Codex；
- **想用 DeepSeek 写代码**：官方 Agent 指南列的工具（Claude Code、GitHub Copilot、OpenCode）有明确说明，可以直接按官方指南；
- **想了解几个工具怎么选**：见 [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex)；
- **Codex 的其他配置**：MCP 见 [/guides/codex-mcp-config](/guides/codex-mcp-config)，权限与沙箱见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)。

## 常见问题

**Q：为什么 Codex 只认 Responses？**
官方文档没有解释原因，只写明 `wire_api` 唯一支持的值是 `responses`。

**Q：配置写好了，Codex 里没出现我的模型？**
官方有 `model_catalog_url` 配置项（指向 Codex 原生的模型目录），不设置则沿用提供方默认的模型发现方式；具体行为以官方文档为准。

**Q：API Key 要放在哪里？**
用 `env_key` 指向环境变量，把密钥放在环境变量里，不要写进配置文件，更不要提交到代码仓库。

**Q：用第三方模型，Codex 的 ChatGPT 额度还会消耗吗？**
本文查到的 Codex 配置文档没有写这一点。第三方提供方按它自己的 API 规则计费，Codex 额度的计算以官方 Codex 用量文章为准。

## 参考资料

- OpenAI Codex 文档：Advanced Configuration — https://developers.openai.com/codex/config-advanced
- OpenAI Codex 文档：Configuration Reference — https://developers.openai.com/codex/config-reference
- OpenAI Codex 文档：Sample Configuration — https://developers.openai.com/codex/config-sample
- xAI 文档：Generate Text — https://docs.x.ai/docs/guides/chat
- DeepSeek API 文档：Your First API Call — https://api-docs.deepseek.com/
- Google AI 文档：OpenAI compatibility — https://ai.google.dev/gemini-api/docs/openai
