---
title: "baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）"
slug: baoyu-skills-jimliu
name: baoyu-skills（宝玉 / JimLiu）
url: https://github.com/JimLiu/baoyu-skills
pricing: 开源免费（MIT）；图像生成需自备各服务商 API Key
platforms: Claude Code / Codex / OpenClaw 等（npx skills、插件市场或 ClawHub 安装）
trialNote: "npx skills add jimliu/baoyu-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, social-media, infographic]
excerpt: "baoyu-skills 是宝玉（Jim Liu）分享的中文 Skill 合集，20 多个技能：小红书图文、信息图、封面图、幻灯片、知识漫画、文章配图、Markdown 排版、翻译，以及发布到公众号、微博、X 的技能。出图要自备 API Key。"
checkedOn: 2026-10-10
sources:
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://code.claude.com/docs/en/discover-plugins
  - https://github.com/vercel-labs/skills
  - https://learn.chatgpt.com/docs/build-skills
---

> 本文根据 JimLiu/baoyu-skills 仓库的中英文 README、Claude Code 与 Codex 官方文档整理，资料核对于 2026-10-10。技能清单以仓库 README.zh.md 为准。

## 是什么

baoyu-skills 是宝玉（Jim Liu）公开的个人 Skill 合集，定位是「提升日常工作效率」，实际内容以内容创作为主：把一篇文章变成小红书图文、信息图、封面图、幻灯片或漫画，再排版、翻译、发布到各个平台。对做中文自媒体的人来说，这是目前场景贴合度很高的一套技能，文档也有完整的中文版。

技能脚本用 TypeScript 写成，README 的前置要求是装有 Node.js 并且能运行 `npx bun`。截至 2026-10-10，GitHub 显示该仓库约 2.7 万 Star、2917 Fork，最近一次推送在 2026-09-10。

README 在安装一节开头就提醒：仓库已有 20 多个技能，按需装真正用得上的几个，不要一次全装，每个加载的技能都会占用智能体的上下文。

## 包含哪些 Skill

README 把技能分成三类。

**内容技能（生成与发布）：**
- `baoyu-xhs-images`：把内容拆成小红书风格的系列图文，可选风格和布局；
- `baoyu-infographic`：信息图，多种布局与画风组合；
- `baoyu-cover-image`：文章封面图，按类型、配色等五个维度选择；
- `baoyu-slide-deck`：从 Markdown 生成幻灯片图片，可只出大纲；
- `baoyu-comic`：知识漫画；
- `baoyu-article-illustrator`：分析文章结构后在合适位置配插图；
- `baoyu-diagram`：示意图；
- `baoyu-post-to-wechat`、`baoyu-post-to-weibo`、`baoyu-post-to-x`：把内容发布到微信公众号、微博、X。

**AI 生成技能：**
- `baoyu-image-gen`：统一的图像生成后端，支持 OpenAI、Azure OpenAI、Google、OpenRouter、阿里通义万相（DashScope）、MiniMax、即梦、豆包（Seedream）、Replicate 等服务商，上面的出图类技能都依赖它。

**工具技能：**
- `baoyu-translate`（快速、标准、精翻三种模式，可附术语表）、`baoyu-format-markdown`（整理文章结构）、`baoyu-markdown-to-html`（转成带主题样式的 HTML）、`baoyu-compress-image`（压缩图片）、`baoyu-youtube-transcript`（下载视频字幕）、`baoyu-url-to-markdown`（网页转 Markdown）等。

## 怎么安装

**快速安装（README 推荐）**：

```bash
npx skills add jimliu/baoyu-skills
```

**Claude Code 插件市场**：

```text
/plugin marketplace add JimLiu/baoyu-skills
/plugin install baoyu-skills@baoyu-skills
```

市场里现在只有一个插件，包含仓库的全部技能。

**Codex 项目级安装**：README 说明 Codex 会扫描项目里的 `.agents/skills`，只需把用得到的技能整个目录复制或软链接进去，例如发公众号文章的最小组合是 `baoyu-cover-image`、`baoyu-article-illustrator`、`baoyu-post-to-wechat` 三个。

**OpenClaw**：通过 ClawHub 按单个技能安装，如 `clawhub install baoyu-image-gen`。

## 怎么用

多数技能用斜杠命令加文件路径调用，例如：

- `/baoyu-cover-image path/to/article.md --no-title` 生成不含标题文字的封面；
- `/baoyu-post-to-wechat 文章 --markdown article.md --theme grace` 以文章模式发到公众号；
- `/baoyu-post-to-x "Hello from AI Agent!"` 准备一条 X 帖子。

出图前要先配置图像服务的密钥：在 `~/.baoyu-skills/.env`（用户级）或项目下的 `.baoyu-skills/.env`（项目级）里写入对应服务商的 API Key；只配了一家时自动使用那一家，也可以用 `--provider` 指定。项目级的 `.env` 记得加进 `.gitignore`。

多数出图技能会先给出风格、布局方案让你确认，再批量生成；想跳过确认用于定时任务，部分技能提供非交互模式。

## 适合谁 / 不适合谁

**适合：**
- 公众号、小红书、微博、X 的内容创作者，想把「写完文章之后」的配图、排版、分发流程交给智能体；
- 需要批量出风格统一的信息图、封面图的运营人员；
- 已有某家图像生成服务 API Key 的开发者。

**不适合：**
- 不想配置 Node.js 环境和 API Key 的用户；
- 对账号安全要求高、不愿让自动化工具操作自己已登录浏览器的人——发布类技能要慎用；
- 只用 claude.ai 网页版的用户，README 没有提供网页版上传方式。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT；README 另说明，发布到 ClawHub 的技能按该平台规则以 MIT-0 分发。
- **维护状态**：最近一次推送 2026-09-10，更新节奏比部分同类仓库慢一些。
- **需要第三方 API Key 的技能**：`baoyu-image-gen` 以及依赖它出图的小红书图文、信息图、封面、幻灯片、漫画、文章配图等技能，都按你自己的服务商账户计费。`baoyu-post-to-wechat` 的 API 方式需要公众号的开发凭证，且调用方 IP 要在公众号白名单内。
- **会代你在平台上操作的技能**：`baoyu-post-to-wechat`、`baoyu-post-to-weibo`、`baoyu-post-to-x` 会通过接口或操作你本机已登录的 Chrome 来填写、提交内容。README 说明 X 的流程是脚本把内容填进浏览器，由你检查后手动发布；其余平台发布前也务必自己过一遍。自动化操作是否符合各平台规则、账号是否会因此受限，需要自行判断和承担。
- **名字带 danger 的技能**：仓库里有两个以 `baoyu-danger-` 开头的技能，README 的免责声明写明它们使用非官方接口、风险自负，账号可能受限。本文不作介绍，也不建议普通用户安装。
- **安全提醒**：这些技能带可执行脚本，会读写本地文件、联网调用第三方服务、读取 `.env` 里的密钥，个别技能会连接本机浏览器。安装前通读 `SKILL.md` 与脚本，只装需要的；抓取网页、下载字幕等工具类技能只用于你有权使用的内容。
