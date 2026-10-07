---
title: "CodeBuddy 腾讯云代码助手官网与下载：插件、IDE、CLI 怎么用"
slug: codebuddy-tencent-ai-coding
name: CodeBuddy（腾讯云代码助手）
url: https://www.codebuddy.cn/
pricing: 免费体验版+付费（标准版起）
platforms: VS Code 插件 / JetBrains 插件 / 微信开发者工具插件 / Windows / macOS / 命令行
trialNote: 体验版免费，每月 500 基础积分
products: [ai-tools]
models: []
topics: [coding]
excerpt: "CodeBuddy 是腾讯云的 AI 编程助手，有编辑器插件、CodeBuddy IDE 和命令行 CodeBuddy Code 三种形态，支持混元、DeepSeek 等模型，积分与 WorkBuddy 共享。"
checkedOn: 2026-10-07
sources:
  - https://www.codebuddy.cn/
  - https://cloud.tencent.com/document/product/1749/104236
  - https://www.codebuddy.cn/docs/ide/Introduction
  - https://www.codebuddy.cn/docs/workbuddy/Pricing
  - https://cloud.tencent.com/announce/detail/2270
---

> 本文根据 CodeBuddy 官网、腾讯云官方产品文档、官方定价文档与腾讯云公告整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

CodeBuddy 中文名「**腾讯云代码助手**」，是 **腾讯云** 推出的 AI 辅助编程工具。官方文档把它分成三种形态：

- **CodeBuddy 插件**：装进 VS Code、JetBrains 系列等编辑器，开发者主导、AI 辅助；
- **CodeBuddy IDE**：独立的 AI 编辑器，主打「对话即编程」，把需求规划、设计稿转代码、开发和部署串成一条线；
- **CodeBuddy Code**：面向专业工程师的命令行智能体，在终端用自然语言驱动开发。

模型方面，官方文档说明它基于腾讯自研的混元大模型，同时支持 DeepSeek 等第三方模型。它与腾讯的办公智能体 WorkBuddy 同属「Buddy AI」系列，同一账号的积分可以共用。

## 能做什么

- **代码补全与生成**：在编辑器里实时补全，也能按注释生成函数。
- **代码库问答**：用 `@workspace`、`#Codebase` 等方式让它基于整个仓库回答问题、定位代码。
- **单元测试与代码评审**：为选中代码生成测试，辅助检查提交前的改动。
- **设计稿转代码**：CodeBuddy IDE 支持 Figma 设计稿转前后端代码，并内置 Plan 模式先出方案。
- **一键部署**：IDE 可部署到沙箱环境，并对接腾讯云 CloudBase、EdgeOne Pages 等。
- **知识库与自定义指令**：上传团队文档建 RAG 知识库，设定专属规则。
- **覆盖面广的插件**：官方安装文档列出的编辑器包括 VS Code、IntelliJ IDEA、PyCharm、GoLand、Android Studio、Xcode、Visual Studio，以及微信开发者工具。

## 怎么上手

1. 选形态：在 VS Code 或 JetBrains 插件市场搜索「腾讯云代码助手」或「CodeBuddy」安装插件；想用独立编辑器，就到官网 codebuddy.cn 下载 CodeBuddy IDE（Windows / macOS）。
2. 习惯终端的开发者可执行 `npm install -g @tencent-ai/codebuddy-code` 安装 CodeBuddy Code。
3. 按提示登录账号，在设置里选择要用的模型。
4. 打开项目，先用补全和问答熟悉，例如问「这个项目的接口路由定义在哪」。
5. 需要做新页面时，在 IDE 里贴入设计稿或描述需求，先让它出 Plan，确认后再生成代码。

可以这样开始：「根据这个 Figma 设计稿生成一个响应式的商品列表页，用 Vue 3，先给出组件拆分方案。」

## 免费与付费

腾讯云官方定价文档显示，个人版自 2026 年 7 月 1 日起分为四档（官网定价页，2026-10 查询）：

| 版本 | 月付 | 每月实得积分（含赠送） |
|---|---|---|
| 体验版 | 免费 | 500 |
| 标准版 | 99 元/月（连续包月 70 元） | 4,000 |
| 高级版 | 199 元/月（连续包月 140 元） | 9,000 |
| 旗舰版 | 999 元/月（连续包月 700 元） | 50,000 |

年付另有折扣。企业版（SaaS 企业版、私有云企业版）按席位收费，2026 年 5 月腾讯云公告调整过企业版价格，具体以官网和商务报价为准。积分在 CodeBuddy 和 WorkBuddy 之间共享。

## 适合谁 / 不适合谁

适合：
- 做微信小程序、在腾讯云上部署应用的开发者，生态衔接顺手。
- 前端和全栈开发者，想用设计稿转代码、一键部署快速出原型。
- 需要私有化部署、内网使用的企业团队。

不适合：
- 只需要偶尔补全的轻度用户，体验版积分有限。
- 不在腾讯云生态、对部署集成没有需求的人，IDE 的部分特色功能用不上。

## 注意事项

- **积分消耗**：不同模型、智能体任务消耗的积分不同，长任务前先看余额；积分与 WorkBuddy 共用，两边都用时消耗更快。
- **国内版与国际版**：codebuddy.cn 是国内版，另有国际站 codebuddy.ai，账号和计费可能不同，下载前确认入口。
- **代码数据**：公司代码上传前先确认团队数据政策，对数据有严格要求的可了解私有云企业版。
- **人工审阅**：生成和部署的代码都要自己检查、测试，尤其是涉及数据库和权限的改动。
