import { notFoundUnlessModule } from '@/lib/storefront/resolve'

/*
 * 内容平台（docs/内容平台/内容平台-设计.md）只在主站开放，渠道分站整组 404（同 /forum，设计 11.2）。
 * 【这里刻意不写 metadata / canonical】layout 的 metadata 会被所有子路由继承（交接文档 §28 第 ④ 条），
 * 每个页面自己声明。
 */
export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  await notFoundUnlessModule('learn')
  return <>{children}</>
}
