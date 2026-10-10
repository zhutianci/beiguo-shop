---
title: Google AI Studio 怎么用：界面入口、选模型、发第一条提示与获取代码（入门）
slug: google-ai-studio-how-to
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: Google AI Studio 是 Google 给开发者试用 Gemini 模型的网页工具。本文讲清它和 Gemini 应用的区别、Playground 与 Build 入口、发第一条提示、运行设置、获取代码，以及免费边界和可用地区。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/ai-studio-quickstart
  - https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/
  - https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
  - https://ai.google.dev/gemini-api/docs/available-regions
  - https://ai.google.dev/gemini-api/docs/google-ai-plans
  - https://ai.google.dev/gemini-api/docs/billing
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/terms
  - https://ai.google.dev/gemini-api/docs/aistudio-build-mode
  - https://ai.google.dev/gemini-api/docs/aistudio-agents
  - https://ai.google.dev/gemini-api/docs/workspace
  - https://ai.google.dev/gemini-api/docs/models
verify:
  - AI Studio 界面语言能否切换成中文：2026-10-10 的官方文档（快速入门、排错页）没有任何关于界面语言设置的说明，正文按「官方未说明」处理，需站长在实际界面确认
  - 对话保存位置与历史入口：官方快速入门只写「可以保存提示以便稍后继续或分享」，2025-10 官方博客配图的左侧栏有 History（历史）入口；是否自动保存、保存在哪里官方文档未写，以实际界面为准
  - 两张截图来自 2025-10-18 的官方博客，模型列表和侧栏布局可能已变化（当时显示 Gemini 2.5 系列）
  - 官方快速入门的示例回复仍标注 gemini-2.5-pro；当前推荐模型以 Models 页为准
---

> 本文根据 Google AI for Developers 官方文档（Google AI Studio quickstart、Troubleshoot Google AI Studio、Available regions、Billing、Terms）和 Google 官方博客整理，资料核对于 2026-10-10。截图引用自 2025 年 10 月的官方博客，属于早期界面，图下注明出处。

## 适用于谁

- 听说 Google AI Studio 可以免费试 Gemini 模型，但打开后不知道从哪下手的人；
- 想先在网页里把提示词调好，再搬到代码里调用 Gemini API 的开发者；
- 分不清 Google AI Studio 和 Gemini 应用（gemini.google.com）有什么区别的人。

## 结论先说

1. **Google AI Studio 是面向开发者的试验台**：官方的定位是「快速试用模型、试验不同提示词」，调好之后点「获取代码（Get code）」就能换成 Gemini API 的调用代码。它不是日常聊天用的 Gemini 应用。
2. **主要入口有三个**：Playground（和各类模型对话、生成媒体）、Build（用自然语言做应用）、Dashboard（API 密钥、用量、限额、账单）。
3. **所有参数都在右上角的「运行设置（Run settings）」面板里**：系统指令、模型参数、安全设置，以及结构化输出、函数调用、代码执行、联网搜索等工具开关。
4. **在可用地区内，AI Studio 本身免费使用**；但免费使用时提交的内容会被 Google 用于改进产品，不要输入敏感或保密信息。
5. **需要年满 18 岁，并且所在地区在官方可用地区列表里**，否则会看到无法访问的提示。

## 一、Google AI Studio 是什么，和 Gemini 应用有什么不同

| | Google AI Studio | Gemini 应用 |
| --- | --- | --- |
| 网址 | aistudio.google.com | gemini.google.com |
| 面向 | 开发者：试模型、调提示词、拿代码、管理 API 密钥 | 普通用户：日常对话助手 |
| 能调的东西 | 模型、系统指令、温度等参数、工具开关 | 以产品功能为主 |
| 下一步 | 「获取代码」后用 Gemini API 接进自己的程序 | 没有这一步 |

官方服务条款写明：Google AI Studio 和 Gemini API 是给开发者用于专业或业务用途的，不是面向消费者的产品。

## 二、打开之后先认界面

用 Google 账号登录 aistudio.google.com。官方说明所有 Google Workspace 账号默认也能用，如果提示「没有访问权限，请联系组织管理员」，说明管理员把它关掉了。

![Google AI Studio 首页：左侧是 Studio（Chat、Stream、Generate media、Build、History）和 Dashboard 导航，中间三张卡片对应 Playground、Build 和 Dashboard（2025 年 10 月的早期界面）](seed:g445-ai-studio-home.jpg)
*图片来源：[Google 官方博客《Leveling up your developer experience in Google AI Studio》](https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/)*

按官方文档和博客的说法，几个区域分别是：

- **Playground**：默认打开的就是它，里面是一个新的聊天提示（Chat prompt）。官方中文文档把 Playground 译作「游乐场」，本文保留英文。官方博客介绍，Playground 是一个统一的界面，Gemini 文本模型、图片和视频生成、语音合成（TTS）和 Live 实时模型都在这里，不用来回切换页面。
- **Build**：用一句话描述你想做的应用，由它生成代码并在右侧实时预览（官方叫 vibe coding）。
- **Dashboard**：管理 API 密钥和项目，查看用量（Usage）、速率限制（Rate Limit）、账单（Billing）等。
- Playground 里还可以把开关切到 **Agents**，用现成模板试「托管智能体」。这属于进阶功能，而且官方说明使用智能体需要已开通付费的 API 密钥。

## 三、发第一条提示

![Playground 新建对话时的模型选择：顶部按 Featured、Gemini、Images、Audio、Video 分类（2025 年 10 月的早期界面，模型名称已更新）](seed:g445-ai-studio-playground.jpg)
*图片来源：[Google 官方博客《Leveling up your developer experience in Google AI Studio》](https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/)*

1. 打开 Playground，选一个模型。按 2026-10-10 的官方 Models 页，文本模型里最新的稳定版是 Gemini 3.8 Flash，更轻量的是 Gemini 3.5 Flash-Lite，Gemini 3.1 Pro 仍是预览版。各模型能不能免费用，见本站《Gemini API 免费额度是多少：免费层级、RPM / TPM / RPD 速率限制与限额查询》。
2. 在底部输入框（官方文档里的占位文字是 Type something...）写下问题，可以直接用中文。
3. 点「运行（Run）」，等模型回复。
4. 想让它一直按某种身份或格式回答，点右上角「运行设置（Run settings）」展开面板，在「系统指令（System Instructions）」里写要求。写法见本站《Google AI Studio 系统指令怎么写：System instructions 与运行设置（思考等级、温度、联网搜索）》。

官方提醒：对话里每一轮的内容都会算进下一次请求，聊得越长，占用的 token 越多，最终可能撞上模型的 token 上限。排错页说明，打开一个提示后，底部的 **Text Preview** 按钮会显示当前已用的 token 数和该模型的上限。

## 四、保存对话与历史记录

- 官方快速入门的说法是：提示调到满意后，可以**保存提示**，以便之后继续修改或分享给别人。
- 2025 年 10 月的官方博客配图里，左侧栏 Studio 分组下有「历史（History）」入口；同一篇博客还提到新首页可以帮你快速回到之前的项目。
- 是否自动保存、保存到哪里，当前官方文档没有写明，以你界面上实际看到的选项为准。重要的提示词和结果，建议自己另存一份。

## 五、获取代码：从网页搬到程序里

调好之后点「获取代码（Get code）」，选择编程语言，AI Studio 会给出等价的 Gemini API 调用代码，把模型、系统指令和参数都带上。接下来要做两件事：

1. 创建 API 密钥，见本站《Gemini API Key 怎么获取：在 AI Studio 创建密钥、设置环境变量与安全限制》；
2. 安装官方 SDK 并运行，见本站《Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片》。

## 六、免费用到什么程度

- 官方定价页的说明：**在所有可用地区，Google AI Studio 的使用是免费的**。
- 账单页补充：如果你在 AI Studio 里关联了已开通付费的 API 密钥来使用付费功能，这部分用量会按该密钥计费；可以在付费项目和免费项目的密钥之间切换。
- Google AI Pro / Ultra 订阅用户在 AI Studio 里有更高的每日配额和更多模型可用，但官方写明这项权益**只在 AI Studio 网页内有效**，用 API 密钥直接调用 Gemini API 是另外计费的。
- 数据使用：按服务条款，免费使用（包括直接在 AI Studio 里对话）时，Google 会用你提交的内容和生成的回复来改进产品，人工审核员可能会读到。官方原话是不要向免费服务提交敏感、保密或个人信息。

## 常见问题

**Q：Google AI Studio 怎么设置中文界面？**
截至 2026-10-10，官方文档里没有关于界面语言设置的说明。可以确定的是：提示词和回复可以用中文，官方开发者文档站（ai.google.dev）有简体中文版页面，里面把 Run settings 译作「运行设置」、System Instructions 译作「系统指令」、Get code 译作「获取代码」。AI Studio 界面本身能否切换语言，以你看到的设置项为准。

**Q：打开就提示无法访问，或者出现 403 Access Restricted？**
官方给出的原因有三类：所在地区不在可用地区列表里；未满 18 岁；Google 账号还没完成年龄验证。可用地区以官方 Available regions 页面为准，该页面目前没有列出中国大陆。请遵守所在地法律和服务条款。

**Q：回复显示 No Content 是怎么回事？**
排错页说明，内容因为任何原因被拦截时会显示 No Content。把鼠标悬停在上面点 **Safety** 可以看详情。如果是安全设置拦的，可以在运行设置里调整；如果不是，可能是请求或回复违反了服务条款或暂不支持。

**Q：AI Studio 里做的应用能发布吗？**
可以。Build 模式支持分享给别人使用，也支持部署到 Cloud Run 或同步到 GitHub。官方提醒：别人使用你分享的应用时，API 调用算在你的用量里，用到付费模型可能产生费用。

**Q：它和 Gemini 应用的会员是一回事吗？**
不是一回事。Gemini 应用的功能用法见本站《Gemini 使用技巧：Gems 改为 Skills、Deep Research 与上传文件怎么用》。Google AI 订阅在 AI Studio 里只提高网页内的配额，不包含 API 用量。

## 参考资料

- Google AI Studio quickstart（官方）：https://ai.google.dev/gemini-api/docs/ai-studio-quickstart
- Leveling up your developer experience in Google AI Studio（Google 官方博客）：https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/
- Troubleshoot Google AI Studio（官方）：https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
- Available regions for Google AI Studio and Gemini API（官方）：https://ai.google.dev/gemini-api/docs/available-regions
- Google AI Plans（官方）：https://ai.google.dev/gemini-api/docs/google-ai-plans
- Billing（官方）：https://ai.google.dev/gemini-api/docs/billing
- Gemini Developer API pricing（官方）：https://ai.google.dev/gemini-api/docs/pricing
- Gemini API Additional Terms of Service（官方）：https://ai.google.dev/gemini-api/terms
- Build apps in Google AI Studio（官方）：https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Agents in AI Studio Playground（官方）：https://ai.google.dev/gemini-api/docs/aistudio-agents
- Access Google AI Studio with your Workspace account（官方）：https://ai.google.dev/gemini-api/docs/workspace
- Models（官方）：https://ai.google.dev/gemini-api/docs/models
