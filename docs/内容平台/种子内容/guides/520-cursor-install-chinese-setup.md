---
title: Cursor 安装教程：下载、登录、导入 VS Code 设置与设置中文界面
slug: cursor-install-chinese-setup
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor 怎么安装、怎么设置中文？按官方文档讲清 Windows / macOS / Linux 的系统要求与安装步骤、一键导入 VS Code 设置、把界面和 AI 回答改成中文的做法，以及白屏、「已损坏」等启动问题。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/docs/get-started/quickstart
  - https://cursor.com/help/getting-started/install
  - https://cursor.com/help/getting-started/migrate-vscode
  - https://cursor.com/help/troubleshooting/install-issues
  - https://cursor.com/docs/rules
  - https://code.visualstudio.com/docs/configure/locales
verify:
  - 中文语言包在 Cursor 的扩展市场（Open VSX）里是否能搜到、Agents Window 等 Cursor 自有面板是否随语言包汉化，官方文档没有说明，以你安装的版本为准
  - Cursor Settings 各菜单的中文名称未在中文界面核对，文中保留英文原名
---

> 本文根据 Cursor 官方文档（Quickstart、帮助中心安装与迁移页）和 VS Code 官方文档的显示语言一节整理，资料核对于 2026-10-11。Cursor 更新很快，菜单位置以你安装的版本为准。

## 适用于谁

- 第一次装 Cursor，想知道系统要求和安装步骤的人；
- 搜「cursor 安装教程」「cursor 设置中文」「cursor 设置中文不生效」的人；
- 已经在用 VS Code，想把插件、主题、快捷键一起搬过来的人。

Cursor 是什么、适合谁，见本站 AI 应用目录里的 Cursor 条目；本文只讲安装和初始设置。

## 结论先说

1. **只从官网下载**：cursor.com/download。官方文档要求 macOS 12 及以上、Windows 10 及以上；Linux 推荐用 apt / dnf 软件源，其次才是 AppImage。
2. 装好后**用 Cursor 账号登录**，再用 File → Open Folder 打开一个项目文件夹就能开始。
3. VS Code 的扩展、主题、设置、快捷键可以**一键导入**：Cursor Settings → General → Account → VS Code Import。
4. 「设置中文」其实是两件事：**界面语言**沿用 VS Code 的语言包机制（命令面板里的 Configure Display Language）；**让 AI 用中文回答**要写进 User Rules。
5. 官方文档本身有简体中文版：把文档地址里的 `/docs` 换成 `/cn/docs` 即可。

## 步骤一：下载与安装

| 系统 | 官方要求 | 安装方式 |
| --- | --- | --- |
| macOS | macOS 12（Monterey）及以上，支持 Apple 芯片和 Intel | 下载 `.dmg`，把 Cursor 拖进「应用程序」 |
| Windows | Windows 10 及以上 | 下载 `.exe`，按提示安装 |
| Linux | — | apt（Debian / Ubuntu）或 dnf（RHEL / Fedora）软件源；也可下载 AppImage |

Linux 用 AppImage 时：

```bash
chmod +x Cursor-*.AppImage
./Cursor-*.AppImage
```

官方说明 apt / dnf 包优于 AppImage：有桌面图标、自动更新，并且自带命令行工具。软件源的添加命令比较长，直接照官方 Quickstart 页复制，不要从第三方页面抄。

## 步骤二：登录并打开项目

1. 打开 Cursor，按提示登录账号（没有账号先在 cursor.com 免费注册）。
2. File → Open Folder，选一个已有的项目文件夹。
3. 按 `Ctrl+I`（macOS 为 `Cmd+I`）打开 Agent 面板，官方建议的第一句话是让它讲解代码库：

```text
解释这个代码库：主要入口在哪、有哪些关键模块、改代码之前我应该先读什么？
```

4. 第一次改动选低风险的小任务（改文案、修一个小界面问题），改完看 diff，再让它跑项目已有的测试或类型检查。

## 步骤三：从 VS Code 搬家

1. 打开 Cursor Settings：`Ctrl+Shift+J`（macOS 为 `Cmd+Shift+J`）；
2. 进入 **General → Account**；
3. 在 **VS Code Import** 下点 **Import**。

扩展、主题、设置和快捷键会一起导入。要注意官方的一句提醒：Cursor 的扩展来自 **Open VSX** 而不是微软的 VS Code Marketplace，常用扩展大多有，但不保证每个都在、行为完全一致。两个编辑器可以同时安装、打开同一个项目，互不影响。

## 步骤四：把界面改成中文

Cursor 的编辑器部分沿用 VS Code，显示语言走的是 VS Code 的语言包机制（VS Code 官方文档的说法是：默认英文，其他语言靠 Language Pack 扩展）：

1. `Ctrl+Shift+P`（macOS 为 `Cmd+Shift+P`）打开命令面板；
2. 输入 `display`，选 **Configure Display Language**；
3. 选「中文（简体）」；没装语言包时会先安装；
4. 按提示重启。

如果列表里没有中文，先到扩展面板（`Ctrl+Shift+X`）搜索 `Chinese (Simplified)` 语言包安装，再重复上面的步骤。

**「设置了不生效」常见原因**：没有完全重启（要彻底退出再开，而不是只关窗口）；或者你看的是 Cursor 自己新增的界面。语言包翻译的是编辑器原有的菜单，Cursor Settings、Agents Window 这类 Cursor 自有面板是否汉化，官方文档没有承诺，保持英文属于正常情况。

## 步骤五：让 AI 用中文回答

界面语言不影响 AI 的回答语言。官方的做法是写 **User Rules**（对所有项目生效的个人规则）：打开侧边栏的 **Customize → Rules**，在 User Rules 里加一句：

```text
始终用简体中文回答；代码、命令和报错原文保持英文。
```

注意官方文档写明：User Rules 只对 Agent（聊天）生效，**不作用于行内编辑（Ctrl+K）和 Tab 补全**。行内编辑想要中文解释，就在指令里直接写「用中文说明」。项目级规则的写法见[《Cursor Rules 怎么写》](/guides/cursor-rules-project-rules-mdc)。

## 常见问题

**Q：启动后白屏？**
官方给的顺序：完全退出再打开（macOS 用 Cmd+Q，Windows / Linux 从托盘退出）；Windows 试试以管理员身份运行；macOS 把 Cursor 拖进废纸篓后从官网重新下载。

**Q：macOS 提示「Cursor 已损坏」？**
官方说明这是 macOS 的问题，不是下载坏了。先退出 Cursor 并在「活动监视器」里结束残留进程，等一分钟再开；不行就删掉重新下载，再不行重启电脑。

**Q：怎么更新？**
命令面板输入 `Cursor: Attempt Update`，按提示重启。更新通道有 Stable（默认）和 Early Access（尝鲜版，可能不稳定），在 Cursor Settings 里切换。

**Q：Cursor 越用越占硬盘？**
官方说最占空间的通常是 Agent 的历史对话。在命令面板里先运行 **Delete Old Chats…** 选保留天数，再运行 **GC Agent KV Blobs**——第二条才会真正把数据库文件缩小。

**Q：免费能用吗？**
能。Hobby 免费档可以用 Agent 和 Tab，但用量有限，详见[《Cursor 额度与套餐》](/guides/cursor-usage-limits-plans)。

## 参考资料

- Cursor Quickstart（官方）：https://cursor.com/docs/get-started/quickstart
- Download and install Cursor（官方帮助中心）：https://cursor.com/help/getting-started/install
- Migrate from VS Code（官方帮助中心）：https://cursor.com/help/getting-started/migrate-vscode
- Installation and startup（官方帮助中心）：https://cursor.com/help/troubleshooting/install-issues
- Rules（官方）：https://cursor.com/docs/rules
- VS Code Display Language（微软官方）：https://code.visualstudio.com/docs/configure/locales
