---
title: Grok 怎么接入 Codex 和 Cursor：自定义模型提供方配置，以及订阅里自带的 Cursor
slug: grok-codex-cursor-setup
products: [codex, grok]
models: []
accountTier: OTHER
excerpt: Grok 能接入 Codex 吗？能：xAI API 兼容 Responses 接口，在 Codex 的 config.toml 里自定义模型提供方即可；Cursor 则是 Grok 订阅自带的，Plus 起包含 Grok 模型（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://developers.openai.com/codex/config-advanced
  - https://developers.openai.com/codex/config-reference
  - https://docs.x.ai/developers/quickstart
  - https://docs.x.ai/developers/pricing
  - https://docs.x.ai/x-subscription/overview
  - https://cursor.com/docs/models-and-pricing
verify:
  - Codex 官方没有专门写「接入 Grok」的页面，xAI 官方也没有写「接入 Codex」的页面；本文的配置是把 Codex 官方「自定义模型提供方」字段和 xAI 官方 API 文档的地址、模型名、Responses 接口拼在一起，没有在本站逐项运行验证，实际能否正常使用请以你机器上 Codex 的版本和输出为准
  - Codex 官方写：自定义提供方 id 不能用内置的 openai、ollama、lmstudio；项目级 .codex/config.toml 不能覆盖 model_provider、model_providers，只能写在用户级 ~/.codex/config.toml；env_key 是官方推荐的读密钥方式，experimental_bearer_token 标为不推荐
  - Codex 官方 config-reference 里 wire_api 的取值只有 responses；xAI 官方说明 grok-4.7 在 Responses API 上可用，且在 Responses API 上总会返回 reasoning.encrypted_content
  - xAI 价格取自 docs.x.ai/developers/pricing（2026-10-25），API 用量按标准价单独计费、不占订阅用量池，这是 x.ai/pricing 的 FAQ 里写的
  - Cursor 的计划与模型说明取自 cursor.com/docs/models-and-pricing 与 docs.x.ai 的 X Subscription 文档；Plus 档 Cursor 里 Grok 模型用固定设置（Fast 关、effort medium、Grok 4.7 用 256k 上下文），第三方模型从 Premium 起可用，这些细节官方会更新
  - Grok Build 是 xAI 自家命令行，官方文档写它支持自定义（BYOK）模型，本文只作为选项提到，不展开
---

> 本文把 Codex 官方的配置文档、xAI 官方 API 文档和 Cursor 官方文档拼在一起整理，资料核对于 2026-10-25。官方没有专门的「Grok 接入 Codex」页面，**配置字段以 Codex 官方文档为准，本站没有逐项运行验证**。价格为「2026-10 查询」。图为本站整理的示意图。

## 适用于谁

- 搜「grok怎么接入codex」「grok cursor」的人；
- 想在 Codex 里换成 Grok 模型的开发者；
- 已经订阅 Grok、想知道 Cursor 是不是一起送的人。

## 结论先说

1. **Codex 可以接 Grok，走 xAI API Key**。Codex 官方支持「自定义模型提供方」：在 `config.toml` 里写一个提供方，指定 `base_url`、读密钥的环境变量 `env_key`，以及通信协议 `wire_api`。xAI 官方的接口地址是 `https://api.x.ai/v1`，主力模型 `grok-4.7` 支持 Responses 接口，所以字段可以对上。
2. **这条路按 API 计费**。xAI 定价页的 FAQ 说，API 用量按标准价另行计费，不占订阅的周用量池。API Key 怎么拿、价格多少，见 [/guides/grok-api-pricing-api-key](/guides/grok-api-pricing-api-key)。
3. **Cursor 是 Grok 订阅自带的**。官方说，新的合并订阅 The X Subscription 把 Grok、Cursor、X 放在一起，Plus 起就包含 Cursor，Cursor 里的 Grok 模型（Grok 4.7、4.6、4.5 和 Composer 2.5）从订阅的共享周用量池里扣。订阅价格和档位见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)，要开通可看 [/chongzhi/grok-super](/chongzhi/grok-super)。
4. **要在 Cursor 里用 Claude、GPT 这类第三方模型**：官方说不包含在订阅里，Premium 起可以按 API 标价用，从预付余额里扣。

![Grok 用在 Codex 还是 Cursor 怎么选](seed:g1034-grok-codex-cursor-decide.png)
*图：本站根据 [docs.x.ai 订阅文档](https://docs.x.ai/x-subscription/overview) 与 [Cursor 官方文档](https://cursor.com/docs/models-and-pricing) 整理的示意图*

## 一、Codex 接入 Grok

![Codex 接入 Grok 的 4 步](seed:g1034-grok-codex-config-steps.png)
*图：本站根据 [Codex 配置文档](https://developers.openai.com/codex/config-advanced) 与 [xAI Quickstart](https://docs.x.ai/developers/quickstart) 整理的示意图*

### 1. 先拿 xAI API Key

在 console.x.ai 注册、充值，到 API Keys 页面创建，再把它放进环境变量（官方示例的名字是 `XAI_API_KEY`）。注意官方写明 API 充值不可退款。

### 2. 修改用户级 config.toml

Codex 官方文档的要求：

- 自定义提供方不能占用内置的 id（`openai`、`ollama`、`lmstudio`），自己起个名字，比如 `xai`；
- 提供方设置要写在**用户级**的 `~/.codex/config.toml`，项目里的 `.codex/config.toml` 不能覆盖 `model_provider` 和 `model_providers`；
- 读密钥推荐用 `env_key`，直接写令牌的 `experimental_bearer_token` 官方标为不推荐。

按这些字段，配置大致是这样（模型名与地址来自 xAI 官方文档，写法来自 Codex 官方示例）：

```toml
model = "grok-4.7"
model_provider = "xai"

[model_providers.xai]
name = "xAI"
base_url = "https://api.x.ai/v1"
env_key = "XAI_API_KEY"
wire_api = "responses"
```

字段含义：

| 字段 | 作用 |
| --- | --- |
| `model` | 要用的模型名，xAI 官方文档写的是 `grok-4.7` |
| `model_provider` | 使用哪个提供方，对应 `[model_providers.<id>]` 的 id |
| `base_url` | xAI API 地址 `https://api.x.ai/v1` |
| `env_key` | 存放 API Key 的环境变量名 |
| `wire_api` | 通信协议，Codex 官方参考里的取值是 `responses` |

### 3. 启动并核对

重新启动 Codex，看模型显示是不是 `grok-4.7`，再发一条简单消息确认能正常回复。如果报鉴权错误，先确认环境变量在启动 Codex 的那个终端里确实存在；报模型找不到，核对模型名拼写与你账号可用的模型（控制台的 Models 页面能看）。

### 几个提醒

- **别把 Key 写进仓库**：用 `env_key` 读环境变量就是为了这个；
- **模型能力以官方为准**：官方说 grok-4.7 上下文 500k，推理强度可配置（low、medium、high、xhigh），具体在 Codex 里怎么选，取决于 Codex 当前版本对自定义提供方的支持，字段可能随版本变化；
- **费用**：grok-4.7 每百万 tokens 输入 2 美元、缓存输入 0.5 美元、输出 6 美元，提示词达到 200k 以上整条请求按 4 / 1 / 12 美元计（2026-10 查询）；
- **想用 Codex 官方模型**：需要 ChatGPT 套餐，见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。DeepSeek 接入 Codex 的写法见 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)，两篇思路相同，只是地址和密钥不同。

## 二、Cursor：订阅里自带，也可以单独看用量

官方 X Subscription 文档的要点：

- Grok 和 Cursor 共享一个每周的包含用量池，用 Cursor 自家模型（含 Grok）的用量从这里扣；
- 第三方模型（Claude、GPT 等）不在池里，按 API 标价从预付余额扣；
- 订阅是在 grok.com/dashboard 统一管理；
- Cursor 官方文档给的 Plus 说明：Agent 用 Cursor 自家模型，设置固定（Fast 关闭、effort 为 medium、Grok 4.7 用 256k 上下文），不含 Auto、云端智能体、Bugbot 和第三方模型，也不能用自己的 API Key；Premium 起加上云端智能体、第三方模型等。

所以想在 Cursor 里用 Grok：不需要额外申请接入，订阅后用同一个账号登录即可；想要更多用量，就是升档或买额外额度，见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)。

## 三、怎么选

| 你的情况 | 选择 |
| --- | --- |
| 已经习惯 Codex，只想换模型 | Codex + xAI API Key，按 API 单价计费 |
| 想直接用 Grok 的编程模型，不想折腾配置 | Cursor，订阅自带 |
| 想用 xAI 自家的命令行 | Grok Build，官方文档里写了安装与自定义模型的方法 |
| 想对比 Codex、Claude Code、Cursor 和 Gemini 一侧的工具 | 见 [/guides/ai-coding-tools-codex-claude-code-cursor-gemini](/guides/ai-coding-tools-codex-claude-code-cursor-gemini) |

## 常见问题

**Q：Grok 订阅能不能直接当 Codex 的额度用？**
官方没有这样的说明。订阅的用量池只覆盖官方自家产品（Grok、Cursor）里的 Grok 模型；API 另行计费，Codex 走的是 API。

**Q：接口要用 chat completions 还是 responses？**
xAI 官方示例用的是 Responses 接口，Codex 官方参考里 wire_api 只列了 `responses`，所以按 responses 配。

**Q：为什么 Cursor 里看不到我要的模型？**
Plus 档只有 Cursor 自家模型，第三方模型从 Premium 起，以官方文档当前说明为准。

## 参考资料

- OpenAI：Codex 高级配置 — https://developers.openai.com/codex/config-advanced
- OpenAI：Codex 配置参考 — https://developers.openai.com/codex/config-reference
- docs.x.ai：Quickstart — https://docs.x.ai/developers/quickstart
- docs.x.ai：Pricing — https://docs.x.ai/developers/pricing
- docs.x.ai：What is The X Subscription? — https://docs.x.ai/x-subscription/overview
- Cursor：Models & Pricing — https://cursor.com/docs/models-and-pricing
