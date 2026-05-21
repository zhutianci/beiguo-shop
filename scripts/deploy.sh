#!/bin/bash

# AI服务商城部署脚本

set -e

echo "=========================================="
echo "  AI服务商城 部署脚本"
echo "=========================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env.production ]; then
    echo "错误: .env.production 文件不存在"
    echo "请复制 .env.example 并修改配置"
    exit 1
fi

# 加载环境变量
export $(cat .env.production | grep -v '^#' | xargs)

echo ""
echo "1. 拉取最新代码..."
git pull origin main

echo ""
echo "2. 构建 Docker 镜像..."
docker-compose build

echo ""
echo "3. 停止旧容器..."
docker-compose down

echo ""
echo "4. 启动新容器..."
docker-compose up -d

echo ""
echo "5. 等待数据库启动..."
sleep 10

echo ""
echo "6. 执行数据库迁移..."
docker-compose exec app npx prisma db push

echo ""
echo "7. 初始化种子数据（首次部署）..."
read -p "是否初始化种子数据？(y/n): " init_seed
if [ "$init_seed" = "y" ]; then
    docker-compose exec app npm run db:seed
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  访问地址: http://localhost"
echo "  后台地址: http://localhost/admin"
echo "=========================================="

# 显示容器状态
docker-compose ps
