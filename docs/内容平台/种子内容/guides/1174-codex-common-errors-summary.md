---
title: Codex 常见报错总表：429、401、登录失败、连接中断、缺少环境变量、沙箱、Computer Use、远程控制，看到哪条读哪篇
slug: codex-common-errors-summary
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: 把 Codex 最常见的报错和问题汇成一张对照表：429、401、Token exchange failed、stream disconnected、missing environment variable、Windows 沙箱失败、Computer Use 找不到、远程控制连不上，各给一句处理方向并链到详细文章。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://learn.chatgpt.com/docs/auth
  - https://learn.chatgpt.com/docs/windows/windows-sandbox
  - https://learn.chatgpt.com/docs/remote-connections
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
verify:
  - 官方文档没有一份「Codex 报错大全」，本文是本站把官方文档里分散的排查说明按报错原文整理成的索引，每条的依据见对应详细文章
  - 报错原文取自公开的使用反馈和官方文档，不同版本、不同平台的文字可能略有差异
  - 官方没有逐条解释这些报错，凡是官方未说明的地方，详细文章里都写明了
---

> 本文是索引页，把本站已有的 Codex 排查文章按报错原文汇总，资料核对于 2026-10-27。**官方没有一份统一的 Codex 报错大全**，具体依据见每篇详细文章的「核对说明」。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex 里遇到一条报错，不知道该读哪篇的人；
- 想先看一眼有哪些常见问题的人。

## 结论先说

1. **先看报错原文是哪一类**：额度和限流、登录和凭据、网络连接、配置、系统和沙箱、功能可用性。
2. **报错原文一般要原样搜索**，别只记大意。
3. **先看状态页**，官方有进行中的事件就等恢复，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。
4. **官方没有逐条解释的报错**，详细文章里都写明了「官方未单独说明」，并只采用官方文档里写明的做法。

![Codex 报错对照：看到什么，读哪一篇](seed:g1174-error-decide.png)
*图：本站根据 Codex 官方文档与本站相关文章整理的示意图*

## 一、对照表

| 你看到的 | 大致方向 | 详细文章 |
| --- | --- | --- |
| `exceeded retry limit, last status: 429 Too Many Requests` | 先看用量页面和 `/status`，区分套餐额度、API 限额、工作区控制 | [/guides/codex-exceeded-retry-limit-429-too-many-requests](/guides/codex-exceeded-retry-limit-429-too-many-requests) |
| `Token exchange failed`、`token_exchange_failed` | 浏览器登录成功却回不到 Codex，试设备码登录、回调端口、公司证书 | [/guides/codex-token-exchange-failed-login-error](/guides/codex-token-exchange-failed-login-error) |
| `401 Unauthorized` | 确认登录方式，重新登录，查 API 密钥、`env_key`、WSL 登录缓存 | [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error) |
| `stream disconnected before completion` | 连接中途断开，查状态页、WebSocket、代理和证书 | [/guides/codex-stream-disconnected-before-completion](/guides/codex-stream-disconnected-before-completion) |
| `missing environment variable` | 对照 `env_key`、MCP 的 `env_vars`、`shell_environment_policy` | [/guides/codex-missing-environment-variable](/guides/codex-missing-environment-variable) |
| Windows 沙箱设置失败、错误 1385、Everyone 可写 | mxc、elevated、unelevated 三种实现的排查 | [/guides/codex-windows-sandbox-setup-failed](/guides/codex-windows-sandbox-setup-failed) |
| Linux、WSL2 沙箱启动失败、权限模式怎么选 | bwrap、用户命名空间、审批模式 | [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox) |
| 找不到 Computer Use | 地区限制、插件安装、系统权限 | [/guides/codex-computer-use-not-found](/guides/codex-computer-use-not-found) |
| 手机远程控制授权失败、SSH 主机 | 账号和工作区一致、重新配对、主机保持唤醒 | [/guides/codex-remote-control-ssh-host](/guides/codex-remote-control-ssh-host) |
| 登录不了、发不出消息 | ChatGPT 账号还是 API 密钥、MFA、网络 | [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect) |
| 额度不够、什么时候重置 | 各套餐额度、查看方法、省额度建议 | [/guides/codex-usage-limits](/guides/codex-usage-limits) |
| Windows 版下载安装 | 桌面 App 官方入口、winget、开发工具 | [/guides/codex-windows-app-download-install](/guides/codex-windows-app-download-install) |
| 插件在哪装 | 桌面 App 的 Plugins、CLI 的 `/plugins` | [/guides/codex-plugins-where-to-install](/guides/codex-plugins-where-to-install) |
| CLI 装不上、怎么更新 | 官方安装命令和更新 | [/guides/codex-cli-install-update](/guides/codex-cli-install-update) |

## 二、官方排查文档里的通用做法

官方 Codex Troubleshooting 页里和「卡住」有关的通用建议：

1. 看 Codex 是不是在等你批准某个操作；
2. 打开终端，运行 `git status` 这类基本命令；
3. 开一个新对话，用更小、更聚焦的提示重新开始；
4. 终端卡住：关闭终端面板，用快捷键 Ctrl 加反引号键（`）重新打开，再运行 `pwd` 或 `git status`；仍卡住就等进行中的对话结束后重启 App。

另有几个官方列的小问题：审查面板里出现了 Codex 没改的文件，是因为面板按项目的 Git 状态显示，可以切到 **Last turn** 视图只看上一轮的改动；找不到某个对话，先看侧边栏的筛选（选 **Chronological**）和设置里的 **Archived chats**；在工作树里代码跑不起来，用本地环境的安装脚本或 `.worktreeinclude` 复制被忽略的文件；CLI 有的功能桌面 App 里没有，是因为两者可能带着不同版本的 Codex，用 `codex --version` 对比。

![向官方反馈 Codex 问题前先收集](seed:g1174-feedback-check.png)
*图：本站根据 [Codex 官方文档：Troubleshooting](https://learn.chatgpt.com/docs/reference/troubleshooting) 整理的示意图*

## 三、向官方反馈

官方给的两条路：在消息输入框里输入 `/` 提交反馈（在已有对话里提交时可以选择是否附上会话，提交后会得到一个会话 ID）；或到 GitHub 的 [openai/codex](https://github.com/openai/codex/issues) 先搜已有问题，再提新问题。日志位置：会话记录 `$CODEX_HOME/sessions`（默认 `~/.codex/sessions`），macOS 应用日志 `~/Library/Logs/com.openai.codex/年/月/日`。分享日志前先检查有没有密钥和令牌。

## 常见问题

**Q：为什么有些报错没有对应的文章？**
本站只写能在官方文档里找到依据的内容。官方没有说明的报错，要么不写，要么在文章里写明官方未单独解释。

**Q：我的套餐能不能用 Codex？**
官方 Pricing 页写明 Work 和 Codex 包含在各 ChatGPT 套餐里，额度不同。想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，更高额度看 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

**Q：Codex 刚入门，从哪开始？**
见 [/guides/codex-getting-started](/guides/codex-getting-started)。

## 参考资料

- Codex 官方文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth
- Codex 官方文档：Windows sandbox — https://learn.chatgpt.com/docs/windows/windows-sandbox
- Codex 官方文档：Remote connections — https://learn.chatgpt.com/docs/remote-connections
- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
