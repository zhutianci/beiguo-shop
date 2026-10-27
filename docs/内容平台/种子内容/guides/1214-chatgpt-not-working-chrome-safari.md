---
title: ChatGPT 在 Chrome、Safari 里打不开怎么办：无痕窗口、扩展、Private Relay 和站点数据的官方排查
slug: chatgpt-not-working-chrome-safari
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 只在 Chrome 或 Safari 里打不开？官方没有按浏览器分别写，但有空白页和网络类的通用排查：无痕窗口、清缓存和站点数据、关扩展和内容拦截器、关 VPN 与 Private Relay、换浏览器和网络。本文按官方顺序整理。
checkedOn: 2026-10-28
sources:
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
  - https://help.openai.com/en/articles/10471992-why-am-i-receiving-a-suspicious-activity-alert
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
verify:
  - 官方帮助中心没有按浏览器（Chrome、Safari）分别写排查，正文是官方通用步骤；按浏览器的拆分是本站整理，开头已说明
  - Private Relay 是官方在可疑活动提醒文章里列出需要关闭的项目之一，不是针对 Safari 打不开的专门说明
  - 官方文章里站点数据示例写的是 chat.openai.com，现在官网是 chatgpt.com，清除时两个都清更稳妥，这是本文建议
  - 官方没有写各浏览器的最低版本要求
---

> 本文根据 OpenAI 帮助中心《Troubleshooting ChatGPT Error Messages》《Why am I receiving a ‘Suspicious Activity Alert’?》《Network recommendations for ChatGPT errors on web and apps》整理，资料核对于 2026-10-28。**官方没有按浏览器分别写排查，**本文把官方的通用步骤按 Chrome 和 Safari 的情形整理，哪些是官方原话、哪些是本站整理，文中有标注。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- ChatGPT 在 Chrome 里打不开、一直转圈或空白的人；
- 在 Safari（Mac 或 iPhone）里打不开的人；
- 换了浏览器就正常，想知道原因的人。

## 结论先说

1. **先开无痕窗口**：无痕窗口默认关闭大部分扩展，能最快判断是不是扩展、缓存的问题。
2. **官方通用顺序**：强制刷新 → 退出登录再登录并**清除站点数据** → 关闭**扩展和内容拦截器** → 关闭 **VPN 和安全过滤** → 换**浏览器、网络或设备**。
3. **只有 Chrome 不行**：重点查扩展（脚本拦截、广告拦截、修改页面的）、缓存和站点数据。
4. **只有 Safari 不行**：重点查 **Private Relay**、VPN 和内容拦截器，再清站点数据。官方把 Private Relay 列在需要关闭的项目里（在可疑活动提醒文章里）。
5. **换个浏览器就正常**：问题在原浏览器的扩展、缓存或站点数据，不在 ChatGPT 或你的网络。
6. **所有浏览器都不行**：是网络或设备的问题，关 VPN 和代理、换网络，公司网络请管理员检查。

![Chrome、Safari 打不开：对照表](seed:g1214-browser-decide.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 一、官方的通用顺序

官方对「页面空白、冻结、一直加载」的步骤：

1. **强制刷新**，或强制重新加载；
2. **退出登录再重新登录**；
3. **清除站点数据**；
4. **关闭扩展和内容拦截器**；
5. 试**无痕窗口**，或**换浏览器**；
6. **关闭 VPN 和安全过滤**；
7. 仍然不行，收集日志和 HAR 文件后联系客服。

官方对 **There was a problem preparing your chat** 的说明是：浏览器扩展或网址拦截器干扰了页面加载，办法是关闭拦截脚本或修改内容的扩展，或换无痕窗口、换浏览器。

## 二、按浏览器的重点

### Chrome

1. **开无痕窗口**登录：能打开，说明是扩展或缓存；
2. 回到普通窗口，**逐个关闭扩展**，先关**脚本拦截、广告拦截、内容修改**类；
3. **清除缓存、Cookie 和站点数据**（chatgpt.com 和 chat.openai.com 都清更稳妥）；
4. 关闭 VPN 和代理。

### Safari（Mac 和 iPhone）

1. **用 Safari 的私密浏览**打开，判断是不是扩展或缓存；
2. **关闭 Private Relay、VPN** 和内容拦截器，官方在可疑活动提醒文章里，把 Private Relay、VPN、代理、浏览器扩展、自动化工具列为需要关闭的项目；
3. **清除网站数据**，重新登录；
4. iPhone 上还可以改用官方 App，手机 App 的排查见 [/guides/chatgpt-app-crash-troubleshooting](/guides/chatgpt-app-crash-troubleshooting)。

具体菜单位置因系统和浏览器版本而异，官方没有写，以你设备上的实际界面为准。

![浏览器里打不开的官方排查顺序](seed:g1214-browser-steps.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 三、所有浏览器都不行

多半是网络或设备的问题：

- **关闭 VPN、代理和安全过滤**；
- **换一个网络**，例如手机热点；
- **公司或学校网络**：请管理员按官方网络建议检查域名放行、WebSocket、TLS 检查，见 [/guides/chatgpt-network-error](/guides/chatgpt-network-error)；
- **看状态页**：[status.openai.com](https://status.openai.com/)，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

## 四、联系官方客服

仍然不行，联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。官方建议带上：账号邮箱、截图、第一次出现的时间（带时区）、浏览器和系统版本，以及 HAR 文件和控制台错误。页面类问题的更多处理见 [/guides/chatgpt-unable-to-load-site](/guides/chatgpt-unable-to-load-site) 和 [/guides/chatgpt-cant-open-loading](/guides/chatgpt-cant-open-loading)。

## 官方没说的

- 官方**没有**写各浏览器的最低版本；
- 官方**没有**针对 Chrome 或 Safari 的专门步骤，上面的拆分是本站整理；
- 官方通用步骤让你**关闭** VPN，没有说换地区能解决，本文不介绍绕开地区限制的做法；
- 如果你所在的地区不在官方支持名单，那是官方不支持，见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)。

## 常见问题

**Q：为什么 Edge 或 Firefox 能开，Chrome 不能？**
通常是 Chrome 里的扩展、缓存或站点数据，按第二节处理。

**Q：清除站点数据会退出登录吗？**
会，需要重新登录，登录方式见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

**Q：Safari 一直转圈怎么办？**
先关 Private Relay 和 VPN，再清网站数据，仍然不行换浏览器或 App。

**Q：要不要重装浏览器？**
官方没有这样建议，先按本文顺序做。

## 参考资料

- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- OpenAI 帮助中心：Why am I receiving a ‘Suspicious Activity Alert’? — https://help.openai.com/en/articles/10471992-why-am-i-receiving-a-suspicious-activity-alert
- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
