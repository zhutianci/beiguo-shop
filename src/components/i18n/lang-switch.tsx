'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/components/i18n/lang-provider'
import { usePathname } from '@/lib/i18n/navigation'
import { LANG_AUTO_COOKIE, LANG_SUGGEST_COOKIE, switchHref, type SiteLang } from '@/lib/i18n/lang'
import { cn } from '@/lib/utils'

/**
 * 简繁切换（docs/繁体香港版/设计.md §6.4）。
 *
 * 用普通 <a> 整页跳转到 `目标地址?hl=…`，由 middleware 记住选择再去掉参数——不依赖 JS：iPhone 上水合常晚 10 秒以上
 * （交接文档第三十八节），那段时间点按钮也必须生效。rel=nofollow：两个版本靠 hreflang 与站点地图互相发现，不需要爬虫跟这个带参地址。
 *
 * 「繁體」写成繁体字：简体页不经过转换代理，要直接显示繁体写法；繁体页上的「简体」会被代理转成「簡體」，香港读者照样看得懂。
 */
export function LangSwitch({ variant = 'pill', className }: { variant?: 'pill' | 'text' | 'menu'; className?: string }) {
  const lang = useLang()
  const pathname = usePathname() || '/'
  const target: SiteLang = lang === 'zh-HK' ? 'zh-CN' : 'zh-HK'
  const href = switchHref(pathname, target)
  const label = target === 'zh-HK' ? '繁體' : '简体'
  const title = target === 'zh-HK' ? '切換至繁體中文（香港）' : '切换到简体中文'
  const hrefLang = target === 'zh-HK' ? 'zh-Hant' : 'zh-Hans'

  if (variant === 'text') {
    return (
      <a href={href} rel="nofollow" hrefLang={hrefLang} lang={target} title={title} className={cn('hover:text-white transition-colors', className)}>
        {target === 'zh-HK' ? '繁體中文' : '简体中文'}
      </a>
    )
  }
  if (variant === 'menu') {
    return (
      <a href={href} rel="nofollow" hrefLang={hrefLang} lang={target} className={cn('ui-btn ui-btn-secondary', className)}>
        {target === 'zh-HK' ? '切換繁體中文' : '切换简体中文'}
      </a>
    )
  }
  return (
    <a
      href={href}
      rel="nofollow"
      hrefLang={hrefLang}
      lang={target}
      title={title}
      aria-label={title}
      className={cn(
        'h-10 min-w-10 px-3 rounded-full glass flex items-center justify-center text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        className,
      )}
    >
      {label}
    </a>
  )
}

/** 读一次性 cookie 并立刻删掉 */
function takeCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  if (!m) return null
  document.cookie = `${name}=; path=/; max-age=0`
  return decodeURIComponent(m[1])
}

/**
 * 按所在地处理后的一次性提示（middleware 写的 cookie，两分钟有效，读到就删）：
 *  · 自动切换模式（bg_lang_auto）：「已按所在地区切换为繁体」+ 一键切回——Google 对按 IP 跳转的顾虑就是用户被困在某个版本里；
 *  · 横幅模式（bg_lang_suggest）：不跳转，只建议「切换到繁体中文（香港）」。
 */
export function LangAutoNotice() {
  const lang = useLang()
  const pathname = usePathname() || '/'
  const [show, setShow] = useState<null | 'auto' | 'suggest'>(null)

  useEffect(() => {
    try {
      const auto = takeCookie(LANG_AUTO_COOKIE)
      const suggest = takeCookie(LANG_SUGGEST_COOKIE)
      if (auto && auto.toLowerCase() === lang.toLowerCase()) setShow('auto')
      else if (suggest && suggest.toLowerCase() !== lang.toLowerCase()) setShow('suggest')
    } catch {
      /* cookie 不可用时不提示 */
    }
  }, [lang])

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShow(null), 12000)
    return () => clearTimeout(t)
  }, [show])

  if (!show) return null
  const back: SiteLang = lang === 'zh-HK' ? 'zh-CN' : 'zh-HK'
  const text =
    show === 'auto'
      ? lang === 'zh-HK'
        ? '已按你的所在地区切换为繁体中文（香港）'
        : '已按你的所在地区切换为简体中文'
      : back === 'zh-HK'
        ? '本站提供繁體中文（香港）版本'
        : '本站提供简体中文版本'
  return (
    <div role="status" className="fixed left-1/2 top-24 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-[#131317]/95 px-4 py-3 text-sm text-white/80 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)] ui-drop-in">
      <div className="flex items-center justify-between gap-3">
        <span>{text}</span>
        <span className="flex shrink-0 items-center gap-3">
          <a href={switchHref(pathname, back)} rel="nofollow" lang={back} className="font-medium text-violet-300 hover:text-violet-200">
            {show === 'auto' ? (back === 'zh-HK' ? '繁體' : '简体') : back === 'zh-HK' ? '切換繁體' : '切换简体'}
          </a>
          <button type="button" aria-label="关闭" onClick={() => setShow(null)} className="text-white/40 hover:text-white">
            ×
          </button>
        </span>
      </div>
    </div>
  )
}
