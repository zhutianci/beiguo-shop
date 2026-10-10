---
title: "vercel-labs/agent-skills 是什么、怎么安装：Vercel 官方 Agent Skills（React / Next.js 最佳实践、网页界面规范审查）"
slug: vercel-agent-skills-react-nextjs
name: vercel-labs/agent-skills（Vercel 官方技能集）
url: https://github.com/vercel-labs/agent-skills
pricing: 免费（README 写 MIT，仓库根目录无 LICENSE 文件）
platforms: 通用：支持 Agent Skills 格式的编程智能体（用 npx skills 安装）
trialNote: "npx skills add vercel-labs/agent-skills"
products: [claude, ai-tools]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "vercel-labs/agent-skills 是 Vercel 官方的 Agent Skills 合集：React / Next.js 性能规则、网页界面规范审查、React Native、视图过渡动画、Vercel 部署与成本优化等 8 个技能，一条 npx 命令安装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/vercel-labs/agent-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh
  - https://agentskills.io/home
---

> 本文根据 vercel-labs/agent-skills 仓库 README、npx skills 工具说明和 agentskills.io 整理，资料核对于 2026-10-10。技能清单会增减，以仓库 README 为准。

## 是什么

vercel-labs/agent-skills 是 Vercel 放在 vercel-labs 账号下的官方技能合集，仓库简介写的是「Vercel 官方的 agent skills 集合」。它把 Vercel 工程团队在 React、Next.js、网页界面和文档写作上的规则整理成一个个 Skill：每个技能是一个文件夹，里面有 `SKILL.md`，部分带 `scripts/` 和 `references/`，格式遵循 agentskills.io 的开放标准。编程智能体在写组件、做评审、发布上线时按需加载对应规则，不用你每次把规范贴进对话。

截至 2026-10-10，GitHub 显示该仓库约 3.2 万 Star、2816 Fork，最近一次推送 2026-08-28。

## 包含哪些 Skill

README 目前列出 8 个技能：

- `react-best-practices`：React 与 Next.js 性能规则，README 称 40 多条、分 8 类并按影响程度排序，从消除请求瀑布、压缩打包体积到减少重复渲染；
- `web-design-guidelines`：按 100 多条网页界面规范审查 UI 代码，涉及无障碍、焦点状态、表单、动画、排版、图片、深色模式、国际化等；
- `writing-guidelines`：按 Vercel 写作手册审查文档和文案，80 多条规则，管语气、结构、代码示例和排版；
- `react-native-guidelines`：React Native / Expo 的 16 条规则，覆盖列表性能、布局、动画、图片、状态管理；
- `react-view-transitions`：用 React 的 View Transition API 做页面切换、共享元素过渡，含 Next.js 集成写法；
- `composition-patterns`：组件组合模式，解决布尔属性越加越多的问题；
- `vercel-optimize`：先收集 Vercel 项目的指标，再去查对应路由和文件，给出成本、性能、缓存方面的排序报告；
- `vercel-deploy-claimable`：把项目直接部署到 Vercel，返回预览地址和「认领」地址，之后可转到自己的 Vercel 账号名下。

## 怎么安装

README 只给了一种方式：

```bash
npx skills add vercel-labs/agent-skills
```

`npx skills` 是 Vercel Labs 开源的技能安装工具（需要本机有 Node.js）。按它的说明，默认装到当前项目，加 `-g` 装到用户目录；`--skill 名称` 只装其中一个，`-a` 指定给哪个智能体装，`--list` 只列出不安装。skills.sh 榜单（2026-10-10）上这个仓库有几个技能的名字带 `vercel-` 前缀（例如 `vercel-react-best-practices`），和 README 小标题不完全一样，想单装某一个时先用 `--list` 看实际名称。

README 没有提供 Claude Code 插件市场命令，也没有写 claude.ai 上传 ZIP 的步骤。

## 怎么用

装好后不需要额外配置，智能体发现任务相关就会自动使用。可以这样说：

- 「检查这个 React 组件有没有性能问题」——触发 `react-best-practices`；
- 「帮我优化这个 Next.js 页面」；
- 「审一下这个页面的无障碍和交互细节」——触发 `web-design-guidelines`；
- 「把这个项目部署上线，给我链接」——触发 `vercel-deploy-claimable`。

在 Claude Code 里输入 `/skills` 可以确认技能已被识别。

## 适合谁 / 不适合谁

**适合：**
- 用 React、Next.js、React Native 做项目，想让 AI 写出的代码少踩性能坑的开发者；
- 想在提交前让智能体按固定清单做一轮界面和无障碍检查的前端团队；
- 项目部署在 Vercel 上、想排查费用和慢路由的人。

**不适合：**
- 技术栈是 Vue、Svelte 或纯后端的项目——规则几乎都围绕 React 生态；
- 想要需求、计划、测试一整套开发流程的人——这里是规范与审查类技能，不管流程。

## 注意事项

- **许可证**：README 末尾写的是 MIT，但截至 2026-10-10 仓库根目录没有 LICENSE 文件，GitHub 也没有识别出许可证。要二次分发或改编进商业产品，先向维护方确认。
- **维护状态**：最近一次推送 2026-08-28，更新频率不算高。
- **安全**：技能可以带脚本并执行命令。`vercel-deploy-claimable` 会把项目打包上传到 Vercel 的部署服务并生成公开可访问的预览地址，上传前确认目录里没有密钥和内部数据；`vercel-optimize` 要读取你 Vercel 项目的指标数据。这是官方仓库，来源可靠，但从别处拿到的同名技能仍要先读 `SKILL.md` 和脚本。
- **兼容性**：规则代表 Vercel 团队的取向，和你团队已有的规范冲突时，以项目自己的约定为准；Next.js 相关写法跟随新版本，老版本项目照搬前先核对。
