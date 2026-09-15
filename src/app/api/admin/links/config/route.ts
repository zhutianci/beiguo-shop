export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { defaultLinksConfig, getLinksConfig, saveLinksConfig } from '@/lib/friend-link'

// 注意路由优先级：静态段 /config 会先于同级的 [id] 命中，不会被当成 id=config

export async function GET() {
  try {
    return success({ config: await getLinksConfig(), defaults: defaultLinksConfig() })
  } catch (err) {
    console.error('Admin get links config error:', err)
    return error('获取配置失败')
  }
}

// 运营天天碰得到的约束一律写中文提示：裸写 min/max 时 zod 会把
// 「String must contain at least 1 character(s)」原样弹到后台红字里，
// 运营看不懂自己错在哪。够不着的上限（max(500) 之类）留默认即可。
const configSchema = z.object({
  intro: z.string().trim().max(500, '页面导语不超过 500 字'),
  requirements: z.array(z.string().trim().max(200, '单条收录标准不超过 200 字')).max(12, '收录标准最多 12 条'),
  sponsorTitle: z.string().trim().min(1, '招商区标题不能为空').max(40, '招商区标题不超过 40 字'),
  sponsorIntro: z.string().trim().max(500, '招商区说明不超过 500 字'),
  sponsorBenefits: z.array(z.string().trim().max(200, '单条权益不超过 200 字')).max(12, '招商位权益最多 12 条'),
  sponsorSlots: z.number().int('招商位总数要填整数').min(0, '招商位总数应在 0~24 之间').max(24, '招商位总数应在 0~24 之间'),
  applyOpen: z.boolean(),
  contact: z.string().trim().max(100, '联系方式不超过 100 字'),
  contactNote: z.string().trim().max(200, '联系方式说明不超过 200 字'),
  siteName: z.string().trim().min(1, '站点名称不能为空').max(60, '站点名称不超过 60 字'),
  siteUrl: z.string().trim().max(300),
  siteLogo: z.string().trim().max(300),
  siteDescription: z.string().trim().max(200, '站点简介不超过 200 字'),
})

/**
 * 逐行文本框传上来的数组先清洗再校验。
 *
 * 【顺序不能反】后台那两个多行文本框是 `value.split('\n')`，末尾一个回车就会多出一个空串。
 * 清洗要是放在 safeParse 之后，空行照样占用 max(12) 的名额：运营数了数屏幕上明明只有
 * 12 条，却被打回「最多 12 条」，而那个多出来的换行是看不见的。
 */
function cleanLines(v: unknown): string[] | unknown {
  if (!Array.isArray(v)) return v
  return v.map((s) => String(s ?? '').trim()).filter(Boolean)
}

export async function PUT(request: NextRequest) {
  try {
    const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const body = {
      ...raw,
      requirements: cleanLines(raw.requirements),
      sponsorBenefits: cleanLines(raw.sponsorBenefits),
    }

    const parsed = configSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    await saveLinksConfig(parsed.data)
    return success(parsed.data, '已保存')
  } catch (err) {
    console.error('Admin save links config error:', err)
    return error('保存失败')
  }
}
