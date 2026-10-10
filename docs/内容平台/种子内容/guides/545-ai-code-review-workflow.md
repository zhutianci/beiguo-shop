---
title: AI 代码审查怎么做：自查、工具审查、人工复核三层流程与各家审查工具对照
slug: ai-code-review-workflow
products: [ai-tools, cursor]
models: []
accountTier: PLUS
excerpt: AI 代码审查工具有哪些、流程怎么搭？按 Cursor、GitHub、OpenAI、Anthropic 官方文档整理出三层做法：提交前让智能体自查、PR 上用 Bugbot / Copilot / Codex / Claude 自动审、人工复核；附可复制的审查提示词和常见误区。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/learn/reviewing-testing
  - https://cursor.com/docs/bugbot
  - https://docs.github.com/en/copilot/concepts/agents/code-review
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review
  - https://learn.chatgpt.com/docs/code-review
  - https://code.claude.com/docs/en/best-practices
verify:
  - 各审查工具的套餐要求与计费各不相同，本文不列价格，以各家官方页面为准
  - 文中的审查提示词为自拟模板，不是官方原文
  - Cursor Bugbot 的 autofix、Copilot approvals 等功能的可用范围以官方文档当时的标注为准
---

> 本文根据 Cursor 官方教程《Reviewing and testing code》、GitHub 官方的 Copilot code review 文档，以及本站已整理的 Codex、Claude Code 审查教程汇总而成，资料核对于 2026-10-11。本文讲通用流程；具体某个工具怎么点，见文中链接的单篇教程。

## 适用于谁

- 用 AI 写了不少代码，担心「看着对、其实有坑」的人；
- 搜「ai 代码审查」「ai 代码审查工具」的人；
- 团队负责人，想把 AI 审查接进 PR 流程的人。

## 结论先说

1. **AI 写的代码更需要审查**。Cursor 官方的说法：AI 生成的代码可能看起来正确、能编译、能通过你写的测试，却仍然漏掉边界情况、有安全问题，或重复了代码库里已有的逻辑。合并的标准不应该因为「是智能体写的」而降低。
2. 审查分三层：**提交前自查 → PR 上工具自动审 → 人工复核**。前两层是为了让第三层更省力，不是替代它。
3. **用全新的上下文来审**。让刚写完代码的那个对话审自己，容易偏袒；开新会话、换一个工具或用专门的审查功能更有效。
4. **给审查者可验证的信号**：测试、类型检查、lint。检查越多，越敢放手。
5. 所有官方文档都有同一句免责：AI 审查**不保证发现所有问题，也会误报**，必须有人验证。

## 第一层：提交前自查

**边做边看**。智能体工作时 diff 是实时出现的，方向不对就立刻停下重来，不必等它做完。

**让智能体把整个分支的改动审一遍**。在 Cursor 里可以用 `@Branch` 把当前分支的完整 diff 交给它；其他工具直接说「审查当前分支相对 main 的全部改动」也行。可复制的提示词：

```text
审查我在这个分支上的全部改动。重点找：
1. 逻辑错误和没处理的边界情况；
2. 缺失的错误处理；
3. 和项目里现有写法不一致、或重复造了已有工具函数的地方；
4. 安全问题（输入校验、权限检查、密钥泄露）。
按严重程度排序，每条给出文件和行号，先不要改代码。
```

再追问一句，往往能提前堵住评审意见：

```text
评审的人看到这些改动会问什么问题？PR 描述里应该补充哪些背景？
```

**用内置的审查功能**。Cursor 在智能体完成任务后可以点 **Review → Find Issues**，逐行分析改动；对全部本地改动，可在 Source Control 里运行 Agent Review 与主分支对比。Codex 的 CLI 里有 `/review`，Claude Code 有 `/code-review`（别名 `/review`）和 `/security-review`。

**新会话审查**。Claude Code 官方最佳实践里的「写 / 审分离」：会话 A 实现，会话 B 在全新上下文里审查，再把意见交回 A。全新上下文不会偏向自己刚写的代码。

## 第二层：把提交整理成能审的样子

智能体一次能改很多文件，容易产出一个几百行的大提交，谁都审不动。Cursor 官方建议的做法：

1. 开发时不用管提交是否整洁，先把功能做通；
2. 都跑通后，让智能体**重排提交历史**：回到 main，通读全部改动，规划一个合乎逻辑的顺序，拆成若干个小而语义清晰的提交；
3. 最后让它**验证最终 diff 和原来完全一致**，确保没有丢改动。

```text
功能已经完成。请把这个分支的改动重新整理成 3–6 个小提交，每个提交只做一件事，
提交信息写清「做了什么、为什么」。整理完对比最终 diff，确认和整理前完全一致。
```

## 第三层：PR 上的自动审查工具

| 工具 | 怎么触发 | 官方说明的特点 | 本站教程 |
| --- | --- | --- | --- |
| Cursor Bugbot | 推送时自动审 PR | 读取改动的完整上下文，找会进入生产的 bug：空指针、竞态条件、缺失的错误处理、安全问题；可给出修复建议，开启 autofix 后可直接从评论提交修复；可用规则定制 | — |
| GitHub Copilot code review | PR 的 Reviewers 里请求，或配置自动审 | Lite / Balanced 两档力度；默认只留评论、不算必需审批；可用 instructions 文件定制；不能换模型 | [《GitHub Copilot Code Review 怎么用》](/guides/github-copilot-code-review-pr) |
| Codex 代码审查 | PR 里 `@codex review`，或开启自动审查；本地 `/review` | 见教程 | [《Codex 代码审查怎么用》](/guides/codex-code-review) |
| Claude Code | GitHub Actions 里 `@claude`，或本地审查 | 见教程 | [《Claude Code GitHub Actions 配置教程》](/guides/claude-code-github-actions) |

Cursor 对这类工具和 linter 的区别说得很清楚：linter 抓格式问题，审查智能体找的是**逻辑错误**。两者不互相替代，linter 和类型检查应该先在 CI 里跑掉，别让 AI 审查把额度花在格式上。

**定制审查重点**。几家都支持用规则文件告诉审查者「我们在意什么」。写法大同小异：

```markdown
审查时优先关注：
- 涉及金额的计算是否用整数（分）
- 新接口是否做了权限校验和入参校验
- 数据库查询是否可能产生 N+1
不要评论纯格式问题，格式由 linter 负责。
```

Copilot 放在 `.github/instructions/*.instructions.md`，Cursor 放在 Bugbot 规则里，通用的约定可以放 `AGENTS.md`。见[《copilot-instructions.md 怎么写》](/guides/copilot-instructions-md-examples)。

## 第四步：人工复核时看什么

AI 审过一遍之后，人的精力应该花在它不擅长的地方：

- **需求对不对**：代码实现的是不是真正要的东西——AI 只能对照代码，不知道你没写出来的业务意图；
- **架构取舍**：这个改动放在这里合不合适、会不会让以后更难改；
- **AI 的评论本身**：GitHub 官方要求仔细验证 Copilot 的反馈；误报要标掉，别让下一个人再看一遍；
- **高风险区域**：鉴权、支付、数据迁移、删除操作，无论 AI 说没说问题都要人看。

Copilot 的评论回复有个细节：你回复它，其他人看得到，但它看不到。想让它重审，要重新请求审查。

## 让审查更有效的三个前提

1. **可验证的目标**。Cursor 官方列的三样：测试抓行为回归、类型检查抓结构错误、lint 抓风格和模式问题。这些检查越齐全，越能放心把工作交给智能体。
2. **让智能体补测试**。过去补测试成本高，现在可以让它写，再由你核对。见[《用 AI 写单元测试》](/guides/ai-write-unit-tests-workflow)。
3. **反馈环要快**。测试套件跑 10 分钟、同时开 10 个智能体，就是近两小时的等待。加快测试、精简依赖、优化 CI，对每一次会话都有回报。

## 常见误区

**「AI 审过了就可以合并」**。默认情况下 Copilot 的审查不计入必需审批，这是有意的设计。让 AI 审查直接放行，等于去掉了最后一道人工关。

**「让同一个对话自己审自己」**。它带着写代码时的全部假设，容易认为自己是对的。

**「审查意见全盘接受」**。AI 的建议也可能是错的，或者和项目约定冲突。每条建议都要判断，一键应用之前先看 diff。

**「大 PR 一次丢给它」**。上下文越大，漏的越多。拆小再审。

**「把私有代码贴到随便哪个聊天窗口里审」**。先确认工具的数据政策和公司规定，见[《AI 编程安全注意事项》](/guides/ai-coding-security-secrets-permissions)。

## 参考资料

- Reviewing and testing code（Cursor 官方教程）：https://cursor.com/learn/reviewing-testing
- Bugbot（Cursor 官方）：https://cursor.com/docs/bugbot
- About GitHub Copilot code review（GitHub 官方）：https://docs.github.com/en/copilot/concepts/agents/code-review
- Using GitHub Copilot code review on GitHub（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review
- Best practices（Claude Code 官方）：https://code.claude.com/docs/en/best-practices
