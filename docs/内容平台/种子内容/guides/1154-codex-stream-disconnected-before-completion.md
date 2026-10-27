---
title: Codex 报「stream disconnected before completion」怎么办：连接中途断开的 5 个排查方向（WebSocket、代理证书、状态页）
slug: codex-stream-disconnected-before-completion
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 回答到一半报 stream disconnected before completion？官方没有逐字解释，但帮助中心写明 Codex 流式输出走 wss://chatgpt.com/ 的 WebSocket，被网络或代理拦掉会中断。本文给出排查顺序。
checkedOn: 2026-10-27
sources:
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
  - https://learn.chatgpt.com/docs/auth
  - https://learn.chatgpt.com/docs/config-file/config-reference
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://status.openai.com/
verify:
  - 官方文档没有单独解释「stream disconnected before completion」这句报错，本文没有断言它一定由哪个原因造成，只列官方文档里和「流式连接中断」相关的要求与配置项
  - stream_max_retries 默认 5、stream_idle_timeout_ms 默认 300000 是官方配置参考里「自定义模型提供方」的字段，只对 model_providers 下自定义的提供方写明，用 ChatGPT 账号登录的默认连接是否适用，官方没有写
  - wss://chatgpt.com/ 的放行要求来自帮助中心「Network recommendations」文章，域名清单会更新，以官方文章最新版为准
---

> 本文根据 OpenAI 帮助中心《Network recommendations for ChatGPT errors on web and apps》、Codex 官方文档（认证、配置参考、排查）整理，资料核对于 2026-10-27。**官方没有专门解释这条报错**，所以本文写的是官方文档里与「连接中途断开」相关的做法，不是官方对这句话的逐字说明。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex（桌面 App、命令行 CLI 或 IDE 插件）里让它干活，回答到一半弹出 `stream disconnected before completion`，任务被打断的人；
- 只在公司网络、学校网络、有代理的网络里出现这个问题的人；
- 想知道「是官方服务故障还是我这边网络」的人。

## 结论先说

按下面的顺序试，前两步 1 分钟就能做完：

1. **先看官方状态页** [status.openai.com](https://status.openai.com/)。Codex 相关的组件有进行中的事件，就等官方处理，别折腾自己的电脑。状态页怎么读见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。
2. **把电脑切到手机热点再试一次。** 官方在「How do I know my network is the issue」一节写了两个必查项：问题是只在你这台电脑，还是同一网络的同事都这样；以及从公司 WiFi 换成手机热点后错误是否消失。换网络就好了，问题就在原来的网络。
3. **网络是公司或学校的，就把官方的 WebSocket 要求发给 IT。** 帮助中心写明：ChatGPT 和 Codex 的部分功能除普通 HTTPS 外还用安全 WebSocket；Codex 的模型采样和流式输出用的是 `wss://chatgpt.com/`，需要放行 TCP 443 上的 WebSocket 升级握手。
4. **有 TLS 检查、SSL 解密或代理的网络**：官方要求确认这些设备没有拦截、改写或提前关闭 WebSocket 握手和随后的长连接。命令行 CLI 如果走公司的 TLS 代理，要设置 `CODEX_CA_CERTIFICATE`。
5. **都排除后再向官方反馈**，附上日志。

![Codex 连接中断时的对照表：看到什么、怎么办](seed:g1154-disconnect-decide.png)
*图：本站根据 [OpenAI 帮助中心：Network recommendations](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 与 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

## 报错原文怎么读

完整的提示常常是这个形状（后面的地址和原因因人而异）：

```text
stream disconnected before completion: error sending request for url (...)
```

按字面意思：**回答是一边生成一边传给你的「流」，这条流在结束之前就断了**。冒号后面如果带 `error sending request for url`，说明请求发出去的环节就失败了。官方文档没有给这句话下定义，GitHub 的 openai/codex 问题列表里能搜到不少以这句开头的反馈，它说明不少人遇到过，但不是官方的解释，下面的步骤只采用官方文档写明的做法。

## 一、先分清：服务问题，还是自己的网络

官方帮助中心的建议是在排查网络前，**先看状态页**有没有系统性的故障。接着做两个对比：

| 检查 | 怎么做 | 说明什么 |
| --- | --- | --- |
| 只是我，还是整个网络 | 问问同一网络里的同事是否也断线 | 同网络的人都断，网络策略的嫌疑大 |
| 公司 WiFi 还是手机热点 | 同一台电脑切换网络再试 | 换网络后恢复，就是原网络的问题 |

![判断是服务问题还是自己的网络，4 步](seed:g1154-network-steps.png)
*图：本站根据 [OpenAI 帮助中心：Network recommendations](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 整理的示意图*

## 二、公司或学校网络：让 IT 放行什么

帮助中心「WebSocket requirements for ChatGPT and Codex」一节写的要点（文字是本站转述）：

- 如果组织默认阻止 WebSocket 流量，一些功能会卡住、断开，或者没法持续接收更新；
- 需要放行 **TCP 443** 上的 WebSocket，并确保代理、防火墙或安全网关允许标准的 `Upgrade: websocket` 握手；
- 对应关系：ChatGPT 对话更新用 `wss://ws.chatgpt.com`，**Codex 的模型采样和流式输出用 `wss://chatgpt.com/`**；
- 如果防火墙没法按 URL 路径放行，就放行到 `chatgpt.com` 的 443 端口 WebSocket 升级，用于 Codex 流量；
- 用了 TLS 检查、SSL 解密、网页过滤或强制代理的，要确认它们没有阻止、改写或过早关闭握手和之后的长连接；**如果会话能连上，之后又卡住或断开，要检查 WebSocket 的空闲超时和最大帧或消息大小策略。**

这几条是写给 IT 部门的，个人用户改不了公司的防火墙。把本文和官方文章的链接发给 IT，比自己折腾更快。

## 三、有代理或 TLS 检查：命令行里设置证书

官方认证文档「Custom CA bundles」一节：如果你的网络使用公司的 TLS 代理或私有根证书，在登录前把环境变量 `CODEX_CA_CERTIFICATE` 设为一个 PEM 证书包；没设置时，Codex 会退而使用 `SSL_CERT_FILE`。**同一套自定义 CA 设置会用于登录、普通 HTTPS 请求和安全 WebSocket 连接。** 官方给的写法：

```shell
export CODEX_CA_CERTIFICATE=/path/to/corporate-root-ca.pem
codex login
```

证书文件从哪来，要问你们公司的 IT。这条命令是官方原样给出的，Windows PowerShell 的写法官方文档没有给，不要照抄 export。

## 四、用了自定义模型提供方：看重试和空闲超时

如果你在 `config.toml` 里配置了 `model_providers` 下自定义的模型提供方（比如公司网关、第三方服务），官方配置参考里和流式连接有关的字段有：

- `stream_max_retries`：SSE 流式输出被打断后的重试次数，默认 5；
- `request_max_retries`：对提供方的 HTTP 请求重试次数，默认 4；
- `stream_idle_timeout_ms`：流式输出的空闲超时，单位毫秒，默认 300000；
- `supports_websockets`：该提供方是否支持 Responses API 的 WebSocket 传输。

官方的示例配置里把重试次数调到了更大的值（`stream_max_retries = 10`）。这些字段是写给「自己接模型服务」的人的，用 ChatGPT 账号直接登录的普通用户不需要动它们。自定义提供方怎么配，见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok)。

## 五、任务卡住不动，和「断开」不是一回事

官方排查文档对「卡住」的建议，也适合先自查：

1. 看 Codex 是不是在等你批准某个操作；
2. 打开终端，运行 `git status` 这样的基本命令，确认环境正常；
3. 开一个新对话，用更小、更聚焦的提示重新开始。

任务很长、一次要求改很多文件时，连接中断造成的损失也更大，把任务拆小是最省事的办法。

## 六、反馈时带上什么

在输入框里输入 `/` 可以向官方提交反馈，提交后会拿到一个会话 ID。也可以先到 GitHub 的 [openai/codex](https://github.com/openai/codex/issues) 搜有没有相同的问题。官方列出的日志位置：

- 会话记录：`$CODEX_HOME/sessions`，默认是 `~/.codex/sessions`；
- macOS 应用日志：`~/Library/Logs/com.openai.codex/年/月/日`；
- 命令行登录日志：直接运行 `codex login` 时会写入单独的 `codex-login.log`。

分享日志之前先自己看一遍，确认里面没有密钥、令牌或项目机密。

## 常见问题

**Q：换了网络就好了，是不是 OpenAI 屏蔽了我的网络？**
官方文档没有这么说。官方写的是：公司网络上的安全软件可能拦截或改写 WebSocket 流量，需要放行相关域名。是否能用 ChatGPT 取决于所在地区是否在官方支持范围内，见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)。

**Q：断了以后要重新开始吗？**
官方文档没有写这条报错之后会话是否自动续传。发生后先看已有的输出和文件改动，再让 Codex 接着做，或用 `git diff` 查看已经改了什么，见 [/guides/codex-getting-started](/guides/codex-getting-started)。

**Q：是不是额度用完了？**
额度用完会有明确的额度提示，和这条连接报错不是同一类，额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。想开通 ChatGPT Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：登录都有问题怎么办？**
先看 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)。

## 参考资料

- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth
- Codex 官方文档：Configuration Reference — https://learn.chatgpt.com/docs/config-file/config-reference
- Codex 官方文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
- OpenAI 状态页 — https://status.openai.com/
