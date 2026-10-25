---
title: Claude Code 中文怎么设置、怎么用中文交流：language 设置和 CLAUDE.md
slug: claude-code-chinese-language-setting
products: [claude]
models: []
accountTier: PRO
excerpt: Claude Code 怎么让它用中文回答？按官方文档讲清 settings.json 里的 language 设置怎么写、放在哪个文件、怎么确认生效，以及想规定得更细时怎么用 CLAUDE.md；并说明官方文档没有写到的地方。
checkedOn: 2026-10-24
sources:
  - https://code.claude.com/docs/en/settings
  - https://code.claude.com/docs/en/settings-reference
  - https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
verify:
  - language 设置的说明取自 2026-10-24 官方 settings-reference：「让 Claude 默认用英文以外的语言回答」，类型为字符串，任意语言名都可以，Claude Code 不做校验，未设置时会话标题与对话语言一致
  - 官方文档只讲了回答语言；Claude Code 终端界面本身是否有中文界面、命令输出是否会翻译，官方文档没有写，本文不作结论
  - 示例里的 "chinese" 是按官方「任意语言名」的说法给出的写法，官方示例用的是 japanese；效果以你实际使用为准
---

> 本文根据 Claude Code 官方文档《Settings files and precedence》《Settings reference》和 Claude 帮助中心整理，资料核对于 2026-10-24。图为本站整理的示意图。设置项随版本变化，**以官方文档为准**。

## 适用于谁

- 用 Claude Code，希望它默认用中文回答、解释代码、写总结的人；
- 搜「claude code 中文」「claude code 怎么用中文」的人；
- 想知道 `settings.json` 里有没有语言选项的人。

网页版 Claude 的界面语言和回答语言怎么设，见 [/guides/claude-set-chinese-language](/guides/claude-set-chinese-language)，那是另一套设置，和 Claude Code 无关。

## 结论先说

1. **官方有专门的设置项**：`settings.json` 里的 **`language`**。官方说明它的作用是让 Claude **默认用英文以外的某种语言回答**。
2. **值怎么写**：字符串，写语言名即可，官方例子是 `"japanese"`、`"spanish"`、`"french"`；官方强调 Claude Code **不会校验**这个值，写错了会原样传给 Claude。中文可以按同样方式写成 `"chinese"`。
3. **可以放在任何设置文件里**：用户、项目、本地或组织管理的设置文件都行。想所有项目都生效，就放用户级的 `~/.claude/settings.json`。
4. **不设置时**：官方写的默认值是「未设置」，此时会话标题的语言与你对话的语言一致。
5. **想规定得更细**（比如代码注释、提交信息、文档都用中文）：官方说长期指示用 `CLAUDE.md` 文件写，见 [/guides/claude-md-agents-md](/guides/claude-md-agents-md)。
6. 需要更高用量跑 Claude Code 的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![让 Claude Code 默认用中文回答](seed:g1064-claude-code-language-setting.png)
*图：本站根据 [Claude Code 官方文档：Settings reference](https://code.claude.com/docs/en/settings-reference) 整理的示意图*

## 一、设置步骤

按官方《Settings files and precedence》：

1. 打开设置文件。用户级的是 `~/.claude/settings.json`，Windows 上 `~` 指 `%USERPROFILE%`，也就是用户目录下的 `.claude` 文件夹。官方说安装 Claude Code 不会自动创建设置文件，没有的话自己新建；
2. 加上 `language` 一项，例如：

```json
{
  "language": "chinese"
}
```

3. 保存。官方说 Claude Code 会监视设置文件，多数修改**不需要重启**就会应用到正在运行的会话；
4. 在会话里运行 `/status`，**Setting sources** 一行会列出这次加载的设置文件，用来确认你的文件被读到了。

注意两点：设置文件是**严格的 JSON**，`//` 注释或最后一项后面多一个逗号都是语法错误，Claude Code 下次启动会提示 Settings Error；如果文件里已经有别的设置，把 `"language"` 加进现有的大括号里，不要新写第二对大括号。设置文件的完整位置和优先级见 [/guides/claude-code-settings-json](/guides/claude-code-settings-json)。

## 二、放在哪个文件，影响谁

官方把设置分成几个范围：

| 范围 | 文件 | 影响谁 |
| --- | --- | --- |
| 用户 | `~/.claude/settings.json` | 你在这台电脑上的所有项目 |
| 共享项目 | `.claude/settings.json` | 在这个文件夹里工作的所有人，提交到 git 后队友也会拿到 |
| 项目本地 | `.claude/settings.local.json` | 只有你，只在这个项目 |

同一个键在多处出现时，官方的优先级是：组织管理的设置最高，其次命令行 `--settings`，再次项目本地、共享项目，最后是用户设置。所以如果你个人想要中文，团队项目里却设了别的语言，把你的 `language` 放到项目本地文件里即可，不会影响队友。

## 三、想规定得更细：用 CLAUDE.md

![想让 Claude Code 说中文，选哪种办法](seed:g1064-chinese-method-decide.png)
*图：本站根据 [Claude Code 官方文档：Settings](https://code.claude.com/docs/en/settings) 整理的示意图*

`language` 管的是「默认用什么语言回答」。如果你还想规定别的，比如：

- 代码注释用中文；
- Git 提交信息用中文；
- 生成的文档用中文，术语保留英文；

官方的说法是：要给 Claude 长期的指示，用 `CLAUDE.md` 文件，或者启动时加 `--append-system-prompt`。Claude Code 的系统提示本身官方没有公开。`CLAUDE.md` 的写法见 [/guides/claude-md-agents-md](/guides/claude-md-agents-md)，例如在项目根目录的 `CLAUDE.md` 里写上「请用中文回答，代码注释使用中文」这类一两句话的要求。

## 四、官方没有写的

- **终端界面**：官方 language 设置只说回答语言，Claude Code 命令行界面的菜单、提示是否有中文版，文档里没有写，本文不作结论；
- **效果**：设置之后 Claude 会不会每次都严格用中文，官方没有承诺，需要时可以在 `CLAUDE.md` 里再强调一次；
- **其他入口**：VS Code、JetBrains 和桌面版的 Claude Code 和终端读取同一批设置文件（官方 Settings 页说明这些入口都读取相同的设置文件），所以这项设置对它们同样适用，见 [/guides/claude-code-vscode](/guides/claude-code-vscode) 和 [/guides/claude-code-desktop](/guides/claude-code-desktop)；云端会话（claude.ai/code）只读取一部分设置，用户级文件不会被读取，见 [/guides/claude-code-web](/guides/claude-code-web)。

## 常见问题

**Q：值写 `chinese` 还是 `中文`？**
官方只说任意语言名都可以，不做校验，示例用的是英文名。建议用英文名，并在会话里确认效果。

**Q：改了没生效怎么办？**
先运行 `/status` 看设置文件有没有被加载；再检查 JSON 有没有语法错误；最后看是不是被更高优先级的设置（比如组织管理的设置）覆盖了。

**Q：能只对一次会话生效吗？**
官方说可以用 `claude --settings '{"language": "chinese"}'` 这样的方式让设置只在这一次会话里生效，不写入任何文件。

**Q：Claude Code 刚入门怎么学？**
见 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)。

## 参考资料

- Claude Code 官方文档：Settings files and precedence — https://code.claude.com/docs/en/settings
- Claude Code 官方文档：Settings reference（language）— https://code.claude.com/docs/en/settings-reference
- Claude 帮助中心：How to use Claude in your preferred language — https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
