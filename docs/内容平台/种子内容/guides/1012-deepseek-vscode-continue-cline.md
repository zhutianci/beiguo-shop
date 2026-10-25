---
title: DeepSeek 接入 VS Code：用 Continue 或 Cline 扩展配置 DeepSeek API 的步骤
slug: deepseek-vscode-continue-cline
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: 怎么在 VS Code 里用 DeepSeek？按 Continue 和 Cline 两个扩展各自的官方文档（2026-10-24 查询），讲清安装、config.yaml 或设置界面里怎么填 DeepSeek 的 API Key 和模型名，并说明费用、隐私和权限的注意事项。
checkedOn: 2026-10-24
sources:
  - https://docs.continue.dev/ide-extensions/install
  - https://docs.continue.dev/customize/model-providers/more/deepseek
  - https://docs.continue.dev/customize/models
  - https://docs.cline.bot/getting-started/installing-cline
  - https://docs.cline.bot/provider-config/deepseek
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
verify:
  - 配置字段与步骤取自 Continue、Cline 各自官方文档（2026-10-24）。Continue 官方 DeepSeek 页面的模型字段写的是占位符 MODEL_ID，本文按 DeepSeek 官方价格页把它写成 deepseek-flash 或 deepseek-v4-pro；两个扩展对这两个新模型名的内置支持情况本文没有测试
  - Continue 配置文件 config.yaml 的存放位置、如何打开，请看 Continue 官方的配置说明，本文没有逐项核对
  - Cline 的 DeepSeek 页面没有列出模型下拉里有哪些模型，本文也不列
  - 本文没有实际安装测试，不写「实测」
---

> 本文根据 Continue、Cline 官方文档和 DeepSeek 官方价格页整理，资料核对于 2026-10-24。扩展更新很快，界面名称以实际为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek 接入 vscode」「vscode deepseek 插件」的人；
- 习惯在 VS Code 里写代码，想用 DeepSeek 做问答、改代码、生成代码的开发者；
- 不知道 Continue 和 Cline 该选哪个的人。

## 结论先说

1. **VS Code 本身不内置 DeepSeek**，需要装一个支持自定义模型的 AI 扩展。两个有官方 DeepSeek 配置页的扩展是 **Continue** 和 **Cline**。
2. **两者都是「自带 Key」模式**：你自己在 DeepSeek 开放平台创建 API Key，扩展直接调用 DeepSeek，按 token 计费，见 [/guides/deepseek-api-key](/guides/deepseek-api-key)。
3. **配置方式不同**：Continue 在配置文件里写一段 `provider: deepseek`；Cline 在设置界面的 API Provider 下拉里选 DeepSeek。
4. **模型名**：DeepSeek 官方价格页给的是 `deepseek-flash` 和 `deepseek-v4-pro`。

![Continue 和 Cline 接 DeepSeek](seed:g1012-vscode-continue-cline-compare.png)
*图：本站根据 [Continue](https://docs.continue.dev/customize/model-providers/more/deepseek) 与 [Cline](https://docs.cline.bot/provider-config/deepseek) 官方文档整理的示意图*

## 一、准备

1. 在 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 创建 API Key，并充值（API 没有余额会返回 402，见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)）；
2. 确认官方参数：OpenAI 格式的 Base URL 是 `https://api.deepseek.com`，模型名 `deepseek-flash`（支持图片输入）或 `deepseek-v4-pro`，两者上下文都是 1M，见 [/guides/deepseek-context-length-output-limit](/guides/deepseek-context-length-output-limit)；
3. 先看一眼价格，Agent 类扩展一次带的上下文很多，见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。

## 二、方式一：Continue

### 安装

Continue 官方安装步骤（VS Code）：到 Visual Studio Marketplace 的 Continue 扩展页点 Install，会在 VS Code 里打开扩展页，再点一次 Install；安装后左侧栏出现 Continue 图标，官方建议把它移到右侧边栏，体验更好。

### 配置 DeepSeek

Continue 官方 DeepSeek 页面给出的配置（YAML）：

```yaml
name: My Config
version: 0.0.1
schema: v1

models:
  - name: <模型显示名>
    provider: deepseek
    model: <模型 ID>
    apiKey: <你的 DeepSeek API Key>
```

按 DeepSeek 官方模型名来填：

```yaml
models:
  - name: DeepSeek Flash
    provider: deepseek
    model: deepseek-flash
    apiKey: <你的 DeepSeek API Key>
```

![Continue 的 config.yaml 逐项核对](seed:g1012-continue-config-check.png)
*图：本站根据 Continue 与 DeepSeek 官方文档整理的检查清单示意图*

### 模型角色

Continue 官方文档把模型分成几种「角色」：Chat（对话）、Edit（改写重构）、Apply（应用修改）、Autocomplete（实时补全）、Embedding（向量）、Reranker（重排序）。一个模型可以承担多个角色，也可以给不同角色配不同模型。官方推荐表里，补全一般用小而快的模型。DeepSeek 官方价格页还写明，FIM 补全（Beta）只在非思考模式下支持，如果你打算把 DeepSeek 用于行内补全，需要确认所用扩展调用的是哪种接口，这一点本文没有测试。

## 三、方式二：Cline

### 安装

Cline 官方安装文档：按 `Ctrl/Cmd + Shift + X` 打开扩展面板，搜索 `Cline`，点安装。官方说明这个扩展适用于 VS Code、Cursor、Windsurf、VSCodium 和 Antigravity，JetBrains 有单独的安装方式。

### 配置 DeepSeek

Cline 官方 DeepSeek 页面的步骤：

1. 点 Cline 面板里的齿轮图标，打开设置；
2. 在「API Provider」里选「DeepSeek」；
3. 把 Key 粘贴到「DeepSeek API Key」字段；
4. 在「Model」下拉里选模型。

官方提醒：在 DeepSeek 平台创建 Key 后要**马上复制保存**，之后看不到完整内容。

Cline 的「Plan / Act」等工作方式见 [/guides/cline-setup-api-plan-act](/guides/cline-setup-api-plan-act)。如果下拉里没有你要的模型名，可以改用「OpenAI Compatible」提供商，需要填 Base URL（`https://api.deepseek.com`）、API Key 和模型 ID；这是把两份官方文档对起来的做法，未实测。

## 四、Continue 和 Cline 怎么选

官方文档里没有对两者做优劣评价，下面只按它们各自的定位说：

| | Continue | Cline |
| --- | --- | --- |
| 配置 | 在配置文件里写模型，可以给不同角色配不同模型 | 在设置界面里选，上手快 |
| 官方文档强调 | Chat、Edit、Apply、Autocomplete 等多种角色 | Plan / Act、让 Agent 读写文件和运行命令 |
| 适合 | 想精细控制每个功能用哪个模型的人 | 想让 AI 直接帮忙改多个文件的人 |

拿不准就先装 Cline 用它的设置界面，几分钟能跑通；需要补全或精细分工再看 Continue。

## 五、使用时的注意

- **费用**：你的 Key，你付费。长上下文、Agent 多轮调用会消耗不少 token；
- **隐私**：代码会发送到 DeepSeek 服务，涉密代码先看官方隐私政策；
- **权限**：Agent 扩展可以读写文件、执行命令，先在测试项目里试，见 [/guides/ai-coding-security-secrets-permissions](/guides/ai-coding-security-secrets-permissions)；
- **Key 安全**：配置文件里有 Key 时，不要提交到公开仓库；
- **报错**：401 是 Key 错，402 是余额不足，429 是并发过高，见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

## 常见问题

**Q：GitHub Copilot 里能用 DeepSeek 吗？**
本文只写了 Continue 和 Cline 两个有官方 DeepSeek 页面的扩展。Copilot 的设置见 [/guides/github-copilot-vscode-setup](/guides/github-copilot-vscode-setup)，本文不涉及。

**Q：Cursor 里呢？**
见 [/guides/deepseek-cursor-setup](/guides/deepseek-cursor-setup)。

**Q：想让 DeepSeek 在终端里当编程助手？**
见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup) 和 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)；写代码的整体思路见 [/guides/deepseek-write-code-how-to](/guides/deepseek-write-code-how-to)。

**Q：想改用 Claude 或 ChatGPT 的官方模型？**
需要 Claude 套餐可看 [/chongzhi/claude-pro](/chongzhi/claude-pro)；Claude Code 的 VS Code 用法见 [/guides/claude-code-vscode](/guides/claude-code-vscode)。

## 参考资料

- Continue 文档：Install — https://docs.continue.dev/ide-extensions/install
- Continue 文档：DeepSeek — https://docs.continue.dev/customize/model-providers/more/deepseek
- Continue 文档：Models — https://docs.continue.dev/customize/models
- Cline 文档：Installing Cline — https://docs.cline.bot/getting-started/installing-cline
- Cline 文档：DeepSeek — https://docs.cline.bot/provider-config/deepseek
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
