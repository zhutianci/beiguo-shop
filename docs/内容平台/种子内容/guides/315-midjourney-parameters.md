---
title: Midjourney 参数大全：--ar、--stylize、--chaos、--no 等常用参数怎么用
slug: midjourney-parameters
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: Midjourney 的 --ar、--s、--c、--w、--no、--seed、--sref、--iw 都是什么意思、取值范围多少、哪个版本能用？本文按官方参数表整理成速查表，附写法规则和组合示例。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio
  - https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize
  - https://docs.midjourney.com/hc/en-us/articles/32099348346765-Chaos-Variety
  - https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird
  - https://docs.midjourney.com/hc/en-us/articles/32173351982093-No
  - https://docs.midjourney.com/hc/en-us/articles/32176522101773-Quality
  - https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds
  - https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
  - https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
---

## 适用于谁

- 搜「Midjourney 参数大全」「stylize 参数」「iw 参数」，想查某个参数是什么意思、能填多少的人；
- 抄来的提示词末尾带一串 `--ar 16:9 --s 250 --v 7`，看不懂的人；
- 从 V6 / V7 升级上来，想知道哪些参数在 V8 里变了的人。

本文根据 Midjourney 官方文档的参数列表与各参数说明页整理，资料核对于 2026-10-07。当前默认版本是 **V8.2**，不同版本的取值可能不同，以官方页面为准。

## 结论先说

1. **参数永远写在提示词最后**，前面留一个空格，两个短横线连写，参数里不要加逗号句号。
2. **最常用的五个**：`--ar`（画幅）、`--s`（风格化）、`--c`（多样性）、`--no`（排除）、`--raw`（减少默认美化）。
3. **网页版很多参数有滑块**：设置面板里的 Stylization / Weirdness / Variety 就是 `--s` / `--w` / `--c`，写在提示词里的参数优先于默认设置。
4. **V8 的变化**：Omni Reference（`--oref`）、Character Reference（`--cref`）被新的 Edit 模型取代；新增 `--hd` / `--sd` 控制分辨率。

## 写法规则（官方强调的三点）

```
正确：vibrant California poppies --ar 2:3
错误：vibrant California poppies--ar 2:3      （短横线前没空格）
错误：vibrant California poppies - - ar 2:3   （两个短横线中间有空格）
错误：vibrant California poppies --ar 2:3,    （参数后面加了标点）
错误：vibrant California --ar 2:3 poppies     （参数后面又写了描述）
```

## 参数速查表

### 画面控制

| 参数 | 作用 | 取值 / 默认 | 说明 |
| --- | --- | --- | --- |
| `--ar` / `--aspect` | 宽高比 | 默认 1:1 | 不能写小数（1.39:1 要写成 139:100）；V8 最大 14:1，HD 图最大 4:1 |
| `--s` / `--stylize` | 艺术化程度 | 0–1000，默认 100 | 越低越贴近提示词，越高越「有味道」但可能偏离描述 |
| `--c` / `--chaos` | 4 张图之间的差异 | 0–100，默认 0 | 网页版叫 Variety；越高越不可预测 |
| `--w` / `--weird` | 怪异、实验感 | 0–3000，默认 0 | 实验功能，和 seed 不完全兼容 |
| `--no` | 排除元素 | 多个用逗号分隔 | 等于给该部分 -0.5 权重 |
| `--raw` | 减少默认美化 | 开关 | 想让文字描述更有分量时用 |
| `--tile` | 无缝平铺图案 | 开关 | 不兼容 Edit 模型 |
| `--q` / `--quality` | 首轮出图花多少 GPU 时间 | V7：1（默认）/2/4 | 只影响第一组 4 张，不影响变体和放大 |
| `--seed` | 固定初始噪声 | 0–4294967295 | V8.x 用同一 seed 结果约 99% 相同；不能用来「锁定角色」 |

![同一提示词「child's drawing of a cat」在 --s 0、100、500、1000 下的效果对比](seed:g315-stylize-compare.jpg)
*图片来源：[Midjourney 官方文档 · Stylize](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize)*

### 版本与模式

| 参数 | 作用 | 说明 |
| --- | --- | --- |
| `--v` / `--version` | 指定模型版本 | 当前默认 8.2；也可在设置面板里选默认版本 |
| `--niji` | 动漫 / 东方美学模型 | 当前为 Niji 7，写 `--niji 7`，见《Midjourney Niji 模式怎么用》 |
| `--hd` / `--sd` | 2048px 高清 / 1024px 标准 | V8.1 起支持；HD 消耗更多 GPU 时间 |
| `--draft` | 草稿模式 | 官方说明 V7 草稿约为一半 GPU 成本 |
| `--fast` / `--relax` / `--turbo` | GPU 速度 | Relax 需 Standard 及以上套餐；V8.1 暂不支持 Turbo |
| `--stealth` / `--public` | 隐身 / 公开 | 隐身需 Pro 或 Mega 套餐 |
| `--r` / `--repeat` | 一次提交多组 | 各套餐上限不同 |
| `--p` / `--profile` | 使用个性化档案或情绪板 | 需要先在网页版建立 Personalization |

### 图片参考

| 参数 | 作用 | 取值 / 默认 |
| --- | --- | --- |
| `--iw` | 图片提示（Image Prompt）的权重 | V8.1 和 V7：0–3，默认 1；Niji 7：0–2，默认 1 |
| `--sref` | 风格参考（图片地址或风格代码） | 可写 `--sref random` 随机取一个风格代码 |
| `--sw` | 风格参考强度 | 0–1000，默认 100 |
| `--sv` | 风格参考算法版本 | V7 默认 `--sv 6`，旧代码可加 `--sv 4` |
| `--edit` | 在 Discord 里调用 Edit 模型（后接图片地址） | V8.1 / V8.2，最多 4 张参考图 |
| `--oref` / `--ow` | Omni Reference 及其权重 | 仅 V7；`--ow` 1–1000，默认 100 |

### 视频专用

| 参数 | 作用 |
| --- | --- |
| `--motion low` / `--motion high` | 低动态（默认）/ 高动态 |
| `--loop` | 首尾帧相同，生成循环视频 |
| `--end` | 指定结束帧图片 |
| `--bs` | 每次生成几条：1、2 或 4 |
| `--video` | Discord 里把图片地址转视频 |

视频只兼容上面这些参数和 `--raw`，详见《Midjourney 视频怎么生成》。

![同一提示词「illustration of a puffin」在 --c 0 与 --c 50 下的 4 张图：数值越高，构图和风格差异越大](seed:g315-chaos-compare.jpg)
*图片来源：[Midjourney 官方文档 · Chaos / Variety](https://docs.midjourney.com/hc/en-us/articles/32099348346765-Chaos-Variety)*

## 常用组合示例

```
手机壁纸：misty mountain lake at dawn, soft pastel light --ar 9:16 --s 250
电商主图（更听话）：minimal product shot of a ceramic mug on linen, studio lighting --ar 1:1 --raw --s 50
找灵感（多样性高）：poster concept for a jazz festival --c 40 --ar 2:3
排除元素：still life gouache painting --no fruit, apple, pear
高清直出：aerial view of rice terraces in morning fog --ar 16:9 --hd
```

## 常见问题

**Q：为什么写了 `--no modern clothing` 却被审核拦了？**
官方解释：`--no` 后面的每个词会被单独理解，「no modern clothing」会被读成「no modern」和「no clothing」，可能触发误判。这种情况直接在正文里写你想要的服装类型，别用 `--no`。

**Q：`--seed` 能保持角色一致吗？**
不能。官方明确说 seed 只影响初始噪声，不能保存风格或角色；要保持一致请用 Edit 模型参考图、风格参考或个性化。见《Midjourney 角色一致性》。

**Q：参数和设置面板冲突时听谁的？**
提示词里写的参数优先；没写的才用设置面板的默认值。

**Q：小数画幅、超宽画幅可以吗？**
`--ar` 不接受小数，换成整数比即可。极宽或极高的画幅官方标注为实验性，结果可能不稳定。

**Q：`--cref` 还能用吗？**
官方说明 V8.x 中 Character Reference 和 Omni Reference 已被 Edit 模型取代；如需旧功能可切回旧版本，具体以官方「Legacy Features」页为准。

## 参考资料

- Midjourney 官方文档：Parameter List — https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
- Midjourney 官方文档：Version — https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- Midjourney 官方文档：Aspect Ratio / Stylize / Chaos / Weird / No / Quality / Seeds（链接见文首 sources）
- Midjourney 官方文档：Image Prompts — https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
- Midjourney 官方文档：Style Reference — https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
