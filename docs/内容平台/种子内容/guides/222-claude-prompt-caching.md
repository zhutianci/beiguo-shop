---
title: Claude 提示词缓存（Prompt Caching）入门：缓存时间、价格倍率与命中率
slug: claude-prompt-caching
products: [claude]
models: []
accountTier: OTHER
excerpt: Claude API 的提示词缓存能把重复的长前缀（系统提示、工具定义、长文档、对话历史）缓存起来，读缓存只收少量费用。本文讲自动缓存与断点写法、5 分钟和 1 小时两种时长、价格倍率、最短长度、怎么看命中率以及命中率低的原因。
checkedOn: 2026-10-07
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  - https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics
  - https://platform.claude.com/docs/en/about-claude/pricing
  - https://code.claude.com/docs/en/prompt-caching
verify:
  - 价格倍率与各模型最短缓存长度取自 2026-10 官方 Prompt caching 页，会随新模型调整
---

> 本文根据 Claude API 官方文档《Prompt caching》整理，核对日期 2026-10-07。价格以倍率说明为主，各模型的具体单价见官方定价页。

## 适用于谁

- 用 Claude API 做客服机器人、文档问答、代码助手，每次请求都带着一大段相同的系统提示或资料，想省钱提速的开发者；
- 搜「claude prompt caching」「claude 缓存时间」「缓存命中率低」「缓存价格」的人；
- 想看懂 API 返回里 `cache_read_input_tokens` 这些字段的人。

## 结论先说

1. **缓存的是「前缀」**：按 `tools` → `system` → `messages` 的顺序，从开头一直到你标记 `cache_control` 的那个内容块为止。下次请求的这段前缀**一字不差**，就能直接读缓存。
2. **两种开法**：在请求顶层加一个 `"cache_control": {"type": "ephemeral"}` 就是**自动缓存**（多轮对话最省事）；也可以在具体内容块上打**断点**精细控制，一次请求最多 4 个断点。
3. **时长**：默认 5 分钟，每次命中会免费续期；也可以选 1 小时（`"ttl": "1h"`）。
4. **价格倍率**（官方）：5 分钟缓存写入 = 基础输入价 × 1.25；1 小时缓存写入 = × 2；**读缓存 = × 0.1**（个别模型更低：Opus 5.5 为 × 0.05，Fable 5.1 为 × 0.025）。断点本身不收费。
5. **太短不缓存**：不同模型有最短可缓存长度（512～4096 token 不等），不够长时**静默不缓存、也不报错**——这是「命中率为 0」最常见的原因。

## 一、它是怎么省钱的

发送带缓存设置的请求时：

1. 系统先检查这段前缀最近是否缓存过；
2. 缓存过就直接用，处理更快、费用更低；
3. 没缓存过就完整处理一遍，并在回复开始时把前缀写进缓存。

适合的场景：提示词里有大量示例、很长的背景资料、重复执行的固定指令、长篇多轮对话、带很多工具的智能体。官方还提到一个用法：有了缓存，可以在提示词里放 20 个以上高质量示例，而不用担心每次都付全价。

**缓存不影响输出**：用不用缓存，模型给出的回答是一样的；缓存只作用于输入部分。

## 二、最简单的写法：自动缓存

在请求顶层加 `cache_control`，系统会自动把断点放在最后一个可缓存的内容块上，对话变长时断点也会自动后移：

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},          # 开启自动缓存
    system="你是公司的客服助手。以下是完整的产品手册：……（很长的内容）",
    messages=[
        {"role": "user", "content": "退货流程是什么？"},
    ],
)
print(response.usage)
```

多轮对话时的效果（官方示意）：

| 请求 | 内容 | 缓存行为 |
| --- | --- | --- |
| 第 1 次 | 系统 + 用户 1 + 助手 1 + **用户 2** | 全部写入缓存 |
| 第 2 次 | 系统 + … + 用户 2 + 助手 2 + **用户 3** | 系统到用户 2 读缓存；助手 2 + 用户 3 写入 |
| 第 3 次 | 系统 + … + 用户 3 + 助手 3 + **用户 4** | 系统到用户 3 读缓存；助手 3 + 用户 4 写入 |

想用 1 小时缓存：`cache_control={"type": "ephemeral", "ttl": "1h"}`。

## 三、精细控制：在内容块上打断点

当不同部分变化频率不同（比如工具定义几乎不变、产品手册每天变、对话每轮都变），可以在具体内容块上放 `cache_control`：

```python
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system=[
        {"type": "text", "text": "你是公司的客服助手。"},
        {
            "type": "text",
            "text": "（很长的产品手册全文……）",
            "cache_control": {"type": "ephemeral"},   # 缓存到这里为止
        },
    ],
    messages=[{"role": "user", "content": "保修期多久？"}],
)
```

要点：

- **把不变的内容放前面**：工具定义、系统指令、背景资料、示例在前，每次都变的内容（时间戳、用户问题）在后；
- **断点要放在「每次都相同」的最后一个块上**，而不是放在会变的块上——官方特别指出，断点放在含时间戳或用户新消息的块上，前缀永远对不上，缓存永远写不进去也读不出来；
- 一次请求最多 4 个断点（自动缓存会占用其中 1 个）；断点多不会多收钱，你只为实际写入和读取的内容付费。

## 四、价格倍率

| 项目 | 相对基础输入单价 |
| --- | --- |
| 5 分钟缓存写入 | × 1.25 |
| 1 小时缓存写入 | × 2 |
| 缓存读取（命中及续期） | × 0.1（Opus 5.5 为 × 0.05；Fable 5.1、Mythos 5.1 为 × 0.025） |
| 断点本身 | 不收费 |

这些倍率会和批量处理（Batch API）折扣等其他价格因素叠加。各模型的基础单价见官方定价页。简单理解：同一段前缀只要被读取一次以上，通常就比不缓存划算。

**5 分钟还是 1 小时？**官方建议：如果这段提示词使用频率高于每 5 分钟一次，用 5 分钟缓存就行（每次命中免费续期）；1 小时缓存适合「隔几分钟到一小时才会再用一次」的情况，比如子任务运行超过 5 分钟、用户可能过一会儿才回复。另外，缓存命中不计入速率限制，长缓存也有助于提高速率限制的利用率。同一请求里混用两种时，1 小时的缓存条目必须排在 5 分钟的前面。

注意计时方式：有效期从**写入或读取缓存的那次请求开始时**算起，生成回复的时间也计入。比如一次回复流式输出了 4 分钟，下一次复用请求要在回复结束后约 1 分钟内发出，才赶得上 5 分钟的有效期。

## 五、怎么看有没有命中

看响应里的 `usage`（流式输出时在 `message_start` 事件里）：

| 字段 | 含义 |
| --- | --- |
| `cache_creation_input_tokens` | 本次写入缓存的 token 数 |
| `cache_read_input_tokens` | 本次从缓存读取的 token 数 |
| `input_tokens` | 最后一个断点**之后**、没有参与缓存的 token 数 |

**总输入 = cache_read + cache_creation + input_tokens**。所以开了缓存后 `input_tokens` 往往很小，这不是少算了，而是大部分输入走了缓存。

如果 `cache_creation_input_tokens` 和 `cache_read_input_tokens` **都是 0**，说明这次根本没缓存——最可能是没达到最短长度。

## 六、最短可缓存长度（Claude API）

| 模型 | 最短长度 |
| --- | --- |
| Fable 5.1、Fable 5、Opus 5.5、Opus 5、Sonnet 5.5 | 512 token |
| Opus 4.8、Sonnet 5、Sonnet 4.6、Sonnet 4.5 | 1024 token |
| Opus 4.7 | 2048 token |
| Opus 4.6、Opus 4.5、Haiku 4.5 | 4096 token |

不够长时，官方建议：如果只差一点，把可缓存的内容补到门槛以上通常是值得的，因为读缓存比普通输入便宜得多。

## 七、命中率低的原因排查

官方清单：

1. **前缀不完全一致**：哪怕差一个字、一张图都不行；用显式断点时，`cache_control` 的位置每次也要相同；
2. **超过有效期**：两次请求间隔超过 5 分钟（或 1 小时）；
3. **改了会让缓存失效的参数**：
   - 修改工具定义 → 整个缓存失效；
   - 开关网页搜索、引用功能、fast 模式 → system 和 messages 缓存失效；
   - 修改 `tool_choice`、增删图片、修改思考（thinking）配置、修改 effort → messages 缓存失效；
4. **没达到最短长度**；
5. **断点放在了会变的块上**（见第三节）；
6. **JSON 键顺序不稳定**：某些语言（如 Swift、Go）把对象转 JSON 时会打乱键顺序，导致工具调用块每次都不一样；
7. **并发请求**：缓存条目要等第一个请求的回复开始后才可用，并行发出的请求拿不到；需要命中就等第一个请求开始返回后再发后续请求；
8. **跨工作区**：在 Claude API 上缓存按工作区隔离，不同工作区之间不共享。

官方还提供了「缓存诊断（Cache diagnostics）」功能，让 API 对比连续两次请求，告诉你前缀从哪里开始不一致。

另外，在部分新模型上，想在对话中途追加系统指令又不破坏缓存，可以在 `messages` 末尾追加一条 `role: "system"` 消息，而不是修改顶层 `system` 字段（具体支持哪些模型见官方文档）。

## 常见问题

**Q：缓存会不会泄露给别人？**
不会。官方说明缓存在组织之间完全隔离，即使提示词一模一样也不共享；在 Claude API 上还按工作区隔离。

**Q：哪些内容能缓存？**
工具定义、system 内容块、用户和助手的文本消息、用户消息里的图片和文档、工具调用和工具结果都可以。思考块不能直接打 `cache_control`，但可以随之前的助手消息一起被缓存；空文本块不能缓存。

**Q：Claude Code 也用提示词缓存吗？**
用，而且是自动的。Claude Code 的缓存机制（订阅用户的缓存时长、什么操作会让缓存失效）见官方《How Claude Code uses prompt caching》，省 token 的做法详见本站《Claude Code 上下文满了怎么办：/compact、/clear 与省 token 技巧》。

**Q：Python SDK 怎么写多轮对话？**
详见本站《Claude API Python 入门：安装 SDK、第一个请求、流式输出与多轮对话》，在 `messages.create` 里加上 `cache_control` 即可。

## 参考资料

- Prompt caching（官方）：https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Cache diagnostics（官方）：https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics
- Pricing（官方）：https://platform.claude.com/docs/en/about-claude/pricing
- How Claude Code uses prompt caching（官方）：https://code.claude.com/docs/en/prompt-caching
