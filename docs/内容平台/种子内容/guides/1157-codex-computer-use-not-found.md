---
title: Codex 找不到 Computer Use 怎么办：插件在哪装、地区限制、macOS 权限与 Windows 前台运行说明
slug: codex-computer-use-not-found
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 桌面 App 的 Computer Use 能让 Codex 看屏幕、点鼠标、操作桌面应用，但官方写明它只在支持的地区可用，需要装 Computer Use 插件并开启开关。本文按官方文档讲插件在哪装、macOS 要给哪两个权限、Windows 为什么会占用前台，以及找不到时的排查。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/computer-use
  - https://learn.chatgpt.com/docs/pricing
  - https://learn.chatgpt.com/docs/reference/settings
  - https://learn.chatgpt.com/docs/remote-connections
verify:
  - 官方写明 Computer Use 在支持的地区可用，官方 Pricing 的功能可用性表把它标为各套餐「受限」并加了地区脚注，但没有在这两页里列出具体国家和地区，本文不猜测，以官方文档和你账号里是否显示为准
  - 插件和设置的名称（Plugins、Computer Use、Install plugin、Enable、Try now、Always allow）来自官方文档当天的写法，实际界面以你的版本为准
  - 官方没有写「找不到 Computer Use」的统一提示文字，本文按官方的设置流程和权限说明整理排查顺序
---

> 本文根据 Codex 官方文档《Computer Use》《Pricing》《Settings》《Remote connections》整理，资料核对于 2026-10-27。官方没有「找不到 Computer Use」的专门排查页，本文按它的设置流程和权限说明整理。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 ChatGPT 桌面 App 的 Plugins 里找不到 Computer Use 的人；
- 装了插件，却发现 ChatGPT 看不到或点不了目标应用的人；
- Windows 上用 Computer Use 时，鼠标被「抢走」，想知道怎么办的人；
- 想知道 Computer Use 是什么、该不该开的人。

## 结论先说

1. **Computer Use 的官方说明写的是：在支持的地区，在 macOS 和 Windows 的 ChatGPT 桌面 App 里，配合 ChatGPT Work 和 Codex 使用。** 官方 Pricing 的功能可用性表把它标为各套餐「受限」，并加了脚注：功能目前只限特定地区。所在地区不在范围内，它就不会出现，这是官方的限制，不是你哪里设置错了。
2. **在范围内的话，它是一个插件**：在 App 里选 ChatGPT 并切到 **Work**，或选 **Codex**；打开 **Plugins > Computer Use**，提示时点 **Install plugin**，显示 **Enable** 就点它；把 Computer Use 的服务（MCP server）和技能（skill）两个开关打开，再点 **Try now**。
3. **macOS 要授权两项**：**屏幕录制**（让 ChatGPT 看到目标应用）和**辅助功能**（让它点击、输入、操作）。
4. **Windows 上要让目标应用显示在当前活动桌面上。** Windows 上 Computer Use 在前台运行，不能在你继续使用同一个会话时在后台工作。
5. **看不到、点不了某个应用**：先看系统权限，再看是不是批准了这个应用。

![在桌面 App 里启用 Computer Use](seed:g1157-enable-steps.png)
*图：本站根据 [Codex 官方文档：Computer Use](https://learn.chatgpt.com/docs/computer-use) 整理的示意图*

## 一、Computer Use 是什么

官方的描述：Computer Use 让 ChatGPT 能看到并操作 macOS 或 Windows 上的图形界面。适合命令行工具或结构化集成不够用的任务，比如检查桌面应用、使用浏览器、改应用设置、处理没有插件可用的数据源，或复现只在图形界面里出现的 bug。官方列的好用场景：测试 macOS 应用、Windows 应用、iOS 模拟器流程；做需要网页浏览器的任务；复现图形界面里的 bug；改需要点击界面的设置；查看没有插件可读的应用里的信息；在 macOS 上一边在后台跑一个限定的任务一边做别的；跑跨多个应用的流程。

官方也提醒：因为它可能影响项目工作区之外的应用和系统状态，要用于**范围明确的任务**，继续之前认真看权限提示。如果应用有专门的插件或 MCP 服务器，数据访问和可重复的操作优先用这种结构化集成；需要视觉检查或操作应用时再用 Computer Use。你在本地开发网页应用，官方建议先用内置浏览器。

## 二、找不到：先看是不是地区限制

官方 Pricing 页的功能可用性表里，Computer Use 在 Plus、Pro、Business、Enterprise 和 API 登录下都标为「受限」，脚注写的是：该功能目前只限特定地区，具体地区限制见各个功能自己的文档。Computer Use 文档开头的写法是「In supported regions」，没有在页面里列出国家名单。所以：

- 在 Plugins 里**根本没有** Computer Use：很可能就是还没对你所在的地区开放，或者账号、工作区设置没有开放，官方没有提供绕过的办法；
- 工作区账号：管理员可以限制 Computer Use 能访问哪些应用、是否允许保存批准，也可以通过 `requirements.toml` 里的 `[features].computer_use = false` 把它整个关掉，问管理员；
- 先把 ChatGPT 桌面 App 更新到最新版再看一次，更新方法见 [/guides/chatgpt-desktop-app-wont-open-update](/guides/chatgpt-desktop-app-wont-open-update)。

![找不到或用不了 Computer Use](seed:g1157-cu-decide.png)
*图：本站根据 [Codex 官方文档：Computer Use](https://learn.chatgpt.com/docs/computer-use) 整理的示意图*

## 三、在 Plugins 里安装和启用

官方步骤（本站转述）：

1. 在 ChatGPT 桌面 App 里选择 ChatGPT 并在切换器里切到 **Work**，或者选 **Codex**；
2. 打开 **Plugins > Computer Use**，如有提示，点 **Install plugin**；如果显示 **Enable**，点它；
3. 打开 Computer Use 服务器和技能的开关，然后点 **Try now** 开始；
4. 再打开 **Settings > Computer use** 查看应用访问。已连接的浏览器控制有一个 **Manage** 按钮；你批准给以后任务使用的应用会出现在 **Always-allowed apps** 里。

启动一个任务：在提示里写 `@Computer` 或 `@应用名`，或直接让 ChatGPT 用 Computer Use，并说清楚要操作的应用、窗口或流程。官方示例：

```text
Open @Chrome and verify the checkout page still works after the latest changes.
```

## 四、macOS 和 Windows 的权限

### macOS

官方写的：需要授予 **Screen Recording**（让 ChatGPT 看到目标应用）和 **Accessibility**（让它点击、输入、导航）。如果 ChatGPT 看不到或控制不了某个应用，打开 **System Settings > Privacy & Security**，检查 **Screen Recording** 和 **Accessibility** 里 **Codex Computer Use** 是否已开启。官方还提到 macOS 有「锁屏使用」（locked use）：需要在 **Settings > Computer Use** 里主动开启，之后在 Mac 锁屏后，已连接设备发起的 Computer Use 任务才能继续。它是有限制的设计，不是通用的远程解锁。

### Windows

官方写的：Windows 上 Computer Use 在**当前活动桌面**上运行，不能在你继续用同一个 Windows 会话时在后台工作，运行时它会移动指针、打字、占用前台。想在你离开时继续跑，要保持设备解锁并联网，可以用手机远程查看进度（见 [/guides/codex-remote-control-ssh-host](/guides/codex-remote-control-ssh-host)），或者在 Windows 虚拟机里运行 ChatGPT 桌面 App，让 Computer Use 接管虚拟机而不是你的主桌面。

Windows 上常驻允许的应用保存在 `$CODEX_HOME/config.toml` 里。官方示例：

```toml
[computer_use.windows]
always_allowed_app_ids = ["mspaint.exe"]
```

要撤销某个已保存的决定，到 **Settings > Computer Use > Always allow** 里移除对应应用。

## 五、应用批准：每次都要点确认？

系统权限和 ChatGPT 里的应用批准是两件事。任务中 ChatGPT 在使用一个应用之前会征求你的许可，你可以选 **Always allow**，以后这个应用就不用再问。可以在设置的 Computer Use 部分把应用从常驻允许列表里移除。官方建议：只对你信任 ChatGPT 自动使用的应用选 **Always allow**；涉及账号、安全、隐私、网络、付款或凭据的设置，要自己在场；任务一旦开始操作错误的窗口就取消。官方还明确说：它不能自动化终端应用或 ChatGPT 本身，也不能以管理员身份认证或批准电脑上的安全与隐私权限提示。

## 常见问题

**Q：Computer Use 要付费吗？**
官方 Pricing 页的功能可用性表里，各套餐都是「受限」，限制主要是地区。套餐本身的区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)；想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：图形界面任务不稳，选什么模型？**
官方 Computer Use 文档建议：依赖截图或视觉判断的难任务，在模型选择器里有 GPT-6 Astra 时选它，插件设置、系统权限和应用访问控制仍然适用。模型可用性见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

**Q：用它会不会泄露屏幕内容？**
官方说：ChatGPT 能看到屏幕内容、截图，并和窗口、菜单、键盘输入、剪贴板状态交互，应把可见的应用内容、网页、截图和打开的文件都视为任务运行时可能被处理的上下文，ChatGPT 的数据控制设置适用于这些内容，包括 Computer Use 截的图。敏感应用不需要时先关掉。

**Q：它改了文件，审查面板里没显示？**
官方说：通过桌面应用做的更改，要保存到磁盘并被项目跟踪后才可能出现在审查面板里。

## 参考资料

- Codex 官方文档：Computer Use — https://learn.chatgpt.com/docs/computer-use
- Codex 官方文档：Pricing（Feature availability）— https://learn.chatgpt.com/docs/pricing
- Codex 官方文档：Settings — https://learn.chatgpt.com/docs/reference/settings
- Codex 官方文档：Remote connections — https://learn.chatgpt.com/docs/remote-connections
