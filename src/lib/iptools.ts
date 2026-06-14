// IP 工具导航数据（写死维护）。如需增删工具，直接改这里即可。
// 数据整理自公开网络检测工具入口，结果仅供网络诊断参考。

export interface IpTool {
  name: string
  tag?: string // 角标短标签
  desc: string
  url: string
  host: string // 展示用域名/路径
  featured?: boolean // 是否重点推荐（高亮卡片）
}

export interface IpToolGroup {
  title: string
  subtitle?: string
  tools: IpTool[]
}

export const ipToolGroups: IpToolGroup[] = [
  {
    title: 'Net.Coffee 网络检测',
    subtitle: '推荐优先使用',
    tools: [
      {
        name: 'Net.Coffee 网络检测',
        tag: '综合入口',
        desc: '查看当前 IPv4 / IPv6 出口、国内外网站分流结果和网络连通性，适合先做全局体检。',
        url: 'https://ip.net.coffee/',
        host: 'ip.net.coffee',
        featured: true,
      },
      {
        name: 'Claude IP 检测',
        tag: 'Claude',
        desc: '检测 Claude 出口 IP、信任评分、住宅/机房属性、DNS 与 UDP 风险。',
        url: 'https://ip.net.coffee/claude/',
        host: 'ip.net.coffee/claude',
      },
      {
        name: 'IP 深度评分',
        tag: '评分',
        desc: '查询 IP 地理、ASN、运营商、家宽/机房、人机流量、黑名单和风险标记。',
        url: 'https://ip.net.coffee/ip/',
        host: 'ip.net.coffee/ip',
      },
      {
        name: 'DNS 泄露检测',
        tag: 'DNS',
        desc: '检测 DNS 解析器出口，判断是否暴露本地运营商或真实上网位置。',
        url: 'https://ip.net.coffee/dns/',
        host: 'ip.net.coffee/dns',
      },
      {
        name: 'WebRTC 泄露检测',
        tag: 'UDP',
        desc: '检查 STUN / UDP 是否绕过代理，避免浏览器暴露真实 IP。',
        url: 'https://ip.net.coffee/webrtc/',
        host: 'ip.net.coffee/webrtc',
      },
      {
        name: '全球 Ping 测试',
        tag: '延迟',
        desc: '从全球多节点检测目标 IP 延迟，判断出口到不同地区的网络路径。',
        url: 'https://ip.net.coffee/ping/',
        host: 'ip.net.coffee/ping',
      },
      {
        name: '全球服务状态',
        tag: '状态',
        desc: '一站查看 Claude、OpenAI、GitHub、Cloudflare 等主流服务运行状态。',
        url: 'https://ip.net.coffee/status/',
        host: 'ip.net.coffee/status',
      },
      {
        name: 'Claude 分流规则',
        tag: '规则',
        desc: '整理 Anthropic 核心域名、CDN、认证、监控、IP 段和 ASN 兜底规则。',
        url: 'https://ip.net.coffee/claude/site.html',
        host: 'ip.net.coffee/claude/site',
      },
      {
        name: 'Claude 服务状态',
        tag: 'Claude',
        desc: '单独关注 Claude / Anthropic 服务可用性，区分官方故障和本地网络问题。',
        url: 'https://ip.net.coffee/claude/status.html',
        host: 'ip.net.coffee/claude/status',
      },
      {
        name: 'IP 卡片',
        tag: '卡片',
        desc: '生成当前 IP 信息展示卡片，适合快速分享出口信息和网络检测结果。',
        url: 'https://card.net.coffee/',
        host: 'card.net.coffee',
      },
    ],
  },
  {
    title: '常用补充工具',
    subtitle: '交叉验证',
    tools: [
      {
        name: 'IP 地址查询',
        desc: '公网 IP、归属地、ISP 运营商。',
        url: 'https://whatismyipaddress.com/',
        host: 'whatismyipaddress.com',
      },
      {
        name: 'IP 类型检测',
        desc: '原生/广播、住宅/数据中心、AS 信息。',
        url: 'https://ping0.cc/',
        host: 'ping0.cc',
      },
      {
        name: 'IP 欺诈值查询',
        desc: '欺诈风险评分，分值越低越干净。',
        url: 'https://scamalytics.com/',
        host: 'scamalytics.com',
      },
      {
        name: '多地 Ping 测试',
        desc: '国内多节点延迟与线路质量。',
        url: 'https://www.itdog.cn/ping/',
        host: 'itdog.cn/ping',
      },
      {
        name: '本地网络检测',
        desc: 'IPv6、分流、DNS 泄露、回程测试。',
        url: 'https://www.itdog.cn/localhost/',
        host: 'itdog.cn/localhost',
      },
      {
        name: '网络测速',
        desc: '下载、上传速度和延迟。',
        url: 'https://www.speedtest.net/zh-Hans',
        host: 'speedtest.net',
      },
      {
        name: '域名 Whois 查询',
        desc: '注册信息、到期时间、DNS 服务器。',
        url: 'https://whoiscx.com/',
        host: 'whoiscx.com',
      },
    ],
  },
]

export const ipToolCount = ipToolGroups.reduce((n, g) => n + g.tools.length, 0)
