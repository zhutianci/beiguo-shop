---
title: Cursor 怎么接入第三方 API：官方支持的自带密钥服务商、哪些功能能用、怎么计费和数据去向
slug: cursor-bring-your-own-api-key-third-party
products: [cursor]
models: []
accountTier: OTHER
excerpt: Cursor 官方的自带 API Key 功能支持 OpenAI、Anthropic、Google、Azure OpenAI 和 AWS Bedrock，在 Cursor Settings 的 Models 里填密钥，只对聊天模型生效，Tab 补全不用。本文讲怎么填、怎么计费，以及官方没写的部分。
checkedOn: 2026-10-30
sources:
  - https://cursor.com/help/models-and-usage/api-keys
verify:
  - 官方页面没有写自定义 Base URL，也没有写怎么添加自定义模型名，所以本文不介绍「接任意兼容接口」的做法；想接 DeepSeek 等官方列表之外的服务商，以 Cursor 官方文档为准
  - 官方没有明确说 Agent 能不能用自带密钥，只说「自定义密钥只对聊天模型生效」，请在你的版本里实际确认
  - 团队套餐每百万 token 0.25 美元的 Cursor Token Rate 是 2026-10 官方页面写的数字，会调整，以官方页面为准
---

> 本文根据 Cursor 官方帮助中心《API keys》整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。**官方这页没有写自定义 Base URL**，所以本文只讲官方明确支持的服务商；不推荐任何第三方中转站。

## 适用于谁

- 想在 Cursor 里用自己的 OpenAI、Anthropic、Google 等 API 密钥的人；
- 想知道自带密钥后怎么计费、哪些功能能用的人；
- 想接官方列表之外的服务商，不知道行不行的人。

## 结论先说

1. **官方支持的自带密钥服务商：** OpenAI（标准、非推理的聊天模型）、Anthropic（通过 Anthropic API 的 Claude 模型）、Google（通过 Google AI API 的 Gemini 模型）、Azure OpenAI、AWS Bedrock。
2. **在哪填：** Cursor Settings → **Models**，找到对应服务商，把密钥粘贴到输入框，点 **Save**，模型就会出现在模型选择器里。
3. **能用在哪：** 官方原话大意是自定义密钥**只对聊天模型生效**；**Tab 补全仍然使用 Cursor 自带的模型**，不用你的密钥。
4. **Agent 能不能用：** 官方页面没有明确说，请在你的版本里确认。
5. **密钥无效：** 该服务商的请求会失败，更新或删除密钥即可。
6. **想接官方列表之外的服务商**（例如 DeepSeek）：官方这页没有写，见站内文章 [/guides/deepseek-cursor-setup](/guides/deepseek-cursor-setup) 和 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok) 的核对说明。

![Cursor 自带 API Key：官方说了什么](seed:g1382-byok-compare.png)
*图：本站根据 [Cursor 帮助中心：API keys](https://cursor.com/help/models-and-usage/api-keys) 整理的示意图*

## 一、怎么填密钥

1. 打开 Cursor Settings，进入 **Models**；
2. 找到服务商（OpenAI、Anthropic、Google 等）；
3. 把密钥粘进去，点 **Save**；
4. 回到聊天，在模型选择器里就能看到可用的模型。

密钥从哪里获取，要到各家平台创建，比如 OpenAI 见 [/guides/openai-api-key](/guides/openai-api-key)，Gemini 见 [/guides/gemini-api-key](/guides/gemini-api-key)。密钥相当于密码，不要发给别人，也不要写进项目里提交。

Azure OpenAI 用的是你在 Azure 里部署的模型；AWS Bedrock 可以在 IDE 里填 access key 和 secret key，也可以在 Cursor 的控制台里配置 IAM 角色。

## 二、哪些功能用你的密钥

- **聊天模型：** 用你的密钥；
- **Tab 补全：** 用 Cursor 自带模型，不用你的密钥；
- **Agent：** 官方没写，别想当然。

所以「把 Cursor 的钱省下来」并不完全成立：Tab 仍然在用 Cursor 的额度。套餐和额度的说明见 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)。

## 三、计费和数据

![用自己的 Key，钱和数据怎么算](seed:g1382-cost-decide.png)
*图：本站根据 [Cursor 帮助中心：API keys](https://cursor.com/help/models-and-usage/api-keys) 整理的示意图*

- **个人套餐：** 官方说服务商直接向你收费，这些请求不消耗套餐包含的用量或预付额度；
- **团队和企业套餐：** 模型费用仍由服务商收取，但符合条件的请求（包括用你的密钥的）要按 Cursor Token Rate 计费，官方 2026-10 的页面写的是每百万 token 0.25 美元（输入、输出、缓存都算），在 Models & Pricing 里列出的第三方模型除外；
- **团队的扣费来源：** X 订阅里从预付额度走；旧的团队套餐出现在 Spending 页签的 **Other Models** 下；额度用完且没开按需用量时，请求会停到下个计费周期；
- **隐私：** 官方说，Cursor 的零数据保留策略**不适用于你自己的密钥**，数据受你选的服务商隐私政策管；依赖零数据保留的团队，应使用 Cursor 自带模型；
- **密钥存放：** 官方说密钥不存在 Cursor 服务器上，但**每次请求都会随请求发送**（因为所有请求都经过 Cursor 服务器来构造最终提示），经加密连接传输，请求结束后不保留。

## 四、常见问题

**Q：能填 DeepSeek 的密钥吗？**
官方列表里没有 DeepSeek，页面也没写自定义 Base URL，所以官方文档无法确认。见上面第 6 点的站内文章，以核对说明为准。

**Q：为什么用了自己的 Key 还在扣 Cursor 的额度？**
Tab 补全不用你的密钥；团队套餐还会有 Cursor Token Rate。见第三节。

**Q：密钥填错了会怎样？**
该服务商的请求会失败，到 Models 里更新或删除即可。

**Q：想对比 Cursor 和其他编程工具？**
见 [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex)。

## 参考资料

- Cursor 帮助中心：API keys — https://cursor.com/help/models-and-usage/api-keys
