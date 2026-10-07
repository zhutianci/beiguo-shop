---
title: Playwright 自动化测试脚本生成提示词（端到端测试：稳定定位器、自动等待、登录态复用）
slug: playwright-e2e-test
model: any-llm
topics: [coding]
needsRefImage: false
useCase: 想给网页的关键流程（登录、下单、提交表单）写端到端测试，又怕写出来的脚本一改页面就挂、时好时坏时用：描述流程和页面结构，得到按 Playwright 推荐写法生成的测试代码、页面对象封装和运行命令。
prompt: |
  你是一名熟悉 Playwright Test 的测试开发工程师。请为下面的用户流程编写端到端测试。

  - 语言：[TypeScript/Python]
  - 被测网站地址（测试环境）：[测试环境地址]
  - 要测试的流程（按用户操作一步步写）：
    [流程步骤]
  - 页面关键元素的 HTML 片段或描述（按钮文字、输入框 label、是否有 data-testid）：
    [粘贴 HTML 或描述]
  - 登录方式：[如账号密码表单、短信验证码、无需登录]
  - 测试数据从哪里来：[如每次通过接口创建、使用固定测试账号]

  编写要求：
  1. 定位器优先级：按角色和可访问名称（getByRole）、label、placeholder、文本，再到 data-testid；尽量不用依赖层级结构的 CSS 或 XPath。说明每个关键定位器为什么这样选。
  2. 等待：依靠 Playwright 的自动等待和带重试的断言（如 toBeVisible、toHaveURL、toHaveText），不要写固定时长的等待。
  3. 登录态：如果多个测试都需要登录，用一个初始化步骤登录一次并保存登录状态，其他测试复用，不在每个测试里重复走登录页面。
  4. 测试独立：每个测试自己准备数据、不依赖其他测试的执行顺序；能通过接口准备的数据就不要走界面。
  5. 结构：流程较长时，用页面对象（Page Object）封装页面操作，测试文件只写业务步骤和断言。
  6. 失败排查：配置失败时保留截图和追踪记录（trace），并写出查看追踪记录的命令。
  7. 给出项目配置文件中与本测试相关的关键配置、运行单个测试文件的命令、以有界面模式调试的命令。

  需要验证码、第三方支付这类无法自动化的步骤，说明应该怎么在测试环境绕开（例如测试环境的固定验证码或模拟接口），不要尝试破解。
negativePrompt: null
source: null
verify:
  - 核对 storageState、trace、show-trace 等用法与 Playwright 官方文档当前版本一致（https://playwright.dev/docs/auth、https://playwright.dev/docs/trace-viewer）
---
**怎么填变量**：[页面关键元素] 最好直接从浏览器开发者工具里复制按钮、输入框的 HTML 片段，AI 才能选出可靠的定位器。没有的话，至少写清按钮上的文字和输入框旁边的标签文字。

**常见坑**：
- 用 `div > div:nth-child(3) > button` 这样的选择器，页面结构一调整就全部失效。按角色和可见文字定位，和用户的操作方式一致，也更稳定。
- 写 `waitForTimeout(3000)` 是端到端测试不稳定的头号原因：机器慢时不够，机器快时浪费时间。改用等待具体条件的断言。
- 测试之间共用一个账号的购物车或订单数据，并行运行时互相干扰。每个测试用接口创建自己的数据。

**追问技巧**：脚本跑失败时，把错误信息和追踪记录里看到的页面状态描述贴回去，问「是定位器问题、时序问题还是数据问题」。

### 示例输出

> 示例，仅供参考（TypeScript，节选）

```ts
// tests/auth.setup.ts：只登录一次并保存登录状态
import { test as setup, expect } from '@playwright/test'

setup('登录', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(process.env.E2E_USER!)
  await page.getByLabel('密码').fill(process.env.E2E_PASS!)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
})
```

```ts
// tests/checkout.spec.ts
test('加入购物车后结算', async ({ page }) => {
  await page.goto('/products/demo-1')
  await page.getByRole('button', { name: '加入购物车' }).click()
  await expect(page.getByTestId('cart-count')).toHaveText('1')
})
```

```bash
npx playwright test tests/checkout.spec.ts --ui   # 有界面模式调试
npx playwright show-trace test-results/xxx/trace.zip
```
