---
title: Cursor 报错「User is unauthorized」怎么办：官方员工给的排查顺序，以及怎么取到 Request ID 反馈
slug: cursor-user-is-unauthorized-error
products: [cursor]
models: []
accountTier: FREE
excerpt: Cursor 里发消息时提示 User is unauthorized，官方帮助中心没有单独说明。本文整理官方论坛里员工的回复：先检查有没有自定义 Base URL、退出重新登录并完全重启，仍不行就用 Report AI Action 取新的 Request ID 反馈；邮箱域名被拦截的情况官方怎么说。
checkedOn: 2026-10-31
sources:
  - https://forum.cursor.com/t/how-to-fix-user-is-unauthorized/149798
  - https://forum.cursor.com/t/how-to-fix-user-is-unauthorized/50494
  - https://cursor.com/help/troubleshooting/network
verify:
  - 官方帮助中心没有这条报错的单独条目，下面的做法来自官方论坛里 Cursor 员工的回复，不是正式文档
  - 员工关于「邮箱域名在拦截名单」的说法来自 2025 年 2 月和 3 月的回复，现在的策略是否变化官方没有再说明
  - 报错 JSON 里的 ERROR_UNAUTHORIZED 与 isRetryable false 是用户贴出的报错内容，含义以官方为准
---

> **官方帮助中心没有单独说明「User is unauthorized」。** 本文整理官方论坛里 Cursor 员工对这条报错的回复，资料核对于 2026-10-31。论坛回复不是正式文档，具体以你遇到的情况和官方客服的回复为准。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Cursor 的 Chat、Agent 或 Composer 里发消息时，看到 **Unauthorized request. User is unauthorized**（未授权请求）的人；
- 已经付费订阅，却突然被这条报错挡住的人。

## 结论先说

1. 报错里常见的格式是 `ERROR_UNAUTHORIZED`，并带一个 Request ID。用户贴出的报错显示 `isRetryable` 为 false，意思是**重试同样的操作通常不会自己好**。
2. **官方员工 2026 年 1 月给的排查顺序**：
   - Cursor Settings → Models，检查有没有设置**自定义 Base URL**，有就删掉；
   - Cursor Settings → General → **Sign Out**，退出再重新登录；
   - **完全退出并重启** Cursor。
3. 仍然不行，把 Models 设置页的截图和**新的 Request ID**发给官方。取 ID 的方法见下文。
4. 官方员工在 2025 年的回复里还提到另一类原因：**账号邮箱的域名在拦截名单里**（官方称是因为某些临时邮箱类域名被滥用）。如果你认为是误拦，官方让你发邮件说明。
5. 本文不提供绕过这种拦截的办法。

![Cursor：User is unauthorized](seed:g1463-unauth-decide.png)
*图：本站根据 [Cursor 官方论坛员工回复](https://forum.cursor.com/t/how-to-fix-user-is-unauthorized/149798) 整理的示意图*

## 一、按顺序排查

| 步骤 | 做法 | 出处 |
| --- | --- | --- |
| 1 | Cursor Settings → Models，查看是否填了自定义 Base URL（例如接入第三方接口时填的），有就删除 | 官方员工回复 |
| 2 | Cursor Settings → General → Sign Out，再登录 | 官方员工回复 |
| 3 | 完全退出 Cursor（macOS 用 Cmd+Q，Windows 和 Linux 从托盘退出）再打开 | 官方员工回复，退出方式与帮助中心安装页一致 |
| 4 | 仍然报错：取新的 Request ID，连同 Models 设置截图一起反馈 | 官方员工回复 |

如果你是用自己的 API Key 或第三方接口接入的，自定义 Base URL 就是最常见的来源，设置方法与限制见 [/guides/cursor-bring-your-own-api-key-third-party](/guides/cursor-bring-your-own-api-key-third-party)。

## 二、怎么取 Request ID

![拿到 Request ID 再反馈](seed:g1463-requestid-steps.png)
*图：本站根据 [Cursor 官方论坛员工回复](https://forum.cursor.com/t/how-to-fix-user-is-unauthorized/50494) 整理的示意图*

员工曾回复一位用户：旧的 Request ID 已过期，请重新操作一次并提供新的：

1. 打开命令面板（Mac 是 Cmd+Shift+P，Windows 是 Ctrl+Shift+P）；
2. 输入 **Report AI Action**；
3. 选择刚才失败的那次操作；
4. 复制新的 Request ID。

不要反复发同一个过期的 ID，官方查不到。

## 三、邮箱域名被拦截的情况

2025 年 2 月和 3 月，官方员工在论坛里先后回复过：

- 有账号的邮箱域名在 Cursor 的**拦截名单**里，原因是有用户滥用，官方怀疑那些域名被临时邮箱服务使用；
- 官方建议用常见、可识别的邮箱注册账号；
- **已经买了 Pro 却用不了**，可以发邮件到 hi@cursor.com，官方表示会退款；认为是误拦（你的域名并不是临时邮箱）的，也可以发邮件；
- 官方还说明：**仍在使用临时邮箱服务的，不会为解封做特例**。

需要提醒的是：这只是官方员工对「一部分」报错原因的解释，不能反推所有 User is unauthorized 都是邮箱问题。取消订阅与退款的通用流程见 [/guides/cursor-cancel-subscription-refund](/guides/cursor-cancel-subscription-refund)。

## 常见问题

**Q：我没用临时邮箱，也没设 Base URL，怎么办？**
先走一遍退出、重启，再按上面取新 Request ID 反馈，让官方根据 ID 去查原因。

**Q：和 Connection failed 是一回事吗？**
不是。Connection failed 是网络连接问题，处理办法见 [/guides/cursor-common-errors-connection-failed](/guides/cursor-common-errors-connection-failed)；User is unauthorized 是服务端判定你的请求没有授权。

**Q：登录页就过不去？**
见 [/guides/cursor-cant-verify-user-is-human-login](/guides/cursor-cant-verify-user-is-human-login)。

## 参考资料

- Cursor 官方论坛：How to fix User is unauthorized（2026 年 1 月，员工回复） — https://forum.cursor.com/t/how-to-fix-user-is-unauthorized/149798
- Cursor 官方论坛：How to fix "User is unauthorized"（2025 年，员工回复） — https://forum.cursor.com/t/how-to-fix-user-is-unauthorized/50494
- Cursor 帮助中心：网络、代理与远程连接 — https://cursor.com/help/troubleshooting/network

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。
