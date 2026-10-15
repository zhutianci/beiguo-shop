---
title: Codex 无法登录、无法发送消息、无法连接怎么办：ChatGPT 账号还是 API 密钥登录，官方排查步骤
slug: codex-cannot-sign-in-send-message-connect
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 登录不了或发不出消息？按官方文档：它支持 ChatGPT 账号和 API 密钥两种登录，云端只能用 ChatGPT；邮箱密码账号要先开 MFA；退出登录、被管理员限制、网络不放行 WebSocket 都会导致连不上。本文按顺序对照排查，并附 CLI 的安装和更新命令。
checkedOn: 2026-10-14
sources:
  - https://learn.chatgpt.com/docs/auth
  - https://learn.chatgpt.com/docs/codex/cli
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
  - https://help.openai.com/en/articles/8265053-what-is-chatgpt-enterprise
  - https://help.openai.com/en/articles/20001147-codex-credits-for-students-terms-of-service
verify:
  - 官方文档没有一篇专门讲「Codex 登不上」的文章，本文把认证文档、CLI 文档、排查文档和网络建议里相关的说法合在一起，不是官方统一的排查流程
  - 官方文档没有列出「无法发送消息」「无法连接」的具体报错文字，本文对「发不出消息」只写官方给的卡住处理和网络要求，不对具体报错作解释
  - 桌面 App 登录页的按钮名称（Continue、Sign in another way）来自官方认证文档，中文名称以实际界面为准
  - 官方 CLI 页给出的安装和更新命令是同一条（macOS 和 Linux）；Windows、npm 和 Homebrew 的命令见站内 Codex 入门文章，以官方为准
---

> 本文根据 Codex 官方文档《Authentication》《Codex CLI》《Troubleshooting》、OpenAI 帮助中心《Network recommendations for ChatGPT errors on web and apps》《What is ChatGPT Enterprise?》整理，资料核对于 2026-10-14。官方文档里没有专门的「登不上」页面，也没有适用的界面截图，配图为本站整理的示意图。Codex 本身是什么、怎么装，见 [/guides/codex-getting-started](/guides/codex-getting-started)。

## 适用于谁

- 打开 Codex（桌面 App、CLI 或 IDE 扩展）却登录不了的人；
- 登录了但发不出消息、一直转圈的人；
- 在公司电脑上用，登录后又被自动退出，或连不上的人；
- 想知道「用 ChatGPT 账号」和「用 API 密钥」哪种方式适合自己的人。

## 结论先说

1. **Codex 有两种登录方式**：官方说，使用 OpenAI 模型时，可以 **Sign in with ChatGPT**（走订阅额度）或 **Sign in with an API key**（按量计费）。桌面 App、CLI 和 IDE 扩展两种都支持；**Codex 云端只能用 ChatGPT 登录**。
2. **ChatGPT 登录会打开浏览器**：在桌面 App、CLI 或 IDE 扩展里选 ChatGPT 登录，会弹出浏览器窗口，你登录后，浏览器把凭据交还给 Codex。桌面 App 的未登录界面上，选 **Continue** 走浏览器流程。
3. **API 密钥登录**：桌面 App 的未登录界面上选 **Sign in another way**，输入密钥，再选 **Continue**。API 密钥的用量按 OpenAI Platform 账号、标准 API 价格计费，不使用 ChatGPT 套餐里包含的额度；部分依赖 ChatGPT 工作区或云端服务的功能受限或不可用。
4. **邮箱密码账号要先开 MFA 才能用 Codex 云端**：官方说，用邮箱和密码登录的账号，必须先设置多重验证（MFA）才能访问 Codex 云端；用 Google、Microsoft、Apple 登录的不强制，但可以在登录服务商那边设置；用 SSO 的，由组织的 SSO 管理员强制 MFA。
5. **退出后要重新登录**：官方说登录信息会被缓存并重复使用，CLI 和 IDE 扩展共用同一份缓存；任一边退出，下次启动另一边也要重新登录。
6. **公司环境里，认证只是一层**：官方说，对受管理的工作区，工作区成员资格和账号开通决定谁能登录，席位和角色决定能用哪些功能。

![Codex 的两种登录方式：用 ChatGPT 登录和用 API 密钥登录](seed:g905-codex-signin-methods.png)
*图：本站根据 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

## 一、怎么登录、怎么确认登录了谁

按官方说明：

- **桌面 App**：未登录界面选 **Continue** 走 ChatGPT 浏览器登录，或选 **Sign in another way** 输入 API 密钥；
- **CLI**：在项目目录里运行 `codex`，第一次运行时选择 **Sign in with ChatGPT** 或其他可用的登录方式；
- **看当前账号**：打开**头像菜单**，可以看到当前登录的账号或 API 密钥的状态；点 **Log out** 清除当前凭据；
- **工作区**：如果你的 ChatGPT 账号属于多个工作区，确认登录时选对了；用 ChatGPT 登录时，Codex 的使用遵循你的 ChatGPT 工作区权限和角色权限控制。

官方还补充：用 API 密钥适合程序化的 CLI 工作流，比如 CI/CD 任务；但**不要在不受信任或公开的环境里开放 Codex 的执行**。

### CLI 安装和更新

官方 CLI 页面给出的 macOS 和 Linux 安装命令是：

```
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

官方页面上更新用的是**同一条命令**。Windows、npm、Homebrew 的安装和更新方式，见 [/guides/codex-getting-started](/guides/codex-getting-started)，以官方文档为准。官方排查文档还提到：ChatGPT 桌面 App 和 Codex CLI 可能带着不同版本的 Codex，所以某个功能可能先到一边；查看 CLI 版本用 `codex --version`。

## 二、登不上，按这个对照

![Codex 登不上或发不出消息的对照表：登录方式、退出登录、MFA、管理员限制、网络](seed:g905-codex-signin-problems.png)
*图：本站根据 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 与 [OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 整理的示意图*

### 1. 先弄清用的是哪种登录方式

- 想用 ChatGPT 套餐的额度，选 **Sign in with ChatGPT**；
- 想用 Codex 云端，**必须**用 ChatGPT 登录，API 密钥不行；
- 用 API 密钥登录后看不到某些功能，是官方说的限制，不是故障。

### 2. 邮箱密码账号：先开 MFA

官方说，如果你的账号支持多种登录方式，且其中一种是邮箱和密码，那么**即使你用另一种方式登录，也必须先设置 MFA 才能访问 Codex**。设置方法见 [/guides/chatgpt-authenticator-app-setup-lost-phone](/guides/chatgpt-authenticator-app-setup-lost-phone) 和 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)。

### 3. 登出后又要重新登录

官方说登录信息会缓存在本地：`~/.codex/auth.json`，或系统的凭据存储里；CLI 和 IDE 扩展共用。用 ChatGPT 登录的会话，Codex 会在使用中自动在令牌过期前刷新，所以活跃的会话通常不会要求你重新走浏览器登录。如果你在任何一边退出了登录，下一次启动另一边就要重新登录。官方提醒：**如果凭据存在 auth.json 里，要像对待密码一样对待它**，它含有访问令牌，不要提交到仓库、贴进工单或发到聊天里。

### 4. 公司电脑上被自动登出

官方说，在受管理的环境里，管理员可以限制登录方式（只允许 ChatGPT 登录或只允许 API 密钥登录），也可以限制 ChatGPT 登录必须使用某个指定工作区；**如果当前凭据不符合配置的限制，Codex 会把用户登出并退出**。这时要问你的管理员，用哪种方式、哪个工作区登录。

### 5. 只能用 Codex，用不了 ChatGPT（或相反）

官方的 Enterprise 说明里写了：Enterprise 里可能有 **Codex 席位**，只提供 Codex 访问，**不包含 ChatGPT**；被分配了 Codex 席位的人想去访问 ChatGPT，会被告知席位类型不支持。席位由工作区所有者或管理员分配，**你自己改不了**。企业版和团队版的区别见 [/guides/chatgpt-enterprise-vs-business-team](/guides/chatgpt-enterprise-vs-business-team)。

## 三、发不出消息、连接时断时续

官方没有给出「无法发送消息」的专门报错说明，下面是官方文档里与之相关的几条：

### 对话卡住不动

官方排查文档里「Stuck states and recovery patterns」的做法：

1. 看 **Codex 是不是在等你批准**；
2. 打开终端，运行一个基础命令，比如 `git status`；
3. **新开一个对话**，用更小、更聚焦的提示；
4. 如果取消了创建 worktree 的操作弄丢了提示，在输入框里按**向上键**可以找回。

终端卡住：关掉终端面板，用 **Ctrl+`** 重新打开，再运行 `pwd` 或 `git status` 这类基础命令；仍然卡住，等当前对话都完成后重启 App。

### 网络问题

官方《Network recommendations for ChatGPT errors on web and apps》说明了对 Codex 的网络要求：

- ChatGPT 和 Codex 的部分功能除了普通 HTTPS 请求，还使用**安全 WebSocket 连接**；如果你的网络默认拦截 WebSocket 流量，部分功能可能停住、断开或无法流式更新；
- 需要允许 **TCP 443 端口上的 WebSocket 流量**，让代理、防火墙或安全网关放行标准的「Upgrade: websocket」握手；Codex 对应的目标是 `wss://chatgpt.com/`（用于 Codex 模型采样和流式传输），ChatGPT 对话更新用的是 `wss://ws.chatgpt.com`；
- 如果代理或防火墙不能按路径放行，就允许到 chatgpt.com 的 WebSocket 升级；
- 使用 TLS 检查、SSL 解密、网页过滤的网络，要确认这些控制没有阻断、改写或过早关闭 WebSocket 握手或长连接；连接上了但之后停滞，要检查空闲超时和 WebSocket 的最大帧或消息大小策略；
- 官方还列出了需要放行的域名，包括 `*.chatgpt.com`、`*.openai.com`、`chat.openai.com` 等。

这些主要给公司的 IT 部门看。个人用户碰到「公司网络下连不上」，可以做官方推荐的两个检查：是只有你一个人的电脑出问题，还是网络里其他人也一样？把公司 WiFi 换成手机热点后，问题会不会消失？

### 收集信息反馈

官方说，在消息输入框里输入 `/` 可以向团队提交反馈；反馈后你会收到一个会话 ID，可以提供给团队。日志位置（官方列出的）：macOS 应用日志 `~/Library/Logs/com.openai.codex/YYYY/MM/DD`；会话转写 `$CODEX_HOME/sessions`；归档会话 `$CODEX_HOME/archived_sessions`。**分享日志前先检查，确保里面没有敏感信息。**

![Codex 对话卡住不动时官方建议的 4 步：看审批、运行简单命令、新开对话、重开终端](seed:g905-codex-stuck-recovery.png)
*图：本站根据 [Codex 官方文档：Troubleshooting](https://learn.chatgpt.com/docs/reference/troubleshooting) 整理的示意图*

## 常见问题

**Q：我有 ChatGPT Plus，Codex 要不要另外开通？**
官方（Codex 学生额度的说明）里写 Codex 是你 ChatGPT 账号的一部分，不需要单独的账号；用 ChatGPT 登录就用你套餐里的额度。额度规则见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：用 API 密钥登录，要付多少钱？**
官方说按标准 API 价格，通过你的 OpenAI Platform 账号计费，具体价格见官方 API 价格页。ChatGPT 订阅和 API 是两套计费，见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)。

**Q：CLI 和桌面 App 的登录是同一个吗？**
官方说，CLI 和 IDE 扩展共用缓存的登录信息；桌面 App 也支持同样的两种登录方式。具体是否与桌面 App 共享缓存，官方这篇没有写。

**Q：怎么退出登录？**
打开头像菜单，点 Log out，会清除当前凭据。

**Q：Codex 登录时需要手机号吗？**
官方认证文档没有写；手机号相关设置见 [/guides/chatgpt-change-phone-number](/guides/chatgpt-change-phone-number)。

**Q：登录页提示账号问题，怎么办？**
先按 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems) 排查 ChatGPT 账号本身的登录问题；联系官方客服见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。

## 参考资料

- Codex 文档：Authentication — https://learn.chatgpt.com/docs/auth
- Codex 文档：Codex CLI — https://learn.chatgpt.com/docs/codex/cli
- Codex 文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
- OpenAI 帮助中心：What is ChatGPT Enterprise? — https://help.openai.com/en/articles/8265053-what-is-chatgpt-enterprise
