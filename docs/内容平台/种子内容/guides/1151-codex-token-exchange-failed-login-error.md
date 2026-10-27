---
title: Codex 登录报「Token exchange failed」怎么办：浏览器登录成功却回不到 Codex，设备码、回调端口与公司证书逐项排查
slug: codex-token-exchange-failed-login-error
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 登录时浏览器显示成功，回到 Codex 却报 Token exchange failed？官方没有单独解释这条报错，但认证文档给了几条出路：设备码登录、转发 1455 回调端口、设置公司根证书、查看 codex-login.log。本文按官方文档整理排查顺序。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/auth
  - https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
  - https://learn.chatgpt.com/docs/config-file/environment-variables
  - https://status.openai.com/
verify:
  - 官方文档没有单独解释「Token exchange failed」，本文没有断言它由什么原因造成，只列官方认证文档里「浏览器登录不好使时」的几种做法
  - 设备码登录官方标注为 beta，是否可用取决于账号设置和工作区权限，界面按钮和设置项名称以实际为准
  - 报错中出现的 auth.openai.com 属于帮助中心网络建议文章里要放行的 *.auth.openai.com 域名，但官方没有把二者明确对应起来
---

> 本文根据 Codex 官方文档《Authentication》、环境变量文档和 OpenAI 帮助中心网络建议文章整理，资料核对于 2026-10-27。**官方没有专门解释 Token exchange failed 这条报错**，本文写的是官方文档里「浏览器登录不顺利时」的做法。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex 桌面 App、命令行 CLI 或 IDE 插件里点了登录，浏览器已经显示登录成功，回到 Codex 却提示登录失败、`token_exchange_failed` 的人；
- 在远程服务器、虚拟机、没有浏览器的环境里装 Codex，登录不了的人；
- 公司网络、有代理的网络里登录不了的人。

## 结论先说

1. **先换登录方式试一次**：在命令行里运行 `codex login --device-auth`（设备码登录，官方标注 beta）。官方认证文档说，浏览器登录界面可能不好使的两种情况是——在远程或无头环境里运行，以及**你的网络配置阻止了 Codex 用来接收登录令牌的 localhost 回调**；这两种情况官方都推荐设备码。
2. **设备码选项没有出现**，要先在 ChatGPT 的安全设置（个人账号）里开启设备码登录；工作区账号由管理员在工作区权限里开。
3. **想继续用浏览器登录、但机器在远程**：先在本机用 `ssh -L 1455:localhost:1455 用户@远程主机` 把回调端口转发过来，再在这个 SSH 会话里运行 `codex login`。
4. **公司网络有 TLS 代理**：登录前把 `CODEX_CA_CERTIFICATE` 设为公司根证书的 PEM 文件路径。
5. **还不行**：看 `codex-login.log`，并检查官方状态页 [status.openai.com](https://status.openai.com/)。

![Codex 登录失败：按情况选方案](seed:g1151-login-decide.png)
*图：本站根据 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

## 报错原文怎么读

在公开的问题反馈里能看到这类写法（不同版本、不同平台文字略有差异）：

```text
Login failed
token_exchange_failed
Token exchange failed: error sending request for url (https://auth.openai.com/oauth/token)
```

按字面意思：**登录的第二步，拿浏览器返回的授权码去换令牌（token）时失败了**。冒号后面的 `error sending request for url` 说明这次请求没有成功发出或没有收到回应。官方认证文档介绍登录流程是：运行登录后会打开浏览器窗口，登录完成后浏览器把凭据返回给 Codex。**这个「返回」靠的是本机的回调端口**（文档里写的默认是 `localhost:1455`），所以回调被网络配置挡住时，官方明确推荐换设备码。至于你这一次具体是哪一环出错，官方文档没有写，本文也不替官方下结论。

## 一、设备码登录：最先试的办法

官方认证文档里的步骤（本站转述）：

1. 在 ChatGPT 安全设置（个人账号）或 ChatGPT 工作区权限（工作区管理员）里**开启设备码登录**；
2. 在运行 Codex 的终端里，二选一：在交互式登录界面选 **Sign in with Device Code**，或直接运行 `codex login --device-auth`；
3. 在浏览器打开终端里给出的链接，登录，然后输入一次性代码。

![设备码登录 4 步](seed:g1151-device-code-steps.png)
*图：本站根据 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

官方还说明：如果设备码登录在你的环境里也不能用，就用下面的两个备用办法。

## 二、两个备用办法

### 办法 A：在有浏览器的机器上登录，再复制登录缓存

1. 在能打开浏览器登录的机器上运行 `codex login`；
2. 确认登录缓存文件 `~/.codex/auth.json` 已生成；
3. 把它复制到无头机器的同一路径 `~/.codex/auth.json`。

官方给的 SSH 复制写法：

```shell
ssh user@remote 'mkdir -p ~/.codex'
scp ~/.codex/auth.json user@remote:~/.codex/auth.json
```

**`auth.json` 里是访问令牌，要当成密码对待**：不要提交到代码仓库，不要贴进工单或聊天。如果你的系统把登录信息存进了系统凭据库而不是这个文件，这个办法可能不适用，存储位置由配置项 `cli_auth_credentials_store` 决定（`file`、`keyring`、`auto`、`ephemeral`）。

### 办法 B：转发 localhost 回调端口

如果本机和远程主机之间能做端口转发，可以继续用标准的浏览器登录：

```shell
ssh -L 1455:localhost:1455 user@remote
```

然后在这个 SSH 会话里运行 `codex login`，按终端打印的地址在本机浏览器里完成登录。

## 三、有 TLS 代理或私有根证书

公司网络会解密再转发 HTTPS 流量时，Codex 需要信任公司的根证书。官方认证文档「Custom CA bundles」一节：登录之前把 `CODEX_CA_CERTIFICATE` 设为 PEM 证书包路径；没设置时 Codex 退而使用 `SSL_CERT_FILE`；同样的设置对登录、普通 HTTPS 请求和安全 WebSocket 连接都生效。官方环境变量文档也列了这两个变量，并写明 `CODEX_CA_CERTIFICATE` 优先于 `SSL_CERT_FILE`。

```shell
export CODEX_CA_CERTIFICATE=/path/to/corporate-root-ca.pem
codex login
```

证书文件要向公司 IT 要。官方文档没有给 Windows PowerShell 的写法，不要把 export 直接粘进 PowerShell。

## 四、网络要放行哪些地址

OpenAI 帮助中心「Network recommendations」文章给 IT 部门列了需要放行的域名，其中包括 `*.auth.openai.com`、`*.chatgpt.com`、`*.openai.com` 等；还写明如果有网页过滤，要确认没有返回意外内容。报错里的地址是 `auth.openai.com` 的话，把这篇官方文章发给 IT 最直接。同一篇文章里的「怎么知道是不是网络的问题」也值得先做：只有你这一台出问题还是整个网络都这样；把电脑切到手机热点后问题是否消失。详细对照见 [/guides/codex-stream-disconnected-before-completion](/guides/codex-stream-disconnected-before-completion)。

## 五、其他会让登录失败的情况

这几条在站内已有文章，不重复展开，见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)：

- 邮箱密码登录的账号，必须先开启多重验证（MFA）才能用 Codex 云端；
- 之前在 CLI 或插件里退出过登录，需要重新登录，因为 CLI 和插件共用同一份登录缓存；
- 被工作区管理员用 `forced_login_method`、`forced_chatgpt_workspace_id` 限制了登录方式或工作区，凭据不匹配时 Codex 会登出并退出。

## 六、收集日志再反馈

直接运行 `codex login` 时，Codex 会在日志目录下写一个专门的 `codex-login.log`，官方说它用来排查浏览器登录或设备码登录失败，也是官方支持要登录日志时要的东西。分享日志前先检查，别带上密钥或令牌。可以到 GitHub 的 [openai/codex](https://github.com/openai/codex/issues) 看有没有相同问题。

## 常见问题

**Q：用 API 密钥登录会不会绕过这个问题？**
官方认证文档说 Codex 支持 ChatGPT 账号和 API 密钥两种登录方式，命令行用 `printenv OPENAI_API_KEY | codex login --with-api-key`。API 密钥按 API 标准价格计费，不使用 ChatGPT 套餐里包含的额度，部分依赖 ChatGPT 工作区的功能会受限。是否适合你，要看自己的需求。

**Q：怎么确认现在登录的是什么？**
命令行运行 `codex login status`；桌面 App 和 IDE 插件打开个人资料菜单可以看到当前账号或 API 密钥状态。

**Q：登录好了，但额度不够用？**
见 [/guides/codex-usage-limits](/guides/codex-usage-limits)，想开通 ChatGPT Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：是不是官方服务出问题了？**
先看状态页，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

## 参考资料

- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth
- Codex 官方文档：Environment variables — https://learn.chatgpt.com/docs/config-file/environment-variables
- OpenAI 帮助中心：Network recommendations for ChatGPT errors on web and apps — https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
- OpenAI 状态页 — https://status.openai.com/
