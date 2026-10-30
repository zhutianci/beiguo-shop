---
title: Codex 怎么设置中文：官方没有界面语言选项，让它用中文回复的三种办法
slug: codex-set-chinese-language
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 能设置成中文吗？官方的设置页和配置参考里都没有语言选项，界面语言没法改。要让它用中文回答，可以在提示里直接说，也可以写进全局或项目的 AGENTS.md。本文讲三种做法和回复仍是英文时的排查。
checkedOn: 2026-10-30
sources:
  - https://learn.chatgpt.com/docs/reference/settings
  - https://learn.chatgpt.com/docs/config-file/config-reference
  - https://learn.chatgpt.com/docs/personalize
  - https://learn.chatgpt.com/docs/agent-configuration/agents-md
verify:
  - 官方设置参考列了 General、Profile、Appearance、Personalization 等分区，没有语言或地区设置；配置参考也没有语言、locale 相关的键。本文据此写「界面语言官方没有提供设置项」，之后版本可能新增
  - 官方个性化页写明自定义指令在 Codex 里存放在全局 AGENTS.md，但没有确认能否用它指定回复语言；用 AGENTS.md 让它说中文是常见做法，官方文档没有专门保证
  - 官方文档站本身有没有中文版，本文核对时没有发现，以官方站点为准
---

> 本文根据 Codex 官方文档（设置参考、配置参考、个性化、AGENTS.md）整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。要点：**官方没有给 Codex 提供界面语言选项**；能做的是让它「用中文回复」。

## 适用于谁

- 打开 Codex 桌面 App 或命令行，发现界面是英文，想找「语言」设置的人；
- 用中文提问，但回答经常变成英文的人；
- 想一次设好、以后每个项目都用中文回复的人。

## 结论先说

1. **界面语言：官方没有设置项。** 官方设置参考里的分区是 General、Profile、Keyboard shortcuts、Notifications、Appearance、Pets、Browser、Computer Use、Personalization 等，没有语言或地区；配置参考里也没有语言相关的键。Appearance 里只有主题、字体、字号这类外观选项。
2. **回复语言：靠指令控制。** 在提示里直接写「请用简体中文回复」，最简单，但只管当前对话。
3. **想长期生效：写进 `AGENTS.md`。** 官方个性化页说，Codex 里的自定义指令存放在全局 `AGENTS.md`；项目里也可以放自己的 `AGENTS.md`。
4. 官方没有专门说明能否用它指定回复语言，所以写好以后要**开新对话验证一次**。

![让 Codex 说中文的三种做法](seed:g1356-ways-compare.png)
*图：本站根据 [Codex 官方文档：个性化](https://learn.chatgpt.com/docs/personalize) 与 [设置参考](https://learn.chatgpt.com/docs/reference/settings) 整理的示意图*

## 一、直接在提示里说

最稳的办法是把要求写进第一条消息，比如：

```text
请始终用简体中文回复，代码和命令保持原样，注释也用中文。
```

好处是立刻生效、不用改任何文件。缺点是新开对话要重新说。注意：**代码、命令、文件名、报错原文本来就应该保留英文**，不要让它翻译这些，否则命令会跑不起来。

## 二、写进全局 AGENTS.md

官方个性化页：想让 ChatGPT 在所有对话里遵守的偏好（例如回复风格），可以用自定义指令；在 Codex 里，它们存放在**全局 `AGENTS.md`** 文件。具体位置在 Codex 主目录，默认是 `~/.codex`，Windows 上就是用户目录下的 `.codex` 文件夹。读取顺序、32 KiB 上限、没生效怎么排查，见 [/guides/codex-agents-md-how-it-reads](/guides/codex-agents-md-how-it-reads)。

在全局 `AGENTS.md` 里加这样几行：

```text
# 语言偏好
- 默认用简体中文回复，包括解释、总结和代码注释。
- 命令、代码、文件名、报错信息保持英文原文。
- 术语第一次出现时可以在括号里附英文。
```

保存后**开一个新对话**，Codex 才会重新读取。

## 三、只管某一个项目

项目文件夹里可以放自己的 `AGENTS.md`，写上同样的语言要求，这样只有这个项目里的对话用中文，别的项目不受影响。官方说明项目和仓库可以添加各自的指令，全局和项目的指令会一起生效，后面的覆盖前面的；多人协作的仓库里，建议和同事商量好再提交这条规则。

## 四、设置里的「个性化」管不管语言

官方设置参考里有 Personalization 分区，列出的具体项是「Enable Codex memories」（启用记忆）。官方个性化页写的 Base style and tone（基础风格与语气）在网页版的 Settings 里，它改变的是风格和语气，**不是能力**，页面也没有说它能不能设语言。所以别指望在设置里找到一个中文开关。

![Codex 还是回英文时怎么办](seed:g1356-english-decide.png)
*图：本站根据 [Codex 官方文档](https://learn.chatgpt.com/docs/personalize) 整理的示意图*

## 五、已经写了中文要求，还是回英文

按顺序检查：

1. **是不是新对话。** AGENTS.md 是在启动时读的，改完要新开对话；
2. **文件位置对不对。** 全局的在 `~/.codex/AGENTS.md`，项目的在项目根目录；
3. **内容是不是太长。** 官方说合并后的 AGENTS.md 有大小上限，写得越短越好；
4. **当次提示是不是全英文。** 提示里夹了大段英文资料时，可以在末尾再加一句「请用中文回复」；
5. **某些输出必须是英文。** 比如提交信息、代码标识符，按项目习惯保留即可。

## 常见问题

**Q：Codex 官方文档有中文版吗？**
本文核对时没有发现，以官方站点为准。官方入口见 [/guides/codex-official-website-download-entry](/guides/codex-official-website-download-entry)。

**Q：ChatGPT 本身怎么设中文？**
ChatGPT 网页版的语言设置另有一套，见 [/guides/chatgpt-language-settings](/guides/chatgpt-language-settings)。Claude Code 的做法见 [/guides/claude-code-chinese-language-setting](/guides/claude-code-chinese-language-setting)。

**Q：额度不够用怎么办？**
中文回复本身不是额度问题，额度规则见 [/guides/codex-usage-limits](/guides/codex-usage-limits)，需要升级可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Codex 官方文档：设置参考 — https://learn.chatgpt.com/docs/reference/settings
- Codex 官方文档：配置参考 — https://learn.chatgpt.com/docs/config-file/config-reference
- Codex 官方文档：个性化 — https://learn.chatgpt.com/docs/personalize
- Codex 官方文档：AGENTS.md — https://learn.chatgpt.com/docs/agent-configuration/agents-md
