'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Network, ShieldCheck } from 'lucide-react'
import { MouseSpotlight } from '@/components/mouse-spotlight'
import { ipToolGroups, ipToolCount } from '@/lib/iptools'

export default function IpToolsPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <MouseSpotlight />

      {/* 背景装饰 */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-32 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />

      <div className="container relative z-10 pt-32 pb-24">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/80">网络诊断工具合集 · 共 {ipToolCount} 项</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">IP 工具</span>
          </h1>
          <p className="text-white/50 text-lg">
            集中整理 IP 查询、分流出口、Claude 可用性、DNS 泄露、WebRTC、全球 Ping 和服务状态监控。
          </p>
          <p className="text-white/30 text-sm mt-4">
            建议排查顺序：先用 Net.Coffee 查 IP 和分流 → 再看 Claude IP 检测 → 异常则继续查 DNS 泄露、WebRTC/UDP 和全球 Ping → 最后确认服务状态。
          </p>
        </motion.div>

        {/* 工具分组 */}
        {ipToolGroups.map((group, gi) => (
          <section key={group.title} className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{group.title}</h2>
                {group.subtitle && (
                  <span className="text-xs px-2.5 py-1 rounded-full glass text-cyan-300">{group.subtitle}</span>
                )}
              </div>
              <span className="text-xs text-white/30">{group.tools.length} 项</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tools.map((tool, i) => (
                <motion.a
                  key={tool.url}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (gi === 0 ? i : i + 0.5) * 0.05 }}
                  className={`group relative block rounded-2xl p-5 transition-all hover:-translate-y-1 ${
                    tool.featured
                      ? 'glass-strong border border-cyan-400/30'
                      : 'glass hover:bg-white/[0.07]'
                  }`}
                >
                  {tool.featured && (
                    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 -z-10" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-bold text-base truncate">{tool.name}</h3>
                      {tool.featured && <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {tool.tag && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/70">{tool.tag}</span>
                    )}
                    <span className="text-[11px] text-white/30 font-mono truncate">{tool.host}</span>
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed">{tool.desc}</p>
                </motion.a>
              ))}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-white/25 mt-8">
          本页仅整理公开网络检测工具入口，结果仅供网络诊断参考。请遵守当地法律法规和各平台服务条款。
        </p>
      </div>
    </div>
  )
}
