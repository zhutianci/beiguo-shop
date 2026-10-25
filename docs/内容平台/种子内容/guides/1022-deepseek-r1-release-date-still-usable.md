---
title: DeepSeek R1 是什么、什么时候发布、现在还能用吗：从 R1 到 R1-0528 再到 V3.1、V4 的官方脉络
slug: deepseek-r1-release-date-still-usable
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek R1 是什么时候发布的、现在还能用吗？按官方公告与更新日志（2026-10-24 查询）梳理：2025 年 1 月 20 日发布 R1，5 月 28 日更新 R1-0528，之后并入 V3.1 的思考模式；API 名 deepseek-reasoner 已预告停用。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/news/news250120
  - https://api-docs.deepseek.com/zh-cn/news/news250528
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://api-docs.deepseek.com/zh-cn/news/news260424
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://ollama.com/library/deepseek-r1
verify:
  - 发布日期和各项说明取自官方公告与更新日志：R1 发布于 2025-01-20，R1-0528 于 2025-05-28，V3.1 于 2025-08-21；官方 2026-04-24 说明 deepseek-chat 与 deepseek-reasoner 将于 2026-07-24 停止使用
  - deepseek-reasoner 现在是否仍能调用，官方价格页没有再提这个名字，本文不断言，新代码请使用 deepseek-flash 或 deepseek-v4-pro
  - 官方公告对 R1 的性能描述（如「性能对标 OpenAI o1 正式版」「AIME 2025 从 70% 提升到 87.5%」）是 DeepSeek 自己的评测，本文只转述，不做比较
  - 本地运行的 R1 体积取自 Ollama 模型库（2026-10-24），蒸馏小模型与完整 R1 是两回事
---

> 本文根据 DeepSeek 官方公告、更新日志和 Ollama 模型库整理，资料核对于 2026-10-24。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek r1发布时间」「deepseek r1 是什么」的人；
- 看到老教程提到 R1、`deepseek-reasoner`，想知道现在还能不能用的人；
- 想在本地部署 R1 的人。

## 结论先说

1. **R1 发布于 2025 年 1 月 20 日**。官方公告标题是「DeepSeek-R1 发布」，同步开源模型权重，遵循 MIT License；API 里用 `model='deepseek-reasoner'` 调用；官网与 App 同日更新，开启「深度思考」即可使用。
2. **R1 在 2025 年 5 月 28 日升级为 R1-0528**，官方称思考更深、推理更强。
3. **之后 R1 的思考能力被并入统一的模型**：2025-08-21 的 V3.1 起，官方说「一个模型同时支持思考模式与非思考模式」；到 2026 年的 V4 系列，思考与非思考都是同一个模型的两种模式。
4. **`deepseek-reasoner` 是旧模型名**：官方 2026-04-24 公告说它和 `deepseek-chat` 将于 2026-07-24 停止使用，现在价格页只列 `deepseek-flash` 和 `deepseek-v4-pro`。
5. **R1 本身没有消失**：开源权重仍在，可以用 Ollama 等工具在本地运行蒸馏版。

![DeepSeek R1 之后的官方时间线](seed:g1022-deepseek-r1-timeline.png)
*图：本站根据 [DeepSeek 官方更新日志](https://api-docs.deepseek.com/zh-cn/updates) 整理的示意图*

## 一、R1 是什么（2025-01-20）

官方公告的要点：

- **后训练大规模使用强化学习**：官方说在仅有极少标注数据的情况下极大提升了模型推理能力，在数学、代码、自然语言推理等任务上性能「比肩 OpenAI o1 正式版」（官方自己的评测说法）；
- **开源**：同步开源 DeepSeek-R1-Zero 和 DeepSeek-R1 两个 660B 模型，并通过 R1 的输出蒸馏了 6 个小模型开源，其中 32B 和 70B 在多项能力上对标 OpenAI o1-mini；
- **许可证**：统一使用 MIT License，完全开源，不限制商用，无需申请；产品协议也明确允许用户利用模型输出、通过模型蒸馏等方式训练其他模型；
- **API**：上线 API，对用户开放思维链输出，`model='deepseek-reasoner'`；当时的价格是每百万输入 token 1 元（缓存命中）/ 4 元（缓存未命中），输出 16 元。这是 2025 年的价格，不是现在的，现价见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)；
- **App 与网页**：登录官网或官方 App，打开「深度思考」模式即可。

## 二、R1-0528（2025-05-28）

官方公告说：

- 仍以 2024 年 12 月发布的 DeepSeek V3 Base 作为基座，但后训练投入了更多算力，提升了思维深度；AIME 2025 测试准确率由旧版的 70% 提升到 87.5%，对应每题平均使用的 token 从约 12K 增加到约 23K；
- **幻觉改善**：在改写润色、总结摘要、阅读理解等场景中，幻觉率降低约 45%–50%（官方评测）；
- **创意写作**：针对议论文、小说、散文等文体优化，能输出篇幅更长、结构更完整的长篇作品；
- **工具调用**：支持工具调用（不支持在 thinking 中进行工具调用），API 增加了 Function Calling 和 JSON Output；
- **max_tokens 含义调整**：当时变为限制单次输出的总长度（包括思考过程），默认 32K，最大 64K，当时上下文长度仍为 64K。这些是旧模型的参数，现在的上限见 [/guides/deepseek-context-length-output-limit](/guides/deepseek-context-length-output-limit)；
- 还蒸馏了 R1-0528 的思维链，后训练 Qwen3-8B Base，得到 DeepSeek-R1-0528-Qwen3-8B。

## 三、现在还能用吗

**在线使用**：网页版和 App 里的「深度思考」开关仍在，但背后用的是哪个模型，以官方界面和公告为准，不一定是当年的 R1。思考开关与联网搜索的区别见 [/guides/deepseek-deep-thinking-web-search](/guides/deepseek-deep-thinking-web-search)。

**API**：

- 2025-08-21 起，`deepseek-chat` 和 `deepseek-reasoner` 分别对应 V3.1 的非思考模式和思考模式，之后几次升级仍沿用这两个名字；
- 2026-04-24 的 V4 公告说，这两个名字将于三个月后（2026-07-24）停止使用，在此之前分别指向 `deepseek-v4-flash` 的非思考与思考模式；
- 现在官方价格页只列 `deepseek-flash` 和 `deepseek-v4-pro`，两者都同时支持思考与非思考，默认开启思考。**新项目请直接用新名字**，思考开关与强度见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)。

![想用 R1，现在该怎么选](seed:g1022-deepseek-r1-use-decide.png)
*图：本站根据 DeepSeek 官方公告与 Ollama 模型库整理的示意图*

**开源权重**：R1 的权重遵循 MIT License，在 Hugging Face 上提供。Ollama 模型库里 `deepseek-r1` 有 1.5b 到 671b 多个标签，其中默认的 8b 是 R1-0528 蒸馏到 Qwen3 8B 的版本，只有 671b 才是完整的 R1，文件体积 404GB。个人电脑能跑的是蒸馏小模型，配置估算见 [/guides/deepseek-local-deploy-hardware-requirements](/guides/deepseek-local-deploy-hardware-requirements)，命令与步骤见 [/guides/deepseek-local-deploy-ollama](/guides/deepseek-local-deploy-ollama)。

## 四、R1 之后的几个节点

- **2025-08-21 · V3.1**：官方称包含混合推理架构（一个模型同时支持思考和非思考）、更高的思考效率、更强的 Agent 能力；
- **2026-04-24 · V4 预览版**：1M 上下文，同时支持思考与非思考；
- **2026 年 7–10 月**：V4-Flash 正式版、V4-Pro 正式版、V4.1 Flash 等，见 [/guides/deepseek-v4-official-release-changes](/guides/deepseek-v4-official-release-changes) 和 [/guides/deepseek-v41-flash-what-is](/guides/deepseek-v41-flash-what-is)。

## 常见问题

**Q：R1 和 V3 是什么关系？**
官方 R1-0528 公告说它仍使用 2024 年 12 月发布的 DeepSeek V3 Base 作为基座。

**Q：想用 R1 的「思考过程」怎么办？**
思考模式下，API 通过 `reasoning_content` 返回思维链，见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)。

**Q：R1 和 ChatGPT 的推理模型有什么区别？**
本文不做跨公司对比；整体区别可看 [/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)。需要 ChatGPT 会员见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：从哪里开始用 DeepSeek？**
见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。

## 参考资料

- DeepSeek-R1 发布（2025-01-20）— https://api-docs.deepseek.com/zh-cn/news/news250120
- DeepSeek-R1-0528 发布（2025-05-28）— https://api-docs.deepseek.com/zh-cn/news/news250528
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
- DeepSeek-V4 预览版发布（2026-04-24）— https://api-docs.deepseek.com/zh-cn/news/news260424
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- Ollama：deepseek-r1 — https://ollama.com/library/deepseek-r1
