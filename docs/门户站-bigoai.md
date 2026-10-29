# 门户站 bigoai.cn（2026-10-29）

## 为什么有它

bigolab.com 挂在 Cloudflare 上、不备案。阿里云备案要求「备案期间域名不能解析」，主站停不起。
站长定的方案：另注册 **bigoai.cn** 单独备案，备案下来后用它承接支付（客户在 bigolab.com 下单 → 跳到 bigoai.cn 付款 → 回跳）。
这一期只做「备案时网站上要有的内容」：**AI学习 + AI圈大事记**，与主站同一个项目、同一份数据，内容自动同步。
收银台是二期（见文末）。

## 是什么

一种新的店面类型 `PORTAL`（`src/lib/storefront/resolve.ts`），由 Host 决定：

| | 主站 PLATFORM | 渠道 CHANNEL | 门户 PORTAL |
|---|---|---|---|
| 判定 | PLATFORM_HOSTS | tenant_domains 查库 | **PORTAL_HOSTS（不查库、不受 CHANNELS_ENABLED 影响，最先判）** |
| 卖货 / 登录 / 营销 | 有 | 有（渠道价） | **一律没有** |
| AI学习 / 大事记 | 有 | 超管授权才有 | **有，只读** |
| 收录 | index | noindex | noindex（canonical 指回主站同一页） |

**为什么新开一种类型而不是建一个渠道**：全仓写成 `kind === 'PLATFORM'` 的主站专属功能（充值入口、商品、营销、后台）与写成 `kind === 'CHANNEL'` 的渠道专属逻辑（进货价、渠道后台）对 PORTAL **两头都不开**，默认就是关着的；渠道还要 tenants 行、会把订单记到渠道。
少数把「非渠道」当成主站的地方已改成按 `!== 'PLATFORM'` 判（vip-server、auth 同源校验、分享链接、分享海报），新代码也照这个口径：**判主站用 `=== 'PLATFORM'`，别用 `!== 'CHANNEL'`。**

## 放行名单（三道）

1. **nginx**（`nginx/nginx.conf` 的 `$site_known` 与 `$deny_path` portal 段）：`bigoai.cn`、`www.bigoai.cn` → `portal`；名单外 404；响应头 `X-Robots-Tag: noindex`。
2. **middleware**（`storefront/hosts.ts` 的 `portalAllows`，与 nginx 同一份）：名单外 404；**接口只放行 GET**。
3. **页面**：`(shop)/layout` 换成门户自己的页头页脚（`components/portal/`），没有客服浮窗、成交弹窗、公告、埋点、推广码；
   内容页隐藏点赞 / 收藏 / 关注 / 评论 / 做同款 / 投稿 / 赞助位 / 讨论区入口。

放行的页面：`/`、`/about`、`/privacy`、`/learn`（`/learn/me` 除外）、`/prompts`、`/guides`、`/apps`、`/skills`、`/collections`、`/u`、`/news`。
放行的接口（仅 GET）：`/api/news/hot`、`/api/news/list`、`/api/content/tags`、`/api/forum/categories`。
首页、关于、隐私政策是门户专用的正文（`components/portal/portal-home.tsx`、`portal-pages.tsx`），不出现充值、付款、发票字样。

**加页面要两处一起改**：nginx 的 portal 段 + `hosts.ts` 的 `PORTAL_PAGE_*`。

## 环境变量（都在 docker-compose.yml 的 environment 里列了）

| 变量 | 说明 |
|---|---|
| `PORTAL_HOSTS` | `bigoai.cn,www.bigoai.cn`；第一个是主域名。不设 = 没有门户站 |
| `PORTAL_SITE_NAME` | **必须与 ICP 备案的「网站名称」一字不差**；不设 = 贝果科技 |
| `PORTAL_ICP_NO` | 备案号，如 `湘ICP备2026xxxxxx号-1`；页脚显示并链接 beian.miit.gov.cn |
| `PORTAL_PSB_NO` | 公安联网备案号（ICP 下来后 30 天内办） |
| `PORTAL_EMAIL` | 页脚与关于页的联系邮箱 |

改这些只需重启 app，不用构建。

## 上线步骤（备案通过之后）

> 备案期间 bigoai.cn **不能解析**，所以代码可以先随下一次构建上线（`PORTAL_HOSTS` 不设 = 完全休眠），备案通过再开。

1. **DNS**：bigoai.cn、www 用阿里云解析，A 记录**直接指向 ECS 公网 IP**，不能走 Cloudflare。
   阿里云会抽查已备案域名是否解析到本接入商的 IP，指到别处会被判「未接入」，备案可能被注销。
2. **证书 + 端口**：现在公网只开了 8443、80 已关、主站流量都走 Cloudflare 隧道。bigoai.cn 要直连，就要：
   - 阿里云免费 DV 证书（或 acme.sh）签 bigoai.cn + www；
   - nginx 加一个只认 `server_name bigoai.cn www.bigoai.cn` 的 443 server（其余 Host 一律 444，不能让公网 443 变成主站的第二个入口），
     80 只做跳 https；
   - 安全组放开 443（80 视情况）。**这一步改公网暴露面，动手前要站长确认。**
3. `.env.production` 加 `PORTAL_HOSTS=bigoai.cn,www.bigoai.cn`、`PORTAL_SITE_NAME=<备案网站名称>`、`PORTAL_ICP_NO=<备案号>`、`PORTAL_EMAIL=…`，重启 app。
4. 验：名单内页面 200、名单外 404、写请求 404、页脚有备案号；主站 bigolab.com 冒烟照旧。

## 提交备案时的注意

- **网站名称**：不要用「贝果科技」这种像另一家公司名的名称（主体是必高科技），也别带 ChatGPT、Claude。定好后填进 `PORTAL_SITE_NAME`。
- **网站内容 / 服务类型**：如实写「企业网站，AI 学习资料与行业资讯」，非经营性。
- **大事记是资讯类内容**：有些管局会把「新闻资讯」当成需要前置审批的类目。被问到就说明它是附原文链接的行业动态摘要，不是新闻采编；
  如果因此卡住，可以先把 nginx portal 段和 `hosts.ts` 里的 `/news` 去掉，只留 AI学习 过审，过了再加回来。
- 门户站没有注册、登录、评论、发帖（互动功能是另一类审查点），这一点可以在备案说明里写清楚。

## 二期：收银台（还没做）

bigoai.cn 备案下来 → 支付宝签约（或改签约网站）填 bigoai.cn → 客户在 bigolab.com 下单后跳 `https://bigoai.cn/pay/<短期签名令牌>`，
notify_url / return_url 都走 bigoai.cn，付款完成页确认到账后回跳 bigolab.com。届时要在门户放行名单里加收银台的页面与接口
（目前门户站任何写请求都是 404）。订单标题要与 bigoai.cn 备案和签约的经营内容一致。
