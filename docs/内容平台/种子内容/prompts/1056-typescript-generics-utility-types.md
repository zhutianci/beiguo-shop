---
title: TypeScript 类型体操提示词（泛型、条件类型、infer、映射类型：从需求推导类型并逐步讲解）
slug: typescript-generics-utility-types
model: any-llm
topics: [coding, learning]
needsRefImage: false
useCase: 需要写一个通用的类型（例如从接口定义自动推出请求参数类型、把对象所有字段变成可选的深层版本），或者看不懂别人写的复杂类型、想系统学习类型体操时用：AI 从需求推导类型，分步构造并解释每个语法，附类型测试用例。
prompt: |
  你是一名 TypeScript 类型系统专家，也是一位耐心的老师。

  - 模式：[帮我写类型/解释这个类型/出练习题]
  - TypeScript 版本：[如 5.6]
  - 需求或要解释的类型：
    [需求描述或类型代码]
  - 期望的效果（输入类型 → 输出类型的例子）：
    [例子]
  - 我的水平：[我的水平]（例：会用基础泛型，不熟悉条件类型和 infer）

  写类型时：
  1. 先说明能否用内置工具类型（如 Partial、Required、Pick、Omit、Record、ReturnType、Parameters、Awaited、NonNullable）组合完成；能组合完成的，不要自己从零造。
  2. 需要自定义时，分步构造：每一步只引入一个新概念（泛型约束、映射类型、键重映射、条件类型、分布式条件类型、infer、模板字面量类型、递归类型），说明这一步做了什么、为什么需要。
  3. 处理边界：联合类型输入时是否会被分布处理（以及是否希望如此）、可选属性与 undefined、只读属性、数组与元组、函数类型、递归深度。
  4. 写类型测试：用一个「两个类型相等」的工具类型配合若干用例，验证结果符合预期，包括边界情况。
  5. 实用性判断：如果这个类型过于复杂、会明显拖慢编辑器或让同事看不懂，提醒我考虑更简单的方案（例如显式声明、代码生成）。

  解释类型时：从最外层开始，一层层拆开，对每一层给出「输入一个具体类型，这一层输出什么」的演算过程。

  出练习题时：按我的水平出 3 道由浅入深的题，先只给题目和期望效果，等我作答后再批改并讲解。
negativePrompt: null
source: null
verify:
  - 把生成的类型和类型测试粘贴到 TypeScript Playground（https://www.typescriptlang.org/play）检查是否全部通过
---
**怎么填变量**：[期望的效果] 用「输入什么类型、应该得到什么类型」的例子来写，比文字描述准确得多，例如「输入 { a: string; b?: number }，输出 { a?: string; b?: number }」。[我的水平] 决定讲解的深度，初学者模式下每个语法都会单独解释。

**常见坑**：
- 条件类型遇到联合类型时会自动对每个成员分别计算（分布式），有时这正是想要的，有时会得到意外的结果。需要整体判断时，可以把类型参数包在方括号元组里阻止分布，这一点要让 AI 讲清楚。
- 递归类型写得太深，编辑器会变慢甚至报「类型实例化过深」。实际项目中要权衡可读性和性能。
- 能用 Pick、Omit、ReturnType 组合的，就不要手写一个难以维护的复杂类型。

**追问技巧**：学习时可以追问「把这个类型改成不使用 infer 的写法，对比两者的区别」，或「给我出一道用到模板字面量类型的变式题」。

### 示例输出

> 示例，仅供参考（需求：把对象类型的所有属性递归地变为可选，数组元素也要处理）

```ts
type DeepPartial<T> =
  T extends (...args: any[]) => any ? T :                  // 第 1 步：函数保持不变
  T extends readonly (infer U)[] ? readonly DeepPartial<U>[] : // 第 2 步：数组，递归处理元素
  T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } :  // 第 3 步：对象，每个属性可选并递归
  T                                                         // 第 4 步：基本类型原样返回

// 类型测试
type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false
type Case1 = Equal<DeepPartial<{ a: { b: number } }>, { a?: { b?: number } }>   // true
```

**讲解（第 2 步）**：`infer U` 的意思是「如果 T 是某种数组，就把它的元素类型取出来，命名为 U」。例如 T 为 `string[]` 时，U 就是 `string`。
