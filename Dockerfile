# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# 安装 Prisma 所需的 OpenSSL（Alpine 默认没有）
RUN apk add --no-cache openssl libc6-compat

# 配置 npm 使用国内镜像
RUN npm config set registry https://registry.npmmirror.com

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED 1
# 【构建限堆】生产机只有 1.8G、swappiness=0（几乎不用 swap），而构建进程挂在 dockerd 下（oom_score_adj -500，
# 被保护）。不限堆时 next build 会一路长到超过机器空闲内存，内核 OOM 就先杀正在跑的站点容器
# （2026-09-25 实测：beiguo-app、jishi-app、两个 cloudflared 被杀，停摆约 20 秒），构建也被连带取消。
# 限到 640MB：GC 勤一点，编译照样能过（本地实测 512MB 就够，768MB 时类型检查会爆 —— 所以类型检查已挪到本地，
# 见 next.config.js 的 typescript.ignoreBuildErrors）。只作用于这一步，不影响运行时容器。
#
# 【构建产物必须校验】Next 14 的 webpack 构建子进程被 OOM 杀掉时，next build 会**静默以 0 退出**，
# 这一层于是被 BuildKit 当成成功缓存下来（里面没有 .next/standalone）—— 之后同样的源码再构建，
# 直接命中这层坏缓存，失败在后面的 COPY 上，怎么重试都一样（2026-09-25 实测）。
# 这里补一道校验：产物不在就让这一步失败，坏结果永远进不了缓存。
RUN NODE_OPTIONS=--max-old-space-size=640 npm run build \
 && test -f .next/standalone/server.js \
 && test -d .next/static

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# 运行时也需要 openssl；tzdata 必须装，否则 alpine(musl) 找不到 /usr/share/zoneinfo，
# TZ=Asia/Shanghai 会被静默忽略、进程仍跑在 UTC
RUN apk add --no-cache openssl libc6-compat tzdata

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV TZ Asia/Shanghai

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# 批量开票用的税局官方模板。**必须显式 COPY**：standalone 的文件追踪只看 import/require
# 的依赖图，fs.readFile 读的文件它一无所知，不写这一行镜像里就没有，
# 导出接口会在运行时才报 ENOENT。放 templates/ 而不是 public/ 是为了不让它被公网直接下载
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 论坛图片上传目录（命名卷首次挂载会继承此目录的 nextjs 属主，保证可写）
RUN mkdir -p ./public/uploads/forum && chown -R nextjs:nodejs ./public/uploads

# Next 的预渲染/fetch 缓存目录。COPY 进来的 .next 属主是 root，而运行时是 nextjs 用户，
# 不给写权限就会每次请求都报 EACCES: mkdir '/app/.next/cache' 并退化成完全不缓存。
# 之前全站是 'use client' + force-dynamic 所以没暴露，新闻栏目引入 Server Component 后才出现。
RUN mkdir -p ./.next/cache && chown -R nextjs:nodejs ./.next

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
