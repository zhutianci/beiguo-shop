---
title: ChatGPT 视频通话和共享屏幕怎么用：为什么没有摄像头按钮、Live 和 Advanced 有什么区别
slug: chatgpt-voice-video-screen-share
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 能视频通话、分享画面吗？按 OpenAI 帮助中心：只有手机 App 里的 Advanced 语音支持摄像头和共享屏幕，新的 Live 不支持。本文讲清开启步骤、看不到按钮怎么排查、视频片段保存多久，以及能不能在网页和电脑上用。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001274-chatgpt-voice
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 官方没有列出 Advanced 视频和屏幕共享的具体套餐与次数上限，文中只写官方明确的「符合条件的订阅用户」；本站另一篇语音文章提到的价格页信息以 chatgpt.com/pricing 为准
  - 官方文章只写了 iOS 和安卓 App 里的 Advanced 支持视频与屏幕共享，没有写网页和桌面端
  - 设置里中文界面的名称以实际显示为准
---

> 本文根据 OpenAI 帮助中心《ChatGPT Voice》和 ChatGPT 发布说明整理，资料核对于 2026-10-14。官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 视频通话」「ChatGPT 视频对话」「ChatGPT 分享画面」，想让 ChatGPT「看」着摄像头或手机屏幕聊天的人；
- 在语音界面里找不到摄像头按钮、不知道是不是账号有问题的人；
- 担心视频片段被保存、想知道怎么删的人。

语音模式的整体用法见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)，这篇只讲视频和共享屏幕。

## 结论先说

1. **新的 Live 语音不支持视频和屏幕共享**。官方在语音文章里写了两次。Live 的特点是能边听边说，能搜索、用记忆、显示可视化结果、收发文字和图片。
2. **视频和屏幕共享在 Advanced 里**：官方说 Advanced 是「之前的实时语音体验」，当你需要支持的手机功能（比如视频或屏幕共享）时用它。**只在 iOS 和安卓 App 里**，面向符合条件的订阅用户。
3. **步骤**：设置 → Voice → 选 Advanced；开始语音对话后，点**相机按钮**共享摄像头；点**更多选项菜单 → Share Screen** 共享屏幕。
4. **看不到按钮，先查是不是 Live 模式**，然后看你是不是在手机 App 里。选项还取决于套餐、工作区设置、地区、App 版本和家长控制。
5. **视频片段会保存 30 天**，和文字记录一起；删掉聊天后相关音频和视频片段也会在 30 天内删除（安全、法律原因等例外）。

## 步骤

### 1. 先切到 Advanced

打开手机 App 的 **Settings → Voice**，在 **Live、Advanced、Standard** 里选 **Advanced**。官方说你看到哪些选项，取决于套餐、工作区设置、地区、App 版本和家长控制。

### 2. 开始语音对话，再开摄像头或共享屏幕

![在手机上共享摄像头或屏幕的 5 步](seed:g824-share-steps.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Voice](https://help.openai.com/en/articles/20001274-chatgpt-voice) 整理的示意图*

- **开始语音**：点消息栏里的 **Voice** 图标；如果弹出权限请求，允许 App 使用麦克风；第一次使用要选一个喜欢的声音。
- **共享摄像头**：在语音对话里点**相机按钮**；再点一次就停止共享。
- **共享屏幕**：点更多选项菜单，选 **Share Screen**，按手机系统的提示操作。
- **停止共享屏幕**：回到 ChatGPT，再点一次屏幕共享控件；也可以用手机系统自带的屏幕共享控制来停止。

官方还说明：如果用到了视频或屏幕共享的上限，你**仍可以继续语音对话**，只是不能再开新的视频或屏幕共享输入。

适合让它「看」的场景举例（本站的用法建议，不是官方列表）：

```
我把摄像头对着路由器背后的接口，请你告诉我这几个口分别是干什么的，哪个插网线。
```

```
我正在共享手机屏幕。请一步步带我找到「清理缓存」的选项，每一步只说一句，等我操作完再说下一步。
```

## 看不到按钮，按这个顺序查

![看不到摄像头或共享屏幕按钮时的 5 种情况与处理](seed:g824-missing-button.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Voice](https://help.openai.com/en/articles/20001274-chatgpt-voice) 整理的示意图*

补充官方的几条：

- **Live 里想发图**：Live 可以在同一个聊天里收文字和图片，语音进行时点消息栏里的添加按钮就能附上图片，也可以直接打字，不会另开对话；图片的类型和限制取决于套餐和账号。
- **Live 不能从文件库里取文件**，但可能可以手动附上受支持的文件。
- 官方在发布说明里说明：GPT-Live-1 不支持视频或屏幕共享，符合条件的订阅用户可以继续用 Advanced 语音。
- **桌面 App 里的语音**是另一回事：用来给 Work 和 Codex 下任务、检查进度，不是视频通话，见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)。

## 隐私：视频会被怎么处理

- Live 和 Advanced 语音对话里的音频片段、Advanced 里的视频片段，会和对话文字记录一起存储，**保留 30 天**；
- 删除聊天后，相关音频和视频片段也会在 **30 天内**删除，除非因为安全、安保或法律原因需要保留，或你此前选择分享了片段且已与账号分离；**删除不能撤销**；只是归档不会删除片段；
- 默认不用你的音频或视频来训练模型，除非你主动在 **Settings → Data Controls** 里打开「Improve the model for everyone」，再打开 **Include your video recordings** 之类的开关；官方说 Business、Enterprise、Edu 工作区的用户不能分享这类片段；
- 删除聊天的方法见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)。

## 常见问题

**Q：网页版和电脑上能视频通话吗？**
官方文章只写了 iOS 和安卓 App 里的 Advanced 支持摄像头和屏幕共享，没有写网页和桌面端。

**Q：Free 能用视频吗？**
官方文章写的是「符合条件的订阅用户」，没有写 Free。具体以你账号里能不能看到按钮为准，套餐对比见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)，开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：我想要上传一段视频文件让它看，可以吗？**
共享摄像头不等于上传视频文件，上传视频的情况见 [/guides/chatgpt-video-generate-upload](/guides/chatgpt-video-generate-upload)。

**Q：Advanced 的字幕怎么开？**
官方说，在 iOS 和安卓的 Advanced 里，语音对话中点 **cc** 按钮可以显示 ChatGPT 回答的字幕；Live 则会在说话的同时把回答显示成文字。

**Q：语音对话为什么自己结束了？**
官方说可能是达到使用上限、达到最长会话时长，或长对话达到了上下文上限。可以改用文字继续，或重新开始语音。

## 参考资料

- OpenAI 帮助中心：ChatGPT Voice — https://help.openai.com/en/articles/20001274-chatgpt-voice
- OpenAI 帮助中心：ChatGPT release notes（GPT-Live-1） — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
