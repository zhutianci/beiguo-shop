---
title: Claude Skills 是什么、怎么装、推荐哪些
slug: claude-skills
products: [claude]
models: []
accountTier: PLUS
excerpt: 一篇讲清 Claude Skills（技能）：它和提示词有什么不同，在 claude.ai 网页版和 Claude Code 里分别怎么开启、上传、安装，官方仓库里有哪些值得先装的技能，以及装第三方技能的安全注意事项。
sources:
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - https://code.claude.com/docs/en/skills
  - https://github.com/anthropics/skills
screenshots:
  - claude.ai 设置 → Capabilities 里「Code execution and file creation」开关
  - claude.ai Customize → Skills 页面（技能列表与开关）
  - 「+」→「+ Create skill」→「Upload a skill」上传 ZIP 的弹窗
  - Claude Code 里执行 `/plugin marketplace add anthropics/skills` 后的输出
  - Claude Code 里 `/skills` 列出的技能列表
  - 一次对话中 Claude 自动调用 Word / Excel 技能生成文件的结果
verify:
  - 免费版能否使用 Skills：帮助中心文章写 Free / Pro / Max / Team / Enterprise 都可用，但开发者文档写自定义技能上传限 Pro 及以上，且路径写的是 Settings > Features——用免费号和 Pro 号各实测一次
  - claude.ai 里的菜单路径（Settings > Capabilities、Customize > Skills、「+ Create skill」）是否与当前界面一致
  - anthropics/skills 仓库 README 写「示例技能对付费套餐可用」，与帮助中心说法是否冲突
  - Claude Code 插件市场命令与插件名（document-skills@anthropic-agent-skills 等）在当前版本是否仍有效
---

## 适用于谁

- 经常让 Claude 做**同一类重复工作**的人：按固定格式写周报、按公司模板做 PPT、按固定规范审稿。
- 用 Claude Code 写代码、想把团队的部署 / 测试 / 提交流程固化下来的开发者。
- 搜「claude skills 推荐」「claude skill 怎么装」想先搞懂概念再动手的新手。

## 结论先说

1. **Skill（技能）= 一个文件夹**，核心是一份 `SKILL.md`（说明书），可以附带脚本、模板、参考资料。Claude 判断用得上时会自动加载，不用你每次重复交代。
2. 它和提示词的区别：提示词是一次性的；技能是**按需加载**的——平时只占用「名称 + 一句话描述」的上下文，触发时才读全文，所以装很多个也不太占地方。
3. 三个地方各管各的：**claude.ai 网页 / App、Claude Code、API 的技能互不同步**，在哪用就要在哪装。
4. 先装官方的：Word / Excel / PPT / PDF 文档技能，以及用来「帮你写技能」的 `skill-creator`。第三方技能要先审再装。

## 步骤

### 一、在 claude.ai（网页版 / App）里使用

1. 打开 **Settings → Capabilities**，确认「Code execution and file creation」（代码执行与文件创建）已开启——技能依赖这个运行环境。【截图：Capabilities 开关】
2. 进入 **Customize → Skills**，可以看到官方预置技能和你上传的技能，逐个开关。【截图：Skills 列表】
3. 官方预置的文档类技能（Excel、Word、PowerPoint、PDF）**不用任何设置**，你让 Claude 「做一份 PPT」「整理成 Excel」时会自动用上。
4. 上传自己的技能：把技能文件夹打成 ZIP → 在 Skills 页面点「+」→「+ Create skill」→「Upload a skill」→ 选择 ZIP。【截图：上传弹窗】

> 以上菜单名称来自官方帮助中心，界面可能调整（待实测）。团队版 / 企业版需要管理员先在组织设置里允许技能。

### 二、在 Claude Code 里使用

Claude Code 的技能直接放在硬盘上，不需要上传：

| 位置 | 路径 | 作用范围 |
|---|---|---|
| 个人 | `~/.claude/skills/技能名/SKILL.md` | 你的所有项目 |
| 项目 | `.claude/skills/技能名/SKILL.md` | 当前仓库（可提交到 Git 给同事用） |
| 插件 | 通过插件市场安装 | 以 `/插件名:技能名` 调用 |

**安装官方技能仓库**（在 Claude Code 会话里输入）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

【截图：安装完成的输出】装好后输入 `/skills` 查看已有技能。【截图：/skills 列表】

调用方式两种：**自动**——你的请求和技能描述匹配时 Claude 自己加载；**手动**——在消息开头输入 `/技能名`。

### 三、自己写一个最小技能

在 Claude Code 里新建 `~/.claude/skills/weekly-report/SKILL.md`：

```markdown
---
name: weekly-report
description: 按团队固定格式写周报。当用户要求写周报、总结本周工作时使用。
---

按以下结构输出周报：本周完成、遇到的问题、下周计划，每部分不超过 5 条，语气简洁。
```

要点：`name` 只能用小写字母、数字和连字符；`description` 要同时写清「做什么」和「什么时候用」，Claude 就是靠它判断要不要加载。也可以直接对 Claude 说「帮我把这个流程做成一个 skill」，或安装官方的 `skill-creator` 让它带你写。

## 推荐先装哪些（均来自官方仓库 anthropics/skills）

| 技能 | 适合做什么 |
|---|---|
| docx / xlsx / pptx / pdf | 生成和编辑 Word、Excel、PPT、PDF（claude.ai 已预置） |
| skill-creator | 引导你创建、改进自己的技能 |
| frontend-design | 做新界面时给出视觉方向、字体等设计建议，避免「模板味」 |
| webapp-testing | 用 Playwright 测试本地网页应用、截图、看浏览器日志 |
| mcp-builder | 指导编写 MCP 服务器（Python 或 Node/TypeScript） |
| doc-coauthoring | 按结构化流程和 Claude 协作写方案、技术文档 |
| theme-factory | 给幻灯片、文档、网页套用预设主题（配色与字体） |

许可证提示：仓库里的示例技能是 Apache-2.0 开源；docx / pdf / pptx / xlsx 四个文档技能是「源码可见」，不是开源许可，不要拿去二次分发。

## 常见问题

**Q：技能和 Projects（项目）有什么区别？**
项目是把资料和说明绑在某一组对话上；技能是跨对话通用的「做事方法」，在任何对话里都能被自动调用。

**Q：网上下载的技能能直接装吗？**
官方明确提醒：**只装可信来源的技能**。技能可以包含脚本，恶意技能可能诱导 Claude 执行危险操作或泄露数据。装之前把 `SKILL.md` 和所有脚本读一遍，特别留意访问外部网址的部分。

**Q：装了技能但 Claude 好像没用上？**
最常见的原因是 `description` 写得太笼统，Claude 判断不出什么时候该用。把触发场景写具体，例如「当用户要求写周报、总结本周工作时使用」。在 Claude Code 里也可以直接输入 `/技能名` 手动调用，确认技能本身是正常的；claude.ai 上则检查该技能的开关是否打开、代码执行是否已开启。

**Q：在 claude.ai 上传的技能，Claude Code 里能用吗？**
不能。官方说明三处互不同步，需要分别安装。

**Q：免费版能用吗？**
官方两份文档说法不一致，见本页「待核对」，以实测为准（待实测）。如需开通 Pro：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 参考资料

- Using Skills in Claude（帮助中心）：https://support.claude.com/en/articles/12512180-using-skills-in-claude
- Agent Skills 概览（开发者文档）：https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Skills in Claude Code（官方）：https://code.claude.com/docs/en/skills
- 官方技能仓库：https://github.com/anthropics/skills
