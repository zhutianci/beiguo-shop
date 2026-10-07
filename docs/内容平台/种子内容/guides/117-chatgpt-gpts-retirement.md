---
title: ChatGPT GPTs 是什么、还能用吗：2026 年 12 月退役与迁移到插件
slug: chatgpt-gpts-retirement
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 的自定义 GPTs 计划于 2026 年 12 月 11 日退役，由插件（Plugins）接替。本文按官方帮助中心讲清 GPTs 是什么、现在还能不能用和新建、退役时间表、创作者怎么一键迁移到插件、哪些内容不会迁移，以及只是用别人 GPT 的人该怎么办。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq
  - https://help.openai.com/en/articles/8554407-gpts-in-chatgpt
  - https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
  - https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 退役日期：FAQ 写所有套餐标准退役日为 2026-12-11（获批延期的 Enterprise 为 2027-02-11）；GPTs 总览文章写「Enterprise 计划 12-11，其他套餐预计跟随同一时间表」，上线前看是否有更新
  - 迁移入口按钮「Migrate to plugin」的中文名称以实际界面为准
  - 价格页 Plus 一栏仍写包含「custom GPTs」，与「个人账号不能新建 GPT」的说法不一致
---

> 本文根据 OpenAI 帮助中心《Custom GPT retirement and migration FAQ》《GPTs in ChatGPT》《Plugins in ChatGPT and Codex》和发布说明整理，资料核对于 2026-10-07。退役时间可能调整，以你账号里的通知为准。

## 适用于谁

- 搜「ChatGPT GPTs 是什么」「GPTs 推荐」，想知道现在还值不值得用的人；
- 自己做过 GPT，担心退役后心血白费的人；
- 常用某个公开 GPT，想知道以后去哪找替代的人。

## 结论先说

1. **GPTs 是什么**：GPTs（自定义 GPT）是为特定用途配置好的 ChatGPT，可以包含指令、对话开场白、知识文件、选定的能力（如搜索、生图），以及连接外部服务的应用或动作（Actions）。
2. **要退役了**：OpenAI 在 2026 年 9 月 11 日宣布计划退役自定义 GPTs，**标准退役日是 2026 年 12 月 11 日**（获批延期的 Enterprise 工作区为 2027 年 2 月 11 日）。到期后 GPT 和它的页面将无法访问。
3. **现在还能用**：退役前现有 GPTs 照常可用。但**个人账号（Free、Go、Plus、Pro）已经不能新建和发布 GPT**，只有 Business、Enterprise、Edu 工作区在权限允许时还能创建。
4. **替代品是插件**：创作者可以在 **My GPTs（我的 GPT）** 里点 **Migrate to plugin（迁移为插件）**，GPT 的指令变成插件里的**技能**，知识文件变成参考文件，连接的应用照搬过去。
5. **聊天记录不会丢**：和 GPT 的历史对话在退役后仍然可以访问，不需要做任何事。

## 退役时间表

| 日期 | 事项 |
| --- | --- |
| 2026-09-11 | 宣布计划退役，Enterprise 管理员收到通知 |
| 2026-09-22（目标） | 迁移功能和提示横幅开始上线（不保证所有账号同一天可用） |
| 2026-10-26（计划，Enterprise） | 停止新建自定义 GPT；需要迁移的草稿要在此前发布 |
| 2026-12-11 | 标准退役日，GPT 和 GPT 页面无法访问 |
| 2027-02-11 | 获批延期的 Enterprise 工作区退役 |

官方提醒这些日期可能调整。另外，**判断适用哪个时间表要看 GPT 是在哪个账号或工作区创建的**，而不是你自己用什么套餐——比如在某个 Enterprise 工作区创建的公开 GPT，即使你用个人账号访问，也按那个工作区的时间表退役。

## 如果你是 GPT 的创作者

### 1. 迁移前先准备

- 列出你依赖的 GPT，确认它们的指令、知识文件、连接的应用；
- 保存几个平时常用的提示词，迁移后拿来对比效果；
- **把需要的修改做完并发布**：迁移只使用最新**已发布**的版本，草稿和未发布的修改不会带过去（发布不等于公开分享）；
- 用了**自定义动作（Actions）** 的 GPT 要多留时间，这部分不会自动迁移。

### 2. 执行迁移

账号可以迁移后：进入 **My GPTs** → 选中 GPT → **Migrate to plugin** → 查看迁移说明并按提示创建插件。看不到这个选项，可能是你的账号还没开放、插件功能被关闭，或者你登录的不是创建 GPT 的那个账号或工作区。

### 3. 迁移后会怎样

| GPT 里的内容 | 迁移后 |
| --- | --- |
| 指令（Instructions） | 变成插件里的一个技能（Skill） |
| 知识文件（Knowledge） | 复制为插件的参考文件 |
| 连接的应用（Apps） | 作为应用加入插件 |
| 自定义动作（Actions） | **不迁移**，需要另找可用的应用，或用自建 MCP 服务重建 |
| 选定的模型 | **不迁移** |
| 分享设置 | **不迁移**，新插件默认私有；要公开需要另走插件提交流程 |

迁移后原来的 GPT 在退役前仍能用，但变成**只读**，创作者也不能删除它；以后的修改都在插件里做。

### 4. 认真测试

官方提醒迁移后的插件**回答可能和原 GPT 不同**。用常用提示词和至少一个复杂案例测试：是否选对了技能、是否按指令执行、是否用到了参考资料、输出格式对不对、需要的工具和集成是否都在。确认没问题再通知原来的用户切换。

## 如果你只是用别人的 GPT

- 你**不需要也不能**迁移别人的 GPT；
- 留意 GPT 页面上的通知和创作者发布的替代方案；
- 能用原 GPT 不代表自动能用替代插件，切换前确认对方是否分享给你；
- 插件安装后，在对话里用 **@** 点名，或从 **+ → More** 选择；相关时 ChatGPT 也可能自动调用插件里的技能。插件用法见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)。

## 退役之前怎么用 GPTs

- 打开 **Explore GPTs（探索 GPT）** 浏览，或通过链接打开别人分享的 GPT；必须登录才能聊天；
- 看描述和开场白了解用途，然后正常对话；
- GPT 的创作者**看不到**你和 GPT 的具体对话；
- 用到外部 API 或应用的 GPT，你输入的相关内容可能会发给第三方，OpenAI 不审核也不控制这些服务如何使用数据，只用你信任的 GPT。

官方 DALL·E GPT 已于 2026 年 8 月 30 日下线，生图请直接用 ChatGPT 的图片功能。

## 常见问题

**Q：Plus 用户现在还能做 GPT 吗？**
不能新建和发布。官方写明个人账号（含 Plus、Pro）已不能新建 GPT，编辑已有 GPT 仍需符合条件的订阅和权限。想做类似的东西，直接做插件或技能，见 [/guides/chatgpt-skills](/guides/chatgpt-skills)。

**Q：退役后我和 GPT 的聊天记录还在吗？**
在。官方说明与自定义 GPT 的现有对话在退役后仍可访问。

**Q：GPT 能嵌入我自己的网站吗？**
不能。GPTs 只能在 ChatGPT 里用；想把 AI 助手做进自己的产品，要用 OpenAI API。

## 参考资料

- OpenAI 帮助中心：Custom GPT retirement and migration FAQ — https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq
- OpenAI 帮助中心：GPTs in ChatGPT — https://help.openai.com/en/articles/8554407-gpts-in-chatgpt
- OpenAI 帮助中心：Plugins in ChatGPT and Codex — https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- OpenAI 帮助中心：ChatGPT Free Tier FAQ — https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- ChatGPT Release Notes（2026-07-31 DALL·E GPT 下线、2026-09-11 GPTs 退役计划）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes
