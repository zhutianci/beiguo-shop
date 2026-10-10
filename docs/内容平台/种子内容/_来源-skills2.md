# 来源登记 · skills2（Skill 库第二批，2026-10-11）

本批共 145 条：(a) 新增 Skill 库条目 23 条（编号 360–399），(b) 大型库里的单个 Skill 条目 122 条（编号 600–799）。全部挂 `agent-skills` 标签，`checkedOn: 2026-10-11`，未配图。

## 资料与取数方式

- 每个条目都是根据对应仓库的 README 与该技能的 `SKILL.md`（frontmatter 的 `description`、正文小节标题、目录内的脚本与参考文件清单）整理后用自己的话重写的，不整段照搬；安装命令原样取自各仓库 README，`npx skills add … --skill <name>` 的写法以 vercel-labs/skills（skills CLI）README 的 `-s, --skill` 参数说明为依据。
- **Star / Fork / 最近推送 / 许可证**：2026-10-11 通过 GitHub 搜索 API（`api.github.com/search/repositories`）取数；许可证以 API 的 `license.spdx_id` 与 README 的 License 小节为准，技能目录内另有 LICENSE 的以其为准（anthropics/skills 的四个文档技能为 Proprietary / 源码可见）。
- **skills.sh 安装量**：2026-10-11 抓取 skills.sh 首页榜单内嵌数据（前 600 条，字段 `source` / `skillId` / `installs`）。榜单安装量包含整库安装带来的计数，正文里均注明日期且只作热度参考。榜单上没有的技能（如 knowledge-work-plugins、trailofbits、K-Dense、pm-skills 的技能）不写安装量，只写所在仓库的 Star。
- **标题**：技能名 + 「skill 是什么 / 怎么安装使用」的问法，2026-10-11 用 Google 下拉建议抽样验证（`suggestqueries.google.com`，如 `frontend-design skill`、`skill-creator`、`claude pptx skill`、`claude pdf skill`、`mcp-builder`、`webapp-testing skill`、`superpowers brainstorming`、`systematic-debugging`、`grill-me skill`、`subagent-driven-development` 等均有「是什么 / 安装 / 使用 / github」类联想）；没有单独验证的冷门技能统一用「X skill 是什么、怎么安装使用」的描述式标题。
- 校验：`npx tsx scripts/build-seed-bundle.ts`。本分支基于的旧版脚本用 UTC 日期判断 `checkedOn` 是否「未来」，北京时间 2026-10-11 08:00 之前运行会对本批全部条目报「checkedOn 是未来的日期」（仅此一类报错，其余校验项均通过）；release/opt-1007 的 651f20d 已把该判断改为按北京时间，合并后不再出现。

## 没有收录的候选与原因

**库（a 类）：**

- `titanwings/distilly`（原 Colleague Skill，「蒸馏某个人的思维方式」）：涉及未经同意复刻具体个人，属隐私问题类，按第一批标准不收。
- `browser-act/skills`、`feder-cr/invisible_dots`、skills.sh 榜单上的 `antibrow/anti-detect-browser-skills`：自述以绕过反爬 / 反自动化检测为卖点，不收。
- `SnailSploit/Claude-Red`、`elementalsouls/Claude-BugHunter`、`ljagiello/ctf-skills`、`morluto/rea`：进攻性安全 / 逆向方向，不收。
- `teng-lin/notebooklm-py`：非官方接口，依赖登录态访问第三方服务，不收。
- `gosom/google-maps-scraper`、`firecrawl/cli`、`scrapegraphai/just-scrape`：以抓取为主业的工具（firecrawl/cli 在 GitHub API 中也未识别出许可证），未收。
- `flowkit-labs/skills`、`101-skills/superpowers`、`prime-skills/runcomfy-agent-skills`、`lllllllama/rigorpilot-skills` 等 skills.sh 榜单上安装量异常整齐、来源不明或与知名项目撞名的仓库（含社交平台自动化、「superpowers」同名仓库）：无法核实维护者与内容质量，不收。
- `anbeime/skill`、`irinabuht12-oss/marketing-skills`、`better-auth/skills`：GitHub API 未识别出许可证（anbeime/skill 另为聚合「商店」性质），不收。
- `thedotmack/claude-mem`、`nexu-io/open-design`、`career-ops-hq/career-ops`、`microsoft/SkillOpt`：本体是应用 / 记忆插件 / 研究工具而非技能库，career-ops 还涉及批量扫描招聘网站，未收。
- `makenotion/skills`（173 Star）、`prisma/skills`（68 Star）、`get-convex/agent-skills`（64 Star）、`neondatabase/agent-skills`（100 Star）：官方出品但关注度低，本批未单列。
- `openai/plugins`：已在站内《openai/skills 是什么…（已转向 openai/plugins）》条目中介绍，避免重复未单列。

**单个技能（b 类）：**

- 各库里的入口 / 引导类技能（`using-superpowers`、`setup-matt-pocock-skills`、`using-agent-skills`、`template-skill` 等）：内容单薄或只是路由，不单列。
- 跨库重复用途只留一条：TDD 留 superpowers 的 `test-driven-development`（未写 mattpocock `tdd`、addyosmani `test-driven-development`）；调试留 `systematic-debugging`（未写 mattpocock `diagnosing-bugs`、addyosmani `debugging-and-error-recovery`）；mattpocock 的 `grilling` 并入 `grill-me` 条目说明，`code-review` 未写。
- `JimLiu/baoyu-skills` 的 `baoyu-danger-*` 系列，以及 `baoyu-post-to-x`、`baoyu-post-to-wechat` 等靠浏览器登录态自动发帖的技能：按任务要求与排除标准不收。
- trailofbits/skills 里偏漏洞利用、模糊测试靶场、APK 扫描等方向的技能：只选防御性审计类。
- skills.sh 榜单上有、但仓库当前目录树里已不存在的旧技能名（如 marketingskills 的 `page-cro`、`paid-ads`、`email-sequence` 等 v2 改名前的名字）：不写。
- `openai/skills` 的单个技能（gh-fix-ci、playwright、figma-implement-design 等）：站内已有条目注明该仓库已标注弃用、官方转向 openai/plugins，按「弃用的不写」未收。
- 已收录库里本批没有展开单个技能的：Impeccable、Taste Skill、gstack、ECC、wshobson/agents、Khazix Skills、github/awesome-copilot、HyperFrames、microsoft/azure-skills、larksuite/cli 的其余技能，以及 K-Dense 的各学科专用技能（rdkit、scanpy、biopython 等）——可作为下一批候选，本批为保证质量未继续铺开。

## 需要协调者留意

- `checkedOn: 2026-10-11` 与旧版校验脚本的 UTC 日期判断（见上，release/opt-1007 已修）。
- 部分条目按既有应用条目的做法挂了图像 / 视频大类下的主题标签（`ppt`、`poster`、`illustration`、`sticker`、`comic`、`infographic`、`wallpaper`、`motion-graphics`），如不希望 Skill 条目出现在这些标签下可统一改掉。
- `firebase/agent-skills`：GitHub 仓库名与 README 安装命令里的 `firebase/skills` 不一致（后者可用，疑为改名后的跳转），条目里已说明。
- trailofbits 条目的 `trialNote` 第二条命令是 `/plugin menu`（README 的写法是进菜单选插件，没有给出 Claude Code 下逐个插件的 install 命令）。
- huggingface 条目的 `trialNote` 为 `hf skills add <技能名>`（README 原文 `hf skills add <skill-name>`），需要先装 `hf` 命令行。
- 单个 Skill 条目的正文开头统一带一行「skills.sh 安装量 + 所在仓库 Star」，数字均为 2026-10-11 当天取数；后续如批量更新日期，这一行要同步。
- 「详见本站《…》」引用的是 300–355 既有条目的标题全文，既有条目改标题时需同步。

## (a) 新增 Skill 库条目

| 文件 | 名称 | 许可（pricing 字段） | 热度依据（2026-10-11） | 链接 |
| --- | --- | --- | --- | --- |
| 360-alirezarezvani-claude-skills-library.md | alirezarezvani/claude-skills | 开源免费（MIT） | 27958 Star / 3924 Fork，最近推送 2026-08-30 | https://github.com/alirezarezvani/claude-skills |
| 361-jeffallan-claude-skills-fullstack.md | Jeffallan/claude-skills（fullstack-dev-skills） | 开源免费（MIT） | 11810 Star / 1137 Fork，最近推送 2026-10-03 | https://github.com/Jeffallan/claude-skills |
| 362-guizang-ppt-skill-html-slides.md | guizang-ppt-skill（歸藏的网页 PPT Skill） | 开源免费（AGPL-3.0） | 27567 Star / 1906 Fork，最近推送 2026-08-07 | https://github.com/op7418/guizang-ppt-skill |
| 363-frontend-slides-html-presentation-skill.md | Frontend Slides（zarazhangrui/frontend-slides） | 开源免费（MIT） | 30410 Star / 2361 Fork，最近推送 2026-06-23 | https://github.com/zarazhangrui/frontend-slides |
| 364-gsap-skills-greensock-animation.md | greensock/gsap-skills（GSAP 官方技能） | 开源免费（MIT）；GSAP 及全部插件现已免费 | 16135 Star / 948 Fork，最近推送 2026-07-29；skills.sh 榜单 gsap-core 约 6.6 万次安装（2026-10-11） | https://github.com/greensock/gsap-skills |
| 365-expo-skills-react-native-eas.md | expo/skills（Expo 官方技能） | 开源免费（MIT）；部分技能对应付费的 EAS 云服务 | 2686 Star / 160 Fork，最近推送 2026-10-07；skills.sh 榜单 expo-dev-client 约 6.6 万次安装（2026-10-11） | https://github.com/expo/skills |
| 366-microsoft-skills-azure-sdk-foundry.md | microsoft/skills（微软 Azure SDK 与 Foundry 技能） | 开源免费（MIT）；操作的 Azure 资源按微软云计费 | 3098 Star / 350 Fork，最近推送 2026-10-09 | https://github.com/microsoft/skills |
| 367-hyperframes-heygen-html-video.md | HyperFrames（heygen-com/hyperframes） | 开源免费（Apache-2.0）；无按次渲染费用 | 60253 Star / 5378 Fork，最近推送 2026-10-10；skills.sh 榜单 hyperframes 约 88.0 万次安装（2026-10-11） | https://github.com/heygen-com/hyperframes |
| 368-agent-browser-vercel-cli-skill.md | agent-browser（vercel-labs/agent-browser） | 开源免费（Apache-2.0） | 43768 Star / 2964 Fork，最近推送 2026-10-10；skills.sh 榜单 agent-browser 约 108.2 万次安装（2026-10-11） | https://github.com/vercel-labs/agent-browser |
| 369-skill-seekers-docs-to-skill.md | Skill Seekers（yusufkaraaslan/Skill_Seekers） | 开源免费（MIT）；可选的 AI 增强步骤按所用模型计费 | 15123 Star / 1542 Fork，最近推送 2026-09-30 | https://github.com/yusufkaraaslan/Skill_Seekers |
| 370-book-to-skill-pdf-to-claude-skill.md | book-to-skill（virgiliojr94/book-to-skill） | 开源免费（MIT，仅指转换工具本身） | 34419 Star，最近推送 2026-10-05 | https://github.com/virgiliojr94/book-to-skill |
| 371-understand-anything-codebase-knowledge-graph.md | Understand Anything（Egonex-AI） | 开源免费（MIT） | 85832 Star，最近推送 2026-10-10 | https://github.com/Egonex-AI/Understand-Anything |
| 372-diagram-design-editorial-svg-skill.md | Diagram Design（cathrynlavery/diagram-design） | 开源免费（MIT） | 48694 Star，最近推送 2026-10-10 | https://github.com/cathrynlavery/diagram-design |
| 373-huashu-design-html-design-skill.md | Huashu Design（花叔 / alchaincyf/huashu-design） | 开源免费（MIT，2026-05-14 起个人与商用均免费） | 24781 Star，最近推送 2026-09-22 | https://github.com/alchaincyf/huashu-design |
| 374-stripe-ai-agent-skills-official.md | stripe/ai（Stripe 官方 Agent Skills 与 AI 工具） | 开源免费（MIT）；Stripe 支付服务按其费率计费 | 1865 Star / 353 Fork，最近推送 2026-10-10；skills.sh 榜单 stripe-best-practices 约 9.3 万次安装（2026-10-11） | https://github.com/stripe/ai |
| 375-getsentry-skills-sentry-engineering.md | getsentry/skills（Sentry 团队的工程技能） | 开源免费（Apache-2.0） | 1045 Star / 53 Fork，最近推送 2026-10-09 | https://github.com/getsentry/skills |
| 376-microsoft-azure-skills-plugin.md | microsoft/azure-skills（Azure Skills 插件） | 开源免费（MIT）；Azure 资源按微软云计费 | 1555 Star / 254 Fork，最近推送 2026-10-09；skills.sh 榜单 azure-diagnostics 约 55.1 万次安装（2026-10-11） | https://github.com/microsoft/azure-skills |
| 377-firebase-agent-skills-official.md | firebase/agent-skills（Firebase 官方技能） | 开源免费（Apache-2.0）；Firebase 服务按其套餐计费 | 464 Star / 102 Fork，最近推送 2026-10-10；skills.sh 榜单 firebase-basics 约 16.8 万次安装（2026-10-11） | https://github.com/firebase/agent-skills |
| 378-gws-google-workspace-cli-skills.md | gws（googleworkspace/cli） | 开源免费（Apache-2.0）；非 Google 官方支持产品 | 31286 Star / 1861 Fork，最近推送 2026-10-06；skills.sh 榜单 gws-gmail 约 7.9 万次安装（2026-10-11） | https://github.com/googleworkspace/cli |
| 379-emilkowalski-skills-animation-design.md | emilkowalski/skills（Emil Kowalski 的设计与动效技能） | 开源免费（GitHub 标注 MIT） | 44996 Star / 2557 Fork，最近推送 2026-10-02；skills.sh 榜单 emil-design-eng 约 33.9 万次安装（2026-10-11） | https://github.com/emilkowalski/skills |
| 380-i-have-adhd-skill-concise-output.md | i-have-adhd（ayghri/i-have-adhd） | 开源免费（MIT） | 56264 Star / 3211 Fork，最近推送 2026-10-06 | https://github.com/ayghri/i-have-adhd |
| 381-drawio-skill-agents365-diagrams.md | drawio-skill（Agents365-ai/drawio-skill） | 开源免费（MIT） | 10051 Star / 707 Fork，最近推送 2026-10-02 | https://github.com/Agents365-ai/drawio-skill |
| 382-superpowers-zh-chinese-edition.md | superpowers-zh（Superpowers 中文增强版） | 开源免费（MIT） | 8291 Star / 769 Fork，最近推送 2026-10-08 | https://github.com/jnMetaCode/superpowers-zh |

## (b) 单个 Skill 条目

| 文件 | 名称 | 所属库 | 许可（pricing 字段） | 热度依据（2026-10-11） | 技能目录 |
| --- | --- | --- | --- | --- | --- |
| 600-anthropic-frontend-design-skill.md | frontend-design（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 971290；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/frontend-design |
| 601-anthropic-skill-creator.md | skill-creator（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 402138；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/skill-creator |
| 602-anthropic-pptx-skill.md | pptx（anthropics/skills） | anthropics/skills | 免费使用（源码可见，非开源；条款见 LICENSE.txt） | skills.sh 233337；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/pptx |
| 603-anthropic-pdf-skill.md | pdf（anthropics/skills） | anthropics/skills | 免费使用（源码可见，非开源；条款见 LICENSE.txt） | skills.sh 208467；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/pdf |
| 604-anthropic-docx-skill.md | docx（anthropics/skills） | anthropics/skills | 免费使用（源码可见，非开源；条款见 LICENSE.txt） | skills.sh 199079；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/docx |
| 605-anthropic-xlsx-skill.md | xlsx（anthropics/skills） | anthropics/skills | 免费使用（源码可见，非开源；条款见 LICENSE.txt） | skills.sh 180378；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/xlsx |
| 606-anthropic-webapp-testing-skill.md | webapp-testing（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 174106；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/webapp-testing |
| 607-anthropic-mcp-builder-skill.md | mcp-builder（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 124593；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/mcp-builder |
| 608-anthropic-canvas-design-skill.md | canvas-design（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 115494；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/canvas-design |
| 609-anthropic-web-artifacts-builder-skill.md | web-artifacts-builder（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 107455；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder |
| 610-anthropic-brand-guidelines-skill.md | brand-guidelines（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 102014；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/brand-guidelines |
| 611-anthropic-theme-factory-skill.md | theme-factory（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 90406；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/theme-factory |
| 612-anthropic-doc-coauthoring-skill.md | doc-coauthoring（anthropics/skills） | anthropics/skills | 免费（目录内未附 LICENSE 文件，以仓库 README 说明为准） | skills.sh 89583；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring |
| 613-anthropic-algorithmic-art-skill.md | algorithmic-art（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 85324；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/algorithmic-art |
| 614-anthropic-internal-comms-skill.md | internal-comms（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 76593；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/internal-comms |
| 615-anthropic-slack-gif-creator-skill.md | slack-gif-creator（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 72085；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator |
| 616-anthropic-claude-api-skill.md | claude-api（anthropics/skills） | anthropics/skills | 免费（Apache-2.0，见技能目录内 LICENSE.txt） | skills.sh 70384；仓库 180307 Star | https://github.com/anthropics/skills/tree/main/skills/claude-api |
| 617-superpowers-brainstorming-skill.md | brainstorming（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 386404；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/brainstorming |
| 618-superpowers-systematic-debugging-skill.md | systematic-debugging（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 285364；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/systematic-debugging |
| 619-superpowers-writing-plans-skill.md | writing-plans（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 268876；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/writing-plans |
| 620-superpowers-test-driven-development-skill.md | test-driven-development（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 245642；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/test-driven-development |
| 621-superpowers-subagent-driven-development-skill.md | subagent-driven-development（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 222823；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development |
| 622-superpowers-executing-plans-skill.md | executing-plans（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 229865；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/executing-plans |
| 623-superpowers-requesting-code-review-skill.md | requesting-code-review（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 246932；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/requesting-code-review |
| 624-superpowers-receiving-code-review-skill.md | receiving-code-review（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 209529；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/receiving-code-review |
| 625-superpowers-verification-before-completion-skill.md | verification-before-completion（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 232848；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/verification-before-completion |
| 626-superpowers-dispatching-parallel-agents-skill.md | dispatching-parallel-agents（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 206853；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/dispatching-parallel-agents |
| 627-superpowers-writing-skills-skill.md | writing-skills（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 206121；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/writing-skills |
| 628-superpowers-using-git-worktrees-skill.md | using-git-worktrees（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 205615；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/using-git-worktrees |
| 629-superpowers-finishing-a-development-branch-skill.md | finishing-a-development-branch（obra/superpowers） | obra/superpowers | 开源免费（MIT） | skills.sh 203010；仓库 297153 Star | https://github.com/obra/superpowers/tree/main/skills/finishing-a-development-branch |
| 630-mattpocock-grill-me-skill.md | grill-me（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 1325711；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me |
| 631-mattpocock-grill-with-docs-skill.md | grill-with-docs（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 1135414；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs |
| 632-mattpocock-improve-codebase-architecture-skill.md | improve-codebase-architecture（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 1083673；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture |
| 633-mattpocock-handoff-skill.md | handoff（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 956772；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff |
| 634-mattpocock-triage-skill.md | triage（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 919738；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/triage |
| 635-mattpocock-prototype-skill.md | prototype（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 915402；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/prototype |
| 636-mattpocock-domain-modeling-skill.md | domain-modeling（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 794353；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling |
| 637-mattpocock-codebase-design-skill.md | codebase-design（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 770790；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design |
| 638-mattpocock-teach-skill.md | teach（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 787795；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/productivity/teach |
| 639-mattpocock-to-spec-skill.md | to-spec（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 642086；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec |
| 640-mattpocock-to-tickets-skill.md | to-tickets（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 634779；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets |
| 641-mattpocock-wayfinder-skill.md | wayfinder（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 644702；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/engineering/wayfinder |
| 642-mattpocock-git-guardrails-claude-code-skill.md | git-guardrails-claude-code（mattpocock/skills） | mattpocock/skills | 开源免费（MIT） | skills.sh 450967；仓库 284048 Star | https://github.com/mattpocock/skills/tree/main/skills/misc/git-guardrails-claude-code |
| 643-vercel-react-best-practices-skill.md | vercel-react-best-practices（vercel-labs/agent-skills） | vercel-labs/agent-skills | 免费（技能标注 MIT；仓库根目录无 LICENSE 文件） | skills.sh 786079；仓库 32168 Star | https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices |
| 644-vercel-web-design-guidelines-skill.md | web-design-guidelines（vercel-labs/agent-skills） | vercel-labs/agent-skills | 免费（该技能未单独标注许可；仓库 README 写 MIT） | skills.sh 718910；仓库 32168 Star | https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines |
| 645-vercel-composition-patterns-skill.md | vercel-composition-patterns（vercel-labs/agent-skills） | vercel-labs/agent-skills | 免费（技能标注 MIT；仓库根目录无 LICENSE 文件） | skills.sh 384087；仓库 32168 Star | https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns |
| 646-vercel-react-native-skills-skill.md | vercel-react-native-skills（vercel-labs/agent-skills） | vercel-labs/agent-skills | 免费（技能标注 MIT；仓库根目录无 LICENSE 文件） | skills.sh 236478；仓库 32168 Star | https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills |
| 647-vercel-deploy-to-vercel-skill.md | deploy-to-vercel（vercel-labs/agent-skills） | vercel-labs/agent-skills | 免费（该技能未单独标注许可）；部署占用 Vercel 套餐额度 | skills.sh 151256；仓库 32168 Star | https://github.com/vercel-labs/agent-skills/tree/main/skills/deploy-to-vercel |
| 648-vercel-react-view-transitions-skill.md | vercel-react-view-transitions（vercel-labs/agent-skills） | vercel-labs/agent-skills | 免费（技能标注 MIT；仓库根目录无 LICENSE 文件） | skills.sh 148472；仓库 32168 Star | https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions |
| 649-supabase-postgres-best-practices-skill.md | supabase-postgres-best-practices（supabase/agent-skills） | supabase/agent-skills | 开源免费（MIT） | skills.sh 439015；仓库 2708 Star | https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices |
| 650-supabase-skill-official.md | supabase（supabase/agent-skills） | supabase/agent-skills | 开源免费（MIT）；Supabase 项目按其套餐计费 | skills.sh 318514；仓库 2708 Star | https://github.com/supabase/agent-skills/tree/main/skills/supabase |
| 651-cloudflare-skill-product-discovery.md | cloudflare（cloudflare/skills） | cloudflare/skills | 开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费 | skills.sh 117925；仓库 3026 Star | https://github.com/cloudflare/skills/tree/main/skills/cloudflare |
| 652-cloudflare-wrangler-skill.md | wrangler（cloudflare/skills） | cloudflare/skills | 开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费 | skills.sh 112705；仓库 3026 Star | https://github.com/cloudflare/skills/tree/main/skills/wrangler |
| 653-cloudflare-workers-best-practices-skill.md | workers-best-practices（cloudflare/skills） | cloudflare/skills | 开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费 | skills.sh 107328；仓库 3026 Star | https://github.com/cloudflare/skills/tree/main/skills/workers-best-practices |
| 654-cloudflare-durable-objects-skill.md | durable-objects（cloudflare/skills） | cloudflare/skills | 开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费 | skills.sh 96115；仓库 3026 Star | https://github.com/cloudflare/skills/tree/main/skills/durable-objects |
| 655-cloudflare-web-perf-skill.md | web-perf（cloudflare/skills） | cloudflare/skills | 开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费 | skills.sh 95344；仓库 3026 Star | https://github.com/cloudflare/skills/tree/main/skills/web-perf |
| 656-obsidian-markdown-skill-kepano.md | obsidian-markdown（kepano/obsidian-skills） | kepano/obsidian-skills | 开源免费（MIT） | skills.sh 89503；仓库 49362 Star | https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-markdown |
| 657-obsidian-cli-skill-kepano.md | obsidian-cli（kepano/obsidian-skills） | kepano/obsidian-skills | 开源免费（MIT） | skills.sh 78163；仓库 49362 Star | https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-cli |
| 658-obsidian-bases-skill-kepano.md | obsidian-bases（kepano/obsidian-skills） | kepano/obsidian-skills | 开源免费（MIT） | skills.sh 77053；仓库 49362 Star | https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-bases |
| 659-json-canvas-skill-kepano.md | json-canvas（kepano/obsidian-skills） | kepano/obsidian-skills | 开源免费（MIT） | skills.sh 71938；仓库 49362 Star | https://github.com/kepano/obsidian-skills/tree/main/skills/json-canvas |
| 660-defuddle-skill-kepano.md | defuddle（kepano/obsidian-skills） | kepano/obsidian-skills | 开源免费（MIT） | skills.sh 71815；仓库 49362 Star | https://github.com/kepano/obsidian-skills/tree/main/skills/defuddle |
| 661-remotion-best-practices-skill.md | remotion-best-practices（remotion-dev/skills） | remotion-dev/skills | 免费（技能仓库未声明许可证） | skills.sh 597213；仓库 5003 Star | https://github.com/remotion-dev/skills/tree/main/skills/remotion-best-practices |
| 662-remotion-captions-skill.md | remotion-captions（remotion-dev/skills） | remotion-dev/skills | 免费（技能仓库未声明许可证） | skills.sh 142114；仓库 5003 Star | https://github.com/remotion-dev/skills/tree/main/skills/remotion-captions |
| 663-hf-cli-skill-hugging-face.md | hf-cli（huggingface/skills） | huggingface/skills | 开源免费（Apache-2.0）；云端任务按 Hugging Face 计费 | 仓库 11152 Star | https://github.com/huggingface/skills/tree/main/skills/hf-cli |
| 664-huggingface-llm-trainer-skill.md | huggingface-llm-trainer（huggingface/skills） | huggingface/skills | 免费（条款见技能目录内 LICENSE.txt）；云端 GPU 训练按 Hugging Face 计费 | 仓库 11152 Star | https://github.com/huggingface/skills/tree/main/skills/huggingface-llm-trainer |
| 665-huggingface-datasets-skill.md | huggingface-datasets（huggingface/skills） | huggingface/skills | 开源免费（Apache-2.0）；云端任务按 Hugging Face 计费 | 仓库 11152 Star | https://github.com/huggingface/skills/tree/main/skills/huggingface-datasets |
| 666-huggingface-gradio-skill.md | huggingface-gradio（huggingface/skills） | huggingface/skills | 开源免费（Apache-2.0）；云端任务按 Hugging Face 计费 | 仓库 11152 Star | https://github.com/huggingface/skills/tree/main/skills/huggingface-gradio |
| 667-marketingskills-seo-audit-skill.md | seo-audit（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 224316；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit |
| 668-marketingskills-copywriting-skill.md | copywriting（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 220612；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting |
| 669-marketingskills-marketing-psychology-skill.md | marketing-psychology（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 155579；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/marketing-psychology |
| 670-marketingskills-content-strategy-skill.md | content-strategy（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 154188；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/content-strategy |
| 671-marketingskills-programmatic-seo-skill.md | programmatic-seo（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 142259；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/programmatic-seo |
| 672-marketingskills-ai-seo-skill.md | ai-seo（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 140289；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/ai-seo |
| 673-marketingskills-copy-editing-skill.md | copy-editing（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 139607；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/copy-editing |
| 674-marketingskills-cold-email-skill.md | cold-email（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 120119；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/cold-email |
| 675-marketingskills-cro-skill.md | cro（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 80845；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/cro |
| 676-marketingskills-pricing-skill.md | pricing（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 71363；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/pricing |
| 677-marketingskills-launch-skill.md | launch（coreyhaines31/marketingskills） | coreyhaines31/marketingskills | 开源免费（MIT） | skills.sh 70673；仓库 54031 Star | https://github.com/coreyhaines31/marketingskills/tree/main/skills/launch |
| 678-anthropic-legal-review-contract-skill.md | review-contract（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/review-contract |
| 679-anthropic-legal-triage-nda-skill.md | triage-nda（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/triage-nda |
| 680-anthropic-data-sql-queries-skill.md | sql-queries（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/sql-queries |
| 681-anthropic-data-explore-data-skill.md | explore-data（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/explore-data |
| 682-anthropic-finance-variance-analysis-skill.md | variance-analysis（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/finance/skills/variance-analysis |
| 683-anthropic-sales-call-prep-skill.md | call-prep（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/sales/skills/call-prep |
| 684-anthropic-pm-write-spec-skill.md | write-spec（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/product-management/skills/write-spec |
| 685-anthropic-support-ticket-triage-skill.md | ticket-triage（anthropics/knowledge-work-plugins） | anthropics/knowledge-work-plugins | 开源免费（Apache-2.0） | 仓库 28678 Star | https://github.com/anthropics/knowledge-work-plugins/tree/main/customer-support/skills/ticket-triage |
| 686-addyosmani-spec-driven-development-skill.md | spec-driven-development（addyosmani/agent-skills） | addyosmani/agent-skills | 开源免费（MIT） | 仓库 104398 Star | https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development |
| 687-addyosmani-context-engineering-skill.md | context-engineering（addyosmani/agent-skills） | addyosmani/agent-skills | 开源免费（MIT） | 仓库 104398 Star | https://github.com/addyosmani/agent-skills/tree/main/skills/context-engineering |
| 688-addyosmani-code-review-and-quality-skill.md | code-review-and-quality（addyosmani/agent-skills） | addyosmani/agent-skills | 开源免费（MIT） | skills.sh 59559；仓库 104398 Star | https://github.com/addyosmani/agent-skills/tree/main/skills/code-review-and-quality |
| 689-addyosmani-security-and-hardening-skill.md | security-and-hardening（addyosmani/agent-skills） | addyosmani/agent-skills | 开源免费（MIT） | skills.sh 55851；仓库 104398 Star | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening |
| 690-addyosmani-frontend-ui-engineering-skill.md | frontend-ui-engineering（addyosmani/agent-skills） | addyosmani/agent-skills | 开源免费（MIT） | skills.sh 54193；仓库 104398 Star | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering |
| 691-addyosmani-performance-optimization-skill.md | performance-optimization（addyosmani/agent-skills） | addyosmani/agent-skills | 开源免费（MIT） | 仓库 104398 Star | https://github.com/addyosmani/agent-skills/tree/main/skills/performance-optimization |
| 692-trailofbits-differential-review-skill.md | differential-review（trailofbits/skills） | trailofbits/skills | 免费（CC BY-SA 4.0，署名并以相同方式共享） | 仓库 7462 Star | https://github.com/trailofbits/skills/tree/main/plugins/differential-review/skills/differential-review |
| 693-trailofbits-modern-python-skill.md | modern-python（trailofbits/skills） | trailofbits/skills | 免费（CC BY-SA 4.0，署名并以相同方式共享） | 仓库 7462 Star | https://github.com/trailofbits/skills/tree/main/plugins/modern-python/skills/modern-python |
| 694-trailofbits-property-based-testing-skill.md | property-based-testing（trailofbits/skills） | trailofbits/skills | 免费（CC BY-SA 4.0，署名并以相同方式共享） | 仓库 7462 Star | https://github.com/trailofbits/skills/tree/main/plugins/property-based-testing/skills/property-based-testing |
| 695-trailofbits-sharp-edges-skill.md | sharp-edges（trailofbits/skills） | trailofbits/skills | 免费（CC BY-SA 4.0，署名并以相同方式共享） | 仓库 7462 Star | https://github.com/trailofbits/skills/tree/main/plugins/sharp-edges/skills/sharp-edges |
| 696-trailofbits-semgrep-skill.md | semgrep（trailofbits/skills） | trailofbits/skills | 免费（CC BY-SA 4.0）；Semgrep 本体另有其许可与可选的 Pro 版 | 仓库 7462 Star | https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/semgrep |
| 697-trailofbits-supply-chain-risk-auditor-skill.md | supply-chain-risk-auditor（trailofbits/skills） | trailofbits/skills | 免费（CC BY-SA 4.0，署名并以相同方式共享） | 仓库 7462 Star | https://github.com/trailofbits/skills/tree/main/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor |
| 698-kdense-scientific-writing-skill.md | scientific-writing（K-Dense-AI/scientific-agent-skills） | K-Dense-AI/scientific-agent-skills | 开源免费（MIT） | 仓库 48284 Star | https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-writing |
| 699-kdense-literature-review-skill.md | literature-review（K-Dense-AI/scientific-agent-skills） | K-Dense-AI/scientific-agent-skills | 开源免费（MIT） | 仓库 48284 Star | https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/literature-review |
| 700-kdense-statistical-analysis-skill.md | statistical-analysis（K-Dense-AI/scientific-agent-skills） | K-Dense-AI/scientific-agent-skills | 开源免费（MIT） | 仓库 48284 Star | https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/statistical-analysis |
| 701-kdense-scientific-visualization-skill.md | scientific-visualization（K-Dense-AI/scientific-agent-skills） | K-Dense-AI/scientific-agent-skills | 开源免费（MIT） | 仓库 48284 Star | https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-visualization |
| 702-kdense-exploratory-data-analysis-skill.md | exploratory-data-analysis（K-Dense-AI 科研技能库） | K-Dense-AI/scientific-agent-skills | 开源免费（MIT） | 仓库 48284 Star | https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/exploratory-data-analysis |
| 703-kdense-peer-review-skill.md | peer-review（K-Dense-AI/scientific-agent-skills） | K-Dense-AI/scientific-agent-skills | 开源免费（MIT） | 仓库 48284 Star | https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/peer-review |
| 704-pm-skills-pre-mortem-skill.md | pre-mortem（phuryn/pm-skills） | phuryn/pm-skills | 开源免费（MIT） | 仓库 26868 Star | https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/pre-mortem |
| 705-pm-skills-prioritization-frameworks-skill.md | prioritization-frameworks（phuryn/pm-skills） | phuryn/pm-skills | 开源免费（MIT） | 仓库 26868 Star | https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/prioritization-frameworks |
| 706-pm-skills-north-star-metric-skill.md | north-star-metric（phuryn/pm-skills） | phuryn/pm-skills | 开源免费（MIT） | 仓库 26868 Star | https://github.com/phuryn/pm-skills/tree/main/pm-marketing-growth/skills/north-star-metric |
| 707-pm-skills-interview-script-skill.md | interview-script（phuryn/pm-skills） | phuryn/pm-skills | 开源免费（MIT） | 仓库 26868 Star | https://github.com/phuryn/pm-skills/tree/main/pm-product-discovery/skills/interview-script |
| 708-pm-skills-opportunity-solution-tree-skill.md | opportunity-solution-tree（phuryn/pm-skills） | phuryn/pm-skills | 开源免费（MIT） | 仓库 26868 Star | https://github.com/phuryn/pm-skills/tree/main/pm-product-discovery/skills/opportunity-solution-tree |
| 709-baoyu-xhs-images-skill.md | baoyu-xhs-images（JimLiu/baoyu-skills） | JimLiu/baoyu-skills | 开源免费（MIT）；生图需所用工具的生图能力或自备 API Key | 仓库 26521 Star | https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-xhs-images |
| 710-baoyu-infographic-skill.md | baoyu-infographic（JimLiu/baoyu-skills） | JimLiu/baoyu-skills | 开源免费（MIT）；生图需所用工具的生图能力或自备 API Key | 仓库 26521 Star | https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-infographic |
| 711-baoyu-cover-image-skill.md | baoyu-cover-image（JimLiu/baoyu-skills） | JimLiu/baoyu-skills | 开源免费（MIT）；生图需所用工具的生图能力或自备 API Key | 仓库 26521 Star | https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-cover-image |
| 712-baoyu-slide-deck-skill.md | baoyu-slide-deck（JimLiu/baoyu-skills） | JimLiu/baoyu-skills | 开源免费（MIT）；生图需所用工具的生图能力或自备 API Key | 仓库 26521 Star | https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-slide-deck |
| 713-baoyu-comic-skill.md | baoyu-comic（JimLiu/baoyu-skills） | JimLiu/baoyu-skills | 开源免费（MIT）；生图需所用工具的生图能力或自备 API Key | 仓库 26521 Star | https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-comic |
| 714-baoyu-translate-skill.md | baoyu-translate（JimLiu/baoyu-skills） | JimLiu/baoyu-skills | 开源免费（MIT） | 仓库 26521 Star | https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-translate |
| 715-vercel-find-skills-skill.md | find-skills（vercel-labs/skills） | vercel-labs/skills | 开源免费（MIT） | skills.sh 3782574；仓库 33644 Star | https://github.com/vercel-labs/skills/tree/main/skills/find-skills |
| 716-lark-doc-skill-feishu.md | lark-doc（larksuite/cli） | larksuite/cli | 开源免费（MIT）；调用飞书开放平台须遵守其协议 | skills.sh 466533；仓库 17610 Star | https://github.com/larksuite/cli/tree/main/skills/lark-doc |
| 717-lark-base-skill-feishu-bitable.md | lark-base（larksuite/cli） | larksuite/cli | 开源免费（MIT）；调用飞书开放平台须遵守其协议 | skills.sh 464302；仓库 17610 Star | https://github.com/larksuite/cli/tree/main/skills/lark-base |
| 718-lark-im-skill-feishu-messaging.md | lark-im（larksuite/cli） | larksuite/cli | 开源免费（MIT）；调用飞书开放平台须遵守其协议 | skills.sh 461244；仓库 17610 Star | https://github.com/larksuite/cli/tree/main/skills/lark-im |
| 719-google-gemini-api-skill-agent-platform.md | gemini-api（google/skills） | google/skills | 开源免费（Apache-2.0）；云资源按 Google Cloud 计费 | 仓库 21102 Star | https://github.com/google/skills/tree/main/skills/cloud/gemini-api |
| 720-google-bigquery-basics-skill.md | bigquery-basics（google/skills） | google/skills | 开源免费（Apache-2.0）；云资源按 Google Cloud 计费 | 仓库 21102 Star | https://github.com/google/skills/tree/main/skills/cloud/bigquery-basics |
| 721-google-cloud-run-basics-skill.md | cloud-run-basics（google/skills） | google/skills | 开源免费（Apache-2.0）；云资源按 Google Cloud 计费 | 仓库 21102 Star | https://github.com/google/skills/tree/main/skills/cloud/cloud-run-basics |
