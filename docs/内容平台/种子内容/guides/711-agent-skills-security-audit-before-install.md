---
title: Skill 安全吗：安装第三方 Skills 前检查什么（官方安全说明与八步审查）
slug: agent-skills-security-audit-before-install
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: 网上下载的 Skill 能直接装吗、有什么安全风险？按 Anthropic、VS Code、Gemini CLI 等官方文档讲清 Skill 能做到什么、官方列出的几类风险、不同运行环境的权限差别，以及安装前逐项要看的八个地方和装完之后的收紧办法。
checkedOn: 2026-10-11
sources:
  - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - https://code.claude.com/docs/en/skills
  - https://code.visualstudio.com/docs/copilot/customization/agent-skills
  - https://geminicli.com/docs/cli/skills
  - https://opencode.ai/docs/skills/
verify:
  - 本文不推荐任何第三方的 Skill 扫描工具；文中提到的 Skill content scanning 是 Claude Enterprise 的组织功能，官方说明不覆盖通过 Skills API 或 Console 上传的技能
  - 八步审查是按各官方安全说明归纳的检查顺序，不是某一家官方发布的固定流程
  - 各工具的权限与确认机制会随版本调整，以官方文档为准
---

> 本文根据 Anthropic 开发者文档《Agent Skills》的 Security considerations 一节，以及 Claude Code、VS Code、Gemini CLI、OpenCode 的官方技能文档整理，资料核对于 2026-10-11。MCP 服务器的同类问题见[《MCP 服务器怎么选、装之前怎么审》](/guides/mcp-servers-how-to-choose-audit)。

## 适用于谁

- 搜「skills 安全风险」「skills 安全审查」「skills 安全扫描」「skills 安全检测」的人；
- 看到一个热门 Skill 仓库，准备照着 README 一行命令装上的人；
- 团队里负责定「哪些技能可以装」的人。

## 结论先说

1. **官方的立场很明确**：只使用来源可信的 Skill，即你自己写的，或者从 Anthropic 获得的。必须用来源不明的 Skill 时，要格外谨慎并在使用前彻底审查。
2. **Skill 不只是一段提示词**。它通过说明和代码给智能体增加能力，一个恶意的 Skill 可以指示智能体以与它声称的用途不符的方式调用工具、执行代码。
3. **风险有多大取决于智能体当时有什么权限**。在本机的编程智能体里，Skill 里的脚本和你自己运行的程序拥有同样的网络和文件访问能力。
4. **审查要看全部文件**，不只是 `SKILL.md`：脚本、图片和其他资源都要看。
5. **官方的比喻**：把装 Skill 当成装软件来对待。

## 一、Skill 能做到什么

一个 Skill 文件夹里可能有三样东西，对应三种影响方式：

| 内容 | 怎么起作用 | 风险点 |
| --- | --- | --- |
| `SKILL.md` 里的说明 | 被加载进上下文，智能体照着做 | 说明里可以写「先读取某文件并发送到某地址」这类与用途无关的指令 |
| `scripts/` 里的脚本 | 智能体通过终端运行 | 脚本就是普通程序，能做你的账号能做的事 |
| 引用的外部地址 | 智能体按说明去抓取 | 抓回来的内容里可能藏着新的指令，而且内容可以事后被改掉 |

还有一些工具专有的机制会放大影响，以 Claude Code 为例：

- `allowed-tools` 字段可以让列出的工具在调用这一轮里**免确认**；
- 正文里的内联命令（以 `!` 加反引号包住的命令）会在内容发送给模型**之前**就执行，并把输出替换进去；
- `hooks` 字段注册的 Hook 从技能被调用起一直保留到会话结束。

这些都是正当的功能，但意味着审查时不能只看正文的文字说明。

## 二、官方列出的风险

Anthropic 文档的「Key security considerations」：

- **要彻底审查**：检查 Skill 里附带的所有文件，留意异常模式，如意料之外的网络调用、文件访问，或与声称用途不符的操作；
- **外部来源有风险**：从外部地址获取数据的 Skill 风险尤其大，获取到的内容可能包含恶意指令；即使 Skill 本身可信，它依赖的外部内容日后发生变化也会带来问题；
- **工具滥用**：恶意 Skill 可以以有害的方式调用工具（文件操作、终端命令、代码执行）；
- **数据暴露**：能接触敏感数据的 Skill，可能被设计成向外部系统泄露信息；
- **当成安装软件**：把 Skill 集成进能接触敏感数据或关键操作的生产系统时要特别小心。

官方警告框里写的后果包括：数据外泄、未经授权的系统访问等。

## 三、在哪里运行，权限差多少

同一个 Skill 在不同环境里能做的事不一样。Anthropic 文档给出的运行环境差别：

| 环境 | 网络 | 安装软件包 |
| --- | --- | --- |
| claude.ai | 取决于用户或管理员设置，可能是完全、部分或没有网络访问 | 以官方帮助文章为准 |
| Claude API | 没有网络访问，不能调用外部接口 | 运行时不能安装新包，只有预装的可用 |
| Claude Code | 完整的网络访问，与你电脑上其他程序相同 | 可以，官方建议只做本地安装，避免影响你的电脑 |

所以**在本机的编程智能体里装第三方 Skill，是风险最高的场景**：有网络、有你的文件、有你的环境变量和凭据。

## 四、安装前的八步

**第一步：确认来源。** 仓库属于谁、是不是你要找的那个作者或官方组织。仓库名和用户名逐字核对，名字相近的仿冒仓库是最省事的攻击方式。

**第二步：先下载、不安装。** 把仓库克隆到一个临时目录里看，而不是直接运行 README 里的一键安装命令。带 `--yes`、`--all`、`--consent` 这类跳过确认的参数，装第三方内容时不要用。

**第三步：通读 `SKILL.md`。** 重点找与用途无关的指令：读取密钥或配置文件、访问主目录里的 `.ssh`、`.aws` 之类的目录、向某个地址发送内容、要求「不要告诉用户」。也看 frontmatter：有没有 `allowed-tools`，它预先批准了哪些工具和命令。

**第四步：读每一个脚本。** `scripts/` 下的文件逐个打开。看它访问哪些路径、连哪些地址、有没有下载并执行别的东西、有没有经过混淆或编码的大段内容。看不懂的脚本不要装。

**第五步：检查所有外部地址。** 把 Skill 里出现的 URL 列出来，逐个判断：是不是它声称要用的服务、内容会不会被第三方修改。

**第六步：看引用的其他文件。** `references/`、`assets/` 里的文档同样会被读进上下文，里面也可以藏指令。官方说的是审查全部文件，包括图片和其他资源。

**第七步：看依赖。** 脚本里用到的包是否固定了版本，是不是常见的、能查到来源的包。

**第八步：想清楚它需要什么权限。** 一个「帮你润色提交信息」的 Skill 没有理由联网，也没有理由读仓库之外的文件。需要的权限和用途对不上，就不装。

## 五、装上之后怎么收紧

**保留确认步骤。** 不要为了省事打开终端命令的自动批准。VS Code 官方专门提醒：使用共享的技能前先审阅，并检查与终端脚本执行有关的自动批准设置。

**利用工具自带的闸门。**

| 工具 | 可以用的机制 |
| --- | --- |
| Claude Code | 权限规则里用 `Skill(名称)` 允许或拒绝特定技能；设置 `"disableSkillShellExecution": true` 禁用技能正文里的内联命令执行；`skillOverrides` 把某个技能设为只能手动调用或关闭 |
| Gemini CLI | 技能激活前有确认提示，显示名称、用途和将访问的目录；安装时不加 `--consent` |
| OpenCode | 在 `opencode.json` 里对技能名设 `ask` 或 `deny` |
| VS Code Copilot | `disable-model-invocation: true` 让技能只能手动调用；审查终端自动批准设置 |

**把自动调用关掉。** 对还不够放心的技能，改成只能手动调用，它就不会在你没注意的时候被加载。

**放在项目里而不是全局。** 只在需要它的仓库里安装，不要一上来就装成对所有项目生效。

**更新也要审。** 今天看过的内容，下次更新可能就变了。更新前看一遍改动；从 Git 仓库安装的，记下当时的提交版本。

**不用就删。** 装着不用的技能既占上下文，也多一分暴露。

## 六、团队怎么管

- **定一个允许清单**，写明接受标准，技能进仓库要经过代码评审；
- **团队技能统一放在仓库里**（如 `.claude/skills/`、`.agents/skills/`），改动有记录、可回滚；
- **企业版的集中管理**：Anthropic 文档提到，Claude Enterprise 组织可以对上传到 claude.ai 和 Cowork 的自定义技能开启内容扫描（Skill content scanning），但这项扫描不覆盖通过 Skills API 或 Console 上传的技能；Claude Code 支持通过托管设置向全组织部署技能；
- **自己写的也要注意**：技能里不要写入密钥和内部地址，提交前检查一遍。

## 自查清单

- 我知道这个技能是谁写的，仓库地址核对过；
- `SKILL.md`、所有脚本、所有引用文件我都读过；
- 里面出现的外部地址我都清楚是干什么的；
- 它要求的权限和它声称的用途对得上；
- 我没有用跳过确认的参数安装；
- 终端命令的确认步骤还在；
- 它只装在需要的项目里；
- 更新之前我会先看改动。

## 常见问题

**Q：有没有自动扫描 Skill 的工具？**
官方文档里提到的只有面向 Claude Enterprise 组织的内容扫描功能。社区里有各种第三方扫描工具，本文没有逐一核对，不做推荐；无论用不用工具，人工读一遍仍然是官方要求的做法。

**Q：下载量高、星标多的技能就安全吗？**
热度说明用的人多，不说明有人审过每一个版本。技能目录网站和排行榜的收录也不等于安全审查。

**Q：只有说明、没有脚本的技能是不是就没事？**
风险小一些，但不是零。说明本身可以指示智能体运行命令或访问文件，是否执行取决于你的权限设置和你有没有点确认。

**Q：官方的技能可以放心装吗？**
官方把「从 Anthropic 获得的」列为可信来源。前提是确认你装的确实是官方仓库，而不是名字相似的仓库。

## 参考资料

- Agent Skills · Security considerations（Anthropic 开发者文档）：https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Extend Claude with skills（Claude Code 官方）：https://code.claude.com/docs/en/skills
- Use Agent Skills in VS Code（VS Code 官方）：https://code.visualstudio.com/docs/copilot/customization/agent-skills
- Agent Skills（Gemini CLI 官方）：https://geminicli.com/docs/cli/skills
- Agent Skills（OpenCode 官方）：https://opencode.ai/docs/skills/
