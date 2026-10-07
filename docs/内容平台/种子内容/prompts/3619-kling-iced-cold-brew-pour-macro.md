---
title: 可灵提示词：冰咖啡广告视频（冰块慢动作 + 冷萃像墨汁一样晕开 · 竖屏 6 秒）
slug: kling-iced-cold-brew-pour-macro
model: kling
topics: [product-video, food]
aspectRatio: "9:16"
needsRefImage: true
useCase: 冷萃、冰美式、气泡饮、果茶的夏日饮品广告：冰块慢动作落下溅起水珠、液体倒入后像墨汁一样在水里晕开、后拉露出完整杯型，适合饮品店菜单屏、外卖主图视频和新品海报动态版。
prompt: |
  以我上传的饮品图为准，生成一条约 6 秒的竖屏 9:16 冰咖啡微距广告。
  场景：一只高高的多棱面玻璃杯，装着冰咖啡，放在深色板岩台面上。
  0–2 秒：一块冰块在慢动作中翻落，水珠悬停在半空，新鲜的凝结水珠沿着杯壁爬下。
  2–4 秒：一道细细的[琥珀色]冷萃从[铜质分享壶]里倒下，缠进清水里，烟雾般的咖啡丝像墨汁一样向下晕开。
  4–6 秒：镜头缓缓后拉，露出整杯饮品，顶部一层浅色泡沫、一枝薄荷，杯下是一枚压印着[品牌]的杯垫。
  镜头：100mm 微距，电动滑轨缓慢推进，最后柔和地停住。
  光线：一盏低角度的侧窗主光，暖色轮廓光掠过杯沿，阴影深沉。
  玻璃棱面和冰块形状保持不变，液体始终是一股连续的水流：不变形、不漂移、不突然跳出物体。
  声音：冰块碰撞声，轻微的气泡声，倒液体时的沙沙声。
negativePrompt: 杯子变形，冰块凭空出现，液体断流，杯垫文字乱码，过曝，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#cold-brew-pour-cascade
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的饮品图为准\"和负面提示词；液体颜色、器具、品牌改为变量"
images:
  - 3619-kling-iced-cold-brew-pour-macro-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/cold-brew-pour-cascade.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：冷萃在水中晕开的流体效果是否自然
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒三段：冰块慢动作 → 倒入晕开 → 后拉全貌。饮品广告最出效果的是"流体"——液体倒入、晕开、冒泡，这正是视频模型擅长的部分，所以中间那段可以多给时间。可灵 10 秒档建议把第二段拉到 5 秒，再加"气泡缓缓上升"。

**怎么填变量**：[琥珀色] 冷萃换成"粉色莓果茶""翠绿抹茶"，晕开效果同样好看；[铜质分享壶] 可以换成"玻璃量杯""易拉罐倒出"。杯垫上的 [品牌] 字样大概率会乱码，建议删掉，后期贴 logo。

**常见失败与调整**：
- 冰块越倒越多：写"杯中冰块数量保持不变，只有一块冰落下"。
- 液体倒偏洒到杯外：写"水流准确地落进杯口中央"。
- 杯壁水珠像在往上爬：写"水珠沿杯壁向下滑落"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Macro hero of an iced cold brew in a tall faceted highball on a dark slate counter. 0-2s: a single ice cube tumbles in slow motion, splash beads suspended mid-air, fresh condensation crawling down the glass; 2-4s: a thin amber ribbon of [product] cold brew pours from a copper carafe and braids into clear water, smoky coffee tendrils blooming downward like ink; 4-6s: the camera eases back to reveal the full glass capped with pale crema, a mint sprig, and a brand-debossed coaster reading [brand]. 100mm macro on a slow motorized dolly-in, settling into a gentle ease-out. Single low side-window key, warm rim light skimming the rim, deep crushed shadows. The glass facets and ice hold exact shape, the liquid stream stays one continuous body with no deformation, drift, popping, or rendering artifacts. Implied sound: ice clink, soft fizz, the hush of the pour.
```
