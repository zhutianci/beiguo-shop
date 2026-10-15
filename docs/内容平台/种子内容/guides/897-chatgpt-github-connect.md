---
title: ChatGPT 怎么连接 GitHub：连接步骤、看不到仓库怎么办、能不能改代码和推送
slug: chatgpt-github-connect
products: [chatgpt, codex]
models: []
accountTier: PLUS
excerpt: 想让 ChatGPT 读 GitHub 仓库里的代码和文档？按 OpenAI 帮助中心：在设置 → 插件选 GitHub，到 GitHub 安装并选仓库。它按需只读、不能推送代码，写代码要用 Codex。本文讲步骤、仓库不显示怎么查。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt
  - https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
  - https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps
verify:
  - 官方说 GitHub 的可用性因套餐、工作区和平台而异，有的账号只在深度研究或智能体里能用、标准聊天里没有；没有逐个套餐列出，以你账号里「插件」页实际显示为准
  - 官方对 OpenAI 出口 IP 段没有在这篇文章里给出具体地址，只说要加进 GitHub 的 IP 允许列表；具体地址以官方当前公布为准
  - 官方 GitHub 连接文章的更新时间约为 17 天前，菜单名称（Plugins 或 Apps）可能因账号而异
  - GitHub 一侧的卸载和权限路径来自 GitHub 官方文档，GitHub 可能调整界面
---

> 本文根据 OpenAI 帮助中心《Connecting GitHub to ChatGPT》《Connecting and managing app accounts in ChatGPT》和 GitHub 官方文档整理，资料核对于 2026-10-14。这些官方页面没有可用的界面截图，配图为本站整理的示意图。通用的连接器规则见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)。

## 适用于谁

- 想让 ChatGPT 帮你读仓库代码、查某个功能写在哪、解释一段实现的开发者；
- 连上 GitHub 却找不到某个仓库的人；
- 想知道「ChatGPT 连了 GitHub 能不能直接改代码、提交 PR」的人。

## 结论先说

1. **连接入口**：**Settings（设置）→ Plugins（插件）**，选 **GitHub**，或者包含它的插件。随后会跳转到 GitHub，**安装并授权 ChatGPT 应用**，再**选择 ChatGPT 可以访问的仓库**。
2. **它是「按需读取」**：官方说，连接后 ChatGPT 可以按需检索被允许的仓库内容，包括代码、README 和其他文档；这种实时访问**不会建立同步的 GitHub 索引**，GitHub 同步和单独配置的仓库索引**都不提供**。
3. **它只能读**：官方明确说，ChatGPT 里的 GitHub 应用只让你读取仓库来分析、搜索代码；要**生成、修改并直接推送代码到 GitHub，请用 Codex**，见 [/guides/codex-getting-started](/guides/codex-getting-started)。
4. **可用性因套餐而异**：官方说有的账号在深度研究或智能体里能用 GitHub，而标准聊天里没有。看不到 GitHub，先查你的套餐，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。
5. **仓库访问由 GitHub 控制**：想禁止某些仓库被 ChatGPT 应用访问，在 GitHub 里设置，组织所有者可以调整已安装的 GitHub 应用能访问哪些仓库。

![把 GitHub 连到 ChatGPT 的 5 步](seed:g897-github-connect-steps.png)
*图：本站根据 [OpenAI 帮助中心：Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt) 整理的示意图*

## 一、连接步骤

按官方说明：

1. 打开 **Settings → Plugins**，选 **GitHub** 或包含它的插件（官方的账号连接通用步骤是：看到 **Install plugin** 就点，需要时点 **Connect**，登录对应服务商的账号并核对要求的权限）；
2. 被带到 GitHub，**安装并授权 ChatGPT 应用**；
3. **选择 ChatGPT 可以访问的仓库**；
4. 回到 ChatGPT，开始提问。

之后想**修改仓库访问范围**：**Settings → Plugins → GitHub → 选择可用的仓库管理选项**。想**断开**：在同一个应用设置里选 **Disconnect**。

### 怎么提问

官方的提示：

- 官方说 ChatGPT 会根据你的提示拼出搜索词，到你连接的仓库里去找，并把这些查询发给 GitHub。比如你问「后端里处理文件上传的代码在哪」，它可能用类似「file upload handler backend」的查询去搜；必要时会做几次不同的搜索；
- **仓库选择器搜的是仓库名，不是仓库里的文件**。想按文件找，要在对话里让 ChatGPT 去搜：用**文件名、函数名或报错信息**，同时带上**仓库名**，知道的话再带上文件路径。

示例指令（本站拟的写法）：

> 在 my-org/backend 仓库里，找出处理文件上传的代码，说明它校验了哪些内容，并指出可能遗漏的边界情况。

> 看一下 my-org/web-app 仓库里报错信息 "Cannot read properties of undefined" 出现在哪些文件，按出现次数列出来，并解释最可能的原因。

> 阅读 my-org/docs 仓库的 README，用一页纸总结安装步骤和常见问题。

想做更长的代码调研，可以和深度研究配合，见 [/guides/chatgpt-deep-research](/guides/chatgpt-deep-research)；需要智能体式的多步骤任务，见 [/guides/chatgpt-agent-mode](/guides/chatgpt-agent-mode)。

## 二、看不到仓库怎么办

![GitHub 连了却看不到仓库：等待时间、安装账号、管理员批准、套餐、IP 允许列表、只读](seed:g897-github-repos-missing.png)
*图：本站根据 [OpenAI 帮助中心：Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt) 整理的示意图*

官方的排查顺序：

1. **先等一会儿**：官方说，仓库一般约 **5 分钟**后会出现在 ChatGPT 里；
2. **私有或新建的仓库**：可能要等到 GitHub 应用安装在**正确的账号或组织**里、并拿到这个仓库的访问权才出现。打开 GitHub 应用的仓库设置，确认这个仓库**已被选中并被批准**。官方说，如果 GitHub 显示已连接但一个仓库都没有，**先查这些设置，再考虑重新连接**；
3. **组织要求管理员批准**：你的 GitHub 组织可能要求管理员批准 ChatGPT 应用或某个仓库。按 GitHub 给你的批准流程申请。官方说，如果组织限制了 OAuth 应用访问，**组织所有者**可以按 GitHub 的说明批准；**安装 GitHub 应用**和**授予它仓库访问权**是两个独立的步骤；
4. **GitHub 自己的搜索索引**也可能需要时间才能收录新仓库，这和 ChatGPT 的同步无关；
5. **开了 IP 允许列表**：如果你的 GitHub 企业或组织启用了 IP 允许列表，官方说要把 OpenAI 的出口 IP 段加到 IP 允许列表里；具体地址以官方当前公布为准；
6. **聊天里没有 GitHub，别处有**：官方说，账号可能在深度研究或智能体里能用 GitHub，而标准聊天里不能，因为可用性因套餐和产品体验而异。

## 三、在 GitHub 里改权限、卸载

ChatGPT 能读哪些仓库，最终由 GitHub 一侧控制。按 GitHub 官方文档，个人账号的做法是：

1. 点右上角头像 → **Settings**；
2. 在 **Integrations** 下点 **Applications**；
3. 点 **Installed GitHub Apps**；
4. 在 ChatGPT 对应的应用旁点 **Configure**；
5. 在 **Permissions** 下查看它能访问什么；
6. 改仓库范围：在 **Repository access** 下选 **All repositories** 或 **Only select repositories**，选后者时在下拉里选允许的仓库，点 **Save**。

要停用：

- **Suspend**：应用保持安装，但暂时阻止它访问你账号的资源；之后可以 **Unsuspend**；
- **Uninstall**：移除应用，阻止它访问你账号的资源；
- GitHub 文档还提醒：想让应用在 GitHub 任何地方都不能代你操作，还要到你用户账号的 **Authorized GitHub Apps** 标签里取消授权，**只卸载不会做到这一点**。

组织里的做法由组织所有者在组织设置里管理，具体界面以 GitHub 为准。

## 四、数据与隐私

官方说明的几点：

- 为了回答你的问题，ChatGPT 会把根据你的提示形成的搜索查询发给 GitHub；
- **模型训练**：通过 ChatGPT Business、Enterprise、Edu 和 API 发送的内容，默认不会用来改进模型；个人账号里符合条件的内容，是否用于改进模型取决于你的「改进所有人的模型」设置，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)；
- 发送给 GitHub 的信息，同时适用 GitHub 自己的存储、处理和数据驻留条款；
- 分享用到 GitHub 的定时任务时：分享链接**不会**转移你的 GitHub 连接、凭证、仓库访问权或仓库文件，但**任务的说明文字对链接的接收者是可见的**，分享前要去掉敏感的代码或仓库信息。

## 五、进阶：拉取请求（PR）动态触发任务

官方说，符合条件的用户可以在 Work 里为已连接的 github.com 仓库的动态创建**事件触发（基于 webhook）的任务**。支持的动态可以包括：PR 被打开、被标记为可审查、被关闭；视触发类型，还可以监控 PR 评审、评论、提交更新或合并完成。这类任务只能访问被授权给已连接 GitHub 账号的仓库；**自托管的 GitHub Enterprise 连接不支持事件触发的任务**。定时任务的总体设置见 [/guides/chatgpt-scheduled-tasks](/guides/chatgpt-scheduled-tasks)。

## 常见问题

**Q：连了 GitHub，ChatGPT 能直接改我的代码、推送 PR 吗？**
不能。官方明确说 GitHub 应用只让你读取仓库来分析和搜索代码；要生成、修改和推送，用 Codex。

**Q：ChatGPT 会把我的整个仓库「存」起来吗？**
官方说不会：它是按需检索被允许的内容，不创建同步的 GitHub 索引。

**Q：怎么让它搜到仓库里的某个文件？**
仓库选择器只搜仓库名。在对话里让 ChatGPT 按文件名、函数名或报错信息搜索，并带上仓库名。

**Q：GitHub 同步还能用吗？**
官方说 GitHub 同步和单独配置的仓库索引都不提供，现在是按需的实时访问。

**Q：能不能不让它看某几个仓库？**
可以，访问权限在 GitHub 里控制。个人账号在 Installed GitHub Apps 的 Configure 页里选 Only select repositories；组织由所有者调整。

**Q：企业自己部署的 GitHub Enterprise Server 怎么连？**
官方有专门的「GitHub Enterprise app template」，需要工作区管理员配置，本文不展开，以官方《Set up the GitHub Enterprise app template in ChatGPT》为准。

**Q：想让它写代码、跑测试、提 PR，应该用什么？**
用 Codex，见 [/guides/codex-getting-started](/guides/codex-getting-started)；Codex 与 ChatGPT Work 的区别，见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：Connecting GitHub to ChatGPT — https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt
- OpenAI 帮助中心：Connecting and managing app accounts in ChatGPT — https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt
- GitHub 文档：Reviewing and modifying installed GitHub Apps — https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps
