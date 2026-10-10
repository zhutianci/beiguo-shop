---
title: 怎么给开源项目提第一个 PR 提示词（读懂贡献指南、挑 good first issue、写 PR 描述）
slug: open-source-first-pr
model: any-llm
topics: [coding, learning]
needsRefImage: false
useCase: 想参与开源但不知道从哪里下手，或者已经改好了代码不知道怎么提交时用：把项目的贡献指南和你想做的问题给 AI，它帮你判断问题是否适合新人、列出提交前的检查项、起草问题评论和 PR 描述，提高被合并的概率。
prompt: |
  我想给一个开源项目提交第一个 Pull Request，请你作为有经验的开源维护者指导我。

  - 项目名称与仓库地址：[项目仓库]
  - 项目的贡献指南（CONTRIBUTING 文件或 README 中的相关部分，原文粘贴）：
    [粘贴贡献指南]
  - 我感兴趣的问题（issue 标题、描述和讨论）：
    [粘贴 issue 内容]
  - 我的技术背景：[如熟悉 Python，第一次参与开源]
  - 当前进度：[还没开始/已经改好代码]

  请按顺序帮我：
  1. 读贡献指南，提炼出我必须遵守的规则：是否需要先认领问题、分支命名、提交信息格式、是否要求签署贡献者协议或在提交中添加签名、代码风格与检查命令、测试要求、文档要求。
  2. 评估这个问题是否适合我：难度、需要了解的模块、是否已经有人在做（看讨论里的认领情况）、维护者是否认可这个方向。不适合时，告诉我怎么找更合适的问题。
  3. 如果需要先在问题下留言，帮我写一段简短、礼貌的英文留言，说明我打算怎么做、并询问维护者意见。
  4. 给出从复刻仓库到提交的操作步骤，包括与上游保持同步的方法。
  5. 提交前检查清单：只改与问题相关的内容（不顺手格式化无关文件）、通过项目的检查和测试、补充或更新测试、更新文档或变更记录（如果项目要求）。
  6. 起草 PR 标题和描述（英文，附中文翻译）：关联的问题编号、改了什么、为什么这样改、如何验证、需要维护者特别关注的地方。
  7. 收到评审意见后怎么回应和更新，以及长时间没人回复时如何礼貌地提醒。

  贡献指南里没有提到的规则，不要编造，标注「贡献指南未说明，可参考同仓库最近被合并的 PR」。
negativePrompt: null
source: null
verify:
  - 拿一个真实开源项目的 CONTRIBUTING 文件跑一次，检查提炼的规则是否与原文一致、没有编造
---
**怎么填变量**：[粘贴贡献指南] 是最重要的输入，每个项目的规则差别很大：有的要求先讨论再写代码，有的要求每次提交都带签名，有的要求更新变更记录。把原文完整贴进去，避免 AI 按「一般惯例」猜。

**常见坑**：
- 没看清讨论就直接动手，结果别人已经在做，或者维护者早就说过不打算这样改。先在问题下留言确认方向。
- PR 里夹带大量无关修改（编辑器自动格式化了整个文件），维护者很难评审，往往直接被要求拆分。
- PR 描述只写「fix bug」。写清楚改了什么、为什么、怎么验证，能显著缩短评审时间。

**追问技巧**：收到评审意见后，把意见原文和你的修改贴回来，问「我的修改是否回应了每一条意见，回复怎么写比较得体」。

### 示例输出

> 示例，仅供参考（PR 描述节选）

```markdown
## Fix incorrect timezone in exported CSV timestamps

Closes #1234

### What
Export now converts timestamps to the user's configured timezone instead of UTC.

### Why
Users reported that exported times were off by several hours (see discussion in #1234).

### How to test
1. Set timezone to Asia/Shanghai in settings
2. Export any report
3. Timestamps should match the values shown in the UI

Added a unit test in `tests/test_export.py` covering non-UTC timezones.
```

中文：修复导出 CSV 时间戳时区错误。导出时改为按用户设置的时区转换，并新增了非 UTC 时区的单元测试。
