---
title: 代码转换提示词：Python 转 Go、JavaScript 转 TypeScript 等跨语言迁移（保持行为一致）
slug: code-translation
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要把一段代码或一个模块改写成另一种语言时用：不是逐行直译，而是写成目标语言的惯用写法，同时列出两种语言语义差异带来的行为变化，并给出对拍测试，证明新旧代码结果一致。
prompt: |
  【角色】你是一名同时精通 [源语言] 和 [目标语言] 的工程师，做过多次生产环境的语言迁移，知道迁移出事故几乎都出在「看起来一样、其实语义不同」的地方。

  【背景】
  - 源代码语言与版本：[源语言及版本]
  - 目标语言与版本：[目标语言及版本]
  - 迁移原因：[如性能、统一技术栈、类型安全]
  - 目标环境可用的依赖限制（如只能用标准库）：[依赖限制]
  - 待转换代码：
    [粘贴源代码]

  【任务】
  1. 先概括源代码的输入、输出和副作用（读写文件、网络、全局状态），作为「行为契约」。
  2. 给出依赖映射表：源语言的库或内置功能 | 目标语言的对应方案 | 差异说明。
  3. 写出目标语言代码：使用目标语言的惯用写法（错误处理方式、命名规范、并发模型、包结构），不要逐行直译。
  4. 列出语义差异清单，至少检查这些点并说明你是如何处理的：
     - 整数除法与取模对负数的取整方向、整数溢出（任意精度 vs 固定位宽）；
     - 字符串是按字节、码元还是字符计数与切片；
     - 字典或映射的遍历顺序是否稳定；
     - 空值语义（None、null、undefined、nil、零值）；
     - 异常与错误返回、默认参数与可变默认值、浮点格式化与舍入；
     - 时间与时区、正则方言、排序是否稳定。
  5. 给出对拍测试：一组覆盖边界情况的输入，以及分别在新旧代码上运行并比较输出的测试代码。

  【约束】
  - 行为必须与源代码一致，包括边界和报错情况；如果源代码本身有 bug，保留原行为并在清单中单独标出，由我决定是否修。
  - 目标语言没有直接对应的特性时，说明取舍，不要静默改变行为。
  - 推测出的意图要标注「推测」。

  【输出格式】
  行为契约 → 依赖映射表 → 目标代码（代码块）→ 语义差异清单（差异 | 源语言行为 | 目标语言行为 | 处理方式）→ 对拍测试 → 遗留问题。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts/blob/main/prompts.csv
  author: "@woyxiang"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: "以「Code Translator: Any Language to Any Language」条目为基础，改写为中文模板，增加行为契约、依赖映射、语义差异检查清单与对拍测试"
verify:
  - 用一段含负数整除和字典遍历的 Python 代码实测转 Go，检查是否识别出这两处差异
---
**怎么填变量**：版本要写具体，「Python 3.12 → Go 1.22」和只写「Python 转 Go」得到的结果不一样（比如是否能用泛型）。[依赖限制] 很关键：不写的话，AI 可能引入你们不允许用的第三方库。

**常见坑**：
- 逐行直译的代码能跑，但往往不地道，比如在 Go 里模拟 try/except、在 TypeScript 里满屏 any。
- JavaScript 转 TypeScript 不只是加类型：要明确 null 和 undefined 的区别，建议开启 strict 模式，类型实在不确定时用 unknown 并在使用处收窄，而不是 any。
- 一次转换的代码量控制在一个模块或几百行以内，太长时先让它出「模块拆分与迁移顺序」。

**追问技巧**：把对拍测试的失败输出贴回去，说「这组输入结果不一致，定位原因」；全部通过后追问「还有哪些输入是对拍没覆盖到的」。

### 示例输出

> 示例，仅供参考（语义差异清单节选，Python → Go）

| 差异 | Python | Go | 处理方式 |
|---|---|---|---|
| 负数整除 | `-7 // 2` 得 -4（向下取整） | `-7 / 2` 得 -3（向零取整） | 封装 floorDiv |
| 字典遍历 | 按插入顺序 | map 遍历顺序随机 | 输出前对 key 排序 |

```go
// floorDiv 与 Python 的 // 行为一致：向负无穷取整。b 不能为 0。
func floorDiv(a, b int) int {
	q := a / b
	if a%b != 0 && (a < 0) != (b < 0) {
		q--
	}
	return q
}
```

> 改编自 [@woyxiang / f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)「Code Translator: Any Language to Any Language」，许可证 CC0 1.0。
