---
title: Claude Opus 5.5 是什么、怎么用、API 价格（2026 年 10 月）
slug: claude-opus-5-5-guide
products: [claude]
models: [claude-llm]
accountTier: PRO
excerpt: Claude Opus 5.5 是什么模型？按官方模型页核对发布日期、定位、100 万上下文、API 价格（4 美元 / 20 美元每百万 token）、和 Opus 5 的区别，以及在 claude.ai 里怎么切换、哪些套餐能用。
checkedOn: 2026-10-24
sources:
  - https://platform.claude.com/docs/en/models/opus-5-5/overview
  - https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5
  - https://platform.claude.com/docs/en/models/overview
  - https://claude.com/pricing
  - https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
verify:
  - Opus 5.5 发布日期 2026-09-22、API 价格 4/20 美元、缓存读取 0.20 美元、默认 effort medium，均取自 2026-10-24 官方模型页与定价页
  - Opus 5 的 5/25 美元、0.50 美元缓存读取取自定价页「Legacy models」表
  - 「Free 不能用 Opus，Pro / Max 可以」来自定价页对比表；套餐具体用量官方未公开
---

> 本文根据 Claude 官方开发者文档中的 Opus 5.5 模型页与「What's new」、定价页和帮助中心整理，资料核对于 2026-10-24。美元价格是 **API 按量计费**价格（2026-10 查询）。图为本站整理的示意图。模型更新很快，**以官方页面为准**。

## 适用于谁

- 搜「claude opus 5.5」「claude opus 5 价格」，想弄清它是什么的人；
- 已有 Pro 或 Max，想知道 Opus 5.5 在哪里选、要不要调设置的人；
- 用 API 的开发者，想知道价格和从 Opus 5 迁移要注意什么的人。

## 结论先说

1. **Opus 5.5 是 Claude 当前的主力 Opus 模型**：官方模型页标注「Latest」，2026 年 9 月 22 日发布，定位是「长时间运行的智能体编程和知识工作」。
2. **规格**：100 万 token 上下文、最大输出 12.8 万 token、文字和图片输入、文字输出、知识截止 2026 年 6 月；API 模型 ID 为 `claude-opus-5-5`。
3. **API 价格比 Opus 5 便宜**：输入每百万 token 4 美元、输出 20 美元（Opus 5 是 5 美元和 25 美元）；缓存读取 0.20 美元，批量处理五折。
4. **claude.ai 里怎么用**：点发送按钮旁的模型名选 Opus 5.5。按官方定价页，**免费版没有 Opus**，Pro 和 Max 都有。需要开通的，可以看 [/chongzhi/claude-pro](/chongzhi/claude-pro)；用量大、Claude Code 用得多的，可以看 [/chongzhi/claude-max](/chongzhi/claude-max)。
5. **注意两处默认值变化**：API 默认 effort 从 Opus 5 的 `high` 变成 `medium`；思考始终开启，不能关。

![Opus 5.5 比 Opus 5 变了什么](seed:g1046-opus-5-5-vs-5.png)
*图：本站根据 [Claude Opus 5.5 官方模型页](https://platform.claude.com/docs/en/models/opus-5-5/overview) 与 [定价页](https://claude.com/pricing) 整理的示意图*

## 一、Opus 5.5 的官方参数

| 项目 | 官方数据（2026-10 查询） |
| --- | --- |
| API 模型 ID | `claude-opus-5-5` |
| 发布日期 | 2026 年 9 月 22 日 |
| 上下文窗口 | 100 万 token |
| 最大输出 | 12.8 万 token（Batch API 加 beta 头可到 30 万） |
| 输入 / 输出 | 文字和图片 → 文字 |
| 思考 | 自适应思考，始终开启 |
| 默认 effort | `medium` |
| 相对延迟 | 中等 |
| 知识截止 | 2026 年 6 月 |
| 退役 | 官方承诺不早于 2027 年 9 月 22 日 |

价格（每百万 token）：输入 4 美元、输出 20 美元、5 分钟缓存写入 5 美元、1 小时缓存写入 8 美元、缓存读取 0.20 美元；Batch API 输入输出五折。另外，Opus 5.5 有「快速模式」：官方定价页写的是标准价格 2 倍、速度最高约 2.5 倍，只在 API 上提供。

官方说它可以在 Claude API、Amazon Bedrock、Google Cloud 上的 Claude 模型服务、Microsoft Foundry、AWS 上的 Claude Platform 使用。

## 二、它擅长什么

官方给出的方向是「长时间运行的智能体编程和知识工作」。在官方的选型矩阵里，Opus 5.5 对应的场景包括：数小时自主运行的编程智能体、大规模重构、复杂系统工程、视觉密集型的工作流和 computer use。官方「What's new」还提到一项行为变化：它读取图表、示意图和截图里的数值比之前**精确得多**，不用工具也能读懂较密的图。

官方也明确：如果 Opus 5.5 在更高 effort 下仍然不够，下一步是 Fable 5.1，那是更强但更慢、更贵的模型。四款模型的对照见 [/guides/claude-models-compare](/guides/claude-models-compare)，Opus 和 Sonnet 怎么选见 [/guides/claude-opus-vs-sonnet](/guides/claude-opus-vs-sonnet)。

## 三、在 claude.ai 里怎么切到 Opus 5.5

![在 claude.ai 里切到 Opus 5.5 的步骤](seed:g1046-switch-to-opus-5-5.png)
*图：本站根据 [Claude 帮助中心：Change the model, effort, and thinking settings](https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings) 整理的示意图*

1. 开一个新对话，或者打开已有对话；
2. 点发送按钮旁边显示的模型名；
3. 选 Opus 5.5；菜单里没有，就点「More models」；
4. 需要时再设 Effort：点模型名，点 Effort，选一个级别（Low、Medium、High、Extra high、Max），菜单会把每个模型的推荐档标成「Default」。

帮助中心还说明：模型、effort 和思考设置**可以在对话中途随时更改，从 Claude 的下一条回复起生效**；在 Enterprise 套餐里，管理员可能关闭某些模型或 effort 级别。**Opus 5.5 和 Fable 5.1 的思考在所有 effort 级别下都是始终开启的**，没有开关。更高的 effort 会消耗更多 token，更快碰到用量限额，额度的规则见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

在 Claude Code 里用 `/model` 切换，见 [/guides/claude-code-switch-model](/guides/claude-code-switch-model)。

## 四、从 Opus 5 迁移到 Opus 5.5（给开发者）

官方「What's new」列出了会让旧代码报错的几处改动，直接改代码前先看一下：

- **思考不能关**：`thinking: {"type": "disabled"}` 或手动 `budget_tokens` 会返回 400 错误；不传 `thinking` 字段，或传 `adaptive`，效果相同。想要更快更省，调低 effort；
- **不支持强制工具调用**：`tool_choice` 设为 `any` 或指定某个工具会返回 400 错误；`auto`（默认）和 `none` 可用；需要结构化结果时，官方建议用 `strict: true` 的严格工具调用或结构化输出；
- **思考块和模型、对话绑定**：思考块会记录是哪个模型产生的，换到不能读取它的模型后，API 会把这些块丢掉（请求不会失败，被丢的块不计费）；
- **旧的 `computer_20251124` 工具**：在 Claude API 上不再接受，要换成 `computer_toolset_20260801`；
- **默认 effort 改为 `medium`**：之前是 `high`，需要的话显式设置；
- **工具调用之间的文字**会放进 `thinking` 块，默认显示设置下文字为空，界面如果要显示这些进度文字，需要设置 `display`。

迁移的第一步只是把模型 ID 从 `claude-opus-5` 改成 `claude-opus-5-5`；完整清单见官方 [Migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide)。API 的入门见 [/guides/claude-api-python-quickstart](/guides/claude-api-python-quickstart)。

## 常见问题

**Q：Opus 5.5 比 Opus 5 更强吗？**
官方的口径是 5.5 更便宜（输入和输出价格都降了约两成）并带来了几项行为变化，同一 effort 下它倾向于**想得更多**，尤其在 xhigh 和 max。具体表现因任务而异，官方建议迁移后重新跑一遍自己的 effort 对比。

**Q：我用的是订阅，价格跟我有关吗？**
没有直接关系。订阅按套餐用量，不按 token 计费；价格是给 API 用户的。

**Q：Pro 够用吗？**
Pro 有 Opus。如果经常碰到限额，可看 [/guides/claude-pro-vs-max-difference](/guides/claude-pro-vs-max-difference)。

**Q：为什么提示里说「Claude 切换了模型」？**
官方为 Fable 等较强模型配置了安全防护，个别领域的请求可能自动切换到别的模型，详见 [/guides/claude-models-compare](/guides/claude-models-compare)。

## 参考资料

- Claude Opus 5.5 模型页 — https://platform.claude.com/docs/en/models/opus-5-5/overview
- What's new in Claude Opus 5.5 — https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5
- Claude 官方 Models overview — https://platform.claude.com/docs/en/models/overview
- Claude 官方定价页 — https://claude.com/pricing
- Claude 帮助中心：Change the model, effort, and thinking settings — https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
