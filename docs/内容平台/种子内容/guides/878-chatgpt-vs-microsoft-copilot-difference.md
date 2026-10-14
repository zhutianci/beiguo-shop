---
title: ChatGPT 和 Copilot 的区别：Microsoft Copilot、Microsoft 365 Copilot 和 ChatGPT 怎么分
slug: chatgpt-vs-microsoft-copilot-difference
products: [chatgpt, ai-tools]
models: []
accountTier: OTHER
excerpt: ChatGPT 和 Copilot 有什么区别？ChatGPT 是 OpenAI 的产品，Microsoft Copilot 是微软的，而且「Copilot」按登录的账号分个人版和工作版。本文只按两家官方页面讲清入口、免费与付费方式、和 Word、Excel 的关系、模型选择方式，不比谁更强。
checkedOn: 2026-10-14
sources:
  - https://chatgpt.com/pricing
  - https://www.microsoft.com/en-us/microsoft-copilot/for-individuals
  - https://copilot.microsoft.com/
  - https://learn.microsoft.com/en-us/microsoft-365/copilot/which-copilot-for-your-organization
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
verify:
  - Microsoft 的个人套餐页面带有「该产品在你所在的市场不可用」的提示，说明 Microsoft 365 Premium、Pro 等的可购买情况因市场而异；正文不写价格，也不写具体哪些地区可用，以 Microsoft 官方页面为准
  - 「Auto / Quick response / Think deeper」来自 Microsoft Learn 面向组织的页面，个人版 Copilot 里的模型选项是否完全相同，该页面没有说明
  - Microsoft 官方页面没有写 Copilot 底层使用的具体模型，正文也没有写；不要把 ChatGPT 的模型名套到 Copilot 上
  - Copilot 的功能名称近期有改名（Project 改为 Notebook、Tasks 改为 Cowork、Deep Research 改为 Researcher、Study and Learn 改为 Guided Learning），以应用里显示的为准
  - ChatGPT 的 Word、Excel、PowerPoint 扩展只引用了价格页的一行，具体用法见本站另外两篇教程
---

> 本文只整理 ChatGPT 价格页、OpenAI 帮助中心，以及 Microsoft 官方的 Copilot 个人套餐页、Copilot 首页和 Microsoft Learn 页面上能查到的内容，核对于 2026-10-14。不做并排评测，也不下「谁更强」的结论。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 搜「copilot 和 chatgpt 区别」「chatgpt vs copilot」，被「Copilot」到处都是弄糊涂的人；
- 平时用 Word、Excel、Outlook，想知道微软自家的 Copilot 和 ChatGPT 怎么选的人；
- 在公司或学校里被分配了 Copilot，想知道它和个人用的 ChatGPT 有什么不同的人。

## 结论先说

1. **它们是两家公司的产品**：ChatGPT 是 OpenAI 的，Microsoft Copilot 是微软的。
2. **「Copilot」不是一个单一的东西。** Microsoft 官方页面把它分成：个人用的 **Microsoft Copilot**（用个人 Microsoft 账号登录，面向个人使用）；工作和学校用的 **Copilot Chat** 与 **Microsoft 365 Copilot**（用组织账号登录，由所在组织授权）。写代码用的 GitHub Copilot 是另一个产品，不在本文范围。
3. **费用方式不同**：ChatGPT 是独立订阅（Free、Go、Plus、Pro 等）；Microsoft 官方写，个人用 Copilot 登录 Microsoft 账号就可以免费用，部分功能有用量限制，更高的用量包含在 Microsoft 365 Personal、Family、Premium、Pro 订阅里。
4. **和办公软件的关系不同**：Copilot 直接出现在 Word、Excel、PowerPoint、Outlook 里；ChatGPT 价格页列有 Word、Excel、PowerPoint 等扩展，另外还有独立的对话和 Work、Codex 等功能。
5. **模型选择方式不同**：Microsoft Learn 页面写 Copilot 默认由实时路由器按提示选模型，也可以在选择器里选 Auto、Quick response、Think deeper；ChatGPT 是用 Thinking 滑杆选思考档位。Microsoft 官方页面没有写底层具体用哪个模型。
6. **能不能用、有哪些功能，取决于所在市场、套餐、设备和管理员设置**，两边官方页面都有这类说明。

![ChatGPT 和 Microsoft Copilot 官方页面对照：产品归属、入口、免费用法、付费方式、办公软件、家庭共享、模型选择、公司账号](seed:g878-chatgpt-copilot-table.png)
*图：本站根据 [ChatGPT 价格页](https://chatgpt.com/pricing)、[Microsoft Copilot 个人套餐页](https://www.microsoft.com/en-us/microsoft-copilot/for-individuals) 与 [Microsoft Learn：What is Microsoft Copilot?](https://learn.microsoft.com/en-us/microsoft-365/copilot/which-copilot-for-your-organization) 整理的示意图*

## 一、先分清你看到的是哪种 Copilot

Microsoft Learn 的说明是：Copilot Chat 和 Microsoft Copilot 的体验在**数据范围、集成深度和授权方式**上不同，但都由大语言模型驱动，回答可以基于网页，也可以基于组织数据（Microsoft Graph 和 Work IQ），并受用户权限控制。

![你看到的是哪一种 Copilot：个人账号、工作账号、Word 和 Excel 里、Edge 和 Outlook、GitHub Copilot、看不到功能](seed:g878-which-copilot.png)
*图：本站根据 [Microsoft Learn：What is Microsoft Copilot?](https://learn.microsoft.com/en-us/microsoft-365/copilot/which-copilot-for-your-organization) 与 [Microsoft Copilot 个人套餐页](https://www.microsoft.com/en-us/microsoft-copilot/for-individuals) 整理的示意图*

- **个人账号**：用个人 Microsoft 账号登录，入口包括 Microsoft Copilot 的网页、桌面和手机 App，Edge 里的 Copilot，Outlook 和 Teams 里的 Copilot Chat。Copilot 首页的介绍写「一个 Copilot，覆盖工作、生活和学习」，个人和工作对话按账号分开保存。
- **工作或学校账号**：Microsoft Learn 把它分成 Copilot Chat（Basic）、Microsoft 365 Copilot（Basic）和 Microsoft 365 Copilot（Premium）三种授权。Basic 以网页数据为主，组织文件需要你自己上传；Premium 可以自动通过 Microsoft Graph 和 Work IQ 用到组织数据。具体你有哪种，由所在组织的管理员决定。
- 工作或学校账号下，Microsoft 写的是受 **Enterprise Data Protection（企业数据保护）** 约束，提示词和回复的保护与邮件、文件的合同条款一致。这是 Microsoft 面向组织的说明，详情看官方原文。

## 二、免费与付费

**Microsoft Copilot**：Copilot 首页写，登录 Microsoft 账号就有免费档，用来研究、创作、获得回答，部分功能有用量限制，更多功能在付费计划里。个人套餐页列出 **Microsoft 365 Personal、Family、Premium、Pro** 四档：

- Personal 和 Family 包含「比免费版更高用量」的高级聊天、视觉辅助、音频生成和图像创作；
- Premium 是「大量使用」，并包含 Premium 和 Pro 独占的 Copilot 功能，以及有限用量的智能体功能；
- Pro 是「最高用量」，其他方面在 Premium 的基础上增加存储等。
- 官方还特别写：**AI 功能只给订阅所有者，不能共享**，Family 里其他成员不含 Copilot 的 AI 功能；各档都有用量限制。
- 页面上还带有「该产品在你所在的市场不可用」的提示，可购买情况因市场而异。

**ChatGPT**：独立订阅，个人套餐是 Free、Go、Plus、Pro，各档区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison) 和 [/guides/chatgpt-plus-vs-pro-tiers](/guides/chatgpt-plus-vs-pro-tiers)。OpenAI 的使用条款不允许共享账号凭据，见 [/guides/chatgpt-account-sharing-multiple-devices](/guides/chatgpt-account-sharing-multiple-devices)。要开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

不写价格：两边的价格都会调整，请看各自官方页面。

## 三、和 Word、Excel、PowerPoint 的关系

- **Copilot**：官方页面写的使用场景是「在 Word 里更快出初稿、在 Excel 里把数字变成见解、在 PowerPoint 里从提示到演示文稿、在 Outlook 里汇总收件箱」。官方也有一个限制：**Copilot in Excel 需要开启自动保存，也就是文件要存到 OneDrive，对没保存的文件不起作用**。套餐页里 Word、Excel、PowerPoint 在个人套餐中是「仅网页和手机」版本。
- **ChatGPT**：价格页列有「Excel、Word、PowerPoint 和 Google 表格扩展」，Free 和 Go 为有限，Plus 包含，Pro 更多。具体怎么装、怎么用，见 [/guides/chatgpt-for-word-powerpoint](/guides/chatgpt-for-word-powerpoint) 和 [/guides/chatgpt-for-excel-addin-formulas-vba](/guides/chatgpt-for-excel-addin-formulas-vba)。

如果你的工作主要就在 Microsoft 365 里，Copilot 是直接嵌在那些应用里的；如果你更多在聊天窗口里完成任务、再把结果放进文档，可以对比 ChatGPT 的扩展和 Work。选哪个，要看你的工作流，官方页面没有给出推荐。

## 四、功能名称：别被改名弄糊涂

Copilot 首页写明，近期统一了功能名称：**Project 改为 Notebook，Tasks 改为 Cowork，Deep Research 改为 Researcher，Study and Learn 模式改为 Guided Learning**。如果你看到的教程里是旧名字，以应用里显示的为准。Copilot 首页还写，如果你以前用过 Bing AI 或 Bing Chat，这些体验已经演变成了 Microsoft Copilot。

ChatGPT 这边的 Chat 和 Work 有什么区别，见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)。

## 五、怎么选

1. **你在公司或学校，已经被分配了 Copilot**：先用官方分配的那个，具体能用到哪些数据和功能，问管理员；
2. **个人使用，经常在 Word / Excel / Outlook 里写东西**：可以试 Microsoft 的免费档，看自己的账号和所在地区有哪些功能；
3. **个人使用，更常在对话窗口里做研究、写作、生图、写代码**：可以先试 ChatGPT 的 Free，再看要不要升级；
4. **拿不准**：两边都有免费入口，用自己最常做的 3 件事各试一遍，别只看宣传。

## 常见问题

**Q：Copilot 和 ChatGPT 是不是同一个模型？**
Microsoft 官方页面没有写 Copilot 具体用哪个模型，本文也不下结论。可以在 Copilot 的模型选择器里看它当前给出的选项。

**Q：GitHub Copilot 是不是同一个东西？**
不是。GitHub Copilot 是写代码的助手，本站有 [/guides/github-copilot-vscode-setup](/guides/github-copilot-vscode-setup) 等教程。

**Q：Copilot 里的对话会不会被用来训练？**
个人和组织的政策不同，请读 Microsoft 隐私声明和组织的相关说明。ChatGPT 这边的设置见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

**Q：我所在地区能用吗？**
Microsoft Learn 的页面写，Copilot 在许多地区可用，但在某些市场可能无法访问，详见微软的国际可用性说明。ChatGPT 见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)。

**Q：还有别的对比吗？**
[/guides/chatgpt-vs-gemini-which-to-choose](/guides/chatgpt-vs-gemini-which-to-choose)、[/guides/chatgpt-vs-claude](/guides/chatgpt-vs-claude)、[/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)。

## 参考资料

- ChatGPT 价格页 — https://chatgpt.com/pricing
- Microsoft：Copilot in Microsoft 365 plans for individuals — https://www.microsoft.com/en-us/microsoft-copilot/for-individuals
- Microsoft Copilot 首页 — https://copilot.microsoft.com/
- Microsoft Learn：What is Microsoft Copilot? — https://learn.microsoft.com/en-us/microsoft-365/copilot/which-copilot-for-your-organization
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
