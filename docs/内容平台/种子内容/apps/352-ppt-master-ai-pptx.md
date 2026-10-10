---
title: "PPT Master 是什么、怎么安装使用：让 AI 把文档做成原生可编辑 PPTX 的 Skill（Claude Code / Cursor / Codex）"
slug: ppt-master-ai-pptx
name: PPT Master（hugohe3/ppt-master）
url: https://github.com/hugohe3/ppt-master
pricing: 开源免费（MIT）；只需承担所用 AI 模型的费用
platforms: Claude Code / Cursor / Codex CLI / Gemini CLI / GitHub Copilot / VS Code / Windsurf 等
trialNote: "npx skills add hugohe3/ppt-master"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, ppt, office]
excerpt: "PPT Master 是一个在 AI 编程工具里运行的做 PPT 工作流：把 PDF、Word、网页或一段文字交给它，先确认设计规格，再生成原生可编辑的 .pptx，形状、图表、表格、公式都能在 PowerPoint 里继续改。需要本机装 Python 3.10+。"
checkedOn: 2026-10-10
sources:
  - https://github.com/hugohe3/ppt-master
  - https://github.com/hugohe3/ppt-master/blob/main/docs/getting-started.md
  - https://github.com/hugohe3/ppt-master/blob/main/docs/faq.md
  - https://code.claude.com/docs/en/discover-plugins
  - https://github.com/vercel-labs/skills
---

> 本文根据 hugohe3/ppt-master 仓库 README 与 Claude Code 官方文档整理，资料核对于 2026-10-10。功能边界与模型建议以仓库 README 和 docs/ 目录为准。

## 是什么

PPT Master 是 Hugo He 开发的一个「做 PPT」工作流，以 Skill 的形式跑在有智能体能力的 AI 工具里。你在对话框里说一句「用这份 PDF 做一套幻灯片」，它在你的电脑上完成内容分析、版式设计、逐页生成和导出，最后交给你一个 `.pptx` 文件。

它强调的不是「能编辑」，而是「原生」：导出的是 PowerPoint 自己的对象——原生形状和连接线、可按需生成带数据的图表和表格、可编辑的公式——点开任何一个元素都能像手工做的幻灯片一样继续改，而不是一张张贴上去的图片。除了从资料生成新幻灯片，README 还列了几条路线：从参考文件里提炼可复用的品牌和版式模板、在保留原设计的前提下给已有 `.pptx` 换内容、给做好的幻灯片加原生切换、动画和旁白。

README 给自己的三个承诺是：成本透明（工具免费，只花模型的钱）、数据留在本地（除与模型通信外流程都在本机）、不绑定平台。截至 2026-10-10，GitHub 显示该仓库约 5.9 万 Star、4645 Fork，最近一次推送在 2026-10-08。仓库有中文 README（README_CN.md）。

## 包含哪些 Skill

仓库的核心是一个技能 `ppt-master`（位于 `skills/ppt-master/`），由 `SKILL.md`、若干工作流说明和一批 Python 脚本组成。按 README 的描述，它覆盖这些能力：

- **从资料生成**：支持 PDF、DOCX、HTML、EPUB、图片或直接粘贴的文字；
- **设计规格确认**：默认先和你确认模板、画幅、页数等，再开始制作；也有跳过确认的快速模式；
- **原生导出**：先生成每页的 SVG，再转换成可编辑的 DrawingML，输出到 `exports/` 目录；加参数可以把图表和表格导出为带「编辑数据」功能的 PowerPoint 原生对象；
- **编辑已有 PPTX**：保留设计，替换指定页面的内容；
- **配图**：可以调用所在工具自带的图像生成，也可以用脚本接入图像服务，或做网络图片搜索（不配置时使用 Openverse 和 Wikimedia Commons）；
- **演讲者备注、动画与旁白**：给成品补上原生动画，并可根据备注生成旁白音频。

README 明确说 SmartArt 是有意不做的。

## 怎么安装

前置条件：Python 3.10 及以上。Windows 需要多几步设置，仓库有专门的 Windows 安装指南。

**方式一：克隆仓库（README 推荐）**

```bash
git clone https://github.com/hugohe3/ppt-master.git
cd ppt-master
pip install -r requirements.txt
```

**方式二：技能市场**

```bash
# Cross-agent CLI (Claude Code, Cursor, Codex, etc.)
npx skills add hugohe3/ppt-master

# Or inside Claude Code
/plugin marketplace add hugohe3/ppt-master
/plugin install ppt-master@ppt-master
```

README 提醒：这两种市场安装只取回技能文件，不含完整仓库，仍然要在安装位置执行 `pip install -r requirements.txt`，后处理脚本才能运行。

不想装 Git 的话，也可以在 GitHub 页面下载 ZIP 解压后安装依赖。

## 怎么用

1. 用你的 AI 工具打开 `ppt-master` 文件夹（IDE 里用「打开文件夹」，命令行工具先 `cd ppt-master` 再启动）。
2. 把资料放进 `projects/` 目录，在对话里指明文件，例如：`Please create a PPT from projects/q3-report/sources/report.pdf`。也可以直接把文字贴进对话。
3. 它会先列出设计规格让你确认（模板、16:9 画幅、页数等），确认后自动完成后续步骤。
4. 成品在 `exports/<name>_<timestamp>.pptx`（名称加时间戳）。

想省掉确认环节，就明确说要快速生成，比如 `Quickly generate a 5-page deck from projects/q3-report/sources/report.pdf — no need to confirm with me`。对话中途如果模型丢了上下文，让它重新读一遍 `skills/ppt-master/SKILL.md`。

## 适合谁 / 不适合谁

**适合：**
- 经常要把报告、论文、方案改成幻灯片的职场人和学生，且已经在用 Claude Code、Cursor 这类工具；
- 需要拿到可继续编辑的源文件、而不是导出图片的人；
- 资料不便上传到在线 PPT 生成网站的场景。

**不适合：**
- 期待「一次生成、直接上台」的人——README 自己写了：这是工具不是许愿池，剩下的打磨要你来做；
- 用小模型或上下文窗口较小的模型的用户，README 说明模型决定上限，便宜的模型要返工更多；
- 完全不想碰 Python 和本地环境的人。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。
- **维护状态**：更新活跃，最近一次推送 2026-10-08。
- **安全提醒**：这个技能会在本机运行大量 Python 脚本、安装 pip 依赖、读写项目目录；配图功能会联网搜索图片或调用图像生成接口。安装前通读 `SKILL.md` 和脚本，依赖建议装在虚拟环境里。图像生成若走脚本方式，需要在 `.env` 里配置对应服务商的 API Key；网络搜图配置 Pexels / Pixabay 的 Key 后质量更好。密钥文件不要提交到代码仓库。
- **数据**：流程在本地执行，但资料内容会发送给你所用的模型服务，涉密材料先确认是否允许。
- **图片版权**：README 说明搜图会自动处理常见的开放许可并在需要时添加署名，但商用前仍应自己核对每张图的授权。
- **兼容性**：公式要求 PowerPoint 2010 及以上；在非 PowerPoint 软件里打开的效果边界见仓库 FAQ。
- README 里有较多赞助商（模型与接口服务）的推广内容，与技能功能无关，选择模型服务时请自行比较。
