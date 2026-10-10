---
title: "agent-browser 是什么、怎么安装使用：Vercel 出的 AI 智能体浏览器自动化 CLI 与 Skill"
slug: agent-browser-vercel-cli-skill
name: agent-browser（vercel-labs/agent-browser）
url: https://github.com/vercel-labs/agent-browser
pricing: "开源免费（Apache-2.0）"
platforms: "命令行（npm / Homebrew / Cargo 安装）；技能供 Claude Code、Codex、Cursor 等使用"
trialNote: "`npm install -g agent-browser` 然后 `agent-browser install` 然后 `npx skills add vercel-labs/agent-browser`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "agent-browser 是 Vercel Labs 开源的浏览器自动化命令行工具，专为 AI 智能体设计：用无障碍树快照加元素编号的方式操作网页，原生 Rust 实现，配套 Skill 让 Claude Code、Codex 等学会使用它。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/agent-browser
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
---

> 本文根据 vercel-labs/agent-browser 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。命令较多且更新频繁，以仓库 README 为准。

## 是什么

agent-browser 是 Vercel Labs 出的一个浏览器自动化 CLI，README 的定位是「给 AI 智能体用的」，用 Rust 写成原生程序。它和传统的 Playwright 脚本思路不同：智能体不需要写选择器，而是先让工具输出页面的**无障碍树快照**，快照里每个可交互元素带一个编号（如 `@e2`），之后直接用编号点击、填写、读取文字。这样一次操作只是一条很短的命令，省 token 也不容易点错。

README 里的最小流程是：`agent-browser open example.com` → `agent-browser snapshot` → `agent-browser click @e2` → `agent-browser fill @e3 "..."` → `agent-browser screenshot page.png` → `agent-browser close`。传统选择器同样支持。

截至 2026-10-11，GitHub 显示该仓库约 4.4 万 Star、2964 Fork，最近一次推送在 2026-10-10；配套技能在 skills.sh 当日榜单上累计安装约 108 万次，排在前五。

## 包含哪些 Skill

仓库以 CLI 为主体，技能是教智能体使用 CLI 的说明：

- 通过 `npx skills add vercel-labs/agent-browser` 安装的 `agent-browser` 技能；
- CLI 自带的技能内容：`agent-browser skills` 列出可用技能，`agent-browser skills get <名称>` 输出某个技能的全文。README 说明这样做是为了让智能体拿到的说明始终与已安装的 CLI 版本一致，而不是依赖过时的缓存副本。

命令本身覆盖导航、点击与输入、读取页面信息和适合智能体阅读的文本、语义定位、等待、批量执行、截图等。

## 怎么安装

先装 CLI（README 推荐全局安装）：

```bash
npm install -g agent-browser
agent-browser install
```

第二条会从 Chrome for Testing 下载浏览器，只需执行一次；已有的 Chrome、Brave 等会被自动检测到。macOS 也可以用 `brew install agent-browser`，Linux 上缺系统库时用 `agent-browser install --with-deps`。

再给智能体装技能：

```bash
npx skills add vercel-labs/agent-browser
```

升级用 `agent-browser upgrade`。

## 怎么用

装好后对智能体直接说：

- 「用 agent-browser 打开本地的 localhost:3000，检查注册表单提交后的提示文字」；
- 「打开这个公开的文档页面，把价格表读出来整理成表格」；
- 「给首页和定价页各截一张图」。

README 提醒：目标元素被弹窗或 Cookie 横幅遮住时点击会提前失败，要先处理遮挡再重新取快照。

## 适合谁 / 不适合谁

**适合：**
- 让编程智能体自己验证前端改动、做冒烟测试的开发者；
- 需要智能体读取公开网页、操作自己系统后台的自动化场景。

**不适合：**
- 没有命令行环境的纯聊天用户；
- 想用它绕过网站的反自动化措施、批量抓取需要登录的第三方数据——这既不是它的设计目的，也可能违反对方的服务条款。

## 注意事项

- **许可证**：Apache-2.0。
- **安全功能默认关闭**：README 列了一组面向智能体部署的安全功能（例如本地加密保存凭据、让大模型看不到密码的认证保险库），全部需要你显式启用。
- **提示词注入**：网页内容会进入智能体的上下文，页面里可能夹带诱导它执行操作的文字。让它浏览不受信任的网站时，不要同时给它高权限的工具，也不要用已登录重要账号的浏览器配置。
- **账号安全**：让智能体代你登录任何服务前，想清楚它能在里面做什么；涉及支付、删除数据的页面建议人工操作。
- 它会下载并启动浏览器进程，占用的磁盘和内存比纯文本技能大得多。
