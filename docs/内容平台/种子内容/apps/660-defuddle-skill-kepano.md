---
title: "defuddle skill 是什么、怎么安装使用：把网页提取成干净 Markdown、给智能体省 token 的 Skill"
slug: defuddle-skill-kepano
name: defuddle（kepano/obsidian-skills）
url: https://github.com/kepano/obsidian-skills/tree/main/skills/defuddle
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / OpenCode"
trialNote: "`/plugin marketplace add kepano/obsidian-skills` 然后 `/plugin install obsidian@obsidian-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "defuddle 是 kepano/obsidian-skills 里的网页提取 Skill：教智能体用 Defuddle 命令行工具把网页正文提取成干净的 Markdown，去掉导航、广告等杂项，比直接抓取网页更省 token。"
checkedOn: 2026-10-11
sources:
  - https://github.com/kepano/obsidian-skills/tree/main/skills/defuddle
  - https://github.com/kepano/obsidian-skills
  - https://help.obsidian.md/cli
---

> 本文根据 kepano/obsidian-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.2 万次；所在仓库 kepano/obsidian-skills 在 GitHub 约 4.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体读一个网页，它拿到的往往是连同导航栏、侧边栏、页脚、广告位在内的整页内容，真正的正文只占一小部分，其余都在白白消耗上下文。Defuddle 是一个专门提取网页正文的开源工具，defuddle 技能教智能体优先用它。`description` 只有一句：用 Defuddle CLI 从 HTML 页面提取干净的 Markdown。

SKILL.md 非常短，要点如下：

- 用 Defuddle CLI 从网页提取干净可读的内容；对普通网页，**优先于智能体自带的网页抓取工具**使用——它会去掉导航、广告和杂乱元素，减少 token 用量；
- 没安装的话先运行 `npm install -g defuddle`；
- 始终加 `--md` 输出 Markdown；
- 可以直接保存到文件，也可以只提取某一项元数据；
- 输出格式三种：`--md`（Markdown，默认选择）、`--json`（同时含 HTML 和 Markdown 的 JSON）、不加参数（HTML）。

它虽然收在 Obsidian 技能库里，但用途并不限于 Obsidian。

## 怎么安装

`defuddle` 随 kepano/obsidian-skills 的 `obsidian` 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

其他智能体用 `npx skills add https://github.com/kepano/obsidian-skills`，在选择界面里勾选 `defuddle`；也可以把仓库里的 `skills/defuddle` 文件夹直接复制到所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《obsidian-skills 是什么、怎么安装：Obsidian CEO kepano 写的 Agent Skills，让 Claude Code 读写 Obsidian 笔记库》。

另外需要在本机安装 Defuddle 命令行工具本身：`npm install -g defuddle`（需要 Node.js）。

## 怎么用

- 「把这个网页存成一篇笔记，只保留正文」。
- 「读一下这三篇博客文章，对比它们的观点」——智能体会先用 Defuddle 提取，再阅读精简后的内容。
- 「提取这篇文章的标题和作者」。

## 适合谁 / 局限

适合经常让智能体读网页资料、做剪藏和调研的人。它面向的是文章型的「标准网页」；需要登录、强依赖脚本渲染或交互才显示内容的页面，提取效果有限；对版式特殊的页面，正文识别偶尔会多删或少删。

## 注意事项

- **许可**：技能为 MIT；Defuddle 工具的许可见其自身仓库。
- **会联网并执行命令**：通过全局安装的 npm 包访问你给的网址。
- **提示词注入**：抓回来的网页内容里可能夹带诱导智能体的文字，当资料看，不要让它照着网页里的「指令」去执行操作。
- 转存他人文章做个人笔记没问题，再发布时注意版权。
