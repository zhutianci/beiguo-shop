---
title: ChatGPT 怎么用：新手使用教程，从第一屏的输入框、模型、附件、工具讲起
slug: chatgpt-how-to-use-beginner
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 第一次打开 ChatGPT 不知道从哪下手？本文按官方帮助中心把第一屏讲清楚：不登录能不能用、输入框旁边的附件、模型菜单、工具、麦克风各是什么，免费版能用哪些功能，第一个问题怎么问，以及回答不靠谱时该怎么办。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/9125172-the-chatgpt-home-page
  - https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
  - https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt
  - https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt
  - https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
  - https://help.openai.com/en/articles/12548278-how-to-ask-chatgpt-about-its-features
  - https://help.openai.com/en/articles/6783457-what-is-chatgpt
  - https://help.openai.com/en/articles/12168547-voice-dictation-faq
  - https://help.openai.com/en/articles/20001274-chatgpt-voice
verify:
  - 输入框各按钮的图标样式和排列会随版本变化；文中引用的官方截图是帮助中心仍在使用的 2025 年界面，模型名称已不同
  - GPT-6 正在逐步推出，模型菜单里实际看到的名称以账号为准
  - 免登录使用的可用地区以官方页面为准
---

> 本文根据 OpenAI 帮助中心《The ChatGPT home page》《ChatGPT capabilities overview》《GPT-6 and other models in ChatGPT》等文章整理，资料核对于 2026-10-13。

## 适用于谁

- 刚听说 ChatGPT、第一次打开 chatgpt.com 的人；
- 注册好了账号，但只会在输入框里打字，不知道旁边那几个按钮是干什么的人；
- 想知道免费版够不够用、要不要先登录的人。

注册、登录、订阅遇到问题不在本文范围，登录报错见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

## 结论先说

1. **打开就能问**。官方说明 ChatGPT 免费使用，在 chatgpt.com 的输入框里直接输入问题即可，不创建账号也行；但**不登录不保存聊天记录**，一次也只能有一个对话。
2. **第一屏只需要认识五样东西**：输入框、附件按钮、模型菜单、工具（View all tools）、麦克风和语音。下面有一张对照图。
3. **免费版日常文字聊天不限量**（受防滥用规则约束），但上传文件、生图、语音、数据分析等工具各有各的额度。
4. **提问的三条官方建议**：说清楚说具体、要什么语气直接写、不满意就改提示再问。
5. **回答可能出错**。官方原话是 ChatGPT 偶尔会「编造事实」，重要内容要自己核对。

## 步骤

### 1. 打开 ChatGPT：先不登录也行

在浏览器打开 chatgpt.com，页面中间就是输入框，输入问题发送即可。想重新开始，点 **New Chat（新聊天）**——没登录时，开了新聊天，原来那个就回不去了。

![ChatGPT 不登录和登录后的区别](seed:g800-logged-out.png)
*图：本站根据 [OpenAI 帮助中心：The ChatGPT home page](https://help.openai.com/en/articles/9125172-the-chatgpt-home-page) 与 [Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt) 整理的示意图*

官方列出的登录好处：保存聊天记录、导出数据、分享对话、用自定义指令做个性化。登录后，最近一次对话会出现在页面左侧的侧边栏里。

两点提醒：

- 免登录使用并非所有地区都有，有些地方打开会直接要求登录或注册；ChatGPT 支持的国家和地区以官方列表为准；
- 官方建议**个人使用就用你自己掌控的私人邮箱**注册，不要用公司邮箱——公司邮箱由雇主控制，离职后失去邮箱，也会失去那个账号里的内容。

手机上用官方 App，下载和设置见 [/guides/chatgpt-mobile-app-tips](/guides/chatgpt-mobile-app-tips)；电脑上也有桌面版，见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)。界面是英文的话，先按 [/guides/chatgpt-language-settings](/guides/chatgpt-language-settings) 改成中文。

### 2. 认识第一屏

![ChatGPT 第一屏每个按钮是干什么的](seed:g800-first-screen.png)
*图：本站根据 OpenAI 帮助中心 [ChatGPT capabilities overview](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview)、[Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt)、[Voice Dictation FAQ](https://help.openai.com/en/articles/12168547-voice-dictation-faq) 等文章整理的示意图*

下面这张是官方帮助中心里的输入框截图：左边是附件（回形针）和模型，右边是工具按钮和语音。它是 2025 年的界面，现在的模型名称已经不同，但各部分的位置关系可以参考。

![ChatGPT 输入框：左侧回形针与模型选择，右侧工具按钮（提示 View all tools）和语音按钮（英文界面，2025 年截图）](seed:g800-composer-tools.png)
*图片来源：[OpenAI 帮助中心：Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt)*

### 3. 附件：把文件和图片交给它

点输入框的附件 / 加号按钮，可以上传：

- **文档和文本**：DOCX、PDF、TXT；
- **表格**：XLSX、XLS、CSV、TSV；
- **演示文稿**：PPTX；
- **图片**：照片、截图、图表都可以让它看；
- **音频**：付费套餐才支持上传。

传完之后说清楚要它做什么，比如「总结这份 PDF 的要点」「比较这两份文件」「这张截图里的报错是什么意思」。官方写明的额度：一般每 3 小时最多上传 80 个文件，**Free 用户每天 3 个**，高峰期可能下调。

分场景的用法：读长文档见 [/guides/chatgpt-summarize-pdf](/guides/chatgpt-summarize-pdf)，看图提问见 [/guides/chatgpt-image-recognition](/guides/chatgpt-image-recognition)，分析表格见 [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis)；传过的文件之后都在 [/guides/chatgpt-library-files](/guides/chatgpt-library-files) 讲的文件库里。

### 4. 模型菜单：选「想多久」

现在的模型菜单主要让你选**思考档位**，而不是背一串模型名。

![ChatGPT 思考档位怎么选](seed:g800-thinking-levels.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

新手记住两点就够：

- **日常问题用 Instant**，回答快；
- **难题再往上调**：付费套餐用模型菜单里的 Thinking 滑块选 Medium 或 High；Free 和 Go 没有这些档位，遇到难题可以选 **Think**。

官方特别说明：在 Plus 和 Pro 上，Instant 不会因为问题复杂就自动升档；在提问里写「认真想」「深入思考」也**不会**切换档位，要自己在菜单里选。更细的区别见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)。

### 5. 工具：联网搜索、深度研究、生图……

ChatGPT 除了聊天，还带一组工具。官方能力总览里列出的主要有：

| 工具 | 用来做什么 | 本站教程 |
| --- | --- | --- |
| Search（搜索） | 查最新信息，回答带来源链接 | [/guides/chatgpt-search](/guides/chatgpt-search) |
| Deep research（深度研究） | 多步骤调研，产出带引用的报告 | [/guides/chatgpt-deep-research](/guides/chatgpt-deep-research) |
| 图片生成与编辑 | 用文字生成插图，或用一句话改图 | [/guides/gpt-image-2-how-to](/guides/gpt-image-2-how-to) |
| Data analysis（数据分析） | 运行代码来分析、可视化表格数据 | [/guides/chatgpt-excel-data-analysis](/guides/chatgpt-excel-data-analysis) |
| Voice（语音） | 直接说话对话 | [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode) |
| Memory（记忆） | 记住你的偏好，跨对话使用 | [/guides/chatgpt-memory-full](/guides/chatgpt-memory-full) |
| Projects（项目） | 把同一件事的对话和文件放一起 | [/guides/chatgpt-projects](/guides/chatgpt-projects) |
| Scheduled tasks（定时任务） | 到点自动提醒或执行 | [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks) |

很多时候不用手动选：官方说明，问题需要最新信息时 ChatGPT 可能**自动联网搜索**。想手动指定，就点 **View all tools** 选 **Search**，或者在输入框里输入 `/` 再选。

不确定某个功能自己能不能用？官方的建议是**直接让它做**，而不是问它「你有没有某某权限」——ChatGPT 看不到自己的系统状态，这类自我描述并不可靠。

### 6. 问出第一个问题

![发出第一个问题前对照的 4 点](seed:g800-first-prompt.png)
*图：本站根据 [OpenAI 帮助中心：Prompt engineering best practices for ChatGPT](https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt) 整理的示意图*

对比一下：

- 模糊的问法：「帮我写个自我介绍」；
- 具体的问法：「我是应届毕业生，学的是会计，要面试一家外贸公司的财务助理。帮我写一段 1 分钟的中文自我介绍，语气稳重一点，突出实习里做过的对账工作。」

第二种一次就能用。回答不满意时不用重开，直接接着说「短一点」「换个更口语的说法」「第二点展开讲」。更系统的写法见 [/guides/how-to-write-prompts](/guides/how-to-write-prompts)；想让它每次都按你的习惯回答，设置 [/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)。

## 常见问题

**Q：ChatGPT 免费吗？免费版有什么限制？**
官方说明 ChatGPT 可以免费使用，另有付费订阅。Free 和 Go 的日常文字聊天不限量（受防滥用规则约束），文件上传、生图、语音、数据分析等工具有各自的限制。详细见 [/guides/chatgpt-free-plan-limits](/guides/chatgpt-free-plan-limits)，套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；需要 Plus 可前往 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：它说的都是对的吗？**
不是。官方写明 ChatGPT 偶尔会编造事实（「幻觉」），输出可能不准确。数字、引用、法律和医疗相关内容要自己核对；需要出处时用搜索功能并点开来源。发现回答有误，可以点回答下方的「踩」反馈。

**Q：我的聊天内容会被拿去训练吗？**
官方说明个人版默认可能用对话改进模型，建议不要分享敏感信息；可以在设置里关闭 **Improve the model for everyone**，步骤见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

**Q：ChatGPT 生成的内容我能商用吗？**
官方常见问题的说法是：在遵守内容政策和条款的前提下，你拥有用 ChatGPT 创作的输出，包括转载、销售和商品化的权利，免费版和付费版一样。

**Q：提示「已达上限」怎么办？**
这是某个模型或工具的额度用完了，看提示里的恢复时间，或换一个可用的模型，见 [/guides/chatgpt-too-many-requests-limit](/guides/chatgpt-too-many-requests-limit)。

**Q：回答里出现卡片、图表之类的东西是什么？**
官方称为 Intelligent UI：使用 GPT-6 时，回答可以在需要时组合文字、图形和可交互元素，不需要特别的提示。嫌花哨可以在网页版 **Settings（设置）** 里关掉 **Layout and visuals**，减少视觉元素（官方说明不会完全变回纯文字）。

## 参考资料

- OpenAI 帮助中心：The ChatGPT home page — https://help.openai.com/en/articles/9125172-the-chatgpt-home-page
- OpenAI 帮助中心：ChatGPT capabilities overview — https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI 帮助中心：Uploading files and audio to ChatGPT — https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt
- OpenAI 帮助中心：Searching the web with ChatGPT — https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt
- OpenAI 帮助中心：Prompt engineering best practices for ChatGPT — https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
- OpenAI 帮助中心：How to Ask ChatGPT About Its Features — https://help.openai.com/en/articles/12548278-how-to-ask-chatgpt-about-its-features
- OpenAI 帮助中心：What is ChatGPT? — https://help.openai.com/en/articles/6783457-what-is-chatgpt
- OpenAI 帮助中心：Voice Dictation FAQ — https://help.openai.com/en/articles/12168547-voice-dictation-faq
- OpenAI 帮助中心：ChatGPT Voice — https://help.openai.com/en/articles/20001274-chatgpt-voice
