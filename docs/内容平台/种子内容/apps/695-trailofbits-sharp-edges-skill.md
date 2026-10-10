---
title: "sharp-edges skill 是什么、怎么安装使用：Trail of Bits 找「容易用错的 API 和危险默认值」的 Skill"
slug: trailofbits-sharp-edges-skill
name: sharp-edges（trailofbits/skills）
url: https://github.com/trailofbits/skills/tree/main/plugins/sharp-edges/skills/sharp-edges
pricing: "免费（CC BY-SA 4.0，署名并以相同方式共享）"
platforms: "Claude Code / Codex"
trialNote: "`/plugin marketplace add trailofbits/skills` 然后 `/plugin menu`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "sharp-edges 是 Trail of Bits 的接口安全设计技能：评估 API、配置和接口是否抗误用，找出「最省事的写法通向不安全」的设计，分算法选择、危险默认值、配置悬崖、静默失败等六类，只读分析不改代码。"
checkedOn: 2026-10-11
sources:
  - https://github.com/trailofbits/skills/tree/main/plugins/sharp-edges/skills/sharp-edges
  - https://github.com/trailofbits/skills
  - https://creativecommons.org/licenses/by-sa/4.0/
---

> 本文根据 trailofbits/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 trailofbits/skills 在 GitHub 约 7462 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

很多安全事故的根源不是开发者粗心，而是接口设计得太容易用错：一个参数传 0 就关闭了超时，默认配置下不校验证书，加密函数让调用方自己挑算法和模式。Trail of Bits 把这类设计叫「锋利的边缘」。sharp-edges 的任务是在评审时把它们找出来。`description`：识别容易出错的 API、危险的配置和会导致安全失误的「搬起石头砸自己脚」式设计；评审 API 设计、配置模式、密码学库的易用性，或评估代码是否遵循「默认安全」和「成功之坑」原则时使用。

一句话概括它的标准：这个接口的「省事路径」是通向安全还是不安全？

六类锋利边缘：

1. **算法与模式选择**：让调用方自己选，就一定有人选错；
2. **危险的默认值**；
3. **原语型 API 与语义型 API**：暴露底层原语而不是「做一件具体的事」的接口；
4. **配置悬崖**：一个不起眼的值让系统行为突变；
5. **静默失败**：出错不报，照常返回；
6. **字符串化的安全决策**：用字符串拼接或比较来承载权限判断。

分析流程四步：识别暴露面 → 探测边界情况 → 威胁建模 → 验证发现，最后按严重程度分级。它还列了一组要拒绝的开脱说法，例如「文档里写了」。

## 怎么安装

`sharp-edges` 在 trailofbits/skills 里属于 `sharp-edges` 插件。Claude Code 先登记市场，再在菜单里选择要装的插件（命令来自仓库 README）：

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

Codex 用 `codex plugin marketplace add trailofbits/skills`，再执行 `codex plugin add sharp-edges@trailofbits`。

仓库整体介绍和其他安装方式，详见本站《trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）》。

## 怎么用

- 「评审我们 SDK 的配置项，找出危险的默认值和容易误用的参数」。
- 「这个加密工具类的接口设计有什么锋利的边缘？」
- 「按『默认安全』的标准看一下这份鉴权中间件的 API」。

`references/` 里有认证模式、配置模式、密码学 API、案例研究，以及 C、C#、Go、Java、JavaScript、Kotlin、PHP、Python、Ruby、Rust、Swift 等语言的专门说明。

## 适合谁 / 局限

适合设计库、SDK、内部框架和配置系统的工程师——这类代码的使用者是其他开发者，接口的易错程度直接决定下游的安全。业务代码里没有多少「接口设计」可评时，用处有限；它评的是设计，不查具体的实现漏洞。

## 注意事项

- **许可**：CC BY-SA 4.0，改编后须以相同方式共享。
- **只读**：声明的工具权限只有 Read、Grep、Glob，不会改代码也不执行命令。
- 发现的问题往往需要改接口，属于破坏性变更，修复方案要考虑兼容和迁移。
