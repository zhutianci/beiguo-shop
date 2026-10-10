---
title: OpenAI API 429 报错怎么解决：Too many requests 与 insufficient_quota 的区别
slug: openai-api-429-error
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: OpenAI API 返回 429 不一定是「请求太快」，也可能是余额用完、组织用量上限或你自己设的支出上限到了。本文按官方错误码文档教你看 error.code 分清两类 429，各自怎么处理，并给出遵守 Retry-After 的指数退避重试代码。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/guides/error-codes
  - https://developers.openai.com/api/docs/guides/rate-limits
  - https://help.openai.com/en/articles/5955604
  - https://developers.openai.com/api/docs/guides/spend-limits
  - https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing
  - https://help.openai.com/en/articles/1000499-troubleshooting-api-errors-and-latency
  - https://github.com/openai/openai-python
  - https://developers.openai.com/api/docs/guides/batch
  - https://status.openai.com/
verify:
  - 用户常搜的英文提示「You exceeded your current quota」在 2026-10-07 版官方错误码文档里没有逐字出现；文档现在写的是额度类错误的 error.type 仍可能是 insufficient_quota、具体原因看 error.code。正文按此处理
  - 重试示例代码为本文自写，按官方「遵守 Retry-After、缺失时指数退避加抖动、限制次数和总时长、不重试账单类错误」的原则实现，未经实际运行
---

> 本文根据 OpenAI 开发者文档（Error codes、Rate limits、Spend limits）和帮助中心《Troubleshooting API rate limits and 429 errors》（2026-10-07 当天更新）整理，资料核对于 2026-10-07。

## 适用于谁

- 调用 OpenAI API 时遇到 `429 Too Many Requests`、`RateLimitError` 的人；
- 报错里带 `quota`、`insufficient_quota` 字样，明明刚开始用就被拒的人；
- 批量跑任务、并发一高就报错，想写个靠谱重试逻辑的人。

## 结论先说

1. **429 有两类，处理方法完全相反**：
   - **临时限速**（请求或 token 发得太快）——等一等、降速、重试就能恢复；
   - **额度 / 账单类**（余额用完、用量上限、支出上限）——**重试没用**，必须先充值或调整上限。
2. **怎么分**：看返回体里的 `error.code`。官方说明额度类错误的 `error.type` 可能统一显示为 `insufficient_quota`，具体原因以 `error.code` 为准。
3. **重试要讲规矩**：响应头有 `Retry-After` 就至少等这么久；没有就用指数退避加随机抖动，并限制次数和总时长。官方 SDK 本身已会自动重试，自己再套一层要先关掉 SDK 重试。
4. **余额为正也可能 429**：速率限制、组织月度用量上限、支出上限和预付余额是互相独立的。

## 第一步：读懂这次是哪种 429

| 报错信息 / `error.code` | 属于 | 原因 | 怎么办 |
| --- | --- | --- | --- |
| Rate limit reached for requests / tokens | 临时限速 | 超过每分钟请求数（RPM）或 token 数（TPM）等限制 | 降速，按 `Retry-After` 等待后重试 |
| `slow_down`（type 为 `rate_limit_error`） | 临时限速 | 流量**增长太快**，即使没超 RPM / TPM 也会触发 | 先降速再逐步加量 |
| `credit_balance_exhausted` | 额度类 | 预付额度已用完 | 去 Billing 充值 |
| `organization_usage_limit_exceeded` | 额度类 | 达到 OpenAI 给组织分配的月度用量上限 | 在 Limits 页申请提高上限 |
| `organization_spend_limit_exceeded` | 额度类 | 达到你给组织设的硬性支出上限 | 提高 / 取消上限，或等下个月重置 |
| `project_spend_limit_exceeded` | 额度类 | 达到项目的硬性支出上限 | 同上，在项目设置里改 |

用 Python SDK 时，429 会抛出 `openai.RateLimitError`，可以直接读 `e.code`、`e.type` 和 `e.response.headers`。

## 临时限速：怎么降下来

1. **先看自己的限额**：开发者平台 **Settings → Organization → Limits**，能看到当前使用档位和各模型的限额。RPM 和 TPM 是两个独立的限制，可能只撞上其中一个。
2. **避免突发**：帮助中心提醒，限额可能按比显示周期更短的窗口执行，例如「每分钟 60 次」也可能按每秒检查。一次性并发几十个请求，平均值再低也会被拦。
3. **限额是组织和项目共享的**，不是每个人一份。同事在跑大任务、或者一个 Key 被多个程序共用，都会挤占额度。另外部分模型族共享同一份限额。
4. **减少 token**：删掉提示词里重复的上下文和示例；`max_output_tokens`（Chat Completions 是 `max_completion_tokens`）不要设得远大于实际需要——官方说明限速按这个上限和请求估算 token 数中较大的计算，推理 token 也包含在内。
5. **不急的任务用 Batch API**：批处理有独立且更高的限额，不占用同步请求的速率。
6. **平稳加量**：官方经验值是流量到每分钟 100 万输入 token 后，每 15 分钟增加不超过 50%，避免触发 `slow_down`。
7. **确认请求走的是哪个组织**：属于多个组织时，不同组织的档位和账单不同，检查默认组织设置或请求头里的组织 / 项目 ID。
8. **升档**：组织累计充值达到门槛后，使用档位（Build、Launch、Grow）会自动升级，限额通常更高，门槛见 Rate limits 页面。

## 额度 / 账单类：重试前先处理

- **余额用完**：到 **Settings → Billing** 购买额度，几分钟后余额更新再试。注意自动充值失败时会收到邮件，余额耗尽后调用就会停止。
- **用量上限**：在 Limits 页申请更高的已批准用量上限，或联系官方支持。
- **支出上限**：有权限的人去组织或项目的 Limits 里提高或取消硬上限；不改的话下个月自动重置。修改生效需要一点时间。

预付额度、自动充值和支出上限的设置方法，详见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。

## 带 Retry-After 的指数退避示例（Python）

下面的代码只对临时限速和 5xx 重试，遇到额度类 429 直接抛出：

```python
import random
import time

import openai
from openai import OpenAI

client = OpenAI(max_retries=0)  # 由下面的函数统一重试，避免与 SDK 自带重试叠加

BILLING_CODES = {
    "credit_balance_exhausted",
    "organization_usage_limit_exceeded",
    "organization_spend_limit_exceeded",
    "project_spend_limit_exceeded",
}

def create_with_backoff(max_attempts=6, base_delay=1.0, max_delay=60.0, **kwargs):
    for attempt in range(1, max_attempts + 1):
        try:
            return client.responses.create(**kwargs)
        except (openai.RateLimitError, openai.InternalServerError) as e:
            if e.code in BILLING_CODES or e.type == "insufficient_quota":
                raise  # 余额 / 限额问题，重试没有用
            if attempt == max_attempts:
                raise
            try:
                delay = float(e.response.headers.get("retry-after"))
            except (TypeError, ValueError):
                delay = min(max_delay, base_delay * 2 ** (attempt - 1))
            if delay > max_delay:
                raise  # 服务器要求等太久，改为稍后再处理，不要提前重试
            time.sleep(delay + random.uniform(0, 1))  # 加随机抖动，避免多个客户端同时重试

resp = create_with_backoff(model="gpt-6-astra", input="用一句话介绍你自己。")
print(resp.output_text)
```

要点说明：

- 官方 Python SDK 默认会对 429、5xx 和连接错误自动重试 2 次；如果像上面这样自己管重试，就把 `max_retries` 设为 0，或者把 SDK 的重试次数算进总预算，避免请求次数成倍放大；
- 失败的请求同样计入每分钟限额，无间隔地连续重发只会让情况更糟；
- 流式请求已经开始输出后中断的，不要自动重放，以免重复内容。

## 别和 503 搞混

`503` + `server_is_overloaded` 表示**模型暂时过载**，不是你的问题。同样按 `Retry-After` 等待后重试；持续出现就去 [status.openai.com](https://status.openai.com/) 看有没有故障。Python 里 429 抛 `RateLimitError`，503 抛 `InternalServerError`，两个都要处理。

## 常见问题

**Q：新注册就 429，余额显示有钱也不行？**
先看 `error.code`。如果是 `credit_balance_exhausted`，说明预付额度为 0 或刚充值还没到账；如果是限速类，看 Limits 页当前档位的限额是不是太低。

**Q：我有 ChatGPT Plus，为什么 API 还说额度不足？**
ChatGPT 订阅和 API 是两套独立计费，Plus 不包含 API 额度。开通 API 计费见 [/guides/openai-api-key](/guides/openai-api-key)。

**Q：联系官方支持要准备什么？**
完整的报错信息和错误码、相关的 request ID、出错时间（带时区）、Limits 页显示的限额，以及你已经尝试过的步骤。不要附上 API Key。

**Q：怎么看是不是我这边的网络问题？**
帮助中心建议在 Service Health（服务健康）面板按单个模型、服务档位和项目筛选，打开 **HTTP Requests** 看各状态码的数量；客户端报错但面板里没有对应记录，说明请求很可能根本没到达 OpenAI。

## 参考资料

- OpenAI 开发者文档：Error codes — https://developers.openai.com/api/docs/guides/error-codes
- OpenAI 开发者文档：Rate limits — https://developers.openai.com/api/docs/guides/rate-limits
- OpenAI 帮助中心：Troubleshooting API rate limits and 429 errors — https://help.openai.com/en/articles/5955604
- OpenAI 开发者文档：Spend limits — https://developers.openai.com/api/docs/guides/spend-limits
- OpenAI 帮助中心：Setting up and managing prepaid API billing — https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing
- OpenAI 帮助中心：Troubleshooting API errors and latency — https://help.openai.com/en/articles/1000499-troubleshooting-api-errors-and-latency
- openai-python 官方仓库 README（Retries、Handling errors）— https://github.com/openai/openai-python
- OpenAI 开发者文档：Batch API — https://developers.openai.com/api/docs/guides/batch
- OpenAI Status — https://status.openai.com/
