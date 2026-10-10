---
title: "gws-drive skill 是什么、怎么安装使用：让智能体用命令行管理 Google Drive 文件、权限和共享云端硬盘"
slug: gws-drive-skill-google-workspace-cli
name: gws-drive（googleworkspace/cli）
url: https://github.com/googleworkspace/cli/tree/main/skills/gws-drive
pricing: "开源免费（Apache-2.0）；非 Google 官方支持产品"
platforms: "命令行 gws（Node.js 18+ 或预编译二进制）；技能供 Claude Code、Gemini CLI 等使用"
trialNote: "`npm install -g @googleworkspace/cli` 然后 `npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-drive`"
products: [gemini, claude]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "gws-drive 是 Google Workspace CLI（gws）配套的 Drive 技能：列出了 Drive 接口的文件、权限、评论、修订版本、共享云端硬盘等资源和方法，配一个自动补元数据的上传命令，调用前先查参数结构。"
checkedOn: 2026-10-11
sources:
  - https://github.com/googleworkspace/cli/tree/main/skills/gws-drive
  - https://github.com/googleworkspace/cli
  - https://skills.sh/
---

> 本文根据 googleworkspace/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.2 万次；所在仓库 googleworkspace/cli 在 GitHub 约 3.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

gws-drive 是 gws 命令行里 Google Drive 那一部分的说明书。`description`：Google Drive——管理文件、文件夹和共享云端硬盘。和 gws 的其他技能一样，它不讲操作流程，主要是一份「有哪些资源、每个资源有哪些方法」的清单，一万三千多字符里绝大部分是接口方法的逐条说明。

内容结构：

- **辅助命令**只有一个：`+upload`，上传文件并自动填好元数据。
- **接口资源**十几类：`files`（文件与文件夹的创建、复制、导出、列出、更新、删除等）、`permissions`（谁能访问）、`comments` 与 `replies`（评论和回复）、`revisions`（修订版本）、`drives`（共享云端硬盘）、`changes`（变更记录）、`accessproposals`（访问申请的查看与审批）、`approvals`、`about`（账户与容量信息）等。每个方法带一句说明，不少还附了 Google 开发者文档的链接。
- **发现命令**：先 `gws drive --help` 浏览，再用 `gws schema drive.<资源>.<方法>` 看参数。

通用的调用格式在公共技能 `gws-shared` 里：`gws <服务> <资源> <方法>`，查询参数用 `--params` 传 JSON，请求体用 `--json`，下载用 `-o` 指定保存路径，`--page-all` 自动翻页。那里的安全规则同样适用：写入和删除前先确认，破坏性操作优先 `--dry-run`。

## 怎么安装

技能只是说明书，真正干活的是命令行工具 `gws`，所以要装两样（命令来自仓库 README）：

```bash
npm install -g @googleworkspace/cli
npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-drive
```

第二条是 README 给出的「只装某一个技能」的写法；SKILL.md 开头要求同时读取 `gws-shared`（认证、全局参数和安全规则），缺了它可以运行 `gws generate-skills` 生成。之后执行 `gws auth setup` 和 `gws auth login` 完成 Google 账号授权。Gemini CLI 用户可以直接 `gemini extensions install https://github.com/googleworkspace/cli`。

仓库整体介绍和其他安装方式，详见本站《gws 是什么、怎么安装使用：Google Workspace 命令行工具与 Agent Skills（让智能体操作 Gmail、Drive、日历、表格）》。

## 怎么用

- 「列出我云端硬盘里最近一周修改过的文档」。
- 「把 `report.pdf` 上传到『季度汇报』文件夹」——对应 `+upload`。
- 「查一下这个文件夹对外共享给了哪些人，列成表，先不要改权限」。

仓库里另有一批以 `recipe-` 开头的「配方」技能，把常见任务写成了现成步骤，例如找出占空间的大文件、批量下载文件夹、整理文件夹，可以按需加装。

## 适合谁 / 局限

适合要批量整理 Drive、做权限盘点或把文件操作写进自动化流程的人。局限：技能只是接口索引，「先查什么再改什么」要靠你的指令和智能体自己摸索；Drive 的搜索语法和字段选择有学习成本；需要自备 Google Cloud 项目完成 OAuth 配置。

## 注意事项

- **许可**：Apache-2.0；README 声明非 Google 官方支持产品。
- **权限与删除操作影响他人**：改共享设置、删除文件这类动作务必先看它打算执行的命令。
- **文件内容和文件名会进入模型上下文**，授权时只给需要的范围。
- 上传的是本机文件，确认路径无误。
