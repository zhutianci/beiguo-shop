---
title: 「似乎 chatgpt.com 关闭了连接」怎么办：浏览器连接被中途关闭，官方的网络排查与放行要求
slug: chatgpt-com-closed-the-connection
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 打开 ChatGPT 时浏览器提示 chatgpt.com 关闭了连接？官方帮助中心没有收录这句提示，但有网络类问题的排查：关 VPN 和代理、对比手机热点、放行官方域名和 WebSocket、检查 TLS 检查。本文按官方说明整理。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
verify:
  - 官方没有收录「chatgpt.com 关闭了连接」这句提示，它是浏览器自己生成的页面提示；本文把它按官方网络类问题处理，是推断
  - 官方放行域名清单很长，本文只列代表项，完整清单以官方文章当天为准
  - 官方没有说明这个提示和 VPN 的具体关系
---

> 本文根据 OpenAI 帮助中心《Network recommendations for ChatGPT errors on web and apps》《Troubleshooting ChatGPT Error Messages》整理，资料核对于 2026-10-30。**官方没有收录这句提示**，下面是官方对网络类问题的通用处理。配图为本站整理的示意图。

## 适用于谁

- 打开 chatgpt.com，浏览器页面直接写「关闭了连接」的人；
- 只在公司、学校或某个固定网络下出现的人；
- 想知道要不要联系 IT 的人。

## 结论先说

1. **这句话是浏览器的提示，不是 ChatGPT 页面里的报错。** 意思是连接在建立过程中被关闭了，官方的网络排查文章讨论的正是这一类「网络配置问题」。
2. **先看状态页** [status.openai.com](https://status.openai.com/)，官方有故障时很多人同时遇到。
3. **个人排查**：关闭 VPN、代理和 Web Protect 等安全过滤，换浏览器或无痕窗口，换网络或设备。
4. **最关键的对比**：官方说，要先弄清楚是**只有你的这台机器**还是**整个网络**都这样，再对比**公司 WiFi 和手机热点**。热点正常，就说明问题出在原来的网络。
5. **网络层面的原因**，官方点名的是：安全软件或网关直接拦截 ChatGPT（包括拦截 Cookie）、域名没有放行、TLS 检查或代理阻断、WebSocket 被提前关闭。这些要管理员处理。

![「chatgpt.com 关闭了连接」：只有你、整个网络、热点对比、状态页、联系客服](seed:g1325-connection-closed-decide.png)
*图：本站根据 [OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 整理的示意图*

## 一、给管理员的官方要求

官方文章写给「管理公司 WiFi 的 IT 部门」，要点如下：

![官方的放行要求：域名、WebSocket、TLS 检查、空闲超时、安全软件、对比测试](seed:g1325-admin-allowlist-compare.png)
*图：本站根据 [OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 整理的示意图*

- **域名**：确保没有被拦截，也没有被网址过滤返回意外内容，官方清单里包括 `*.chatgpt.com`、`*.openai.com`、`*.oaiusercontent.com`、`challenges.cloudflare.com` 等；
- **WebSocket**：放行 TCP 443 上的 WebSocket，目的地是 `wss://ws.chatgpt.com`（ChatGPT 的对话更新与通知），Codex 另有一条 `wss://chatgpt.com/`；
- **TLS 检查、SSL 解密、代理**：确认它们不会阻断、改写或提前关闭握手和后续的长连接；
- **官方点名的常见安全软件**包括 McAfee Web Gateway、Cisco Umbrella、Symantec 云网关、Palo Alto、Zscaler、Sophos、Barracuda、Fortiguard；
- 连上后又断开：检查**空闲超时**和消息大小限制。

你不是管理员的话，把这一段发给管理员即可。

## 二、几种相关情形

- **macOS 桌面版提示 Network configuration issue、证书不对**：官方说是网络上的 SSL 检查或解密导致，尽量对 OpenAI 的公开域名关闭 SSL 检查；暂时用网页版绕开；
- **iPhone 提示 Unusual activity**：官方有单独步骤，见 [/guides/chatgpt-unusual-activity-detected-from-your-device](/guides/chatgpt-unusual-activity-detected-from-your-device)；
- **反复重新连接**：见 [/guides/chatgpt-keeps-reconnecting](/guides/chatgpt-keeps-reconnecting)；
- **页面空白、一直加载**：见 [/guides/chatgpt-cant-open-loading](/guides/chatgpt-cant-open-loading)；
- 更多网络类提示的处理见 [/guides/chatgpt-network-error](/guides/chatgpt-network-error)。

## 三、联系官方客服

以上都做过后联系官方，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。官方说，客服看网络问题时，最想要的是**复现过程、截图和 HAR 文件**，用来判断问题是否出在你这边的网络。

## 官方没说的

- 官方**没有**解释这句浏览器提示本身；
- 官方**没有**给出「关闭连接」一般多久恢复；
- 官方通用步骤是**关闭** VPN 和代理，没有说换地区网络出口能解决，本文不介绍绕开地区限制的做法。

## 常见问题

**Q：换手机热点就好了，是 ChatGPT 的问题吗？**
说明问题在原来的网络，不在 ChatGPT 本身。

**Q：我自己能改路由器吗？**
官方这篇文章是写给 IT 部门的；家用网络没有管理员，按本文的个人排查走一遍，并用手机热点对比。

## 参考资料

- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
