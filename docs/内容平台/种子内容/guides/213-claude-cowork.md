---
title: Claude Cowork 是什么、怎么用：和 Claude Code 有什么区别
slug: claude-cowork
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Cowork 就是不用终端、面向办公任务的 Claude Code。讲它能做什么、怎么开始、权限与定时任务、10 月改为云端运行，以及和 Claude Code 怎么选。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
  - https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
  - https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
  - https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
  - https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
  - https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
  - https://support.claude.com/en/articles/10065433-install-claude-desktop
  - https://claude.com/docs/cowork/overview
  - https://claude.com/docs/cowork/guide/projects
  - https://claude.com/pricing
verify:
  - 运行位置两处说法不同：帮助中心《Install Claude Desktop》仍写「Cowork 在你电脑上的隔离虚拟机里运行代码」；《Get started with Claude Cowork》《Use Claude Cowork on web, desktop, and mobile》写 2026-10-06 起 Pro / Max 新任务一律在云端运行（Team / Enterprise 云端为 beta）。本文以较新的后者为准
  - 项目（Projects）两处说法不同：Claude Docs《Organize work with projects》写「Cowork 项目保存在你电脑上、不同步到云端」；帮助中心写项目在桌面、网页、手机都可用，绑定本地文件夹的项目只能在桌面版开 Cowork 会话
  - 「Cowork 并入 Claude」正在向 Pro、Max 逐步推送，站长账号界面可能是新版或旧版
---

> 本文根据 Anthropic 官方帮助中心的 Claude Cowork 系列文章和 Claude Docs 整理，核对日期 2026-10-07。Cowork 在 2026 年 10 月有两次大变化（10 月 6 日改为云端运行、正在「并入 Claude」），网上较早的教程里「在本机虚拟机运行」「要一直开着电脑」等说法多已过时。

## 适用于谁

- 搜「claude cowork 是什么」「cowork 怎么用」的人；
- 想让 Claude 自己完成一整件事（整理文件夹、写调研报告、做带公式的表格和 PPT），而不是一问一答的人；
- 分不清 Cowork 和 Claude Code 该用哪个的人。

## 结论先说

1. **Cowork 是「不用终端的 Claude Code」**：用和 Claude Code 相同的智能体架构，但面向写代码以外的知识工作。你描述想要的结果，它自己拆步骤、跑代码、搜资料、读文件，最后交给你成品文件。
2. **只有付费套餐能用**（Pro、Max、Team、Enterprise）。桌面版（macOS / Windows）所有付费套餐可用；网页版和手机 App 对 Pro、Max 开放，Team 为 beta，Enterprise 需管理员开启。
3. **2026 年 10 月 6 日起，Pro / Max 的新任务都在云端运行**：合上电脑任务也继续跑，定时任务不需要电脑开机；但要用本地文件、浏览器、操控电脑时，桌面版必须开着。
4. **Cowork 正在「并入 Claude」**：先推给 Pro、Max。如果你的输入框里已经没有「Chat」「Cowork」两个选项，说明你已是新版，任何对话都能直接交代任务。
5. **怎么选**：办公文档、调研、整理文件、定时汇总 → Cowork；写代码、改项目、需要任务只在你电脑上运行 → Claude Code。

## Cowork 能做什么（官方示例）

| 类型 | 例子 |
| --- | --- |
| 文件整理 | 「把我的下载文件夹按类型和日期整理好」；把发票照片放进文件夹，生成格式化的报销单；按 YYYY-MM-DD 批量重命名 |
| 调研分析 | 汇总网页搜索、文章、论文和笔记写成报告；从会议记录、访谈中提炼主题和待办 |
| 做文档 | 生成带 VLOOKUP、条件格式、多个工作表的 Excel；用零散笔记或会议记录做成幻灯片；把语音备忘和散乱笔记整理成正式文档 |
| 数据 | 异常值检测、交叉表、时间序列分析；用你的数据出图；清洗和转换数据集 |

它还能：把复杂任务拆给多个子代理并行做；长时间运行不被对话超时打断；用你连接的应用（Google Drive、Gmail、Microsoft 365、Slack 等）；打开网站、点击、填表；在桌面版里直接读写你授权的本地文件夹。

## 步骤

### 1. 开始一个 Cowork 任务

**旧版界面**（输入框里有「Chat」「Cowork」选项）：

1. 打开 claude.ai、桌面版或手机 App（网页版在「Home」标签）；
2. 在输入框左下角选择 **Cowork**；
3. 描述你要完成的任务；
4. 看一下 Claude 给出的做法，然后让它开始。

**新版界面**（已经没有这两个选项）：直接在任何对话里说任务就行，Claude 会自己判断是简单回答还是要当作任务去做。

官方给的提需求方法：像给同事布置工作一样说清楚三件事——**想要的结果**（比如「一页摘要」「每个地区一个工作表的表格」）、**交付格式**（Word、幻灯片、能直接贴进 Slack 的消息）、**需要用到的材料**（哪些文件、链接、应用）。

任务进行中，你能看到每一步的进度和 Claude 的思路，随时插话纠偏；也可以去做别的，之后在任何设备上打开同一个会话看结果。Claude **永久删除文件前一定会弹窗**，需要你点「Allow」。

### 2. 选择权限模式

输入框里有模式选择器：

| 模式 | 行为 |
| --- | --- |
| Manually approve（手动） | 执行动作前先问你，你逐个允许或拒绝 |
| Automatically approve（自动） | 不逐步打扰你，每个动作先做安全检查（如数据外泄、提示词注入），拦下不安全的；屡次被拦会退回逐步询问 |
| Skip all approvals（跳过） | 不问也不检查，只在你完全信任任务涉及的一切时使用 |

新版界面里只有 **Auto** 和 **Manual（默认）** 两档，设置对整个对话生效。官方提醒：自动模式因为多做了安全检查，**更耗用量**；涉及钱、以你名义发消息、重要文件的任务，要盯紧或切回手动。

### 3. 给 Claude 立规矩：全局指示

旧版在 **Settings → Cowork → Global instructions** 点「Edit」，写下语气、输出格式、你的角色背景等长期要求，对所有 Cowork 会话生效。新版已合并到 **Settings → General → Instructions for Claude**，对所有对话生效。在桌面版选择本地文件夹时，还可以有针对该文件夹的「文件夹指示」，Claude 在会话中也可能自己更新它。

![Cowork 全局指示的编辑框：这里写的内容会应用到所有 Cowork 会话](seed:g213-cowork.png)
*图片来源：[Claude 帮助中心《Get started with Claude Cowork》](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork)*

### 4. 设置定时任务

所有付费套餐可用，定时任务在云端运行，电脑睡眠、桌面版关闭也照常执行：

- **新版**：直接说「每周一早上 9 点，总结上周我们团队 Slack 频道的消息」，回答 Claude 的问题，确认名称、时间和内容后点 **Schedule**；
- **旧版**：左侧边栏点 **Scheduled → New task**，选「Create with Claude」（让 Claude 问你几个问题后建好）或「Set up manually」（自己填任务名、提示词、权限模式、频率、模型、工作文件夹）；也可以在任务里输入 `/schedule`。

频率可选每小时、每天、每周、工作日或手动。在「Scheduled」页面可以查看即将运行和历史运行、编辑、暂停、恢复、删除、立即运行。注意：需要本地文件或应用的定时任务只能在本机运行。

### 5. 用好项目、插件和浏览器

- **项目**：把相关任务放进一个工作区，带自己的文件夹、链接、指示和记忆；
- **插件**：把技能、连接器、子代理打包成一个，加到账号后在聊天、Cowork、Claude Code 里都能用，详见本站《Claude Skills 是什么、怎么装、推荐哪些》；
- **浏览器**：桌面版默认用内置浏览器，已在用 Claude in Chrome 的会继续用 Chrome，可在 **Settings → Cowork** 里切换，详见本站《Claude in Chrome 扩展怎么用：安装、权限与安全提示》；
- **操控电脑**：Pro、Max 的 beta 功能，Claude 优先用连接器，其次用浏览器，最后才直接操作屏幕上的应用。

注意：Cowork 使用的是你在 **Customize** 里为账号启用的连接器、技能和插件，**不读取**命令行版 Claude Code 的 `~/.claude` 目录；只存在于 `~/.claude` 里的技能要在 Customize 里另外添加。

## 10 月的两个变化

**10 月 6 日：Pro / Max 改为云端运行。** 新的 Cowork 任务都在 Anthropic 服务器上的隔离临时环境里运行，「Settings → General」里的「Only on your computer」选项已移除，不能切回。你的文件夹仍在你电脑上，Claude 只通过桌面版访问你连接过的文件夹，而且只在桌面版开着时；需要某个文件时只取那一个文件的副本。10 月 6 日前在本机开始的任务和定时任务会继续在本机跑完。

**Cowork 并入 Claude（逐步推送）。** 新版里没有单独的 Cowork 模式：Cowork 任务和聊天一起出现在「Recents」，没有联网搜索开关（需要时自动搜），深度研究改为输入 `/deep-research` 或点 **+ → Research**。目前的限制包括：不支持从 GitHub 添加、不能从中间分叉对话、无痕聊天仍是旧体验（不能建文件、跑代码）、Dispatch 不再对新用户开放。

## 和 Claude Code 有什么区别

| | Cowork | Claude Code |
| --- | --- | --- |
| 定位 | 写代码以外的知识工作：文档、表格、演示稿、调研、文件整理 | 智能体编程：读代码库、改文件、跑命令 |
| 怎么用 | 网页、桌面、手机、Chrome 侧边栏，不需要终端 | 终端、IDE 插件、桌面版 Code 标签、网页版 |
| 在哪运行 | Pro / Max 新任务在云端；本地文件经桌面版访问 | 本地会话在你电脑上运行；也可以开云端会话 |
| 配置来源 | Customize 里的连接器、技能、插件（跟账号走） | CLAUDE.md、settings.json、`~/.claude` 等本地配置 |
| 套餐 | 付费套餐 | 付费套餐 |

两者底层是同一套智能体架构。官方的建议很明确：**想让新任务只在自己电脑上运行，就用桌面版里的 Claude Code**，它在本机运行，文件夹和历史都留在本机。想把一个 Cowork 任务搬过去：在任务里选「Download task data」，解压后用 Claude Code 打开这个文件夹，运行 `/port-task-data` 接着做。

Claude Code 的入门和桌面版用法分别详见本站《Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令》和《Claude Code 桌面版使用教程：Code 标签页、并行会话与定时任务》。

## 安全提示（官方要点）

- 风险大小取决于两件事：Claude 能**读到**什么、能**做**什么。提示词注入要同时满足「能读到外部不可信内容」和「能执行有害动作」才会得手，所以两者至少收紧一个；
- 别把存有财务文件等敏感信息的文件夹交给它；
- 只在可信网站上让它操作，尤其是已登录、涉及钱和个人信息的网站；
- 操控电脑时要格外小心，它直接点击屏幕，没有其他工具那样的权限检查；
- 发现它行为异常（访问意料之外的网站、索要敏感信息）就立刻停止。

## 常见问题

**Q：Free 能用 Cowork 吗？**
不能。帮助中心写明 Cowork 只对付费套餐开放。还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：开始任务时显示「Setting up Claude's workspace」？**
正常现象，表示 Cowork 正在更新到最新版本。

**Q：任务做到一半停了？**
10 月 6 日前在本机开始的任务，要求桌面版全程开着，电脑睡眠或关闭 App 会中断；云端会话会在后台继续，从任何设备打开会话看进度即可。

**Q：用量掉得很快？**
多步骤任务（跑代码、建文件、用连接的应用和浏览器）比简单问答耗得多。官方建议：相关工作合并成一个任务；无关的工作新开对话；只要快速回答时明确告诉 Claude 不用生成文件；在「Settings → Usage」查看用量。

**Q：能把 Cowork 会话分享给别人吗？**
不能分享会话，但可以分享会话里生成的 Artifact，详见本站《Claude Artifacts 是什么、怎么用：创建、分享与导出（2026 新版）》。

## 参考资料

- Get started with Claude Cowork（官方）：https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- Use Claude Cowork on web, desktop, and mobile（官方）：https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- Claude Cowork and chat are one Claude（官方）：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- Schedule recurring tasks in Claude Cowork（官方）：https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
- Use Claude Cowork safely（官方）：https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
- Let Claude use your computer in Cowork（官方）：https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
- Install Claude Desktop（官方）：https://support.claude.com/en/articles/10065433-install-claude-desktop
- Cowork Overview（官方 Claude Docs）：https://claude.com/docs/cowork/overview
- Organize work with projects（官方 Claude Docs）：https://claude.com/docs/cowork/guide/projects
- 套餐对比（官方）：https://claude.com/pricing
