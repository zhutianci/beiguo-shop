export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { cardKeyConfigured } from '@/lib/cardkey'
import { vmqConfigured, VMQ_TIMEOUT_MIN } from '@/lib/vmq'

// 系统状态（只读）。原来的 /admin/settings 是一个按钮点了没反应的静态假表单，
// 这里换成真实可用的运行时自检：只报「已配置/未配置」和非敏感的数值，
// 绝不回显任何密钥明文（这个接口虽然受 middleware 管理员保护，也不该成为密钥出口）。
const has = (v?: string | null) => !!(v && v.trim())

export async function GET() {
  try {
    const [products, autoProducts, unusedCards, orders, users, receipts, invoices] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { deliveryType: 'AUTO' } }),
      prisma.cardKey.count({ where: { status: 'UNUSED' } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.receipt.count(),
      prisma.invoice.count(),
    ])

    return success({
      app: {
        appUrl: process.env.NEXT_PUBLIC_APP_URL || '（未设置 NEXT_PUBLIC_APP_URL）',
        nodeEnv: process.env.NODE_ENV || 'unknown',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        serverTime: new Date().toISOString(),
      },
      // 每一项只有 configured 布尔值 + 无害的说明，不含任何密钥内容
      features: [
        {
          key: 'cardkey',
          label: '卡密加密（CARDKEY_SECRET）',
          configured: cardKeyConfigured(),
          note: '未配置则无法导入/读取卡密。密钥一旦更换，已入库的卡密将无法解密。',
        },
        {
          key: 'vmq',
          label: '收款（VMQ_KEY）',
          configured: vmqConfigured(),
          note: `未配置则无法发起支付与开票。付款有效期 ${VMQ_TIMEOUT_MIN} 分钟。`,
        },
        {
          key: 'webhook',
          label: '到账通知转发 token',
          configured: has(process.env.VMQ_WEBHOOK_TOKEN) || vmqConfigured(),
          note: '未单独设置 VMQ_WEBHOOK_TOKEN 时回落使用 VMQ_KEY。配置详见「收款监控」页。',
        },
        {
          key: 'mail',
          label: '阿里云邮件推送',
          configured: has(process.env.ALIYUN_ACCESS_KEY_ID) && has(process.env.ALIYUN_DM_ACCOUNT),
          note: '未配置则注册验证码、找回密码、交易通知邮件都发不出去。',
        },
        {
          key: 'sms',
          label: '短信接码（hero-sms）',
          configured: has(process.env.HEROSMS_API_KEY),
          note: '仅「短信接码」类商品需要。',
        },
        {
          key: 'dispense',
          label: '共用库存发卡 API',
          configured: has(process.env.DISPENSE_API_SECRET),
          note: '未配置时 /api/inventory/* 直接返回 503（对外关闭）。',
        },
      ],
      counts: { products, autoProducts, unusedCards, orders, users, receipts, invoices },
    })
  } catch (err) {
    console.error('Admin settings error:', err)
    return error('获取失败')
  }
}
