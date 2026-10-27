---
title: Codex 报错 401 Unauthorized 怎么办：登录状态、API 密钥、自定义模型提供方与 WSL 登录缓存的排查
slug: codex-401-unauthorized-error
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 提示 401 Unauthorized，字面意思是服务端不认你的登录凭据。官方没有单独解释这条报错，但认证文档写清了登录方式、缓存位置、API 密钥和自定义提供方的用法。本文按官方文档给出从 codex login status 开始的排查顺序。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/auth
  - https://learn.chatgpt.com/docs/config-file/config-reference
  - https://learn.chatgpt.com/docs/config-file/environment-variables
  - https://learn.chatgpt.com/docs/windows/windows-app
  - https://status.openai.com/
verify:
  - 官方文档没有单独解释「401 Unauthorized」这条报错，本文没有断言它在某一次出现时由哪个原因造成，只列官方认证文档里和凭据有关的做法
  - 401 在 HTTP 里的含义（凭据缺失或无效）是通用的 HTTP 常识，不是 Codex 文档里的表述
  - 命令名称和配置项来自官方文档当天的写法，Windows PowerShell 下 printenv 命令是否可用，官方没有说明，文中只照抄官方给的写法
---

> 本文根据 Codex 官方文档《Authentication》、配置参考、环境变量文档和 Windows 应用文档整理，资料核对于 2026-10-27。**官方没有专门解释 401 这条报错**。401 是通用的 HTTP 状态码，字面意思是「未授权」，一般指服务端没收到有效的登录凭据。本文列的是官方文档里与登录凭据有关的做法。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex 里发消息或启动时看到 `401 Unauthorized`、`unexpected status 401 Unauthorized` 的人；
- 之前能用，某天开始就报 401 的人；
- 在 Windows 和 WSL 两边都装了 Codex，一边正常一边报错的人；
- 自己配置了第三方或公司网关作为模型提供方的人。

## 结论先说

1. **先确认现在登录的是什么。** 命令行运行 `codex login status`，官方说它会显示当前的认证方式。桌面 App 和 IDE 插件在个人资料菜单里能看到当前账号或 API 密钥状态。
2. **重新登录一次。** `codex logout` 清除当前凭据，再 `codex login` 在浏览器里完成登录。桌面 App 选 **Log out**，再重新登录。
3. **用 API 密钥的人**，密钥要从 OpenAI 平台的 API 密钥页面获取，并用官方给的写法传入，见下文。
4. **Windows 和 WSL 两边都装了**，要知道两边的登录缓存默认不共享。
5. **自己配了模型提供方的人**，401 多半出在 `env_key` 或认证方式的配置上。
6. **都不行**，看官方状态页，并收集 `codex-login.log` 反馈。

![Codex 401：先对照这张表](seed:g1153-401-decide.png)
*图：本站根据 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

## 报错原文怎么读

```text
unexpected status 401 Unauthorized
```

意思是服务端对 Codex 发出的请求回了 401，也就是不接受请求里带的凭据。凭据可能是你的 ChatGPT 登录令牌，也可能是 API 密钥，或者你自己配置的第三方服务的密钥。**所以第一步永远是弄清楚 Codex 用的是哪一种凭据。** GitHub 的 openai/codex 问题列表里有不少以 401 为题的反馈，说明不少人遇到过，但官方文档没有逐条解释。

## 一、确认登录方式，然后重新登录

官方认证文档说，Codex 在使用 OpenAI 模型时支持两种登录方式：用 ChatGPT 账号登录（走订阅），或用 API 密钥登录（按用量计费）。桌面 App、命令行和 IDE 插件都支持这两种；Codex 云端只能用 ChatGPT 登录。

![重新登录 Codex 的 3 步](seed:g1153-relogin-steps.png)
*图：本站根据 [Codex 官方文档：Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

各入口的官方写法：

| 入口 | 查看当前状态 | 登出 | ChatGPT 登录 |
| --- | --- | --- | --- |
| 命令行 | `codex login status` | `codex logout` | `codex login` |
| 桌面 App | 个人资料菜单 | **Log out** | 登录页点 **Continue to sign in** |
| IDE 插件 | 个人资料菜单 | **Log out** | 登录页点 **Sign in with ChatGPT** |

官方还写明：登录信息会被缓存并复用，命令行和插件共用同一份；**在其中一个里登出，下次启动命令行或插件就需要重新登录**。ChatGPT 登录的令牌，Codex 在使用中会在到期前自动刷新，正常情况下不需要反复登录。缓存位置是 `~/.codex/auth.json` 或系统的凭据库，具体由 `cli_auth_credentials_store` 决定。`auth.json` 里是访问令牌，要当成密码保管，不要提交、不要贴进聊天。

## 二、用 API 密钥登录时

官方写法（命令行）：从标准输入把密钥交给登录命令。

```shell
printenv OPENAI_API_KEY | codex login --with-api-key
```

桌面 App 在未登录界面选 **Sign in another way**，输入密钥后点 **Continue**；IDE 插件选 **Use API Key**，输入后点 **OK**。API 密钥到 OpenAI 平台的 API 密钥页面获取。官方提醒：API 密钥登录按标准 API 价格计费，不使用 ChatGPT 套餐里包含的额度，依赖 ChatGPT 工作区或云服务的功能会受限。密钥失效、被删除或没有可用的账户余额，都属于要到 OpenAI 平台账户页面去检查的范围，不在 Codex 文档的讨论里。

非交互场景里，官方环境变量文档列了 `CODEX_API_KEY`（给 `codex exec` 等非交互进程提供 API 密钥）和 `CODEX_ACCESS_TOKEN`（给受信任的自动化提供访问令牌，要持久登录就用 `codex login --with-access-token`）。

## 三、Windows 和 WSL 两边的登录缓存不共享

官方 Windows 应用文档写明：Windows 桌面 App 使用和原生 Windows 版 Codex 相同的主目录 `%USERPROFILE%\.codex`；如果同时在 WSL 里运行命令行，命令行默认用 Linux 的主目录，**不会自动共享配置、登录缓存和会话历史**。想共享，有两个办法：同步两个 `.codex` 目录，或在 WSL 里设置 `CODEX_HOME`：

```bash
export CODEX_HOME=/mnt/c/Users/<windows-user>/.codex
```

写进 `~/.bashrc` 或 `~/.zshrc` 就能对每个终端生效。如果 WSL 里报 401，而 Windows 上正常，先在 WSL 里单独登录一次，或者用上面的办法让两边指向同一目录。

## 四、自己配置了模型提供方

在 `config.toml` 里定义自定义模型提供方后，官方认证文档列了几种认证方式：

- `requires_openai_auth = true`：使用 OpenAI 的认证，之后可以用 ChatGPT 或 API 密钥登录，适用于经过 LLM 代理访问 OpenAI 模型；
- `env_key = "环境变量名"`：从本机名为该变量的环境变量里读取该提供方的 API 密钥；
- 两者都不设置：Codex 认为该提供方不需要认证，适合本地模型。

官方配置参考还说明：`auth` 命令式认证**不要**与 `env_key`、`experimental_bearer_token` 或 `requires_openai_auth` 混用；直接把令牌写进 `experimental_bearer_token` 是不推荐的，应使用 `env_key`。出 401 时，先确认 `env_key` 指向的环境变量在启动 Codex 的那个终端里确实已设置、值是该服务的有效密钥，再确认没有同时配置多种认证。第三方模型怎么配，见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok) 和 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。

## 五、管理员限制登录方式或工作区

官方认证文档「Enforce a login method or workspace」一节：在受管环境里，管理员可以用 `forced_login_method` 规定只能用 ChatGPT 登录或只能用 API 密钥登录，用 `forced_chatgpt_workspace_id` 限定工作区。**如果当前凭据与这些限制不符，Codex 会让用户登出并退出。** 遇到这种情况，要换成符合要求的登录方式，具体问管理员。

## 六、仍然不行

- 看 [status.openai.com](https://status.openai.com/)，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)；
- 命令行直接运行 `codex login` 时会写 `codex-login.log`，官方说明这是官方支持排查登录问题时要的日志；分享前先检查，别带上密钥；
- 登录方面的更多排查见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect) 和 [/guides/codex-token-exchange-failed-login-error](/guides/codex-token-exchange-failed-login-error)。

## 常见问题

**Q：是不是我的 Plus 过期了？**
订阅状态在 ChatGPT 账号设置里看，套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。官方文档没有把 401 和订阅到期联系在一起。想重新开通可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：重新登录后马上又 401？**
先 `codex login status` 看实际生效的认证方式，再检查是否有环境变量或配置在覆盖登录，例如自定义提供方的 `env_key`、被管理员强制的登录方式。

**Q：登出会丢对话吗？**
官方认证文档只说登出会清除当前凭据，没有说会清除会话记录；会话记录保存在 `$CODEX_HOME/sessions`，默认 `~/.codex/sessions`。

## 参考资料

- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth
- Codex 官方文档：Configuration Reference — https://learn.chatgpt.com/docs/config-file/config-reference
- Codex 官方文档：Environment variables — https://learn.chatgpt.com/docs/config-file/environment-variables
- Codex 官方文档：ChatGPT desktop app for Windows — https://learn.chatgpt.com/docs/windows/windows-app
- OpenAI 状态页 — https://status.openai.com/
