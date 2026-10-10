---
title: "caveman 是什么、怎么安装和使用：让 Claude Code / Codex 回答更短、更省 token 的 Skill"
slug: caveman-skill-token-saving
name: caveman（JuliusBrussee/caveman）
url: https://github.com/JuliusBrussee/caveman
pricing: 开源免费（Apache-2.0）
platforms: Claude Code / Codex / Gemini CLI / Cursor / Windsurf / Cline / Copilot 等 30 多种
trialNote: "npx skills add JuliusBrussee/caveman -g"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, prompt-engineering]
excerpt: "caveman 是一个让智能体「像原始人一样说话」的 Skill：先给结论、一句一个意思、不寒暄不复述，代码和命令一字不改，用更少的输出 token 表达同样的内容。另有可选的本地代理压缩智能体读取的日志和文件。"
checkedOn: 2026-10-10
sources:
  - https://github.com/JuliusBrussee/caveman
  - https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
---

> 本文根据 JuliusBrussee/caveman 仓库 README 和 skills.sh 榜单整理，资料核对于 2026-10-10。README 中的节省比例来自作者和第三方的测试，条件各不相同，本文只作概述。

## 是什么

caveman 的口号是「能用几个 token 说清，为什么要用很多」。README 说它 2026 年 4 月作为一个玩笑起步，后来越做越认真。它让智能体换一种说话方式：不问候、不说「让我来看看」、不在结尾复述，直接给出「什么东西、怎么了、为什么、下一步」。README 里的例子是解释 React 组件为什么重复渲染：普通回答 63 个 token，caveman 的回答 20 个 token，修复建议完全一样。

它不是把语法弄坏，而是一套有规则的写法，README 列了几条关键约束：**含义不能丢**（冠词可以省，not、never、only 这类词和数字单位必须保留）；**代码、命令、路径、报错信息原样输出**；遇到安全警告、不可逆操作、需要分步骤的指令或用户明显困惑时，自动恢复完整句子；**从不改写你的提示词**。

项目现在分成两部分：**技能**（压缩智能体「说」的内容）和可选的**本地代理**（压缩智能体「读」的内容，如日志、测试输出、JSON）。

截至 2026-10-10，GitHub 显示该仓库约 11.1 万 Star、6,400 Fork，最近一次推送在 2026-10-10。在 skills.sh 总榜（2026-10-10）上，`caveman` 技能约 56.6 万次安装。

## 包含哪些 Skill

- **三档说话方式**：`/caveman`（标准）、`/ultracave`（更省）、`/megacave`（用文言文式的极简中文表达，README 示例里最短）；`/caveman status` 查看当前档位，`/caveman off` 关闭；
- `/caveman-commit`：生成一行式的 Conventional Commit 提交信息；
- `/caveman-review`：代码评审，每条发现一行，格式类似「L42：空指针，加判断」；
- `/caveman-compress <文件>`：压缩 `CLAUDE.md` 这类记忆文件并备份原文件，保留标题、代码块和路径；
- `/caveman-stats`：查看当前 Claude Code 会话的真实 token 用量；`/caveman-help`：命令速查；
- `cavecrew`：负责查找、修改、评审代码并用 caveman 风格汇报的子智能体；
- 一组「少写代码」的工作模式技能：`investigate-first`、`lean-build`、`surgical-patch`、`safe-refactor`、`migration`、`verify-and-stop`，任务匹配时自动启用；
- 另有 `caveman-setup`、`caveman-learn` 等用来在智能体里操作本地代理的技能。

## 怎么安装

**只要技能（README 称为「小石头」，只压缩输出，不装代理）**：

```bash
npx skills add JuliusBrussee/caveman -g
```

README 说明这种方式适用于 Claude Code、Codex、Gemini CLI、Cursor、Windsurf、Cline、Copilot 等 30 多种智能体。

**Claude Code 插件**（每次交互式会话自动启用，子智能体也生效）：

```text
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

**Gemini CLI**：`gemini extensions install https://github.com/JuliusBrussee/caveman`。

**claude.ai 网页版 / 手机 App / Cowork**：README 写的是在 Customize → Plugins 里把 caveman 添加到账号，步骤见仓库 INSTALL.md，并注明「尚未完整端到端测试」。

**连同本地代理一起装（「大石头」，需要 Node.js 22.13 以上）**：

```bash
npm install -g @caveman-ai/cli && caveman setup --install
```

## 怎么用

- **开启与关闭**：技能没有自动启动时输入 `/caveman`（Codex 里是 `$caveman`）；想恢复正常说话就说 `stop caveman`。
- **提交代码**：改完后输入 `/caveman-commit`，得到一行规范的提交信息。
- **瘦身记忆文件**：`CLAUDE.md` 越写越长时运行 `/caveman-compress CLAUDE.md`，它会生成更短的版本并保留原文件备份。
- **只在长会话里用**：日常问答觉得太简略时关掉，跑长任务、看大量工具输出时再打开。

## 适合谁 / 不适合谁

**适合：**
- 按 token 计费、或经常撞到用量上限的重度用户；
- 嫌智能体啰嗦、只想看结论和改动的开发者；
- 长时间运行的智能体会话（上下文更耐用）。

**不适合：**
- 初学者：简短回答省掉的解释，正是新手需要的；
- 按请求次数计费的场景——README 自己说明，像 Copilot 的高级请求那样按次计费时，回答变短并不省钱；
- 要把智能体的输出直接当文档、给非技术同事看的场景。

## 注意事项

- **许可证**：Apache-2.0。
- **维护状态**：非常活跃（最近推送 2026-10-10）；README 提到由一位维护者无偿维护。
- **节省幅度别期望过高**：README 的测试显示，新模型本来就懂「简洁回答」，在此基础上 `/caveman` 的额外节省有限，`/ultracave` 更明显；技能规则本身约占一千多个 token。仓库有一份 HONEST-NUMBERS.md 专门列出它不划算的情况。
- **技能和代理的隐私差别很大**：README 写明技能在本机运行、不发送任何数据；而 `caveman` 命令行工具（代理）**默认发送使用统计**（运行的命令、token 数、随机安装 ID、操作系统、IP，不含提示词和代码），可用 `caveman telemetry off` 关闭。
- **代理要慎重**：代理会介入智能体与模型之间的流量，并使用你自己的密钥或订阅登录。公司环境先确认安全规定，个人使用也建议先核对所用模型服务的条款；多数人只装技能就够了。
- **一键安装脚本**：README 提供 `curl … | bash` 和 PowerShell 的一键脚本，运行前先看脚本内容；安装只认 `JuliusBrussee/caveman` 这个仓库。
- **极简档位可能影响理解**：`/megacave` 的输出非常压缩，重要决策前切回正常模式再确认一遍。
