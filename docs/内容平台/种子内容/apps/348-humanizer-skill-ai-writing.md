---
title: "Humanizer 是什么、怎么安装使用：去掉文章「AI 味」的润色 Skill（含中文版 Humanizer-zh）"
slug: humanizer-skill-ai-writing
name: Humanizer（blader/humanizer）
url: https://github.com/blader/humanizer
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / claude.ai / Claude Desktop / Gemini CLI / GitHub Copilot / Windsurf
trialNote: "npx skills add blader/humanizer --global --agent codex"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, copywriting]
excerpt: "Humanizer 是一个文字润色 Skill：对照维基百科编辑总结的「AI 写作特征」，检查 26 类套路化表达并改写成更自然的文字，不改变原意、不编造事实。作者说明它不以躲过 AI 检测器为目标。另有中文版 Humanizer-zh。"
checkedOn: 2026-10-10
sources:
  - https://github.com/blader/humanizer
  - https://github.com/op7418/Humanizer-zh
  - https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
  - https://code.claude.com/docs/en/discover-plugins
  - https://github.com/vercel-labs/skills
---

> 本文根据 blader/humanizer 与 op7418/Humanizer-zh 两个仓库的 README、Claude Code 官方文档整理，资料核对于 2026-10-10。检查的模式数量随版本调整，以仓库 README 为准。

## 是什么

Humanizer 是一个做文风编辑的 Skill。大模型写出来的文字常带着一股熟悉的腔调：「这不仅是……更是……」、每段结尾来一句金句、凡事凑三点、开头先铺垫一句「说实话」。这些写法单看没错，堆在一起读者就会走神。Humanizer 做的事情是把这些套路挑出来，改写成一个具体的人会写的句子，同时不改变原文表达的内容。

它的规则来源是维基百科的「Signs of AI writing」页面——维基编辑用来识别 AI 生成内容的指南。README 说明了它的工作方式：先标出文中的套路（从最明显的开始），重写时不把原有结构当成不能动的东西，再对照规则和原文的事实检查一遍。它不会凭空添加内容：人名、数字、日期、引文都必须来自原文或作者，缺细节时会反过来问你。

README 还有一句很关键的定位：Humanizer 是为人类读者编辑的，**躲过 AI 检测器不是目标，检测器仍然会标记它的大部分输出**。

截至 2026-10-10，GitHub 显示该仓库约 5.5 万 Star、4363 Fork，最近一次推送在 2026-09-28。

## 包含哪些 Skill

仓库只有一个技能 `humanizer`，它检查的 26 类模式分成六组：

- **铺垫代替陈述**：「不是 X 而是 Y」、一句话收尾和戏剧化短句、听起来很深刻的空话、正题前的起跑动作、和不存在的反对者辩论——这五项最强，出现一次就值得改；
- **按规则生成的节奏**：硬凑三项、句子开头重复、把破折号当万能连接词、叠加限定词、被动句和缺主语；
- **夸大与借来的权威**：高频「AI 词」、拔高意义、含糊的关联、推销腔、「专家认为」式的无来源引用；
- **按规则生成的格式**：装饰性加粗、花哨标题、弯引号；
- **对话和草稿的残留**：「好问题！」「希望对你有帮助」、知识截止的免责声明、标题在首句重复；
- **写给了错误的读者**：把读者已经知道的事情再解释一遍。

部分模式标注为「单独出现时不算」，因为认真的作者也可能有意使用。

**中文版 Humanizer-zh**：英文规则直接套到中文上并不合适。op7418/Humanizer-zh 是面向中文文本重写的版本（MIT 许可；截至 2026-10-10 约 1.9 万 Star、1241 Fork，最近一次推送 2026-09-23），保留 31 个检查点，强调保留事实、确定程度和作者语气，普通的排比、四字格、破折号不再一律修改。安装命令为 `npx skills add https://github.com/op7418/Humanizer-zh.git`，调用时输入 `/humanizer-zh`。它的 README 同样写明：这是编辑指导，不能证明文章由谁撰写，也不保证通过任何 AI 检测器。

## 怎么安装

**Claude Code**（README 说明需要 2.1.142 或更新版本）：

```text
/plugin marketplace add blader/humanizer
/plugin install humanizer@humanizer
```

**Codex**：

```bash
npx skills add blader/humanizer --global --agent codex
```

**其他智能体**：`npx skills add blader/humanizer --global --agent '*'` 会装给 Skills CLI 支持的所有工具；去掉 `--global` 则只装到当前项目。

**claude.ai 和 Claude Desktop**：把仓库下载为 ZIP（Code → Download ZIP），在设置里作为技能上传。

## 怎么用

- 直接调用：输入 `/humanizer`，换行后贴上要改的文字（通过 Claude Code 插件安装时命令是 `/humanizer:humanizer`）。
- 自然语言：`Please humanize this text: [your text]`。
- 改文件：`Humanize the prose in docs/launch-post.md`，它只动正文，不碰代码、数据、frontmatter 和链接地址。
- 贴近自己的文风：先贴两三段你自己写的文字作为样本，再贴要改的内容，它会参照样本的节奏、用词和标点习惯。

粘贴文本时它会展示过程：第一版改写、对仍然生硬之处的简短点评、最终稿。

## 适合谁 / 不适合谁

**适合：**
- 用 AI 起草产品公告、博客、邮件，希望成稿读起来不那么模板化的人；
- 想借一份清单训练自己识别套话的写作者和编辑；
- 需要批量整理文档措辞、又不希望事实被改动的团队。

**不适合：**
- 想靠它让 AI 生成的作业或论文不被发现的人——它不是为此设计的，也做不到；
- 原文本身缺少信息的情况——它只调整表达，不会替你补上事实和观点；
- 法律文书、合同这类措辞必须逐字精确的文本。

## 注意事项

- **许可证**：两个仓库的 LICENSE 均为 MIT。
- **维护状态**：英文版最近一次推送 2026-09-28，中文版 2026-09-23。
- **使用边界**：这是文风编辑工具，不是规避学术诚信审查或平台披露要求的手段。学校、期刊、内容平台要求声明 AI 参与的，润色之后仍然要如实声明；把 AI 代写的内容当作本人原创提交，责任在使用者本人。
- **安全提醒**：这两个技能以说明文字为主，但技能本身可以带脚本、读写文件、执行命令；让它编辑文件时会直接改动文件内容，建议先提交或备份。第三方技能安装前通读 `SKILL.md`，中文版是社区移植，同样先看一遍再装。
- **兼容性**：Claude Code 版本较旧时，README 建议改用 `npx skills add blader/humanizer --global --agent claude-code`。
- 改写结果要自己再读一遍：规则是统计经验，偶尔会把作者有意为之的表达也改掉。
