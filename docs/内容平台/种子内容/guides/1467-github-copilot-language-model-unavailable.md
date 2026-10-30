---
title: GitHub Copilot 报错「Language model unavailable」怎么办：VS Code 团队说的头号原因，以及怎么收集诊断信息
slug: github-copilot-language-model-unavailable
products: [github-copilot]
models: []
accountTier: FREE
excerpt: VS Code 里 Copilot Chat 提示 Language model unavailable，官方文档没有单独页面说明。本文按 VS Code 团队在官方仓库置顶问题里的说法讲清头号原因（公司防火墙没放行新端点）、怎么看输出里的 Failed to fetch models、运行 Chat Diagnostics 与调高日志级别，并给出官方网络排查文档的做法。
checkedOn: 2026-10-31
sources:
  - https://github.com/microsoft/vscode/issues/253137
  - https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot
  - https://docs.github.com/en/copilot/reference/copilot-allowlist-reference
verify:
  - GitHub 和 VS Code 的官方文档里没有「Language model unavailable」的单独说明页，本文的做法来自 VS Code 团队成员在官方仓库置顶问题里的说明，以及 GitHub 官方的网络排查与白名单文档
  - 置顶问题创建于 2024 年 10 月，引用的订阅网络路由强制执行是 2024 年 11 月的变更，现在的细节以 GitHub 官方文档为准
  - 同一报错也可能由其他原因引起（如更新后的临时状态、账号权限），官方没有穷尽列出
---

> **官方文档里没有「Language model unavailable」这条报错的单独说明。** 本文整理 VS Code 团队在官方仓库置顶问题里的说法，加上 GitHub 官方的网络排查文档，资料核对于 2026-10-31。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 VS Code 里用 GitHub Copilot Chat，发消息后提示 **Language model unavailable**（语言模型不可用），带红色叉号的人；
- 代码补全正常、聊天用不了，或者模型选择器里选不了别的模型的人。

## 结论先说

1. VS Code 团队在置顶问题里写：**如果你在公司网络里，先检查防火墙，确认放行了新的 Copilot 端点**。他们称这是这个错误的**头号原因**，此时 Copilot Chat 的输出里会出现 **Failed to fetch models**。
2. 这条对应的 GitHub 变更是：**基于订阅的网络路由已强制执行**，公司的白名单需要放行对应域名，见下文。
3. 确定不是网络问题时，团队要求提供：**重载窗口后是否还出现**、**Developer: GitHub Copilot Chat Diagnostics** 的输出、**把日志级别设为 Trace** 后的输出面板内容。
4. 先看官方状态页 githubstatus.com 有没有 Copilot 的事件，排除官方故障。

![Language model unavailable](seed:g1467-lm-decide.png)
*图：本站根据 [VS Code 置顶问题](https://github.com/microsoft/vscode/issues/253137) 与 [GitHub Docs](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot) 整理的示意图*

## 一、个人电脑上先做这几步

1. **重新加载窗口**：按 F1，运行 **Developer: Reload Window**（官方帖子里写作 Reload Window），再试一次聊天；
2. 帖子里有用户反馈**完全重启 VS Code** 后恢复，再次点聊天里的「重试」按钮重复报错，直到重启才消失；这是用户的经历，不是官方保证；
3. 看看是不是更新 VS Code 或 Copilot 扩展之后才出现，如果是，更新到最新版本再试；
4. 确认你登录的是有 Copilot 权限的 GitHub 账号，账号与订阅的关系见 [/guides/github-copilot-free-pro-ai-credits](/guides/github-copilot-free-pro-ai-credits)。

## 二、怎么收集诊断信息

![收集 Copilot Chat 的排查信息](seed:g1467-logs-steps.png)
*图：本站根据 [VS Code 置顶问题](https://github.com/microsoft/vscode/issues/253137) 整理的示意图*

VS Code 团队在帖子里要求提供的内容：

- 按 F1 运行 **Developer: GitHub Copilot Chat Diagnostics**，看输出；
- 按 F1 运行 **Set Log Level**，选 **Trace**，重载窗口后再试一次，看 Copilot Chat 输出面板或别处是否有错误；
- 打开输出面板：Ctrl/Cmd + Shift + U，下拉选择 **GitHub Copilot Chat**。如果这里有 `Failed to fetch models`，基本指向网络或企业白名单问题；
- 需要时还可以抓取网络请求的跟踪记录，帖子里给了说明链接。

把日志发给别人之前，注意删除其中的邮箱、令牌、公司内网地址等信息。

## 三、公司网络：需要放行什么

GitHub 官方的白名单参考说明，公司的防火墙或代理需要允许 Copilot 相关地址，并让用户能够登录 GitHub、访问 Copilot 服务。要点：

- 用 `gh api meta -q '.domains | .website, .copilot'` 查询需要放行的通配域名，另外建议放行 `github.com` 主域；
- 提供补全与聊天服务的域名包括 `*.githubcopilot.com`，以及按套餐区分的 `*.individual.githubcopilot.com`、`*.business.githubcopilot.com`、`*.enterprise.githubcopilot.com`；
- 官方特别提醒：**阻止 `*.enterprise.githubcopilot.com` 会同时阻止 Copilot Enterprise 套餐和「Copilot 访问」计费模式两种路径**；是否使用「基于订阅的网络路由」不同，该不该放行某个域名的要求也不同，管理员应按官方说明配置；
- 每个使用该代理或防火墙的用户，还需要在自己的编辑器里配置网络环境。

个人用户不用管这些，把这页发给 IT 即可。网络、代理、证书类的具体报错对照，见 [/guides/github-copilot-cannot-connect-network-errors](/guides/github-copilot-cannot-connect-network-errors)。

## 常见问题

**Q：代码补全正常，只有聊天不行，是为什么？**
帖子里就有这样的反馈。官方文档也区分了补全服务和聊天服务的测试地址（后者是 api.githubcopilot.com），所以网络层面可能一个通、一个不通。

**Q：这是我的订阅过期了吗？**
官方这些页面没有这样说。想确认账号权限与额度，看 [/guides/github-copilot-free-pro-ai-credits](/guides/github-copilot-free-pro-ai-credits)。

**Q：怎么在 VS Code 里装好 Copilot？**
见 [/guides/github-copilot-vscode-setup](/guides/github-copilot-vscode-setup)。如果你同时用 ChatGPT，会员见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- VS Code 官方仓库：Meta: Language Model Unavailable — https://github.com/microsoft/vscode/issues/253137
- GitHub Docs：Troubleshooting network errors for GitHub Copilot — https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot
- GitHub Docs：Copilot allowlist reference — https://docs.github.com/en/copilot/reference/copilot-allowlist-reference

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。
