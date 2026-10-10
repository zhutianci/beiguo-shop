---
title: "huggingface-gradio 是什么、怎么安装使用：让智能体用 Gradio 搭 AI 演示界面的官方 Skill"
slug: huggingface-gradio-skill
name: huggingface-gradio（huggingface/skills）
url: https://github.com/huggingface/skills/tree/main/skills/huggingface-gradio
pricing: "开源免费（Apache-2.0）；云端任务按 Hugging Face 计费"
platforms: "Claude Code / Codex / Gemini CLI / Cursor"
trialNote: "hf skills add huggingface-gradio"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "huggingface-gradio 是 Hugging Face 官方的 Gradio Skill：创建或修改 Gradio 应用、组件、事件监听、布局和聊天机器人时使用，内含核心 API、常用组件签名和模式示例，帮智能体写出符合当前版本的代码。"
checkedOn: 2026-10-11
sources:
  - https://github.com/huggingface/skills/tree/main/skills/huggingface-gradio
  - https://github.com/huggingface/skills
  - https://huggingface.co/docs/hub/agents-cli
  - https://www.gradio.app/guides/quickstart
---

> 本文根据 huggingface/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 huggingface/skills 在 GitHub 约 1.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Gradio 是 Python 里最常用的 AI 演示界面库：几行代码就能给模型套上一个可以在浏览器里操作的页面，Hugging Face Spaces 上的大量演示都是用它做的。它的大版本之间 API 变化不小，模型很容易把旧版本的参数和新版本的写法混在一起。huggingface-gradio 是一份对着当前版本写的参考。`description`：用 Python 构建 Gradio 网页界面和演示；在创建或编辑 Gradio 应用、组件、事件监听器、布局或聊天机器人时使用。

SKILL.md 的结构像一份浓缩的官方文档：

- **指南链接**：快速上手、Interface 类、Blocks 与事件监听、布局控制等官方指南的地址，相关时去读；
- **核心模式**：几种最常见的应用骨架；
- **关键组件签名**：Textbox、Number、Slider、Checkbox、Dropdown、Radio、Image、Audio、Video、File、Chatbot、Button、Markdown、HTML 等组件的构造参数；
- **自定义 HTML 组件**、**事件监听器**；
- **预测命令行**：从终端调用 Gradio 应用的接口。

目录里另有一份 `examples.md`，收了一批可直接参照的示例。

## 怎么安装

按仓库 README，Claude Code 先登记市场并安装基础的 CLI 技能，其余技能再用 `hf` 命令行添加：

```text
/plugin marketplace add huggingface/skills
/plugin install hf-cli@huggingface/skills
```

```bash
hf skills add huggingface-gradio
```

Codex 的做法是把仓库 `skills/` 下需要的文件夹复制或软链接到 `.agents/skills`；Gemini CLI 用 `gemini extensions install https://github.com/huggingface/skills.git --consent`。

仓库整体介绍和其他安装方式，详见本站《huggingface/skills 是什么、怎么安装：Hugging Face 官方 Agent Skills（hf-cli、模型训练、数据集、Spaces、Gradio）》。

## 怎么用

- 「给这个图像分类函数做一个 Gradio 界面：上传图片，返回前三个类别和置信度」。
- 「做一个流式输出的聊天界面，后端调用我已有的 `generate()` 函数」。
- 「把这个页面改成左右两栏布局，左边放参数，右边放结果」。

## 适合谁 / 局限

适合需要快速给模型或数据处理脚本配一个可操作界面的算法工程师、研究者和学生，尤其是打算把演示发布到 Spaces 的人。Gradio 擅长演示和内部工具，不适合做面向大量用户的正式产品前端；技能内容跟随它生成时的 Gradio 版本，你的项目版本较旧时要告诉智能体。

## 注意事项

- **许可**：Apache-2.0。
- **不执行脚本**；参考官方指南时会联网。
- **公开分享要小心**：Gradio 的分享链接和公开的 Space 任何人都能访问，演示背后如果调用了付费 API 或能读本地文件，记得加访问控制和限流。
- 部署到 Spaces 的配置（硬件、密钥）见该库的 Spaces 相关技能。
