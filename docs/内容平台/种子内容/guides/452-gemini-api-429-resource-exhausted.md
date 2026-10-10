---
title: Gemini API 429 错误怎么解决：RESOURCE_EXHAUSTED 的原因与 400 / 403 / 503 排查表
slug: gemini-api-429-resource-exhausted
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: Gemini API 报 429 RESOURCE_EXHAUSTED 是某项限额超了。本文按官方文档教你分清是每分钟还是每天的限额、去哪看用量、怎么写退避重试，并附 400、402、403、503 等错误的排查表。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/api-errors
  - https://ai.google.dev/gemini-api/docs/generate-content/api-errors
  - https://ai.google.dev/gemini-api/docs/troubleshooting
  - https://ai.google.dev/gemini-api/docs/rate-limits
  - https://ai.google.dev/gemini-api/docs/billing
  - https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
  - https://ai.google.dev/gemini-api/docs/available-regions
  - https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6
verify:
  - 用户常搜的英文提示「Resource has been exhausted (e.g. check quota)」「You exceeded your current quota」在 2026-10-10 的官方错误码文档里没有逐字出现；官方对 429 的描述是「超过了某一项速率限制（RPM、TPM、RPD、支出等）」，正文按状态码和错误码判断，不依赖报错文字
  - 重试示例代码为本文自写，按官方「指数退避、加抖动、只重试暂时性错误、限制次数」的原则实现，未经实际运行
  - Gemini API 的 429 响应是否带 Retry-After 响应头，官方文档没有提及，示例未使用
  - 官方排错页只给了 Python SDK 的默认重试参数（最多 4 次、初始约 1 秒、最长 60 秒），JavaScript SDK 的默认值未写明
  - 旧版错误表里 500 / 503 的「换模型」示例仍写 Gemini 2.5 Pro 换 2.5 Flash，为官方原文，未随模型更新
---

> 本文根据 Gemini API 官方文档（API errors 的 Interactions 版与 generateContent 版、Troubleshooting guide、Rate limits、Billing）整理，资料核对于 2026-10-10。

## 适用于谁

- 调用 Gemini API 时遇到 `429`、`RESOURCE_EXHAUSTED`、`rate_limit_exceeded`、`quota_exceeded` 的人；
- 刚开始用、请求没发几个就被拒的人；
- 批量跑任务，想写一个靠谱重试逻辑的开发者；
- 遇到 400、403、503 等其他错误，想快速对照官方说明的人。

## 结论先说

1. **429 的意思是超过了某一项限额**，官方列的有每分钟请求数（RPM）、每分钟 token 数（TPM）、每天请求数（RPD），付费层还有按 10 分钟计的支出速率上限。
2. **先分清是「每分钟」还是「每天」**：每分钟类的等一会儿、降速重试就能恢复；每天的配额用完了，重试没用，只能等重置（太平洋时间午夜）或升档。
3. **限额按项目计算，不按密钥**。换一把同项目的密钥解决不了问题。
4. **重试用指数退避加随机抖动**，并限制次数。官方 Python SDK 默认已经会自动重试。
5. **402 不是 429**：402 表示预付费余额用完，官方明确说不要重试，先充值。

## 一、先看清返回的是哪种 429

Gemini API 现在有两套接口，错误的写法不一样：

**新版 Interactions API**：响应体里是 `error.code`（小写加下划线的字符串）和 `error.message`。

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "……"
  }
}
```

官方错误表里，429 对应三个错误码：

| `error.code` | 官方说明 | 官方建议 |
| --- | --- | --- |
| `rate_limit_exceeded` | 超过了每分钟或每秒的请求数 / token 数限制 | 等待后用指数退避重试 |
| `quota_exceeded` | 超过了**每日配额** | 等配额重置，或申请提高配额 |
| `too_many_requests` | 短时间内请求过多 | 等待后用指数退避重试 |

流式请求（`stream: true`）出错时不走 HTTP 状态码，而是在事件流里发一个 `event_type` 为 `error` 的事件，里面同样有 `code` 和 `message`。

**旧版 generateContent API**：响应体是 gRPC 风格，`code` 是数字状态码，`status` 是大写的状态名。

```json
{
  "error": {
    "code": 429,
    "message": "……",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

官方对这一条的解释是：你超过了 API 的某一项速率限制（RPM、TPM、RPD、支出等）——请求发得太多、用的 token 太多，或者超过了账号档位对应的支出类限制。

## 二、按原因逐项排查

1. **看自己的限额和用量**。打开 AI Studio 的 Rate Limit 页面（aistudio.google.com/rate-limit），每个模型的 RPM、TPM、RPD 上限和近期峰值都在上面。三项是分别检查的，官方举例：RPM 上限 20 时，一分钟内第 21 个请求就会报错，即使 TPM 还很富余。
2. **确认是不是每天的配额用完了**。RPD 在太平洋时间午夜重置，在那之前重试没有意义。
3. **检查是不是别的程序在用同一个项目**。限额是项目级的，同项目下所有密钥、所有程序共用。
4. **看用的是不是预览版或实验版模型**。官方说明这类模型的限额更严。
5. **免费层撞限额很正常**。免费层的限额本来就低，各模型具体数字以 Rate Limit 页面为准。开通结算进入 Tier 1 后限额会提高，见本站《Gemini API 免费额度是多少：免费层级、RPM / TPM / RPD 速率限制与限额查询》。
6. **付费层突然 429，想想是不是花得太快**。官方对付费档位设有「支出速率上限」，在滚动的 10 分钟窗口内计算，超了同样返回 429 RESOURCE_EXHAUSTED。官方给的办法是：稍等再试；降低高成本请求的频率，比如缩小上下文、缩短输出；正常使用也经常撞到的话，申请提高限额。
7. **减少 token 用量**。TPM 按输入 token 计。删掉重复的上下文，长对话只保留必要的历史。
8. **失败的请求也占配额**。官方账单页写明，返回 400 或 500 的请求不收费，但仍计入配额。无间隔地连续重发只会更糟。
9. **不急的任务改用 Batch API**。官方说明批量请求有独立的速率限制，和普通调用分开计算（目前只有旧版 generateContent 支持 Batch）。
10. **还是不够就申请提额**。官方 Rate limits 页面底部有付费层的提额申请表单，不保证批准。

## 三、怎么重试才对

官方排错页的重试建议：

- **指数退避**：第一次重试前等一小段时间（例如 1 秒），之后按 2 秒、4 秒、8 秒递增；
- **加抖动（jitter）**：在等待时间上加一点随机量，避免所有客户端同时重试；
- **只重试暂时性错误**：429、408 和 5xx 可以重试；400、402、403 这类客户端错误不要重试，它们说明密钥无效、预付余额耗尽或请求写错了；
- **设最大重试次数**，防止死循环。

官方 SDK 已经内置了这套逻辑：排错页说明 Python SDK 默认会对超时、网络问题、429 和 5xx **自动重试最多 4 次**，初始等待约 1 秒，最长 60 秒。所以用 SDK 时通常不用自己再包一层；如果自己再写重试，注意总请求次数会相乘。

直接调 REST 接口时，可以参考下面的写法（示例用 `httpx`，安装 `google-genai` 时会一并装上）：

```python
import os
import random
import time

import httpx

URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
HEADERS = {
    "x-goog-api-key": os.environ["GEMINI_API_KEY"],
    "Content-Type": "application/json",
}
RETRYABLE = {408, 429, 500, 502, 503, 504}   # 官方：只重试暂时性错误


def create_with_backoff(payload, max_attempts=5, base_delay=1.0, max_delay=60.0):
    for attempt in range(1, max_attempts + 1):
        resp = httpx.post(URL, headers=HEADERS, json=payload, timeout=120)
        if resp.status_code == 200:
            return resp.json()

        try:
            err = resp.json().get("error", {})
        except ValueError:
            err = {}
        code = err.get("code")

        give_up = (
            resp.status_code not in RETRYABLE   # 400 / 402 / 403 等：重试没用
            or code == "quota_exceeded"          # 每日配额用完：等重置或提额
            or attempt == max_attempts
        )
        if give_up:
            raise RuntimeError(f"{resp.status_code} {code}: {err.get('message')}")

        delay = min(max_delay, base_delay * 2 ** (attempt - 1))
        time.sleep(delay + random.uniform(0, 1))   # 加随机抖动


result = create_with_backoff({
    "model": "gemini-3.8-flash",
    "input": "用一句话介绍你自己",
})
print(result["steps"][-1]["content"][0]["text"])
```

## 四、其他常见错误码对照表

下表合并了官方两版错误表。左边是旧版 generateContent 的状态名，右边是新版 Interactions API 的错误码。

| HTTP | generateContent 状态 | Interactions 错误码 | 含义 | 官方建议 |
| --- | --- | --- | --- | --- |
| 400 | INVALID_ARGUMENT | `invalid_request`、`parameter_unknown` | 请求体格式错误、参数无效或有不认识的参数 | 对照 API 参考检查拼写和必填字段；别在旧版本端点上用新功能 |
| 400 | FAILED_PRECONDITION | `failed_precondition` | 前置条件不满足。典型的是「你所在的国家或地区不提供免费层，请开通结算」 | 检查项目的结算状态 |
| 401 | — | `authentication` | 密钥缺失、无效或已过期 | 检查 API 密钥 |
| 402 | RESOURCE_EXHAUSTED | `payment_required` | 预付费余额用完，该结算账号下所有密钥都停用 | 充值或开启自动充值；**不要重试** |
| 403 | PERMISSION_DENIED | `permission_denied` | 密钥没有所需权限 | 确认用对了密钥、密钥有访问权限 |
| 404 | NOT_FOUND | `not_found`、`model_not_found` | 资源不存在，或模型名不存在 | 核对模型 ID；检查请求里引用的文件是否还在 |
| 429 | RESOURCE_EXHAUSTED | 见第一节 | 超过速率限制或配额 | 见第二、三节 |
| 499 | CANCELLED | `cancelled` | 客户端在完成前取消或断开 | 检查客户端超时设置和网络 |
| 500 | INTERNAL | `api_error` | 服务器内部错误。旧版表格举的例子是输入上下文过长 | 重试；缩短上下文或临时换一个模型；看状态页 |
| 503 | UNAVAILABLE | `service_unavailable` | 服务暂时过载或不可用 | 等待后退避重试；临时换模型；看状态页 |
| 504 | DEADLINE_EXCEEDED | `deadline_exceeded` | 没能在期限内处理完，常见于提示或上下文太大 | 调大客户端的超时时间，或去掉客户端超时改用服务器默认值 |

几条补充：

- **状态页**：官方的 Gemini API 状态页在 aistudio.google.com/status。500、503 持续出现时先看这里有没有故障公告；仍无法解决，官方建议用 AI Studio 里的「发送反馈（Send feedback）」按钮上报。
- **400 的两个新原因**：从 Gemini 3.6 Flash、3.5 Flash-Lite 起，请求以模型角色的内容结尾（即「预填回复开头」）会返回 400；`temperature`、`top_p`、`top_k` 目前被忽略，官方预告未来的模型代际里再传也会返回 400。
- **密钥无效的状态码两套接口不同**：新版错误表里是 401 `authentication`；旧版 generateContent 的官方示例里，无效密钥返回的是 400 INVALID_ARGUMENT，提示「API key not valid. Please pass a valid API key.」。
- **密钥被封**：报「Your API key was reported as leaked. Please use another API key.」说明这把密钥被检测到泄露并封禁，需要新建密钥，见本站《Gemini API Key 怎么获取：在 AI Studio 创建密钥、设置环境变量与安全限制》。
- **403 Access Restricted（AI Studio 网页里）**：官方排错页说明这表示使用方式不符合服务条款，常见原因之一是所在地区不在可用地区列表内。请遵守所在地法律和服务条款。
- **内容被拦截不是 HTTP 错误**：因安全、引用（recitation）等原因被拦时，Interactions API 会给出 `safety`、`recitation`、`prohibited_content` 这类「生成被阻止」代码，需要修改输入后再试。

## 常见问题

**Q：我才发了几个请求就 429？**
先确认是哪一项超了。免费层的限额本来就低（具体数字看 Rate Limit 页面），循环里连发请求很容易触发每分钟的限制；另外看项目下是否还有别的程序在跑，以及用的是不是限额更严的预览版模型。

**Q：余额充足为什么还是 429？**
速率限制和余额是两回事。付费层还有按 10 分钟计的支出速率上限，以及档位对应的每月账单上限，详见本站《Gemini API 怎么收费：按 token 计费、预付费充值（Prepay）与支出上限设置》。

**Q：换一把密钥行不行？**
同一个项目下的密钥共用限额，换了也没用。

**Q：开通付费后多久生效？**
官方说明从免费层到 Tier 1 通常立即生效，之后的升档一般在 10 分钟内。

**Q：延迟很高、token 用得特别多，是出错了吗？**
通常不是。官方排错页解释，Gemini 3 系列默认开启思考，会产生额外的推理 token 并拉长响应时间。对速度或成本敏感时，把思考等级调低。

## 参考资料

- API errors（Interactions API 版，官方）：https://ai.google.dev/gemini-api/docs/api-errors
- API errors（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/api-errors
- Troubleshooting guide（官方）：https://ai.google.dev/gemini-api/docs/troubleshooting
- Rate limits（官方）：https://ai.google.dev/gemini-api/docs/rate-limits
- Billing（官方）：https://ai.google.dev/gemini-api/docs/billing
- Troubleshoot Google AI Studio（官方）：https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
- Available regions for Google AI Studio and Gemini API（官方）：https://ai.google.dev/gemini-api/docs/available-regions
- What's new in Gemini 3.6 Flash and 3.5 Flash-Lite（官方）：https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6
