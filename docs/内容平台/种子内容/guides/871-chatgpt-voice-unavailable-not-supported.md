---
title: ChatGPT 语音功能用不了、提示不受支持怎么办：Live、Advanced、Standard 的区别与官方排查
slug: chatgpt-voice-unavailable-not-supported
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 语音用不了，或想在网页上共享屏幕被告知不支持？按 OpenAI 帮助中心，语音有 Live、Advanced、Standard 三种，可用模式取决于套餐、地区、应用版本等；Live 不支持视频和共享屏幕。本文讲清原因、麦克风和通话中断的处理，以及各套餐用量。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001274-chatgpt-voice
verify:
  - 「语音功能不受支持」这句话在官方帮助中心文章里没有原样出现，本文把它理解为语音不可用或某项语音功能不可用，按官方《ChatGPT Voice》一文给出可能的原因；你看到的具体提示文字以界面为准
  - 官方文章没有单独写 Standard 是否支持视频和共享屏幕，正文只写了「官方写明 Advanced 支持，Live 不支持」
  - Live 的用量数字是 2026-10 查询的官方页面内容，官方说限额可能变化
---

> 本文根据 OpenAI 帮助中心《ChatGPT Voice》整理，资料核对于 2026-10-14。语音相关功能更新较快，请以官方文章和你账号里的界面为准。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 点开 ChatGPT，找不到语音图标，或提示语音功能不受支持、不可用的人；
- 想在电脑网页上开视频、共享屏幕，被告知不支持的人；
- 语音通话说着说着自己结束了的人；
- 想知道 Live、Advanced、Standard 区别的人。

## 结论先说

1. **ChatGPT 语音有三种模式：Live、Advanced、Standard**，在 **Settings（设置）→ Voice（语音）** 里切换。哪些可用，取决于你的**套餐、工作区设置、地区、应用版本和家长控制**。
2. **Live 不支持视频和共享屏幕。** 想用视频或共享屏幕，要在 iOS 或安卓应用里选 **Advanced**，并且需要是符合条件的订阅用户。电脑网页上提示不支持，多半就是这个原因。
3. **没反应、没声音**：官方的步骤里写着，开始语音时如果弹出提示，要允许应用或浏览器使用麦克风；对话中可以点麦克风控制来静音或取消静音。
4. **语音通话会自己结束**，官方给了三个原因：达到使用上限、达到最长通话时长，或者很长的对话达到了上下文上限。可以改用文字继续，或重新开始语音。
5. **同一时间只能有一个语音对话。**
6. 看不到某个模式，先更新应用，再看你的套餐、工作区和地区；家长控制管理的青少年账号，由家长决定能不能用语音。

![ChatGPT 语音 Live、Advanced、Standard 三种模式的区别对照表](seed:g871-voice-modes.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Voice](https://help.openai.com/en/articles/20001274-chatgpt-voice) 整理的示意图*

## 一、三种模式的区别

官方对三种模式的说明：

- **Live**：可以同时听和说，让轮流说话和打断更自然。可以用网页搜索和记忆，可以通过支持的小组件显示视觉结果，在功能可用时也能处理文字和图片，还能用你账号里可用的插件和已连接的应用。**Live 不支持视频或共享屏幕。** Live 由 GPT-Live-1 或 GPT-Live-1 mini 驱动，取决于套餐；
- **Advanced**：此前的实时语音体验。需要受支持的手机功能，比如视频或共享屏幕时，选它；
- **Standard**：逐轮对话式的语音体验，先把你的话转写成文字，再生成回答。

切换：打开 **Settings → Voice**，选 Live、Advanced 或 Standard。

用 Live 时，官方还写了几点：可以在语音中用文字和图片，用加号按钮附上图片，或者直接打字；Live 目前不能从 ChatGPT 的文件库里查找或添加文件；预设的 ChatGPT 个性目前不适用于 Live，但可以在单次语音对话中要求它改语气、语速，不过没有精确的播放速度控制。

## 二、语音用不了，按官方列的原因查

### 1. 看不到语音，或某个模式没有

官方的话：你能看到的选项**可能取决于套餐、工作区设置、地区、应用版本和家长控制**。逐项看：

- 应用是不是最新版；
- 你的套餐、地区在不在支持范围，地区见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)；
- 公司或学校的工作区里，语音要符合工作区设置；
- 青少年的关联账号，家长或监护人可以在家长控制里管理语音权限。

### 2. 点了语音没反应、没声音

官方的开始步骤：

- **手机**：点消息栏里的**语音图标**；弹出提示就允许 ChatGPT 访问麦克风；第一次用还要选一个喜欢的声音；然后开始说话；对话中可以点麦克风控制来静音或取消静音，点退出控制结束；
- **网页**：打开 chatgpt.com，点提示窗口里的**语音图标**；弹出提示就允许浏览器访问麦克风；然后开始说话。

所以第一件事是看麦克风权限有没有允许，以及自己是不是点了静音。浏览器和系统层面的麦克风设置，官方这篇文章没有展开。

### 3. 想共享屏幕或开视频，提示不支持

- **Live 不支持视频和共享屏幕**；
- 官方写明：视频和共享屏幕仍然可以在 iOS 和安卓应用里、选 **Advanced** 时，提供给符合条件的订阅用户。开视频是点语音通话中的相机按钮；共享屏幕是点更多选项菜单，选 **Share Screen**，按手机的提示做；
- 如果达到了视频或共享屏幕的上限，你仍可以继续语音对话，只是不能新开视频或共享屏幕输入。

官方文章没有写网页版 Advanced 的视频和屏幕共享，所以网页上看不到这个功能，不代表你的账号有问题。

![语音用不了或中断时的官方线索对照图](seed:g871-voice-troubleshooting.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Voice](https://help.openai.com/en/articles/20001274-chatgpt-voice) 整理的示意图*

### 4. 通话自己结束了

官方《Why did my Voice conversation end?》的回答：可能是达到了**使用上限**、**最长会话时长**，或者长对话达到了**上下文上限**。ChatGPT 会尽可能显示提示，你可以改用文字继续，或重新开始语音。

后台对话也会结束：你自己结束、强制关闭应用、达到使用上限，或达到最长会话时长。要让语音在切到别的应用或锁屏时继续，在 **Settings → Voice** 打开 **Background conversations**。

### 5. 语音总被打断，或老是接话

官方说：打断仍然可能发生，尤其是有背景噪音、长时间停顿，或别人的声音时。可以试试戴耳机、换安静的地方、调大设备音量。iPhone 上，可以在语音对话中打开控制中心，点 **Mic Mode**，打开 **Voice Isolation**。Live 主要是一对一对话，还没有针对多人说话优化，在几个人互相说话时可能会插话。

想让它等你想完再答，可以在开头说「等我让你回答再回答」之类，官方说长时间停顿、背景人声或其他声音仍然可能让它回答。

## 三、各套餐的 Live 用量

官方说，聊天里的 Live 用量按**滚动 24 小时**计算，达到限额时 ChatGPT 会通知你。2026-10 查询的数字如下，官方说限额可能变化：

| 套餐 | 用量 |
| --- | --- |
| Free | 有限地使用 GPT-Live-1 mini，限额可能变化 |
| Go | 3 小时，GPT-Live-1 mini |
| Plus | 3 小时，GPT-Live-1 |
| Pro 100 | 15 小时，GPT-Live-1 |
| Pro 200 | 不限，GPT-Live-1 |

Business 等工作区套餐另有说明，见官方文章。Work 里的语音遵循你套餐的语音限额和计费，Work 任务本身也像打字时一样计入 Work 用量。额度的一般规则见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

![聊天里 Live 语音按套餐的滚动 24 小时用量对照表](seed:g871-voice-usage-by-plan.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Voice](https://help.openai.com/en/articles/20001274-chatgpt-voice) 整理的示意图*

## 常见问题

**Q：我在手机上能用 Live 看摄像头画面吗？**
官方写明 Live 不支持视频。要用摄像头，选 Advanced，且需符合条件。

**Q：换语音声音怎么换？**
**Settings → Voice → Voice**，官方列了 Arbor、Breeze、Cove、Ember、Juniper、Maple、Sol、Spruce、Vale 等声音；在巴西还可以看到 Viola、Rio。通话中换声音会在同一个聊天里开始一个新的语音通话。

**Q：语音里的转写和我说的不完全一样？**
官方说转写不是逐字记录，说话重叠、有噪音或节奏快时更容易不一致。用 Live 时，回答也会以文字形式显示在聊天里，通话结束后可以在聊天记录里查看。

**Q：语音的录音会保存吗？**
官方说，Live 和 Advanced 对话的音频片段，与聊天记录里的转写一起保存，保留 30 天；删除聊天会在 30 天内一并删除相关片段（出于安全等原因需要保留的除外）。Standard 在转写完成后会删除音频。是否用于训练，取决于你在数据控制里的选择，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

**Q：怎么把语音通话说的话变成可编辑的文字？**
官方建议用 ChatGPT Dictation：录一段话，检查并编辑转写结果，再作为文字发送。

**Q：还是不行？**
联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)；基础用法见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

## 参考资料

- OpenAI 帮助中心：ChatGPT Voice — https://help.openai.com/en/articles/20001274-chatgpt-voice
