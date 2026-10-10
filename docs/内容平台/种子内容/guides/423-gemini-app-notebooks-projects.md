---
title: Gemini 笔记本怎么用：是什么、有什么用、怎么建项目与学习笔记本，不见了怎么办
slug: gemini-app-notebooks-projects
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini App 侧边栏里的「笔记本（Notebooks）」相当于项目空间：固定一批资料、一套指令和连续的对话，并与 Gemini Notebook（原 NotebookLM）双向同步。本文讲它的用途、创建步骤、学习笔记本、添加来源、管理方法，以及笔记本不见了的官方原因。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16972047
  - https://support.google.com/gemini/answer/13278892
  - https://support.google.com/gemini/answer/13695044
  - https://support.google.com/notebooklm/answer/16164461
  - https://support.google.com/gemini/answer/13594961
verify:
  - 可添加的来源数量：帮助中心写「视 Google AI 方案而定，最多 600 个」，各档具体上限见 Gemini Notebook 的限额页面
  - 功能标注为逐步推出；在欧洲经济区需要手动连接 Gemini Notebook
  - 「Study and learn」「Notebook settings」等按钮的中文名称以实际界面为准
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。本文讲的是 **Gemini App 里的笔记本**；独立的 Gemini Notebook（原 NotebookLM）的音频概览、视频概览、思维导图等功能见本站《NotebookLM 怎么用：改名 Gemini Notebook 后的入口、三栏界面与基本流程》。

## 适用于谁

- 搜「gemini 笔记本怎么用」「gemini 笔记本是什么」「gemini 笔记本有什么用」「gemini 笔记本不见了」的人；
- 一件事要和 Gemini 聊很多轮（备考、求职、做方案），不想每次重新交代背景的人；
- 用过 ChatGPT 或 Claude 的「项目」，想在 Gemini 里找同类功能的人。

## 结论先说

1. **Gemini 笔记本 = 项目空间**：把一个主题的资料（来源）、专属指令和所有相关对话放在一起，Gemini 在这个笔记本里会一直记得这些上下文。
2. **和 Gemini Notebook 是同一批笔记本**：在 Gemini App 里建的笔记本会自动出现在 Gemini Notebook 里，反过来也一样，改动双向同步。
3. **创建入口**：打开侧边栏，在「笔记本（Notebooks）」下点「新建笔记本」。
4. **完整功能需要开启「保留活动记录」**：关闭时仍能和笔记本聊天，但不会自动保存对话、不能用笔记本记忆、不能加云端硬盘文件、不能用学习笔记本。
5. **笔记本「不见了」**常见原因：功能尚未推送到你的账号、没连接 Gemini Notebook、用的入口不支持，或者那是别人**分享**给你的笔记本（分享的笔记本不显示在 Gemini 侧边栏里）。

## 一、它和普通对话有什么不同

| | 普通对话 | 笔记本 |
| --- | --- | --- |
| 资料 | 每次对话单独上传 | 来源固定挂在笔记本上，之后的对话都能用 |
| 指令 | 靠全局的「给 Gemini 的指令」 | 每个笔记本可以写自己的专属指令 |
| 记忆 | 取决于全局记忆设置 | 笔记本内的对话互相可参考（需开启活动记录） |
| 整理 | 散落在最近对话里 | 相关对话集中在一个笔记本下 |

官方举的用途：规划旅行、求职、学一项新技能、写商业计划、备考。

帮助中心还说明，笔记本里的对话可以**联网搜索**，也可以使用 Gemini 的各种工具——这是它和「只根据来源回答」的 Gemini Notebook 的一个区别。

## 二、使用条件

- 已登录 Gemini；
- **Gemini Notebook 已连接到 Gemini App**。在大多数地区是自动连接的；在欧洲经济区需要手动连接；
- 入口：目前仅 Gemini 网页版（gemini.google.com）和手机 App；Mac 版 Gemini 也能使用笔记本；
- 官方注明是逐步推出，可能还没轮到你的账号。

**手动连接的方法**：在对话里让 Gemini 做一件和笔记本有关的事（比如创建笔记本），并在提问里加上 `@Gemini Notebook`；没连接的话会出现连接选项，按提示完成。之后可以随时在「关联应用」设置里断开或重连。

## 三、创建笔记本

1. 点顶部「打开侧边栏」；
2. 在「笔记本（Notebooks）」下点「新建笔记本（New notebook）」；
3. 起一个名字（方便以后查找）；
4. 输入第一条提问，开始这个笔记本；
5. 点「添加来源（Add sources）」，把希望 Gemini 参考的资料加进来。

**支持的来源类型**：

- 设备上的文件：PDF、文档、表格、图片、音频、文本文件、.md 文件等；
- Google 云端硬盘里的文件（需要开启活动记录）；
- 网站 / 网址；
- 粘贴的文字。

两条限制：一个笔记本不能把另一个笔记本当作来源；来源数量上限随 Google AI 方案而定，帮助中心写最多 600 个，各档具体数字见本站《NotebookLM 免费版限制有哪些：笔记本和来源上限、5 小时用量限额与用量查询》。

## 四、让 Gemini 在对话里管理笔记本

连接 Gemini Notebook 后，在任何对话或任务里都可以用自然语言操作笔记本（提问里加 `@Gemini Notebook`）：

- 创建、编辑或删除笔记本；
- 往笔记本里添加、更新或删除来源；
- 列出你的笔记本和其中的来源；
- 回答关于某个笔记本内容的问题。

例如：「@Gemini Notebook 新建一个叫『雅思备考』的笔记本，把我刚上传的两份 PDF 加进去。」

## 五、学习笔记本

学习笔记本（Study notebook）是专为备考和系统学习设计的类型，需要开启活动记录，目前在网页版可用（Mac 版暂不支持）。

**它能做什么**：

- **诊断测验**：先测一轮，找出薄弱点和强项；
- **个性化课程**：根据测验结果和你的学习目标，生成一小节一小节的互动课程；
- **进度跟踪**：完成练习后，课程和建议会自动更新，并记录你的掌握程度；
- 还可以基于课程资料生成学习卡和信息图。

**创建步骤**：

1. 侧边栏「笔记本 → 新建笔记本」；
2. 点「Study and learn（学习）」；
3. 在设置对话里告诉 Gemini 学习目标，例如「帮我准备微积分期中考试」；
4. 补充细节（考试时间、范围、目前水平）；
5. 点「添加文件」，从设备或云端硬盘上传笔记、讲义等学习材料。

课程、对话、测验和上传的资料都保存在这个学习笔记本里。注意：**学习笔记本的目标建好后不能修改**，想换目标要新建一个。

另外还有面向商家的「业务笔记本」，需要把 Google 商家资料连接到 Gemini，这里不展开。

## 六、整理和设置

以下操作都在侧边栏「笔记本 → 所有笔记本（All notebooks）」页面：

| 操作 | 方法（网页版） |
| --- | --- |
| 把已有对话放进笔记本 | 侧边栏里找到那条对话 →「更多 → 添加到笔记本」→ 选笔记本（需开启活动记录） |
| 写专属指令 | 打开笔记本 → 顶部「更多 → 笔记本设置」→ 填写指令（如回答格式、语气）→ 保存 |
| 重命名、换图标 | 「更多 → 重命名」，点当前的表情符号可以更换 |
| 置顶 / 取消置顶 | 「更多 → 置顶」，置顶的笔记本排在列表最上面 |
| 删除 | 「更多 → 删除」 |

**删除要慎重**：帮助中心写明，删除笔记本会同时删除你加进去的所有来源和对话。

Mac 版的做法基本相同，只是改为在笔记本或对话上点右键。

## 七、活动记录关闭时会少什么

「保留活动记录」关闭时，你仍然可以和笔记本聊天，但以下功能不可用：

- **自动保存对话**：新对话不会保存进笔记本；
- **笔记本记忆**：Gemini 回答时无法参考笔记本里过去的对话，即使那些对话是在开启期间保存的；
- **添加已有对话**：不能从侧边栏把对话加进笔记本；
- **Google 云端硬盘**：不能把云端硬盘文件作为来源；
- **学习笔记本和业务笔记本**：不能创建，也打不开已有的。

另外，隐私中心提示：你添加到笔记本的来源文件保存在 Gemini Notebook 中，适用 Gemini Notebook 自己的隐私与使用条款。

## 八、笔记本不见了怎么办

| 情况 | 官方说明 |
| --- | --- |
| 侧边栏里根本没有「笔记本」 | 功能在逐步推出；确认用的是网页版或手机 App；确认 Gemini Notebook 已连接（欧洲经济区需手动连接） |
| 别人分享给我的笔记本找不到 | **分享的笔记本不会列在 Gemini 侧边栏里**。Gemini 可以在回答里给出链接，点击后在 Gemini Notebook 中打开；或者直接去 Gemini Notebook 里找 |
| 学习笔记本打不开 | 检查活动记录是否被关闭 |
| 笔记本里以前的对话没了 | 活动记录关闭期间的对话不会保存；另外检查是否被删除或到期自动删除 |
| 断开了 Gemini Notebook，手机上还显示笔记本 | 把 Gemini 手机 App 更新到最新版 |
| 整个笔记本消失 | 是否在 Gemini 或 Gemini Notebook 任一侧被删除——两边是同步的 |

## 常见问题

**Q：Gemini 笔记本和 NotebookLM 是什么关系？**
是同一批笔记本的两个入口。NotebookLM 已改名 Gemini Notebook；在 Gemini App 里用笔记本，侧重「带资料和记忆的连续对话」，可以联网和用 Gemini 的工具；在 Gemini Notebook 里用，侧重根据来源生成音频概览、视频概览、思维导图等成品。

**Q：Gems、技能和笔记本该用哪个？**
笔记本管「一个项目的资料和对话」；技能管「一类任务的做法」，可以跨对话、跨项目调用；Gems 正在被技能取代。三者可以配合：在某个笔记本里调用你的写作技能。

**Q：免费账号能用吗？**
帮助中心列出的条件里没有订阅要求；来源数量等上限随方案不同。

**Q：对应 ChatGPT、Claude 的什么功能？**
定位接近「项目（Projects）」，可对照本站《ChatGPT 项目（Projects）》和《Claude Projects》相关教程。

## 参考资料

- Organize your projects with notebooks in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/16972047
- Manage & delete your activity in Gemini Apps：https://support.google.com/gemini/answer/13278892
- Use & manage Connected Apps in Gemini：https://support.google.com/gemini/answer/13695044
- Learn about Gemini Notebook（Gemini Notebook 帮助中心）：https://support.google.com/notebooklm/answer/16164461
- Gemini Apps Privacy Hub：https://support.google.com/gemini/answer/13594961
