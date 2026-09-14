// Server 外壳：商品列表页此前也是 'use client'，拿不到自己的 <title>/<description>，
// 只能继承 layout.tsx 的全站默认值。列表页是「Claude 代充」这类词最可能落地的页面之一，
// 让它有一份自己的标题是最低成本的一步。交互逻辑全在 products-client.tsx，未改动。
import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'
import ProductsClient from './products-client'

const TITLE = `AI 订阅服务 - Claude Pro / MAX、ChatGPT Plus / Pro 代开充值 - ${SITE_NAME}`
const DESCRIPTION =
  'Claude Pro、Claude MAX 5x/20x、ChatGPT Plus、ChatGPT Pro 订阅代开与充值。人工核验发货，支持开具增值税发票，售后工单跟进。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 列表页同样会被带 ?ref= 分享出去，canonical 指回干净地址
  alternates: { canonical: '/products' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/products' },
}

export default function ProductsPage() {
  return <ProductsClient />
}
