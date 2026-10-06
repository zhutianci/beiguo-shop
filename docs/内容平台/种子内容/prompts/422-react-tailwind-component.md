---
title: React + Tailwind 组件生成提示词（文字描述 → 可直接用的组件，含响应式、深色模式与无障碍）
slug: react-tailwind-component
model: any-llm
topics: [coding, product-design]
needsRefImage: false
useCase: 要做一个前端组件或页面区块（表单、卡片列表、导航栏、弹窗）又不想从零写样式时用：描述功能和状态，得到 TypeScript + Tailwind 的 React 组件、所有状态的处理（加载、空、错误、禁用）和使用示例。
prompt: |
  【角色】你是一名资深前端工程师，写的组件要能直接合进生产代码：类型完整、状态齐全、移动端可用、键盘和读屏软件可用。

  【技术约束】
  - 框架：[如 React 19 + TypeScript/Next.js App Router]
  - 样式：Tailwind CSS [版本，如 v4/v3]
  - 已有组件库（没有就写无）：[如 shadcn/ui]
  - 图标库：[如 lucide-react/无]

  【组件需求】
  - 组件名称与用途：[组件名称与用途]
  - 展示的数据（字段、类型、示例值）：[数据字段]
  - 用户交互：[如点击、输入、拖拽、键盘操作]
  - 需要的状态：[如加载中、空数据、出错、禁用]
  - 视觉参考（文字描述）：[视觉风格描述]

  【实现要求】
  1. 先列出 Props 接口设计（名称、类型、是否必填、默认值），数据通过 props 传入，不在组件里写死请求地址。
  2. 写组件代码：
     - 移动优先的响应式写法，说明在哪个断点改变布局；
     - 同时提供深色模式样式（dark: 变体）；
     - 用语义化标签；表单控件有关联的 label；只有图标的按钮要有 aria-label；可聚焦元素有清晰的 focus-visible 样式；弹窗类组件要处理 Esc 关闭和焦点管理；
     - 需要唯一 id 时用 useId 生成，避免同一页面放多个组件时 id 冲突；
     - 不要用字符串拼接动态生成类名（如把颜色变量拼进 bg- 前缀），Tailwind 扫描不到这种类名，要写成完整类名的映射表。
  3. 覆盖所有状态：加载（骨架屏）、空状态（说明 + 下一步操作）、错误（可重试）、禁用。
  4. 给出一个使用示例和一份模拟数据。
  5. 列出你做的假设，以及需要我确认的交互细节。

  【输出格式】
  Props 表 → 组件代码（一个 tsx 代码块）→ 使用示例 → 假设与待确认。
negativePrompt: null
source: null
verify:
  - 在 Tailwind v4 与 v3 项目各粘贴一次组件代码，检查样式是否生效
---
**怎么填变量**：[版本] 要写清——Tailwind v4 改为在 CSS 中配置（`@import "tailwindcss";` 加 `@theme`），默认不再需要 tailwind.config.js；v3 项目则需要在配置文件的 content 里包含组件路径，否则样式不会生成。[视觉风格描述] 写「白底卡片、圆角、浅灰边框、悬停时轻微上浮」这种可执行的描述，比「好看、高级」有效得多。

**常见坑**：
- AI 默认写出来的组件往往只有「正常状态」，加载、空数据、出错这几个状态要明确列在需求里。
- 用纯 div 加 onClick 做按钮，键盘无法操作，读屏软件也识别不了，要用 button 元素。
- 一次只让它做一个组件；整页需求先让它拆成组件树再逐个生成。

**追问技巧**：生成后追问「检查这个组件的无障碍问题，按 WCAG 列出来」；要改样式时直接描述差异，比如「卡片间距改小，标题最多显示两行，超出用省略号」。

### 示例输出

> 示例，仅供参考（带清空按钮的搜索框）

```tsx
import { useId } from 'react'

type SearchBoxProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBox({ value, onChange, placeholder = '搜索' }: SearchBoxProps) {
  const id = useId()
  return (
    <div className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">搜索</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      {value && (
        <button
          type="button"
          aria-label="清空搜索"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-gray-400 hover:text-gray-600 focus-visible:text-gray-700"
        >
          ×
        </button>
      )}
    </div>
  )
}
```
