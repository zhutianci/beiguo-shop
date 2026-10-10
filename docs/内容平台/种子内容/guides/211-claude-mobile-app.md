---
title: Claude 手机版怎么下载、怎么用：iOS / Android 功能说明
slug: claude-mobile-app
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 官方手机 App 叫什么、支持哪些系统版本、为什么商店里搜不到，以及语音、听写、小组件、快捷指令、调用手机应用等功能怎么用。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/9266462-install-claude-for-ios
  - https://support.claude.com/en/articles/9612887-install-claude-for-android
  - https://support.claude.com/en/articles/11825384-how-to-update-claude-for-ios
  - https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile
  - https://support.claude.com/en/articles/11101966-use-voice-mode
  - https://support.claude.com/en/articles/10263469-use-claude-app-intents-shortcuts-and-widgets-on-ios
  - https://support.claude.com/en/articles/10302511-access-claude-for-ios-on-your-lock-screen-control-center-and-action-button
  - https://support.claude.com/en/articles/10534883-use-the-claude-widget-on-android
  - https://support.claude.com/en/articles/11869619-use-claude-with-ios-apps
  - https://support.claude.com/en/articles/11869629-use-claude-with-android-apps
  - https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
  - https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
  - https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
  - https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
  - https://support.claude.com/en/articles/14898120-open-the-claude-mobile-app-with-a-link
  - https://www.anthropic.com/supported-countries
verify:
  - 手机 App 的界面语言怎么设置，官方帮助中心只写了网页版和桌面版（且 11 种界面语言里没有中文），手机端官方未说明，站长用真机确认
  - 听写（Dictation）官方列出的 12 种语言里没有中文；语音模式只写「支持更多语言，非英语为 beta」，没有列出具体语言，中文是否可用请站长真机确认
---

> 本文根据 Anthropic 官方帮助中心关于 Claude iOS / Android App 的系列文章整理，核对日期 2026-10-07。截图引用自官方帮助中心，图下注明出处。

## 适用于谁

- 搜「claude 手机版下载」「claude app 怎么用」的人；
- 想在手机上用语音和 Claude 聊、拍照问问题、把 Claude 放到锁屏或小组件上的人；
- 想知道手机版和网页版、桌面版有什么区别的人。

## 结论先说

1. **官方 App 名叫「Claude by Anthropic」**，iOS 在 App Store、Android 在 Google Play 搜这个名字下载；企业用 Microsoft Intune 管理设备的，另有一个「Claude for Intune」。
2. **系统要求**：iOS / iPadOS 18.0 及以上；Android 8.0 及以上。
3. **商店里搜不到，官方给出的原因只有三种**：所在地区不受支持、设备不受支持、系统版本太低。Claude 只在 Anthropic 支持的国家和地区提供，中国大陆目前不在列表中（https://www.anthropic.com/supported-countries ），请遵守所在地法律和服务条款。
4. **Free 就能用**：聊天、语音模式、听写、小组件、调用手机自带应用都对所有套餐开放；健康数据功能限 Pro / Max 且仅限美国。
5. **账号和数据是通的**：网页版、桌面版连好的连接器，下次在手机上登录就能用；在电脑上开始的任务也能在手机上查看和接着指挥。

## 步骤

### 1. 下载安装

**iPhone / iPad**：打开 App Store，搜索「Claude by Anthropic」，点「获取」。如果公司没有要求你用「Claude for Intune」，装标准版即可。

**Android**：打开 Google Play，搜索「Claude by Anthropic」，点「安装」。

装好后用你的 Claude 账号登录。

**更新（iOS）**：打开 App Store → 点右上角头像 → 往下翻到待更新列表 → 点 Claude 旁边的「更新」。如果手机上没看到新功能，先检查是不是没更新。

**卸载不等于退订**：删除 App 不会自动取消付费订阅，要按官方说明单独取消。

### 2. 用嘴代替打字：听写

听写对所有套餐开放，把你说的话转成文字再发出去，Claude 用文字回答：

1. 新建对话，点输入框右侧的**麦克风**图标；
2. 第一次使用要选语言（之后可以在设置里改）；
3. 说完点箭头发送，点「X」取消。

改听写语言：点右上角你的头像缩写 → **Speech Input Language**。官方列出的听写语言有英语、法语、德语、印地语、意大利语、日语、韩语、葡萄牙语、俄语、西班牙语、土耳其语、乌克兰语，**没有中文**，非英语为 beta。官方说明：语音转成文字后录音会被删除，不保留、不用于训练。

### 3. 和 Claude 语音对话：语音模式

点输入框里麦克风旁边的**声波图标**进入语音模式，选一个声音就可以开始说话。官方说语音模式在网页和桌面也能用，但「在手机上体验最好」。免提和按住说话两种方式、换声音、换语速、常见问题，详见本站《Claude 语音模式怎么用：语音对话、语音输入与常见问题》。

### 4. 放到桌面、锁屏和快捷指令（iOS 18+）

- **小组件**：长按主屏幕空白处 → 左上角「编辑」→「添加小组件」→ 搜 Claude → 添加。小组件有三个按钮：新对话、直接进入听写、拍照发给 Claude。
- **锁屏 / 控制中心 / 操作按钮**：在锁屏自定义、控制中心「添加控制」、或「设置 → 操作按钮 → 控制」里选择「Open Claude」，就能一键打开 App。
- **拍照分析控件**：在控制中心或锁屏添加「Analyze Photo with Claude」，不解锁、不打开 App 就能拍照发给 Claude。
- **「Ask Claude」意图**：在 Spotlight 搜索里输入「Ask Claude」、对 Siri 说「Ask Claude」、或在分享菜单里把选中的文字发给 Claude。
- **快捷指令**：在「快捷指令」App 里新建，依次加「共享」动作和「Ask Claude」动作，提示词写「请总结以下文字：[快捷指令输入]」，命名为「用 Claude 总结」并加到共享菜单。以后在任何地方选中文字 → 分享 → 选它，就能直接得到摘要。

以上方式发起的对话都会计入你的用量；Ask Claude 和快捷指令使用你在 App 里默认选择的模型。

**Android 小组件**（Android 8.0+）：长按主屏幕空白处 → 「小组件」→ 找到 Claude → 拖到想放的位置，可以拉伸调整大小。同样有新对话、拍照、听写三个按钮。

### 5. 让 Claude 调用手机自带应用

所有套餐都能用。对话中 Claude 判断需要时，会弹出一张卡片让你确认：

| 能做的事 | iOS | Android |
| --- | --- | --- |
| 起草短信 / 聊天消息（系统短信或第三方聊天应用），点卡片打开应用再自己发送 | ✅ | ✅ |
| 起草邮件，在邮件应用里预填主题和正文 | ✅ | ✅ |
| 根据位置推荐附近的地方、在地图上显示并导航 | ✅ | ✅ |
| 查看日历空闲时间、创建日程 | ✅ | ✅ |
| 提醒事项（只能往已有列表里加条目） | ✅ | — |
| 设闹钟、计时器 | — | ✅ |
| 读取健康数据并画图（beta，限 Pro / Max、仅限美国；Android 需 14+ 和 Health Connect） | ✅ | ✅ |

限制：Team / Enterprise 成员暂时不能用位置工具；Claude 不能直接访问通讯录；健康数据只读不写。第一次用到某项权限时，App 会弹窗说明用途，可以选「Allow once」「Always allow」或「Don't allow」，之后在手机系统设置里随时修改（Android：设置 → 应用 → Claude → 权限）。

![Android 版 Claude 请求使用日历工具时的确认弹窗：可以选择仅允许一次、总是允许或不允许](seed:g211-android.png)
*图片来源：[Claude 帮助中心《Use Claude with Android apps》](https://support.claude.com/en/articles/11869629-use-claude-with-android-apps)*

### 6. 连接器、任务和 Claude Code

- **连接器**：在网页版或桌面版连好的服务（如 Google Drive、Gmail），下次在手机上登录就能用，在对话里点 **+ → Connectors** 打开。手机上新增连接器目前是 beta，官方建议仍以网页版和桌面版为主。详见本站《Claude Connectors（连接器）怎么用：连接 Google Drive、Gmail 等与推荐》。
- **在电脑上开始的任务**：官方说明，在新版 Claude 里，你在电脑前开始的任务也会出现在手机 App 上，可以查看进度、回答 Claude 的问题、调整方向；也可以从手机发起任务，在云端继续运行。
- **Claude Code**：账号有 Claude Code 权限的，手机 App 里有 Code 标签，可以查看和发起云端会话，详见本站《Claude Code 网页版（claude.ai/code）怎么用：在云端跑任务》。

## 常见问题

**Q：App Store / Google Play 里搜不到 Claude？**
官方给出的原因：所在地区不受支持、设备不受支持、系统版本过低（iOS 需 18.0+，Android 需 8.0+）。地区以官方支持列表为准，本站不提供任何绕过办法。

**Q：手机 App 能改成中文界面吗？**
官方帮助中心的界面语言说明只覆盖网页版和桌面版，而且列出的 11 种语言里没有中文。界面语言不影响对话：用中文提问，Claude 就用中文回答。

**Q：手机上能用 Artifacts、做文档和幻灯片吗？**
可以在对话里要求生成，在 Artifacts 标签里查看；但从模板开始、编辑、修改分享设置要用网页版或桌面版，详见本站《Claude Artifacts 是什么、怎么用：创建、分享与导出（2026 新版）》。

**Q：小组件、Siri 发起的对话算用量吗？**
算。官方明确通过小组件、Ask Claude 意图发起的对话都计入用量。用量规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

**Q：听写和语音模式有什么区别？**
听写只是把语音转成文字发出去，Claude 用文字回答；语音模式是完整的语音对话，Claude 会用声音回答，还能在对话中使用你连接的工具。

## 参考资料

- Install Claude for iOS（官方）：https://support.claude.com/en/articles/9266462-install-claude-for-ios
- Install Claude for Android（官方）：https://support.claude.com/en/articles/9612887-install-claude-for-android
- How to update Claude for iOS（官方）：https://support.claude.com/en/articles/11825384-how-to-update-claude-for-ios
- Use dictation on Claude Mobile（官方）：https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile
- Use voice mode（官方）：https://support.claude.com/en/articles/11101966-use-voice-mode
- Use Claude App Intents, Shortcuts, and Widgets on iOS（官方）：https://support.claude.com/en/articles/10263469-use-claude-app-intents-shortcuts-and-widgets-on-ios
- Access Claude for iOS on your Lock Screen, Control Center, and Action button（官方）：https://support.claude.com/en/articles/10302511-access-claude-for-ios-on-your-lock-screen-control-center-and-action-button
- Use the Claude widget on Android（官方）：https://support.claude.com/en/articles/10534883-use-the-claude-widget-on-android
- Use Claude with iOS apps（官方）：https://support.claude.com/en/articles/11869619-use-claude-with-ios-apps
- Use Claude with Android apps（官方）：https://support.claude.com/en/articles/11869629-use-claude-with-android-apps
- Use connectors to extend Claude's capabilities（官方）：https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
- Claude Cowork and chat are one Claude（官方）：https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
- What are artifacts and how do I use them?（官方）：https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- Open the Claude mobile app with a link（官方）：https://support.claude.com/en/articles/14898120-open-the-claude-mobile-app-with-a-link
- Anthropic 支持的国家和地区（官方）：https://www.anthropic.com/supported-countries
