---
title: "baoyu-translate 是什么、怎么安装使用：宝玉的文章翻译 Skill（快翻、常规、精翻三种模式，支持术语表）"
slug: baoyu-translate-skill
name: baoyu-translate（JimLiu/baoyu-skills）
url: https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-translate
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenClaw 等"
trialNote: "npx skills add jimliu/baoyu-skills --skill baoyu-translate"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, translation]
excerpt: "baoyu-translate 是宝玉 baoyu-skills 里的翻译技能：提供快速直译、带内容分析的常规翻译、含审校润色的精翻三种模式，支持自定义术语表，长文会先分块再翻译，可以直接处理网址或文件。"
checkedOn: 2026-10-11
sources:
  - https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-translate
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 JimLiu/baoyu-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 JimLiu/baoyu-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

这个技能出自宝玉（JimLiu）的技能合集，把一套完整的翻译流程固化了下来，并用三种模式来匹配不同的质量要求。`description` 列的触发语很多：「翻译」「精翻」「翻译这篇文章」「改成中文」「改成英文」「本地化」「精细翻译」「快翻」等，或者用户给出带有翻译意图的网址或文件。

三种模式：

- **quick（快翻）**：直接翻译，适合自己看懂就行的场合；
- **normal（常规）**：先分析内容——主题、受众、风格、术语——再据此翻译；
- **refined（精翻）**：面向发表质量的完整流程，包含审校和润色。

流程五步：加载偏好（第一次使用有一个阻断式的初始设置，确定目标语言、默认模式等）→ 取得原文并建立输出目录 → 评估内容长度 → 翻译与打磨 → 输出。长文会用脚本先切块，再分块翻译，必要时交给子智能体并行处理，这样既不丢内容也能保持术语一致。

术语方面，目录里自带一份英译中的术语对照表，你也可以在偏好里扩充自己的术语表——对技术文章来说，这是保证「同一个词前后译法一致」最实用的功能。

## 怎么安装

仓库 README 的安装命令是 `npx skills add jimliu/baoyu-skills`，会进入选择界面；只装这一个，可以加 skills CLI 的 `--skill` 参数：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-translate
```

Claude Code 也可以整库安装：`/plugin marketplace add JimLiu/baoyu-skills` 后 `/plugin install baoyu-skills@baoyu-skills`。README 列出的前置条件是能运行 `npx bun` 命令（即本机有 Node.js 环境）。

仓库整体介绍和其他安装方式，详见本站《baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）》。

## 怎么用

- 「把这篇英文博客精翻成中文」后面附上网址或文件路径。
- 「快翻一下这份更新日志」。
- 「以后把 agent 统一译成『智能体』，把 harness 保留英文」——加入你的术语表。

目录里有分块脚本、精翻流程说明、子智能体提示词模板和术语表。

## 适合谁 / 局限

适合经常翻译技术文章、文档和长篇内容的译者、博主和开发者。精翻模式步骤多、耗时长、用量大，短内容没必要用；文学类、法律类文本对风格或措辞精确度要求极高，仍需要专业译者把关；它不会替你判断原文观点的对错。

## 注意事项

- **许可**：MIT。
- **会执行脚本**：声明需要 `bun` 或 `npx` 来运行分块脚本；给网址时会联网获取原文。
- **版权**：翻译并公开发布他人的文章需要原作者授权，自己阅读学习则无妨。
- 不需要生图能力和额外的 API Key。
