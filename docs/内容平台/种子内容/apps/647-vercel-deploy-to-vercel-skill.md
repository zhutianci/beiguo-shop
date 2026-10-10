---
title: "deploy-to-vercel skill 是什么、怎么用：让智能体把项目部署到 Vercel 的官方 Skill（默认只发预览版）"
slug: vercel-deploy-to-vercel-skill
name: deploy-to-vercel（vercel-labs/agent-skills）
url: https://github.com/vercel-labs/agent-skills/tree/main/skills/deploy-to-vercel
pricing: "免费（该技能未单独标注许可）；部署占用 Vercel 套餐额度"
platforms: "Claude Code / Codex / Cursor / OpenCode 等支持 Agent Skills 的智能体"
trialNote: "npx skills add vercel-labs/agent-skills --skill deploy-to-vercel"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "deploy-to-vercel 是 Vercel 官方的部署 Skill：先检查项目是否已关联、是否有 git 远端和登录状态，再选择 git push、CLI 或免登录兜底方式部署；除非你明确要求，否则只发预览部署。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-skills/tree/main/skills/deploy-to-vercel
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 vercel-labs/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 15.1 万次；所在仓库 vercel-labs/agent-skills 在 GitHub 约 3.2 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「帮我部署一下，给我个链接」——这句话背后有很多分支：项目关联过 Vercel 吗？有没有 git 远端？命令行登录了吗？是在本机还是在沙盒里？deploy-to-vercel 把这些判断写成了流程。`description`：把应用和网站部署到 Vercel；用户说「部署我的应用」「部署并给我链接」「把它上线」或「创建一个预览部署」时使用。

两条原则写在最前面：**永远部署为预览**，除非用户明确要求生产环境；目标是把用户带到最好的长期状态——项目已关联 Vercel、靠 git push 自动部署，每种方法都尽量往这个方向推进。

第一步收集项目状态（是否存在 `.vercel/`、有无 git 远端、CLI 是否已登录、属于哪些团队；有多个团队时列出来让你选）。然后按情况选方法：已关联且有远端就提交并推送；已关联但没有远端就用 CLI 部署；未关联但已登录就先关联；未登录则引导你运行 `vercel login` 在浏览器里完成授权。无法登录的沙盒环境（claude.ai、Codex）各有一套免登录的兜底脚本。

## 怎么安装

仓库 README 给的安装方式是 skills CLI。只装这一个技能，加上 CLI 文档里的 `--skill` 参数（技能名是 `deploy-to-vercel`，与仓库里的文件夹名不完全相同）：

```bash
npx skills add vercel-labs/agent-skills --skill deploy-to-vercel
```

去掉 `--skill` 会进入选择界面，可以一次勾选多个；加 `-g` 装到用户目录，加 `-a claude-code` 之类的参数指定智能体。

仓库整体介绍和其他安装方式，详见本站《vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）》。

## 怎么用

- 「把这个 Next.js 项目部署一个预览，给我链接」。
- 「这次发生产环境」——只有这样明说，它才会走生产部署。
- 部署失败时它会查看构建状态并按说明里的排障小节处理（网络出口受限、CLI 认证失败等）。

目录里带有两个部署脚本，供沙盒环境使用。

## 适合谁 / 局限

适合前端和全栈开发者让智能体代劳日常的预览部署，也适合在 claude.ai 里做完小项目想马上拿到可访问链接的人。它只管 Vercel；数据库迁移、环境变量的业务含义不在它的职责内；免登录兜底会返回一个预览地址和一个认领地址（Claim URL），要用后者把部署转到你自己的账号下。

## 注意事项

- **许可**：该技能未单独标注许可。
- **会执行命令并可能推送代码**：走 git 方式时它会提交并 push，确认当前分支和远端是你想要的。
- **账号与费用**：部署计入你的 Vercel 套餐用量；登录在你自己的浏览器里完成，不要把令牌贴进对话。
- **公开可访问**：预览链接默认任何拿到链接的人都能打开，含敏感数据的项目先配置访问保护。
