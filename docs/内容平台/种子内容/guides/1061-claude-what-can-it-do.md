---
title: Claude 能干嘛、适合做什么：按官方产品页看 Claude 的能力和各个入口
slug: claude-what-can-it-do
products: [claude]
models: [claude-llm]
accountTier: FREE
excerpt: Claude 能干嘛、适合做什么？只按 Anthropic 官方产品页和模型页整理：写作分析、文件和表格、联网搜索、Claude Code、Cowork、浏览器和 Office 入口，以及官方对模型规格的说明；官方没有解释「为什么强」，本文也不替它解释。
checkedOn: 2026-10-24
sources:
  - https://claude.com/product/overview
  - https://claude.com/download
  - https://platform.claude.com/docs/en/models/overview
  - https://support.claude.com/en/articles/8114491-get-started-with-claude
  - https://www.anthropic.com/company
verify:
  - 能力清单取自 2026-10-24 官方产品概览页，该页是官方宣传材料，其中部分功能（computer use、Claude Tag、Claude Duet 等）标注 beta 或研究预览，客户评价不是独立评测
  - 官方没有给出「为什么强」的技术解释，也没有给出与其他模型的跑分对比，本文不写排名、不写「最强」
  - Anthropic 公司页的价值观（helpful、honest、harmless）是公司价值观，不是对 Claude 训练方法的说明
---

> 本文根据 Claude 官方产品概览页、下载页、开发者文档 Models overview、帮助中心和 Anthropic 公司页整理，资料核对于 2026-10-24。官方产品页是宣传材料，本文只转述它写明的内容，不做评测，也不下「最强」的结论。图为本站整理的示意图。**以官方页面为准**。

## 适用于谁

- 搜「claude 为什么这么强」「claude 能干嘛」的人；
- 刚听说 Claude，想知道它适合拿来做什么的人；
- 不知道 Claude 有哪些入口（网页、桌面、Claude Code 等）的人。

新手入门的操作见 [/guides/claude-how-to-use-beginner](/guides/claude-how-to-use-beginner)。

## 结论先说

1. **官方没有回答「为什么强」。** 我们核对了产品概览页、公司页和模型文档：它们写的是 Claude 能做什么、有哪些入口、规格是多少，没有给出「强在哪个技术原因」的解释，也没有与其他模型的对比评测。所以本文只讲官方写明的能力，不替官方编理由。
2. **官方对 Claude 的定位是「把任务交给它，而不只是提问」**：能快速回答，也能做长时间、多步骤的任务，生成可编辑的文档、表格和幻灯片。
3. **官方列出的能力**：联网搜索、连接其他应用、读写文件和文件夹、浏览器操作、电脑操作（beta）、Skills 和插件、自定义连接器和 MCP、记忆、项目和跨对话的持久指令。
4. **入口很多**：网页、桌面、手机、Claude Code、Cowork、Chrome 扩展、Microsoft 365 和 Google Workspace 插件等，见下文。
5. **模型规格可以查**：当前主力模型都是 100 万 token 上下文、最大输出 12.8 万 token、支持图片输入，具体见 [/guides/claude-models-compare](/guides/claude-models-compare)。
6. 想用到更多功能和用量，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![官方产品页列出的 Claude 能做的事](seed:g1061-claude-capabilities-official.png)
*图：本站根据 [Claude 官方产品概览页](https://claude.com/product/overview) 整理的示意图*

## 一、官方写明的能力

按官方产品概览页：

- **任务类**：快速回答；长时间、多步骤的任务（官方说你合上电脑后也会继续运行）；并行任务；定时的重复任务；语音交互；
- **输出类**：Artifacts（可分享的设计、幻灯片和文档），交互式图表和可视化；可编辑的文档、表格和幻灯片；
- **连接类**：联网搜索、连接其他应用、文件和文件夹访问、浏览器使用、电脑使用（beta）；Skills、插件、自定义连接器和 MCP；
- **记忆类**：记忆、项目、跨对话的持久指令；
- **支持的文件**：Word、PDF、Markdown、CSV 等文档，Excel 表格，PowerPoint 演示稿，图片，数据和配置格式，Jupyter notebook，以及大多数编程语言。

官方页面给出的使用场景例子包括：会议待办跟踪和提醒、按主题归类客户反馈、预算重新预测、活动复盘和指标看板、通话准备和 CRM 更新、法律检索和合同批注、符合品牌调性的社交文案和演示稿、对账不同来源的数据。这些是官方宣传里的例子，不代表你的任务一定能达到同样的效果。

官方帮助中心《Get started with Claude》说得更朴素：问题可以简单，比如「怎么挂相框」，也可以是复杂的多步骤项目、分析、创意写作、编程和技术任务；它对英语的训练最充分，在许多其他常见语言上也表现良好，并且有广泛的编程语言知识。

## 二、想做什么，用哪个入口

![想做这件事，用 Claude 的哪个入口](seed:g1061-claude-entry-by-task.png)
*图：本站根据 [Claude 官方产品概览页](https://claude.com/product/overview) 与 [下载页](https://claude.com/download) 整理的示意图*

官方产品页和下载页列出的入口：

- **Claude（网页、桌面、手机）**：聊天、写作、分析，见 [/guides/claude-web-vs-desktop-difference](/guides/claude-web-vs-desktop-difference) 和 [/guides/claude-mobile-app](/guides/claude-mobile-app)；
- **Claude Code**：写代码，在桌面、终端、VS Code、JetBrains 等环境里使用，见 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)；
- **Cowork**：把 Claude Code 的智能体能力放进图形界面，处理文件和长任务，付费套餐可用，见 [/guides/claude-cowork](/guides/claude-cowork)；
- **Claude in Chrome**：在浏览器里导航、点击、填表，见 [/guides/claude-in-chrome](/guides/claude-in-chrome)；
- **Claude for Microsoft 365、Claude for Google Workspace**：在办公软件里使用，Excel 见 [/guides/claude-for-excel](/guides/claude-for-excel)；
- **Claude Platform / API**：开发者调用，也可以通过 Amazon Bedrock、Google Cloud、Microsoft Foundry 使用，见 [/guides/claude-api-key-console](/guides/claude-api-key-console)；
- 另外还有 Claude Tag（Slack 里使用，Team 和 Enterprise 的 beta）、Claude Duet（研究预览，需要等候名单）、Claude Science 和 Claude Security 等专门产品。

## 三、官方对模型的说明

官方 Models overview 写明：当前模型都支持文字和图片输入、文字输出、多语言、视觉和工具调用；上下文窗口 100 万 token，最大输出 12.8 万 token；官方把 Opus 5.5 作为大多数工作的起点，Fable 5.1 用于最苛刻的推理和长时间智能体任务，Sonnet 5.5 是速度与智能的平衡，Haiku 5.5 面向高并发和低延迟。三款的差别见 [/guides/claude-opus-vs-sonnet](/guides/claude-opus-vs-sonnet)。

官方还提醒了一些边界：**官方页面没有写「文字直接生成图片」这项能力**，见 [/guides/claude-image-generation](/guides/claude-image-generation)；**某些地区不在官方支持名单里**，见 [/guides/claude-supported-countries-regions](/guides/claude-supported-countries-regions)；用量有限额，见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

## 四、关于「安全」的官方说法

Anthropic 公司页把自己描述为「把安全放在前沿的 AI 研究和产品」公司，是一家公益公司；目标是做「可靠、可解释、可引导」的前沿系统；价值观里有「乐于助人、诚实、无害」。官方公司页说得很清楚：这是公司的价值观，页面没有说明 Claude 是怎么训练出来的。产品页上与安全相关的描述则是：权限设置可以让 Claude 先展示计划、等你批准再行动；默认在永久删除文件前会询问；管理员可以按团队设置访问、管理支出上限和工具权限。Claude Code 的权限设置见 [/guides/claude-code-permission-modes](/guides/claude-code-permission-modes)。

## 常见问题

**Q：Claude 比 ChatGPT 强吗？**
官方没有给出这样的对比，本文也不下结论。两者的区别和选法见 [/guides/chatgpt-vs-claude](/guides/chatgpt-vs-claude)。

**Q：Claude 适合写代码吗？**
官方有专门的 Claude Code，并把 Opus 5.5 定位为长时间智能体编程。具体表现因任务而异。

**Q：Claude 的知识更新到什么时候？**
官方模型页写明当前模型的可靠知识截止是 2026 年 6 月；联网搜索可以补充更新的信息，见 [/guides/claude-web-search](/guides/claude-web-search)。

**Q：免费版能用多少功能？**
官方定价页列出免费版包含聊天、联网搜索、文件创建、代码执行、记忆、Artifacts 等，用量有限制，见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)。

## 参考资料

- Claude 官方产品概览页 — https://claude.com/product/overview
- Claude 官方下载页 — https://claude.com/download
- Claude 官方 Models overview — https://platform.claude.com/docs/en/models/overview
- Claude 帮助中心：Get started with Claude — https://support.claude.com/en/articles/8114491-get-started-with-claude
- Anthropic：公司页 — https://www.anthropic.com/company
