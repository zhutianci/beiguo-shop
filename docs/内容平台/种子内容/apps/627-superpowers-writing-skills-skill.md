---
title: "superpowers writing-skills 是什么、怎么用：用测试驱动的方式写 Skill（先看智能体失败，再写规则）"
slug: superpowers-writing-skills-skill
name: writing-skills（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/writing-skills
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, prompt-engineering]
excerpt: "writing-skills 是 Superpowers 的元技能：把写 Skill 当成对流程文档做测试驱动开发，先用压力场景看智能体在没有技能时怎么犯错，再写技能，再验证它确实照做，最后补漏洞。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/writing-skills
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.6 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

多数人写 Skill 的方式是凭经验把注意事项列出来，然后默认它有效。writing-skills 的主张是：写技能就是把测试驱动开发用在流程文档上。`description`：创建新技能、编辑已有技能，或在部署前验证技能是否有效时使用。

对应关系是这样的：测试用例 = 用子智能体跑的「压力场景」；看测试失败 = 观察智能体在没有技能时的基线行为；写实现 = 写技能文档；看测试通过 = 确认智能体装上技能后照做；重构 = 堵住它找到的漏洞。核心原则沿用 TDD 的那句：如果你没看过智能体在没有这个技能时失败，就不知道技能教的是不是对的东西。

说明里把技能分成几类——技术类（怎么做）、模式类（思维方式）、参考类（文档与 API），以及专门约束纪律的规则类——每类的测试方法不同。篇幅最大的部分讲「防合理化」：模型在压力下会给自己找理由绕过规则，所以规则类技能要把每个漏洞明确堵上，包括那句著名的「违反字面就是违反精神」。还覆盖目录结构、技能间如何互相引用、什么时候该用流程图。

## 怎么安装

`writing-skills` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:writing-skills` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 「我想写一个 skill，要求智能体提交前必须跑代码检查，用 writing-skills 的方法来」——它会先设计一个诱使智能体跳过检查的场景，跑基线，再起草。
- 「这个 skill 经常被绕过，帮我找漏洞并加固」。
- 写个人技能时，它会把文件放到所用工具的技能目录（Claude Code 是 `~/.claude/skills/`）。

目录里有几份参考：Anthropic 的技能最佳实践摘录、说服原则、用子智能体测试技能的方法，以及画流程图的约定和渲染脚本。

## 适合谁 / 局限

适合要写「规矩类」技能的人——让智能体在赶时间、嫌麻烦时仍然守规则，这类技能最需要测试。写一份查资料用的参考型技能，用它就偏重了。与 Anthropic 官方的 skill-creator 相比，它更强调对抗性的压力测试，后者更强调评测打分和触发描述优化，可以互补。

## 注意事项

- **许可**：MIT。
- **用量**：基线加验证要跑多轮子智能体。
- README 说明该项目一般不接受新增技能的贡献，写出的技能更适合放在自己的仓库或个人目录。
