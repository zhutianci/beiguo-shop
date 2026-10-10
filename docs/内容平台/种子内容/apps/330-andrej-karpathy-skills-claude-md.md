---
title: "andrej-karpathy-skills 是什么、怎么安装和使用：一份 CLAUDE.md 让 Claude Code 少犯四类错"
slug: andrej-karpathy-skills-claude-md
name: andrej-karpathy-skills（Karpathy 编码准则）
url: https://github.com/multica-ai/andrej-karpathy-skills
pricing: 免费（README 标注 MIT，仓库根目录无 LICENSE 文件）
platforms: Claude Code / Cursor（项目规则）
trialNote: "`/plugin marketplace add forrestchang/andrej-karpathy-skills` 然后 `/plugin install andrej-karpathy-skills@karpathy-skills`"
products: [claude, cursor]
models: [claude-llm]
topics: [agent-skills, coding, prompt-engineering]
excerpt: "andrej-karpathy-skills 把 Andrej Karpathy 总结的大模型写代码常见毛病，整理成四条准则：先想再写、简单优先、外科手术式修改、目标驱动执行。一份 CLAUDE.md 或一个 Claude Code 插件即可生效。并非 Karpathy 本人的项目。"
checkedOn: 2026-10-10
sources:
  - https://github.com/multica-ai/andrej-karpathy-skills
  - https://x.com/karpathy/status/2015883857489522876
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 multica-ai/andrej-karpathy-skills 仓库 README 和 Claude Code 官方文档整理，资料核对于 2026-10-10。

## 是什么

这是 Skill 库里最「小」的一个热门项目：核心只有**一份 `CLAUDE.md` 文件**。作者把 Andrej Karpathy 在 X 上发的一条关于「大模型写代码的毛病」的帖子提炼成四条行为准则，让 Claude Code 在每次会话里都遵守。README 引用的原话大意是：模型会替你做错误的假设然后闷头往下做，不澄清、不提出取舍、该反驳时不反驳；喜欢把代码和接口写得过于复杂；还会顺手改掉或删掉自己没完全理解的代码和注释。

需要说清楚两点：第一，**它不是 Karpathy 本人的项目**，README 标题是「受 Karpathy 启发的准则」；第二，仓库现在挂在 multica-ai 组织下，README 里的安装命令仍写作 `forrestchang/andrej-karpathy-skills`（原地址，GitHub 会自动跳转）。

截至 2026-10-10，GitHub 显示该仓库约 21.8 万 Star、2.2 万 Fork，Star 数在同类项目里名列前茅；但最近一次推送停在 2026-04-20。

## 包含哪些 Skill

内容就是四条准则（插件形式安装时作为一个技能加载）：

- **先想再写（Think Before Coding）**：不要默默选一种理解就开工。把假设说出来；有歧义时列出几种理解；有更简单的做法就提出来；搞不清楚就停下来问。
- **简单优先（Simplicity First）**：只写解决问题所需的最少代码。不加没人要的功能、不为只用一次的代码做抽象、不为不可能发生的情况写错误处理。检验标准：资深工程师会不会觉得这写复杂了。
- **外科手术式修改（Surgical Changes）**：只动必须动的地方。不顺手「改进」相邻的代码、注释和格式；沿用已有风格；发现无关的死代码只提一句、不删除。每一行改动都应该能对应到用户的请求。
- **目标驱动执行（Goal-Driven Execution）**：把「加个校验」变成「先为非法输入写测试，再让测试通过」；多步任务先列简短计划，每步带验证方式，然后循环到验证通过为止。

仓库另附一份 Cursor 项目规则文件（`.cursor/rules/karpathy-guidelines.mdc`），内容相同。

## 怎么安装

两种方式，命令均来自 README。

**方式 A：Claude Code 插件（README 推荐，所有项目生效）**

```text
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills
```

**方式 B：直接用 CLAUDE.md（只对当前项目生效）**

新项目：

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
```

已有 `CLAUDE.md` 的项目，追加到末尾：

```bash
echo "" >> CLAUDE.md
curl https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md
```

Cursor 用户参考仓库里的 CURSOR.md。README 没有提供 Codex 或 claude.ai 网页版的安装方式——不过内容只是一段文字准则，粘进其他工具的项目说明文件（如 `AGENTS.md`）同样能起作用。

## 怎么用

装好后不需要任何命令，它改变的是 Claude 的默认做事方式。README 给出的「生效了」的迹象：

- 你说「修一下登录超时的问题」，Claude 先问清复现条件或说明它的假设，而不是直接改一堆文件；
- diff 里只有你要求的改动，没有顺手的重构和格式调整；
- 第一次给出的实现就比较简单，不用你再要求「别写这么复杂」。

可以在同一份 `CLAUDE.md` 里接着写项目自己的规则，比如「所有接口必须有测试」「沿用 src/utils/errors.ts 的错误处理方式」。

## 适合谁 / 不适合谁

**适合：**
- 觉得 Claude Code「改得太多、写得太复杂、不爱提问」的开发者；
- 不想装大型流程框架、只要一个轻量约束的人；
- 想给团队仓库加一份通用行为准则作为起点的负责人。

**不适合：**
- 需要完整流程（计划、测试、评审、发布）的人——它只管行为习惯；
- 改错别字、一行修改这类小事：README 自己说明这些准则偏向谨慎而不是速度，小改动不必套用全套；
- 期待它持续更新的人。

## 注意事项

- **许可证**：README 末尾写的是 MIT，但仓库根目录没有 LICENSE 文件，GitHub 也未识别出许可证；要二次分发的话先向作者确认。
- **维护状态**：最近一次推送在 2026-04-20，之后近半年没有更新。内容本身是通用原则，不容易过时，但别指望跟进新功能。
- **署名问题**：名字里有 Karpathy，但作者是社区开发者；README 顶部还放了作者另一个项目的推广，阅读时注意区分。
- **安全**：内容是纯文本准则，没有脚本，风险很低。但方式 B 是用 `curl` 把远程文件直接写进你的 `CLAUDE.md`——这个文件每次会话都会被读进上下文，写入前先打开链接看一眼内容。
- **会多问问题**：装上后 Claude 提问变多是预期行为；无人值守的自动化任务里可能需要在提示词里明确「不要停下来问」。
