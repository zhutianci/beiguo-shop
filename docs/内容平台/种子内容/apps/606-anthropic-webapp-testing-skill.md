---
title: "webapp-testing skill 怎么用：Anthropic 官方的 Playwright 网页测试 Skill（安装与使用）"
slug: anthropic-webapp-testing-skill
name: webapp-testing（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/webapp-testing
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding]
excerpt: "webapp-testing 是 anthropics/skills 里的本地网页应用测试 Skill：让 Claude 写原生 Python Playwright 脚本验证前端功能、截图、看浏览器日志，并用 with_server.py 管理开发服务器的启停。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/webapp-testing
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 17.4 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Claude 改完前端代码后，常见的问题是它「以为」改好了，却没有真的打开页面看过。webapp-testing 给它一套验证办法：用 Python 版 Playwright 驱动浏览器，对本地运行的网页应用做操作和检查。`description` 列的用途包括验证前端功能、调试界面行为、截取浏览器截图和查看浏览器日志。

技能里有一棵简单的决策树：静态 HTML 直接读文件找选择器；动态应用要先确认开发服务器是否已经在跑，没有就用目录里的 `scripts/with_server.py` 代为启动（支持同时起前端和后端多个服务），测试结束后自动关闭。它强调「先侦察、后动作」：等页面加载稳定，截图或读取渲染后的 DOM，找到真实存在的选择器，再去点击和输入，而不是凭源码猜。还有一条不常见的要求——辅助脚本一律先用 `--help` 看用法、当黑盒调用，不要把脚本源码读进上下文。

## 怎么安装

`webapp-testing` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/webapp-testing` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「启动这个项目的开发服务器，打开首页，检查登录表单提交后是否跳转到仪表盘，并截图」。
- 「页面上点『导出』没反应，帮我打开浏览器看控制台报了什么错」。
- 「给购物车的增删改写一个 Playwright 冒烟测试脚本」。

`examples/` 下有三个示例脚本：抓取控制台日志、发现页面元素、自动化静态 HTML。

## 适合谁 / 局限

适合让 Claude Code 做前端功能、希望它自己验证结果的开发者，也适合给没有端到端测试的小项目补几条冒烟测试。它面向的是本地应用；要登录第三方服务的流程、验证码、复杂的多标签页交互并不在覆盖范围内，也不是完整的测试框架，用例组织和持续集成需要另外安排。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **依赖**：需要 Python、Playwright 以及对应的浏览器内核，首次使用要先安装。
- **会启动进程、打开浏览器**：`with_server.py` 会执行你项目的启动命令，建议在开发环境使用，不要指向线上地址。
- 只在 Claude Code 这类能执行命令的环境里有意义，claude.ai 网页版无法访问你本机的服务。
