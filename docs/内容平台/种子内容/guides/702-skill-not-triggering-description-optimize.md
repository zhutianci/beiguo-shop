---
title: Skill 不触发怎么办：description 怎么写才会被调用，附 Claude Code 排查步骤
slug: skill-not-triggering-description-optimize
products: [claude, ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: 装了 Skill 却不被调用、或者乱触发？按 Agent Skills 官方指南和 Claude Code 文档讲清触发原理、description 的四条写法、用 20 条测试问句验证触发率的方法，以及 Claude Code 里描述被截断、YAML 写错等情况的排查命令。
checkedOn: 2026-10-11
sources:
  - https://agentskills.io/skill-creation/optimizing-descriptions
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/features-overview
verify:
  - Claude Code 的 /skill-doctor、claude plugin validate、skillListingBudgetFraction 等命令和设置有最低版本要求，以官方文档为准
  - 触发率阈值 0.5、每条跑 3 次、约 20 条问句是官方给的起步建议，不是固定标准
---

> 本文根据 Agent Skills 官方指南《Optimizing skill descriptions》和 Claude Code 官方文档的 Troubleshooting 一节整理，资料核对于 2026-10-11。排查命令以 Claude Code 为例，其他工具的思路相同、命令不同。

## 适用于谁

- 搜「skill 不触发」「如何触发 skill」「skill 触发词」的人；
- Skill 明明装好了，说了相关的话 Claude 却不用它的人；
- 反过来，Skill 在不相干的任务里乱跳出来的人；
- 看到「skill descriptions were shortened to fit the skills context budget」这类提示不知道什么意思的人。

## 结论先说

1. **触发只看 description**。智能体启动时只加载每个 Skill 的名称和描述，任务和描述对得上才会去读正文。正文写得再好，描述没写清「什么时候用」也不会被调用。
2. **简单任务本来就不一定触发**。官方说明：智能体一般只在自己搞不定的任务上才去查 Skill，「读一下这个 PDF」这种一步就能完成的请求，即使描述完全匹配也可能不触发。
3. **不触发先做四件事**：确认 Skill 被发现了、检查 YAML 有没有写错、看描述有没有被截断、把描述改成「Use this skill when...」的写法。
4. **乱触发就把描述写窄**，或者关掉自动调用、只留手动调用。
5. **想认真调，就做测试集**：约 20 条问句，一半该触发一半不该触发，每条跑 3 次算触发率。

## 一、触发是怎么发生的

三步：

1. 启动时，智能体读入所有 Skill 的 `name` 和 `description`；
2. 你提出任务，智能体把任务和这些描述做匹配；
3. 匹配上了，才把对应的 `SKILL.md` 全文读进上下文并照着做。

官方的说法是：description 承担了触发的**全部**责任。

## 二、description 的四条写法

来自《Optimizing skill descriptions》：

| 原则 | 说明 |
| --- | --- |
| 用祈使句 | 写「Use this skill when...」，而不是「This skill does...」。智能体在判断要不要行动，就直接告诉它何时行动 |
| 写用户意图，不写实现 | 描述用户想达成什么，而不是 Skill 内部用了什么库、分几步 |
| 宁可主动一点 | 明确列出适用场景，包括用户没有直接说出领域名称的情况 |
| 保持简短 | 几句话到一小段；规范的硬上限是 1024 字符 |

官方给的修改前后对比：

```yaml
# 修改前
description: Process CSV files.

# 修改后
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use this
  skill when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
```

改后的版本对「做什么」更具体（统计、派生列、图表、清洗），对「什么时候用」更宽（CSV、TSV、Excel，没提关键词也算）。

## 三、Claude Code 里的排查步骤

### 1. Skill 有没有被发现

官方列的检查顺序：

1. 描述里有没有用户自然会说的关键词；
2. 问一句 `What skills are available?`，看它在不在列表里（或者输入 `/skills` 查看）；
3. 换一种更贴近描述的说法再试；
4. 直接输入 `/技能名` 手动调用，确认 Skill 本身能工作。

如果手动调用正常、自动不触发，问题就在描述或下面两项。

### 2. YAML 有没有写错

官方说明：frontmatter 的 YAML 格式不对时，Claude Code 仍会加载正文，但元数据是空的，于是 `/技能名` 能用，Claude 却没有描述可以匹配。

- 加 `--debug` 启动可以看到解析错误；
- 批量检查可以运行 `claude plugin validate .claude/skills`（项目 Skill）或 `claude plugin validate ~/.claude/skills`（个人 Skill）。官方注明这个用法需要较新的版本。

### 3. 描述是不是被截断了

Skill 装得多时会出现这个问题。官方文档的说明：

- Claude Code 把所有 Skill 的名称和描述组成一份清单放进上下文。清单**始终包含每个 Skill 的名称**，但总量超出预算时会**丢掉一部分描述**，被丢掉描述的 Skill 就失去了用来匹配的关键词；
- 预算按模型上下文窗口的 **1%** 计算；
- 超出时，从你**最少调用**的 Skill 开始丢，常用的保留完整描述；
- 每个 Skill 的 `description` 加 `when_to_use` 合计最多显示 **1,536 个字符**，超出部分截掉。

怎么查、怎么办：

| 目的 | 做法 |
| --- | --- |
| 看清单占了多少上下文、谁占得最多 | 运行 `/doctor` |
| 找出装了却从没用过的 Skill | 运行 `/skill-doctor` |
| 调大预算 | 设置 `skillListingBudgetFraction`（例如 `0.02` 即 2%），或用环境变量 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 指定固定字符数 |
| 给其他 Skill 腾地方 | 在 `skillOverrides` 里把优先级低的设为 `"name-only"`，只列名称不列描述 |
| 从源头压缩 | 精简描述，把最关键的使用场景写在最前面 |

### 4. 是不是被设成了只能手动调用

frontmatter 里有 `disable-model-invocation: true` 的 Skill，描述不会进入上下文，Claude 不会自动调用，只能你输入 `/技能名`。从别处拿来的 Skill 不触发时，记得看一眼这个字段。

## 四、乱触发怎么办

官方给的两条：

1. 把描述写得更具体。可以写明这个 Skill **不**做什么，或者说清它和相邻能力的边界；
2. 只想手动调用，就加 `disable-model-invocation: true`。有副作用的 Skill（部署、发消息）官方本来就建议这样设。

## 五、一开始照着做、后来不照做了

这是另一类问题，官方按原因分了三种：

| 现象 | 原因与办法 |
| --- | --- |
| 跳过了一条必须每次都遵守的规则 | Skill 里的话是「请求」，不是保证。把规则改成 Hook，由 Claude Code 在每次事件发生时强制执行 |
| 跳过了一条需要判断着用的建议 | Skill 内容只在调用时加载一次，之后不会重读。把措辞改成覆盖整个任务的说法，例如「每次修改后都运行测试」而不是「运行测试」 |
| 对话被压缩过 | 压缩后每个 Skill 只保留开头的一部分。重新调用一次即可恢复，并把最重要的说明放在 `SKILL.md` 靠前的位置 |

## 六、认真调：做一套触发测试

官方推荐的方法，适合要发布给别人用的 Skill。

**1. 准备约 20 条问句**，8–10 条应该触发、8–10 条不应该触发：

```json
[
  { "query": "I've got a spreadsheet in ~/data/q4_results.xlsx with revenue in col C and expenses in col D — can you add a profit margin column and highlight anything under 10%?", "should_trigger": true },
  { "query": "whats the quickest way to convert this json file to yaml", "should_trigger": false }
]
```

- 应该触发的：说法要多样，有正式有随意，有的直接点名领域、有的只描述需求；最有价值的是「Skill 能帮上忙，但从字面看不明显」的问句；
- 不应该触发的：要选**擦肩而过**的。和 Skill 共用关键词、实际需要的却是别的东西。「今天天气怎么样」这种毫不相干的问句测不出任何东西；
- 写得像真人：带文件路径、带背景（「领导让我……」）、带口语和偶尔的错别字。

**2. 每条跑 3 次，算触发率。** 模型的行为不是确定的，同一句话这次触发下次可能不触发。触发率高于 0.5 算触发。

**3. 留出验证集。** 约 60% 用来发现问题、指导修改，约 40% 只用来检验修改是否真的通用，避免把描述调成只对这几句话有效。

**4. 循环修改**，官方的提醒：

- 该触发的没触发：描述太窄，扩大范围；
- 不该触发的触发了：描述太宽，加上边界；
- **不要把失败问句里的词直接塞进描述**，那是过拟合，要找出这些问句代表的那一类情况；
- 改了几轮没进展，就换一种句式结构重写，而不是继续小修小补；
- 一般五轮足够。再不行，问题可能在测试问句本身。

**5. 选验证集通过率最高的那一版**，不一定是最后一版。

官方提到，Anthropic 的 `skill-creator` 技能可以把这套流程自动跑完；Skill 放在插件里时，Claude Code 还可以用 `claude plugin eval` 配合 `tool_used: Skill` 评分器批量测试。

## 常见问题

**Q：有没有「触发词」这种东西？**
没有固定的触发词机制。智能体是拿任务和描述做语义匹配，描述里出现用户常说的词会有帮助，但不是命中某个词就一定触发。

**Q：description 用中文写可以吗？**
规范没有语言限制。按你平时提需求的语言来写，更容易对得上。

**Q：其他工具也是这样吗？**
基于 `SKILL.md` 的工具触发原理相同：先看描述，再读正文。具体的查看命令和截断规则各家不同，例如 Codex 的文档写的是清单最多占上下文窗口的 2%，装得多时先缩短描述。

**Q：个人 Skill 文件夹不见了？**
Claude Code 文档有专门一节：先看 `~/.claude/skills/.trash/` 里有没有，把文件夹移回 `~/.claude/skills/` 即可恢复；回收目录里的内容默认 30 天后清理。

## 参考资料

- Optimizing skill descriptions（Agent Skills 官方）：https://agentskills.io/skill-creation/optimizing-descriptions
- Extend Claude with skills · Troubleshooting（Claude Code 官方）：https://code.claude.com/docs/en/skills
- Extend Claude Code（Claude Code 官方）：https://code.claude.com/docs/en/features-overview
