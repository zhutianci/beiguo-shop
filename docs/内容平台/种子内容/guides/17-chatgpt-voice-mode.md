---
title: ChatGPT 语音对话怎么用：语音模式开启、不见了的原因与每日上限（2026）
slug: chatgpt-voice-mode
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 语音对话（Voice）2026 年换成了 GPT-Live 驱动的「Live」模式。本文讲清手机和网页怎么开启、各套餐每天能用多久、语音按钮不见了怎么排查，以及语音对话和语音转文字（听写）的区别。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001274-chatgpt-voice
  - https://help.openai.com/en/articles/12168547-voice-dictation-faq
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://openai.com/index/introducing-gpt-live/
  - https://learn.chatgpt.com/docs/features/voice
  - https://learn.chatgpt.com/docs/prompting
  - https://chatgpt.com/features/voice/
  - https://chatgpt.com/pricing
  - https://help.openai.com/en/articles/7947663-chatgpt-supported-countries
verify:
  - Go 套餐的语音额度：Voice 帮助文章写「GPT-Live-1 mini 3 小时」，而 Go 套餐 FAQ 仍写「与 Free 相同」，以 Voice 文章（更新更晚）为准
  - Free 的 Live 额度官方只写「有限、可能变化」，没有具体时长
  - 设置里「语音」「后台对话」「以语音开始」等中文菜单名称以实际界面为准
  - 新版 ChatGPT 桌面 App 的语音（Plus 及以上）是否已对所有地区开放，以 learn.chatgpt.com 为准
---

> 本文根据 OpenAI 帮助中心（ChatGPT Voice、Voice Dictation FAQ、发布说明）、OpenAI《Introducing GPT-Live》公告和 ChatGPT Learn 文档整理，核对日期 2026-10-07；截图引用自 OpenAI 官网、官方公告和帮助中心发布说明并注明出处，均为英文界面。

## 适用于谁

- 想用嘴和 ChatGPT 聊天：练口语、开车时提问、边做饭边问菜谱的人；
- 搜「ChatGPT 语音对话不见了」「语音模式上限」，发现按钮没了、聊到一半被中断的人；
- 分不清「语音对话」和「语音转文字（听写）」的人。

## 结论先说

1. **入口**：手机 App 和网页版输入框右侧的**声波按钮**是语音对话；旁边的**麦克风按钮**是听写（语音转文字），两者不是一回事。
2. **2026 年的变化**：7 月起语音对话改由 **GPT-Live** 驱动（付费用户 GPT-Live-1，Free 用 GPT-Live-1 mini），能边听边说、随时打断，回答会同步显示文字，还能显示天气、地图等卡片。
3. **每日上限**（按滚动 24 小时计算）：Free 有限；Go 3 小时（mini）；Plus 3 小时；Pro 较低档 15 小时、较高档不限。
4. **按钮不见了**，多半和套餐、工作区设置、地区、App 版本或家长控制有关，先更新 App、查 设置 → 语音。

## 步骤

### 1. 开启语音对话

**手机（iOS / Android）**：

1. 点输入框里的**语音（Voice）**图标（声波按钮）；
2. 第一次使用时允许 ChatGPT 访问麦克风，并选择一个声音；
3. 语音打开后直接开口说话。

**网页版**：打开 chatgpt.com，点输入框里的语音图标，按浏览器提示允许麦克风，然后开始说话。

通话中可以点麦克风按钮静音 / 取消静音，点退出按钮结束。结束后，这次对话的文字记录会留在聊天里。

![ChatGPT 输入框：左边「+」，右边依次是麦克风（听写）和蓝色声波按钮（语音对话）](seed:g17-voice-button.png)
*图片来源：[ChatGPT 官网：ChatGPT Voice](https://chatgpt.com/features/voice/)（官网插图）*

### 2. 选择语音模式：Live、Advanced、Standard

在 **设置 → 语音（Voice）** 里可能看到三个选项（是否出现取决于套餐、工作区、地区、App 版本和家长控制）：

| 选项 | 说明 |
| --- | --- |
| **Live** | 由 GPT-Live-1 或 GPT-Live-1 mini 驱动，能同时听和说，可用联网搜索、记忆、可视化卡片、文字和图片，以及账号里可用的插件；**不支持视频和屏幕共享** |
| **Advanced** | 之前的实时语音体验。需要在手机上**共享摄像头画面或屏幕**时用它 |
| **Standard** | 一问一答式：先把你的话转成文字，再生成回答 |

2026 年 9 月起，Live 遇到需要搜索或深入思考的问题时，可以调用 GPT-5.6 或 GPT-6 Astra，模型和推理强度用和文字聊天相同的控件选择；原来单独的「Instant / Medium / High 语音智能档位」已经取消。

![GPT-Live 语音对话中显示的天气卡片，下方是输入框、麦克风和结束按钮（官方示意图）](seed:g17-live-weather.png)
*图片来源：[OpenAI 官方公告《Introducing GPT-Live》](https://openai.com/index/introducing-gpt-live/)*

### 3. 换声音、换语言、调语速

- **换声音**：设置 → 语音 → 声音，共 9 种：Arbor、Breeze、Cove、Ember、Juniper、Maple、Sol、Spruce、Vale。通话中换声音会在同一个聊天里重新开始一通语音。
- **换语言**：设置 → 语音 → 语言，选你最常说的语言（比如中文）能提高识别准确度；通话中也可以直接让它换一种语言回答。
- **语速和风格**：可以说「说慢一点」「简短一些」，但官方说明目前没有精确的播放速度控制；预设的 ChatGPT 个性风格也暂不作用于 Live。

### 4. 边说边发图、打字

Live 通话时可以用输入框的「+」添加图片，或者在说不方便时直接打字，ChatGPT 仍用语音回答。2026 年 8 月起还支持在语音中上传文件、在项目里使用语音。注意：Live 目前不能直接从文件库里找文件，需要手动附加。

### 5. 共享摄像头或屏幕（Advanced）

视频和屏幕共享只在手机 App 的 **Advanced** 模式下提供给符合条件的订阅用户：通话中点摄像头按钮共享画面，或在「更多」菜单里选「共享屏幕」。价格页显示 Free 不含「语音 + 视频」，Go、Plus、Pro 包含。

### 6. 其他实用设置

- **后台对话**：设置 → 语音 → 打开「后台对话」，切到别的 App 或锁屏后还能继续聊（iPhone 可在锁屏和灵动岛显示内容）；
- **以语音开始**：打开后，每次打开 ChatGPT 的新对话会自动进入语音；
- **CarPlay**：支持的 iPhone 可以在车机屏幕上发起语音对话。请只在法律允许、安全的情况下使用。

## 每日上限：各套餐能聊多久

按 OpenAI 帮助中心《ChatGPT Voice》（Chat 模式，滚动 24 小时计算）：

| 套餐 | 语音额度 |
| --- | --- |
| Free | GPT-Live-1 mini，有限次数，可能调整 |
| Go | GPT-Live-1 mini，3 小时 |
| Plus | GPT-Live-1，3 小时 |
| Pro（较低档） | GPT-Live-1，15 小时 |
| Pro（较高档） | GPT-Live-1，不限 |

达到上限时 ChatGPT 会提示。2026 年 9 月 9 日起，Plus 和 Pro 用完额度后**不再自动降级**到 GPT-Live mini。语音对话中途结束，可能是达到了用量上限、单次会话最长时长，或者长对话达到了上下文上限；可以改用文字继续，或稍后再开语音。同一时间只能进行一个语音对话。

需要更多语音时长，可以了解 Plus：[/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 语音按钮不见了怎么办

按官方说明逐项排查：

1. **更新 App**：可用的语音选项和 App 版本有关；
2. **检查 设置 → 语音**：看看 Live / Advanced / Standard 是否可选；
3. **工作区账号**：Business、Enterprise、Edu 等工作区里，语音受管理员设置控制；
4. **青少年账号**：家长可以在家长控制里关闭语音；
5. **麦克风权限**：在手机系统设置或浏览器网站设置里允许 ChatGPT 使用麦克风；
6. **Mac 桌面 App**：旧版 macOS App 的语音已于 2026 年 1 月 15 日停用；现在的新版 ChatGPT 桌面 App（macOS / Windows）重新提供语音，面向 Plus、Pro、Business、Edu、Enterprise，入口是「开始新语音聊天」，主要用于在 Chat、Work、Codex 里边说边安排任务；
7. **地区**：GPT-Live 在「受支持的地区」推出。地区相关的限制请以官方《ChatGPT 支持的国家和地区》页面为准：https://help.openai.com/en/articles/7947663-chatgpt-supported-countries 。

另外，通话经常被打断或它抢话，官方建议戴耳机、换安静的环境、调高音量；iPhone 可在控制中心的「麦克风模式」里打开「语音突显」。想自己慢慢说完，可以开头告诉它「等我说『请回答』再回应」。

## 语音对话 vs 语音转文字（听写）

| | 语音对话（Voice） | 听写（Dictation） |
| --- | --- | --- |
| 入口 | 声波按钮 | 麦克风按钮 |
| 用途 | 实时来回对话 | 把一段话转成文字，改好再发送 |
| 结果 | 语音回答 + 文字记录（记录不保证逐字准确） | 可编辑的文字消息 |

如果你要的是「ChatGPT 语音转文字」——比如口述一大段需求再修改——用听写更合适。2026 年 6 月，OpenAI 为所有套餐更换了新的语音识别模型，官方称中文等语言的识别准确度有提升，在嘈杂环境和中英混说时也更稳。新版桌面 App 里，在输入框可见时按 **Ctrl+Shift+D** 即可开始听写。

![听写录音条：上方实时显示识别出的文字，中间是声波，右侧是录音时长（2025 年 2 月的界面，以实际为准）](seed:g17-dictation-preview.png)
*图片来源：[OpenAI 帮助中心：ChatGPT Release Notes（2025-02）](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)*

## 常见问题

**Q：语音对话的录音会保存吗？**
Live 和 Advanced 的音频片段与文字记录一起保存，保留 30 天；删除聊天后，相关音频也会在 30 天内删除（安全、法律原因等例外）。Standard 模式在转写完成后删除音频。

**Q：录音会被拿去训练吗？**
默认不会。只有你在 设置 → 数据控制 里打开「为所有人改进模型」并且再打开「包含你的录音」时才会使用音频；只开前者时，可能使用文字记录，但不用音频本身。

**Q：可以几个人一起和它聊吗？**
官方说明 Live 主要为一对一设计，多人同时说话时它可能误以为在和它说话。

**Q：免费用户能用语音吗？**
能，Free 使用 GPT-Live-1 mini，额度有限，不含视频共享。

## 参考资料

- OpenAI 帮助中心：ChatGPT Voice — https://help.openai.com/en/articles/20001274-chatgpt-voice
- OpenAI 帮助中心：Voice Dictation FAQ — https://help.openai.com/en/articles/12168547-voice-dictation-faq
- ChatGPT Release Notes（2026-07-08 GPT-Live-1、2026-09-09 额度调整、2025-12-11 macOS 语音停用、2026-06 听写模型更新）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI：Introducing GPT-Live — https://openai.com/index/introducing-gpt-live/
- ChatGPT Learn：ChatGPT Voice（桌面 App）— https://learn.chatgpt.com/docs/features/voice
- ChatGPT 套餐对比 — https://chatgpt.com/pricing
- 截图来源：ChatGPT 官网、OpenAI 官方公告、OpenAI 帮助中心发布说明（见各图下方链接）
