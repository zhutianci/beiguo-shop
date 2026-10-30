---
title: Codex 报错 502 怎么办：官方没单独说明，状态页、网络与自定义提供方的排查顺序
slug: codex-502-bad-gateway-error
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 提示 502 或 Bad Gateway？官方文档没有单独解释 502。本文按官方对服务端错误的通用建议，列出先看状态页、稍后重试、换网络对比、检查自定义提供方、提交反馈的顺序，并说明哪些话官方没说过。
checkedOn: 2026-10-30
sources:
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://developers.openai.com/api/docs/guides/error-codes
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
  - https://status.openai.com/
verify:
  - OpenAI 官方 API 错误码文档列了 500、503，没有 502 条目；Codex 排查页也没有写 502。本文不把 502 解释成某个具体原因
  - 「502 在 HTTP 里通常指网关从上游拿到了无效响应」是通用网络常识，不是 OpenAI 对这条报错的官方解释
  - 重试默认次数（HTTP 请求 4 次、流式 5 次）来自 Codex 配置参考，用于说明报错前 Codex 已经自动重试过
---

> 本文根据 Codex 官方排查页、OpenAI API 错误码文档和帮助中心的网络建议整理，资料核对于 2026-10-30。**官方没有单独解释 502**，所以本文写的是官方对「服务端错误」的通用做法，不对 502 的原因下结论。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex（桌面 App、命令行或 IDE 扩展）里看到 `502`、`Bad Gateway` 的人；
- 同一条消息反复 502、不知道该等还是该改设置的人；
- 自己在 config.toml 里配了第三方地址的人。

## 结论先说

1. **先看状态页** [status.openai.com](https://status.openai.com/)。官方在网络建议的第一步就是先排除系统性故障，有进行中的事件就只能等。
2. **偶发的先等一会儿再试。** 官方 API 文档对 500 的建议是「稍等后重试，持续出现再联系官方」；502 虽然没写，同属服务端一侧的错误，做法相近。
3. **只在某个网络下出现，换手机热点对比。** 官方网络建议最后一步就是区分「只有这台电脑」还是「整个网络」。
4. **用了自定义提供方或网关**，502 可能来自你填的那个地址，先查它。
5. 都不是就**提交反馈**：在 Codex 输入框输入 `/`，提交后会得到 session ID，官方要求把它给团队。

![Codex 502：先对照这张表](seed:g1352-502-decide.png)
*图：本站根据 [OpenAI 帮助中心：网络建议](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 与 [API 错误码](https://developers.openai.com/api/docs/guides/error-codes) 整理的示意图*

## 502 是什么意思，官方说了什么

**官方没有说。** OpenAI 的错误码文档列出了 400、401、403、429、500、503，没有 502。Codex 的排查页讲的是卡住的对话、日志位置、反馈方式，也没有 502。

502 是 HTTP 的通用状态码，一般表示「中间的网关或代理从后面的服务器拿到了不能用的回答」。这是网络常识，不是 OpenAI 对 Codex 这条报错的解释。所以能确定的只有一点：**请求在到达最终结果之前，在某一层出了问题**，这一层是不是 OpenAI 的服务，单看这个数字判断不了。

## 一、先排除官方故障

打开状态页，看 Codex、ChatGPT 相关组件有没有正在处理的事件。怎么读状态页见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。有事件就等，不要在这段时间里反复重发或反复重装，那样既解决不了问题，也容易让一轮任务白白消耗额度。

## 二、稍后重试，别连发

Codex 本身会自动重试：配置参考里，HTTP 请求默认最多重试 4 次，流式连接中断默认重试 5 次。你看到 502 报错时，往往已经是它重试之后的结果。这时再手动连点，意义不大。官方的做法是**等一会儿**。同类的「连接中途断开」见 [/guides/codex-stream-disconnected-before-completion](/guides/codex-stream-disconnected-before-completion)。

## 三、网络与安全软件

官方帮助中心的网络建议是按顺序排查：

1. 把 OpenAI / ChatGPT 的域名加入白名单，确认网页过滤没有返回奇怪的内容；
2. 允许 WebSocket 流量（443 端口，`wss://chatgpt.com/` 等），否则 Codex 的流式输出可能中途停住；
3. 检查防火墙、网关、杀毒软件，别拦截 ChatGPT（包括拦截 cookie）；
4. 区分是你这台机器的问题，还是整个网络的问题，换成手机热点对比。

![遇到 502 的处理顺序](seed:g1352-502-steps.png)
*图：本站根据 [Codex 官方排查页](https://learn.chatgpt.com/docs/reference/troubleshooting) 与帮助中心整理的示意图*

## 四、自定义提供方或网关

官方配置文档允许在 `config.toml` 里用 `[model_providers.<id>]` 配第三方地址。这种情况下，请求先到你填的 `base_url`，502 完全可能是那一方产生的。先用同一个地址在别的工具里试，或者暂时去掉 `model_provider`、回到官方登录再试一次，就能分清。配置方法见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok)。

## 五、反馈时带什么

- 完整报错原文、出现时间；
- `codex --version` 的版本号；
- 输入 `/` 提交反馈后得到的 session ID；
- 日志在 `~/.codex/sessions`，贴出去之前先检查有没有路径、密钥等敏感信息。

不要贴令牌、密钥。更多 Codex 报错的对照见 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)。

## 常见问题

**Q：502 和 503 有区别吗？**
官方只写了 503（模型暂时过载，等待后重试），见 [/guides/codex-503-service-unavailable-error](/guides/codex-503-service-unavailable-error)；502 官方没有说明。

**Q：额度用完会报 502 吗？**
官方把额度用尽放在 429 一类，见 [/guides/codex-exceeded-retry-limit-429-too-many-requests](/guides/codex-exceeded-retry-limit-429-too-many-requests)。需要更多额度可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Codex 官方排查页 — https://learn.chatgpt.com/docs/reference/troubleshooting
- OpenAI API 错误码 — https://developers.openai.com/api/docs/guides/error-codes
- OpenAI 帮助中心：网络建议 — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
- OpenAI 状态页 — https://status.openai.com/
