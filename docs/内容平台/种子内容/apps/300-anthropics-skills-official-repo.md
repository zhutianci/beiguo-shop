---
title: "anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）"
slug: anthropics-skills-official-repo
name: anthropics/skills（Anthropic 官方 Skills）
url: https://github.com/anthropics/skills
pricing: 免费（示例技能多为 Apache-2.0；文档技能为源码可见）
platforms: Claude Code / claude.ai / Claude API
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install document-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, coding]
excerpt: "anthropics/skills 是 Anthropic 官方的 Skills 仓库：Word / Excel / PPT / PDF 四个文档技能，加上 skill-creator、frontend-design、mcp-builder 等示例技能，Claude Code 里两条命令即可安装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://agentskills.io/home
---

> 本文根据 Anthropic 官方 GitHub 仓库、Claude Code 官方文档和 Claude 帮助中心整理，资料核对于 2026-10-10。仓库内容更新频繁，以仓库 README 为准。

## 是什么

anthropics/skills 是 Anthropic 自己维护的 Skills（技能）仓库。Skill 的本体是一个文件夹：里面一份 `SKILL.md` 写清「这个技能做什么、什么时候用、怎么做」，可以再带脚本、模板和参考资料；Claude 判断用得上时才把它读进上下文。这个仓库的作用有两个：一是公开 Claude 生成 Word、Excel、PPT、PDF 文件时背后用的那四个文档技能，二是给出一批写法规范的示例技能，供大家照着写自己的。

截至 2026-10-10，GitHub 显示该仓库约 18.0 万 Star、2.1 万 Fork，最近一次推送在 2026-10-09，是目前 Star 数最高的 Skills 仓库之一。README 开头说明：这里放的是 Anthropic 对 Skills 的实现，格式标准本身在 agentskills.io。

## 包含哪些 Skill

仓库把技能打成几个插件包（以仓库里的 marketplace.json 为准）：

- **document-skills**：`docx`、`xlsx`、`pptx`、`pdf`——创建、编辑、读取四种办公文档，含表单填写、公式、批注等处理脚本。
- **example-skills**（12 个）：
  - `skill-creator`：一步步带你写新技能、改进已有技能；
  - `frontend-design`：做网页界面时给出更有设计感的方向，少一点「模板味」；
  - `mcp-builder`：指导编写 MCP 服务器；
  - `webapp-testing`：用 Playwright 测试本地网页应用；
  - `web-artifacts-builder`：构建较复杂的网页 Artifact；
  - `doc-coauthoring`：按固定流程协作写文档；
  - `canvas-design`、`algorithmic-art`、`theme-factory`、`brand-guidelines`、`internal-comms`、`slack-gif-creator`：视觉设计、生成艺术、主题配色、品牌规范、内部沟通文稿、Slack 动图。
- **claude-api**：写调用 Claude API / SDK 的程序时提供参考资料。
- 另有 `academy-guide`、`discernment-nudge` 两个小技能包，以及 `spec`（规范）和 `template`（技能模板）目录。

## 怎么安装

**Claude Code**（在会话里输入，命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

第一条把仓库登记成插件市场（市场名 `anthropic-agent-skills`），后两条分别装文档技能包和示例技能包。也可以只输入 `/plugin`，在面板里按 Browse and install plugins 逐步选择。

**claude.ai（网页版 / App）**：README 说明这些示例技能已对付费套餐开放，文档类技能不用设置就会自动使用；想上传仓库里的某个技能或自己的技能，按帮助中心「Using skills in Claude」的步骤，在 Customize → Skills 里上传技能文件夹的 ZIP。

**Claude API**：可以调用 Anthropic 预置技能，也可以通过 Skills API 上传自定义技能，见官方 Skills API 文档。

只想要其中一个技能时，也可以把对应文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`（随仓库共享）。

## 怎么用

- **处理文档**：装好 document-skills 后直接说「用 PDF 技能提取 path/to/some-file.pdf 里的表单字段」，Claude 会加载 pdf 技能并运行其中的脚本。
- **写自己的技能**：说「帮我把每周写周报的流程做成一个 skill」，`skill-creator` 会追问用途、触发场景和输出格式，然后生成 `SKILL.md`。
- **手动调用**：插件里的技能以 `/插件名:技能名` 的形式出现在命令菜单里，例如输入 `/example-skills:frontend-design` 后再描述要做的页面。输入 `/skills` 可以查看当前可用的全部技能。

## 适合谁 / 不适合谁

**适合：**
- 刚接触 Skills、想先装一套来源可靠的技能的人；
- 经常让 Claude 生成或修改 Office 文档、PDF 的用户；
- 想学习规范写法、准备写自己技能的开发者和团队。

**不适合：**
- 想要一整套开发流程（需求、计划、测试、评审）的人——这里是零散的示例，流程类可以看 Superpowers 等社区库；
- 只用 Codex 等其他智能体的人——格式通用，但安装命令和文档技能的脚本环境是按 Claude 写的。

## 注意事项

- **许可证不统一**：README 写明多数示例技能是 Apache 2.0 开源；`docx`、`pdf`、`pptx`、`xlsx` 四个文档技能是「源码可见」，不是开源许可，不要拿去二次分发。仓库根目录没有统一的 LICENSE 文件，以各技能文件夹内的许可文件为准。
- **演示性质**：官方声明这些技能用于演示和学习，Claude 产品里实际的行为可能与仓库实现不同，用于重要工作前先自己测试。
- **维护状态**：仓库持续更新（最近推送 2026-10-09）。
- **安全**：技能可以带脚本并读写文件。官方仓库来源可靠，但从别处下载的技能，安装前要把 `SKILL.md` 和脚本读一遍；Claude Code 文档还提醒留意技能里声明的 `allowed-tools`。
- 更完整的概念和 claude.ai 操作步骤见本站教程《Claude Skills 是什么、怎么装、推荐哪些》。
