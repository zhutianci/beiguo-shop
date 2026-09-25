'use client'

import { useEffect, useLayoutEffect } from 'react'

/**
 * 从营销邮件点进来的访问：清掉本机旧的推广码（设计文档 D11）。
 *
 * 【为什么】推广价与优惠券互斥（交接文档第十八节）。浏览器里如果还留着很久以前点过的某个推广链接的
 * ref_code，邮件里承诺的券在结算时会用不了，价格还可能比邮件里写的高 —— 买家只会觉得被骗。
 * 邮件带来的订单是站方自己的营销，本来也不该记给推广人。邮件里的每个链接都带 via=mail（lib/marketing/snapshot.ts）。
 *
 * 【为什么用 layoutEffect】React 先跑完整棵树的 layout effect，才开始跑任何普通 effect。
 * 商品页在自己的 useEffect 里读 ref_code 决定显示哪个价格（lib/ref.ts captureRefFromUrl），
 * 而子组件的 effect 比布局上的这个组件先执行 —— 用普通 useEffect 就会晚一步，商品页已经按推广价渲染了。
 * 服务端没有 layout effect（会告警），所以服务端退回 useEffect，反正服务端两个都不执行。
 *
 * 只在文档加载时看一次落地 URL：站内的软跳转不会再带 via=mail。
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function MailLanding() {
  useIsomorphicLayoutEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('via') === 'mail') {
        localStorage.removeItem('ref_code')
      }
    } catch {
      // 隐私模式下 localStorage 会抛：那种情况下本来也存不住推广码，忽略即可
    }
  }, [])
  return null
}
