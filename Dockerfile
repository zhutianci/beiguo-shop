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
RUN npm run build

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
