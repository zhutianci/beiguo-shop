# 阿里云部署指南

## 一、本地准备：推送到 GitHub

### 1. 在 GitHub 创建仓库

打开 https://github.com/new ，创建一个新仓库：

- 仓库名：`beiguo-shop`（任意名称）
- 选择 **Private**（私有，保护代码安全）
- 不要勾选 README、.gitignore（本地已有）

创建后会显示仓库地址，格式如：`https://github.com/你的用户名/beiguo-shop.git`

### 2. 推送代码到 GitHub

在本地项目目录执行：

```bash
git remote add origin https://github.com/你的用户名/beiguo-shop.git
git push -u origin main
```

如果首次使用 GitHub，会要求登录。推荐使用 [Personal Access Token](https://github.com/settings/tokens) 而不是密码。

---

## 二、阿里云配置

### 1. 开放端口（安全组）

登录阿里云控制台：
1. 进入 **ECS 实例** → 找到你的服务器 → **安全组**
2. **入方向** 添加规则：
   - 端口：`80/80`（HTTP）
   - 端口：`443/443`（HTTPS，备用）
   - 端口：`22/22`（SSH，应已开放）

### 2. SSH 连接服务器

```bash
# 在本地终端执行（替换为你的服务器 IP）
ssh root@你的服务器IP
```

如果首次连接，输入 `yes` 信任服务器。

---

## 三、服务器初始化

### 1. 上传初始化脚本（在服务器上执行）

```bash
# 创建项目目录
mkdir -p /opt/beiguo && cd /opt/beiguo

# 克隆代码（替换为你的仓库地址）
git clone https://github.com/你的用户名/beiguo-shop.git .
```

如果是私有仓库，需要先配置 SSH 密钥或使用 token 方式：

```bash
# 用 HTTPS + Token 方式
git clone https://你的用户名:你的Token@github.com/你的用户名/beiguo-shop.git .
```

### 2. 安装 Docker 等环境

```bash
bash scripts/setup-server.sh
```

安装完成后**退出并重新登录**（让 docker 用户组生效）：

```bash
exit
ssh root@你的服务器IP
cd /opt/beiguo
```

---

## 四、配置环境变量

```bash
# 复制模板
cp .env.production.example .env.production

# 编辑配置
vim .env.production
```

修改为以下内容（按 `i` 进入编辑模式，改完按 `Esc` 然后 `:wq` 保存退出）：

```env
# 强密码，至少 16 位
MYSQL_ROOT_PASSWORD=MyStr0ngP@ssw0rd_2026!

# 强密钥，至少 32 位（建议运行 openssl rand -base64 64 生成）
JWT_SECRET=your_64_char_random_secret_here

# 替换为你的服务器 IP
APP_URL=http://你的服务器公网IP
```

**生成强密钥的命令**：

```bash
# 生成 JWT 密钥
openssl rand -base64 64

# 生成 MySQL 密码
openssl rand -base64 24
```

---

## 五、一键部署

```bash
chmod +x scripts/deploy.sh
bash scripts/deploy.sh
```

部署过程：
1. 构建 Docker 镜像（首次需要 3-10 分钟）
2. 启动 MySQL + 应用 + Nginx
3. 初始化数据库
4. 询问是否初始化种子数据 → **首次部署输入 `y`**

部署完成后访问：

- 网站：`http://你的服务器IP`
- 后台：`http://你的服务器IP/admin`
- 默认管理员：`admin@example.com` / `admin123`

**⚠️ 重要：首次登录后立即修改密码！**

---

## 六、日常运维

### 查看日志

```bash
cd /opt/beiguo

# 所有服务日志
docker compose logs -f

# 仅查看应用日志
docker compose logs -f app

# 查看最近 100 行
docker compose logs --tail 100 app
```

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 仅重启应用
docker compose restart app
```

### 停止/启动

```bash
# 停止
docker compose down

# 启动
docker compose --env-file .env.production up -d
```

### 更新代码

```bash
cd /opt/beiguo
git pull
docker compose --env-file .env.production build app
docker compose --env-file .env.production up -d
```

或直接运行部署脚本：

```bash
bash scripts/deploy.sh
```

### 数据库备份

```bash
# 备份
docker compose exec db mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} beiguo_shop > backup_$(date +%Y%m%d).sql

# 恢复
docker compose exec -T db mysql -uroot -p${MYSQL_ROOT_PASSWORD} beiguo_shop < backup_20260521.sql
```

---

## 七、常见问题

### 1. 访问不了网站？

- 检查阿里云安全组是否开放 80 端口
- 检查防火墙：`sudo systemctl status firewalld`，必要时关闭：`sudo systemctl stop firewalld`
- 检查容器状态：`docker compose ps`，确保所有服务都是 `Up`
- 查看 nginx 日志：`docker compose logs nginx`

### 2. 数据库连不上？

```bash
# 进入数据库容器调试
docker compose exec db mysql -uroot -p${MYSQL_ROOT_PASSWORD}
```

### 3. 镜像构建慢？

国内访问 Docker Hub 慢，已在 setup-server.sh 中配置了阿里云镜像。
如还有问题，可以拉取 Node.js 镜像时使用国内源。

### 4. 内存不足？

建议服务器至少 **2核4G**，1G 内存可能不够。
可以创建 swap：

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 八、后续：配置 HTTPS（有域名后）

域名备案完成后：

1. DNS 解析：把域名 A 记录指向服务器 IP
2. 申请 SSL 证书：阿里云控制台 → SSL 证书 → 免费证书
3. 下载 Nginx 格式证书，上传到 `/opt/beiguo/nginx/ssl/`
4. 修改 `nginx/nginx.conf` 启用 HTTPS 部分
5. 重启 nginx：`docker compose restart nginx`
