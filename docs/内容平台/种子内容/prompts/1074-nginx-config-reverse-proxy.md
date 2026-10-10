---
title: Nginx 配置怎么写提示词（反向代理、HTTPS 证书、WebSocket、上传文件大小、gzip、前端单页应用路由）
slug: nginx-config-reverse-proxy
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 要用 Nginx 部署网站、做反向代理，或者遇到 413 上传太大、502 网关错误、WebSocket 连不上、刷新页面 404 这类问题时用：描述部署结构，得到带注释的配置，每个指令说明作用，并给出检查配置和平滑重载的命令。
prompt: |
  你是一名运维工程师，熟悉 Nginx 的配置和排错。请帮我编写或修改 Nginx 配置。

  - 部署结构：[部署结构]（例：前端静态文件 + 后端 Node 服务在 3000 端口）
  - 域名与 HTTPS：[域名与证书]（例：已有证书文件，需要 HTTP 跳转 HTTPS）
  - 需要支持的功能：[功能]（例：WebSocket、上传 50MB 文件、单页应用路由）
  - Nginx 运行方式：[运行方式]（例：宿主机安装、Docker 容器）
  - 现有配置或报错信息（排错时填写）：
    [粘贴配置或报错]

  要求：
  1. 结构：按站点拆分配置文件；说明配置文件放在哪里、主配置如何引入。
  2. HTTPS：证书路径、只启用安全的协议版本、HTTP 自动跳转 HTTPS；需要时开启 HSTS，并提醒开启后难以回退。
  3. 反向代理：正确传递真实客户端 IP、协议和主机名；超时设置；后端多实例时的负载均衡写法。
  4. WebSocket：升级请求所需的请求头，以及长连接的读取超时。
  5. 上传：请求体大小限制与对应的超时。
  6. 静态资源：前端单页应用刷新时回退到入口文件；带哈希的静态资源长期缓存，入口 HTML 不缓存；gzip 或更好的压缩方式。
  7. 安全：隐藏版本号；禁止访问隐藏文件和备份文件；常见安全响应头。
  8. 排错：根据报错（如 413、502、504、重定向循环、跨域错误）说明可能原因与排查步骤，包括查看错误日志的位置。

  输出：完整配置（每段带中文注释），以及检查配置语法、平滑重载的命令。Docker 运行时说明容器内访问后端时不能用 localhost 的问题。
negativePrompt: null
source: null
verify:
  - 将生成的配置用 nginx -t 检查语法，再测试 WebSocket 连接与 50MB 上传
---
**怎么填变量**：[部署结构] 写清楚前后端分别在哪里、端口多少、是否在同一台机器或同一个容器网络中。[现有配置或报错信息] 排错时贴上完整的 server 块和错误日志中的对应行，比只描述现象有效得多。

**常见坑**：
- Nginx 在 Docker 容器中运行时，配置里写 `localhost:3000` 指向的是容器自己，而不是宿主机上的后端服务，结果就是 502。
- 修改了上传大小限制，但后端框架自己也有大小限制，或者前面还有一层负载均衡、CDN 的限制，只改 Nginx 不够。
- 修改配置后直接重启，配置有错时服务就起不来。先检查语法再平滑重载。

**追问技巧**：追问「给这个站点加上按 IP 限流，防止接口被刷」，或「把证书改为自动续期，并说明续期后如何让 Nginx 自动加载新证书」。

### 示例输出

> 示例，仅供参考（节选）

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/nginx/certs/example.com.pem;
    ssl_certificate_key /etc/nginx/certs/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 50m;            # 上传大小上限，超出返回 413

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;   # WebSocket 升级
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;                 # 长连接不被提前断开
    }

    location / {
        root /var/www/app;
        try_files $uri $uri/ /index.html;         # 单页应用刷新不 404
    }
}
```

```bash
nginx -t && nginx -s reload
```

说明：`http2 on;` 是较新版本的写法，旧版本写在 listen 后面（`listen 443 ssl http2;`），以你的 Nginx 版本为准。
