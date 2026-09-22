# 商品卡片图（原始件）

老板 2026-09-22 用 ChatGPT 生成的一张 1254×1254 拼图（17 张卡片），
由 `System.Drawing` 按空白缝隙自动切分、补成正方形、缩到 512×512 JPEG(q88)。

- 文件名就是商品 id：`product-<id>.jpg`，对照关系见下表
- 运行时真正被读取的是 **Docker 卷 `forum_uploads`** 里的
  `/app/public/uploads/products/`，不是这个目录。这里只是**原始件存档**，
  方便以后换机器、卷丢了、或者要重新裁切时不用再问老板要图。
- 想重新灌一遍：`docker cp` 到 app 容器的 `/app/public/uploads/products/`，
  再把 `products.image` 指到 `/uploads/products/product-<id>.jpg`。

| 商品 id | 卡片内容 |
|---|---|
| 2  | Claude Max 5x · iOS订阅充值 |
| 3  | Claude Max 20x · iOS订阅充值 |
| 4  | ChatGPT Plus · 信用卡冲 |
| 5  | ChatGPT Pro 20x · iOS订阅充值（可覆盖 Plus 和 5x） |
| 7  | ChatGPT Pro 5x · iOS订阅充值（可覆盖 Plus） |
| 8  | Claude KYC 活人认证 |
| 10 | Codex 验证码 · 美区实体手机卡 · 单次接码 |
| 14 | Claude 注册验证码 · 美区实体卡 · 单次接码 |
| 16 | Claude Pro · iOS订阅充值 |
| 21 | ChatGPT Plus · iOS订阅充值 |
| 23 | Grok Super · iOS充值 · $30/月 |
| 24 | 谷歌邮箱成品号 · 2020-2025 年注册 · 2FA |
| 26 | ChatGPT Pro 20x · 信用卡充值（无法覆盖 Plus 和 5x） |
| 27 | ChatGPT Plus【年费】 |
| 29 | ChatGPT Pro 5x · 信用卡充值（不可覆盖 Plus） |
| 30 | Grok Super Heavy · iOS充值 · $300/月 |
| 31 | Grok Super 三个月 · iOS充值 · $90/3月 |

**还没有卡片的在售商品**：15（Claude 注册验证码-荷兰）、28（Codex 短信接码-随机地区）。

**已知瑕疵**：24 号那张卡片左上角写的是「Codex」配 Gmail 图标，
应该是生成时串了词（内容文字「谷歌邮箱成品号」是对的）。要换图的话重生成这一张即可。
