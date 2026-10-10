---
title: DeepSeek API怎么用：Python调用、思考模式、价格与常见报错
slug: deepseek-api-python-quickstart
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek API 怎么用？本文按官方文档讲清 base_url 与模型名、用 OpenAI SDK 发出第一个请求、思考模式和流式输出怎么开关、分时段价格怎么算，以及 400、401、402、429、503 等报错的处理。
checkedOn: 2026-10-11
sources:
  - https://api-docs.deepseek.com/zh-cn/
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
  - https://api-docs.deepseek.com/zh-cn/quick_start/token_usage
  - https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit
  - https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
  - https://api-docs.deepseek.com/zh-cn/updates
---

## 适用于谁

- 搜「deepseek api 怎么用」「deepseek api 价格」，已经拿到 API Key、想跑通第一段代码的人；
- 从旧教程照抄 `deepseek-chat`、`deepseek-reasoner` 发现对不上的人。

本文根据 DeepSeek 官方 API 文档整理，资料核对于 2026-10-11。还没有 Key 的话先看《DeepSeek API Key 怎么获取》。

## 结论先说

1. **DeepSeek API 兼容 OpenAI 和 Anthropic 两种格式**，装好 OpenAI SDK、把 `base_url` 换成 `https://api.deepseek.com` 就能调用。
2. **当前模型名是 `deepseek-flash` 和 `deepseek-v4-pro`**。官方更新日志写明，旧名字 `deepseek-chat`、`deepseek-reasoner` 原定于 2026-07-24 停用，旧教程里的写法要换掉。
3. **思考模式默认开启**，不需要推理的简单任务可以关掉，回答更快。
4. **价格分高峰和空闲两个时段**，空闲时段是高峰价格的一半。

## 步骤

### 1. 安装 SDK 并设置 Key

```bash
pip3 install openai
export DEEPSEEK_API_KEY="你的 Key"      # Windows PowerShell 用 $env:DEEPSEEK_API_KEY="你的 Key"
```

### 2. 发出第一个请求

下面的写法与官方「首次调用 API」示例一致：

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)

response = client.chat.completions.create(
    model="deepseek-flash",
    messages=[
        {"role": "system", "content": "你是一个严谨的助手，回答使用简体中文。"},
        {"role": "user", "content": "用三句话解释什么是 token。"},
    ],
    stream=False,
)

print(response.choices[0].message.content)
print(response.usage)   # 这次请求实际消耗的 token
```

关于 token，官方给的粗略换算是：1 个中文字符约 0.6 个 token，1 个英文字符约 0.3 个 token，实际以返回结果里的 `usage` 为准。

### 3. 选模型

官方「模型与价格」页（2026-10-11 核对）列出的两个模型：

| | deepseek-flash | deepseek-v4-pro |
| --- | --- | --- |
| 模型版本 | DeepSeek-V4.1-Flash | DeepSeek-V4-Pro-0813 |
| 上下文长度 | 1M | 1M |
| 最大输出 | 384K | 384K |
| 图像理解 | 支持 | 不支持 |
| 并发限制 | 2500 | 500 |

两者都支持 JSON Output、Tool Calls、Responses API 和 Anthropic API 格式。官方 2026-09-10 的发布说明称 V4.1 Flash 在性能、费用、速度上已全面超过 V4 Pro，因此新项目一般直接用 `deepseek-flash`。更新日志随后说明，2026-09-14 之后继续提供 `deepseek-v4-pro` 的调用服务、计费方式不变，如有变动会另行通知。

### 4. 开关思考模式

思考模式默认开启，默认强度为 `high`。用 OpenAI SDK 时，`thinking` 参数要放在 `extra_body` 里：

```python
response = client.chat.completions.create(
    model="deepseek-flash",
    messages=[{"role": "user", "content": "9.11 和 9.8 哪个大？说明理由。"}],
    reasoning_effort="high",                       # low / high / max
    extra_body={"thinking": {"type": "enabled"}},  # 关闭写 "disabled"
)

print(response.choices[0].message.reasoning_content)  # 思考过程
print(response.choices[0].message.content)            # 最终回答
```

官方文档里几条容易踩的规则：

- 思考模式下 `temperature`、`presence_penalty`、`frequency_penalty` 不生效（传了不报错，但没有作用）；
- 多轮对话如果**没有**用工具调用，历史轮次的 `reasoning_content` 不需要回传；如果请求里带了 `tools`，历史的 `reasoning_content` 必须完整回传，否则返回 400。

### 5. 流式输出

把 `stream` 设为 `True`，逐块读取：

```python
stream = client.chat.completions.create(
    model="deepseek-flash",
    messages=[{"role": "user", "content": "写一首关于秋天的四行诗"}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if getattr(delta, "content", None):
        print(delta.content, end="", flush=True)
```

等待期间服务器会发保活内容：非流式请求持续返回空行，流式请求返回 `: keep-alive` 注释。用官方 SDK 时不用管；自己解析 HTTP 响应就要跳过它们。请求发出 10 分钟后仍未开始推理，服务器会关闭连接。

### 6. 算一下要花多少钱

官方价格（元 / 百万 token，2026-10-11 核对，官方声明价格可能变动）：

| | deepseek-flash 空闲 / 高峰 | deepseek-v4-pro 空闲 / 高峰 |
| --- | --- | --- |
| 输入（缓存命中） | 0.02 / 0.04 | 0.15 / 0.30 |
| 输入（缓存未命中） | 1 / 2 | 4.5 / 9.0 |
| 输出 | 4 / 8 | 13.5 / 27.0 |

高峰时段是北京时间周一至周五（不含法定节假日）9:00–12:00、14:00–18:00，其余时间（含周末和节假日全天）都是空闲时段。批量任务放到晚上或周末跑，费用减半。

## 常见问题

**Q：报错码分别是什么意思？**
按官方错误码表：400 请求体格式错误；401 API Key 错误；402 余额不足；422 请求参数错误；429 请求速率达到上限；500 服务器内部故障；503 服务器繁忙（负载过高，稍后重试）。

**Q：429 怎么处理？**
限速按账号计算，与用几个 Key 无关：一个请求从发出到响应完成算一个并发，超过上限就返回 429。做法是降低并发、加上带退避的重试；确实需要更高并发可以向官方提交扩容工单。

**Q：旧代码里的 `deepseek-chat` 还能用吗？**
官方更新日志写的是这两个旧名字原定 2026-07-24 停用。直接改成 `deepseek-flash`，需要推理就用思考模式参数控制。

**Q：能在 Cursor、Claude Code 这类工具里用吗？**
可以。支持自定义 OpenAI 兼容接口的工具填上面的 base_url 和 Key 即可；Claude Code 的官方接法见《DeepSeek 接入 Claude Code 教程》。

**Q：API 能联网搜索吗？**
API 里没有聊天产品那样的「智能搜索」开关。官方文档说明，通过 Anthropic 兼容接口在 Claude Code 中可以直接使用由 DeepSeek 提供的 Web Search 工具（搜索结果的总结会额外消耗 token）；其他场景可以用工具调用（Tool Calls）接入你自己的搜索服务，具体以官方文档为准。

## 参考资料

- DeepSeek API 文档：首次调用 API — https://api-docs.deepseek.com/zh-cn/
- 模型与价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- 思考模式 — https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
- Token 用量计算 — https://api-docs.deepseek.com/zh-cn/quick_start/token_usage
- 限速与隔离 — https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit
- 错误码 — https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
- 更新日志 — https://api-docs.deepseek.com/zh-cn/updates
