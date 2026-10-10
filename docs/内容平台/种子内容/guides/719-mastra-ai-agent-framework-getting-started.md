---
title: Mastra 是什么、怎么用：TypeScript 智能体框架的安装与第一个 Agent
slug: mastra-ai-agent-framework-getting-started
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: OTHER
excerpt: Mastra 是什么框架、怎么上手？按 Mastra 官方安装文档讲清它的定位、Node.js 版本要求、一条 create mastra 命令起项目、手动安装的七个步骤、用 provider/model 字符串指定模型、定义 Agent 并注册到 Mastra 实例，以及从脚本里调用它。
checkedOn: 2026-10-11
sources:
  - https://mastra.ai/docs/getting-started/installation
verify:
  - 示例里的模型字符串取自官方文档当天版本，以官方文档为准
  - 官方安装页没有写开发服务器的启动命令和 Studio 的地址，本文未写，以脚手架生成的 package.json 和官方文档为准
  - 天气工具 weather-tool.ts 的完整代码和 Agent 的完整 instructions 见官方页面，本文未全文转录
---

> 本文根据 Mastra 官方文档《Installation》整理，资料核对于 2026-10-11。文中代码取自官方页面，没有在本机运行验证。

## 适用于谁

- 搜「mastra 是什么」「mastra 教程」「mastra 框架」「mastra agent」的人；
- 用 TypeScript 写后端或全栈应用，想在项目里加智能体的人；
- 用过 Python 的智能体框架，想找一个 TypeScript 生态里对应的东西的人。

## 结论先说

1. **Mastra 是一个用 TypeScript 构建 AI 智能体和应用的框架。**
2. **需要 Node.js 22.18.0 或更高版本**。官方选这个版本的原因是它可以直接运行 TypeScript 文件。
3. **最快的起步方式是一条命令**：`npm create mastra@latest`。
4. **模型用 `'provider/model'` 字符串指定**，不需要单独导入各家的包；API Key 通过环境变量提供。
5. **核心结构很简单**：用 `new Agent({...})` 定义智能体，在 `new Mastra({ agents: {...} })` 里注册，之后用 `mastra.getAgentById(...)` 取出来调用。

## 一、准备

- **Node.js 22.18.0 或更高**。在终端运行 `node --version` 确认；
- **模型厂商的 API Key**。官方举的例子：OpenAI 用 `OPENAI_API_KEY`，Anthropic 用 `ANTHROPIC_API_KEY`，Google 用 `GOOGLE_API_KEY`。其他厂商对应的环境变量名，官方有一张完整的表。

Key 的获取见[《OpenAI API Key 怎么获取》](/guides/openai-api-key)、[《Claude API Key》](/guides/claude-api-key-console)、[《Gemini API Key》](/guides/gemini-api-key)。

## 二、快速开始：一条命令

按你用的包管理器选一条：

```bash
npm create mastra@latest
```

```bash
pnpm create mastra@latest
```

```bash
yarn create mastra
```

```bash
bunx create-mastra
```

按提示完成即可。官方文档对脚手架内容的描述是：一个通用的智能体框架，带本地工作区、终端工具、记忆、任务跟踪、联网访问和定时任务；同时会为你的编程智能体安装 Mastra 的 Skills。

文档还提到 Studio：一个用来和项目交互的界面，项目建好后可以直接打开。启动方式看脚手架生成的 `package.json` 里的脚本和官方文档。

## 三、手动安装：七步

想弄清楚每个文件是干什么的，或者要把 Mastra 加进已有项目，按官方的手动步骤来。

**第 1 步：创建 `package.json`**，内容里要有：

```json
{ "type": "module" }
```

**第 2 步：安装依赖**

```bash
npm install @mastra/core@latest zod@latest typescript@latest @types/node@latest mastra@latest
```

**第 3 步：创建 `tsconfig.json`**。官方给出的关键设置：

| 设置 | 值 |
| --- | --- |
| `target` | `ES2022` |
| `module` | `ES2022` |
| `moduleResolution` | `bundler` |
| `strict` | `true` |
| `allowImportingTsExtensions` | `true` |
| `noEmit` | `true` |
| `include` | `["src/**/*"]` |

**第 4 步：设置环境变量**，例如 `OPENAI_API_KEY`。

**第 5 步：定义智能体**，文件放在 `src/mastra/agents/weather-agent.ts`：

```ts
import { Agent } from '@mastra/core/agent'
import { weatherTool } from '../tools/weather-tool.ts'

export const weatherAgent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: `...`, // full instructions on the page
  model: 'openai/gpt-5.6-sol',
  tools: { weatherTool },
})
```

- `id`：之后用它来取这个智能体；
- `instructions`：系统提示词，官方示例里是一段关于如何回答天气问题的说明，完整内容见官方页面；
- `model`：`'provider/model'` 形式的字符串；
- `tools`：这个智能体可以用的工具。示例里的 `weatherTool` 来自 `../tools/weather-tool.ts`，用 `@mastra/core/tools` 里的 `createTool()` 创建，代码见官方页面。

**第 6 步：注册**，文件是 `src/mastra/index.ts`：

```ts
import { Mastra } from '@mastra/core'
import { weatherAgent } from './agents/weather-agent.ts'

export const mastra = new Mastra({
  agents: { weatherAgent },
})
```

**第 7 步：从脚本里调用**

```ts
// run.mjs
import { mastra } from './src/mastra/index.ts'

const agent = mastra.getAgentById('weather-agent')
const response = await agent.generate('Weather in SF')
console.log(response.text)
```

官方提醒：本地文件的导入要带上文件扩展名（`.ts`）。这和 `tsconfig.json` 里的 `allowImportingTsExtensions` 是配套的。

## 四、目录结构怎么理解

按上面的步骤，项目里和 Mastra 有关的部分是：

```
src/mastra/
├── index.ts               # 创建 Mastra 实例，注册智能体
├── agents/
│   └── weather-agent.ts   # 智能体定义
└── tools/
    └── weather-tool.ts    # 工具定义
```

`Mastra` 实例是总入口：智能体都注册在它上面，应用的其他部分通过它来获取。新增一个智能体就是在 `agents/` 下加一个文件，再到 `index.ts` 里注册。

## 五、写智能体时的几点

这些是通用的做法，不限于 Mastra：

- **`instructions` 写清边界**：它负责什么、不负责什么、信息不足时该问用户还是该拒绝；
- **工具说明写给模型看**：模型靠工具的名称和描述决定何时调用；
- **有副作用的工具谨慎提供**：能发消息、改数据、执行命令的工具，先想好要不要人工确认；
- **密钥只放环境变量**，不要写进代码或提交进仓库。

系统提示词的写法见[《系统提示词怎么写》](/guides/system-prompt-how-to-write)。

## 六、接下来

官方安装页列出的后续方向：

- **模板**：官方提供了一批起步模板；
- **接入现有框架**：有 Next.js、React + Vite、Astro、Express、SvelteKit、Hono 的集成指南。

框架的其他能力见官方文档的对应章节。

## 常见问题

**Q：Node 版本低于 22.18 行不行？**
官方写的要求是 22.18.0 或更高。上面的写法依赖 Node 直接运行 TypeScript 文件，低版本不满足。

**Q：一定要用 OpenAI 的模型吗？**
不是。把 `model` 换成其他厂商的 `'provider/model'` 字符串，并设置对应的环境变量。各厂商的变量名见官方的环境变量表。

**Q：和 Vercel AI SDK 是什么关系、怎么选？**
两者都是 TypeScript 生态的。AI SDK 是偏底层的工具包，见[《Vercel AI SDK 是什么》](/guides/vercel-ai-sdk-getting-started)；Mastra 是在更高一层提供智能体定义、注册和 Studio 等一整套结构的框架。只需要调模型和流式输出，用前者就够；要组织多个智能体和工具，可以看 Mastra。

**Q：Python 项目能用吗？**
Mastra 是 TypeScript 框架。Python 的选择见[《Pydantic AI 是什么》](/guides/pydantic-ai-agent-getting-started)和[《OpenAI Agents SDK 教程》](/guides/openai-agents-sdk-python-quickstart)。

## 参考资料

- Installation（Mastra 官方文档）：https://mastra.ai/docs/getting-started/installation
