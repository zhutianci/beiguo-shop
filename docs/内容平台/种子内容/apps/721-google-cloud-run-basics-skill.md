---
title: "cloud-run-basics skill 是什么、怎么安装使用：Google 官方的 Cloud Run 部署 Skill（服务、作业、工作池）"
slug: google-cloud-run-basics-skill
name: cloud-run-basics（google/skills）
url: https://github.com/google/skills/tree/main/skills/cloud/cloud-run-basics
pricing: "开源免费（Apache-2.0）；云资源按 Google Cloud 计费"
platforms: "Claude Code / Codex / Antigravity（插件）；其他智能体用 npx skills"
trialNote: "npx skills add google/skills --skill cloud-run-basics"
products: [gemini, claude]
models: [gemini-llm]
topics: [agent-skills, coding]
excerpt: "cloud-run-basics 是 google/skills 里的 Cloud Run 基础技能：指导智能体部署响应 HTTP 请求的服务、运行事件触发或定时的作业，以及处理常驻后台任务的工作池，支持从容器镜像或直接从源码部署。"
checkedOn: 2026-10-11
sources:
  - https://github.com/google/skills/tree/main/skills/cloud/cloud-run-basics
  - https://github.com/google/skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 google/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 google/skills 在 GitHub 约 2.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Cloud Run 是 Google Cloud 上把容器或源码直接跑起来的全托管平台，不用自己管服务器，对独立开发者和小团队很友好。cloud-run-basics 让智能体能替你完成部署。`description`：管理 Cloud Run 的服务、作业和工作池；需要部署响应 HTTP 请求的应用（服务）、运行事件触发或定时的任务（作业），或处理常驻的拉取式后台处理（工作池）时使用。

技能先讲清三种资源类型的区别——这是选型的关键：

1. **服务**（Services）：响应 HTTP 请求，有稳定的访问地址，适合网站和 API；
2. **作业**（Jobs）：跑完就结束的任务，可以手动、按计划或由事件触发；
3. **工作池**（Worker pools）：常驻运行、主动拉取任务的后台处理。

然后是前置条件和所需的角色，接着按类型给出步骤：部署服务（从容器镜像，或直接从源码——由平台代为构建）、创建并执行作业、部署工作池，以及**部署失败时该怎么排查**。七份参考文件覆盖核心概念、命令行、客户端库、基础设施即代码、权限安全、MCP 用法和网络配置。

## 怎么安装

仓库 README 的安装方式是 `npx skills add google/skills`。这个库有一百多个技能，建议用 skills CLI 的 `--skill` 参数只装需要的：

```bash
npx skills add google/skills --skill cloud-run-basics
```

Claude Code 也可以按插件安装：`claude plugin marketplace add google/skills`，再 `claude plugin install <插件名>@google-plugins`（插件划分见仓库的市场清单）。

仓库整体介绍和其他安装方式，详见本站《google/skills 是什么、怎么安装：Google 官方 Agent Skills 仓库（Google Cloud、BigQuery、GKE、Gemini API、广告 SDK）》。

## 怎么用

- 「把当前目录的 Node 应用从源码部署到 Cloud Run，区域选亚洲」。
- 「建一个每天凌晨两点跑的作业，执行这个数据同步脚本」。
- 「部署失败了，帮我看日志找原因」。

## 适合谁 / 局限

适合想把 Web 服务、定时任务快速上云的开发者。它覆盖的是基础部署流程；自定义域名、与其他云服务的私网连接、流量灰度等进阶配置只在参考文件里有部分说明；架构层面的选型（用 Cloud Run 还是 GKE）需要自己判断。

## 注意事项

- **许可**：Apache-2.0。
- **会创建真实的云资源并计费**：按请求和实例运行时间收费，具体以 Google Cloud 官网为准；试验完记得删除不用的服务，并留意是否设置了常驻的最小实例数。
- **访问控制**：部署时「允许未经身份验证的访问」意味着任何人都能访问该地址，内部服务不要这样设置。
- **凭据**：使用你本机 `gcloud` 的登录身份，建议用权限受限的账号。
