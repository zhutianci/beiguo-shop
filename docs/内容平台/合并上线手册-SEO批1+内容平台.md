# SEO 批 1 + 内容平台 P0~P3 合并上线手册（2026-10-07）

> 两批攒成**一次构建**上线（交接文档：构建攒成一批发一次）。
> 代码：`feat/content-platform`（已 rebase 在 `seo/restructure` 之上，`seo/restructure` 已 rebase 在 origin/main `1f88ae5` 之上），相对 origin/main 19 个提交，快进合并。
> SEO 批 1 自身说明见 `docs/SEO-重构/批1-部署说明.md`（无 DDL）；内容平台见本目录 P0~P3 部署说明（**只加列、加表**）。

## 本地已验证（10-07 凌晨）

- `npx tsc --noEmit` 0 错误；`npm run build` 通过。
- `check-content-policy` 144/0；`check-seo-b` 进程内 52/0，`--base` 94/0（4 条告警 = 保留的成交弹窗仍带 framer-motion，预期内）。
- `check-seo-copy --base`：5 条「实体卡」违规全部来自本地演示库里的测试商品 `/products/6`（数据，不是代码）；线上商品名以线上为准。
- 本地生产包冒烟：`/`、`/learn`、`/prompts`、`/prompts/text`、`/guides`、教程详情、提示词详情、`/forum`、`/games`、`/about`、`/chongzhi/chatgpt-plus`、robots、两个 sitemap 全 200，不存在的地址 404；robots 有 `Allow: /lookup$`。
- 合并冲突只有 `header.tsx` 手机菜单一处：取 SEO 的 CSS 写法 + `isNavActive(pathname, link.href, link.also)`（P3 说明第七节的预案）。

## 上线步骤（顺序不能改）

```bash
cd /opt/beiguo/beiguo-shop && set -a && . ./.env.production && set +a

# 0) 回滚标签（build 之前打）
docker tag beiguo-shop-app:latest beiguo-shop-app:rollback-$(git rev-parse --short HEAD)

# 1) 备份 + 校验
docker compose --env-file .env.production exec -T db mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines --triggers --set-gtid-purged=OFF beiguo_shop \
  > /opt/beiguo/backups/beiguo_shop_$(date +%Y%m%d_%H%M%S).sql
tail -3 "$(ls -t /opt/beiguo/backups/beiguo_shop_*.sql | head -1)" | grep "Dump completed" || echo "备份不完整，停手"

# 2) 拉代码，确认 HEAD 是本批最后一个提交
git pull origin main && git log -1 --oneline

# 3) DDL 预览：产出字节数 > 0，逐条看，只能有 CREATE TABLE / ALTER TABLE ... ADD / CREATE INDEX，出现 DROP 就停手
#    （nohup 后台跑，结果写 /tmp/ddl.sql，再另起 exec 读）

# 4) db push（旧镜像在跑，新表新列没人读，零影响），阳性对照核实（SHOW COLUMNS FROM forum_posts LIKE 'checked_on' + SHOW TABLES LIKE 'orders'）

# 5) build-with-swap.sh（站长 10-06 已授权临时开 swap；df -h / 留 2G；free -m available < 800MB 时先停协议服务）
#    构建前后各记一次 latest 镜像 ID，两者相同 = 没构建成功

# 6) 只重启 app
docker compose --env-file .env.production up -d --no-deps app

# 7) 导入种子内容（临时容器，挂 prisma/ 与 forum_uploads 卷；作者用站长后台账号邮箱）
#    npx tsx prisma/import-seed-content.ts --author <站长邮箱> --publish --uploads-dir <forum_uploads 挂载点>
#    期望：专题介绍 22、提示词 264（有图的图像类 + 视频 + 文本直接公开）、教程 12（有 checkedOn，直接公开）

# 8) 冒烟：SEO 批 1 部署说明第六节全部 + /learn /prompts /guides 与各一条详情 200、/uploads/forum/seed*.jpg 200
#    NOTIFY_EVENTS 若设了白名单，确认含 forum.review
```

## 收录总开关

`CONTENT_INDEXING_OPEN`（`.env.production`，=1 才打开；运行时读，改完只重启 app，不用构建）。
**docker-compose.yml 的 app `environment:` 里必须列着它**（compose 只传列出的变量；10-07 上线时漏了，补上后才生效）。
**上线时不设（关）**，等站长确认后再加。关着时内容页全部 `noindex, follow`，`/sitemap-content.xml` 为空、robots 不挂它、IndexNow 不推。

## 回滚

- 镜像：`docker tag beiguo-shop-app:rollback-<旧HEAD> beiguo-shop-app:latest && docker compose --env-file .env.production up -d --no-deps app`
- 库不用回退：新增的表和列旧代码不读不写。导入的种子内容在旧版里会出现在老论坛列表里——若回滚，后台把这些帖子隐藏即可。

## 上线实录（2026-10-07 凌晨）

| 步骤 | 结果 |
|---|---|
| 代码 | 推 main：`1f88ae5..5c5602e`（SEO 批 1 + 内容平台 19 个提交），上线中又补 3 个：`d4e2367` 讨论帖整组不收录、`fedd756` Dockerfile 引擎镜像、`dd5565c` compose 传 CONTENT_INDEXING_OPEN |
| 回滚标签 | `beiguo-shop-app:rollback-7dc2448`（= 旧镜像 0ead7ccaf65c） |
| 备份 | `/opt/beiguo/backups/beiguo_shop_20261006_234341_pre-content.sql`，末尾 `Dump completed` |
| DDL | 预览 13KB、零 DROP：forum_posts / forum_comments 加列、20 张新表、5 个索引、外键；`db push` 成功，阳性对照核实 `checked_on`、`review_status`、`prompt_specs`、`content_order_attributions` 都在 |
| 构建 | 第一次 00:06 失败在 `npx prisma generate`（直连 binaries.prisma.sh 不通；schema 改了缓存失效要重下引擎）→ Dockerfile 加 `PRISMA_ENGINES_MIRROR` → 00:09–00:32 成功，约 23 分钟（next build 编译 18 分钟，内存很紧但站点全程在线），`[prerender] routes=0`，swappiness 已还原 0；新镜像 `d06eb003023e` |
| 切换 | 只重建 app，4 秒首页 200；19 个页面 200、不存在地址 404、应用日志无报错 |
| 导入 | 临时容器（挂 prisma/ 与 forum_uploads 卷，`--publish`，作者 admin@example.com「Nathaniel」）：专题介绍 22、内容 276 条（公开 268 = 提示词 256 + 教程 12；缺图提示词 8 条待审）、图片 224 张 |
| 收录 | `.env.production` 加 `CONTENT_INDEXING_OPEN=1`（备份 .env.production.bak-indexing-*）；compose 补传该变量后重建 app → robots 挂 `/sitemap-content.xml`，其中 129 个地址；教程页 `index, follow`、标题「（2026-10 更新）」；/forum 仍 noindex |
| 待站长 | Search Console / Bing 提交 `https://bigolab.com/sitemap-content.xml`；观察 4 周「已抓取 - 尚未编入索引」比例，异常就删掉那行变量、重建 app 整体撤回 |
