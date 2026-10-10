---
title: Kimi API怎么用：API Key获取、Python调用、K3价格与429报错处理
slug: kimi-api-key-quickstart
products: [kimi]
models: []
accountTier: OTHER
excerpt: Kimi API Key 在哪里获取、怎么用 Python 调用 K3、价格怎么算、429 和 401 报错怎么办？本文按 Kimi API 开放平台官方文档讲清注册认证、创建 Key、base_url 与模型名、计费规则和常见错误排查。
checkedOn: 2026-10-11
sources:
  - https://platform.kimi.com/docs/intro
  - https://platform.kimi.com/docs/pricing/chat
  - https://www.kimi.com/help/kimi-api/api-account-and-auth
  - https://www.kimi.com/help/kimi-api/api-free-trial
  - https://www.kimi.com/help/kimi-api/api-rate-limits
  - https://www.kimi.com/help/kimi-api/api-troubleshooting
---

## 适用于谁

- 搜「kimi api key 获取」「kimi api 开放平台」「kimi api 价格」「kimi k3 api」的开发者；
- 买了 Kimi 会员，想知道能不能拿会员额度调 API 的人；
- 调用时遇到 401、429、model_not_found 的人。

本文根据 Kimi API 开放平台官方文档和 Kimi 帮助中心的 API 文章整理，资料核对于 2026-10-11。

## 结论先说

1. **API 开放平台是 platform.kimi.com**（原 platform.moonshot.cn 已跳转到这里），和聊天用的 kimi.com 账号体系、计费都是分开的。
2. **API 只按量计费，没有订阅制**。Kimi 会员的额度不能拿来调开放平台的 API；Kimi Code 的 Key 和开放平台的 Key 也不通用。
3. **接口兼容 OpenAI SDK**：`base_url` 填 `https://api.moonshot.cn/v1`，模型名填 `kimi-k3` 等。
4. **国内站和国际站互相隔离**：platform.kimi.com 对应 `api.moonshot.cn`，platform.kimi.ai 对应 `api.moonshot.ai`，账户和 Key 不能混用。
5. 新用户认证后有 15 元代金券，但官方写明**代金券不能用于 Kimi K3**，用 K3 需要先充值。

## 步骤

### 1. 注册并完成实名认证

打开 platform.kimi.com 登录。在用户中心完成实名认证：

- **个人认证**：按页面提示完成实名；
- **企业认证**：需要企业名称、同名银行账号和统一社会信用代码，平台会向企业账户打一笔随机小额款项，由财务确认金额后填回。

官方说明认证后可以获得更高的速率限制、开发票等权益；个人可以转企业（余额和用量保留），企业不能转个人。使用国内手机号注册的新用户，完成实名认证后赠送 15 元代金券，有效期 3 个月，扣费时优先使用。

### 2. 创建 API Key

进入控制台的 API Keys 页面，创建并复制密钥，存到环境变量里（官方示例用的变量名是 `MOONSHOT_API_KEY`）：

```bash
export MOONSHOT_API_KEY="你的 Key"      # Windows PowerShell：$env:MOONSHOT_API_KEY="你的 Key"
```

不要把 Key 写进代码或提交到 Git 仓库。

### 3. 发出第一个请求

官方快速开始要求 Python 3.8 及以上，并安装 1.0 以上版本的 openai 库：

```bash
pip install --upgrade 'openai>=1.0'
```

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["MOONSHOT_API_KEY"],
    base_url="https://api.moonshot.cn/v1",
)

completion = client.chat.completions.create(
    model="kimi-k3",
    messages=[
        {"role": "system", "content": "你是一个严谨的中文助手。"},
        {"role": "user", "content": "用三句话介绍一下什么是上下文缓存。"},
    ],
)

print(completion.choices[0].message.content)
```

### 4. 选模型

官方价格页（2026-10-11 核对）列出的模型和价格，单位为元 / 百万 token：

| model id | 上下文 | 输入（缓存命中） | 输入（未命中） | 输出 |
| --- | --- | --- | --- | --- |
| kimi-k3 | 1,048,576 | 2.00 | 20.00 | 100.00 |
| kimi-k2.7-code | 262,144 | 1.30 | 6.50 | 27.00 |
| kimi-k2.7-code-highspeed | 262,144 | 2.60 | 13.00 | 54.00 |
| kimi-k2.6 | 262,144 | 1.10 | 6.50 | 27.00 |

怎么选：官方文档把 `kimi-k3` 作为默认推荐；编程场景有专门的 `kimi-k2.7-code` 系列；对成本敏感的通用任务用 `kimi-k2.6`。价格可能调整，以官方价格页为准。

K3 的推理强度通过请求顶层的 `reasoning_effort` 设置，可选 `low`、`high`、`max`，**默认是 `max`**。简单任务记得调低，否则又慢又贵：

```python
completion = client.chat.completions.create(
    model="kimi-k3",
    reasoning_effort="low",
    messages=[{"role": "user", "content": "把这句话翻译成英文：今天天气不错。"}],
)
```

### 5. 弄清计费规则

- **按 token 计费**，输入和输出都收费；官方给的粗略换算是 1 个 token 约 1.5–2 个汉字；
- **缓存**：命中缓存的输入按「缓存命中」价格计，便宜一个数量级。K3 另有缓存写入费用（按 5 分钟和 1 小时两档）；
- **文件**：上传文件并抽取出的内容作为输入传给模型时，按输入计费；文件内容抽取和存储目前限时免费；
- **SDK 自动重试会多花钱**：官方提醒 OpenAI SDK 默认对 408、409、429 和 5xx 自动重试 2 次，一次调用可能变成 2–3 次请求。

### 6. 了解限速

限速有并发、RPM（每分钟请求数）、TPM（每分钟 token 数）、TPD（每天 token 数）四个维度，任意一个先到就触发。几条官方规则：

- 限速等级和**账户累计充值金额**挂钩，充得越多等级越高；各等级的具体数字在控制台查看；
- 限速按**用户**计算而不是按 Key，所有模型共享；
- 网关判断限速时用的是「请求 token 数 + `max_completion_tokens`」，而不是实际生成量。所以把 `max_completion_tokens` 设得过大，会更容易触发限速。

## 常见问题

**Q：返回 401 invalid_authentication_error？**
官方的说法是通常 Key 用错了平台：开放平台的 Key 和 Kimi Code 的 Key 不通用，国内站和国际站也互相隔离。核对 Key 的来源和 `base_url` 是否属于同一个站点。

**Q：返回 model_not_found？**
多半是没有设置 `base_url`，请求被发到了 OpenAI 的服务器。补上 `base_url` 即可。也可以用同一个 Key 调用 `GET /v1/models` 看看目标模型在不在列表里。

**Q：返回 429 怎么办？**
先看错误类型，三种情况处理不同：

- `engine_overloaded_error`：服务节点负载高。按响应里的 `Retry-After` 等待，降低并发、指数退避重试；充值不能解决这个问题；
- `rate_limit_reached_error`：触发了你的限速。降低频率，或通过充值提升等级；
- `exceeded_current_quota_error`：余额不足、欠费或代金券失效，充值后重试。

**Q：经常超时或连接断开？**
开启流式输出（`stream=True`），并检查 SDK 和代理的超时设置，避免长时间没有数据返回被网关断开。

**Q：Kimi 会员能当 API 用吗？**
不能。开放平台 API 是按量计费的独立产品；会员额度用于 kimi.com 和 Kimi Code 等产品。

**Q：客户端没收到结果，为什么也扣费了？**
官方说明客户端没显示结果不代表请求失败，服务端可能已经完成并计费。可以在控制台的用量看板和计费明细里按 `request_id` 逐条核对。

**Q：API 账号能注销吗？**
官方帮助中心写的是不支持账号注销；手机号可以换绑，但新手机号不能注册过开放平台或 Kimi 智能助手。

## 参考资料

- Kimi API 开放平台：快速开始 — https://platform.kimi.com/docs/intro
- Kimi API 开放平台：模型推理价格说明 — https://platform.kimi.com/docs/pricing/chat
- Kimi 帮助中心：API 账号与认证 — https://www.kimi.com/help/kimi-api/api-account-and-auth
- Kimi 帮助中心：API 免费体验（代金券）— https://www.kimi.com/help/kimi-api/api-free-trial
- Kimi 帮助中心：API 限速 — https://www.kimi.com/help/kimi-api/api-rate-limits
- Kimi 帮助中心：API 调用常见问题 — https://www.kimi.com/help/kimi-api/api-troubleshooting
