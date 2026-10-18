---
title: AI 学习路线：零基础从哪开始，6 个阶段、每阶段该读哪几篇教程（2026）
slug: ai-learning-path-beginner-roadmap
products: [ai-tools]
models: []
accountTier: FREE
excerpt: AI 学习路线怎么走？给零基础的人一条循序渐进的路径：先选一个助手用顺，再学提问，再用进日常工作，按需学做图做视频，守住隐私与版权，最后进阶自动化和编程。每个阶段都配了本站对应的教程。
checkedOn: 2026-10-19
sources:
  - https://support.claude.com/en/articles/8114491-get-started-with-claude
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
  - https://support.google.com/gemini/answer/13275745?hl=en
verify:
  - 路线的阶段划分和时间长短是本站的建议，不是某家官方的课程；各阶段里引用的事实性说法，请到对应教程和官方帮助中心核对
  - Claude 官方入门文章建议「像对同事或朋友说话一样自然地提问、先从简单问题开始、越具体越好、不要怕反复修改」，阶段二的几条原则取自这里并参考本站提示词教程
  - 文中提到的工具和教程更新较快，以各教程页面标注的核对日期为准
---

> 本文是本站整理的**学习路线**，不是官方课程。每一阶段只推荐本站已有的教程（教程里的事实都标了官方来源和核对日期）。时间长短是建议，按自己的节奏走。图为本站整理的示意图。想直接找可复制的提示词，去 [/prompts](/prompts)；想按主题系统学，去 [/learn](/learn)。

## 适用于谁

- 搜「ai学习路线」「ai学习教程」，完全没基础的人；
- 听说 AI 很有用，但打开后不知道问什么、也不知道往哪学的人；
- 想把 AI 用进工作，但担心隐私、版权和准确性的人；
- 想从聊天进阶到自动化和编程的人。

## 结论先说

1. **先别想「学 AI」，先想「用 AI 做一件具体的事」**：写周报、读一份 PDF、做一张图，都比空读概念有效。
2. **一条路径，六个阶段**：①选一个助手用顺 → ②学会提问 → ③用进日常工作 → ④按需学做图做视频 → ⑤守住隐私版权和标识 → ⑥进阶到自动化、编程和 Agent。
3. **提问是最核心的基本功**：所有工具通用。官方入门文章的建议很朴素：像对同事或朋友说话一样自然地提问，先从简单问题开始，请求越具体越好，不要怕反复修改。
4. **阶段五不要跳过**：越早养成「敏感信息不贴、重要结论去核对」的习惯，越不容易出事。
5. **不用全学**：阶段四和阶段六按需要选，没有需求就跳过。

![AI 零基础学习路线：6 个阶段](seed:g949-ai-learning-roadmap.png)
*图：本站整理的学习路线示意图，参考各官方入门文档与本站教程*

## 阶段一：认识并选定一个助手（1–2 天）

**目标**：能独立完成注册、登录、开新对话，知道它能干什么、不能干什么。不用一次学四个，**先把一个用顺**。

- 想了解 ChatGPT：[/guides/chatgpt-how-to-use-beginner](/guides/chatgpt-how-to-use-beginner)、[/guides/chatgpt-what-is-what-can-it-do](/guides/chatgpt-what-is-what-can-it-do)；
- Claude：[/guides/claude-how-to-use-beginner](/guides/claude-how-to-use-beginner)、注册见 [/guides/claude-how-to-sign-up](/guides/claude-how-to-sign-up)；
- Gemini：[/guides/gemini-how-to-use-getting-started](/guides/gemini-how-to-use-getting-started)；
- DeepSeek、Kimi、千问等国内助手：[/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)、[/guides/kimi-how-to-use](/guides/kimi-how-to-use)、[/guides/qianwen-how-to-use](/guides/qianwen-how-to-use)；
- 不知道选哪个：[/guides/chatgpt-vs-claude](/guides/chatgpt-vs-claude)、[/guides/chatgpt-vs-gemini-which-to-choose](/guides/chatgpt-vs-gemini-which-to-choose)、[/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)。

注意：各家有各自的官方支持地区和账号要求，以官方名单为准；用不上的就先用能用的那一个，别在这一步耗时间。

## 阶段二：学会提问（约 1 周）

**目标**：同一个问题，能写出带背景、任务和格式要求的提问，并会追问修改。

- 基础：[/guides/how-to-write-prompts](/guides/how-to-write-prompts)；
- 一个简单的模板：「我是[身份]，要[做什么事]。请你[具体任务]。要求：[语气 / 字数 / 格式]。信息不够就先问我 2 个问题」；
- 进一步：[/guides/system-prompt-how-to-write](/guides/system-prompt-how-to-write)（设定角色和规则）、[/guides/few-shot-prompting-examples](/guides/few-shot-prompting-examples)（给例子）、[/guides/prompt-xml-tags-markdown-structure](/guides/prompt-xml-tags-markdown-structure)（用结构整理长提示）；
- 少出错：[/guides/reduce-ai-hallucination-official-tips](/guides/reduce-ai-hallucination-official-tips)、[/guides/ai-search-verify-sources-hallucination](/guides/ai-search-verify-sources-hallucination)。

练习方法：每天把一件真实的小事交给 AI，不满意就在同一个对话里追问，对比「第一次写的」和「追问后的」有什么不同。

## 阶段三：把它用进日常工作（2–3 周）

**目标**：能用 AI 总结一份 PDF，并回原文核对关键数字；能做出一份可以交付的周报、PPT 或表格分析。

- 读文档：[/guides/chatgpt-summarize-pdf](/guides/chatgpt-summarize-pdf)、[/guides/ai-translate-pdf-long-documents](/guides/ai-translate-pdf-long-documents)、[/guides/ai-read-papers-literature-review](/guides/ai-read-papers-literature-review)；
- 办公：[/guides/ai-weekly-report-workflow](/guides/ai-weekly-report-workflow)、[/guides/ai-make-ppt-routes-compare](/guides/ai-make-ppt-routes-compare)、[/guides/ai-meeting-minutes-workflow](/guides/ai-meeting-minutes-workflow)、[/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)；
- 内容创作：[/guides/ai-write-xiaohongshu-wechat-label](/guides/ai-write-xiaohongshu-wechat-label)。

原则：**AI 起草，你来核对和决定**。数字、日期、引用、人名，交付前一定回到原始资料核一遍。

## 阶段四：按需学做图和做视频

**目标**：能写出主体、场景、风格齐全的图像提示词，能用一个工具做出可用的图或短视频。

- 提示词公式：[/guides/ai-image-prompt-formula](/guides/ai-image-prompt-formula)；
- 图像工具：Gemini 里的 Nano Banana，见 [/guides/nano-banana-how-to](/guides/nano-banana-how-to)，官方入口见 [/guides/nano-banana-official-entry-free-use](/guides/nano-banana-official-entry-free-use)；ChatGPT 的见 [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to)；Midjourney 见 [/guides/midjourney-how-to](/guides/midjourney-how-to)；
- 视频工具：国内的有即梦、可灵，见 [/guides/jimeng-ai-how-to](/guides/jimeng-ai-how-to)、[/guides/kling-ai-how-to](/guides/kling-ai-how-to)；
- 版权：[/guides/ai-image-copyright-commercial](/guides/ai-image-copyright-commercial)。

## 阶段五：守住隐私、版权和 AI 标识

**目标**：知道哪些资料不能贴进去，能说出 AI 生成内容的标识要求。

- 隐私清单：[/guides/ai-privacy-data-safety-checklist](/guides/ai-privacy-data-safety-checklist)；
- 数据设置：ChatGPT 的见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)；
- 国内发布 AI 生成内容的标识规则：[/guides/ai-generated-content-label-rules](/guides/ai-generated-content-label-rules)；
- 习惯：不贴身份证件、银行卡、客户隐私、未公开的商业资料；用公司账号前先看公司的 AI 使用规定。

## 阶段六：进阶到自动化、编程和 Agent（1–2 个月）

**目标**：能跑通一个最小的 API 调用，或一个自动化流程。按兴趣选**一条**路：

- **API 调用**：[/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)、[/guides/claude-api-python-quickstart](/guides/claude-api-python-quickstart)、[/guides/deepseek-api-python-quickstart](/guides/deepseek-api-python-quickstart)，价格对照见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)；
- **AI 编程**：[/guides/vibe-coding-beginner-workflow](/guides/vibe-coding-beginner-workflow)、[/guides/claude-code-getting-started](/guides/claude-code-getting-started)、[/guides/codex-getting-started](/guides/codex-getting-started)，安全习惯见 [/guides/ai-coding-security-secrets-permissions](/guides/ai-coding-security-secrets-permissions)；
- **Skills 与 MCP**：[/guides/claude-skills](/guides/claude-skills)、[/guides/mcp-model-context-protocol](/guides/mcp-model-context-protocol)；
- **工作流和智能体平台**：[/guides/coze-create-agent-howto](/guides/coze-create-agent-howto)、[/guides/dify-how-to-use-cloud-getting-started](/guides/dify-how-to-use-cloud-getting-started)、[/guides/n8n-how-to-use-ai-agent-workflow](/guides/n8n-how-to-use-ai-agent-workflow)；
- **本地运行模型**：[/guides/ollama-how-to-use-install-commands](/guides/ollama-how-to-use-install-commands)；
- **AI 浏览器**：[/guides/ai-browsers-comet-neon-dia-leo](/guides/ai-browsers-comet-neon-dia-leo)。

## 学完每个阶段，自检一下

![每个阶段学完，自检能不能做到](seed:g949-ai-learning-selfcheck.png)
*图：本站整理的自检清单示意图*

如果某一条做不到，回到该阶段的教程再练一遍，不必急着进入下一阶段。

## 常见问题

**Q：需要先学编程吗？**
不需要。阶段一到五完全不用写代码；阶段六才涉及 API 和编程，而且可以让 AI 帮你写、帮你读。

**Q：需要付费订阅吗？**
先用免费版把阶段一到三走完，再根据用量决定要不要升级。需要开通 ChatGPT、Claude、Grok 或谷歌账号相关服务时，可以看本站的 [/chongzhi](/chongzhi)。

**Q：我该花多久？**
阶段一到三，坚持每天 30 分钟左右，一个月通常能把 AI 用顺；后面的阶段按需要。

**Q：怎么保证学的是新的？**
AI 产品更新很快，本站教程都标了核对日期，具体的菜单名、价格、额度以官方页面为准。

## 参考资料

- Claude 帮助中心：Get started with Claude — https://support.claude.com/en/articles/8114491-get-started-with-claude
- Anthropic：Prompt engineering overview — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- Gemini 帮助中心：Use Gemini Apps — https://support.google.com/gemini/answer/13275745?hl=en
