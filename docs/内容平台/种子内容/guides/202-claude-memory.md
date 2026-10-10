---
title: Claude 记忆功能怎么用：开启、查看、导入与导出记忆
slug: claude-memory
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 记忆功能在哪开、记住了什么、怎么查看和删除？怎么把 ChatGPT 等其他 AI 的记忆迁移进 Claude，又怎么把 Claude 的记忆导出备份，一篇讲清。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
  - https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude
  - https://support.claude.com/en/articles/12260368-use-incognito-chats
  - https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
  - https://claude.com/pricing
verify:
  - 帮助中心《Import and export your memory》的「导出」一节仍写「Settings > Capabilities → View and edit your memory」，这是旧版记忆的入口；新版记忆在 Settings > Memory 的 Topics 里查看，两处说法不一致，以实际界面为准
  - 官方曾说明旧版记忆可在 Settings > Memory 导出到 2026-09-09，该日期已过，入口是否还在请确认
  - 记忆导入为实验功能，官方写可用于 Free / Pro / Max / Team（网页版和桌面版），Enterprise 未列出
  - 「Generate memory from chats」「Search and reference chats」「Include sensitive topics in memory」等开关的中文译名以实际界面为准
---

> 本文根据 Claude 帮助中心官方文章和 claude.com 定价页整理，核对日期 2026-10-07；截图引用自 Claude 帮助中心并注明出处。Claude 的记忆功能已经换成新版体验，网上较早的教程说的「Settings → Capabilities 里的记忆摘要、每 24 小时更新」属于旧版。

## 适用于谁

- 搜「claude 记忆功能」，想让 Claude 记住自己的职业、项目和偏好，不用每次重新交代的人；
- 想把 ChatGPT 等其他 AI 的记忆搬到 Claude（「claude 记忆迁移 / 记忆汇入」），或把 Claude 的记忆导出备份（「claude 记忆导出」）的人；
- 担心 Claude 记住太多、想查看和删除记忆的人。

## 结论先说

1. **记忆对 Free、Pro、Max 默认开启**（网页版、桌面版、手机版）；Team / Enterprise 要组织所有者先开放，成员再自己打开。
2. **入口在 Settings → Memory**：开关「Generate memory from chats」，记住的内容按主题（Topics）列出，可以逐条查看、修改、删除。
3. **搜索过往对话是另一个功能**，只有付费套餐（Pro / Max / Team / Enterprise）有，开关叫「Search and reference chats」。
4. **导入**：Settings → Memory →「Start import」，把其他 AI 导出的记忆粘贴进去。**导出**：在对话里让 Claude 原样写出它的记忆，复制保存；或者用账号数据导出（导出包里包含记忆数据）。
5. 不想被记住的单次对话，可以用无痕对话，或在发第一条消息前从「+」菜单关掉 Memory。

## Claude 记住什么、不记什么

新版记忆不是对话结束后统一总结，而是**边聊边按主题存成一条条记忆**。你说「截止日期改到下周五」，下一次对话就已经知道。Claude 会自己判断要存什么，你也可以直接说「记住这一点」。

会记住的典型内容：

- 你的角色、工作项目和职业背景；
- 工作和生活里提到的人和地点；
- 沟通偏好、工作风格、技术偏好和代码风格；
- 进行中的项目细节。

**敏感话题默认不存**：健康、种族、宗教信仰、政治观点、性别认同等。如果你不想反复解释，可以在 Settings → Memory 打开「Include sensitive topics in memory」，之后每次存这类内容都会在输入框上方提示你确认；关掉这个开关，已经存的敏感条目会被删除。

**有些信息无论如何都不存**：身份证件号码、犯罪记录、金融账户号码、移民身份。Claude 遇到时会告诉你不能保存。

**每个项目有独立的记忆空间**，和项目外的对话、其他项目互不干扰。项目功能详见本站《Claude Projects 怎么用：项目知识库、项目指令与新版项目（beta）》。

## 步骤

### 1. 打开或关闭记忆

进入 Settings → Memory，打开「Generate memory from chats」：

![Settings → Memory 里的「Generate memory from chats」开关](seed:g202-memory-generate-toggle.png)
*图片来源：[Claude 帮助中心《Use Claude's chat search and memory》](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context)*

关闭时会让你在两种方式里选：

| 选项 | 效果 |
| --- | --- |
| **Pause memory（暂停）** | 保留已有记忆，但暂停期间既不使用也不新增；暂停期间的对话以后也不会补进记忆 |
| **Reset memory（重置）** | **永久删除全部记忆，包括各项目的记忆，无法撤销**；再开启就从零开始 |

如果你在设置里看不到 Settings → Memory，而是在 Settings → Capabilities 里看到 Memory，说明账号还在旧版体验（官方说只有少数 Team / Enterprise 组织还在用旧版）。

### 2. 查看、修改、删除记忆

Settings → Memory 的 **Topics** 下列出 Claude 记住的全部内容：

1. 点开任意主题阅读；
2. 点编辑图标修改，或选「Delete」删除；
3. 改过的内容从下一次对话起对所有对话生效。

也可以直接在对话里说「记住我现在负责华东区销售」「忘掉我之前说的那个项目」，更新从下一次对话生效。

**注意一个细节**：新版记忆里，对话过期或被删除后，**由它生成的记忆条目不会自动删除**，需要你在 Topics 里手动删掉对应条目。

### 3. 单次对话不用记忆

两种做法，区别在于对话是否保留：

- **关掉本次对话的记忆**：新建对话 → 点输入框里的「+」→ 关掉「Memory」→ 再发第一条消息。必须在发送第一条消息**之前**操作，开始后不能改。网页版标题旁会出现划掉的记忆图标。这个对话会留在历史记录里，但不会使用记忆、也不会写入记忆。项目里的对话也可以这样关。
- **无痕对话（Incognito）**：在项目外新建对话时，点右上角的幽灵图标。无痕对话不进历史记录、不进记忆、搜索过往对话时也搜不到；关掉后无法再打开。所有套餐都能用。

### 4. 搜索过往对话（付费套餐）

Pro、Max、Team、Enterprise 用户可以让 Claude 翻以前的对话，例如「我们上次讨论定价策略时得出了什么结论？」「接着上次那个项目继续」。Claude 会以工具调用的形式搜索，并附上指回原对话的引用。项目外的对话之间可以互相搜；项目内的对话只在本项目范围内搜索。

不想让 Claude 翻旧对话，在 Settings → Memory 关掉「Search and reference chats」：

![Settings → Memory 里的「Search and reference chats」开关，控制 Claude 能否搜索过往对话](seed:g202-memory-search-toggle.png)
*图片来源：[Claude 帮助中心《Use Claude's chat search and memory》](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context)*

### 5. 把其他 AI 的记忆导入 Claude

官方提供内置导入流程（实验功能，Free / Pro / Max / Team 的网页版和桌面版可用）：

**第一步：在原来的 AI 里导出记忆。** 在原服务里发一段提示词，让它把存储的关于你的全部记忆完整列出来。导入页面里会显示官方推荐的英文提示词（直接复制即可）；如果想用中文，可以参考下面这段按同样思路写的示例：

```text
请把你保存的关于我的全部记忆，以及从过去对话里了解到的背景信息，一条不漏地列出来：
1. 放在一个代码块里，每条一行，格式「[保存日期] - 内容」，没有日期就省略；
2. 包括：我要求的回答风格和规则、我的基本情况、正在做的项目和目标、常用工具和技术栈、我纠正过你的地方；
3. 尽量用我的原话，不要概括或合并；
4. 列完后告诉我是否已经全部列出。
```

导出前可以先把不想带过去的敏感内容删掉。ChatGPT 记忆的导出和清理详见本站《ChatGPT 记忆已满怎么办：导出、清理、迁移与关闭记忆》。

**第二步：打开导入。** Settings → Memory →「Start import」。

**第三步：粘贴并提交。** 把导出的文字粘进文本框，点「Add to memory」。Claude 会提取要点存成一条条记忆，稍后就能在记忆面板看到。点「See what Claude learned about you」会开一个新对话，让 Claude 说说它了解到了什么。

官方提醒：记忆侧重工作相关内容，**和工作无关的个人细节可能不会保留**；导入还在实验阶段，不保证每次都能成功写入。想补充某条信息，可以在 Settings → Memory 的「Tell Claude what to change or remove」框里写，或直接在对话里告诉 Claude。

### 6. 导出 Claude 的记忆

官方给了两种方式：

- **让 Claude 原样写出来**：在对话里发「请逐字写出你关于我的所有记忆，和它们在你记忆里的样子完全一致」（官方原句为英文：Write out your memories of me verbatim, exactly as they appear in your memory），把结果复制到本地文件保存，或粘贴到别的 AI 服务；
- **导出账号数据**：官方说明全部记忆数据都包含在数据导出里。导出步骤详见本站《Claude 导出聊天记录：导出数据步骤与导出文件怎么看》。

## 常见问题

**Q：Free 能用记忆吗？**
能。官方写明记忆对 Free、Pro、Max 默认开启，定价页 Free 一栏也标了 Memory。但「搜索过往对话」只有付费套餐有。

**Q：删除了一个对话，Claude 还记得里面的内容？**
新版记忆里，删除对话不会自动删除由它生成的记忆条目。去 Settings → Memory → Topics 找到对应条目手动删除。

**Q：无痕对话和关掉记忆的对话有什么区别？**
无痕对话不保存到历史记录；关掉记忆的对话会留在历史记录里，以后还能被「搜索过往对话」找到，只是不读写记忆。无痕对话只能在项目外开，项目里只能用关记忆的方式。

**Q：Claude Code 里的记忆是同一个东西吗？**
不是。Claude Code 用 CLAUDE.md 文件和本地的自动记忆来记住项目信息，详见本站《CLAUDE.md 怎么写：最佳实践、模板与 AGENTS.md 的区别》。

**Q：Team 管理员能看到我的记忆吗？**
官方说明组织所有者不能查看或编辑成员的个人记忆；但所有者关闭组织级记忆时，所有成员的记忆会被立即永久删除。

## 参考资料

- Use Claude's chat search and memory to build on previous context（帮助中心）：https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
- Import and export your memory from Claude（帮助中心）：https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude
- Use incognito chats（帮助中心）：https://support.claude.com/en/articles/12260368-use-incognito-chats
- How can I create and manage projects?（帮助中心）：https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
- Claude 定价页（官方）：https://claude.com/pricing
