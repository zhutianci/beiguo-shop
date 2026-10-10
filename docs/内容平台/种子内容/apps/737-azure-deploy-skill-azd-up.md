---
title: "azure-deploy skill 是什么、怎么安装使用：让智能体执行 azd up / terraform apply，并带上部署前检查"
slug: azure-deploy-skill-azd-up
name: azure-deploy（microsoft/azure-skills）
url: https://github.com/microsoft/azure-skills/tree/main/skills/azure-deploy
pricing: "开源免费（MIT）；Azure 资源按微软云计费"
platforms: "GitHub Copilot / Claude Code / Gemini CLI / Cursor / Codex CLI"
trialNote: "`/plugin marketplace add microsoft/azure-skills` 然后 `/plugin install azure@azure-skills`"
products: [github-copilot, claude]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "azure-deploy 是微软 Azure Skills 插件里的部署执行技能：只对已经准备并验证过的项目运行 azd up、azd deploy、terraform apply 和 az deployment，带部署前检查清单、错误恢复、权限核对和结果验证。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/azure-skills/tree/main/skills/azure-deploy
  - https://github.com/microsoft/azure-skills
  - https://skills.sh/
---

> 本文根据 microsoft/azure-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 55.0 万次；所在仓库 microsoft/azure-skills 在 GitHub 约 1555 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

这是「准备 → 验证 → 部署」三段流程的最后一棒。`description`：为**已经准备好**的应用执行 Azure 部署——项目里已有 `.azure/deployment-plan.md` 和基础设施文件；运行 `azd up`、`azd deploy`、`terraform apply` 和 `az deployment`，内置错误恢复。用户说「创建并部署」「新建应用」时不该用它，那是 `azure-prepare` 的事。

SKILL.md 开头是一段强制的前置检查：计划文件必须存在，并且状态必须是 `Validated`。它特别禁止智能体自己把状态改成已验证——只有 `azure-validate` 在真正跑过检查后才能写这个状态，跳过验证「只会导致部署失败」。

步骤表共十步：

1. 读计划，确认状态和验证证据；
2. 完成部署前检查清单；
3. 按计划里的配方类型加载对应做法（azd、Azure CLI 等各有一套）；
4. 权限健康检查——例如容器应用通过托管身份拉取镜像时，先预配资源，确认拉取镜像的角色已经生效；
5. 执行部署；
6. 部署后配置（如数据库的托管身份、数据迁移）；
7. 出错时查该配方的错误对照表；
8. 确认部署完成、端点可访问；
9. 到 Azure 上查询实际分配的角色是否正确够用；
10. 把访问地址以完整的 `https://` 链接报告给你。

规则里还有一条：破坏性操作必须先征得你的同意。

## 怎么安装

`azure-deploy` 随微软的 Azure 插件一起安装，插件同时配置好 Azure MCP Server。Claude Code 里（命令来自仓库 README）：

```text
/plugin marketplace add microsoft/azure-skills
/plugin install azure@azure-skills
```

Gemini CLI 用 `gemini extensions install https://github.com/microsoft/azure-skills`，Codex 用 `codex plugin marketplace add microsoft/azure-skills`；GitHub Copilot 的装法见 README。真正操作云资源前，本机要装好 Azure CLI（`az`）并登录，部署类场景还要 Azure Developer CLI（`azd`）。

仓库整体介绍和其他安装方式，详见本站《azure-skills 是什么、怎么安装：微软官方 Azure Skills 插件（技能 + Azure MCP Server，让智能体真正操作 Azure）》。

## 怎么用

在跑过 prepare 和 validate 的项目里：

- 「执行部署」「run azd up」——触发词包括 push to production、go live、ship it。
- 「代码改了，只更新应用，不动基础设施」——对应 `azd deploy`。
- 「部署失败了，按错误信息排查后重试」。

如果它发现没有计划文件或状态不对，会停下来让你先走前两步，这是设计如此。

## 适合谁 / 局限

适合希望部署过程有固定检查点的团队，而不是让智能体凭印象敲命令。局限：它只负责执行，应用和基础设施的设计问题要回到 prepare 阶段解决；自动的错误恢复只覆盖参考文件里列出的常见情况；生产环境是否允许智能体直接发布，应当由团队自己的发布流程决定，稳妥的做法是先用于开发和测试环境。

## 注意事项

- **许可**：MIT。
- **会真实创建和修改云资源**：这一步开始产生 Azure 费用，执行前确认订阅、区域和资源组；不再需要的环境记得清理。
- **使用本机的 `az` / `azd` 登录身份**，权限等同于你本人；建议用权限受限的账号或服务主体，而不是订阅所有者。
- 部署可能包含数据库迁移等不易回退的操作，重要环境先做备份。
