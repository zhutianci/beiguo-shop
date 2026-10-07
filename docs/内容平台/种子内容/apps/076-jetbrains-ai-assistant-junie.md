---
title: "JetBrains AI Assistant 怎么用：免费额度、价格、地区限制与 Junie"
slug: jetbrains-ai-assistant-junie
name: JetBrains AI（AI Assistant / Junie）
url: https://www.jetbrains.com/ai/
pricing: 免费（AI Free）+付费（AI Pro / AI Ultimate）
platforms: JetBrains IDE 插件 / 命令行（Junie CLI）/ GitHub Action / GitLab CI
trialNote: AI Free 每 30 天 3 个 AI Credits，含不限量代码补全和不限量本地模型
products: [ai-tools]
models: []
topics: [coding]
excerpt: "JetBrains AI 是 IntelliJ IDEA、PyCharm 等 IDE 内置的 AI 能力，包括 AI Assistant 对话与补全、编程智能体 Junie，按 AI Credits 计费。"
checkedOn: 2026-10-07
sources:
  - https://www.jetbrains.com/ai/
  - https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html
  - https://lp.jetbrains.com/ai-ides-faq/
  - https://junie.jetbrains.com/
  - https://blog.jetbrains.com/ai/2025/08/a-simpler-more-transparent-model-for-ai-quotas/
---

> 本文根据 JetBrains 官网、AI Assistant 官方帮助文档、官方 FAQ、Junie 官网与 JetBrains 官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

JetBrains AI 是 **JetBrains**（IntelliJ IDEA、PyCharm、WebStorm 等 IDE 的开发商）为自家 IDE 提供的一整套 AI 能力，主要包括两部分：

- **AI Assistant**：IDE 里的 AI 对话、代码补全、解释与重构助手；
- **Junie**：JetBrains 的编程智能体，可以自己规划并完成多步骤任务，除了 IDE 内使用，也有命令行版本、GitHub Action 和 GitLab CI/CD 集成。

代码补全由 JetBrains 自研的 **Mellum** 模型驱动；对话和智能体可以选用 Claude、Gemini、GPT 等第三方模型，也能连接本地模型。JetBrains 近期还推出了 **JetBrains Air**，用来在 IDE、网页、命令行等多个入口统一管理 Junie、Claude Agent、Codex 等智能体。

## 能做什么

- **代码补全**：基于 Mellum 的行内补全，AI Free 档也不限量。
- **AI 对话**：在 IDE 侧边栏针对当前文件、选中代码或整个项目提问，结果能直接插入编辑器。
- **解释、重构、写测试**：右键选中代码即可让它解释逻辑、改写结构、生成单元测试和文档注释。
- **提交信息与代码审查**：根据改动自动写 commit message，辅助检查变更。
- **Junie 智能体**：给它一个任务（如「给这个模块加缓存层」），它会先出计划，再改多个文件、跑测试，过程中可以随时插话纠偏。
- **本地模型**：通过 Ollama、LM Studio 或其他 OpenAI 兼容服务接入本地模型，AI Free 档也不限量使用。

## 怎么上手

1. 确保使用较新版本的 JetBrains IDE（官方说明 AI Free 需要 2025.1 及以上版本，不支持 Android Studio 和 PyCharm / IntelliJ IDEA 社区版）。
2. 打开 IDE 右侧的 AI 面板（或在插件市场安装 AI Assistant），用 JetBrains 账号登录并激活 AI Free 或试用。
3. 选中一段代码，右键选择「解释代码」或「生成测试」，熟悉基本操作。
4. 在 AI 面板里切换到 Junie，描述一个小任务，看它给出的计划，确认后执行并审阅改动。
5. 想在终端或 CI 里用，按 Junie 官网说明安装 Junie CLI 或配置 GitHub Action。

可以这样开始：「解释一下这个 Service 类的事务处理逻辑，并指出可能的并发问题。」

## 免费与付费

JetBrains AI 以 **AI Credits** 计量，官方说明 1 个 Credit 约等于 1 美元的模型用量。官方帮助文档列出的档位（官网定价页，2026-10 查询）：

| 档位 | 价格 | 每 30 天额度 |
|---|---|---|
| AI Free | 免费 | 3 Credits（不可加购） |
| AI Pro | 付费（以官网为准） | 10 Credits 起 |
| AI Ultimate | 付费（以官网为准） | 35 Credits 起 |
| AI Enterprise | 面向组织，价格以官网为准 | 不低于 AI Ultimate |

不同订阅类型（个人 / 组织、月付 / 年付）价格不同，以官网为准。**AI Pro 已包含在 All Products Pack 和 dotUltimate 订阅中**，不另收费。付费档可加购 Credits，有效期 12 个月。Junie 官网还推出了始终免费的「Junie Lite」。

## 适合谁 / 不适合谁

适合：
- 已经在用 IntelliJ IDEA、PyCharm、GoLand 等 IDE 的开发者，不想换编辑器。
- 有 All Products Pack 订阅的用户，AI Pro 已包含在内。
- 想在 IDE 里接本地模型、代码不出本机的开发者。

不适合：
- 主力用 VS Code 的人，这套能力主要围绕 JetBrains IDE。
- 用 Android Studio 或社区版 IDE 的用户，AI Free 不可用。
- 中国大陆用户想用免费档或顶配档：见下方地区说明。

## 注意事项

- **地区限制**：官方帮助文档写明，AI Free 和 AI Ultimate 目前在中国大陆不可用，加购 Credits 也暂不支持在中国大陆使用；可用地区以官方支持列表为准。
- **数据使用**：官方 FAQ 表示，只有在你主动选择分享数据时，JetBrains 才会用这些数据改进工具和训练自家模型（如 Mellum），且不会分享给第三方。
- **额度消耗**：Junie 这类智能体任务比普通对话消耗更多 Credits，长任务前留意余额。
- **审阅改动**：智能体修改多个文件后，务必用 IDE 的 Diff 和测试逐一核对。
