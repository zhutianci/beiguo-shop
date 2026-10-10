---
title: "飞书 CLI（lark-cli）是什么、怎么安装：飞书官方命令行工具与 Agent Skills，让 AI 智能体操作飞书"
slug: lark-cli-feishu-agent-skills
name: larksuite/cli（飞书官方 CLI 与 Agent Skills）
url: https://github.com/larksuite/cli
pricing: 开源免费（MIT）；调用飞书开放平台须遵守其协议
platforms: 命令行（需 Node.js）；技能供支持 Agent Skills 的 AI 工具使用
trialNote: "npx @larksuite/cli@latest install"
products: [ai-tools]
models: [any-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "lark-cli 是飞书（Lark）官方开源的命令行工具，自带二十多个 Agent Skills，让 Claude Code 等智能体在终端里收发消息、读写云文档和多维表格、管理日历、任务、邮箱与会议纪要。MIT 协议，npm 一条命令安装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/larksuite/cli
  - https://github.com/larksuite/cli/blob/HEAD/README.zh.md
  - https://open.larkoffice.com/document/mcp_open_tools/feishu-cli/embed-feishu-cli-in-agent
  - https://github.com/vercel-labs/skills
  - https://agentskills.io/home
---

> 本文根据 larksuite/cli 仓库的中英文 README、飞书开放平台文档和 npx skills 工具说明整理，资料核对于 2026-10-10。命令和技能数量更新较快，以仓库 README 为准。

## 是什么

lark-cli 是飞书（海外版叫 Lark）官方的命令行工具，由 larksuite 团队维护，README 的说法是「让人类和 AI Agent 都能在终端中操作飞书」。它包含两层东西：一是 `lark-cli` 这个程序，把飞书开放平台的接口包装成命令；二是随仓库提供的一组 Agent Skills，告诉智能体每个业务域有哪些命令、该怎么调用、要注意什么。两者配合，Claude Code 这类智能体就能替你查日程、发消息、写文档。

README 称覆盖 18 个业务域、200 多条命令。命令分三层：以 `+` 开头的快捷命令（带默认值和预览）、与平台接口一一对应的 API 命令，以及可以直接调用任意开放平台接口的通用命令。

截至 2026-10-10，GitHub 显示该仓库约 1.8 万 Star、1388 Fork，最近一次推送 2026-10-09。

## 包含哪些 Skill

中文 README 的技能表列出 23 个（正文里写的是 26 个，以仓库 `skills/` 目录为准），都以 `lark-` 开头：

- **基础**：`lark-shared`——应用配置、登录认证、身份切换、权限管理和安全规则，其他技能都会自动加载它；
- **沟通**：`lark-im`（消息与群聊）、`lark-mail`（邮箱）、`lark-contact`（通讯录查人）；
- **文档与数据**：`lark-doc`（云文档）、`lark-drive`（云空间文件）、`lark-markdown`（原生 Markdown 文件）、`lark-sheets`（电子表格）、`lark-slides`（幻灯片）、`lark-base`（多维表格）、`lark-wiki`（知识库）、`lark-whiteboard`（画板与图表）；
- **日程与协作**：`lark-calendar`（日历）、`lark-task`（任务）、`lark-meeting`（会议与妙记）、`lark-approval`（审批）、`lark-okr`、`lark-attendance`（考勤记录查询）；
- **事件与扩展**：`lark-event`（实时事件订阅）、`lark-openapi-explorer`（从官方文档探索底层接口）、`lark-skill-maker`（自定义技能的框架）；
- **现成工作流**：`lark-workflow-meeting-summary`（会议纪要汇总成结构化报告）、`lark-workflow-standup-report`（日程与待办摘要）。

## 怎么安装

**方式一：从 npm 安装**（README 推荐，需要 Node.js）：

```bash
npx @larksuite/cli@latest install
```

**方式二：从源码安装**（需要 Go v1.23 以上和 Python 3），这种方式要另外执行一条安装技能的命令，README 标注为必需：

```bash
git clone https://github.com/larksuite/cli.git
cd cli
make install
npx skills add larksuite/cli -y -g
```

**配置与登录**：

```bash
lark-cli config init
lark-cli auth login --recommend
lark-cli calendar +agenda
```

第一条交互式配置应用凭证（只需一次），第二条登录授权，`--recommend` 会自动勾选常用权限，第三条查看今日日程，用来验证是否装好。企业想把它嵌进自研智能体或平台，README 指向飞书开放平台的专门文档。

## 怎么用

- **交给智能体**：装好并登录后，直接说「看看我明天下午有没有空，约个半小时的会」「把这份周报发到飞书云文档」「汇总本周的会议纪要」，智能体会加载相应技能并调用 `lark-cli`；
- **自己敲命令**：例如 `lark-cli calendar +agenda` 看日程，`lark-cli <service> --help` 查看某个业务域的全部快捷命令；
- **先预览再执行**：对会产生实际影响的命令，README 建议加 `--dry-run` 先看请求内容，比如发消息之前；
- **切换身份**：命令可以用 `--as user` 或 `--as bot` 指定以用户还是机器人身份执行。

## 适合谁 / 不适合谁

**适合：**
- 公司用飞书办公、又在用 Claude Code 等命令行智能体的人；
- 想把日程、待办、会议纪要这些重复操作交给 AI 的个人用户；
- 要把飞书能力接进自研智能体的企业 IT 和开发者。

**不适合：**
- 不用飞书的团队；
- 不熟悉命令行、也没有权限在企业里创建和授权应用的普通员工——配置凭证这一步可能需要管理员配合；
- 想让机器人在群里对所有人开放使用的场景，官方明确不建议这样做。

## 注意事项

- **许可证**：MIT（仓库根目录有 LICENSE 文件，版权方 Lark Technologies Pte. Ltd.）。工具运行时调用飞书 / Lark 开放平台接口，还须遵守飞书的用户服务协议、隐私政策和开放平台的相关规范。
- **维护状态**：最近一次推送 2026-10-09，官方团队持续更新。
- **安全（README 有专门的风险提示，务必读）**：授权之后，智能体是以你本人的身份在授权范围内操作飞书，模型出错或被提示词注入时，可能造成数据外泄或越权操作。官方建议把对接的机器人当作私人助手使用，不要拉进群聊，也不要让其他人与它交互；不要主动修改默认的安全配置。授权时只勾需要的权限，发消息、审批、删改文档这类操作先 `--dry-run`。
- **数据说明**：README 披露，为识别令牌被盗用，CLI 向飞书官方域名发请求时默认附带操作系统类型和设备硬件型号两项信息，可用 `lark-cli config risk-control off` 在当前工作区关闭。
- **兼容性**：README 只说技能适配主流 AI 工具，没有逐一列出；飞书项目的能力由另一个独立的 CLI 提供，需单独安装。
