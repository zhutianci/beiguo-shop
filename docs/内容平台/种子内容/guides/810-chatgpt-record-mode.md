---
title: ChatGPT 录音模式（Record）怎么用：录会议自动出纪要，按钮不见了、没有声音怎么办
slug: chatgpt-record-mode
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的录音功能（Record）可以在 Mac 上边录边转写，结束后自动生成会议纪要。本文按官方帮助中心讲清谁能用、怎么开始和结束、单次能录多久、录音会不会被保存和训练，以及 Record 按钮不见、权限报错、找不到纪要时的处理办法。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/11487532-chatgpt-record
  - https://help.openai.com/en/articles/20001546-the-meetings-plugin-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 官方文章顶部在推荐新版桌面应用里的 Meetings 插件；Record 与 Meetings 今后是否合并，官方未说明
  - 官方截图为 2025 年的界面，Record 按钮的位置和样式以实际应用为准
  - 中文识别效果官方只说「在改进中、可能不稳定」，没有具体数据
---

> 本文根据 OpenAI 帮助中心《ChatGPT Record》《The Meetings plugin in ChatGPT》和 ChatGPT 发布说明整理，资料核对于 2026-10-13；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 用 Mac 开会，想让 ChatGPT 直接听会、会后给纪要的人；
- 搜「ChatGPT 录音功能」「ChatGPT 录音模式」，想知道它在哪、自己的套餐能不能用的人；
- Record 按钮找不到，或者录了没有声音、找不到生成的纪要的人。

如果你手里是**已经录好的音频文件**，想上传转文字，看 [/guides/chatgpt-audio-transcription](/guides/chatgpt-audio-transcription)。

## 结论先说

1. **只有 macOS 桌面应用有**。官方写明：ChatGPT record 目前面向 **Plus、Pro、Business、Enterprise、Edu**，并且只在 macOS 桌面应用里提供。Free 没有，Windows 和手机也没有。
2. **用法**：点聊天底部的 **Record** → 说话 → **Stop** → **Send**，ChatGPT 上传文字稿并生成笔记。
3. **单次最长 4 小时**（240 分钟），超过会自动停止并生成笔记。上线时官方写的是不另外收费，并注明限制和价格可能调整。
4. **音频不留存**：录音只用于转写，转写完自动删除，不用于训练；但**文字稿和生成的笔记**会像普通对话一样保存，个人套餐开着「为所有人改进模型」时可能用于训练。
5. **录别人之前先征得同意**。官方反复提醒：是否合法取决于你和被录的人所在地的法律，责任在使用者自己。

## 步骤

![ChatGPT 录音模式（Record）的 5 步](seed:g810-record-steps.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Record](https://help.openai.com/en/articles/11487532-chatgpt-record) 整理的示意图*

### 1. 开始录音

在 macOS 应用里，点任意聊天底部的 **Record（录制）** 按钮。第一次使用时，系统可能要求你授予**麦克风**和（或）**系统音频**权限——线上会议要录到对方的声音，系统音频权限必须给。

### 2. 正常说话

ChatGPT 会边听边实时转写，窗口上有计时器显示已经录了多久，可以随时暂停和继续。

### 3. 暂停、继续或结束

点 **Stop（停止）** 图标先停下来。停下后有两个选择：

- **Resume（继续）**：在同一次录音里接着录；
- **Send（发送）**：结束录音，把文字稿和摘要上传到 ChatGPT。

![录音窗口：左为录制中的 Stop 按钮，右为停止后的 Resume 与 Send 按钮，下方有「Ask before recording others」提醒（英文界面）](seed:g810-record-controls.png)
*图片来源：[OpenAI 帮助中心：ChatGPT Record](https://help.openai.com/en/articles/11487532-chatgpt-record)（两张官方截图并排放大）*

### 4. 不想要了：取消并删除

随时可以点录音窗口左上角的 **X** 取消。之后会弹出三个选项：

- **Upload（上传）**：把文字稿和摘要上传到 ChatGPT；
- **Delete（删除）**：删除这次录音；
- **Cancel（取消）**：回到录音窗口，可以继续录。

![点 X 之后的提示框：Upload this recording?，三个按钮 Upload、Delete、Cancel（英文界面）](seed:g810-record-upload-delete.png)
*图片来源：[OpenAI 帮助中心：ChatGPT Record](https://help.openai.com/en/articles/11487532-chatgpt-record)*

### 5. 查看和加工笔记

点 Send 之后，ChatGPT 上传文字稿，然后打开生成的笔记。官方说明，视录音的启动方式不同，笔记可能以 **canvas** 的形式出现在聊天里，也可能作为附在这次录音上的笔记。

接下来可以直接检查、修改，或者让 ChatGPT 把它改写成邮件、项目计划，甚至代码脚手架。例如：

```
把这份纪要整理成发给全组的跟进邮件：先列 3 条决定，再按负责人列待办和截止日期。
```

官方提醒 ChatGPT 的转写可能出错，重要信息要对照核实。

## 让 ChatGPT 记得以前的录音

**Reference record history（参考录音历史）** 打开后，ChatGPT 可以在新对话里引用你过去录音生成的笔记和文字稿，比如直接问「周一的路线图会议上我们决定了什么？」

开关在 **Settings（设置）→ Personalization（个性化）** 里的 **Record mode** 分组下：

![设置的 Personalization 页面：Record mode 分组下的 Reference record history 开关（英文界面）](seed:g810-reference-record-history.png)
*图片来源：[OpenAI 帮助中心：ChatGPT Record](https://help.openai.com/en/articles/11487532-chatgpt-record)*

如果删除了包含某份录音 canvas 的对话，ChatGPT 今后就不再使用那份 canvas 和对应文字稿里的信息；官方说明可能要过几天才完全不再被引用。

## 遇到问题怎么办

![录音模式常见问题怎么办](seed:g810-record-troubleshoot.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Record](https://help.openai.com/en/articles/11487532-chatgpt-record) 整理的示意图*

补充两点：

- **权限的具体位置**：系统设置（System Settings）→ 隐私与安全性（Privacy & Security）→ 麦克风（Microphone），打开 ChatGPT；再到 屏幕与系统音频录制（Screen & System Audio Recording），也打开 ChatGPT；
- **日历自动加入**：想让 Record 按日历自动加入会议，要先在 ChatGPT 里连接 Google Calendar，并且会议用的是 **Google Meet** 链接。Zoom、Microsoft Teams、Webex 等其他会议链接，需要你在 macOS 应用里手动开始录。

## 常见问题

**Q：录音会被拿去训练吗？音频存在哪？**
官方说明：录音模式的音频只用于转写，之后删除，不用于训练。但 Free、Plus、Pro 用户如果开着 **Improve the model for everyone（为所有人改进模型）**，录音产生的**文字稿和 canvas** 可能用于训练；可以在设置里关掉，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。Business、Enterprise、Edu 工作区的内容默认不用于训练。

**Q：文字稿和笔记保存多久？**
和你其他对话、canvas 的保留规则一样。删除对话后，其中的 canvas 和文字稿会在 30 天内从系统中移除，法律要求保留的除外。

**Q：能区分不同的说话人吗？**
能。官方说明录音模式可以在文字稿里区分多位说话人；认不出名字时用「Speaker 1」这类通用标签，录完之后可以改名。

**Q：支持中文吗？**
官方的说法是目前英语效果最好，其他语言的准确率在改进但可能不稳定。重要的中文会议建议先试录一小段。

**Q：Record 和 Meetings 插件是什么关系？**
官方 Record 文章的开头就在推荐 **Meetings 插件**：它在新版 ChatGPT 桌面应用里使用，会替你记笔记并保存带待办事项的个性化摘要，目前在 Mac 上以 beta 形式面向 Pro 和 Business 用户，Windows 和 Enterprise 支持即将推出。也就是说，Plus 用户目前用的是 Record；Pro 和 Business 可以试 Meetings。Meetings 的安装和用法见 [/guides/chatgpt-audio-transcription](/guides/chatgpt-audio-transcription)。

**Q：公司工作区里为什么没有 Record？**
Enterprise 和 Edu 工作区默认关闭录音模式，需要工作区所有者在 **Settings → Workspace Controls** 里开启；Business 工作区的所有者也可以在同一处关闭。

**Q：没有 Mac 怎么办？**
可以用手机或其他工具先录好音频，再上传给 ChatGPT 转写和总结（需要付费套餐），见 [/guides/chatgpt-audio-transcription](/guides/chatgpt-audio-transcription)。桌面应用的下载见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)；需要 Plus 可前往 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：ChatGPT Record — https://help.openai.com/en/articles/11487532-chatgpt-record
- OpenAI 帮助中心：The Meetings plugin in ChatGPT — https://help.openai.com/en/articles/20001546-the-meetings-plugin-in-chatgpt
- ChatGPT Release Notes（2025-06 录音模式上线、2025-07-16 面向 Plus 开放）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
