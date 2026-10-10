# Skill 库目录（2026-10-10，分支 exp/skcode）

> AI 学习平台新增「Skill 库」板块：按平台整理的 Agent Skills 库目录（`/skills`），每个库一张卡片，附可复制的安装命令。
> 基于 `release/opt-1007`（= 线上）。**无 DDL、无新环境变量、无新依赖**，不动 nginx / cron / compose / Dockerfile。
> 代码改动见 `git log --oneline release/opt-1007..exp/skcode`。本文写于上线前。

## 一、是什么、怎么放的

「Skill 库」**不是新的内容类型**：它就是一条 AI 应用（`type=APP` + `app_specs`），多挂一个主题标签 `agent-skills`。

| 项 | 做法 |
|---|---|
| 目录页 | `/skills`：只列挂了 `agent-skills` 标签、非作者自荐的应用 |
| 详情页 | 仍在 `/apps/{id}-{slug}`（地址不变、不用迁移），但面包屑、标题、应用卡片、安装命令区块、相关内容按 Skill 库的样子出 |
| `/apps` | 总览默认**不列** Skill 库（两个目录各管各的），第一页有一张「找 Skill 库？」卡片指过去；`/skills` 底部指回 `/apps` |
| 作者自荐 | `selfPromo=true` 的不进 `/skills`（推广与普通分享隔离，设计 §9.1），留在 `/apps/showcase`，详情页照旧出披露条 |
| 渠道分站 | 与 `/apps` 完全一样：`skills/layout.tsx` 调 `notFoundUnlessModule('learn')`，metadata 包 `moduleMetadata`，结构化数据走 `PlatformJsonLd`（渠道站不输出） |

`app_specs` 字段复用（**内容约定**，写种子文件的人照这个写）：

```yaml
# docs/内容平台/种子内容/apps/{3NN}-{slug}.md（编号 300–399）
name: anthropics/skills                       # 库名
url: https://github.com/anthropics/skills     # GitHub 仓库或项目主页
pricing: 开源免费（Apache-2.0）                  # 授权与价格（详情页显示为「许可」）
platforms: Claude Code / claude.ai / Claude API / Codex   # 适用的 Agent，用 / 分隔（详情页显示为「适用」）
trialNote: /plugin marketplace add anthropics/skills      # 一行安装命令，或最短的上手方式（≤200 字）
products: [claude, codex]                     # 0–2 个
topics: [agent-skills, coding]                # 必须有 agent-skills，另可加 0–2 个
```

写 `trialNote` 的三种写法（`lib/content/skill-lib.ts` 的 `parseInstall`，都有自测）：

1. **整句就是命令**：`/plugin marketplace add a/b`、`npx skills add a/b`、`git clone … ~/.claude/skills/x`。命令后面可以跟中文说明：`npx skills add a/b（需要 Node 18 以上）` → 命令 + 说明。
2. **多条命令或命令夹在句子里：用反引号**。每一段反引号是一条命令（按顺序一行一条，「复制」一次复制全部）：
   `` trialNote: "`/plugin marketplace add o/m` 然后 `/plugin install s@m`" ``。**以反引号开头的值在 YAML 里必须加引号**。
3. **不是命令**（「在 claude.ai 的 Customize → Skills 里上传 ZIP」）：原样当「上手方式」显示，不给复制按钮。

写正文时注意：种子校验的敏感词是子串匹配，「一**套现**成的」会命中「套现」（本分支的样例就踩了一次），换个说法。

## 二、标签：`agent-skills`，TOPIC，**不给 facet**

`{ slug: 'agent-skills', name: 'Skill 库', kind: 'TOPIC' }` 加进 `DEFAULT_TAGS`（不改表；线上由 `ensureContentDefaults` 或导入脚本自动建这一行）。

为什么不给 facet、以及它不会弄乱提示词筛选条的四道保险：

- 提示词三大类页（`/prompts/image|video|text`）的主题行只列 `facet === 当前大类` 的标签：没有 facet 就进不去。
- 提示词总览（`/prompts`）的筛选条本来只列「至少有一条公开**提示词**」的标签，Skill 库只挂在应用上，天然不出现；另在 `navTagsOf` 里按 slug 显式排除（防误挂）。
- 发帖表单：提示词的主题里不列它（应用表单的「场景」里可以选——用户也能投稿一个 Skill 库，照常先审后发）。
- 服务端 `write.checkTyped`：提示词 / 教程挂这个标签直接拒绝。

它的聚合页是 `/skills`：`ui.hubHref` 对这个 slug 返回 `/skills`（详情页的标签胶囊、学习首页都走它），`/prompts/t/agent-skills` 308 到 `/skills`，内容 sitemap 的标签循环跳过它。学习首页「按场景找」里不列它（它有自己的区块）。
后台停用这个标签（status=0）时：这些条目回到 `/apps`，`/skills` 变空——不会两边都找不到。

## 三、页面

### `/skills`（`src/app/(shop)/skills/page.tsx`，服务端组件，`force-dynamic`，**没有 loading.tsx**）

- 面包屑：首页 › AI 学习 › Skill 库（可见面包屑与 BreadcrumbList 逐级一致）。
- 页首：H1 + 导语（Agent Skills 是什么：带 SKILL.md 的文件夹，Claude Code / claude.ai / Codex 等按需加载）+「先看入门教程」+ 条数与最近更新。
- 「怎么用这一页」三步（按平台挑 → 复制安装命令 → 先看再装）。手机上是一张卡片里的三行，目录不会被说明挤到三屏以外。
- 平台筛选：全部 / Claude Code / claude.ai / Codex / 通用，带条数，`?platform=claude-code` 这类普通链接（服务端渲染）。归组规则见 `skillPlatformsOf`：只看 `platforms` 那一行字，认不出时才退到产品标签；点名的 Agent 家数 ≥ 3 或明说「通用」的另归「通用」；一个都对不上的也归「通用」，免得哪个筛选都找不到它。
- 卡片：库名（进详情）、许可、一句话摘要、适用平台、**安装命令（代码块 + 复制按钮）**、「查看介绍与用法」、仓库外链（`rel="ugc nofollow noopener noreferrer"`，与应用详情页一致；GitHub 写「GitHub 仓库」，其余写「项目主页」，不写「官网」）。
- 分页：24 个 / 页。目录量级是几十个库，所以一次取齐、筛选与分页在内存里做（上限 300，超了告警）。
- 「新手从这里开始」：按 slug 找 `claude-skills`、`chatgpt-skills` 两篇，再补标题里带 Skill / 技能的教程（最多 6 篇），加 `/guides`、`/prompts` 两个入口。放在目录之后。
- 底部：指回 `/apps` 的卡片；一句第三方链接与资料来源的说明。
- 复制按钮（`components/learn/copy-client.tsx`）是这一页唯一的客户端交互：命令文字在服务端 HTML 里；浏览器不给写剪贴板时退而选中命令文字。

### 详情页（`content-detail-page.tsx`，挂了 `agent-skills` 且非自荐时）

- 面包屑：首页 › AI 学习 › Skill 库 › 当前。
- `<title>`：标题里有库名就原样用，没有就「库名：标题」——不套「X 怎么样：」这种应用点评的句式。
- 应用卡片：眉标「Agent Skills · Skill 库」，字段名「许可 / 适用」，按钮「打开 GitHub 仓库 ↗」/「打开项目主页 ↗」。
- **安装命令**单独一个醒目区块（标题栏 + 复制命令 + 等宽代码 + 一句使用说明）。
- 相关内容只有「其他 Skill 库」，加「查看全部 Skill 库 →」。普通应用的相关内容里不再混进 Skill 库。
- 「返回」回 `/skills`。结构化数据仍是 DiscussionForumPosting + BreadcrumbList（未改）。

### 其他入口

- `/learn`：四个入口与赞助位之后、提示词各区块之前，加一块「给 Claude Code、Codex 装上现成的技能包」（前 4 个库 + 已收录 N 个 + 浏览 Skill 库）。**一个库都没公开时整块不出**。
- 页头：「AI学习」的高亮范围加 `/skills`。页脚「商品与服务」栏的学习入口加「Skill 库」。
- `/prompts`、`/guides` 总览第一页：筛选条下一行小字指到 `/skills`。
- `/learn/search`：原有的「应用名 / 标签名」匹配已经能搜到 Skill 库（实测搜 `superkit`、`fixture-org` 命中），未改。

## 四、SEO

**关键词实测**（2026-10-10，`suggestqueries.google.com/complete/search?client=firefox&hl=zh-CN`；条数 = 去掉回显后的联想条数，是联想广度，**不是搜索量**）：

| 查询词 | 条数 | 联想（节选） |
|---|---|---|
| claude skills 推荐 | 9 | claude skills 推荐 github、claude code skills 推荐、claude code 的 skills 推荐、claude skills 官方 推荐、awesome claude skills 推荐 |
| claude skills | 9 | claude skills 推荐、claude skills 市场、claude skills github、claude skills 网站、claude skills marketplace、claude skills 使用 教程 |
| claude code skills | 9 | claude code skills 推荐、claude code skill 市场、claude code skills 最佳实践、claude code skills 教程、claude code skills 安装 |
| agent skills | 9 | agent skills marketplace、agent skills 市场、agent skills 规范、agent skills 推荐、agent skills 是什么 |
| skill 库 | 10 | skill 库 推荐、skill 库 github、claude skill 库、claude code skill库、claude 官方 skill 库、agent skill 库、codex skill 库 |
| skills 库 | 10 | skills 库 推荐、agent skills 库、claude skills 库、claude code skills 库、codex skills 库 |
| codex skills | 9 | codex skills 推荐、codex skills 仓库、codex skills 市场、codex skills 教程、codex skills 怎么用、codex skills 安装 |
| claude skills 安装 | 9 | claude skills 安装教程、claude code 安装 skills、claude code 怎么 安装 skills |
| claude skills 市场 | 9 | claude code skills 市场、claude skills 官方 市场 |
| claude 技能 | 9 | claude 技能包、claude 技能市场、claude 技能 推荐、claude 技能 库 |
| claude skills 教程 | 8 | claude code skills 教程、claude skills 使用 教程、claude skills 安装 教程 |
| claude code skills 推荐 | 6 | claude code 的 skills 推荐、claude code 编程 skills 推荐 |
| agent skills 推荐 | 5 | ai agent skills 推荐、hermes agent skills 推荐 |
| claude skills 大全 | 3 | claude code skills 大全、claude skills 大全 pdf |
| claude skills 合集 | 2 | claude code skills 合集 |
| skill库（不带空格） | 1 | claude skill库 |
| claude skills 怎么用 / 下载 | 0 | — |

四个候选词（claude skills 推荐、claude code skills、agent skills、skill 库）都有联想，都用上了：

- `<title>`：`Claude Skills 推荐：Claude Code、Codex 可用的 Agent Skill 库 - 贝果科技`
- H1：`Claude Skills 推荐 Agent Skill 库`（前半白字、后半强调色，强调词整体换行不从中间断）
- description：`按平台整理的 Agent Skill 库目录：每个库写明适用平台（Claude Code、claude.ai、Codex 等）、开源许可和一行安装命令，附中文介绍、包含哪些 Skill 与使用注意。`
- 「大全 / 合集 / 怎么用 / 下载」联想少或为 0，不进标题。「市场」有联想，但本页是编辑整理的目录、不是可上架的市场，不用这个词。

**收录闸门**（阈值未动）：与 `/apps`、`/prompts` 同一个口径——`isHubIndexable('ROOT', 0, 可收录的 Skill 库条数)`，即可收录条目 ≥ 5 才 `index`，否则 `noindex,follow`；条数走 `countIndexableCached`（5 分钟缓存）。`/sitemap-content.xml` 用同一个判定决定放不放 `/skills`。
`?page=N` 的 canonical 指向自己；`?platform=` 是同一批内容的子集：canonical 指回 `/skills`、不收录。越界页码在 metadata 阶段 404。条目本身走原有的 APP 质量门槛（种子格式全部满足）。

顺带对齐了一处：sitemap 判 `/apps` 时原来数的是全部可收录应用（含被精选的作者自荐），现在与页面自己的 robots 判定同一批（不含自荐、不含 Skill 库）。

**结构化数据**（批 2 约定）：`collectionPageJsonLd`（CollectionPage + ItemList，ItemList 只放这一页看得见的库的 url 与 name）+ BreadcrumbList + 同页输出被引用的 WebSite、Organization（没有悬空 @id）。metadata 走 `pageOg` 工厂（og:title 与 `<title>` 同句、带 site_name / locale / 分享图 / twitter）。

## 五、确认无 DDL、无新环境变量、无新依赖

`git diff release/opt-1007..HEAD -- prisma/ docker-compose.yml Dockerfile nginx/ cron/ package.json package-lock.json` 为空。
刻意没碰：`use-lite.ts`、tailwind `lite:` 变体、`globals.css`（整份未改，末尾轻量模式块逐字不变）、成交弹窗、收录闸门阈值、学习平台的 loading 边界（仍然没有 loading.tsx）。新增样式全部是 Tailwind 工具类 + 已有的 `learn-*` 类；入场只用 `learn-in`（只动 transform），没有 `opacity:0`、没有毛玻璃 / 大模糊。

## 六、上线注意

1. **合并顺序**：种子文件里的 `topics: [agent-skills]` 要过 `build-seed-bundle` 的标签校验，所以**先合本分支，再编译种子包**（否则报「不是 TOPIC 标签」）。
2. **定时放量**：Skill 库条目若随 `--schedule` 进队列，会和其他内容一起按每天 40 条慢慢放出来，`/skills` 上线头几天可能是空的或只有一两个库（空目录页面是「Skill 库正在整理中」+ noindex，学习首页那一块不出）。想上线当天就有内容：导入后在后台 `/admin/forum` 的「定时发布队列」筛出这批条目手动通过（= 提前放出），或「立即放出」。满 5 个可收录条目后 `/skills` 才 index、才进 sitemap（有 5 分钟缓存）。
3. 上线后检查：
   ```bash
   B=https://bigolab.com
   curl -s $B/skills | grep -oE '<title>[^<]*</title>|name="robots" content="[^"]*"|rel="canonical" href="[^"]*"'
   curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' $B/prompts/t/agent-skills     # 308 → /skills
   curl -s $B/apps | grep -c '找 Skill 库？'                                              # ≥1
   npx tsx scripts/check-jsonld.ts --base $B      # 固定查 /skills、/apps
   npx tsx scripts/check-seo-copy.ts --base $B    # /skills、/apps 进了固定清单
   npx tsx scripts/check-seo-b.ts --base $B       # /skills 进了首帧可见 STRICT，另查 H1 在服务端 HTML 里
   ```
   注意：这三个脚本现在固定抓 `/skills`，**对还没上线本分支的线上跑会多一条 404 失败**，属预期。
4. 回滚：镜像回滚即可。库里只多一行 `tags`（`agent-skills`）与若干普通应用条目；旧代码把它当成一个没有 facet 的主题标签，这些条目照常显示在 `/apps`。

## 七、测试（本分支，2026-10-10，Windows）

- `npx tsc --noEmit`：0 错误。`node scripts/check-tenant-boundary.mjs`：零违规。
- `npx tsx scripts/check-content-policy.ts`：229 通过 0 失败。新增 36 条：什么算 Skill 库、`/skills` 的 ROOT 门槛、平台分组 11 条、安装命令识别 9 条、外链文案，以及用 `scripts/fixtures/seed-apps/skills/` 的三个样例实际跑 `build-seed-bundle`（`agent-skills` 是合法 TOPIC 标签且没有 facet、三个样例的命令 / 平台解析符合预期）。
- 本地库：`.env` 指向的 `beiguo_content_dev` 比本分支的 schema 少 10 列（`forum_posts.source_tenant_id` 等，内容模块下放与发票项目那两批的 DDL），导入会报 P2022；所以照 `beiguo_dev_jiema` / `beiguo_dev_wxbot` 的做法复制了一份 `beiguo_dev_skcode`，在副本上 `db push`（只加列）后导入三个样例验证，**没有改动共享库的结构**。验证完副本已删除。
- `next dev -p 3061`（`CONTENT_INDEXING_OPEN=1`）：
  - `/skills`：3 个样例时 `noindex,follow`、不在 sitemap；临时再导 24 个克隆（共 27）后，5 分钟缓存过期变 `index,follow`、进 sitemap、分页 24 + 3、`?page=3` 404、`?platform=codex` canonical 指回 `/skills` 且 noindex、`?platform=nope` 当全部。
  - 详情页：面包屑「首页 / AI 学习 / Skill 库 / …」、标题不带「怎么样」、安装命令区块、「其他 Skill 库」、外链 rel。
  - `/apps` 不再列 Skill 库、有「找 Skill 库？」；`/learn` 出 Skill 库区块（已收录 N 个）、「按场景找」里没有它；`/prompts/t/agent-skills` 308；`/prompts`、`/guides` 有小指路；搜索命中。
  - 内置浏览器 1440 与 375 / 390 宽各看了 `/skills`、详情页、`/learn`、`/apps`：无横向滚动、无水合报错（控制台只有未登录的 401 与本地缺图的 404）；成交弹窗照常出现。内置浏览器不允许写剪贴板，复制按钮在那里走的是「选中命令文字」的退路；「已复制」状态未能在真实浏览器里点一次，上线后请人工点一下。
- `check-jsonld --base`：44 页全部通过（含 `/skills` 的 CollectionPage / 面包屑 / ItemList 逐项期望、6 个 Skill 库详情页）。`check-seo-b --base`：107 通过 0 失败（2 条原有告警）。`check-seo-copy --base`：没有新增违规（克隆样例的摘要重复只在测试数据里出现，删掉克隆后复测通过）。
- **没跑**：`itest-tenant`（需渠道夹具）；渠道站上的 `/skills` 只做了代码层面对齐（与 `/apps` 同一套 layout / metadata / JSON-LD 包装），没有起渠道 Host 实测。
- 构建：见文末「构建」一节。

## 八、文件清单

新增：
- `src/lib/content/skill-lib.ts`：纯函数（标签 slug、`isSkillLibrary`、平台分组、安装命令解析、外链文案）
- `src/lib/content/skills.ts`：取数（`listSkillLibraries`、`skillLibraryPreview`、`skillStarterGuides`）
- `src/app/(shop)/skills/{layout,page}.tsx`
- `src/components/learn/skills-ui.tsx`（`SkillCard` / `SkillGrid` / `SkillRows` / `InstallCommand` / `DirectoryCrossLink` / `SkillsHint`）、`src/components/learn/copy-client.tsx`
- `scripts/fixtures/seed-apps/skills/apps/s0{1,2,3}-*.md`（测试夹具，不是正式内容）

修改：
- `lib/content/tags.ts`（加标签）、`queries.ts`（`SKILL_WHERE` / `NOT_SKILL_WHERE`、`listContent` / `listHot` 的 `excludeSkills`、`relatedContent`、`isSkillRow`、学习首页应用区块排除）、`write.ts`（标签只能挂应用）
- `components/content/content-list-page.tsx`（`/apps` 排除 + 互相指路）、`content-detail-page.tsx`（Skill 库的面包屑 / 标题 / 卡片 / 安装区块）
- `components/learn/ui.tsx`（`hubHref`、导出 `hueOf`、H1 强调词整体换行）、`components/forum/post-form.tsx`
- `app/(shop)/learn/page.tsx`、`app/(shop)/prompts/t/[slug]/page.tsx`（308）、`app/sitemap-content.xml/route.ts`
- `components/layout/header.tsx`、`footer.tsx`
- `scripts/check-content-policy.ts`、`check-jsonld.ts`、`check-seo-copy.ts`、`check-seo-b.ts`

## 九、留给后续

- `/skills` 没有站方写的长介绍（ROOT 级 hub 不要求）。库多起来后可以给每个平台分组做成独立地址（`/skills/claude-code`）并各写一段介绍，再按 hub 门槛放开收录；现在的 `?platform=` 只是筛选视图。
- 卡片上没有「包含多少个 Skill」「GitHub star」这类数字：`app_specs` 没有对应字段，硬塞进 pricing / platforms 会破坏分组；需要时加列（只加）。
- 详情页的结构化数据仍是 DiscussionForumPosting；要不要给 Skill 库换成 SoftwareSourceCode / SoftwareApplication，等有收录数据再看。
- 搜索结果页里应用（含 Skill 库）仍归在「教程与讨论」一组下面。

## 十、构建

本地（Windows，Node 24，`rm -rf .next` 后冷构建）：`NODE_OPTIONS=--max-old-space-size=1024 npm run build` **一次通过，用时 2 分 27 秒，没有 OOM**。prebuild 的边界检查零违规；路由表里 `/skills` 是 `ƒ`（按需渲染），首屏 JS 98.2 kB（与 `/prompts`、`/guides` 相同：这一页新增的客户端代码只有复制按钮）。
线上构建堆仍按 1024MB 即可，不需要调。构建后用 `next start -p 3061` 抽查：`/skills` 200（H1 在服务端 HTML 里、没有 `opacity:0`）、`/prompts/t/agent-skills` 308、`/apps` 与 Skill 库详情页 200。

本地数据收尾：副本库 `beiguo_dev_skcode` 已 DROP；共享库 `beiguo_content_dev` 里第一次导入尝试（在建帖那一步因缺列失败）留下的一行 `tags(agent-skills)` 已删除，帖子数前后都是 421。
