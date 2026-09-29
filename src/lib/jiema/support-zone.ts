/**
 * 客服页「短信接码」分区与 /jiema 页 FAQ 的数据（docs/短信接码-设计.md §8.3、§1.3、§6.6 第 33 条；S3）。
 *
 * 【谁看得到】只在主站（features.jiema，渠道站恒关，D11）；
 *  · 接码对全部用户开放（jiemaPublicOpen）→ mode=OPEN：分区显示，而且问答进 FAQPage 结构化数据；
 *  · 灰度期管理员 → mode=PREVIEW：分区显示给管理员核对（标「仅管理员预览」），**不进结构化数据**（普通访客看不到的内容不能标记）；
 *  · 其余（普通访客在灰度期、配置读不到）→ null：不出现任何接码入口（与导航、页脚、sitemap 同一口径，D28）。
 * 【文案里的数字取当前配置】换号次数、售后窗口取 sms_config；充值档位与上下限取 wallet_config（充值没对这个访客开放时第 5 条改说「即将开放」）；
 * 客服在线时间取店面 contact。页面与结构化数据拿的是同一个对象（layout 算一次，经 context 交给页面），两边逐字一致。
 */
import { getCurrentUser } from '../auth'
import { storefrontFeatures } from '../storefront/public'
import { jiemaPublicOpen } from '../jiema-config-schema'
import { readWalletConfig, topupOpenFor } from '../wallet/config'
import { jiemaFaqs, jiemaSupportRules, type FAQItem } from '../support-faq'
import { readSmsConfigCached } from './config'

export interface JiemaSupportData {
  mode: 'OPEN' | 'PREVIEW'
  rules: string[]
  faqs: FAQItem[]
}

export async function jiemaSupportData(sf: { kind: 'PLATFORM' | 'CHANNEL'; contact: { hours: string | null } } | null): Promise<JiemaSupportData | null> {
  if (!sf || sf.kind !== 'PLATFORM' || !storefrontFeatures(sf).jiema) return null
  try {
    const cfg = await readSmsConfigCached()
    if (!cfg) return null
    let mode: JiemaSupportData['mode']
    let isAdmin = false
    if (jiemaPublicOpen(cfg)) mode = 'OPEN'
    else {
      const user = await getCurrentUser()
      if (user?.role !== 'ADMIN') return null
      isAdmin = true
      mode = 'PREVIEW'
    }
    const w = await readWalletConfig().catch(() => null)
    // OPEN：按「普通访客」算充值开没开（结构化数据给所有人看）；PREVIEW：管理员自己看，按管理员算
    const topup = w && w.ok && topupOpenFor(w.config, mode === 'PREVIEW' && isAdmin) ? { tiersCents: w.config.tiersCents, minCents: w.config.minCents, maxCents: w.config.maxCents } : null
    return {
      mode,
      rules: jiemaSupportRules(cfg),
      faqs: jiemaFaqs({ maxReplace: cfg.maxReplace, complaintWindowH: cfg.complaintWindowH, topup, hours: sf.contact.hours }),
    }
  } catch (e) {
    console.error('[jiema] 客服页接码分区数据读取失败（按不显示）', (e as Error)?.message)
    return null
  }
}
