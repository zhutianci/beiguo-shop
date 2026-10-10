---
title: "lark-calendar skill 是什么、怎么安装使用：让智能体查飞书日程、约会议、订会议室"
slug: lark-calendar-skill-feishu
name: lark-calendar（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-calendar
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-calendar 是飞书官方 CLI 自带的日历技能：查看和搜索日程、创建与修改日程、管理参会人、查询忙闲并推荐时段、查找和预定会议室，并规定了时间推断与会议室预定的操作规范。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-calendar
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 45.7 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「帮我约小王小李下周找个都有空的时间开一小时会，订个会议室」——这句话背后是查忙闲、选时段、找会议室、建日程、发邀请五件事。lark-calendar 把它们接到飞书日历上。`description`（原文是中文）：飞书日历，管理日历日程和会议室；查看 / 搜索日程、创建 / 更新日程、管理参会人、查询忙闲和推荐时段、预定会议室。查过去的视频会议记录走 `lark-meeting`，待办任务走 `lark-task`。

SKILL.md 列出的快捷命令包括：`+agenda`（看日程安排，默认今天）、`+get`、`+search-event`（按关键词、时间范围和参会人搜索）、`+create`、`+update`、`+delete`、`+freebusy`（查忙闲）、`+suggestion`（综合工作时间、忙碌区间和休息时间推荐时段）、`+room-find`（找可用会议室）、`+rsvp`（接受 / 拒绝 / 待定）。

几条值得注意的规范：

- **身份**：管自己的日程用用户身份（默认），应用机器人自己创建的日程才用机器人身份。
- **时间推断**：周一是一周的第一天；「明天」指一整天，不要自行缩小范围；不能预约已经完全过去的时间。
- **会议室**：凡是预定或查询会议室，都要先走专门的排期流程；`+room-find` 只接受确定的时间块，你没说具体时间时必须先用 `+suggestion` 拿到可用时段，严禁猜一个时间去查。
- **重复日程**：修改或删除时必须指明作用范围。
- **写操作反馈**：创建、更新之后直接按返回结果告诉你，不为「确认是否生效」再查一遍。

## 怎么安装

`lark-calendar` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这组技能都要求本机有 `lark-cli` 命令，认证与权限处理统一由公共技能 `lark-shared` 负责，两者要一起装上。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「我明天有哪些会？」
- 「约张三、李四下周二下午开一小时评审，找个三个人都有空的时间，再订一间会议室」。
- 「把周四的周会往后挪半小时，只改这一次」。

## 适合谁 / 局限

适合用飞书办公、经常要协调多人时间的人，也适合把「排会」接进自己的智能体工作流。局限：能看到谁的忙闲、能订哪些会议室，取决于企业的权限设置和应用授权；口头说的时间有歧义时它会按规范推断，重要会议最好给出明确的日期和时刻。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议。
- **会真实创建日程并向参会人发出邀请**：发出去的邀请同事会收到通知，建议先让它复述一遍时间、参会人和会议室再执行。
- **需要飞书应用凭据和用户授权**，由 `lark-cli` 在本机管理；日程内容会进入模型上下文。
