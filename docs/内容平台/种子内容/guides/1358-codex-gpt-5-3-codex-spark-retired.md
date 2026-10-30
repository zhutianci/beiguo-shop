---
title: GPT-5.3 Codex Spark 是什么、现在还能用吗：官方已于 2026-09-14 退役，配置里的旧模型名怎么换
slug: codex-gpt-5-3-codex-spark-retired
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: 搜 GPT-5.3 Codex Spark 的人，多半想知道它还能不能用。按 Codex 官方模型页，gpt-5.3-codex-spark 已于 2026-09-14 退役，桌面 App、命令行、IDE 扩展都不再提供。本文列出同批退役的模型、官方建议的替代，并教你改配置。
checkedOn: 2026-10-30
sources:
  - https://learn.chatgpt.com/docs/models
  - https://learn.chatgpt.com/docs/config-file/config-basic
  - https://learn.chatgpt.com/docs/reference/commands
verify:
  - 官方模型页只在「已退役 / 弃用」一节提到 gpt-5.3-codex-spark，没有写它的定位、速度、适用套餐或限额，本文无法也没有介绍「它原来是什么样」
  - 官方写的替代建议是「选一个当前可用的模型」，没有指定唯一替代；本文表格里其他模型的替代是官方对各自退役写的建议
  - 退役日期与替代模型以官方模型页当天的写法为准；表中 gpt-5.5 的退役时间已过（2026-10-14），按「已退役」处理
  - 官方说明这些退役只适用于用 ChatGPT 账号登录的 Codex，API 密钥会话不受影响
---

> 本文根据 Codex 官方文档《Models》整理，资料核对于 2026-10-30。**官方只在退役列表里提到 Spark，没有写它的详细介绍**，所以本文只回答「现在能不能用、该换什么」。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 搜「GPT-5.3 Codex Spark」「codex spark」，想知道它是什么、还能不能选的人；
- 在 config.toml 或脚本里写了 `gpt-5.3-codex-spark`，现在报错的人；
- 想知道 Codex 里哪些旧模型已经下线的人。

## 结论先说

1. **`gpt-5.3-codex-spark` 已于 2026 年 9 月 14 日退役**，官方写明它在桌面 App、命令行和 IDE 扩展里都不再提供。
2. 官方给的替代建议只有一句：**选一个当前可用的模型**。
3. 同一页里还有几个模型的退役信息：`gpt-5.4`、`gpt-5.4-mini` 已于 8 月 31 日退役；`gpt-5.5` 的退役时间是 10 月 14 日中午（太平洋夏令时），到今天已过。
4. 这些退役**只针对用 ChatGPT 账号登录的 Codex**；官方明确写了，用 API 密钥的会话不受这些 Codex 退役影响。
5. 旧模型名留在配置、脚本里会失效，要改。

![Codex 已退役模型与官方建议](seed:g1358-retired-compare.png)
*图：本站根据 [Codex 官方文档：Models](https://learn.chatgpt.com/docs/models) 整理的示意图*

## Spark 是什么

官方模型页没有介绍。它只在「已退役和弃用」一节列了一行：模型名 `gpt-5.3-codex-spark`，状态是 2026 年 9 月 14 日退役，替代是「选一个可用的模型」。页面没有写它的定位、速度、适用套餐或限额。

所以网上关于它「特别快」「额度怎么算」之类的说法，**官方模型页没有给出依据**，这里不转述。今天能做的只有一件事：确认你现在用的是官方推荐表里的模型。

## 现在 Codex 推荐哪些模型

官方模型页的「推荐模型」目前列出四个（命令行用 `-m` 指定）：

- **Astra**（`codex -m gpt-6-astra`）：官方称是最强的模型，用于最难的端到端任务；
- **6.1 Sol**（`codex -m gpt-6.1-sol`）：复杂工作接近 Astra 的表现，成本更低，适合重复、长时间的工作；
- **6.1 Terra**（`codex -m gpt-6.1-terra`）：快速、高效，用于写作、视觉理解和电脑操作，官方写明需要 Codex CLI 0.159.0 或更高版本；
- **6 Luna**（`codex -m gpt-6-luna`）：最高效的模型，适合摘要、提取、聚焦的编码等大批量任务。

没指定模型时，官方说桌面 App、命令行和 IDE 扩展会用一个「推荐模型」，页面没有写明它具体是哪个。怎么在界面里切换模型和推理强度，见 [/guides/codex-switch-model-reasoning-effort](/guides/codex-switch-model-reasoning-effort)。

## 一、配置里写了旧模型名怎么改

官方「更新已保存的配置」一节说：

- 桌面 App、命令行和 IDE 扩展**共用同一个 `config.toml`**，把 `model` 改成一个可用的模型，例如 `model = "gpt-6.1-sol"`；不写的话就用推荐模型；
- 其他地方也要检查：工作区默认值、已保存的模型设置、托管配置、自定义代理、定时任务，以及引用了旧模型的脚本；
- 用 `codex exec --model ...` 的命令，模型名同样要换。

![配置里写了旧模型名怎么改](seed:g1358-update-steps.png)
*图：本站根据 [Codex 官方文档：Models](https://learn.chatgpt.com/docs/models) 整理的示意图*

## 二、怎么切换模型

- **命令行交互模式：** 输入 `/model`，可以切换模型或调整推理强度；
- **命令行启动时：** `codex --model gpt-6.1-sol` 或 `codex -m gpt-6.1-sol`；
- **非交互：** `codex exec -m gpt-6.1-sol "你的任务"`；
- **桌面 App 和网页版 Work：** 用输入框下方的模型和推理控件，点「Advanced」选具体模型。

常用命令表见 [/guides/codex-cli-commands-cheatsheet](/guides/codex-cli-commands-cheatsheet)。

## 三、套餐不同，可选模型也可能不同

官方在 gpt-5.5 的退役建议里写了：Plus、Pro、Business、Enterprise、Edu 套餐建议换成 `gpt-6.1-sol`（在可用时）；Free 和 Go 在桌面 App 里建议换成 `gpt-6-luna`（在可用时）。Enterprise 和 Edu 里，Luna 需要管理员先启用。也就是说，**同一个模型不一定对每个套餐都开放**，菜单里看不到时以官方页面和你的套餐为准。额度怎么算见 [/guides/codex-usage-limits](/guides/codex-usage-limits)；想升级套餐可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 或 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

## 常见问题

**Q：Spark 还会回来吗？**
官方没有说。以后有变化，会体现在官方模型页。

**Q：我用 API 密钥，还要改吗？**
官方说这些 Codex 退役不影响 API 密钥会话；但 API 自己的模型下线以 API 文档为准。

**Q：选不到想要的模型，是不是出问题了？**
先看套餐是否在官方列出的范围里，再看版本（例如 Terra 要求 CLI 0.159.0 或更高）。更多 Codex 问题见 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)。

## 参考资料

- Codex 官方文档：Models — https://learn.chatgpt.com/docs/models
- Codex 官方文档：配置基础 — https://learn.chatgpt.com/docs/config-file/config-basic
- Codex 官方文档：命令参考 — https://learn.chatgpt.com/docs/reference/commands
