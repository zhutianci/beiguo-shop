---
title: Cursor 常见报错与解决：Connection failed、high demand、模型不可用、Agent 超时、登录不上
slug: cursor-common-errors-connection-failed
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor 报错怎么办？按官方帮助中心整理：Connection failed 先跑网络诊断并切 HTTP/1.1、suspicious activity、模型不可用、Agent Execution Timed Out、登录域名被拦、Tab 不出建议，以及怎么导出日志和 Request ID 反馈给官方。
checkedOn: 2026-10-11
sources:
  - https://cursor.com/help/troubleshooting/network
  - https://cursor.com/help/troubleshooting/agent-issues
  - https://cursor.com/help/troubleshooting/install-issues
  - https://cursor.com/help/troubleshooting/tab-issues
  - https://cursor.com/help/troubleshooting/sign-in-domains
  - https://cursor.com/help/models-and-usage/available-models
  - https://cursor.com/help/models-and-usage/usage-limits
verify:
  - 「We're experiencing high demand right now」这条提示在官方帮助中心没有单独的条目，文中的处理办法是按官方对用量与模型可用性的通用说明整理的，不是官方针对该报错给出的步骤
  - 登录页迁移到 accounts.spacex.ai / accounts.x.ai、旧登录页回退将于 10 月 30 日停用，是官方帮助页当天的说法
---

> 本文根据 Cursor 官方帮助中心 Troubleshooting 分类下的多篇文章整理，资料核对于 2026-10-11。报错文字以英文原文为准，方便你对照搜索。

## 适用于谁

- Cursor 突然用不了，弹出一行英文报错的人；
- 搜「cursor 报错」「cursor connection failed」「cursor 模型不可用」的人；
- 在公司网络、远程服务器上用 Cursor，AI 功能时好时坏的人。

## 结论先说

1. **先跑官方的网络诊断**：Cursor Settings → **Network** → **Run Diagnostics**。它会测试到 Cursor 服务器的连接，直接告诉你卡在哪。
2. 公司网络、代理环境下最常见的原因是 **HTTP/2 被拦**：在同一页把 **HTTP Compatibility Mode** 设为 **HTTP/1.1**，然后重启 Cursor。
3. 换过网络环境后出问题，**彻底退出再打开**（不是 Reload Window）——Cursor 会继承之前的 DNS 等环境。
4. 「模型不可用」多半是提供方的地区限制，改用 **Auto**。
5. 以上都不行，**导出日志 + 复制 Request ID** 去官方论坛反馈，不要反复重装。

## 一、Connection failed（连接失败）

完整提示通常是 *Connection failed. If the problem persists, please check your internet connection or VPN*。按下面的顺序查：

1. **网络诊断**：Cursor Settings → Network → Run Diagnostics，看哪一项失败。
2. **HTTP/2 被拦**：Cursor 用 HTTP/2 做流式响应，官方点名 Zscaler 这类企业代理会拦它。把 HTTP Compatibility Mode 改成 HTTP/1.1，重启。
3. **防火墙白名单**：公司防火墙限制出站连接时，需要放行官方列出的域名：`*.cursor.sh`、`*.cursor-cdn.com`、`*.cursorapi.com`（用 Grok Bot 还要 `*.cursorvm.com` 和 `*.*.cursorvm.com`）。把这份清单交给 IT 即可。
4. **切换网络后 DNS 失效**：官方说明 Cursor 可能继承之前网络工具留下的 DNS 设置。完全退出 Cursor 再打开；还不行就检查系统 DNS 是否恢复（macOS 运行 `scutil --dns`，Linux 看 `/etc/resolv.conf`）。
5. **确认不是本机断网**：浏览器打开 cursor.com 试一下。

## 二、suspicious activity（可疑活动）

这是安全机制拦截了请求，官方说明某些网络出口会触发它。处理顺序：先关掉这类网络工具换正常线路；不行就开一个新对话；等几分钟再试；最后换一种登录方式（Google 或 GitHub）重新登录。

## 三、high demand（请求高峰）

提示 *We're experiencing high demand right now. Please try again in a few moments* 时，问题通常不在你这边。官方帮助中心没有为它单独写条目，可以做的事有三件：过几分钟重试；在模型选择器里换一个模型，或改用 Auto；到 Dashboard 的 Spending 页确认不是自己的额度用完了（额度用完的提示是另一种通知，见[《Cursor 额度与套餐》](/guides/cursor-usage-limits-plans)）。

## 四、模型不可用、列表里找不到

官方解释：部分模型因为**模型提供方**的地区限制而不提供，此时它们不会出现在 Cursor 里。办法：

- 用 **Auto**——所有地区可用，会自动选一个可用的模型；
- 换另一家提供方的模型；
- 自带 API Key（提供方不服务你所在地区时同样会失败）。

另外，很多旧型号默认隐藏，要到 Cursor Settings → Models 手动打开。详见[《Cursor 模型选择》](/guides/cursor-model-selection-auto)。

## 五、Agent Execution Timed Out

官方解释：Cursor 的扩展宿主（extension host）没能在 60 秒内启动完成，Agent 功能因此无法初始化；在网络诊断里同一个问题会显示为 *Timeout waiting for EverythingProvider*。原因不止一种，官方要求**先收集日志再动手改**：

1. `Ctrl+Shift+P`（macOS `Cmd+Shift+P`）运行 **Developer: Export Logs...**；
2. 勾选 **Main**、**Window**、**Extension Host**；
3. 再打开 Output 面板，下拉选 **Extension Host**——如果是空的，截个图，官方说空面板本身就是很强的诊断信号；
4. 把导出的 zip、截图、系统和 Cursor 版本一起发给官方支持。

在公司管理的电脑上，杀毒或 EDR 类安全软件是可能的原因之一，官方有专门的《Endpoint Security Configuration》页面给 IT 加排除项。

## 六、登录不上

官方帮助页（核对当天）写明：Cursor 的登录页正在迁移到 `accounts.spacex.ai` 和 `accounts.x.ai`，取代原来的 `authenticator.cursor.sh`。如果公司网络拦了新域名，目前会回退到旧登录页，但这个回退是临时的，**10 月 30 日停用后必须能访问新域名**。用白名单防火墙的团队，官方建议直接放行通配符：`*.spacex.ai`、`*.x.ai`、`*.grok.com`、`*.grokusercontent.com`。

## 七、通过 SSH 远程开发时 AI 不工作

官方说明：用 Remote SSH 时，AI 功能运行在**你本地的机器**上，再和远程服务器通信读写文件。所以：

1. 先查本地网络——AI 请求是从你本机发往 Cursor 服务器的，不是从远程主机；
2. 看远程服务器内存、CPU 是否耗尽，资源耗尽会让连接掉线；
3. SSH 经常断，在 SSH 配置里加保活：

```text
Host your-server
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

4. 重连后重启 Cursor，掉线的会话可能留下残留进程。

## 八、其他常见问题速查

| 现象 | 官方处理办法 |
| --- | --- |
| Tab 不出建议 | 免费档月度额度用完 / HTTP/2 被拦 / 版本太旧 / 没联网，见[《Cursor Tab 补全》](/guides/cursor-tab-completion) |
| 启动白屏 | 完全退出重开；Windows 以管理员身份运行；macOS 重新下载安装 |
| macOS 提示「已损坏」 | 是 macOS 的问题而非下载损坏：结束残留进程后重开，或删除重装 |
| Agent 读不到某些文件 | 查 `.cursorignore`、`.gitignore`，命令面板里 Reindex，或用 `@文件名` 直接挂上 |
| 项目命令在 Agent 终端里行为不同 | Agent 跑命令时设置了 `CI=1`，命令前加 `unset CI &&` |
| MCP 服务器连不上 | 输出面板选 MCP Logs，见[《Cursor MCP 配置教程》](/guides/cursor-mcp-config-json) |
| 硬盘被占满 | 命令面板先 **Delete Old Chats…** 再 **GC Agent KV Blobs** |

## 怎么向官方反馈

1. 在出问题的那条回答底部点 **...** → **Copy Request ID**；
2. 到官方论坛 forum.cursor.com 发帖，附上 Request ID、复现步骤和系统信息（macOS 在 Cursor → About Cursor，Windows / Linux 在 Help → About）。

Request ID 能让官方直接定位到那一次请求，比一句「用不了」有用得多。发帖前记得把截图里的项目路径、密钥等信息打码。

## 参考资料

- Network, proxy, and remote connections（官方帮助中心）：https://cursor.com/help/troubleshooting/network
- Agent troubleshooting（官方帮助中心）：https://cursor.com/help/troubleshooting/agent-issues
- Installation and startup（官方帮助中心）：https://cursor.com/help/troubleshooting/install-issues
- How do I troubleshoot Tab completions?（官方帮助中心）：https://cursor.com/help/troubleshooting/tab-issues
- Which domains does Cursor sign-in need?（官方帮助中心）：https://cursor.com/help/troubleshooting/sign-in-domains
- Available models（官方帮助中心）：https://cursor.com/help/models-and-usage/available-models
