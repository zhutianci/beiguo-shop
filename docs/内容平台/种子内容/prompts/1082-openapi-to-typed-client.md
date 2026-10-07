---
title: 根据接口文档生成前端请求层提示词（OpenAPI / Swagger → TypeScript 类型 + 请求函数 + 统一错误处理）
slug: openapi-to-typed-client
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 后端给了 Swagger / OpenAPI 文档，前端要写请求函数和类型定义时用：AI 根据文档生成带完整类型的请求层，统一处理鉴权、错误、超时和取消，并建议是否改用代码生成工具，让接口变化时类型能自动同步。
prompt: |
  你是一名前端架构师。请根据接口文档为前端生成请求层代码。

  - 接口文档（OpenAPI 3 的 JSON 或 YAML，或 Swagger 页面上相关接口的描述）：
    [粘贴接口文档]
  - 前端技术栈：[前端技术栈]（例：React + TypeScript + TanStack Query）
  - 请求库：[请求库]（例：fetch、axios）
  - 鉴权方式：[鉴权方式]（例：Bearer Token，过期返回 401 需刷新）
  - 后端统一返回格式与错误格式：[返回格式]

  请输出：
  1. 方案建议：手写请求层还是使用代码生成工具从 OpenAPI 文档自动生成类型和客户端；说明各自适合的情况。如果接口多、变化频繁，推荐生成方案并给出配置示例，同时下面的封装仍然适用。
  2. 类型定义：根据文档的模型生成 TypeScript 类型；可选字段、可为空字段、枚举、日期字符串要准确对应；不要用 any。文档中类型不明确的地方列出来，便于向后端确认。
  3. 请求基础封装：
     - 基础地址与环境配置；
     - 自动携带令牌；遇到 401 时刷新令牌并重试一次，多个请求同时遇到 401 时只刷新一次；
     - 统一错误类型：网络错误、超时、业务错误（带错误码和提示）、未授权；
     - 超时与请求取消；
     - 查询参数与请求体的序列化。
  4. 按资源组织的请求函数：每个接口一个函数，参数和返回值都有类型。
  5. 与数据请求库结合（如果使用）：查询键的组织方式、修改数据后让相关缓存失效。
  6. 一个调用示例与对请求层的单元测试示例（模拟请求库）。
negativePrompt: null
source: null
verify:
  - 用一份含枚举、可空字段与分页结构的 OpenAPI 文档跑一次，检查生成类型能否通过 tsc 严格模式编译
---
**怎么填变量**：[接口文档] 最好直接贴 OpenAPI 的 JSON 或 YAML（Swagger 页面通常提供下载链接），比复制页面文字准确。文档很大时，只贴本次要用的接口和它们引用的模型。[后端统一返回格式与错误格式] 决定错误处理怎么写，一定要给出示例。

**常见坑**：
- 手写类型时把可空字段写成必填，运行时拿到 null 就报错。可选和可为空要区分清楚。
- 多个请求同时返回 401，每个都去刷新令牌，结果刷新接口被调用多次，甚至互相把对方的新令牌作废。要让并发的刷新共用同一个请求。
- 接口改了字段名，手写的类型没跟着改，编译通过、运行出错。接口多时用代码生成，并在流程中加入「文档更新后重新生成」的步骤。

**追问技巧**：追问「把这个请求层改造成支持多个后端服务（不同基础地址与鉴权）」，或「后端返回的日期是字符串，如何在请求层统一转换为日期对象」。

### 示例输出

> 示例，仅供参考（节选）

```ts
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface Order {
  id: number
  status: OrderStatus
  amountCents: number
  paidAt: string | null        // 文档标注 nullable，ISO 8601 字符串
  remark?: string              // 文档中非必需字段
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}

let refreshing: Promise<void> | null = null   // 并发 401 时共用同一次刷新

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...init.headers },
  })
  if (res.status === 401 && !retried) {
    refreshing ??= refreshToken().finally(() => { refreshing = null })
    await refreshing
    return request<T>(path, init, true)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.code ?? 'UNKNOWN', body.message ?? '请求失败')
  }
  return res.json() as Promise<T>
}

export const getOrder = (id: number) => request<Order>(`/orders/${id}`)
```
