---
title: DeepSeek 接入 Cherry Studio 和 Chatbox：API Key 填写、模型列表与连通检测步骤
slug: deepseek-cherry-studio-chatbox
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: 怎么在 Cherry Studio、Chatbox 这类桌面客户端里用 DeepSeek？按两款软件官方文档（2026-10-24 查询）整理 API Key、API 地址、获取模型列表和检测连通的步骤，并对照 DeepSeek 官方说明提醒旧模型名与余额问题。
checkedOn: 2026-10-24
sources:
  - https://docs.cherry-ai.com/pre-basic/providers/deepseek
  - https://docs.cherry-ai.com/pre-basic/providers/providers
  - https://chatboxai.app/en/guide/byok/deepseek
  - https://chatboxai.app/en/guide/byok
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/updates
verify:
  - 步骤取自 Cherry Studio 与 Chatbox 官方文档（2026-10-24），未实际安装测试；两款软件界面会随版本变化
  - Cherry Studio 官方 DeepSeek 页面的「推荐用法」表仍写 deepseek-chat、deepseek-reasoner；DeepSeek 官方 2026-04-24 的更新说明称这两个旧名将于 2026-07-24 停用，价格页现在只列 deepseek-flash 与 deepseek-v4-pro。本文以 DeepSeek 官方为准，并提醒以软件里「获取模型列表」返回的 ID 为准
  - Chatbox 官方说其 Chatbox AI 授权不是 DeepSeek 的 API Key；Chatbox 官方文档没有列出具体 DeepSeek 模型名，也没有写上下文限制数字，本文都不列
  - Cherry Studio 文档提到的「原生联网」图标与搜索设置本文没有展开，也未验证 DeepSeek 新模型是否带该标记
---

> 本文根据 Cherry Studio、Chatbox 官方文档和 DeepSeek 官方文档整理，资料核对于 2026-10-24。软件更新很快，按钮名称以你看到的为准。图为本站整理的示意图。

## 适用于谁

- 搜「cherry studio deepseek」「chatbox deepseek」「deepseek 客户端」的人；
- 嫌网页版「服务器繁忙」，想用自己的 API Key 在本地客户端里对话的人；
- 想在一个客户端里同时管理多个模型服务商的人。

## 结论先说

1. **两款软件都支持「自带 Key」**：你在 DeepSeek 开放平台创建 API Key，填进客户端，请求直接发给 DeepSeek，按 token 计费，见 [/guides/deepseek-api-key](/guides/deepseek-api-key)。
2. **客户端不是 DeepSeek 官方产品**，Cherry Studio 和 Chatbox 各有各的界面、订阅或授权，它们的授权**不是** DeepSeek 的 API Key（Chatbox 官方在故障排查里专门写了这点）。
3. **Cherry Studio**：设置 → 模型服务 → deepseek，填 API 密钥，API 地址默认是 `https://api.deepseek.com`，点「获取模型列表」，再点「检测」。
4. **Chatbox**：左下角设置 → Model Provider → DeepSeek，粘贴 API Key，点 Check，成功即可用。
5. **模型名**：以软件里「获取模型列表」返回的为准；DeepSeek 官方现用 `deepseek-flash` 和 `deepseek-v4-pro`。

## 一、先准备 API Key 和余额

1. 到 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 注册并创建 Key，创建后马上复制保存；
2. 先充值少量余额，没有余额调用会返回 402，充值步骤见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)；
3. Key 是密码，不要截图发给别人，也不要贴到公开聊天里。

## 二、Cherry Studio 怎么配

![Cherry 接 DeepSeek 的 5 步](seed:g1013-cherry-studio-deepseek-steps.png)
*图：本站根据 [Cherry Studio 官方 DeepSeek 页面](https://docs.cherry-ai.com/pre-basic/providers/deepseek) 整理的示意图*

Cherry Studio 官方文档的步骤：

1. 打开「设置 → 模型服务」，找到 **deepseek** 服务商，进入详情页；
2. 在「API 密钥」填入 `sk-...`；
3. 「API 地址」默认就是 `https://api.deepseek.com`，无需修改；
4. 点击「获取模型列表」。

官方通用说明（服务商设置页）里还有这些细节：

- **多个 Key 轮询**：一个服务商可以配置多个密钥，按列表从前到后循环使用。可以「快速添加」（多个 Key 用英文逗号隔开），也可以点密钥输入框右侧的钥匙图标进入「API 密钥管理」，每个 Key 是独立条目，可编辑标签、启用或禁用、复制、删除；
- **添加模型**：点「获取模型列表」拉取该服务商支持的模型，在弹出的「模型管理」里点模型右侧的 `+` 加入你的列表，**只有加入列表的模型才会出现在各处的模型选择器里**；
- **核对模型 ID**：模型名称下方会显示服务商返回的实际 API 模型 ID，相近名称的模型不会被合并，选之前先核对这行 ID；
- **连通性检查**：点「检测」，选一个模型测试；配置了多个 Key 时可以选用哪个 Key 检测。失败就检查模型列表里是否有填错或不受支持的模型；
- **API 地址的特殊写法**：如果服务商的请求路径不是常规的 `/v1/chat/completions`，可以在地址栏填完整地址并以 `#` 结尾，以 `#` 结尾时不再自动拼接版本路径。DeepSeek 用默认地址即可，用不到这条。

**关于「推荐用法」**：Cherry Studio 官方 DeepSeek 页面的表里，写的是 `deepseek-chat`（通用对话）和 `deepseek-reasoner`（数学、代码、复杂推理，输出会带思考块）。这两个是旧模型名，DeepSeek 官方 2026-04-24 的说明是它们将于 2026-07-24 停止使用（过渡期内分别指向 deepseek-v4-flash 的非思考与思考模式），价格页现在只列 `deepseek-flash` 与 `deepseek-v4-pro`。所以别照抄旧表，先点「获取模型列表」看返回了什么，思考模式的开关见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)。

## 三、Chatbox 怎么配

Chatbox 官方「DeepSeek Setup」页面的步骤：

1. 打开 Chatbox，点左下角的 **Settings（设置）**；手机端要先点左上角菜单展开侧边栏，再进设置；
2. 左侧选 **Model Provider（模型服务商）**，找到 **DeepSeek**；
3. 把 DeepSeek API Key 粘贴到 **API Key** 字段；
4. 点 **Check（检查）**，连接测试成功就说明配置好了；
5. 在模型选择器里选一个可用的模型开始对话。

官方说明：上下文长度限制和推理选项取决于所选模型和你的 Chatbox 版本；设置自定义限制前，请查 DeepSeek 当前的模型文档，数字见 [/guides/deepseek-context-length-output-limit](/guides/deepseek-context-length-output-limit)。配置好后，也可以在 Chatbox 的 Work Mode 里使用，包括 AI Agent、代码执行、MCP 服务器、技能、知识库和全局记忆。

Chatbox 官方的故障排查原话大意：如果认证失败，请在 DeepSeek API 平台重新创建 Key；**Chatbox AI 的授权不是 DeepSeek 的 API Key**；额度类错误请检查 API 余额；模型不可用时，刷新模型列表。

![配置后出问题，对照这张表](seed:g1013-chatbox-cherry-decide.png)
*图：本站根据 Chatbox、Cherry Studio 与 DeepSeek 官方文档整理的示意图*

## 四、费用与隐私

- **费用**：DeepSeek 按 token 收费，价格和高峰、空闲时段的区别见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。客户端开了「联网搜索」或「知识库」会让每次请求带更多内容，用量会上升；
- **隐私**：Chatbox 官方说 BYOK 模式下数据直接发到 AI 服务商而不经过中间服务器；但你的内容仍会发送到 DeepSeek，处理方式以 DeepSeek 官方隐私政策为准；
- **Key 安全**：客户端会把 Key 存在本机，换电脑、给别人用之前先删掉或在平台上回收旧 Key。

## 常见问题

**Q：网页版 DeepSeek 和用 API Key 的客户端有什么区别？**
网页版是官方产品，免费使用，见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)；客户端走 API，按 token 计费，要自己管理余额和费用；网页端的「服务器繁忙」提示和 API 的 429 / 503 不是一回事，见 [/guides/deepseek-server-busy](/guides/deepseek-server-busy)。

**Q：返回报错怎么看？**
401、402、429 的含义见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

**Q：想在编辑器里用 DeepSeek 写代码？**
见 [/guides/deepseek-vscode-continue-cline](/guides/deepseek-vscode-continue-cline) 和 [/guides/deepseek-cursor-setup](/guides/deepseek-cursor-setup)。

**Q：这些客户端能同时接 ChatGPT 或 Claude 吗？**
两款软件的官方文档都列有 OpenAI、Anthropic 等服务商，需要对应官方账号或 API Key。如果你需要 ChatGPT 或 Claude 会员，可参考 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)、[/chongzhi/claude-pro](/chongzhi/claude-pro)；会员和 API 是两套计费，别混淆，见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)。

## 参考资料

- Cherry Studio 文档：DeepSeek — https://docs.cherry-ai.com/pre-basic/providers/deepseek
- Cherry Studio 文档：模型服务设置 — https://docs.cherry-ai.com/pre-basic/providers/providers
- Chatbox 用户指南：DeepSeek Setup — https://chatboxai.app/en/guide/byok/deepseek
- Chatbox 用户指南：Bring Your Own Key — https://chatboxai.app/en/guide/byok
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
