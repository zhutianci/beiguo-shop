---
title: Gemini CLI 怎么用：安装、登录、常用命令，以及 2026-06-18 之后官方改用 Antigravity CLI
slug: gemini-cli-how-to-use-antigravity-cli
products: [gemini]
models: []
accountTier: OTHER
excerpt: Gemini CLI 怎么用？安装用 npm，登录可用 Google 账号、API Key 或 Vertex AI。但官方博客说，个人 Google 账号（免费、AI Pro、Ultra）已于 2026-06-18 停止服务，官方建议改用 Antigravity CLI（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli
  - https://geminicli.com/docs/get-started
  - https://geminicli.com/docs/get-started/authentication
  - https://geminicli.com/docs/cli/cli-reference
  - https://geminicli.com/docs/resources/quota-and-pricing
  - https://antigravity.google/blog/introducing-google-antigravity-cli
  - https://antigravity.google/docs/gcli-migration
  - https://antigravity.google/download
verify:
  - 官方博客（2026-05-19）写：2026-06-18 起，Gemini CLI 和 Gemini Code Assist IDE 扩展将停止为 Google AI Pro、Ultra 以及通过 Gemini Code Assist 个人版免费使用的用户服务请求；企业用户通过 Gemini Code Assist 标准或企业许可、以及付费的 Gemini API Key 的访问不变
  - Gemini CLI 官方文档页顶部写：「Unpaid tier and Google One users: Gemini CLI was replaced by Antigravity CLI on June 18th, 2026」，并提示 Gemini CLI 没有针对 Gemini 4 Argon 优化、要用 Argon 请使用 Antigravity
  - 但同一文档站的「配额与价格」页仍列出 Google AI Pro 每日 1,500 次、Ultra 2,000 次的个人账号配额，与上面两处说法不一致；本文以博客和文档站页顶提示为准，配额表仅作参考，请以官方最新页面为准
  - 本文的命令和参数取自 Gemini CLI 官方 CLI 速查页；Antigravity CLI 的安装命令取自 antigravity.google/download（macOS / Linux 用 curl，Windows 用 PowerShell），本站没有实际运行
  - 本站 707 号文章（Gemini CLI Skills）写于 2026-10-11，没有提到上述 6 月 18 日的变化，请注意核对
  - 官方提示 Antigravity CLI 与 Gemini CLI 没有 1:1 的功能对等，但保留了 Agent Skills、Hooks、Subagents 和扩展（改称插件）
---

> 本文根据 Gemini CLI 官方文档、Google 开发者博客和 Antigravity 官方文档整理，资料核对于 2026-10-25。**官方 2026-06-18 对 Gemini CLI 的服务范围做了调整**，下文先说清现状，再讲怎么用。命令与安装方式以官方页面为准，本站没有逐项运行验证。

## 适用于谁

- 搜「gemini cli 如何使用」「gemini cli 怎么安装」的人；
- 按旧教程装了 Gemini CLI，却登录不了或没有响应的人；
- 想知道 Gemini CLI 和 Antigravity CLI 是什么关系的人。

## 结论先说

1. **先看你的账号类型**。官方博客（2026-05-19）说，2026-06-18 起，Gemini CLI 对 **Google AI Pro、Ultra 和 Gemini Code Assist 个人版免费用户**不再服务请求。Gemini CLI 文档站页顶也写：免费档和 Google One 用户的 Gemini CLI 已于 2026-06-18 被 Antigravity CLI 取代。
2. **企业和付费 API 不受影响**：官方说，通过 Gemini Code Assist 标准或企业许可的企业用户，访问不变；Gemini CLI 仍可通过付费的 Gemini API Key 和 Vertex AI（Gemini Enterprise Agent Platform）使用。
3. **官方建议的替代品是 Antigravity CLI**：官方称它用 Go 编写、更快，支持后台异步多智能体，共用 Antigravity 2.0 的智能体框架，保留 Agent Skills、Hooks、Subagents、扩展（改称插件）。
4. **想用 Gemini 4 Argon**：官方文档提示 Gemini CLI 没有针对 Argon 优化，请使用 Antigravity。Argon 是什么见 [/guides/gemini-4-argon-what-is-release-date](/guides/gemini-4-argon-what-is-release-date)。
5. **订阅差别**：Pro 和 Ultra 是 Google 的订阅，见 [/guides/gemini-ultra-vs-pro-difference](/guides/gemini-ultra-vs-pro-difference)；需要谷歌账号相关服务可看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

![Gemini CLI 现在还能不能用：按账号类型判断](seed:g1088-gemini-cli-status-decide.png)
*图：本站根据 [Google 开发者博客](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli) 与 [Gemini CLI 文档](https://geminicli.com/docs/get-started/installation) 整理的示意图*

## 一、Gemini CLI 怎么装、怎么登录（仍可用的情况）

官方快速入门：

1. 安装：`npm install -g @google/gemini-cli`；
2. 运行：`gemini`；
3. 第一次会问「How would you like to authenticate for this project?」，官方说大多数情况选 **Sign in with Google**，选 Google 账号并登录。

官方的认证选择表：

| 用户类型 | 推荐方式 | 是否需要 Google Cloud 项目 |
| --- | --- | --- |
| 个人 Google 账号 | Sign in with Google | 一般不需要 |
| 公司、学校或 Workspace 账号 | Sign in with Google | 需要 |
| 有 AI Studio 的 Gemini API Key | Use Gemini API Key | 不需要 |
| Google Cloud Vertex AI 用户 | Vertex AI | 需要 |
| 无界面（headless）模式 | Gemini API Key 或 Vertex AI | 视方式而定 |

用 API Key 的做法：在 Google AI Studio 获取 Key，设置环境变量 `GEMINI_API_KEY`，启动 `gemini` 后选 **Use Gemini API key**。Key 怎么拿见 [/guides/gemini-api-key](/guides/gemini-api-key)。

## 二、常用命令（官方速查页）

| 命令 | 作用 |
| --- | --- |
| `gemini` | 启动交互模式 |
| `gemini "问题"` | 提问并继续交互 |
| `gemini -p "问题"` | 非交互，输出结果后退出 |
| `gemini` 配合管道 | 把 cat 文件的输出通过管道交给 gemini 处理 |
| `gemini -i "问题"` | 执行提示词后继续交互 |
| `gemini -r "latest"` | 继续最近一次会话 |
| `gemini update` | 更新到最新版本 |
| `gemini mcp` / `gemini extensions` | 管理 MCP 服务器、扩展 |

交互模式里常用的斜杠命令包括 `/help`、`/quit`、`/memory reload`（重新加载 GEMINI.md）、`/skills reload`、`/mcp reload`。`/stats model` 可以查看当前会话的 token 用量和各模型的配额。

几个官方参数：`-m` 选模型、`--sandbox` 沙箱运行、`--approval-mode` 设置工具执行审批方式（default、auto_edit、yolo、plan）。项目上下文写在 `GEMINI.md`。Skills 的用法见 [/guides/gemini-cli-skills-install-create](/guides/gemini-cli-skills-install-create)，使用前请先对照本文说明的账号类型限制。

## 三、配额：官方文档里的表

![Gemini CLI 官方配额表（以最新页面为准）](seed:g1088-gemini-cli-quota-table.png)
*图：本站根据 [Gemini CLI 配额与价格页](https://geminicli.com/docs/resources/quota-and-pricing) 整理的示意图*

官方配额页的主要数字（每用户每日请求上限）：

- Gemini API Key 免费层：250 次，仅 Flash 模型；
- Google 账号：Code Assist 个人版 1,000 次、Google AI Pro 1,500 次、Google AI Ultra 2,000 次；
- Workspace：Code Assist 标准版 1,500 次、企业版 2,000 次；
- 付费 API Key 和 Vertex AI：按用量计费，限额因档位而异。

再次提醒：这张表里的「Google 账号」几行，与官方博客和文档站页顶「个人账号已于 2026-06-18 改用 Antigravity CLI」的说法不一致，请以官方最新页面为准，不要仅凭这张表判断自己还能不能用。免费 API 的限额和计费见 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits)。

## 四、改用 Antigravity CLI

官方给的安装命令（antigravity.google/download，当前 CLI 版本 v1.4.0）：

- macOS / Linux：`curl -fsSL https://antigravity.google/cli/install.sh | bash`
- Windows PowerShell：`irm https://antigravity.google/cli/install.ps1 | iex`

启动命令是 `agy`。官方迁移文档说：

- 第一次运行时，如果检测到旧的 Gemini CLI 配置，会弹出清单让你选择迁移哪些内容；
- 可以用 `agy plugin import gemini` 把旧的扩展转成 Antigravity 插件；
- `GEMINI.md`、`AGENTS.md` 和全局的 `~/.gemini/GEMINI.md` 照常生效；
- 技能路径变了：全局从 `~/.gemini/skills/` 变为 `~/.gemini/antigravity-cli/skills/`，项目内从 `.gemini/skills/` 变为 `.agents/skills/`；
- MCP 配置从 `settings.json` 里拆出来，放进独立的 `mcp_config.json`，远程服务器的地址字段从 `url` 或 `httpUrl` 改为 `serverUrl`。

安装前请先确认你的系统和账号满足官方下载页的要求。

## 常见问题

**Q：我的 Gemini CLI 登录后没有响应，是怎么回事？**
如果你用的是个人 Google 账号（免费、AI Pro 或 Ultra），按官方说法，该路径已于 2026-06-18 停止服务，建议改用 Antigravity CLI；用 Gemini API Key 或企业许可的另当别论。

**Q：Gemini CLI 能接别的模型或 Codex 吗？**
官方文档没有这类说明，见 [/guides/gemini-codex-third-party-clients](/guides/gemini-codex-third-party-clients)。

**Q：Gemini CLI 免费吗？**
官方配额页列的免费层是 API Key 免费层（250 次，仅 Flash）；个人 Google 账号的免费路径见上文说明。

## 参考资料

- Google 开发者博客：Transitioning Gemini CLI to Antigravity CLI — https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli
- Gemini CLI 文档：快速入门 — https://geminicli.com/docs/get-started
- Gemini CLI 文档：认证 — https://geminicli.com/docs/get-started/authentication
- Gemini CLI 文档：CLI 速查 — https://geminicli.com/docs/cli/cli-reference
- Gemini CLI 文档：配额与价格 — https://geminicli.com/docs/resources/quota-and-pricing
- Antigravity：Antigravity CLI — https://antigravity.google/blog/introducing-google-antigravity-cli
- Antigravity：从 Gemini CLI 迁移 — https://antigravity.google/docs/gcli-migration
- Antigravity：下载 — https://antigravity.google/download
