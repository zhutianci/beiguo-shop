---
title: "skill-scanner skill 是什么、怎么安装使用：装第三方 Skill 之前，先让智能体做一遍安全扫描"
slug: sentry-skill-scanner-skill
name: skill-scanner（getsentry/skills）
url: https://github.com/getsentry/skills/tree/main/skills/skill-scanner
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Code（插件）；Cursor / Cline / GitHub Copilot 等用 npx skills"
trialNote: "`claude plugin marketplace add getsentry/skills` 然后 `claude plugin install sentry-skills@sentry-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "skill-scanner 是 Sentry 工程团队开源的技能安全扫描器：先用脚本做静态扫描，再由智能体逐项分析提示注入、恶意脚本、过度权限、密钥泄露和供应链风险，按置信度过滤误报后给出风险等级报告。"
checkedOn: 2026-10-11
sources:
  - https://github.com/getsentry/skills/tree/main/skills/skill-scanner
  - https://github.com/getsentry/skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 getsentry/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 getsentry/skills 在 GitHub 约 1045 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Agent Skill 本质上是一段会被模型执行的指令，外加可能随附的脚本。从网上装一个不认识的技能，风险和运行一段陌生代码差不多。skill-scanner 用来在安装前审一遍。`description`：扫描智能体技能的安全问题；检查提示注入、恶意脚本、过度权限、密钥暴露和供应链风险，判断一个技能是否可以安全安装。

它是「脚本 + 判断」两段式。随附的 `scan_skill.py`（用 `uv` 运行）做确定性的模式匹配，输出 JSON：发现项、出现的链接、目录结构和各严重级别的数量。SKILL.md 强调脚本只负责机械地找模式，智能体的任务是判断意图、筛掉误报。

八个阶段：

1. 确定扫描目标，列出技能结构（也可以「扫描全部技能」）；
2. 运行静态扫描脚本，脚本失败则转为人工分析；
3. 校验 frontmatter；
4. 提示注入分析；
5. 行为分析——技能让智能体做的事是否与它声称的用途一致；
6. 脚本分析；
7. 供应链评估——依赖、下载地址、外部链接；
8. 权限分析——申请的工具权限是否超出需要。

置信度分三档：模式确认且恶意意图明显的才按严重级别上报；可疑但意图不明的标为「需要核实」；纯理论性的最佳实践问题不上报。它特别提醒最大的风险是把正经的安全类技能误判为恶意，因为这类技能本来就会提到攻击手法。报告包含发现数量、总体风险等级和技能结构。目录里有三份参考：危险代码模式、权限分析、提示注入模式。它自己的 `allowed-tools` 只有读取、搜索和 Bash。

## 怎么安装

`skill-scanner` 收在 Sentry 的 `sentry-skills` 插件里。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add getsentry/skills
claude plugin install sentry-skills@sentry-skills
```

装好后以 `/sentry-skills:skill-scanner` 的形式出现，也会按场景自动触发。其他智能体用 `npx skills add getsentry/skills`，想只装这一个就按 skills CLI 文档加上 `--skill skill-scanner`。

仓库整体介绍和其他安装方式，详见本站《getsentry/skills 是什么、怎么安装：Sentry 工程团队自用的 Agent Skills（代码评审、提交规范、Django 审查）》。

## 怎么用

- 「扫描 `.claude/skills/some-skill` 这个技能，能不能放心用」。
- 「把项目里所有技能都扫一遍，按风险等级排序」。
- 先把第三方技能下载到一个临时目录（不要直接装进技能目录），再让它扫描那个路径。

## 适合谁 / 局限

适合经常试用社区技能的个人，以及要给团队维护「可用技能清单」的负责人。局限：静态扫描加模型判断发现不了所有问题，精心伪装的恶意内容可能漏过，它给的「干净」不等于担保；被扫描的技能内容本身会进入上下文，理论上也可能反过来影响扫描者，所以结论要自己再看一眼关键文件。同类工具还有本站收录的 SkillSpector，可以交叉使用。

## 注意事项

- **许可**：Apache-2.0。
- **会在本机运行 Python 扫描脚本**，需要先安装 `uv`。
- **只读**：流程里没有修改被扫描技能的步骤。
- 扫描通过也建议只从可信来源安装，并留意技能后续更新带来的变化。
