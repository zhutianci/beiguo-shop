---
title: ChatGPT 自定义指令怎么设置：个性化设置、回答风格与写法示例
slug: chatgpt-custom-instructions
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的自定义指令、个性（Personality）和特征（Characteristics）分别管什么？本文按官方帮助中心讲清网页和手机的设置入口、字数上限、生效范围，并给出几段可直接改用的自定义指令示例。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
  - https://help.openai.com/en/articles/11899719-customizing-your-chatgpt-personality
  - https://help.openai.com/en/articles/20001038-characteristics-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 自定义指令帮助文章里同时出现「设置更新会立即应用到所有聊天（含已有对话）」和「更新只反映在之后的对话里」两种说法；正文按发布说明（2025-11 起立即应用到所有聊天）写，上线前看界面实际表现
  - 「个性化」「自定义指令」「启用自定义」等中文菜单名以实际界面为准
  - 个性预设的中文名称（默认 / 友好 / 高效 / 专业 / 直率 / 古怪 / 愤世嫉俗）为本文意译
---

> 本文根据 OpenAI 帮助中心（Custom Instructions、Personality、Characteristics 三篇文章）和 ChatGPT 发布说明整理，资料核对于 2026-10-07。界面名称以英文原文为准，中文为意译。

## 适用于谁

- 每次开新对话都要重复「用简体中文回答」「我是做电商的」「别写太长」的人；
- 觉得 ChatGPT 回答太啰嗦、太爱用表情、太爱分点，想一次性调好的人；
- 搜「ChatGPT 自定义指令推荐」想找现成写法的人。

## 结论先说

1. **入口**：网页和桌面版在 **Settings（设置）→ Personalization（个性化）**；手机 App 在设置里的 **Personalization / Customize ChatGPT**。要先确认 **Enable customization（启用自定义）** 是打开的。
2. **三层设置各管一件事**：
   - **自定义指令（Custom Instructions）**：写给 ChatGPT 的长期说明——你是谁、希望它怎么回答；
   - **个性（Personality / 基础风格）**：选一个整体语气预设；
   - **特征（Characteristics）**：单独微调温度感、热情程度、标题列表多少、表情多少。
3. **字数上限**：Free 和 Go 最多 1,500 字符；Plus、Pro、Business、Enterprise、Edu 最多 5,000 字符（2026-07-15 起由 1,500 提高）。
4. **生效范围**：按发布说明，2025 年 11 月起在个性化里的改动会立即应用到所有聊天，包括已有对话。所有套餐、网页 / 桌面 / iOS / Android 都能用。

## 步骤

### 1. 打开自定义指令

**网页 / 桌面版**：

1. 点左下角头像，进入 **Settings（设置）**；
2. 选 **Personalization（个性化）**；
3. 确认 **Enable customization** 已打开；
4. 在 **Custom Instructions** 输入框里写你的要求，保存。

**iOS / Android**：在设置里找到 **Customize ChatGPT / Personalization**，同样打开 Enable customization，再填写 Custom Instructions。

想暂时不用时，把 **Enable customization** 关掉即可；需要的话再把输入框里的内容删掉。

### 2. 选一个个性预设

在同一个个性化页面里可以选基础风格。官方帮助中心目前列出的预设有：**Default（默认）、Friendly（友好）、Efficient（高效）、Professional（专业）、Candid（直率）、Quirky（古怪）、Cynical（愤世嫉俗）**。原来的「Nerdy」预设已于 2026 年 3 月下线，选过它的账号会被改回默认。

几个预设的区别可以这样理解（据官方示例概括）：

- **Efficient**：几乎不寒暄，直接给结论，写代码时连开场白都省掉；
- **Professional**：结构清晰、语气克制，适合工作场景；
- **Friendly / Candid**：更像朋友聊天，Candid 说话更直接；
- **Quirky / Cynical**：玩笑和调侃更多，适合闲聊，不太适合正式写作。

个性只改变语气和表达方式，不改变 ChatGPT 能做什么。

### 3. 用「特征」做细调

**Characteristics（特征）** 也在 Personalization 页面。每一项都可以往「更多（+）」或「更少（−）」方向调：

| 特征 | 调多 | 调少 |
| --- | --- | --- |
| Warm（温度感） | 更真诚友善 | 更中性客观，长度不变 |
| Enthusiastic（热情） | 更兴奋、更有好奇心 | 更冷静、更客观 |
| Headers & Lists（标题与列表） | 多用标题、列表、表格 | 多用段落 |
| Emojis（表情） | 稍微多一点表情 | 少用，信息类回答不用 |

官方说明，特征会和你选的个性、自定义指令、已保存的记忆一起起作用。如果你只是嫌「列表太多」「表情太多」，调特征比在自定义指令里写一长串禁令更省事。

### 4. 写好自定义指令

好的自定义指令通常包含三块：**关于我**（身份、行业、水平）、**回答方式**（语言、长度、格式）、**边界**（不确定时怎么做）。下面几段示例可以直接复制后改成你的情况：

**示例一：通用办公**

```
我在一家跨境电商公司做运营，常用中文和英文。
请默认用简体中文回答；先给结论，再给理由，整体控制在 300 字以内，除非我说「详细」。
涉及数据、政策、价格的内容，请注明信息可能过时，并建议我去官方渠道核实。
不确定的时候直接说不确定，不要编造。
```

**示例二：学习英语**

```
我是英语中级学习者，目标是提高商务写作。
我发英文句子时，先给修改后的版本，再用中文列出 1–3 个最重要的错误和原因。
不要一次讲太多语法术语。
```

**示例三：写代码**

```
我主要写 TypeScript 和 Python，代码运行在 Linux 服务器上。
回答代码问题时：先说思路（不超过 3 句），再给完整可运行的代码，最后说明怎么测试。
不要省略代码里的关键部分，不要引入我没提到的第三方库，除非先说明原因。
```

写的时候注意：

- **写具体的偏好，不写空泛的话**。「回答要好」没有用，「先给结论、不超过 300 字」才有用。
- **别塞太多互相冲突的要求**。比如既要「详细」又要「简短」，ChatGPT 只能二选一。
- **长期不变的写进自定义指令，一次性的写在对话里**。临时任务的要求放进当次提问更清楚。
- 更多提问技巧可以看 [/guides/how-to-write-prompts](/guides/how-to-write-prompts)。

### 5. 检查效果

保存后新开一个对话，问一个你常问的问题，看语言、长度、格式是否符合预期。不满意就回去改一两句，再试。

## 常见问题

**Q：自定义指令和记忆有什么区别？**
自定义指令是你主动写下、每次都会参考的固定说明；记忆是 ChatGPT 在聊天中记住的信息，会随使用变化。两者会一起影响回答。记忆的管理方法见 [/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)。

**Q：分享对话链接时，别人能看到我的自定义指令吗？**
不能。官方说明自定义指令不会显示给分享链接的查看者。

**Q：数据导出里包含自定义指令吗？删除账号会怎样？**
导出数据会包含自定义指令。删除 OpenAI 账号后，绑定在账号上的自定义指令会在 30 天内随删除流程一起删除。

**Q：自定义指令会被拿去改进模型吗？**
官方说明，自定义指令的使用信息也会用于改进模型表现；如果不希望内容用于训练，可以在 **设置 → 数据控制** 关闭「为所有人改进模型」。

**Q：用 API 能设置自定义指令吗？**
不能。官方说明不会提供自定义指令的 API，开发者应在 API 请求里用系统消息（system / developer 指令）实现类似效果。

**Q：写了自定义指令，ChatGPT 还是不照做？**
先检查 Enable customization 有没有打开；再看要求是否写得太笼统或互相矛盾；最后看是不是被当前对话里的要求覆盖了——对话里的明确要求通常更优先。

## 参考资料

- OpenAI 帮助中心：ChatGPT Custom Instructions — https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions
- OpenAI 帮助中心：Customizing Your ChatGPT Personality — https://help.openai.com/en/articles/11899719-customizing-your-chatgpt-personality
- OpenAI 帮助中心：Characteristics in ChatGPT — https://help.openai.com/en/articles/20001038-characteristics-in-chatgpt
- ChatGPT Release Notes（2025-11 个性化即时生效、2026-03 Nerdy 下线、2026-07-15 字数上限提高）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
