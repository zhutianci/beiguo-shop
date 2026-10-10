---
title: GitHub Copilot Code Review 怎么用：PR 里请求审查、自动审查、审查力度与自定义指令
slug: github-copilot-code-review-pr
products: [github-copilot]
models: []
accountTier: PLUS
excerpt: GitHub Copilot 代码审查教程：在 PR 的 Reviewers 里点 Request、应用建议与 Fix with Copilot、开启自动审查、Lite / Balanced 两档审查力度、用 instructions 定制审查重点、哪些文件不审，以及计费方式，按 GitHub 官方文档整理。
checkedOn: 2026-10-11
sources:
  - https://docs.github.com/en/copilot/concepts/agents/code-review
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review
  - https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
  - https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
verify:
  - Copilot approvals（让 Copilot 的批准计入必需审批）与「把建议交给 cloud agent」官方标注为 public preview，可能变化
  - 一次审查消耗多少 AI credits 官方没有给固定数字，取决于模型与 token 数
  - Free 档是否包含代码审查，以官方套餐页的功能对比表为准，本文未逐项核对
---

> 本文根据 GitHub 官方文档《About GitHub Copilot code review》《Using GitHub Copilot code review on GitHub》整理，资料核对于 2026-10-11。

## 适用于谁

- 在 GitHub 上提 PR，想让 AI 先过一遍再请同事看的人；
- 搜「github copilot code review」「github copilot code review instructions」的人；
- 团队管理员，想给仓库配置自动审查的人。

Codex 那边的做法见本站[《Codex 代码审查怎么用》](/guides/codex-code-review)；不限工具的流程见[《AI 代码审查怎么做》](/guides/ai-code-review-workflow)。

## 结论先说

1. 在 PR 右侧 **Reviewers** 里，**Copilot** 旁边点 **Request**，通常不到 30 秒出结果。
2. Copilot 默认留的是 **Comment（评论）** 类型的审查，**不算必需审批**，也不会拦住合并。
3. 评论里常带可一键应用的修改建议；也可以点 **Fix with Copilot** 交给 cloud agent 去改。
4. 审查力度两档：**Lite**（快、查常见问题）和 **Balanced**（默认，更深入、更耗 credits）。
5. 每次审查都**消耗 AI credits**；它的代理能力还会用到 GitHub Actions 分钟数。
6. 官方原话的意思：Copilot 不保证发现所有问题，也会出错，**必须有人复核**。

## 在哪些地方能用

GitHub.com、GitHub CLI、GitHub Mobile、VS Code、Visual Studio、Xcode、JetBrains IDE，以及 Azure DevOps（公开预览）。公司账号需要组织在 Copilot 策略里开启 Copilot code review。

## 步骤：在 PR 里请求审查

1. 在 GitHub.com 新建或打开一个 pull request；
2. 右侧栏 **Reviewers** 下，**Copilot** 旁点 **Request**；

![PR 右侧栏的 Reviewers 区域，Copilot 一行右边有蓝色的 Request 按钮](seed:g537-copilot-request-review.png)
*图片来源：[GitHub 官方文档《Using GitHub Copilot code review on GitHub》](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review)*

3. 等它审完（官方说通常少于 30 秒）；
4. 阅读它在 PR 里留下的评论。

![Copilot 在 PR 第 141–142 行留下的审查评论：指出变量名拼写错误会导致类型检查失败，并附带可应用的修改建议，下方有 Apply suggestion 和 Add suggestion to batch 按钮](seed:g537-copilot-review-comment.jpg)
*图片来源：[GitHub 官方文档《Using GitHub Copilot code review on GitHub》](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review)*

Copilot 的评论和人的评论用法一样：可以加表情、回复、标记已解决或隐藏。注意官方的一句提醒：**你的回复其他人看得到，但 Copilot 看不到**——回复它不会让它重新思考。

## 处理它的建议

- **Apply suggestion**：单条应用；
- **Add suggestion to batch**：把多条建议合成一次提交；
- **Fix with Copilot**：让 cloud agent 来实现修改。点击后会生成一条草稿评论，你在里面说明要它处理哪些反馈，并选择「新开一个 PR 指向你的分支」还是「直接提交到当前 PR」。需要同时启用代码审查和 cloud agent。

改完想让它再看一遍：在 Reviewers 菜单里点 Copilot 名字旁的重新请求按钮。除非配置了「每次推送都审」，否则它对一个 PR **只自动审一次**。

对评论点赞 / 点踩可以给官方反馈质量；点踩时可以选原因。

## 自动审查

默认只有你把 Copilot 加为审查者时它才审。可以改成自动：

- **个人**：让 Copilot 自动审查自己创建的 PR（Pro、Pro+、Max，或有 Business / Enterprise 许可）；
- **仓库所有者**：自动审查仓库里由有 Copilot 权限的人创建的所有 PR；
- **组织所有者**：对组织内部分或全部仓库开启。

触发时机取决于配置：

| 设置 | 什么时候审 |
| --- | --- |
| 基本设置 | 以 Open 状态创建 PR 时；或第一次把 Draft 转为 Open 时 |
| Review new pushes | 每次往 PR 推送新提交时 |
| Review draft pull requests | PR 还是草稿时就审 |

个人设置和仓库规则集（ruleset）是两套独立配置，任一开启就会自动审；两边都开也只会出一份审查。

## 审查力度：Lite 还是 Balanced

- **Lite**：标准审查，快速给出针对性反馈，覆盖常见的 bug、安全漏洞和风格不一致；
- **Balanced**（默认）：把 PR 交给推理更强的模型做更长时间的分析，适合复杂逻辑、安全敏感代码和跨服务改动；消耗更多 AI credits，Actions 分钟数也可能略多。

官方建议：安全敏感、多服务、质量要求严的仓库用 Balanced；例行小改动、更看重反馈速度时用 Lite。请求审查时可以在 Reviewers 区域选择，也可以在自己的设置、仓库、组织层面设默认值。审查完成后，PR 的总览评论里会写明这次用的是哪一档。

另外，**代码审查不能换模型**。官方解释它是专门调校的一套模型与提示词组合，换模型会影响可靠性，所以不支持。

## 用自定义指令定制审查重点

Copilot 对仓库了解得越多，审查越准。可用的四种方式：

- `.github/copilot-instructions.md`：仓库级、只给 Copilot 的常驻规则；
- `.github/instructions/**/*.instructions.md`：只对特定路径生效；
- `AGENTS.md`：希望别的智能体也遵守的通用规则；
- skills：按需触发的审查流程。

例如新建 `.github/instructions/review.instructions.md`：

```markdown
---
applyTo: "**"
excludeAgent: "cloud-agent"
---
审查时优先关注：
- 数据库查询是否有 N+1 问题
- 接口是否校验了用户权限
- 金额计算是否使用整数（分）
不需要评论纯格式问题，格式由 linter 负责。
```

`excludeAgent: "cloud-agent"` 表示这份只给代码审查用。审查读取的是 **PR 源分支**上的指令文件，所以可以在同一个 PR 里调指令、马上看效果。写法详见[《copilot-instructions.md 怎么写》](/guides/copilot-instructions-md-examples)。

## 哪些文件不审

官方列出的排除类型：依赖管理文件（如 `package.json`、`Gemfile.lock`）、日志文件、SVG 文件。PR 里包含它们时 Copilot 会跳过。

## 费用怎么算

- 每次审查（PR 里或 IDE 里）都消耗 AI credits，数量取决于模型和处理的 token；
- 成本有两部分：模型交互的 **AI credits**，加上代理能力（收集上下文、调用工具）占用的 **GitHub Actions 分钟数**；
- 自动审查默认记在 **PR 作者**名下；别人手动请求的，记在请求者名下；
- Actions 不可用或工作流失败时，审查仍会生成，只是不包含代理能力带来的增强。

额度规则见[《GitHub Copilot 免费版与 Pro 区别》](/guides/github-copilot-free-pro-ai-credits)。

## 常见问题

**Q：Copilot 审过了，能算一个 Approve 吗？**
默认不算。官方的 Copilot approvals 功能（公开预览）开启后，Copilot 可以提交满足必需审批规则的批准；之后有新提交推送时，这个批准会被撤销。

**Q：它没发现的问题算谁的？**
算你的。官方明确要求仔细验证它的反馈，并用人工审查作补充。

## 参考资料

- About GitHub Copilot code review（GitHub 官方）：https://docs.github.com/en/copilot/concepts/agents/code-review
- Using GitHub Copilot code review on GitHub（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review
- Adding repository custom instructions for GitHub Copilot（GitHub 官方）：https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
