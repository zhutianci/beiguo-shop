/**
 * 充值平台适配器：sysd（对方的「兑换中心」，niuniu888.applelll.com）。
 *
 * 【协议和 sysc 完全一样，所以这里只有一份配置】
 * 2026-10-24 拉了两家的兑换页对比：niuniu888 与 chuanwen 返回的 HTML **md5 一致**
 * （同一套白标前端，`getRef()` 按子域取店铺标识）。下单 / 查卡 / 批量查 / 强刷四组接口、
 * 三个防重放头、状态机、Team 号判据，全都和 docs/sysc-充值系统-协议逆向说明.md 一字不差。
 * 唯一的差别是 `ref=niuniu888`（以及它的商品清单只有 6 个，见 docs/sysd-接入说明.md）。
 *
 * 所以协议逻辑**不复制**，直接用 sysc.ts 的 createStore()。
 * 以后对方改协议，改 sysc.ts 一处，两家店同时生效；
 * 哪天两家真的分叉了，再把差异做成 StoreConfig 的一个开关，而不是复制整份适配器。
 *
 * 【四条红线与 sysc 相同】下单前永远先查状态、possible_success 不交付也不重充、
 * 只发 UUID 和邮箱不发整段 session、不透传对方 detail / message。详见 sysc.ts 文件头。
 */
import type { RedeemProvider } from '../types'
import { createStore } from './sysc'

/** 三个环境变量都不用配：默认值就是对方给我们的店。只有对方换域名 / 换店铺时才要改 */
export const SYSD = createStore({
  key: 'sysd',
  adminLabel: 'D 系统（兑换中心 / niuniu888）',
  base: process.env.SYSD_BASE || 'https://niuniu888.applelll.com',
  ref: process.env.SYSD_STORE_REF || 'niuniu888',
  productMapEnv: 'SYSD_PRODUCT_MAP',
  tracePrefix: 'SD',
  fallbackEnv: 'SYSD_FALLBACK_URL',
})

export const sysd: RedeemProvider = SYSD.provider
export const sysdStatusBatch = SYSD.statusBatch
