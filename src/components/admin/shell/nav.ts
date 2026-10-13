/**
 * 后台导航的唯一清单：侧栏、面包屑、命令面板（Ctrl K）都读这里。
 * 2026-10-13 控制台改版时从 app/admin/layout.tsx 原样搬出（分组依据与注释未改），只多了 kw（命令面板检索词）和两种红点。
 */
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  FileUp,
  BellRing,
  MessagesSquare,
  Receipt,
  Stamp,
  QrCode,
  KeyRound,
  Gift,
  Share2,
  Newspaper,
  Ticket,
  Link2,
  BarChart3,
  PartyPopper,
  Megaphone,
  Store,
  LifeBuoy,
  Scale,
  ScrollText,
  PieChart,
  Wallet,
  MessageSquareText,
  Bot,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  /**
   * 菜单右侧的待办数（红点）：渠道售后申请（多渠道设计 8.4「超管售后申请列表红点」）；
   * 短信接码的售后申请待处理数（docs/短信接码-设计.md §8.5「后台『售后申请』有红点」，S3）
   */
  badge?: 'afterSales' | 'jiemaComplaints' | 'orders' | 'invoices'
  /** 命令面板里的检索词：英文名与拼音首字母，空格分隔（面板按「包含」匹配标签与这里的词） */
  kw?: string
}

export type NavGroup = {
  group: string
  items: NavItem[]
}

/**
 * 侧边栏按「业务对象」分组，而不是按页面新旧或使用频率分组。
 *
 * 18 个菜单平铺时，找一个入口要从头扫到尾；分组之后眼睛先定位到一个业务域（4~5 个组标题），
 * 再在组内 2~4 项里挑，扫描成本从 O(18) 降到 O(7)+O(4)。
 * 之所以按业务对象切，是因为站长的心智是「我现在要处理订单的事 / 要处理钱的事」，
 * 而不是「我要用那个上周新加的功能」。
 *
 * 新增菜单往哪放：先问这个页面操作的主体是什么——
 *   看数据不改数据 → 概览；商品/卡密库存 → 商品与卡密；一笔交易的生命周期 → 订单与营销；
 *   钱的进出与凭证 → 财务；人 → 客户；对外展示的内容 → 内容；只有站长自己会碰 → 系统。
 * 判断不了就放「系统」，不要新开一组：组数超过 8 个，分组本身又变成了噪音。
 */
export const navGroups: NavGroup[] = [
  {
    // 只读的决策面板放最上面：每天第一眼看的是「昨天怎么样」，而不是某个具体表单
    group: '概览',
    items: [
      { href: '/admin', label: '仪表盘', icon: LayoutDashboard, kw: 'dashboard ybp home 首页 概览' },
      { href: '/admin/analytics/traffic', label: '流量分析', icon: BarChart3, kw: 'traffic llfx pv uv 访问' },
    ],
  },
  {
    // 外部发卡本质是卡密的出库渠道，跟着卡密走，不跟着订单走
    group: '商品与卡密',
    items: [
      { href: '/admin/products', label: '商品管理', icon: Package, kw: 'products spgl 商品' },
      { href: '/admin/cardkeys', label: '卡密管理', icon: KeyRound, kw: 'cardkeys kmgl cdk 卡密 库存' },
      { href: '/admin/categories', label: '分类管理', icon: FolderTree, kw: 'categories flgl' },
      { href: '/admin/dispenses', label: '外部发卡', icon: Share2, kw: 'dispenses wbfk api' },
    ],
  },
  {
    // 优惠券、下单有奖和内推都是「促成一笔订单」的手段，和订单放一起才能连着看转化
    group: '订单与营销',
    items: [
      { href: '/admin/orders', label: '订单管理', icon: ShoppingCart, badge: 'orders', kw: 'orders ddgl 订单 发货' },
      // 短信接码（docs/短信接码-设计.md §6.6 第 23 条：放「订单与营销」组）：概览、定价、目录、设置；S2 起接码订单与成本利润也在这里
      { href: '/admin/jiema', label: '短信接码', icon: MessageSquareText, badge: 'jiemaComplaints', kw: 'jiema sms dxjm 接码' },
      { href: '/admin/external-orders', label: '订单导入', icon: FileUp, kw: 'import dddr 闲鱼 导入' },
      { href: '/admin/coupons', label: '优惠券', icon: Ticket, kw: 'coupons yhq 券' },
      // 紧挨着优惠券：抽中的券就是优惠券系统里的单张批次
      { href: '/admin/lottery', label: '抽奖管理', icon: PartyPopper, kw: 'lottery cjgl 红包 抽奖' },
      { href: '/admin/referrals', label: '内推管理', icon: Gift, kw: 'referrals ntgl 推广 返现 提现' },
    ],
  },
  {
    // 收款监控放在发票/收据之前：钱有没有到账是高频动作，开票是低频的售后动作
    group: '财务',
    items: [
      { href: '/admin/vmq', label: '收款监控', icon: QrCode, kw: 'vmq skjk 收款码 到账 支付宝' },
      { href: '/admin/invoices', label: '发票管理', icon: Receipt, badge: 'invoices', kw: 'invoices fpgl 开票 发票' },
      { href: '/admin/receipts', label: '收据管理', icon: Stamp, kw: 'receipts sjgl 收据' },
    ],
  },
  {
    // 到期提醒操作的对象是「某个用户的订阅要到期了」，所以归到客户而不是订单
    group: '客户',
    items: [
      { href: '/admin/users', label: '用户管理', icon: Users, kw: 'users yhgl 用户 买家' },
      // 余额是「某个用户欠 / 被欠多少钱」，跟着人走（docs/短信接码-设计.md §6.6 第 6 条：不新开组）
      { href: '/admin/wallet', label: '余额与充值', icon: Wallet, kw: 'wallet yecz 余额 充值' },
      { href: '/admin/reminders', label: '到期提醒', icon: BellRing, kw: 'reminders dqtx 到期' },
      // 营销邮件的对象是「一群用户」（按条件筛人、管订阅与退订），不是某张订单，所以跟用户放一起；
      // 它和「到期提醒」都是往用户邮箱发信，挨着放便于对照两类邮件
      { href: '/admin/marketing', label: '营销推广', icon: Megaphone, kw: 'marketing yxtg 邮件 群发' },
    ],
  },
  {
    // 这三项的共同点是产出对外可见的页面内容（同时也是 SEO 的抓手）
    group: '内容',
    items: [
      { href: '/admin/news', label: 'AI大事记', icon: Newspaper, kw: 'news dsj 新闻 大事记' },
      { href: '/admin/forum', label: '论坛管理', icon: MessagesSquare, kw: 'forum ltgl 论坛 内容' },
      { href: '/admin/links', label: '友链与招商', icon: Link2, kw: 'links ylzs 友链' },
    ],
  },
  {
    // 渠道分站（WP5，设计 12.2）：渠道的开通、进货价、结算都是「和某个渠道之间的事」，自成一组；
    // 售后申请是渠道发起、站长处理的工单，跟着渠道走而不是跟着订单走（主站订单没有售后申请）。
    // 页面在休眠期（CHANNELS_ENABLED 未设置）也能打开，只是空态——菜单多出这一组是发布说明里写明的可感知变化（实施分包 8.6）。
    group: '渠道',
    items: [
      { href: '/admin/tenants', label: '渠道管理', icon: Store, kw: 'tenants qdgl 渠道 分站' },
      { href: '/admin/tenants/overview', label: '运营概览', icon: PieChart, kw: 'overview yygl 渠道概览' },
      { href: '/admin/after-sales', label: '售后申请', icon: LifeBuoy, badge: 'afterSales', kw: 'aftersales shsq 售后 退款' },
      { href: '/admin/tenants/reconcile', label: '对账自检', icon: Scale, kw: 'reconcile dzzj 对账' },
    ],
  },
  {
    group: '系统',
    items: [
      { href: '/admin/settings', label: '系统设置', icon: Settings, kw: 'settings xtsz 公告 设置' },
      // 审计日志只有站长自己看（含渠道操作、平台对渠道的操作、越权拒绝），归「系统」
      { href: '/admin/audit', label: '审计日志', icon: ScrollText, kw: 'audit sjrz 日志' },
      // 微信机器人（docs/微信机器人-设计.md §14）：登录小号、群绑定、管理员、锁定解锁都只有站长自己碰，归不了类，放「系统」
      { href: '/admin/bot', label: '微信机器人', icon: Bot, kw: 'bot wxjqr 微信 机器人' },
    ],
  },
]

// 顶部标题要按「最长匹配」取，不能取第一个命中的：
// /admin/analytics/traffic 这类多级路径如果将来出现父级菜单，前缀匹配会先命中父级，标题就错了。
export const flatNavItems = navGroups.flatMap((g) => g.items)

export function matchesPath(href: string, pathname: string) {
  // /admin 是所有后台路径的前缀，只能精确匹配，否则它会永远处于选中态
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}
