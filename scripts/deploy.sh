#!/bin/bash
# 部署脚本：构建并启动所有服务

set -e

echo "=========================================="
echo "  贝果科技 - 部署脚本"
echo "=========================================="

# 检查 .env.production
if [ ! -f .env.production ]; then
    echo "错误: .env.production 文件不存在"
    echo "请复制 .env.production.example 为 .env.production 并修改配置"
    echo "  cp .env.production.example .env.production"
    echo "  vim .env.production"
    exit 1
fi

# 加载环境变量
set -a
source .env.production
set +a

echo ""
echo "[1/5] 拉取最新代码..."
git pull origin main || echo "(本地版本，跳过拉取)"

echo ""
echo "[2/5] 构建 Docker 镜像（首次可能需要几分钟）..."
docker compose --env-file .env.production build

echo ""
echo "[3/5] 启动服务..."
docker compose --env-file .env.production up -d

echo ""
echo "[4/5] 等待数据库就绪..."
sleep 15
for i in {1..30}; do
    if docker compose exec -T db mysqladmin ping -h localhost -uroot -p${MYSQL_ROOT_PASSWORD} 2>/dev/null | grep -q "alive"; then
        echo "数据库已就绪"
        break
    fi
    echo "  等待中 ($i/30)..."
    sleep 2
done

echo ""
echo "[5/5] 初始化数据库..."
# 锁定 Prisma 5.22.0 版本（与项目依赖一致，避免 npx 拉取最新 7.x）
docker compose exec -T app npx -y prisma@5.22.0 db push --accept-data-loss --schema=./prisma/schema.prisma

echo ""
read -p "是否初始化种子数据（首次部署选 y）？(y/n): " init_seed
if [ "$init_seed" = "y" ]; then
    docker compose exec -T app npx -y tsx prisma/seed.ts
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  访问地址: ${APP_URL}"
echo "  后台地址: ${APP_URL}/admin"
echo "  管理员账号: admin@example.com / admin123"
echo "  ⚠️  首次登录后请立即修改管理员密码！"
echo "=========================================="

echo ""
echo "容器状态："
docker compose ps
