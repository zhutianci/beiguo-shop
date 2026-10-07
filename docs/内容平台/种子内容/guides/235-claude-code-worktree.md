---
title: Claude Code worktree 怎么用：多个会话并行开发不打架
slug: claude-code-worktree
products: [claude]
models: []
accountTier: PLUS
excerpt: 想同时开几个 Claude Code 会话改同一个仓库又怕互相覆盖？用 git worktree。本文讲 claude --worktree 用法、退出清理、.worktreeinclude 复制 .env、基于 PR 开分支、子代理隔离和常见问题。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/worktrees
  - https://code.claude.com/docs/en/agents
  - https://code.claude.com/docs/en/sub-agents
  - https://git-scm.com/docs/git-worktree
---

> 本文根据 Claude Code 官方文档《Run parallel sessions with worktrees》整理，核对日期 2026-10-07。worktree 需要 git 仓库。

## 适用于谁

- 想让一个 Claude Code 会话写新功能、另一个同时修 bug，又担心两边改同一批文件打架的人；
- 搜「claude code worktree 怎么用」「claude code 并行任务」「worktree node_modules」的人；
- 想让多个子代理并行改代码、互不干扰的人。

## 结论先说

1. **git worktree = 同一个仓库的另一份独立工作目录**：有自己的文件和分支，但共享同一个 `.git` 历史和远程。每个会话在自己的 worktree 里改，互不影响。
2. 最简单的用法：`claude --worktree 名字`（简写 `-w`），会在仓库根目录的 `.claude/worktrees/名字/` 下新建 worktree，分支名为 `worktree-名字`。另开一个终端换个名字再来一次，就是第二个并行会话。
3. worktree 是一份**全新的检出**：`node_modules`、`.env` 这些没进 git 的东西都没有。依赖要重新装；`.env` 可以用 `.worktreeinclude` 自动复制。
4. 退出时，干净的 worktree 会自动删除；有改动的会问你保留还是删除——**选删除会连同分支和里面的改动一起删掉**。
5. 建议把 `.claude/worktrees/` 加进 `.gitignore`。

## 步骤

### 1. 在 worktree 里启动 Claude

```bash
# 终端 1：做登录功能
claude --worktree feature-auth

# 终端 2：修一个 bug
claude --worktree bugfix-123
```

不写名字的话，Claude 会自动起一个，比如 `bright-running-fox`。

注意：交互式运行要求这个目录已被「信任」。如果从没在这个仓库里运行过 `claude`，先运行一次普通的 `claude` 接受信任提示，否则 `--worktree` 会报错退出。

也可以在会话里直接说「在一个 worktree 里做这件事」，Claude 会用 EnterWorktree 工具自己建一个。

### 2. 准备开发环境

worktree 里只有被 git 跟踪的文件。进去之后可以直接让 Claude「先安装依赖」，或者自己到 `.claude/worktrees/名字/` 下运行项目的初始化命令（`npm install`、`pip install -r requirements.txt` 等）。

想把 `.env` 等被 gitignore 的文件自动带进每个新 worktree，在项目根目录建一个 `.worktreeinclude`，写法同 `.gitignore`：

```text
.env
.env.local
config/secrets.json
```

只有「匹配规则并且被 gitignore 的文件」才会复制，已跟踪的文件不会重复。这个规则对 `--worktree`、子代理的 worktree 和桌面版的并行会话都生效。

### 3. 选择从哪个分支开始

默认从**远程默认分支**（通常是 `main`）新建，保证起点是干净的。如果你希望新 worktree 带上当前本地的提交（比如让子代理接着你没推送的工作改），在设置里写：

```json
{
  "worktree": {
    "baseRef": "head"
  }
}
```

`baseRef` 只接受 `"fresh"`（默认）和 `"head"` 两个值，不能写分支名。想从某个已有分支开始，用下面的「手动管理」。

**基于某个 PR 开 worktree**（审 PR、接手别人的改动很方便）：

```bash
claude --worktree "#1234"
```

`#` 要加引号，不然 shell 会当成注释。也可以直接传 GitHub PR 或 GitLab MR 的链接，Claude Code 会从 `origin` 拉取该 PR 的提交，建在 `.claude/worktrees/pr-1234`。

### 4. 退出与清理

退出交互式 worktree 会话时，Claude 会检查里面有没有会被删除的工作（改动、未跟踪文件、新提交）：

| 情况 | 处理 |
| --- | --- |
| 干净、未命名的会话 | 自动删除 worktree 和分支 |
| 干净、但会话有名字 | 先问你要不要留着以后用 |
| 有改动或新提交 | 问你保留还是删除；保留时会打印 `claude --worktree <名字> --resume` 命令，下次用它回来 |
| 状态无法确认 | 不自动删，提示你哪些没检查到 |

用 `claude -p` 非交互运行时没有退出提示，worktree 不会被自动清理，需要自己 `git worktree remove`（被锁时先 `git worktree unlock`）。

### 5. 让子代理各自用一个 worktree

并行的子代理改同一批文件也会冲突。可以直接跟 Claude 说「让你的子代理都用 worktree」，或者在自定义子代理里固定写上：

```markdown
---
name: refactorer
description: 在很多文件里执行机械式重构
isolation: worktree
---

在所有受影响的文件里完成指定的重构，然后运行测试并汇报结果。
```

每个子代理拿到一个临时 worktree，没有改动就自动删除，有改动的保留到之后的定期清理能安全删除为止。批量大改动还可以用内置的 `/batch` 命令：它会把任务拆成 5～30 个独立单元，每个单元在独立 worktree 里由一个后台子代理完成。

## worktree 之间共享什么

- **`.git` 目录**：在 worktree 里 `git commit` 写的是同一个仓库；
- **项目范围的插件**：主目录装过的，worktree 里也能用，不用重装；
- **权限批准**：在 worktree 里选「Yes, and don't ask again」，规则保存到主目录的 `.claude/settings.local.json`，所有 worktree 通用（Windows 等少数情况除外）；
- **未进 git 的技能、子代理、命令**：如果 worktree 里没有 `.claude/skills` 等目录，会读主目录的。

## 手动管理 worktree

需要从**已有分支**开始，或者想把 worktree 放到仓库外面时，直接用 git：

```bash
# 新分支
git worktree add ../project-feature-a -b feature-a

# 已有分支
git worktree add ../project-bugfix fix-issue-456

# 在里面启动 Claude
cd ../project-feature-a
claude

# 查看和删除
git worktree list
git worktree remove ../project-feature-a
```

## 并行的几种方式怎么选

| 方式 | 特点 |
| --- | --- |
| worktree | 隔离**文件改动**，每个会话一个独立目录 |
| 子代理 | 在**一个会话内部**拆分工作，结果汇报给主对话，详见本站《Claude Code Subagents（子代理）怎么用：创建、调用与最佳实践》 |
| 后台会话 / Agent Teams | 多个独立会话并行，可以统一查看或互相传消息 |

三者可以组合：多个会话各占一个 worktree，会话里再派子代理。

## 常见问题

**Q：worktree 里没有 node_modules，每次都要重新装吗？**
是的，worktree 是全新检出，依赖要在里面重新安装（官方建议让 Claude 装，或者自己运行初始化命令）。同名 worktree 再次用 `--worktree 名字` 打开时会复用已有目录，不必每次重装。

**Q：主目录里冒出一堆未跟踪文件？**
把 `.claude/worktrees/` 加进 `.gitignore`。

**Q：提示需要先信任工作区？**
在仓库目录先运行一次普通的 `claude`，接受信任对话框，再用 `--worktree`。

**Q：Hooks 里的 `$CLAUDE_PROJECT_DIR` 会跟着进 worktree 吗？**
不会，它仍指向会话启动时的项目根目录。Hook 需要 worktree 路径时，读输入 JSON 里的 `cwd` 字段。

**Q：不用 git（比如 SVN、Perforce）能用吗？**
默认的 worktree 依赖 git。其他版本控制系统可以配置 `WorktreeCreate` / `WorktreeRemove` Hook 替换创建和删除逻辑，见官方文档「Non-git version control」一节。

## 参考资料

- Run parallel sessions with worktrees（官方）：https://code.claude.com/docs/en/worktrees
- Run agents in parallel（官方）：https://code.claude.com/docs/en/agents
- Create custom subagents（官方）：https://code.claude.com/docs/en/sub-agents
- git worktree 文档：https://git-scm.com/docs/git-worktree
