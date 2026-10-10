---
title: "Prompt Master 是什么、怎么安装使用：帮你给任何 AI 工具写提示词的 Claude Skill"
slug: prompt-master-claude-skill
name: Prompt Master（nidhinjs/prompt-master）
url: https://github.com/nidhinjs/prompt-master
pricing: "开源免费（MIT）"
platforms: "claude.ai（上传 ZIP，作者推荐）/ Claude Code"
trialNote: "下载仓库 ZIP 后，在 claude.ai 的 Customize → Skills → Upload a Skill 上传"
products: [claude, chatgpt]
models: [any-llm]
topics: [agent-skills, prompt-engineering, ai-agent]
excerpt: "Prompt Master 是一个开源的 Claude Skill：先识别提示词要给哪个 AI 工具用，再从九个维度提取意图，最多追问三个问题，自动套用合适的提示词结构，为 Cursor、Claude Code、Midjourney 等写出精炼的提示词。"
checkedOn: 2026-10-11
sources:
  - https://github.com/nidhinjs/prompt-master
  - https://github.com/nidhinjs/prompt-master/blob/main/SKILL.md
---

> 本文根据 nidhinjs/prompt-master 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 1.4 万 Star、1653 Fork，最近一次推送在 2026-08-24。支持的工具和模型清单随版本更新，以仓库为准。

## 是什么

Prompt Master 的用途很单纯：你用大白话说想让某个 AI 工具做什么，它替你把这句话写成一条针对那个工具的提示词。README 的口号是「每个词都要承重」——它瞄准的问题是多数人用 AI 的方式：写个含糊的提示词，结果不对，改一次，再改一次，第四次才得到想要的。作者的看法是，多数「提示词生成器」只会把提示词变长，而它要做的是变准。

README 列的适用工具很广：Claude、ChatGPT、Codex、Gemini、Grok 等对话模型，Cursor、Claude Code、Copilot、Windsurf 等编程工具，Midjourney、Stable Diffusion、ComfyUI 等图像工具，以及视频、语音和自动化类工具。

## 它怎么工作

它是单个技能，每次请求走一条固定流程：

1. **识别目标工具**，不动声色地切换到对应的写法；
2. **提取九个维度的意图**：任务、输入、输出、约束、背景、受众、记忆、成功标准、示例；
3. **追问**：关键信息缺失时才问，最多三个问题；
4. **选结构**：从 13 种提示词模板里自动挑一种，不向你展示框架的名字。模板包括适合快速单次任务的 RTF、适合专业文档的 CO-STAR、适合多步骤项目的 RISEN，给代码编辑类工具用的「文件范围」模板，给自主智能体用的「ReAct 加停止条件」，给生图工具用的视觉描述模板、参考图编辑模板、ComfyUI 模板，以及用来拆解和改写已有提示词的「反编译」模板；
5. **只用效果可靠的技巧**：角色设定、少量示例、XML 结构标签、防编造的依据约束、可审计的推理。README 明确排除了一些它认为容易产生不可预测结果的方法。

另有两块内容：一份 **37 种「浪费额度」的写法**清单，每条配修改前后的对比，例如「帮我看看代码」这种含糊的动词、一条提示词里塞两个任务、没有完成标准；以及**记忆块**——对话有历史时，它会把之前做过的决定提炼出来放在提示词开头，避免新的提示词与先前的结论矛盾。

## 怎么安装

README 推荐的方式是在 claude.ai 网页版上传：

1. 把仓库下载为 ZIP；
2. 进入 claude.ai 的侧边栏 → Customize → Skills → Upload a Skill，上传这个 ZIP。

也可以克隆到 Claude Code 的技能目录（README 标注为不太推荐的方式）：

```bash
git clone https://github.com/nidhinjs/prompt-master.git ~/.claude/skills/prompt-master
```

## 怎么用

README 的示例：

- 「给 Cursor 写一条提示词，让它重构我的认证模块」；
- 「我要让 Claude Code 搭一个 REST 接口——需要知道什么就问我」；
- 「这是我给模型写的一条很烂的提示词，帮我改」；
- 「生成一条 Midjourney 提示词：夜晚的赛博朋克城市」；
- 或者输入 `/prompt-master` 后再描述需求。

## 适合谁 / 不适合谁

**适合：**
- 同时用好几种 AI 工具、不想逐个研究各家提示词写法的人；
- 想学提示词怎么写的新手——对照它改写前后的差别很直观。

**不适合：**
- 已经有成熟提示词模板的团队；
- 期待它保证效果的人。它输出的是「更可能一次到位」的提示词，最终结果仍取决于目标工具和模型。

## 注意事项

- **许可**：MIT。
- **不带脚本、不联网**：一份说明文字加参考内容。
- **宣传语要打折听**：README 里「零浪费」这类说法是作者的表述，没有独立的评测数据支撑。
- **模型清单会过时**：它内置了各家工具和模型的写法偏好，上游发新版后需要更新技能；README 的版本记录里能看到最近一次刷新的范围。
- 不要让它帮你写用来规避平台内容规则的提示词，生成的内容仍要遵守各工具的使用政策。
