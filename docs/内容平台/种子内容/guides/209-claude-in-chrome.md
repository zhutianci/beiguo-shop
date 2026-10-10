---
title: Claude in Chrome 扩展怎么用：安装、权限与安全提示
slug: claude-in-chrome
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude in Chrome 是什么、哪些套餐能用、怎么安装和连接桌面版，三种权限模式怎么选，以及官方的安全提醒和常见问题。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome
  - https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide
  - https://support.claude.com/en/articles/12902428-use-claude-in-chrome-safely
  - https://support.claude.com/en/articles/12902405-claude-in-chrome-troubleshooting
  - https://code.claude.com/docs/en/chrome
  - https://claude.com/pricing
verify:
  - 支持哪些浏览器两处说法不同：帮助中心写「不支持其他基于 Chromium 的浏览器和移动设备」；Claude Code 文档写 Claude Code 的 Chrome 集成可用于 Google Chrome、Microsoft Edge，并能在 Brave、Arc、Vivaldi、Opera 中识别扩展。本文按场景分别写出
  - Pro 套餐的「Cowork 侧边栏」仍在逐步推送中，站长核对时界面可能是新版也可能是经典版
  - 中文界面里「Manually approve / Automatically approve / Skip all approvals」等选项的中文名，以实际界面为准
---

> 本文根据 Anthropic 官方帮助中心的 Claude in Chrome 系列文章和 Claude Code 官方文档《Use Claude Code with Chrome》整理，核对日期 2026-10-07。截图引用自官方帮助中心，图下注明出处。

## 适用于谁

- 搜「claude in chrome 是什么」「claude chrome 扩展怎么用」的人；
- 想让 Claude 在浏览器里帮你点、填、读网页，或者在侧边栏里边看网页边问的人；
- 用 Claude Code 写前端、想让它自己打开浏览器测试和看控制台报错的开发者。

## 结论先说

1. **Claude in Chrome 是一个浏览器扩展**：Claude 能读网页、点击、输入、跳转、填表，可以从 Chrome 侧边栏发起任务，也可以从 Cowork 或 Claude Code 发起。
2. **只有付费套餐能用**（Pro、Max、Team、Enterprise），定价页里 Free 一栏是「No」。在 Cowork 和 Claude Code 里正式可用，Chrome 侧边栏目前是 beta。
3. **只支持电脑上的 Google Chrome**：帮助中心写明不支持其他 Chromium 浏览器和手机（Claude Code 的集成例外，见下文）。
4. **有三种权限模式**：手动确认、自动确认（带安全检查）、跳过所有确认；新版侧边栏默认是「自动确认」。
5. **最大的风险是提示词注入**：网页里藏的指令可能诱导 Claude 做你没让它做的事。官方建议敏感网站别用，最好单独开一个浏览器用户资料。

## 步骤

### 1. 安装扩展

1. 打开 Google Chrome；
2. 去 Chrome 网上应用店搜索 Claude in Chrome，点 **Add to Chrome（添加至 Chrome）**；
3. 按提示用你的 Claude 账号登录；
4. 点工具栏的拼图图标，再点「Claude」旁边的图钉，把扩展固定到工具栏；
5. 按提示授予所需权限。

之后点工具栏上的 Claude 图标，就会在网页右侧打开一个常驻的侧边栏。

**它要哪些权限、为什么**（官方逐项说明，挑重点）：

| 权限 | 用途 |
| --- | --- |
| sidePanel | 在浏览器侧边显示 Claude 面板 |
| scripting | 读取网页上的文字 |
| debugger | 真正控制浏览器：点按钮、输入文字、截图 |
| tabs / tabGroups | 打开、关闭、切换标签页，并把 Claude 用的标签页放进单独的彩色分组 |
| alarms | 按你设定的时间运行定时任务 |
| notifications | 任务完成或需要你操作时发通知 |
| downloads | 在自动化流程里下载文件 |
| webNavigation | 检测到你在高风险网站时介入 |

### 2. 在侧边栏里用

侧边栏里 Claude 能看到当前网页并直接操作，适合：

- 总结或对比你打开的几个标签页；
- 把网页上的信息摘到笔记、文档或表单里；
- 在某个网站上一步步完成任务，你在旁边看着。

在 Max、Team（Pro 正在逐步推送，Enterprise 需管理员开启）上，侧边栏是以 **Cowork 会话**运行的：对话会保存到历史记录里，可以在网页版、桌面版、手机 App 上接着做；你的技能、插件、连接器在这里也能用。想换回旧界面：侧边栏右上角三个点 → **Switch back to classic**。录制工作流功能只在经典版侧边栏里有。

其他常用能力：

- **快捷指令（Shortcuts）**：把好用的提示词存成快捷指令，在对话里输入 `/` 调用；
- **定时任务**：点侧边栏右上角的时钟图标，让快捷指令按天、周、月、年自动运行；
- **多标签页**：把标签页拖进 Claude 的标签组，它能同时查看和操作组里所有页面；
- **后台运行**：切到别的标签页 Claude 也会继续干（Chrome 要开着），打开通知可以在它需要确认或完成时提醒你。

### 3. 连接到 Claude 桌面版

想在桌面版的对话或 Cowork 里让 Claude 操作浏览器：

1. 桌面版左下角点你的头像缩写 → **Settings**；
2. 进入 **Connectors**，在列表里找到 Claude in Chrome，点 **Configure**；
3. 打开开关；如果还没装扩展，按提示下载安装。

完成后，Claude in Chrome 会出现在对话的 **Connectors** 下拉菜单里，**默认关闭**，需要在每个对话里手动打开。

![Claude 桌面版「设置 → Connectors」里的 claude-in-chrome 页面：打开 Enabled 开关，网站级权限沿用 Chrome 扩展里的设置](seed:g209-chrome-start.png)
*图片来源：[Claude 帮助中心《Get started with Claude in Chrome》](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome)*

补充：Cowork 现在也内置了一个浏览器，不用装任何东西。如果你已经在用 Claude in Chrome，Cowork 会继续优先用它；可以在 **Settings → Cowork → Preferred browser** 里切换。

### 4. 配合 Claude Code（开发者）

Claude Code 可以借助这个扩展「写完代码 → 打开浏览器测试 → 读控制台报错 → 回来修」：

```bash
claude --chrome
```

首次启动会弹出一次说明，按回车继续，然后直接说任务，例如「打开 localhost:3000，点登录按钮，告诉我控制台有没有报错」。随时输入 `/chrome` 可以查看连接状态、管理权限、重连扩展；在 `/chrome` 里选 **Enabled by default** 就不用每次加参数（官方提醒这会增加上下文占用）。

几点前提：扩展版本 1.0.36 以上；需要直接订阅 Anthropic 的套餐并用 `/login` 登录，用 API Key 登录时 Chrome 集成会保持关闭；不支持 WSL。Claude Code 文档写明，这个集成可用于 Google Chrome 和 Microsoft Edge，也能在 Brave、Arc、Vivaldi、Opera 等 Chromium 浏览器里识别扩展。遇到登录页或验证码，Claude 会暂停，让你自己处理。

## 三种权限模式怎么选

在侧边栏或桌面版的输入框上有一个下拉菜单：

| 模式 | 行为 | 适合 |
| --- | --- | --- |
| Manually approve（手动确认，原「Ask before acting」） | 每个动作前都停下来问你 | 新网站、重要操作 |
| Automatically approve（自动确认） | 连续工作，每个动作先做安全检查，拦下不安全的，必要时停下问你 | 日常任务；新版侧边栏的默认模式 |
| Skip all approvals（跳过所有确认，原「Act without asking」） | 不问你，也没有自动检查 | 只在你完全信任任务涉及的一切时使用 |

注意：自动确认模式因为多了安全检查，**会比其他模式更耗用量**。

经典版侧边栏的手动模式会先给出一份计划，列出要访问的网站和步骤，你点 **Approve plan** 后它才开始，计划外的网站还要再单独确认。

![经典版侧边栏里 Claude 给出的计划：列出允许操作的网站和执行步骤，可以点「Approve plan」批准或「Make changes」修改](seed:g209-chrome-perm1.png)
*图片来源：[Claude 帮助中心《Claude in Chrome permissions guide》](https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide)*

某些网站上 Claude 每个动作都需要你批准，这时会弹出 **New permissions required**：

- **Allow this action**：只允许这一次，最安全；
- **Always allow actions on this site**：以后在这个网站上都不用问，只对完全信任的网站用；
- **Decline**：拒绝。

![「New permissions required」提示：Claude 想打开某个网址，可以选择只允许这一次、拒绝，或总是允许在该网站上操作](seed:g209-chrome-perm2.png)
*图片来源：[Claude 帮助中心《Claude in Chrome permissions guide》](https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide)*

管理已授权的网站：点扩展图标 → 侧边栏右上角三个点 → **Extension settings**，在 Permissions 页面查看「Your approved sites」、撤销授权、看权限历史。

## 官方的安全提醒

**哪些动作无论什么模式都要你明确同意**：修改权限设置、授予授权、在网页里输入可能敏感的信息、下载文件。

**哪些动作 Claude 一律不做**：购买和金融交易、创建账号、处理信用卡或证件信息、从不可信来源下载文件、永久删除（清空回收站、删邮件 / 文件 / 消息）、提供投资建议、执行交易、修改系统文件、执行邮件或网页内容里的指令、绕过验证码。

**默认屏蔽的网站**：成人网站、已知盗版网站；访问金融类网站前会先征求你同意。

**官方建议**：

- 单独建一个浏览器用户资料，不登录银行、医疗、政务等敏感账号；
- Claude 会给它操作的标签页截图，屏幕上看得到的内容都会进入对话，所以别在显示敏感信息的页面打开扩展；
- 先从可信网站、简单任务（查资料、填表）开始；
- 如果 Claude 突然聊起无关话题、访问意料之外的网站、索要敏感信息，立刻停止任务，这可能是提示词注入；
- 涉及钱、以你名义发出的消息、重要文件时，切回手动确认，自己盯着。

官方也明确：Claude 在浏览器里替你做的所有操作，责任在你，包括遵守网站对自动化访问的服务条款。

## 常见问题

**Q：扩展装不上或登录不了？**
先确认账号是有效的付费套餐；Team / Enterprise 要确认管理员已为组织开启扩展；清除 claude.ai 的缓存和 Cookie；退出账号再登录。

**Q：Claude 看不到网页内容？**
刷新页面并确认扩展已启用；检查是否给当前网站授了权；JavaScript 很重的网站要等它完全加载。

**Q：某些网站 Claude 打不开？**
可能是你没授权，也可能该网站属于默认屏蔽类别（帮助中心列出的包括金融服务、银行、投资平台、加密货币交易所、成人内容、盗版内容）；团队版还可能被管理员加了黑名单。

**Q：扩展连不上桌面版或 Claude Code？**
先重启或更新 Chrome 扩展；桌面版 Connectors 设置里的开关点不动，就重启或更新桌面版；Claude Code 连不上就重启或更新 Claude Code。

**Q：为什么用量掉得特别快？**
官方说明浏览器操作比普通对话更耗算力，长时间运行的任务会持续消耗；自动确认模式还会额外跑安全检查。用量规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 参考资料

- Get started with Claude in Chrome（官方）：https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome
- Claude in Chrome permissions guide（官方）：https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide
- Use Claude in Chrome safely（官方）：https://support.claude.com/en/articles/12902428-use-claude-in-chrome-safely
- Claude in Chrome troubleshooting（官方）：https://support.claude.com/en/articles/12902405-claude-in-chrome-troubleshooting
- Use Claude Code with Chrome（官方）：https://code.claude.com/docs/en/chrome
- 套餐对比（官方）：https://claude.com/pricing
