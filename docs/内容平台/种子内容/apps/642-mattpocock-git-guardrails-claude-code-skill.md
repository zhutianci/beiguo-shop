---
title: "git-guardrails-claude-code 是什么、怎么用：给 Claude Code 装上拦截危险 git 命令的 Hook"
slug: mattpocock-git-guardrails-claude-code-skill
name: git-guardrails-claude-code（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/misc/git-guardrails-claude-code
pricing: "开源免费（MIT）"
platforms: "Claude Code"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "git-guardrails-claude-code 是 mattpocock/skills 的安全技能：为 Claude Code 配置 PreToolUse Hook，在执行前拦截 git push、reset --hard、clean -f、branch -D、checkout . 等危险命令。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/misc/git-guardrails-claude-code
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 45.1 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

放手让 Claude Code 自动执行命令，最怕的就是它一条 `git reset --hard` 把没提交的工作抹掉，或者擅自 `git push`。git-guardrails-claude-code 用 Claude Code 的 Hook 机制加一道硬拦截。`description`：设置 Claude Code 的 Hook，在危险的 git 命令执行之前将其阻止；用户想防止破坏性的 git 操作、添加 git 安全 Hook，或在 Claude Code 里禁止 push / reset 时使用。

它设置的是一个 **PreToolUse Hook**——在工具调用真正发生之前运行。被拦截的命令清单是：

- `git push`（所有变体，包括 `--force`）；
- `git reset --hard`；
- `git clean -f` / `git clean -fd`；
- `git branch -D`；
- `git checkout .` / `git restore .`。

命令被拦下时，Claude 会收到一条消息，告诉它没有权限使用这些命令。

安装过程是技能带着你做的五步：问你装到**当前项目**（`.claude/settings.json`）还是**所有项目**（`~/.claude/settings.json`）→ 把目录里自带的 `block-dangerous-git.sh` 复制到对应的 hooks 目录并加上可执行权限 → 在设置文件里登记这个 Hook → 问你要不要增减拦截规则 → 验证是否生效。

## 怎么安装

`git-guardrails-claude-code` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 对 Claude Code 说「帮我设置 git guardrails」，按提问选择作用范围。
- 「把 `git commit --amend` 也加进拦截清单」——第四步支持自定义。
- 装好后可以故意让它执行一次 `git push` 试试，应当被拒绝并说明原因。

## 适合谁 / 局限

适合开着自动批准模式、或经常让 Claude Code 长时间自主运行的人，也适合给团队仓库统一加一层保护。它只对 Claude Code 生效，其他智能体有各自的权限机制；拦截基于命令文本匹配，属于防误操作的护栏，不是安全边界——别指望它挡住所有绕行写法。你自己需要推送时，在终端里手动执行即可。

## 注意事项

- **许可**：MIT。
- **会修改 Claude Code 的设置文件并放置一个 shell 脚本**：脚本很短，建议装之前读一遍。
- Hook 是一个 shell 脚本，Windows 用户要确认 Claude Code 所在环境能运行它（例如通过 Git Bash 或 WSL）。
- 这是库里可以由模型自动触发的技能。
