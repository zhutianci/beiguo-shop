# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# 安装 Prisma 所需的 OpenSSL（Alpine 默认没有）
RUN apk add --no-cache openssl libc6-compat

# 配置 npm 使用国内镜像
RUN npm config set registry https://registry.npmmirror.com

# lock 不带 * 通配：没有 lock 就该构建失败。
# 【暂不换成 npm ci】2026-09-26 终审实测：本地用 npm 11 生成的 lock 缺几条可选依赖条目
# （@emnapi/*、@floating-ui/dom），node:20-alpine 自带的 npm 10 做 npm ci 会直接 EUSAGE 失败；
# npm install 会按 lock 装并静默补齐，这几个月一直是这么构建的。要换 npm ci，先在 node:20-alpine 里
# `npm install --package-lock-only` 重新生成 lock、再 `npm ci --dry-run` 验证通过后一起提交。
COPY package.json package-lock.json ./
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
# 渠道分站版本（源码 504 → 708 个 .ts/.tsx）已按同一上限复测：2026-09-26 开发机
# `NODE_OPTIONS=--max-old-space-size=640 npm run build`（含 prebuild）一次通过、预渲染 0 条，单进程工作集峰值约 1.2GB
# （含堆外内存；V8 堆被压在 640MB 内）。以后代码量大涨时照此复测，出现 `JavaScript heap out of memory` 再调高。
#
# 【构建产物必须校验】Next 14 的 webpack 构建子进程被 OOM 杀掉时，next build 会**静默以 0 退出**，
# 这一层于是被 BuildKit 当成成功缓存下来（里面没有 .next/standalone）—— 之后同样的源码再构建，
# 直接命中这层坏缓存，失败在后面的 COPY 上，怎么重试都一样（2026-09-25 实测）。
# 这里补一道校验：产物不在就让这一步失败，坏结果永远进不了缓存。
#
# 【渠道分站边界检查】npm run build 会先跑 package.json 的 prebuild = node scripts/check-tenant-boundary.mjs
# （纯文本扫描，毫秒级，不占内存）：渠道层越界 import、漏守卫、按 Host 缓存等违规直接让这一步失败（设计 6.5.5）。
RUN NODE_OPTIONS=--max-old-space-size=640 npm run build \
 && test -f .next/standalone/server.js \
 && test -d .next/static

# 【预渲染清单验收】根布局 force-dynamic 之后，构建期不应再有任何页面被预渲染成一份静态 HTML
# （那份 HTML 会原样发给所有 Host：主站页面出现在渠道站、或反过来，设计 4.8）。
# 设计 4.8「核对后再改成硬闸」：2026-09-26 集成阶段本地生产构建（Next 14.2.35，与镜像同一份源码）核对 routes=0，
# 所以默认就是硬闸（1）。万一服务器构建因此失败：先看日志里 [prerender] 行列出的路由、修代码；
# 急着出版本时可临时 docker compose build --build-arg PRERENDER_STRICT=0 只打印不失败。
ARG PRERENDER_STRICT=1
RUN node -e "const m=require('./.next/prerender-manifest.json');const r=Object.keys(m.routes||{});console.log('[prerender] routes='+r.length+(r.length?' → '+r.join(' '):''));if(process.env.PRERENDER_STRICT==='1'&&r.length){console.error('[prerender] 有页面被构建期预渲染（会把同一份 HTML 发给所有 Host），构建失败');process.exit(1)}"

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

# 渠道结算的私有文件（打款凭证，src/lib/tenant/private-files.ts；主会话 D11）。不放 public 下：只能经超管接口读。
# 与上面同理：docker-compose.yml 给它挂命名卷 private_files，卷首次挂载继承这里的 nextjs 属主；
# 不预建的话 saveProof 报 EACCES（本地开发不跑 Docker 测不出来，部署冒烟用 `docker exec -u nextjs beiguo-app touch /app/private/payout/.probe` 验）
RUN mkdir -p /app/private/payout && chown -R nextjs:nodejs /app/private

# Next 的预渲染/fetch 缓存目录。COPY 进来的 .next 属主是 root，而运行时是 nextjs 用户，
# 不给写权限就会每次请求都报 EACCES: mkdir '/app/.next/cache' 并退化成完全不缓存。
# 之前全站是 'use client' + force-dynamic 所以没暴露，新闻栏目引入 Server Component 后才出现。
RUN mkdir -p ./.next/cache && chown -R nextjs:nodejs ./.next

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
