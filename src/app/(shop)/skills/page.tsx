import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ArrowUpRight, BookOpen, Camera } from 'lucide-react'
import { MIN_HUB_ITEMS, isHubIndexable } from '@/lib/content/policy'
import { SKILL_WHERE, countIndexableCached } from '@/lib/content/queries'
import { SKILLS_NAME, SKILLS_PATH, SKILL_PAGE_SIZE, SKILL_PLATFORMS, skillPlatformParam, type SkillPlatform } from '@/lib/content/skill-lib'
import { listSkillLibraries, skillStarterGuides, type SkillLibraryCard, type StarterGuide } from '@/lib/content/skills'
import { SITE_NAME } from '@/lib/product-seo'
import { pageOg } from '@/lib/seo/og'
import { breadcrumbJsonLd, collectionPageJsonLd, webSiteJsonLd, type Crumb } from '@/lib/seo/graph'
import { siteOrganizationJsonLd } from '@/lib/seo/pillars'
import { siteOrigin } from '@/lib/news/format'
import { PlatformJsonLd } from '@/components/seo/platform-json-ld'
import { Crumbs, Empty, FilterBar, LEARN_HOME, LearnPage, PageHead, Pager, PrimaryAction, SectionHead, pageParam } from '@/components/learn/ui'
import { DirectoryCrossLink, SkillGrid } from '@/components/learn/skills-ui'
import { moduleMetadata } from '@/lib/storefront/module-meta'

/**
 * Skill 库目录（2026-10-10，docs/内容平台/Skill库-1010.md）。
 *
 * 列的是挂了 agent-skills 标签的 AI 应用（站方按官方仓库 / 文档整理的 Skill 库介绍），每个库一张卡片：
 * 库名、一句话、适用平台、许可、可复制的安装命令、「查看介绍与用法」（详情仍在 /apps/{id}-{slug}）、仓库外链（nofollow）。
 * 全部服务端直出；不加 loading.tsx（它会把 H1 挡在流式响应后面，不执行 JS 的爬虫看不到）。
 *
 * 收录：与 /apps、/prompts 同一个口径——policy.isHubIndexable 的 ROOT 门槛（可收录的条目 ≥ 5），不够就 noindex,follow；
 * /sitemap-content.xml 用同一个判定。带 ?platform= 的筛选视图是同一批内容的子集：canonical 指回 /skills、不收录。
 *
 * 关键词（2026-10-10 Google 下拉实测，hl=zh-CN，联想条数是广度不是搜索量；原始数据见上面那份文档）：
 * claude skills 推荐 9、claude code skills 9、agent skills 9、skill 库 10（含 claude skill 库 / agent skill 库 / codex skill 库）、codex skills 9。
 */
export const dynamic = 'force-dynamic'

const H1_MAIN = 'Claude Skills 推荐'
const H1_ACCENT = 'Agent Skill 库'
const TITLE = `Claude Skills 推荐：Claude Code、Codex 可用的 Agent Skill 库 - ${SITE_NAME}`
const DESCRIPTION =
  '按平台整理的 Agent Skill 库目录：每个库写明适用平台（Claude Code、claude.ai、Codex 等）、开源许可和一行安装命令，附中文介绍、包含哪些 Skill 与使用注意。'
const LEDE =
  'Agent Skills 是一个个带 SKILL.md 的文件夹：里面是写给 AI 的操作说明，可以附脚本和模板。Claude Code、claude.ai、Codex 等会在用得上时按需加载，不用每次重新交代。这里按平台整理了值得装的 Skill 库，每个都附安装命令和中文用法。'
const NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

/** 首页 → AI 学习 → Skill 库（可见面包屑与 BreadcrumbList 逐级一致） */
const CRUMBS: Crumb[] = [{ name: '首页', path: '/' }, { name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: SKILLS_NAME }]

/** 平台筛选视图的标题前缀 */
const PLATFORM_HEAD: Record<SkillPlatform, string> = {
  'claude-code': 'Claude Code 可用的',
  'claude-ai': 'claude.ai 可用的',
  codex: 'Codex 可用的',
  general: '多平台通用的',
}

type Props = { searchParams: { page?: string | string[]; platform?: string | string[] } }

function view(all: SkillLibraryCard[], platform: SkillPlatform | null, page: number) {
  const filtered = platform ? all.filter((c) => c.platformKeys.includes(platform)) : all
  const totalPages = Math.max(1, Math.ceil(filtered.length / SKILL_PAGE_SIZE))
  return { filtered, totalPages, items: filtered.slice((page - 1) * SKILL_PAGE_SIZE, page * SKILL_PAGE_SIZE) }
}

async function pageMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageParam(searchParams.page)
  const platform = skillPlatformParam(searchParams.platform)
  const [all, indexableN] = await Promise.all([
    listSkillLibraries().catch(() => [] as SkillLibraryCard[]),
    countIndexableCached(SKILL_WHERE, MIN_HUB_ITEMS.ROOT),
  ])
  // 越界页码在 metadata 这一步 404（与页面体同一口径）
  if (page > 1 && page > view(all, platform, page).totalPages) notFound()
  const indexable = !platform && isHubIndexable('ROOT', 0, indexableN)
  const path = page > 1 ? `${SKILLS_PATH}?page=${page}` : SKILLS_PATH
  // 筛选视图的标题带上平台名（不收录，但浏览器标签页与分享卡片要分得清）
  const title = (platform ? `${PLATFORM_HEAD[platform]} Agent Skill 库 - ${SITE_NAME}` : TITLE) + (page > 1 ? `（第 ${page} 页）` : '')
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description: DESCRIPTION,
    // 每一页的 canonical 指向自己（Google 分页文档）；平台筛选指回不带参数的地址
    alternates: { canonical: platform ? SKILLS_PATH : path },
    ...(indexable ? {} : { robots: NOINDEX }),
    ...pageOg({ title, description: DESCRIPTION, path: platform ? SKILLS_PATH : path }),
  }
}

function StarterBlock({ guides }: { guides: StarterGuide[] }) {
  return (
    <section className="mb-10 mt-16 lg:mt-24">
      <SectionHead title="新手从这里开始" desc="先弄清 Skill 是什么、装在哪、怎么触发，再回来挑库" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="learn-card px-5 py-2 lg:px-7 lg:py-3">
          {guides.length > 0 ? (
            <ol className="divide-y divide-white/[0.07]">
              {guides.map((g, i) => (
                <li key={g.path}>
                  <Link href={g.path} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-4">
                    <span className="text-sm tabular-nums text-white/25">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="block text-[15.5px] font-medium leading-snug text-white/90 group-hover:text-white">{g.title}</span>
                      {g.excerpt && <span className="mt-1 block truncate text-sm text-white/45">{g.excerpt}</span>}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-white/30 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-6 text-sm leading-relaxed text-white/50">Skill 的入门教程正在整理，先到教程页看看 Claude Code 与 Codex 的上手文章。</p>
          )}
        </div>
        <div className="grid gap-3">
          {[
            { href: '/guides', icon: BookOpen, t: '全部教程', s: 'Claude、Claude Code、Codex、ChatGPT 的功能教程与踩坑记录' },
            { href: '/prompts', icon: Camera, t: '提示词库', s: '还没到写 Skill 的程度？先拿可复制的提示词用起来' },
          ].map((x) => (
            <Link key={x.href} href={x.href} className="learn-card learn-lift group flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white/80 transition-colors group-hover:bg-white group-hover:text-black">
                <x.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{x.t}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-white/45">{x.s}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 「怎么用这一页」三步（与教程《Claude Skills 是什么、怎么装》的说法一致；claude.ai 的菜单会变，所以写「以当前界面为准」） */
const HOW_TO = [
  {
    t: '按平台挑一个库',
    d: '卡片上写着它适用于哪些 Agent、用什么许可发布。一个库通常打包了一组 Skill，先看「介绍与用法」里列的清单，再决定装不装。',
  },
  {
    t: '复制安装命令',
    d: '以 / 开头的命令在 Claude Code 会话里输入，其余在终端执行。claude.ai 网页版在 Customize → Skills 里添加或上传 ZIP（菜单以当前界面为准）。',
  },
  {
    t: '先看再装',
    d: 'Skill 平时只占「名称 + 一句话描述」的上下文，触发时才读全文；但它可以带可执行脚本。第三方库装之前，先看一遍 SKILL.md 和脚本在做什么。',
  },
]

export default async function SkillsPage({ searchParams }: Props) {
  const page = pageParam(searchParams.page)
  const platform = skillPlatformParam(searchParams.platform)
  // 目录本身查不出来时降级成空目录（页面其余部分照常），不让整页 500
  const [all, guides] = await Promise.all([
    listSkillLibraries().catch((e) => {
      console.error('[skills]', e)
      return [] as SkillLibraryCard[]
    }),
    skillStarterGuides().catch((e) => {
      console.error('[skills guides]', e)
      return [] as StarterGuide[]
    }),
  ])
  const { filtered, totalPages, items } = view(all, platform, page)
  if (page > 1 && page > totalPages) notFound()

  const hrefOf = (k: SkillPlatform | null) => (k ? `${SKILLS_PATH}?platform=${k}` : SKILLS_PATH)
  const chips = [
    { name: '全部', href: hrefOf(null), count: all.length },
    ...SKILL_PLATFORMS.map((p) => ({ name: p.label, href: hrefOf(p.key), count: all.filter((c) => c.platformKeys.includes(p.key)).length })).filter(
      (x) => x.count > 0 || x.href === hrefOf(platform),
    ),
  ]
  const latest = all.reduce<string | null>((m, c) => (!m || c.createdAt > m ? c.createdAt : m), null)
  const path = page > 1 ? `${SKILLS_PATH}?page=${page}` : SKILLS_PATH

  return (
    <>
      {/* CollectionPage + ItemList（只放这一页看得见的库：url 和 name）+ BreadcrumbList；isPartOf / publisher 引用的 WebSite、Organization 同页输出（批 2 约定：页内没有悬空 @id） */}
      <PlatformJsonLd
        data={[
          ...collectionPageJsonLd({
            path: platform ? SKILLS_PATH : path,
            name: `${H1_MAIN}：${H1_ACCENT}`,
            description: DESCRIPTION,
            items: items.map((c) => ({ path: c.path, name: c.name })),
          }),
          breadcrumbJsonLd(CRUMBS),
          webSiteJsonLd(),
          await siteOrganizationJsonLd(),
        ]}
      />
      <LearnPage>
        <Crumbs crumbs={CRUMBS} />
        <PageHead
          eyebrow="Agent Skills · Skill 库"
          title={H1_MAIN}
          accent={H1_ACCENT}
          lede={LEDE}
          action={guides[0] ? <PrimaryAction href={guides[0].path}>先看入门教程</PrimaryAction> : <PrimaryAction href="/guides">先看教程</PrimaryAction>}
          stats={[
            { label: '个 Skill 库', value: all.length },
            { label: '最近更新', value: latest ? `${latest.slice(0, 4)}.${latest.slice(5, 7)}` : '—' },
          ]}
        />

        {/* 怎么用这一页：一张卡片三步。手机上是紧凑的三行（目录本身不能被说明挤到三屏以外），桌面三列 */}
        {page === 1 && !platform && (
          <section aria-label="怎么用这一页" className="learn-card mb-12 lg:mb-16">
            <ol className="grid divide-y divide-white/[0.07] md:grid-cols-3 md:divide-x md:divide-y-0">
              {HOW_TO.map((s, i) => (
                <li key={s.t} className="grid grid-cols-[2rem_1fr] gap-x-2 px-5 py-4 md:block md:p-6">
                  <p className="pt-0.5 text-sm tabular-nums leading-6 text-white/30">{String(i + 1).padStart(2, '0')}</p>
                  <div>
                    <h2 className="text-[16px] font-semibold leading-6 tracking-tight md:mt-3 md:text-[17px]">{s.t}</h2>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55 md:mt-2 md:text-sm">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <SectionHead
          title={platform ? `${PLATFORM_HEAD[platform]} Skill 库` : '全部 Skill 库'}
          desc="精选在前，其余按收录时间排；安装命令以各库仓库的最新说明为准"
        />
        {all.length > 0 && <FilterBar groups={[{ label: '平台', items: chips }]} active={hrefOf(platform)} />}

        {items.length === 0 ? (
          all.length === 0 ? (
            <Empty title="Skill 库正在整理中" desc="第一批库的介绍与安装方法很快上线，可以先看入门教程。" href={guides[0]?.path ?? '/guides'} cta="先看入门教程" />
          ) : (
            <Empty title="这个平台下还没有收录的库" desc="换一个平台看看，或者浏览全部 Skill 库。" href={SKILLS_PATH} cta="查看全部 Skill 库" />
          )
        ) : (
          <SkillGrid items={items} />
        )}
        <Pager basePath={SKILLS_PATH} page={page} totalPages={totalPages} query={platform ? `platform=${platform}` : ''} />

        {filtered.length > 0 && <p className="mt-10 text-[13px] leading-relaxed text-white/40">页面里的仓库链接指向第三方站点，库的内容与许可以原仓库为准；各库的介绍由本站依据其仓库与公开文档整理，注明资料核对日期。</p>}

        {/* 新手入口放在目录之后：页首已经有「先看入门教程」按钮，这里是给看完目录还没拿定主意的人 */}
        {page === 1 && !platform && <StarterBlock guides={guides} />}

        <div className={page === 1 && !platform ? '' : 'mt-14'}>
          <DirectoryCrossLink to="apps" />
        </div>
      </LearnPage>
    </>
  )
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(props: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  return moduleMetadata(await pageMetadata(props))
}
