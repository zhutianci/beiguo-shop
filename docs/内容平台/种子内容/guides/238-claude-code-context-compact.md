---
title: Claude Code 上下文满了怎么办：/compact、/clear 与省 token 技巧
slug: claude-code-context-compact
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 上下文快满、提示 compacting conversation、token 消耗太快时怎么办？本文讲清 /context、/compact、/clear 的区别，压缩后哪些内容会保留，以及官方推荐的一系列省 token 做法。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/context-window
  - https://code.claude.com/docs/en/costs
  - https://code.claude.com/docs/en/prompt-caching
  - https://code.claude.com/docs/en/memory
  - https://code.claude.com/docs/en/model-config
---

> 本文根据 Claude Code 官方文档《Explore the context window》《Manage costs effectively》整理，核对日期 2026-10-07。额度怎么算、什么时候重置不在本文范围，详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 适用于谁

- 会话越聊越长，看到「Compacting conversation」或上下文快满提示的人；
- 觉得 Claude Code「token 消耗太快」「额度一下就没了」的人；
- 搜「claude code compact 是什么」「上下文压缩」「省 token」的人。

## 结论先说

1. **Claude Code 每次请求都会把整段对话发给模型**，对话越长，每条消息消耗越多——哪怕你只问一句话。所以控制上下文就是控制用量。
2. 上下文快满时 Claude Code 会**自动压缩**（把历史对话总结成摘要），会话不会因此中断；你也可以提前手动 `/compact`，并告诉它重点保留什么。
3. **换任务就 `/clear`**：清空上下文开新对话，项目记忆（CLAUDE.md）保留，而且不消耗 token；`/compact` 本身要读一遍整段对话，是一次大请求。
4. 用 `/context` 看上下文被什么占满，用 `/usage` 看哪些行为消耗多。
5. 其他官方建议：大量读文件、跑测试交给子代理；简单任务用 Sonnet 或降低推理强度；停用不用的 MCP；把 CLAUDE.md 里的专项流程挪成技能；提示词写具体。

## 一、先看清楚：上下文里装了什么

会话里输入：

```text
/context
```

它会用彩色格子显示当前上下文的占用情况，按类别细分，并给出优化建议（比如哪个工具占得多、记忆文件是否过大）。

根据官方的说明，**你还没开口时**，上下文里就已经有：系统提示词、CLAUDE.md、自动记忆（MEMORY.md 的前 200 行或 25KB）、MCP 工具名称、技能描述等。**干活过程中**，每读一个文件、每次工具返回结果都会累加进去。

## 二、三个命令的区别

| 命令 | 做什么 | 适合 |
| --- | --- | --- |
| `/compact [要求]` | 把目前的对话总结成结构化摘要，继续同一个对话 | 还要接着做同一件事，但历史太长了 |
| `/clear` | 清空对话，开新会话（别名 `/new`、`/reset`），项目记忆保留 | 换到一件不相关的任务 |
| `/rewind` → Summarize | 只把某一段对话压缩成摘要 | 前面一段探索没用了，后面的要保留 |

几个实用写法：

```text
/compact 重点保留登录 bug 的修复过程和相关测试结果
```

```text
/rename 登录bug排查
/clear
```

先 `/rename` 再 `/clear`，以后可以用 `/resume` 找回这个会话。

还可以在项目根目录的 CLAUDE.md 里写一段压缩说明，让每次压缩都按你的要求保留重点：

```markdown
# Compact instructions

压缩时重点保留测试输出和代码改动。
```

**调整自动压缩的时机**：`/autocompact 500k` 可以设置上下文到多大时自动压缩（具体可用的值和各模型默认阈值见官方 Model configuration 页），`/autocompact auto` 恢复默认。

## 三、压缩后会丢什么、留什么

官方给出的对照（节选）：

| 内容 | 压缩之后 |
| --- | --- |
| 系统提示词、输出风格 | 仍然生效 |
| 项目根目录的 CLAUDE.md、无路径限制的规则 | 从磁盘重新注入 |
| 自动记忆 | 从磁盘重新注入 |
| plan 模式写好的方案 | 从磁盘重新注入 |
| 子目录里的 CLAUDE.md、带 `paths:` 的规则 | 读到相关文件时再按需加载 |
| 读过或改过的文件 | 自动重新读取最近修改的最多 5 个（超过 5000 token 的只保留路径） |
| 调用过的技能内容 | 重新注入，每个技能最多 5000 token、合计 25000 token，最早的先丢 |
| 后台命令、后台子代理 | 继续运行 |
| 你在对话里口头说的约定（如「先别推送」） | 和其他历史一起被总结，**可能丢失** |

所以：**必须一直遵守的规矩写进项目根目录的 CLAUDE.md**，不要只在对话里说；技能里最重要的内容放在 SKILL.md 开头（截断时保留开头）。想在压缩后自动补充提醒，可以用 `SessionStart` + `compact` 的 Hook，详见本站《Claude Code Hooks 怎么用：配置示例（完成通知、自动格式化、拦截危险命令）》。

## 四、为什么 token 消耗这么快

官方列出的长会话用量飙升原因：

- **上下文太长**：每次请求都带上全部历史，每次工具调用还会再发一次请求；
- **缓存失效**：离开超过缓存有效期后的第一条消息，要把全部上下文重新处理一遍。官方说明订阅用户的缓存有效期是 1 小时，开始消耗用量额度（usage credits）后降为 5 分钟；用 API Key 默认 5 分钟。Pro / Max 用户在长时间离开后恢复大会话时，Claude Code 会提议「从摘要恢复」；
- **定时任务、跨会话消息、目标（/goal）检查**：会话空闲时也会发起新的一轮，每次都带上完整上下文；
- **子代理、工作流、Agent Teams**：每个都在额外发请求，官方说 Agent Teams 在 plan 模式下大约是普通会话的 7 倍 token；
- **压缩本身**：`/compact` 要读一遍要总结的对话。

Pro、Max、Team、Enterprise 用户运行 `/usage`，会看到占最近用量 10% 以上的行为被单独标出，并附带建议。

## 五、官方推荐的省 token 做法

1. **换任务就 `/clear`**，旧对话每条消息都在浪费 token。
2. **选对模型**：官方说 Sonnet 能胜任大多数编程任务且比 Opus 便宜，Opus 留给复杂架构决策和多步推理；简单的子代理任务可以指定 `model: haiku`。切换方法详见本站《Claude Code 切换模型：/model 命令、模型别名、effort 与 fast 模式》。
3. **调低推理强度**：扩展思考的 token 按输出计费，简单任务用 `/effort` 降一档，或在 `/config` 里关闭思考（官方注明 Opus 5.5、Sonnet 5.5 和 Fable 系列始终开启思考，不能关）。
4. **大量输出交给子代理**：跑测试、翻日志、查文档让子代理做，主对话只收摘要。
5. **减少 MCP 开销**：`/mcp` 里停用暂时不用的服务器；有命令行工具（`gh`、`aws`、`gcloud` 等）时优先用命令行，更省上下文。
6. **给强类型语言装代码智能插件**：一次「跳转到定义」代替 grep 加读一堆候选文件。
7. **用 Hook 预处理**：比如让 Hook 把测试输出过滤成只剩失败的部分，几万 token 变几百。
8. **CLAUDE.md 瘦身**：官方建议控制在 200 行以内，PR 审查、数据库迁移这类专项流程挪成技能，用到时才加载。
9. **提示词写具体**：「优化一下这个代码库」会触发大范围扫描；「给 auth.ts 的登录函数加输入校验」只读必要的文件。
10. **复杂任务先用 plan 模式**，方向错了按 Esc 立即停，用 `/rewind` 回退，避免返工浪费。

## 六、需要更大的窗口？

官方说明：Fable 系列、Sonnet 5 及以后、Opus 4.6 及以后、Sonnet 4.6 支持 100 万 token 上下文窗口（选择带 `[1m]` 的模型变体；Sonnet 5.5 和 Sonnet 5 默认就是 1M，没有单独的变体）。各套餐是否可用见官方 Model configuration 页「Extended context」一节。窗口更大不代表不用管理：长上下文同样会让每条消息更贵。

## 常见问题

**Q：自动压缩之后 Claude 好像「忘了」之前说好的事？**
口头约定会随历史一起被总结，可能丢细节。重要的规矩写进 CLAUDE.md；或者压缩前手动 `/compact 重点保留……`。

**Q：`/compact` 和 `/clear` 哪个更省？**
`/clear` 不消耗 token；`/compact` 需要读一遍整段对话来生成摘要。不需要延续上下文时直接 `/clear`。

**Q：`/context` 显示 MCP 占了很多？**
MCP 工具默认是延迟加载的，只有名称和说明在上下文里，但服务器多了也会累积。到 `/mcp` 停用不用的服务器即可。

**Q：怎么一直看到上下文占用？**
配置底部状态栏显示上下文百分比，用 `/statusline` 描述你想要的内容即可自动配置。

## 参考资料

- Explore the context window（官方）：https://code.claude.com/docs/en/context-window
- Manage costs effectively（官方）：https://code.claude.com/docs/en/costs
- How Claude Code uses prompt caching（官方）：https://code.claude.com/docs/en/prompt-caching
- How Claude remembers your project（官方）：https://code.claude.com/docs/en/memory
- Model configuration（官方）：https://code.claude.com/docs/en/model-config
