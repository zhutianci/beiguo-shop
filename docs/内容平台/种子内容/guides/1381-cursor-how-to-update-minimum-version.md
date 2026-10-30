---
title: Cursor 怎么更新：应用内更新、Attempt Update 命令、手动覆盖安装，以及「Update Required」最低版本时间表
slug: cursor-how-to-update-minimum-version
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor 更新有三种办法：点更新提示里的 Update，命令面板运行 Attempt Update，或到 cursor.com/download 下载覆盖安装。官方还公布了最低版本政策：版本太旧会提示更新，再旧会停止工作。本文给出步骤和 2026 年的时间表。
checkedOn: 2026-10-30
sources:
  - https://cursor.com/help/troubleshooting/minimum-version
  - https://cursor.com/help/getting-started/install
verify:
  - 官方页面没有写菜单里的「检查更新」入口，也没有说明怎么查看当前版本号，本文不编造这些步骤
  - 最低版本时间表（2026-10-26、2026-11-22、2026-12-14 的版本号）来自官方页面当天写法，之后可能调整，以官方页面为准
  - 官方说明 update.mode 为 none 或 manual 时不会自动更新，管理员的 UpdateMode 策略会覆盖个人设置
---

> 本文根据 Cursor 官方帮助中心《Minimum version policy》《Download and install》整理，资料核对于 2026-10-30。**官方页面没有写「检查更新」菜单和查看版本号的位置**，本文只写官方写了的方法。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想把 Cursor 更新到最新版的人；
- 点了更新没反应、一直更新不了的人；
- 看到「Update Required」「请更新」提示的人。

## 结论先说

1. **最常见的办法：** 应用里出现更新消息时，点 **Update**，按提示重启。
2. **主动更新：** 按 **Cmd/Ctrl+Shift+P** 打开命令面板，运行 **Attempt Update**，按提示重启。
3. **更新不动：** 官方说，如果设置项 `update.mode` 被设成了 `none`，应用内更新不会工作，直接到 [cursor.com/download](https://cursor.com/download) 下载安装包覆盖。
4. **手动覆盖：** 官方写明，下载最新版安装到当前版本上，**设置和聊天记录会保留**。
5. **版本太旧会怎样：** 官方有最低版本政策，旧版本会先提示更新，过了期限会停止工作，聊天记录和设置不会被删。

![Cursor 怎么更新](seed:g1381-update-steps.png)
*图：本站根据 [Cursor 帮助中心：最低版本政策](https://cursor.com/help/troubleshooting/minimum-version) 整理的示意图*

## 一、三种更新办法

**1. 点更新提示。** Cursor 通常会自己更新，或者在应用里提示你更新；点提示里的 **Update**，重启即可。

**2. 命令面板。** 按 Cmd/Ctrl+Shift+P，输入并运行 **Attempt Update**，重启。

**3. 下载安装包。** 到 cursor.com/download 点你系统对应的按钮：Mac 把 Cursor 拖进「应用程序」文件夹，Windows 运行安装程序并按提示操作，Linux 优先用包管理器，没有的话解压 AppImage 或压缩包运行。装完再打开 Cursor，登录你的账号。初次安装的细节见 [/guides/cursor-install-chinese-setup](/guides/cursor-install-chinese-setup)。

## 二、为什么不自动更新

官方列了几种情况：

- 设置项 `update.mode` 是 `none` 或 `manual`，Cursor 就不会自动更新；
- 公司管理员设置了 `UpdateMode` 这个 MDM 策略，它会覆盖你自己的设置；
- 查看 `update.mode`：按 Cmd/Ctrl+Shift+P，运行 **Preferences: Open Settings (UI)**，搜索 `update.mode`。

如果是公司电脑，更新被管理员锁定，需要找管理员，不要自己绕。

## 三、最低版本政策：多旧会停止工作

![Cursor 版本太旧会怎样](seed:g1381-minversion-compare.png)
*图：本站根据 [Cursor 帮助中心：最低版本政策](https://cursor.com/help/troubleshooting/minimum-version) 整理的示意图*

官方定义了两条线：

- **最低受支持版本：** 低于它的旧版本还能用，但会出现「请更新」的提醒，通常是版本发布后约 2 个月；
- **最低允许版本：** 低于它的版本会停止工作，通常是发布后约 3 个月。

官方公布的当前时间表（2026 年）：

- **10 月 26 日：** 最低允许版本 3.6，最低受支持版本 3.18；
- **11 月 22 日：** 最低允许版本变为 3.12；
- **12 月 14 日：** 最低允许版本变为 3.18。

版本太旧时，Cursor 仍然能打开，会显示「Update required」，Agent 请求会报 **Update Required** 错误，直到你更新；聊天记录和设置不会被删除。

## 四、常见问题

**Q：怎么知道自己是哪个版本？**
官方这页没有写查看版本号的位置，请以应用界面和官方文档为准。

**Q：更新后设置会丢吗？**
官方说手动覆盖安装时，设置和聊天记录会保留。

**Q：更新后还是连不上、报错？**
先看 [/guides/cursor-common-errors-connection-failed](/guides/cursor-common-errors-connection-failed)；用 Agent 的方法见 [/guides/cursor-agent-mode-plan-ask](/guides/cursor-agent-mode-plan-ask)。

**Q：想知道套餐和额度？**
见 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)。需要订阅 ChatGPT 的人可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Cursor 帮助中心：Minimum version policy — https://cursor.com/help/troubleshooting/minimum-version
- Cursor 帮助中心：Download and install — https://cursor.com/help/getting-started/install
