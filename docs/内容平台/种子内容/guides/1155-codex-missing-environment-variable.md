---
title: Codex 报「missing environment variable」怎么办：env_key、MCP 环境变量、命令读不到变量的官方配置说明
slug: codex-missing-environment-variable
products: [codex, chatgpt]
models: []
accountTier: OTHER
excerpt: Codex 提示缺少环境变量，多半出在自定义模型提供方的 env_key、MCP 服务器的 env_vars 或 shell_environment_policy 上。官方没有单独解释这条报错，本文按官方配置文档说明每个设置的作用和排查顺序。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/config-file/config-advanced
  - https://learn.chatgpt.com/docs/config-file/config-reference
  - https://learn.chatgpt.com/docs/config-file/environment-variables
  - https://learn.chatgpt.com/docs/config-file/config-basic
  - https://learn.chatgpt.com/docs/extend/mcp
verify:
  - 官方文档没有单独解释「missing environment variable」这句报错，也没有给出它的统一原文，本文只说明官方配置里和环境变量有关的几个设置
  - 官方没有给出各操作系统下设置环境变量的具体写法，本文不写 export、setx 等命令，只说明要在启动 Codex 的环境里设置同名变量
  - env_key、env_vars、bearer_token_env_var 等字段名来自官方配置文档当天的写法，之后版本可能调整
---

> 本文根据 Codex 官方配置文档（Advanced Configuration、配置参考、环境变量、Config basics）和 MCP 文档整理，资料核对于 2026-10-27。**官方没有单独解释「missing environment variable」这句报错**，本文说明官方配置里和环境变量有关的设置，帮你对号入座。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 `config.toml` 里配置了第三方或公司网关作为模型提供方，启动时提示缺少某个环境变量的人；
- 配置了 MCP 服务器，提示缺少令牌或密钥的人；
- 让 Codex 运行命令时，命令读不到自己设置的变量的人；
- 在脚本或 CI 里跑 `codex exec` 的人。

## 结论先说

1. **报错点名了一个变量名，就去 `config.toml` 里找它。** 自定义模型提供方的密钥来自 `env_key`：官方写法是 `env_key = "变量名"`，Codex 会读取本机里这个名字的环境变量。**变量名是你自己在配置里决定的，Codex 没有固定的变量名**，所以要保证配置里写的名字和你设置的变量名完全一致。
2. **变量要在启动 Codex 的那个环境里存在。** 在一个终端里设置的变量，通常只对那个终端和它启动的程序可见，用别的方式（比如从图标启动桌面 App、IDE）启动的 Codex 不一定能读到。这是环境变量的通用规则，不是 Codex 文档里的特别说明。
3. **MCP 服务器的变量**用 `env_vars` 声明要转发的变量，令牌变量用 `bearer_token_env_var` 指定名字。
4. **Codex 运行的命令读不到变量**，看 `shell_environment_policy`，它控制传给被启动命令的环境变量。
5. **不要把令牌直接写进配置文件**：官方把 `experimental_bearer_token` 标为不推荐，应使用 `env_key`。

![缺少环境变量：对照官方配置](seed:g1155-env-decide.png)
*图：本站根据 [Codex 官方文档：配置参考](https://learn.chatgpt.com/docs/config-file/config-reference) 与 [环境变量](https://learn.chatgpt.com/docs/config-file/environment-variables) 整理的示意图*

## 一、自定义模型提供方的 env_key

官方认证文档和配置文档里的说法：在 `config.toml` 里定义了自定义模型提供方后，有三种认证方式：

- `requires_openai_auth = true`：使用 OpenAI 的认证，之后用 ChatGPT 或 API 密钥登录，适合经过 LLM 代理访问 OpenAI 模型；
- `env_key = "变量名"`：从本机该名字的环境变量里读取这个提供方的 API 密钥；
- 两者都不设：Codex 认为提供方不需要认证，适合本地模型。

官方的示例配置里，一个提供方写成这样：

```toml
[model_providers.mistral]
name = "Mistral"
base_url = "https://api.mistral.ai/v1"
env_key = "MISTRAL_API_KEY"
```

意思是：Codex 向这个提供方发请求时，会去环境里找名为 `MISTRAL_API_KEY` 的变量，找不到就会提示缺少。官方环境变量文档也明确写了：提供方的密钥变量名是你用 `env_key` 自己选的，不是 Codex 固定读取的变量。配置参考里还有一个可选的 `env_key_instructions`，用来写这个密钥怎么获取的提示。

![给自定义提供方设置密钥变量](seed:g1155-envkey-steps.png)
*图：本站根据 [Codex 官方文档：Advanced Configuration](https://learn.chatgpt.com/docs/config-file/config-advanced) 整理的示意图*

**不要混用认证方式**：官方配置参考写明，命令式认证（`auth` 表，用命令输出令牌）不要和 `env_key`、`experimental_bearer_token`、`requires_openai_auth` 同时使用。第三方模型怎么接入，见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok) 和 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。

## 二、MCP 服务器的环境变量

官方 MCP 文档里，STDIO 类服务器的几个与环境有关的选项：

- `env`：给服务器设置的环境变量；
- `env_vars`：允许并转发给服务器的环境变量，可以写变量名，也可以写带来源的对象，官方示例：`env_vars = ["LOCAL_TOKEN", { name = "REMOTE_TOKEN", source = "remote" }]`；
- HTTP 类服务器还有 `bearer_token_env_var`（放在 `Authorization` 里发送的令牌变量名）和 `env_http_headers`（请求头名到环境变量名的映射，值从环境里取）。

提示缺少 MCP 用的变量时，对照你的 MCP 配置，看它引用了哪个变量名，再确认启动 Codex 的环境里有同名变量。MCP 的完整配置见 [/guides/codex-mcp-config](/guides/codex-mcp-config)。

## 三、命令读不到变量：shell_environment_policy

这是另一种「缺少变量」：Codex 在沙箱里运行命令时，命令里的程序读不到你以为存在的变量。官方说明，`shell_environment_policy` 控制 Codex 传给被启动命令的环境变量：

- `inherit = "none"` 从空环境开始，`inherit = "core"` 继承一组精简的核心变量；
- `set = { MY_FLAG = "1" }` 显式设置一些值；
- `[shell_environment_policy.filters]` 用模式（支持 `*` 和 `?`，不区分大小写）排除或只包含某些变量，一旦任何一条用了 `include`，就只保留匹配包含规则的变量，已被排除的变量不会被 `include` 恢复；
- `ignore_default_excludes` 默认是 `true`，也就是不自动过滤名字里含 `KEY`、`SECRET`、`TOKEN` 的变量，设成 `false` 才会启用这个自动过滤。

所以命令读不到某个变量时：看你的配置里有没有 `inherit = "none"`、`include` 规则或排除规则把它挡掉了。官方还写明，旧的 `exclude` 和 `include_only` 数组不要和 `filters` 在同一层配置里同时使用，否则 Codex 会拒绝这种组合。配置文件的位置和优先级见官方 Config basics：命令行参数最高，其次是项目 `.codex/config.toml`（只有信任的项目才加载），再到用户的 `~/.codex/config.toml`。

## 四、脚本、CI 和 CODEX_HOME

官方环境变量文档列的几个：

- `CODEX_API_KEY`：给 `codex exec` 这样的非交互进程提供 API 密钥。官方建议在运行仓库里的受控代码时，只在需要的那一行设置，而不是对整个作业设置；
- `CODEX_ACCESS_TOKEN`：给受信任的自动化提供访问令牌，要持久登录用 `codex login --with-access-token`；
- `CODEX_HOME`：Codex 状态的根目录（配置、登录、日志、会话、技能都在这里），默认 `~/.codex`。**如果你设置了它，这个目录必须已经存在**；
- `RUST_LOG`：控制日志详细程度，排查时可以用，分享日志前注意清除密钥。

## 五、还是不行

- 先看 `~/.codex/config.toml` 里与报错相关的那一段，变量名逐字对照；
- 在命令行里用 `/debug-config` 看配置层和生效情况；
- 登录相关的问题见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect) 和 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)。

## 常见问题

**Q：为什么 Windows 上设置了变量还是读不到？**
官方文档没有给 Windows 下设置变量的专门说明。通用的原则是：变量要对启动 Codex 的进程可见。设置之后要重新启动 Codex，必要时重新打开终端。

**Q：密钥写在 config.toml 里行不行？**
官方把直接写令牌的 `experimental_bearer_token` 标为不推荐，应使用 `env_key`。`config.toml` 里不要放密钥，也不要提交到代码仓库。

**Q：想用 DeepSeek 或别的第三方模型？**
见 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。

## 参考资料

- Codex 官方文档：Advanced Configuration — https://learn.chatgpt.com/docs/config-file/config-advanced
- Codex 官方文档：Configuration Reference — https://learn.chatgpt.com/docs/config-file/config-reference
- Codex 官方文档：Environment variables — https://learn.chatgpt.com/docs/config-file/environment-variables
- Codex 官方文档：Config basics — https://learn.chatgpt.com/docs/config-file/config-basic
- Codex 官方文档：Model Context Protocol — https://learn.chatgpt.com/docs/extend/mcp
