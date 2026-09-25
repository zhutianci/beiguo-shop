/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /*
   * 【服务器构建不做类型检查】生产机 1.8G 内存，镜像在本机构建。2026-09-25 营销模块上线后，
   * 整个项目的类型检查要约 1.0~1.1G 堆（TipTap 编辑器与 zod 的类型很重），超过机器空闲内存：
   * 构建时内核 OOM 先杀了正在跑的站点容器（beiguo-app / jishi-app / 两个 cloudflared，停摆约 20 秒），构建也被带死。
   *
   * 类型检查不影响产物（Next 用 SWC 编译，本来就忽略类型），它只是质量闸门 ——
   * 这道闸挪到本地：**推送前必须 npx tsc --noEmit 零错误**（交接文档第三十节、营销推广-部署说明）。
   * 编译本身在 Dockerfile 里用 NODE_OPTIONS 限了堆，见 builder 阶段注释。
   */
  typescript: { ignoreBuildErrors: true },
  // 仓库没有 ESLint 配置，构建期的 lint 本来就是空跑；显式关掉，省一次进程
  eslint: { ignoreDuringBuilds: true },
  // 不发 X-Powered-By: Next.js。nginx 那边也 proxy_hide_header 了，这里是双保险：
  // 防的是将来有人绕过 nginx 直连 app:3000（隧道/调试）时又把框架指纹带出去。
  // 别在这里再写 headers() 加安全头 —— 安全头统一在 nginx 加，两边都加会重复出头。
  poweredByHeader: false,
  /*
   * 【图片优化整体关闭】全站只有联系弹窗的本地 /wechat-qr.jpg 用 next/image，
   * 生产是 standalone 且没装 sharp，优化本来就失败回落为原图，关掉对页面零影响。
   * 以前这里写的是 remotePatterns hostname '**'，/_next/image 因此成了匿名外链代理：
   * 上游整包读进内存（无大小上限、无超时，能把 app 打到 1024m 上限反复重启）、
   * 原图写进 .next/cache/images 且不淘汰（换个 query 就是一条新缓存，写满与 MySQL 同盘的系统盘）、
   * 还会跟随重定向（盲 SSRF）。unoptimized 之后 Next 对 /_next/image 一律 404，
   * <Image> 直接输出 <img src="/wechat-qr.jpg">。
   * 这个配置在构建期写进 standalone 的 server.js 与客户端 bundle，只改服务器上的文件不生效，必须重建镜像。
   * 不要为了开优化去装 sharp，也不要再加 remotePatterns；外站图片一律用原生 <img>。
   */
  images: { unoptimized: true },
}

module.exports = nextConfig
