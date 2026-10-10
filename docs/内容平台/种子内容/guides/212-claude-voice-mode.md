---
title: Claude 语音模式怎么用：语音对话、语音输入与常见问题
slug: claude-voice-mode
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 语音模式（Voice mode）在网页、桌面、手机上怎么开，免提和按住说话怎么切，声音和语言怎么改，和语音输入（听写）的区别，以及没反应、断断续续怎么排查。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/11101966-use-voice-mode
  - https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile
  - https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac
  - https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
  - https://support.claude.com/en/articles/10263469-use-claude-app-intents-shortcuts-and-widgets-on-ios
  - https://support.claude.com/en/articles/10065433-install-claude-desktop
  - https://claude.com/pricing
verify:
  - 语音模式支持的语言官方只写「支持更多语言，非英语为 beta」，没有列出清单；中文能否听懂、能否用中文朗读，站长请在「Settings → General → Voice → Language」里实际确认
  - 手机听写官方列出的 12 种语言里没有中文
  - 网上常见的「voice mode disconnected / 连接断开」提示，官方帮助中心没有这个原文，本文只按官方排查步骤写
---

> 本文根据 Anthropic 官方帮助中心《Use voice mode》《Use dictation on Claude Mobile》等文章整理，核对日期 2026-10-07。截图引用自官方帮助中心，图下注明出处。

## 适用于谁

- 搜「claude 语音模式」「claude 语音对话怎么开」的人；
- 想在通勤、做家务时跟 Claude 说话，而不是打字的人；
- 语音模式没反应、老打断你、声音断断续续，想排查的人。

## 结论先说

1. **语音模式（Voice mode）是完整的语音对话**：你说话，Claude 用声音回答。它目前是 beta，**所有套餐（含 Free）**都能用，网页、桌面、iOS / Android 都有，官方说在手机上体验最好。
2. **入口是输入框里的声波图标**（不是麦克风）。麦克风图标是「听写」：只把你的话转成文字发出去，Claude 用文字回答。
3. **两种说话方式**：默认是免提（Claude 自动判断你说完了），环境吵就切成「按住说话」。
4. **语音的语言要单独设**：在「Settings → General → Voice → Language」里改，和界面语言无关。
5. **语音对话照常计入用量**，文字记录会保存在聊天历史里。

## 语音模式和听写的区别

| | 语音模式（Voice mode） | 听写（Dictation） |
| --- | --- | --- |
| 图标 | 声波 | 麦克风 |
| 你怎么输入 | 说话 | 说话 |
| Claude 怎么回答 | 用声音说出来（同时有文字记录） | 文字 |
| 能用连接的工具 | 能（Gmail、Google 日历、Google 文档、Slack 等） | 就是普通文字消息 |
| 在哪能用 | 网页、桌面、手机 | 手机 App；Mac 桌面版通过快速唤起的语音快捷键 |

## 步骤

### 1. 在网页版和桌面版开启

1. 登录 Claude，新建一个对话；
2. 点对话框右下角的**声波图标**（鼠标悬停会显示「Use voice mode」）；
3. 开始说话，你的话会自动出现在输入框里，说完后 Claude 会接着回答；
4. 想退出时，点右下角的「Stop」按钮。

![网页版输入框右下角的声波图标，悬停显示「Use voice mode」，左边是模型选择器](seed:g212-voice1.png)
*图片来源：[Claude 帮助中心《Use voice mode》](https://support.claude.com/en/articles/11101966-use-voice-mode)*

### 2. 在手机 App 里开启

1. 打开 Claude App；
2. 点输入框里**麦克风旁边的声波图标**；
3. 第一次会让你选一个声音；
4. 开始说话。

![手机 App 输入框：右侧麦克风是听写，最右边的声波按钮进入语音模式](seed:g212-voice3.png)
*图片来源：[Claude 帮助中心《Use voice mode》](https://support.claude.com/en/articles/11101966-use-voice-mode)*

### 3. 免提模式 vs 按住说话

- **免提模式（默认）**：Claude 一直在听，根据你说话的自然停顿判断你说完了没有，不用刻意放慢语速。如果它插话了，你直接接着说，它会停下来听。适合安静的环境。
- **按住说话（Push-to-talk）**：说话时按住按钮，说完松开。在街上、人多的房间、旁边有人聊天时更可靠。

### 4. 换声音、换语速

- **网页版 / 桌面版**：「Settings → General」，往下找到 Voice settings，点每个选项会试听，再点一次停止。
- **手机**：在语音模式里点左下角的设置按钮，选声音（Voice）和语速（Pace，分 Slow / Normal / Fast）。

![手机语音模式的设置面板：上方选择声音，下方选择慢 / 正常 / 快三档语速](seed:g212-voice4.png)
*图片来源：[Claude 帮助中心《Use voice mode》](https://support.claude.com/en/articles/11101966-use-voice-mode)*

官方说明，可选声音是一组预设的、数量有限的声音，用来防止声音克隆和冒充特定的人。

### 5. 设置语音的语言

「Settings → General → Voice → Language」选择语言。注意：

- 改 App 的**界面语言不会**改变语音语言，要在这里单独设；
- 语音对话中也可以直接让 Claude 换语言；
- 官方说语音模式「支持更多语言」，非英语为 beta，但没有公布具体清单。中文效果请以你实际设置里能选到的为准。

### 6. 选模型

语音模式可以用和文字聊天相同的模型（按你的套餐）。进入语音模式时会沿用你上次文字聊天用的模型系列（Sonnet、Opus、Haiku 等），并自动用该系列的最新一代；在语音模式里点模型选择器可以随时切换。官方注明 Claude Fable 目前不支持语音模式。

### 7. 文字、语音随时切换，并使用连接的工具

在同一个对话里可以随时在打字和说话之间切换，上下文都保留，比如中途需要输入网址或代码时改成打字。

语音模式里 Claude 也能用你连接的工具：让它读一下今天的邮件、开会前看看日历、总结某个 Slack 讨论串。官方提醒：语音模式下不是所有结果都能显示在屏幕上，同时用多个工具会有短暂延迟；Free 只能连接 1 个工具，付费套餐可以更多。连接器怎么配详见本站《Claude Connectors（连接器）怎么用：连接 Google Drive、Gmail 等与推荐》。

## 语音输入（听写）怎么用

**手机 App**（所有套餐）：新建对话 → 点输入框右侧的麦克风 → 第一次选语言 → 说完点箭头发送（点「X」取消）。改语言：右上角头像缩写 →「Speech Input Language」。官方列出的听写语言为英语、法语、德语、印地语、意大利语、日语、韩语、葡萄牙语、俄语、西班牙语、土耳其语、乌克兰语，**目前没有中文**。语音转成文字后录音会被删除，不用于训练。

**手机小组件**：iOS 和 Android 的 Claude 小组件上都有麦克风按钮，点一下直接进入听写。

**Mac 桌面版**：在「Settings → General（Desktop app 下）」开启语音快捷键后，按一次 Caps Lock 开始说话、再按一次结束，点箭头发送（需 macOS 14+，并授予语音识别权限）。这个功能默认关闭，因为会占用 Caps Lock。Linux 桌面版目前不支持听写。

## 使用技巧（官方建议）

- 尽量在安静的地方用免提；吵就切按住说话；
- 正常语速说话，不用刻意停顿；
- 多个问题拆开一个一个问；
- Claude 方向不对时直接开口打断，它会停下来听。

适合的场景：早上准备出门时让 Claude 帮你过一遍今天的安排；通勤、运动时边聊边学；把想法说出来整理思路；模拟面试或重要谈话；灵感来了随口记下。

## 常见问题

**Q：语音模式没反应、说着说着就不回答了（包括提示连接断开）？**
官方排查：先看是不是用量到上限了；退出语音模式再重新进入；确认网络稳定。

**Q：Claude 听不清、识别错我的话？**
换到安静一点的环境或切成按住说话；检查手机或电脑是否给 Claude 开了麦克风权限；用正常语速清楚地说。

**Q：Claude 的声音断断续续？**
检查网络；关掉占用资源多的其他应用；确认手机电量充足（官方说语音处理比文字更耗电）。

**Q：Claude 老是打断我？**
说话时停顿短一些，或切换成按住说话；背景噪音也可能导致误判，尽量换个安静的地方。

**Q：在 Cowork 或 Claude Code 里能用语音模式吗？**
官方说明：在 Cowork 和 Claude Code 里只能用听写，不能用语音模式；在新版合并后的 Claude 对话里，语音模式在任何对话中都能用，包括 Claude 正在执行任务的对话。

**Q：语音对话会被保存吗？算用量吗？**
会保存文字记录，和文字对话一样出现在聊天历史里；语音对话按你的套餐正常计入用量，详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 参考资料

- Use voice mode（官方）：https://support.claude.com/en/articles/11101966-use-voice-mode
- Use dictation on Claude Mobile（官方）：https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile
- Use quick entry with Claude Desktop on Mac（官方）：https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac
- How to use Claude in your preferred language（官方）：https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
- Use Claude App Intents, Shortcuts, and Widgets on iOS（官方）：https://support.claude.com/en/articles/10263469-use-claude-app-intents-shortcuts-and-widgets-on-ios
- Install Claude Desktop（官方）：https://support.claude.com/en/articles/10065433-install-claude-desktop
- 套餐对比（官方）：https://claude.com/pricing
