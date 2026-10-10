---
title: "semgrep skill 是什么、怎么安装使用：Trail of Bits 的 Semgrep 安全扫描 Skill（自动选规则集、合并 SARIF）"
slug: trailofbits-semgrep-skill
name: semgrep（trailofbits/skills）
url: https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/semgrep
pricing: "免费（CC BY-SA 4.0）；Semgrep 本体另有其许可与可选的 Pro 版"
platforms: "Claude Code / Codex"
trialNote: "`/plugin marketplace add trailofbits/skills` 然后 `/plugin menu`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "semgrep 是 Trail of Bits 静态分析插件里的扫描技能：自动识别代码库的语言、挑选规则集，把扫描计划交给你批准后并行运行 Semgrep，并把结果合并成 SARIF；所有命令强制关闭遥测。"
checkedOn: 2026-10-11
sources:
  - https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/semgrep
  - https://github.com/trailofbits/skills
  - https://creativecommons.org/licenses/by-sa/4.0/
---

> 本文根据 trailofbits/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 trailofbits/skills 在 GitHub 约 7462 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Semgrep 是常用的开源静态分析工具，难点不在运行，而在选哪些规则集、怎么并行、结果怎么汇总。Trail of Bits 的 semgrep 技能把这套编排做好了。`description`：对代码库运行 Semgrep 安全扫描——检测语言、选择规则集、把计划提交给用户明确批准，然后通过脚本批量运行所有被批准的规则集，并把输出合并为 SARIF；被要求扫描代码漏洞、用 Semgrep 做安全审计、找缺陷或做静态分析时使用。

两条「基本原则」排在最前面，都和安全审计的职业习惯有关：

1. **永远加 `--metrics=off`**。Semgrep 默认会发送遥测，`--config auto` 也会联网回传；审计别人的代码时不能泄露信息，所以每条命令都必须关闭它。
2. **扫描计划必须经用户批准**——这是一道硬关卡，没有你的确认不会开始扫描。

两种扫描模式：「全部运行」追求规则覆盖面；「只看重要的」只保留中高置信度、中高影响的安全类发现。本机有 Semgrep Pro 时，会用它做跨文件的污点分析。实际执行交给目录里的 `run-scans.sh`（批量启动扫描进程）和 `merge_sarif.py`（合并结果）。

## 怎么安装

`semgrep` 在 trailofbits/skills 里属于 `static-analysis` 插件。Claude Code 先登记市场，再在菜单里选择要装的插件（命令来自仓库 README）：

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

Codex 用 `codex plugin marketplace add trailofbits/skills`，再执行 `codex plugin add static-analysis@trailofbits`。

仓库整体介绍和其他安装方式，详见本站《trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）》。

另外需要本机已安装 Semgrep 命令行工具。

## 怎么用

- 「用 Semgrep 扫一遍这个仓库，只看重要的发现」。
- 它会先列出检测到的语言和打算使用的规则集，你确认或删改后才开始。
- 「把结果按严重程度汇总，并标出最可能是误报的几条」。

目录里另有规则集和扫描模式两份参考，以及一份工作流定义。

## 适合谁 / 局限

适合想给项目做一轮自动化安全扫描的开发者，以及做代码审计前期摸底的安全人员。静态分析必然有误报和漏报，结果需要人工分诊（同插件里有解析 SARIF 的技能）；规则覆盖不到的业务逻辑漏洞它发现不了。

## 注意事项

- **许可**：技能为 CC BY-SA 4.0；Semgrep 本体及其规则集有各自的许可，Pro 功能需要 Semgrep 账号。
- **声明的工具权限**含 Bash，会运行扫描脚本并在输出目录写文件。
- **只扫描你有权审计的代码**；首次运行会联网下载规则集。
