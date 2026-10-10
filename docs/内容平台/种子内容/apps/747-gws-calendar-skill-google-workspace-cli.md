---
title: "gws-calendar skill 是什么、怎么安装使用：让智能体用命令行查看和创建 Google 日历日程"
slug: gws-calendar-skill-google-workspace-cli
name: gws-calendar（googleworkspace/cli）
url: https://github.com/googleworkspace/cli/tree/main/skills/gws-calendar
pricing: "开源免费（Apache-2.0）；非 Google 官方支持产品"
platforms: "命令行 gws（Node.js 18+ 或预编译二进制）；技能供 Claude Code、Gemini CLI 等使用"
trialNote: "`npm install -g @googleworkspace/cli` 然后 `npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-calendar`"
products: [gemini, claude]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "gws-calendar 是 Google Workspace CLI（gws）配套的日历技能：提供查看近期日程和新建日程两个快捷命令，并列出日历、日程、忙闲查询、访问控制等接口资源，调用前先查参数结构，写操作先确认。"
checkedOn: 2026-10-11
sources:
  - https://github.com/googleworkspace/cli/tree/main/skills/gws-calendar
  - https://github.com/googleworkspace/cli
  - https://skills.sh/
---

> 本文根据 googleworkspace/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 5.9 万次；所在仓库 googleworkspace/cli 在 GitHub 约 3.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

`description`：Google Calendar——管理日历和日程。它是 gws 命令行日历部分的索引，篇幅不长（四千多字符），结构和同系列技能一致。

- **辅助命令**两个：`+agenda` 显示所有日历上即将到来的日程；`+insert` 新建一个日程。
- **接口资源**：`events`（日程的增删改查、移动、快速添加等）、`calendars`（日历本身）、`calendarList`（你的日历列表）、`freebusy`（忙闲查询）、`acl`（日历的访问控制规则）、`settings`、`colors`、`channels`（变更通知）。
- **发现命令**：`gws calendar --help` 看资源和方法，`gws schema calendar.<资源>.<方法>` 看参数。

有一个方法值得特别小心：`calendars` 下的 `clear` 会清空主日历，SKILL.md 的说明写得很直白——这个操作会删除账户主日历上的全部日程。公共技能 `gws-shared` 的安全规则在这里很有必要：执行写入或删除命令前必须向用户确认，破坏性操作优先加 `--dry-run`。

仓库里还有几个围绕日历的「配方」技能，如找共同空闲时间、安排每周日程、改期会议、预留专注时间，以及一个把「会前准备」串起来的工作流技能，可以和这个基础技能一起装。

## 怎么安装

技能只是说明书，真正干活的是命令行工具 `gws`，所以要装两样（命令来自仓库 README）：

```bash
npm install -g @googleworkspace/cli
npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-calendar
```

第二条是 README 给出的「只装某一个技能」的写法；SKILL.md 开头要求同时读取 `gws-shared`（认证、全局参数和安全规则），缺了它可以运行 `gws generate-skills` 生成。之后执行 `gws auth setup` 和 `gws auth login` 完成 Google 账号授权。Gemini CLI 用户可以直接 `gemini extensions install https://github.com/googleworkspace/cli`。

仓库整体介绍和其他安装方式，详见本站《gws 是什么、怎么安装使用：Google Workspace 命令行工具与 Agent Skills（让智能体操作 Gmail、Drive、日历、表格）》。

## 怎么用

- 「我今天和明天有哪些安排？」——对应 `+agenda`。
- 「周五下午三点建一个一小时的日程，标题是季度复盘，邀请这两个邮箱」。
- 「查一下我和这三位同事下周共同的空闲时段」——走 `freebusy` 查询。

## 适合谁 / 局限

适合用 Google 日历、想让智能体代为查询和排期的人。局限：只有两个封装好的快捷命令，其他操作要智能体自己拼接口参数；时区、重复日程这些细节容易出错，重要日程建好后自己看一眼；首次使用需要配置 Google Cloud 项目和 OAuth。

## 注意事项

- **许可**：Apache-2.0；README 声明非 Google 官方支持产品。
- **创建日程会向受邀人发送邀请**，执行前确认时间和人员。
- **删除与清空操作不可恢复**，尤其是 `clear`。
- 日程里的会议链接、参会人邮箱会进入模型上下文。
