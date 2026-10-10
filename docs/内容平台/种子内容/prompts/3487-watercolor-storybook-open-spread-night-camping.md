---
title: "ai绘本生成提示词：摊开的水彩童话绘本跨页，星空露营夜 + 左页短诗（gpt-image-2）"
slug: watercolor-storybook-open-spread-night-camping
model: gpt-image-2
topics: [illustration, comic]
aspectRatio: "5:4"
needsRefImage: false
useCase: "给孩子做睡前故事绘本、给文章配一张\"书里的世界\"插图时用：生成一本摊开的精装绘本跨页，整幅水彩夜景横跨两页，左页留出晕染的米色空白写标题和短诗，右下角一句结尾。"
prompt: |
  请画出一本精装童话绘本摊开后的一个跨页：一整幅插画铺满左右两页，书脊处的折痕和两边露出的书页边缘都要画出来。画风是充满魔法感的儿童绘本插画：柔和的水彩纹理、梦幻的电影感光线、纤细的墨线勾边。
  这一页讲的是：[温馨的夜间露营场景]，在一片泛着微光的湖边，四周是[松林和雪山]，头顶是缀满星星的夜空和一弯新月。前景里[一个男孩、一个戴毛线帽的女孩和一只猫]背对观众，围坐在画面中央的篝火旁。
  可以藏进画里的小东西：温暖的篝火、发光的提灯、挂着星星串灯的小帐篷、飘浮的萤火虫、夜空里升起的天灯、帐篷边的望远镜和背包、湖对岸亮着灯的小木屋、地上的书本和地图、角落里的红蘑菇，还有藏在各处的小巧思。左下角立一根木质路牌，三块牌子上各写一个词。
  两页上的文字这样安排：
  - 左页上半部分的画面晕染成一片不规则的米黄色留白，顶部用优雅的衬线字写标题"[魔法露营之夜]"，标题两侧有小星星花饰；
  - 标题下面是两小段童谣式的短句，每段四行、每行不超过十个字，内容讲这一晚发生的事，语气像睡前故事；短句下面画一幅帐篷和小树的铅笔小插图；
  - 右页右下角也有一小块晕染的留白，写一句结尾："[那一夜，有朋友和篝火就够了。]"
  整体感受：动人、怀旧、安静，又处处有惊喜，仿佛睡前故事自己动了起来。用浓郁的暖色、柔和的月光和有笔触感的颜料质地，让整个世界显得迷人又有电影感。
  最后注意：文字只出现在两块留白和路牌上，全部用简体中文；不要水印和页码。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/miratechtool/status/2056659174956691522
  author: "@miratechtool"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文很短，只写了画风和露营场景，按示例图补充了\"摊开的精装书跨页、左页晕染留白写标题和短诗、右下角结尾句、木质路牌、望远镜\"等版式与细节；主题、环境、人物、标题、结尾句设为变量；原文\"把场景转成……\"改为直接生成。"
images:
  - 3487-watercolor-storybook-open-spread-night-camping-1.jpg
  - 3487-watercolor-storybook-open-spread-night-camping-2.jpg
imageCredit:
  by: "@miratechtool"
  url: https://youmind.com/gpt-image-2-prompts?id=21484
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[温馨的夜间露营场景] 和 [松林和雪山] 决定画什么，可以换成"漂浮在云端的图书馆 + 热气球和晚霞""海底的珊瑚小镇 + 发光水母"；人物描述写清人数、衣着和有没有小动物，默认是背影，更有代入感。标题控制在 8 个字以内，结尾句一行写完。短诗让模型自己写时偶尔会跑题，想固定内容就把八行字直接写进提示词。也可以上传一张照片，在开头加一句"按这张照片的场景来画"。

示例图第一张：摊开的绘本里是一片紫蓝色星空下的湖边营地，男孩、戴毛线帽的女孩和一只猫背对画面围着篝火，右侧是挂着星星灯的帐篷和望远镜，天上飘着天灯；左页米黄留白里是英文标题和两段短诗，左下角的木路牌写着三个英文单词，右下角有一小段结尾。第二张是同一套写法换了主题：围红围巾的男孩和黑猫坐在平台上看书，对面是悬在云海里的多层图书馆和热气球。两张都是原作者的英文版。

**常见问题**：
- 没画成"摊开的书"：把第一句的"书脊折痕、书页边缘"再强调一遍。
- 中文短诗出错字：减到每段两行，或让留白保持空白、后期自己排字。
- 画面太暗：加"篝火和提灯照亮前景，人物轮廓有暖色边光"。

**适合**：睡前故事配图、亲子自制绘本的跨页、公众号头图、儿童房装饰画；成套绘本需要逐页保持角色一致时，建议固定人物描述并逐页生成。

### 英文原版

```text
Transform the scene into a magical children’s storybook illustration with soft watercolor textures, dreamy cinematic lighting, and delicate ink outlines. Create a {argument name="subject" default="cozy nighttime camping scene"} beside a glowing lake surrounded by {argument name="environment" default="pine forests and snowy mountains"} under a star-filled sky.

Include a warm campfire, glowing lanterns, a cozy tent decorated with fairy lights, floating fireflies, magical floating lanterns in the sky, and tiny whimsical details hidden throughout the environment. The atmosphere should feel emotional, nostalgic, peaceful, and full of wonder — like a bedtime story brought to life. Use rich warm colors, soft moonlight, and painterly textures to make the entire world feel enchanting and cinematic.
```

> 改编自 [@miratechtool](https://x.com/miratechtool/status/2056659174956691522) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。
