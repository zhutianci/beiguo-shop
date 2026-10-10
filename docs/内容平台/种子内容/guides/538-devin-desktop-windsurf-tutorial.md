---
title: Devin Desktop 使用教程（原 Windsurf）：安装、Devin Local、Plan 模式、规则与权限
slug: devin-desktop-windsurf-tutorial
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Windsurf 改名 Devin Desktop 后怎么用？按官方文档讲清安装与导入设置、默认智能体从 Cascade 换成 Devin Local、Code / Plan / Ask 三种模式、规则放在 .devin/rules、用 worktree 隔离改动、权限规则，以及老用户迁移。
checkedOn: 2026-10-11
sources:
  - https://docs.devin.ai/desktop/getting-started
  - https://docs.devin.ai/desktop/install
  - https://docs.devin.ai/desktop/devin-local
  - https://docs.devin.ai/desktop/cascade/modes
  - https://docs.devin.ai/desktop/cascade/memories
  - https://docs.devin.ai/desktop/agent-command-center
  - https://docs.devin.ai/desktop/devin-desktop-faq
verify:
  - 官方文档写的最低系统版本为 OS X Yosemite、Windows 10、Linux glibc 2.28 及以上，其中 macOS 一项看起来是沿用的旧描述，以下载页为准
  - Devin Local 在 Enterprise 档默认关闭，需要管理员开启；个人档与 Team 档默认可用
  - 中文界面设置官方文档未提及，本文未涉及
---

> 本文根据 Devin 官方文档的 Desktop 部分整理，资料核对于 2026-10-11。Windsurf 已改名为 Devin Desktop，网上大量讲 Cascade 的旧教程已经和现在的默认界面对不上。产品是什么、收费情况，见本站 AI 应用目录里的「Devin Desktop（原 Windsurf）」条目。

## 适用于谁

- 之前用 Windsurf，升级后发现界面和叫法都变了的人；
- 搜「devin desktop 教学」「devin desktop 是什么」「devin desktop windsurf」的人；
- 想找一个能同时管理本地和云端多个智能体的编辑器的人。

## 结论先说

1. **Devin Desktop 就是原来的 Windsurf 编辑器**，官方定位是「内置 Devin 的 AI IDE」：在本机跑 Devin Local、把任务派给云端的 Devin、在一个地方管理所有智能体。
2. **默认智能体换了**：新标签页默认用 **Devin Local**（和 Devin CLI 共用的新一代智能体框架），**新对话不会再从 Cascade 开始**；旧的 Cascade 对话仍能在历史里打开。
3. 模式三种：**Code**（默认，直接改）、**Plan**（先出方案）、**Ask**（只读）。`Ctrl+.`（macOS `⌘+.`）切换。
4. 规则首选放 **`.devin/rules/*.md`**，旧的 `.windsurf/rules` 和 `.windsurfrules` 仍然读取；根目录的 `AGENTS.md` 也会当作常驻规则。
5. **记忆（Memories）只属于旧的 Cascade**，Devin Local 不保存记忆——需要长期记住的东西写成规则、AGENTS.md 或 skill。

## 步骤一：安装

| 系统 | 官方最低要求 | 说明 |
| --- | --- | --- |
| macOS | 文档写 OS X Yosemite | 下载安装包 |
| Windows | Windows 10 | 下载安装包 |
| Linux | glibc ≥ 2.28、glibcxx ≥ 3.4.25（如 Ubuntu 20、Debian 10、Fedora 36、RHEL 8） | 推荐 apt / dnf 软件源；tarball 不会自动更新 |

Linux 上有个容易困惑的地方：**软件源地址里仍然是 windsurf 的旧名字，但包名已经是 `devin-desktop`**。官方说明 `windsurf` 作为过渡包保留，老安装会继续更新。添加软件源的命令较长，直接从官方 Install 页复制。

## 步骤二：首次启动

1. **选主题**。保持勾选「Install `devin-desktop` terminal command」，之后可以在终端里用 `devin-desktop 项目路径` 打开项目；展开 Import Settings 可以**导入 VS Code 或 Cursor 的设置**和键位；
2. **登录**。需要 Devin 账号，没有的话可以免费注册。浏览器登录不顺利时，官方提供了手动填 Devin API key 的方式；
3. 打开项目，开始第一个任务。

## 步骤三：认识 Devin Local

Devin Local 运行在你的电脑上，能访问本地文件、工具和环境。官方列的几项改进：

- **更省 token**：更重视提示词缓存，官方称多数任务比 Cascade 少用最多约 30% 的 token；
- **子智能体（Subagents，预览）**：可以把子任务交给独立的子智能体，前台或后台运行；
- **沙箱**：操作系统级沙箱，按权限范围限制可写路径，并用域名白名单 / 黑名单过滤网络；
- **Quick Review**：专门用来快速审查改动的子智能体。

**在智能体选择器里找不到 Devin Local？** 命令面板（`Ctrl+Shift+P`）→ 打开 `Devin User Settings` → **Agents** 标签页 → 打开 **Devin Local** → 重启。公司的 Enterprise 账号需要管理员先在后台开启。

## 步骤四：三种模式

| 模式 | 用途 | 能用的工具 |
| --- | --- | --- |
| Code | 实现功能、重构；默认的完全智能体模式 | 全部 |
| Plan | 复杂任务，先做计划 | 全部 |
| Ask | 学习、提问、探索 | 只有搜索类工具，不能改动 |

**Plan 模式**下，智能体会先探索代码库、向你提澄清问题、给出几个可选方案，最后把详细计划写进一个**仓库之外的 Markdown 文件**（`~/.devin/plans` 或 `~/.windsurf/plans`）。计划写好后点文件上的 **Implement**，或批准它退出 Plan 模式，即可开始实现。

两个实用技巧（均来自官方文档）：

- 在提示词里带上关键词 `megaplan`（`ultraplan`、`masterplan` 也行），会切到 Plan 模式并让它规划得更充分，至少先问你一个澄清问题；
- 第一次实现跑偏了，不用硬修：**丢弃改动 → 修改计划文件 → 在新对话里 @ 这个计划文件再点 Implement**。

## 步骤五：写规则

| 范围 | 位置 | 限制 |
| --- | --- | --- |
| 全局 | `~/.codeium/windsurf/memories/global_rules.md` | 单个文件，始终生效，最多 6,000 字符 |
| 工作区 | `.devin/rules/*.md`（首选），`.windsurf/rules/*.md`（兼容） | 每条规则一个文件，每个文件最多 12,000 字符 |
| AGENTS.md | 工作区任意目录 | 根目录的始终生效；子目录的只对该目录生效 |

工作区规则在 frontmatter 里用 `trigger` 字段声明激活方式：

| `trigger` 值 | 何时生效 | 占用上下文 |
| --- | --- | --- |
| `always_on` | 每条消息都带上全文 | 每条消息 |
| `model_decision` | 只把 `description` 放进系统提示，模型觉得相关时再读全文 | 描述常驻，全文按需 |
| `glob` | 读写的文件匹配 `globs` 时 | 只在碰到匹配文件时 |
| `manual` | 在输入框里 `@规则名` 时 | 只在被 @ 时 |

官方的建议很明确：想让智能体**可靠地反复使用**的知识，写成规则或加进仓库的 `AGENTS.md`，不要依赖自动生成的记忆——规则能进版本控制、能和团队共享、激活方式可控。跨工具共用见[《AGENTS.md 怎么写》](/guides/agents-md-cross-tool-guide)。

## 步骤六：权限与隔离

**权限规则**。Devin Local 用更细的权限体系取代了旧的「自动执行级别」：

- **Deny**：直接禁止（优先级最高）；
- **Ask**：每次都问；
- **Allow**：自动批准。

规则可以分别限定读文件、写文件、执行命令、HTTP 抓取和 MCP 工具，可在项目、用户、组织三级配置。例如用 `Read(**/*.pem)` 这样的 glob 拒绝读取证书文件。

**Worktree 会话**。开始会话时在位置选择器里选 **New worktree**，智能体会在一个独立的 git worktree 里编辑、构建、测试，不动你的主工作区；完成后点会话上的 **Merge** 把改动合回来。

**Restricted Mode**。工作区以受限模式打开时，所有智能体（Cascade、Devin Local、ACP 智能体）都不可用，hooks 也不加载。打开来历不明的仓库时先用这个模式看一眼是个好习惯。

## 管理多个智能体：Agent Command Center

Devin Desktop 2.0 新增的界面，用看板把所有智能体按状态分列：正在跑的、卡住等你处理的、等待审查的。它同时包含**本地智能体**（编辑器里的会话）和**云端智能体**（各自跑在独立虚拟机上的 Devin 会话）。

## 老 Windsurf 用户迁移

- 在命令面板运行 **Devin: Open Cascade Migration Wizard**，把原来的 workflows 和 memories 引导式迁过来（记忆建议迁成 skills）；
- `.windsurf/rules`、`.windsurfrules` 不用马上改，仍被读取；新建规则会存到 `.devin/rules`；
- 用 JetBrains 的：本站应用条目里记录过官方 FAQ 的说法——Windsurf 的 JetBrains 插件已进入维护模式，官方改为推荐通过 ACP 使用 Devin。

## 常见问题

**Q：Cascade 还能用吗？**
旧对话还在历史和侧边栏里；但新对话不会从 Cascade 开始，官方文档里 Cascade 被称为 legacy agent。

**Q：计划文件会进我的仓库吗？**
不会，它存在用户目录下；可以用 @ 引用它在新会话里继续。

**Q：MCP 怎么配？**
官方有单独的《Cascade MCP Configuration》页面，Devin Local 的 MCP、hooks、skills 则在「Customizations」界面统一查看。挑选和审查 MCP 服务器见[《MCP 服务器怎么选》](/guides/mcp-servers-how-to-choose-audit)。

## 参考资料

- Welcome to Devin Desktop（官方）：https://docs.devin.ai/desktop/getting-started
- Install Devin Desktop（官方）：https://docs.devin.ai/desktop/install
- Devin Local Agent（官方）：https://docs.devin.ai/desktop/devin-local
- Cascade Modes（官方）：https://docs.devin.ai/desktop/cascade/modes
- Memories & Rules（官方）：https://docs.devin.ai/desktop/cascade/memories
- Agent Command Center（官方）：https://docs.devin.ai/desktop/agent-command-center
