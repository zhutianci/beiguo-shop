---
title: "playwright-cli 是什么、怎么安装使用：微软官方的 Playwright 命令行 + Skills，让编程智能体省着 token 操作浏览器"
slug: playwright-cli-microsoft-skills
name: playwright-cli（microsoft/playwright-cli）
url: https://github.com/microsoft/playwright-cli
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Code / GitHub Copilot 等编程智能体；命令行需 Node.js 18+"
trialNote: "\"`npm install -g @playwright/cli@latest` 然后 `playwright-cli install --skills`\""
products: [claude, github-copilot]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "playwright-cli 是微软 Playwright 团队出的命令行工具，自带 Agent Skills：智能体通过一条条简短命令打开页面、点击、输入、截图和取页面快照，不必把庞大的工具定义和无障碍树塞进上下文，适合测试与调试网页。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/playwright-cli
  - https://skills.sh/
  - https://playwright.dev/
---

> 本文根据 microsoft/playwright-cli 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 1.4 万 Star、769 Fork，最近一次推送在 2026-09-28；skills.sh 榜单上 playwright-cli 技能累计安装约 18.0 万次。命令以仓库 README 为准。

## 是什么

Playwright 是微软开源的浏览器自动化框架。让智能体操作浏览器，此前常见的做法是接 Playwright MCP；playwright-cli 是同一个团队给出的另一条路：把浏览器操作做成命令行，再配上一份技能说明，让智能体像敲普通命令一样驱动浏览器。

README 开头专门对比了两者。**CLI + Skills** 更省 token：不用把很大的工具定义和冗长的页面无障碍树加载进模型上下文，智能体通过简短、专用的命令行动，适合既要操作浏览器、又要在有限的上下文里兼顾大型代码库和测试的编程智能体。**MCP** 仍适合需要持久状态、对页面结构反复推理的场景，如探索式自动化、自愈测试和长时间自主运行的流程。README 的结论是：用编程智能体的话，CLI 是更合适的选择。

## 包含哪些内容

这个仓库对外只有一个技能（skills.sh 上名为 `playwright-cli`），背后是一整套命令。README 按类别列出：

- **核心操作**：打开页面、点击、输入、勾选、截图等；
- **导航、键盘、鼠标**；
- **另存为**：把页面保存成 PDF 等；
- **标签页**管理；
- **存储**：Cookie、LocalStorage、SessionStorage 的读写；
- **模拟**（设备、环境）与**网络**；
- **开发者工具**相关命令；
- **快照**：取页面或单个元素的结构快照，可限制深度、带上元素的位置框，也可以在大快照里按文本或正则搜索；
- **元素定位**：先取带引用编号的快照，再用引用操作；也支持 CSS 选择器、角色定位和测试标识。

**会话**方面：默认无头运行，加 `--headed` 可以看到浏览器窗口；浏览器配置默认只在内存里，同一会话的多次调用之间保留 Cookie 和存储，关闭后丢失，加 `--persistent` 才写入磁盘；用 `-s=名称` 可以给不同项目开各自的浏览器实例。

## 怎么安装

需要 Node.js 18 或更高版本。命令来自 README：

```bash
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

第一条装命令行，第二条把技能装到本机，Claude Code、GitHub Copilot 等会使用本地安装的技能。README 还提到「不装技能」的用法：直接告诉智能体用 `playwright-cli`，并让它先看 `playwright-cli --help`。

## 怎么用

- README 的演示：「用 playwright 技能测试 https://demo.playwright.dev/todomvc/ ，把成功和失败的场景都截图」。
- 「启动本地开发服务器，打开登录页，用测试账号走一遍登录流程，看控制台有没有报错」。
- 「打开这个页面，取表单区域的快照，告诉我提交按钮为什么点不了」。

你也可以自己手动敲同样的命令，看智能体在做什么。

## 适合谁 / 不适合谁

**适合：**
- 用 Claude Code、Copilot 等做前端开发，想让智能体自己验证页面行为的人；
- 觉得浏览器类 MCP 太占上下文的人。

**不适合：**
- 需要长时间保持浏览器状态、反复分析页面结构的自主流程，README 建议这类场景继续用 MCP；
- 想写成可维护的自动化测试套件的需求——那应该直接写 Playwright 测试代码，CLI 更偏交互式的探索和调试。

## 注意事项

- **许可**：Apache-2.0。
- **会在本机启动浏览器并访问网页**（默认无头）：用它访问的页面内容会进入模型上下文，网页上的文字可能包含诱导智能体的指令，访问不可信站点时要留意。
- **登录态**：持久化会话会把 Cookie 写到磁盘。在自己的应用上用测试账号没问题；不要让智能体带着你的真实账号登录态去操作第三方网站。
- 只对你有权测试的站点使用，遵守目标网站的服务条款。
