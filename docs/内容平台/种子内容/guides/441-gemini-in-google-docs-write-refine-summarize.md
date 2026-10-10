---
title: Google 文档 Gemini 怎么用：帮我写、改写润色、总结、生成图片与引用云端硬盘文件
slug: gemini-in-google-docs-write-refine-summarize
products: [gemini]
models: [gemini-llm]
accountTier: PRO
excerpt: Google 文档（Google Docs）里的 Gemini 有三个入口：页面底部的提示栏、选中文字后的「Refine」浮动栏、右上角的 Ask Gemini 侧边栏。本文按官方帮助中心讲清怎么起草整篇文档、改写和总结、用 @ 引用云端硬盘文件、生成图片与朗读音频，以及账号和语言要求。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/docs/answer/14206696
  - https://support.google.com/docs/answer/13447609
  - https://support.google.com/docs/answer/15541879
  - https://support.google.com/docs/answer/15559738
  - https://support.google.com/docs/answer/16386234
  - https://support.google.com/docs/answer/16813283
  - https://support.google.com/docs/answer/17127708
  - https://support.google.com/docs/answer/16880047
  - https://support.google.com/docs/answer/13952129
  - https://support.google.com/docs/answer/14925782
verify:
  - 选中文字后「Refine」里的快捷项，两篇帮助文章列得不完全一样（一篇有 Enhance、Match writing style，另一篇有 Bulletize、Summarize），以实际界面为准
  - 「Match writing style（匹配写作风格）」在「Write & edit」一文中标注为 Workspace Experiments 功能，在「Create personalized documents」一文中未加此限制
  - 侧边栏对话历史：「Collaborate」一文说刷新 / 关闭文档会丢失对话，「conversation history」一文说符合条件的账号可在「History」里找回，两者适用的账号范围不同
  - 界面元素在简体中文界面的确切译名以实际界面为准；本文截图为官方英文演示界面
---

> 本文根据 Google 官方文档编辑器帮助中心（Google Docs Editors Help）整理，核对日期 2026-10-10。功能在逐步推送，你看到的界面可能和下文不完全一致；以下步骤均为电脑网页版。

## 适用于谁

- 搜「google 文档 gemini」「gemini google docs」「google 文档 ai」的人；
- 想在 Google 文档里直接让 AI 起草、改写、总结，而不是在聊天窗口和文档之间来回复制的人；
- 想让 Gemini 参考自己云端硬盘里的资料来写东西的人。

如果你是想把 Gemini 聊天里的内容导出成文档，那是另一条路，见本站《Gemini 聊天记录怎么导出：导出到文档 / 表格、生成 PDF 与用 Takeout 批量导出完整对话》。

## 结论先说

1. **三个入口各有分工**：底部提示栏负责「写和改」，直接在正文里给出可逐条接受的修改建议；选中文字后的 **Refine** 负责一键改写；右上角 **Ask Gemini** 侧边栏负责问答、总结、生成图片和跨应用操作。
2. **改动不会直接生效**：Gemini 的修改以「建议」形式出现在文档里，你可以逐条接受、全部接受或全部拒绝。
3. **想让它写得准，就给它来源**：点「Sources → Add from Drive」或输入 `@` 选文件；可用的来源类型是 Google 文档、表格、幻灯片和 PDF（PDF 要先上传到云端硬盘）。
4. **账号要求**：个人账号需要 Google AI Pro 或 Ultra（方案对比表里文档功能没有列 Plus）；工作账号需要 Business Standard / Plus 或 Enterprise Standard / Plus；个人账号也可以报名 Workspace Experiments 试用。
5. **中文支持分功能**：侧边栏和生成图片的语言列表里有中文；「帮我写（Help me write）」「帮我创建（Help me create）」的语言列表里没有中文。

## 一、谁能用、支持什么语言

| 项目 | 官方说明 |
| --- | --- |
| 年龄 | 须年满 18 岁 |
| 个人账号 | Google AI Pro、Google AI Ultra（文档里的帮我写、写与改、总结、生成图片、音频、个性化文档均如此）；或加入 Workspace Experiments |
| 工作 / 学校账号 | Business Standard、Business Plus、Enterprise Standard、Enterprise Plus（以管理员开通为准） |
| 侧边栏语言 | 29 种，含中文、日语、韩语、英语等 |
| 生成图片语言 | 29 种，含中文 |
| Help me write 语言 | 英、法、德、意、日、葡、西 |
| Help me create 语言 | 英、法、德、意、日、韩、葡、西 |
| 其他未单列的功能 | 仅英语；官方建议把 Google 账号语言设为英语后使用 |

怎么判断自己有没有：打开任意文档，看右上角有没有 Ask Gemini 图标、空白文档底部有没有提示栏。没有的话见本站《Gemini 侧边栏不见了怎么办》。价格和各档区别不在本文范围，见官方订阅页和本站《Gemini 会员有什么区别：免费版、Google AI Plus、Pro、Ultra 功能与额度对比》。

## 二、底部提示栏：起草整篇文档

1. 打开一个文档（空白文档最直观）；
2. 在页面底部的提示栏里描述你要的文档，比如「为社区花园项目写一份立项提案，包含预算和时间表」；
3. （可选）点提示栏上方的**匹配文档格式（Match doc format）**，选一份已有文档，新内容会沿用它的版式和结构；
4. （可选）点**工具（Tools）→ 写作风格（Writing style）→ 从云端硬盘添加文档**，Gemini 会先总结出这份文档的风格（如「正式、客观、直接」），你点确认后套用；
5. （可选）添加参考资料，见第四节；
6. 点提交。完成后可以点「来源（Sources）」查看它参考了什么。

官方给的写提示建议：用自然语言、写完整句子；交代读者、目的和要点；结果不满意就追加要求，多轮迭代。

提示栏默认会自动收起，把鼠标移到底部的 Gemini 图标上就会重新出现。想让它一直开着，可以点提示栏上的**切换到侧边栏（Switch to side panel）**。

![文档底部提示栏的「+」菜单：从云端硬盘添加来源，并选择 Gemini 可以搜索的位置（云端硬盘、Gmail、Chat、网页）](seed:g441-docs-gemini-bar-sources.jpg)
*图片来源：[Google 官方帮助中心《Create personalized documents with Gemini in Google Docs》](https://support.google.com/docs/answer/15541879)（官方动图截帧）*

## 三、改写和润色

**用一句话改**（不需要先选中文字）：在底部提示栏输入要求，Gemini 能理解整篇文档的上下文。官方示例：

| 目的 | 提示 |
| --- | --- |
| 更新进度 | 「根据昨天那封项目邮件，更新文档里的时间表」 |
| 调整结构 | 「把『待办』一节的列表改成三列表格」 |
| 引入资料 | 「用云端硬盘里《年度战略》的信息，加一节第三季度目标」 |
| 改格式 | 「把所有标题改成 Inter 字体、24 号、加粗、藏青色」 |
| 找问题 | 「以资深产品总监的身份，指出这份文档可以改进的地方」 |

**一键改**：选中一段文字 → 点浮动栏上的 **Refine** → 选改写（Rephrase）、缩短（Shorten），或在「更多」里选扩写（Elaborate）、更正式、更口语、改成要点（Bulletize）、总结（Summarize）。

两种方式的结果都以建议的形式出现：点对勾**接受单条**，或者**全部接受（Accept all）/ 全部拒绝（Reject all）**。

## 四、让 Gemini 参考你的文件

- **指定文件**：点提示栏的「Sources → Add from Drive or other location」，或直接输入 `@` 搜索并选中文件，可以选多个。添加后在整段对话里一直有效；
- **可添加的类型**：Google 文档、表格、幻灯片、PDF。PDF 必须先上传到云端硬盘；你对文件要有查看权限，否则会提示「You need access to some files」；
- **搜索范围**：在「Gemini search settings」里分别开关**云端硬盘搜索、Gmail 搜索、Chat 搜索、网页搜索**。想让它用邮件内容写东西，就确认 Gmail 这一项是勾选的；想用网上的信息，就打开网页搜索。

官方提醒了三件事：来源太多或太长会超出模型一次能处理的容量，Gemini 可能只依据其中一部分作答；它列出的来源不一定完整，个别情况下还会编造出处；所以重要内容要回到原文件核对。

## 五、侧边栏：总结、问答和跨应用操作

点右上角 **Ask Gemini**：

- **总结**：打开有内容的文档时，侧边栏会先给一份摘要；也可以问「用 3 个要点总结这份文档」，或先选中一段再让它总结；
- **插入**：回答下方点「插入（Insert）」可放进正文，点「重试（Retry）」换一版；
- **联网**：提示里要写明「用 Google 搜索」，它才会去网上查；
- **跨应用**：可以让它建日历活动（仅主日历）、起草邮件或聊天消息、生成一份 Google 表格，或生成可编辑的 Google 幻灯片；
- **Gems 与 Deep Research**：侧边栏里可以选用 Gem；「Tools → Deep Research」可以结合网页和你的云端硬盘、Gmail 做深入研究。

![文档右侧的 Gemini 侧边栏：对文档提问后给出要点，并在 Sources 下列出引用的文件（官方演示界面）](seed:g441-docs-gemini-side-panel.jpg)
*图片来源：[Google 官方帮助中心《Collaborate with Gemini in Google Docs》](https://support.google.com/docs/answer/14206696)（官方动图截帧，已遮去演示头像）*

关于对话记录：帮助中心提示，刷新浏览器、关闭再打开文档或电脑离线时，侧边栏里没插入的内容会丢，所以有用的结果要及时插入。另一篇文章说明，Google AI Pro / Ultra、Workspace Experiments 账号以及开通 Gemini Beta 的工作账号，可以在侧边栏左上角「更多选项 → History」里找回、重命名、删除历史对话；历史按应用分开，文档里的对话不会出现在 Gmail 里。

## 六、生成图片和朗读音频

**图片**：点「插入 → 图片 → 生成图片（Generate an image）」，在右侧面板输入描述后点「创建」，点选一张即可插入。官方建议写清主体、场景、距离、材质和背景，避免比喻性的说法。选中已有图片点「编辑图片」可以用文字修改。**封面图**只在「无页面（Pageless）」模式下可用：点「插入 → 封面图片 → 生成图片」，或在正文里输入 `@cover image`。官方注明，生成的图片仅供在 Google 文档内使用。

**音频**：文档里有内容时，点「工具 → 音频 → Listen to this tab」朗读当前标签页，或选「Listen to document summary」听摘要；还可以用「插入 → 音频按钮」在文档里放一个播放按钮。播放器里能调语速、换声音（官方列了 Narrator、Educator、Teacher 等 7 种）。

## 常见问题

**Q：Google 文档里的 Gemini 能用中文吗？**
官方语言表里，侧边栏和生成图片支持中文；帮我写、帮我创建的支持语言不含中文。表里没单独列出的功能只支持英语。

**Q：免费账号能用吗？**
方案对比表里，文档的 Gemini 功能列在 Google AI Pro 和 Ultra 下。个人账号另一个途径是报名 Workspace Experiments（受信任测试者计划，功能和质量可能变化，不对 Workspace 账号开放）。

**Q：我的文档内容会被拿去训练模型吗？**
Workspace 的隐私说明写明：使用 Google AI 方案时，文档等应用里的 Gemini 用你的内容来回答你，不会用它训练或改进 Gemini 及其他生成式 AI 模型。参加 Workspace Experiments 的账号适用另一份隐私声明，官方提醒不要在提示里放个人、机密或敏感信息。

**Q：能直接生成 PPT 吗？**
可以在侧边栏让它生成幻灯片，细节见本站《Nano Banana 怎么做 PPT：Google 幻灯片、NotebookLM 与 Gemini 三种官方方法》。

## 参考资料

- Collaborate with Gemini in Google Docs：https://support.google.com/docs/answer/14206696
- Write & edit with Gemini in Docs：https://support.google.com/docs/answer/13447609
- Create personalized documents with Gemini in Google Docs：https://support.google.com/docs/answer/15541879
- Learn how to generate an image with Gemini in Google Docs：https://support.google.com/docs/answer/15559738
- Generate audio with Gemini in Google Docs：https://support.google.com/docs/answer/16386234
- Learn how to use sources with Google Workspace with Gemini：https://support.google.com/docs/answer/16813283
- Use Deep Research in Gemini in Workspace apps：https://support.google.com/docs/answer/17127708
- Find & manage your Gemini in Workspace conversation history：https://support.google.com/docs/answer/16880047
- Get started with Google Workspace with Gemini：https://support.google.com/docs/answer/13952129
- Supported languages for Google Workspace with Gemini：https://support.google.com/docs/answer/14925782
