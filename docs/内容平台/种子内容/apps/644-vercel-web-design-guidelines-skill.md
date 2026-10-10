---
title: "web-design-guidelines skill 是什么、怎么用：按 Vercel《Web Interface Guidelines》审查界面代码的 Skill"
slug: vercel-web-design-guidelines-skill
name: web-design-guidelines（vercel-labs/agent-skills）
url: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
pricing: "免费（该技能未单独标注许可；仓库 README 写 MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode 等支持 Agent Skills 的智能体"
trialNote: "npx skills add vercel-labs/agent-skills --skill web-design-guidelines"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "web-design-guidelines 是 Vercel 官方的界面审查 Skill：每次审查前在线拉取最新的 Web Interface Guidelines，逐条对照你指定的界面代码，以「文件:行号」的简洁格式列出不符合之处。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
  - https://github.com/vercel-labs/web-interface-guidelines
---

> 本文根据 vercel-labs/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 71.9 万次；所在仓库 vercel-labs/agent-skills 在 GitHub 约 3.2 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

界面「能用」和「好用」之间隔着一大堆细节：焦点状态、键盘可达、加载与空状态、表单错误提示、触控目标大小。Vercel 把这些整理成了一份公开的 Web Interface Guidelines，web-design-guidelines 就是照着它审代码的技能。`description`：审查界面代码是否符合 Web Interface Guidelines；用户说「审查我的 UI」「检查无障碍」「审计设计」「审查 UX」或「对照最佳实践检查我的网站」时使用。

它的实现方式很特别——**技能本身不含任何规则**。SKILL.md 只有四步：

1. 从 `vercel-labs/web-interface-guidelines` 仓库拉取最新的规范文件；
2. 读取你指定的文件（没指定就问你要文件或匹配模式）；
3. 对照拉取到的全部规则检查；
4. 按 `文件:行号` 的简洁格式输出发现的问题。

规则和输出格式都在远端那份文件里，所以规范更新后不用重装技能。

## 怎么安装

仓库 README 给的安装方式是 skills CLI。只装这一个技能，加上 CLI 文档里的 `--skill` 参数（技能名是 `web-design-guidelines`，与仓库里的文件夹名不完全相同）：

```bash
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
```

去掉 `--skill` 会进入选择界面，可以一次勾选多个；加 `-g` 装到用户目录，加 `-a claude-code` 之类的参数指定智能体。

仓库整体介绍和其他安装方式，详见本站《vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）》。

## 怎么用

- 「review my UI：`src/components/**/*.tsx`」。
- 「检查结算页的无障碍问题」——它会拉规范、读文件，再列出类似 `Checkout.tsx:42` 这样的定位和原因。
- 修完再跑一遍，直到清单为空。

## 适合谁 / 局限

适合没有专职设计师或无障碍专家的前端团队，在提交前做一轮快速自查。它是基于源码的静态审查，看不到实际渲染效果，颜色对比、真实的键盘操作流程仍需在浏览器里验证；规范代表 Vercel 的取向，不等同于 WCAG 合规认证。

## 注意事项

- **许可**：技能未单独标注许可，仓库 README 写的是 MIT。
- **每次都要联网**：它用智能体的网页抓取工具访问 GitHub 上的规范文件，离线或网络受限时无法工作。
- **远端内容会进入上下文**：规范文件由 Vercel 维护，来源可靠；但这种「运行时拉取指令」的模式意味着技能行为随远端文件变化，介意的话可以把规范固定一份到本地。
- skills.sh 当日榜单上它排在该库第二位。
