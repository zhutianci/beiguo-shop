import { notFoundUnlessModule } from '@/lib/storefront/resolve'

/*
 * Skill 库目录是 AI 学习的一部分：主站开放；渠道分站跟随「AI 学习」模块的授权与上架（同 /apps、/prompts、/guides 的 layout）。
 * 【这里刻意不写 metadata / canonical】layout 的 metadata 会被子路由继承，页面自己声明。
 */
export default async function SkillsLayout({ children }: { children: React.ReactNode }) {
  await notFoundUnlessModule('learn')
  return <>{children}</>
}
