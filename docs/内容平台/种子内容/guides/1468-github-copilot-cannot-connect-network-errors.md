---
title: GitHub Copilot 提示无法连接到服务怎么办：could not connect to server、ETIMEDOUT、证书错误的官方排查办法
slug: github-copilot-cannot-connect-network-errors
products: [github-copilot]
models: []
accountTier: FREE
excerpt: Copilot 提示 could not connect to server、read ETIMEDOUT 或证书错误，多与代理、防火墙有关。本文按 GitHub 官方网络错误排查文档，讲 curl 测连通性、代理与认证限制、证书错误处理和公司网络放行清单。
checkedOn: 2026-10-31
sources:
  - https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot
  - https://docs.github.com/en/copilot/reference/copilot-allowlist-reference
verify:
  - 本文说的是 GitHub Copilot（编辑器插件），不是 Windows 里的 Microsoft Copilot 应用，后者的处理见另一篇
  - 官方文档把「忽略证书错误」列为一种可选做法，同时警告会带来安全风险，本文不推荐
  - 官方文档中的 URL、报错原文以文档当天内容为准，GitHub 可能调整
---

> 本文根据 GitHub 官方文档《Troubleshooting network errors for GitHub Copilot》和《Copilot allowlist reference》整理，资料核对于 2026-10-31。说的是编辑器里的 **GitHub Copilot**，不是 Windows 里的 Copilot 应用。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 VS Code、JetBrains 等编辑器里用 GitHub Copilot，提示 **could not connect to server**、**read ETIMEDOUT**、**read ECONNRESET** 的人；
- 在公司网络下用 Copilot，被证书错误挡住的人。

## 结论先说

1. 官方文档说：如果你在公司设备上、通过 VPN 或 HTTP 代理访问网络，这类网络设置**可能阻止 Copilot 连接 GitHub 的服务器**；防火墙也可能干扰。
2. 官方推荐先用 **curl 测连通性**：请求 `https://copilot-proxy.githubusercontent.com/_ping`，能连上会收到 **HTTP 200**。Chat 单独有问题，就改测 `https://api.githubcopilot.com/_ping`。
3. 典型报错：`GitHub Copilot could not connect to server. Extension activation failed: "read ETIMEDOUT" or "read ECONNRESET"`，官方说**可能由一系列网络问题引起**。
4. 代理相关三点：代理地址以 **https://** 开头**目前不支持**；需要认证时支持**基本认证**或 **Kerberos**；Copilot 可能**拒绝自定义证书**。
5. 证书类报错（certificate signature failure、unable to verify the first certificate 等）通常是公司代理拦截并检查加密流量造成的，找 IT 处理。

![Copilot 无法连接：按报错对照](seed:g1468-connect-decide.png)
*图：本站根据 [GitHub Docs：网络错误排查](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot) 整理的示意图*

## 一、先用 curl 测一下

![用 curl 测一下能不能连上](seed:g1468-curl-steps.png)
*图：本站根据 [GitHub Docs：网络错误排查](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot) 整理的示意图*

1. 打开命令行；
2. 运行 `curl --verbose https://copilot-proxy.githubusercontent.com/_ping`，加 `--verbose` 能看到更多信息，方便发给 IT 或 GitHub 支持；
3. 返回 HTTP 200 说明这条路是通的；
4. 如果是 Copilot Chat 有问题，用 `https://api.githubcopilot.com/_ping` 再测一次；
5. 如果你走代理，用 `-x` 指定代理地址再测一次，对比有无代理的差异；
6. 官方说，如果出现与「证书吊销」相关的错误，可以加 `--insecure` 重试，**但这只用来判断问题出在证书上**，不应作为长期做法。

curl 帮不上忙的时候，官方建议在编辑器里开启详细日志，把日志给公司 IT 或 GitHub 支持。

## 二、代理问题

官方说明：GitHub Copilot 用自定义代码连接代理，所以**编辑器支持的代理设置不一定被 Copilot 支持**。常见原因：

| 情况 | 官方说明 |
| --- | --- |
| 代理 URL 以 `https://` 开头 | 目前不支持 |
| 代理需要认证 | 支持基本认证或 Kerberos；用 Kerberos 要确保有有效票据且服务主体名称正确 |
| 自定义证书 | Copilot 可能拒绝，见下节 |
| 公司代理 | 公司还需要在公司层面为 Copilot 配置代理设置，见白名单参考 |

配置方法官方有单独页面「Configuring network settings for GitHub Copilot」，需要时到那里查看。本文不提供绕过公司网络策略的方法，改代理前请先问 IT。

## 三、证书错误

遇到 certificate signature failure、custom certificate、unable to verify the first certificate 之类的提示，官方给的处理方向：

1. 换一个**不拦截加密连接**的代理；
2. 如果是公司代理，联系 IT，看能否配置为不拦截；
3. 确认自定义证书已正确安装到**操作系统的信任库**。官方说明 Copilot 查找证书的方式：Windows 用 win-ca 包，macOS 用 mac-ca 包，Linux 检查标准的 OpenSSL 文件 `/etc/ssl/certs/ca-certificates.crt` 和 `/etc/ssl/certs/ca-bundle.crt`；
4. 让 Copilot 忽略证书错误：VS Code 里取消 **Proxy Strict SSL**，JetBrains 里选择 **Accept non-trusted certificates automatically**。**官方警告这会带来安全问题，不建议**；
5. 如果是安全软件监控了加密流量，需要为你的编辑器或 Copilot 扩展配置**例外**，具体方法问安全软件厂商。

## 四、公司网络的放行清单

官方白名单参考里，需要允许的域名包括：`github.com/login/*`（认证）、`api.github.com/copilot_internal/*`、`copilot-proxy.githubusercontent.com`、`origin-tracker.githubusercontent.com`，以及 `*.githubcopilot.com`（若用基于订阅的网络路由，则按套餐用 `*.individual`、`*.business`、`*.enterprise` 对应域名）。推荐用 `gh api meta` 查询通配域名。详细对照见 [/guides/github-copilot-language-model-unavailable](/guides/github-copilot-language-model-unavailable)。

## 常见问题

**Q：个人电脑没有代理，也提示连不上？**
先看 githubstatus.com 有没有 Copilot 事件，再用 curl 测，通了就重启编辑器；如果是登录问题，在编辑器里重新登录 GitHub 账号。安装与登录步骤见 [/guides/github-copilot-vscode-setup](/guides/github-copilot-vscode-setup)，JetBrains 见 [/guides/github-copilot-jetbrains-idea-plugin](/guides/github-copilot-jetbrains-idea-plugin)。

**Q：这和 Windows 里的 Copilot 是一回事吗？**
不是。Windows 里的是微软的聊天应用，见 [/guides/microsoft-copilot-official-entry-download](/guides/microsoft-copilot-official-entry-download)。

**Q：想换用别的 AI 编程工具？**
对比见 [/guides/ai-coding-tools-codex-claude-code-cursor-gemini](/guides/ai-coding-tools-codex-claude-code-cursor-gemini)；ChatGPT 会员见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- GitHub Docs：Troubleshooting network errors for GitHub Copilot — https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-network-errors-for-github-copilot
- GitHub Docs：Copilot allowlist reference — https://docs.github.com/en/copilot/reference/copilot-allowlist-reference

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。
