---
title: Claude 桌面版下载安装（Windows / Mac）：功能与设置中文界面
slug: claude-desktop-app
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 桌面版去哪下载、系统要求、Windows / Mac / Linux 怎么装，界面能不能改中文，以及快速唤起、桌面扩展、Cowork 等桌面版独有功能。
checkedOn: 2026-10-07
sources:
  - https://claude.com/download
  - https://support.claude.com/en/articles/10065433-install-claude-desktop
  - https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
  - https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac
  - https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
  - https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
  - https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
  - https://support.claude.com/en/articles/16607400-use-the-built-in-browser-in-claude-cowork
  - https://claude.com/pricing
  - https://www.anthropic.com/supported-countries
verify:
  - 界面语言：帮助中心列出的 11 种界面语言里没有中文（简体 / 繁体），站长核对时可在「Language」设置里确认是否已新增
  - 「Chat / Cowork 合并成一个对话」正在向 Pro、Max 逐步推送，站长核对时输入框里是否还显示「Chat」「Cowork」两个选项取决于账号
  - Microsoft Store 版与官网下载版有无功能差异，官方未说明
  - Cowork 运行位置：《Install Claude Desktop》写本机虚拟机，较新的 Cowork 文章写 2026-10-06 起 Pro / Max 新任务在云端运行，正文两种说法都已写出
---

> 本文根据 Claude 官方下载页、帮助中心《Install Claude Desktop》《How to use Claude in your preferred language》等文章整理，核对日期 2026-10-07。截图引用自官方帮助中心，图下注明出处。

## 适用于谁

- 搜「claude 桌面版下载」「claude windows 版」「claude mac 版安装」的人；
- 想把 Claude 界面改成中文，想知道到底支不支持的人；
- 想知道桌面版比网页版多了什么、值不值得装的人。

## 结论先说

1. **官方下载地址是 claude.com/download**：提供 macOS、Windows（x64）、Windows（ARM64）安装包，以及 Microsoft Store 版；Linux（beta）按官方文档用 apt 安装。
2. **系统要求**：macOS 11（Big Sur）及以上；Windows 10 及以上；Linux 为 Ubuntu 22.04 LTS+ 或 Debian 12+，x64 或 arm64。
3. **Free 也能用桌面版聊天**；桌面版里的 Claude Code 和 Cowork 需要付费套餐（Pro、Max、Team、Enterprise）。
4. **界面语言目前没有中文**：官方支持的 11 种界面语言里没有中文，但**用中文提问完全没问题**，Claude 会用你提问的语言回答。
5. **桌面版独有**：Mac 快速唤起（双击 Option）、桌面扩展（本地 MCP）、读写本地文件夹、电脑操控（beta）、内置浏览器、Code 标签页等。

## 下载与安装

### 各套餐能用什么

| 功能 | Free | Pro | Max | Team | Enterprise |
| --- | --- | --- | --- | --- | --- |
| 聊天（Chat） | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Code | — | ✅ | ✅ | ✅ | ✅ |
| Claude Cowork | — | ✅ | ✅ | ✅ | ✅ |

（来源：帮助中心《Install Claude Desktop》。）还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

### macOS 和 Windows

1. 打开官方下载页 claude.com/download；
2. Mac 选 macOS 点 Download；Windows 选 Windows（ARM 设备选 Windows arm64），也可以走 Microsoft Store；
3. 下载完成后打开安装文件完成安装；
4. Mac 从「应用程序」文件夹、Windows 从开始菜单启动 Claude；
5. 用你的 Claude 账号登录。

### Linux（beta）

官方推荐用 apt 仓库安装，这样更新会跟着系统包一起来（Linux 版**不会自己更新**）：

```bash
sudo curl -fsSLo /usr/share/keyrings/claude-desktop-archive-keyring.asc https://downloads.claude.ai/claude-desktop/key.asc
echo "deb [signed-by=/usr/share/keyrings/claude-desktop-archive-keyring.asc] https://downloads.claude.ai/claude-desktop/apt/stable stable main" | sudo tee /etc/apt/sources.list.d/claude-desktop.list
sudo apt update && sudo apt install claude-desktop
```

装好后从应用菜单启动，或在终端运行 `claude-desktop`，登录即可。以后更新用 `sudo apt update && sudo apt upgrade`。

也可以在下载页下载对应架构的 `.deb` 文件，用 `sudo apt install ~/Downloads/claude-desktop_amd64.deb` 安装，但这样不会自动加入更新源。

Linux 版目前的限制：没有电脑操控（computer use），没有语音听写；快速唤起的全局快捷键在 X11 下可用，原生 Wayland 下取决于桌面环境的 GlobalShortcuts 支持。

### 地区说明

Claude（含桌面版）只在 Anthropic 支持的国家和地区提供，中国大陆目前不在列表中，完整列表见 https://www.anthropic.com/supported-countries 。请遵守所在地法律和服务条款。

## 界面能不能改成中文

**官方帮助中心列出的界面语言共 11 种**：英语、法语、德语、印地语、印尼语、意大利语、日语、韩语、葡萄牙语（巴西）、西班牙语（拉丁美洲）、西班牙语（西班牙）。**列表里没有中文**，所以目前桌面版和网页版的菜单无法切换成中文。

改界面语言的方法（网页版和桌面版相同）：

1. 点左下角的头像；
2. 找到「Language」；
3. 选择语言，界面会自动刷新。

两点说明：

- **界面语言不影响对话语言**。你用中文提问，Claude 就用中文回答；想固定输出中文，也可以在「Settings → General」的「Instructions for Claude」（给 Claude 的指示）里写一句「请始终用简体中文回答」。
- **语音模式有自己的语言设置**，在「Settings → General → Voice → Language」里，和界面语言分开。语音模式详见本站教程《Claude 语音模式怎么用：语音对话、语音输入与常见问题》。

## 桌面版独有的功能

### 1. 快速唤起（Quick entry，仅 Mac）

所有套餐都能用（需 macOS 12+，语音听写需 macOS 14+）。首次打开新版桌面版时会提示开启快捷键：

- **双击 Option**：在任何应用里弹出输入框，直接开始新对话，点「New chat」还能看到最近 5 个对话；
- **截图提问**：弹出输入框后，按住鼠标拖选屏幕区域，截图自动附到消息里；
- **分享窗口**：弹出输入框后点击某个应用窗口，把窗口内容附上；
- **语音听写**（默认关闭，因为会占用 Caps Lock）：按一次 Caps Lock 开始说话，再按一次结束，点箭头发送。

快捷键在「Settings → General（Desktop app 下）」里修改，快速唤起可以改成 Option + Space 或自定义组合键。需要在「系统设置 → 隐私与安全性」里给 Claude 屏幕录制、辅助功能、语音识别权限。Windows 目前没有这个功能。

![Mac 上双击 Option 弹出的快速唤起输入框，右侧可以选择新对话或最近的对话](seed:g210-quick-entry.png)
*图片来源：[Claude 帮助中心《Use quick entry with Claude Desktop on Mac》](https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac)*

### 2. 桌面扩展（本地 MCP 服务器）

桌面扩展就像浏览器扩展：一键安装，让 Claude 连上本机的文件、应用和数据，不用手动改 JSON 配置。定价页显示 Free 也可用。

- **从目录安装**：「Settings → Extensions」→「Browse extensions」，选 Anthropic 审核过的扩展点「Install」，按界面填好需要的设置（比如 API Key）；
- **安装自定义扩展**：「Settings → Extensions」→「Advanced settings」→ Extension Developer 区域 →「Install Extension…」，选择 `.mcpb` 文件。

本地扩展只能在桌面版和 Claude Code 里用，网页版和手机上用不了；云端服务请用远程连接器，详见本站《Claude Connectors（连接器）怎么用：连接 Google Drive、Gmail 等与推荐》。

### 3. Cowork：替你完成整件事的智能体（付费套餐）

Cowork 把 Claude Code 的智能体能力搬进了图形界面：可以直接读写你授权的本地文件夹，处理长任务，交付带公式的表格、排好版的演示稿。关于它在哪里运行，官方两处说法不同：《Install Claude Desktop》仍写「在你电脑上的隔离虚拟机里运行代码」，较新的 Cowork 文章写 2026 年 10 月 6 日起 Pro / Max 的新任务改在云端运行、本地文件通过桌面版访问。详见本站《Claude Cowork 是什么、怎么用：和 Claude Code 有什么区别》。

注意：官方正在把 Chat 和 Cowork 合并成同一个对话（先推给 Pro、Max 的网页、桌面和手机端）。如果你的输入框里已经看不到「Chat」「Cowork」两个选项，就是新版本，Cowork 能做的事在任何对话里都能直接要；但涉及本地文件、内置浏览器、电脑操控的任务，仍然需要桌面版开着。

### 4. 电脑操控、内置浏览器、Claude in Chrome

- **电脑操控（computer use）**：Pro、Max 的 beta 功能，macOS 和 Windows 桌面版的 Cowork、Claude Code 里可用。没有对应连接器时，Claude 会直接点击、输入、打开应用；每个应用第一次访问前都会征求你同意。
- **内置浏览器**：Cowork 任务涉及网站时，会在任务旁的侧边面板里打开浏览器，Claude 在里面浏览、点击、填表，不用装任何东西。
- **Claude in Chrome**：在「Settings → Connectors」里配置后，Claude 也可以操作你自己的 Chrome，详见本站《Claude in Chrome 扩展怎么用：安装、权限与安全提示》。

### 5. Code 标签页

桌面版顶部的 Code 标签页就是图形界面版的 Claude Code（需要付费套餐），能直接读写你电脑上的项目代码，不用单独装命令行版。具体怎么开会话、选环境、看 diff、开并行会话，详见本站《Claude Code 桌面版使用教程：Code 标签页、并行会话与定时任务》。

## 常见问题

**Q：Free 账号装桌面版有意义吗？**
有。聊天、桌面扩展、Mac 的快速唤起都是 Free 可用的；Code 标签页、Cowork 才需要付费。

**Q：Windows 有没有像 Mac 那样的全局快捷键？**
没有。官方 FAQ 明确快速唤起目前只支持 macOS。

**Q：快速唤起的快捷键和别的软件冲突了？**
在「Settings → General」里把快速唤起改成 Option + Space 或自定义组合键；语音快捷键只能用 Caps Lock 或关闭。

**Q：Linux 版怎么更新？**
Linux 版不会自己更新。用 apt 仓库安装的，随系统更新 `sudo apt update && sudo apt upgrade` 即可；直接装 `.deb` 的需要重新下载安装，官方建议改用 apt 仓库。

**Q：桌面扩展装不上？**
官方排查第一步：确认桌面版是最新版本。Team / Enterprise 账号还要看管理员是否关闭了桌面扩展或限制了可安装列表（关闭时「Settings」里不会出现「Extensions」）。

## 参考资料

- Claude 下载页（官方）：https://claude.com/download
- Install Claude Desktop（官方）：https://support.claude.com/en/articles/10065433-install-claude-desktop
- How to use Claude in your preferred language（官方）：https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
- Use quick entry with Claude Desktop on Mac（官方）：https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac
- Getting started with local MCP servers on Claude Desktop（官方）：https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
- Claude Cowork and chat are one Claude（官方）：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- Let Claude use your computer in Cowork（官方）：https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
- Use the built-in browser in Claude Cowork（官方）：https://support.claude.com/en/articles/16607400-use-the-built-in-browser-in-claude-cowork
- 套餐对比（官方）：https://claude.com/pricing
- Anthropic 支持的国家和地区（官方）：https://www.anthropic.com/supported-countries
