---
title: DeepSeek 怎么接入 Cursor：Cursor 官方自带 Key 支持哪些服务商，以及用 Cline 扩展的做法
slug: deepseek-cursor-setup
products: [cursor, ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 能接入 Cursor 吗？按 Cursor 官方「自带 API Key」文档（2026-10-24 查询），官方列出的服务商是 OpenAI、Anthropic、Google、Azure 和 AWS Bedrock，没有 DeepSeek。本文说明官方写了什么、没写什么，并给出在 Cursor 里装 Cline 扩展接 DeepSeek 的步骤和隐私注意点。
checkedOn: 2026-10-24
sources:
  - https://cursor.com/docs/settings/api-keys
  - https://cursor.com/help/models-and-usage/available-models
  - https://docs.cline.bot/getting-started/installing-cline
  - https://docs.cline.bot/provider-config/deepseek
  - https://api-docs.deepseek.com/zh-cn/quick_start
verify:
  - Cursor 官方「自带 API Key」页面（2026-10-24）列出的服务商只有 OpenAI、Anthropic、Google、Azure OpenAI、AWS Bedrock，没有 DeepSeek；页面也没有写「自定义 Base URL」之类的入口。本文据此只说「官方文档没有写 DeepSeek 的接入方法」，不断言 Cursor 一定无法实现，也不提供未经官方文档支持的设置方式
  - Cursor 自带 Key 的规则（个人套餐不占用内含额度、Zero Data Retention 不适用、Key 随每次请求发送到 Cursor 后端但不保存）取自该页面；这些规则针对列出的服务商，是否同样适用于其他方式，本文不推断
  - Cline 官方安装文档写明 IDE 扩展支持 VS Code、Cursor、JetBrains、Windsurf、VSCodium、Antigravity；Cline 官方有 DeepSeek 提供商页面。本文没有实际在 Cursor 里安装测试
  - Cline 的 DeepSeek 模型下拉菜单里有哪些模型名由 Cline 版本决定，本文不列
---

> 本文根据 Cursor 官方文档、Cline 官方文档和 DeepSeek 官方文档整理，资料核对于 2026-10-24。各软件版本更新很快，界面名称以实际为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek怎么接入cursor」的人；
- 想在 Cursor 里用便宜的模型做补充、不想只依赖 Cursor 内置额度的开发者；
- 在 Cursor 设置里找不到 DeepSeek 选项，不知道是不是自己没找对的人。

## 结论先说

1. **Cursor 官方文档没有写 DeepSeek 的接入方法**。「自带 API Key」页面列出的服务商只有 OpenAI、Anthropic、Google、Azure OpenAI 和 AWS Bedrock，没有 DeepSeek，所以你在 Cursor 设置里找不到专门的 DeepSeek 选项，并不是你操作有误。
2. **DeepSeek 官方文档里也没有 Cursor 的接入页面**：官方「接入 Agent 工具」栏目列出的是 Claude Code、Codex、OpenCode、OpenClaw、Hermes、Reasonix、WorkBuddy、Qoder。
3. **一条有官方文档支撑的路径**：Cline 官方文档说它的 IDE 扩展支持 VS Code、Cursor 等编辑器，并且有专门的 DeepSeek 提供商配置页。也就是说，可以在 Cursor 里安装 Cline 扩展，让 Cline 去调用 DeepSeek。这不是 Cursor 自己在用 DeepSeek，而是另一个扩展在用。
4. **想要 Cursor 本身的体验**（Tab 补全、内置 Agent），官方说自带 Key 只对聊天模型生效，Tab 补全仍用 Cursor 自己的模型。

![Cursor 官方「自带 Key」支持的服务商](seed:g1011-cursor-byok-providers.png)
*图：本站根据 [Cursor 官方「Bring your own API key」文档](https://cursor.com/docs/settings/api-keys) 整理的示意图*

## 一、Cursor 官方「自带 Key」怎么写的

官方步骤是：打开 Cursor Settings → Models，找到想用的服务商，把 API Key 粘贴到文本框，点 Save；之后该服务商的模型会出现在模型选择器里。如果 Key 无效或被服务商拒绝，使用该服务商的请求会失败，直到你更新或删除这个 Key。

官方还写了几条重要规则，用自己的 Key 之前最好知道：

- **费用**：个人套餐下，服务商直接按模型成本向你收费，这些请求**不占用** Cursor 的内含额度或预付额度；团队和企业套餐则另有规则；
- **隐私**：Cursor 的 Zero Data Retention（零数据留存）策略**不适用于**你自己的 Key，你的数据处理遵循所选服务商的隐私政策；
- **Key 的去向**：官方说 Key 不存储在 Cursor 服务器上，但每次请求都会发送到 Cursor 的后端，因为所有请求都要经过 Cursor 服务器做最终提示词构建，传输加密，请求结束后不保留；
- **范围**：自带 Key 只对聊天模型生效，Tab 补全继续使用 Cursor 内置模型。

Cursor 套餐与用量的整体说明见 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)，模型选择见 [/guides/cursor-model-selection-auto](/guides/cursor-model-selection-auto)。

## 二、在 Cursor 里装 Cline 接 DeepSeek

![在 Cursor 里用 Cline 接 DeepSeek](seed:g1011-cursor-cline-steps.png)
*图：本站根据 [Cline 官方安装文档](https://docs.cline.bot/getting-started/installing-cline) 与 [DeepSeek 提供商页](https://docs.cline.bot/provider-config/deepseek) 整理的示意图*

### 第 1 步：安装 Cline 扩展

Cline 官方文档的 IDE 扩展安装方法：按 `Ctrl/Cmd + Shift + X` 打开扩展面板，搜索 `Cline`，点安装。官方说这个扩展适用于 VS Code、Cursor、Windsurf、VSCodium、Antigravity，JetBrains 另有安装方式。

### 第 2 步：创建 DeepSeek API Key

去 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 注册、创建 Key，并确保账户有余额。Cline 官方提醒：创建后要**立即复制** Key，之后看不到完整内容，要妥善保存。步骤详解见 [/guides/deepseek-api-key](/guides/deepseek-api-key)，充值见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。

### 第 3 步：在 Cline 里选择 DeepSeek

Cline 官方的 DeepSeek 配置步骤：

1. 点 Cline 面板里的齿轮图标，打开设置；
2. 在「API Provider」下拉菜单里选「DeepSeek」；
3. 把 Key 粘贴到「DeepSeek API Key」字段；
4. 在「Model」下拉里选你要用的模型。

Cline 的「Plan / Act」等工作方式见 [/guides/cline-setup-api-plan-act](/guides/cline-setup-api-plan-act)。如果下拉里没有你想要的模型名，可以改用 Cline 的「OpenAI Compatible」提供商：按 Cline 官方文档，那里需要填 Base URL、API Key 和模型 ID。DeepSeek 官方给的 OpenAI 格式 Base URL 是 `https://api.deepseek.com`，模型名是 `deepseek-flash` 或 `deepseek-v4-pro`（见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)）。这是把两份官方文档的参数对起来的做法，本文没有测试。

## 三、使用时的注意

- **扩展有执行权限**：Cline 这类 Agent 扩展可以读写文件、运行命令，先在测试项目里试，权限设置的思路见 [/guides/ai-coding-security-secrets-permissions](/guides/ai-coding-security-secrets-permissions)；
- **代码会发给 DeepSeek**：你的代码片段会随请求发送到 DeepSeek 的服务，涉密项目请先看官方隐私政策再决定；
- **按 token 计费**：Agent 工具容易一次带很多上下文，费用比聊天高，注意看用量，价格见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)；
- **别重复装多个类似扩展**：同时开多个 AI 扩展可能抢快捷键、抢补全。

## 常见问题

**Q：Cursor 里能用 DeepSeek 模型的 Tab 补全吗？**
官方说自带 Key 对 Tab 补全不生效，Tab 用 Cursor 内置模型。

**Q：Cursor 本身需要付费吗？**
Cursor 的套餐与用量规则以 Cursor 官网为准，见 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)。

**Q：想换成官方明确支持的方案？**
DeepSeek 官方明确写了教程的是 Claude Code、Codex、OpenCode 等，见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup)、[/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。想比较这几类工具，看 [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex)。

**Q：连接失败、一直转圈怎么办？**
先看 API 报错码，见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)；Cursor 自己的连接问题见 [/guides/cursor-common-errors-connection-failed](/guides/cursor-common-errors-connection-failed)。

## 参考资料

- Cursor 文档：Bring your own API key — https://cursor.com/docs/settings/api-keys
- Cursor：Available models — https://cursor.com/help/models-and-usage/available-models
- Cline 文档：Installing Cline — https://docs.cline.bot/getting-started/installing-cline
- Cline 文档：DeepSeek — https://docs.cline.bot/provider-config/deepseek
- Cline 文档：OpenAI Compatible — https://docs.cline.bot/provider-config/openai-compatible
- DeepSeek API 文档：接入 Agent 工具（各工具）— https://api-docs.deepseek.com/zh-cn/
