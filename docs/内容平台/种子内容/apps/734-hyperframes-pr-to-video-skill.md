---
title: "pr-to-video skill 是什么、怎么安装使用：把一个 GitHub PR 做成代码改动讲解视频（HyperFrames）"
slug: hyperframes-pr-to-video-skill
name: pr-to-video（heygen-com/hyperframes）
url: https://github.com/heygen-com/hyperframes/tree/main/skills/pr-to-video
pricing: "开源免费（Apache-2.0）；无按次渲染费用"
platforms: "Claude Code（插件）/ Codex / Cursor / Copilot / Gemini CLI 等"
trialNote: "`claude plugin marketplace add heygen-com/hyperframes` 然后 `claude plugin install hyperframes@hyperframes`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, motion-graphics, coding]
excerpt: "pr-to-video 是 HyperFrames 的创作流程技能：读取一个 GitHub Pull Request 的 diff、提交和文件，规划成更新日志、功能亮相、修复或重构讲解视频，片尾带贡献者致谢，逐帧生成后渲染成 MP4。"
checkedOn: 2026-10-11
sources:
  - https://github.com/heygen-com/hyperframes/tree/main/skills/pr-to-video
  - https://github.com/heygen-com/hyperframes
  - https://skills.sh/
---

> 本文根据 heygen-com/hyperframes 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 35.8 万次；所在仓库 heygen-com/hyperframes 在 GitHub 约 6.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

发版时配一段小视频讲清楚「这次改了什么」，效果比一段文字好，但很少有人有空做。pr-to-video 把这件事交给智能体。`description`：把一个 GitHub Pull Request（PR 链接、`owner/repo#N`，或已检出仓库里的「这个 PR」）变成代码改动讲解视频——更新日志、功能亮相、修复或重构讲解，素材是 diff、提交和文件；输入是代码改动而不是网站。

流程和其他 HyperFrames 创作技能同构，区别在数据来源：

- **读入 PR**：脚本 `fetch-pr.mjs` 通过 GitHub 官方命令行 `gh` 拉取 PR 信息，分页补全文件列表（大 PR 不会在一百个文件处截断），只写出 `capture/pr.json` 和 `capture/diff.patch`；另一个脚本尽力下载贡献者头像，用于片尾致谢。SKILL.md 明确：拉取失败（未登录、找不到、私有仓库）就报错停下，**不许编造 PR 内容**。过关条件是能用一句话说清这个 PR 改了什么。
- **设计系统**：采用预设的「代码编辑风」版式，目录里多了一份讲代码画面语汇的参考文件。
- **分镜与脚本 → 音频 → 画面设计 → 逐帧构建 → 收尾渲染**，分镜和最终渲染等你确认；构建阶段派出数量受限的一组子智能体。

SKILL.md 还规定工作目录在仓库之外单独解析，默认不往你的代码仓库里写东西。

## 怎么安装

`pr-to-video` 是 HyperFrames 技能包里的一个创作流程，不建议单独装：它要调用同包里的 CLI、动画、媒体等领域技能。Claude Code 用插件（命令来自仓库 README）：

```bash
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
```

其他智能体用 `npx skills add heygen-com/hyperframes`，README 说在选择器里只勾「Core Skills」一组即可，路由技能 `/hyperframes` 会在需要时把 `pr-to-video` 这类流程按需装上。渲染需要本机有 Node、Chrome 和 FFmpeg。

仓库整体介绍和其他安装方式，详见本站《HyperFrames 是什么、怎么安装使用：HeyGen 开源的「写 HTML、出视频」框架与 Agent Skills》。

## 怎么用

- 「把 https://github.com/owner/repo/pull/123 做成 40 秒的更新说明视频」。
- 在已检出该分支的仓库里：「给这个 PR 做一段功能演示视频，重点讲新增的导出功能」。
- 「这是一次重构，没有用户可见的变化，做成面向团队内部的讲解，突出前后结构对比」。

## 适合谁 / 局限

适合开源项目维护者做发版动态、开发者关系团队做更新内容，也适合团队内部同步较大的改动。局限：画面是代码片段和文字动效，不会演示真实的产品界面；PR 描述和提交信息写得含糊，视频也讲不清；改动特别大的 PR 需要你指定重点，否则容易面面俱到。

## 注意事项

- **许可**：Apache-2.0。
- **依赖 `gh` 命令行并使用你的 GitHub 登录状态**：能读到你有权限访问的私有仓库，对外发布前确认视频里没有不该公开的代码。
- **会展示贡献者的头像和名字**：公开发布前确认合适。
- **旁白与配乐**默认使用 HeyGen 的音频接口，也可换本地语音引擎；渲染需要 Node、Chrome 和 FFmpeg。
