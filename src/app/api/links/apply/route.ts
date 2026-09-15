export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { findSameHost, getLinksConfig } from '@/lib/friend-link'
import { LINK_SLOTS, normalizeUrl } from '@/lib/friend-link-client'
import { notifyLinkApplied } from '@/lib/notify'

/**
 * 公开接口：提交友链 / 招商位申请。
 *
 * 落库即 PENDING，永远不会直接出现在前台 —— 出站链接指到赌博诈骗页面，
 * 赔上的是本站域名的信誉，这条队列不能省。
 */

const applySchema = z.object({
  name: z.string().trim().min(2, '站点名称至少 2 个字').max(60, '站点名称过长'),
  url: z.string().trim().min(4, '请填写站点地址').max(300),
  logo: z.string().trim().max(300).optional().nullable(),
  // 简介是卡片上唯一的信息载体，留空的话友链墙上只剩一行占位文案，对双方都没意义
  description: z.string().trim().min(4, '请写一句话简介').max(200, '简介不超过 200 字'),
  contact: z.string().trim().min(2, '请留一个能联系上你的方式').max(100),
  slot: z.enum(LINK_SLOTS).optional(),
  // 蜜罐字段 website 刻意**不进 schema**：写成 z.string().max(0) 看着像校验，
  // 实际是 zod 会先于蜜罐分支把请求打回，并且明明白白告诉脚本
  //「这个字段必须为空」——等于附赠一份绕过说明书。判断放在 safeParse 之前。
})

const RATE = { windowMs: 60 * 60 * 1000, max: 3 }

export async function POST(request: NextRequest) {
  try {
    const cfg = await getLinksConfig()
    if (!cfg.applyOpen) return error('在线申请暂时关闭，请通过页面上的联系方式与我们沟通')

    const ip = clientIp(request.headers)
    if (rateLimited(`link-apply:${ip}`, RATE)) {
      return error('提交过于频繁，请一小时后再试', 429)
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

    // 蜜罐命中：装作提交成功，不给脚本任何「这次失败了、换个写法再来」的反馈。
    // 真人看不见那个输入框（表单里用 left:-9999px 移出视口），只有脚本会去填。
    const hp = body.website
    if (typeof hp === 'string' ? hp.trim() !== '' : hp != null && hp !== false) {
      return success({ id: 0 }, '已提交，我们会尽快审核')
    }

    const parsed = applySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const url = normalizeUrl(d.url)
    if (!url) return error('站点地址不合法，请填写完整的网址')

    // logo 允许留空（前台会用站名首字生成一个渐变方块兜底）
    let logo: string | null = null
    if (d.logo) {
      logo = normalizeUrl(d.logo)
      if (!logo) return error('logo 地址不合法，可以留空由我们抓取')
    }

    // 同一个域名只留一条记录：审核队列里出现十条同站申请，
    // 对审核人是纯噪音，对申请人也只是以为「没人看」而反复点提交。
    const exist = await findSameHost(url)
    if (exist) {
      // APPROVED 本来就挂在页面上，说破无妨；PENDING 与 REJECTED 合并成一句话——
      // 分开回显等于把不公开的审核队列状态做成了一个查询接口
      if (exist.status === 'APPROVED') return error('这个站点已经在友链列表里了')
      if (exist.status === 'PENDING' || exist.status === 'REJECTED') {
        return error('这个站点已经在我们的处理队列里了，如有疑问请通过页面上的联系方式联系我们')
      }
      // OFFLINE：曾经互挂过又下线了（对方撤链 / 赞助到期），允许重新申请，
      // 复用同一行而不是再插一条，后台才能看到完整的往来历史
      await prisma.friendLink.update({
        where: { id: exist.id },
        data: {
          name: d.name,
          url,
          logo,
          description: d.description,
          contact: d.contact,
          slot: d.slot || 'FRIEND',
          status: 'PENDING',
          source: 'APPLY',
          applyIp: ip,
          // 这是一次全新的申请：上一轮合作留下的判定要一并清掉，
          // 否则后台会看到「已回链 ✓（三个月前检测的）」而误以为已经核过
          nofollow: true,
          backlinkOk: null,
          backlinkNote: null,
          checkedAt: null,
          startAt: null,
          endAt: null,
        },
      })
      notifyLinkApplied({
        name: d.name,
        url,
        slot: d.slot || 'FRIEND',
        contact: d.contact,
        description: d.description,
      })
      return success({ id: exist.id }, '已提交，我们会尽快审核')
    }

    const row = await prisma.friendLink.create({
      data: {
        name: d.name,
        url,
        logo,
        description: d.description,
        contact: d.contact,
        slot: d.slot || 'FRIEND',
        status: 'PENDING',
        source: 'APPLY',
        nofollow: true, // 来路不明的申请先不给权重，确认互链且内容干净后由管理员放开
        applyIp: ip,
      },
      select: { id: true },
    })

    notifyLinkApplied({
      name: d.name,
      url,
      slot: d.slot || 'FRIEND',
      contact: d.contact,
      description: d.description,
    })

    return success({ id: row.id }, '已提交，我们会尽快审核')
  } catch (err) {
    console.error('Apply friend link error:', err)
    return error('提交失败，请稍后再试')
  }
}
