/**
 * Skill 库目录的服务端积木（/skills、应用详情页的安装命令区块、各列表页互相指路的卡片，2026-10-10）。
 *
 * 沿用学习平台的设计语言（learn-card / learn-chip / learn-eyebrow、发丝线、白色药丸主按钮），不新增全局样式。
 * 全部是服务端组件：库名、摘要、平台、许可、安装命令、链接都在服务端 HTML 里；唯一的交互是「复制」（copy-client.tsx）。
 * 首帧可见：不写 opacity:0，入场只用 learn-in（只动 transform）。不用毛玻璃 / 大面积模糊（手机端轻量模式）。
 */
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Boxes, LayoutGrid, Star, TerminalSquare } from 'lucide-react'
import type { SkillInstall } from '@/lib/content/skill-lib'
import type { SkillLibraryCard } from '@/lib/content/skills'
import { CopyButton } from './copy-client'
import { hueOf } from './ui'

/** 外链 rel：与应用详情页的普通分享一致（content-detail-page 的 appRel） */
export const SKILL_REPO_REL = 'ugc nofollow noopener noreferrer'

/**
 * 安装命令。chip：卡片里的一行（过长横向滚动，不撑破卡片）；block：详情页的醒目区块。
 * trialNote 不是命令（「在 claude.ai 的 Customize → Skills 里上传 ZIP」这类）时只显示说明，不给复制按钮。
 */
export function InstallCommand({
  install,
  variant = 'chip',
  id,
}: {
  install: SkillInstall
  variant?: 'chip' | 'block'
  /** 命令文字所在元素的 id（一页多张卡片时各不相同）：浏览器不给写剪贴板时，复制按钮退而选中它 */
  id: string
}) {
  const { commands, note } = install
  if (!commands.length && !note) return null
  const text = commands.join('\n')

  if (variant === 'chip') {
    if (!commands.length) {
      return (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-black/30 px-3.5 py-2.5 text-[13px] leading-relaxed text-white/60">
          <span className="text-white/40">上手方式 </span>
          {note}
        </p>
      )
    }
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/30 py-1.5 pl-3.5 pr-1.5">
        <TerminalSquare className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
        <code id={id} className="block min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[12.5px] leading-6 text-white/85 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {text}
        </code>
        <CopyButton text={text} selectId={id} />
      </div>
    )
  }

  const slash = commands.some((c) => c.startsWith('/'))
  return (
    <section aria-label={commands.length ? '安装命令' : '上手方式'} className="learn-card mt-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3 lg:px-6">
        <p className="learn-eyebrow">{commands.length ? 'Install · 安装命令' : 'Get started · 上手方式'}</p>
        {commands.length > 0 && <CopyButton text={text} label="复制命令" size="md" selectId={id} />}
      </div>
      {commands.length > 0 && (
        <pre className="overflow-x-auto bg-black/30 px-5 py-4 font-mono text-[13.5px] leading-[1.9] text-white/90 lg:px-6 lg:text-[14.5px]">
          <code id={id}>{text}</code>
        </pre>
      )}
      {note && <p className={`px-5 py-3.5 text-[14px] leading-relaxed text-white/65 lg:px-6 ${commands.length ? 'border-t border-white/[0.07]' : ''}`}>{note}</p>}
      {commands.length > 0 && (
        <p className="border-t border-white/[0.07] px-5 py-3 text-[13px] leading-relaxed text-white/45 lg:px-6">
          {slash ? '以 / 开头的命令在 Claude Code 会话里输入，其余在终端里执行。' : '在终端里执行。'}
          Skill 可以带可执行脚本，安装前先看一遍仓库里的 SKILL.md。
        </p>
      )}
    </section>
  )
}

/** 目录卡片：库名（进详情）· 许可 · 一句话 · 适用平台 · 安装命令（可复制）· 介绍与用法 / 仓库外链 */
export function SkillCard({ c, index = 0 }: { c: SkillLibraryCard; index?: number }) {
  const hue = hueOf(c.name)
  return (
    <article className="learn-card learn-in flex min-w-0 flex-col p-5 lg:p-6" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <header className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
          style={{ background: `linear-gradient(135deg, hsl(${hue},70%,60%), hsl(${(hue + 50) % 360},70%,45%))`, color: '#0b0b0d' }}
        >
          {c.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold leading-snug tracking-tight">
            <Link href={c.path} className="text-white/95 underline-offset-4 hover:text-white hover:underline">
              {c.name}
            </Link>
          </h3>
          {c.pricing && <p className="mt-0.5 truncate text-xs leading-5 text-white/45">{c.pricing}</p>}
        </div>
        {c.featured && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">
            <Star className="h-3 w-3" /> 精选
          </span>
        )}
      </header>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-white/60">{c.excerpt}</p>

      {c.platforms.length > 0 && (
        <ul aria-label="适用平台" className="mt-4 flex flex-wrap gap-1.5">
          {c.platforms.map((p) => (
            <li key={p} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs leading-5 text-white/60">
              {p}
            </li>
          ))}
        </ul>
      )}

      <InstallCommand install={c.install} id={`skill-cmd-${c.id}`} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-5 text-sm">
        <Link href={c.path} className="group inline-flex items-center gap-1 font-medium text-white/85 hover:text-white">
          查看介绍与用法
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
        <a href={c.url} target="_blank" rel={SKILL_REPO_REL} className="group inline-flex items-center gap-1 text-white/50 hover:text-white">
          {c.repoLabel}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </footer>
    </article>
  )
}

export function SkillGrid({ items }: { items: SkillLibraryCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:gap-4">
      {items.map((c, i) => (
        <SkillCard key={c.id} c={c} index={i} />
      ))}
    </div>
  )
}

/** 学习首页用的紧凑行：库名 + 一句话 + 平台，整行进详情 */
export function SkillRows({ items }: { items: SkillLibraryCard[] }) {
  return (
    <ul className="divide-y divide-white/[0.07]">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={c.path} className="group flex items-center gap-4 py-3.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-white/90 group-hover:text-white">{c.name}</span>
              <span className="mt-0.5 block truncate text-sm text-white/45">{c.excerpt}</span>
            </span>
            <span className="hidden shrink-0 text-xs text-white/40 sm:block">{c.platforms.slice(0, 2).join(' / ')}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * 两个目录互相指路的卡片（/apps ↔ /skills）。醒目但不冒充内容：放在筛选条与列表之间，整块一个链接。
 * to='skills'：在 AI 应用列表上，「找 Skill 库？」；to='apps'：在 Skill 库目录上，指回 AI 应用。
 */
export function DirectoryCrossLink({ to, count }: { to: 'skills' | 'apps'; count?: number }) {
  const skills = to === 'skills'
  const Icon = skills ? Boxes : LayoutGrid
  return (
    <Link href={skills ? '/skills' : '/apps'} className="learn-card learn-lift group mb-8 flex items-center gap-4 p-4 sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white/80 transition-colors group-hover:bg-white group-hover:text-black">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">
          {skills ? '找 Skill 库？' : '找 AI 应用与工作流？'}
          {typeof count === 'number' && count > 0 && <span className="ml-2 text-xs font-normal tabular-nums text-white/40">{count} 个</span>}
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-white/50">
          {skills
            ? 'Claude Code、claude.ai、Codex 用的 Agent Skills（技能包）单独放在 Skill 库目录，每个都附安装命令。'
            : 'ChatGPT、Claude 之外的 AI 工具，以及用户写的真实用法，在 AI 应用目录。'}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-sm text-white/70 group-hover:text-white sm:inline-flex">
        {skills ? '去 Skill 库' : '去 AI 应用'}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

/** 提示词库 / 教程列表上的一行小指路（比上面的卡片轻：一行字 + 箭头） */
export function SkillsHint({ from }: { from: 'prompts' | 'guides' }) {
  return (
    <p className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/50">
      <Boxes className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
      <span>{from === 'prompts' ? '想让 AI 记住一整套做法，而不是每次粘贴提示词？' : '装好 Claude Code 或 Codex 了？'}</span>
      <Link href="/skills" className="group inline-flex items-center gap-1 font-medium text-white/85 underline decoration-white/25 underline-offset-4 hover:text-white">
        去 Skill 库挑现成的技能包
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </p>
  )
}
