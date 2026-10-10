---
title: Vercel AI SDK 是什么、怎么用：安装、generateText、切换模型与智能体入门
slug: vercel-ai-sdk-getting-started
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: OTHER
excerpt: Vercel AI SDK 是什么、怎么上手？按官方 README 讲清它的定位、安装命令、用模型字符串走 AI Gateway 与安装各家 provider 包直连的两种接法、generateText 的最小示例、结构化输出、ToolLoopAgent 智能体，以及前端用的 useChat。
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel/ai
  - https://github.com/vercel/ai/blob/main/packages/ai/README.md
verify:
  - 示例里的模型名取自官方 README 当天版本，模型名会随时间变化，以官方文档为准
  - 默认走 Vercel AI Gateway 需要相应的账号与密钥，计费以 Vercel 官方说明为准；直连各家 provider 则用各家自己的 API Key
  - 官方 README 的智能体示例省略了部分导入和函数定义，本文照原样引用并已注明
---

> 本文根据 Vercel AI SDK 官方仓库的 README 整理，资料核对于 2026-10-11。文中代码取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「vercel ai sdk 是什么」「vercel ai sdk 教程」「vercel ai sdk 中文文档」的人；
- 用 TypeScript、Next.js 或 Node.js 做应用，想接入大模型又不想被某一家的 SDK 绑住的人；
- 想做聊天界面，在找现成的前端 hook 的人。

## 结论先说

1. **AI SDK 是一个与模型厂商无关的 TypeScript 工具包**，用来构建 AI 应用和智能体，可以配合 Next.js、React、Svelte、Vue、Angular 等界面框架，也可以在 Node.js 等运行时里单独用。
2. **安装**：`npm install ai`，需要 Node.js 22 及以上。
3. **换模型只改一处**。同一个 `generateText`，模型可以写成 `'厂商/模型'` 这样的字符串（走 Vercel AI Gateway），也可以装各家的 provider 包直连。
4. **两个主要部分**：`ai` 包是核心（生成文本、结构化输出、工具、智能体）；`@ai-sdk/react` 等是界面层（`useChat` 这类 hook）。
5. **智能体用 `ToolLoopAgent`**：给模型一组工具，由它循环调用直到完成任务。

## 一、安装

```shell
npm install ai
```

用 pnpm、yarn、bun 的写对应的安装命令即可。

## 二、两种接模型的方式

**方式一：模型字符串，走 Vercel AI Gateway（默认）**

README 说明：不做额外设置时，SDK 通过 Vercel AI Gateway 转发请求，由它提供对主流厂商模型的访问。写法是直接给一个 `'厂商/模型'` 字符串：

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-6-astra', // use Vercel AI Gateway
  prompt: 'What is an agent?',
});
```

**方式二：安装 provider 包，直连厂商**

```shell
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

```ts
import { anthropic } from '@ai-sdk/anthropic';

const result = await generateText({
  model: anthropic('claude-opus-5-5'), // or openai('gpt-6-astra'), google('gemini-3.8-flash'), etc.
  prompt: 'Hello!',
});
```

怎么选：

| | 模型字符串（Gateway） | provider 包（直连） |
| --- | --- | --- |
| 需要的密钥 | Vercel AI Gateway 的 | 各家自己的 API Key |
| 换模型 | 改字符串 | 换导入的 provider 函数 |
| 适合 | 想用一个入口试多家模型 | 已经有某家的 Key，或对请求链路有要求 |

各家 Key 的获取见[《OpenAI API Key 怎么获取》](/guides/openai-api-key)、[《Claude API Key》](/guides/claude-api-key-console)、[《Gemini API Key》](/guides/gemini-api-key)。密钥放在环境变量里，不要写进前端代码。

## 三、生成文本

上面的 `generateText` 就是最基本的用法：给模型和提示词，拿回 `text`。它是一次性返回完整结果的函数，适合后端任务、脚本和不需要逐字显示的场景。

## 四、结构化输出

README 说明 `generateText` 可以通过 `Output.object` 返回带类型的数据，它接收一个 Zod schema，官方的例子是生成一份包含名称、配料表和步骤的菜谱。

这样拿到的是可以直接在代码里使用的对象，而不是需要自己解析的一段文字。为什么这比在提示词里写「请输出 JSON」可靠，见[《如何让大模型稳定输出 JSON》](/guides/llm-json-structured-output-reliable)。

## 五、智能体：ToolLoopAgent

README 的智能体示例定义了一个带终端工具的智能体：

```ts
import { ToolLoopAgent } from 'ai';

const sandboxAgent = new ToolLoopAgent({
  model: 'openai/gpt-6-astra',
  system: 'You are an agent with access to a shell environment.',
  tools: {
    shell: openai.tools.localShell({
      execute: async ({ action }) => {
        const [cmd, ...args] = action.command;
        const sandbox = await getSandbox(); // Vercel Sandbox
        const command = await sandbox.runCommand({ cmd, args });
        return { output: await command.stdout() };
      },
    }),
  },
});
```

说明：README 的这段代码省略了 `openai` 的导入和 `getSandbox` 的定义，不能原样运行，这里引用它是为了看结构。

三个要素：

- `model`：用哪个模型；
- `system`：系统提示词，说明智能体的角色和边界；
- `tools`：一组工具，每个工具有一个 `execute` 函数。模型决定调用哪个，SDK 负责执行并把结果交回模型，如此循环。

注意示例里命令是在**沙箱**中执行的，而不是直接在服务器上。让模型执行命令或代码时，这一层隔离不要省，沙箱是什么见[《E2B 是什么》](/guides/e2b-sandbox-what-is-quickstart)。

## 六、做聊天界面：AI SDK UI

```shell
npm install @ai-sdk/react
```

`@ai-sdk/react` 里的 `useChat` hook 负责管理聊天消息，并把用户输入发到你的聊天接口。前端调用这个 hook，后端的路由里用 `ai` 包调用模型并流式返回，两边由 SDK 约定好的格式对接。核心包里还导出了 `createAgentUIStreamResponse` 等与界面对接相关的函数，用法见官方文档。

README 称 SDK 可以配合 Svelte、Vue、Angular 等框架使用，各框架对应的包名以官方文档为准。

## 七、模块一览

| 包 | 作用 |
| --- | --- |
| `ai` | 核心函数和类型：`generateText`、`Output`、`ToolLoopAgent` 等 |
| `@ai-sdk/react` | 界面 hook，如 `useChat` |
| `@ai-sdk/openai`、`@ai-sdk/anthropic`、`@ai-sdk/google` 等 | 各家模型的 provider 包 |

README 还提到官方提供了按用途、厂商和框架分类的模板，可以直接起步。

## 常见问题

**Q：只做后端、不用 Next.js 能用吗？**
能。`ai` 包可以在 Node.js 等运行时里单独使用，界面包是可选的。

**Q：和各家官方 SDK 相比有什么好处？**
统一的接口。同一段业务代码换个模型字符串或 provider 函数就能切换厂商，流式、工具调用、结构化输出的写法也统一。代价是各家最新的专有功能，可能要等 SDK 跟进。

**Q：和 OpenAI Agents SDK、Mastra 怎么选？**
语言和侧重点不同：AI SDK 是 TypeScript 的基础工具包；OpenAI Agents SDK 的 Python 版见[《OpenAI Agents SDK 教程》](/guides/openai-agents-sdk-python-quickstart)；Mastra 是 TypeScript 的智能体框架，见[《Mastra 是什么》](/guides/mastra-ai-agent-framework-getting-started)。

**Q：网上教程的写法和这里不一样？**
AI SDK 更新很快，不同大版本之间的接口有变化。以官方仓库 README 和文档的当前版本为准，升级时看官方的迁移说明。

## 参考资料

- vercel/ai（官方仓库）：https://github.com/vercel/ai
- AI SDK README：https://github.com/vercel/ai/blob/main/packages/ai/README.md
