'use client'

import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  ArrowRight,
  Network,
  Globe,
  Bot,
  Gauge,
  ShieldAlert,
  Radio,
  Activity,
  HeartPulse,
  Route,
  CreditCard,
  MapPin,
  Fingerprint,
  Server,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { MouseSpotlight } from '@/components/mouse-spotlight'
import { ipToolGroups, ipToolCount, type IpTool } from '@/lib/iptools'

// 按工具名映射图标，保持数据文件纯净
const ICONS: Record<string, LucideIcon> = {
  'Net.Coffee 网络检测': Globe,
  'Claude IP 检测': Bot,
  'IP 深度评分': Gauge,
  'DNS 泄露检测': ShieldAlert,
  'WebRTC 泄露检测': Radio,
  '全球 Ping 测试': Activity,
  '全球服务状态': HeartPulse,
  'Claude 分流规则': Route,
  'Claude 服务状态': HeartPulse,
  'IP 卡片': CreditCard,
  'IP 地址查询': MapPin,
  'IP 类型检测': Fingerprint,
  'IP 欺诈值查询': ShieldAlert,
  '多地 Ping 测试': Activity,
  '本地网络检测': Server,
  '网络测速': Gauge,
  '域名 Whois 查询': Search,
}

function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] || Network
  return <Icon className={className} />
}

// 顶部排查步骤
const STEPS = ['查 IP / 分流', 'Claude IP 检测', 'DNS · WebRTC 泄露', '全球 Ping', '服务状态']

export default function IpToolsPage() {
  const featured = ipToolGroups[0].tools.find((t) => t.featured)
  const rest = ipToolGroups[0].tools.filter((t) => !t.featured)

  return (
    <div className="relative overflow-hidden min-h-screen">
      <MouseSpotlight />

      {/* 背景装饰 */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-24 left-1/4 w-[28rem] h-[28rem] bg-cyan-500/20 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 right-1/5 w-[26rem] h-[26rem] bg-purple-500/20 rounded-full blur-[140px]" />

      <div className="container relative z-10 pt-32 pb-24 max-w-6xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/80">网络诊断工具合集 · 共 {ipToolCount} 项</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">IP 工具</span>
          </h1>
          <p className="text-white/50 text-lg">
            IP 查询、分流出口、Claude 可用性、DNS / WebRTC 泄露、全球 Ping 与服务状态，一站排查网络环境。
          </p>
        </motion.div>

        {/* 排查步骤 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-14 text-sm"
        >
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-white/70">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </span>
              {i < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-white/20" />}
            </div>
          ))}
        </motion.div>

        {/* 推荐 Hero 卡片 */}
        {featured && (
          <motion.a
            href={featured.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative block rounded-3xl p-8 md:p-10 mb-14 overflow-hidden glass-strong border border-cyan-400/25"
          >
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-cyan-500/40 to-purple-500/40 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 -z-10" />
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ToolIcon name={featured.name} className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">★ 推荐优先使用</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{featured.name}</h2>
                <p className="text-white/50 leading-relaxed max-w-2xl">{featured.desc}</p>
                <span className="inline-block mt-3 text-xs text-white/30 font-mono">{featured.host}</span>
              </div>

              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 font-medium group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-shadow">
                  打开工具
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </motion.a>
        )}

        {/* 第一组剩余工具 */}
        <ToolSection title={ipToolGroups[0].title} count={rest.length} tools={rest} startDelay={0} />

        {/* 其余分组 */}
        {ipToolGroups.slice(1).map((group) => (
          <ToolSection
            key={group.title}
            title={group.title}
            subtitle={group.subtitle}
            count={group.tools.length}
            tools={group.tools}
            startDelay={0}
          />
        ))}

        <p className="text-center text-xs text-white/25 mt-10">
          本页仅整理公开网络检测工具入口，结果仅供网络诊断参考。请遵守当地法律法规和各平台服务条款。
        </p>
      </div>
    </div>
  )
}

function ToolSection({
  title,
  subtitle,
  count,
  tools,
  startDelay,
}: {
  title: string
  subtitle?: string
  count: number
  tools: IpTool[]
  startDelay: number
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <span className="text-xs px-2.5 py-0.5 rounded-full glass text-cyan-300">{subtitle}</span>}
        <span className="text-xs text-white/25 ml-auto">{count} 项</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, i) => (
          <motion.a
            key={tool.url}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: startDelay + i * 0.04 }}
            className="group relative flex flex-col rounded-2xl p-5 glass hover:bg-white/[0.07] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-cyan-300 group-hover:bg-cyan-500/15 group-hover:text-cyan-200 transition-colors">
                <ToolIcon name={tool.name} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[15px] truncate">{tool.name}</h3>
                  <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {tool.tag && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-medium">
                      {tool.tag}
                    </span>
                  )}
                  <span className="text-[11px] text-white/30 font-mono truncate">{tool.host}</span>
                </div>
              </div>
            </div>
            <p className="text-[13px] text-white/45 leading-relaxed">{tool.desc}</p>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
