#!/bin/bash
# 阿里云服务器初始化脚本（Alibaba Cloud Linux / CentOS / RHEL）
# 一键安装 Docker、Docker Compose、Git

set -e

echo "=========================================="
echo "  服务器环境初始化"
echo "=========================================="

# 1. 更新系统包
echo "[1/4] 更新系统包..."
sudo yum update -y

# 2. 安装必要工具
echo "[2/4] 安装基础工具..."
sudo yum install -y git curl wget vim

# 3. 安装 Docker
if ! command -v docker &> /dev/null; then
    echo "[3/4] 安装 Docker..."
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker

    # 添加当前用户到 docker 组（可不用 sudo 运行 docker）
    sudo usermod -aG docker $USER

    # 配置 Docker 镜像加速（阿里云镜像）
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF
    sudo systemctl daemon-reload
    sudo systemctl restart docker

    echo "Docker 安装完成"
else
    echo "[3/4] Docker 已安装，跳过"
fi

# 4. 验证安装
echo "[4/4] 验证安装..."
docker --version
docker compose version
git --version

echo ""
echo "=========================================="
echo "  初始化完成！"
echo "  请重新登录服务器（或运行 newgrp docker）"
echo "  以使 docker 用户组生效"
echo "=========================================="
