---
title: Cursor 登录提示「Can't verify the user is human」怎么办：人机验证失败的常见原因，以及登录域名迁移后的放行清单
slug: cursor-cant-verify-user-is-human-login
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor 登录时提示无法验证用户为真人，官方帮助中心没有这条报错的专门说明。本文整理官方论坛里反馈的常见情形（拦截人机验证请求、密码管理器自动点继续、换浏览器），并按官方帮助页说明 Cursor 登录页正迁移到 accounts.spacex.ai 与 accounts.x.ai，公司网络需要放行。
checkedOn: 2026-10-31
sources:
  - https://cursor.com/help/troubleshooting/sign-in-domains
  - https://cursor.com/help/troubleshooting/network
  - https://forum.cursor.com/t/can-t-verify-the-user-is-human/28329
  - https://forum.cursor.com/t/error-can-t-verify-the-user-is-human-please-try-again/118144
verify:
  - 官方帮助中心没有这条报错的单独条目，「常见情形」来自官方论坛里用户和社区开发者的讨论，不是官方的正式结论
  - 官方论坛的讨论多发生在 2024 至 2025 年，当时的登录页是 authenticator.cursor.sh，现在登录页正在迁移，处理办法是否仍然有效以你实际遇到的为准
  - 登录域名迁移的说明来自帮助页 2026-10-31 读取时的内容，帮助页写回退页将于 10 月 30 日退役，之后的具体表现以官方为准
---

> **官方帮助中心没有单独说明「Can't verify the user is human」这条报错。** 本文把官方论坛里的讨论和官方帮助页的登录域名说明放在一起，资料核对于 2026-10-31。论坛里的做法是用户和社区开发者的反馈，不是官方结论，文中会标出。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 登录 Cursor 时，输入邮箱点「继续」后提示 **Can't verify the user is human. Please try again**（无法验证用户为真人）的人；
- 在公司、学校网络下登录失败，被 IT 要求提供放行域名的人。

## 结论先说

1. 报错一般出现在**登录页的人机验证**这一步，不是账号被封。官方论坛里的讨论普遍指向「验证请求没有成功完成」。
2. 论坛里**反复出现的几种情形**：广告拦截、防火墙、杀毒挡住了验证请求；密码管理器自动填充并替你点了「继续」；注重隐私的浏览器（如 Brave）里验证组件加载不出来，换成 Safari 等常规浏览器后成功。
3. **官方帮助页（2026-10-31 读取）说，Cursor 的登录页正从 authenticator.cursor.sh 迁移到 accounts.spacex.ai 和 accounts.x.ai**，回退到旧页面的做法将于 10 月 30 日退役；如果你的网络有放行名单，需要把新域名加进去。
4. 都试过仍然不行，向官方反馈，附上系统、Cursor 版本和报错截图。

![Cursor 登录提示无法验证为真人](seed:g1462-human-decide.png)
*图：本站根据 [Cursor 帮助中心：登录域名](https://cursor.com/help/troubleshooting/sign-in-domains) 与 [Cursor 官方论坛](https://forum.cursor.com/t/can-t-verify-the-user-is-human/28329) 整理的示意图*

## 一、论坛里反馈的常见情形（社区经验）

| 情形 | 论坛里的做法 |
| --- | --- |
| 广告拦截、防火墙或杀毒拦住了人机验证 | 关掉拦截或暂时放行，再刷新登录页。有社区开发者建议用浏览器开发者工具的 Network 和 Console 看哪些请求失败 |
| 密码管理器自动填充并替你点了「继续」 | 社区开发者观察到这样会触发报错，可改成手动输入，或暂时关闭自动提交 |
| 浏览器里验证组件一直转圈 | 有用户在 Brave 里验证一直转到失败，换 Safari 后成功；换浏览器或无痕窗口试一次 |
| 使用代理类工具 | 论坛里员工曾反问是否在用 VPN，说明它可能影响验证；本文不提供代理设置方法 |

这些只是「别人遇到过的」，不保证对你有效，也别因此长期关闭杀毒或防火墙，试完记得恢复。

## 二、官方说明：登录域名在迁移

![Cursor 登录要放行的域名](seed:g1462-domains.png)
*图：本站根据 [Cursor 帮助中心：登录域名](https://cursor.com/help/troubleshooting/sign-in-domains) 整理的示意图*

帮助页的要点：

- 登录页正迁移到 **accounts.spacex.ai** 和 **accounts.x.ai**，取代 authenticator.cursor.sh；
- Cursor 应用、网站和 SSO 入口继续可用，已登录的会话不会被强制退出；
- 如果 accounts.spacex.ai 或 accounts.x.ai 被你的网络拦截，登录会回退到旧页面，但官方写明**回退是暂时的，10 月 30 日退役后登录需要这两个域名**；
- 公司网络用放行名单时，官方推荐用通配（`*.spacex.ai`、`*.x.ai`、`*.grok.com` 等）；不允许通配时，至少放行 accounts.x.ai、accounts.spacex.ai、auth.x.ai、auth.grok.com、auth.grokusercontent.com、auth.grokipedia.com；
- Cursor 本身需要的域名不变：`.cursor.sh`、`.cursor-cdn.com`、`.cursorapi.com`、`.cursorvm.com`。

个人用户一般不用管这些；如果你是在公司网络里登录失败，把这页发给 IT 就行。网络诊断与代理问题的官方做法见 [/guides/cursor-common-errors-connection-failed](/guides/cursor-common-errors-connection-failed)：在 Cursor Settings 的 Network 里点 Run Diagnostics。

## 三、还是不行怎么办

1. 完全退出 Cursor 再打开，或换到官方网站 cursor.com 的登录入口重试；
2. 换一个网络对比（比如手机热点），判断是不是当前网络的问题；
3. 把系统、Cursor 版本（菜单 About Cursor 里可复制）和报错截图整理好，通过官方渠道反馈；
4. 如果你同时遇到登录后聊天里报 User is unauthorized，是另一类问题，见 [/guides/cursor-user-is-unauthorized-error](/guides/cursor-user-is-unauthorized-error)。

## 常见问题

**Q：这是账号被封了吗？**
官方没有这样说明。报错出现在登录页的人机验证步骤，更像是验证没有完成。

**Q：Cursor 怎么安装、怎么设置中文？**
见 [/guides/cursor-install-chinese-setup](/guides/cursor-install-chinese-setup)，请只从 cursor.com/download 下载。

**Q：Cursor 的订阅和额度？**
见 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)。如果你同时在用 ChatGPT，会员开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Cursor 帮助中心：Which domains does Cursor sign-in need? — https://cursor.com/help/troubleshooting/sign-in-domains
- Cursor 帮助中心：网络、代理与远程连接 — https://cursor.com/help/troubleshooting/network
- Cursor 官方论坛：Can't verify the user is human — https://forum.cursor.com/t/can-t-verify-the-user-is-human/28329
- Cursor 官方论坛：Error: Can't verify the user is human. Please try again — https://forum.cursor.com/t/error-can-t-verify-the-user-is-human-please-try-again/118144

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。
