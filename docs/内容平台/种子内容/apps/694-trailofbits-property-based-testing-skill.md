---
title: "property-based-testing skill 是什么、怎么安装使用：Trail of Bits 的属性测试 Skill（Hypothesis、fast-check、proptest）"
slug: trailofbits-property-based-testing-skill
name: property-based-testing（trailofbits/skills）
url: https://github.com/trailofbits/skills/tree/main/plugins/property-based-testing/skills/property-based-testing
pricing: "免费（CC BY-SA 4.0，署名并以相同方式共享）"
platforms: "Claude Code / Codex"
trialNote: "`/plugin marketplace add trailofbits/skills` 然后 `/plugin menu`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "property-based-testing 是 Trail of Bits 的属性测试技能：编写、评审和调试基于属性的测试，覆盖 Hypothesis、fast-check、proptest、jqwik 等库，教智能体判断代码有没有可测的「代数形状」以及属性测试是否真的断言了东西。"
checkedOn: 2026-10-11
sources:
  - https://github.com/trailofbits/skills/tree/main/plugins/property-based-testing/skills/property-based-testing
  - https://github.com/trailofbits/skills
  - https://creativecommons.org/licenses/by-sa/4.0/
---

> 本文根据 trailofbits/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 trailofbits/skills 在 GitHub 约 7462 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

普通的单元测试断言一个点：输入 3，输出 9。属性测试断言一条规则：对任意输入，编码再解码都得到原值，然后让生成器去找反例。它能发现人想不到的边界情况，但写不好就成了「看起来在测、其实什么都没断言」。property-based-testing 教智能体把它写对。`description`：编写、评审和调试属性测试——Hypothesis、fast-check、proptest、jqwik、rapid，以及用于 Solidity 不变量的 Echidna 或 Medusa；当测试应当覆盖整个输入域而不是手挑的几个例子时使用，典型对象有编码与解码、序列化与反序列化、解析器、规范化器、校验器、数值类型、比较器与排序、数据结构和合约状态不变量。

技能开头有一段很清醒的话：这种交换只在代码具有「代数形状」时才划算——存在逆运算、不变量或可对照的参考实现；没有这种形状的代码就该写示例测试，并且**如实这样说是一个有效的结论**。

SKILL.md 本身很短，重点是一份**属性目录**（常见的属性类型及适用对象）和「属性测试什么都没断言的两种方式」，其余细节分在五份参考文件里：怎样写生成器、怎样解读失败（区分属性写错了还是真的发现了缺陷）、各语言的库、重构、评审。另有一节讲怎样给还没有属性测试的项目引入它。

## 怎么安装

`property-based-testing` 在 trailofbits/skills 里属于 `property-based-testing` 插件。Claude Code 先登记市场，再在菜单里选择要装的插件（命令来自仓库 README）：

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

Codex 用 `codex plugin marketplace add trailofbits/skills`，再执行 `codex plugin add property-based-testing@trailofbits`。

仓库整体介绍和其他安装方式，详见本站《trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）》。

## 怎么用

- 「给这个 JSON 序列化模块加属性测试」。
- 「Hypothesis 给出了一个缩减后的反例，帮我判断是属性写错了还是代码有问题」。
- 「评审现有的属性测试，哪些其实没有断言任何有意义的东西？」

## 适合谁 / 局限

适合写解析器、编解码、金额计算、数据结构这类逻辑密集代码的开发者。业务流程型、以读写数据库和调接口为主的代码通常没有合适的属性，技能自己也会这样判断；它不涉及二进制模糊测试，描述里明确把那类工作排除在外。

## 注意事项

- **许可**：CC BY-SA 4.0，改编后须以相同方式共享。
- **会执行测试命令**；属性测试运行时间比普通测试长。
- 发现反例后先最小化并写成回归测试，再修复。
