---
title: "i-have-adhd 是什么、怎么安装使用：让 Claude Code 先说结论、分步编号、不再废话的输出风格 Skill"
slug: i-have-adhd-skill-concise-output
name: i-have-adhd（ayghri/i-have-adhd）
url: https://github.com/ayghri/i-have-adhd
pricing: "开源免费（MIT）"
platforms: "Claude Code（插件）；其他智能体按仓库 INSTALL.md / AGENTS.md 安装"
trialNote: "`claude plugin marketplace add ayghri/i-have-adhd` 然后 `claude plugin install i-have-adhd@i-have-adhd`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "i-have-adhd 是一个改变智能体回答方式的 Skill：十条规则要求先给下一步动作、多步任务编号、结尾只留一个具体的下一步、砍掉铺垫和客套，让答案不被埋在长篇大论里。不需要任何诊断也能用。"
checkedOn: 2026-10-11
sources:
  - https://github.com/ayghri/i-have-adhd
  - https://github.com/ayghri/i-have-adhd/blob/main/INSTALL.md
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 ayghri/i-have-adhd 仓库 README 与 INSTALL.md 整理，资料核对于 2026-10-11。

## 是什么

i-have-adhd 解决的问题人人都遇到过：问智能体一个问题，它先夸一句「好问题」，再铺垫三段背景，真正要你做的事藏在第四段中间，末尾还附一句「希望对你有帮助」。README 的一句话介绍是：一个让你的编程助手不再把答案埋起来的技能——动作在前，步骤编号，没有客套。

名字来自它的出发点：对注意力容易分散的人来说，冗长的回答尤其难以消化。但 README 开头就写了「不需要 ADHD 诊断」——它只是一种更干脆的输出风格，谁都可以用。致谢里说明，规则大致参考了一本面向成人 ADHD 的工具书，并改写成「大模型应该怎样回答」，而不是「人应该怎样安排一天」。它是输出风格工具，不是医疗建议。

README 用一组前后对比说明效果：之前是一大段夹着行号和「也许可以」的叙述；之后是一句「编辑 `src/auth.ts:42`，更新令牌校验」，接着三步编号操作，最后一句「下一步：如果有测试失败，把第一行报错贴给我」。

截至 2026-10-11，GitHub 显示该仓库约 5.6 万 Star、3211 Fork，最近一次推送在 2026-10-06。

## 包含哪些 Skill

仓库只有一个技能，核心是十条规则（README 列出，全文在 SKILL.md）：

1. 先说下一步动作；
2. 多步骤任务要编号；
3. 结尾给一个具体的下一步；
4. 压住题外话；
5. 每一轮都重述当前状态；
6. 时间估计要具体（多少分钟，而不是「一会儿」）；
7. 让进展看得见；
8. 报错就事论事；
9. 列表不超过 5 项；
10. 没有开场白，没有复述，没有结束语。

## 怎么安装

README 推荐的办法是把下面这句话直接发给你的编程助手，让它按仓库的 AGENTS.md 自行安装：

```text
Install the i-have-adhd skill/plugin from https://github.com/ayghri/i-have-adhd, refer to the repo's AGENTS.md for instructions.
```

INSTALL.md 里 Claude Code 的手动命令是：

```bash
claude plugin marketplace add ayghri/i-have-adhd
claude plugin install i-have-adhd@i-have-adhd
```

暂时不想用可以 `claude plugin disable i-have-adhd`，彻底移除则先 uninstall 再移除市场。

## 怎么用

- 安装并重启后输入 `/i-have-adhd` 启用，之后照常提问，回答会变成「动作 + 编号步骤 + 一个下一步」的形状；
- 想调整规则（比如把列表上限改成 7 项）：README 的做法是 fork 仓库，改 `skills/i-have-adhd/SKILL.md`，卸载上游版本后换装自己的；
- README 有多种语言版本，包括中文。

## 适合谁 / 不适合谁

**适合：** 觉得智能体回答太啰嗦、想要「告诉我现在该做什么」的人；容易在长回答里迷路的人。

**不适合：** 需要完整推理过程和背景解释的场景，例如学习一个新概念或做方案评审——它会压掉铺垫和题外话；长篇写作任务。

## 注意事项

- **许可证**：MIT。
- **它改的是表达，不是能力**：答案变短不代表更正确，关键操作仍要自己核对。
- **与同类技能叠加要小心**：和本站介绍过的 caveman 等「精简输出」类技能同时启用，规则可能互相冲突，选一个即可。
- **安装方式**：让智能体「自己读仓库说明并安装」很方便，但等于授权它执行仓库里写的步骤，建议先自己看一眼 AGENTS.md 和 INSTALL.md。
- 技能只有说明文字，不执行脚本、不联网。
