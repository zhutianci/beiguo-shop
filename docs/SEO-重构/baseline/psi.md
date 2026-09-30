# PageSpeed Insights 基线（移动端）

- 测试时间：2026-09-30 16:11–16:22（北京时间）
- 环境：Lighthouse 13.5.0，模拟 Moto G Power，低速 4G 节流，HeadlessChromium 153
- 分类：性能 + SEO（PSI 网页版会同时给出无障碍、最佳做法和「智能体浏览」，一并记下）
- 设计依据：`docs/SEO-重构/SEO-重构设计.md` §6.6、§0.1-7（公告弹窗是 LCP 元素）

## 数据是怎么拿到的

1. **PSI API 全部失败。** 按要求调用 `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=…&strategy=mobile&category=performance&category=seo`，不带 key。4 个 URL 各试 3 次，间隔 45 秒，16:10:19–16:18:54 共 12 次，**全部返回 429**：
   - 报错：`Quota exceeded for quota metric 'Queries' and limit 'Queries per day'`
   - `quota_limit_value: "0"`：不带 key 的匿名调用，每天配额是 0。换时间重试没有用，要带 key 才能调。
2. **改用 PSI 网页版（pagespeed.web.dev）。** 它和 API 是同一个服务、同一套 Lighthouse，只是配额走网页自己的。每页跑一次，结果从渲染好的报告页读出。报告链接在下表，可以复核。
3. **INP 没有数据。** 实验室测试不测 INP；4 页的「真实用户体验」（CrUX）都显示「无任何数据」，一般是流量不够 CrUX 的收录门槛。所以下表用 TBT 代替 INP。

## 结果

| 页面 | 性能 | SEO | LCP | CLS | TBT（代 INP） | FCP | SI | 报告 |
|---|---|---|---|---|---|---|---|---|
| 首页 `/` | 89 | 100 | 3.2 秒 | 0 | 10 毫秒 | 1.0 秒 | 5.5 秒 | [qcm1lrdazi](https://pagespeed.web.dev/analysis/https-bigolab-com/qcm1lrdazi?form_factor=mobile) |
| `/chongzhi/chatgpt-plus` | 90 | 100 | 3.3 秒 | 0 | 20 毫秒 | 1.1 秒 | 4.3 秒 | [bde63uweam](https://pagespeed.web.dev/analysis/https-bigolab-com-chongzhi-chatgpt-plus/bde63uweam?form_factor=mobile) |
| 大事记详情 `/news/2026-09-30-cc16266328` | 90 | 100 | 3.5 秒 | 0 | 0 毫秒 | 0.9 秒 | 3.0 秒 | [gjv61o79eq](https://pagespeed.web.dev/analysis/https-bigolab-com-news-2026-09-30-cc16266328/gjv61o79eq?form_factor=mobile) |
| `/jiema` | 90 | 100 | 3.4 秒 | 0 | 0 毫秒 | 1.2 秒 | 3.9 秒 | [n10vtakwjy](https://pagespeed.web.dev/analysis/https-bigolab-com-jiema/n10vtakwjy?form_factor=mobile) |

大事记详情选的是 /news 列表里最新的一篇可索引详情。列表最前面的两篇是 noindex，见 `snapshot.md` 要点 8。

## LCP 元素

**4 页的移动端 LCP 元素都是公告弹窗的正文段落**，也就是首次访问时全屏弹出的那个公告：

```
<p class="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
1. 本店所有商品均可自助下单、充值、开具发票和收据。付款后点击【发货详情】即可完成自助充值。 2. 【iOS订阅】和【信用卡充值】均为充值方式，其使用无任…
```

LCP 细分（PSI「LCP 细分」洞察）：

| 页面 | 第一字节时间（TTFB） | 元素渲染延迟 |
|---|---|---|
| 首页 | 20 毫秒 | 3,660 毫秒 |
| chatgpt-plus | 30 毫秒 | 2,510 毫秒 |
| 大事记详情 | 20 毫秒 | 1,710 毫秒 |
| /jiema | 20 毫秒 | 2,730 毫秒 |

- LCP 几乎全部耗在「元素渲染延迟」上：弹窗组件 `src/components/announcement-modal.tsx` 挂载后才在 `useEffect` 里请求 `/api/announcement`，拿到内容才渲染这段正文。
- 细分数据来自实际加载轨迹，上表的 LCP 值是模拟节流后的估算，两者不能直接相加。
- 和设计 §0.1-7 引用的调研结论一致（R2 §3：4 个代表页 LCP 3.2–3.5 秒，LCP 元素就是公告弹窗）。B 包把弹窗改成底部提示条以后，拿这张表对比。

## 其他记录（首页报告里的性能洞察）

- 渲染阻塞请求：预计缩短 400 毫秒
- 缓存生命周期：预计节省 184 KiB
- 图片传送：预计节省 262 KiB
- 旧版 JavaScript：预计节省 11 KiB
- 未使用的 CSS：预计节省 19 KiB
- 长时间运行的主线程任务：2 个

另外两类分数：
- 「智能体浏览」4 页都是 1/2，没通过的一项是「无障碍功能树格式不正确」。首页的具体问题：顶栏移动端菜单按钮 `button.md:hidden` 没有可读名称，Logo 链接也没有可读名称。
- 无障碍分：首页 82、chatgpt-plus 81、大事记详情 87、/jiema 79。

PSI 网页版同时也跑了桌面端，顺手记下，只作参考：

| 页面 | LCP | 桌面端 LCP 元素 |
|---|---|---|
| 首页 | 0.7 秒 | H1「ChatGPT、Claude 充值与代充」 |
| chatgpt-plus | 0.6 秒 | 公告弹窗正文 |
| 大事记详情 | 0.5 秒 | 正文段落 |
| /jiema | 0.7 秒 | 公告弹窗正文 |

## 复测

- 改后复测用同样 4 个 URL，还是移动端。
- 要用 API 批量跑，得先在 Google Cloud 给 PageSpeed Insights API 建一个 key，URL 加上 `&key=…`（key 不要提交进仓库）。不带 key 的配额是 0。
- 不想建 key，就在 pagespeed.web.dev 手动跑。
