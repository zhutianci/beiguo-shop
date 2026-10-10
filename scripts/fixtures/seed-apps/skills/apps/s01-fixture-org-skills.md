---
title: "fixture-org/skills 是什么、怎么装：测试用的官方 Skill 库"
slug: fixture-org-skills
name: fixture-org/skills
url: https://github.com/fixture-org/skills
pricing: 开源免费（Apache-2.0）
platforms: Claude Code / claude.ai / Claude API / Codex
trialNote: /plugin marketplace add fixture-org/skills
products: [claude, codex]
models: []
topics: [agent-skills, coding]
excerpt: 测试夹具：一个虚构的官方 Skill 库，用来验证 Skill 库目录的卡片、平台分组与安装命令的复制。
checkedOn: 2026-10-10
sources:
  - https://github.com/fixture-org/skills
---
## 是什么

fixture-org/skills 是一个虚构的 Skill 库，专门给自动化测试用。它把一组常用的 Skill 放在同一个仓库里：每个 Skill 是一个文件夹，里面有一份 SKILL.md 说明书，以及配套的脚本和模板。

## 包含哪些 Skill

仓库里有文档处理、表格整理、演示文稿三类示例 Skill，另外带一个用来帮你写新 Skill 的脚手架。每个文件夹都能单独拿出来用，不需要整库安装。

## 怎么安装

在 Claude Code 会话里把仓库登记为插件市场，然后在插件菜单里挑要装的那一组。网页版需要把文件夹打成压缩包后上传。

## 怎么用

装好之后不需要记命令：你的请求和某个 Skill 的描述对得上时，它会被自动加载；也可以在消息开头手动点名要用哪一个。

## 适合谁

适合刚开始接触 Skill、想先装一组成熟的再慢慢改的人。已经有自己一套流程的团队，可以把它当作写法参考。

## 注意事项

这是测试夹具，仓库地址并不存在。真实的库在安装前请先读一遍说明书和脚本，确认它要执行什么。
