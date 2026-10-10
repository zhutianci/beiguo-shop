---
title: "SkillSpector 是什么、怎么安装使用：NVIDIA 开源的 Agent Skill 安全扫描器（装第三方技能前先扫一遍）"
slug: nvidia-skillspector-security-scanner
name: SkillSpector（NVIDIA）
url: https://github.com/NVIDIA/SkillSpector
pricing: 开源免费（Apache-2.0）；可选的大模型分析按所用服务计费
platforms: 命令行 / Docker；可作为 MCP 服务器接入 Claude Code、Codex CLI、Gemini CLI
trialNote: "uv tool install git+https://github.com/NVIDIA/skillspector.git"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "SkillSpector 是 NVIDIA 开源的技能安全扫描器，回答「这个 Skill 能不能装」：对技能目录、压缩包或 Git 仓库做静态分析，可选再加大模型语义分析，检查提示注入、数据外传、越权、供应链等风险，给出 0–100 的风险分。"
checkedOn: 2026-10-10
sources:
  - https://github.com/NVIDIA/SkillSpector
  - https://docs.nvidia.com/skills/scanning-agent-skills
  - https://docs.nvidia.com/skills/
  - https://code.claude.com/docs/en/skills
  - https://agentskills.io/home
---

> 本文根据 NVIDIA/SkillSpector 仓库 README、NVIDIA 官方文档与 Claude Code 官方文档整理，资料核对于 2026-10-10。检测规则数量和支持的模型服务以仓库 README 为准。

## 是什么

SkillSpector 不是一个技能，而是给技能做「体检」的工具。Skill 可以带脚本、可以指挥智能体读写文件和执行命令，而用户安装第三方技能时往往看都不看。SkillSpector 要回答的就是一个问题：这个技能装上去安全吗？

README 引用了一项研究的数据作为背景：在被分析的三万多个技能里，约四分之一存在安全漏洞，约百分之五表现出疑似恶意的意图，带可执行脚本的技能出问题的概率明显更高。SkillSpector 是 NVIDIA「Verified Skills」流程的一环——NVIDIA 自己发布技能之前，会用它扫描、评估，再签名发布。

它是一个 Python 命令行程序（要求 Python 3.12 及以上），也提供 Docker 镜像构建方式。截至 2026-10-10，GitHub 显示该仓库约 2.0 万 Star、1734 Fork，最近一次推送在 2026-10-10。

## 包含哪些 Skill

这里没有技能清单，对应的内容是「它能检查什么」。README 称共有 71 条漏洞模式，分 17 类，主要包括：

- **提示注入**：技能文本里藏着改变智能体行为的指令；
- **诱导模型无视安全限制**的写法；
- **数据外传**：把文件、密钥、对话内容发往外部地址；
- **权限提升**与**过度自主**：要求超出任务需要的权限，或未经确认就执行高影响操作；
- **供应链**：依赖包的已知漏洞（实时查询 OSV.dev 的漏洞数据）、可疑的下载与安装行为；
- **系统提示泄露、记忆投毒、工具滥用、触发条件滥用**；
- **危险代码**：对 Python 脚本做语法树分析和污点追踪，另有 YARA 特征匹配；
- **MCP 相关**：MCP 配置是否遵循最小权限、工具描述是否被投毒。

分析分两个阶段：先是快速的静态分析；再是可选的大模型语义分析，用来判断静态规则难以定性的内容。结果给出 0–100 的风险分和建议：0–20 为低风险（SAFE），21–50 需谨慎（CAUTION），51 分以上建议不要安装。报告可以输出为终端文本、JSON、Markdown 或 SARIF，方便接入 CI。

## 怎么安装

**用 uv 快速安装（仅命令行）**：

```bash
uv tool install git+https://github.com/NVIDIA/skillspector.git
# Update later: uv tool update skillspector
```

**需要 MCP 服务器功能时**，安装带 MCP 扩展的版本：

```bash
uv tool install 'skillspector[mcp] @ git+https://github.com/NVIDIA/skillspector.git'
```

**从源码安装**：`git clone https://github.com/NVIDIA/skillspector.git` 后在虚拟环境里安装。不想装 Python 的话，用仓库自带的 Dockerfile 构建镜像（`make docker-build`）。

README 的提示：安装过程会下载其他第三方开源组件，使用前留意它们各自的许可条款。

## 怎么用

基本用法是 `scan` 加目标，目标可以是本地目录、单个文件、Git 仓库地址或压缩包：

```bash
# Scan a local skill directory
skillspector scan ./my-skill/

# Scan a Git repository
skillspector scan https://github.com/user/my-skill

# Scan a zip file
skillspector scan ./my-skill.zip
```

常用选项：

- `skillspector scan ./my-skill/ --no-llm`：只做静态分析，速度快，文件内容不出本机；
- `skillspector scan ./my-skill/ --format json --output report.json`：输出机器可读的报告；
- `skillspector baseline ./my-skill/ -o .skillspector-baseline.yaml`：把当前已确认可接受的结果记为基线，之后带 `--baseline` 扫描只报告新增问题。

大模型分析通过环境变量 `SKILLSPECTOR_PROVIDER` 选择服务，README 支持 OpenAI、Anthropic、AWS Bedrock、Gemini、Azure OpenAI、本地 Ollama、任意 OpenAI 兼容接口，以及本机已登录的 `claude` 命令行等。

进阶用法是运行 `skillspector mcp`，让 Claude Code、Codex CLI、Gemini CLI 把扫描当作一个工具来调用，在安装技能或 MCP 之前先过一遍。命令的退出码也可用于自动化：风险分不超过 50 返回 0，超过返回 1，出错返回 2。

## 适合谁 / 不适合谁

**适合：**
- 经常从 GitHub 或技能目录站安装第三方技能的个人用户——装之前花一分钟扫一遍；
- 在团队内部分发技能、需要准入检查的平台和安全工程师；
- 自己写技能并打算公开发布的作者，发布前先自查。

**不适合：**
- 期待「扫过就绝对安全」的人——它是多一层防护，不是保证；
- 不熟悉命令行的用户；
- 主要审查中文技能的场景要打折扣——README 的局限性一节写明，对非英文内容可能漏检。

## 注意事项

- **许可证**：仓库 LICENSE 为 Apache-2.0。
- **维护状态**：更新活跃，最近一次推送 2026-10-10。
- **它不做什么**：README 的信任模型一节说得很清楚——它从不执行被扫描的技能，只做静态分析加可选的模型评估；它也**不是沙箱**，你执意安装一个高风险技能，它拦不住也隔离不了。看不了图片里的文字、加密或编译后的代码，也看不到运行时行为。
- **数据会去哪里**：默认开启的大模型分析会把被扫描文件的内容发送给你配置的模型服务，扫描私有技能时用 `--no-llm` 可以让内容留在本地；供应链检查会把技能声明的依赖包名和版本发给 OSV.dev 查询漏洞（不发送文件内容），即使加了 `--no-llm` 也会进行，离线时改用内置的小型清单。
- **安全提醒**：扫描器本身也是要在本机安装运行的第三方软件，建议按 README 用 `uv tool` 或虚拟环境隔离安装；若以 HTTP 方式运行 MCP 服务，保持绑定在本机回环地址。扫描结果为低风险，也不能代替自己通读 `SKILL.md` 和脚本——优先选择官方或知名来源的技能这条原则不变。
- **兼容性**：需要 Python 3.12 及以上；README 提到 MCP 的 stdio 方式目前存在一个已知的初始化卡住问题。
- 误报和漏报都会有：高分不一定是恶意，可能只是写法粗糙；可以用基线功能管理已确认的误报。
