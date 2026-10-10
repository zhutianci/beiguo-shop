---
title: Python 异步并发提示词：asyncio 批量请求改造（限制并发数、超时、重试、结果按顺序收集）
slug: python-asyncio-concurrency
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 脚本要调用几千次接口或下载大量文件、一个个串行跑太慢时用：把同步代码交给 AI，改写成 asyncio 并发版本，带并发上限、超时、失败重试、进度显示和错误汇总，并说明什么时候其实用线程池更合适。
prompt: |
  你是一名熟悉 Python asyncio 的工程师。请把下面的串行代码改成并发执行。

  - Python 版本：[如 3.11]
  - 现有代码（串行版本）：
    [粘贴代码]
  - 任务规模：[如 5000 个 URL]
  - 对方服务的限制：[如每秒最多 20 次请求，或未知]
  - 失败处理要求：[如失败重试 3 次，最终失败的记录到文件]
  - 能否换用异步 HTTP 库：[可以/只能用 requests]

  要求：
  1. 先判断：这个任务是等待网络或磁盘为主（适合 asyncio 或线程池），还是计算为主（应该用多进程）。如果不能换用异步库，说明用线程池的写法。
  2. 并发控制：用信号量限制同时进行的请求数；对方有速率限制时，额外做速率控制，并说明两者的区别。
  3. 连接复用：整个任务共用一个会话或客户端对象，不要每个请求新建一个。
  4. 超时：每个请求有超时；说明整体超时的设置方式。
  5. 重试：只对可重试的错误（超时、连接错误、5xx、429）重试，指数退避；不可重试的错误直接记录。
  6. 结果收集：结果与输入一一对应（保持顺序或带上输入标识）；单个任务失败不影响其他任务；最后汇总成功数、失败数和失败原因分布。
  7. 进度：显示已完成数量。
  8. 正确使用 asyncio：入口用标准的运行方式；说明在 Jupyter 中运行时的区别；不要在协程中调用阻塞函数（如 time.sleep、同步的文件读写大文件），需要时放到线程中执行。

  只针对我有权访问的接口，遵守对方的速率限制和服务条款。输出：完整代码（中文注释）、依赖安装命令、参数怎么调。
negativePrompt: null
source: null
verify:
  - 用一个本地起的模拟服务（随机返回 500 和延迟）测试生成的代码，检查并发数是否被正确限制、失败是否被汇总
---
**怎么填变量**：[对方服务的限制] 一定要尊重。并发数不是越大越好：超过对方的限制会被封禁或返回大量 429，反而更慢。不知道限制时，从较小的并发（例如 5 到 10）开始逐步调。[能否换用异步库] 决定了方案：requests 是同步库，放在协程里直接调用会阻塞，要么换异步 HTTP 库，要么用线程池。

**常见坑**：
- 在 async 函数里调用 requests 或 time.sleep，代码看起来是异步的，实际仍是一个个串行执行。
- 一次性为几千个任务创建协程并同时发出，没有并发上限，瞬间打满对方服务或耗尽本机的连接和文件描述符。
- 用 gather 收集结果时没有处理异常，一个任务出错就导致整体失败或其他结果丢失。可以开启返回异常的选项，或在每个任务内部捕获。

**追问技巧**：追问「把结果边完成边写入文件，中途中断后可以从断点继续，不重复请求已完成的部分」。

### 示例输出

> 示例，仅供参考（使用 httpx 异步客户端，节选）

```python
import asyncio
import httpx

CONCURRENCY = 10
RETRIABLE = {429, 500, 502, 503, 504}

async def fetch(client: httpx.AsyncClient, sem: asyncio.Semaphore, url: str) -> tuple[str, int | str]:
    async with sem:
        for attempt in range(3):
            try:
                r = await client.get(url, timeout=10)
                if r.status_code in RETRIABLE:
                    raise httpx.HTTPStatusError("可重试", request=r.request, response=r)
                return url, r.status_code
            except (httpx.TimeoutException, httpx.TransportError, httpx.HTTPStatusError) as e:
                if attempt == 2:
                    return url, f"失败：{type(e).__name__}"
                await asyncio.sleep(2 ** attempt)

async def main(urls: list[str]) -> None:
    sem = asyncio.Semaphore(CONCURRENCY)
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*(fetch(client, sem, u) for u in urls))
    failed = [r for r in results if isinstance(r[1], str)]
    print(f"完成 {len(results)}，失败 {len(failed)}")

asyncio.run(main(urls))
```
