---
title: React 代码审查提示词（hooks 依赖、无效重渲染、key、副作用清理逐项检查）
slug: react-code-review-hooks
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 审查 React 组件或排查「页面卡、数据闪、请求发两次、状态不更新」这类问题时用：让 AI 按 React 特有的问题清单逐项检查 hooks 用法、渲染性能、列表 key、副作用清理和状态设计，给出修改后的代码。
prompt: |
  你是一名精通 React 的前端工程师，熟悉函数组件、hooks 的规则和常见反模式。请审查下面的组件。

  背景：
  - React 版本与框架：[如 React 19 + Next.js]
  - 状态管理方式：[状态管理方式]（例：useState、Redux、Zustand）
  - 用户反馈的问题：[如输入框打字卡顿，没有就写无]
  - 组件代码（包括它用到的自定义 hook）：
    [粘贴代码]

  逐项检查，只报告真实存在的问题：
  1. hooks 规则：是否在条件、循环里调用 hook；自定义 hook 命名是否以 use 开头。
  2. useEffect：
     - 依赖数组是否完整，有没有闭包拿到旧值；
     - 是否把本该在渲染时直接计算的派生数据放进了 effect + setState；
     - 订阅、定时器、事件监听、未完成的请求是否在清理函数里取消；
     - 开发模式严格模式下 effect 会执行两次，代码是否能承受。
  3. 渲染性能：每次渲染都新建的对象、数组、函数传给了被 memo 的子组件；状态放得太高导致大范围重渲染；是否真的需要 useMemo / useCallback（不要建议到处加）。
  4. 列表：key 是否稳定唯一，有没有用数组下标导致删除、排序后状态错位。
  5. 状态设计：重复或可推导的状态、多个状态应该合并、受控与非受控输入混用。
  6. 其他：直接修改 state 对象或数组、在渲染中产生副作用、可访问性（按钮用 div、缺少 label）。

  输出：
  - 问题表：严重程度 | 位置 | 问题 | 会导致的现象；
  - 对严重问题给出修改后的代码片段，说明改了什么；
  - 如果用户反馈的问题能被某条解释，明确指出是哪一条。

  不确定的写「需确认」，例如组件的父组件如何传参会影响结论时。
negativePrompt: null
source: null
verify:
  - 准备一个依赖数组缺失、用下标做 key 的组件跑一次，检查能否同时指出两处问题并给出正确修改
  - 核对 React 官方文档「You Might Not Need an Effect」相关建议是否有更新（https://react.dev/learn/you-might-not-need-an-effect）
---
**怎么填变量**：[用户反馈的问题] 很有用，「请求发了两次」「切换标签后显示的还是上一个人的数据」这类描述能让 AI 直接对上原因。组件用到的自定义 hook 一定要一起贴，很多问题藏在 hook 里。

**常见坑**：
- 开发模式下 React 严格模式会故意让 effect 挂载、卸载、再挂载一次，看到请求发两次不一定是 Bug；但如果没有清理函数导致重复订阅，那就是问题。
- 不要让 AI「给所有函数都加 useCallback」。只有传给 memo 组件、或作为其他 hook 依赖的函数才值得加，否则只会让代码更难读。
- 用数组下标做 key，在列表只追加、不删除不排序时没问题；一旦能删除或拖拽排序，输入框内容就会串行。

**追问技巧**：修改后把新代码贴回去，说「只检查上次指出的问题是否都已修复，有没有引入新的依赖问题」。

### 示例输出

> 示例，仅供参考（节选）

| 严重程度 | 位置 | 问题 | 现象 |
|---|---|---|---|
| 严重 | `useEffect` 第 14 行 | 依赖数组缺少 `userId`，切换用户后不会重新请求 | 显示上一个用户的数据 |
| 严重 | 同上 | 请求没有取消，快速切换时旧请求后返回会覆盖新数据 | 数据闪回 |
| 一般 | `fullName` 状态 | 由 `first` 和 `last` 推导，不需要单独存成状态 | 多一次渲染 |

```jsx
useEffect(() => {
  const controller = new AbortController()
  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((e) => { if (e.name !== 'AbortError') setError(e) })
  return () => controller.abort()
}, [userId])

const fullName = `${first} ${last}` // 渲染时直接计算
```
