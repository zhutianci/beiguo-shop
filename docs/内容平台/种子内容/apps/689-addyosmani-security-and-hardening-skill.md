---
title: "security-and-hardening skill 是什么、怎么安装使用：Addy Osmani 的 Web 应用安全加固 Skill（先做威胁建模）"
slug: addyosmani-security-and-hardening-skill
name: security-and-hardening（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill security-and-hardening"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "security-and-hardening 是 addyosmani/agent-skills 里的安全开发技能：处理用户输入、认证、数据存储或外部集成时先做威胁建模，按「必须做、先问人、绝不做」三级边界和一组加固措施来写代码与评审。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 5.6 万次；所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

智能体生成的代码最常见的安全问题不是高深的漏洞，而是基础项：拼接 SQL、没校验权限、把密钥写进代码、文件上传不限制类型。security-and-hardening 把这些基础项变成写代码时的硬约束。技能的概述是：把每个外部输入都当作有敌意的，把每个密钥都当作神圣的，把每次授权检查都当作必需的；安全不是一个阶段，而是对每一行接触用户数据、认证或外部系统的代码的约束。

`description` 的适用场景：审计输入处理逻辑、处理用户输入、认证、数据存储或外部集成，对照 OWASP Top Ten 检查登录流程；构建任何接受不可信数据、管理用户会话或与第三方服务交互的功能；审计依赖的已知漏洞、评估新依赖的供应链风险；涉及个人数据和隐私合规（GDPR、CCPA）时。

结构上先要求**威胁建模**，然后是一个**三级边界**：始终要做（没有例外）、先问人（需要人批准）、绝不能做。加固措施分门别类：注入、跨站脚本与访问控制；认证与会话；响应头与跨域；输入校验与上传；服务端请求伪造；对派生路径的破坏性操作；限流；密钥；依赖与供应链；个人数据与隐私；以及 AI / 大模型功能特有的风险。最后是评审清单。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill security-and-hardening
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「给这个文件上传接口做安全加固」。
- 「对照 OWASP Top Ten 检查登录和找回口令的流程」。
- 「包管理器的安全审计报了 12 个问题，帮我判断哪些要紧」。

目录里另有一份 `hardening-patterns.md` 参考。

## 适合谁 / 局限

适合所有用智能体写 Web 后端和全栈应用的开发者，尤其是没有专职安全人员的团队。它是防御性的开发规范，面向常见的 Web 风险；不能替代渗透测试、合规审计和专业的安全评审，高风险系统仍需专业团队把关。

## 注意事项

- **许可**：MIT。
- **不执行脚本**；审计依赖时会运行包管理器自带的检查命令。
- 「先问人」一级的事项（例如改动认证逻辑）它会停下来等你确认，这是设计如此。
