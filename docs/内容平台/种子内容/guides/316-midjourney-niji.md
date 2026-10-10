---
title: Midjourney Niji 模式怎么用：Niji 7 动漫风格出图教程
slug: midjourney-niji
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: Midjourney 的 Niji 是专门画动漫和东方美学风格的模型。本文按官方资料讲清 Niji 7 有什么变化、在网页版和 Discord 里怎么切换、提示词怎么写更稳，以及哪些功能和 V8 不通用。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://updates.midjourney.com/niji-v7/
  - https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
  - https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
  - https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
  - https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials
  - https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service
---

## 适用于谁

- 搜「Midjourney niji」「niji 7」，想用 Midjourney 画二次元插画、头像、立绘的人；
- 用默认 V8 画动漫总觉得「太写实」「不够二次元」的人；
- 从 Niji 6 升级到 Niji 7，发现以前的提示词效果变了的人。

本文根据 Midjourney 官方文档与官方更新公告整理，资料核对于 2026-10-07；界面以你实际看到的为准。

## 结论先说

1. **Niji 是 Midjourney 的一个独立模型系列**，由 Midjourney 与 Spellbrush 合作开发，专攻动漫、东方美学和插画风格。当前最新是 **Niji 7**（2026 年 1 月 9 日上线）。
2. **用法很简单**：提示词末尾加 `--niji 7`，或者在网页版设置面板里把默认版本切到 Niji 7。
3. **Niji 7 更「听话」也更「字面」**：细节（眼睛、反光、小背景元素）更清楚，画面更干净扁平、线条更突出；但以前那种只写几个氛围词的「玄学」提示词，效果可能和 Niji 6 不一样。
4. **它不是 V8**：V8.1 / V8.2 的 Edit 模型等新功能按官方说明只适用于 V8.x，用 Niji 时不要指望这些功能可用。

## Niji 7 改进了什么

综合官方版本说明和更新公告，Niji 7 相比上一代主要有：

- **连贯性大幅提升**：眼睛、反光、背景里的小物件等细节更清晰；
- **更贴近提示词**：适合需要具体设计、要反复画同一角色的场景；
- **更「字面」**：宽泛、只讲感觉的提示词可能不再像以前那样自动补出漂亮画面；
- **更干净、更扁平的画风**：官方称是为了突出改进后的线稿；
- 公告还提到文字渲染和风格参考（sref）的表现有改进。

## 步骤

### 1. 切换到 Niji 7

**网页版**：点 Imagine 栏右侧的设置图标，在 Model（版本）下拉菜单里选择 Niji 7（菜单名称以实际界面为准）。设置后对之后所有提示词生效。

**写参数**：在提示词末尾加：

```
--niji 7
```

参数优先于默认设置，所以平时用 V8、偶尔画动漫时，直接加参数最方便。Discord 里同样是在 `/imagine` 的提示词末尾加 `--niji 7`。

另外，官方说明 Niji 有自己的网站和 Discord 服务器；手机端的 niji·journey App（iOS / Android）是官方目前唯一提供有限免费试用的入口。

### 2. 按 Niji 7 的特点写提示词

因为 Niji 7 更字面，**把你要的东西写具体**比堆形容词更有效。一个好用的结构：

> 画风 / 媒介 + 角色（外貌、服装、表情、动作）+ 场景 + 光线与色调 + 构图

示例（原创角色）：

```
anime illustration, a girl with short silver hair and a yellow raincoat,
holding a paper umbrella, standing at a rainy bus stop at night,
neon reflections on wet asphalt, cool blue and warm orange palette,
medium shot, clean line art --niji 7 --ar 2:3
```

几点建议：

- **画风要写出来**：如 anime illustration、cel shading、watercolor anime background、chibi 等；Niji 7 不会再替你「脑补」太多。
- **角色特征写全**：发色、发型、瞳色、服装颜色和款式，后续想保持一致时这段描述可以原样复用。
- **数量写清楚**：用 two girls 而不是 girls。
- **画面里要出现文字**：放进英文双引号，短词更稳。
- **不要写知名作品或角色名**：Midjourney 服务条款禁止利用服务侵犯他人版权和商标，商用风险也很大；用自己描述的原创设定更安全。

### 3. 调节风格：stylize、sref 与图片权重

- `--s`（风格化）：想更贴提示词就调低，想更有画面感就调高，范围 0–1000，默认 100。
- `--sref`：用一张你有权使用的图或一个风格代码统一画风，`--sw` 控制强度（0–1000，默认 100）。官方公告称 Niji 7 的 sref 表现有改进。
- `--iw`：用图片提示时，Niji 7 的图片权重范围是 0–2（默认 1），比 V8.1 的 0–3 窄。

```
cozy cafe interior, anime background art, afternoon sunlight --niji 7 --sref random --s 200
```

### 4. 画同一个角色的多张图

Niji 7 更好地遵循提示词，官方也提到这对「可重复的角色」有帮助。实际做法：

1. 先用一段固定的角色描述出一张满意的「定妆图」；
2. 之后每次复用同一段描述，只改动作和场景；
3. 用 `--sref` 固定画风；
4. 需要更强的一致性时，可以考虑切回 V8.2，用 Edit 模型的参考图功能（见《Midjourney 角色一致性》）。

## 常见问题

**Q：Niji 7 和 V8.2 该选哪个？**
画二次元插画、线稿感强的作品选 Niji 7；写实摄影、产品图、需要 Edit 模型改图选 V8.2。两者可以混用：同一个项目里用参数分别指定。

**Q：为什么我以前的 Niji 6 提示词在 Niji 7 里效果变差了？**
官方说明 Niji 7 更字面，宽泛、偏氛围的提示词可能表现不同。把画风、角色细节、光线写具体再试；或者在提示词里写 `--niji 6` 继续用旧版本（旧版本可用情况以官方说明为准）。

**Q：Niji 能免费用吗？**
网页版和 Discord 都需要订阅 Midjourney 才能用；官方只在 niji·journey 手机 App 上提供有限试用。详见《Midjourney 免费吗》。

**Q：Niji 画的图能商用吗？**
和其他 Midjourney 作品一样适用服务条款：一般订阅用户拥有自己生成的作品，年收入超过 100 万美元的公司需要 Pro 或 Mega 套餐。但如果画面模仿了知名角色，仍可能侵犯第三方权利。详见《Midjourney 可以商用吗》。

## 参考资料

- Midjourney 官方文档：Version（含 Niji 7 说明）— https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- Midjourney 官方更新：Niji V7! — https://updates.midjourney.com/niji-v7/
- Midjourney 官方文档：Parameter List — https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
- Midjourney 官方文档：Image Prompts — https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
- Midjourney 官方文档：Style Reference — https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
- Midjourney 官方文档：Free Trials — https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials
- Midjourney 服务条款 — https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service
