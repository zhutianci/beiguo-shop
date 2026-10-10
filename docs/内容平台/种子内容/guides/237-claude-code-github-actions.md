---
title: Claude Code GitHub Actions 配置教程：@claude 自动审 PR、修 issue
slug: claude-code-github-actions
products: [claude]
models: []
accountTier: PLUS
excerpt: 用官方 claude-code-action 让 Claude 在 GitHub 上干活：/install-github-app 快速配置或手动配置、用订阅令牌还是 API Key、@claude 交互模式与自动化模式、PR 自动审查和定时任务示例、常见问题。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/github-actions
  - https://code.claude.com/docs/en/code-review
  - https://code.claude.com/docs/en/authentication
  - https://github.com/anthropics/claude-code-action
verify:
  - 示例 YAML 中的 actions/checkout@v6、anthropics/claude-code-action@v1 版本号取自 2026-10 官方文档，以 claude-code-action 仓库 README 为准
---

> 本文根据 Claude Code 官方文档《Claude Code GitHub Actions》和官方仓库 anthropics/claude-code-action 整理，核对日期 2026-10-07。示例工作流改写自官方示例。

## 适用于谁

- 想在 GitHub 的 issue 或 PR 评论里 `@claude`，让它分析代码、改代码、提交 PR 的开发者；
- 想每次开 PR 都自动跑一遍 AI 代码审查的团队；
- 搜「claude code github actions」「pr review」「max plan」想知道能不能用订阅额度跑的人。

## 结论先说

1. **Claude Code GitHub Actions** 是官方的 GitHub Action（`anthropics/claude-code-action`），在你仓库的工作流里运行 Claude Code。
2. 最快的配置方式：本地进入仓库运行 `claude`，输入 `/install-github-app`，它会安装 Claude GitHub App、保存密钥并帮你准备好工作流 PR，合并后就能用。需要仓库管理员权限。
3. 认证二选一：**`CLAUDE_CODE_OAUTH_TOKEN`**（用 Pro / Max / Team / Enterprise 订阅，`claude setup-token` 生成）或 **`ANTHROPIC_API_KEY`**（Claude Console 的 API Key，按 API 用量计费）。
4. 两种运行模式：工作流里**没有** `prompt` 时是交互模式，等人 `@claude`；**有** `prompt` 时是自动化模式，按触发事件直接运行（比如开 PR、定时）。
5. 每次运行同时消耗 **GitHub Actions 分钟数**和 **Claude 用量**，记得用 `--max-turns`、超时和并发控制限制开销。

## 方式一：快速配置（推荐）

1. 安装 GitHub CLI 并登录：`gh auth login`；
2. 在要接入的仓库里运行 `claude`，输入：

   ```text
   /install-github-app
   ```

3. 按提示操作：安装 Claude GitHub App → 选择认证方式（用订阅生成长期令牌，或粘贴 API Key）→ 选择要添加的工作流（基础的 `@claude` 响应，以及可选的 PR 审查）；
4. Claude Code 会把密钥保存为仓库 Secret（API Key 叫 `ANTHROPIC_API_KEY`，订阅令牌叫 `CLAUDE_CODE_OAUTH_TOKEN`），推送一个包含工作流文件的分支，并在浏览器里打开创建 PR 的页面；
5. 创建并合并这个 PR，`@claude` 就能在仓库里用了。

这个命令只支持 github.com 上的仓库；GitLab 请看官方的 GitLab CI/CD 文档。中途按 Esc 可以停止，结束信息会列出已经做了哪些操作。

## 方式二：手动配置

1. **安装 Claude GitHub App**：打开 github.com/apps/claude 安装到仓库。Action 实际依赖的是三项权限：Contents、Issues、Pull requests 的读写；
2. **添加仓库 Secret**（Settings → Secrets and variables → Actions）：
   - `ANTHROPIC_API_KEY`：Claude Console 的 API Key；
   - 或 `CLAUDE_CODE_OAUTH_TOKEN`：在本地运行 `claude setup-token` 生成的订阅令牌；
3. **复制工作流文件**：把官方仓库的 `examples/claude.yml` 放进 `.github/workflows/`。

一个最小的 `@claude` 响应工作流：

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

用 API Key 的话，把最后一行换成 `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`。其中 `id-token: write` 是 Action 默认用 GitHub App 认证所必需的，`actions: read` 让 Claude 能读到 PR 上的 CI 结果，`if` 条件避免没提到 `@claude` 的评论也启动运行器。

合并后，在 issue 或 PR 评论里这样用：

```text
@claude 根据 issue 描述实现这个功能
@claude 这个接口的用户认证应该怎么实现？
@claude 修复用户面板组件里的 TypeError
```

Claude 会在同一个 issue / PR 下回复，并随进度更新评论。

## 订阅令牌还是 API Key？

| | `CLAUDE_CODE_OAUTH_TOKEN` | `ANTHROPIC_API_KEY` |
| --- | --- | --- |
| 来源 | 本地 `claude setup-token` | Claude Console |
| 计费 | 计入你的订阅额度 | 按 API token 用量计费 |
| 适合 | 个人仓库 | 组织多仓库共享 |

官方建议：跨仓库共享的组织级 Secret 用 API Key，因为订阅令牌绑定的是生成它的那个人的订阅。也可以用工作负载身份联合（OIDC），完全不存长期密钥，配置见 Action 仓库的 setup 文档。

## 自动化示例

### 每个 PR 自动代码审查

用 `prompt` 调用官方 `code-review` 插件里的技能，PR 打开、更新、重新打开或转为可审阅时运行：

```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment"'
```

- `--comment` 让审查结果以行内评论（或一条汇总评论）发到 PR 上，不加的话只写在运行日志里；
- `claude_args` 这一行不能省：只有在这里用 `--allowedTools` 点名，Action 才会启动发行内评论的 MCP 服务器；
- Claude 会跳过草稿和已关闭的 PR、它判断不需要审的 PR（如自动生成或很小的改动），以及已有它评论的 PR；
- 公开仓库里，来自 fork 的 PR 拿不到 Secret，所以只审同仓库分支的 PR。

不想维护工作流文件，官方另有「Code Review」功能，可以对每个 PR 自动审查。

### 定时任务：每天生成一份报告

```yaml
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"
jobs:
  report:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: read
      id-token: write
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "汇总昨天的提交和当前未关闭的 issue"
          claude_args: |
            --allowedTools "mcp__github__list_commits,mcp__github__list_issues"
```

纯文本 `prompt` 默认**没有** shell 和 GitHub API 权限，要用 `--allowedTools` 授予需要的工具。注意 GitHub 只从默认分支运行定时工作流，公开仓库 60 天无活动会自动停用定时任务；cron 用的是 UTC 时间（上例为 UTC 9 点，即北京时间 17 点）。

## 常用参数

| 参数（`with:` 下） | 作用 |
| --- | --- |
| `prompt` | 给 Claude 的指令（文本或 `/技能名`），不写则等待 `@claude` |
| `claude_args` | 传给 Claude Code 的命令行参数，如 `--max-turns 5 --model ...` |
| `anthropic_api_key` / `claude_code_oauth_token` | 两种认证方式二选一 |
| `trigger_phrase` | 触发词，默认 `@claude` |
| `settings` | Claude Code 设置（JSON 字符串或文件路径） |
| `plugin_marketplaces` / `plugins` | 运行前安装的插件市场和插件 |
| `github_token` | GitHub 操作用的令牌，不填则以 Claude GitHub App 身份操作 |

## 最佳实践

- **在仓库根目录写好 CLAUDE.md**：代码风格、审查标准、项目规则，Claude 每次运行都会读（所以也要写得精简）。CLAUDE.md 写法详见本站《CLAUDE.md 怎么写：最佳实践、模板与 AGENTS.md 的区别》。
- **密钥只放 GitHub Secrets**，永远不要提交到仓库；工作流只给必要的权限；合并前人工检查 Claude 的改动。
- **控制成本**：`@claude` 请求写具体；用 issue 模板提前提供上下文；`claude_args` 里加 `--max-turns`；给工作流设超时；用 GitHub 并发控制限制同时运行的数量。

## 常见问题

**Q：@claude 了没反应？**
官方检查清单：确认 GitHub App 已装到这个仓库；仓库启用了 Actions 工作流；Secret 已设置；评论里是完整的 `@claude`（不是 `/claude` 或 `@claude-bot`）；评论者对仓库有写权限（没有写权限的用户默认不能触发）。

**Q：Claude 提交的代码没有触发 CI？**
GitHub 不会因为默认 `GITHUB_TOKEN` 做的提交触发工作流。如果你给 Action 传了 `github_token: ${{ secrets.GITHUB_TOKEN }}`，删掉它让 Action 以 Claude GitHub App 身份提交，或者换成自定义 App 的令牌；同时确认 CI 的触发条件包含 `push` / `pull_request`。

**Q：认证报错？**
先在本地用同样的 Key / 令牌运行 `claude` 确认有效，再排查工作流。

**Q：安装 App 时要的权限比 Action 用到的多？**
Claude GitHub App 是 Action、Code Review、云端自动修 PR 等功能共用的，GitHub 不允许只接受部分权限。组织只想给最小权限的话，可以按 Action 仓库的 setup 文档自建一个只含 Contents、Issues、Pull requests 的 GitHub App（但 Code Review 等功能仍需官方 App）。

**Q：以前用的是 `@beta` 版本？**
把 `uses` 改成 `@v1`，删掉 `mode` 输入（现在自动判断模式），`direct_prompt` 改名为 `prompt`，`max_turns`、`model` 等挪进 `claude_args`。

## 参考资料

- Claude Code GitHub Actions（官方）：https://code.claude.com/docs/en/github-actions
- Code Review（官方）：https://code.claude.com/docs/en/code-review
- Authentication · Generate a long-lived token（官方）：https://code.claude.com/docs/en/authentication
- anthropics/claude-code-action（官方仓库）：https://github.com/anthropics/claude-code-action
