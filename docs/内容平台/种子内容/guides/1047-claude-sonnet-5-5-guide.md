---
title: Claude Sonnet 5.5 是什么：能力定位、价格、免费版能用吗（2026 年 10 月）
slug: claude-sonnet-5-5-guide
products: [claude]
models: [claude-llm]
accountTier: FREE
excerpt: Claude Sonnet 5.5 是什么模型？按官方模型页核对发布日期（2026-09-28）、速度与智能定位、100 万上下文、API 价格（2 美元 / 10 美元每百万 token）、和 Sonnet 5 的区别，以及免费版能不能用。
checkedOn: 2026-10-24
sources:
  - https://platform.claude.com/docs/en/models/sonnet-5-5/overview
  - https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5
  - https://platform.claude.com/docs/en/models/overview
  - https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
  - https://claude.com/pricing
verify:
  - Sonnet 5.5 发布日期 2026-09-28、API 价格 2/10 美元、缓存读取 0.10 美元、默认 effort high，取自 2026-10-24 官方模型页与定价页
  - 「Sonnet / Haiku 在 Free 上可用」来自定价页个人套餐对比表；claude.ai 里 Sonnet 5.5 具体何时出现在免费版菜单，官方未写，以实际菜单为准
  - Sonnet 5 的 0.20 美元缓存读取、1,024 token 最小缓存取自官方模型页说明与定价页旧模型表
---

> 本文根据 Claude 官方开发者文档中的 Sonnet 5.5 模型页与「What's new」、定价页整理，资料核对于 2026-10-24。美元价格是 **API 按量计费**价格（2026-10 查询）。图为本站整理的示意图。模型更新很快，**以官方页面为准**。

## 适用于谁

- 搜「claude sonnet 5.5」「claude sonnet 5 价格」，想知道它是什么的人；
- 用免费版 Claude，想知道自己能不能用上 Sonnet 的人；
- 用 API 的开发者，从 Sonnet 5 升级到 5.5 要注意什么的人。

## 结论先说

1. **Sonnet 5.5 是当前的主力 Sonnet 模型**：官方标注「Latest」，2026 年 9 月 28 日发布，定位是「速度与智能的最佳组合」。
2. **规格**：100 万 token 上下文、最大输出 12.8 万 token、文字和图片输入、文字输出、知识截止 2026 年 6 月；API ID 是 `claude-sonnet-5-5`；相对延迟「快」。
3. **价格不变、缓存更便宜**：API 输入每百万 token 2 美元、输出 10 美元，和 Sonnet 5 相同；缓存读取降到 0.10 美元，是 Sonnet 5 的一半。
4. **免费版可以用 Sonnet**：官方定价页对比表里，Sonnet / Haiku 在 Free、Pro、Max 上都是「Yes」，只有 Opus 要付费套餐。
5. **日常用它就够**：官方的选型矩阵把它放在「日常编程、数据分析、内容创作、视觉理解、智能体工具调用」，更长更复杂的任务再看 Opus。对比见 [/guides/claude-opus-vs-sonnet](/guides/claude-opus-vs-sonnet)。

![Sonnet 5.5 比 Sonnet 5 变了什么](seed:g1047-sonnet-5-5-vs-5.png)
*图：本站根据 [Claude Sonnet 5.5 官方模型页](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) 与 [定价页](https://claude.com/pricing) 整理的示意图*

## 一、Sonnet 5.5 的官方参数

| 项目 | 官方数据（2026-10 查询） |
| --- | --- |
| API 模型 ID | `claude-sonnet-5-5` |
| 发布日期 | 2026 年 9 月 28 日 |
| 上下文窗口 | 100 万 token |
| 最大输出 | 12.8 万 token（Batch API 加 beta 头可到 30 万） |
| 输入 / 输出 | 文字和图片 → 文字 |
| 思考 | 自适应思考，默认开启 |
| 默认 effort | `high` |
| 相对延迟 | 快 |
| 知识截止 | 2026 年 6 月 |
| 退役 | 官方承诺不早于 2027 年 9 月 28 日 |

价格（每百万 token）：输入 2 美元、输出 10 美元、5 分钟缓存写入 2.50 美元、1 小时缓存写入 4 美元、缓存读取 0.10 美元；Batch API 五折。

## 二、能用在哪、谁能用

- **claude.ai 网页 / 桌面 / 手机**：在发送按钮旁的模型菜单里选；步骤见 [/guides/claude-opus-5-5-guide](/guides/claude-opus-5-5-guide) 里「怎么切到 Opus 5.5」一节，Sonnet 的位置相同；
- **套餐**：按官方定价页，Free、Pro、Max 都可以用 Sonnet；Opus 需要 Pro 及以上；Fable 在 Pro 上要用用量额度，Max 最多占每周限额的 50%。套餐对比见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)；
- **Claude Code**：用 `/model` 切换，见 [/guides/claude-code-switch-model](/guides/claude-code-switch-model)；
- **API / 云平台**：Claude API、Amazon Bedrock、Google Cloud 的 Claude 模型服务、Microsoft Foundry、AWS 上的 Claude Platform 都提供。

免费版有使用限额，具体能发多少条官方没有公布数字；额度规则见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。需要更高用量、想用 Opus 的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 三、effort 怎么设

官方 Sonnet 5.5 的说明里，**effort 的档位重新校准过**：同一个档位出来的思考量和 Sonnet 5 不一样，建议迁移后重新对比。官方给的起点是：

- 一般情况从 `high` 起步（API 默认就是 high）；
- 做智能体编程、多步工具调用：任务描述清楚的从 `medium` 起，更难、更长的任务提到 `high`；
- 聊天和对延迟敏感的场景：从 `medium` 或 `low` 起。

在 claude.ai 里设置 effort：点发送按钮旁的模型名 → Effort。官方帮助中心提示：Low 和 Medium 更省用量，更高的 effort 会更快用完额度。

## 四、从 Sonnet 5 迁移到 5.5（给开发者）

![用 Sonnet 5.5 前先确认的 5 件事](seed:g1047-sonnet-5-5-check.png)
*图：本站根据 [Claude Sonnet 5.5 官方模型页](https://platform.claude.com/docs/en/models/sonnet-5-5/overview) 与 [What's new](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5) 整理的示意图*

第一步是把模型 ID 从 `claude-sonnet-5` 改成 `claude-sonnet-5-5`。官方列出的需要检查的地方：

1. **关闭前置思考**：原来用 `thinking: {"type": "disabled"}` 的，5.5 上会返回 400，要改用 `between_tools`；它只能配合 `low`、`medium`、`high` 使用，`xhigh`、`max` 下用它会报 400；
2. **不支持强制工具调用**：`tool_choice` 设为 `any` 或指定工具会返回 400；用 `auto` 加 `strict: true` 的严格工具调用，或结构化输出；
3. **保持对话只追加不改写**：编辑了更早的历史后再带上 Sonnet 5.5 的思考块，可能返回 400；
4. **`temperature`、`top_p`、`top_k`**：设置它们会返回 400 错误；
5. **旧的 computer use 工具**：`computer_20251124` 在 Claude API 上不再接受，要换成 `computer_toolset_20260801`；
6. **advisor 工具搭配**：5.5 作执行者时，Opus 4.8、Opus 4.7、Sonnet 5 和 Haiku 5.5 不能作顾问，会返回 400。

另有一项行为变化：工具调用之间较长的说明会放进 `thinking` 块，默认设置下文字为空，需要显示的界面要设置 `display`。官方还说 Sonnet 5.5 的分词器和 Sonnet 5 相同，同样的文字 token 数一样，所以升级不会让同一段文字变贵。API 入门见 [/guides/claude-api-python-quickstart](/guides/claude-api-python-quickstart)；提示词缓存见 [/guides/claude-prompt-caching](/guides/claude-prompt-caching)。

## 常见问题

**Q：Sonnet 5.5 和 Opus 5.5 差在哪？**
官方定位不同：Sonnet 重速度与能力的平衡，API 价格是 Opus 的一半；Opus 面向长时间智能体编程和复杂工作。详细对照见 [/guides/claude-opus-vs-sonnet](/guides/claude-opus-vs-sonnet)。

**Q：Sonnet 5.5 会让免费版变好吗？**
官方页面只写了 Sonnet 在 Free 上可用，没有说明免费版菜单里具体是哪一个版本；以你菜单里实际显示的为准。

**Q：Haiku 呢？**
官方当前的 Haiku 是 Haiku 5.5，定位是高并发、低延迟的任务，API 价格 100K token 以内每百万输入 0.10 美元、输出 0.50 美元。四款对照见 [/guides/claude-models-compare](/guides/claude-models-compare)。

## 参考资料

- Claude Sonnet 5.5 模型页 — https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- What's new in Claude Sonnet 5.5 — https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5
- Claude 官方 Models overview — https://platform.claude.com/docs/en/models/overview
- Claude 官方 Choosing the right model — https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
- Claude 官方定价页 — https://claude.com/pricing
