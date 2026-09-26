'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, MessageSquare, Loader2 } from 'lucide-react'
import OrderChat from '@/components/order-chat'
import { SourceBadge, SourceFilter, type SiteOption, type SourceSite } from '@/components/admin/source-site'
import RefundDialog, { type RefundAfterSale } from '@/components/admin/refund-dialog'
import AfterSalePanel, { type AfterSaleRow } from '@/components/admin/after-sale-panel'
import RedeemLogPanel from '@/components/admin/redeem-log-panel'

interface Order {
  id: number
  orderNo: string
  productName: string
  amount: string | number
  payStatus: string
  deliveryStatus: string
  deliveryInfo: string | null
  remark: string | null
  quantity?: number
  createdAt: string
  user: { id: number; email: string | null; nickname: string | null }
  product: { id: number; name: string; categoryId?: number; category?: { id: number; name: string } | null }
  cards?: string[] // 自动发货实际发出的卡密
  unreadCount?: number // 买家发来、商家未读的留言数
  cardCost?: number | null // 卡密成本合计（无卡密订单为 null）
  cardProfit?: number | null // 卡密利润合计，已扣内推返现（含未知利润的卡时为 null）
  cardReferral?: number | null // 该单已扣的内推返现（无卡密的单为 null）
  cardProfitUnknown?: boolean // 该单存在利润未知的卡（外部站发卡）
  invoiceTaxFee?: string | number | null // 下单时勾选「同时开发票」预收的税费（不计入 amount）
  cardCount?: number // 仅深链打开时有：不在当前页的订单拿不到卡密明文，只知道发了几张
  // ---- 渠道分站（设计 12.2）----
  tenantId?: number
  source?: SourceSite
  /** 买家备注：buyerRemark ?? remark（设计 5.4 双写过渡） */
  buyerRemarkText?: string | null
  /** 打开弹窗时的 updatedAt：保存时带回去做并发检查（两人同时编辑 → 后保存的 409） */
  updatedAt?: string
  settleState?: string | null
  supplyCents?: number | null
}

/** GET /api/admin/orders/[id]/detail 的返回（Decimal 已转 number，时间是 ISO 字符串） */
interface InvoiceBrief {
  id: number
  invoiceNo: string
  externalOrderId: number | null
  status: string
  payStatus: string
  source: string | null
  title: string | null
  taxNumber: string | null
  email: string | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  paidAt: string | null
  submittedAt: string | null
  issuedAt: string | null
  createdAt: string
}

interface ChannelDetail {
  settlement: {
    settleState: string | null
    invShareState: string | null
    goodsCents: number
    purchaseCents: number
    invShareCents: number
    feeCents: number
    otherCents: number
    balanceCents: number
    payoutCents: number
    releaseEta: string | null
    bucket: string
    statementNo: string | null
  } | null
  ledger: {
    id: number
    eventKey: string
    leg: string
    type: string
    component: string
    bucket: string
    amountCents: number
    memo: string | null
    publicMemo: string | null
    operatorId: number | null
    statementId: number | null
    createdAt: string
  }[]
  afterSales: AfterSaleRow[]
  pendingAfterSales: number
  partnerReplies: number
  refundContext: {
    amountCents: number
    checkoutTaxCents: number
    refundedGoodsCents: number
    refundedTaxCents: number
    refundedQty: number
    quantity: number
    supplyCents: number | null
    shortCents: number
    shortUnappliedCents: number
    deliveredQty: number
    deliveryType: string
    costRefYuan: number | null
  }
}

interface OrderDetail {
  source?: SourceSite
  channel?: ChannelDetail | null
  order: {
    id: number
    tenantId?: number
    updatedAt?: string
    buyerRemarkText?: string | null
    settleState?: string | null
    invShareState?: string | null
    settleVersion?: number
    settleExcludeReason?: string | null
    supplyUnitPrice?: number | null
    supplyCents?: number | null
    feeRateBp?: number | null
    invoiceShareRateBp?: number | null
    settleHoldDays?: number | null
    mainPriceAtOrder?: number | null
    escalatedAt?: string | null
    shortCents?: number | null
    shortChargedCents?: number | null
    orderNo: string
    productName: string
    productPrice: number
    quantity: number
    amount: number
    invoiceTaxFee: number | null
    payable: number
    payMethod: string | null
    payStatus: string
    deliveryStatus: string
    deliveryInfo: string | null
    remark: string | null
    referrerId: number | null
    referralReward: number | null
    couponGrantId: number | null
    couponDiscount: number | null
    originalAmount: number | null
    createdAt: string
    paidAt: string | null
    deliveredAt: string | null
  }
  user: { id: number; email: string | null; nickname: string | null; phone: string | null }
  product: { id: number; name: string; deliveryType: string }
  payments: { id: number; tradeNo: string | null; payMethod: string; amount: number; status: number; createdAt: string }[]
  coupon: {
    grantId: number
    state: string
    grantOrderId: number | null
    usedAt: string | null
    name: string
    code: string
    source: string | null
    label: string
  } | null
  referral: {
    referrer: { id: number; email: string | null; nickname: string | null }
    referrerMissing: boolean
    rewardSnapshot: number | null
    rewardRow: { amount: number; status: string; createdAt: string; settledAt: string | null } | null
  } | null
  invoices: InvoiceBrief[]
  invoiceDraft: { title: string; taxNumber: string; email: string } | null
  externalOrders: { id: number; sourceKey: string; importBatch: string | null; claudeAccount: string }[]
  receipts: {
    id: number
    receiptNo: string
    amount: number
    payerTitle: string
    issuedAt: string | null
    createdAt: string
    link: string | null
  }[]
  lottery: {
    state: string
    won: boolean | null
    prizeName: string | null
    prizeType: string | null
    prizeLabel: string | null
    fulfillState: string | null
    fulfilledAt: string | null
    fulfillNote: string | null
    drawnAt: string | null
    couponGrantId: number | null
    couponGrant: { id: number; state: string; expiresAt: string | null; usedAt: string | null } | null
  } | null
  vmqOrders: {
    id: number
    state: number
    price: number
    reallyPrice: number
    createdAt: string
    payDate: string | null
  }[]
  cardCount: number
}

interface Category {
  id: number
  name: string
}

interface Totals {
  orders: number
  amount: number
  cost: number | null
  profit: number | null
  /** 利润合计里已扣掉的内推返现（truncated 时为 null） */
  referral?: number | null
  truncated: boolean
}

const payStatusMap: Record<string, { label: string; className: string }> = {
  UNPAID: { label: '待支付', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: '已支付', className: 'bg-green-100 text-green-700' },
  REFUNDED: { label: '已退款', className: 'bg-gray-100 text-gray-600' },
}

const deliveryStatusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: '已完成', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
}

// 与 /admin/invoices 页同一套文案与配色
const invoiceStatusMap: Record<string, { label: string; className: string }> = {
  UNAPPLIED: { label: '未开发票', className: 'bg-gray-100 text-gray-600' },
  AWAIT_PAY: { label: '待支付税费', className: 'bg-amber-100 text-amber-700' },
  SUBMITTED: { label: '已提交开票', className: 'bg-cyan-100 text-cyan-700' },
  ISSUED: { label: '已开具', className: 'bg-green-100 text-green-700' },
  CANNOT: { label: '不可开据', className: 'bg-gray-200 text-gray-500' },
}

const GRANT_STATE: Record<string, string> = {
  AVAILABLE: '未使用',
  LOCKED: '已锁定（挂在待付款订单上）',
  USED: '已使用',
  EXPIRED: '已过期',
  VOID: '已作废',
}

const PAY_METHOD: Record<string, string> = { ALIPAY: '支付宝', WECHAT: '微信', BALANCE: '余额' }
const PAYMENT_STATUS: Record<number, string> = { 0: '待支付', 1: '成功', 2: '失败' }
const VMQ_STATE: Record<number, string> = { 0: '待支付', 1: '已支付', [-1]: '已过期' }

function yuan(n: number | string | null | undefined) {
  return n == null ? '—' : `¥${Number(n).toFixed(2)}`
}

function fmtTime(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

/** 深链打开时订单不一定在当前页：由详情接口的数据拼出弹窗需要的列表行形状 */
function orderFromDetail(d: OrderDetail): Order {
  return {
    id: d.order.id,
    orderNo: d.order.orderNo,
    productName: d.order.productName,
    amount: d.order.amount,
    payStatus: d.order.payStatus,
    deliveryStatus: d.order.deliveryStatus,
    deliveryInfo: d.order.deliveryInfo,
    remark: d.order.remark,
    quantity: d.order.quantity,
    createdAt: d.order.createdAt,
    user: { id: d.user.id, email: d.user.email, nickname: d.user.nickname },
    product: { id: d.product.id, name: d.product.name },
    invoiceTaxFee: d.order.invoiceTaxFee,
    cardCount: d.cardCount,
    tenantId: d.order.tenantId,
    source: d.source,
    buyerRemarkText: d.order.buyerRemarkText,
    updatedAt: d.order.updatedAt,
    settleState: d.order.settleState,
    supplyCents: d.order.supplyCents,
  }
}

const yuanCents = (c: number | null | undefined) => (c == null ? '—' : `¥${(c / 100).toFixed(2)}`)
/** 元（字符串）→ 分；格式不对返回 null */
function centsOf(v: string): number | null {
  const t = v.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  const [a, b = ''] = t.split('.')
  return Number(a) * 100 + Number((b + '00').slice(0, 2))
}

// useSearchParams 必须包在 Suspense 里，否则整页在构建时退化为纯客户端渲染并报警（与卡密页同一写法）
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}>
      <OrdersInner />
    </Suspense>
  )
}

function OrdersInner() {
  const sp = useSearchParams()
  const router = useRouter()
  /** 深链 /admin/orders?orderId=123：从发票详情、余额流水等处直接打开某张订单 */
  const deepLinkId = sp.get('orderId')
  /** 深链 ?orderId=…&refund=1&afterSaleId=…：从售后申请列表点「处理退款」直接打开退款弹窗 */
  const deepRefund = sp.get('refund') === '1'
  const deepAfterSaleId = parseInt(sp.get('afterSaleId') || '') || null
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [onlyUnreplied, setOnlyUnreplied] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryId, setCategoryId] = useState(0)
  // 来源站筛选（设计 12.2）：'' = 全部
  const [siteFilter, setSiteFilter] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  // 标已付（交付时自动标已付）的实收与差额承担方（设计 8.6）
  const [receivedYuan, setReceivedYuan] = useState('')
  const [shortBearer, setShortBearer] = useState<'' | 'CHANNEL' | 'PLATFORM'>('')
  // 退款弹窗
  const [refundFor, setRefundFor] = useState<{ afterSale: RefundAfterSale | null; full: '' | 'CANCELLED' | 'REFUNDED' } | null>(null)
  const [resettling, setResettling] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refilling, setRefilling] = useState(false)
  // 交付完成时同步导入「订单」所需信息
  const [extSubscriptionType, setExtSubscriptionType] = useState('')
  const [extStartDate, setExtStartDate] = useState('')
  const [extXianyuNickname, setExtXianyuNickname] = useState('')
  const [extClaudeAccount, setExtClaudeAccount] = useState('')
  // 弹窗里的只读明细（金额 / 发票 / 券 / 内推 / 抽奖），打开时单独拉一次
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailSeq = useRef(0)
  /** 打开弹窗后管理员是否已经动过交付状态 / 交付内容 / 金额：动过就不再用明细覆盖表单（见 handleViewDetail） */
  const formTouched = useRef(false)

  const todayIso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const abortRef = useRef<AbortController | null>(null)

  const loadData = async () => {
    // 取消上一次仍在进行的请求，避免旧响应后到、覆盖新结果（检索竞态）
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (debouncedSearch) params.set('keyword', debouncedSearch)
      if (onlyUnreplied) params.set('unreplied', '1')
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      if (categoryId) params.set('categoryId', String(categoryId))
      if (siteFilter) params.set('tenantId', siteFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { signal: controller.signal })
      const data = await res.json()
      // 仅当本次仍是最新请求时才应用结果
      if (data.success && abortRef.current === controller) {
        setOrders(data.data.list)
        setTotalPages(data.data.totalPages || 1)
        setTotal(data.data.total || 0)
        setTotals(data.data.totals || null)
        setSites(data.data.sites || [])
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return // 已被更新的请求取代
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }

  // 输入防抖：停止输入 350ms 后才真正发起服务端检索
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus, onlyUnreplied, fromDate, toDate, categoryId, siteFilter, page])

  // 分类下拉数据
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(Array.isArray(d.data) ? d.data : d.data?.list || [])
      })
      .catch(() => {})
  }, [])

  // 拉订单明细。序号防串：快速切换订单时，只认最后一次请求的结果
  const loadDetail = async (id: number): Promise<OrderDetail | null> => {
    const seq = ++detailSeq.current
    setDetailLoading(true)
    setDetailError('')
    try {
      const res = await fetch(`/api/admin/orders/${id}/detail`)
      const data = await res.json()
      if (seq !== detailSeq.current) return null
      if (data.success) {
        setDetail(data.data as OrderDetail)
        return data.data as OrderDetail
      }
      setDetailError(data.error || '明细加载失败')
      return null
    } catch {
      if (seq === detailSeq.current) setDetailError('网络错误，明细加载失败')
      return null
    } finally {
      if (seq === detailSeq.current) setDetailLoading(false)
    }
  }

  /** preloaded：深链路径已经拿到了明细，不必再拉一次 */
  const handleViewDetail = (order: Order, preloaded?: OrderDetail) => {
    setSelectedOrder(order)
    formTouched.current = false
    setDeliveryInfo(order.deliveryInfo || '')
    setDeliveryStatus(order.deliveryStatus)
    setAmount(String(Number(order.amount)))
    // 预填导入「订单」的默认值
    setExtSubscriptionType(order.productName)
    setExtStartDate(todayIso())
    setExtXianyuNickname(order.user.nickname || order.user.email || '')
    setExtClaudeAccount('')
    setReceivedYuan('')
    setShortBearer('')
    setRefundFor(null)
    setShowDetailModal(true)
    if (preloaded) {
      detailSeq.current++ // 作废可能还在路上的旧请求
      setDetail(preloaded)
      setDetailError('')
      setDetailLoading(false)
    } else {
      setDetail(null)
      loadDetail(order.id).then((d) => {
        /*
         * 并发基线从「打开弹窗」算起（设计 4.10 ⑤），不是从「列表加载」算起：列表加载之后订单被系统改过
         * （买家到账、自动发卡、接码往备注里追加记录…），用列表行的 updatedAt 保存必然 409。
         * 明细接口给的是打开这一刻的最新行：updatedAt 不同 → 弹窗基线与表单一起换成最新值
         * （只换 updatedAt 不换表单的话，会拿列表里的旧交付状态覆盖刚被系统改过的状态，比 409 更糟）。
         */
        if (!d || d.order.id !== order.id || !d.order.updatedAt || d.order.updatedAt === order.updatedAt) return
        // 明细回来之前管理员已经开始编辑：不覆盖他的输入，也不换基线——保存会得到 409「订单已变化，请刷新」，
        // 比悄悄吞掉输入、或拿他的旧值覆盖系统刚写入的状态都安全（上线前复核 2026-09-26）
        if (formTouched.current) return
        const fresh = orderFromDetail(d)
        setSelectedOrder((cur) => (cur && cur.id === order.id ? { ...cur, ...fresh } : cur))
        setDeliveryInfo(fresh.deliveryInfo || '')
        setDeliveryStatus(fresh.deliveryStatus)
        setAmount(String(Number(fresh.amount)))
      })
    }
  }

  // 关弹窗时顺手去掉地址栏的 ?orderId=，否则刷新页面会再弹一次
  const closeDetail = () => {
    setShowDetailModal(false)
    if (deepLinkId) router.replace('/admin/orders', { scroll: false })
  }

  // 深链：按 id 直接拉明细开弹窗，不依赖这张订单是否在当前列表页
  useEffect(() => {
    const id = parseInt(deepLinkId || '')
    if (!Number.isSafeInteger(id) || id <= 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${id}/detail`)
        const data = await res.json()
        if (cancelled) return
        if (!data.success) {
          alert(data.error || '订单不存在')
          return
        }
        const d = data.data as OrderDetail
        handleViewDetail(orderFromDetail(d), d)
        if (deepRefund && d.channel) {
          const as = d.channel.afterSales.find((a) => a.id === deepAfterSaleId && a.kind === 'REFUND' && a.status === 'PENDING')
          setRefundFor({ afterSale: as ? { id: as.id, requestNo: as.requestNo, reason: as.reason, suggestedBearer: as.suggestedBearer, suggestedGoodsCents: as.suggestedGoodsCents } : null, full: '' })
        }
      } catch {
        if (!cancelled) alert('网络错误，订单详情加载失败')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId])

  // 补发卡密：只对已付款、尚未交付、卡密未发满的自动发货订单可用
  const handleRefill = async () => {
    if (!selectedOrder) return
    setRefilling(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refill`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        alert(data.message || '已补发')
        closeDetail()
        loadData()
      } else {
        alert(data.error || '补发失败')
      }
    } finally {
      setRefilling(false)
    }
  }

  /** 渠道单（tenantId ≥ 2）：退款走弹窗、不能恢复、标已付必填实收（设计 8.4–8.6） */
  const isChannelOrder = (o: Order | null) => !!o && o.tenantId != null && o.tenantId !== 1
  const channelDetail = detail && selectedOrder && detail.order.id === selectedOrder.id ? detail.channel ?? null : null

  const openRefund = (afterSale: RefundAfterSale | null, full: '' | 'CANCELLED' | 'REFUNDED' = '') => {
    if (!channelDetail) {
      alert('订单明细还没加载完，请稍候再试')
      return
    }
    setRefundFor({ afterSale, full })
  }

  // 按快照补记（设计 8.3）：只对结算状态为空 / 缺失的已付渠道单
  const handleResettle = async () => {
    if (!selectedOrder || !confirm('按下单时的快照补记这张渠道单的结算分录？（只用订单快照，不按当前进货价重算）')) return
    setResettling(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/resettle`, { method: 'POST' })
      const d = await res.json()
      alert(d.success ? d.message || '已补记' : d.error || '补记失败')
      if (d.success) loadDetail(selectedOrder.id)
    } finally {
      setResettling(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedOrder) return
    const channel = isChannelOrder(selectedOrder)

    // 渠道单已付款后「取消」= 退款：必须在退款弹窗里填金额与承担方（接口也会拒绝，这里直接引导过去）
    if (
      channel &&
      deliveryStatus === 'CANCELLED' &&
      selectedOrder.deliveryStatus !== 'CANCELLED' &&
      selectedOrder.payStatus !== 'UNPAID'
    ) {
      openRefund(null, 'CANCELLED')
      return
    }
    // 这次保存会不会顺带标已付（未付单标成已完成 = 人工确认到账，设计 8.6 要填实收）
    const willMarkPaid = selectedOrder.payStatus !== 'PAID' && deliveryStatus === 'DELIVERED' && selectedOrder.deliveryStatus !== 'DELIVERED'
    let receivedCents: number | undefined
    if (willMarkPaid && receivedYuan.trim()) {
      const c = centsOf(receivedYuan)
      if (c == null) {
        alert('实收金额格式不正确（最多两位小数）')
        return
      }
      receivedCents = c
    }
    if (willMarkPaid && channel && receivedCents == null) {
      alert('渠道单标已付（标为已完成）必须填写实收金额')
      return
    }

    // 标记为「已完成」时要求填写 Claude 账户，才能同步导入到「订单」
    const willDeliver = deliveryStatus === 'DELIVERED'
    if (willDeliver && selectedOrder.deliveryStatus !== 'DELIVERED' && !extClaudeAccount.trim()) {
      if (!confirm('未填写 Claude 账户，将不会同步导入到「订单」列表。仍要继续吗？')) return
    }

    // 已付款订单改成「已取消」= 线下退款的惯例做法，会连带回滚一串东西，先让站长看清楚再点
    if (
      deliveryStatus === 'CANCELLED' &&
      selectedOrder.deliveryStatus !== 'CANCELLED' &&
      selectedOrder.payStatus === 'PAID'
    ) {
      const ok = confirm(
        [
          '这是一张已付款订单，取消后（视为已线下退款）：',
          '· 未开出的发票会转为「不可开据」，买家不能再申请发票和收据',
          '· 卡密的站内兑换、接码服务会停止',
          '· 已入账的内推返现不会自动扣回',
          '· 钱不会自动退回，请确认已线下退款',
          '',
          '确定要取消吗？',
        ].join('\n')
      )
      if (!ok) return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryStatus,
          deliveryInfo: deliveryInfo || null,
          // 并发保护（设计 4.10 ⑤）：打开弹窗之后订单被别人改过 / 恰好到账 → 409，刷新后重来
          ...(selectedOrder.updatedAt ? { expectedUpdatedAt: selectedOrder.updatedAt } : {}),
          ...(receivedCents != null ? { receivedCents } : {}),
          ...(willMarkPaid && channel && shortBearer ? { shortBearer } : {}),
          // 已取消（或这次就要改成已取消）的订单不发改价：接口会拒绝，买家也已经不能再付款
          ...(selectedOrder.payStatus === 'UNPAID' &&
          selectedOrder.deliveryStatus !== 'CANCELLED' &&
          deliveryStatus !== 'CANCELLED' &&
          amount &&
          Number(amount) !== Number(selectedOrder.amount)
            ? { amount: Number(amount) }
            : {}),
          external: willDeliver
            ? {
                subscriptionType: extSubscriptionType.trim() || null,
                startDate: extStartDate || null,
                xianyuNickname: extXianyuNickname.trim() || null,
                claudeAccount: extClaudeAccount.trim() || null,
              }
            : undefined,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        if (data.code === 'SHORT_BEARER_REQUIRED') {
          alert(`${data.error}\n请在「实收金额」下方选择差额承担方后再保存`)
          return
        }
        if (data.code === 'REFUND_REQUIRED') {
          openRefund(null, 'CANCELLED')
          return
        }
        alert(res.status === 409 ? `${data.error || '订单已变化'}\n\n请关闭弹窗、刷新列表后重试` : data.error || '更新失败')
        return
      }

      if (data.data?.imported) {
        alert('已保存，并已同步导入到「订单」列表')
      }
      // 服务端的联动提示：改价同步收款单的异常、取消已付款单时作废了几张发票 / 需红冲 / 返现未扣回等
      const warnings: string[] = Array.isArray(data.data?.warnings) ? data.data.warnings : []
      if (warnings.length) alert(`已保存，请留意：\n\n${warnings.join('\n')}`)

      closeDetail()
      loadData()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索订单号 / 邮箱 / 用户名 / 商品..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待处理</option>
              <option value="PROCESSING">处理中</option>
              <option value="DELIVERED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setOnlyUnreplied((v) => !v)
                setPage(1)
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                onlyUnreplied
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="仅显示有买家留言且商家未读/未回复的订单"
            >
              <MessageSquare className="h-4 w-4" />
              只看未回复
            </button>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(Number(e.target.value))
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            >
              <option value={0}>全部分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <SourceFilter
              value={siteFilter}
              onChange={(v) => {
                setSiteFilter(v)
                setPage(1)
              }}
              options={sites}
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="whitespace-nowrap">下单时间</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <span>—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {(fromDate || toDate || categoryId) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                    setCategoryId(0)
                    setPage(1)
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 当前筛选范围的汇总：流水来自订单金额，成本/利润来自卡密上落库的字段 */}
          {totals && (
            <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">订单数</div>
                <div className="text-xl font-bold text-gray-800">{totals.orders}</div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="text-xs text-blue-700">流水合计</div>
                <div className="text-xl font-bold text-blue-700">¥{totals.amount.toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                <div className="text-xs text-orange-700">成本合计</div>
                <div className="text-xl font-bold text-orange-700">
                  {totals.cost == null ? '—' : `¥${totals.cost.toFixed(2)}`}
                </div>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                <div className="text-xs text-green-700">利润合计</div>
                <div className="text-xl font-bold text-green-700">
                  {totals.profit == null ? '—' : `¥${totals.profit.toFixed(2)}`}
                </div>
                {totals.referral != null && totals.referral > 0 && (
                  <div className="text-[11px] text-green-700/80 mt-0.5">已扣内推返现 ¥{totals.referral.toFixed(2)}</div>
                )}
              </div>
              {totals.truncated && (
                <p className="col-span-2 sm:col-span-4 text-xs text-amber-600">
                  结果集过大（超过 10000 单），未统计成本与利润，请缩小日期范围后查看。
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {debouncedSearch || filterStatus || onlyUnreplied ? '没有符合条件的订单' : '暂无订单'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">订单号</th>
                    <th className="pb-3 font-medium">来源站</th>
                    <th className="pb-3 font-medium">用户</th>
                    <th className="pb-3 font-medium">商品</th>
                    <th className="pb-3 font-medium">金额</th>
                    <th className="pb-3 font-medium">成本</th>
                    <th className="pb-3 font-medium">利润</th>
                    <th className="pb-3 font-medium">支付状态</th>
                    <th className="pb-3 font-medium">交付状态</th>
                    <th className="pb-3 font-medium">下单时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50">
                      <td className="py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{order.orderNo}</span>
                          {!!order.unreadCount && order.unreadCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white"
                              title={`买家有 ${order.unreadCount} 条未读留言`}
                            >
                              <MessageSquare className="h-3 w-3" />
                              {order.unreadCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <SourceBadge source={order.source} />
                      </td>
                      <td className="py-4 text-gray-600">{order.user.nickname || order.user.email}</td>
                      <td className="py-4 text-gray-600">
                        <div>{order.productName}</div>
                        {order.product?.category?.name && (
                          <div className="text-xs text-gray-400">{order.product.category.name}</div>
                        )}
                      </td>
                      <td className="py-4 text-gray-900 whitespace-nowrap">
                        ¥{Number(order.amount).toFixed(2)}
                        {Number(order.invoiceTaxFee || 0) > 0 && (
                          <span
                            className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700"
                            title={`下单时勾选了随单开票，另收税费 ¥${Number(order.invoiceTaxFee).toFixed(2)}（不计入金额）`}
                          >
                            +税
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-gray-600">
                        {order.cardCost == null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          `¥${order.cardCost.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-4">
                        {order.cardProfit == null ? (
                          <span
                            className="text-gray-300"
                            title={
                              order.cardProfitUnknown
                                ? '该订单含外部站发出的卡密，收入未回传，利润未知'
                                : '该订单没有卡密（非自动发货），无法按卡密核算利润'
                            }
                          >
                            —
                          </span>
                        ) : (
                          <span
                            className={order.cardProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}
                            title={
                              order.cardReferral
                                ? `卡差价 − 内推返现 ¥${order.cardReferral.toFixed(2)}`
                                : '卡差价（售价 − 成本）'
                            }
                          >
                            ¥{order.cardProfit.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            payStatusMap[order.payStatus]?.className || ''
                          }`}
                        >
                          {payStatusMap[order.payStatus]?.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            deliveryStatusMap[order.deliveryStatus]?.className || ''
                          }`}
                        >
                          {deliveryStatusMap[order.deliveryStatus]?.label}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
              <div>
                共 {total} 条 · 第 {page} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold">订单详情</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">订单号：</span>
                  <span className="font-medium">{selectedOrder.orderNo}</span>
                  <SourceBadge source={selectedOrder.source} className="ml-2" />
                </div>
                <div>
                  <span className="text-gray-500">用户：</span>
                  <span className="font-medium">{selectedOrder.user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">商品：</span>
                  <span className="font-medium">{selectedOrder.productName}</span>
                </div>
                <div>
                  <span className="text-gray-500">金额：</span>
                  <span className="font-medium text-primary-600">
                    ¥{Number(selectedOrder.amount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">支付状态：</span>
                  <span className="font-medium">
                    {payStatusMap[selectedOrder.payStatus]?.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">下单时间：</span>
                  <span className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>

              {/* 只读明细：金额构成 / 发票 / 抽奖。加载失败不影响下面的编辑控件 */}
              {detail && detail.order.id === selectedOrder.id ? (
                <OrderDetailSections d={detail} />
              ) : detailError ? (
                <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <span>{detailError}</span>
                  <button
                    type="button"
                    onClick={() => loadDetail(selectedOrder.id)}
                    className="text-xs underline hover:text-red-900"
                  >
                    重试
                  </button>
                </div>
              ) : detailLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> 加载金额、发票明细...
                </div>
              ) : null}

              {/*
               * 备注：超管看**完整的 remark**，与改造前一致（上线前复核 2026-09-26）。
               * 不能优先 buyerRemark：主站每张新单的 buyerRemark 都是下单时的「支付方式: 支付宝」，
               * 而 sms.ts / vmq.ts 事后往 remark 里追加的「【待退款】接码超时」「卡密库存不足，待人工补发」
               * 只在这里看得到——优先 buyerRemark 会把这些待办提醒藏掉。
               * remark = 买家原始备注 + 系统追加，已包含 buyerRemark；只有 remark 为空时才退回 buyerRemark。
               * （把买家原话与内部说明分开，是渠道后台那一侧的需求，见 partner-services。）
               */}
              {(selectedOrder.remark ?? selectedOrder.buyerRemarkText) && (
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">用户备注：</div>
                  <div className="rounded-lg bg-gray-50 p-3">{selectedOrder.remark ?? selectedOrder.buyerRemarkText}</div>
                </div>
              )}

              {/* 渠道单：结算快照、分录、售后申请、退款入口（设计 12.2） */}
              {channelDetail && detail && (
                <>
                  <ChannelSection
                    d={detail}
                    c={channelDetail}
                    onRefund={() => openRefund(null, '')}
                    onResettle={handleResettle}
                    resettling={resettling}
                  />
                  <AfterSalePanel
                    rows={channelDetail.afterSales}
                    escalatedAt={detail.order.escalatedAt ?? null}
                    onRefund={(r) =>
                      openRefund({ id: r.id, requestNo: r.requestNo, reason: r.reason, suggestedBearer: r.suggestedBearer, suggestedGoodsCents: r.suggestedGoodsCents }, '')
                    }
                    onChanged={() => loadDetail(selectedOrder.id)}
                  />
                </>
              )}

              {selectedOrder.cards && selectedOrder.cards.length > 0 && (
                <div className="text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-gray-500">已发卡密（自动发货）：</span>
                    <span className="text-xs text-gray-400">
                      共 {selectedOrder.cards.length} 张
                      {selectedOrder.quantity ? ` / 应发 ${selectedOrder.quantity} 张` : ''}
                    </span>
                    {selectedOrder.quantity != null &&
                      selectedOrder.cards.length > selectedOrder.quantity && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          ⚠ 发卡数量异常（超出应发）
                        </span>
                      )}
                  </div>
                  <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
                    {selectedOrder.cards.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 break-all font-mono text-xs text-gray-800"
                      >
                        <span className="select-none text-gray-400">{i + 1}.</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 深链打开、订单不在当前页：详情接口刻意不回传卡密明文（明文只在列表里解密展示），只给张数 */}
              {!selectedOrder.cards && (selectedOrder.cardCount ?? 0) > 0 && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  已发卡密 {selectedOrder.cardCount} 张
                  {selectedOrder.quantity ? ` / 应发 ${selectedOrder.quantity} 张` : ''}。
                  <span className="text-xs text-gray-400">卡密内容请在列表中按订单号搜索后查看。</span>
                </div>
              )}

              {selectedOrder.payStatus === 'UNPAID' && selectedOrder.deliveryStatus !== 'CANCELLED' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    改价（仅待支付订单，单位元）
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => { formTouched.current = true; setAmount(e.target.value) }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    原价 ¥{Number(selectedOrder.amount).toFixed(2)}；改价后买家按新金额支付。
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  交付状态
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => { formTouched.current = true; setDeliveryStatus(e.target.value) }}
                  // 渠道单取消后不能恢复（设计 8.4）
                  disabled={isChannelOrder(selectedOrder) && selectedOrder.deliveryStatus === 'CANCELLED'}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm disabled:bg-gray-50"
                >
                  <option value="PENDING">待处理</option>
                  <option value="PROCESSING">处理中</option>
                  <option value="DELIVERED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
                {isChannelOrder(selectedOrder) && selectedOrder.payStatus !== 'UNPAID' && selectedOrder.deliveryStatus !== 'CANCELLED' && (
                  <p className="mt-1 text-xs text-gray-400">渠道单已付款：改为「已取消」会打开退款弹窗（填退款金额与承担方）；取消后不能恢复。</p>
                )}
                {isChannelOrder(selectedOrder) && selectedOrder.deliveryStatus === 'CANCELLED' && (
                  <p className="mt-1 text-xs text-gray-400">渠道单取消后不能恢复；后续如需调整请走退款或调账。</p>
                )}
              </div>

              {/* 标已付的实收（设计 8.6，可感知变化 ⑥）：未付单标为「已完成」= 人工确认到账。渠道单必填，主站单选填 */}
              {selectedOrder.payStatus !== 'PAID' && deliveryStatus === 'DELIVERED' && selectedOrder.deliveryStatus !== 'DELIVERED' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm">
                  <label className="mb-1 block font-medium text-gray-700">
                    实收金额（元）{isChannelOrder(selectedOrder) ? <span className="text-red-500"> *</span> : <span className="text-xs font-normal text-gray-400">（选填）</span>}
                  </label>
                  <input
                    value={receivedYuan}
                    onChange={(e) => setReceivedYuan(e.target.value)}
                    placeholder={`应收 ¥${(Number(amount || selectedOrder.amount) + Number(selectedOrder.invoiceTaxFee || 0)).toFixed(2)}（含随单税费）`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">标成「已完成」会同时标为已付款，并按实收补一条付款记录。</p>
                  {isChannelOrder(selectedOrder) &&
                    (() => {
                      const c = centsOf(receivedYuan)
                      const due = Math.round((Number(amount || selectedOrder.amount) + Number(selectedOrder.invoiceTaxFee || 0)) * 100)
                      if (c == null || c >= due) return null
                      return (
                        <div className="mt-2">
                          <div className="text-xs text-amber-800">实收比应收少 {yuanCents(due - c)}，请选择差额由谁承担：</div>
                          <div className="mt-1 flex gap-4 text-xs">
                            <label className="inline-flex items-center gap-1">
                              <input type="radio" checked={shortBearer === 'CHANNEL'} onChange={() => setShortBearer('CHANNEL')} /> 渠道承担（从这单货款里扣）
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <input type="radio" checked={shortBearer === 'PLATFORM'} onChange={() => setShortBearer('PLATFORM')} /> 平台承担（先冲抵税费）
                            </label>
                          </div>
                        </div>
                      )
                    })()}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  交付信息（账号/密码/备注等）
                </label>
                <textarea
                  value={deliveryInfo}
                  onChange={(e) => { formTouched.current = true; setDeliveryInfo(e.target.value) }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                  rows={4}
                  placeholder="请输入交付信息..."
                />
              </div>

              {deliveryStatus === 'DELIVERED' && (
                <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4 space-y-3">
                  <div className="text-sm font-medium text-primary-800">
                    同步导入到「订单」列表
                    <span className="ml-1 font-normal text-xs text-primary-600">
                      （标记为「已完成」后自动写入订单管理，可在订单页继续维护成本/报价、开发票等）
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">订阅类型</label>
                      <input
                        type="text"
                        value={extSubscriptionType}
                        onChange={(e) => setExtSubscriptionType(e.target.value)}
                        placeholder="默认 = 商品名称"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">开通时间</label>
                      <input
                        type="date"
                        value={extStartDate}
                        onChange={(e) => setExtStartDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">闲鱼昵称</label>
                      <input
                        type="text"
                        value={extXianyuNickname}
                        onChange={(e) => setExtXianyuNickname(e.target.value)}
                        placeholder="默认 = 用户名称"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Claude 账户 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={extClaudeAccount}
                        onChange={(e) => setExtClaudeAccount(e.target.value)}
                        placeholder="开通的 Claude 账户邮箱"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    到期时间将按「开通时间 + 1 个月」自动计算；报价默认取本订单金额 ¥{Number(selectedOrder.amount).toFixed(2)}。
                  </p>
                </div>
              )}

              {selectedOrder.payStatus === 'PAID' && (
                <div className="pt-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">订单沟通（与买家）</label>
                  <OrderChat apiBase={`/api/admin/orders/${selectedOrder.id}/messages`} selfRole="ADMIN" theme="light" />
                </div>
              )}

              {/* 缺货停在「处理中」的自动发货订单：补货后从这里补齐缺口，
                  不必再绕到「收款监控 → 补单」。fulfillOrder 幂等，不会超发。 */}
              {selectedOrder.payStatus === 'PAID' &&
                selectedOrder.deliveryStatus !== 'DELIVERED' &&
                (selectedOrder.cards?.length ?? selectedOrder.cardCount ?? 0) < (selectedOrder.quantity ?? 1) &&
                // 明细到手后才知道发货方式：人工 / 接码商品没有卡密可补（补发接口也会拒绝），不再误显示
                !(detail && detail.order.id === selectedOrder.id && detail.product.deliveryType !== 'AUTO') && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-sm text-amber-800">
                      该订单已付款，但卡密只发出 {selectedOrder.cards?.length ?? selectedOrder.cardCount ?? 0}/{selectedOrder.quantity ?? 1} 张
                      （通常是付款时库存不足）。补货后可点右侧补发。
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" loading={refilling} onClick={handleRefill}>
                        补发卡密
                      </Button>
                    </div>
                  </div>
                )}

              {/* 卡密使用情况（兑换日志，设计 12.2）：只有发过卡的单才有 */}
              {((selectedOrder.cards?.length ?? selectedOrder.cardCount ?? 0) > 0 || (detail?.order.id === selectedOrder.id && detail.product.deliveryType === 'AUTO')) && (
                <RedeemLogPanel orderId={selectedOrder.id} />
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={closeDetail}>
                  关闭
                </Button>
                <Button onClick={handleUpdate} loading={submitting}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {refundFor && selectedOrder && channelDetail && detail && (
        <RefundDialog
          orderId={selectedOrder.id}
          orderNo={selectedOrder.orderNo}
          afterSale={refundFor.afterSale}
          initialFull={refundFor.full}
          ctx={{
            ...channelDetail.refundContext,
            taxCents: refundTaxBase(detail),
            unitPriceCents: Math.round(Number(detail.order.productPrice) * 100),
            settleVersion: detail.order.settleVersion ?? 0,
            settleState: detail.order.settleState ?? null,
            payStatus: detail.order.payStatus,
            deliveryStatus: detail.order.deliveryStatus,
          }}
          onClose={() => setRefundFor(null)}
          onDone={(msg, warnings) => {
            setRefundFor(null)
            alert(warnings.length ? `${msg}\n\n${warnings.join('\n')}` : msg)
            closeDetail()
            loadData()
          }}
        />
      )}
    </div>
  )
}

// ============ 订单详情弹窗里的只读明细 ============

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-sm">
      <h4 className="mb-2 font-medium text-gray-800">{title}</h4>
      {children}
    </div>
  )
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-1.5 last:border-b-0">
      <span className="shrink-0 text-gray-500">{k}</span>
      <span className="break-all text-right font-medium text-gray-900">{v}</span>
    </div>
  )
}

function Pill({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
}

function OrderDetailSections({ d }: { d: OrderDetail }) {
  const o = d.order
  const paid = o.payStatus === 'PAID'
  const taxFee = o.invoiceTaxFee ?? 0

  return (
    <div className="space-y-3">
      <Section title="金额明细">
        <KV k="商品标价" v={`${yuan(o.productPrice)} × ${o.quantity}`} />
        <KV k="货款（不含税）" v={yuan(o.amount)} />
        <KV
          k="随单发票税费"
          v={taxFee > 0 ? `${yuan(taxFee)}（下单时勾选了同时开发票）` : <span className="text-gray-400">—</span>}
        />
        <KV
          k={paid ? '实付' : '应付'}
          v={
            <span className="text-primary-600">
              {yuan(o.payable)}
              {taxFee > 0 && <span className="ml-1 text-xs font-normal text-gray-400">= 货款 + 税费</span>}
            </span>
          }
        />
        {d.coupon && (
          <KV
            k="优惠券"
            v={
              <span>
                原价 {yuan(o.originalAmount)} · 减免 −{yuan(o.couponDiscount)}
                <span className="block text-xs font-normal text-gray-500">
                  {d.coupon.name}（{d.coupon.label}）
                  {d.coupon.source === 'LOTTERY' ? ' · 下单有奖奖品' : ''} · 券{GRANT_STATE[d.coupon.state] || d.coupon.state}
                  {d.coupon.grantOrderId != null && d.coupon.grantOrderId !== o.id
                    ? ` · 现挂在订单 #${d.coupon.grantOrderId}`
                    : ''}
                </span>
              </span>
            }
          />
        )}
        {d.referral && <ReferralRow d={d} />}
        {d.payments.length > 0 && (
          <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
            <div className="mb-1 text-gray-400">付款记录</div>
            {d.payments.map((p) => (
              <div key={p.id} className="flex flex-wrap gap-x-2">
                <span>{PAY_METHOD[p.payMethod] || p.payMethod}</span>
                <span>{yuan(p.amount)}</span>
                <span>{PAYMENT_STATUS[p.status] ?? p.status}</span>
                <span className="font-mono text-gray-400">{p.tradeNo || '—'}</span>
                <span className="text-gray-400">{fmtTime(p.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
        {d.vmqOrders.length > 0 && (
          <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
            <div className="mb-1 text-gray-400">收款单（含重新发起的）</div>
            {d.vmqOrders.map((v) => (
              <div key={v.id} className="flex flex-wrap gap-x-2">
                <span>{VMQ_STATE[v.state] ?? v.state}</span>
                <span>
                  应付 {yuan(v.price)} · 实付(唯一) {yuan(v.reallyPrice)}
                </span>
                <span className="text-gray-400">创建 {fmtTime(v.createdAt)}</span>
                {v.payDate && <span className="text-gray-400">到账 {fmtTime(v.payDate)}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <InvoiceSection d={d} />

      {d.lottery && <LotterySection d={d} />}
    </div>
  )
}

function ReferralRow({ d }: { d: OrderDetail }) {
  const r = d.referral!
  const snap = r.rewardSnapshot ?? 0
  const who = r.referrer.nickname || r.referrer.email || `用户#${r.referrer.id}`
  let settle: React.ReactNode
  if (r.rewardRow) {
    settle =
      r.rewardRow.status === 'SETTLED' ? (
        <span className="text-green-700">
          已入推广人余额 {yuan(r.rewardRow.amount)}（{fmtTime(r.rewardRow.settledAt || r.rewardRow.createdAt)}）
        </span>
      ) : (
        <span className="text-gray-500">
          {r.rewardRow.status === 'CANCELLED' ? '已取消' : r.rewardRow.status} · {yuan(r.rewardRow.amount)}
        </span>
      )
  } else if (snap <= 0) {
    // 建单时用了券就不记返现快照（api/orders 建单处：couponGrantId 非空 → referralReward 置空）
    settle = (
      <span className="text-gray-400">{d.coupon ? '无返现（本单用了优惠券，不计返现）' : '无返现（返现为 0）'}</span>
    )
  } else if (d.order.deliveryStatus === 'DELIVERED') {
    settle = <span className="text-amber-700">订单已交付，但返现未入账</span>
  } else {
    settle = <span className="text-gray-500">待结算（订单交付完成时自动计入推广人余额）</span>
  }
  return (
    <KV
      k="内推"
      v={
        <span>
          推广人{' '}
          <Link href={`/admin/users/${r.referrer.id}`} className="text-primary-600 hover:underline">
            {who}
          </Link>
          {r.referrerMissing && <span className="text-xs text-red-600">（该用户已不存在）</span>} · 返现快照{' '}
          {snap > 0 ? yuan(snap) : '—'}
          <span className="block text-xs font-normal">{settle}</span>
        </span>
      }
    />
  )
}

function InvoiceSection({ d }: { d: OrderDetail }) {
  const o = d.order
  const taxFee = o.invoiceTaxFee ?? 0

  let body: React.ReactNode
  if (d.invoices.length > 0) {
    body = (
      <div className="space-y-3">
        {d.invoices.length > 1 && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
            这张订单关联了 {d.invoices.length} 张发票记录，请核对是否重复开票 / 重复收取税费。
          </div>
        )}
        {d.invoices.map((iv) => {
          const st = invoiceStatusMap[iv.status] || { label: iv.status, className: 'bg-gray-100 text-gray-600' }
          return (
            <div key={iv.id} className="rounded-lg bg-gray-50 px-3 py-2">
              <KV k="发票号" v={<span className="font-mono text-xs">{iv.invoiceNo}</span>} />
              <KV k="状态" v={<Pill label={st.label} className={st.className} />} />
              <KV k="抬头" v={iv.title || <span className="text-gray-400">（未填）</span>} />
              <KV k="税号" v={iv.taxNumber || <span className="text-gray-400">（未填）</span>} />
              <KV k="开票金额（含税）" v={yuan(iv.invoiceAmount)} />
              <KV k="税费 · 支付状态" v={`${yuan(iv.taxFee)} · ${iv.payStatus === 'PAID' ? '已支付' : '未支付'}`} />
              <KV k="提交 / 开具时间" v={`${fmtTime(iv.submittedAt)} / ${fmtTime(iv.issuedAt)}`} />
              <div className="pt-1.5 text-right">
                <Link
                  href={`/admin/invoices?invoiceId=${iv.id}`}
                  className="text-xs text-primary-600 hover:underline"
                >
                  在发票管理中查看 →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    )
  } else if (d.invoiceDraft && o.payStatus !== 'PAID') {
    body = (
      <div className="space-y-1">
        <div className="text-gray-700">
          {o.payStatus === 'UNPAID' ? '已勾选随单开票（待付款）' : '已勾选随单开票（订单已退款，未开票）'}
        </div>
        <KV k="抬头（草稿）" v={d.invoiceDraft.title} />
        <KV k="税号（草稿）" v={d.invoiceDraft.taxNumber} />
      </div>
    )
  } else if (taxFee > 0 && o.payStatus === 'PAID' && o.deliveryStatus !== 'CANCELLED') {
    body = (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
        税费已随单收取，但发票记录未落地 —— 重新保存该订单可重试
      </div>
    )
  } else {
    body = <div className="text-gray-400">未申请发票</div>
  }

  return (
    <Section title="发票">
      {body}
      {d.receipts.length > 0 && (
        <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-600">
          <div className="mb-1 text-gray-400">收据</div>
          {d.receipts.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-2">
              <span className="font-mono">{r.receiptNo}</span>
              <span>{yuan(r.amount)}</span>
              <span>付款人 {r.payerTitle}</span>
              <span className="text-gray-400">{fmtTime(r.issuedAt || r.createdAt)}</span>
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  查看收据 →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {d.externalOrders.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          关联的外部订单行：
          {d.externalOrders
            .map(
              (e) =>
                `#${e.id} ${e.claudeAccount}（${
                  e.importBatch === 'SHOP' ? '开票背书行' : e.importBatch === 'WEB' ? '标记完成时导入' : e.importBatch || '导入'
                }）`
            )
            .join('；')}
        </div>
      )}
    </Section>
  )
}

function LotterySection({ d }: { d: OrderDetail }) {
  const l = d.lottery!
  let body: React.ReactNode
  if (l.state === 'PENDING') {
    body = <div className="text-gray-700">有抽奖资格，买家尚未抽奖</div>
  } else if (l.state === 'VOID') {
    body = <div className="text-gray-500">抽奖资格已作废，不能再抽</div>
  } else if (!l.won) {
    body = <div className="text-gray-700">已抽奖 · 未中奖（{fmtTime(l.drawnAt)}）</div>
  } else {
    const fulfill: Record<string, string> = { PENDING: '待兑现', DONE: '已兑现', VOID: '已作废' }
    body = (
      <div>
        <KV k="结果" v={<span className="text-green-700">中奖：{l.prizeName || '—'}</span>} />
        {l.prizeLabel && l.prizeLabel !== l.prizeName && <KV k="奖品说明" v={l.prizeLabel} />}
        <KV k="抽奖时间" v={fmtTime(l.drawnAt)} />
        {l.prizeType === 'COUPON' ? (
          <KV
            k="奖券状态"
            v={
              l.couponGrant
                ? `${GRANT_STATE[l.couponGrant.state] || l.couponGrant.state}${
                    l.couponGrant.expiresAt ? ` · ${fmtTime(l.couponGrant.expiresAt)} 到期` : ' · 长期有效'
                  }`
                : '—'
            }
          />
        ) : (
          <KV
            k="兑现状态"
            v={
              <span>
                {l.fulfillState ? fulfill[l.fulfillState] || l.fulfillState : '—'}
                {l.fulfilledAt ? `（${fmtTime(l.fulfilledAt)}）` : ''}
                {l.fulfillNote && <span className="block text-xs font-normal text-gray-500">{l.fulfillNote}</span>}
              </span>
            }
          />
        )}
      </div>
    )
  }
  return <Section title="下单有奖">{body}</Section>
}

// ============ 渠道单：结算快照与分录（超管视图，设计 12.2） ============

/** 退款弹窗的「可退税费」基数：结账随单税费；否则取已付税费的发票（服务端 applyRefund 按关联发票复核上限） */
function refundTaxBase(d: OrderDetail): number {
  const checkout = d.channel?.refundContext.checkoutTaxCents ?? 0
  if (checkout > 0) return checkout
  const paid = d.invoices.filter((iv) => iv.payStatus === 'PAID' && (iv.taxFee ?? 0) > 0).sort((a, b) => a.id - b.id)[0]
  return paid ? Math.round((paid.taxFee ?? 0) * 100) : 0
}

const SETTLE_LABEL: Record<string, string> = {
  ACCRUED: '已计提（冻结中）',
  RELEASED: '已解冻',
  REVERSED: '已全额冲销',
  EXCLUDED: '不计入（成员自买等）',
  MISSING: '快照缺失（待补记）',
}
const COMPONENT_LABEL: Record<string, string> = {
  SALE: '货款',
  PURCHASE: '进货款',
  FEE: '手续费',
  SHORT: '少付',
  LOSS: '平台损失',
  INVOICE_SHARE: '发票分成',
  INVOICE_FEE: '分成手续费',
  MANUAL: '调整',
  NET: '净额',
}

function ChannelSection({
  d,
  c,
  onRefund,
  onResettle,
  resettling,
}: {
  d: OrderDetail
  c: ChannelDetail
  onRefund: () => void
  onResettle: () => void
  resettling: boolean
}) {
  const o = d.order
  const paid = o.payStatus === 'PAID' || o.payStatus === 'REFUNDED'
  const canResettle = paid && (o.settleState == null || o.settleState === 'MISSING')
  const sv = c.settlement
  const rc = c.refundContext
  return (
    <Section title={`渠道单结算（来源站 ${d.source?.code ?? '—'}）`}>
      <KV k="结算状态" v={`${o.settleState ? SETTLE_LABEL[o.settleState] ?? o.settleState : '未计提'}${o.settleExcludeReason ? `（${o.settleExcludeReason}）` : ''} · v${o.settleVersion ?? 0}`} />
      <KV k="发票分成" v={o.invShareState ?? '—'} />
      <KV k="进货价 × 件数" v={`${yuan(o.supplyUnitPrice)} × ${o.quantity} = ${yuanCents(o.supplyCents)}`} />
      <KV k="手续费率 / 发票分成率 / 冻结期" v={`${((o.feeRateBp ?? 0) / 100).toFixed(2)}% / ${((o.invoiceShareRateBp ?? 0) / 100).toFixed(2)}% / ${o.settleHoldDays ?? '—'} 天`} />
      <KV k="下单时主站价" v={yuan(o.mainPriceAtOrder)} />
      <KV
        k="已退（货款 / 税费 / 件）"
        v={`${yuanCents(rc.refundedGoodsCents)} / ${yuanCents(rc.refundedTaxCents)} / ${rc.refundedQty}`}
      />
      {(o.shortCents ?? 0) > 0 && <KV k="少付（渠道承担部分）" v={`${yuanCents(o.shortCents)}（${yuanCents(o.shortChargedCents ?? 0)}）`} />}
      {sv && (
        <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
          渠道这单：货款 {yuanCents(sv.goodsCents)} − 进货款 {yuanCents(sv.purchaseCents)} + 发票分成 {yuanCents(sv.invShareCents)}
          {sv.otherCents ? ` ± 其他 ${yuanCents(sv.otherCents)}` : ''} = 余额 {yuanCents(sv.balanceCents)}；手续费 {yuanCents(sv.feeCents)}；预计打款{' '}
          {yuanCents(sv.payoutCents)} · 资金位置 {sv.bucket}
          {sv.releaseEta ? ` · 预计 ${fmtTime(sv.releaseEta)} 解冻` : ''}
          {sv.statementNo ? ` · 结算单 ${sv.statementNo}` : ''}
        </div>
      )}
      {c.ledger.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-gray-500">分录明细（{c.ledger.length} 条，含内部 eventKey / memo）</summary>
          <table className="mt-1 w-full">
            <tbody>
              {c.ledger.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-0.5 pr-2 font-mono text-gray-400">{e.eventKey}/{e.leg}</td>
                  <td className="py-0.5 pr-2">{e.type}</td>
                  <td className="py-0.5 pr-2">{COMPONENT_LABEL[e.component] ?? e.component}</td>
                  <td className="py-0.5 pr-2">{e.bucket}</td>
                  <td className={`py-0.5 pr-2 text-right font-mono ${e.amountCents < 0 ? 'text-red-600' : 'text-green-700'}`}>{yuanCents(e.amountCents)}</td>
                  <td className="py-0.5 text-gray-400">{e.memo ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      {c.partnerReplies > 0 && <div className="mt-2 text-xs text-violet-700">本单留言里有 {c.partnerReplies} 条是渠道成员回复（买家侧显示为「客服」）。</div>}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {canResettle && (
          <Button variant="outline" size="sm" loading={resettling} onClick={onResettle}>
            按快照补记
          </Button>
        )}
        {paid && (
          <Button size="sm" onClick={onRefund}>
            退款 / 部分退款
          </Button>
        )}
      </div>
    </Section>
  )
}
