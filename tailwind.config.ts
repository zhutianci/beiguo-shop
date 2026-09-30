import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [
    /*
     * 手机端轻量模式（2026-10-01，站长要求电脑端不变）：`lite:` 变体只在触屏、无悬停的设备上生效，
     * 例如 lite:hidden、lite:bg-black/90。iOS WebKit 每帧都要重新模糊毛玻璃和大光斑、常驻动画让主线程
     * 占满一分钟、滑动出现黑块，所以手机上换成不透明底色、停掉常驻动画；电脑（鼠标 + 悬停）任何宽度都不匹配。
     * 这条媒体查询必须与 src/lib/use-lite.ts 的 LITE_QUERY、src/app/globals.css 的 @media 块逐字相同。
     * 类名要写成完整字面量（不要拼接 `lite:${x}`），否则 JIT 扫不到、不会生成。
     * 产物里 lite: 排在 hover: 之后、sm: / md: / lg: 之前（实测）：同一属性上 lite: 盖得住 hover:，盖不住 md: / lg:。
     */
    plugin(({ addVariant }) => {
      addVariant('lite', '@media (hover: none) and (pointer: coarse)')
    }),
  ],
}

export default config
