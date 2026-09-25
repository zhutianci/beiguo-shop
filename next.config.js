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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
