---
title: Codex 代码审查怎么用：GitHub PR 里 @codex review、自动审查与本地 /review 命令
slug: codex-code-review
products: [codex]
models: []
accountTier: PLUS
excerpt: Codex 代码审查怎么用？按官方文档讲清 GitHub PR 里 @codex review 和自动审查怎么开、桌面 App 的 Code Review、本地 /review 与 codex review 命令、用 AGENTS.md 写审查规则，以及额度怎么算。
checkedOn: 2026-10-07
sources:
  - https://learn.chatgpt.com/docs/third-party/github
  - https://learn.chatgpt.com/docs/code-review
  - https://help.openai.com/en/articles/20001552-review-pull-requests-with-codex
  - https://learn.chatgpt.com/docs/developer-commands
  - https://learn.chatgpt.com/docs/environments/cloud-environment
  - https://learn.chatgpt.com/docs/pricing
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
verify:
  - 「Automatic review」「Review trigger」「Personal preferences」等设置项的中文界面名称未核实
  - Security Review 处于研究预览，各套餐是否可用官方未写清（定价页的 Codex Security 仅标 Enterprise），正文只简单提及
---

> 本文根据 OpenAI 官方 Codex 文档（learn.chatgpt.com）的《Review GitHub pull requests with Codex》《Code review》、帮助中心《Review pull requests with Codex》和命令参考整理，资料核对于 2026-10-07。

## 适用于谁

- 团队用 GitHub，想让 Codex 在每个 PR 上先过一遍的人；
- 想在提交前让 Codex 审一下本地改动的个人开发者；
- 搜「codex review 命令」「codex 代码审查怎么用」的人。

## 结论先说

1. **三种用法**：
   - **GitHub 上的云端审查**：在 PR 评论里写 `@codex review`，或者在 Codex 设置里打开**自动审查**，Codex 会像同事一样在 PR 上发一条标准的 GitHub 代码审查；
   - **桌面 App / 网页的 Code Review 插件**：集中查看 PR 的描述、改动、评论和 CI 检查，在对话里追问 Codex；
   - **本地审查**：在 CLI、IDE 插件或桌面 App 里输入 `/review`，或在终端运行 `codex review`，审查未提交的改动、和基准分支的差异或某个提交。
2. **GitHub 上只报重要问题**：官方说明 Codex 在 GitHub 里只标 P0 和 P1 级别的问题，让评论聚焦高优先级风险。
3. **用 AGENTS.md 定制规则**：在 `AGENTS.md` 里加 `## Code Review Rules` 一节，Codex 会按离改动最近的规则审查。
4. **套餐**：GitHub 代码审查和自动 PR 审查 Plus 起提供；本地 `/review` 在官方功能表里 Plus、Pro、Business、Enterprise 和 API Key 都标为可用（Free / Go 未单独说明）。用 API Key 登录的没有 GitHub 审查这类云端功能。
5. **它只是第二双眼睛**：官方明确说审查规则不能替代测试、分支保护和必需的人工审批。

## 一、在 GitHub PR 上让 Codex 审查

### 开通

需要：一个已连接到 Codex 的 GitHub 仓库，以及对该仓库设置有 push 或 admin 权限。

1. 把 GitHub 仓库连接到 Codex（目前 GitHub 代码审查仍走 **Codex Cloud (Legacy)** 的集成，设置入口在 Codex 设置里）；
2. 打开官方文档给出的 Codex 代码审查设置页 https://app.chatgpt.com/settings/code-review ；
3. 选择仓库，在 **Review code** 下打开 **Automatic review**。

### 手动请求一次审查

在 PR 的评论里写：

```
@codex review
```

Codex 会先回一个 👀 表情，然后发出审查。只想关注某一块，可以直接写在后面：

```
@codex review for issues in the database migration
```

### 打开自动审查

在设置页的 **Personal preferences**（个人偏好）里打开 **Automatic review**，用 **Review trigger** 选择什么时候触发。之后启用了代码审查的仓库里，你的 PR 不用再评论 `@codex review` 也会自动审查。

### 让 Codex 直接修

审查出问题后，可以在同一个 PR 里继续评论：

```
@codex fix the P1 issue
```

Codex 会以这个 PR 为上下文开一个（旧版）云端任务，有权限时把修复推回分支。`@codex` 后面写 `review` 以外的内容（例如 `@codex fix the CI failures`），也会开一个云端任务。

### 安全审查（Security Review）

另有一个研究预览中的 **Security Review**，比普通审查更深入地看安全问题；在设置的 **Review security vulnerabilities** 下打开 **Auto security review**，或在 PR 评论 `@codex security review` 手动触发。可用范围以官方说明为准。

## 二、用 AGENTS.md 写审查规则

Codex 会在仓库里找 `AGENTS.md`，按其中的 `## Code Review Rules` 一节审查。规则放在离代码最近的那个文件里：全仓库通用的放根目录，某个服务专用的放该服务目录下（例如 `services/payment/AGENTS.md`），Codex 会把根目录和更具体的规则叠加使用。

一个示例（自己写的，按官方给的格式）：

```md
## Code Review Rules

### 金额计算

- 金额一律用整数「分」存储和计算，不要出现浮点数运算。
  正确做法：入口处把元转成分，展示时再格式化。

### 数据库迁移

- 迁移脚本不得直接删除列；需要先标记弃用，至少保留一个发布周期。
```

官方给的写规则建议：

- 先写两三条审查时经常要解释的规则；
- 写清楚**要拦什么、为什么**，以及**安全的做法或例外**，帮 Codex 区分真问题和预期行为；
- 写结果而不是函数名，规则放在它管的代码附近；
- 格式、lint 这类机械检查留给 CI，不要写进审查规则；
- 拿一个典型 PR 跑 `@codex review`，看结果再增删规则，删掉产生噪音的。

`AGENTS.md` 的其他写法见 [CLAUDE.md / AGENTS.md 教程](/guides/claude-md-agents-md)。

## 三、在桌面 App 或网页里审 PR（Code Review 插件）

1. 从侧边栏打开 **Code Review**，按提示连接你的代码托管账号（用能访问该仓库的账号）；
2. 从列表选 PR，或在搜索框粘贴 PR 链接；桌面 App 还有个人收件箱，可按 **Assigned to me**、**Assigned to my team**、**Authored by me** 筛选；
3. **Summary** 里看描述、动态、评论和检查结果，**Changes** 里看改动的文件和行内评论；
4. 在这个 PR 的对话里追问，比如「说明这个改动对登录流程有什么影响」「把支撑这条结论的代码和测试给我看」；
5. 桌面 App 里点 **Review with Codex** 会在新对话里发起一次审查，旁边的齿轮 **Review instructions** 可以设置跨仓库通用的审查要求（也可在 **Settings → Code Review** 修改）。

要注意：在对话里审 PR **不会**自动发评论、批准或合并；在 **Summary** 或 **Changes** 里发的评论会**立即**发到 GitHub，不等你点 **Submit review**。正式提交审查时，用 **Submit review** 选 **Comment**、**Approve** 或 **Request changes**。

GitLab 的合并请求在 Code Review 里是预览功能，但 GitLab 的云端自动审查在这个预览里不提供。

## 四、本地审查：/review 和 codex review

**交互式**：在 CLI、IDE 插件或桌面 App 的 Codex 输入框里输入 `/review`，选择范围：

- **Review against a base branch**：和基准分支比较，审查整个分支的改动；
- **Review uncommitted changes**：审查暂存、未暂存和未跟踪的文件；
- **Review a commit**（CLI）：审查某个提交；
- **Custom review instructions**（CLI）：按你给的标准审查。

Codex 会启动一个专门的审查者，读取选定的 diff，给出按优先级排序的问题，**不会改动你的工作区**。项目需要在 Git 仓库里（IDE 插件里不是 Git 仓库时不显示 `/review`，桌面 App 会提示你先创建仓库）。桌面 App 里审查结果显示为审查面板里的行内评论，可以在 **Settings → General → Code review** 里改成 **Detached**（另开一个对话审查）。

**非交互式**（适合脚本）：

```bash
codex review --uncommitted          # 审查未提交的改动
codex review --base main            # 审查当前分支相对 main 的差异
codex review --commit <SHA>         # 审查某个提交
codex review "重点检查 SQL 注入和权限校验"   # 自定义审查要求
```

想让审查用和当前会话不同的模型，可以在 `config.toml` 里设 `review_model`。让 Codex 按审查结果改代码时，照常受沙箱和审批设置约束（见 [Codex 权限与沙箱设置](/guides/codex-permissions-sandbox)）。

## 额度怎么算

官方定价页的说法：只有通过 GitHub 跑的审查（PR 里 `@codex review` 或仓库开了自动审查）算 **Code Review 用量**；在本地或 GitHub 以外跑的审查计入你的普通 Codex 额度。普通额度的规则见 [Codex 额度与使用限制](/guides/codex-usage-limits)。想先开通 Plus 用上 GitHub 审查，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 常见问题

**Q：评论了 @codex review，Codex 没反应？**
按官方排查清单：确认在 Codex 设置里为这个仓库打开了代码审查；确认 PR 所在仓库已连接到 Codex；评论内容必须是准确的 `@codex review`；自动审查的话，检查仓库设置和 **Personal preferences** 里的 **Automatic review**，以及 PR 事件是否符合 **Review trigger** 的设置。

**Q：Codex 的审查能代替人工审查吗？**
不能。它在 GitHub 上只报高优先级问题，结论也可能错；每条发现都要对照 diff、预期行为和测试核实。

**Q：新版 Codex Cloud 环境会接管原来的云端审查吗？**
不会。帮助中心写明这次更新不会把现有云端代码审查迁到新的云端环境，Code Review 继续使用 Codex Cloud (Legacy)。

**Q：没有 GitHub，只想审本地代码可以吗？**
可以，用 `/review` 或 `codex review`，不需要连接任何仓库，只要项目在 Git 仓库里。

## 参考资料

- 官方文档：Review GitHub pull requests with Codex — https://learn.chatgpt.com/docs/third-party/github
- 官方文档：Code review — https://learn.chatgpt.com/docs/code-review
- OpenAI 帮助中心：Review pull requests with Codex — https://help.openai.com/en/articles/20001552-review-pull-requests-with-codex
- 官方文档：命令行参考（codex review）— https://learn.chatgpt.com/docs/developer-commands
- 官方文档：Codex Cloud (Legacy) — https://learn.chatgpt.com/docs/environments/cloud-environment
- Codex 官方定价页（Code Review 用量）— https://learn.chatgpt.com/docs/pricing
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
