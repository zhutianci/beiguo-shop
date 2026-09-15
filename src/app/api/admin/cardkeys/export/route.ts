export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { error } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { decryptCardContent, maskSecretForExport } from '@/lib/cardkey'
import { buildXlsx, xlsxTime, type XlsxColumn, type XlsxValue } from '@/lib/xlsx'
import { notifyCardKeyExported } from '@/lib/notify'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'

/**
 * 卡密导出（xlsx）。
 *
 * 【这是全站最敏感的一个导出】导出来的文件里是明文卡密——那就是商品本体，
 * 谁拿到谁就能直接用。所以这里做了几件事，缺一不可：
 *   ① **路由内自己再验一次 ADMIN**（requireAdmin），不只靠 middleware。
 *      本项目其它后台接口只靠 middleware 兜底是既定约定，但那道锁有个大前提：
 *      middleware 真的拦得住。当前 Next 14.2.3 存在 CVE-2025-29927——
 *      带一个 `x-middleware-subrequest: src/middleware:...`（重复 5 次）的请求头
 *      就能整个跳过 middleware（本机实测：无 cookie 直接打到路由拿到 400 而非 401）。
 *      根治要升级 Next，但「一键导出全站明文卡密」这个接口绝不能只有一层已知可绕的锁，
 *      所以这里独立再验一道。middleware 修好了这道也不多余——纵深防御。
 *   ② 响应 `Cache-Control: no-store`，不让任何中间层留副本；
 *   ③ 限流：明文全量导出可反复拉，且每次都推一条审计——不限流的话攻击者能先刷爆
 *      企业微信机器人（20 条/分的硬限流）把「唯一的痕迹」冲掉，再从容导一次真的。
 *   ④ 每次导出都往企业微信推一条（谁、何时、导了多少、含不含明文、来源 IP）。
 *      后台没有操作日志表，这条推送就是唯一的痕迹。
 *
 * 【筛选条件与列表页完全一致】productId / status / batch / keyword / hasOrder，
 * 语义逐条对齐 api/admin/cardkeys/route.ts。差别是 productId 允许**整个缺席**（=全部商品，
 * 这正是「导出所有卡密」本身）；但传了却传坏（productId=abc）要报错，不能静默退化成全量。
 *
 * 【返回二进制，不能走 lib/api 的 success()】那个 helper 只会 JSON.stringify；
 * 但**出错时仍返回 JSON**，前端据 res.ok 区分成功与失败（发票导出同款约定）。
 */

/**
 * 单次导出的行数上限。
 *
 * xlsx 是整份在内存里拼出来再压缩的，没有流式写入。实测应用层（解密→拼 XML→zip）
 * 峰值：2 万行约 +270MB、5 万行约 +575MB，还没算 Prisma 结果集那一份。这台机器
 * 1.8G 内存、可用常在 700–800MB，5 万行会把它推向 OOM。现网 1727 张，2 万给了 10 倍余量；
 * 真到需要更多的那天，应该按商品或批次分次导，而不是把机器搞挂。
 */
const ROW_LIMIT = 20000

export async function GET(request: NextRequest) {
  // ① 独立鉴权。requireAdmin 读 cookie→验 JWT→查库校验 role，失败即抛。
  //    顺带拿到操作者身份，正好补进审计（middleware 验完就把身份丢了）。
  let operator: { id: number; email: string | null }
  try {
    const me = await requireAdmin()
    operator = { id: me.id, email: me.email }
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    // ③ 限流。明文导出比脱敏更该收紧，但两者共用一个较紧的闸已经够挡「反复拉全量」。
    //    注意 IP 在 Cloudflare Tunnel 后可被请求方伪造（见下方审计说明），所以主键用操作者 id。
    if (rateLimited(`cardkey-export:${operator.id}`, { windowMs: 60_000, max: 3 })) {
      return error('导出过于频繁，请稍后再试', 429)
    }

    const { searchParams } = new URL(request.url)
    // productId：区分「没传」（=全部商品）和「传了但传坏」（报错，不能退化成全量明文）
    const rawPid = searchParams.get('productId')
    const productId = rawPid == null || rawPid === '' ? 0 : parseInt(rawPid)
    if (rawPid != null && rawPid !== '' && !(productId > 0)) return error('商品参数无效')

    const status = searchParams.get('status')?.trim()
    const batch = (searchParams.get('batch') || '').trim()
    const keyword = (searchParams.get('keyword') || '').trim()
    const hasOrder = (searchParams.get('hasOrder') || '').trim()
    // 默认导明文——「导出卡密」这件事的意义就在明文上。
    // mask=1 是给「只想要台账、不想让文件带上商品本体」的场景准备的。
    const masked = searchParams.get('mask') === '1'

    const where: Prisma.CardKeyWhereInput = {}
    if (productId) where.productId = productId
    if (status) where.status = status
    if (batch) where.batch = batch
    if (keyword) {
      // 与列表页一致：卡密是密文，只能按备注 / 批次模糊
      where.OR = [{ remark: { contains: keyword } }, { batch: { contains: keyword } }]
    }
    if (hasOrder === '1') where.orderId = { not: null }
    else if (hasOrder === '0') where.orderId = null

    const total = await prisma.cardKey.count({ where })
    if (total === 0) return error('当前筛选条件下没有卡密可导出')
    if (total > ROW_LIMIT) {
      return error(`符合条件的卡密有 ${total} 张，超过单次导出上限 ${ROW_LIMIT} 张，请按商品或批次分次导出`)
    }

    const rows = await prisma.cardKey.findMany({
      where,
      // 与列表页同序（id desc），组内新卡在前——运营导完第一件事是看「刚导入的那批在不在」。
      // 跨商品全量时再按 productId 分组，组内仍是新卡在前。
      orderBy: [{ productId: 'asc' }, { id: 'desc' }],
      select: {
        id: true,
        productId: true,
        content: true,
        status: true,
        orderId: true,
        externalRef: true,
        batch: true,
        remark: true,
        cost: true,
        soldPrice: true,
        profit: true,
        redeemUrl: true,
        redeemProvider: true,
        usedAt: true,
        createdAt: true,
        product: { select: { name: true } },
      },
    })

    // 订单号 + 买家：卡密表里只有 orderId，运营对得上的是订单号和「发给谁了」。
    // 一次性批量取回来，不要在 map 里逐行查库（1700 行就是 1700 次往返）。
    const orderIds = Array.from(new Set(rows.map((r) => r.orderId).filter((v): v is number => v != null)))
    const orderMap = new Map<number, { orderNo: string; buyer: string }>()
    if (orderIds.length > 0) {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNo: true, user: { select: { email: true, nickname: true } } },
      })
      orders.forEach((o) => {
        const buyer = o.user ? [o.user.nickname, o.user.email].filter(Boolean).join(' · ') : ''
        orderMap.set(o.id, { orderNo: o.orderNo, buyer })
      })
    }

    const STATUS_TEXT: Record<string, string> = {
      UNUSED: '未使用',
      USED: '已发出',
      DISABLED: '已停用',
    }

    const columns: XlsxColumn[] = [
      // ID 必须按数值写：按文本排序会排成 1, 10, 100, 2 …
      { header: 'ID', width: 8, type: 'number' },
      { header: '商品', width: 34 },
      { header: masked ? '卡密（已脱敏）' : '卡密', width: 46 },
      { header: '状态', width: 10 },
      { header: '订单号', width: 22 },
      { header: '买家', width: 24 },
      { header: '外部发卡归属', width: 24 },
      { header: '批次', width: 16 },
      { header: '备注', width: 18 },
      { header: '成本', width: 10, type: 'number' },
      { header: '售价', width: 10, type: 'number' },
      { header: '利润', width: 10, type: 'number' },
      { header: '兑换平台', width: 14 },
      { header: '兑换链接', width: 40 },
      { header: '发出时间', width: 20 },
      { header: '导入时间', width: 20 },
    ]

    let undecryptable = 0
    const data: XlsxValue[][] = rows.map((c) => {
      let secret: string
      try {
        const plain = decryptCardContent(c.content)
        secret = masked ? maskSecretForExport(plain) : plain
      } catch {
        undecryptable++
        secret = '(无法解密)'
      }
      const ord = c.orderId != null ? orderMap.get(c.orderId) : undefined
      return [
        c.id,
        c.product?.name ?? `#${c.productId}`,
        secret,
        STATUS_TEXT[c.status] || c.status,
        ord ? ord.orderNo : c.orderId != null ? `#${c.orderId}` : '',
        ord ? ord.buyer : '',
        c.externalRef ?? '',
        c.batch ?? '',
        c.remark ?? '',
        // Decimal 不能直接进 xlsx；null 保持 null（空格子），不要写 0——
        // 「未知」和「零」在成本利润表上是两件完全不同的事
        c.cost != null ? Number(c.cost) : null,
        c.soldPrice != null ? Number(c.soldPrice) : null,
        c.profit != null ? Number(c.profit) : null,
        c.redeemProvider ?? '',
        c.redeemUrl ?? '',
        xlsxTime(c.usedAt),
        xlsxTime(c.createdAt),
      ]
    })

    // 全军覆没通常意味着 CARDKEY_SECRET 未配置或被轮换过（decryptCardContent 会抛），
    // 这是**全局**故障而不是单行脏数据。此时不能产出一份「1727 张全是 (无法解密)」却
    // 标着「成功」的废文件——那会让运营以为导出正常，而且照样推一条审计噪音。直接中止。
    if (undecryptable > 0 && undecryptable === rows.length && !masked) {
      return error('卡密密钥未配置或已变更，本次导出内容全部无法解密，已中止', 500)
    }

    const out = buildXlsx({ sheetName: '卡密明细', columns, rows: data })

    const stamp = xlsxTime(new Date()).replace(/[^\d]/g, '').slice(0, 12) // YYYYMMDDHHmm
    const scope = productId ? rows[0]?.product?.name || `商品${productId}` : '全部商品'
    const filename = `卡密导出-${scope}-${stamp}-${rows.length}张${masked ? '-脱敏' : ''}.xlsx`

    // ④ 审计痕迹：带上操作者身份（middleware 验完就丢了，这里从 requireAdmin 拿到）。
    //    IP 仅作参考——Cloudflare Tunnel 后 cf-connecting-ip / x-forwarded-for 均为请求方可写，
    //    真要追责以「操作人」为准。
    notifyCardKeyExported({
      operator: operator.email || `#${operator.id}`,
      count: rows.length,
      scope,
      masked,
      ip: clientIp(request.headers),
      undecryptable,
      filters: [
        status ? `状态=${STATUS_TEXT[status] || status}` : '',
        batch ? `批次=${batch}` : '',
        keyword ? `关键词=${keyword}` : '',
        hasOrder === '1' ? '仅已关联订单' : hasOrder === '0' ? '仅未关联订单' : '',
      ]
        .filter(Boolean)
        .join('，'),
    })

    console.log(
      `[cardkey/export] 操作人 #${operator.id}(${operator.email}) 导出 ${rows.length} 张（${scope}${masked ? '，脱敏' : '，含明文'}），无法解密 ${undecryptable} 张`
    )

    return new NextResponse(Buffer.from(out), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // filename 只能是 ASCII，中文必须走 RFC 5987 的 filename*；两个都给，老浏览器落到前者
        'Content-Disposition': `attachment; filename="cardkeys-${stamp}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(out.length),
        // 明文卡密绝不允许被任何中间层缓存
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Cardkey-Count': String(rows.length),
        'X-Cardkey-Undecryptable': String(undecryptable),
      },
    })
  } catch (err) {
    console.error('Admin cardkey export error:', err)
    return error('导出失败')
  }
}
