---
title: Next.js App Router 页面开发提示词（服务端组件与客户端组件怎么分、Server Actions 表单、缓存与加载状态）
slug: nextjs-app-router-page
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用 Next.js App Router 做页面时，搞不清哪些组件该放服务端、哪些要加 use client、数据在哪里取、表单怎么提交时用：描述页面功能，AI 给出组件划分方案、数据获取与缓存策略、Server Action 表单处理、加载与错误状态，以及常见的坑。
prompt: |
  你是一名熟悉 Next.js App Router 的全栈工程师。请帮我实现下面的页面。

  - Next.js 版本：[如 15 或 16]
  - 页面路由与功能：[页面路由与功能]（例：/orders 订单列表，支持筛选、分页、取消订单）
  - 数据来源：[数据来源]（例：直接查数据库 Prisma、调用内部 REST 接口）
  - 是否需要登录与权限：[鉴权方式]
  - 交互需求：[如筛选条件实时生效、取消后列表自动刷新]
  - 对 SEO 和首屏速度的要求：[高/一般]

  请输出：
  1. 组件划分：画出组件树，标明每个组件是服务端组件还是客户端组件，以及理由。原则：默认服务端组件；只有需要状态、事件处理、浏览器接口的部分才是客户端组件，并且把客户端边界尽量往叶子节点推。
  2. 数据获取：在服务端组件中如何取数；筛选与分页参数通过地址栏查询参数传递；说明这些数据请求在当前版本中的缓存行为与重新验证方式（需要实时的数据怎么处理）。
  3. 数据修改：用 Server Action 实现「取消订单」：
     - 在 Action 内部重新校验登录状态和权限（不能信任来自客户端的参数）；
     - 用模式校验输入；
     - 修改后让相关页面数据重新验证；
     - 表单提交中的加载状态和错误提示。
  4. 加载与错误：用约定文件实现加载骨架和错误边界；找不到数据时返回 404 页面。
  5. 元数据：用 generateMetadata 生成页面标题与描述；动态路由的 notFound 处理。
  6. 常见错误检查：在服务端组件中使用了 hooks、把不可序列化的值（函数、类实例）作为属性从服务端组件传给客户端组件、在客户端组件中引入了只能在服务端用的模块（数据库客户端、密钥）。

  Next.js 各版本之间缓存默认值、部分 API 是否异步等行为有变化，凡是与版本相关的写法，注明「以你所用版本的官方文档为准」。
negativePrompt: null
source: null
verify:
  - 核对当前 Next.js 版本中 fetch 缓存默认行为、params / searchParams 是否为 Promise、revalidatePath 用法（https://nextjs.org/docs/app）
---
**怎么填变量**：[Next.js 版本] 一定要写准确。App Router 在几个大版本之间改过缓存默认值，路由参数也从普通对象改成了需要等待的异步值，照着旧教程写很容易出错。[数据来源] 如果是直接查数据库，所有查询代码都必须只在服务端运行。

**常见坑**：
- 在页面最外层加上 use client，整个页面都变成客户端渲染，失去了服务端组件的好处。只在真正需要交互的小组件上加。
- 以为 Server Action 是「内部函数」就不做权限校验。它本质上是一个可以被直接调用的接口，必须在内部重新检查用户身份和参数。
- 修改数据后页面没有刷新，通常是忘了让对应路径或标签的数据重新验证。

**追问技巧**：追问「把筛选条件改成可分享的链接，刷新页面后条件保持不变」，或「这个页面在哪些情况下会被静态生成、哪些情况下是动态渲染，怎么确认」。

### 示例输出

> 示例，仅供参考（组件树节选）

```
app/orders/page.tsx            服务端组件：读取查询参数，查询订单列表
├─ OrderFilters.tsx            客户端组件：下拉框改变时更新地址栏查询参数
├─ OrderTable.tsx              服务端组件：渲染表格
│  └─ CancelButton.tsx         客户端组件：调用 Server Action，显示提交中状态
└─ Pagination.tsx              服务端组件：用链接切换页码
app/orders/loading.tsx         加载骨架
app/orders/actions.ts          Server Action：cancelOrder
```

```ts
// app/orders/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function cancelOrder(formData: FormData) {
  const user = await requireUser()                        // 重新校验登录
  const { orderId } = z.object({ orderId: z.coerce.number().int() }).parse({ orderId: formData.get('orderId') })
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== user.id) return { error: '订单不存在' }   // 防越权
  if (order.status !== 'PENDING') return { error: '当前状态不能取消' }
  await db.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })
  revalidatePath('/orders')
  return { ok: true }
}
```
