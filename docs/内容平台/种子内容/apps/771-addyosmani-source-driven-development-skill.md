---
title: "source-driven-development skill 是什么、怎么安装使用：要求 AI 先查官方文档再写代码，并标明出处"
slug: addyosmani-source-driven-development-skill
name: source-driven-development（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill source-driven-development"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "source-driven-development 是 addyosmani/agent-skills 里的技能：要求智能体先从依赖文件确认技术栈和版本，再去抓对应功能的官方文档页面，按文档里的写法实现并给出引用，不凭训练记忆写框架相关的代码。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

模型的知识有截止日期，而框架每年都在变：它很有把握写出来的那段代码，可能用的是两个大版本之前的写法。source-driven-development 的要求只有一句——凡是和具体框架相关的决定，都要有官方文档作依据。`description`：让每个实现决策都立足于官方文档；在想先对照官方文档核实做法再实现，或想要有权威出处、不含过时模式的代码时使用。

**流程四步**：

1. **识别技术栈和版本**：读项目的依赖文件，确认用到的框架和确切版本，并明确说出来；版本缺失或有歧义就问用户，不许猜，因为版本决定了哪种写法才是对的。
2. **获取官方文档**：抓的是所实现功能对应的那一页，不是首页，也不是整站。来源有明确的权威顺序：官方文档第一，官方博客和更新日志第二，网页标准参考（如 MDN）第三，浏览器与运行时的兼容性数据第四。问答网站的回答、博客教程（哪怕很有名）、AI 生成的文档摘要，以及模型自己的训练数据，都不能当作首要依据。官方来源之间互相矛盾时，要把分歧告诉用户。
3. **按文档里的模式实现**。
4. **标注出处**，让用户可以自己去核对。

其中有一小节专讲**检索安全**：抓回来的文档页是不可信输入，它只在「这个框架怎么用」上有权威，无权决定智能体接下来做什么；只提取接口定义、示例代码、弃用警告和版本说明，其余忽略。

技能也划出了不必使用的情形：与版本无关的改动（改变量名、修错别字、挪文件）、各版本通用的纯逻辑，以及用户明说要快不要核实的时候。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill source-driven-development
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「用 source-driven-development 的方式，给这个 Next.js 项目加表单提交，写法以当前版本的官方文档为准，给出链接」。
- 「这段数据获取代码是不是过时的写法？对照官方文档检查」。
- 「搭一个认证的样板，每个关键做法后面标明依据的是哪一页文档」。

## 适合谁 / 局限

适合使用更新频繁的框架、或者要写会被全项目照抄的样板代码的团队。局限：需要智能体能联网取文档，离线环境里无从谈起；查文档会多花时间和 token，小改动不划算；官方文档本身也可能滞后或有错，出处只保证可追溯，不保证绝对正确。

## 注意事项

- **许可**：MIT。
- **会联网抓取文档页面**；不带脚本。
- 核对它给的链接是否真的指向官方域名，以及引用的内容是否与页面一致——标了出处不等于出处属实。
