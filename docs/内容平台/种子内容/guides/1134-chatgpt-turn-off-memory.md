---
title: ChatGPT 记忆功能怎么关闭：设置里两个开关的区别、关掉之后聊天记录会不会删、怎么让它忘掉某件事
slug: chatgpt-turn-off-memory
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 不想让 ChatGPT 记住你的信息？官方路径是 设置 → Personalization → Memory。里面有两个开关：Reference saved memories 和 Reference chat history，关掉前者会连带关掉后者。本文讲清各开关的作用、关闭后聊天记录是否保留，以及临时聊天的用法。
checkedOn: 2026-10-27
sources:
  - https://help.openai.com/en/articles/8590148-memory-in-chatgpt
verify:
  - 官方文章说设置项的名称会因体验、套餐、地区、平台和工作区不同而不同，开关的实际文字以账号里看到的为准
  - 官方文章没有描述单独的「一键删除全部记忆」按钮，正文只写了官方明确说过的单条删除、Memory summary 的 Delete and turn off memory
  - 删除后「最长 30 天」是官方对被引用的聊天内容和已删除记忆日志的说法，不是即时删除
  - 官方文章页面没有给出准确的更新日期
---

> 本文根据 OpenAI 帮助中心《Memory in ChatGPT》整理，资料核对于 2026-10-27。设置项名称会因套餐、地区、平台和账号不同而略有差异，请以你账号里实际显示的为准。配图为本站整理的示意图，不是界面截图。记忆的整体介绍和满了怎么办，见 [/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)，本文只讲关闭。

## 适用于谁

- 不想让 ChatGPT 记住自己的名字、职业、偏好的人；
- 担心它参考以前的聊天内容来回答的人；
- 想关掉记忆，又怕把聊天记录弄丢的人；
- 只想让它忘掉某一件事，不想全关的人。

## 结论先说

1. **官方路径**：**设置（Settings）→ Personalization（个性化）→ Memory（记忆）**。
2. **有两个开关**：**Reference saved memories（参考已保存的记忆）**和 **Reference chat history（参考聊天历史）**。官方说明：关掉前者，**会同时关掉后者**；后者可以在前者开着的时候单独管理。
3. **关记忆不会删聊天记录**：官方明确写了，关闭记忆后，你过去的聊天不会被删除。
4. **关掉开关，也不会删除已经存下来的记忆**：官方说关闭 Reference chat history 不会删除已保存的记忆。想清掉，要另外删（见第三节）。
5. **只想这一次不被记住**：用**临时聊天（Temporary Chat）**，官方说临时聊天不会创建或更新记忆。
6. **关闭后重新打开**：官方提醒，再打开时，ChatGPT 可能会根据你还留在历史里的聊天，重新生成被记住的内容。
7. **设置里找不到这些开关**：官方说记忆的控制项因套餐、地区、平台和工作区设置而不同，可能你的账号暂时还没有。

![关闭 ChatGPT 记忆的步骤：设置、Personalization、Memory、两个开关与删除](seed:g1134-memory-off-steps.png)
*图：本站根据 [OpenAI 帮助中心：Memory in ChatGPT](https://help.openai.com/en/articles/8590148-memory-in-chatgpt) 整理的示意图*

## 一、两个开关各管什么

### Reference saved memories

意思是「参考已保存的记忆」。官方的说法：关掉它，**同时也会关掉 Reference chat history**。所以想**彻底停用**记忆，关这一个最省事。

### Reference chat history

意思是「参考聊天历史」，也就是让 ChatGPT 从你过去的对话里找线索。官方的说法是：

- 关闭它，会**安排把从过去聊天里记下的信息，在 30 天内从 OpenAI 系统中删除**；
- 你**原来的聊天仍然留在历史记录里**；
- 它**不会删除**已保存的记忆（saved memories）。

![记忆怎么关：不同需求对应的做法一览](seed:g1134-memory-off-decide.png)
*图：本站根据 [OpenAI 帮助中心：Memory in ChatGPT](https://help.openai.com/en/articles/8590148-memory-in-chatgpt) 整理的示意图*

## 二、关掉记忆之后会怎样

官方列出的几点：

- **过去的聊天都在**，记忆是否开启不影响聊天记录；
- 再次打开记忆时，ChatGPT **可能会重新从还在历史里的聊天中生成**被记住的内容；
- 官方还说，在极少数**高风险**情形下，会有限度地使用上下文来做安全和防护，这类使用**不会因为你关掉记忆而停止**。

所以，想让某些聊天**永远不被引用**，除了关记忆，还可以把相关的聊天删掉，批量删除见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)。

## 三、想清掉已经记住的内容

关开关只是「以后不再用」，已经存下的内容要另外处理：

- **删某一条已保存的记忆**：可以直接让 ChatGPT 忘掉，或者在 **Memory 设置里删除**。官方说这样会**停止以后的个性化**，但**不会删掉过去对话里提到过它的地方**；
- **删除记忆摘要并关闭**：在 **Memory summary（记忆摘要）** 的更多选项（•••）里选 **Delete and turn off memory（删除并关闭记忆）**，会删除摘要里显示的信息并关闭记忆，**不会删除过去的聊天**；
- **删除聊天不会自动删除由它产生的记忆**，这是官方明确写的，需要的话两处都要删；
- **删除不是即时的**：官方说删除和更新可能需要时间生效，OpenAI 可能把已删除的已保存记忆的日志保留**最长 30 天**，用于安全和调试。

官方文章没有描述单独的「一键删除全部记忆」控件，所以不要照网上截图找一个官方没提的按钮，以你设置里实际有的为准。

## 四、只有这一次不想被记住：临时聊天

官方对临时聊天的说明：

- 开始前可以选择它是否使用已有的记忆、自定义指令和插件，选 **Unpersonalized（不个性化）**会把这些关掉，开始后**不能改**；
- **临时聊天不会创建或更新记忆**，即使你的个性化设置是开着的；
- 你把临时聊天**保存**之后，它会变成普通聊天，之后就按你的个性化设置来。

怎么开、有什么限制，见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)。除记忆外，还有「自定义指令」也会影响回答，见 [/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)，数据与隐私相关的开关见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

## 五、找不到这些开关怎么办

1. 先**更新 App 或刷新网页**，官方说设置项与平台、套餐、地区有关，可能还没有推送到你的账号；
2. 在工作区（公司、学校）账号里，记忆可能被管理员限制：官方说在 ChatGPT for Healthcare 和 Enterprise 的 Regulated Workspace 里，改进后的记忆**默认关闭**，由工作区所有者或管理员决定是否开放；
3. 未成年人的关联账号，家长或监护人可以通过家长控制管理部分记忆设置；
4. 都不是的话，确认登录的是想要的那个账号，见 [/guides/chatgpt-account-sharing-multiple-devices](/guides/chatgpt-account-sharing-multiple-devices)，仍然没有就联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

## 常见问题

**Q：关了记忆，以前的聊天会没吗？**
不会，官方说过去的聊天不会被删除。

**Q：关了记忆，已经存的记忆就没了吗？**
不会，关闭开关不会删除已保存的记忆，要在 Memory 设置里删，或用 Delete and turn off memory。

**Q：我只想让它不要再提某件事？**
直接对 ChatGPT 说忘掉它，或在 Memory 设置里删掉对应那一条。

**Q：关了之后又想开，会怎样？**
官方说重新打开后，ChatGPT 可能根据还在历史里的聊天重新生成被记住的内容。

## 参考资料

- OpenAI 帮助中心：Memory in ChatGPT — https://help.openai.com/en/articles/8590148-memory-in-chatgpt
