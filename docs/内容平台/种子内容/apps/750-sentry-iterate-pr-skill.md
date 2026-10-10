---
title: "iterate-pr skill 是什么、怎么安装使用：让智能体盯着 PR，把 CI 修到通过、把评审意见处理完"
slug: sentry-iterate-pr-skill
name: iterate-pr（getsentry/skills）
url: https://github.com/getsentry/skills/tree/main/skills/iterate-pr
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Code（插件）；Cursor / Cline / GitHub Copilot 等用 npx skills"
trialNote: "`claude plugin marketplace add getsentry/skills` 然后 `claude plugin install sentry-skills@sentry-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "iterate-pr 是 Sentry 工程团队开源的技能：围绕一个 PR 循环执行「拉取评审反馈 → 查 CI → 修复 → 本地验证 → 提交推送 → 继续监控」，高、中优先级意见直接修，低优先级的问你，只剩人工审批时停下汇报。"
checkedOn: 2026-10-11
sources:
  - https://github.com/getsentry/skills/tree/main/skills/iterate-pr
  - https://github.com/getsentry/skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 getsentry/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 getsentry/skills 在 GitHub 约 1045 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

提了 PR 之后的半小时往往很碎：等 CI、看哪个检查挂了、改、再等、再回评审意见。iterate-pr 把这段循环交给智能体。`description`：持续迭代一个 PR，直到可处理的 CI 检查通过、高和中优先级的评审反馈得到处理；用于 PR 的 CI 失败、评审反馈或「刷绿」循环；不等待人工批准、草稿状态或合并门禁。

目录里带四个 Python 脚本（用 `uv run` 执行）：

- `fetch_pr_checks.py`：取 CI 检查状态和失败日志片段，输出 JSON；
- `fetch_pr_feedback.py`：把评审反馈分成 `high`、`medium`、`low`、`bot`、`resolved` 五个桶；
- `monitor_pr_checks.py`：监控检查直到出结果，返回「全部通过」「有失败」「没有注册任何检查」「被评审门禁挡住」等标记；
- `reply_to_thread.py`：回复评审线程。

工作流六步：确认 PR → 处理反馈（高、中优先级直接修，低优先级问你要处理哪些，机器人的提示性评论和已解决的跳过）→ 查 CI 状态 → 修 CI 失败 → 本地验证后提交并推送 → 继续监控并处理新反馈。

退出条件写得很清楚：**成功**是可处理的 CI 通过且反馈清空；**问你**是同一个失败修了两次还没好、反馈含义不清或基础设施问题；**停下**是没有 PR、分支需要变基、只剩人工门禁等。对草稿 PR，它只看已有的检查和反馈，不会擅自标记为「可评审」。脚本出错时退回到直接使用 `gh` 命令。

## 怎么安装

`iterate-pr` 收在 Sentry 的 `sentry-skills` 插件里。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add getsentry/skills
claude plugin install sentry-skills@sentry-skills
```

装好后以 `/sentry-skills:iterate-pr` 的形式出现，也会按场景自动触发。其他智能体用 `npx skills add getsentry/skills`，想只装这一个就按 skills CLI 文档加上 `--skill iterate-pr`。

仓库整体介绍和其他安装方式，详见本站《getsentry/skills 是什么、怎么安装：Sentry 工程团队自用的 Agent Skills（代码评审、提交规范、Django 审查）》。

## 怎么用

在已提 PR 的分支上：

- 「/sentry-skills:iterate-pr」或「把这个 PR 的 CI 修到通过」。
- 「处理一下评审意见，低优先级的先列给我看」。
- 「CI 里只有 lint 挂了，修掉并推上去」。

## 适合谁 / 局限

适合 CI 耗时较长、评审意见多的团队，把机械的往返交出去。局限：它为了让检查通过可能选择最省事的改法，测试挂了要留意它是修了代码还是改了断言；偶发失败和基础设施故障它修不了，会停下来问你；需要本机装好并登录 `gh`，还要有 `uv`。

## 注意事项

- **许可**：Apache-2.0。
- **会自动提交、推送并在 PR 上回复评论**，这些动作以你的 GitHub 身份进行；不希望它直接推送时要事先说明。
- **评审评论属于外部输入**：公开仓库里任何人都能留言，注意别让它把评论里的指令当成你的要求执行。
- 脚本通过 `gh` 访问 GitHub 接口，受你的令牌权限约束。
