---
title: "lark-doc skill 是什么、怎么安装使用：让 AI 读写飞书云文档的官方 Skill（Docx / Wiki）"
slug: lark-doc-skill-feishu
name: lark-doc（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-doc
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-doc 是飞书官方 CLI 附带的云文档技能：让智能体通过 lark-cli 读取、创建和编辑飞书文档与知识库页面，插入或下载图片附件，操作思维笔记，并内置会议纪要、PRD、汇报等多种文体的写作参考。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-doc
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 46.7 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

飞书文档是很多团队的日常载体，让 AI 直接读写它，比来回复制粘贴高效得多。lark-doc 是飞书官方命令行工具 lark-cli 配套的云文档技能。`description`：飞书云文档（Docx / Wiki）内容操作——读取、创建、编辑文档，插入或下载图片附件，以及操作思维笔记；用户提供文档 URL 或 token 时使用，按 URL 路径和 token 而不是域名来判断类型。它同时划清了边界：独立的评论操作归 `lark-drive`，表格和多维表格内部的数据操作不在这个技能里。

SKILL.md 很短，是一张「场景路由表」。最重要的一条规则写在最前面：**先判断场景，再读取该场景的参考文件**，不要在任务开始时一次性读完所有参考——这是为了节省上下文。场景大致分三类：文档内容（读取与摘要、创建、编辑）、辅助能力、资源与画板及思维笔记。另一条规则是文档操作推荐显式使用用户身份（`--as user`）。

目录里有四十多个参考文件，其中一组按**文体**组织：商业分析、数据报告、邮件、执行计划、正式公文、会议纪要、备忘简报、PRD、提案、调研报告、复盘等，写对应类型的文档时才加载。

## 怎么安装

`lark-doc` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这组技能都要求本机有 `lark-cli` 命令，认证与权限处理统一由公共技能 `lark-shared` 负责，两者要一起装上。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「读一下这个飞书文档（贴链接），总结成五条要点」。
- 「把今天的会议记录整理成会议纪要，新建一篇飞书文档」。
- 「在这篇方案的『风险』一节后面补一段，说明上线回滚步骤」。

## 适合谁 / 局限

适合日常用飞书办公、并且在用 Claude Code、Codex 等命令行智能体的个人和团队。它需要你有一个飞书应用并完成授权，能读写哪些文档取决于授权范围和你本人的文档权限；排版复杂的文档（多层嵌套、特殊组件）编辑后要检查显示是否正常。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其开发者协议。
- **权限最小化**：授权时只给需要的范围。有了写权限，智能体就能修改甚至覆盖文档，重要文档先确认有版本历史可回退。
- **企业数据**：文档内容会进入所用模型的上下文，使用前确认符合公司对 AI 工具的规定。
- **提示词注入**：别人共享给你的文档里可能含有诱导智能体的文字，读外部文档时不要同时授予高风险操作权限。
