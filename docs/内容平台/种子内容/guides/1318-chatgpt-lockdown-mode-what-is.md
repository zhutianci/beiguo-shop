---
title: ChatGPT 锁定模式（Lockdown Mode）是什么：限制了哪些功能、怎么开关、谁适合用
slug: chatgpt-lockdown-mode-what-is
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 锁定模式是 ChatGPT 的可选高级安全设置，通过限制联网和外部服务降低提示词注入后数据外泄的风险。本文按官方帮助中心整理它会关闭哪些功能、个人账号怎么开关、对单个对话怎么关，以及它防不了什么。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/20001061-lockdown-mode
verify:
  - 锁定模式是否对你的账号开放，官方说取决于账号、工作空间、产品发布进度和管理员设置
  - 功能限制清单来自官方当天的写法，官方可能调整
  - 官方没有说明各个套餐的具体开放日期
---

> 本文根据 OpenAI 帮助中心《Lockdown Mode》整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 听说 ChatGPT 有「锁定模式」，想知道它是什么的人；
- 处理敏感资料，想知道要不要开的人；
- 开启后发现联网、深度研究用不了，想知道是不是它造成的人。

## 结论先说

1. **它是一个可选的高级安全设置**，不是账号状态。官方说，它**限制很多能连接网页或外部服务的工具**，目的是降低**提示词注入**攻击造成数据外泄的风险。
2. **代价是功能受限**：联网浏览只能读缓存、深度研究和 Agent 模式被关闭、不能下载文件做数据分析等。
3. **不是给所有人用的**：官方说它面向处理敏感数据、想要更严格防护的个人和组织。
4. **开关**：个人账号和自助版 Business 在 **Settings > Security > Advanced security** 打开 **Lockdown Mode**，在确认弹窗里选 **Turn on**。
5. **可以只对一个对话关掉**：点输入框里的 **LOCKDOWN MODE** 标签，选 **Turn off for this chat**。
6. **不能保证万无一失**：官方明确说它不能阻止所有提示词注入，只是降低数据外泄的风险。

![开启锁定模式后：联网、图片、深度研究、Agent、文件下载、记忆与 Codex 各自的变化](seed:g1318-lockdown-limits-compare.png)
*图：本站根据 [OpenAI 帮助中心：Lockdown Mode](https://help.openai.com/en/articles/20001061-lockdown-mode) 整理的示意图*

## 一、开启后哪些功能变了

官方列出的限制：

- **联网浏览**：只能读缓存内容，搜索结果可能有限、不可用或过时；
- **图片**：回答里可能不显示图片，也不会去网上取图；你仍然可以上传图片，生成图片在原本可用的地方仍然可用；
- **深度研究（Deep research）**：关闭；
- **Agent 模式**：关闭；
- **Canvas 联网**：不能批准 Canvas 生成的代码访问网络；
- **文件下载**：ChatGPT 不能下载文件做数据分析，但你手动上传的文件仍然可以处理。

**不受影响**的有：记忆、文件上传、分享对话、对话是否被用于改进模型，以及 Codex 的网络访问。训练设置要在数据控制里单独管理，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

## 二、怎么开、怎么关

![开启与关闭锁定模式：设置、安全、Advanced security、确认、对单个对话关闭](seed:g1318-lockdown-turn-on-steps.png)
*图：本站根据 [OpenAI 帮助中心：Lockdown Mode](https://help.openai.com/en/articles/20001061-lockdown-mode) 整理的示意图*

对话菜单的另一个办法：打开更多选项菜单（三个点），选 **Lockdown**，选 **Disabled** 只对这个对话关闭，选 **Enabled** 再打开。输入框的对话框里选 **Manage lockdown** 可以直接打开账号的安全设置。**两种方式都只改当前对话**。

联网相关功能用不了，想确认是不是它造成的，先看输入框有没有 LOCKDOWN MODE 标签，联网搜索的说明见 [/guides/chatgpt-search](/guides/chatgpt-search)，深度研究见 [/guides/chatgpt-deep-research](/guides/chatgpt-deep-research)。

## 三、App 与公司工作空间

- **个人账号和自助版 Business**：锁定模式会在与其安全保护冲突时，阻止对外部服务的实时访问和应用的写入操作；官方说 Finances in ChatGPT 和购物类 Agent 体验在锁定模式下不可用；
- **管理型工作空间**：应用和 MCP 由工作空间设置和角色权限控制，锁定模式**不会自动关闭所有应用**。管理员可以新建一个「Lockdown Mode」角色分配给成员或群组。成员用不了某个应用，要同时检查角色、应用分配、读写动作是否启用，以及对源系统有没有权限。

## 四、它防不了什么

官方说得很直白：锁定模式防的是提示词注入攻击的**最后一步**，也就是把敏感数据外传。它**不能阻止**提示词注入出现在 ChatGPT 处理的内容里，比如缓存网页或上传文件里藏的恶意指令，仍然可能影响回答的准确性。通过**仍然启用的应用**、没预料到的能力组合或新发现的手法，风险也可能存在。

## 官方没说的

- 各个套餐**从哪一天开放**，官方没有给日期；
- **为什么在某个账号看不到**这个开关，官方只说取决于账号、工作空间、发布进度和管理员设置；
- 官方没有给出「哪些人必须开」的标准，只说适合处理敏感数据的人。

## 常见问题

**Q：开了锁定模式还能生成图片吗？**
能。官方说锁定模式限制的是回答中的图片和从网上取图，不关闭图片生成。

**Q：开了会不会影响我的聊天是否被用于训练？**
不会。那是数据控制里的另一个设置。

**Q：遇到「无法检查锁定模式」是怎么回事？**
见 [/guides/chatgpt-unable-to-check-lockdown-mode](/guides/chatgpt-unable-to-check-lockdown-mode)。

## 参考资料

- OpenAI 帮助中心：Lockdown Mode — https://help.openai.com/en/articles/20001061-lockdown-mode
