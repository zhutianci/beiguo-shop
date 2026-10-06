---
title: 科普信息图提示词：工业风"工作原理"流程海报（污水处理厂示例）
slug: process-explainer-poster
model: gpt-image-2
topics: [infographic, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: 把一个工艺流程或工作原理做成"大标题 + 实景图 + 流程剖面图"的工业风科普海报，适合课件、企业展板、科普号配图。
prompt: |
  制作一张横版信息图海报，讲解[污水处理厂]的工作原理。风格工业、现代、高对比，配色为深红、黑、白，[水体]用青绿色。
  版式与文字：
  1. 左上 / 顶部大标题：大号、粗体、带做旧质感的红色中文"[污水处理厂]"，下方黑色粗体大字"工作原理"，再下面一行小字"[从进水、分离、生化反应到净化出水]"。
  2. 左侧栏：竖向排布的小文字块，上方写"[让每一滴污水重回自然]"，下方红底白字块写"[处理，为了更好的水环境]"。
  3. 右侧背景图：大幅摄影拼贴，[俯拍的圆形沉淀池]，池中是蓝绿色的水，[管道和走道相连]，上面叠加短句"[从污水到清水]"。
  4. 底部中央流程图：一张示意剖面图，箭头从左到右表示流向，各段上方标注"[格栅 / 沉砂]""[初沉]""[生化反应]"（用气泡表现）"[二沉]"；左端标"进水"，右端标"出水"。
  5. 中间一个红色小方块，白字写"[看不见的工程，支撑看得见的美好生活]"。
  视觉细节：整张图叠加颗粒质感，像印刷纸；中文用粗黑体；照片和图示中的[水]是醒目的青绿色，与灰、红、黑背景形成对比。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2099530880842879182
  author: 小小东
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并精简部分装饰性英文标语；主题、所有中文标题与流程节点改为变量
images:
  - 139-process-explainer-poster-1.jpg
  - 139-process-explainer-poster-2.jpg
imageCredit:
  by: 小小东
  url: https://youmind.com/gpt-image-2-prompts?id=34687
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 流程节点顺序是否正确、箭头方向是否一致
  - 中文标题是否有错字
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：先确定主题（如"光伏电站""自来水厂""咖啡豆烘焙"），再把流程拆成 3–5 个节点，按先后顺序填进第 4 条；标题、副标题和标语都换成与主题相关的话。[水体] 那个强调色可以换成主题的关键物质（光伏写"阳光金色"）。

**常见问题**：
- 流程画错：AI 不懂专业工艺，只会照你写的节点画，**节点顺序和名称请自己先查准**。
- 文字太多出错：删掉左侧栏或中间红框，只保留标题和流程图。
- 用于教学：图中的工艺细节只是示意，正式课件请让专业老师审核。

**示例图说明**：两张示例分别是总览海报和流程细节页，可以用同一套风格做成系列。

### 英文原版

```text
Create a horizontal infographic poster explaining the working principles of a wastewater treatment plant. The design style is industrial, modern, and high-contrast, utilizing a color palette of deep red, black, white, and teal/blue for water elements.

**Layout & Text Elements:**
1.  **Top Left/Center (Headline):** Large, bold, distressed red Chinese characters "污水处理厂" (Wastewater Treatment Plant) spanning across the top. Below it, large black bold text "工作原理" (Working Principles). Smaller black text underneath: "从进水、分离、生化反应到净化出水" (From influent, separation, biochemical reaction to purified effluent).
2.  **Left Sidebar:** Vertical layout with small text blocks. Top block: "让每一滴污水重回自然" (Let every drop of sewage return to nature), "水的下一站是更洁净的未来" (Water's next stop is a cleaner future), English text "CLEANER WATER BRIGHTER TOMORROW". Bottom block (red background): "处理改变为了更好的水环境" (Treatment changes for a better water environment), English text "CLEAN CYCLE HEALTHY CITIES".
3.  **Right Side (Background Image):** A large photographic collage showing an aerial view of circular clarifier tanks filled with blue-green water, connected by pipes and walkways. Overlay text on the right: "从污水到清水" (From sewage to clear water), "连接城市与更健康的生活" (Connecting cities with healthier lives), "FOR A CLEANER TOMORROW", "水循环 城市运行 与自然共生" (Water cycle, city operation, symbiosis with nature), "净化 让城市更有生命力" (Purification makes cities more vibrant), "CLEAN WATER STRONGER CITIES".
4.  **Bottom Center (Process Diagram):** A schematic cross-section diagram showing the flow of water through different stages. Arrows indicate direction from left to right. Labels above the sections: "格栅 / 沉砂" (Screening/Grit Chamber), "初沉" (Primary Sedimentation), "生化反应" (Biochemical Reaction - depicted with bubbles), "二沉" (Secondary Sedimentation). Labels at ends: "进水" (Influent) on left, "出水" (Effluent) on right.
5.  **Bottom Right:** Small text block: "更干净的水 更宜居的城市 更可持续的明天" (Cleaner water, more livable cities, more sustainable tomorrow), English text "CLEANER WATER HEALTHIER CITIES A BRIGHTER TOMORROW".
6.  **Center Red Box:** A small red square containing white text: "看不见的工程 支撑看得见的美好生活" (Invisible engineering supports visible good life), English text "INFRASTRUCTURE FOR A HEALTHIER TOMORROW".

**Visual Style Details:**
*   Use a grainy texture overlay on the entire image to give it a printed paper feel.
*   The typography should be heavy sans-serif for Chinese characters.
*   The water in the photos and diagrams should be a distinct teal/cyan color against the grayscale/red/black background.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2099530880842879182) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
