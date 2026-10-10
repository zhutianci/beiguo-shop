---
title: Codex Skills 怎么用：安装目录、$ 调用、skill-installer 与 config.toml 停用
slug: codex-skills-how-to-use-install
products: [codex, chatgpt]
models: []
topics: [ai-agent]
accountTier: PLUS
excerpt: Codex 的 Skills 怎么安装、放哪个目录、怎么触发？按 OpenAI 官方文档讲清 .agents/skills 的六个扫描位置、用 $ 显式调用与按描述隐式调用、内置的 skill-creator 和 skill-installer、agents/openai.yaml 的作用，以及在 config.toml 里停用某个技能。
checkedOn: 2026-10-11
sources:
  - https://learn.chatgpt.com/docs/build-skills
  - https://agentskills.io/specification
verify:
  - OpenAI 的 Codex 文档地址 developers.openai.com/codex/skills 现已跳转到 learn.chatgpt.com/docs/build-skills，内容以后者为准
  - 官方页面列出了各扫描位置但没有写明同名技能的优先顺序，只说明同名技能不会合并
  - skill-installer 能安装哪些技能、从哪个仓库取，以官方当前说明为准
---

> 本文根据 OpenAI 官方文档《Build skills》整理，资料核对于 2026-10-11。ChatGPT 网页和桌面 App 里的技能入口见[《ChatGPT Skills 怎么用》](/guides/chatgpt-skills)，本文只讲 Codex CLI 和 IDE 扩展。Codex 还没装好的话先看[《Codex 入门》](/guides/codex-getting-started)。

## 适用于谁

- 搜「codex skills 怎么用」「codex skills 安装」「codex skills 配置」「codex 如何触发 skill」的人；
- 从 Claude Code 转过来，想把已有的 Skill 搬到 Codex 里的人；
- 照旧教程把技能放进 `~/.codex/skills` 却不确定对不对的人。

## 结论先说

1. **Codex 扫描的目录是 `.agents/skills`**：项目里从当前目录一路向上到仓库根，每一层的 `.agents/skills` 都会被扫描；个人级是 `$HOME/.agents/skills`。
2. **两种调用方式**：显式调用，运行 `/skills` 或者输入 `$` 选择技能；隐式调用，任务和技能的 `description` 对得上时 Codex 自己选用。
3. **不用手写也能有**：`$skill-creator` 帮你创建，`$skill-installer` 帮你安装现成的。
4. **格式就是开放标准的 `SKILL.md`**，从别的工具搬过来的技能文件夹，放对目录即可。
5. **想停用不想删**：在 `~/.codex/config.toml` 里加一条 `[[skills.config]]`，把 `enabled` 设为 `false`。

## 一、技能放在哪

官方表格列出的扫描位置：

| 范围 | 位置 | 建议用途 |
| --- | --- | --- |
| REPO | `$CWD/.agents/skills` | 只针对某个工作目录或模块的技能 |
| REPO | `$CWD/../.agents/skills` | 父目录里某个共享区域的技能 |
| REPO | `$REPO_ROOT/.agents/skills` | 整个仓库都可用的技能 |
| USER | `$HOME/.agents/skills` | 你个人跨仓库使用的技能 |
| ADMIN | `/etc/codex/skills` | 整台机器或容器范围的技能 |
| SYSTEM | 随 Codex 内置 | OpenAI 自带的技能，如 skill-creator、plan |

几条官方说明：

- **同名技能不会合并**，两个都可能出现在技能选择器里。所以不要在个人目录和仓库里各放一份同名的；
- Codex 会跟随符号链接指向的技能文件夹；
- Codex 会自动发现变化；更新没有出现时，重启 Codex。

每个技能是一个文件夹，结构如下，只有 `SKILL.md` 是必需的：

```
my-skill/
├── SKILL.md           # 必需，frontmatter 里有 name 和 description
├── scripts/           # 可选，可执行代码
├── references/        # 可选，文档
├── assets/            # 可选，模板和资源
└── agents/openai.yaml # 可选，外观与依赖
```

## 二、怎么调用

**显式调用**：在 Codex CLI 或 IDE 扩展里运行 `/skills`，或者在输入框里输入 `$`，从列表里选技能。明确知道要用哪个时用这种方式最稳。

**隐式调用**：不点名，Codex 根据任务和各技能 `description` 的匹配程度自行决定。

关于上下文占用，官方的说明是：Codex 一开始只加载每个技能的名称、描述和文件路径，决定使用某个技能时才读取完整的 `SKILL.md`。这份初始清单最多占上下文窗口的 2%（窗口大小未知时按 8,000 字符）；技能装得很多时，Codex 会先缩短描述，仍放不下时可能略去部分技能并给出警告。

这意味着两件事：description 要把关键的使用场景写在最前面；用不上的技能及时停用。

## 三、创建技能

三种方式：

1. **用内置的创建器**：在 Codex 里调用 `$skill-creator`，按提示描述你要的技能。官方说明默认生成的是只含说明、不带脚本的技能；
2. **手写**：新建一个文件夹，里面放 `SKILL.md`，frontmatter 写 `name` 和 `description`，后面接操作说明。写法见[《SKILL.md 怎么写》](/guides/skill-md-format-spec-how-to-write)；
3. **录制并回放**：把一次操作录下来，由录制器起草成技能。这是 ChatGPT 桌面 App 的功能，详见上面的 ChatGPT Skills 教程。

官方给的几条写作建议：

- 一个技能只做一件事；
- 能用文字说明就不用脚本，除非需要确定性的行为或外部工具；
- 步骤用祈使句，写明输入和输出；
- 拿几句真实的提问去试，确认描述能正确触发。

## 四、安装现成的技能

用内置的安装器：

```text
$skill-installer linear
```

这是官方文档里的例子，安装名为 `linear` 的技能。官方还说明可以让安装器从其他仓库下载技能。新装的技能会被自动发现，没出现就重启 Codex。

也可以手动安装：把技能文件夹复制到 `$HOME/.agents/skills`（个人）或仓库的 `.agents/skills`（项目）下。

如果是要把自己的技能分发给别人，官方推荐的途径是做成**插件**。技能是编写格式，插件是分发方式；插件里的技能还能在 ChatGPT 的网页、桌面和手机端使用，而单独的技能文件夹只在 ChatGPT 桌面 App、Codex CLI 和 IDE 扩展里可用。

安装第三方技能之前，先把 `SKILL.md` 和 `scripts/` 里的文件读一遍，见[《Skill 安全吗：安装前检查什么》](/guides/agent-skills-security-audit-before-install)。

## 五、停用某个技能

不想删除、只想暂时关掉，在 `~/.codex/config.toml` 里加一段，`path` 指向那个技能的 `SKILL.md`：

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

改完配置后重启 Codex。

## 六、agents/openai.yaml 是干什么的

这是 Codex 在开放标准之外加的可选文件，放在技能文件夹的 `agents/` 目录下，有三部分：

| 部分 | 字段 | 作用 |
| --- | --- | --- |
| `interface` | `display_name`、`short_description`、`icon_small`、`icon_large`、`brand_color`、`default_prompt` | 在 ChatGPT 桌面 App 里显示的名称、图标等界面信息 |
| `policy` | `allow_implicit_invocation`（默认 `true`） | 设为 `false` 时关闭隐式调用，但仍可以用 `$技能名` 显式调用 |
| `dependencies` | 工具声明 | 声明这个技能依赖的工具，官方示例里是一个 MCP 服务器 |

有副作用的技能（部署、发消息、改线上数据），把 `allow_implicit_invocation` 设为 `false`，只在你点名时才运行。

## 常见问题

**Q：`~/.codex/skills` 还能用吗？**
官方文档现在写的用户级目录是 `$HOME/.agents/skills`，表格里没有 `~/.codex/skills`。新建技能按文档里的路径放。

**Q：Claude Code 的技能能直接用吗？**
两边都基于同一份开放规范，`SKILL.md` 的基本格式通用，把技能文件夹复制到 `.agents/skills` 即可。但 Claude Code 专有的 frontmatter 字段（如 `context: fork`）在 Codex 里没有对应的作用，依赖这些字段的技能需要调整。

**Q：技能不触发怎么办？**
先用 `$` 显式调用，确认技能本身正常；再回头改 `description`。思路见[《Skill 不触发怎么办》](/guides/skill-not-triggering-description-optimize)。

**Q：Codex 的技能和 MCP 是什么关系？**
MCP 负责把 Codex 连到外部服务，技能负责说明怎么做事；技能可以在 `agents/openai.yaml` 里声明自己依赖哪个 MCP 服务器。MCP 的配置见[《Codex 怎么配置 MCP》](/guides/codex-mcp-config)。

## 参考资料

- Build skills（OpenAI 官方文档）：https://learn.chatgpt.com/docs/build-skills
- Specification（Agent Skills 官方规范）：https://agentskills.io/specification
