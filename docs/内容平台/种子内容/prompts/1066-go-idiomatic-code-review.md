---
title: Go 代码审查提示词（惯用写法、错误包装与 errors.Is / As、接口设计、命名与包结构）
slug: go-idiomatic-code-review
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 从其他语言转到 Go、写出来的代码「能跑但不像 Go」，或者团队想统一 Go 代码风格时用：让 AI 按 Go 社区的惯用法审查代码，重点看错误处理、接口放在哪里、零值可用、包的组织方式，并给出改写后的代码。
prompt: |
  你是一名资深 Go 工程师，熟悉 Effective Go、Go Code Review Comments 中的惯例。请审查下面的代码，指出「不够 Go」的地方。

  - 代码用途：[代码用途]（例：订单服务的仓储层）
  - Go 版本：[Go 版本]
  - 作者背景：[作者背景]（例：从 Java 转过来）
  - 代码：
    [粘贴代码]

  审查维度（只报告实际存在的问题）：
  1. 错误处理：
     - 错误是否被忽略；是否在同一个错误上既记录日志又返回（导致重复记录）；
     - 包装错误时用 %w 保留原错误并加上上下文；判断错误类型用 errors.Is 和 errors.As，而不是比较字符串；
     - 哨兵错误与自定义错误类型的选择；错误信息小写开头、不以标点结尾；
     - 不要用 panic 处理正常的业务错误。
  2. 接口：接口由使用方定义而不是实现方；接口尽量小；函数参数接受接口、返回具体类型；不要为了「将来可能替换」预先定义只有一个实现的接口。
  3. 命名：包名简短、小写、不重复包名（例如 order.OrderService 改为 order.Service）；首字母缩写保持一致大小写；接收者名称简短且一致。
  4. 结构与零值：结构体零值是否可用；不必要的构造函数和 getter / setter；指针接收者与值接收者的选择是否一致。
  5. 并发与资源：defer 关闭资源的时机、在循环中 defer 的问题、context 作为第一个参数传递。
  6. 包结构：是否存在按技术分层的过度拆分（如每个类型一个包）、循环依赖的风险、internal 目录的使用。
  7. 其他：切片与 map 的预分配、字符串拼接、不必要的类型转换。

  输出：问题表（位置 | 问题 | 惯用写法 | 理由），以及改写后的代码。对有争议、团队可以自行约定的风格问题，标注「风格偏好，可选」。
negativePrompt: null
source: null
verify:
  - 用一段带 Java 风格接口（IOrderRepository + 唯一实现）和字符串比较错误的 Go 代码跑一次，检查是否给出 errors.Is 与使用方定义接口的改写
---
**怎么填变量**：[作者背景] 写上会让审查更有针对性：从 Java 转过来的常见问题是过度抽象和 getter / setter，从 Python 转过来的常见问题是错误处理不严谨。

**常见坑**：
- 在实现所在的包里定义一个大接口，再写一个唯一的实现。Go 的习惯是让使用方按需要定义小接口，实现方直接返回具体类型。
- 用 `err.Error() == "not found"` 判断错误，错误信息一改就失效。用哨兵错误加 errors.Is。
- 每一层都 `log.Println(err)` 然后 `return err`，同一个错误在日志里出现好几次。要么处理并记录，要么加上上下文返回。

**追问技巧**：追问「根据这次审查的问题，整理一份团队 Go 代码规范（10 条以内），并推荐能自动检查其中哪些规则的 lint 工具」。

### 示例输出

> 示例，仅供参考（节选）

| 位置 | 问题 | 惯用写法 |
|---|---|---|
| `IOrderRepository` | 实现方定义接口，且只有一个实现 | 删除接口，导出具体类型；需要测试替身时由使用方定义小接口 |
| `GetOrder()` 第 18 行 | 用字符串比较判断「未找到」 | 定义 `var ErrNotFound = errors.New("order not found")`，用 errors.Is 判断 |
| `order.OrderService` | 类型名重复包名 | 改为 `order.Service` |

```go
var ErrNotFound = errors.New("order not found")

func (r *Repo) Get(ctx context.Context, id int64) (*Order, error) {
	var o Order
	err := r.db.QueryRowContext(ctx, `SELECT id, status FROM orders WHERE id = ?`, id).Scan(&o.ID, &o.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("query order %d: %w", id, err)
	}
	return &o, nil
}
```
