---
title: "shadcn skill 是什么、怎么安装使用：shadcn/ui 官方 Skill，让 Claude Code / Cursor 按你项目的配置写对组件"
slug: shadcn-ui-skill-official
name: shadcn skill（shadcn/ui 官方 Skill）
url: https://github.com/shadcn-ui/ui/tree/main/skills/shadcn
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor 等支持 Agent Skills 的智能体（npx skills 安装）"
trialNote: "npx skills add shadcn/ui"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "shadcn skill 是 shadcn/ui 官方出的 Agent Skill：自动读取项目的 components.json 和 shadcn info 输出，让智能体知道你的框架、别名、已装组件和图标库，再按正确的 CLI 命令与组合规则查找、安装和定制组件。"
checkedOn: 2026-10-11
sources:
  - https://github.com/shadcn-ui/ui/tree/main/skills/shadcn
  - https://github.com/shadcn-ui/ui
  - https://ui.shadcn.com/docs/skills
  - https://skills.sh/
---

> 本文根据 shadcn-ui/ui 仓库里该技能的 SKILL.md 与官方文档的 Skills 页面整理，资料核对于 2026-10-11。截至当日，GitHub 显示 shadcn-ui/ui 约 12.5 万 Star；skills.sh 榜单上该技能在 shadcn/ui 来源下累计安装约 27.1 万次。内容随仓库更新，以官方文档为准。

## 是什么

shadcn/ui 不是一个装进 `node_modules` 的组件库，而是一套「把组件源码复制进你项目」的分发方式，由 CLI 负责添加和更新。正因为代码在你自己的仓库里，每个项目的情况都不一样：用的是哪个框架、路径别名怎么配、底层用 Radix 还是别的基础库、图标库是哪个、已经装了哪些组件。大模型不知道这些，就容易写出导入路径不对、组件没装、接口对不上的代码。

官方的 shadcn skill 就是来补这块信息的。文档页的说法是：它给 AI 助手提供「了解你项目」的 shadcn/ui 上下文，装好之后，助手知道怎么用符合你项目的接口和模式去查找、安装、组合和定制组件。

## 包含哪些内容

它是单个技能，文档列出了五块知识：

- **项目上下文**：每次交互时运行 `shadcn info --json`，取得项目配置——框架、Tailwind 版本、别名、基础库（`base`、`radix` 或 `aria`）、图标库、已安装的组件和解析后的文件路径。
- **CLI 命令**：`init`、`add`、`search`、`view`、`docs`、`diff`、`info`、`build` 的完整参考，包括各参数、试运行模式、智能合并流程、预设和模板。
- **主题与定制**：CSS 变量、OKLCH 颜色、暗色模式、自定义颜色、圆角和组件变体，同时覆盖 Tailwind v3 和 v4。
- **编写注册表**：怎么构建和发布自己的组件注册表，包括 `registry.json` 的格式、条目类型、依赖、构建和托管。
- **MCP 服务**：shadcn MCP 服务的配置和工具，用来搜索、浏览和安装各注册表里的组件。

工作方式分四步：在项目里发现 `components.json` 时激活；运行 `shadcn info --json` 把配置注入上下文；按 shadcn/ui 的组合规则写代码（例如表单用 `FieldGroup`、选项组用 `ToggleGroup`、使用语义化颜色）；生成代码前先用 `shadcn docs`、`shadcn search` 或 MCP 工具查到组件及其文档。

## 怎么安装

官方文档给的命令：

```bash
npx skills add shadcn/ui
```

它把技能装进当前项目，之后助手在处理 shadcn/ui 组件时会自动加载。项目里需要先有 `components.json`（也就是已经执行过 `shadcn init`）。

## 怎么用

文档里的示例提示：

- 「加一个带邮箱和密码字段的登录表单」；
- 「做一个仪表盘，有侧边栏、统计卡片和数据表格」；
- 「从 @tailark 加一个首屏区块」——从第三方注册表取组件；
- 「切换到某个预设」。

## 适合谁 / 不适合谁

**适合：**
- 已经在用 shadcn/ui、并用 Claude Code、Cursor 等写前端的开发者；
- 维护自家组件注册表的团队。

**不适合：**
- 没有使用 shadcn/ui 的项目——它不是通用的界面设计技能；
- 想让 AI 负责审美方向的场景，它只保证组件用得对，好不好看要配合设计类技能。

## 注意事项

- **许可**：shadcn-ui/ui 仓库为 MIT。
- **会执行命令**：技能会运行 `shadcn info`，添加组件时会往项目里写入文件并安装依赖，改动前可以用 CLI 的试运行或 `diff` 先看。SKILL.md 的 `allowed-tools` 只放行 shadcn CLI 的命令；`user-invocable: false` 表示它由模型按需自动加载，不作为斜杠命令出现。
- **第三方注册表**：从非官方注册表安装的组件等同于引入第三方代码，来源要自己把关。
- **与 MCP 的关系**：技能提供知识和规则，MCP 服务提供查询和安装的工具，两者可以同时用。
- skills.sh 上 `shadcn/ui` 与 `shadcn-ui/ui` 两个来源名都有记录，指向的是同一个官方仓库；另有不少第三方的同名技能，安装时认准官方命令。
