---
title: Gemini 记忆功能怎么用：开启与关闭、删除记忆、自定义指令与「个人智能」
slug: gemini-memory-personal-intelligence
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini 的个性化由三部分组成：对过往对话的记忆、你写给 Gemini 的固定指令、以及连接 Google 应用后的「个人智能（Personal Intelligence）」。本文讲各自的开启条件、开关位置、怎么让它记住或忘掉某件事、怎么对单个对话关闭个性化。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16598623
  - https://support.google.com/gemini/answer/16598469
  - https://support.google.com/gemini/answer/16598625
  - https://support.google.com/gemini/answer/16598406
  - https://support.google.com/gemini/answer/16836988
  - https://support.google.com/gemini/answer/13666746
verify:
  - 「让 Gemini 记住特定事实」目前标注为仅美国、需要 Google AI 方案；「给 Gemini 的指令」所有用户可用
  - Personal Intelligence 标注为逐步推出，且不在欧洲经济区、尼日利亚、瑞士、英国提供；Google 相册、钱包、通讯录的连接另有地区和订阅限制
  - 中文界面里「Personal Intelligence」「Instructions for Gemini」的译名以实际界面为准
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。个性化功能都只对**个人 Google 账号**开放（工作、学校、受监管账号不可用），而且官方注明是逐步推出，你的账号可能暂时没有其中某一项。

## 适用于谁

- 搜「gemini 记忆功能」「gemini 记忆设定」「gemini 关闭记忆」「gemini 记忆删除」「gemini 个人智能功能」的人；
- 发现 Gemini 提到了你以前聊过的事，想知道它到底记了什么的人；
- 想让 Gemini 每次都按固定格式或语气回答的人。

## 结论先说

1. **Gemini 的个性化有三个来源**：过往对话的记忆（Memory）、你写的固定指令（Instructions for Gemini）、连接 Google 应用后的个人智能（Personal Intelligence）。
2. **统一入口**：网页版「设置与帮助 → Personal Intelligence」，里面有 Memory 开关、指令管理和关联应用。
3. **记忆依赖「保留活动记录」**：关掉活动记录，记忆和个人智能都不可用。
4. **删除记忆 = 删除对话**：想让 Gemini 忘掉某件事，要把提到这件事的对话从活动记录里删掉；如果信息来自关联的应用，还要同时断开那个应用。
5. **临时不想被个性化**：在输入框的「工具」里对当前对话关掉 Personal Intelligence，或直接用「临时对话」。

## 一、三种个性化分别是什么

| 类型 | 做什么 | 主要条件 |
| --- | --- | --- |
| 过往对话记忆（Memory） | Gemini 从你以前的对话里了解你，在新对话里用上 | 满 18 岁、个人账号、活动记录开启 |
| 让 Gemini 记住特定事实 | 你主动说「记住……」，它跨对话保存 | 目前仅美国、需要 Google AI 方案、Memory 开启 |
| 给 Gemini 的指令（Instructions） | 对每个对话都生效的固定要求，如格式、语气 | 所有用户都可以添加 |
| 个人智能（Personal Intelligence） | 连接 Gmail、相册、搜索记录、YouTube 等，让回答结合你的个人信息 | 满 18 岁、个人账号、活动记录开启；部分地区不提供 |

这些功能目前可以在 Gemini 手机 App、网页版、Chrome 中的 Gemini（已开放的国家）和智能手表上的 Gemini 里使用；在 Gems、Live 语音对话等功能里不生效。

## 二、过往对话记忆：开关和查看

**开关**：gemini.google.com 底部「设置与帮助（Settings & help）」→「Personal Intelligence」→ 打开或关闭「Memory」。

打开后，Gemini 除了在回答里参考以前的对话，还可能主动建议：比如为你正在做的项目提示下一步、帮你规划提到过的旅行、对比你讨论过的产品。

**直接问它过去聊过什么**（需满 18 岁、个人账号、活动记录和 Memory 都开着）：新开一个对话，按主题或时间问，例如——

- 「总结一下我们关于太阳系的讨论」
- 「上次给我儿子同学挑生日礼物，最后定的是什么？」

**怎么知道它用了以前的对话**：回答下方的「来源和相关内容」里会出现「Previous chats（以前的对话）」；也可以直接问「你用了以前对话里的信息吗？」。官方提醒这个标记偶尔会出错。

## 三、让 Gemini 记住或改正某件事

（官方标注：这项能力目前仅在美国提供，且需要 Google AI 方案。）

在对话里用自然语言说就行：

- 「记住我是素食者。」
- 「记住 Ella 的生日是 11 月 3 日。」
- 「记一下：我的年度评审在 3 月 15 日。」

记错了或信息过时了，也是直接在对话里纠正：「其实我女儿 8 岁，不是 7 岁。」「我改成晚上锻炼了，更新一下。」前提是 Memory 处于开启状态。官方也承认，Gemini 不一定每次都改得对。

## 四、给 Gemini 写固定指令

所有用户都能用，适合规定回答的格式和风格。

1. 「设置与帮助 → Personal Intelligence → Instructions for Gemini（给 Gemini 的指令）」；
2. 点「添加（Add +）」；
3. 写下想让 Gemini 在每个对话里都遵守的要求；
4. 点「提交」。

官方示例：

- 「每个回答先给一段简短总结。」
- 「以后长段落都改用要点列表。」
- 「以后推荐电影时都附上烂番茄评分。」

同一个页面里可以对每条指令点「更多 → 编辑 / 删除」，顶部还有一个总开关，可以一键停用全部指令而不删除它们。

**注意**：官方明确说，「让 Gemini 忘记或避开某个话题」这类指令不一定管用；要确保它不再提某件事，应当把相关对话从活动记录里删掉。

## 五、个人智能：连接 Google 应用

个人智能是在记忆之上，再把你在其他 Google 应用里的数据接进来。目前支持的应用：

- **Google Workspace**：Gmail、日历、云端硬盘等里的内容；
- **搜索服务**：在搜索、地图、购物等服务里保存的数据（需开启「网络与应用活动记录」）；
- **YouTube**：观看和搜索历史（需开启 YouTube 历史记录）；
- **Google 相册**：仅部分国家和地区，且要先在相册里开启「人脸分组」并选出哪张脸是自己、开启「估算缺失的位置信息」；
- **Google 钱包**：仅美国；
- **通讯录**：帮助中心另一页注明仅美国、英语，且需要 AI Ultra 订阅。

**开启**：符合条件时，Gemini 里会出现一张邀请卡片，点「开始使用（Get started）」，然后选「全部连接」「选择应用」或「不连接」。之后随时可以在「设置与帮助 → Personal Intelligence → Connected Apps」里逐个开关。

连接后它能做的事，官方举例：回答「我上个月搜过什么」、找出上次旅行的照片、结合你在 Gmail 里讨论的生日聚会建议用 Canvas 设计邀请函。数据如何被使用（包括训练和人工审核）见本站《Gemini 关联应用怎么设置》第七节。

## 六、临时关掉个性化

**只对当前对话关闭**（官方注明逐步推出）：

1. 在输入框点「工具（Tools）」；
2. 关闭「Personal Intelligence」。

关闭后，这个对话不会再用过往对话记忆、你的指令和关联应用信息来个性化；这个设置会被这条对话记住，下次回来还是关的；新开的对话默认仍是开启。如果某条回答已经带了个性化，可以点「不使用个性化重试（Try without personalization）」重新生成。

**注意**：这样做并不阻止这条对话被存进活动记录、以后被其他对话引用。想完全不留痕，用「临时对话」，见本站《Gemini 临时对话怎么用》。

## 七、让 Gemini 忘掉某件事

| 信息来源 | 怎么删 |
| --- | --- |
| 以前聊天时说过 | 到「Gemini 应用活动记录」或「最近对话」里，把所有提到这件事的对话删掉；删除后可能有短暂延迟才生效 |
| 来自关联的应用（如某封邮件） | **两步都要做**：删掉提到它的对话，并断开那个应用。只断开应用，旧对话里的信息还可能被用；只删对话，Gemini 还能从应用里再找到 |
| 自己写的指令 | 在「Instructions for Gemini」里删除 |
| 一劳永逸 | 关闭 Memory；或关闭「保留活动记录」（记忆和个人智能随之不可用） |

另外，你在 Gmail、相册等应用里删除或修改了数据，Gemini 那边可能要过几天才会反映出来。

## 常见问题

**Q：Gemini 记忆「错乱」、记错了怎么办？**
先确认 Memory 是开着的，然后在对话里直接纠正它。还不对的话，把含有错误信息的旧对话删掉。

**Q：关闭 Memory 会删除以前的对话吗？**
帮助中心把 Memory 描述为「是否使用过往对话来个性化」的开关，没有说关闭会删除对话；对话本身在活动记录里单独管理。

**Q：能把 ChatGPT 的记忆搬到 Gemini 吗？**
可以，官方有「导入记忆」功能，见本站《ChatGPT 记忆和聊天记录怎么导入 Gemini》。

**Q：工作账号为什么没有这些选项？**
帮助中心写明，个性化功能在工作、学校和受监管的 Google 账号上不可用。

## 参考资料

- Get personalization in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/16598623
- Get personalization with memory of your past Gemini chats：https://support.google.com/gemini/answer/16598469
- Manage what Gemini remembers about you and customize responses：https://support.google.com/gemini/answer/16598625
- Connect your Google apps to personalize your Gemini experience：https://support.google.com/gemini/answer/16598406
- About personalization with Connected Apps：https://support.google.com/gemini/answer/16836988
- Find & manage your recent chats in Gemini Apps：https://support.google.com/gemini/answer/13666746
