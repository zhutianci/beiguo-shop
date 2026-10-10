---
title: "lark-wiki skill 是什么、怎么安装使用：让智能体管理飞书知识库的空间、节点和成员"
slug: lark-wiki-skill-feishu-knowledge-base
name: lark-wiki（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-wiki
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-wiki 是飞书官方 CLI 自带的知识库技能：创建和查询知识空间、列出与移动节点、复制文档节点、管理空间成员，并规定优先用用户身份、整理类需求转交 lark-drive 的统一工作流。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-wiki
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 46.0 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

飞书知识库的结构是「知识空间 → 节点树」，文档、表格都挂在节点上。lark-wiki 管的是这棵树本身，不管文档里面的内容。`description`（原文是中文）：飞书知识库，管理知识空间、空间成员和文档节点；创建和查询知识空间、查看和管理空间成员、管理节点层级结构、在知识库中组织文档和快捷方式。往节点下上传文件走 `lark-drive`，编辑文档、表格内容分别走 `lark-doc`、`lark-sheets`、`lark-base`。

快捷命令：`+space-list`、`+space-create`、`+delete-space`（空间的列出、创建、删除）；`+node-list`、`+node-get`、`+node-create`、`+node-copy`、`+node-delete`（节点操作）；`+move`（移动节点，或把云空间里的文档移进知识库）、`+move-to-drive`（把节点移出知识库）；`+member-add`、`+member-remove`、`+member-list`（成员管理）。

SKILL.md 里有几条容易踩坑的规定：

- **优先用用户身份**：知识空间属于用户的个人资源。命令的身份参数默认是自动判断，不写时常被解析成应用身份，列出来的就成了应用所属的空间而不是你的，所以要显式写 `--as user`。
- **成员管理的硬限制**：应用身份不能按部门添加空间成员，这是官方限制。遇到这种组合，技能要求直接说明此路不通，不许先试错，也不许悄悄换成用户身份。
- **整理类需求要转交**：按主题搜集资料归到某个节点下，或者盘点、重构知识库目录，不能只靠遍历节点，必须先读 `lark-drive` 的工作流文档，用云空间的全量搜索召回，再出移动计划并在写入前确认。
- **移出知识库**会改变文档的归属和权限继承，执行前要确认源节点和目标位置。

## 怎么安装

`lark-wiki` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这组技能都要求本机有 `lark-cli` 命令，认证与权限处理统一由公共技能 `lark-shared` 负责，两者要一起装上。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「列出我能访问的知识空间，再看看『产品文档』空间的一级目录」。
- 「在『研发规范』空间的『后端』节点下新建一篇文档节点，标题是接口命名约定」。
- 「把张三加为这个知识空间的成员，只读」。

## 适合谁 / 局限

适合负责维护团队知识库的人：建空间、搬目录、管成员这类重复操作交给智能体。局限：它不读写文档正文；大规模重组目录会牵涉很多文档的权限继承，应当先让它输出方案、小范围试过再全量执行；能操作的范围受你在各空间里的角色限制。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议。
- **删除空间、删除节点、移动节点都是高风险写操作**，确认清楚再执行，重要内容先备份。
- **需要飞书应用凭据和用户授权**，由 `lark-cli` 在本机管理。
