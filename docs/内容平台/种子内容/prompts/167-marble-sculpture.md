---
title: nano banana 大理石雕像提示词：把照片里的人或宠物变成博物馆大理石半身像
slug: marble-sculpture
model: nano-banana
topics: [figurine, portrait]
needsRefImage: true
useCase: 想把自己、家人或宠物做成一尊"古典大理石雕像"当头像、礼物图或海报时，上传照片即可生成带展台和博物馆灯光的雕塑照片。
prompt: |
  把照片中的[人物]做成一尊超精细的[白色大理石]半身雕像，并拍成一张写实照片。
  雕像表面光滑、带有大理石的天然纹理和柔和光泽，五官、发型、眼镜等特征与照片一致，体现精湛的雕刻工艺。
  雕像放在[黑色展台]上，背景是深色的博物馆展厅，顶部聚光灯打在雕像上，突出轮廓与质感，画面高级、安静、有仪式感。
  画幅 [4:5]。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/umesh_ai/status/1960370946562564353
  author: "@umesh_ai"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并精简重复描述；新增主体、材质、展台、画幅变量；补充博物馆展厅背景和聚光灯布光
images:
  - 167-marble-sculpture-1.jpg
imageCredit:
  by: "@umesh_ai"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case17
  license: Apache-2.0
verify:
  - 用宠物照片实测，看毛发能否表现成雕刻纹理
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张五官清晰的照片，[人物] 可以换成"我家的猫""这只柯基"。[白色大理石] 可以换成"青铜""黑曜石""汉白玉""古铜锈色青铜"，效果差别很大，值得多试几种。示例为一张男性照片生成的大理石半身像。

**常见问题**：
- 不像本人：雕像会天然"理想化"，加一句"保留原照片的脸型和标志性特征（如眼镜、发型）"。
- 变成了全身像：明确写"半身像，只到胸口"。
- 想要室外场景：把背景改成"古罗马庭院，午后阳光"。

**适合**：头像、生日 / 纪念日礼物图、宠物纪念、毕业海报；不要用他人照片恶搞。

### 英文原版

```
A photorealistic image of an ultra-detailed sculpture of the subject in image made of shining marble. The sculpture should display smooth and reflective marble surface, emphasizing its luster and artistic craftsmanship. The design is elegant, highlighting the beauty and depth of marble. The lighting in the image should enhance the sculpture's contours and textures, creating a visually stunning and mesmerizing effect
```

> 改编自 [@umesh_ai](https://x.com/umesh_ai/status/1960370946562564353) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。
