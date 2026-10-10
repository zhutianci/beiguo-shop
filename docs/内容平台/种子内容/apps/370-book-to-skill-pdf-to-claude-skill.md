---
title: "book-to-skill 是什么、怎么安装使用：把技术书 PDF 变成可随时查阅的 Claude Code Skill"
slug: book-to-skill-pdf-to-claude-skill
name: book-to-skill（virgiliojr94/book-to-skill）
url: https://github.com/virgiliojr94/book-to-skill
pricing: "开源免费（MIT，仅指转换工具本身）"
platforms: "Claude Code / GitHub Copilot CLI / Amp / Hermes Agent / OpenCode / OpenClaw"
trialNote: "npx skills add virgiliojr94/book-to-skill"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, learning, ai-agent]
excerpt: "book-to-skill 是一个把技术书、文档文件夹转成 Agent Skill 的技能：先用 Python 脚本提取文本，再由智能体提炼出框架、决策规则、反模式和按章节拆分的文件，之后用斜杠命令按主题查阅。"
checkedOn: 2026-10-11
sources:
  - https://github.com/virgiliojr94/book-to-skill
  - https://github.com/virgiliojr94/book-to-skill/blob/main/docs/how-it-works.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 virgiliojr94/book-to-skill 仓库 README 整理，资料核对于 2026-10-11。

## 是什么

买了一本好的技术书，读过一遍，三个月后连第七章讲什么都想不起来。book-to-skill 的作者从这个痛点出发：把书变成智能体可以按需加载的技能。README 强调它产出的是**结构，而不是摘要**——框架、决策规则、反模式，加上每章一个文件。

README 给的三步是：把它指向一个文件、文件夹或通配符（`/book-to-skill ./my-book.pdf`）→ 它把书提炼成一个技能 → 之后你输入 `/书名缩写 某个主题`，智能体去读对应的章节文件，基于真实内容回答。它由两半组成：一个确定性的 Python **提取器**（把文档变成干净文本和元数据），和一个按规范执行的**生成器**（智能体遵循 `SKILL.md` 把文本变成结构化技能）。章节文件按需加载，所以技能本身保持很小；README 称与把整本书塞进上下文相比，回答一个问题省下 24 到 51 倍的 token，这是作者在几本真实书籍上自测的数字。

不只是书：README 的「Beyond books」一节说，公司内部文档文件夹、论文集等也可以同样处理。

截至 2026-10-11，GitHub 显示该仓库约 3.4 万 Star，最近一次推送在 2026-10-05。

## 包含哪些 Skill

仓库提供一个技能 `book-to-skill`；它运行后**生成**的每本书是一个新的独立技能，名字取自书名，包含总览和各章节文件。

## 怎么安装

```bash
npx skills add virgiliojr94/book-to-skill
```

或手动克隆到技能目录：

```bash
git clone https://github.com/virgiliojr94/book-to-skill.git ~/.claude/skills/book-to-skill
```

README 还列了 Copilot CLI、Amp、Hermes Agent、OpenClaw、OpenCode 各自的技能目录位置。

## 怎么用

- `/book-to-skill ./ddia.pdf`——处理一本书，结束后得到一个以书名命名的新技能；
- `/ddia replication`——向这本书「提问」某个主题（这里的技能名是示例，实际取决于生成时的命名）；
- `/book-to-skill ./docs/`——把一整个文档文件夹合成一个技能。

处理一本书需要智能体通读全文，耗时和用量都不小，属于一次性投入。

## 适合谁 / 不适合谁

**适合：**
- 手边有几本常翻的技术书或规范文档，希望写代码时能随口查的开发者；
- 想把团队内部手册变成智能体知识的人。

**不适合：**
- 扫描版、排版复杂的 PDF——提取质量会直接影响结果；
- 小说等非技术类书籍，它提炼的是「框架和规则」；
- 想把生成的技能发到网上分享的人（见下）。

## 注意事项

- **许可证**：MIT，README 特别说明只适用于转换工具（代码与技能定义），**不**适用于你处理的任何书籍或文档。
- **版权**：仓库不附带任何书籍内容。README 的「版权与合理使用」一节写明：用你自己合法拥有的副本；生成的技能是结构化的笔记而非原文复制；**不要再分发**——公开或分享受版权保护作品生成的技能可能侵权，第三方书籍的技能请留作自用。
- **数据去向**：提取和分析在本机进行，工具不上传文件；但你喂给云端模型的文本，遵循该模型服务商的数据条款。
- **会执行 Python 脚本**：安装前可先看一眼提取器代码；生成的内容是模型的转述，关键结论请回原书核对。
