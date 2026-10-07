---
title: Claude 模型有哪些、有什么区别：Opus、Sonnet、Haiku 怎么选（2026）
slug: claude-models-compare
products: [claude]
models: [claude-llm]
accountTier: PLUS
excerpt: 2026 年 10 月 Claude 有哪些模型？Fable 5.1、Opus 5.5、Sonnet 5.5、Haiku 4.5 分别适合什么，上下文、输出长度、API ID 对照，claude.ai 各套餐能用哪些模型，以及 effort（推理强度）怎么配合选择。
checkedOn: 2026-10-07
sources:
  - https://platform.claude.com/docs/en/models/overview
  - https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
  - https://platform.claude.com/docs/en/about-claude/model-deprecations
  - https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
  - https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
  - https://support.claude.com/en/articles/15363606-why-claude-switched-models-in-your-conversation-with-fable-5-or-fable-5-1
  - https://claude.com/pricing
verify:
  - 模型阵容、上下文与输出长度、退役时间取自 2026-10 官方 Models overview，新模型发布后需更新
  - Haiku 4.5 官方标注「退役不早于 2026-10-15」，上线时确认是否已有替代型号
---

> 本文根据 Claude 官方开发者文档（Models overview、Choosing a model）和帮助中心整理，核对日期 2026-10-07。模型更新很快，以官方 Models overview 页面为准。

## 适用于谁

- 打开 Claude 的模型菜单，看到 Fable、Opus、Sonnet、Haiku 不知道选哪个的人；
- 搜「claude 模型有哪些」「opus 和 sonnet 的区别」「claude fable 是什么」的人；
- 用 API 开发、需要知道模型 ID 和上下文长度的开发者。

## 结论先说

1. **当前主力四款**（2026-10）：**Fable 5.1**（能力最强，适合高难度推理和长时间智能体任务）、**Opus 5.5**（官方推荐的默认起点，长时间编程和知识工作）、**Sonnet 5.5**（速度与智能的最佳平衡）、**Haiku 4.5**（最快最便宜）。
2. 官方的选型建议很直接：**拿不准就先用 Opus 5.5**；在 Opus 5.5 调到更高推理强度仍不够时，再上 Fable 5.1。
3. **调推理强度（effort）往往比换模型更有效**：同一个模型可以在 low / medium / high / xhigh / max 之间调，用速度和成本换智能。
4. claude.ai 上：**Free 只能用 Sonnet 和 Haiku**；Pro 加上 Opus；Fable 在 Pro 上要用付费的用量额度（usage credits），在 Max 上可用到每周额度的 50%。
5. 所有当前模型都支持文字和图片输入、文字输出、多语言、视觉理解和工具调用。

## 一、四款主力模型对照（官方数据）

| | Fable 5.1 | Opus 5.5 | Sonnet 5.5 | Haiku 4.5 |
| --- | --- | --- | --- | --- |
| 定位 | 高难度推理、长时间智能体任务 | 长时间智能体编程与知识工作 | 速度与智能的最佳平衡 | 最快，接近前沿的智能 |
| 相对速度 | 较慢 | 中等 | 快 | 最快 |
| 上下文窗口 | 100 万 token | 100 万 token | 100 万 token | 20 万 token |
| 最大输出 | 12.8 万 token | 12.8 万 token | 12.8 万 token | 6.4 万 token |
| 思考方式 | 自适应思考（始终开启） | 自适应思考（始终开启） | 自适应思考 | 扩展思考 |
| API 默认 effort | high | medium | high | 不支持 |
| 可靠知识截止 | 2026 年 6 月 | 2026 年 6 月 | 2026 年 6 月 | 2025 年 2 月 |
| Claude API ID | `claude-fable-5-1` | `claude-opus-5-5` | `claude-sonnet-5-5` | `claude-haiku-4-5-20251001` |

官方换算：100 万 token 大约相当于 55.5 万个英文单词（按当前分词器）。API 的具体单价见官方定价页，大致规律是 Fable > Opus > Sonnet > Haiku；批量处理（Batch API）打五折，读取提示词缓存只收基础输入价的一小部分。

**仍可用的旧模型**：Fable 5、Opus 5、Opus 4.8、Opus 4.7、Opus 4.6、Opus 4.5、Sonnet 5、Sonnet 4.6。更早的模型（如 Opus 4、Sonnet 4、Haiku 3.5）已在 Claude API 上退役。每个模型的退役时间见官方 Model deprecations 页；例如 Haiku 4.5 标注为「不早于 2026 年 10 月 15 日」退役，用它做产品的要留意。

另外还有 **Mythos 5.1 / Mythos 5**：官方说明它们和 Fable 能力相同，但只向通过 Anthropic 验证计划（如网络安全验证计划）的组织开放。

## 二、怎么选：官方的选型矩阵

| 你需要 | 建议从这个开始 | 典型场景 |
| --- | --- | --- |
| 能力最强 | Fable 5.1 | 连续运行数小时的智能体、多步骤深度研究、一路做到成品文档 / 表格 / 演示稿 |
| 复杂的智能体编程和企业工作 | Opus 5.5 | 多小时自主编程、大规模重构、复杂系统工程、大量看图的工作流、电脑操作（computer use） |
| 日常编程、智能体和企业工作的速度与能力兼顾 | Sonnet 5.5 | 写代码、数据分析、内容创作、图像理解、工具调用 |
| 最低延迟和价格 | Haiku 4.5 | 实时应用、大批量处理、对成本敏感的部署、子代理任务 |

官方给了两种起步思路：

- **效率优先**：先用 Haiku 4.5 做，测试够不够用，不够再升级。适合原型开发、对延迟敏感、成本敏感、大量简单任务；
- **能力优先**：先用 Opus 5.5 做到效果满意，再通过降低 effort 或换小模型来优化成本；Opus 5.5 在 xhigh / max 仍达不到要求时，换 Fable 5.1。适合复杂推理、科学数学、需要细致理解、准确性比成本更重要的场景。

还可以**组合使用**：用便宜的模型干大部分活，遇到难题时请教前沿模型（advisor 模式），或者由强模型调度、小模型执行。

## 三、推理强度（effort）：同一个模型也能「换挡」

在 claude.ai 里，点发送按钮旁的模型名 → **Effort** 就能选档位；官方建议：

- **Low / Medium**：日常任务，更省额度；
- **High**：质量与速度的最佳平衡；
- **Extra high（xhigh）**：长时间编程和智能体任务，比 high 想得更深但没有 max 那么费（Opus 4.7 及更新的模型可用）；
- **Max**：最彻底，适合最需要深度推理的任务。

档位越高回答越慢、消耗越多，额度也用得越快。帮助中心说明：Sonnet 5.5、Opus 5.5、Fable 5.1、Opus 5 在 Claude 里**不能关闭思考**。

## 四、claude.ai 各套餐能用哪些模型

| 模型 | Free | Pro | Max 5x / 20x |
| --- | --- | --- | --- |
| Haiku | ✓ | ✓ | ✓ |
| Sonnet | ✓ | ✓ | ✓ |
| Opus | — | ✓ | ✓ |
| Fable | — | 用量额度（按量付费） | 最多每周额度的 50% |

（来源：claude.com/pricing 与帮助中心《Claude Fable models on your plan》。）

关于 Fable 的补充：

- Max、Team 高级席位、旧版按席位 Enterprise 的高级席位：Fable 是套餐标准内容，最多可用每周额度的 50%，而且消耗额度比其他模型快；超出后可以用用量额度继续，或换回其他模型；
- Pro、Team 标准席位：Fable 不在套餐额度内，从一开始就按用量额度付费；
- 网页版、桌面版、手机版在模型菜单里选「Fable 5.1」即可；Claude Code 里用 `/model fable`。

帮助中心还提醒：由于 Fable 能力很强，官方为它配置了安全防护，在网络安全、生物等少数领域的请求可能被拦截，对话会**自动切换到其他 Claude 模型**继续。

额度怎么算详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》；各套餐功能对比详见本站《Claude Free、Pro、Max 有什么区别：套餐功能对比（含 Team / Enterprise）》。

## 五、在不同地方怎么切换模型

- **claude.ai 网页 / 桌面 / 手机**：点发送按钮旁的模型名切换，「More models」里有更多选项；对话中途可以随时换，从下一条回复开始生效；
- **Claude Code**：`/model` 命令，详见本站《Claude Code 切换模型：/model 命令、模型别名、effort 与 fast 模式》；
- **API**：在请求里填模型 ID，详见本站《Claude API Python 入门：安装 SDK、第一个请求、流式输出与多轮对话》。

## 常见问题

**Q：Opus 和 Sonnet 到底差多少？**
官方定位上，Opus 5.5 面向长时间、复杂的智能体编程和知识工作，Sonnet 5.5 是速度和智能的最佳平衡、更快更便宜。日常写作、写代码 Sonnet 足够；大型项目、复杂推理用 Opus。最可靠的办法是拿你自己的真实任务各试几次。

**Q：Fable 是什么？比 Opus 强多少？**
官方称 Fable 5.1 是「向所有客户开放的能力最强的模型」，适合连续数小时的智能体任务、深度研究和一路做到成品的分析工作。代价是更慢、更贵，在 Pro 上需要额外付费的用量额度。

**Q：为什么我看不到 Opus / Fable？**
Free 套餐不含 Opus 和 Fable；企业账号可能被管理员关闭了某些模型。需要订阅的话可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：模型 ID 里为什么有的带日期有的不带？**
官方说明从 4.6 这一代开始改用不带日期的 ID，每个 ID 都是固定快照；更早的模型用带日期的 ID，另有不带日期的别名指向它。

## 参考资料

- Models overview（官方）：https://platform.claude.com/docs/en/models/overview
- Choosing a model（官方）：https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
- Model deprecations（官方）：https://platform.claude.com/docs/en/about-claude/model-deprecations
- Claude Fable models on your plan（帮助中心）：https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
- Change the model, effort, and thinking settings（帮助中心）：https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
- 套餐对比（官方）：https://claude.com/pricing
