---
title: "lark-drive skill 是什么、怎么安装使用：让智能体管理飞书云空间（上传下载、导入导出、评论与权限）"
slug: lark-drive-skill-feishu-cloud-space
name: lark-drive（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-drive
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-drive 是飞书官方 CLI 自带的云空间技能：搜索云文档、上传下载文件、建文件夹、复制移动、本地目录同步，把 Word / Markdown / Excel / PPTX 导入成在线文档，并处理评论、权限和历史版本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-drive
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 46.1 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

飞书的「云空间」也叫云盘、我的空间，是所有在线文档和文件的存放处。lark-drive 管的是文件这一层：找到、搬动、导入导出、谁能看。`description`（原文是中文）：飞书云空间，管理文件和文件夹，包含上传 / 下载、创建文件夹、复制 / 移动 / 删除、查看元数据、评论 / 权限 / 订阅、标题、版本、文档密级标签和本地文件导入；整理云盘目录、处理云空间链接、判断链接类型，或把 Word、Markdown、Excel、CSV、PPTX 导入成在线文档、表格、多维表格、幻灯片时使用。文档内容编辑、表内数据操作、知识库节点管理分别走别的技能。

快捷命令有三十来个，按用途分：

- **找与看**：`+search`（搜索文档、知识库、表格、文件夹）、`+inspect`（识别一个链接的类型、真实标识和标题）、`+preview`；
- **传与同步**：`+upload`、`+download`、`+create-folder`，以及 `+status`、`+pull`、`+push`、`+sync`（比较并同步本地目录与云端文件夹）；
- **整理**：`+copy`、`+move`、`+create-shortcut`；
- **格式转换**：`+import`（本地文件转在线文档）、`+export`（在线文档导出为本地文件）；
- **评论**：添加、列出、解决、恢复评论，以及回复和表情回应；
- **版本**：查看、下载、回滚、删除历史版本。

SKILL.md 开头有两条分流规则值得记住：把本地 Excel 或 CSV 导入成多维表格，要用 `drive +import --type bitable`，不要先切去 `lark-base`；复制在线文档要用 `+copy`，不要「导出再导入」或「读出正文再新建」来模拟。对删除、公开权限修改、转移所有者、版本回滚、批量移动覆盖这些高风险写操作，技能要求同时满足几项条件才能执行。

## 怎么安装

`lark-drive` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这组技能都要求本机有 `lark-cli` 命令，认证与权限处理统一由公共技能 `lark-shared` 负责，两者要一起装上。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「在云空间里搜标题带『复盘』的文档，列出最近十篇」。
- 「把 `docs/` 目录下的 Markdown 文件导入成飞书文档，放进『项目资料』文件夹」。
- 「把这篇文档（贴链接）里未解决的评论整理成一张表」。

## 适合谁 / 局限

适合要批量整理云盘、把本地资料迁进飞书，或者想让智能体处理文档评论的团队。局限：导入转换的还原度取决于飞书自身的导入能力，复杂排版可能走样；双向同步涉及覆盖，先用 `+status` 看差异再决定；它不编辑文档正文。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议。
- **会上传本机文件、下载云端文件**：确认上传的目录里没有不该进公司云盘的东西。
- **权限和删除类操作影响他人访问**，执行前让它复述目标和范围。
- **需要飞书应用凭据和用户授权**，由 `lark-cli` 在本机管理。
