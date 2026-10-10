---
title: NotebookLM 怎么用：改名 Gemini Notebook 后的入口、三栏界面与基本流程
slug: notebooklm-gemini-notebook-getting-started
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM 是什么、怎么用？2026 年 7 月它已改名 Gemini Notebook。本文按官方帮助中心讲清改名后哪些变了、使用条件、「来源 → 对话 → Studio」三步流程，以及回答不出来时的官方原因。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16164461?hl=en
  - https://support.google.com/notebooklm/answer/16206563?hl=en
  - https://support.google.com/notebooklm/answer/16179559?hl=en
  - https://support.google.com/notebooklm/answer/16261963?hl=en
  - https://support.google.com/notebooklm/answer/16225229?hl=en
  - https://support.google.com/notebooklm/answer/17003757?hl=en
  - https://support.google.com/notebooklm/answer/17513891?hl=en
  - https://support.google.com/notebooklm/answer/17004255?hl=en
  - https://support.google.com/notebooklm/answer/16269187?hl=en
  - https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/
  - https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html
  - https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
verify:
  - 入口网址：帮助中心步骤写的是 notebook.google.com，官方只说旧链接会自动跳转，没有列出旧域名的保留期限，以实际访问为准
  - 改名是分批推送的（官方说「未来几周」），中文帮助中心标题在核对日仍显示「NotebookLM帮助」，界面里看到的名称可能因账号而异
  - 对话里「联网搜索、运行代码、生成 Word / Excel / PPT 文件」等新能力，官方博客写的是先向 Google AI Ultra 和部分 Workspace 账号开放、之后扩展到 Pro，免费账号是否可用官方帮助未写明
  - 可访问性问题：帮助中心 FAQ 写「查看 Gemini 应用支持的 180 多个地区」，而产品介绍页另有一份 Gemini Notebook 自己的国家和地区列表，两处表述不同
  - 配图为 2026 年 3 月官方动图截帧，当时界面左上角仍是 NotebookLM 标志
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心、Google 官方博客和 Google Workspace Updates 整理，核对日期 2026-10-10。产品正在改名并持续更新，界面文字以你实际看到的为准。

## 适用于谁

- 搜「notebooklm 怎么用」「notebooklm 是什么」「gemini notebook 是什么」，想快速弄懂它能做什么的人；
- 看到「NotebookLM 改名了」的说法，不确定旧笔记本、旧链接还能不能用的人；
- 已经打开过产品，但没搞清左、中、右三栏分别干什么的人。

## 结论先说

1. **NotebookLM 已改名 Gemini Notebook**：Google 在 2026 年 7 月 16 日宣布改名，官方强调它仍是同一个独立产品，原有笔记本不用迁移，旧的分享链接会自动跳转。
2. **它是「只读你给的资料」的研究助手**：你上传或添加资料（官方叫「来源」），它基于这些来源回答，并在回答里标出引用，点一下就能跳到原文。
3. **基本流程三步**：添加来源 → 在「对话」里提问 → 在「Studio」里一键生成音频概览、视频概览、思维导图、报告、抽认卡、演示文稿等。
4. **免费就能用**：用个人 Google 账号登录即可，免费账号有笔记本数、来源数和用量限额，详见本站《NotebookLM 免费版限制有哪些》。
5. **它会出错**：官方多处提醒回答和生成内容可能不准确，不能当作医疗、法律、财务等专业意见。

## 一、改名这件事：到底变了什么

按 Google 官方博客和 Workspace Updates（均为 2026-07-16）：

- **名字和标志变了**：NotebookLM 改叫 Gemini Notebook，新名称和新标志会在各个界面分批出现，官方说需要「几周」；手机用户可能要更新 App 才能看到。
- **产品没变**：官方原话是它「仍然是独立产品」，定位还是研究工具，只是会更多地和 Gemini 应用、Google 搜索打通。
- **旧内容不受影响**：官方说明会自动重定向，已有的共享笔记本和链接继续有效，管理员和用户都不需要做任何操作。
- **来历**：它最早是 2023 年 Google I/O 上亮相的 Project Tailwind。

所以搜索时两个名字指的是同一个东西。帮助中心现在叫「Gemini Notebook Help」，本文下面统一写 Gemini Notebook，必要时括注旧名。

## 二、使用条件

帮助中心列出的要求：

- 一个**个人 Google 账号**，或单位 / 学校的 Google 账号（后者需要管理员开启）；
- 已登录；年龄达到所在国家或地区规定的可同意年龄，并在 Google 账号里**完成年龄验证**。未满 18 岁的用户会受到更严格的内容政策约束，部分功能只对 18 岁以上开放；
- 所在国家或地区在官方支持列表里。网页版的列表很长，包含美国、日本、新加坡、台湾等；**核对日列表中没有中国大陆、香港和澳门**。手机 App 的支持地区另有一份列表。请遵守所在地法律和服务条款。

界面语言方面，官方说目前支持 80 多种语言，其中包括简体中文和繁体中文。

## 三、三栏界面：来源、对话、Studio

![2026 年 3 月官方动图截帧：左栏「Sources（来源）」、中间「Chat（对话）」、右栏「Studio」，右栏上方是音频概览、演示文稿、视频概览、思维导图、报告、抽认卡、测验、信息图、数据表格等入口（早期界面，标志仍为 NotebookLM）](seed:g430-notebook-three-panels.jpg)
*图片来源：[Google Workspace Updates《New ways to customize and interact with your content in NotebookLM》](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html)（已遮去示意图中的用户头像）*

一个**笔记本（notebook）**就是围绕某个项目的一组来源。官方提示：**各个笔记本相互独立**，它不能同时读取多个笔记本里的内容。

| 面板 | 作用 |
| --- | --- |
| 来源（Sources） | 添加、勾选、整理资料。PDF、网页、YouTube、音频、Google 文档等都可以，类型和上限见《NotebookLM 来源上限是多少》 |
| 对话（Chat） | 显示所有来源的自动摘要；在这里提问、下指令 |
| Studio | 把来源变成各种成品：笔记、音频概览、视频概览、思维导图、报告、数据表格、抽认卡、测验、演示文稿、信息图 |

## 四、第一次使用的步骤

1. 打开 notebook.google.com（帮助中心步骤里写的入口），用 Google 账号登录；
2. 点「新建笔记本（Create new notebook）」；
3. 在弹出的窗口里选「上传来源（Upload a source）」，选好文件，或用搜索框让它帮你找资料；
4. 来源处理完后，「对话」面板会出现一段总摘要和几条建议问题，可以直接点，也可以自己问；
5. 需要成品时，到右侧 Studio 点对应的按钮；带铅笔图标的可以先自定义再生成。

两个容易忽略的细节：

- 第一次添加来源时，系统**有时会自动生成**一份报告、抽认卡、信息图、演示文稿、音频概览或视频概览。官方说明这些只生成一次，**不占用你的限额**。
- 生成比较慢的成品可以开通知：右上角「设置（Settings）→ 通知（Notifications）」开启 Web 通知，完成后会有桌面提醒，Studio 里新成品旁边还会出现一个小蓝点。

## 五、对话怎么用更准

- **看引用**：回答里的引用标记，鼠标悬停能看到被引用的原文，点击会跳到来源里对应的位置。这是它和普通聊天机器人最大的区别。
- **限定范围**：在来源面板里只勾选一部分来源，回答就只基于这部分；多个来源时在问题里点名文件，例如「《训练手册》里关于笼内训练的结论是什么」，比「总结一下」更准。
- **调整风格**：对话面板的「配置对话（Configure Chat）」里可以选对话风格——默认（Default）、学习指南（Learning Guide）、自定义（Custom，比如「像博士生一样回答」）——并选择回答长度。
- **保存有用的回答**：点「保存到笔记（Save to note）」，表格和可点击的引用会一起保留。
- **聊天记录**：官方说明对话记录会保留，而且**只有你自己能看到**；想清空就在对话面板的三点菜单里选「删除对话记录（Delete Chat History）」。

帮助中心还介绍了一组「实验性」的新能力：对话可以联网搜索、运行代码，并直接生成图表、PDF、Word、Excel、PowerPoint、CSV 等可下载文件。官方提醒这些功能还在早期，需要你自己复核结果。它目前面向哪些账号开放，见文首的待核对事项。

## 六、它回答不了时的官方原因

帮助中心给了三类原因：

1. **触发安全标记**：来源里有暴力、性等敏感话题的措辞，即使是历史资料也可能触发；
2. **问题不够明确**：来源很多时，它先检索最相关的片段再回答，问题越具体越容易命中；
3. **来源里没有**：它被设计成只依据你提供的来源回答，资料里没写的就不会答。

另外，如果来源内容太短，它会直接参考整篇文档，回答里就不一定出现逐句引用。

## 七、和 Gemini 应用、Google 搜索的关系

- **Gemini 应用里的笔记本**：帮助中心说明，你在 Gemini Notebook 里创建的笔记本会自动出现在 Gemini 的导航栏里，改名、加来源、改自定义指令都会双向同步。区别是：Gemini Notebook 的回答**只依据来源**；在 Gemini 里和笔记本对话，可能还会用到网页搜索等工具。Studio 里的音频概览、视频概览、信息图、演示文稿等**只能在 Gemini Notebook 里生成**。
- **Google 搜索的 AI 模式**：笔记本也会出现在 AI Mode 里，官方写明这项整合不含欧洲经济区，且目前只支持英语。

## 常见问题

**Q：改名后要重新注册或者迁移数据吗？**
不用。官方说明这是同一个产品，旧笔记本和分享链接会自动跳转继续可用。

**Q：怎么让它用中文回答和生成？**
网页版右上角「设置 → 输出语言（Output Language）」里选择语言；默认跟随你 Google 账号的首选语言。官方提示不同功能支持的语言不完全一样，例如电影效果视频概览目前只支持英语。

**Q：深色模式在哪里？**
「设置」里可以在浅色、深色和跟随设备（Device）之间切换，默认跟随设备。

**Q：我上传的资料会被拿去训练模型吗？**
帮助中心的说法是：你的数据不会用于训练，**除非你主动提交反馈**（点赞或点踩）。提交反馈时，相关的提问、上传内容和回答可能被人工审核，并在与账号脱钩后最长保留 3 年。Workspace 和教育版账号即使提交反馈也不会被人工审核或用于训练。

**Q：删掉的笔记能找回吗？**
官方 FAQ 明确写目前无法恢复已删除的笔记。

## 参考资料

- Learn about Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16164461?hl=en
- Create a notebook in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16206563?hl=en
- Use chat in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16179559?hl=en
- Change output language / Change mode（帮助中心）：https://support.google.com/notebooklm/answer/16261963?hl=en 、https://support.google.com/notebooklm/answer/16225229?hl=en
- Notebooks in Gemini Apps（帮助中心）：https://support.google.com/notebooklm/answer/17003757?hl=en
- About notebooks in AI Mode in Google Search（帮助中心）：https://support.google.com/notebooklm/answer/17513891?hl=en
- Privacy and Terms of Use / Frequently asked questions（帮助中心）：https://support.google.com/notebooklm/answer/17004255?hl=en 、https://support.google.com/notebooklm/answer/16269187?hl=en
- Google 官方博客：NotebookLM is now Gemini Notebook（2026-07-16）：https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/
- Google Workspace Updates：NotebookLM is now Gemini Notebook（2026-07-16）：https://workspaceupdates.googleblog.com/2026/07/notebooklm-now-gemini-notebook.html
- Google Workspace Updates：New ways to customize and interact with your content in NotebookLM（2026-03-20，截图来源）：https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
