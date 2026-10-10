---
title: 用 AI 重构代码：先补测试、小步修改、逐步验证的安全流程与提示词
slug: ai-refactor-code-safely
products: [ai-tools, cursor]
models: []
accountTier: FREE
excerpt: AI 重构代码怎么不翻车？按 GitHub Copilot Cookbook、Cursor 与 Claude Code 官方文档整理出六步流程：先弄懂现状、用测试锁住行为、先出方案、小步提交、每步都跑检查、用检查点和 worktree 兜底；附重构提示词与常见翻车原因。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/tutorials/copilot-cookbook/refactor-code/improve-code-readability
  - https://cursor.com/learn/understanding-your-codebase
  - https://cursor.com/learn/reviewing-testing
  - https://cursor.com/docs/agent/plan-mode
  - https://cursor.com/docs/agent/overview
  - https://code.claude.com/docs/en/best-practices
  - https://kiro.dev/docs/specs/bugfix-specs
verify:
  - 文中的提示词除标注为官方示例者外均为自拟
  - 各工具的检查点 / worktree 功能名称与入口不同，以各自文档为准
---

> 本文根据 GitHub 官方 Copilot Chat Cookbook 的重构章节、Cursor 官方教程和 Claude Code 官方最佳实践整理，资料核对于 2026-10-11。「重构」在这里指不改变外部行为、只改善内部结构的修改。

## 适用于谁

- 接手了一份没人敢动的老代码，想借 AI 之力整理的人；
- 搜「ai 重构代码」「ai 重构代码提示词」的人；
- 让 AI 重构过一次，结果行为悄悄变了、或者改出一个审不动的巨型 diff 的人。

## 结论先说

1. 重构的定义就是**行为不变**。所以第一件事不是让 AI 动手，而是**用测试把现在的行为锁住**。
2. **先理解、再计划、后动手**。Cursor 官方把「没弄懂现状就让智能体改」称为常见的失败模式：它可能新建一个已经存在的工具函数，或用一种和代码库不一致的写法。
3. **一次只做一种重构**，每一步都能独立通过测试、独立提交。
4. 写清「**什么不能变**」。Kiro 的 Bugfix Spec 把「不应改变的行为」单独列成一项，是同一个思路。
5. 留好退路：Git 提交、工具的检查点、独立的 worktree。
6. 做不对时别硬修：**撤销 → 把方案写得更具体 → 重来**。

## 六步流程

### 第一步：先让它讲清现状

用只读的方式开始（Cursor 的 Ask 模式、Cline / Claude Code / Devin Desktop 的 Plan 模式），它就不会顺手改东西：

```text
先不要修改任何文件。阅读 src/order/ 目录，告诉我：
1. 下单流程经过哪些函数，画一个调用顺序；
2. 哪些地方有重复逻辑；
3. 项目里已经有哪些公共工具函数是这里本该复用的；
4. 哪些函数被目录外的代码调用（改它们的签名会影响别处）。
```

Cursor 官方给的同类提示词是：「在做任何修改之前，先给我看现有的表单校验是怎么工作的，用了什么模式，共享的校验器在哪。」

### 第二步：用测试锁住行为

```text
在重构之前，为 calculateOrderTotal 补「特征测试」：不评判现在的行为对不对，
只把它现在对各种输入的输出记录下来，包括边界值。运行并确认全部通过。
不要修改业务代码。
```

如果你发现现有行为里有 bug，**记下来，另开一个任务修**。重构和修 bug 混在一起，出了问题就分不清是哪一步引起的。写测试的细节见[《用 AI 写单元测试》](/guides/ai-write-unit-tests-workflow)。

### 第三步：让它先出方案

涉及多个文件的重构，用 Plan 模式。Cursor 官方对 Plan 模式的适用场景描述正好对应重构：任务涉及很多文件或系统、有多种可行做法、想先审一下思路。

```text
目标：把 src/order/ 里三处重复的折扣计算合并成一个函数。
约束：
- 对外导出的函数签名不变
- 不引入新依赖
- 不改数据库结构
请给出分步方案，每一步都要能单独通过测试、单独提交。先不要实现。
```

看方案时重点看两处：步骤是不是够小；有没有它没提到、但你知道会受影响的调用方。

### 第四步：小步执行

按方案一步一步来，而不是「全部执行」：

```text
执行方案的第 1 步。完成后运行测试和类型检查，把结果贴给我，然后停下等我确认。
```

每一步确认没问题就提交一次。Cursor 官方建议用小而语义清晰的提交——评审的人可以沿着提交历史一步步看，而不是面对一整面墙的改动。

### 第五步：每步都跑三种检查

Cursor 官方列的三种可验证信号，重构时全都用得上：

- **测试**：行为有没有变；
- **类型检查**：改了签名后有没有漏改的调用方；
- **lint**：风格和模式有没有走样。

Claude Code 官方还有一条：让它**拿出证据**（测试输出、执行的命令和返回），而不是只说一句「完成了」。

### 第六步：留好退路

| 手段 | 作用 | 说明 |
| --- | --- | --- |
| Git 提交 | 永久的回退点 | 开工前先提交一次干净的状态 |
| 检查点 | 撤销智能体刚才的改动 | Cursor 的 Checkpoints 存在本地、与 Git 无关，官方说只用于撤销智能体改动 |
| worktree | 在独立目录里重构，不影响主工作区 | Claude Code、Cursor、Devin Desktop 都支持，见[《Claude Code worktree 怎么用》](/guides/claude-code-worktree) |

## 常见的小型重构与提示词

下面前三条的场景和提示词思路来自 GitHub 官方 Cookbook《Improving code readability and maintainability》，做法都是**先在编辑器里选中要改的函数**再提要求：

| 重构 | 提示词 |
| --- | --- |
| 改善命名 | `改进这个函数里的变量名和参数名，让用途一目了然。不要改逻辑。` |
| 消除一长串 if / else | `简化这段代码，不要用 if/else 链，但所有返回值保持不变。`（官方示例里 Copilot 建议改用字典做映射） |
| 减少嵌套 | `重写这段代码，去掉嵌套的 if/else。`（常见做法是提前返回） |
| 拆分大函数 | `把这个 200 行的函数拆成几个职责单一的小函数，对外的函数签名和行为不变。` |
| 去重复 | `找出这个目录里重复的逻辑，提取成公共函数；先列出重复的位置，等我确认再改。` |
| 换写法 | `把这个文件里的回调写法改成 async/await，逐个函数改，每改一个跑一次测试。` |

GitHub 的 Cookbook 里还有针对性能优化、设计模式、数据访问层、横切关注点、继承层次简化、跨语言翻译的重构示例，可以按需查阅。

## 大型重构怎么办

- **拆成多个 PR**。按模块、按步骤拆，每个 PR 都能独立上线。
- **把计划写成文件**。Cursor、Devin Desktop 的 Plan 模式都会生成 Markdown 计划文件，可以在新会话里引用它继续，避免长对话把上下文撑满。
- **规则先行**。把新的写法约定写进规则文件或 `AGENTS.md`。TRAE 官方文档提醒过一个现象：项目里已有大量不合规范的代码时，模型可能沿用旧风格而不是新规则，建议明确告诉它当前任务是「重构」，并要求严格遵循新规则。
- **可以交给云端智能体的部分**。Cursor 官方把「重构」列为适合云端智能体的任务之一——前提是有测试能验证结果。

## 为什么会翻车

**行为变了没发现**。没有测试，或者测试是重构之后才让 AI 补的——那时测试只会记录新行为。

**diff 太大**。一句「重构这个模块」换来两千行改动，谁都审不动。永远给出范围和步骤。

**顺手做了别的**。它把格式化、改名、升级依赖一起做了。在指令里写明「只做这一件事，不要顺手修改无关代码」。

**重复造轮子**。没让它先了解现有的公共函数。

**在同一个长对话里反复修**。Cursor 官方的建议：与其一轮轮追着修，不如回到计划，把要求写得更具体再跑一次，通常更快、结果更干净。Claude Code 官方也建议做完一件事就清空上下文。

## 常见问题

**Q：没有测试的老项目也能让 AI 重构吗？**
先补特征测试（第二步），哪怕只覆盖要动的那几个函数。完全没有验证手段时，只做风险最低的重构：改名、提取常量、格式整理，并逐个看 diff。

**Q：让它一次把全项目的某种写法都改掉可以吗？**
机械性的批量修改可以，但要分批：先在一个目录试，确认无误后再推广；每批跑一次全量检查。

**Q：重构后要不要再让 AI 审一遍？**
要，而且用新会话或专门的审查功能。见[《AI 代码审查怎么做》](/guides/ai-code-review-workflow)。

## 参考资料

- Improving code readability and maintainability（GitHub 官方 Copilot Chat Cookbook）：https://docs.github.com/en/copilot/tutorials/copilot-cookbook/refactor-code/improve-code-readability
- Understanding your codebase（Cursor 官方教程）：https://cursor.com/learn/understanding-your-codebase
- Reviewing and testing code（Cursor 官方教程）：https://cursor.com/learn/reviewing-testing
- Plan Mode（Cursor 官方）：https://cursor.com/docs/agent/plan-mode
- Best practices（Claude Code 官方）：https://code.claude.com/docs/en/best-practices
