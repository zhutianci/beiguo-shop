---
title: "lark-base skill 是什么、怎么安装使用：让 AI 操作飞书多维表格的官方 Skill（建表、字段、记录、仪表盘）"
slug: lark-base-skill-feishu-bitable
name: lark-base（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-base
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, data-analysis]
excerpt: "lark-base 是飞书官方 CLI 附带的多维表格技能：让智能体通过 lark-cli 完成建表、字段、记录、视图、统计、公式与查找引用、表单、仪表盘、工作流和角色权限等操作，并支持应用模式与模板中心。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-base
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 46.4 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

飞书多维表格（Base）在很多团队里充当轻量数据库：客户台账、项目排期、内容日历都在里面。lark-base 让智能体能像熟练用户一样操作它。`description`：飞书多维表格操作——建表、字段、记录、视图、统计、公式与 lookup、表单、仪表盘、应用模式（BaseApp 的页面与组件）、Workspace 目录、workflow、角色权限、模板中心；遇到 Base、多维表格、bitable 或对应链接时使用。文件导入导出转给 `lark-drive`，认证授权转给 `lark-shared`。

技能先给智能体建立一个资源模型：普通的 Base 是数据容器，由一棵「Block 资源树」和 Base 级配置组成——文件夹、数据表、文档、仪表盘、工作流都是 Block 类型，其中数据表是承载业务数据的核心；高级权限与角色属于 Base 级配置；BaseApp（应用模式）通过页面和组件来组织 Base 的数据，并不是 Base 的别名。

两条前置规则：操作 Base 优先使用用户身份；动手之前必须先**解析目标实体**——弄清链接指向的到底是哪个 Base、哪张表。之后按资源类型分节：数据表、字段、记录、视图、表单、仪表盘、工作流、高级权限等，细节在二十多份参考文件里（字段创建、公式、查找引用、数据查询、仪表盘配置等）。

## 怎么安装

`lark-base` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这个技能的 frontmatter 声明它需要 `lark-cli` 命令，并且要先读取公共技能 `lark-shared`（认证与权限处理）。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「在这个多维表格里新建一张『线索』表，字段有公司名、联系人、来源、阶段、预计金额」。
- 「把这份 CSV 里的 200 条记录写进去，重复的公司名跳过」。
- 「统计每个阶段的线索数量和金额合计，做成一个仪表盘」。

## 适合谁 / 局限

适合用多维表格管理业务数据的运营、销售、项目管理人员，以及想把数据自动写入飞书的开发者。批量写入受飞书开放平台的频率限制，大批量操作会比较慢；公式和查找引用的语法是飞书特有的，生成后要在表格里确认计算结果。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议。
- **批量改动不可轻易撤销**：让它批量更新或删除记录前，先让它说明将要影响多少条，并在副本或测试表上试一遍。
- **权限**：涉及角色与高级权限的操作影响到其他成员能看到什么，谨慎授权。
- 表里的客户信息等属于业务数据，注意所用模型服务的数据条款。
