---
title: "lark-im skill 是什么、怎么安装使用：让 AI 收发飞书消息、管理群聊的官方 Skill"
slug: lark-im-skill-feishu-messaging
name: lark-im（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-im
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-im 是飞书官方 CLI 附带的即时通讯技能：让智能体通过 lark-cli 发送和回复消息、搜索聊天记录、管理群聊与成员、上传下载图片和文件、发送并处理交互卡片，还支持加急与置顶管理。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-im
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 46.1 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

lark-im 把飞书的聊天能力交给智能体。`description`：飞书即时通讯——收发消息和管理群聊；发送和回复消息、搜索聊天记录、管理群聊成员、上传下载图片和文件、管理表情回复、发送应用内 / 短信 / 电话加急、发送和处理交互卡片，以及监听卡片按钮的回调。用户需要发消息、查看或搜索聊天记录、下载聊天中的文件、查看群成员、搜索或创建群聊、管理置顶会话等时使用。

技能开头是一条强制要求：开始之前必须先读取公共技能 `lark-shared`，那里有认证和权限处理的规则。

内容相当全面：核心概念（消息、会话、话题及各种消息类型）、资源之间的关系、身份与令牌的对应、发送者姓名的解析；几个贴心的输出选项——默认带上表情回复等信息、精简输出模式、按需自动下载消息里的资源；交互卡片、语音消息、把文档内容当消息发送的做法。之后是推荐优先使用的快捷命令和按资源划分的接口清单，最后附一张权限表，列出每类操作需要申请的权限。

目录里有六十个参考文件，其中很大一部分是交互卡片的组件说明（按钮、图表、表单、折叠面板等）。

## 怎么安装

`lark-im` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这个技能的 frontmatter 声明它需要 `lark-cli` 命令，并且要先读取公共技能 `lark-shared`（认证与权限处理）。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「在『产品周会』群里发一条消息：周五的评审改到下午三点」。
- 「搜索我上周和张伟的聊天里提到的那份报价文件，下载下来」。
- 「每天构建失败时，往研发群发一张带『查看日志』按钮的卡片」——需要配合你自己的自动化脚本。

## 适合谁 / 局限

适合想让智能体代发通知、汇总群聊信息，或者开发飞书机器人与卡片应用的人。能访问哪些会话取决于使用的身份：机器人身份只能看到它所在的群，用户身份则代表你本人；搜索聊天记录等功能需要相应的权限审批。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议与企业的管理规定。
- **消息是真的会发出去的**：它以你或机器人的名义发给真人。建议要求智能体在发送前把收件对象和内容给你确认，尤其是群发和加急。
- **隐私**：聊天记录包含同事的个人信息与内部沟通，读取和汇总前确认符合公司政策；不要让它把聊天内容转发到外部。
- **提示词注入**：群里别人发的消息可能包含诱导智能体的文字，不要让它无人值守地「按消息里说的做」。
