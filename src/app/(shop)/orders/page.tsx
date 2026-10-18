'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Search,
  Sparkles,
  Package,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Copy,
  MessageSquare,
  FileText,
  X,
  Check,
  Gift,
  type LucideIcon,
} from 'lucide-react'
import { useUserStore } from '@/store/user'
import { useHydrated } from '@/lib/use-hydrated'
import { ContactModal } from '@/components/contact-modal'
import OrderChat from '@/components/order-chat'
import OrderSms from '@/components/order-sms'
import { InvoiceTitlePicker, useSavedTitles, type SavedTitle } from '@/components/invoice-title-picker'
import { RedPacketButton } from '@/components/lottery/red-packet-button'
import { LotteryModal } from '@/components/lottery/lottery-modal'
import { useStorefront } from '@/components/storefront-provider'
// 只取类型：lib/lottery 间接引用了 prisma 与 node crypto，值导入会被打进前端包
import type { BuyerLotteryView } from '@/lib/lottery'
// 短信接码单在「我的订单」里的显示规则（纯函数，零依赖；docs/短信接码-设计.md §6.6 第 27 条）
import { InvoiceItemSelect } from '@/components/invoice-item-select'
import { DEFAULT_INVOICE_ITEM, invoiceItemName, type InvoiceItemKey } from '@/lib/invoice-items'
import { jiemaOrderCard, jiemaAmountLines, orderAmountText, type JiemaCard } from '@/lib/jiema/ui'

interface Order {
  id: number
  orderNo: string
  productId: number
  productName: string
  productPrice: string | number
  amount: string | number
  /** 下单时勾了开发票 → 待支付的 6% 税费；没勾为 null */
  invoiceTaxFee: number | null
  /** 实际应付 = amount + invoiceTaxFee */
  payable: number
  payStatus: string
  deliveryStatus: string
  deliveryInfo: string | null
  remark: string | null
  createdAt: string
  paidAt: string | null
  deliveredAt: string | null
  product: { id: number; name: string; image: string | null; deliveryType?: string; cardUsage?: string | null; cardRedeemUrl?: string | null }
  cards?: string[]
  // 每张卡的兑换入口。inSite=true 表示 redeemUrl 是站内兑换页的相对地址（/redeem/...），
  // 应在本站打开；否则是外链。为空则回落 product.cardRedeemUrl
  cardItems?: { secret: string; redeemUrl: string | null; inSite?: boolean }[]
  unreadCount?: number // 客服发来、买家未读的回复数
  billing?: Billing | null
  /** 下单有奖：这张订单的抽奖资格与结果；不在活动范围内的订单为 null */
  lottery?: BuyerLotteryView | null
  /** 此刻能不能拆（服务端算好：有资格未抽 + 已付款 + 未取消）。真正的判定在 /api/lottery/draw */
  lotteryCanDraw?: boolean
  /** 短信接码单（SMS_POOL）才有：接码单状态、付款方式、预扣（两格之和）与预扣状态 */
  jiema?: { state: string; payMode: string; holdCents: number; holdState: string | null } | null
}

/* 接码单的四种语气（lib/jiema/ui 给 tone）→ 卡片上小圆点与提示文字的颜色。与下面 getStatusConfig 同一套色 */
const JIEMA_TONE: Record<JiemaCard['tone'], { color: string }> = {
  amber: { color: 'text-amber-300' },
  blue: { color: 'text-sky-400' },
  gray: { color: 'text-white/40' },
  green: { color: 'text-emerald-400' },
}

interface Billing {
  canInvoice: boolean
  canReceipt: boolean
  sellingPrice: number
  invoiceAmount: number
  taxFee: number
  receiptAmount: number // 收据应开金额：已付发票税费=含税开票金额，否则=售价
  invoiceStatus: string // UNAPPLIED | AWAIT_PAY | SUBMITTED | ISSUED | CANNOT
  /** 结账时已随货款付清 6%：不再显示「申请发票」，也不会再收一次税费 */
  invoicePrepaid?: boolean
  invoiceId: number | null
  receiptToken: string | null
  /** 主发票（挂了多张时取推进得最靠后的那张）的明细；还没有发票行时为 null */
  invoice?: BillingInvoice | null
}

interface BillingInvoice {
  invoiceNo: string
  status: string
  payStatus: string
  title: string | null
  taxNumber: string | null
  email: string | null
  /** 开票金额（含税）与税费：取发票上的快照，开出去的票以它为准 */
  invoiceAmount: number | null
  taxFee: number | null
  submittedAt: string | null
  issuedAt: string | null
}

// 弹窗类型：发货详情 / 发票收据 / 在线沟通
type PanelType = 'delivery' | 'billing' | 'chat'

const INVOICE_LABELS: Record<string, string> = {
  UNAPPLIED: '可开据·未开发票',
  AWAIT_PAY: '可开据·待支付税费',
  SUBMITTED: '可开具·已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}

/* 订单状态 → 标题旁小圆点的文字与颜色。颜色只用来区分状态，不再有底色与描边 */
const getStatusConfig = (payStatus: string, deliveryStatus: string) => {
  if (deliveryStatus === 'CANCELLED') return { label: '已取消', color: 'text-white/40' }
  if (payStatus === 'UNPAID') return { label: '待支付', color: 'text-amber-300' }
  if (payStatus === 'REFUNDED') return { label: '已退款', color: 'text-white/40' }
  if (deliveryStatus === 'DELIVERED') return { label: '已完成', color: 'text-emerald-400' }
  if (deliveryStatus === 'PROCESSING') return { label: '处理中', color: 'text-sky-400' }
  return { label: '待处理', color: 'text-white/55' }
}

/**
 * 一张订单的卡密与兑换入口（订单卡片和「发货详情」共用一份判断，两处的按钮永远指向同一个地方）。
 *
 * 【站内兑换地址是相对路径，不能只认 http(s)】服务端会把走站内兑换的卡返回成 /redeem/<平台>?cdk=...，
 * 只认 http(s) 的话会把它整个滤掉，表现就是「有卡密但没有兑换按钮」。
 * 兑换入口优先级：卡密自带（站内兑换页或本批外链）→ 商品级默认外链。
 */
function redeemEntry(order: Order) {
  // 兼容：新接口返回 cardItems（带每张卡的专属兑换地址），旧数据只有 cards: string[]
  const cardRows: { secret: string; redeemUrl: string | null; inSite?: boolean }[] =
    order.cardItems && order.cardItems.length > 0
      ? order.cardItems
      : (order.cards || []).map((s) => ({ secret: s, redeemUrl: null }))
  const isHttp = (u?: string | null) => !!u && /^https?:\/\//i.test(u)
  const isUsable = (u?: string | null) => isHttp(u) || (!!u && u.startsWith('/'))
  const fallbackRedeemUrl = isHttp(order.product?.cardRedeemUrl) ? order.product!.cardRedeemUrl! : null
  const primary = cardRows.find((c) => isUsable(c.redeemUrl))
  return {
    cardRows,
    hasCards: cardRows.length > 0,
    isUsable,
    fallbackRedeemUrl,
    primaryRedeemUrl: primary?.redeemUrl || fallbackRedeemUrl,
    // 站内兑换在本站打开，外链才新开标签页
    primaryInSite: !!primary?.inSite,
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // 徽标计数来自服务端全量口径，不能用当前页的数组长度算
  const [counts, setCounts] = useState({ all: 0, UNPAID: 0, PROCESSING: 0, DELIVERED: 0 })
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [panel, setPanel] = useState<{ order: Order; type: PanelType; justPaid?: boolean } | null>(null)
  /*
   * 【付款成功后直接打开这一单的发货详情】（2026-10-13）收银台付完款跳到 /orders?paid=<订单号>。
   * 以前是回到订单列表就完了：很多买家不知道卡密和「去充值 / 兑换」入口藏在「发货详情」里，付了款不会用。
   * 这里记下订单号，等列表第一次拉回来后自动打开那一单；随后把地址栏里的参数去掉（刷新、后退都不会再弹一次）。
   * 用 window.location 读而不是 useSearchParams：后者要求整页包一层 Suspense。
   */
  const paidNoRef = useRef<string | null>(null)
  useEffect(() => {
    const no = new URLSearchParams(window.location.search).get('paid')
    if (no && /^[0-9A-Za-z]{8,32}$/.test(no)) paidNoRef.current = no
  }, [])
  const [payingNo, setPayingNo] = useState<string | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [lotteryOrder, setLotteryOrder] = useState<Order | null>(null)
  /*
   * 渠道分站（设计 7.6、实施分包 WP1）：抽奖在渠道站关闭——渠道单建单时就不生成抽奖资格（WP2），
   * 这里再按 features 把「下单有奖」提示、红包按钮与弹窗整体去掉（/api/lottery/* 在渠道 Host 404，验收 W1-9）。
   * 主站 features 全开，行为不变。
   */
  const { features: sfFeatures } = useStorefront()

  // 拆完红包只改这一张卡片，不整页重拉：买家可能已经「加载更多」翻了好几页
  const handleLotteryDrawn = (orderId: number, view: BuyerLotteryView) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, lottery: view, lotteryCanDraw: false } : o)))
  }

  // 服务端分页 + 服务端筛选/检索。分段加载：翻页追加到列表尾部（「加载更多」式），
  // 切筛选/改关键词时从第 1 页重新开始。
  const loadOrders = useCallback(
    async (opts?: { append?: boolean }) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      if (opts?.append) setLoadingMore(true)
      else setLoading(true)
      try {
        const q = new URLSearchParams({ page: String(opts?.append ? page + 1 : 1), pageSize: '10' })
        if (activeFilter !== 'all') q.set('filter', activeFilter)
        if (debouncedSearch) q.set('keyword', debouncedSearch)
        const r = await fetch(`/api/orders?${q}`, { signal: ac.signal })
        const data = await r.json()
        if (ac.signal.aborted) return
        if (data.success) {
          const d = data.data
          setOrders((prev) => (opts?.append ? [...prev, ...d.list] : d.list))
          if (paidNoRef.current) {
            const no = paidNoRef.current
            paidNoRef.current = null
            window.history.replaceState(null, '', '/orders')
            const hit = (d.list as Order[]).find((o) => o.orderNo === no)
            // 接码单有自己的号码页（收银台本来就不会把它带到这里），不弹
            if (hit && hit.payStatus === 'PAID' && hit.product?.deliveryType !== 'SMS_POOL') {
              setPanel({ order: hit, type: 'delivery', justPaid: true })
            }
          }
          setPage(d.page)
          setTotalPages(d.totalPages || 1)
          setCounts(d.counts)
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [page, activeFilter, debouncedSearch]
  )

  // 打开某订单的弹窗；打开「在线沟通」时顺手清掉本订单的未读红点
  const openPanel = (order: Order, type: PanelType) => {
    setPanel({ order, type })
    if (type === 'chat' && order.unreadCount) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, unreadCount: 0 } : o)))
    }
  }

  const handleAlipay = async (order: Order) => {
    setPayingNo(order.orderNo)
    try {
      const res = await fetch('/api/pay/vmq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: order.orderNo }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        router.push(data.data.payUrl)
      } else {
        alert(data.error || '发起支付失败')
        setPayingNo(null)
      }
    } catch {
      alert('网络错误，请重试')
      setPayingNo(null)
    }
  }

  // 搜索防抖，避免每敲一个字就打一次服务端
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  // 等挂载后再判断登录态：水合那一次渲染里 user 恒为 null，直接判会把已登录的人一刷新就踢去登录页
  const hydrated = useHydrated()
  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.push('/login?redirect=/orders')
      return
    }
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, router, activeFilter, debouncedSearch])

  /*
   * 客服回话时，让正开着这一页的买家也能看见。
   *
   * 【为什么不直接定时 loadOrders()】买家可能已经点了几次「加载更多」，
   * 重新拉第 1 页会把列表打回十条、还会把他正在看的位置顶掉。
   * 所以这里只拉一个总数，发现比页面上已显示的未读多，就浮一条提示条，
   * 让买家自己决定什么时候刷新——不替他动列表。
   *
   * 【30 秒、且只在页面可见时】客服回话不是秒级的事，切到后台就停。
   */
  const shownUnread = orders.reduce((n, o) => n + (o.unreadCount || 0), 0)
  const [serverUnread, setServerUnread] = useState(0)
  useEffect(() => {
    if (!user) return
    let alive = true
    const pull = () => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/account/unread')
        .then((r) => r.json())
        .then((d) => {
          if (alive && d?.success) setServerUnread(Number(d.data?.messages) || 0)
        })
        .catch(() => {})
    }
    pull()
    const id = setInterval(pull, 30_000)
    document.addEventListener('visibilitychange', pull)
    return () => {
      alive = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', pull)
    }
  }, [user])
  const hasNewerMessages = serverUnread > shownUnread

  if (!user) return null

  const statusFilters = [
    { id: 'all', label: '全部', count: counts.all },
    { id: 'UNPAID', label: '待支付', count: counts.UNPAID },
    { id: 'PROCESSING', label: '处理中', count: counts.PROCESSING },
    { id: 'DELIVERED', label: '已完成', count: counts.DELIVERED },
  ]

  // 筛选与检索已下推到服务端，这里直接用返回的当前列表
  const filteredOrders = orders

  const copyOrderNo = (orderNo: string) => {
    navigator.clipboard.writeText(orderNo)
  }

  return (
    /* 顶部留白走 .page-top，不再写死 pt-32：它从 globals.css 的 --header-h 推导，
       移动端仍是 112+16=128px（与原来的 pt-32 完全一致），lg 起跟着矮下来的
       头部收到 96+16=112px。以后改头部高度只改 --header-h 一处，不用再追七八个文件 */
    <div className="min-h-screen page-top pb-20 lg:pb-28">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {/* lite-blob：手机端轻量模式（2026-10-01，站长要求电脑端不变）下大模糊光斑换成渐变遮罩（iOS WebKit 画大模糊太贵，滑动出黑块），规则见 globals.css 末尾 */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />

      {/* 订单卡是「一行一条记录」的横向布局，不是正文，行长约束不适用，但也不宜再宽：
          卡片改版后每行只剩「商品 + 状态 ｜ 金额」和「一句提示 ｜ 按钮」，
          拉到 1152 只会让金额离商品名更远、中间空一大片，所以统一收在 1024 */}
      <div className="container relative max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.12] bg-white/[0.03] mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">订单管理</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">我的</span>
            <span className="gradient-text-accent"> 订单</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col md:flex-row md:items-center gap-4 mb-8 lg:mb-10"
        >
          {/* 手机端筛选条要能横滑，所以基础样式保留 overflow-x-auto；
              桌面端一行放得下，改成换行排布并去掉滚动条占位，胶囊也放大一档 */}
          <div className="flex-1 flex gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-1 md:pb-0">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 lg:px-5 lg:py-3 rounded-full text-sm lg:text-[15px] font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-white text-black'
                    : 'glass text-white/60 hover:text-white lg:hover:bg-white/10'
                }`}
              >
                {filter.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeFilter === filter.id ? 'bg-black/10' : 'bg-white/10'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative md:w-72 lg:w-80 md:shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订单号或商品..."
              className="w-full pl-11 pr-4 py-2.5 lg:py-3 rounded-full bg-white/5 border border-white/10 text-sm lg:text-[15px] placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
        </motion.div>

        {/* 客服在你开着这一页的时候回了话。只提示、不自动刷新——
            买家可能已经「加载更多」翻了好几页，替他重拉会把列表打回第一页。 */}
        {hasNewerMessages && !loading && (
          <button
            onClick={() => loadOrders()}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 transition-colors hover:bg-cyan-400/15"
          >
            <MessageSquare className="h-4 w-4" />
            客服有 {serverUnread} 条新留言，点击刷新查看
          </button>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-white/40"
            >
              加载中...
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ui-empty px-6 py-16 sm:p-16"
            >
              <Package className="w-12 h-12 text-white/25 mx-auto mb-2" strokeWidth={1.5} />
              <h3 className="text-xl font-bold mb-2">
                {activeFilter === 'all' ? '暂无订单' : '该状态下暂无订单'}
              </h3>
              <p className="text-white/40 mb-8">快去选购心仪的 AI 服务吧</p>
              <Link href="/products" className="ui-btn ui-btn-primary">
                <ShoppingBag className="w-4 h-4" />
                立即选购
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 lg:space-y-5"
            >
              {filteredOrders.map((order, index) => {
                // 短信接码单（SMS_POOL）：状态、提示、按钮都按 lib/jiema/ui.jiemaOrderCard（付款只走号码页，任何状态都能留言，§6.6 第 27、29 条）
                const isJiema = order.product?.deliveryType === 'SMS_POOL'
                const jc = isJiema ? jiemaOrderCard({ payStatus: order.payStatus, deliveryStatus: order.deliveryStatus, jiema: order.jiema ?? null }) : null
                const jAmount = isJiema
                  ? jiemaAmountLines({ amount: Number(order.amount), payable: Number(order.payable), payStatus: order.payStatus, deliveryStatus: order.deliveryStatus, jiema: order.jiema ?? null })
                  : null
                const status = jc ? { label: jc.label, ...JIEMA_TONE[jc.tone] } : getStatusConfig(order.payStatus, order.deliveryStatus)
                const paid = order.payStatus === 'PAID'
                const numberHref = `/jiema/order/${encodeURIComponent(order.orderNo)}`
                // 已发卡密的单：把「下一步」直接摆在卡片上（卡密已到 ≠ 已充值，很多买家卡在这一步）
                const entry = redeemEntry(order)
                const showRedeem = !jc && paid && order.deliveryStatus !== 'CANCELLED' && entry.hasCards
                // 多张卡 / 没有兑换地址时，「下一步」本身就是打开发货详情：次要操作里不再重复一个「发货详情」
                const redeemOpensPanel = showRedeem && (!entry.primaryRedeemUrl || entry.cardRows.length > 1)
                // 已取消 / 已退款：整张卡压暗，列表里一眼能跳过
                const dim = order.deliveryStatus === 'CANCELLED' || order.payStatus === 'REFUNDED'

                /*
                 * 【一张卡最多一句提示】改版前同一张卡上会同时出现「状态胶囊 + 两行状态提示 + 抽奖提示」，
                 * 说的还都是状态本身。这里只留「买家下一步要做什么」，状态交给标题旁的小圆点，不再重复一遍。
                 */
                let hint: ReactNode = null
                let hintCls = 'text-white/55'
                if (jc) {
                  hint = jc.hint
                  hintCls = JIEMA_TONE[jc.tone].color
                } else if (showRedeem) {
                  hint = entry.primaryRedeemUrl ? '卡密已发放，还没充值就点「去充值 / 兑换」' : '卡密已发放，点「查看卡密」按使用说明完成充值'
                  hintCls = 'text-emerald-300/90'
                } else if (paid && order.deliveryStatus === 'PROCESSING') {
                  // 不写死时效：人工服务、接码、卡池不足转人工补发三种情况的耗时完全不同
                  //（「预计 10 分钟」对哪一种都不成立，交接文档第二十八节清理过同类承诺）
                  hint =
                    order.product?.deliveryType === 'SMS'
                      ? '正在为你取号，号码与验证码在「发货详情」里查看'
                      : order.product?.deliveryType === 'MANUAL'
                        ? '客服正在处理，进度可在「联系客服」里跟进'
                        : '正在处理中（库存补充后由人工补发），补发后会显示在「发货详情」里'
                  hintCls = 'text-sky-300/90'
                } else if (order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED') {
                  // 不再写「请点击『支付宝或微信支付』完成付款」——右边就是那个按钮；只在有抽奖资格时留一句钩子
                  if (sfFeatures.lottery && order.lottery?.state === 'PENDING') {
                    hint = (
                      <span className="inline-flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        付款后可参与「下单有奖」抽红包
                      </span>
                    )
                    hintCls = 'text-amber-200/85'
                  }
                } else if (order.deliveryStatus === 'CANCELLED' && order.payStatus === 'UNPAID') {
                  hint = '订单已超时取消，请重新下单'
                  hintCls = 'text-white/45'
                }

                /*
                 * 票据只写「已经发生的事」：可开发票 / 可开收据是「能做什么」，按钮上已经写着了，
                 * 再挂两个胶囊就是截图里那排花花绿绿的标签。
                 */
                const b = order.billing
                const billingNote =
                  b && b.invoiceStatus === 'ISSUED'
                    ? { label: '发票已开具', cls: 'text-emerald-300/75' }
                    : b && b.invoiceStatus === 'AWAIT_PAY'
                      ? { label: '发票待付税费', cls: 'text-amber-300/85' }
                      : b && b.invoiceStatus === 'SUBMITTED'
                        ? { label: '发票已提交', cls: 'text-cyan-300/75' }
                        : b && b.receiptToken
                          ? { label: '收据已开具', cls: 'text-emerald-300/75' }
                          : null

                // 次要操作：安静的幽灵按钮（图标 + 小字），只有「下一步」才做成实心主按钮
                const secondaryActions = [
                  !redeemOpensPanel && (
                    <ActionButton key="delivery" icon={Package} label="发货详情" onClick={() => openPanel(order, 'delivery')} />
                  ),
                  paid && order.billing && (
                    <ActionButton key="billing" icon={FileText} label="发票 / 收据" onClick={() => openPanel(order, 'billing')} />
                  ),
                  (paid || (jc && jc.showChat)) && (
                    <ActionButton
                      key="chat"
                      icon={MessageSquare}
                      label="联系客服"
                      onClick={() => openPanel(order, 'chat')}
                      badge={order.unreadCount}
                    />
                  ),
                  // 下单有奖：未拆 = 合着的红包，已拆 = 拆开的红包（点开重看结果）
                  sfFeatures.lottery && paid && order.lottery && order.lottery.state !== 'VOID' && (
                    <RedPacketButton
                      key="lottery"
                      view={order.lottery}
                      canDraw={!!order.lotteryCanDraw}
                      onClick={() => setLotteryOrder(order)}
                    />
                  ),
                ].filter(Boolean)

                /* 主按钮：一张卡最多一个。接码单的付款与查号都在号码页（同一个地址，不再并排放两个） */
                const primaryAction = jc ? (
                  jc.showGoPay ? (
                    <PrimaryLink href={numberHref} tone="pay">
                      去付款（号码页）
                    </PrimaryLink>
                  ) : jc.showNumberLink ? (
                    <PrimaryLink href={numberHref}>查看号码</PrimaryLink>
                  ) : null
                ) : showRedeem ? (
                  // 一单一卡且有兑换地址 → 直接去兑换页（站内兑换已带好卡密）；多张卡各有各的地址，进发货详情逐张兑换
                  entry.primaryRedeemUrl && entry.cardRows.length === 1 ? (
                    <PrimaryLink href={entry.primaryRedeemUrl} external={!entry.primaryInSite}>
                      去充值 / 兑换
                    </PrimaryLink>
                  ) : (
                    <PrimaryButton onClick={() => openPanel(order, 'delivery')}>
                      {entry.primaryRedeemUrl ? '去充值 / 兑换' : '查看卡密'}
                    </PrimaryButton>
                  )
                ) : order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED' ? (
                  <PrimaryButton tone="pay" loading={payingNo === order.orderNo} onClick={() => handleAlipay(order)}>
                    支付宝或微信支付
                  </PrimaryButton>
                ) : null

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04 }}
                    className="ui-panel rounded-[20px] p-5 transition-colors duration-200 lg:px-7 lg:py-6 lg:hover:border-white/[0.14]"
                  >
                    {/* 第一行：商品名 + 状态 ｜ 金额。状态用「小圆点 + 彩色文字」而不是填充胶囊：
                        一张卡最多会同时出现状态、未读、票据三条信息，三个实心胶囊排在一起就是截图里那种「花」 */}
                    <div className="flex items-start gap-4 lg:gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <h3 className={`text-[17px] lg:text-[19px] font-semibold leading-snug tracking-tight ${dim ? 'text-white/65' : ''}`}>
                            {order.productName}
                          </h3>
                          <StatusDot color={status.color} label={status.label} />
                          {!!order.unreadCount && order.unreadCount > 0 && (
                            <StatusDot color="text-rose-400" label={`客服新回复 ${order.unreadCount}`} />
                          )}
                        </div>

                        {/* 元信息一行：订单号（整块可点复制）· 时间 · 票据状态。
                            分隔点在手机上藏起来，否则换行后行尾会吊着一个「·」 */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-white/45">
                          <button
                            onClick={() => copyOrderNo(order.orderNo)}
                            title="复制订单号"
                            className="group/no inline-flex items-center gap-1.5 font-mono transition-colors hover:text-white/80"
                          >
                            {order.orderNo}
                            <Copy className="h-3 w-3 opacity-50 transition-opacity group-hover/no:opacity-100" />
                          </button>
                          <span className="hidden text-white/20 sm:inline">·</span>
                          <span className="tabular-nums">{formatDate(order.createdAt)}</span>
                          {billingNote && (
                            <>
                              <span className="hidden text-white/20 sm:inline">·</span>
                              <span className={billingNote.cls}>{billingNote.label}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className={`text-[22px] lg:text-2xl font-semibold leading-none tabular-nums ${dim ? 'text-white/55' : ''}`}>
                          {/* 接码单大字一律是订单金额；余额预扣与还需支付宝分两行写（jiemaAmountLines） */}
                          {orderAmountText(Number(jAmount ? jAmount.main : order.payStatus === 'UNPAID' ? order.payable : order.amount), order.product?.deliveryType)}
                        </div>
                        {jAmount?.lines.map((l) => (
                          <div key={l} className="mt-1.5 text-[11px] leading-tight text-cyan-200/75">
                            {l}
                          </div>
                        ))}
                        {order.payStatus === 'UNPAID' && order.invoiceTaxFee ? (
                          <div className="mt-1.5 text-[11px] leading-tight text-amber-300/80">含发票税费 ¥{order.invoiceTaxFee.toFixed(2)}</div>
                        ) : null}
                      </div>
                    </div>

                    {/* 第二行：一句提示 + 操作。
                        手机端竖排（提示 / 次要操作 / 整行主按钮），lg 起排成一行：提示占满中间、按钮靠右。
                        提示必须是能伸缩的 flex-1 + min-w，按钮组才不会把它挤成一列竖排字（改版前的样子）。
                        没有提示时放一个等宽占位，各张卡片的按钮才会落在同一条右边线上 */}
                    {(hint || primaryAction || secondaryActions.length > 0) && (
                      <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.07] pt-4 lg:mt-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:gap-x-6 lg:pt-5">
                        {hint ? (
                          <p className={`min-w-[180px] flex-1 text-[13px] leading-relaxed lg:text-sm ${hintCls}`}>{hint}</p>
                        ) : (
                          <div className="hidden flex-1 lg:block" />
                        )}

                        <div className="-ml-2.5 flex flex-wrap items-center gap-0.5 lg:ml-0 lg:shrink-0">
                          {secondaryActions}
                        </div>

                        {primaryAction}
                      </div>
                    )}

                    {/* 开票提示（D37 清单第 ⑤ 项）：已付款或已取消 / 已退款的接码卡片；「联系客服」打开这张单的订单留言 */}
                    {jc && jc.showInvoiceNotice && (
                      <p className="mt-3 text-xs text-white/40">
                        暂不支持开票，可
                        <button onClick={() => openPanel(order, 'chat')} className="text-cyan-300/90 hover:underline">
                          联系客服
                        </button>
                        开票处理
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 分段加载：每次追加一页，避免订单多时一次性拉全量 */}
        {!loading && orders.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            {page < totalPages ? (
              <button
                onClick={() => loadOrders({ append: true })}
                disabled={loadingMore}
                className="px-6 py-3 lg:px-10 lg:py-3.5 rounded-xl glass hover:bg-white/10 lg:hover:border-white/25 text-sm lg:text-base font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loadingMore ? '加载中...' : '加载更多订单'}
              </button>
            ) : (
              <span className="text-xs text-white/30">没有更多了</span>
            )}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 ui-card p-6 text-center"
          >
            <p className="text-sm text-white/60 mb-3">
              订单遇到问题？联系我们的专属客服
            </p>
            <button
              onClick={() => {
                setPanel(null)
                setContactOpen(true)
              }}
              className="ui-btn ui-btn-secondary ui-btn-sm px-5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2C4.768 2 1.5 4.65 1.5 7.913c0 1.873 1.075 3.534 2.715 4.642a.522.522 0 01.222.434.677.677 0 01-.027.187l-.352 1.336c-.016.072-.04.144-.04.216 0 .144.117.262.262.262.058 0 .115-.019.166-.047l1.722-.998a.766.766 0 01.4-.115c.077 0 .15.013.222.034a8.49 8.49 0 002.32.317c.207 0 .413-.013.617-.034A4.886 4.886 0 019.5 12.5c0-2.945 2.842-5.336 6.353-5.336.137 0 .272.005.404.013C15.677 4.06 12.477 2 8.691 2z" />
              </svg>
              联系客服
            </button>
          </motion.div>
        )}
      </div>

      {/* 发货详情弹窗 */}
      {panel && panel.type === 'delivery' && (
        <DeliveryPanel
          order={panel.order}
          justPaid={!!panel.justPaid}
          onClose={() => setPanel(null)}
          onShowBilling={() => setPanel({ order: panel.order, type: 'billing' })}
          onContact={() => setPanel({ order: panel.order, type: 'chat' })}
        />
      )}

      {/* 发票 / 收据弹窗 */}
      {panel && panel.type === 'billing' && panel.order.billing && (
        <BillingPanel
          order={panel.order}
          onClose={() => setPanel(null)}
          onApplyInvoice={() => setInvoiceOrder(panel.order)}
          onApplyReceipt={() => setReceiptOrder(panel.order)}
        />
      )}

      {/* 在线沟通弹窗 */}
      {panel && panel.type === 'chat' && (
        <ChatPanel order={panel.order} onClose={() => setPanel(null)} />
      )}

      {/* 发票表单（叠加在「发票/收据」弹窗之上） */}
      {invoiceOrder && invoiceOrder.billing && (
        <InvoiceModal
          order={invoiceOrder}
          defaultEmail={user.email || ''}
          onClose={(refresh) => {
            setInvoiceOrder(null)
            // 「税费已随订单付清、发票直接落地」那条路不会跳转收银台，
            // 页面还停在原地，必须重新拉一次才能看到状态变成「已提交开票」
            if (refresh) loadOrders()
          }}
        />
      )}
      {receiptOrder && receiptOrder.billing && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
          onSuccess={(token) => {
            // 本地即时反映「已开具」，并刷新列表
            setOrders((prev) =>
              prev.map((o) =>
                o.id === receiptOrder.id && o.billing
                  ? { ...o, billing: { ...o.billing, receiptToken: token } }
                  : o
              )
            )
            setPanel((prev) =>
              prev && prev.order.id === receiptOrder.id && prev.order.billing
                ? { ...prev, order: { ...prev.order, billing: { ...prev.order.billing, receiptToken: token } } }
                : prev
            )
            setReceiptOrder(null)
            loadOrders()
          }}
        />
      )}

      {/* 下单有奖：拆红包 / 重看结果 */}
      {sfFeatures.lottery && lotteryOrder && lotteryOrder.lottery && (
        <LotteryModal
          orderNo={lotteryOrder.orderNo}
          productName={lotteryOrder.productName}
          view={lotteryOrder.lottery}
          canDraw={!!lotteryOrder.lotteryCanDraw}
          onClose={() => setLotteryOrder(null)}
          onDrawn={(view) => handleLotteryDrawn(lotteryOrder.id, view)}
          onContact={() => {
            const o = lotteryOrder
            setLotteryOrder(null)
            openPanel(o, 'chat')
          }}
        />
      )}

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  )
}

// 订单卡片上的状态标：小圆点 + 彩色文字。
// 一张卡上最多会同时出现「状态 / 客服新回复 / 票据」三条，三个实心胶囊排在一起就是改版前那种花花绿绿的样子。
function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}

// 订单卡片上的次要操作（发货详情 / 发票收据 / 联系客服）：幽灵按钮，不抢主按钮的视觉
function ActionButton({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] lg:text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      <Icon className="h-4 w-4" />
      {label}
      {!!badge && badge > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
    </button>
  )
}

/*
 * 订单卡片上的主按钮：一张卡最多一个，就是这张单「下一步该做什么」。
 * 白色药丸 = 下一步（去兑换 / 查看号码，与页头「注册」、学习平台同一个主按钮）；蓝色 = 去付款。
 * 手机端整行（拇指区），lg 起回到按钮宽度、跟次要操作排在同一行。
 */
const PRIMARY_CLS =
  'inline-flex w-full min-h-[40px] items-center justify-center gap-1 rounded-full px-5 text-sm font-semibold transition-colors lg:w-auto lg:shrink-0'
const PRIMARY_TONE = {
  next: 'bg-white text-black hover:bg-white/85',
  pay: 'bg-[#1677FF] text-white hover:bg-[#0e5fd8]',
} as const

function PrimaryButton({
  children,
  onClick,
  tone = 'next',
  loading,
}: {
  children: ReactNode
  onClick: () => void
  tone?: keyof typeof PRIMARY_TONE
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${PRIMARY_CLS} ${PRIMARY_TONE[tone]} disabled:opacity-60`}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
      {children}
      {tone === 'next' && <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

// 同上，链接版。外链新开标签页；站内兑换页是相对地址，走 Link（会预取）
function PrimaryLink({
  href,
  children,
  tone = 'next',
  external,
}: {
  href: string
  children: ReactNode
  tone?: keyof typeof PRIMARY_TONE
  external?: boolean
}) {
  const cls = `${PRIMARY_CLS} ${PRIMARY_TONE[tone]}`
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>
        {children}
        <ChevronRight className="h-4 w-4" />
      </a>
    )
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <ChevronRight className="h-4 w-4" />
    </Link>
  )
}

// 通用弹窗外壳（标题栏 + 关闭按钮 + 可滚动内容区）
//
// 弹窗宽度按断点递进的原因：w-full + max-w-md 在手机上是被屏幕宽度先卡住的，
// 448px 这个上限只有桌面端才真正生效 —— 于是 1920 屏上同一个弹窗就变成正中一条细长条，
// 卡密/订单号这类等宽长串还会被迫折行。所以 sm 起 512、lg 起 576，手机端表现完全不变。
// 高度同理：90vh 在 1080p 上等于顶天立地，lg 收到 82vh 让弹窗四周留出可见的暗底边界。
function PanelModal({
  title,
  icon,
  onClose,
  children,
  maxW = 'max-w-md sm:max-w-lg lg:max-w-xl',
}: {
  title: string
  icon: ReactNode
  onClose: () => void
  children: ReactNode
  maxW?: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      {/* 手机端轻量模式（2026-10-01，站长要求电脑端不变）：触屏设备上不做毛玻璃（iOS WebKit 每帧整屏重算模糊，卡顿、黑块），遮罩改深色 lite:bg-black/90，背后的字不透出来 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl lite:bg-black/90" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxW} glass-strong rounded-3xl p-6 lg:p-8 max-h-[90vh] lg:max-h-[82vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-5 lg:mb-6">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50 flex-shrink-0">{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  )
}

// 发货详情：（付款成功提示）+ 卡密与充值步骤 + 订单信息 + 交付信息 + 短信接码
function DeliveryPanel({
  order,
  justPaid = false,
  onClose,
  onShowBilling,
  onContact,
}: {
  order: Order
  /** 刚从收银台付完款自动打开的：顶部多一条「支付成功」 */
  justPaid?: boolean
  onClose: () => void
  /** 切到「发票 / 收据」弹窗 */
  onShowBilling: () => void
  /** 切到这张单的「在线沟通」 */
  onContact: () => void
}) {
  const { cardRows, hasCards, isUsable, fallbackRedeemUrl, primaryRedeemUrl, primaryInSite } = redeemEntry(order)
  const [copied, setCopied] = useState<number | null>(null)
  const copyCard = (secret: string, i: number) => {
    navigator.clipboard?.writeText(secret).catch(() => {})
    setCopied(i)
    setTimeout(() => setCopied((cur) => (cur === i ? null : cur)), 1600)
  }
  const voided = order.deliveryStatus === 'CANCELLED'
  const showHint = !hasCards && !order.deliveryInfo && order.product?.deliveryType !== 'SMS' && order.product?.deliveryType !== 'SMS_POOL'
  return (
    <PanelModal title="发货详情" icon={<Package className="w-5 h-5 text-emerald-400" />} onClose={onClose}>
      <div className="space-y-4 text-sm">
        {justPaid && !voided && (
          <div className="flex items-start gap-3 rounded-2xl border border-green-400/30 bg-green-500/10 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            <div>
              <div className="font-semibold text-green-200">支付成功</div>
              <div className="mt-0.5 text-xs leading-relaxed text-white/60">
                {hasCards
                  ? '卡密已自动发放，按下面三步完成充值。'
                  : order.deliveryStatus === 'DELIVERED'
                    ? '订单已交付，交付内容见下方。'
                    : order.product?.deliveryType === 'MANUAL'
                      ? '这是人工服务：客服会尽快与你对接，进度可在这一单的「与客服在线沟通」里跟进。'
                      : order.product?.deliveryType === 'SMS'
                        ? '正在为你取号，号码与验证码会显示在下方。'
                        : '订单正在处理中，发货后内容会显示在这里，并发邮件到你的账号邮箱。'}
              </div>
            </div>
          </div>
        )}
        {hasCards && (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
            {/* 三步指引：卡密到手不等于充值完成，这是买家最常卡住的地方（站长 2026-10-13） */}
            <div className="mb-3 text-sm font-semibold text-emerald-200">卡密已发放，还差最后一步：把它充到你的账号</div>
            <ol className="mb-4 space-y-1.5 text-xs text-white/70">
              {[
                '复制下面的卡密（点右侧「复制」）',
                primaryRedeemUrl
                  ? primaryInSite
                    ? '点「去充值 / 兑换」打开兑换页，卡密已自动填好'
                    : '点「去充值 / 兑换」打开兑换页，粘贴卡密'
                  : order.product?.cardUsage
                    ? '按下面的「使用说明」找到充值入口，粘贴卡密'
                    : '到对应平台的充值 / 兑换入口粘贴卡密；不确定在哪里，点下方「联系客服」',
                '按页面提示填写要充值的账号并确认，完成后即到账',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] font-semibold text-emerald-200">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="text-white/50 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" /> 卡密（请妥善保管）
            </div>
            <div className="space-y-2">
              {cardRows.map((row, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-white/5 border border-green-500/30 font-mono text-xs break-all">
                      {row.secret}
                    </div>
                    <button
                      onClick={() => copyCard(row.secret, i)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs whitespace-nowrap"
                    >
                      {copied === i ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === i ? '已复制' : '复制'}
                    </button>
                  </div>
                  {/* 该卡有专属兑换地址且与商品默认不同时，单独给一个入口 */}
                  {isUsable(row.redeemUrl) && row.redeemUrl !== fallbackRedeemUrl && (
                    <a
                      href={row.redeemUrl!}
                      {...(row.inSite ? {} : { target: '_blank', rel: 'noreferrer noopener' })}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200"
                    >
                      {row.inSite ? '在本站兑换这张卡' : '本卡兑换地址'}
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            {/* 统一入口：优先用第一张卡的专属地址，没有才回落商品级默认链接 */}
            {primaryRedeemUrl && (
              <a
                href={primaryRedeemUrl}
                {...(primaryInSite ? {} : { target: '_blank', rel: 'noreferrer noopener' })}
                className="mt-3 group flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all"
              >
                去充值 / 兑换
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
            <p className="text-[11px] text-white/40 mt-2">
              卡密仅本人可见，会一直保留在这一单里，随时可以回来复制。充值遇到问题？
              <button type="button" onClick={onContact} className="text-cyan-300/90 hover:underline">
                联系客服
              </button>
            </p>
            {order.product?.cardUsage && (
              <div className="mt-3">
                <div className="text-white/50 mb-1.5 text-sm">使用说明</div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                  {order.product.cardUsage}
                </div>
              </div>
            )}
          </div>
        )}

        <InfoRow label="订单号" value={<span className="font-mono">{order.orderNo}</span>} />
        <InfoRow label="商品" value={<span className="font-medium">{order.productName}</span>} />
        <InfoRow label="金额" value={<span className="font-bold text-lg">¥{Number(order.amount).toFixed(2)}</span>} />
        {order.product?.deliveryType === 'SMS_POOL' && order.jiema && order.jiema.holdCents > 0 && (
          <InfoRow
            label="余额抵扣"
            value={
              <span className="text-cyan-200">
                ¥{(order.jiema.holdCents / 100).toFixed(2)}
                {order.jiema.holdState === 'HELD' ? '（已预扣）' : order.jiema.holdState === 'RELEASED' ? '（已退回）' : order.jiema.holdState === 'REFUNDED' ? '（已退回余额）' : ''}
              </span>
            }
          />
        )}
        {/* 【已付订单也要显示】这一行是买家对账用的：他支付宝里扣的是含税的那个数，
            付款后就把它藏起来，等于让他拿着一份对不上的材料去报销 */}
        {order.invoiceTaxFee ? (
          <InfoRow
            label="发票税费"
            value={
              <span className="text-amber-300">
                +¥{order.invoiceTaxFee.toFixed(2)} ·{' '}
                {order.payStatus === 'UNPAID' ? '应付' : '实付'} ¥{Number(order.payable).toFixed(2)}
              </span>
            }
          />
        ) : null}
        {/* 这张订单开过（或结账时预付过）发票：在订单详情里就能看到发票走到哪一步了，
            不用再去猜「发票 / 收据」里有没有东西 */}
        {order.payStatus === 'PAID' &&
          order.billing &&
          (order.billing.invoiceStatus !== 'UNAPPLIED' || order.billing.invoicePrepaid) && (
            <InfoRow
              label="发票"
              value={
                <span className="inline-flex items-center justify-end gap-2 flex-wrap">
                  <span className="text-white/80">
                    {INVOICE_LABELS[order.billing.invoiceStatus] || order.billing.invoiceStatus}
                  </span>
                  <button
                    type="button"
                    onClick={onShowBilling}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md glass hover:bg-white/10 text-xs text-purple-300 transition-colors"
                  >
                    查看
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </span>
              }
            />
          )}
        <InfoRow label="下单时间" value={formatDate(order.createdAt)} />
        {order.paidAt && <InfoRow label="支付时间" value={formatDate(order.paidAt)} />}
        {order.deliveredAt && <InfoRow label="交付时间" value={formatDate(order.deliveredAt)} />}

        {order.deliveryInfo && (
          <div>
            <div className="text-white/50 mb-2">交付信息</div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs whitespace-pre-wrap">
              {order.deliveryInfo}
            </div>
          </div>
        )}

        {order.payStatus === 'PAID' && order.product?.deliveryType === 'SMS' && (
          <div className="pt-1">
            <div className="text-white/50 mb-2">短信接码</div>
            <OrderSms orderId={order.id} />
          </div>
        )}

        {/* 通用接码单（SMS_POOL）：号码、验证码、换号取消都在号码页，这里只给链接，不挂载旧单品的 OrderSms（§6.6 第 27 条） */}
        {order.product?.deliveryType === 'SMS_POOL' && (
          <Link
            href={`/jiema/order/${encodeURIComponent(order.orderNo)}`}
            className="flex items-center justify-between rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-cyan-100 hover:bg-cyan-500/15"
          >
            <span>短信接码 · 查看号码</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {showHint && (
          <div className="text-xs text-white/40 pt-1">
            {order.payStatus !== 'PAID'
              ? '订单支付后将在此显示发货信息'
              : order.deliveryStatus === 'DELIVERED'
                ? '本订单已交付，如未收到请联系客服'
                : '商家正在为你开通服务，请稍候或联系客服'}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-3 rounded-xl glass hover:bg-white/10 text-sm font-medium transition-colors"
      >
        关闭
      </button>
    </PanelModal>
  )
}

// 发票 / 收据：状态与申请入口
function BillingPanel({
  order,
  onClose,
  onApplyInvoice,
  onApplyReceipt,
}: {
  order: Order
  onClose: () => void
  onApplyInvoice: () => void
  onApplyReceipt: () => void
}) {
  const b = order.billing!
  return (
    <PanelModal title="发票 / 收据" icon={<FileText className="w-5 h-5 text-purple-400" />} onClose={onClose}>
      <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-white/40">商品</span><span className="text-white/80 font-medium text-right">{order.productName}</span></div>
        <div className="flex justify-between"><span className="text-white/40">订单号</span><span className="text-white/70 font-mono text-xs break-all text-right">{order.orderNo}</span></div>
        <div className="flex justify-between"><span className="text-white/40">售价</span><span className="text-white/90 font-semibold">¥{b.sellingPrice.toFixed(2)}</span></div>
      </div>

      {/* 发票 */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-white/40" />
          <span className="text-white/50">发票</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              b.invoiceStatus === 'ISSUED'
                ? 'bg-green-500/15 text-green-300'
                : b.invoiceStatus === 'CANNOT'
                  ? 'bg-gray-500/15 text-gray-400'
                  : b.invoiceStatus === 'SUBMITTED'
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {INVOICE_LABELS[b.invoiceStatus] || b.invoiceStatus}
          </span>
        </div>
        {/* 【b.invoicePrepaid 的单不给这个按钮】结账时勾过开发票的订单，6% 已经跟货款
            一起付清了，再点一次就是第二次收税。服务端也有同一道闸
            （lib/order-invoice.settlePrepaidOrderInvoice），这里只是不让按钮出现在眼前。 */}
        {b.invoiceStatus === 'UNAPPLIED' && b.canInvoice && !b.invoicePrepaid && (
          <button
            onClick={onApplyInvoice}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
          >
            申请发票
          </button>
        )}
        {b.invoicePrepaid && (
          <span className="text-xs text-white/40">税费已随订单支付，无需再付</span>
        )}
        {b.invoiceStatus === 'AWAIT_PAY' && b.invoiceId && <PayTaxButton invoiceId={b.invoiceId} />}
      </div>

      {/* 发票明细：抬头、税号、邮箱都是买家自己填的，开没开、什么时候开的要让他看得到 */}
      {b.invoice && <InvoiceDetail inv={b.invoice} prepaid={!!b.invoicePrepaid} />}

      {/* 收据 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-white/40" />
          <span className="text-white/50">收据</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              b.receiptToken
                ? 'bg-green-500/15 text-green-300'
                : b.canReceipt
                  ? 'bg-white/10 text-white/60'
                  : 'bg-gray-500/15 text-gray-400'
            }`}
          >
            {b.receiptToken ? '已开具' : b.canReceipt ? '可开具' : '不可开具'}
          </span>
        </div>
        {b.receiptToken ? (
          <a
            href={`/receipt/${b.receiptToken}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-lg glass text-sm font-medium hover:bg-white/10 transition-colors"
          >
            查看收据
          </a>
        ) : b.canReceipt ? (
          <button
            onClick={onApplyReceipt}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-sm font-medium hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
          >
            申请收据
          </button>
        ) : null}
      </div>

      <p className="text-[11px] text-white/30 mt-4 leading-relaxed">
        发票需在线支付 6% 税费后由商家开具并发送至邮箱；收据可即时生成、仅可开具一次。如有疑问请联系客服。
      </p>
    </PanelModal>
  )
}

// 「发票 / 收据」弹窗里的发票明细（主发票）
function InvoiceDetail({ inv, prepaid }: { inv: BillingInvoice; prepaid: boolean }) {
  const money = (n: number | null) => (n == null ? '—' : `¥${n.toFixed(2)}`)
  // 「待支付」只对真正等着付税费的票（AWAIT_PAY）成立。后台直接改状态建出来的空壳、
  // 或被标成「不可开据」的票 payStatus 也是 UNPAID，但买家既不该付、也付不了 —— 不能对他说「待支付」
  const payLabel = inv.payStatus === 'PAID' || prepaid ? '已支付' : inv.status === 'AWAIT_PAY' ? '待支付' : null
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 text-white/70 font-medium mb-1">
        <FileText className="w-4 h-4 text-purple-400" /> 发票信息
      </div>
      <InfoRow label="发票号" value={<span className="font-mono text-xs">{inv.invoiceNo}</span>} />
      <InfoRow label="状态" value={INVOICE_LABELS[inv.status] || inv.status} />
      <InfoRow label="抬头" value={inv.title || '—'} />
      <InfoRow label="税号" value={inv.taxNumber ? <span className="font-mono text-xs">{inv.taxNumber}</span> : '—'} />
      <InfoRow label="接收邮箱" value={inv.email || '—'} />
      <InfoRow label="开票金额（含税）" value={money(inv.invoiceAmount)} />
      <InfoRow
        label="税费"
        value={
          inv.taxFee == null ? (
            '—'
          ) : (
            <span>
              {money(inv.taxFee)}
              {payLabel && (
                <span className={payLabel === '已支付' ? 'text-green-300' : 'text-amber-300'}>
                  {' '}· {payLabel}
                </span>
              )}
            </span>
          )
        }
      />
      <InfoRow label="提交时间" value={inv.submittedAt ? formatDate(inv.submittedAt) : '—'} />
      <InfoRow
        label="开具时间"
        value={inv.issuedAt ? formatDate(inv.issuedAt) : inv.status === 'ISSUED' ? '—' : <span className="text-white/40">尚未开具</span>}
      />
    </div>
  )
}

// 在线沟通：本订单专属客服会话
function ChatPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <PanelModal title="与客服在线沟通" icon={<MessageSquare className="w-5 h-5 text-cyan-400" />} onClose={onClose} maxW="max-w-lg lg:max-w-2xl">
      <p className="text-xs text-white/40 mb-3">
        {order.productName} · 订单号 <span className="font-mono">{order.orderNo}</span>
      </p>
      <OrderChat apiBase={`/api/orders/${order.id}/messages`} selfRole="BUYER" theme="dark" />
    </PanelModal>
  )
}

// 待支付税费：跳转支付宝
function PayTaxButton({ invoiceId }: { invoiceId: number }) {
  const [loading, setLoading] = useState(false)
  const pay = async () => {
    setLoading(true)
    try {
      const channel = typeof window !== 'undefined' && window.innerWidth < 768 ? 'wap' : 'page'
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        window.location.href = data.data.payUrl
      } else {
        alert(data.error || '发起支付失败')
        setLoading(false)
      }
    } catch {
      alert('网络错误，请重试')
      setLoading(false)
    }
  }
  return (
    <button
      onClick={pay}
      disabled={loading}
      className="px-4 py-1.5 rounded-lg bg-[#1677FF] text-white text-sm font-medium hover:bg-[#0e5fd8] transition-colors disabled:opacity-60"
    >
      {loading ? '处理中...' : '去支付税费'}
    </button>
  )
}

// 发票申请弹窗（从「我的订单」直接申请）
function InvoiceModal({
  order,
  defaultEmail,
  onClose,
}: {
  order: Order
  defaultEmail: string
  /** refresh=true 表示状态已在服务端改变，调用方需要重新拉列表 */
  onClose: (refresh?: boolean) => void
}) {
  const b = order.billing!
  const [title, setTitle] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [email, setEmail] = useState(defaultEmail || '')
  // 必选项：发票中是否展示 ChatGPT/Claude 相关字眼。null = 尚未选择（不给默认值，强制买家表态）
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  // 发票项目：默认技术咨询服务（= 可选之前的固定值）
  const [invoiceItem, setInvoiceItem] = useState<InvoiceItemKey>(DEFAULT_INVOICE_ITEM)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // 已保存的抬头：点一下把整份信息填进表单，省掉每次重敲税号
  const { titles, loaded: titlesLoaded, authed } = useSavedTitles(true)
  const [titleId, setTitleId] = useState<number | null>(null)
  const [saveTitle, setSaveTitle] = useState(true)
  /** 买家动过任何一个字段后，就不再让迟到的接口结果覆盖他填的内容 */
  const touched = useRef(false)

  const applyTitle = (t: SavedTitle) => {
    setTitleId(t.id)
    setTitle(t.title)
    setTaxNumber(t.taxNumber)
    setAddress(t.address || '')
    setPhone(t.phone || '')
    setBankName(t.bankName || '')
    setBankAccount(t.bankAccount || '')
    setEmail(t.email || defaultEmail || '')
    setSaveTitle(false) // 已经存过的不用再存
  }

  const startNewTitle = () => {
    // 标记 touched：这是买家的明确选择，不能再被迟到的「自动带入默认抬头」盖回去
    touched.current = true
    setTitleId(null)
    setTitle('')
    setTaxNumber('')
    setAddress('')
    setPhone('')
    setBankName('')
    setBankAccount('')
    setEmail(defaultEmail || '')
    setSaveTitle(true)
  }

  // 打开弹窗时自动带入默认抬头。
  // 【守的是 touched 而不是「抬头填了没」】买家完全可能先敲税号或邮箱，
  // 这时接口才返回，只看 title 的话会把他已经填好的其它字段整片盖掉。
  useEffect(() => {
    if (!titlesLoaded || titleId !== null || touched.current) return
    const def = titles.find((t) => t.isDefault) || titles[0]
    if (def) applyTitle(def)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titlesLoaded, titles])

  /** 字段 setter 外套一层：标记买家动过表单，并清掉「用的是哪条已保存抬头」 */
  const edit = (setter: (v: string) => void, identity = false) => (v: string) => {
    touched.current = true
    // 只有抬头/税号会让它「不再是那条已保存抬头」。改地址电话仍是同一个抬头，
    // 清掉 titleId 只会让这条常用抬头的「最近使用时间」刷不上、在候选里一路下沉
    if (identity) setTitleId(null)
    setter(v)
  }

  const submit = async () => {
    setErr(null)
    if (!title.trim()) return setErr('请填写发票抬头')
    if (!taxNumber.trim()) return setErr('请填写税号')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('请填写正确的接收邮箱')
    if (showAiWording === null) return setErr('请选择发票中是否展示 ChatGPT/Claude 相关字眼')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          taxNumber: taxNumber.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          bankName: bankName.trim() || null,
          bankAccount: bankAccount.trim() || null,
          email: email.trim(),
          showAiWording,
          invoiceItem,
          titleId,
          saveTitle: titleId === null && saveTitle,
        }),
      })
      const data = await res.json()
      if (data.success && data.data?.payUrl) {
        window.location.href = data.data.payUrl
        return
      }
      // 结账时已经把 6% 跟货款一起付清的订单：服务端直接把发票落成「已提交」，
      // 不会再给收款链接。这是成功，不是失败——别让买家看到一个红色「提交失败」
      if (data.success) {
        alert(data.message || '发票申请已提交，税费已随订单支付，无需再付')
        onClose(true)
        return
      }
      setErr(data.error || '提交失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    opts?: { required?: boolean; placeholder?: string; type?: string }
  ) => (
    <div>
      <label className="block text-xs lg:text-[13px] text-white/50 mb-1 lg:mb-1.5">
        {label}
        {opts?.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 lg:px-4 lg:py-2.5 text-white placeholder:text-white/25 outline-none focus:border-purple-500/50 text-sm lg:text-[15px]"
      />
    </div>
  )

  // 【不要把 onClose 直接当 onClick 用】它的入参是「要不要刷新列表」，
  // 而 onClick 会把 MouseEvent 传进去 —— 那是个真值，等于每次点关闭都白拉一次列表
  const dismiss = () => onClose()

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" onClick={dismiss}>
      {/* 手机端轻量模式（2026-10-01，站长要求电脑端不变）：触屏设备上不做毛玻璃（iOS WebKit 每帧整屏重算模糊，卡顿、黑块），遮罩改深色 lite:bg-black/90，背后的字不透出来 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl lite:bg-black/90" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg lg:max-w-2xl glass-strong rounded-3xl p-6 lg:p-8 max-h-[90vh] lg:max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-5">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" /> 申请发票
          </h3>
          <button onClick={dismiss} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-white/40">商品</span>
            <span className="text-white/80 font-medium">{order.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">订单号</span>
            <span className="text-white/70 font-mono text-xs break-all">{order.orderNo}</span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex justify-between">
            <span className="text-white/40">售价</span>
            <span className="text-white/80">¥{b.sellingPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">开票金额（含税）</span>
            <span className="text-white/90 font-semibold">¥{b.invoiceAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-300/80">需支付税费（6%）</span>
            <span className="text-amber-300 font-bold">¥{b.taxFee.toFixed(2)}</span>
          </div>
        </div>

        <InvoiceTitlePicker titles={titles} selectedId={titleId} onPick={applyTitle} onNew={startNewTitle} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          <div className="sm:col-span-2">
            {field('抬头', title, edit(setTitle, true), { required: true, placeholder: '公司名称 / 个人' })}
          </div>
          <div className="sm:col-span-2">
            {field('税号', taxNumber, edit(setTaxNumber, true), { required: true, placeholder: '纳税人识别号（带空格会自动去掉）' })}
          </div>
          {field('地址', address, edit(setAddress), { placeholder: '选填' })}
          {field('电话', phone, edit(setPhone), { placeholder: '选填' })}
          {field('开户行', bankName, edit(setBankName), { placeholder: '选填' })}
          {field('卡号', bankAccount, edit(setBankAccount), { placeholder: '选填' })}
          <div className="sm:col-span-2">{field('接收邮箱', email, edit(setEmail), { required: true, type: 'email', placeholder: '发票将发送到此邮箱' })}</div>

          {/* 必选：发票内容是否展示 AI 平台字眼 */}
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/50 mb-1.5">
              发票中是否展示 ChatGPT/Claude 相关字眼<span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: '展示', desc: '发票项目按实际订阅名称开具' },
                { v: false, label: '不展示', desc: '发票项目使用通用名称' },
              ].map((opt) => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => setShowAiWording(opt.v)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    showAiWording === opt.v
                      ? 'border-purple-500/60 bg-purple-500/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-medium text-white/90">{opt.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <InvoiceItemSelect className="sm:col-span-2" value={invoiceItem} onChange={setInvoiceItem} />
        </div>

        {authed && titleId === null && (
          <button
            type="button"
            onClick={() => setSaveTitle((v) => !v)}
            className="mt-3 flex items-center gap-2 text-left text-xs text-white/50 hover:text-white/70"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                saveTitle ? 'border-purple-400 bg-purple-500' : 'border-white/25 bg-white/5'
              }`}
            >
              {saveTitle && <Check className="h-3 w-3" />}
            </span>
            保存这个抬头，下次开票一键填入（可在个人中心管理）
          </button>
        )}

        {err && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
        >
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          提交发票并支付税费 ¥{b.taxFee.toFixed(2)}
        </button>
        <p className="text-xs text-white/30 text-center mt-2">提交后将跳转收银台，用支付宝或微信支付 6% 税费，支付完成即提交开票</p>
      </motion.div>
    </div>
  )
}

// 收据申请弹窗（从「我的订单」直接申请）
function ReceiptModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order
  onClose: () => void
  onSuccess: (token: string) => void
}) {
  const b = order.billing!
  const [payerTitle, setPayerTitle] = useState('')
  // 必选项：收据中是否展示 ChatGPT/Claude 相关字眼（与发票同一口径）。
  // null = 尚未选择 —— 收据只能开一次、开完改不了，不能替买家默认成任何一边
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  // 收据项目：与发票同一份清单，默认技术咨询服务
  const [invoiceItem, setInvoiceItem] = useState<InvoiceItemKey>(DEFAULT_INVOICE_ITEM)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setErr(null)
    if (!payerTitle.trim()) return setErr('请填写付款人抬头')
    if (showAiWording === null) return setErr('请选择收据中是否展示 ChatGPT/Claude 相关字眼')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerTitle: payerTitle.trim(), showAiWording, invoiceItem }),
      })
      const data = await res.json()
      if (data.success && data.data?.token) {
        window.open(`/receipt/${data.data.token}`, '_blank')
        onSuccess(data.data.token)
        return
      }
      setErr(data.error || '生成失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      {/* 手机端轻量模式（2026-10-01，站长要求电脑端不变）：触屏设备上不做毛玻璃（iOS WebKit 每帧整屏重算模糊，卡顿、黑块），遮罩改深色 lite:bg-black/90，背后的字不透出来 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl lite:bg-black/90" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md lg:max-w-lg glass-strong rounded-3xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-5">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" /> 申请收据
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-white/40">收款人</span><span className="text-white/80 text-right">益阳市赫山区必高科技有限公司</span></div>
          <div className="flex justify-between"><span className="text-white/40">商品</span><span className="text-white/80">{order.productName}</span></div>
          <div className="flex justify-between"><span className="text-white/40">订单号</span><span className="text-white/70 font-mono text-xs break-all">{order.orderNo}</span></div>
          {b.receiptAmount > b.sellingPrice && (
            <>
              <div className="flex justify-between"><span className="text-white/40">商品售价</span><span className="text-white/70">¥{b.sellingPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-white/40">已付发票税费（6%）</span><span className="text-white/70">¥{(b.receiptAmount - b.sellingPrice).toFixed(2)}</span></div>
            </>
          )}
          <div className="flex justify-between"><span className="text-white/40">付款金额</span><span className="text-white/90 font-bold">¥{b.receiptAmount.toFixed(2)}</span></div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">
            付款人抬头<span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            value={payerTitle}
            onChange={(e) => setPayerTitle(e.target.value)}
            placeholder="公司名称 / 个人姓名"
            maxLength={200}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 text-sm"
          />
        </div>

        <InvoiceItemSelect className="mt-4" label="收据项目" value={invoiceItem} onChange={setInvoiceItem} />

        {/* 必选：收据「项目」一栏是否展示 AI 平台字眼。说明里直接写出会印成什么，免得买家猜 */}
        <div className="mt-4">
          <label className="block text-xs text-white/50 mb-1.5">
            收据中是否展示 ChatGPT/Claude 相关字眼<span className="text-red-400 ml-0.5">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: true, label: '展示', desc: `项目印「${invoiceItemName(invoiceItem)}（${order.productName} 会员订阅）」` },
              { v: false, label: '不展示', desc: `项目只印「${invoiceItemName(invoiceItem)}」` },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setShowAiWording(opt.v)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  showAiWording === opt.v
                    ? 'border-cyan-500/60 bg-cyan-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-sm font-medium text-white/90">{opt.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5 break-all">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" /> {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50"
        >
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          生成收据
        </button>
        <p className="text-xs text-white/30 text-center mt-2">收据仅可开具一次，生成后不可修改；如需重开请联系客服</p>
      </motion.div>
    </div>
  )
}
