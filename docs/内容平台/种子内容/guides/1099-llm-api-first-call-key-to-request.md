---
title: 大模型 API 怎么用：从申请 Key 到第一次调用，OpenAI、Claude、Gemini、Grok、DeepSeek 通用入门
slug: llm-api-first-call-key-to-request
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: 大模型 API 怎么用？通用流程：在官方控制台开通账号并充值、创建 API Key、放进环境变量、装 SDK 或用 curl 发第一个请求。附 OpenAI、Claude、Gemini、Grok、DeepSeek 官方示例里的变量名、接口地址和模型名（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://developers.openai.com/api/docs/quickstart
  - https://platform.claude.com/docs/en/get-started
  - https://ai.google.dev/gemini-api/docs/latest-model
  - https://ai.google.dev/gemini-api/docs/api-key
  - https://docs.x.ai/developers/quickstart
  - https://api-docs.deepseek.com/quick_start/pricing
verify:
  - 各家的变量名、接口地址和示例模型取自当次官方快速入门页（2026-10-25），模型名会随版本更新，请以官方文档为准；示例代码的结构和参数取自官方页面，其中的提示词文字为自拟，没有在本站实际运行
  - OpenAI 官方示例：导出 OPENAI_API_KEY，官方 SDK 自动从环境读取；JavaScript 示例用 client.responses.create，模型 gpt-6-astra
  - Anthropic 官方示例：需要 Claude Console 账号和 API Key，导出 ANTHROPIC_API_KEY，向 https://api.anthropic.com/v1/messages 发请求，请求头带 x-api-key 与 anthropic-version: 2023-06-01，必须带 max_tokens，示例模型 claude-opus-5-5
  - Google 官方示例：API Key 在 Google AI Studio 创建；最新模型页给出的示例用 Interactions API（client.interactions.create），模型 gemini-4-argon（该模型只有付费层）
  - xAI 官方示例：在 console.x.ai 注册并充值后在 API Keys 页面创建 Key，导出 XAI_API_KEY，用 OpenAI SDK 时 base_url 填 https://api.x.ai/v1，走 Responses 接口，示例模型 grok-4.7
  - DeepSeek 官方定价页写明接口地址（OpenAI 格式）https://api.deepseek.com、Anthropic 格式 https://api.deepseek.com/anthropic，模型名 deepseek-flash、deepseek-v4-pro；API Key 的创建步骤见本站 463 号文章
  - 本文不涉及 API Key 的购买、转售、共享或中转，也不涉及任何绕过地区限制的方式；Key 等同于付费凭据，泄露后他人可以消耗你的余额
---

> 本文根据 OpenAI、Anthropic、Google、xAI、DeepSeek 的官方快速入门整理，资料核对于 2026-10-25。模型名和价格更新很快，**以官方文档为准**。本文不涉及购买或共享 Key，只讲官方自助开通的流程。图为本站整理的示意图。

## 适用于谁

- 搜「大模型 api 怎么用」「api key 怎么用」的人；
- 会一点编程、想第一次调用大模型接口的人；
- 想知道各家官方入门流程有什么共同点和差别的人。

## 结论先说

1. **订阅和 API 是两套东西**：ChatGPT、Claude、Gemini、Grok 的会员用来使用它们的应用；API 要在各家的开发者控制台里单独开通，按 token 计费。会员选择见 [/guides/ai-subscription-which-to-choose-four-vendors](/guides/ai-subscription-which-to-choose-four-vendors)。
2. **通用流程是五步**：开通开发者账号（多数先充值）、创建 API Key、放进环境变量、装 SDK 或直接发 HTTP 请求、发出第一个请求并核对用量。
3. **Key 不要写进代码**：几家官方示例都是先把 Key 导出为环境变量（OpenAI 是 `OPENAI_API_KEY`，Anthropic 是 `ANTHROPIC_API_KEY`，xAI 是 `XAI_API_KEY`），SDK 自动读取。
4. **模型名要用官方当前的**：下表是官方示例里用的模型，随时会更新。
5. **先小量试**：第一次调用先用最便宜的模型、很短的输入，再看价格和用量，价格见 [/guides/llm-api-price-comparison-official](/guides/llm-api-price-comparison-official)。

![从 Key 到第一次调用的 5 步](seed:g1099-api-first-call-steps.png)
*图：本站根据各家官方快速入门整理的示意图*

## 一、五家官方快速入门的关键信息

![五家官方快速入门的关键信息](seed:g1099-api-vendors-quickstart.png)
*图：本站根据各家官方开发者文档整理的示意图*

| 厂商 | 开通与 Key | 环境变量 | 接口 | 示例模型 |
| --- | --- | --- | --- | --- |
| OpenAI | 在开发者控制台创建 API Key | `OPENAI_API_KEY` | 官方 SDK，示例用 Responses 接口 | gpt-6-astra |
| Anthropic | Claude Console 账号加 API Key | `ANTHROPIC_API_KEY` | `https://api.anthropic.com/v1/messages` | claude-opus-5-5 |
| Google | 在 Google AI Studio 创建 Key | `GEMINI_API_KEY` | Interactions API | gemini-4-argon |
| xAI | console.x.ai 注册并充值，API Keys 页面创建 | `XAI_API_KEY` | `https://api.x.ai/v1`，Responses 接口 | grok-4.7 |
| DeepSeek | 开放平台创建 Key（见站内教程） | 示例里自行设置 | OpenAI 格式 `https://api.deepseek.com`，Anthropic 格式 `https://api.deepseek.com/anthropic` | deepseek-flash |

各家 Key 的详细创建步骤见站内教程：[/guides/openai-api-key](/guides/openai-api-key)、[/guides/claude-api-key-console](/guides/claude-api-key-console)、[/guides/gemini-api-key](/guides/gemini-api-key)、[/guides/grok-api-pricing-api-key](/guides/grok-api-pricing-api-key)、[/guides/deepseek-api-key](/guides/deepseek-api-key)。

## 二、第一次调用：官方示例里的写法

### OpenAI（JavaScript）

先导出变量并安装 SDK：

```bash
export OPENAI_API_KEY="your_api_key_here"
npm install openai
```

官方示例代码：

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
  model: "gpt-6-astra",
  input: "Write a one-sentence bedtime story about a unicorn.",
});

console.log(response.output_text);
```

Windows PowerShell 里官方给的导出写法是 `setx OPENAI_API_KEY "your_api_key_here"`，之后要重新打开终端才生效。Python 版见 [/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)。

### Anthropic（curl）

```bash
export ANTHROPIC_API_KEY="your-api-key-here"

curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-5-5",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Hello, Claude"}]
  }'
```

官方说明返回的是包含助手消息的 JSON，其中有 `usage` 里的输入和输出 token 数。注意 Anthropic 的请求必须带 `max_tokens`。

### Gemini（Python）

官方最新模型页的最小示例（需要已设置 `GEMINI_API_KEY`）：

```python
from google import genai
client = genai.Client()
interaction = client.interactions.create(
    model="gemini-4-argon",
    input="Write a haiku about the sea."
)
print(interaction.output_text)
```

注意 gemini-4-argon 没有免费层；想先免费试，可以换成有免费层的模型，价格与免费层见 [/guides/gemini-api-price-official](/guides/gemini-api-price-official) 和 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits)。Python 入门见 [/guides/gemini-api-python-quickstart](/guides/gemini-api-python-quickstart)。

### xAI（Python，用 OpenAI SDK）

```python
from openai import OpenAI

client = OpenAI(
    api_key="<YOUR_XAI_API_KEY_HERE>",   # 实际使用时从环境变量读取
    base_url="https://api.x.ai/v1",
)

response = client.responses.create(
    model="grok-4.7",
    input="Say hello in one sentence.",
)
print(response.output_text)
```

xAI 的 API 兼容 OpenAI SDK，只要把 `base_url` 换成官方地址。注意示例里的 Key 只是占位，不要把真实 Key 写进代码。

### DeepSeek

官方定价页写明两种兼容格式：OpenAI 格式的接口地址是 `https://api.deepseek.com`，Anthropic 格式是 `https://api.deepseek.com/anthropic`，模型名用 `deepseek-flash` 或 `deepseek-v4-pro`。所以用 OpenAI 的 SDK 时，把 `base_url` 换成 DeepSeek 的地址、`model` 换成 `deepseek-flash` 即可。充值和余额见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。

## 三、第一次调用常见的坑

| 现象 | 常见原因 |
| --- | --- |
| 401 或鉴权失败 | 环境变量没设对、终端没重开、Key 复制时多了空格 |
| 提示余额不足或需要付款 | 多数平台要先充值或开通计费；xAI 官方说要先充值才能用 API |
| 429 | 请求太快或额度用完，见 [/guides/openai-api-429-error](/guides/openai-api-429-error)、[/guides/gemini-api-429-resource-exhausted](/guides/gemini-api-429-resource-exhausted) |
| 模型不存在 | 模型名过期，或你的账号没有该模型权限；到官方模型页核对 |
| 返回被截断 | 输出上限太小；Anthropic 要显式写 `max_tokens` |

## 四、安全和成本

- **Key 等同于付费凭据**：泄露后别人可以消耗你的余额。放环境变量，不要提交到代码仓库，定期轮换；
- **只信官方渠道**：从各家官方控制台自己创建 Key；官方不授权转售，也别把 Key 交给来历不明的「中转」或共享服务；
- **设支出上限**：能设预算或上限的平台先设好；
- **先小量试**：用短输入和便宜模型，核对账单后再放大。

## 常见问题

**Q：订阅了 ChatGPT Plus 或 Claude Pro，API 能直接用吗？**
不能。订阅和 API 分开计费、分开开通，Claude 的区别见 [/guides/claude-subscription-vs-api](/guides/claude-subscription-vs-api)。需要 ChatGPT 或 Claude 会员可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 和 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：不会写代码能用 API 吗？**
可以用 Cherry Studio、Chatbox 这类客户端填入 Key，见 [/guides/deepseek-cherry-studio-chatbox](/guides/deepseek-cherry-studio-chatbox)。

**Q：想让 AI 自己调用工具、做多步任务呢？**
那是智能体，见 [/guides/ai-agent-what-is-examples](/guides/ai-agent-what-is-examples)。

## 参考资料

- OpenAI：Developer quickstart — https://developers.openai.com/api/docs/quickstart
- Anthropic：Get started with Claude — https://platform.claude.com/docs/en/get-started
- Gemini API：最新模型 — https://ai.google.dev/gemini-api/docs/latest-model
- Gemini API：API keys — https://ai.google.dev/gemini-api/docs/api-key
- xAI：Quickstart — https://docs.x.ai/developers/quickstart
- DeepSeek：模型与价格 — https://api-docs.deepseek.com/quick_start/pricing
