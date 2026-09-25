#!/bin/bash
# 【已停用 2026-09-26】原脚本的顺序是 build → up → db push --accept-data-loss，四个问题都出过或差点出事：
#   1) 新镜像先于新列上线：查询新列的页面整页 500（交接文档第十一节记录过 /news/[slug] 500）；
#   2) 用容器内（可能是回滚 checkout 的旧）schema 带 --accept-data-loss 执行 db push，会静默 DROP 新表新列；
#   3) 在 1.8G 生产机前台全量构建会 OOM，连带杀掉站点容器，并且整栈 up 会顺带重启 nginx/cloudflared；
#   4) 会跑 prisma/seed.ts：建出公开默认密码的管理员、覆盖真实分类、插入上架的演示商品。
# 部署一律按 docs/交接-进度与待办.md 第十一节 / 第十四节「正确的部署顺序」手工执行：
#   备份并校验 → 临时容器 migrate diff 预览（零 DROP）→ 不带 --accept-data-loss 执行 db push
#   → 后台 build app → up -d app → 冒烟。
# 旧内容在 git 历史里，不要为了「方便」把它恢复出来。
echo "scripts/deploy.sh 已停用：请按 docs/交接-进度与待办.md 的部署清单执行（见脚本内注释）。" >&2
exit 1
