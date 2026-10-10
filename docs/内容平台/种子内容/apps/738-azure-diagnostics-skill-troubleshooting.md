---
title: "azure-diagnostics skill 是什么、怎么安装使用：让智能体按流程排查 Azure 线上故障（App Service、容器应用、AKS）"
slug: azure-diagnostics-skill-troubleshooting
name: azure-diagnostics（microsoft/azure-skills）
url: https://github.com/microsoft/azure-skills/tree/main/skills/azure-diagnostics
pricing: "开源免费（MIT）；Azure 资源按微软云计费"
platforms: "GitHub Copilot / Claude Code / Gemini CLI / Cursor / Codex CLI"
trialNote: "`/plugin marketplace add microsoft/azure-skills` 然后 `/plugin install azure@azure-skills`"
products: [github-copilot, claude]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "azure-diagnostics 是微软 Azure Skills 插件里的排障技能：用 AppLens、Azure Monitor 和资源健康状态，按「症状 → 资源健康 → 日志 → 指标 → 近期变更」的顺序排查 App Service、容器应用、Functions、AKS、虚拟机和消息服务的问题。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/azure-skills/tree/main/skills/azure-diagnostics
  - https://github.com/microsoft/azure-skills
  - https://skills.sh/
---

> 本文根据 microsoft/azure-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 55.1 万次；所在仓库 microsoft/azure-skills 在 GitHub 约 1555 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

线上出问题时，最容易犯的错是一头扎进日志。azure-diagnostics 给智能体定了一个固定的排查顺序。`description`：使用 AppLens、Azure Monitor、资源健康状态和安全的分诊流程调试 Azure 上的生产问题。触发场景列了一长串：App Service 高 CPU 和部署失败、容器应用 503 或目标端口不匹配、Functions 的遥测在改配置后消失、AKS 的 Pod 挂起和崩溃循环、虚拟机远程桌面或 SSH 连不上、Event Hubs 与 Service Bus 的连接和消息锁问题等。

**快速诊断流程**五步：确认症状 → 查资源健康（Azure 自己是否正常）→ 看日志 → 分析指标 → 调查近期变更。

规则里有几条体现了「安全分诊」：

- 先用你已经提供的证据。如果你要求只基于证据分析、或不允许访问线上环境，它就不查询也不修改 Azure，只从给定的日志、指标和时间线推断，并说明哪些是假设。
- 有 AppLens（通过 Azure MCP 提供的诊断工具）时优先用它。

按服务分了排障指南：容器应用（镜像拉取失败、冷启动、健康探针、端口不匹配）、App Service（高 CPU、部署失败、崩溃、响应慢、证书与自定义域名）、Functions、AKS、虚拟机连接、消息服务。目录里有五十多个文件，含常用的日志查询语句，以及给 AKS、App Service、容器应用采集证据用的 PowerShell 和 Bash 脚本。

## 怎么安装

`azure-diagnostics` 随微软的 Azure 插件一起安装，插件同时配置好 Azure MCP Server。Claude Code 里（命令来自仓库 README）：

```text
/plugin marketplace add microsoft/azure-skills
/plugin install azure@azure-skills
```

Gemini CLI 用 `gemini extensions install https://github.com/microsoft/azure-skills`，Codex 用 `codex plugin marketplace add microsoft/azure-skills`；GitHub Copilot 的装法见 README。真正操作云资源前，本机要装好 Azure CLI（`az`）并登录，部署类场景还要 Azure Developer CLI（`azd`）。

仓库整体介绍和其他安装方式，详见本站《azure-skills 是什么、怎么安装：微软官方 Azure Skills 插件（技能 + Azure MCP Server，让智能体真正操作 Azure）》。

## 怎么用

- 「我的容器应用一直返回 503，帮我排查」。
- 「昨晚改了连接字符串之后 Function 的遥测就没了，这是日志和时间线，只基于这些分析，不要动线上」。
- 「AKS 上有几个 Pod 一直 Pending，查原因」。

## 适合谁 / 局限

适合在 Azure 上跑服务、又没有专职运维的开发团队，值班时拿来做第一轮排查。局限：能查到什么取决于你的账号权限和资源是否接了日志与监控，没开 Application Insights 的应用能看的很少；它给的是诊断和修复建议，根因涉及业务代码时仍要回到代码里查。

## 注意事项

- **许可**：MIT。
- **会读取线上环境的日志和配置**：日志里可能有用户数据和密钥片段，注意这些内容会进入模型上下文；处理敏感系统时用它的「仅证据」模式，或用只读权限的身份登录。
- **目录里的诊断脚本会在本机执行** `az`、`kubectl` 等命令，运行前可以先看一遍脚本内容。
- 重置虚拟机密码、修改网络规则这类修复动作会改动线上资源，让它先说明打算做什么，确认后再执行。
