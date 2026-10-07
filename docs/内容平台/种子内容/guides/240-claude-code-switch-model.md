---
title: Claude Code 切换模型：/model 命令、模型别名、effort 与 fast 模式
slug: claude-code-switch-model
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 怎么切换模型？讲清 /model 命令与选择器、opus / sonnet / haiku / fable / opusplan 等别名、默认模型、推理强度 effort 怎么调、ultrathink、fast 模式，以及换了模型下次又变回去的原因。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/model-config
  - https://code.claude.com/docs/en/fast-mode
  - https://code.claude.com/docs/en/advisor
  - https://code.claude.com/docs/en/prompt-caching
  - https://platform.claude.com/docs/en/about-claude/models/overview
verify:
  - 别名对应的具体版本（Anthropic API 上 opus=Opus 5.5、sonnet=Sonnet 5.5、fable=Fable 5.1）和各模型默认 effort 取自 2026-10 官方 Model configuration 页，会随版本更新
---

> 本文根据 Claude Code 官方文档《Model configuration》《Speed up responses with fast mode》整理，核对日期 2026-10-07。模型更新很快，别名指向哪个版本以官方页面和你本机 `/model` 菜单为准。

## 适用于谁

- 搜「claude code 切换模型」「切换模型命令」「claude code 模型选择」的人；
- 想知道 Opus、Sonnet、Haiku、Fable 在 Claude Code 里怎么选、推理强度怎么调的人；
- 用 `/model` 换了模型，下次打开又变回去的人。

各模型本身的定位和区别，详见本站《Claude 模型有哪些、有什么区别：Opus、Sonnet、Haiku 怎么选（2026）》。

## 结论先说

1. **会话里输入 `/model`** 打开选择器：回车 = 切换并保存为以后的默认；按 `s` = 只对本次会话生效。也可以直接 `/model sonnet`。
2. 推荐用**别名**而不是完整版本号：`opus`、`sonnet`、`haiku`、`fable`，别名会自动指向官方推荐的最新版本；想固定版本就写完整模型名，比如 `claude-opus-5-5`。
3. 截至 2026-10 的官方文档：在 Anthropic API 和 Pro / Max / Team / Enterprise 订阅上，`default` 默认是 **Opus 5.5**；Fable 系列不会作为默认，要手动选择。
4. **推理强度（effort）**比换模型更细：`/effort` 在 low / medium / high / xhigh / max 之间调；Opus 5.5 和 Sonnet 5.5 默认 `medium`。只想这一句多想想，在提示词里写 `ultrathink`。
5. `opusplan`：plan 模式用 Opus 想方案，执行时自动换 Sonnet 写代码。

## 一、怎么切换

### 会话中切换

```text
/model
```

选择器里用上下键选模型，左右键调推理强度（支持的模型才有）：

- `Enter`：切换，并保存为新会话的默认（写入用户设置的 `model` 字段）；
- `s`：只在本次会话里切换，默认值不变。

也可以一步到位：

```text
/model sonnet
/model opus
/model claude-opus-5-5
```

直接输入 `/model 名字` 等同于按回车（会保存为默认）。官方提醒：每个模型有各自的提示词缓存，中途切换后第一条请求要重新处理整段对话、不走缓存，所以 Claude Code 有时会请你确认。

### 启动时指定

```bash
claude --model opus
```

`--model` 和环境变量 `ANTHROPIC_MODEL` 只对这次启动的会话生效。想在几个终端里同时用不同模型，就每个终端各自用 `--model` 启动，而不是在其中一个里 `/model`（那会改掉共用的默认值）。

### 写进设置

在 `~/.claude/settings.json` 里：

```json
{
  "model": "opus"
}
```

### 优先级（从高到低）

1. 会话中的 `/model`
2. 启动参数 `--model`
3. 环境变量 `ANTHROPIC_MODEL`
4. 设置文件里的 `model`
5. 环境变量 `ANTHROPIC_DEFAULT_MODEL`（只在以上都没设置时作为新会话默认）

看当前用的是哪个模型：`/status`，或在状态栏里显示。

## 二、模型别名一览

| 别名 | 含义 |
| --- | --- |
| `default` | 清除覆盖，回到你账号类型的默认模型 |
| `sonnet` | 最新的 Sonnet，日常编码 |
| `opus` | 最新的 Opus，复杂推理 |
| `haiku` | 快速高效的 Haiku，简单任务 |
| `fable` | Fable 模型，最难、最长的任务 |
| `best` | 有 Fable 权限时等于 `fable`，否则等于 `opus` |
| `opus[1m]` / `sonnet[1m]` | 使用 100 万 token 上下文窗口的版本 |
| `opusplan` | plan 模式用 Opus，执行时换 Sonnet |

截至 2026-10，官方列出 Anthropic API 上 `opus` 指向 Opus 5.5、`sonnet` 指向 Sonnet 5.5（Bedrock、Vertex、Foundry 等第三方平台上可能指向更早的版本）；`fable` 默认指向 Fable 5.1。注意 Sonnet 5.5 需要 Claude Code v2.1.284 及以上、Opus 5.5 需要 v2.1.280 及以上，版本太旧会报「does not support this model」，运行 `claude update` 升级即可。

### 关于 Fable

官方介绍 Fable 5.1 和 Fable 5 是 Claude Code 里能力最强的模型，适合「一次坐下来做不完」的大任务：长时间自主工作、先调查再动手、更频繁地自我验证。它不是任何套餐的默认模型，要用 `/model fable` 或 `claude --model fable` 手动选择。

官方特别说明：取决于你的套餐和席位等级，**Fable 的用量可能计入用量额度（usage credits）而不是套餐自带的额度**，此时 `/model` 菜单里 Fable 那一行会标注「Requires usage credits」，交互会话里第一次扣费前会征求同意。

用 Fable 的官方建议：描述想要的结果而不是步骤；把模糊的问题（根因排查、架构决策）交给它；不用反复提醒它测试和检查；可以交给它平时要拆成几块的大任务。

## 三、推理强度（effort）

effort 控制模型「想多深」：低档更快更省，高档推理更深。

| 档位 | 适合 |
| --- | --- |
| `low` | 头脑风暴、初稿、重命名这类小改动，你会逐个检查结果 |
| `medium` | Opus 5.5 / Sonnet 5.5 的默认档，范围清晰的日常开发 |
| `high` | 需要验证、边界情况多的工作，比如在老代码里修 bug（多数其他模型的默认档） |
| `xhigh` | 更深的推理，消耗更多 token |
| `max` | 想让 Claude 自己啃完的难题；官方提醒可能边际收益递减、容易想过头，只对本次会话生效 |

设置方式：

- `/effort` 打开滑块；`/effort high` 直接设定；`/effort auto` 清除为该模型保存的档位；
- `/model` 选择器里用左右键调；
- 启动参数 `--effort high`；
- 技能、子代理的 frontmatter 里写 `effort`。

在滑块里按 `Enter` 保存为该模型的默认，按 `s` 只用于本次会话。档位是**按模型分别保存**的。另外，提示词里任意位置写上 `ultrathink`，可以只让这一轮更深入地思考，不改变会话设置；「think hard」等其他说法官方说明不会被当作关键词。

不同模型支持的档位不同：Fable、Opus 5.5、Sonnet 5.5、Opus 5、Sonnet 5、Opus 4.8、Opus 4.7 支持全部五档；Opus 4.6 和 Sonnet 4.6 没有 `xhigh`。设了不支持的档位会自动降到最近的一档。

## 四、opusplan：用 Opus 想、用 Sonnet 做

```text
/model opusplan
```

在 plan 模式下用 Opus 做复杂推理和架构决策，批准方案进入执行后自动换成 Sonnet 写代码，兼顾质量和效率。plan 模式怎么用详见本站《Claude Code Plan 模式怎么用：先出方案再改代码》。

如果你想让 Claude 自己在关键时刻去请教更强的模型，而不是在 plan 边界切换，可以看官方的 advisor 工具（`/advisor`）。

## 五、fast 模式

`/fast` 打开 fast 模式：官方说明它不是另一个模型，而是 Opus 的高速配置，**速度最高约 2.5 倍、每 token 单价更高**，质量相同。目前支持 Opus 5.5、Opus 5、Opus 4.8，不支持 Sonnet、Haiku。

- 订阅用户（Pro / Max / Team / Enterprise）的 fast 模式**只能用用量额度（usage credits）付费，不包含在套餐额度里**；Team / Enterprise 需要组织 Owner 先开启；
- 开启后提示符旁会出现 `↯` 图标；当前模型不支持时会自动切到 Opus；
- 官方建议在会话一开始就开，中途切换不划算（缓存问题）。

具体单价见官方 fast mode 页。

## 常见问题

**Q：我用 `/model` 换了模型，下次打开又变回去了？**
官方列出的原因：你按的是 `s`（只对本次会话）或用 `--model` 启动；项目或托管设置里写了 `model`、shell 里有 `ANTHROPIC_MODEL`、或组织设置了默认模型，它们优先级更高；`~/.claude/settings.json` 不可写导致保存失败；你恢复的是旧会话（恢复的会话保持它当时的模型）。

**Q：提示「Claude Opus is not available with the Claude Pro plan」？**
当前套餐不含这个模型，`/model` 换一个；刚升级套餐的话 `/logout` 再 `/login`。

**Q：子代理用什么模型？**
没有单独指定时，子代理跟随主会话的模型；所以切到 Opus 后再派子代理，子代理也会跑在 Opus 上。想让某个子代理一直用便宜的模型，在它的定义里写 `model: haiku`。

**Q：VS Code 里怎么切换？**
点输入框底部的模型名，或在 `/` 菜单里选「Switch model…」，详见本站《Claude Code VS Code 插件使用教程：安装、登录与常用操作》。

**Q：哪个模型最省额度？**
官方在成本文档里的建议是：Sonnet 能胜任大多数编程任务且比 Opus 便宜，Opus 留给复杂架构和多步推理，简单的子代理任务用 Haiku。

## 参考资料

- Model configuration（官方）：https://code.claude.com/docs/en/model-config
- Speed up responses with fast mode（官方）：https://code.claude.com/docs/en/fast-mode
- Escalate hard decisions with the advisor tool（官方）：https://code.claude.com/docs/en/advisor
- How Claude Code uses prompt caching（官方）：https://code.claude.com/docs/en/prompt-caching
- Models overview（官方）：https://platform.claude.com/docs/en/about-claude/models/overview
