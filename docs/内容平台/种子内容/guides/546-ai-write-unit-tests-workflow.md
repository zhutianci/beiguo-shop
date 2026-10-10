---
title: 用 AI 写单元测试：让 Cursor、Copilot、Claude Code 生成测试用例的流程与提示词
slug: ai-write-unit-tests-workflow
products: [ai-tools, github-copilot]
models: []
accountTier: FREE
excerpt: AI 写测试用例怎么才靠谱？按 GitHub Copilot、Cursor、Claude Code 官方文档整理出五步流程：先让它列场景、照着项目已有测试写、运行并修复、你来核对断言、补回归测试；附 8 条可复制提示词和「测试全绿但没用」的排查。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/tutorials/copilot-cookbook/testing-code/generate-unit-tests
  - https://cursor.com/learn/reviewing-testing
  - https://code.claude.com/docs/en/best-practices
  - https://cursor.com/docs/agent/overview
verify:
  - Copilot Chat 的 /tests 斜杠命令在各 IDE 中的可用性以官方文档为准
  - 文中的提示词除标注「官方示例」者外均为自拟
  - 示例代码仅用于说明，不代表任何官方输出
---

> 本文根据 GitHub 官方的 Copilot Chat Cookbook《Generating unit tests》、Cursor 官方教程《Reviewing and testing code》和 Claude Code 官方最佳实践整理，资料核对于 2026-10-11。方法不限工具，换成 Trae、Cline、Codex 同样适用。

## 适用于谁

- 知道该写测试但一直没时间写的人；
- 搜「ai 写单元测试」「ai 写测试用例」的人；
- 让 AI 写过测试，结果要么跑不起来、要么全绿却什么都没测到的人。

## 结论先说

1. **写测试是 AI 最划算的用法之一**。Cursor 官方的说法：过去补齐测试很费力，多数团队出了事才补；智能体让写测试变得容易得多——你让它写，再核对它写得对不对。
2. **测试也是你给 AI 的「验证信号」**。Claude Code 官方最佳实践的第一条就是给它一个能自己运行的检查；有了测试，它才能自己发现改坏了。
3. 正确的顺序是：**先列场景 → 再写 → 让它自己跑 → 你核对断言**。直接说「给这个文件加测试」效果最差。
4. **让它照着项目里已有的测试写**，框架、目录、命名、mock 方式都跟现有的一致。
5. AI 生成的测试要防一种失败：**为了通过而写**——断言照抄了当前实现的行为，包括 bug。

## 五步流程

### 第一步：先让它列要测什么

不要一上来就要代码。先让它把场景列出来，你删改确认：

```text
先不要写代码。阅读 src/services/pricing.ts 里的 applyDiscount 函数，
列出应该测试的场景：正常情况、边界值、非法输入、和其他折扣叠加的情况。
每个场景一行，写明输入和期望结果。
```

Cursor 官方给的同类提示词是「规划一下怎么给结账流程做端到端覆盖，应该测哪些场景？」和「现有测试没覆盖到这个功能的哪些边界情况？」。这一步花的 token 很少，却决定了测试的质量。

### 第二步：指定范围和风格，让它写

Claude Code 官方对比过两种写法：「给 foo.py 加测试」是差的；「给 foo.py 写一个测试，覆盖用户已登出的边界情况，不要用 mock」是好的。把范围、要覆盖的情况、限制都说清：

```text
按上面确认的场景，为 applyDiscount 写单元测试。
- 参照 src/services/__tests__/cart.test.ts 的结构和命名方式
- 用项目已有的 vitest，不要引入新的测试库
- 不要 mock 被测函数本身；只 mock 外部的网络请求
- 每个测试只验证一件事，测试名写成「在……情况下应该……」
```

GitHub 官方的最小示例是在 Copilot Chat 里选中函数后输入：

```text
/tests Generate unit tests for this function. Validate both success and failure, and include edge cases.
```

也就是「成功和失败都要验证，并包含边界情况」。官方说明 Copilot 会先给出测试策略，再给出测试代码；第一次使用时它可能会问你要不要为项目配置测试框架。

### 第三步：让它自己运行并修到通过

在 Agent 模式下，把「运行」写进指令：

```text
写完后运行这些测试。如果失败，先判断是测试写错了还是被测代码有 bug：
测试写错了就改测试；如果你认为是代码的 bug，停下来告诉我，不要改业务代码。
```

最后一句很关键。不加的话，它可能为了让测试变绿去改业务逻辑，或者反过来把断言改成当前的错误行为。

### 第四步：你来核对断言

这一步不能省。逐个看：

- **期望值是从需求来的，还是从代码抄的？** 比如需求是「满 100 减 20」，测试里却断言 99 元也减了 20——那是把 bug 固化成了测试。
- **有没有真的断言？** 只调用函数、不检查结果的测试永远通过。
- **是不是 mock 得太多？** 把被测逻辑本身都 mock 掉，测的就只是 mock。
- **边界值在不在？** 0、负数、空字符串、空数组、最大值、刚好等于阈值的那个数。

一个快速验证办法：**故意把业务代码改错一处**（比如把 `>` 改成 `>=`），重新跑测试。如果测试仍然全绿，说明这组测试没有测到这个逻辑。验证完记得改回来。

### 第五步：修 bug 时先写一个失败的测试

Claude Code 官方的示例提示词里有这样的要求：先写一个能复现问题的失败测试，再修。Cursor 官方也把「为我们修掉的那个 bug 写回归测试」列为好提示词。

```text
用户反馈：优惠码大小写不同时会被当成两个码重复使用。
先写一个能复现这个问题的失败测试，运行确认它确实失败；
然后修复代码，再运行确认测试通过，并且其他测试没有被影响。
```

好处有两个：证明你确实复现了问题；以后有人改回去，测试会拦住。

## 不同类型的测试怎么要

| 类型 | 提示词要点 | 官方出处 |
| --- | --- | --- |
| 单元测试 | 指定函数、成功 + 失败 + 边界、照已有测试的写法 | GitHub Cookbook |
| Mock 对象 | 说明要隔离哪个外部依赖（网络、数据库、时间） | GitHub Cookbook 有《Create mock objects》 |
| 集成测试 | 指定接口和已有的测试基础设施目录 | Cursor 示例：用 `src/__tests__/` 里已有的测试设施给支付 API 搭集成测试 |
| 端到端测试 | 描述用户流程；项目没配 Playwright 时可以让它从头搭 | Cursor：智能体可以搭好项目、写配置、建第一个测试 |
| 界面手动验证 | 让智能体用浏览器工具点一遍并截图 | Cursor：智能体可以通过浏览器检查界面状态和流程 |

## 8 条可复制的提示词

1. `列出这个函数现有测试没有覆盖的分支，按风险排序。`
2. `为这个函数写单元测试，成功、失败、边界值都要有；照 tests/ 目录里已有测试的风格。`
3. `这个模块依赖系统时间和网络，写测试时只隔离这两样，其余用真实实现。`
4. `运行全部测试，把失败的列成表：测试名、失败原因、你判断是测试问题还是代码问题。`
5. `为刚修的这个 bug 补一个回归测试，测试名里写清复现条件。`
6. `这个测试偶尔失败。找出不稳定的原因（时间、顺序、共享状态），先解释再改。`
7. `检查这些测试里有没有「没有断言」或「断言永远为真」的用例。`
8. `为这个接口写集成测试：正常返回、参数缺失、无权限、资源不存在四种情况。`

## 常见问题

**Q：测试全绿，但我不放心？**
用上面的「故意改错」办法抽查几处。也可以让另一个全新会话来审这些测试——写测试的那个对话容易认为自己写得对。

**Q：AI 写的测试跑不起来？**
多半是它没看项目的测试配置就动手了。让它先读 `package.json` / `pyproject.toml` 和一个已有的测试文件，或者把运行测试的命令写进 `AGENTS.md`，见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。AGENTS.md 官网的说明是：写在里面的测试命令，智能体会自动去跑。

**Q：覆盖率要追到多少？**
官方文档没有给数字。比数字更有用的是：核心业务逻辑、算钱的地方、权限判断、出过 bug 的地方都有测试。

**Q：能让它每次改完自动跑测试吗？**
可以用 hooks：Kiro、Claude Code、Cursor 都支持在智能体保存文件后自动执行命令。见[《Claude Code Hooks 怎么用》](/guides/claude-code-hooks)和[《Kiro Spec 模式怎么用》](/guides/kiro-spec-steering-hooks)。

**Q：测试跑得很慢怎么办？**
Cursor 官方专门讲过：智能体越多，瓶颈越在最慢的环节。测试要 10 分钟、并行 10 个智能体，就是近两小时的等待；把测试提速一半，每一轮都省时间。

**Q：有现成的测试类提示词吗？**
本站[提示词库](/prompts)的编程开发分类里有测试相关的模板，可以按语言改。

## 参考资料

- Generating unit tests（GitHub 官方 Copilot Chat Cookbook）：https://docs.github.com/en/copilot/tutorials/copilot-cookbook/testing-code/generate-unit-tests
- Reviewing and testing code（Cursor 官方教程）：https://cursor.com/learn/reviewing-testing
- Best practices（Claude Code 官方）：https://code.claude.com/docs/en/best-practices
