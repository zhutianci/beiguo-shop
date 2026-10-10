---
title: React 自定义 Hook 怎么抽取和测试提示词（入参与返回值设计、副作用清理、renderHook 测试）
slug: react-custom-hook-extract-test
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 几个组件里出现了相似的 useState 加 useEffect 逻辑，想抽成自定义 Hook 又怕抽坏时用。贴出组件代码，AI 先判断哪些值得抽，再分轮设计接口、实现并写清理逻辑，最后给出 renderHook 测试用例。
prompt: |
  下面是我项目里几个组件的代码，其中有重复或缠在一起的逻辑。请帮我判断哪些值得抽成自定义 Hook，再把 Hook 和测试写出来。

  React 版本：[React 版本]
  测试工具：[测试工具]（例：Vitest + React Testing Library）
  我想复用的逻辑（可选）：[想复用的逻辑]
  组件代码：
  [粘贴组件代码]

  请分四轮进行。第一轮结束后停下等我确认，再继续后面三轮。

  第一轮：只做判断，不写代码。
  - 列出候选逻辑，每个注明出现在哪些组件、用到了哪些内置 Hook；
  - 判断该不该抽：只在一处出现且不复杂的，建议留在原地；没有用到任何 Hook 的纯计算，建议抽成普通函数而不是 Hook；
  - 对值得抽的，给出名字（以 use 开头）和一句话职责。

  第二轮：设计接口。
  - 入参：尽量传原始值；必须传对象或函数时，说明它的引用每次渲染都变会怎样影响依赖数组，由谁负责保持稳定；
  - 返回值：两个以内可用数组（方便调用方改名），再多就用对象；返回的函数是否需要保持引用稳定；
  - 写明这个 Hook 不负责什么（例如不弹提示、不做跳转）。

  第三轮：实现。
  - 每个副作用都写清理：定时器、事件监听、订阅要取消；请求要处理「组件已卸载」和「后发的请求先返回」两种情况；
  - 给出原组件改用新 Hook 之后的写法，行为必须与原来一致，不顺手改别的。

  第四轮：测试。用 renderHook 和 act 来写，至少覆盖：初始值、入参变化后的结果、卸载后清理是否生效；涉及时间的用假定时器。每条用例注明它防的是哪种回归。

  测试库的导入路径和 API 以我所用版本的文档为准，不确定处标「需核对」。
negativePrompt: null
source: null
verify:
  - 贴两个都带「输入防抖」逻辑的组件跑一次，检查第一轮是否只做判断并停下等待确认
  - 检查生成的 Hook 是否在副作用里返回了清理函数
---
**怎么填变量**：[粘贴组件代码] 至少贴两个有相似逻辑的组件，AI 才能看出哪部分是真重复、哪部分只是长得像。[测试工具] 写清楚测试运行器和渲染库，例如「Jest + React Testing Library」，假定时器的写法会随之不同。[想复用的逻辑] 可以只写一句「搜索框的防抖」，不写也行。

**常见问题与调整**：
- 抽出来的 Hook 参数有七八个 → 追问：「这个 Hook 是不是管得太多了？请拆成两个职责单一的 Hook，并说明拆分依据。」
- 测试偶尔失败 → 追问：「检查测试里有没有真实定时器或未等待的异步更新，改成假定时器并用 act 包住状态更新。」
- 想确认行为没变 → 追问：「列出抽取前后在渲染次数、请求次数上可能出现差异的地方。」

### 示例输出

> 示例，仅供参考（两个搜索组件里都有「输入停顿 300 毫秒后再请求」的逻辑，第三、四轮节选）

Hook 只负责「把一个变化频繁的值延迟输出」，请求仍由组件自己发。

```ts
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)   // 值再次变化或组件卸载时，清掉上一个定时器
  }, [value, delay])
  return debounced
}
```

测试（已开启假定时器），防的是「延迟没到就更新」这种回归：

```ts
const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
  initialProps: { v: 'a' },
})
rerender({ v: 'ab' })
expect(result.current).toBe('a')            // 时间没到，仍是旧值
act(() => { vi.advanceTimersByTime(300) })
expect(result.current).toBe('ab')
```
