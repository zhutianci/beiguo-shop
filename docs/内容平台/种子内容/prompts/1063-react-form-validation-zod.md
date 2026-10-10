---
title: React 表单与校验提示词（React Hook Form + Zod：前后端共用校验规则、联动字段、错误提示与提交状态）
slug: react-form-validation-zod
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用 React 做注册、下单、资料编辑这类表单，字段多、有联动校验、还要和后端校验保持一致时用：描述字段和规则，得到用 Zod 定义校验规则、React Hook Form 管理表单状态的完整代码，包括跨字段校验、后端错误回填和无障碍的错误提示。
prompt: |
  你是一名熟悉 React Hook Form 和 Zod 的前端工程师。请帮我实现一个表单。

  - 表单用途：[如企业开票信息填写]
  - 字段与规则（字段名、类型、是否必填、格式要求）：
    [字段与规则]
  - 字段之间的联动：[字段之间的联动]（例：选择「企业」时税号必填，选择「个人」时隐藏税号）
  - 提交接口与可能的错误返回：[提交接口与可能的错误返回]（例：POST /api/invoices，返回字段级错误）
  - UI 组件库：[UI 组件库]（例：shadcn/ui、Ant Design、原生元素）
  - 是否需要与后端共用校验规则：[是/否]

  要求：
  1. 用 Zod 定义校验规则，并从规则推导出 TypeScript 类型，不要重复手写类型。
  2. 错误提示用中文，具体到如何修正（例如「税号应为 15 到 20 位字母或数字」，而不是「格式错误」）。
  3. 联动校验：跨字段规则（如条件必填、两次密码一致、结束日期晚于开始日期）放在整体校验中，并把错误挂到具体字段上；被隐藏的字段不参与校验。
  4. 表单状态：校验的触发时机（失去焦点时校验，提交后改为输入时实时校验）；提交中禁用按钮，防止重复提交；提交成功后的处理。
  5. 后端错误：把接口返回的字段级错误回填到对应字段，把非字段错误显示在表单顶部。
  6. 无障碍：每个输入框关联标签；错误信息通过属性关联到输入框，并标记字段为无效；提交失败后焦点移到第一个出错的字段。
  7. 如果需要与后端共用：说明如何把校验规则放到共享模块中，后端用同一份规则再校验一次（前端校验只为体验，后端校验才是安全保障）。

  输出：校验规则文件、表单组件代码、一份测试（至少覆盖必填、联动必填、后端错误回填），代码带中文注释。
negativePrompt: null
source: null
verify:
  - 核对 zodResolver、superRefine、setError 的用法与当前版本文档一致（https://react-hook-form.com/docs、https://zod.dev）
---
**怎么填变量**：[字段与规则] 尽量写全，包括格式和长度。[字段之间的联动] 是表单中最容易出错的部分，比如「选了企业才显示税号」，要写清楚隐藏时是否清空、是否校验。

**常见坑**：
- 只做前端校验。前端校验可以被绕过，后端必须用同样的规则再校验一次。用 Zod 的好处之一，就是可以前后端共用同一份规则。
- 被隐藏的字段仍然参与校验，导致用户看不到错误却无法提交。
- 错误提示写「格式错误」「输入有误」，用户不知道该怎么改。

**追问技巧**：追问「把这个表单拆成三步的分步表单，每一步只校验当前步骤的字段」，或「加上草稿自动保存，刷新页面后恢复已填写的内容」。

### 示例输出

> 示例，仅供参考（校验规则节选）

```ts
import { z } from 'zod'

export const invoiceSchema = z
  .object({
    type: z.enum(['company', 'personal']),
    title: z.string().trim().min(1, '请填写发票抬头').max(100, '发票抬头不超过 100 个字'),
    taxId: z.string().trim().optional(),
    email: z.string().email('请填写正确的邮箱，用于接收电子发票'),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'company' && !/^[A-Z0-9]{15,20}$/i.test(v.taxId ?? '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxId'], message: '税号应为 15 到 20 位字母或数字' })
    }
  })

export type InvoiceForm = z.infer<typeof invoiceSchema>
```

后端错误回填：

```ts
const onSubmit = async (data: InvoiceForm) => {
  const res = await fetch('/api/invoices', { method: 'POST', body: JSON.stringify(data) })
  if (!res.ok) {
    const { fieldErrors } = await res.json()
    for (const [name, message] of Object.entries(fieldErrors ?? {})) {
      setError(name as keyof InvoiceForm, { message: String(message) })
    }
  }
}
```
