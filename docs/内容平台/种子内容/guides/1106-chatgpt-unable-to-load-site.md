---
title: ChatGPT 提示「Unable to load site」打不开怎么办：空白页、一直加载的官方通用排查
slug: chatgpt-unable-to-load-site
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 提示 Unable to load site，或者页面一片空白？官方帮助中心没有收录这句话，但有空白页、卡住、一直加载的通用步骤：强制刷新、退出重登、清站点数据、关扩展和 VPN。本文按官方顺序排好。
checkedOn: 2026-10-27
sources:
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
  - https://help.openai.com/en/articles/9047779-why-is-my-chatgpt-taking-so-long-to-respond
verify:
  - 官方帮助中心没有收录「Unable to load site」这句原文，也没有说明它的确切含义；正文只引用官方对「空白页、卡住、一直加载」的通用步骤
  - 官方文章里的站点数据示例写的是 chat.openai.com，现在官网域名是 chatgpt.com，清除站点数据时两个都清更稳妥，这一条是本文的建议，不是官方原话
  - 官方文章没有写需要等多久再判断是否打不开
  - 官方文章页面只显示相对的更新时间
---

> 本文根据 OpenAI 帮助中心《Troubleshooting ChatGPT Error Messages》《Network recommendations for ChatGPT errors on web and apps》《Why is my ChatGPT taking so long to respond?》整理，资料核对于 2026-10-27。**官方没有收录「Unable to load site」这句话，**本文给的是官方对空白页、卡住和一直加载的通用排查。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 打开 ChatGPT，页面只显示 **Unable to load site**（中文大意：无法加载网站）的人；
- 页面一片空白、一直转圈、按钮点不动的人；
- 想知道从哪一步开始排查的人。

## 结论先说

1. **官方没有这句话的专门说明。** 官方有一条针对「**空白页、冻结页、一直加载**」的通用排查，可以直接套用。
2. **官方顺序**：**强制刷新**（或开无痕窗口）→ **退出登录再登录**并**清除站点数据** → 关闭**扩展和内容拦截器** → 关闭 **VPN 和安全过滤** → 换**浏览器、网络或设备**。
3. **手机热点能打开、家里或公司不行**，问题在原来的网络，官方建议管理员放行 OpenAI 的域名。
4. **先看官方状态页**，有事件就等恢复，见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。
5. **仍然不行**，收集 HAR 文件和控制台错误后联系官方客服。

![Unable to load site：看到什么、对应怎么办的对照表](seed:g1106-load-decide.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 一、官方的通用步骤

官方《Troubleshooting ChatGPT Error Messages》对「空白页、冻结页、无尽加载」写的处理（没有指出具体原因）：

1. **强制刷新**，或者强制重新加载；
2. **退出登录再重新登录**；
3. **清除 chat.openai.com 的站点数据**（官方文章写的是这个域名）；
4. **关闭扩展和内容拦截器**；
5. 试**无痕窗口**，或**换一个浏览器**；
6. **关闭 VPN 和安全过滤**；
7. 如果仍然不行，**收集日志和 HAR 文件后联系客服**。

官方在《Why is my ChatGPT taking so long to respond?》里也有相近步骤：用 **Shift + 刷新**做硬刷新，或者开启关闭了扩展的无痕窗口；退出再登录，并清除站点数据，而不只是清缓存；换一个模型再新开对话，判断是模型问题还是整个账号的问题。

## 二、按顺序做

### 1. 强制刷新

电脑浏览器里，按住 **Shift** 再点刷新，或者用无痕窗口重新打开官网。手机 App 里就关闭再打开。

### 2. 退出登录，清站点数据

退出登录后再登录。清除站点数据，官方示例写的是 **chat.openai.com**；现在官网网址是 chatgpt.com，把两个站点的数据都清掉更稳妥（这一条是本文建议，不是官方原话）。注意清除后会退出登录，要记得你的登录方式，见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

### 3. 扩展和拦截器

关闭**拦截脚本、广告拦截、修改页面内容**的扩展，特别是对 ChatGPT 页面起作用的。无痕窗口默认关闭大多数扩展，是最快的验证办法。

### 4. 网络

- 关闭 **VPN、代理和安全过滤**；
- 换一个网络，例如手机热点；
- 公司或学校网络，请管理员按官方网络建议检查域名放行、WebSocket、TLS 检查等，具体见 [/guides/chatgpt-network-error](/guides/chatgpt-network-error)。

![页面打不开的官方排查顺序：强制刷新、退出登录、关扩展、关 VPN、换网络、联系客服](seed:g1106-load-steps.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 整理的示意图*

## 三、只有桌面版或手机 App 出现

- 桌面版打不开、更新后打不开，见 [/guides/chatgpt-desktop-app-wont-open-update](/guides/chatgpt-desktop-app-wont-open-update)；
- 手机 App 的官方做法见 [/guides/chatgpt-app-crash-troubleshooting](/guides/chatgpt-app-crash-troubleshooting)；
- 网页版能打开、App 不行，说明问题在 App 本身或它的网络环境，先更新 App，再换网络。

## 四、联系官方客服

官方说，持续出现时，联系客服前先收集：**HAR 文件**、浏览器**控制台错误**、请求 ID、时间戳和相关网址。入口见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。已有的类似文章：打不开、一直转圈的更多情况见 [/guides/chatgpt-cant-open-loading](/guides/chatgpt-cant-open-loading)。

## 五、官方没说的

- 这句话**具体是网络、浏览器还是服务器的问题**，官方没有说；
- **要等多久才算打不开**，官方没有给时间；
- 官方通用步骤里没有「换地区网络」，反而要求**关闭** VPN。本文不介绍绕开地区限制的做法；如果你所在的地区不在官方支持名单，见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)。

## 常见问题

**Q：强制刷新是什么意思？**
在电脑浏览器里按住 Shift 再点刷新，让页面重新从服务器取数据。官方在排查文章里用了这个做法。

**Q：为什么无痕窗口能打开，普通窗口不行？**
无痕窗口默认关闭大多数扩展，也没有旧缓存。说明问题多半出在扩展、缓存或站点数据，按第二节第 2、3 步处理。

**Q：手机热点能打开，家里 Wi-Fi 不行？**
说明问题在家里的网络环境，检查路由器、代理、VPN 和安全软件，或联系网络提供方。

**Q：怎么确认是不是官方故障？**
看 [status.openai.com](https://status.openai.com/)，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

## 参考资料

- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
- OpenAI 帮助中心：Why is my ChatGPT taking so long to respond? — https://help.openai.com/en/articles/9047779-why-is-my-chatgpt-taking-so-long-to-respond
