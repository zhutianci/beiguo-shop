---
title: "lark-task skill 是什么、怎么安装使用：让智能体创建和跟进飞书任务、清单与子任务"
slug: lark-task-skill-feishu-todo
name: lark-task（larksuite/cli）
url: https://github.com/larksuite/cli/tree/main/skills/lark-task
pricing: "开源免费（MIT）；调用飞书开放平台须遵守其协议"
platforms: "命令行（需 Node.js）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "npx @larksuite/cli@latest install"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-task 是飞书官方 CLI 自带的任务技能：创建待办、查看和更新任务状态、拆分子任务、组织任务清单、分配负责人、设置提醒和上传附件，并要求智能体先确认命令真实存在再执行。"
checkedOn: 2026-10-11
sources:
  - https://github.com/larksuite/cli/tree/main/skills/lark-task
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
---

> 本文根据 larksuite/cli 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 45.8 万次；所在仓库 larksuite/cli 在 GitHub 约 1.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

会议结束后的待办散落在聊天记录里是常态。lark-task 让智能体把它们落进飞书任务。`description`（原文是中文）：飞书任务，管理任务、清单和任务智能体；创建待办任务、查看和更新任务状态、拆分子任务、组织任务清单、分配协作成员、上传任务附件，以及注册或注销任务智能体、写入智能体任务记录。

快捷命令覆盖了日常操作：`+create`（建任务）、`+update`、`+complete` / `+reopen`（完成 / 重新打开）、`+assign`（分配或移除成员）、`+followers`（关注人）、`+reminder`（提醒）、`+comment`（评论）、`+set-ancestor`（设置父任务）、`+get-my-tasks`（分配给我的任务）、`+get-related-tasks`（与我相关的任务）、`+search`、`+upload-attachment`，以及清单相关的 `+tasklist-create`、`+tasklist-search`、`+tasklist-task-add`、`+tasklist-members`。

SKILL.md 最靠前的一节叫「命令选择与渐进式发现」，是为了防止智能体瞎编命令：

1. 先把你的意图和快捷命令表精确匹配；
2. 对不上，或不确定当前版本是否支持，就运行 `lark-cli task --help`，以实际输出为准；
3. 仍没有匹配的快捷命令时，改用原生的资源方法，先查参数结构再调用；
4. 遇到「未知子命令」的报错必须停止猜测，回到第 2 步。

还有两处细节：飞书任务里的「分组」对应的是 sections，「任务清单」对应 tasklists，归属不明时先问清楚再查；找任务时，有关键词才用搜索，只有范围条件（如「今年已完成的」）时走列表查询。末尾附有各操作需要的权限表。

## 怎么安装

`lark-task` 依赖飞书官方命令行工具 `lark-cli`，技能随 CLI 的安装向导一起装好（命令来自仓库 README）：

```bash
npx @larksuite/cli@latest install
```

它会安装 CLI 和配套技能；之后按 README 依次运行 `lark-cli config init`（配置飞书应用）和 `lark-cli auth login --recommend`（完成授权）。只想补装技能，可以用 `npx skills add larksuite/cli -y -g`。这组技能都要求本机有 `lark-cli` 命令，认证与权限处理统一由公共技能 `lark-shared` 负责，两者要一起装上。

仓库整体介绍和其他安装方式，详见本站《飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书》。

## 怎么用

- 「把这份会议纪要里的行动项建成飞书任务，负责人按纪要里写的分配，截止日期都设到周五」。
- 「我这周还有哪些没完成的任务？」
- 「给『官网改版』清单加三个子任务，并提醒我周三跟进」。

## 适合谁 / 局限

适合用飞书任务管理团队待办的人，尤其是想把「纪要 → 待办」这一步自动化的场景；和 `lark-doc`、`lark-im` 搭配能串成完整流程。局限：它只管飞书任务，不管飞书项目等其他产品；分配给别人的任务对方会收到通知，批量创建前先让它列出清单确认；可见和可改的范围受授权与权限限制。

## 注意事项

- **许可**：MIT；调用飞书开放平台须遵守其协议。
- **会真实创建、修改任务并通知相关人**。
- **需要飞书应用凭据和授权**，由 `lark-cli` 在本机管理；任务内容会进入模型上下文。
- 「任务智能体」相关的注册与写入属于进阶能力，普通使用不需要碰。
