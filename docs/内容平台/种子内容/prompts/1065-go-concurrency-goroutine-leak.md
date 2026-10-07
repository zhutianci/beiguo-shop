---
title: Go 并发编程提示词（goroutine 泄漏排查、channel 用法、context 取消、errgroup 限制并发）
slug: go-concurrency-goroutine-leak
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 写 Go 并发代码（批量调用、生产者消费者、超时控制）或者服务 goroutine 数量持续上涨、偶发死锁时用：让 AI 审查或编写并发代码，确保每个 goroutine 都有退出路径、channel 由谁关闭清楚、context 能逐层取消，并给出用 pprof 定位泄漏的方法。
prompt: |
  你是一名精通 Go 并发模型的后端工程师。请帮我处理下面的并发问题。

  - 任务：[审查代码/编写代码/排查泄漏]
  - Go 版本：[Go 版本]（例：1.23）
  - 场景描述：[并发场景]（例：并发调用 3 个下游接口，任一失败就取消其余）
  - 现象（排查时填写）：[现象]（例：goroutine 数量每天涨几万）
  - 代码：
    [粘贴代码]

  检查与编写时遵循这些原则，并逐条说明代码是否满足：
  1. 每个启动的 goroutine 都必须有明确的退出条件：谁负责通知它结束、在什么情况下结束。
  2. channel：
     - 由发送方关闭，接收方不关闭；多个发送方时用额外的同步手段确定关闭时机；
     - 无缓冲 channel 的发送在没有接收者时会永久阻塞，这是最常见的泄漏原因（例如超时返回后，后台 goroutine 仍在尝试发送结果）；
     - 对 nil channel 读写会永久阻塞；向已关闭的 channel 发送会 panic。
  3. context：
     - 从入口一路向下传递，不保存在结构体中；
     - 所有可能阻塞的操作（网络、等待 channel、sleep）都要和 context 的取消一起 select；
     - 用 WithTimeout 或 WithCancel 创建的 context，要调用返回的 cancel 释放资源。
  4. 并发上限：大批量任务不能无限制地启动 goroutine，使用 errgroup 的并发限制或工作池；说明 errgroup 在第一个错误发生后如何取消其他任务。
  5. 共享数据：用互斥锁保护还是通过 channel 传递所有权；提醒用竞态检测运行测试。
  6. panic：goroutine 内的 panic 不会被调用方的 recover 捕获，需要时在 goroutine 内部处理。

  排查泄漏时：给出用 pprof 查看 goroutine 堆栈的方法，教我从堆栈中找出「大量 goroutine 阻塞在同一行」的位置。

  输出：问题清单（位置 | 问题 | 后果）、修改后的完整代码、对应的测试（包含竞态检测的运行命令）。
negativePrompt: null
source: null
verify:
  - 用「超时返回后后台 goroutine 向无缓冲 channel 发送结果」的代码跑一次，检查是否识别为泄漏并给出带缓冲或 select ctx.Done() 的修法
---
**怎么填变量**：[现象] 排查泄漏时最好附上 pprof 的 goroutine 汇总（哪一行阻塞了多少个），AI 可以直接定位。审查代码时把启动 goroutine 的函数和它使用的 channel 定义一起贴上。

**常见坑**：
- 用 select 加超时实现「最多等 3 秒」，超时后函数返回了，但负责干活的 goroutine 还在尝试把结果发到无缓冲 channel 里，永远没人接收，于是泄漏。给 channel 一个缓冲位，或者让发送也监听取消信号。
- 创建了带超时的 context 却没有调用 cancel，定时器要等到超时才释放。
- 每来一个请求启动一个 goroutine 去处理一批子任务，没有上限，高峰期内存暴涨。

**追问技巧**：追问「为这段代码写一个测试，在测试结束时检查没有遗留的 goroutine」，或「把这个模式改写成可复用的工作池」。

### 示例输出

> 示例，仅供参考（并发调用多个下游，任一失败即取消其余）

```go
func FetchAll(ctx context.Context, ids []string) ([]Result, error) {
	g, ctx := errgroup.WithContext(ctx) // 任一任务返回错误时，ctx 被取消
	g.SetLimit(8)                       // 最多 8 个并发
	results := make([]Result, len(ids)) // 每个 goroutine 写自己的下标，无需加锁

	for i, id := range ids {
		g.Go(func() error {
			r, err := fetchOne(ctx, id) // fetchOne 内部必须响应 ctx 取消
			if err != nil {
				return fmt.Errorf("fetch %s: %w", id, err)
			}
			results[i] = r
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}
	return results, nil
}
```

说明：Go 1.22 起循环变量每次迭代都是新变量，闭包中直接使用 `i`、`id` 是安全的；更早的版本需要在循环内重新赋值。

```bash
go test -race ./...
```
