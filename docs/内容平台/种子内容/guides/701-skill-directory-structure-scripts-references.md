---
title: Skill 目录结构怎么组织：scripts、references、assets 与渐进式披露，脚本怎么写
slug: skill-directory-structure-scripts-references
products: [ai-tools, claude]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Skill 文件夹里除了 SKILL.md 还能放什么？按 Agent Skills 官方规范讲清 scripts、references、assets 三个目录的分工、渐进式披露的三层加载、文件引用的写法，以及给智能体调用的脚本要满足哪些要求。
checkedOn: 2026-10-11
sources:
  - https://agentskills.io/specification
  - https://agentskills.io/skill-creation/using-scripts
  - https://agentskills.io/skill-creation/best-practices
verify:
  - 智能体能运行哪些语言的脚本取决于具体工具和运行环境，规范只列了常见的 Python、Bash、JavaScript
  - 输出截断阈值（10–30K 字符）是规范页举的例子，各工具实际数值不同
---

> 本文根据 Agent Skills 开放规范（agentskills.io）的《Specification》《Using scripts in skills》《Best practices for skill creators》整理，资料核对于 2026-10-11。SKILL.md 本身的写法见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)。

## 适用于谁

- 搜「skill 目录结构」「claude skill 目录结构」「skill 如何调用脚本」「skill python 脚本」的人；
- SKILL.md 越写越长，想拆分又不知道怎么拆的人；
- 想让 Skill 带上脚本、模板，让智能体直接执行而不是每次重写的人。

## 结论先说

1. **一个 Skill 就是一个文件夹**，必须有 `SKILL.md`，另外约定了三个可选目录：`scripts/`（可执行代码）、`references/`（按需阅读的文档）、`assets/`（模板和静态资源）。
2. **加载分三层**：启动时只读所有 Skill 的名称和描述（每个约 100 token）；启用时读整份 `SKILL.md`；其余文件用到时才读。这就是「渐进式披露」。
3. **`SKILL.md` 控制在 500 行以内**，详细资料拆到单独的文件，并写清「什么情况下读哪个文件」。
4. **文件引用用相对路径、只引一层**，不要让参考文件再去引用别的参考文件。
5. **给智能体用的脚本不能有交互式输入**。这是硬性要求：智能体在非交互的终端里运行，等待输入的脚本会一直卡住。

## 一、官方约定的目录结构

```
skill-name/
├── SKILL.md          # 必需：元数据 + 说明
├── scripts/          # 可选：可执行代码
├── references/       # 可选：文档
├── assets/           # 可选：模板、资源
└── ...               # 其他文件或目录
```

规范说明，除了 `SKILL.md` 之外可以放任何文件和目录，上面三个只是推荐的组织方式。

| 目录 | 放什么 | 官方的要求或建议 |
| --- | --- | --- |
| `scripts/` | 智能体可以运行的代码 | 自包含或写清依赖；报错信息要有用；妥善处理边界情况 |
| `references/` | 需要时才读的补充文档，如详细技术参考、表单模板、按领域拆分的资料 | 每个文件聚焦一个主题；文件越小，占用上下文越少 |
| `assets/` | 静态资源：文档模板、配置模板、示意图、查找表、schema | 较长的输出模板放这里，在 SKILL.md 里引用 |

## 二、渐进式披露：三层各放什么

规范原文给出的三层：

1. **元数据（约 100 token）**：`name` 和 `description`，启动时为所有 Skill 加载；
2. **说明（建议少于 5000 token）**：`SKILL.md` 正文，启用该 Skill 时加载；
3. **资源（按需）**：`scripts/`、`references/`、`assets/` 里的文件，只在需要时加载。

由此得出的写法：

- 每次执行都要用到的核心步骤，放 `SKILL.md`；
- 只在某些情况下才需要的细节（某个接口的错误码表、某一类文档的特殊处理），放 `references/`；
- **「注意事项」留在 `SKILL.md` 里**。官方的理由是：这类不明显的坑，智能体在遇到之前并不知道自己需要去读，放进单独文件很可能读不到。

拆出去的文件要告诉智能体**何时**去读。官方的对比很清楚：

- 有用的写法：「如果接口返回非 200 状态码，阅读 `references/api-errors.md`」；
- 没用的写法：「详见 references/ 目录」。

## 三、怎么引用文件

在 `SKILL.md` 里引用其他文件时，用从 Skill 根目录出发的相对路径：

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

规范的两条要求：

- **只引用一层**：从 `SKILL.md` 直接指向目标文件；
- **避免层层嵌套的引用链**：A 引 B、B 再引 C，智能体很容易半路停下。

代码块里的脚本路径同样相对于 Skill 根目录，因为智能体是在那里执行命令的；这条约定在 `references/*.md` 里也适用。

## 四、不写脚本：直接调用现成的包

如果已有的工具包就能完成任务，可以在 `SKILL.md` 里直接写命令，不需要 `scripts/` 目录。官方列出了几种能在运行时自动解决依赖的方式：

| 工具 | 来自 | 说明 |
| --- | --- | --- |
| uvx | 随 uv 提供 | 在隔离环境里运行 Python 包，缓存积极，需要单独安装 uv |
| pipx | 可通过系统包管理器安装 | 同样在隔离环境里运行 Python 包，是较成熟的替代方案 |
| npx | 随 Node.js 的 npm 提供 | 按需下载并运行 npm 包，不需要额外安装 |
| bunx | 随 Bun 提供 | Bun 环境里对应 npx 的命令 |
| deno run | 随 Deno 提供 | 访问文件或网络需要显式的权限参数 |
| go run | Go 自带 | 直接编译并运行 Go 包 |

官方示例（npx 与 pipx）：

```bash
npx eslint@9 --fix .
pipx run 'black==24.10.0' .
```

三条建议：

- **锁定版本**，这样命令的行为不会随时间变化；
- **在 SKILL.md 里写明前置条件**（如「需要 Node.js 18+」），运行环境层面的要求写进 frontmatter 的 `compatibility` 字段；
- **命令复杂到很难一次写对时，改成脚本**。只带几个参数的调用适合直接写命令。

## 五、把脚本放进 scripts/

先在 `SKILL.md` 里列出有哪些脚本，让智能体知道它们存在：

```markdown
## Available scripts

- **`scripts/validate.sh`** — Validates configuration files
- **`scripts/process.py`** — Processes input data
```

再在流程里写明怎么运行：

```bash
bash scripts/validate.sh "$INPUT_FILE"
python3 scripts/process.py --input results.json
```

**让脚本自带依赖声明。** 这样智能体一条命令就能运行，不需要单独的清单文件和安装步骤。Python 用 PEP 723 的内联元数据，官方示例：

```python
# /// script
# dependencies = [
#   "beautifulsoup4",
# ]
# ///

from bs4 import BeautifulSoup
```

然后用 `uv run scripts/extract.py` 运行，uv 会创建隔离环境并安装声明的依赖。官方还给了 Deno（`npm:` 导入）、Bun（导入路径里写版本）、Ruby（`bundler/inline`）的同类写法。

**什么时候值得写脚本。** 官方的判断方法是看执行记录：如果智能体每次都在重新实现同一段逻辑（画图、解析某种格式、校验输出），就把它写成一个经过验证的脚本放进 `scripts/`。

## 六、给智能体用的脚本，接口怎么设计

智能体靠读标准输出和标准错误来决定下一步，所以脚本的接口设计直接影响成功率。

**1. 不要有交互式提示（硬性要求）。** 所有输入通过命令行参数、环境变量或标准输入传入。缺参数时应该立刻报错并给出用法，而不是停下来等输入：

```
Error: --env is required. Options: development, staging, production.
Usage: python scripts/deploy.py --env staging --tag v1.2.3
```

**2. 用 `--help` 说明用法。** 这是智能体了解脚本接口的主要途径，写清简介、参数和示例，保持简短。

**3. 报错信息要能指导下一步。** 说明哪里错了、期望什么、收到了什么。「Error: invalid input」这种信息只会白白浪费一轮。

**4. 输出用结构化格式。** JSON、CSV、TSV 优于对齐的纯文本。数据走标准输出，进度和警告走标准错误。

**5. 其他建议**

- 幂等：智能体可能重试，「不存在则创建」比「重复就报错」安全；
- 对含糊的输入直接拒绝，不要猜；
- 有破坏性的操作提供 `--dry-run` 预览，并考虑要求显式的确认参数；
- 不同失败类型用不同的退出码，并写进 `--help`；
- 控制输出体积：很多工具会截断过长的输出，默认只输出摘要，需要更多时再用参数翻页。

## 常见问题

**Q：三个目录名必须叫这个吗？**
规范把它们称为「推荐的约定」，不是强制。但沿用约定的名字，别人和其他工具更容易看懂。

**Q：脚本会自动执行吗？**
不会无条件执行。智能体按 `SKILL.md` 的说明决定何时运行，能否运行还要看所用工具的权限设置。也正因为 Skill 可以带脚本，安装别人的 Skill 前要先看一遍 `scripts/` 里的内容，见[《MCP 服务器怎么选、装之前怎么审》](/guides/mcp-servers-how-to-choose-audit)里的同类检查思路。

**Q：模板放 SKILL.md 里还是 assets/ 里？**
短模板直接写在 `SKILL.md`；较长的、或只在某些情况下才用的模板放 `assets/`，在 `SKILL.md` 里引用，这样不用时不占上下文。

**Q：参考文件可以很多吗？**
可以，按需加载意味着没被读到的文件不占上下文。前提是 `SKILL.md` 里写清了每个文件对应什么情况。

## 参考资料

- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
- Using scripts in skills：https://agentskills.io/skill-creation/using-scripts
- Best practices for skill creators：https://agentskills.io/skill-creation/best-practices
