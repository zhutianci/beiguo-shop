---
title: Claude Skills 是什么、怎么装、推荐哪些
slug: claude-skills
products: [claude]
models: []
accountTier: PLUS
excerpt: 一篇讲清 Claude Skills（技能）：它和提示词有什么不同，在 claude.ai 网页版和 Claude Code 里分别怎么开启、上传、安装，官方仓库里有哪些值得先装的技能，以及装第三方技能的安全注意事项。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory
  - https://claude.com/pricing
  - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/commands
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://www.anthropic.com/news/skills
  - https://www.anthropic.com/news/create-files
  - https://www.anthropic.com/news/claude-code-plugins
  - https://www.analyticsvidhya.com/blog/2026/10/claude-code-custom-commands-skills-automate-your-workflow/
---

> 本文根据 Anthropic 官方帮助中心、开发者文档和官方 GitHub 仓库整理（核对日期 2026-10-07），截图引用自官方发布页和公开教程并注明出处。claude.ai 的菜单会调整，以当前界面和帮助中心为准。

## 适用于谁

- 经常让 Claude 做**同一类重复工作**的人：按固定格式写周报、按公司模板做 PPT、按固定规范审稿。
- 用 Claude Code 写代码、想把团队的部署 / 测试 / 提交流程固化下来的开发者。
- 搜「claude skills 推荐」「claude skill 怎么装」想先搞懂概念再动手的新手。

## 结论先说

1. **Skill（技能）= 一个文件夹**，核心是一份 `SKILL.md`（说明书），可以附带脚本、模板、参考资料。Claude 判断用得上时会自动加载，不用你每次重复交代。
2. 它和提示词的区别：提示词是一次性的；技能是**按需加载**的——平时只占用「名称 + 一句话描述」的上下文，触发时才读全文，所以装很多个也不太占地方。
3. 三个地方的技能**基本各管各的**：claude.ai 和 API 之间互不同步；Claude Code 自己的技能放在本地硬盘上，不会上传到 claude.ai。唯一的例外是：Claude Code 用 claude.ai 账号登录时，会把你在 claude.ai 上启用的技能**单向下载**过来用。
4. 先装官方的：Word / Excel / PPT / PDF 文档技能，以及用来「帮你写技能」的 `skill-creator`。第三方技能要先审再装。

## 步骤

### 一、在 claude.ai（网页版 / App）里使用

1. 打开 **Settings → Capabilities**，确认「Code execution and file creation」（代码执行与文件创建）已开启——技能依赖这个运行环境。
2. 点左侧边栏的 **Customize**，进入 **Skills**，可以看到官方预置技能和你添加的技能，逐个开关。

![技能功能发布时的官方配图：上方是「Code execution and file creation」开关，下方是技能列表和开关](seed:g10-capabilities-skills.jpg)
*图片来源：[Anthropic 官方公告《Introducing Agent Skills》](https://www.anthropic.com/news/skills)。这是功能发布时的界面，当时技能列表放在 Settings → Capabilities 里；按帮助中心的最新说明，技能列表现在在 Customize → Skills，代码执行开关仍在 Settings → Capabilities。*

3. 官方预置的文档类技能（Excel、Word、PowerPoint、PDF）**不用任何设置**，你让 Claude 「做一份 PPT」「整理成 Excel」时会自动用上。

![官方示例：用自然语言让 Claude 生成 Word、PDF 和 Excel 文件](seed:g10-file-creation.jpg)
*图片来源：[Anthropic 官方公告《Claude can now create and edit files》](https://www.anthropic.com/news/create-files)*

4. 从官方目录添加技能：在 Customize → Skills 点「+」→「Browse skills」，在目录里点「Add」即可，添加后默认启用。目录里装的技能只能用、不能改，想改需要下载一份副本，改完作为自己的技能上传。
5. 上传自己的技能：把技能文件夹打成 ZIP（压缩包里应包含这个文件夹本身）→ 在 Customize → Skills 点「+」→「+ Create skill」→「Upload a skill」→ 选择 ZIP。

> 以上菜单名称来自官方帮助中心（2026-10 查看），界面可能调整，以实际为准。团队版 / 企业版需要组织所有者先在 **Organization settings → Plugins & skills** 里同时允许「代码执行与文件创建」和「技能」；所有者也可以给全组织统一下发技能。

### 二、在 Claude Code 里使用

Claude Code 的技能直接放在硬盘上，不需要上传：

| 位置 | 路径 | 作用范围 |
|---|---|---|
| 个人 | `~/.claude/skills/技能名/SKILL.md` | 你在这台电脑上的所有项目 |
| 项目 | `.claude/skills/技能名/SKILL.md` | 当前仓库（可提交到 Git 给同事用） |
| 插件 | 通过插件市场安装 | 以 `/插件名:技能名` 调用 |
| claude.ai 同步 | 自动下载到 `~/.claude/skills/synced/` | 用 claude.ai 账号登录的会话 |

最后一行是较新的变化：官方文档说明，用 claude.ai 账号登录 Claude Code 时，会在后台把你在 claude.ai 上启用的技能下载到本地，并定期检查更新；这是**只下载、不上传**，在本地改 `synced` 目录里的文件不会同步回 claude.ai。不想同步可以在用户设置里把 `syncClaudeAiSkills` 设为 `false`。

**安装官方技能仓库**（在 Claude Code 会话里输入）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

第一行把官方仓库登记为插件市场（市场名是 `anthropic-agent-skills`），后两行分别安装文档技能包和示例技能包。也可以只输入 `/plugin` 打开插件菜单，按「Browse and install plugins」一步步选。

![Claude Code 里输入 /plugin 打开的插件管理界面（官方示例，列出的是其他插件）](seed:g10-plugin-menu.png)
*图片来源：[Anthropic 官方公告《Customize Claude Code with plugins》](https://www.anthropic.com/news/claude-code-plugins)*

装好后输入 `/skills` 可以查看所有可用技能（输入文字可筛选，claude.ai 同步来的技能会单独归在「claude.ai sync」分组下）。

调用方式两种：**自动**——你的请求和技能描述匹配时 Claude 自己加载；**手动**——在消息开头输入 `/技能名`，输入 `/` 时项目里的技能也会出现在命令菜单中。

![输入 / 后，项目里自定义的命令（标注 project）出现在菜单中，回车即可手动调用](seed:g10-slash-menu-skill.png)
*图片来源：[Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/10/claude-code-custom-commands-skills-automate-your-workflow/)*

### 三、自己写一个最小技能

在 Claude Code 里新建 `~/.claude/skills/weekly-report/SKILL.md`：

```markdown
---
name: weekly-report
description: 按团队固定格式写周报。当用户要求写周报、总结本周工作时使用。
---

按以下结构输出周报：本周完成、遇到的问题、下周计划，每部分不超过 5 条，语气简洁。
```

要点：`name` 只用小写字母、数字和连字符（不写时 Claude Code 默认用文件夹名）；`description` 要同时写清「做什么」和「什么时候用」，Claude 就是靠它判断要不要加载。也可以直接对 Claude 说「帮我把这个流程做成一个 skill」，或安装官方的 `skill-creator` 让它带你写。

## 推荐先装哪些（均来自官方仓库 anthropics/skills）

| 技能 | 适合做什么 |
|---|---|
| docx / xlsx / pptx / pdf | 生成和编辑 Word、Excel、PPT、PDF（claude.ai 已预置） |
| skill-creator | 引导你创建、改进自己的技能，还能测试技能的触发效果 |
| frontend-design | 做新界面时给出视觉方向、字体等设计建议，避免「模板味」 |
| webapp-testing | 用 Playwright 测试本地网页应用、截图、看浏览器日志 |
| mcp-builder | 指导编写 MCP 服务器（Python 或 Node/TypeScript） |
| doc-coauthoring | 按结构化流程和 Claude 协作写方案、技术文档 |
| theme-factory | 给幻灯片、文档、网页套用预设主题（配色与字体） |

许可证提示：仓库里的示例技能大多是 Apache-2.0 开源；docx / pdf / pptx / xlsx 四个文档技能是「源码可见」，不是开源许可，不要拿去二次分发。官方 README 也说明，这些技能主要用于演示和学习，实际在 Claude 里的表现可能和仓库里的实现不同。

## 常见问题

**Q：技能和 Projects（项目）有什么区别？**
项目是把资料和说明绑在某一组对话上；技能是跨对话通用的「做事方法」，在任何对话里都能被自动调用。

**Q：网上下载的技能能直接装吗？**
官方明确提醒：**只装可信来源的技能**（自己写的或 Anthropic 提供的）。技能可以包含脚本，恶意技能可能诱导 Claude 执行危险操作或泄露数据。装之前把 `SKILL.md` 和所有脚本读一遍，特别留意访问外部网址的部分。

**Q：装了技能但 Claude 好像没用上？**
最常见的原因是 `description` 写得太笼统，Claude 判断不出什么时候该用。把触发场景写具体，例如「当用户要求写周报、总结本周工作时使用」。在 Claude Code 里也可以直接输入 `/技能名` 手动调用，确认技能本身是正常的；claude.ai 上则检查该技能的开关是否打开、代码执行是否已开启。

**Q：在 claude.ai 上传的技能，Claude Code 里能用吗？**
如果 Claude Code 是用同一个 claude.ai 账号登录的，可以：官方文档说明会自动把 claude.ai 上启用的技能下载到本地使用。反过来，Claude Code 本地写的技能不会出现在 claude.ai 上；通过 API 上传的技能和 claude.ai 之间也互不同步，需要分别上传。

**Q：免费版能用吗？**
帮助中心文章和定价页都写明 Free、Pro、Max、Team、Enterprise 均可使用技能（包括上传自定义技能）。但开发者文档里仍写着「自定义技能上传限 Pro 及以上、入口在 Settings > Features」，和帮助中心不一致；官方 GitHub 仓库 README 则只提到示例技能已对付费套餐开放。以 claude.ai 当前界面和帮助中心说明为准。如需开通 Pro：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 参考资料

- Using Skills in Claude（帮助中心）：https://support.claude.com/en/articles/12512180-using-skills-in-claude
- 技能、连接器、插件目录（帮助中心）：https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory
- Claude 套餐对比（官方）：https://claude.com/pricing
- Agent Skills 概览（开发者文档）：https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Skills in Claude Code（官方）：https://code.claude.com/docs/en/skills
- 官方技能仓库：https://github.com/anthropics/skills
- 截图来源：Anthropic 官方公告（Skills、文件创建、Claude Code 插件），Analytics Vidhya《Claude Code Custom Commands & Skills》
