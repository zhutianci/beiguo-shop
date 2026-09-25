/**
 * 区块类型的图标、一句话说明与区块面板分组（编辑器专用展示信息；类型名称用 types.ts 的 BLOCK_TYPE_LABEL）。
 */
import {
  Heading,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  MessageSquareWarning,
  MousePointerClick,
  MoveVertical,
  PanelTop,
  SeparatorHorizontal,
  ShoppingBag,
  TicketPercent,
  Type,
  type LucideIcon,
} from 'lucide-react'
import type { Block, BlockType } from '@/lib/marketing/types'
import { BLOCK_TYPE_LABEL } from '@/lib/marketing/types'
import { blockSummary } from '@/lib/marketing/render'

export const BLOCK_ICON: Record<BlockType, LucideIcon> = {
  header: PanelTop,
  hero: Megaphone,
  heading: Heading,
  text: Type,
  image: ImageIcon,
  button: MousePointerClick,
  product: ShoppingBag,
  productGrid: LayoutGrid,
  coupon: TicketPercent,
  callout: MessageSquareWarning,
  divider: SeparatorHorizontal,
  spacer: MoveVertical,
}

export const BLOCK_DESC: Record<BlockType, string> = {
  header: '品牌 Logo 与标题，放在最上面',
  hero: '大标题 + 副标题 + 按钮的醒目横幅',
  heading: '段落标题',
  text: '正文段落，支持加粗、链接、列表',
  image: 'JPG / PNG / GIF，可加链接',
  button: '醒目的行动按钮',
  product: '单个商品：图、名称、价格、按钮',
  productGrid: '2–6 个商品两列排列',
  coupon: '直发到账户或领取链接（每封一个）',
  callout: '带底色的提示框',
  divider: '一条分割线',
  spacer: '空白间距',
}

export const PALETTE_GROUPS: { title: string; types: BlockType[] }[] = [
  { title: '基础', types: ['heading', 'text', 'image', 'button'] },
  { title: '版式', types: ['header', 'hero', 'callout', 'divider', 'spacer'] },
  { title: '商品与优惠', types: ['product', 'productGrid', 'coupon'] },
]

/** 左栏一行摘要。渲染器的 blockSummary 是契约实现；万一抛错（数据不完整）也不能让整个列表崩掉 */
export function safeSummary(b: Block): string {
  try {
    const s = blockSummary(b)
    if (typeof s === 'string' && s.trim()) return s
  } catch {
    /* 落到下面的兜底 */
  }
  return BLOCK_TYPE_LABEL[b.type] || b.type
}
