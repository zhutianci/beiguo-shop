---
title: ChatGPT 代码审查不可用怎么办：Code Review 插件、仓库权限、GitLab 预览与工作空间的官方说明
slug: chatgpt-code-review-unavailable
products: [chatgpt, codex]
models: []
accountTier: PLUS
excerpt: ChatGPT 里的代码审查（Code Review）用不了，先查几项：是否在桌面或网页、插件是否对你开放、账号有没有仓库权限、用的是不是 GitLab。官方说 GitLab 云端代码审查不可用。本文按帮助中心整理排查顺序。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/20001552-review-pull-requests-with-codex
verify:
  - 官方文章没有收录「代码审查不可用」这句提示，本文的排查顺序来自官方写明的前提条件（支持的平台、插件、仓库权限、GitLab 预览限制），是推断
  - 官方没有给出各套餐是否包含 Code Review 的具体清单，本文不写
  - GitLab 部分官方标注为预览，可能变化
---

> 本文根据 OpenAI 帮助中心《Review pull requests with Codex》整理，资料核对于 2026-10-30。**官方没有收录「代码审查不可用」这句提示**，下面按官方写明的前提条件逐项排查。配图为本站整理的示意图。

## 适用于谁

- 在 ChatGPT 或 Codex 里找不到代码审查入口的人；
- 能打开代码审查，却看不到 PR 的人；
- 用 GitLab，想知道能不能用的人。

## 结论先说

1. **平台**：官方说，Code Review 插件支持**桌面和网页**。
2. **插件与连接**：在管理型工作空间里，Code Review 插件和所需的应用连接**必须对你可用**；官方明确说，安装插件**不等于获得仓库访问权**。
3. **仓库权限**：要用**有权限访问该 PR 的仓库账号**，你能读或改什么由仓库权限决定。
4. **GitLab**：合并请求审查是**预览**；**GitLab 云端代码审查不可用**；连接了 GitLab、能在 Code Review 里看到合并请求，也不会为这个仓库开启自动云端审查。
5. **本地改动**：官方说，可以让 Codex 审查本地改动，不必先创建 PR。

![代码审查用不了：平台、工作空间、仓库权限、GitLab、本地改动、联系客服](seed:g1335-code-review-decide.png)
*图：本站根据 [OpenAI 帮助中心：Review pull requests with Codex](https://help.openai.com/en/articles/20001552-review-pull-requests-with-codex) 整理的示意图*

## 一、找 PR、审查的基本流程

打开 Code Review 后，可以看到你创建的或被请你审查的 PR；用搜索和筛选缩小范围，再选一个。官方建议：

1. 先核对**仓库、标题、作者和分支**，确认审查的是想要的改动；
2. 读 PR 描述和摘要，看被改的文件和相关行；
3. 看已有的审查发现和评论；
4. 检查测试结果、检查项和未解决的合并冲突；
5. 有需要进一步查的，向 Codex 提问。

**AI 生成的发现，要对着相关代码核对再采用。** 你也可以让 Codex 准备修复，描述要改什么、限制范围，之后检查它给出的 diff 和测试结果；**提交评论、提交代码或合并之前，要先看结果**。

![开始审查前确认：账号权限、插件、应用连接、平台、核对改动、核对发现、检查结果](seed:g1335-code-review-checklist.png)
*图：本站根据 [OpenAI 帮助中心：Review pull requests with Codex](https://help.openai.com/en/articles/20001552-review-pull-requests-with-codex) 整理的示意图*

## 二、相关设置

- 插件的安装位置和工作空间控制见 [/guides/codex-plugins-where-to-install](/guides/codex-plugins-where-to-install)；
- GitHub 的连接方法见 [/guides/chatgpt-github-connect](/guides/chatgpt-github-connect)；
- Codex 代码审查的整体用法见 [/guides/codex-code-review](/guides/codex-code-review)；
- 开通使用权限与额度有关的问题，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)，想了解会员可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 三、联系官方客服

以上都符合仍然不可用，联系官方客服，附上账号类型（个人还是工作空间）、仓库平台（GitHub 或 GitLab）、你在哪里打开（桌面还是网页）和截图，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

## 官方没说的

- 各套餐**是否包含** Code Review，官方这篇文章没有写；
- 「**不可用**」时界面会给什么提示，官方没有写；
- GitLab 云端代码审查**什么时候可用**，官方没有说。

## 常见问题

**Q：审查结果可以直接采用吗？**
不可以，官方要求对照代码核对。

**Q：现有的云端审查会被迁移吗？**
官方说，这次更新不会把已有的云端代码审查迁移到新的云端环境。

## 参考资料

- OpenAI 帮助中心：Review pull requests with Codex — https://help.openai.com/en/articles/20001552-review-pull-requests-with-codex
