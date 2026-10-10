---
title: "marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）"
slug: marketingskills-corey-haines
name: Marketing Skills（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）
trialNote: "npx skills add coreyhaines31/marketingskills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing, copywriting]
excerpt: "marketingskills 是 Corey Haines 维护的营销类 Skill 库，50 个技能覆盖转化率优化、落地页文案、SEO 审查、广告投放、邮件序列、定价与发布计划等。支持 Claude Code、Codex、Cursor，一条 npx skills 命令安装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://agentskills.io/home
---

> 本文根据 coreyhaines31/marketingskills 仓库 README、Claude Code 官方文档与 Claude 帮助中心整理，资料核对于 2026-10-10。技能清单在 v2.0 做过改名合并，以仓库 README 为准。

## 是什么

marketingskills 是 Corey Haines 维护的一套营销方向 Skill，面向懂一点技术的市场人员和创业者：让原本用来写代码的智能体，也能按成熟的营销方法做转化率优化、写文案、查 SEO、搭数据埋点。每个技能是一份 Markdown，写明什么场景触发、用什么框架分析、输出什么格式。

这套库有一个设计上的特点：技能之间共享背景。`product-marketing` 技能是地基，它会生成一份记录产品、受众和定位的文件（v2.0 起放在 `.agents/product-marketing.md`），其他技能动手前都先读它，免得每次重复交代「我的产品是什么」。

截至 2026-10-10，GitHub 显示该仓库约 5.4 万 Star、8021 Fork，最近一次推送在 2026-10-08。README 列出的技能共 50 个。

## 包含哪些 Skill

按 README 的分类，主要有这几组：

- **转化优化**：`cro`（页面与表单）、`signup`（注册流程）、`onboarding`（注册后激活）、`popups`（弹窗）、`paywalls`（应用内付费墙与升级提示的设计）；
- **内容与文案**：`copywriting`、`copy-editing`、`emails`（自动化邮件序列）、`cold-email`（B2B 开发信）、`social`（社交媒体内容）、`image`（营销配图）；
- **SEO 与被发现**：`seo-audit`、`ai-seo`（面向 AI 搜索的优化）、`programmatic-seo`（模板化批量页面）、`site-architecture`、`schema`（结构化数据）、`competitors`（竞品对比页）；
- **付费与分发**：`ads`（Google、Meta、LinkedIn 等广告）、`ad-creative`、`events`；
- **度量与实验**：`analytics`（埋点与追踪）、`ab-testing`、`attribution`；
- **留存与增长**：`churn-prevention`、`referrals`、`free-tools`、`co-marketing`；
- **策略与变现**：`pricing`、`launch`、`marketing-ideas`、`marketing-psychology`、`marketing-plan`、`offers`；
- **销售协同**：`revops`、`sales-enablement`、`prospecting`。

此外还有 `customer-research`、`content-strategy`、`public-relations`、`aso`（应用商店优化）等。

## 怎么安装

**npx skills（README 推荐）**：

```bash
# Install all skills
npx skills add coreyhaines31/marketingskills

# Install specific skills
npx skills add coreyhaines31/marketingskills --skill cro copywriting

# List available skills
npx skills add coreyhaines31/marketingskills --list
```

README 提醒：如果是让 Claude Code 在会话里替你执行安装，命令行会以非交互方式运行，可能只装到通用的 `.agents/skills/`，而 Claude Code 不读这个目录，这时要显式指定：`npx skills add coreyhaines31/marketingskills -a claude-code`。

**Claude Code 插件**：

```text
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills
```

**Codex 插件**：`codex plugin marketplace add coreyhaines31/marketingskills`，然后在 Codex 会话里输入 `/plugins`，选择 marketing-skills。

**claude.ai 网页版**：从仓库 Releases 下载对应的 `<name>-claude-web.zip`（每个压缩包一个技能），在 Customize → Skills 里上传。README 还列了克隆复制、Git 子模块、SkillKit 等方式。

## 怎么用

装好后直接用自然语言提需求，智能体会按描述匹配技能，README 给的例子：

- 「Help me optimize this landing page for conversions」→ 触发 `cro`；
- 「Write homepage copy for my SaaS」→ 触发 `copywriting`；
- 「Set up GA4 tracking for signups」→ 触发 `analytics`；
- 「Create a 5-email welcome sequence」→ 触发 `emails`。

也可以手动调用，如 `/cro`、`/emails`、`/seo-audit`。建议第一步先让它跑 `product-marketing`，把产品背景文件建好，后面的输出会贴合得多。中文提需求同样可以，但技能里的框架和示例以英文 SaaS 市场为主。

## 适合谁 / 不适合谁

**适合：**
- 独立开发者、出海 SaaS 创业者——没有专职市场团队，需要有章法地做落地页、SEO 和邮件；
- 技术型市场人员，想把重复性的审查和起草工作交给智能体；
- 想参考成熟营销清单来写自己技能的人。

**不适合：**
- 主要做国内平台运营（公众号、小红书、抖音）的人——内容围绕 Google、Meta、LinkedIn、邮件等海外渠道；
- 期待「一键自动投放」的人——多数技能产出的是方案、文案和检查结果，执行仍要你自己来；
- 不使用任何编程智能体的纯网页用户，只能逐个上传 ZIP，体验打折扣。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。README 说明项目由付费合作伙伴赞助，并在工具清单里做了披露；看到技能推荐某个第三方工具时，自己再比较一下。
- **维护状态**：更新活跃，最近一次推送 2026-10-08。v2.0 改了 17 个技能的名字并合并了部分技能，从旧版升级后目录里会残留旧文件夹，需要按 README 清理。
- **安全提醒**：技能可以带脚本、读写文件、执行命令。仓库的 `tools/` 部分提供了连接营销账号（分析、广告等）的引导流程，会涉及第三方服务的 API 凭据——只给只读或最小范围的权限，不要把密钥写进会提交的文件。安装前通读要用的 `SKILL.md`。
- **合规**：开发信、短信营销、目录提交这类技能产出的内容，发送前要符合收件地区的反垃圾邮件法规和各平台规则，技能不会替你承担这部分责任。
- **兼容性**：`/plugin` 命令只在交互式的 Claude Code 命令行会话里可用；网页版 ZIP 用的是精简后的技能描述，也不会帮你配置本地命令行或凭据。
