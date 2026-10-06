'use client'

/**
 * 落地页（/chongzhi/*）的来源记录（内容平台 P3，设计 §13.1）：
 *   · 带 ?ref= 进来的，把内推码存进 localStorage（与商品页同一个 key，lib/ref.ts）。之后点进商品页下单，
 *     商品页读到它就按现有内推规则成交 —— 以前落地页不记 ref，从落地页点进商品页时 ref 会丢；
 *   · 带 ?from=c{内容 id} 进来的，给那条内容记一次「带来访问」（同一访客同一天只记一次，服务端去重），
 *     并记下内容 id，7 天内下单时随订单上报（内容带单归因，lib/content/attribution.ts）。
 * 不渲染任何东西。渠道站整组 /chongzhi 都是 404（layout 的 notFoundOnChannel），这里不会在渠道站运行。
 */
import { useEffect } from 'react'
import { captureContentFrom, captureRefFromUrl } from '@/lib/ref'

export function RefCapture() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('ref')) captureRefFromUrl()
      const m = /^c(\d{1,9})$/.exec(sp.get('from') ?? '')
      if (m) {
        captureContentFrom(Number(m[1]))
        fetch(`/api/content/${m[1]}/cta`, { method: 'POST', keepalive: true }).catch(() => {})
      }
    } catch {
      /* 隐私模式等拿不到 storage 时什么都不做 */
    }
  }, [])
  return null
}
