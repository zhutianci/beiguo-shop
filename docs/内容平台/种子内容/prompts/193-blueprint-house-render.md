---
title: nano banana 建筑效果图提示词：上半张深色蓝图 + 下半张一一对应的写实房屋
slug: blueprint-house-render
model: nano-banana
topics: [interior, illustration]
needsRefImage: false
aspectRatio: "3:4"
useCase: 建筑 / 室内设计师做方案展示、房产内容做封面、自建房业主想象成品时，生成"上方平面蓝图、下方写实外观"严格对应的对比图，专业感很强。
prompt: |
  生成一张上下分屏的建筑可视化图，画幅 3:4：上半部分是精细的深色主题平面蓝图，下半部分是与蓝图完全对应的写实房屋渲染。
  上半部分·蓝图：
  - 风格：深海军蓝 / 炭蓝背景，细的发光米金色线条，墙体有轻微的 3D 挤出效果，现代无衬线字体标注，柔和的环境光晕；
  - 房间：[3 间卧室、中央客厅、厨房餐厅一体]、[2 个卫生间、左侧车库、前廊]、[后院泳池和木平台]；
  - 细节：家具轮廓（床、沙发、餐桌）、门的开启方向、窗户位置、动线、准确的比例和间距。
  下半部分·写实渲染：
  - 必须与蓝图严格一致，不得增加、删除或挪动任何房间；
  - 建筑：[现代单层住宅]，平顶分层屋面，光滑清水混凝土墙、木饰面点缀、大面积玻璃窗；
  - 对应关系：车库位置、主入口对准客厅、后院泳池的位置和尺寸、每个房间的窗户位置都与蓝图对应；
  - 环境：[郊区社区]，绿色草坪、简洁的景观、通往车库的干净车道；
  - 光线：[黄金时刻]的柔和自然光与真实阴影；
  - 机位：略高的正面透视，35mm 建筑镜头。
  禁止：蓝图与渲染不一致、多出房间、奇幻元素、比例失真、环境杂乱。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/craftian_keskin/status/2040757362382798888
  author: "@craftian_keskin"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文为 JSON 结构，本站改写为中文分段文字（更适合在 Gemini 应用里直接粘贴）；把房间清单、建筑风格、环境、光线设为变量
images:
  - 193-blueprint-house-render-1.jpg
  - 193-blueprint-house-render-2.jpg
imageCredit:
  by: "@craftian_keskin"
  url: https://x.com/craftian_keskin/status/2040757362382798888
  license: CC BY 4.0
verify:
  - 换成"两层中式合院"实测，看上下是否仍能对应
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：按你的户型改房间清单和建筑风格，比如"2 层自建房，一楼客厅厨房，二楼 3 卧 2 卫，屋顶露台"+"新中式坡屋顶白墙灰瓦"。有现成户型图时，可以上传并把上半部分改成"根据上传的户型图重绘成深色蓝图"。示例两张都是原作者生成的结果。

**常见问题**：
- 上下对不上：这是最常见的问题。房间越少越容易对齐；单层建筑比多层稳定。可以先只生成蓝图，满意后再上传蓝图要求"生成与之严格对应的外观"。
- 蓝图文字乱码：标注改成英文，或要求"只标房间名称，不标尺寸"。
- 想看室内：接着用 159 号"户型图转 3D"出室内鸟瞰。

**注意**：这是概念效果图，不能作为施工图纸使用。

### 英文原版

原文为 JSON 格式（节选关键字段）：

```
{
  "objective": "Create a split architectural visualization where the top is a detailed dark-themed blueprint and the bottom is a photorealistic house that matches the blueprint EXACTLY",
  "aspect_ratio": "3:4",
  "top_section": {
    "type": "architectural blueprint",
    "visual_style": { "background": "deep navy / charcoal blue", "lines": "thin glowing beige/gold lines", "walls": "slightly extruded 3D effect", "labels": "clean modern sans-serif", "lighting": "soft ambient glow" },
    "content": {
      "rooms": ["3 bedrooms (left, right, bottom-right)", "central living room", "kitchen + dining (top center)", "2 bathrooms", "garage (left side connected)", "front porch", "backyard pool with deck"],
      "details": ["furniture outlines (beds, sofa, dining table)", "door swings and openings", "window placements", "circulation paths", "exact proportions and spacing"]
    }
  },
  "bottom_section": {
    "type": "photorealistic house render",
    "constraint": "MUST MATCH THE BLUEPRINT EXACTLY — no added, removed, or shifted rooms",
    "architecture": { "style": "modern single-story house", "roof": "flat layered roof", "materials": ["smooth concrete walls", "wood panel accents", "large glass windows"] },
    "environment": { "setting": "suburban neighborhood", "elements": ["green lawn", "minimal landscaping", "clean driveway leading to garage", "pool deck matching blueprint footprint"] },
    "lighting": { "time": "golden hour", "style": "soft natural light with realistic shadows" },
    "camera": { "angle": "slightly elevated front perspective", "lens": "35mm architectural view" }
  },
  "negative_constraints": ["no mismatch between blueprint and render", "no extra rooms", "no fantasy elements", "no unrealistic proportions", "no cluttered environment"]
}
```

> 改编自 [@craftian_keskin](https://x.com/craftian_keskin/status/2040757362382798888) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
