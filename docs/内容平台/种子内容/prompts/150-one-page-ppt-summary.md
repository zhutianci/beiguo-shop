---
title: AI做PPT提示词：一句话生成一页信息密集的中文汇报幻灯片（gpt-image-2）
slug: one-page-ppt-summary
model: gpt-image-2
topics: [ppt, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: 把一个主题直接生成一页"总览型"汇报 PPT 图片，包含流程、要点、工具和结论，适合周报、行业速览、课程大纲预览。
prompt: |
  生成一张横版 16:9 的 PPT 页面图片，用一页幻灯片总结"[2026 年 AI 视频创作的工作流全景]"，全部使用[简体中文]。
  版式：顶部是大标题和一行副标题；中间是一条从左到右的[5] 步流程（每步一个色块标题 + 3 条要点 + 一张小示意图）；下方左侧是"[常用工具]"列表，中间是"[关键要点]"图标卡片，右侧是"[结论]"总结框。
  风格：干净的企业汇报风，白色背景，[蓝色]为主色，配少量辅助色区分模块；图标简洁统一；信息密度高但层级清楚，字号有明显的主次。
  要求：文字清晰可读，不要乱码；所有模块对齐，留出合理边距。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/ailovedirector/status/2046905387274891296
  author: "@ailovedirector"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 日文原帖仅为一句话需求，本站按原意扩写为结构化的中文 PPT 版式提示词；主题、语言、步骤数、模块名和主色改为变量
images:
  - 150-one-page-ppt-summary-1.jpg
imageCredit:
  by: "@ailovedirector"
  url: https://x.com/ailovedirector/status/2046905387274891296
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 中文文字的错字率（这类高密度页面最容易出错）
  - 流程步骤数量是否与要求一致
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[主题] 写得越具体越好；[5] 步建议 3–6 步；三个底部模块名可以按需要换成"风险""下一步计划""数据亮点"。如果你已经有内容，直接把要点贴在提示词后面："请使用以下内容：……"，模型会照着排版。

**常见问题**：
- 文字太多出现错字：高密度页面是 AI 出图的难点，生成后**逐字检查**；错得多就减少要点数量，或只生成"无文字版版式"再自己填字。
- 内容是 AI 编的：没给内容时，模型会自己写要点，事实可能不准，正式汇报前务必核对。
- 需要可编辑的 PPT：这里生成的是图片；要可编辑文件，可以让 ChatGPT 按同样结构生成 PPT 大纲，再在 PowerPoint 里排版。

**示例图说明**：示例是原作者用日文生成的"AI 游戏开发概览"页面。

### 原版提示词（日文）

原帖是一句口语化的日文请求（大意：在这里生成一张横版 PPT 图片，用一页总结当前 AI 游戏开发的概况，用日语），本站据此扩写为结构化提示词。

```text
横長のパワポ画像ここで生成してみて　どのモデル使ってるか判定するから、今のAIゲーム開発の概要をまとめた1枚パワポで　日本語で

ゲーム開発の技術に関して、工数ベースでどこにパワーかかるかの分析資料といかに量産が大事かについての説明とかのパワポ画も作って
```

> 改编自 [@ailovedirector](https://x.com/ailovedirector/status/2046905387274891296) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。
