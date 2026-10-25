---
title: DeepSeek V4 正式版有什么变化：从预览版到 V4 Pro 正式版，Agent、Responses API 与峰谷定价
slug: deepseek-v4-official-release-changes
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek V4 正式版和预览版相比有什么变化？按官方公告与更新日志（2026-10-24 查询）梳理：4 月预览版规格、7 月 Flash 正式版、8 月 13 日 V4 Pro 正式版新增的 Agent 能力、Responses API、三档思考强度和峰谷定价。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/news/news260424
  - https://api-docs.deepseek.com/zh-cn/news/news260813
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/news/news260910
verify:
  - 预览版规格（参数、激活参数、预训练数据、网页端入口）取自官方 2026-04-24 公告里的规格图；正式版变化取自官方 2026-08-13 公告与更新日志
  - 基准测试数字是 DeepSeek 自己公布的成绩，官方注明用 DeepSeek Harness 极简模式测试（max 档位、topp=0.95、temperature=1.0），其他框架下结果可能略有不同；本文不与其他公司的模型做比较
  - 官方没有在公告中写出 V4 Pro 正式版的参数规模变化，本文不写
  - 2026-09-10 之后 V4.1 Flash 与 V4 Pro 的关系见官方更新日志，本文只作简要说明，不预测未来
---

> 本文根据 DeepSeek 官方公告与更新日志整理，资料核对于 2026-10-24。模型更新很快，以官方页面为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek v4 正式版」「deepseek v4 pro 正式版」的人；
- 用过 4 月预览版，想知道正式版改了什么的人；
- 想弄清「V4」「V4.1」「Pro」「Flash」几个名字关系的人。

## 结论先说

1. **「V4 正式版」是分两步发布的**：2026-07-31 先出 V4-Flash 正式版（API 公测），2026-08-13 再出 **V4-Pro 正式版**（APP、网页端和 API 同步更新）。
2. **正式版相对预览版的主要变化**（官方更新日志写的）：Agent 能力大幅提升；API 原生支持 OpenAI Responses API 并适配 Codex；思考模式支持 low / high / max 三档强度；API 价格改为峰谷定价（2026-08-17 起生效）。
3. **网页端 / App 里用新 Pro**：官方说可以选「专家模式」使用 V4 Pro 正式版；预览版规格图里，专家模式对应 Pro、快速模式对应 Flash。
4. **之后还有 V4.1**：2026-09-10 发布 V4.1 Flash，见 [/guides/deepseek-v41-flash-what-is](/guides/deepseek-v41-flash-what-is)；V4 Pro 的 API 仍在提供。

![V4 从预览版到正式版的节点](seed:g1021-deepseek-v4-release-steps.png)
*图：本站根据 [DeepSeek 官方更新日志](https://api-docs.deepseek.com/zh-cn/updates) 整理的示意图*

## 一、预览版（2026-04-24）是什么样

官方公告：全新系列 DeepSeek-V4 的预览版上线并同步开源，按大小分两个版本。

![V4 预览版两个模型的规格](seed:g1021-deepseek-v4-preview-spec-compare.png)
*图：本站根据 [DeepSeek-V4 预览版公告](https://api-docs.deepseek.com/zh-cn/news/news260424) 的规格图整理的示意图*

公告里的要点：

- **百万字超长上下文**：官方说，从现在起 1M 上下文是 DeepSeek 所有官方服务的标配；
- **新注意力机制**：在 token 维度进行压缩，结合 DSA 稀疏注意力，降低对计算和显存的需求；
- **针对 Agent 产品适配**：针对 Claude Code、OpenClaw、OpenCode、CodeBuddy 等 Agent 产品做了适配和优化；
- **API**：同步上线，支持 OpenAI ChatCompletions 接口与 Anthropic 接口，模型名 `deepseek-v4-pro`、`deepseek-v4-flash`；旧模型名 `deepseek-chat`、`deepseek-reasoner` 当时说明将于 2026-07-24 停用；思考模式支持 `reasoning_effort` 设置 high / max；
- **价格**：公告里 Pro 的价格偏高，并说明受限于高端算力 Pro 服务吞吐有限，预计下半年昇腾 950 超节点批量上市后 Pro 价格会大幅下调。

## 二、正式版相对预览版变了什么

### V4-Flash 正式版（2026-07-31）

API 上线公测，模型名 `deepseek-v4-flash`，官方称 Agent 能力大幅增强、基准远超 V4-Pro-Preview；原生支持 Responses API 并适配 Codex；官方说明模型结构、尺寸和 Preview 一致，仅重新做了后训练。这次 Pro 和 App / 网页端没有变化。

### V4-Pro 正式版（2026-08-13）

官方更新日志与公告列出的变化：

1. **Agent 能力大幅提升**：官方称正式版 V4 Pro 极大增强了 Agent 能力，在生产环境中的性能表现提升尤为显著。官方公布的成绩（DeepSeek Harness 极简模式测试）包括：Terminal Bench 2.1 为 87.9、NL2Repo 为 61.5、Cybergym 为 83.3、DeepSWE 为 62.7、Toolathlon-Verified 为 74.1、HLE（不带工具 / 带工具）为 42.7 / 60.0 等；
2. **原生支持 Responses API**：官方说 DeepSeek API 现已原生支持 OpenAI Responses API 格式，并针对性适配 Codex，可以通过一键配置脚本完成 Codex 的配置，见 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)、[/guides/deepseek-responses-api-anthropic-compatible](/guides/deepseek-responses-api-anthropic-compatible)；
3. **更灵活的思考强度**：V4-Pro 和 V4-Flash 的思考模式支持 low / high / max 三档，官方建议简单任务用 low，日常 Agent 任务用 high，更复杂的任务用 max，见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)；
4. **API 价格调整，采用峰谷定价**：闲时价格是高峰时段的一半，鼓励用户调整任务时间，新价格自北京时间 2026-08-17 0 时起生效，价格变化见 [/guides/deepseek-price-changes-timeline](/guides/deepseek-price-changes-timeline)；
5. **网页端和 App**：用户可以通过「专家模式」使用新的 V4 Pro 正式版；API 模型名不变，仍是 `deepseek-v4-pro`。

## 三、现在的 V4 Pro 和 V4.1 的关系

- **2026-09-10**：V4.1 Flash 发布，原生多模态，模型名改用 `deepseek-flash`。官方新闻稿说，经多方测试 V4.1 Flash 在性能、费用、速度、总用时等指标上已全面超越 V4 Pro，因此计划有序下线 V4 Pro；同日的更新日志又写，为响应用户需求，2026-09-14 之后继续提供 V4 Pro 的 API 调用服务，计费方式保持不变；
- **现在**（2026-10-24 查询）：官方价格页同时列出 `deepseek-flash`（DeepSeek-V4.1-Flash-1017）和 `deepseek-v4-pro`（DeepSeek-V4-Pro-0813）。Pro 不支持图像理解，并发上限是 500，Flash 是 2500；其他规格相同，见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。

## 四、对使用者意味着什么

- **API 用户**：模型名用 `deepseek-flash` 或 `deepseek-v4-pro`；旧的 `deepseek-chat`、`deepseek-reasoner` 官方已宣布停用，新代码不要再用；
- **网页 / App 用户**：想用新 Pro，选「专家模式」；入口以官方界面为准，见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)；
- **做 Agent、编程工具的人**：官方在多次更新里强调了对 Claude Code、Codex、OpenCode 等的适配，接入方法见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup)；
- **预算敏感的人**：错开高峰、用缓存、先试 Flash。

## 常见问题

**Q：V4 预览版现在还能用吗？**
官方价格页现在只列 `deepseek-flash` 和 `deepseek-v4-pro`。旧的 `deepseek-v4-flash` 名字仍可调用，但对应模型已下线，请求由新版提供服务。

**Q：V4 Pro 正式版的版本号是什么？**
价格页写的当前版本是 DeepSeek-V4-Pro-0813。

**Q：怎么和 ChatGPT、Claude 比？**
本文不做跨公司比较，因为官方只给出自己的评测口径。想了解整体区别可看 [/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)；需要 ChatGPT 或 Claude 会员见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)、[/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 参考资料

- DeepSeek-V4 预览版发布（2026-04-24）— https://api-docs.deepseek.com/zh-cn/news/news260424
- DeepSeek-V4-Pro 正式版上线（2026-08-13）— https://api-docs.deepseek.com/zh-cn/news/news260813
- DeepSeek-V4.1-Flash 发布（2026-09-10）— https://api-docs.deepseek.com/zh-cn/news/news260910
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
