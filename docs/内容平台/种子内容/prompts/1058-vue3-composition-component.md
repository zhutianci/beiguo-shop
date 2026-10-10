---
title: Vue3 组件生成提示词（script setup + TypeScript、Props 与 Emits 类型、组合式函数抽离、Pinia 状态）
slug: vue3-composition-component
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 用 Vue3 开发业务组件（表格页、表单弹窗、带搜索的选择器）时用：描述组件功能和交互，得到符合 Vue3 组合式 API 写法的组件代码，类型完整、逻辑拆成可复用的组合式函数，并说明响应式使用上的常见陷阱。
prompt: |
  你是一名熟悉 Vue 3 组合式 API 和 TypeScript 的前端工程师。请帮我写一个组件。

  - 组件名称与用途：[组件名称与用途]（例：UserSelect 可搜索的用户选择器）
  - 功能与交互：[功能与交互]（例：输入关键字远程搜索、支持多选、最多选 5 个）
  - 输入与输出：[输入与输出]（例：v-model 绑定选中用户 ID 数组，选中变化时触发 change）
  - UI 组件库：[UI 组件库]（例：Element Plus、Naive UI、无）
  - 状态管理：[状态管理]（例：需要从 Pinia 读取当前用户，没有就写无）
  - 项目约定：[项目约定]（例：样式用 scoped SCSS、接口请求封装在 api 目录）

  要求：
  1. 使用 script setup 加 TypeScript。Props 用基于类型的声明并给出默认值；事件用类型化的声明；需要双向绑定时使用当前版本推荐的 v-model 写法（说明版本要求）。
  2. 把与界面无关的逻辑（远程搜索、防抖、请求取消、加载与错误状态）抽到一个组合式函数中，组件只负责组装和展示。
  3. 响应式：说明这里用 ref 还是 reactive 以及原因；解构 Props 或 reactive 对象时如何保持响应性；计算属性中不要产生副作用；watch 的触发时机与清理（组件卸载或参数变化时取消旧请求）。
  4. 边界情况：搜索结果为空、请求失败、输入很快时旧请求的结果晚到覆盖新结果、达到选择上限。
  5. 可访问性：键盘可操作、加载状态有提示文字。
  6. 给出一个父组件中使用它的示例，以及一份用 Vitest 和 Vue Test Utils 编写的测试（至少覆盖搜索、选择、达到上限三种情况）。

  输出：组合式函数文件、组件文件、使用示例、测试文件，代码带中文注释。
negativePrompt: null
source: null
verify:
  - 核对 defineModel 等宏在所用 Vue 版本中是否可用（https://vuejs.org/api/sfc-script-setup.html）
---
**怎么填变量**：[输入与输出] 写清楚组件对外的「接口」：用 v-model 绑定什么值、会触发哪些事件。[项目约定] 贴上后，AI 会沿用你的接口封装和样式写法，生成的代码可以直接放进项目。

**常见坑**：
- 直接解构 reactive 对象或 Props，得到的变量失去响应性，界面不会更新。需要时用 toRefs 或计算属性。
- 远程搜索没有处理「旧请求后返回」的问题：用户快速输入「张」「张三」，如果「张」的结果后到，会覆盖「张三」的结果。要取消旧请求或者忽略过期结果。
- 所有逻辑都写在组件里，几百行难以维护和测试。可复用的逻辑抽成组合式函数。

**追问技巧**：追问「把这个组件改成支持分页加载更多」，或「这个组合式函数还能在哪些组件中复用，需要怎么调整参数」。

### 示例输出

> 示例，仅供参考（组合式函数节选）

```ts
// composables/useRemoteSearch.ts
import { ref, watch, onScopeDispose, type Ref } from 'vue'

export function useRemoteSearch<T>(keyword: Ref<string>, fetcher: (q: string, signal: AbortSignal) => Promise<T[]>) {
  const results = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)
  let controller: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(keyword, (q) => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      controller?.abort()                      // 取消上一次请求，避免旧结果覆盖新结果
      controller = new AbortController()
      loading.value = true
      error.value = null
      try {
        results.value = q ? await fetcher(q, controller.signal) : []
      } catch (e) {
        if ((e as Error).name !== 'AbortError') error.value = '搜索失败，请重试'
      } finally {
        loading.value = false
      }
    }, 300)                                    // 300 毫秒防抖
  })

  onScopeDispose(() => { clearTimeout(timer); controller?.abort() })
  return { results, loading, error }
}
```
