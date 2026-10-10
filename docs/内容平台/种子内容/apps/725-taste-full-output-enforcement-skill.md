---
title: "full-output-enforcement skill 是什么、怎么安装使用：不让 AI 用「其余代码省略」糊弄你"
slug: taste-full-output-enforcement-skill
name: full-output-enforcement（Leonxlnx/taste-skill）
url: https://github.com/Leonxlnx/taste-skill/tree/main/skills/output-skill
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor 等（npx skills 安装或手动复制 SKILL.md）"
trialNote: "npx skills add https://github.com/Leonxlnx/taste-skill --skill \"full-output-enforcement\""
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, prompt-engineering]
excerpt: "full-output-enforcement 是 Taste Skill 库里的输出约束技能：禁止用省略注释、骨架和「其余同理」代替实际内容，要求先数清交付物、逐个写全、交付前核对数量，输出太长时在干净的断点处分段续写。"
checkedOn: 2026-10-11
sources:
  - https://github.com/Leonxlnx/taste-skill/tree/main/skills/output-skill
  - https://github.com/Leonxlnx/taste-skill
  - https://github.com/vercel-labs/skills
---

> 本文根据 Leonxlnx/taste-skill 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 37.5 万次；所在仓库 Leonxlnx/taste-skill 在 GitHub 约 9.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让模型输出一个完整文件，中间却冒出一行「// 其余代码不变」，或者五个组件只写了两个、剩下的「以此类推」——这是长输出里最常见的偷懒方式。full-output-enforcement（仓库文件夹名 `output-skill`）专治这个。`description`：覆盖大模型默认的截断行为，强制完整生成代码，禁止占位写法，并干净地处理因长度上限导致的分段；适用于任何要求详尽、不删节输出的任务。

全文很短，只有四块：

- **基线**：把每个任务当成生产任务，不完整的输出就是坏的输出；要完整文件就给完整文件，要五个组件就给五个。
- **禁用写法**：代码块里的 `// ...`、`// rest of code`、`// TODO`、单独的省略号；正文里的「需要的话我可以继续」「为了简洁」「其余同理」；还有结构上的捷径——要完整实现却只给骨架、只写开头结尾跳过中间、用一个例子加一句描述代替重复逻辑。
- **执行过程**：先数清一共要交付几样东西并锁定这个数；逐个完整生成；输出前回到原始请求核对数量。
- **长输出处理**：接近长度上限时不压缩、不跳到结尾，写到一个干净的断点（函数、文件或小节结束）就停，并按固定格式注明进度；你说「继续」，它从断点原样接上。

## 怎么安装

仓库 README 给出的单独安装写法（`--skill` 后面跟的是技能的安装名，不是文件夹名；这个技能在仓库里的文件夹是 `skills/output-skill`，安装名是 `full-output-enforcement`）：

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "full-output-enforcement"
```

去掉 `--skill` 就是整库安装。不想用命令行，也可以把该文件夹里的 SKILL.md 直接复制到项目里，或贴进对话当作长期指令。

仓库整体介绍和其他安装方式，详见本站《Taste Skill 是什么、怎么安装使用：让 AI 写前端不再千篇一律的设计 Skill（taste-skill）》。

因为内容短，直接把 SKILL.md 贴进 ChatGPT、Claude 的自定义指令里也能用。

## 怎么用

- 「把这个 800 行的文件按新接口完整改写一遍，不要省略任何部分」。
- 「生成全部 12 个接口的测试用例」——它会先确认数量，再逐个写完。
- 输出被截断时回一句「继续」。

## 适合谁 / 局限

适合经常让模型输出整份文件、长文档或批量内容的人。它解决的是「模型主动偷懒」，解决不了硬性的单次输出上限——超长内容仍然要分几轮；在按量计费的环境里，完整输出意味着更多的输出 token。日常问答不需要它，开着反而会让回答变啰嗦。在 Claude Code 这类能直接改文件的工具里，用编辑操作改局部往往比整份重写更合适。

## 注意事项

- **许可**：MIT。
- **不带脚本、不联网**，只是一份约束说明。
- 安装量数字来自 skills.sh，包含整库安装带来的计数。
