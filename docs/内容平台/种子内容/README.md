# 种子内容：格式与规则

> 2026-10-06 起草。这里的每个文件都是**草稿**：由 `scripts/import-seed-content.ts` 导入为「待审」状态，
> 站长补上效果图 / 实测截图、核对完「待核对」清单后，在后台审核通过才会公开。

## 一、来源规则（硬约束）

1. **GitHub 提示词仓库**：只用许可证明确允许转载与改编的（CC BY 4.0、CC BY-SA 4.0、CC0、MIT、Apache-2.0）。
   每条必须写清：仓库、条目原链接、原作者（仓库里写了的话）、许可证名称与链接。许可证不明或「保留所有权利」的仓库**一条都不用**。
   CC BY-SA 的改编作品要同样以 CC BY-SA 发布，在 `license` 里写明。
2. **论坛、博客、知乎、小红书、Reddit、X 等**：**不得复制或逐段改写正文**。只能提炼可以独立核实的事实（功能、限制、步骤），
   用自己的话重新组织，并在 `sources` 里列出参考链接。能在官方文档找到的事实，以官方文档为准。
3. **效果图**：一律不复用别人的出图（原仓库的图也不用）。每条提示词写明「需要站长生成什么样的图」（`imageBrief`）。
4. **事实准确性**：价格、额度、次数、功能入口这类会变的信息，必须附官方来源；查不到官方来源的写进 `verify` 清单，不要写成定论。
   今天是 2026-10-06。Sora 独立 App 已于 2026-04-26 关停、API 于 2026-09-24 关停；gpt-image-2 于 2026-04-21 发布。
5. **不写**：越狱 / 破限 / 擦边；接码、账号买卖、绕过 KYC；冒充官方；对真实人物（名人）换脸；带联系方式的内容。
   涉及吉卜力等知名 IP 风格的，注明「仅供学习交流，商用请注意版权」。
6. **本站业务事实**（写到购买时必须一致）：本站卖 ChatGPT Plus / Pro、Claude Pro / Max 等会员充值；
   收银台只支持支付宝；下单需登录。内容里涉及开通会员，只用一句话指向 `/chongzhi/chatgpt-plus` 或 `/chongzhi/claude-pro`，不写价格、不做功效承诺。
7. **标题用实测有人搜的问法**（见 `../关键词实测-原始数据.md`），不用口语或营销词。

## 二、文件格式

所有文件 UTF-8、Markdown，开头是 YAML frontmatter。

### hubs/{slug}.md —— 专题介绍（对应后台「策展标签」的 intro）

```yaml
---
slug: gpt-image-2            # 必须是已有标签 slug（见 src/lib/content/tags.ts）
name: GPT-Image-2
kind: MODEL                  # MODEL | TOPIC | PRODUCT
updated: 2026-10-06
sources:
  - https://...              # 官方优先
verify:                      # 站长上线前要亲自核对的点
  - Free 账号每天能生成几张（官方未公开具体数字）
---
（正文：模型 / 产品 hub 400–800 字；主题 hub 200–400 字。结构：是什么 → 能做什么 → 怎么用 → 免费与付费的区别 → 本页收录的提示词怎么用。可以有一张小表格。）
```

### prompts/{NN}-{slug}.md —— 提示词

```yaml
---
title: 复古港风证件照（换背景色）     # 用户会搜的问法 + 具体效果
slug: retro-id-photo                 # 小写 ASCII
model: gpt-image-2                   # 一个模型标签 slug
topics: [id-photo, portrait]         # 0–3 个主题标签 slug
modelLabel: Thinking 模式            # 选填
aspectRatio: "3:4"                   # 选填
needsRefImage: true
useCase: 一两句话写清楚适合做什么
prompt: |
  （中文提示词全文；可替换的部分用 [方括号]，方括号里 1–20 字）
negativePrompt: null
source:                              # 原创写 null
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://github.com/...#...    # 条目原链接
  author: "@xxx"                     # 原作者，仓库里没写就写 null
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并把人物、背景改为变量；补充了光线要求   # 改了什么（CC BY 要求说明修改）
imageBrief: 用一张正脸生活照生成；至少 2 张：白底与浅蓝底各一张
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率
---
（正文 = 「心得与说明」草稿：怎么替换变量、常见失败与调整办法、适合 / 不适合的场景。150–400 字。
 有来源的，正文末尾加一行：> 改编自 [原作者 / 仓库](链接)，许可证 CC BY 4.0。）
```

### guides/{NN}-{slug}.md —— 教程

```yaml
---
title: ChatGPT 记忆已满怎么办：导出、清理与迁移
slug: chatgpt-memory-full
products: [chatgpt]                  # 1–2 个产品标签 slug
models: []                           # 0–2 个模型标签 slug
accountTier: PLUS                    # FREE | PLUS | PRO | TEAM | OTHER（写教程时假定的账号）
excerpt: 120 字以内，回答「这篇解决什么问题」
sources:
  - https://help.openai.com/...
screenshots:                         # 站长实测时要截的图
  - 设置 → 个性化 → 管理记忆 页面
verify:
  - 记忆条数上限：官方未给具体数字，需实测
---
（正文 1200–2500 字。结构：适用于谁 → 结论先说 → 步骤 → 常见问题 → 参考资料。
 步骤里需要截图的位置写「【截图：……】」占位。不确定的事实写「（待实测）」。）
```
